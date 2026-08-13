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

function escapeXml(str: string | number): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Native XML Spreadsheet Exporter (MIME: application/vnd.ms-excel)
 * Works in MS Excel, Google Sheets, LibreOffice without third-party dependencies.
 */
export function downloadExcelXml(
  sheets: { name: string; rows: (string | number)[][] }[],
  filename: string
) {
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Color="#0F172A" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Bold">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
  </Style>
 </Styles>
`;

  sheets.forEach((sheet) => {
    xml += ` <Worksheet ss:Name="${escapeXml(sheet.name)}">\n  <Table>\n`;
    sheet.rows.forEach((row) => {
      xml += '   <Row>\n';
      row.forEach((cell) => {
        const isNum = typeof cell === 'number';
        const type = isNum ? 'Number' : 'String';
        xml += `    <Cell><Data ss:Type="${type}">${escapeXml(cell)}</Data></Cell>\n`;
      });
      xml += '   </Row>\n';
    });
    xml += '  </Table>\n </Worksheet>\n';
  });

  xml += '</Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Ekspor Daftar Invoice ke File Excel (.xlsx / .xls)
 */
export const exportInvoicesToExcel = (invoices: Invoice[], filenamePrefix: string = 'Daftar_Invoice_PT_LDI') => {
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

  const filename = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.xls`;
  downloadExcelXml([{ name: 'Daftar Invoice', rows: data }], filename);
};

/**
 * Ekspor Laporan Keuangan Bulanan & Tahunan Lengkap ke File Excel (.xlsx / .xls)
 */
export const exportFinancialReportToExcel = (
  invoices: Invoice[],
  selectedMonth: number,
  selectedYear: number
) => {
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

  const filename = `Laporan_Keuangan_PT_LDI_${getMonthName(selectedMonth - 1)}_${selectedYear}.xls`;
  downloadExcelXml(
    [
      { name: 'Ringkasan Keuangan', rows: summaryAoa },
      { name: `Invoice ${getMonthName(selectedMonth - 1)}`, rows: detailAoa },
      { name: 'Jurnal Setoran', rows: journalAoa },
    ],
    filename
  );
};
