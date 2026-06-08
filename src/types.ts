export interface CashTransaction {
  no: number;
  tanggal: string; // DD/MM/YYYY
  deskripsi: string;
  pemasukan: number | null;
  pengeluaran: number | null;
  saldo: number;
  attachment?: {
    name: string;
    type: string;
    data: string; // Base64 uri or content
  };
}

export interface DashboardStats {
  totalPemasukan: number;
  totalPengeluaran: number;
  saldoAkhir: number;
}
