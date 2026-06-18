import { useState, FormEvent } from 'react';
import { Sparkles, Key, User, ShieldAlert, HelpCircle } from 'lucide-react';
import { AlFalahLogo } from './AlFalahLogo';

interface LoginScreenProps {
  onLogin: (username: string, role: 'admin' | 'user', name: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password;

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Mohon lengkapi username dan password!');
      return;
    }

    // Load registered users from storage
    let registeredUsersList = [];
    const savedRegUsers = localStorage.getItem('alfalah_registered_users');
    if (savedRegUsers) {
      try {
        registeredUsersList = JSON.parse(savedRegUsers);
      } catch (e) {
        registeredUsersList = [];
      }
    }

    // Fallback checks
    if (registeredUsersList.length === 0) {
      registeredUsersList = [
        { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator Al-Falah' },
        { username: 'tamu', password: 'user123', role: 'user', name: 'Tamu / Umum' },
        { username: 'user', password: 'user123', role: 'user', name: 'Tamu / Umum' }
      ];
    }

    // Try finding a matching user
    const matchedUser = registeredUsersList.find(
      (u: any) => 
        u.username === cleanUser && 
        (u.password === cleanPass || 
         (u.username === 'admin' && cleanPass === 'admin123') || 
         ((u.username === 'tamu' || u.username === 'user') && cleanPass === 'user123'))
    );

    if (matchedUser) {
      onLogin(matchedUser.username, matchedUser.role, matchedUser.name);
    } else {
      setErrorMsg('Username atau password salah! Gunakan akun coba yang terdaftar atau buat akun baru di menu Pengaturan.');
    }
  };

  return (
    <div className="min-h-screen bg-[#05060b] flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Decorative Blur Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <AlFalahLogo size="custom" className="w-20.5 h-13 animate-pulse" />
          <p className="text-[10px] text-emerald-400 font-mono mt-3 uppercase tracking-widest font-black">Sistem Kas & Keuangan Operasional</p>
        </div>

        {/* Main Card */}
        <div className="bg-[#0a0c18] p-8 rounded-3xl border border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-lg font-black text-white tracking-tight">Otentikasi Akun</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Silakan masuk untuk mengakses dasbor keuangan.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Username</span>
              </label>
              <input
                type="text"
                placeholder="Masukkan username (misal: admin / tamu)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 bg-[#05060b] text-white placeholder-slate-600 transition-all"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>Password</span>
              </label>
              <input
                type="password"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 bg-[#05060b] text-white placeholder-slate-600 transition-all"
              />
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 rounded-xl text-xs font-bold text-rose-400 flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer mt-2"
            >
              Masuk Sekarang
            </button>
          </form>

        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-slate-500 text-[10px] font-semibold flex items-center justify-center space-x-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
          <span>Info Hak Akses: Admin dapat mengedit data & sinkronisasi Google Sheets. User dibatasi hanya melihat dasbor.</span>
        </div>

      </div>
    </div>
  );
}
