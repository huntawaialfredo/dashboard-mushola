import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Calendar,
  AlertCircle,
  Clock,
  ExternalLink,
  Coins,
  TrendingDown,
  Sparkle,
  FileDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { CashTransaction } from '../types';
import { 
  formatRupiah, 
  groupTransactionsByMonth, 
  formatCompactRupiah,
  formatDateOnly,
  parseAndFormatDate
} from '../utils';

interface DashboardOverviewProps {
  transactions: CashTransaction[];
  onNavigateTab: (tab: string) => void;
  gasUrl: string;
  onTriggerExportPDF?: () => void;
}

export default function DashboardOverview({ transactions, onNavigateTab, gasUrl, onTriggerExportPDF }: DashboardOverviewProps) {
  // Calculations
  const totalPemasukan = transactions.reduce((acc, curr) => acc + (curr.pemasukan || 0), 0);
  const totalPengeluaran = transactions.reduce((acc, curr) => acc + (curr.pengeluaran || 0), 0);
  const saldoAkhir = totalPemasukan - totalPengeluaran;

  // Percentage allocation
  const ratioPemasukan = totalPemasukan > 0 ? (totalPengeluaran / totalPemasukan) * 100 : 0;
  
  // Last 6 activities
  const recentTransactions = [...transactions]
    .sort((a, b) => b.no - a.no)
    .slice(0, 6);

  // Chart data: chronological cumulative balance chart
  const chronSorted = [...transactions].sort((a, b) => {
    const parseDate = (dStr: string) => {
      const cleanDate = formatDateOnly(dStr);
      const p = cleanDate.split('/');
      if (p.length === 3) {
        return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime();
      }
      return 0;
    };
    return parseDate(a.tanggal) - parseDate(b.tanggal);
  });

  // Calculate cumulative balance chronologically
  let cumulative = 0;
  const areaChartData = chronSorted.map((tx, idx) => {
    const pem = tx.pemasukan || 0;
    const pen = tx.pengeluaran || 0;
    cumulative = cumulative + pem - pen;
    return {
      no: tx.no,
      tanggal: formatDateOnly(tx.tanggal),
      deskripsi: tx.deskripsi,
      pemasukan: pem,
      pengeluaran: pen,
      saldo: cumulative,
      index: idx + 1
    };
  });

  // Monthly summary
  const monthlyData = groupTransactionsByMonth(transactions);

  // Custom tooltips
  const CustomAreaTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-lg shadow-xl text-white">
          <p className="text-[11px] font-mono text-zinc-400 font-bold tracking-wider uppercase mb-1">{data.tanggal}</p>
          <p className="text-xs font-semibold text-amber-300 truncate max-w-[200px] mb-2">{data.deskripsi}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 my-1 text-xs">
            {data.pemasukan > 0 && (
              <>
                <span className="text-zinc-400">Masuk:</span>
                <span className="text-emerald-400 font-bold font-mono">{formatRupiah(data.pemasukan)}</span>
              </>
            )}
            {data.pengeluaran > 0 && (
              <>
                <span className="text-zinc-400">Keluar:</span>
                <span className="text-rose-400 font-bold font-mono">{formatRupiah(data.pengeluaran)}</span>
              </>
            )}
            <span className="text-zinc-300 border-t border-zinc-800/80 pt-1 mt-1">Saldo:</span>
            <span className="text-amber-400 font-black font-mono border-t border-zinc-800/80 pt-1 mt-1">{formatRupiah(data.saldo)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">Cashflow Operasional</h1>
          <p className="text-sm text-slate-400 font-medium">Monitor real-time pemasukan, pengeluaran, dan saldo kas.</p>
        </div>
      </div>

      {/* Stats Cards Section (INDONESIAN STYLE MATCHING SCREENSHOT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* TOTAL PEMASUKAN */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#111425] to-[#0c0e1b] hover:from-[#14182c] hover:to-[#0f1124] rounded-2xl border border-slate-800/80 hover:border-emerald-500/30 p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 group hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          {/* Accent Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full translate-x-10 -translate-y-10 opacity-30 group-hover:scale-125 transition-transform duration-500 blur-2xl text-slate-100"></div>
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[10px] font-black text-emerald-400 tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase">
              TOTAL PEMASUKAN
            </span>
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500/20 to-emerald-500/5 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] group-hover:scale-105 transition-transform duration-300">
              <Coins className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
          </div>
          
          <div className="relative z-10">
            <p className="text-2xl font-black text-white font-mono tracking-tight sm:text-3xl">
              {formatRupiah(totalPemasukan)}
            </p>
            <div className="mt-3 flex items-center text-xs font-semibold text-emerald-400">
              <Sparkle className="w-3 h-3 text-emerald-400 mr-1 shrink-0" />
              <span>Rp {totalPemasukan.toLocaleString('id-ID')} murni terakumulasi</span>
            </div>
          </div>
        </div>

        {/* TOTAL PENGELUARAN */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#111425] to-[#0c0e1b] hover:from-[#14182c] hover:to-[#0f1124] rounded-2xl border border-slate-800/80 hover:border-rose-500/30 p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 group hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]">
          {/* Accent Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full translate-x-10 -translate-y-10 opacity-30 group-hover:scale-125 transition-transform duration-500 blur-2xl"></div>
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[10px] font-black text-rose-455 tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 uppercase">
              TOTAL PENGELUARAN
            </span>
            <div className="p-2.5 bg-gradient-to-tr from-rose-500/20 to-rose-500/5 text-rose-400 rounded-xl border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)] group-hover:scale-105 transition-transform duration-300">
              <TrendingDown className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
          </div>
          
          <div className="relative z-10">
            <p className="text-2xl font-black text-white font-mono tracking-tight sm:text-3xl">
              {formatRupiah(totalPengeluaran)}
            </p>
            <div className="mt-3 flex items-center text-xs font-semibold text-slate-400">
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${Math.min(ratioPemasukan, 100)}%` }}></div>
              </div>
              <span className="ml-3 text-[10px] font-mono text-rose-400 font-bold whitespace-nowrap">{ratioPemasukan.toFixed(1)}% dari kas</span>
            </div>
          </div>
        </div>

        {/* SALDO AKHIR */}
        <div className="relative overflow-hidden bg-[#0c0e1a] rounded-2xl border border-emerald-500/30 p-4 sm:p-6 shadow-[0_4px_25px_rgba(16,185,129,0.12)] transition-all duration-300 group hover:shadow-[0_0_35px_rgba(16,185,129,0.22)]">
          {/* Accent Glow */}
          <div className="absolute bottom-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full translate-x-10 translate-y-10 opacity-30 group-hover:scale-125 transition-transform duration-500 blur-2xl"></div>
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[10px] font-black text-amber-300 tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25 uppercase">
              SALDO AKHIR SAAT INI
            </span>
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse border border-emerald-400/20">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          
          <div className="relative z-10">
            <p className="text-2xl font-black text-amber-300 font-mono tracking-tight sm:text-3xl">
              {formatRupiah(saldoAkhir)}
            </p>
            <div className="mt-3 flex items-center text-xs font-semibold text-emerald-400 font-mono">
              <Sparkle className="w-3 h-3 text-emerald-400 mr-1 shrink-0 animate-spin-slow" />
              <span>Sesuai audit buku kas terkini</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cumulative Area Chart */}
        <div className="bg-[#111425] p-5 rounded-2xl border border-slate-800 shadow-2xl lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/50">
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-tight">Tren Akumulasi Saldo Kas</h3>
              <p className="text-[11px] text-slate-400 font-medium">Bagan pertumbuhan real-time seiring alur transaksi terkini.</p>
            </div>
            <button 
              onClick={() => onNavigateTab('charts')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 transition-colors"
            >
              <span>Analisis Lengkap</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={areaChartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="tanggal" 
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  stroke="#334155"
                />
                <YAxis 
                  width={60}
                  tickFormatter={formatCompactRupiah}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  stroke="#334155"
                />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorSaldo)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Summary Bar Column */}
        <div className="bg-[#111425] p-5 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/50">
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-tight">Pemasukan vs Pengeluaran</h3>
              <p className="text-[11px] text-slate-400 font-medium">Komparasi nilai bulanan.</p>
            </div>
          </div>

          {monthlyData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 mb-2 stroke-1.5" />
              <p className="text-xs">Data bulan tidak terdeteksi</p>
            </div>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
                  <YAxis 
                    width={60}
                    tickFormatter={formatCompactRupiah}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    stroke="#334155"
                  />
                  <Tooltip 
                    formatter={(val) => [formatRupiah(val as number), '']}
                    contentStyle={{ backgroundColor: '#0a0c18', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar name="Masuk" dataKey="pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar name="Keluar" dataKey="pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Recent Transactions Section - Optimized Full Width */}
      <div className="bg-[#111425] p-6 rounded-2xl border border-slate-800/80 shadow-2xl">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/50">
          <div>
            <h3 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-2">
              <Sparkle className="w-4 h-4 text-emerald-400" />
              <span>Transaksi Terakhir</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Akses cepat catatan pengeluaran & pemasukan terbaru.</p>
          </div>
          <button 
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg"
          >
            Lihat Semua
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentTransactions.map((tx, index) => (
            <div key={`recent-tx-${tx.no}-${index}`} className="flex items-center justify-between p-4 rounded-xl bg-[#0a0c18]/55 border border-slate-850 hover:border-emerald-500/30 transition-all duration-300 group hover:bg-[#0d1020]/70 hover:shadow-lg">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className={`p-2.5 rounded-xl ${
                  tx.pemasukan 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
                    : 'bg-rose-500/10 text-rose-450 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.05)]'
                }`}>
                  <span className="text-xs font-black font-mono">#{tx.no}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-white truncate tracking-tight group-hover:text-amber-200 transition-colors">{tx.deskripsi}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-550" />
                    <span>{parseAndFormatDate(tx.tanggal)}</span>
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 pl-3">
                <p className={`text-xs font-black font-mono tracking-tight ${
                  tx.pemasukan ? 'text-emerald-400' : 'text-rose-455'
                }`}>
                  {tx.pemasukan ? '+' : '-'}{formatRupiah(tx.pemasukan || tx.pengeluaran)}
                </p>
                <p className="text-[9px] text-slate-500 mt-1 font-bold font-mono">Saldo: {formatRupiah(tx.saldo)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
