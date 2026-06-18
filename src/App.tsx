import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import TransactionsTable from './components/TransactionsTable';
import ChartsView from './components/ChartsView';
import SimulationForm from './components/SimulationForm';
import SettingsView from './components/SettingsView';
import LoginScreen from './components/LoginScreen';
import RestrictedAccess from './components/RestrictedAccess';
import { CashTransaction } from './types';
import { INITIAL_TRANSACTIONS } from './data';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { getTransactionsFromDb, syncTransactionsToDb } from './lib/firebase';

interface UserSession {
  username: string;
  role: 'admin' | 'user';
  name: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [gasUrl, setGasUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [autoOpenPrint, setAutoOpenPrint] = useState<boolean>(false);

  // Initialize and synchronise Firebase Firestore database
  const loadTransactionsFromDb = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getTransactionsFromDb();
      if (data.length > 0) {
        setTransactions(data);
        localStorage.setItem('alfalah_transactions', JSON.stringify(data));
      } else {
        // Automatically seed the empty Firebase database with previous cache or fallbacks
        const savedTransactions = localStorage.getItem('alfalah_transactions');
        let initialList = INITIAL_TRANSACTIONS;
        if (savedTransactions) {
          try {
            initialList = JSON.parse(savedTransactions);
          } catch (e) {
            initialList = INITIAL_TRANSACTIONS;
          }
        }
        await syncTransactionsToDb(initialList);
        setTransactions(initialList);
      }
    } catch (err: any) {
      console.error('Error loading data from Firebase:', err);
      setErrorMsg('Gagal memuat data utama dari database Firebase. Berpindah ke backup file lokal.');
      
      const savedTransactions = localStorage.getItem('alfalah_transactions');
      if (savedTransactions) {
        try {
          setTransactions(JSON.parse(savedTransactions));
        } catch (e) {
          setTransactions(INITIAL_TRANSACTIONS);
        }
      } else {
        setTransactions(INITIAL_TRANSACTIONS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data and session on mount
  useEffect(() => {
    // Load Session
    const savedSession = localStorage.getItem('alfalah_user_session');
    if (savedSession) {
      try {
        setUserSession(JSON.parse(savedSession));
      } catch (e) {
        setUserSession(null);
      }
    }

    // Load Gas URL if configured
    const savedUrl = localStorage.getItem('alfalah_gas_url') || '';
    setGasUrl(savedUrl);

    // Fetch primary database records
    loadTransactionsFromDb();
  }, []);

  // Fetch data if Google Apps Script URL exists and import it securely to Firebase
  const fetchDataFromSheet = async (urlToFetch: string) => {
    if (!urlToFetch) return false;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch(urlToFetch, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status}`);
      }
      const result = await response.json();
      if (result && result.status === 'success' && Array.isArray(result.data)) {
        // Write the imported spreadsheet rows into the Firebase central database
        await syncTransactionsToDb(result.data);
        setTransactions(result.data);
        localStorage.setItem('alfalah_transactions', JSON.stringify(result.data));
        return true;
      } else {
        throw new Error(result?.message || 'Format respon API Sheets tidak valid atau kosong.');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMsg(`Gagal memuat dari Google Sheets: ${err.message || 'Periksa koneksi jaringan.'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Set up User Login
  const handleLogin = (username: string, role: 'admin' | 'user', name: string) => {
    const session: UserSession = { username, role, name };
    setUserSession(session);
    localStorage.setItem('alfalah_user_session', JSON.stringify(session));
  };

  // Set up User Logout
  const handleLogout = () => {
    setUserSession(null);
    localStorage.removeItem('alfalah_user_session');
    setActiveTab('dashboard'); // fallback to general dashboard
  };

  // Save GAS URL and trigger initial Sheets import if saving
  const handleSetGasUrl = (url: string) => {
    setGasUrl(url);
    localStorage.setItem('alfalah_gas_url', url);
    fetchDataFromSheet(url);
  };

  // Test URL connection without saving initially
  const handleTestUrl = async (url: string): Promise<boolean> => {
    return await fetchDataFromSheet(url);
  };

  // Clear connection and reset database back to defaults
  const handleClearUrl = async () => {
    setIsLoading(true);
    try {
      setGasUrl('');
      localStorage.removeItem('alfalah_gas_url');
      localStorage.removeItem('alfalah_transactions');
      await syncTransactionsToDb(INITIAL_TRANSACTIONS);
      setTransactions(INITIAL_TRANSACTIONS);
      setErrorMsg(null);
    } catch (err) {
      console.error("Failed to reset database on clear:", err);
      setErrorMsg("Gagal mereset database ke data bawaan.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add Transaction dynamically using Firebase database
  const handleAddTransaction = async (newTx: Omit<CashTransaction, 'no' | 'saldo'>) => {
    setIsLoading(true);
    try {
      const updatedRaw = [...transactions, {
        ...newTx,
        no: transactions.length + 1,
        saldo: 0
      }];

      const parseDate = (dStr: string) => {
        const p = dStr.split('/');
        return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime();
      };

      const sorted = updatedRaw.sort((a, b) => parseDate(a.tanggal) - parseDate(b.tanggal));

      let currentSaldo = 0;
      const finalTransactions = sorted.map((tx, idx) => {
        currentSaldo += (tx.pemasukan || 0) - (tx.pengeluaran || 0);
        return {
          ...tx,
          no: idx + 1,
          saldo: currentSaldo
        };
      });

      // Commit changes to Firebase Firestore collection
      await syncTransactionsToDb(finalTransactions);
      setTransactions(finalTransactions);
      localStorage.setItem('alfalah_transactions', JSON.stringify(finalTransactions));
    } catch (err: any) {
      console.error('Failed to commit transaction to Firebase:', err);
      setErrorMsg('Gagal menyimpan transaksi baru ke database Firebase.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset database back to default transactions
  const handleResetTransactions = async () => {
    setIsLoading(true);
    try {
      await syncTransactionsToDb(INITIAL_TRANSACTIONS);
      setTransactions(INITIAL_TRANSACTIONS);
      localStorage.removeItem('alfalah_transactions');
      setErrorMsg(null);
    } catch (err: any) {
      console.error('Failed to reset Firebase:', err);
      setErrorMsg('Gagal mereset database ke data bawaan.');
    } finally {
      setIsLoading(false);
    }
  };

  // Edit Transaction dynamically in the database
  const handleEditTransaction = async (targetNo: number, updatedFields: Partial<Omit<CashTransaction, 'no' | 'saldo'>>) => {
    setIsLoading(true);
    try {
      const updatedList = transactions.map(tx => {
        if (tx.no === targetNo) {
          return {
            ...tx,
            ...updatedFields,
          };
        }
        return tx;
      });

      const parseDate = (dStr: string) => {
        const p = dStr.split('/');
        return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime();
      };

      const sorted = [...updatedList].sort((a, b) => parseDate(a.tanggal) - parseDate(b.tanggal));

      let currentSaldo = 0;
      const finalTransactions = sorted.map((tx, idx) => {
        currentSaldo += (tx.pemasukan || 0) - (tx.pengeluaran || 0);
        return {
          ...tx,
          no: idx + 1,
          saldo: currentSaldo
        };
      });

      await syncTransactionsToDb(finalTransactions);
      setTransactions(finalTransactions);
      localStorage.setItem('alfalah_transactions', JSON.stringify(finalTransactions));
    } catch (err: any) {
      console.error('Failed to save edited transaction:', err);
      setErrorMsg('Gagal menyimpan hasil edit transaksi ke database Firebase.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Transaction dynamically in the database
  const handleDeleteTransaction = async (targetNo: number) => {
    setIsLoading(true);
    try {
      const remainingList = transactions.filter(tx => tx.no !== targetNo);

      const parseDate = (dStr: string) => {
        const p = dStr.split('/');
        return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime();
      };

      const sorted = [...remainingList].sort((a, b) => parseDate(a.tanggal) - parseDate(b.tanggal));

      let currentSaldo = 0;
      const finalTransactions = sorted.map((tx, idx) => {
        currentSaldo += (tx.pemasukan || 0) - (tx.pengeluaran || 0);
        return {
          ...tx,
          no: idx + 1,
          saldo: currentSaldo
        };
      });

      await syncTransactionsToDb(finalTransactions);
      setTransactions(finalTransactions);
      localStorage.setItem('alfalah_transactions', JSON.stringify(finalTransactions));
    } catch (err: any) {
      console.error('Failed to delete transaction:', err);
      setErrorMsg('Gagal menghapus transaksi dari database Firebase.');
    } finally {
      setIsLoading(false);
    }
  };

  // Page switcher
  const renderTabContent = () => {
    const isUserRole = userSession?.role === 'user';
    const isRestricted = isUserRole && (activeTab === 'simulation' || activeTab === 'settings');

    if (isRestricted) {
      return <RestrictedAccess currentRole="user" onLogout={handleLogout} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview 
            transactions={transactions} 
            onNavigateTab={setActiveTab}
            gasUrl={gasUrl}
            onTriggerExportPDF={() => {
              setAutoOpenPrint(true);
              setActiveTab('transactions');
            }}
          />
        );
      case 'transactions':
        return (
          <TransactionsTable 
            transactions={transactions} 
            autoOpenPrint={autoOpenPrint}
            onClearAutoOpenPrint={() => setAutoOpenPrint(false)}
            isAdministrator={userSession?.role === 'admin'}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'charts':
        return <ChartsView transactions={transactions} />;
      case 'simulation':
        return (
          <SimulationForm 
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onResetTransactions={handleResetTransactions}
          />
        );
      case 'settings':
        return (
          <SettingsView 
            gasUrl={gasUrl} 
            setGasUrl={handleSetGasUrl} 
            onClearUrl={handleClearUrl}
            onTestUrl={handleTestUrl}
            isTesting={isLoading}
            currentUser={userSession}
          />
        );
      default:
        return (
          <DashboardOverview 
            transactions={transactions} 
            onNavigateTab={setActiveTab}
            gasUrl={gasUrl}
          />
        );
    }
  };

  // Render Login Screen if not logged in
  if (!userSession) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div id="app-root" className="flex flex-col lg:flex-row min-h-screen bg-[#05060b] font-sans text-slate-200">
      
      {/* Dynamic Sidebar menu */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSheetConnected={!!gasUrl}
        onRefresh={() => gasUrl ? fetchDataFromSheet(gasUrl) : handleResetTransactions()}
        isLoading={isLoading}
        userSession={userSession}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden flex flex-col">
        
        {/* Connection/Error banner */}
        {errorMsg && (
          <div className="bg-rose-950/40 border-b border-rose-900/60 px-6 py-3 flex items-center justify-between text-xs font-semibold text-rose-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>{errorMsg}</span>
            </div>
            <button 
              onClick={() => setErrorMsg(null)}
              className="text-rose-400 hover:text-rose-200 transition-colors uppercase font-black text-[10px]"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Dynamic tabs render wrapper */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
              <div className="p-4 bg-[#0a0c18] rounded-2xl border border-slate-800 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white tracking-tight">Syncing Google Sheets...</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5 font-mono">Memperbarui buku kas real-time Al-Falah.</p>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {renderTabContent()}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
