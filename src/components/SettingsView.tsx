import { useState, useEffect, FormEvent } from 'react';
import { 
  Database, 
  UserPlus, 
  Users, 
  Settings, 
  Check, 
  RefreshCw, 
  Link2, 
  Radio, 
  Shield, 
  Key, 
  User, 
  Info, 
  AlertCircle,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { getUsersFromDb, saveUserToDb, deleteUserFromDb, RegisteredUser } from '../lib/firebase';

interface SettingsViewProps {
  gasUrl: string;
  setGasUrl: (url: string) => void;
  onClearUrl: () => void;
  onTestUrl: (url: string) => Promise<boolean>;
  isTesting: boolean;
  currentUser: { username: string; role: 'admin' | 'user'; name: string } | null;
}

export default function SettingsView({
  gasUrl,
  setGasUrl,
  onClearUrl,
  onTestUrl,
  isTesting,
  currentUser
}: SettingsViewProps) {
  // Tabs for settings
  const [activeSubTab, setActiveSubTab] = useState<'sheets' | 'users'>('sheets');

  // Sheets settings states
  const [inputUrl, setInputUrl] = useState(gasUrl);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // User registration states
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'admin' | 'user'>('user');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  // States for editing accounts & viewing passwords
  const [editingUser, setEditingUser] = useState<RegisteredUser | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Loaded registered users
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);

  const startEditUser = (user: RegisteredUser) => {
    setEditingUser(user);
    setRegUsername(user.username);
    setRegName(user.name);
    setRegPassword(user.password || '');
    setRegRole(user.role);
    setRegSuccess(null);
    setRegError(null);
  };

  const cancelEditUser = () => {
    setEditingUser(null);
    setRegUsername('');
    setRegName('');
    setRegPassword('');
    setRegRole('user');
    setRegSuccess(null);
    setRegError(null);
  };

  const togglePasswordVisibility = (username: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  // Sync state input when gasUrl changes externally
  useEffect(() => {
    setInputUrl(gasUrl);
  }, [gasUrl]);

  // Load existing users on mount from Firestore
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const list = await getUsersFromDb();
        setRegisteredUsers(list);
      } catch (err) {
        console.error("Gagal mengambil data user dari database:", err);
      }
    };
    loadUsers();
  }, []);

  const handleConnectSheets = async (e: FormEvent) => {
    e.preventDefault();
    setTestResult(null);
    const cleanedUrl = inputUrl.trim();
    if (!cleanedUrl) {
      setTestResult({
        success: false,
        message: 'Mohon masukkan URL Google Web App terlebih dahulu!'
      });
      return;
    }
    
    if (!cleanedUrl.startsWith('https://script.google.com/')) {
      setTestResult({
        success: false,
        message: 'Invalid URL. Alamat harus dimulai dengan "https://script.google.com/"'
      });
      return;
    }

    const testOk = await onTestUrl(cleanedUrl);
    if (testOk) {
      setGasUrl(cleanedUrl);
      setTestResult({
        success: true,
        message: 'Koneksi Sukses! Data dari Google Sheets berhasil tersinkronisasi sempurna.'
      });
    } else {
      setTestResult({
        success: false,
        message: 'Koneksi Gagal. Pastikan deployment Web App dideploy sebagai "Anyone" dan sheet terisi data.'
      });
    }
  };

  const handleRegisterUser = async (e: FormEvent) => {
    e.preventDefault();
    setRegSuccess(null);
    setRegError(null);

    const cleanUsername = regUsername.trim().toLowerCase();
    const cleanName = regName.trim();
    const cleanPassword = regPassword;

    if (!cleanUsername || !cleanName || !cleanPassword) {
      setRegError('Mohon isi semua field!');
      return;
    }

    if (cleanUsername.length < 3) {
      setRegError('Username minimal harus berisi 3 karakter!');
      return;
    }

    if (cleanPassword.length < 5) {
      setRegError('Password minimal harus berisi 5 karakter!');
      return;
    }

    // Check if user already exists (only if we are not editing)
    if (!editingUser) {
      const userExists = registeredUsers.some(u => u.username === cleanUsername);
      if (userExists) {
        setRegError(`Username "${cleanUsername}" sudah digunakan oleh akun lain.`);
        return;
      }
    }

    // Create or update user structure (including password in stored item)
    const targetUser: RegisteredUser = {
      username: cleanUsername,
      role: regRole,
      name: cleanName,
      password: cleanPassword
    };

    try {
      await saveUserToDb(targetUser);
      
      let updatedList: RegisteredUser[];
      if (editingUser) {
        updatedList = registeredUsers.map(u => u.username === cleanUsername ? targetUser : u);
        setRegSuccess(`Sukses memperbarui akun "${cleanUsername}"!`);
      } else {
        updatedList = [...registeredUsers, targetUser];
        setRegSuccess(`Sukses mendaftarkan akun "${cleanUsername}" sebagai ${regRole.toUpperCase()}!`);
      }
      setRegisteredUsers(updatedList);
      
      // Clear inputs and reset edit state
      setRegName('');
      setRegUsername('');
      setRegPassword('');
      setRegRole('user');
      setEditingUser(null);
    } catch (err: any) {
      console.error(err);
      setRegError(`Gagal menyimpan data akun ke database. Harap periksa koneksi Firestore Anda.`);
    }
  };

  const handleDeleteUser = async (usernameToDelete: string) => {
    if (usernameToDelete === 'admin' || usernameToDelete === 'tamu') {
      alert('Akun bawaan sistem tidak diperbolehkan untuk dihapus!');
      return;
    }

    if (usernameToDelete === currentUser?.username) {
      alert('Anda tidak bisa menghapus akun yang sedang Anda gunakan saat ini!');
      return;
    }

    try {
      await deleteUserFromDb(usernameToDelete);
      const filtered = registeredUsers.filter(u => u.username !== usernameToDelete);
      setRegisteredUsers(filtered);
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghapus akun dari database. Harap coba lagi.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl flex items-center gap-2.5">
          <Settings className="w-8 h-8 text-emerald-400 rotate-12" />
          <span>Pengaturan Sistem</span>
        </h1>
        <p className="text-sm text-slate-400 font-medium">
          
        </p>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex border-b border-slate-800/80 gap-1.5 p-1 bg-[#111425]/40 rounded-xl max-w-sm">
        <button
          onClick={() => setActiveSubTab('sheets')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            activeSubTab === 'sheets'
              ? 'bg-[#111425] text-emerald-450 border border-slate-800 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Google Sheets</span>
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            activeSubTab === 'users'
              ? 'bg-[#111425] text-emerald-450 border border-slate-800 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Registrasi User</span>
        </button>
      </div>

      {/* Content tabs rendering */}
      {activeSubTab === 'sheets' ? (
        <div className="max-w-2xl mx-auto w-full">
          {/* Connection control Form */}
          <div className="bg-[#111425] p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center space-x-2.5 pb-3.5 border-b border-slate-800/50">
              <Link2 className="w-5 h-5 text-emerald-450" />
              <h3 className="font-extrabold text-sm text-white">Hubungkan Google Web App</h3>
            </div>

            <form onSubmit={handleConnectSheets} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wide mb-1.5">
                  URL Web App Google Apps Script
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 bg-[#0a0c18] text-emerald-400 placeholder-slate-650"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isTesting}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 font-extrabold text-xs text-white rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{gasUrl ? 'Perbarui & Tes' : 'Simpan & Sambungkan'}</span>
                </button>

                {gasUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearUrl();
                      setInputUrl('');
                      setTestResult(null);
                    }}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-350 font-black text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
                  >
                    Putuskan
                  </button>
                )}
              </div>
            </form>

            {/* Test result */}
            {testResult && (
              <div className={`p-4 rounded-xl text-xs flex flex-col space-y-1.5 border leading-normal ${
                testResult.success 
                  ? 'bg-emerald-955/20 border-emerald-500/30 text-emerald-400 font-semibold' 
                  : 'bg-rose-955/20 border-rose-500/30 text-rose-400 font-bold'
              }`}>
                <div className="flex items-center space-x-1.5 font-bold">
                  <Radio className={`w-4 h-4 ${testResult.success ? 'text-emerald-400 animate-pulse' : 'text-rose-450'}`} />
                  <span className="uppercase tracking-wide font-black">{testResult.success ? 'KONEKSI AKTIF' : 'KONEKSI REJECTED'}</span>
                </div>
                <p className="text-slate-300">{testResult.message}</p>
              </div>
            )}

            {/* Status info */}
            <div className="p-3.5 text-[11px] font-semibold rounded-xl bg-[#0a0c18] text-slate-400 leading-normal border border-slate-800/80">
              {gasUrl ? (
                <div className="text-emerald-400 font-bold flex items-start space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mt-1 shrink-0" />
                  <span>Sinkronisasi Google Sheets aktif. Seluruh data kas diambil real-time dari spreadsheet Anda.</span>
                </div>
              ) : (
                <p>Status: Mode Coretan (Demo). Menggunakan simulasi database kas lokal Al-Falah.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* User Registration view */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* User Create Form */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-[#111425] p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800/50 justify-between">
                <div className="flex items-center space-x-2">
                  {editingUser ? (
                    <Edit className="w-5 h-5 text-amber-500 animate-pulse" />
                  ) : (
                    <UserPlus className="w-5 h-5 text-emerald-450 animate-pulse" />
                  )}
                  <h3 className="font-extrabold text-sm text-white">
                    {editingUser ? 'Edit Akun Terdaftar' : 'Buat Akun Baru'}
                  </h3>
                </div>
                {editingUser && (
                  <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                    Mode Edit
                  </span>
                )}
              </div>

              <form onSubmit={handleRegisterUser} className="space-y-4">
                
                {/* Full name description */}
                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase mb-1.5 flex items-center space-x-1">
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    <span>Nama Lengkap</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Pengguna"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase mb-1.5 flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Username</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    placeholder="Contoh: syaf, budi, admin_masjid"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className={`w-full text-xs font-mono font-bold px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-white focus:outline-none focus:border-emerald-500 ${
                      editingUser ? 'opacity-50 cursor-not-allowed border-amber-500/20 text-amber-200' : ''
                    }`}
                  />
                  {editingUser && (
                    <p className="text-[10px] text-amber-500/80 font-bold mt-1">Username tidak dapat diubah.</p>
                  )}
                </div>

                {/* Password input */}
                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase mb-1.5 flex items-center space-x-1">
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    <span>Password</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Minimal 5 karakter"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* User Role */}
                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase mb-1.5 flex items-center space-x-1">
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    <span>Hak Akses (Role)</span>
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as 'admin' | 'user')}
                    className="w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="user">USER (Tamu - Read Only)</option>
                    <option value="admin">ADMIN (Akses Penuh Edit & Sync)</option>
                  </select>
                </div>

                {/* Error handling */}
                {regError && (
                  <div className="p-3 bg-rose-955/20 border border-rose-500/25 rounded-xl text-rose-400 text-xs font-bold flex items-center space-x-1.5 animate-pulse">
                    <AlertCircle className="w-4 h-4 text-rose-450 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* Success handling */}
                {regSuccess && (
                  <div className="p-3 bg-emerald-955/20 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs font-bold flex items-center space-x-1.5">
                    <Check className="w-4 h-4 text-emerald-450 shrink-0 animate-bounce" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                {/* Button register trigger */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
                  >
                    {editingUser ? 'Perbarui Akun' : 'Registrasikan Akun'}
                  </button>
                  {editingUser && (
                    <button
                      type="button"
                      onClick={cancelEditUser}
                      className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center"
                      title="Batal Edit"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </form>

            </div>

          </div>

          {/* User List Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-[#111425] p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-800/50">
                <Users className="w-5 h-5 text-emerald-450" />
                <h3 className="font-extrabold text-sm text-white">Daftar Pengguna Kas Terdaftar</h3>
              </div>
              
              <div className="p-3 bg-[#0a0c18] rounded-xl border border-slate-800/50 text-[11px] text-slate-400 font-bold flex items-start space-x-2 leading-relaxed">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Seluruh akun yang ditambahkan di atas akan langsung dapat dipergunakan untuk login dari layar autentikasi depan. Akun uji coba bawaan (`admin` & `tamu`) dilindungi dari penghapusan demi keamanan.</span>
              </div>

              {/* Grid or List of Users code */}
              <div className="divide-y divide-slate-800/50">
                {registeredUsers.map((user) => {
                  const isCurrent = user.username === currentUser?.username;
                  const isBuiltIn = user.username === 'admin' || user.username === 'tamu';
                  const isAdmin = currentUser?.role === 'admin';
                  const showPass = !!visiblePasswords[user.username];

                  return (
                    <div 
                      key={user.username} 
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group transition-colors hover:bg-[#111425]/40 px-2 rounded-xl"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-9 h-9 rounded-xl border border-slate-800 flex items-center justify-center font-black text-xs text-white bg-slate-950 shadow-inner shrink-0">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-white">{user.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                                Sesi Anda
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-slate-400">
                            <span className="font-mono font-bold">username: <span className="text-emerald-450">{user.username}</span></span>
                            <span className="text-slate-700 font-mono">•</span>
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded ${
                              user.role === 'admin' 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {user.role === 'admin' ? 'ADMINISTRATOR' : 'USER'}
                            </span>
                          </div>

                          {/* Password visibility toggler for admin account */}
                          {isAdmin && (
                            <div className="flex items-center space-x-1.5 mt-2 text-[10px] text-slate-400 bg-slate-950/40 px-2.5 py-1 rounded-lg border border-slate-800/40 max-w-max">
                              <Key className="w-3 h-3 text-amber-500" />
                              <span className="font-semibold text-slate-500">Password:</span>
                              <span className="font-mono font-bold text-amber-200">
                                {showPass ? user.password || '******' : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(user.username)}
                                className="p-0.5 text-slate-500 hover:text-white transition-colors cursor-pointer ml-1"
                                title={showPass ? "Sembunyikan Password" : "Lihat Password"}
                              >
                                {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions panel */}
                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        {/* Edit action for admin users */}
                        {isAdmin && (
                          <button
                            onClick={() => startEditUser(user)}
                            className={`p-2 rounded-lg bg-slate-900/60 hover:bg-amber-500/10 text-slate-500 hover:text-amber-500 border border-slate-850 hover:border-amber-500/20 transition-all cursor-pointer shadow-inner ${
                              editingUser?.username === user.username ? 'border-amber-500/60 text-amber-500 bg-amber-500/5' : ''
                            }`}
                            title="Edit Pengguna"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete action */}
                        {!isBuiltIn && !isCurrent ? (
                          <button
                            onClick={() => handleDeleteUser(user.username)}
                            className="p-2 rounded-lg bg-slate-900/60 hover:bg-rose-500/10 text-slate-500 hover:text-rose-450 border border-slate-850 hover:border-rose-500/25 transition-all cursor-pointer shadow-inner"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : isBuiltIn ? (
                          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 bg-slate-950/80 border border-slate-800/80 px-2 py-1 rounded font-mono">
                            Bawaan Sistem
                          </span>
                        ) : null}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
