import { useState, FormEvent } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  RefreshCw, 
  Sparkles,
  Info,
  Calendar,
  AlertCircle,
  UploadCloud,
  FileText,
  X,
  Paperclip
} from 'lucide-react';
import { CashTransaction } from '../types';
import { formatRupiah } from '../utils';

interface SimulationFormProps {
  transactions: CashTransaction[];
  onAddTransaction: (newTx: Omit<CashTransaction, 'no' | 'saldo'>) => void;
  onResetTransactions: () => void;
}

export default function SimulationForm({ 
  transactions, 
  onAddTransaction, 
  onResetTransactions 
}: SimulationFormProps) {
  const [tanggal, setTanggal] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [tipe, setTipe] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [jumlah, setJumlah] = useState('');
  const [notif, setNotif] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  
  // File attachments state
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; data: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // File selection processor
  const handleFileSelection = (file: File) => {
    setFormError(null);
    if (!file) return;

    // Check size range (maximum 2.5MB payload for local storage budget)
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Ukuran berkas terlalu besar! Batas maksimal adalah 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedFile({
          name: file.name,
          type: file.type,
          data: event.target.result as string
        });
      }
    };
    reader.onerror = () => {
      setFormError('Terjadi kesalahan membaca berkas. Silakan coba file berkas lain.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!tanggal || !deskripsi || !jumlah) {
      setFormError('Mohon lengkapi semua kolom input formulir!');
      return;
    }

    const value = parseFloat(jumlah);
    if (isNaN(value) || value <= 0) {
      setFormError('Jumlah uang harus dalam angka positif yang valid!');
      return;
    }

    // Convert Standard YYYY-MM-DD input date to Indonesian DD/MM/YYYY style
    let formattedDate = tanggal;
    const parts = tanggal.split('-');
    if (parts.length === 3) {
      formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // Pass structured attachment if selected
    onAddTransaction({
      tanggal: formattedDate,
      deskripsi: deskripsi.trim(),
      pemasukan: tipe === 'pemasukan' ? value : null,
      pengeluaran: tipe === 'pengeluaran' ? value : null,
      attachment: selectedFile || undefined
    });

    // Clear form
    setDeskripsi('');
    setJumlah('');
    setSelectedFile(null);
    setNotif('Transaksi simulasi berhasil dibuat dan disimpan!');
    setTimeout(() => setNotif(null), 4000);
  };

  const handleResetClick = () => {
    setShowConfirmReset(true);
  };

  const handleConfirmReset = () => {
    onResetTransactions();
    setShowConfirmReset(false);
    setNotif('Buku kas berhasil dipulihkan ke 14 baris data bawaan Al-Falah!');
    setTimeout(() => setNotif(null), 4000);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      
      {/* Title */}
      <div className="pb-2 border-b border-slate-800/50">
        <h1 className="text-3xl font-black text-white tracking-tight">Input Transaksi Baru</h1>
      </div>

      {notif && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 px-4 py-3 rounded-xl text-xs font-bold text-emerald-400 flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{notif}</span>
        </div>
      )}

      {formError && (
        <div className="bg-rose-950/20 border border-rose-500/30 px-4 py-3 rounded-xl text-xs font-bold text-rose-455 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{formError}</span>
        </div>
      )}

      {/* Form panel centered with full width inside max-w-2xl */}
      <div className="bg-[#111425] p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex items-center space-x-2 pb-3 mb-6 border-b border-slate-800/50">
          <PlusCircle className="w-5 h-5 text-emerald-400" />
          <h3 className="font-extrabold text-sm text-white">Form Transaksi Kas</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Tanggal */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Tanggal Transaksi</span>
            </label>
            <input
              type="date"
              required
              max={todayStr}
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 bg-[#0a0c18] text-white"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
              Deskripsi Transaksi
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pembelian sajadah, Infaq subuh..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 bg-[#0a0c18] text-white placeholder-slate-600"
            />
          </div>

          {/* Tipe */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
              Jenis Alur Kas
            </label>
            <div className="grid grid-cols-2 gap-35">
              <button
                type="button"
                onClick={() => setTipe('pemasukan')}
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                  tipe === 'pemasukan' 
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-sm' 
                    : 'border-slate-800 bg-[#0a0c18] hover:bg-slate-850 text-slate-400'
                }`}
              >
                Pemasukan (+)
              </button>
              <button
                type="button"
                onClick={() => setTipe('pengeluaran')}
                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                  tipe === 'pengeluaran' 
                    ? 'bg-rose-500/15 border-rose-500 text-rose-455 shadow-sm' 
                    : 'border-slate-800 bg-[#0a0c18] hover:bg-slate-850 text-slate-400'
                }`}
              >
                Pengeluaran (-)
              </button>
            </div>
          </div>

          {/* Jumlah nominal */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
              Jumlah Uang (Rupiah)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
              <input
                type="number"
                required
                min="1"
                placeholder="250000"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                className="w-full text-xs font-bold pl-11 pr-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 bg-[#0a0c18] text-white font-mono placeholder-slate-600"
              />
            </div>
          </div>

          {/* Bukti Transaksi File Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Paperclip className="w-3.5 h-3.5 text-emerald-450" />
                <span>Unggah Bukti Transaksi (Nota / Kuitansi)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium normal-case font-mono">Max 2MB (Gambar / PDF)</span>
            </label>
            
            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const files = e.dataTransfer.files;
                  if (files && files.length > 0) {
                    handleFileSelection(files[0]);
                  }
                }}
                onClick={() => document.getElementById('transaction-file-input')?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all duration-200 cursor-pointer select-none group ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : 'border-slate-800/80 hover:border-slate-705 bg-[#0a0c18] hover:bg-[#0c0e1e]'
                }`}
              >
                <input
                  id="transaction-file-input"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      handleFileSelection(files[0]);
                    }
                  }}
                />
                <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 transition-colors mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-350">
                  Tarik berkas bukti ke sini, atau <span className="text-emerald-400 group-hover:underline">telusuri berkas</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold">Mendukung JPEG, PNG, JPG, dan PDF</p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-[#0a0c18] border border-slate-800 rounded-xl">
                <div className="flex items-center space-x-3 truncate">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-450 rounded-xl border border-emerald-500/20 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-black text-white truncate my-0">{selectedFile.name}</p>
                    <p className="text-[9px] text-slate-500 font-semibold font-mono tracking-wider uppercase mt-0.5">
                      {selectedFile.type || 'Aplikasi/Dokumen'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="mt-6 w-full py-3.5 px-4 bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 font-extrabold text-xs text-white rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer select-none"
          >
            Simpan Transaksi Baru
          </button>
        </form>
      </div>

    </div>
  );
}
