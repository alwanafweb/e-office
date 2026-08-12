import * as XLSX from 'xlsx';
import { Invoice } from '../types';
import { formatDateIndonesian, getMonthName } from './formatters';

export const getInvoicePaidAmount = (inv: Invoice): number => {
  if (typeof inv.paidAmount === 'number') return inv.paidAmount;
  if (inv.status === 'Lunas') return inv.grandTotal;
  if (inv.payments && inv.payments.length > 0) {
    return inv.payments.reduce((sum, p) => sum + p.amount, 0);
  }
  return 0;
};

export const getInvoiceRemainingAmount = (inv: Invoice): number => {
  if (inv.status === 'Dibatalkan') return 0;
  return Math.max(0, inv.grandTotal - getInvoicePaidAmount(inv));
};

/**
 * Ekspor Daftar Invoice ke File Excel (.xlsx)
 */
export const exportInvoicesToExcel = (invoices: Invoice[], filenamePrefix: string = 'Daftar_Invoice_PT_LDI') => {
  const wb = XLSX.utils.book_new();

  // Prepare AOA (Array of Arrays) for clean header & styling capability
  const data: (string | number)[][] = [];

  // Title Block
  data.push(['PT LINTAS DATA INTERNASIONAL']);
  data.push(['LAPORAN & DAFTAR PENAGIHAN INVOICE']);
  data.push([`Tanggal Cetak: ${formatDateIndonesian(new Date().toISOString())}`]);
  data.push([]); // Empty row

  // Table Headers
  const headers = [
    'No.',
    'No. Invoice',
    'Nama Pelanggan',
    'Tanggal Terbit',
    'Jatuh Tempo',
    'Rincian Layanan',
    'Subtotal (Rp)',
    'PPN 11% (Rp)',
    'Grand Total (Rp)',
    'Total Terbayar (Rp)',
    'Sisa Tagihan (Rp)',
    'Status',
    'Bank Penampung',
    'Jml Setoran',
  ];
  data.push(headers);

  let totalSubtotal = 0;
  let totalPpn = 0;
  let totalGrand = 0;
  let totalPaid = 0;
  let totalRemaining = 0;

  invoices.forEach((inv, index) => {
    const paid = getInvoicePaidAmount(inv);
    const remaining = getInvoiceRemainingAmount(inv);
    const itemsSummary = inv.items.map((it) => `${it.description} (${it.qty}x)`).join('; ');
    const bankInfoStr = inv.bankInfo ? `${inv.bankInfo.bankName} - ${inv.bankInfo.accountNumber}` : 'BCA Utama';
    const paymentsCount = inv.payments?.length || (inv.status === 'Lunas' ? 1 : 0);
    const taxAmt = inv.taxAmount || 0;

    totalSubtotal += inv.subtotal;
    totalPpn += taxAmt;
    totalGrand += inv.grandTotal;
    totalPaid += paid;
    totalRemaining += remaining;

    data.push([
      index + 1,
      inv.invoiceNumber,
      inv.customerName,
      inv.issueDate,
      inv.dueDate,
      itemsSummary,
      inv.subtotal,
      taxAmt,
      inv.grandTotal,
      paid,
      remaining,
      inv.status,
      bankInfoStr,
      paymentsCount,
    ]);
  });

  // Summary Row
  data.push([]);
  data.push([
    'TOTAL',
    '',
    '',
    '',
    '',
    `${invoices.length} Dokumen Invoice`,
    totalSubtotal,
    totalPpn,
    totalGrand,
    totalPaid,
    totalRemaining,
    '',
    '',
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Column Width Auto Fit
  const colWidths = [
    { wch: 5 },  // No
    { wch: 26 }, // No Invoice
    { wch: 32 }, // Nama Pelanggan
    { wch: 14 }, // Tgl Terbit
    { wch: 14 }, // Tgl Jatuh Tempo
    { wch: 45 }, // Layanan
    { wch: 18 }, // Subtotal
    { wch: 16 }, // PPN
    { wch: 18 }, // Grand Total
    { wch: 18 }, // Total Terbayar
    { wch: 18 }, // Sisa Tagihan
    { wch: 18 }, // Status
    { wch: 30 }, // Bank
    { wch: 12 }, // Jml Setoran
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Daftar Invoice');

  // Trigger Download
  const filename = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};

/**
 * Ekspor Laporan Keuangan Bulanan & Tahunan Lengkap ke File Excel (.xlsx)
 */
export const exportFinancialReportToExcel = (
  invoices: Invoice[],
  selectedMonth: number,
  selectedYear: number
) => {
  const wb = XLSX.utils.book_new();

  // Filter Invoices by month & year
  const monthInvoices = invoices.filter((inv) => {
    if (!inv.issueDate) return false;
    const d = new Date(inv.issueDate);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });

  const yearInvoices = invoices.filter((inv) => {
    if (!inv.issueDate) return false;
    return new Date(inv.issueDate).getFullYear() === selectedYear;
  });

  // Calculate KPIs
  const totalInvoicedMonth = monthInvoices.reduce((a, b) => a + b.grandTotal, 0);
  const totalPaidMonth = monthInvoices.reduce((a, b) => a + getInvoicePaidAmount(b), 0);
  const totalRemainingMonth = monthInvoices.reduce((a, b) => a + getInvoiceRemainingAmount(b), 0);

  // --- SHEET 1: EXECUTIVE SUMMARY ---
  const summaryAoa: (string | number)[][] = [];
  summaryAoa.push(['PT LINTAS DATA INTERNASIONAL']);
  summaryAoa.push(['LAPORAN KEUANGAN & REALISASI PENAGIHAN']);
  summaryAoa.push([`Periode: ${getMonthName(selectedMonth - 1)} ${selectedYear}`]);
  summaryAoa.push([`Tanggal Cetak: ${formatDateIndonesian(new Date().toISOString())}`]);
  summaryAoa.push([]);

  summaryAoa.push(['RINGKASAN EKSEKUTIF BULAN INI']);
  summaryAoa.push(['Indikator Keuangan', 'Nilai (IDR)']);
  summaryAoa.push(['Total Tagihan Diterbitkan', totalInvoicedMonth]);
  summaryAoa.push(['Total Realisasi Terbayar', totalPaidMonth]);
  summaryAoa.push(['Total Sisa Piutang Outstanding', totalRemainingMonth]);
  summaryAoa.push(['Tingkat Pelunasan Tagihan (%)', totalInvoicedMonth > 0 ? Math.round((totalPaidMonth / totalInvoicedMonth) * 100) + '%' : '0%']);
  summaryAoa.push([]);

  // Monthly Breakdown Sheet 1 Table
  summaryAoa.push([`REKAPITULASI BULANAN TAHUN ${selectedYear}`]);
  summaryAoa.push(['Bulan', 'Total Invoiced (Rp)', 'Realisasi Terbayar (Rp)', 'Sisa Piutang (Rp)', 'Status Pelunasan']);

  for (let m = 1; m <= 12; m++) {
    const invsM = yearInvoices.filter((inv) => new Date(inv.issueDate).getMonth() + 1 === m);
    const invVal = invsM.reduce((a, b) => a + b.grandTotal, 0);
    const paidVal = invsM.reduce((a, b) => a + getInvoicePaidAmount(b), 0);
    const remVal = invsM.reduce((a, b) => a + getInvoiceRemainingAmount(b), 0);
    const ratio = invVal > 0 ? Math.round((paidVal / invVal) * 100) : 0;

    summaryAoa.push([
      getMonthName(m - 1),
      invVal,
      paidVal,
      remVal,
      `${ratio}% Terbayar`,
    ]);
  }

  // Yearly Totals
  const yearlyInvVal = yearInvoices.reduce((a, b) => a + b.grandTotal, 0);
  const yearlyPaidVal = yearInvoices.reduce((a, b) => a + getInvoicePaidAmount(b), 0);
  const yearlyRemVal = yearInvoices.reduce((a, b) => a + getInvoiceRemainingAmount(b), 0);

  summaryAoa.push([
    `TOTAL TAHUN ${selectedYear}`,
    yearlyInvVal,
    yearlyPaidVal,
    yearlyRemVal,
    yearlyInvVal > 0 ? `${Math.round((yearlyPaidVal / yearlyInvVal) * 100)}% Terbayar` : '0%',
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  wsSummary['!cols'] = [
    { wch: 30 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Keuangan');

  // --- SHEET 2: DETAIL INVOICE BULAN PILIHAN ---
  const detailAoa: (string | number)[][] = [];
  detailAoa.push(['DETAIL PENAGIHAN INVOICE']);
  detailAoa.push([`Periode: ${getMonthName(selectedMonth - 1)} ${selectedYear}`]);
  detailAoa.push([]);

  detailAoa.push([
    'No.',
    'No. Invoice',
    'Nama Pelanggan',
    'Tanggal Terbit',
    'Jatuh Tempo',
    'Subtotal (Rp)',
    'PPN 11% (Rp)',
    'Grand Total (Rp)',
    'Terbayar (Rp)',
    'Sisa Piutang (Rp)',
    'Status',
  ]);

  monthInvoices.forEach((inv, idx) => {
    const paid = getInvoicePaidAmount(inv);
    const rem = getInvoiceRemainingAmount(inv);
    detailAoa.push([
      idx + 1,
      inv.invoiceNumber,
      inv.customerName,
      inv.issueDate,
      inv.dueDate,
      inv.subtotal,
      inv.taxAmount || 0,
      inv.grandTotal,
      paid,
      rem,
      inv.status,
    ]);
  });

  const wsDetail = XLSX.utils.aoa_to_sheet(detailAoa);
  wsDetail['!cols'] = [
    { wch: 5 },
    { wch: 26 },
    { wch: 32 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, `Invoice ${getMonthName(selectedMonth - 1)}`);

  // --- SHEET 3: JURNAL SETORAN CICILAN (PAYMENT JOURNAL) ---
  const journalAoa: (string | number)[][] = [];
  journalAoa.push(['JURNAL SETORAN & CICILAN PEMBAYARAN']);
  journalAoa.push([`Periode: ${getMonthName(selectedMonth - 1)} ${selectedYear}`]);
  journalAoa.push([]);

  journalAoa.push([
    'No.',
    'No. Invoice',
    'Nama Pelanggan',
    'Tanggal Setor',
    'Nominal Setoran (Rp)',
    'Metode Pembayaran',
    'Catatan / Keterangan',
    'Dicatat Oleh',
  ]);

  let journalIndex = 1;
  let totalJournalPaid = 0;

  monthInvoices.forEach((inv) => {
    if (inv.payments && inv.payments.length > 0) {
      inv.payments.forEach((p) => {
        totalJournalPaid += p.amount;
        journalAoa.push([
          journalIndex++,
          inv.invoiceNumber,
          inv.customerName,
          p.paymentDate,
          p.amount,
          p.paymentMethod,
          p.notes || 'Cicilan Invoice',
          p.recordedBy || 'Admin',
        ]);
      });
    } else if (inv.status === 'Lunas') {
      // Fallback for single full payment record
      totalJournalPaid += inv.grandTotal;
      journalAoa.push([
        journalIndex++,
        inv.invoiceNumber,
        inv.customerName,
        inv.paymentDate || inv.issueDate,
        inv.grandTotal,
        inv.paymentMethod || 'Transfer Bank BCA',
        'Pelunasan Penuh',
        'Admin Finance',
      ]);
    }
  });

  journalAoa.push([]);
  journalAoa.push(['TOTAL SETORAN DITERIMA', '', '', '', totalJournalPaid, '', '', '']);

  const wsJournal = XLSX.utils.aoa_to_sheet(journalAoa);
  wsJournal['!cols'] = [
    { wch: 5 },
    { wch: 26 },
    { wch: 32 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
    { wch: 35 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsJournal, 'Jurnal Setoran');

  // Download File
  const filename = `Laporan_Keuangan_PT_LDI_${getMonthName(selectedMonth - 1)}_${selectedYear}.xlsx`;
  XLSX.writeFile(wb, filename);
};
