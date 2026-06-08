import { CashTransaction } from './types';

export const INITIAL_TRANSACTIONS: CashTransaction[] = [
  {
    no: 1,
    tanggal: '22/03/2026',
    deskripsi: 'Kenclengan Idul Fitri',
    pemasukan: 1810000,
    pengeluaran: null,
    saldo: 1810000
  },
  {
    no: 2,
    tanggal: '22/03/2026',
    deskripsi: 'Kenclengan Tarawih',
    pemasukan: 828000,
    pengeluaran: null,
    saldo: 2638000
  },
  {
    no: 3,
    tanggal: '28/03/2026',
    deskripsi: 'Tukang',
    pemasukan: null,
    pengeluaran: 100000,
    saldo: 2538000
  },
  {
    no: 4,
    tanggal: '06/05/2026',
    deskripsi: 'Training penyembelihan hewan qurban',
    pemasukan: null,
    pengeluaran: 1500000,
    saldo: 1038000
  },
  {
    no: 5,
    tanggal: '09/05/2026',
    deskripsi: 'Obras Karpet',
    pemasukan: null,
    pengeluaran: 280000,
    saldo: 758000
  },
  {
    no: 6,
    tanggal: '10/05/2026',
    deskripsi: 'Token Listrik',
    pemasukan: null,
    pengeluaran: 200000,
    saldo: 558000
  },
  {
    no: 7,
    tanggal: '28/05/2026',
    deskripsi: 'Kenclengan Idul Adha',
    pemasukan: 2950000,
    pengeluaran: null,
    saldo: 3508000
  },
  {
    no: 8,
    tanggal: '30/05/2026',
    deskripsi: 'Material toren',
    pemasukan: null,
    pengeluaran: 200000,
    saldo: 3308000
  },
  {
    no: 9,
    tanggal: '30/05/2026',
    deskripsi: 'Material toren',
    pemasukan: null,
    pengeluaran: 66000,
    saldo: 3242000
  },
  {
    no: 10,
    tanggal: '30/05/2026',
    deskripsi: 'Material toren',
    pemasukan: null,
    pengeluaran: 45000,
    saldo: 3197000
  },
  {
    no: 11,
    tanggal: '31/05/2026',
    deskripsi: 'Material toren',
    pemasukan: null,
    pengeluaran: 5000,
    saldo: 3192000
  },
  {
    no: 12,
    tanggal: '01/06/2026',
    deskripsi: 'Material toren',
    pemasukan: null,
    pengeluaran: 20000,
    saldo: 3172000
  },
  {
    no: 13,
    tanggal: '01/06/2026',
    deskripsi: 'Infaq Hamba Allah',
    pemasukan: 300000,
    pengeluaran: null,
    saldo: 3472000
  },
  {
    no: 14,
    tanggal: '03/06/2026',
    deskripsi: 'PDAM mei 2026',
    pemasukan: null,
    pengeluaran: 59900,
    saldo: 3412100
  }
];

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script untuk menyajikan data Google Sheets sebagai JSON API
 * Pasang script ini di menu Extensions -> Apps Script pada Google Sheets Anda.
 */

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; // Ambil sheet pertama
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Asumsi baris pertama adalah Header, misalnya No, Tanggal, Deskripsi, Pemasukan, Pengeluaran
    const headers = values[0];
    const rawData = [];
    
    // Mulai dari baris kedua (index 1) untuk membaca data transaksi
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row[1] && !row[2]) continue; // Skip baris kosong
      
      const valPemasukan = parseFloat(row[3]) || 0;
      const valPengeluaran = parseFloat(row[4]) || 0;
      
      rawData.push({
        no: parseInt(row[0]) || i,
        tanggal: formatDate(row[1]) || "",
        deskripsi: String(row[2] || "").trim(),
        pemasukan: valPemasukan > 0 ? valPemasukan : null,
        pengeluaran: valPengeluaran > 0 ? valPengeluaran : null,
      });
    }
    
    // Menghitung akumulasi saldo real-time
    let runningSaldo = 0;
    const transactions = rawData.map((tx) => {
      const pem = tx.pemasukan || 0;
      const pen = tx.pengeluaran || 0;
      runningSaldo = runningSaldo + pem - pen;
      return {
        ...tx,
        saldo: runningSaldo
      };
    });
    
    const responseData = {
      status: "success",
      lastUpdated: new Date().toISOString(),
      data: transactions
    };
    
    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    const errorResponse = {
      status: "error",
      message: err.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper untuk format tanggal dari cell ke string DD/MM/YYYY
function formatDate(cellValue) {
  if (!cellValue) return "";
  if (cellValue instanceof Date) {
    const day = String(cellValue.getDate()).padStart(2, '0');
    const month = String(cellValue.getMonth() + 1).padStart(2, '0');
    const year = cellValue.getFullYear();
    return day + "/" + month + "/" + year;
  }
  return String(cellValue);
}
`;
