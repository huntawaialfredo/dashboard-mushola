import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  DollarSign, 
  ArrowUpRight, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { CashTransaction } from '../types';
import { formatRupiah, groupTransactionsByMonth, formatCompactRupiah, formatDateOnly } from '../utils';

interface ChartsViewProps {
  transactions: CashTransaction[];
}

export default function ChartsView({ transactions }: ChartsViewProps) {
  
  // Categorization based on Indonesian text matching
  const categoryAnalysis = useMemo(() => {
    let infraCount = 0;
    let utilityCount = 0;
    let maintenanceCount = 0;
    let kegiatanCount = 0;
    let renovCount = 0;
    let generalSpent = 0;

    let kenclenganIncome = 0;
    let infaqIncome = 0;
    let generalIncome = 0;

    transactions.forEach(tx => {
      const desc = tx.deskripsi.toLowerCase();
      
      if (tx.pengeluaran) {
        const value = tx.pengeluaran;
        if (desc.includes('pdam') || desc.includes('air')) {
          utilityCount += value;
        } else if (desc.includes('listrik') || desc.includes('token') || desc.includes('pulsa')) {
          utilityCount += value;
        } else if (desc.includes('toren') || desc.includes('material') || desc.includes('pipa')) {
          infraCount += value;
        } else if (desc.includes('karpet') || desc.includes('obras') || desc.includes('cuci')) {
          maintenanceCount += value;
        } else if (desc.includes('training') || desc.includes('hewan') || desc.includes('qurban') || desc.includes('konsumsi')) {
          kegiatanCount += value;
        } else if (desc.includes('tukang') || desc.includes('renov') || desc.includes('semen')) {
          renovCount += value;
        } else {
          generalSpent += value;
        }
      }

      if (tx.pemasukan) {
        const value = tx.pemasukan;
        if (desc.includes('kenclengan') || desc.includes('kotak') || desc.includes('tarawih')) {
          kenclenganIncome += value;
        } else if (desc.includes('infaq') || desc.includes('sedekah') || desc.includes('donasi')) {
          infaqIncome += value;
        } else {
          generalIncome += value;
        }
      }
    });

    const expenseCategories = [
      { name: 'Sarana & Prasarana', value: infraCount, color: '#0f766e' }, // Teal
      { name: 'Listrik & Air (Utilitas)', value: utilityCount, color: '#0284c7' }, // Blue
      { name: 'Pemeliharaan', value: maintenanceCount, color: '#f59e0b' }, // Amber
      { name: 'Kegiatan & Edukasi', value: kegiatanCount, color: '#8b5cf6' }, // Purple
      { name: 'Renovasi (Tukang)', value: renovCount, color: '#d97706' }, // Orange
      { name: 'Operasional Lainnya', value: generalSpent, color: '#6b7280' }, // Gray
    ].filter(item => item.value > 0);

    const incomeCategories = [
      { name: 'Kotak Amal / Kenclengan', value: kenclenganIncome, color: '#10b981' }, // Emerald
      { name: 'Infaq / Sedekah Pribadi', value: infaqIncome, color: '#34d399' }, // Light Emerald
      { name: 'Pemasukan Lainnya', value: generalIncome, color: '#a7f3d0' }, // Soft Emerald
    ].filter(item => item.value > 0);

    return { expenseCategories, incomeCategories };
  }, [transactions]);

  // Chronological accumulation data for line chart
  const lineChartData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const pA = formatDateOnly(a.tanggal).split('/');
      const pB = formatDateOnly(b.tanggal).split('/');
      if (pA.length === 3 && pB.length === 3) {
        return new Date(parseInt(pA[2]), parseInt(pA[1]) - 1, parseInt(pA[0])).getTime() - 
               new Date(parseInt(pB[2]), parseInt(pB[1]) - 1, parseInt(pB[0])).getTime();
      }
      return 0;
    });

    let cum = 0;
    return sorted.map((tx) => {
      cum = cum + (tx.pemasukan || 0) - (tx.pengeluaran || 0);
      return {
        tanggal: formatDateOnly(tx.tanggal),
        saldo: cum,
        deskripsi: tx.deskripsi
      };
    });
  }, [transactions]);

  // Monthly group
  const monthlyData = useMemo(() => groupTransactionsByMonth(transactions), [transactions]);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">Analisis & Grafik Kas</h1>
        <p className="text-sm text-slate-400 font-medium">Visualisasi statistik alur dana, porsi pengeluaran, dan tren kas Al-Falah.</p>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cash balance growth graph */}
        <div className="bg-[#111425] p-5 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-800/50">
            <TrendingUp className="w-4 h-4 text-emerald-450 animate-pulse" />
            <span className="font-extrabold text-sm text-white">Alur Keuangan Kumulatif</span>
          </div>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="tanggal" tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#334155" />
                <YAxis 
                  width={60}
                  tickFormatter={formatCompactRupiah}
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  stroke="#334155" 
                />
                <Tooltip 
                  formatter={(val) => [formatRupiah(val as number), 'Saldo']}
                  contentStyle={{ backgroundColor: '#0a0c18', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 1, fill: '#34d399' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar comparison month */}
        <div className="bg-[#111425] p-5 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-800/50">
            <Layers className="w-4 h-4 text-emerald-450" />
            <span className="font-extrabold text-sm text-white">Pemasukan vs Pengeluaran Bulanan</span>
          </div>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
                <YAxis 
                  width={60}
                  tickFormatter={formatCompactRupiah}
                  tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  stroke="#334155" 
                />
                <Tooltip 
                  formatter={(val) => [formatRupiah(val as number), '']}
                  contentStyle={{ backgroundColor: '#0a0c18', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Bar name="Pemasukan" dataKey="pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar name="Pengeluaran" dataKey="pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Pie Charts Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Distribute expenditures */}
        <div className="bg-[#111425] p-5 rounded-2xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-800/50">
              <PieIcon className="w-4 h-4 text-rose-500" />
              <span className="font-extrabold text-xs text-white uppercase tracking-tight">Kategori Pengeluaran</span>
            </div>
            
            {categoryAnalysis.expenseCategories.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium">Belum ada pengeluaran kas tercatat.</p>
            ) : (
              <div className="space-y-3 font-semibold text-xs">
                {categoryAnalysis.expenseCategories.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></span>
                      <span className="text-slate-350 truncate">{cat.name}</span>
                    </div>
                    <span className="font-mono font-extrabold text-white whitespace-nowrap">{formatRupiah(cat.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full md:w-44 h-44 flex-shrink-0 flex items-center justify-center">
            {categoryAnalysis.expenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryAnalysis.expenseCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryAnalysis.expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [formatRupiah(val as number), 'Total']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-dashed border-slate-800" />
            )}
          </div>
        </div>

        {/* Distribute income stream */}
        <div className="bg-[#111425] p-5 rounded-2xl border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-800/50">
              <Sparkles className="w-4 h-4 text-emerald-450" />
              <span className="font-extrabold text-xs text-white uppercase tracking-tight">Sumber Pemasukan Kas</span>
            </div>
            
            {categoryAnalysis.incomeCategories.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium">Belum ada pemasukan terdaftar.</p>
            ) : (
              <div className="space-y-3 font-semibold text-xs">
                {categoryAnalysis.incomeCategories.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></span>
                      <span className="text-slate-350 truncate">{cat.name}</span>
                    </div>
                    <span className="font-mono font-extrabold text-white whitespace-nowrap">{formatRupiah(cat.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full md:w-44 h-44 flex-shrink-0 flex items-center justify-center">
            {categoryAnalysis.incomeCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryAnalysis.incomeCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryAnalysis.incomeCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [formatRupiah(val as number), 'Total']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-dashed border-slate-800" />
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
