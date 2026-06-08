import { CashTransaction } from './types';

// Format number to Indonesian Rupiah
export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
}

// Compact format for charts (e.g. Rp 1,5 Jt or Rp 200 Rb)
export function formatCompactRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Rp 0';
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (absValue >= 1000000) {
    const millions = absValue / 1000000;
    const formatted = (Math.round(millions * 100) / 100).toString().replace('.', ',');
    return `${sign}Rp ${formatted} Jt`;
  }
  if (absValue >= 1000) {
    const thousands = absValue / 1000;
    const formatted = (Math.round(thousands * 100) / 100).toString().replace('.', ',');
    return `${sign}Rp ${formatted} Rb`;
  }
  return `${sign}Rp ${absValue}`;
}

// Strip any time portions and output strictly in DD/MM/YYYY format
export function formatDateOnly(dateStr: string): string {
  if (!dateStr) return '';

  // If ISO string format
  if (dateStr.includes('T')) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear().toString();
      return `${day}/${month}/${year}`;
    }
  }

  // Remove any time part if containing a space (e.g., "04/06/2026 12:30:15")
  const datePart = dateStr.trim().split(/\s+/)[0];
  
  // Normalize dashes to slashes
  const cleanStr = datePart.replace(/-/g, '/');
  const parts = cleanStr.split('/');
  
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY/MM/DD
      const day = parts[2].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[0];
      return `${day}/${month}/${year}`;
    } else {
      // DD/MM/YYYY
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${day}/${month}/${year}`;
    }
  }
  
  return dateStr;
}

// Format date to local Indonesian month-year or full format
export function parseAndFormatDate(dateStr: string): string {
  if (!dateStr) return '';
  const dateOnly = formatDateOnly(dateStr);
  const parts = dateOnly.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    return `${day} ${months[monthIndex]} ${year}`;
  }
  return dateStr;
}

// Retrieve initials or short month (e.g. "Mar 2026")
export function getShortMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  const dateOnly = formatDateOnly(dateStr);
  const parts = dateOnly.split('/');
  if (parts.length === 3) {
    const monthIndex = parseInt(parts[1], 10) - 1;
    const year = parts[2];
    
    const shortMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    
    return `${shortMonths[monthIndex]} ${year}`;
  }
  return dateStr;
}

// Group transactions by month for charts output
export function groupTransactionsByMonth(transactions: CashTransaction[]) {
  const groups: { [key: string]: { month: string; pemasukan: number; pengeluaran: number } } = {};
  
  // Sort transactions chronologically
  const sorted = [...transactions].sort((a, b) => {
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

  sorted.forEach(tx => {
    const mY = getShortMonthYear(tx.tanggal);
    if (!groups[mY]) {
      groups[mY] = { month: mY, pemasukan: 0, pengeluaran: 0 };
    }
    groups[mY].pemasukan += tx.pemasukan || 0;
    groups[mY].pengeluaran += tx.pengeluaran || 0;
  });

  return Object.values(groups);
}
