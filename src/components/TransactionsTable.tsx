import { useState, useMemo, useEffect, useRef, FormEvent } from 'react';
import { 
  Search, 
  Filter, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Calendar,
  RotateCcw,
  Printer,
  X,
  FileDown,
  FileText,
  Loader2,
  Settings,
  Trash2,
  Pencil
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CashTransaction } from '../types';
import { formatRupiah, parseAndFormatDate, formatDateOnly } from '../utils';

interface TransactionsTableProps {
  transactions: CashTransaction[];
  autoOpenPrint?: boolean;
  onClearAutoOpenPrint?: () => void;
  isAdministrator?: boolean;
  onEditTransaction?: (no: number, updatedFields: Partial<Omit<CashTransaction, 'no' | 'saldo'>>) => void;
  onDeleteTransaction?: (no: number) => void;
}

const INDONESIAN_MONTHS = [
  { value: '01', name: 'Januari' },
  { value: '02', name: 'Februari' },
  { value: '03', name: 'Maret' },
  { value: '04', name: 'April' },
  { value: '05', name: 'Mei' },
  { value: '06', name: 'Juni' },
  { value: '07', name: 'Juli' },
  { value: '08', name: 'Agustus' },
  { value: '09', name: 'September' },
  { value: '10', name: 'Oktober' },
  { value: '11', name: 'November' },
  { value: '12', name: 'Desember' }
];

export default function TransactionsTable({ 
  transactions,
  autoOpenPrint,
  onClearAutoOpenPrint,
  isAdministrator = false,
  onEditTransaction,
  onDeleteTransaction
}: TransactionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pemasukan' | 'pengeluaran'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // New States for Advanced Filters
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Admin select, edit, and delete state engine
  const [selectedTxNo, setSelectedTxNo] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Table ref and Click outside effect to reset selection when clicking outside the transactions list area
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (selectedTxNo === null) return;
      if (showEditModal || showDeleteConfirm) return;

      if (
        tableContainerRef.current &&
        !tableContainerRef.current.contains(event.target as Node)
      ) {
        setSelectedTxNo(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [selectedTxNo, showEditModal, showDeleteConfirm]);

  // States for the active transaction form under edit
  const [editTanggal, setEditTanggal] = useState('');
  const [editDeskripsi, setEditDeskripsi] = useState('');
  const [editTipe, setEditTipe] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [editJumlah, setEditJumlah] = useState('');
  const [editFile, setEditFile] = useState<{ name: string; type: string; data: string } | null>(null);
  const [editDragging, setEditDragging] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editNotif, setEditNotif] = useState<string | null>(null);

  // Date conversion helpers (DD/MM/YYYY <-> YYYY-MM-DD)
  const convertIndonesianDateToISO = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return '';
  };

  const convertISOToIndonesianDate = (isoStr: string): string => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return '';
  };

  // Upload/read file in edit modal
  const handleEditFileSelection = (file: File) => {
    setEditFormError(null);
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setEditFormError('Ukuran berkas bukti terlalu besar! Batas maksimal adalah 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditFile({
          name: file.name,
          type: file.type,
          data: event.target.result as string
        });
      }
    };
    reader.onerror = () => {
      setEditFormError('Terjadi kesalahan membaca berkas. Silakan gunakan berkas gambar/PDF lain.');
    };
    reader.readAsDataURL(file);
  };

  // Persist Edit
  const handleSaveEdit = (e: FormEvent) => {
    e.preventDefault();
    setEditFormError(null);

    if (!selectedTxNo || !onEditTransaction) return;

    if (!editTanggal || !editDeskripsi || !editJumlah) {
      setEditFormError('Mohon lengkapi semua isian formulir!');
      return;
    }

    const value = parseFloat(editJumlah);
    if (isNaN(value) || value <= 0) {
      setEditFormError('Jumlah uang harus bernilai angka positif yang valid!');
      return;
    }

    const formattedDate = convertISOToIndonesianDate(editTanggal);

    onEditTransaction(selectedTxNo, {
      tanggal: formattedDate,
      deskripsi: editDeskripsi.trim(),
      pemasukan: editTipe === 'pemasukan' ? value : null,
      pengeluaran: editTipe === 'pengeluaran' ? value : null,
      attachment: editFile || undefined
    });

    setEditNotif('Data transaksi berhasil dimodifikasi dan diperbarui!');
    setTimeout(() => setEditNotif(null), 4000);
    setShowEditModal(false);
    setSelectedTxNo(null);
  };

  // Persist Delete
  const handleConfirmDelete = () => {
    if (!selectedTxNo || !onDeleteTransaction) return;

    onDeleteTransaction(selectedTxNo);
    setShowDeleteConfirm(false);
    setSelectedTxNo(null);
    setEditNotif('Transaksi berhasil dihapus secara permanen dari buku besar!');
    setTimeout(() => setEditNotif(null), 4000);
  };

  // Automatically open the PDF Print Modal when redirected from dashboard or triggered externally
  useEffect(() => {
    if (autoOpenPrint) {
      handleOpenPrintModal();
      if (onClearAutoOpenPrint) {
        onClearAutoOpenPrint();
      }
    }
  }, [autoOpenPrint]);

  // States for print configurations & modals
  const [printMode, setPrintMode] = useState<'all' | 'attachments_only'>('all');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');
  const [modalDownloadAttachments, setModalDownloadAttachments] = useState(true);

  // States for Month / Year filters within the print modals
  const [printFilterType, setPrintFilterType] = useState<'month_year' | 'range'>('month_year');
  const [modalSelectedMonth, setModalSelectedMonth] = useState<string>('all');
  const [modalSelectedYear, setModalSelectedYear] = useState<string>('all');

  // Helper inside modal to update starting & ending dates instantly when month or year changes
  const updateModalDatesFromMonthYear = (month: string, year: string) => {
    if (year === 'all') {
      setModalStartDate('');
      setModalEndDate('');
      return;
    }
    
    if (month === 'all') {
      setModalStartDate(`${year}-01-01`);
      setModalEndDate(`${year}-12-31`);
    } else {
      const firstDay = `${year}-${month}-01`;
      const lastDayDate = new Date(parseInt(year, 10), parseInt(month, 10), 0);
      const lastDayStr = String(lastDayDate.getDate()).padStart(2, '0');
      const lastDay = `${year}-${month}-${lastDayStr}`;
      setModalStartDate(firstDay);
      setModalEndDate(lastDay);
    }
  };

  const handleModalMonthChange = (month: string, year: string) => {
    setModalSelectedMonth(month);
    updateModalDatesFromMonthYear(month, year);
  };

  const handleModalYearChange = (month: string, year: string) => {
    setModalSelectedYear(year);
    updateModalDatesFromMonthYear(month, year);
  };

  // Handlers to open modals with active filter state inherited
  const handleOpenPrintModal = () => {
    const activeStart = startDate || '';
    const activeEnd = endDate || '';
    setModalStartDate(activeStart);
    setModalEndDate(activeEnd);
    setModalSelectedMonth(selectedMonth);
    setModalSelectedYear(selectedYear);
    
    // Default to month_year if dashboard is filtered by month/year, or if no raw range dates exist
    if (selectedMonth !== 'all' || selectedYear !== 'all') {
      setPrintFilterType('month_year');
    } else if (activeStart || activeEnd) {
      setPrintFilterType('range');
    } else {
      setPrintFilterType('month_year');
    }
    
    setModalDownloadAttachments(true);
    setShowPrintModal(true);
  };

  const handleOpenAttachmentModal = () => {
    const activeStart = startDate || '';
    const activeEnd = endDate || '';
    setModalStartDate(activeStart);
    setModalEndDate(activeEnd);
    setModalSelectedMonth(selectedMonth);
    setModalSelectedYear(selectedYear);
    
    if (selectedMonth !== 'all' || selectedYear !== 'all') {
      setPrintFilterType('month_year');
    } else if (activeStart || activeEnd) {
      setPrintFilterType('range');
    } else {
      setPrintFilterType('month_year');
    }
    
    setShowAttachmentModal(true);
  };
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Robust function to parse any date format safely
  const parseDateParts = (dateStr: string) => {
    if (!dateStr) return null;
    
    // If it is an ISO string with timezone info
    if (dateStr.includes('T')) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return {
          day: d.getDate(),
          month: d.getMonth(), // 0-indexed
          year: d.getFullYear().toString()
        };
      }
    }

    // Normalize separators
    const cleanStr = dateStr.replace(/-/g, '/');
    const parts = cleanStr.split('/');
    
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD format
        return {
          day: parseInt(parts[2], 10),
          month: parseInt(parts[1], 10) - 1,
          year: parts[0]
        };
      } else {
        // DD/MM/YYYY format
        return {
          day: parseInt(parts[0], 10),
          month: parseInt(parts[1], 10) - 1,
          year: parts[2]
        };
      }
    }
    return null;
  };

  // Extract available years dynamically
  const availableYears = useMemo(() => {
    const years = transactions.map(tx => {
      const parsed = parseDateParts(tx.tanggal);
      return parsed ? parsed.year : null;
    }).filter((y): y is string => y !== null);
    
    return Array.from(new Set(years)).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Filter & Sort Transactions
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    // Search
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(tx => 
        tx.deskripsi.toLowerCase().includes(term) ||
        tx.tanggal.toLowerCase().includes(term) ||
        String(tx.no).includes(term)
      );
    }

    // Filter Type (Pemasukan vs Pengeluaran)
    if (filterType === 'pemasukan') {
      result = result.filter(tx => tx.pemasukan !== null && tx.pemasukan !== undefined);
    } else if (filterType === 'pengeluaran') {
      result = result.filter(tx => tx.pengeluaran !== null && tx.pengeluaran !== undefined);
    }

    // Filter Year
    if (selectedYear !== 'all') {
      result = result.filter(tx => {
        const parsed = parseDateParts(tx.tanggal);
        return parsed !== null && parsed.year === selectedYear;
      });
    }

    // Filter Month
    if (selectedMonth !== 'all') {
      result = result.filter(tx => {
        const parsed = parseDateParts(tx.tanggal);
        if (parsed !== null) {
          const monthStr = String(parsed.month + 1).padStart(2, '0');
          return monthStr === selectedMonth;
        }
        return false;
      });
    }

    // Filter Date Range
    if (startDate || endDate) {
      result = result.filter(tx => {
        const parsed = parseDateParts(tx.tanggal);
        if (parsed !== null) {
          const txDate = new Date(
            parseInt(parsed.year, 10),
            parsed.month,
            parsed.day,
            12, 0, 0, 0
          );

          if (startDate) {
            const startParts = startDate.split('-');
            const sDate = new Date(
              parseInt(startParts[0], 10),
              parseInt(startParts[1], 10) - 1,
              parseInt(startParts[2], 10),
              0, 0, 0, 0
            );
            if (txDate.getTime() < sDate.getTime()) return false;
          }

          if (endDate) {
            const endParts = endDate.split('-');
            const eDate = new Date(
              parseInt(endParts[0], 10),
              parseInt(endParts[1], 10) - 1,
              parseInt(endParts[2], 10),
              23, 59, 59, 999
            );
            if (txDate.getTime() > eDate.getTime()) return false;
          }
        } else {
          return false;
        }
        return true;
      });
    }

    // Sort order (by 'no' primarily)
    result.sort((a, b) => {
      return sortOrder === 'desc' ? b.no - a.no : a.no - b.no;
    });

    return result;
  }, [transactions, searchTerm, filterType, selectedYear, selectedMonth, startDate, endDate, sortOrder]);

  // Paginated data
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [processedTransactions, currentPage]);

  const totalPages = Math.max(1, Math.ceil(processedTransactions.length / itemsPerPage));

  // If page exceeds total, reset to 1
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  // Export to CSV helper
  const exportToCSV = () => {
    const headers = ['No', 'Tanggal', 'Deskripsi', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Saldo Akhir (Rp)'];
    const rows = transactions.map(tx => [
      tx.no,
      tx.tanggal,
      tx.deskripsi,
      tx.pemasukan || 0,
      tx.pengeluaran || 0,
      tx.saldo
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Laporan_Kas_Musholla_Al_Falah.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // State for loading / generating PDF on the client-side
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Base64 single file downloader helper using Blob for 100% browser compatibility inside sandboxed preview iframes
  const downloadAttachment = (fileName: string, base64Data: string) => {
    try {
      if (!base64Data) return;
      const parts = base64Data.split(',');
      if (parts.length < 2) {
        throw new Error("Format base64 data tidak valid");
      }
      
      const mimeTypeMatch = parts[0].match(/data:(.*?);base64/);
      const contentType = mimeTypeMatch ? mimeTypeMatch[1] : '';
      const base64Content = parts[1];
      
      const byteCharacters = atob(base64Content);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const blob = new Blob(byteArrays, { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 150);
    } catch (e) {
      console.error("Gagal mengunduh berkas lampiran via Blob, mencoba tautan langsung:", e);
      // Fallback
      try {
        const link = document.createElement('a');
        link.href = base64Data;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Unduhan langsung juga gagal:", err);
        alert("E-Dokumen gagal diunduh. Silakan coba berkas bukti lainnya.");
      }
    }
  };

  // Direct client-side HTML-to-PDF compiler using jsPDF & jspdf-autotable
  const handleExportPDF = (
    fileName: string,
    overrideTransactions?: CashTransaction[],
    overrideStartDate?: string,
    overrideEndDate?: string,
    overrideSelectedMonth?: string,
    overrideSelectedYear?: string,
    overridePrintMode?: 'all' | 'attachments_only'
  ) => {
    setIsGeneratingPDF(true);

    const targetTransactions = overrideTransactions || processedTransactions;
    const targetStartDate = overrideStartDate !== undefined ? overrideStartDate : startDate;
    const targetEndDate = overrideEndDate !== undefined ? overrideEndDate : endDate;
    const targetSelectedMonth = overrideSelectedMonth !== undefined ? overrideSelectedMonth : selectedMonth;
    const targetSelectedYear = overrideSelectedYear !== undefined ? overrideSelectedYear : selectedYear;
    const targetPrintMode = overridePrintMode !== undefined ? overridePrintMode : printMode;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Page parameters
      const pageWidth = doc.internal.pageSize.getWidth(); // A4: 210mm
      const pageHeight = doc.internal.pageSize.getHeight(); // A4: 297mm
      const margin = 12; // margin in mm
      const contentWidth = pageWidth - (margin * 2); // 186mm

      // Standard Font setup
      doc.setFont('helvetica', 'normal');

      if (targetPrintMode === 'all') {
        // --- 1. KOP SURAT (Letterhead Letter Cop - Styled from the elegant DKM AL-FALAH template) ---
        // Rich, dark imperial navy-slate banner background
        doc.setFillColor(11, 28, 45);
        doc.rect(0, 0, pageWidth, 44, 'F');

        // Central coordinates for the gorgeous Golden Mosque Dome Logo
        const cx = pageWidth / 2;
        const cy = 13;

        // 1. Double crescent path (Outer Gold crescent moon outline)
        doc.setFillColor(212, 165, 85); // elegant warm gold
        doc.circle(cx - 3.2, cy - 2.8, 4.4, 'F');
        doc.setFillColor(11, 28, 45); // match bg mask
        doc.circle(cx - 2.0, cy - 2.8, 4.1, 'F');

        // 2. Dome outline curves (Golden Islamic geometric style archs)
        doc.setDrawColor(212, 165, 85);
        doc.setLineWidth(0.45);
        
        // Base structure of the dome symbol
        doc.line(cx - 6.5, cy + 5, cx + 6.5, cy + 5);
        
        // Dynamic arch curves intersecting in a beautiful point
        doc.line(cx - 6.5, cy + 5, cx, cy - 1);
        doc.line(cx + 6.5, cy + 5, cx, cy - 1);
        
        // Inner layered arch lines matching the luxury logo
        doc.line(cx - 3.8, cy + 5, cx, cy + 1.8);
        doc.line(cx + 3.8, cy + 5, cx, cy + 1.8);
        
        // Mini spires
        doc.line(cx, cy - 1, cx, cy - 3.5);

        // Solid gold center accent star/stone
        doc.setFillColor(212, 165, 85);
        doc.circle(cx, cy - 3.8, 0.45, 'F');

        // Write Institution Text: "DKM AL-FALAH" in large serif-style display title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(23);
        doc.setTextColor(212, 165, 85); // Solid premium gold
        doc.text('DKM AL-FALAH', pageWidth / 2, 28, { align: 'center' });

        // Subtitle / Address in thin light warm gold
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(220, 210, 190); // soft bone-gold
        doc.text('Perumahan Victoria Permai, Babelan Kota, Babelan, Bekasi 17610', pageWidth / 2, 34, { align: 'center' });

        // Thin Golden Horizontal Divider Line in matching gold
        doc.setLineWidth(0.28);
        doc.setDrawColor(212, 165, 85);
        
        // Draw double side lines with centered diamond and corner stars
        doc.line(margin + 5, 39.5, pageWidth / 2 - 5, 39.5);
        doc.line(pageWidth / 2 + 5, 39.5, pageWidth - margin - 5, 39.5);

        // Center golden diamond separator
        doc.setFillColor(212, 165, 85);
        doc.triangle(pageWidth / 2, 38.5, pageWidth / 2 - 1.2, 39.5, pageWidth / 2 + 1.2, 39.5, 'FD');
        doc.triangle(pageWidth / 2, 40.5, pageWidth / 2 - 1.2, 39.5, pageWidth / 2 + 1.2, 39.5, 'FD');

        // Side boundary stars / mini 8-point stars
        // Left offset star
        doc.triangle(margin + 3, 39.0, margin + 2.5, 39.5, margin + 3.5, 39.5, 'FD');
        doc.triangle(margin + 3, 40.0, margin + 2.5, 39.5, margin + 3.5, 39.5, 'FD');
        // Right offset star
        doc.triangle(pageWidth - margin - 3, 39.0, pageWidth - margin - 3.5, 39.5, pageWidth - margin - 2.5, 39.5, 'FD');
        doc.triangle(pageWidth - margin - 3, 40.0, pageWidth - margin - 3.5, 39.5, pageWidth - margin - 2.5, 39.5, 'FD');

        // Transition back to page content space (Y restarts below the cover background)
        let currentY = 53;

        // --- 2. REPORT TITLE & FILTER PERIODS (Perfect spacing below the dark banner) ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(15, 23, 42); // deep slate/black
        doc.text('Laporan Keuangan Kas Buku Besar', pageWidth / 2, currentY, { align: 'center' });

        currentY += 6.0;

        // Dynamic time active filter period text
        let periodText = 'Periode: Semua Riwayat Transaksi';
        if (targetSelectedMonth !== 'all' || targetSelectedYear !== 'all') {
          const monthDetail = INDONESIAN_MONTHS.find(m => m.value === targetSelectedMonth);
          const monthName = monthDetail ? monthDetail.name : '';
          const yearText = targetSelectedYear !== 'all' ? `${targetSelectedYear} M` : 'Semua Tahun';
          let rLabel = '';
          if (targetStartDate || targetEndDate) {
            rLabel = ` (${targetStartDate ? formatDateOnly(targetStartDate) : ''} s.d ${targetEndDate ? formatDateOnly(targetEndDate) : ''})`;
          }
          periodText = `Periode: ${monthName} ${yearText}${rLabel}`.trim();
        } else if (targetStartDate || targetEndDate) {
          const sLabel = targetStartDate ? formatDateOnly(targetStartDate) : '';
          const eLabel = targetEndDate ? formatDateOnly(targetEndDate) : '';
          periodText = `Periode: ${sLabel} s.d ${eLabel}`;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(55, 65, 81);
        doc.text(periodText, pageWidth / 2, currentY, { align: 'center' });

        currentY += 4.5;
        // Print timestamp metadata
        const printDateText = `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB`;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(printDateText, pageWidth / 2, currentY, { align: 'center' });

        currentY += 7;

        // --- 3. METRICS OVERVIEW SUMMARY BOXES ---
        const totalIncome = targetTransactions.reduce((acc, curr) => acc + (curr.pemasukan || 0), 0);
        const totalSpent = targetTransactions.reduce((acc, curr) => acc + (curr.pengeluaran || 0), 0);
        const finalBalance = totalIncome - totalSpent;

        // Draw soft grey filled container
        doc.setLineWidth(0.2);
        doc.setDrawColor(209, 213, 219);
        doc.setFillColor(249, 250, 251); // neutral-50 bg
        doc.rect(margin, currentY, contentWidth, 16, 'FD');

        // Column lines
        doc.line(margin + (contentWidth / 3), currentY, margin + (contentWidth / 3), currentY + 16);
        doc.line(margin + ((contentWidth / 3) * 2), currentY, margin + ((contentWidth / 3) * 2), currentY + 16);

        // Grid contents
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128);
        doc.text('TOTAL PEMASUKAN KAS', margin + (contentWidth / 6), currentY + 5, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(5, 150, 105); // emerald green
        doc.text(formatRupiah(totalIncome), margin + (contentWidth / 6), currentY + 11.5, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128);
        doc.text('TOTAL PENGELUARAN KAS', margin + (contentWidth / 2), currentY + 5, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(220, 38, 38); // red colors
        doc.text(formatRupiah(totalSpent), margin + (contentWidth / 2), currentY + 11.5, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(107, 114, 128);
        doc.text('SALDO AKHIR PERIODE', margin + ((contentWidth / 6) * 5), currentY + 5, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(29, 78, 216); // dark royal blue
        doc.text(formatRupiah(finalBalance), margin + ((contentWidth / 6) * 5), currentY + 11.5, { align: 'center' });

        currentY += 21;

        // --- 4. DATA TABLE VIA AUTO-TABLE (CRISP SCALED VECTOR) ---
        const tableBody = targetTransactions.map((tx, idx) => [
          (idx + 1).toString(),
          formatDateOnly(tx.tanggal),
          tx.deskripsi,
          tx.attachment ? 'Ada' : '-',
          tx.pemasukan ? formatRupiah(tx.pemasukan) : '-',
          tx.pengeluaran ? formatRupiah(tx.pengeluaran) : '-',
          formatRupiah(tx.saldo)
        ]);

        if (tableBody.length === 0) {
          tableBody.push(['-', '-', 'Tidak ada data transaksi kas yang sesuai dengan saringan filter ini.', '-', '-', '-', '-']);
        }

        // @ts-ignore
        autoTable(doc, {
          startY: currentY,
          margin: { left: margin, right: margin },
          head: [[
            'No', 
            'Tanggal', 
            'Deskripsi / Keperluan', 
            'Bukti', 
            'Pemasukan (Rp)', 
            'Pengeluaran (Rp)', 
            'Saldo Akhir (Rp)'
          ]],
          body: tableBody,
          theme: 'grid',
          headStyles: {
            fillColor: [243, 244, 246], // neutral-100
            textColor: [17, 24, 39], // text-neutral-900
            fontSize: 8.5,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.15,
            lineColor: [115, 115, 115] // border-neutral-400
          },
          bodyStyles: {
            fontSize: 7.5,
            textColor: [0, 0, 0],
            valign: 'middle',
            lineWidth: 0.1,
            lineColor: [212, 212, 212] // border-neutral-300
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },      // No
            1: { halign: 'center', cellWidth: 23 },     // Tanggal
            2: { halign: 'left', cellWidth: 'auto' }, // Deskripsi
            3: { halign: 'center', cellWidth: 12 },     // Bukti
            4: { halign: 'right', cellWidth: 31, textColor: [4, 120, 87] }, // Pemasukan 
            5: { halign: 'right', cellWidth: 31, textColor: [185, 28, 28] }, // Pengeluaran
            6: { halign: 'right', cellWidth: 31, fontStyle: 'bold' } // Saldo
          }
        });

        // --- 5. AUTHORIZING SIGNATURE BOXES ---
        // @ts-ignore
        let finalY = doc.lastAutoTable.finalY + 12;

        // If signatures section will overflow Page-Height, add pagebreak
        if (finalY + 36 > pageHeight - margin) {
          doc.addPage();
          finalY = margin + 12;
        }

        const relativeColsLeftX = margin + (contentWidth / 4);
        const relativeColsRightX = margin + ((contentWidth / 4) * 3);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(55, 65, 81); // neutral-700
        
        // Col left: Ketua DKM Al-Falah
        doc.text('Mengetahui,', relativeColsLeftX, finalY, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text("Ketua DKM Al-Falah", relativeColsLeftX, finalY + 5.5, { align: 'center' });
        
        // Col right: Treasurer (Bekasi)
        const formattedDateSign = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        doc.text(`Bekasi, ${formattedDateSign}`, relativeColsRightX, finalY, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Bendahara Mushola Al-Falah', relativeColsRightX, finalY + 5.5, { align: 'center' });

        // Bottom underlines
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        doc.text('( _______________________ )', relativeColsLeftX, finalY + 31, { align: 'center' });
        doc.text('( _______________________ )', relativeColsRightX, finalY + 31, { align: 'center' });

      } else {
        // --- ATTACHMENTS_ONLY MODE (DEDICATED COMPILATION) ---
        // Rich, dark imperial navy-slate banner background
        doc.setFillColor(11, 28, 45);
        doc.rect(0, 0, pageWidth, 44, 'F');

        // Central coordinates for the gorgeous Golden Mosque Dome Logo
        const cx = pageWidth / 2;
        const cy = 13;

        // 1. Double crescent path (Outer Gold crescent moon outline)
        doc.setFillColor(212, 165, 85); // elegant warm gold
        doc.circle(cx - 3.2, cy - 2.8, 4.4, 'F');
        doc.setFillColor(11, 28, 45); // match bg mask
        doc.circle(cx - 2.0, cy - 2.8, 4.1, 'F');

        // 2. Dome outline curves (Golden Islamic geometric style archs)
        doc.setDrawColor(212, 165, 85);
        doc.setLineWidth(0.45);
        
        // Base structure of the dome symbol
        doc.line(cx - 6.5, cy + 5, cx + 6.5, cy + 5);
        
        // Dynamic arch curves intersecting in a beautiful point
        doc.line(cx - 6.5, cy + 5, cx, cy - 1);
        doc.line(cx + 6.5, cy + 5, cx, cy - 1);
        
        // Inner layered arch lines matching the luxury logo
        doc.line(cx - 3.8, cy + 5, cx, cy + 1.8);
        doc.line(cx + 3.8, cy + 5, cx, cy + 1.8);
        
        // Mini spires
        doc.line(cx, cy - 1, cx, cy - 3.5);

        // Solid gold center accent star/stone
        doc.setFillColor(212, 165, 85);
        doc.circle(cx, cy - 3.8, 0.45, 'F');

        // Write Institution Text: "DKM AL-FALAH" in large serif-style display title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(23);
        doc.setTextColor(212, 165, 85); // Solid premium gold
        doc.text('DKM AL-FALAH', pageWidth / 2, 28, { align: 'center' });

        // Subtitle / Address in thin light warm gold
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(220, 210, 190); // soft bone-gold
        doc.text('Perumahan Victoria Permai, Babelan Kota, Babelan, Bekasi 17610', pageWidth / 2, 34, { align: 'center' });

        // Thin Golden Horizontal Divider Line in matching gold
        doc.setLineWidth(0.28);
        doc.setDrawColor(212, 165, 85);
        
        // Draw double side lines with centered diamond and corner stars
        doc.line(margin + 5, 39.5, pageWidth / 2 - 5, 39.5);
        doc.line(pageWidth / 2 + 5, 39.5, pageWidth - margin - 5, 39.5);

        // Center golden diamond separator
        doc.setFillColor(212, 165, 85);
        doc.triangle(pageWidth / 2, 38.5, pageWidth / 2 - 1.2, 39.5, pageWidth / 2 + 1.2, 39.5, 'FD');
        doc.triangle(pageWidth / 2, 40.5, pageWidth / 2 - 1.2, 39.5, pageWidth / 2 + 1.2, 39.5, 'FD');

        // Side boundary stars / mini 8-point stars
        // Left offset star
        doc.triangle(margin + 3, 39.0, margin + 2.5, 39.5, margin + 3.5, 39.5, 'FD');
        doc.triangle(margin + 3, 40.0, margin + 2.5, 39.5, margin + 3.5, 39.5, 'FD');
        // Right offset star
        doc.triangle(pageWidth - margin - 3, 39.0, pageWidth - margin - 3.5, 39.5, pageWidth - margin - 2.5, 39.5, 'FD');
        doc.triangle(pageWidth - margin - 3, 40.0, pageWidth - margin - 3.5, 39.5, pageWidth - margin - 2.5, 39.5, 'FD');

        let currentY = 53;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);
        doc.text('LAPORAN LAMPIRAN BUKTI FISIK TRANSAKSI KAS', pageWidth / 2, currentY, { align: 'center' });
        
        currentY += 6;

        let periodText = 'Semua Berkas Terlampir';
        if (targetStartDate || targetEndDate) {
          const sDateText = targetStartDate ? formatDateOnly(targetStartDate) : '';
          const eDateText = targetEndDate ? formatDateOnly(targetEndDate) : '';
          periodText = `Periode Saringan Tanggal: ${sDateText} s.d ${eDateText}`;
        }
        
        doc.setFontSize(9);
        doc.setTextColor(55, 65, 81);
        doc.text(periodText, pageWidth / 2, currentY, { align: 'center' });
        
        currentY += 10;

        const withAttachments = targetTransactions.filter(tx => tx.attachment);

        if (withAttachments.length === 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.text('Tidak ada berkas bukti lampiran dalam saringan terpilih.', pageWidth / 2, currentY, { align: 'center' });
        } else {
          withAttachments.forEach((tx, idx) => {
            if (idx > 0) {
              doc.addPage();
              currentY = margin + 5;
            }

            // Draw meta header banner container
            doc.setFillColor(243, 244, 246);
            doc.rect(margin, currentY, contentWidth, 34, 'F');
            doc.setLineWidth(0.2);
            doc.setDrawColor(209, 213, 219);
            doc.rect(margin, currentY, contentWidth, 34, 'D');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(17, 24, 39);
            doc.text(`Lampiran #${idx + 1}`, margin + 5, currentY + 6);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`No Trans: ${tx.no} | Tanggal: ${formatDateOnly(tx.tanggal)}`, pageWidth - margin - 5, currentY + 6, { align: 'right' });

            doc.setLineWidth(0.1);
            doc.setDrawColor(229, 231, 235);
            doc.line(margin + 5, currentY + 10, pageWidth - margin - 5, currentY + 10);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(0, 0, 0);
            doc.text(tx.deskripsi, margin + 5, currentY + 16);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(107, 114, 128);
            doc.text('Nilai Nominal:', margin + 5, currentY + 23);
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            if (tx.pemasukan) {
              doc.setTextColor(16, 122, 87);
              doc.text(`(+) ${formatRupiah(tx.pemasukan)}`, margin + 28, currentY + 23);
            } else {
              doc.setTextColor(220, 38, 38);
              doc.text(`(-) ${formatRupiah(tx.pengeluaran!)}`, margin + 28, currentY + 23);
            }

            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175);
            doc.text(`Nama Berkas: ${tx.attachment?.name}`, margin + 5, currentY + 29);

            currentY += 40;

            if (tx.attachment?.data.startsWith('data:image/')) {
              try {
                let format = 'JPEG';
                if (tx.attachment.data.includes('image/png')) format = 'PNG';
                else if (tx.attachment.data.includes('image/webp')) format = 'WEBP';
                
                const maxImgW = 140;
                const maxImgH = 140;
                doc.addImage(
                  tx.attachment.data, 
                  format, 
                  (pageWidth - maxImgW) / 2, 
                  currentY, 
                  maxImgW, 
                  maxImgH
                );
              } catch (imgErr) {
                console.error("Failed adding attachment preview to PDF:", imgErr);
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(8.5);
                doc.setTextColor(220, 38, 38);
                doc.text('(Format pratinjau lampiran gambar tidak didukung dalam kompilasi)', pageWidth / 2, currentY + 20, { align: 'center' });
              }
            } else {
              doc.setFillColor(249, 250, 251);
              doc.rect(margin + 10, currentY, contentWidth - 20, 45, 'F');
              doc.setLineWidth(0.2);
              doc.setDrawColor(209, 213, 219);
              doc.rect(margin + 10, currentY, contentWidth - 20, 45, 'D');

              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9.5);
              doc.setTextColor(75, 85, 99);
              doc.text('Dokumen Bukti Kas Non-Gambar (PDF/Lainnya)', pageWidth / 2, currentY + 18, { align: 'center' });
              
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(8);
              doc.setTextColor(156, 163, 175);
              doc.text('Unduh berkas bukti kas ini secara langsung dari dasbor riwayat transaksi.', pageWidth / 2, currentY + 26, { align: 'center' });
            }
          });
        }
      }

      // Save compiled PDF file
      doc.save(fileName);
      setIsGeneratingPDF(false);
    } catch (pdfErr) {
      console.error("Programmatic PDF generation error:", pdfErr);
      setIsGeneratingPDF(false);
      alert("Gagal menyusun dokumen PDF secara programatik.");
    }
  };

  // Memoized attachments count for the current filtered list
  const attachmentsCount = useMemo(() => {
    return processedTransactions.filter(tx => tx.attachment).length;
  }, [processedTransactions]);

  // Bulk download of all filtered attachments helper
  const handleDownloadAllSelectedAttachments = () => {
    const withAttachments = processedTransactions.filter(tx => tx.attachment);
    if (withAttachments.length === 0) {
      alert("Tidak ada lampiran dokumen untuk laporan periode ini.");
      return;
    }
    withAttachments.forEach((tx, idx) => {
      if (tx.attachment) {
        // Build a consistent, clean filename
        const cleanDesc = tx.deskripsi.replace(/[^a-zA-Z0-9]/g, '_');
        const formattedDate = tx.tanggal.replace(/\//g, '-');
        const indexSuffix = withAttachments.length > 1 ? `_(${idx + 1})` : '';
        const fileName = `Bukti_${formattedDate}_${cleanDesc}${indexSuffix}_${tx.attachment.name}`;
        
        // Delay multiple downloads slightly to ensure browser downloads them sequentially without blocking
        setTimeout(() => {
          downloadAttachment(fileName, tx.attachment!.data);
        }, idx * 250);
      }
    });
  };

  // Check if any transaction has an attachment in the overall dataset
  const hasAnyAttachments = useMemo(() => {
    return transactions.some(tx => tx.attachment);
  }, [transactions]);

  // Quick stats computed for filtered list
  const filteredIncome = processedTransactions.reduce((acc, curr) => acc + (curr.pemasukan || 0), 0);
  const filteredSpent = processedTransactions.reduce((acc, curr) => acc + (curr.pengeluaran || 0), 0);

  return (
    <>
      {/* Interactive Main View - hidden on print */}
      <div className="space-y-6 print:hidden">
        
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">Riwayat Transaksi</h1>
            
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenPrintModal}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-500/20 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer select-none"
              title="Ekspor laporan buku kas lengkap ke format PDF"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>Unduh Laporan (PDF)</span>
            </button>

            {hasAnyAttachments && (
              <button
                onClick={handleOpenAttachmentModal}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 border border-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] shrink-0 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] cursor-pointer select-none"
                title="Cetak seluruh file bukti pendukung terlampir dalam format dokumen PDF"
              >
                <FileDown className="w-4 h-4 text-white" />
                <span>Unduh Lampiran (PDF)</span>
              </button>
            )}
          </div>
        </div>

        {editNotif && (
          <div className="bg-emerald-950/20 border border-emerald-500/30 px-4 py-3.5 rounded-2xl text-xs font-bold text-emerald-400 flex items-center space-x-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1" />
            <span>{editNotif}</span>
          </div>
        )}



      {/* Control bar / Filters */}
      <div className="bg-[#111425] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        {/* Row 1: Search, basic categorizations, and sorting */}
        <div className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari deskripsi, tanggal (DD/MM/YYYY) atau nomor..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/20 bg-[#0a0c18] text-slate-150 placeholder-slate-500"
            />
          </div>

          {/* Quick Buttons for Pemasukan / Pengeluaran */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Type Filter */}
            <div className="flex items-center bg-[#0a0c18] p-1 rounded-xl border border-slate-800/80">
              <button
                onClick={() => { setFilterType('all'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'all' ? 'filter-tab-all-active shadow-sm' : 'filter-tab-all-inactive'
                }`}
              >
                Semua ({transactions.length})
              </button>
              <button
                onClick={() => { setFilterType('pemasukan'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'pemasukan' ? 'filter-tab-pemasukan-active shadow-sm' : 'filter-tab-pemasukan-inactive'
                }`}
              >
                Pemasukan
              </button>
              <button
                onClick={() => { setFilterType('pengeluaran'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'pengeluaran' ? 'filter-tab-pengeluaran-active shadow-sm' : 'filter-tab-pengeluaran-inactive'
                }`}
              >
                Pengeluaran
              </button>
            </div>

            {/* Sort selection order */}
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center space-x-1.5 bg-[#0a0c18] hover:bg-slate-850 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 border border-slate-800 transition-all cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Urutan: {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}</span>
            </button>
          </div>

        </div>

        {/* Separator boundary */}
        <div className="border-t border-slate-800/40 my-1"></div>

        {/* Row 2: Advanced Dynamic Filters for Year, Month, and Date Ranges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Dynamic Annual Selector */}
          <div className="space-y-1.5">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Filter Tahunan
            </span>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-all cursor-pointer appearance-none"
              >
                <option value="all">Semua Tahun</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year} M</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500 text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Dynamic Monthly Selector */}
          <div className="space-y-1.5">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Filter Bulanan
            </span>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-all cursor-pointer appearance-none"
              >
                <option value="all">Semua Bulan</option>
                {INDONESIAN_MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500 text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Date Picker - Start Date */}
          <div className="space-y-1.5">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>Dari Tanggal</span>
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
              onFocus={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
              className="w-full text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-all cursor-pointer"
            />
          </div>

          {/* Date Picker - End Date */}
          <div className="space-y-1.5">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>Sampai Tanggal</span>
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
              onFocus={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
              className="w-full text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-all cursor-pointer"
            />
          </div>

        </div>

        {/* Global Filter Cleaners Indicator */}
        {(searchTerm || filterType !== 'all' || selectedYear !== 'all' || selectedMonth !== 'all' || startDate || endDate) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-2 border-t border-slate-800/40 text-xs">
            <div className="text-slate-400 font-semibold flex items-center space-x-1">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>Penyaringan aktif membatasi visualisasi catatan transaksi.</span>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setSelectedYear('all');
                setSelectedMonth('all');
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
              className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/20 bg-[#0a0c18] hover:bg-rose-500/10 text-slate-350 hover:text-rose-450 text-[11px] font-black tracking-wide transition-all cursor-pointer self-end sm:self-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hapus Semua Filter</span>
            </button>
          </div>
        )}

      </div>

      {/* Filter Stats Bar */}
      {(searchTerm || filterType !== 'all' || selectedYear !== 'all' || selectedMonth !== 'all' || startDate || endDate) ? (
        <div className="bg-emerald-950/25 border border-emerald-500/20 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-200">
          <div>
            Ditemukan <strong className="text-emerald-400">{processedTransactions.length}</strong> transaksi dari hasil filter.
          </div>
          <div className="space-x-4">
            <span>Total Masuk: <strong className="text-emerald-400">{formatRupiah(filteredIncome)}</strong></span>
            <span>Total Keluar: <strong className="text-rose-400">{formatRupiah(filteredSpent)}</strong></span>
          </div>
        </div>
      ) : null}

      {/* Main Table for DESKTOP / Cards for MOBILE */}
      <div ref={tableContainerRef} className="bg-[#111425] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-table-header text-table-header-text font-black text-xs uppercase tracking-wider border-b border-table-border">
                <th className="py-4 px-5 text-center font-bold w-16">No</th>
                <th className="py-4 px-4 w-32 border-l border-table-border-subtle">Tanggal</th>
                <th className="py-4 px-6 border-l border-table-border-subtle">Deskripsi</th>
                <th className="py-4 px-4 text-center border-l border-table-border-subtle w-28">Bukti</th>
                <th className="py-4 px-6 text-right border-l border-table-border-subtle">Pemasukan</th>
                <th className="py-4 px-6 text-right border-l border-table-border-subtle">Pengeluaran</th>
                <th className="py-4 px-6 text-right bg-table-saldo-header text-table-saldo-header-text font-bold w-44 border-l border-table-border-subtle">Saldo</th>
                {isAdministrator && (
                  <th className="py-4 px-1.5 text-center border-l border-table-border-subtle w-16 text-slate-400 font-bold text-[11px]">
                    Kelola
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-table-border">
              {paginatedTransactions.map((tx, index) => {
                const isSelected = selectedTxNo === tx.no;
                return (
                  <tr 
                    key={`tx-desktop-${tx.no}-${index}`} 
                    onClick={() => {
                      if (isAdministrator) {
                        setSelectedTxNo(isSelected ? null : tx.no);
                      }
                    }}
                    className={`transition-colors ${
                      isAdministrator ? 'cursor-pointer select-none' : ''
                    } ${
                      isSelected 
                        ? 'bg-amber-500/5 hover:bg-amber-500/10 border-l-4 border-l-amber-500 font-semibold' 
                        : index % 2 === 1 
                          ? 'bg-table-row-odd bg-table-row-hover' 
                          : 'bg-table-row-even bg-table-row-hover'
                    }`}
                  >
                    <td className="py-3.5 px-5 text-center font-mono text-slate-400 text-xs font-semibold">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-xs font-semibold border-l border-table-border-subtle">
                      {formatDateOnly(tx.tanggal)}
                    </td>
                    <td className="py-3.5 px-6 text-sm font-bold text-white border-l border-table-border-subtle">
                      <span className="block truncate max-w-sm" title={tx.deskripsi}>
                        {tx.deskripsi}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center border-l border-table-border-subtle">
                      {tx.attachment ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const cleanDesc = tx.deskripsi.replace(/[^a-zA-Z0-9]/g, '_');
                            const formattedDate = tx.tanggal.replace(/\//g, '-');
                            const fileName = `Bukti_${formattedDate}_${cleanDesc}_${tx.attachment?.name}`;
                            downloadAttachment(fileName, tx.attachment?.data || '');
                          }}
                          className="inline-flex items-center space-x-1 py-1 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 rounded text-[10px] font-bold text-emerald-400 hover:text-emerald-350 cursor-pointer select-none transition-colors"
                          title="Unduh Berkas Bukti / Nota"
                        >
                          <FileDown className="w-3.5 h-3.5 shrink-0" />
                          <span>Unduh</span>
                        </button>
                      ) : (
                        <span className="text-slate-600 font-mono text-xs font-semibold">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-xs font-extrabold text-emerald-400 border-l border-table-border-subtle">
                      {tx.pemasukan ? formatRupiah(tx.pemasukan) : '-'}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-xs font-extrabold text-rose-400 border-l border-table-border-subtle">
                      {tx.pengeluaran ? formatRupiah(tx.pengeluaran) : '-'}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-xs font-black bg-table-saldo text-table-saldo-text border-l border-table-border-highlight">
                      {formatRupiah(tx.saldo)}
                    </td>
                    {isAdministrator && (
                      <td className="py-3.5 px-1.5 text-center border-l border-slate-800/20 w-16">
                        {isSelected ? (
                          <div className="inline-flex items-center gap-1.5 justify-center animate-in fade-in zoom-in duration-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditTanggal(convertIndonesianDateToISO(tx.tanggal));
                                setEditDeskripsi(tx.deskripsi);
                                setEditTipe(tx.pemasukan ? 'pemasukan' : 'pengeluaran');
                                setEditJumlah(String(tx.pemasukan || tx.pengeluaran || ''));
                                setEditFile(tx.attachment || null);
                                setEditFormError(null);
                                setShowEditModal(true);
                              }}
                              className="p-1 px-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-400 rounded-md transition-all cursor-pointer select-none"
                              title="Ubah Transaksi ini"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTxNo(tx.no);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-1 px-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-400 rounded-md transition-all cursor-pointer select-none"
                              title="Hapus Transaksi secara permanen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-600 font-mono text-xs">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan={isAdministrator ? 8 : 7} className="py-12 text-center text-slate-500 font-medium">
                    Belum ada transaksi masukan untuk filter yang dipilih
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card List */}
        <div className="block md:hidden divide-y divide-slate-800/50">
          {paginatedTransactions.map((tx, index) => {
            const isSelected = selectedTxNo === tx.no;
            return (
              <div 
                key={`tx-mobile-${tx.no}-${index}`} 
                onClick={() => {
                  if (isAdministrator) {
                    setSelectedTxNo(isSelected ? null : tx.no);
                  }
                }}
                className={`p-4 space-y-2.5 transition-colors relative cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/10 border-l-4 border-l-amber-500 font-semibold'
                    : 'hover:bg-[#111425]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono bg-[#0a0c18] border border-slate-800 px-2 py-0.5 rounded font-bold text-slate-400">
                      Trans #{(currentPage - 1) * itemsPerPage + index + 1}
                    </span>
                    {isAdministrator && (
                      <span>
                        {isSelected ? (
                          <span className="inline-flex items-center space-x-1 py-0.5 px-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] font-black uppercase rounded animate-pulse">
                            <span>Terpilih⚙️</span>
                          </span>
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full border border-slate-700 bg-transparent" />
                        )}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    {parseAndFormatDate(tx.tanggal)}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-white leading-tight">{tx.deskripsi}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/10 text-xs">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {tx.pemasukan && (
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        Pemasukan
                      </span>
                    )}
                    {tx.pengeluaran && (
                      <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                        Pengeluaran
                      </span>
                    )}
                    {tx.attachment && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const cleanDesc = tx.deskripsi.replace(/[^a-zA-Z0-9]/g, '_');
                          const formattedDate = tx.tanggal.replace(/\//g, '-');
                          const fileName = `Bukti_${formattedDate}_${cleanDesc}_${tx.attachment?.name}`;
                          downloadAttachment(fileName, tx.attachment?.data || '');
                        }}
                        className="inline-flex items-center space-x-1 py-0.5 px-1.5 bg-blue-500/10 border border-blue-500/20 rounded font-bold text-[9px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        title="Unduh Bukti"
                      >
                        <FileDown className="w-2.5 h-2.5 shrink-0" />
                        <span>Sertifikat/File</span>
                      </button>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className={`font-mono font-extrabold text-xs mb-0.5 ${tx.pemasukan ? 'text-emerald-450' : 'text-rose-450'}`}>
                      {tx.pemasukan ? '+' : '-'}{formatRupiah(tx.pemasukan || tx.pengeluaran)}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {isAdministrator && isSelected && (
                        <div className="flex items-center gap-1.5 mr-1 animate-in fade-in slide-in-from-right duration-250">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditTanggal(convertIndonesianDateToISO(tx.tanggal));
                              setEditDeskripsi(tx.deskripsi);
                              setEditTipe(tx.pemasukan ? 'pemasukan' : 'pengeluaran');
                              setEditJumlah(String(tx.pemasukan || tx.pengeluaran || ''));
                              setEditFile(tx.attachment || null);
                              setEditFormError(null);
                              setShowEditModal(true);
                            }}
                            className="p-1 px-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-400 rounded-md transition-all cursor-pointer select-none"
                            title="Ubah Transaksi ini"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTxNo(tx.no);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-1 px-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-400 rounded-md transition-all cursor-pointer select-none"
                            title="Hapus Transaksi secara permanen"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <p className="text-[10px] font-mono text-amber-300 font-bold bg-[#0a0c18] px-2 py-0.5 rounded border border-slate-800">
                        Saldo: {formatRupiah(tx.saldo)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {paginatedTransactions.length === 0 && (
            <div className="py-12 text-center text-slate-500 font-medium text-xs font-semibold">
              Belum ada data transaksi masukan
            </div>
          )}
        </div>

        {/* Table/Card Footer with Pagination controls */}
        <div className="bg-[#0a0c18] px-5 py-4 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="font-semibold text-slate-400 text-center sm:text-left">
            Menampilkan <strong className="text-white">{Math.min(processedTransactions.length, (currentPage - 1) * itemsPerPage + 1)}</strong> - <strong className="text-white">{Math.min(processedTransactions.length, currentPage * itemsPerPage)}</strong> dari <strong className="text-white">{processedTransactions.length}</strong> transaksi
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-850 bg-[#111425] hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center space-x-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[28px] h-7 rounded px-1.5 text-xs font-bold transition-all ${
                      currentPage === page 
                        ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                        : 'border border-transparent text-slate-450 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-850 bg-[#111425] hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>

    </div>

      {/* Configuration backdrop modal for: Cetak Transaksi (PDF) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200" id="print-modal-container">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#111425] to-[#0c0e1b] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div className="flex items-center space-x-2.5">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white tracking-tight">Cetak Transaksi (PDF)</h3>
              </div>
              <button 
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              Atur saringan transaksi yang ingin dicetak ke dalam laporan buku kas fisik PDF. Anda juga dapat memilih opsi untuk mengunduh semua berkas lampiran pendukungnya.
            </p>

            {/* Filter Mode Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#0a0c18] border border-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setPrintFilterType('month_year')}
                className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer select-none ${
                  printFilterType === 'month_year'
                    ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'text-slate-450 hover:text-slate-205'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Bulan & Tahun</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFilterType('range')}
                className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer select-none ${
                  printFilterType === 'range'
                    ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                    : 'text-slate-450 hover:text-slate-205'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Rentang Tanggal</span>
              </button>
            </div>

            {/* Inputs based on selected tab mode */}
            <div className="space-y-4">
              {printFilterType === 'month_year' ? (
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Month Selector dropdown */}
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Pilih Bulan</span>
                    <div className="relative">
                      <select
                        value={modalSelectedMonth}
                        onChange={(e) => handleModalMonthChange(e.target.value, modalSelectedYear)}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-all cursor-pointer appearance-none"
                      >
                        <option value="all">Semua Bulan</option>
                        {INDONESIAN_MONTHS.map(m => (
                          <option key={m.value} value={m.value}>{m.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Year Selector dropdown */}
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Pilih Tahun</span>
                    <div className="relative">
                      <select
                        value={modalSelectedYear}
                        onChange={(e) => handleModalYearChange(modalSelectedMonth, e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-all cursor-pointer appearance-none"
                      >
                        <option value="all">Semua Tahun</option>
                        {availableYears.map(year => (
                          <option key={year} value={year}>{year} M</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal Mulai</span>
                    <input
                      type="date"
                      value={modalStartDate}
                      onChange={(e) => setModalStartDate(e.target.value)}
                      onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
                      onFocus={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal Selesai</span>
                    <input
                      type="date"
                      value={modalEndDate}
                      onChange={(e) => setModalEndDate(e.target.value)}
                      onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
                      onFocus={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-emerald-500/80 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Checkbox: Unduh lampiran secara bersamaan */}
              {hasAnyAttachments && (
                <label className="flex items-start space-x-3 p-3.5 bg-[#0a0c18]/80 border border-slate-800/60 rounded-xl cursor-pointer hover:bg-[#0c0e1e] transition-all group">
                  <input
                    type="checkbox"
                    checked={modalDownloadAttachments}
                    onChange={(e) => setModalDownloadAttachments(e.target.checked)}
                    className="mt-0.5 rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950 w-4 h-4 cursor-pointer"
                  />
                  <div className="space-y-0.5 select-none">
                    <span className="block text-xs font-black text-slate-200 group-hover:text-white transition-colors">
                      Unduh Lampiran Bukti Secara Bersamaan
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-400">
                      Otomatis mengunduh semua file pendukung (nota/kuitansi/struk) dalam saringan terpilih secara bersamaan.
                    </span>
                  </div>
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-800/50 font-sans">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 transition-colors cursor-pointer select-none"
              >
                Batal
              </button>
              
              {/* Optional Manual Browser print trigger */}
              <button
                type="button"
                onClick={() => {
                  setStartDate(modalStartDate);
                  setEndDate(modalEndDate);
                  setSelectedMonth(printFilterType === 'month_year' ? modalSelectedMonth : 'all');
                  setSelectedYear(printFilterType === 'month_year' ? modalSelectedYear : 'all');
                  setPrintMode('all');
                  setShowPrintModal(false);

                  // Trigger download of attachments if checked
                  if (modalDownloadAttachments && hasAnyAttachments) {
                    const rangeFiltered = transactions.filter(tx => {
                      const parsed = parseDateParts(tx.tanggal);
                      if (parsed !== null) {
                        const txDate = new Date(parseInt(parsed.year, 10), parsed.month, parsed.day, 12, 0, 0, 0);
                        if (modalStartDate) {
                          const startParts = modalStartDate.split('-');
                          const sDate = new Date(parseInt(startParts[0], 10), parseInt(startParts[1], 10) - 1, parseInt(startParts[2], 10), 0, 0, 0, 0);
                          if (txDate.getTime() < sDate.getTime()) return false;
                        }
                        if (modalEndDate) {
                          const endParts = modalEndDate.split('-');
                          const eDate = new Date(parseInt(endParts[0], 10), parseInt(endParts[1], 10) - 1, parseInt(endParts[2], 10), 23, 59, 59, 999);
                          if (txDate.getTime() > eDate.getTime()) return false;
                        }
                        return true;
                      }
                      return false;
                    });

                    const withAttachments = rangeFiltered.filter(tx => tx.attachment);
                    if (withAttachments.length > 0) {
                      withAttachments.forEach((tx, idx) => {
                        if (tx.attachment) {
                          const cleanDesc = tx.deskripsi.replace(/[^a-zA-Z0-9]/g, '_');
                          const formattedDate = tx.tanggal.replace(/\//g, '-');
                          const indexSuffix = withAttachments.length > 1 ? `_(${idx + 1})` : '';
                          const fileName = `Bukti_${formattedDate}_${cleanDesc}${indexSuffix}_${tx.attachment.name}`;
                          setTimeout(() => {
                            downloadAttachment(fileName, tx.attachment!.data);
                          }, idx * 250);
                        }
                      });
                    }
                  }

                  setTimeout(() => {
                    window.focus();
                    window.print();
                  }, 500);
                }}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#111425] hover:bg-slate-800 text-slate-350 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer select-none"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Cetak Manual</span>
              </button>

              {/* Direct PDF Downloader (Primary Action) */}
              <button
                type="button"
                onClick={() => {
                  const exportTargetMonth = printFilterType === 'month_year' ? modalSelectedMonth : 'all';
                  const exportTargetYear = printFilterType === 'month_year' ? modalSelectedYear : 'all';

                  // Dynamic calculation of exactly which transactions to print
                  const rangeFiltered = transactions.filter(tx => {
                    const parsed = parseDateParts(tx.tanggal);
                    if (parsed !== null) {
                      const txDate = new Date(parseInt(parsed.year, 10), parsed.month, parsed.day, 12, 0, 0, 0);
                      
                      if (printFilterType === 'month_year') {
                        if (exportTargetYear !== 'all' && parsed.year !== exportTargetYear) return false;
                        if (exportTargetMonth !== 'all') {
                          const monthStr = String(parsed.month + 1).padStart(2, '0');
                          if (monthStr !== exportTargetMonth) return false;
                        }
                      } else {
                        if (modalStartDate) {
                          const startParts = modalStartDate.split('-');
                          const sDate = new Date(parseInt(startParts[0], 10), parseInt(startParts[1], 10) - 1, parseInt(startParts[2], 10), 0, 0, 0, 0);
                          if (txDate.getTime() < sDate.getTime()) return false;
                        }
                        if (modalEndDate) {
                          const endParts = modalEndDate.split('-');
                          const eDate = new Date(parseInt(endParts[0], 10), parseInt(endParts[1], 10) - 1, parseInt(endParts[2], 10), 23, 59, 59, 999);
                          if (txDate.getTime() > eDate.getTime()) return false;
                        }
                      }
                      return true;
                    }
                    return false;
                  });

                  // Preserve selected sorting order
                  rangeFiltered.sort((a, b) => {
                    return sortOrder === 'desc' ? b.no - a.no : a.no - b.no;
                  });

                  setStartDate(modalStartDate);
                  setEndDate(modalEndDate);
                  setSelectedMonth(exportTargetMonth);
                  setSelectedYear(exportTargetYear);
                  setPrintMode('all');
                  setShowPrintModal(false);

                  // Trigger download of attachments if checked
                  if (modalDownloadAttachments && hasAnyAttachments) {
                    const withAttachments = rangeFiltered.filter(tx => tx.attachment);
                    if (withAttachments.length > 0) {
                      withAttachments.forEach((tx, idx) => {
                        if (tx.attachment) {
                          const cleanDesc = tx.deskripsi.replace(/[^a-zA-Z0-9]/g, '_');
                          const formattedDate = tx.tanggal.replace(/\//g, '-');
                          const indexSuffix = withAttachments.length > 1 ? `_(${idx + 1})` : '';
                          const fileName = `Bukti_${formattedDate}_${cleanDesc}${indexSuffix}_${tx.attachment.name}`;
                          setTimeout(() => {
                            downloadAttachment(fileName, tx.attachment!.data);
                          }, idx * 250);
                        }
                      });
                    }
                  }

                  setTimeout(() => {
                    const cleanStart = modalStartDate ? modalStartDate.replace(/-/g, '') : 'Semua';
                    const cleanEnd = modalEndDate ? modalEndDate.replace(/-/g, '') : 'Semua';
                    const fileName = `Laporan_Kas_Musholla_Al_Falah_${cleanStart}_s.d_${cleanEnd}.pdf`;
                    handleExportPDF(
                      fileName,
                      rangeFiltered,
                      modalStartDate,
                      modalEndDate,
                      exportTargetMonth,
                      exportTargetYear,
                      'all'
                    );
                  }, 600);
                }}
                className="flex items-center space-x-1.5 px-4.5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-[#10b981] text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer select-none"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Unduh Laporan (PDF)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Configuration backdrop modal for: Unduh Lampiran (PDF) */}
      {showAttachmentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200" id="attachment-modal-container">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#111425] to-[#0c0e1b] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center space-x-2.5">
                <FileDown className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-black text-white tracking-tight">Unduh Lampiran (PDF)</h3>
              </div>
              <button 
                onClick={() => setShowAttachmentModal(false)}
                className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              Kompilasi dan cetak seluruh arsip berkas fisik bukti transaksi (nota, kuitansi, struk fisik) ke dalam format dokumen PDF berkelanjutan berdasarkan saringan pilihan Anda.
            </p>

            {/* Filter Mode Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#0a0c18] border border-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setPrintFilterType('month_year')}
                className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer select-none ${
                  printFilterType === 'month_year'
                    ? 'bg-blue-650 text-white shadow-[0_0_10px_rgba(59,130,246,0.25)]'
                    : 'text-slate-450 hover:text-slate-205'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Bulan & Tahun</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFilterType('range')}
                className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer select-none ${
                  printFilterType === 'range'
                    ? 'bg-blue-650 text-white shadow-[0_0_10px_rgba(59,130,246,0.25)]'
                    : 'text-slate-450 hover:text-slate-205'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Rentang Tanggal</span>
              </button>
            </div>

            {/* Inputs based on selection */}
            <div className="space-y-4">
              {printFilterType === 'month_year' ? (
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Month Selector */}
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Pilih Bulan</span>
                    <div className="relative">
                      <select
                        value={modalSelectedMonth}
                        onChange={(e) => handleModalMonthChange(e.target.value, modalSelectedYear)}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-blue-500/80 transition-all cursor-pointer appearance-none"
                      >
                        <option value="all">Semua Bulan</option>
                        {INDONESIAN_MONTHS.map(m => (
                          <option key={m.value} value={m.value}>{m.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Year Selector */}
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Pilih Tahun</span>
                    <div className="relative">
                      <select
                        value={modalSelectedYear}
                        onChange={(e) => handleModalYearChange(modalSelectedMonth, e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-blue-500/80 transition-all cursor-pointer appearance-none"
                      >
                        <option value="all">Semua Tahun</option>
                        {availableYears.map(year => (
                          <option key={year} value={year}>{year} M</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal Mulai</span>
                    <input
                      type="date"
                      value={modalStartDate}
                      onChange={(e) => setModalStartDate(e.target.value)}
                      onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
                      onFocus={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-blue-500/80 transition-all cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal Selesai</span>
                    <input
                      type="date"
                      value={modalEndDate}
                      onChange={(e) => setModalEndDate(e.target.value)}
                      onClick={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
                      onFocus={(e) => { try { (e.currentTarget as any).showPicker(); } catch (err) {} }}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-blue-500/80 transition-all cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-800/40">
              <button
                type="button"
                onClick={() => setShowAttachmentModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 transition-colors cursor-pointer select-none"
              >
                Batal
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const rangeFiltered = transactions.filter(tx => {
                    const parsed = parseDateParts(tx.tanggal);
                    if (parsed !== null) {
                      const txDate = new Date(parseInt(parsed.year, 10), parsed.month, parsed.day, 12, 0, 0, 0);
                      if (modalStartDate) {
                        const startParts = modalStartDate.split('-');
                        const sDate = new Date(parseInt(startParts[0], 10), parseInt(startParts[1], 10) - 1, parseInt(startParts[2], 10), 0, 0, 0, 0);
                        if (txDate.getTime() < sDate.getTime()) return false;
                      }
                      if (modalEndDate) {
                        const endParts = modalEndDate.split('-');
                        const eDate = new Date(parseInt(endParts[0], 10), parseInt(endParts[1], 10) - 1, parseInt(endParts[2], 10), 23, 59, 59, 999);
                        if (txDate.getTime() > eDate.getTime()) return false;
                      }
                      return true;
                    }
                    return false;
                  });

                  const hasFiles = rangeFiltered.some(tx => tx.attachment);
                  if (!hasFiles) {
                    alert("Tidak ada berkas bukti lampiran diarsipkan dalam saringan terpilih!");
                    return;
                  }

                  setStartDate(modalStartDate);
                  setEndDate(modalEndDate);
                  setSelectedMonth(printFilterType === 'month_year' ? modalSelectedMonth : 'all');
                  setSelectedYear(printFilterType === 'month_year' ? modalSelectedYear : 'all');
                  setPrintMode('attachments_only');
                  setShowAttachmentModal(false);

                  setTimeout(() => {
                    window.focus();
                    window.print();
                  }, 500);
                }}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#111425] hover:bg-slate-800 text-slate-350 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer select-none"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Cetak Manual</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const exportTargetMonth = printFilterType === 'month_year' ? modalSelectedMonth : 'all';
                  const exportTargetYear = printFilterType === 'month_year' ? modalSelectedYear : 'all';

                  const rangeFiltered = transactions.filter(tx => {
                    const parsed = parseDateParts(tx.tanggal);
                    if (parsed !== null) {
                      const txDate = new Date(parseInt(parsed.year, 10), parsed.month, parsed.day, 12, 0, 0, 0);
                      
                      if (printFilterType === 'month_year') {
                        if (exportTargetYear !== 'all' && parsed.year !== exportTargetYear) return false;
                        if (exportTargetMonth !== 'all') {
                          const monthStr = String(parsed.month + 1).padStart(2, '0');
                          if (monthStr !== exportTargetMonth) return false;
                        }
                      } else {
                        if (modalStartDate) {
                          const startParts = modalStartDate.split('-');
                          const sDate = new Date(parseInt(startParts[0], 10), parseInt(startParts[1], 10) - 1, parseInt(startParts[2], 10), 0, 0, 0, 0);
                          if (txDate.getTime() < sDate.getTime()) return false;
                        }
                        if (modalEndDate) {
                          const endParts = modalEndDate.split('-');
                          const eDate = new Date(parseInt(endParts[0], 10), parseInt(endParts[1], 10) - 1, parseInt(endParts[2], 10), 23, 59, 59, 999);
                          if (txDate.getTime() > eDate.getTime()) return false;
                        }
                      }
                      return true;
                    }
                    return false;
                  });

                  // Preserve selected sorting order
                  rangeFiltered.sort((a, b) => {
                    return sortOrder === 'desc' ? b.no - a.no : a.no - b.no;
                  });

                  const hasFiles = rangeFiltered.some(tx => tx.attachment);
                  if (!hasFiles) {
                    alert("Tidak ada berkas bukti lampiran diarsipkan dalam saringan terpilih!");
                    return;
                  }

                  // Apply range dates & set printMode
                  setStartDate(modalStartDate);
                  setEndDate(modalEndDate);
                  setSelectedMonth(exportTargetMonth);
                  setSelectedYear(exportTargetYear);
                  setPrintMode('attachments_only');
                  setShowAttachmentModal(false);

                  // Trigger direct compiler with passed subsets
                  setTimeout(() => {
                    const cleanStart = modalStartDate ? modalStartDate.replace(/-/g, '') : 'Semua';
                    const cleanEnd = modalEndDate ? modalEndDate.replace(/-/g, '') : 'Semua';
                    const fileName = `Kompilasi_Lampiran_Bukti_${cleanStart}_s.d_${cleanEnd}.pdf`;
                    handleExportPDF(
                      fileName,
                      rangeFiltered,
                      modalStartDate,
                      modalEndDate,
                      exportTargetMonth,
                      exportTargetYear,
                      'attachments_only'
                    );
                  }, 600);
                }}
                className="flex items-center space-x-1.5 px-4.5 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] cursor-pointer select-none"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Unduh Sebagai PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Printable Area - Hidden on screen, visible only on print */}
      <div className="hidden print:block bg-white text-black p-8 font-sans w-full max-w-4xl mx-auto" id="print-area">
        
        {printMode === 'all' ? (
          <>
            {/* Elegant Institutional Kop Surat Banner */}
            <div className="w-full bg-[#0b1c2d] text-center py-6 px-4 rounded-xl relative overflow-hidden shadow-md flex flex-col items-center justify-center mb-6">
              {/* Central Golden Dome & Crescent Icon */}
              <div className="relative w-16 h-12 flex items-center justify-center text-[#d4a555] mb-1">
                {/* Crescent Moon */}
                <span className="absolute text-4xl select-none leading-none -translate-x-3 -translate-y-2.5 rotate-[-15deg] font-serif">☾</span>
                {/* Dome Outline */}
                <svg className="w-10 h-10 -translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3,19 L21,19" />
                  <path d="M4,19 C4,12 8,8 12,8 C16,8 20,12 20,19" />
                  <path d="M7,19 C7,14 9.5,11.5 12,11.5 C14.5,11.5 17,14 17,19" />
                  <path d="M12,8 L12,4" />
                  <circle cx="12" cy="3.5" r="0.6" fill="currentColor" />
                </svg>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-xl font-extrabold tracking-[0.1em] uppercase text-[#d4a555] font-sans m-0 leading-tight">
                DKM AL-FALAH
              </h1>
              <p className="text-[10px] text-[#dcd2be] font-bold mt-1.5 mb-0 max-w-xl leading-normal font-sans">
                Perumahan Victoria Permai, Babelan Kota, Babelan, Bekasi 17610
              </p>

              {/* Decorative Divider */}
              <div className="w-full max-w-lg flex items-center justify-between mt-3.5 text-[#d4a555] font-sans px-4">
                <span className="text-[7px] opacity-90">◆</span>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#d4a555] to-transparent mx-2"></div>
                <span className="text-[9px] mx-1">◆</span>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#d4a555] to-transparent mx-2"></div>
                <span className="text-[7px] opacity-90">◆</span>
              </div>
            </div>

            {/* Laporan Title */}
            <div className="text-center my-6 space-y-1">
              <h2 className="text-lg font-extrabold tracking-tight text-black uppercase">Laporan Keuangan Kas Buku Besar</h2>
              <p className="text-xs font-bold text-neutral-700">
                {selectedYear !== 'all' || selectedMonth !== 'all' || startDate || endDate ? (
                  <span>
                    Periode: {selectedMonth !== 'all' ? `${INDONESIAN_MONTHS.find(m => m.value === selectedMonth)?.name} ` : ''}
                    {selectedYear !== 'all' ? `${selectedYear} ` : ''}
                    {startDate || endDate ? `(${startDate ? formatDateOnly(startDate) : ''} s.d ${endDate ? formatDateOnly(endDate) : ''})` : ''}
                  </span>
                ) : (
                  <span>Periode: Semua Riwayat Transaksi</span>
                )}
              </p>
              <p className="text-[10px] text-neutral-500 font-mono">
                Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
              </p>
            </div>

            {/* Financial Overview (Re-calculated for ALL filtered transactions, not just paginated) */}
            <div className="grid grid-cols-3 gap-4 border border-black rounded-lg p-4 mb-6 bg-neutral-50">
              <div className="text-center py-2 border-r border-neutral-300">
                <span className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Total Pemasukan Kas
                </span>
                <span className="text-xs font-extrabold text-emerald-700 font-mono">
                  {formatRupiah(filteredIncome)}
                </span>
              </div>
              <div className="text-center py-2 border-r border-neutral-300">
                <span className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Total Pengeluaran Kas
                </span>
                <span className="text-xs font-extrabold text-rose-700 font-mono">
                  {formatRupiah(filteredSpent)}
                </span>
              </div>
              <div className="text-center py-2">
                <span className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Saldo Akhir Periode
                </span>
                <span className="text-xs font-black text-blue-700 font-mono">
                  {formatRupiah(filteredIncome - filteredSpent)}
                </span>
              </div>
            </div>

            {/* Complete Filtered Transactions Table (All rows, no pagination) */}
            <table className="w-full text-left border border-collapse border-neutral-400 text-[11px]">
              <thead>
                <tr className="bg-neutral-100 text-neutral-800 font-bold border-b border-neutral-400">
                  <th className="py-2 px-3 text-center border-r border-neutral-400 w-12 text-black">No</th>
                  <th className="py-2 px-3 border-r border-neutral-400 w-24 text-black">Tanggal</th>
                  <th className="py-2 px-3 border-r border-neutral-400 text-black">Deskripsi / Keperluan</th>
                  <th className="py-2 px-2 text-center border-r border-neutral-400 w-16 text-black">Bukti</th>
                  <th className="py-2 px-3 text-right border-r border-neutral-300 font-mono text-emerald-700 font-bold">Pemasukan (Rp)</th>
                  <th className="py-2 px-3 text-right border-r border-neutral-300 font-mono text-rose-700 font-bold">Pengeluaran (Rp)</th>
                  <th className="py-2 px-3 text-right w-30 bg-neutral-50 font-bold text-black border-l border-neutral-300">Saldo Akhir (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300 text-black">
                {processedTransactions.map((tx, idx) => (
                  <tr key={`print-row-${tx.no}-${idx}`} className="hover:bg-neutral-100/50">
                    <td className="py-2 px-3 text-center border-r border-neutral-300 font-mono font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-neutral-300 font-mono">
                      {formatDateOnly(tx.tanggal)}
                    </td>
                    <td className="py-2 px-3 border-r border-neutral-300 font-medium">
                      {tx.deskripsi}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-neutral-300 font-semibold text-neutral-600 font-mono">
                      {tx.attachment ? 'Ada' : '-'}
                    </td>
                    <td className="py-2 px-3 text-right border-r border-neutral-300 font-mono text-emerald-750 font-medium">
                      {tx.pemasukan ? formatRupiah(tx.pemasukan) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right border-r border-neutral-300 font-mono text-rose-750 font-medium">
                      {tx.pengeluaran ? formatRupiah(tx.pengeluaran) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono bg-neutral-50 font-semibold border-l border-neutral-300">
                      {formatRupiah(tx.saldo)}
                    </td>
                  </tr>
                ))}
                {processedTransactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500 italic">
                      Tidak ada transaksi kas yang sesuai dengan filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Tanda Tangan / Keabsahan Dokumen (Official Signatures) */}
            <div className="grid grid-cols-2 gap-12 mt-12 text-center text-xs text-black page-break-inside-avoid break-inside-avoid">
              <div>
                <p className="font-semibold text-neutral-600">Mengetahui,</p>
                <p className="font-bold text-neutral-800 mt-0.5">Ketua DKM Al-Falah</p>
                <div className="h-20"></div>
                <p className="font-bold underline text-black">( _______________________ )</p>
              </div>
              <div>
                <p className="font-semibold text-neutral-600">Bekasi, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="font-bold text-neutral-800 mt-0.5">Bendahara Mushola Al-Falah</p>
                <div className="h-20"></div>
                <p className="font-bold underline text-black">( _______________________ )</p>
              </div>
            </div>

            {/* Lampiran Bukti Transaksi section at the bottom of printed report */}
            {processedTransactions.some(tx => tx.attachment) && (
              <div className="mt-16 border-t-2 border-dashed border-neutral-400 pt-8 break-before-page page-break-before">
                <h3 className="text-xs font-black text-black uppercase tracking-wider mb-2 border-b border-black pb-1 flex items-center justify-between">
                  <span>Lampiran Bukti Kas Fisik (Diurutkan Sesuai Jurnal)</span>
                  <span className="text-[9px] font-mono font-medium text-neutral-500 italic uppercase">Buku Kas Al-Falah</span>
                </h3>
                <p className="text-[10px] text-neutral-500 mb-4 leading-normal">
                  Berikut ini adalah berkas pendukung transaksi (kuitansi, struk nota belanja, bukti bayar digital) yang diarsipkan secara elektronik.
                </p>
                <div className="divide-y divide-neutral-300 border-t border-b border-neutral-300">
                  {processedTransactions.filter(tx => tx.attachment).map((tx, idx) => (
                    <div key={`print-attach-${tx.no}-${idx}`} className="py-3 flex items-start justify-between gap-6 page-break-inside-avoid break-inside-avoid">
                      {/* Left Column: Transaction metadata & description */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center space-x-2 text-[8.5px] font-mono text-neutral-500 font-bold">
                          <span className="bg-neutral-200 px-1.5 py-0.5 rounded text-neutral-700">LAMPIRAN #{idx + 1}</span>
                          <span>No. Transaksi: {tx.no}</span>
                          <span>•</span>
                          <span>Tanggal: {tx.tanggal}</span>
                        </div>
                        <p className="text-xs font-extrabold text-neutral-900 leading-snug">
                          {tx.deskripsi}
                        </p>
                        <div className="flex items-center space-x-3 text-[9.5px]">
                          <div>
                            <span className="text-neutral-400 font-medium mr-1">Nilai Nominal:</span>
                            <span className={`font-mono font-bold ${tx.pemasukan ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {tx.pemasukan ? `(+) ${formatRupiah(tx.pemasukan)}` : `(-) ${formatRupiah(tx.pengeluaran!)}`}
                            </span>
                          </div>
                          <span className="text-neutral-300 font-mono">|</span>
                          <div className="truncate max-w-[200px]">
                            <span className="text-neutral-400 font-medium mr-1">Berkas:</span>
                            <span className="font-mono text-neutral-600 text-[8.5px]">{tx.attachment?.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Unified-sized preview of the attachment (Compacted to h-20 / w-32 for extreme space efficiency) */}
                      <div className="w-32 h-20 border border-neutral-300 rounded-lg overflow-hidden bg-white flex items-center justify-center p-1 shrink-0 shadow-sm">
                        {tx.attachment?.data.startsWith('data:image/') ? (
                          <img 
                            src={tx.attachment.data} 
                            alt={`Bukti - ${tx.deskripsi}`}
                            className="max-h-full max-w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center space-y-0.5 h-full w-full bg-neutral-50">
                            <FileText className="w-5 h-5 text-neutral-400" />
                            <p className="text-[8px] font-bold text-neutral-700 leading-none">PDF/Berkas</p>
                            <span className="text-[7px] text-neutral-400 px-1 leading-tight truncate max-w-[110px]">
                              {tx.attachment?.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Dedicated Attachments-Only print Layout: LAPORAN DOKUMEN LAMPIRAN BUKTI KAS FISIK */}
            {/* Elegant Institutional Kop Surat Banner */}
            <div className="w-full bg-[#0b1c2d] text-center py-6 px-4 rounded-xl relative overflow-hidden shadow-md flex flex-col items-center justify-center mb-6">
              {/* Central Golden Dome & Crescent Icon */}
              <div className="relative w-16 h-12 flex items-center justify-center text-[#d4a555] mb-1">
                {/* Crescent Moon */}
                <span className="absolute text-4xl select-none leading-none -translate-x-3 -translate-y-2.5 rotate-[-15deg] font-serif">☾</span>
                {/* Dome Outline */}
                <svg className="w-10 h-10 -translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3,19 L21,19" />
                  <path d="M4,19 C4,12 8,8 12,8 C16,8 20,12 20,19" />
                  <path d="M7,19 C7,14 9.5,11.5 12,11.5 C14.5,11.5 17,14 17,19" />
                  <path d="M12,8 L12,4" />
                  <circle cx="12" cy="3.5" r="0.6" fill="currentColor" />
                </svg>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-xl font-extrabold tracking-[0.1em] uppercase text-[#d4a555] font-sans m-0 leading-tight">
                DKM AL-FALAH
              </h1>
              <p className="text-[10px] text-[#dcd2be] font-bold mt-1.5 mb-0 max-w-xl leading-normal font-sans">
                Perumahan Victoria Permai, Babelan Kota, Babelan, Bekasi 17610
              </p>

              {/* Decorative Divider */}
              <div className="w-full max-w-lg flex items-center justify-between mt-3.5 text-[#d4a555] font-sans px-4">
                <span className="text-[7px] opacity-90">◆</span>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#d4a555] to-transparent mx-2"></div>
                <span className="text-[9px] mx-1">◆</span>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#d4a555] to-transparent mx-2"></div>
                <span className="text-[7px] opacity-90">◆</span>
              </div>
            </div>

            {/* Laporan Title */}
            <div className="text-center my-6 space-y-1 bg-neutral-100/50 p-2 border border-neutral-350 rounded">
              <h2 className="text-base font-black tracking-tight text-black uppercase my-0">LAPORAN LAMPIRAN BUKTI FISIK TRANSAKSI KAS</h2>
              <p className="text-xs font-bold text-neutral-700 my-0.5">
                <span>
                  Periode Saringan Tanggal: {startDate || endDate ? `${startDate ? formatDateOnly(startDate) : ''} s.d ${endDate ? formatDateOnly(endDate) : ''}` : 'Semua Berkas Terlampir'}
                </span>
              </p>
              <p className="text-[10px] text-neutral-500 font-mono my-0">
                Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
              </p>
            </div>

            {/* Brief index list of included attachments */}
            <div className="border border-neutral-300 rounded-lg p-4 mb-8 bg-neutral-50 text-[10px]">
              <p className="font-bold border-b border-neutral-300 pb-1 mb-2 text-black uppercase tracking-wider">Daftar Indeks Lampiran Berkas:</p>
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-neutral-300 text-neutral-500 font-semibold font-sans">
                    <th className="py-1 w-20">Lampiran</th>
                    <th className="py-1 w-28">No. Transaksi</th>
                    <th className="py-1">Deskripsi Transaksi</th>
                    <th className="py-1 text-right w-36">Nilai Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {processedTransactions.filter(tx => tx.attachment).map((tx, idx) => (
                    <tr key={`print-index-row-${tx.no}-${idx}`} className="text-neutral-750">
                      <td className="py-1.5 font-bold font-sans">#{idx + 1}</td>
                      <td className="py-1.5 font-mono">No.{tx.no} ({tx.tanggal})</td>
                      <td className="py-1.5 font-sans truncate pr-4 max-w-[280px]">{tx.deskripsi}</td>
                      <td className="py-1.5 text-right font-bold text-neutral-800">
                        {tx.pemasukan ? `(+) ${formatRupiah(tx.pemasukan)}` : `(-) ${formatRupiah(tx.pengeluaran!)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Page break grids of actual attachments */}
            <div className="divide-y divide-neutral-300 border-t border-b border-neutral-300">
              {processedTransactions.filter(tx => tx.attachment).map((tx, idx) => (
                <div key={`print-attach-only-${tx.no}-${idx}`} className="py-3 flex items-start justify-between gap-6 page-break-inside-avoid break-inside-avoid">
                  {/* Left Column: Transaction metadata & description */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center space-x-2 text-[8.5px] font-mono text-neutral-500 font-bold">
                      <span className="bg-neutral-200 px-1.5 py-0.5 rounded text-neutral-700">LAMPIRAN #{idx + 1}</span>
                      <span>No. Transaksi: {tx.no}</span>
                      <span>•</span>
                      <span>Tanggal: {tx.tanggal}</span>
                    </div>
                    <p className="text-xs font-extrabold text-neutral-900 leading-snug">
                      {tx.deskripsi}
                    </p>
                    <div className="flex items-center space-x-3 text-[9.5px]">
                      <div>
                        <span className="text-neutral-400 font-medium mr-1">Nilai Nominal:</span>
                        <span className={`font-mono font-bold ${tx.pemasukan ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {tx.pemasukan ? `(+) ${formatRupiah(tx.pemasukan)}` : `(-) ${formatRupiah(tx.pengeluaran!)}`}
                        </span>
                      </div>
                      <span className="text-neutral-300 font-mono">|</span>
                      <div className="truncate max-w-[200px]">
                        <span className="text-neutral-400 font-medium mr-1">Berkas:</span>
                        <span className="font-mono text-neutral-600 text-[8.5px]">{tx.attachment?.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Unified-sized preview of the attachment */}
                  <div className="w-32 h-20 border border-neutral-300 rounded-lg overflow-hidden bg-white flex items-center justify-center p-1 shrink-0 shadow-sm">
                    {tx.attachment?.data.startsWith('data:image/') ? (
                      <img 
                        src={tx.attachment.data} 
                        alt={`Bukti - ${tx.deskripsi}`}
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center space-y-0.5 h-full w-full bg-neutral-50">
                        <FileText className="w-5 h-5 text-neutral-400" />
                        <p className="text-[8px] font-bold text-neutral-700 leading-none">PDF/Berkas</p>
                        <span className="text-[7px] text-neutral-400 px-1 leading-tight truncate max-w-[110px]">
                          {tx.attachment?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Official Certification Signatures */}
            <div className="grid grid-cols-2 gap-12 mt-12 text-center text-xs text-black page-break-inside-avoid break-inside-avoid border-t border-neutral-300 pt-8">
              <div>
                <p className="font-semibold text-neutral-600">Mengetahui,</p>
                <p className="font-bold text-neutral-800 mt-0.5">Ketua DKM Al-Falah</p>
                <div className="h-20"></div>
                <p className="font-bold underline text-black">( _______________________ )</p>
              </div>
              <div>
                <p className="font-semibold text-neutral-600">Bekasi, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="font-bold text-neutral-800 mt-0.5">Bendahara Mushola Al-Falah</p>
                <div className="h-20"></div>
                <p className="font-bold underline text-black">( _______________________ )</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Loading Overlay for PDF Generation */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex flex-col items-center space-y-4 p-6 bg-[#111425] border border-slate-800 rounded-2xl shadow-2xl max-w-sm text-center">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-black text-white tracking-tight">Kompilasi Formulir PDF</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                Sistem sedang memproses, memformat, dan mengompilasi lembar laporan kas diarsipkan ke dokumen PDF...
              </p>
              <p className="text-[10px] text-slate-500 font-mono">Mohon tunggu sebentar, file akan otomatis terunduh.</p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit Modal Box */}
      {isAdministrator && showEditModal && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111425] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden w-full max-w-lg md:max-w-xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 bg-[#0a0c18] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-450 text-sm font-extrabold">
                  ✏️
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Edit Transaksi #{selectedTxNo}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Ubah rincian, jumlah nominal, dan berkas transaksi</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowEditModal(false); setSelectedTxNo(null); }}
                className="p-1 px-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Form Scrollable */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {editFormError && (
                <div className="bg-rose-950/20 border border-rose-500/30 px-4 py-3 rounded-xl text-xs font-bold text-rose-450">
                  ⚠️ {editFormError}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4">
                
                {/* Tanggal */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-emerald-500/85 transition-all cursor-pointer"
                  />
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Deskripsi / Keterangan
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Contoh: Pembelian sajadah sholat jamaah, pembayaran listrik, dsb."
                    value={editDeskripsi}
                    onChange={(e) => setEditDeskripsi(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-emerald-500/85 transition-all text-left resize-none"
                  />
                </div>

                {/* Tipe / Jenis Transaksi */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Jenis Alur Keuangan
                  </label>
                  <div className="grid grid-cols-2 gap-2.5 p-1 bg-[#0a0c18] rounded-xl border border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setEditTipe('pemasukan')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center space-x-1.5 cursor-pointer ${
                        editTipe === 'pemasukan' 
                          ? 'bg-emerald-500/15 text-emerald-450 border border-emerald-500/30' 
                          : 'text-slate-400 hover:text-slate-250'
                      }`}
                    >
                      <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                      <span>Pemasukan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTipe('pengeluaran')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center space-x-1.5 cursor-pointer ${
                        editTipe === 'pengeluaran' 
                          ? 'bg-rose-500/15 text-rose-455 border border-rose-500/30' 
                          : 'text-slate-400 hover:text-slate-250'
                      }`}
                    >
                      <ArrowUpCircle className="w-4 h-4 text-rose-455" />
                      <span>Pengeluaran</span>
                    </button>
                  </div>
                </div>

                {/* Jumlah Nominal */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Jumlah Nominal Uang (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">Rp</span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Masukkan nominal angka saja..."
                      value={editJumlah}
                      onChange={(e) => setEditJumlah(e.target.value)}
                      className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-[#0a0c18] text-slate-200 focus:outline-none focus:border-emerald-500/85 transition-all"
                    />
                  </div>
                </div>

                {/* Attachment / Upload File Bukti */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Berkas Bukti / Lampiran (Opsional, PDF/IMG max 2MB)
                  </label>
                  
                  {editFile ? (
                    <div className="bg-[#0a0c18] border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="text-xl">📄</span>
                        <div className="truncate text-left">
                          <p className="text-slate-200 font-bold truncate max-w-[200px] sm:max-w-xs">{editFile.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{editFile.type || 'Berkas Lampiran'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditFile(null)}
                        className="text-[10px] font-extrabold text-rose-450 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded hover:bg-rose-500 hover:text-white cursor-pointer select-none transition-colors"
                      >
                        Hapus Lampiran
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setEditDragging(true); }}
                      onDragLeave={() => setEditDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setEditDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleEditFileSelection(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                        editDragging 
                          ? 'border-emerald-500 bg-emerald-500/5' 
                          : 'border-slate-800 bg-[#0a0c18] hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        id="edit-file-input"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleEditFileSelection(e.target.files[0]);
                          }
                        }}
                      />
                      <label htmlFor="edit-file-input" className="cursor-pointer space-y-1 block w-full">
                        <p className="text-[11px] text-slate-300 font-bold">Tarik berkas ke sini, atau <span className="text-emerald-450 hover:underline">pilih berkas</span></p>
                        <p className="text-[9px] text-slate-500 font-semibold font-mono">Format berkas: Gambar (JPG, PNG) atau PDF (Maks. 2MB)</p>
                      </label>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-805 flex items-center justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setSelectedTxNo(null); }}
                    className="px-4 py-2 text-xs font-bold bg-[#0c0e1a]/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer select-none"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors cursor-pointer select-none shadow-md"
                  >
                    Simpan Perubahan
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
      {isAdministrator && showDeleteConfirm && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111425] border border-slate-800 rounded-3xl shadow-2xl p-6 w-full max-w-md text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center text-xl font-black">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-white">Konfirmasi Hapus Transaksi</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                Apakah Anda yakin ingin menghapus transaksi <strong className="text-rose-450">#{selectedTxNo}</strong> 
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Tindakan ini tidak dapat dibatalkan. Sistem akan mengalkulasi ulang seluruh nilai saldo berjalan selanjutnya.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center space-x-2.5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-slate-800 bg-[#0a0c18] text-slate-350 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer select-none"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-colors cursor-pointer select-none"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
