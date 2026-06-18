import { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  TrendingUp, 
  Database, 
  PlusCircle, 
  HelpCircle,
  Menu,
  X,
  RefreshCw,
  Sparkles,
  Lock,
  LogOut,
  User,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSheetConnected: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  userSession: { username: string; role: 'admin' | 'user'; name: string } | null;
  onLogout: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isSheetConnected, 
  onRefresh,
  isLoading,
  userSession,
  onLogout
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: Receipt },
    { id: 'charts', label: 'Analisis & Grafik', icon: TrendingUp },
    { id: 'simulation', label: 'Input Data Baru', icon: PlusCircle },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const isUserRole = userSession?.role === 'user';

  const visibleMenuItems = menuItems.filter(item => {
    if (isUserRole && (item.id === 'settings' || item.id === 'sheets-guide')) {
      return false;
    }
    return true;
  });

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div id="mobile-nav" className="flex items-center justify-between px-4 py-3 bg-[#0a0c18] text-white lg:hidden border-b border-slate-800/50 print:hidden">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-500 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.4)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">Musholla Al-Falah</h1>
            <p className="text-[10px] text-emerald-400 font-mono">Buku Kas Operasional</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={onRefresh}
            disabled={isLoading}
            className={`p-2 rounded-lg bg-slate-800/40 text-slate-350 hover:text-white transition-all disabled:opacity-50 ${isLoading ? 'animate-spin' : ''}`}
            title="Refresh Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg bg-slate-800/40 text-slate-350 hover:text-white focus:outline-none transition-all"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Backdrop for Mobile Sidebar */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden print:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-[#0a0c18] border-r border-slate-800/50 text-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen print:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white">Musholla Al-Falah</h1>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5 font-mono">Buku Kas & Operasional</p>
            </div>
          </div>
          
          {/* Quick Connection Status Badge */}
          <div className="mt-5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`relative flex h-2 w-2`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 bg-emerald-500`}></span>
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {isSheetConnected ? 'Database: Firebase (GAS Synced)' : 'Database: Firebase Cloud'}
              </span>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50 ${isLoading ? 'animate-spin' : ''}`}
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isTabRestricted = isUserRole && (item.id === 'simulation' || item.id === 'settings');
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${
                  isActive 
                    ? 'bg-slate-800/40 text-emerald-400 font-bold border border-emerald-500/10 shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-855/20 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform ${
                  isActive ? 'text-emerald-400 scale-105' : 'text-slate-500 group-hover:scale-105 group-hover:text-slate-300'
                }`} />
                <span className="truncate">{item.label}</span>
                {isTabRestricted ? (
                  <Lock className="w-3.5 h-3.5 text-amber-500/80 ml-auto shrink-0 animate-pulse" />
                ) : item.id === 'settings' && !isSheetConnected ? (
                  <span className="ml-auto text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20 animate-pulse shrink-0">
                    Mulai
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer (Profile & Logout) */}
        {userSession && (
          <div className="p-4 border-t border-slate-800/50 bg-[#07080f]/60 space-y-3 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl border border-slate-800 flex items-center justify-center font-black text-xs text-white shadow-inner shrink-0 bg-gradient-to-tr from-slate-950 to-slate-805">
                DK
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-white truncate tracking-wide">DKM AL-FALAH</p>
                <div className="flex items-center mt-0.5">
                  <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                    userSession.role === 'admin' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/5' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                  }`}>
                    {userSession.role === 'admin' ? 'ADMINISTRATOR' : 'USER (TAMU)'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Quick Logout trigger button */}
            <button
              onClick={onLogout}
              className="flex items-center justify-center space-x-2 w-full py-2.5 bg-slate-950/40 hover:bg-rose-500/10 text-slate-400 hover:text-rose-450 border border-slate-850 hover:border-rose-500/30 rounded-xl text-xs font-black tracking-wide transition-all duration-200 active:scale-[0.98] cursor-pointer group shadow-sm hover:shadow-[0_0_12px_rgba(244,63,94,0.12)]"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-450 transition-colors shrink-0" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
