import { ShieldAlert, LogOut, Lock, Sparkles } from 'lucide-react';

interface RestrictedAccessProps {
  currentRole: 'admin' | 'user';
  onLogout: () => void;
}

export default function RestrictedAccess({ currentRole, onLogout }: RestrictedAccessProps) {
  return (
    <div className="bg-[#111425] p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl text-center max-w-2xl mx-auto space-y-6 my-8">
      
      {/* Visual lock element */}
      <div className="inline-flex relative">
        <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl animate-pulse" />
        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/25 relative text-amber-400">
          <Lock className="w-8 h-8" />
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 bg-rose-500 rounded-full border border-[#111425]">
          <ShieldAlert className="w-3.5 h-3.5 text-white" />
        </div>
      </div>

      {/* Main notice */}
      <div className="space-y-2">
        <h3 className="text-xl font-black text-white tracking-tight sm:text-2xl">Penjagaan Keamanan: Akses Terbatas!</h3>
        <p className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-widest">
          Tingkat Otoritas Anda: <span className="text-amber-400 font-bold">Standard User / Tamu</span>
        </p>
      </div>

      <div className="p-4 bg-[#0a0c18] rounded-xl border border-slate-800 text-xs text-slate-350 leading-relaxed font-semibold text-left space-y-2.5">
        <p>
          Sistem pembukuan Kas Al-Falah berjalan di bawah modul otorisasi fungsional. Akun dengan tingkatan <strong className="text-slate-200">User (Tamu)</strong> hanya diizinkan untuk melihat/membaca menu visualisasi dan transaksi kas secara komprehensif tanpa hak mengubah data.
        </p>
        <p className="font-medium text-amber-500">
          💡 Untuk menyimulasikan "Input Data Baru" (Simulasi Buku Pembukuan) atau mengubah kredensial "Google Sheets", Anda membutuhkan otorisasi tingkat lanjut (Administrator).
        </p>
      </div>

      {/* Action buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onLogout}
          className="flex items-center justify-center space-x-2 w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 px-5  py-2.5 rounded-xl text-xs font-black border border-slate-700 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Ganti ke Akun Sandi Admin</span>
        </button>
      </div>

    </div>
  );
}
