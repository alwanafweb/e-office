import { CompanyProfile, Customer, Invoice, PKS, SPH } from '../types';
import { formatIDR, formatDateIndonesian } from './formatters';

export interface EmailPlaceholderData {
  docNumber: string;
  customerName: string;
  docDate: string;
  dueDate: string;
  validityDays: number;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  taxPercent: number;
  discountTotal: number;
  paymentStatus: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  bankBranch?: string;
  bankNotes?: string;
  bankInfoFormatted: string;
  itemsListFormatted: string;
  itemsTableHtml: string;
  phone: string;
  email: string;
  website: string;
  companyName: string;
  legalName: string;
  verifyUrl: string;
  slaPercent?: number;
  contractDuration?: number;
}

/**
 * Extracts and normalizes document metadata for placeholder replacement and email generation
 */
export function extractEmailPlaceholderData(
  type: 'SPH' | 'PKS' | 'Invoice',
  data: SPH | PKS | Invoice,
  companyProfile?: CompanyProfile,
  customers?: Customer[]
): EmailPlaceholderData {
  const rawDomain = companyProfile?.website ? companyProfile.website.replace(/^https?:\/\//, '') : 'e-office.ldi.co.id';
  const domainName = rawDomain.toLowerCase().includes('jagoanserver') ? 'e-office.ldi.co.id' : rawDomain;

  const phone = companyProfile?.whatsapp || companyProfile?.phone || '087777040496';
  const email = companyProfile?.mailketingSenderEmail || companyProfile?.email || 'support@ldi.co.id';
  const companyName = companyProfile?.name || 'PT. LINTAS DATA INTERNASIONAL';
  const legalName = companyProfile?.legalName || companyName;

  const defaultBank = companyProfile?.bankDetails?.[0] || {
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '8830-1928-33',
    accountHolder: 'PT LINTAS DATA INTERNASIONAL',
    branch: 'KCP BSD Green Office Park',
    notes: 'Transfer Rekening Utama untuk Layanan Internet & Cloud',
  };

  let docNumber = '';
  let customerName = data?.customerName || 'Pelanggan Terhormat';
  let docDate = '';
  let dueDate = '-';
  let validityDays = 14;
  let totalAmount = 0;
  let subtotal = 0;
  let taxAmount = 0;
  let taxPercent = 11;
  let discountTotal = 0;
  let paymentStatus = 'Belum Lunas';
  let bankName = defaultBank.bankName;
  let bankAccount = defaultBank.accountNumber;
  let bankHolder = defaultBank.accountHolder || legalName;
  let bankBranch = defaultBank.branch;
  let bankNotes = defaultBank.notes;
  let slaPercent = 99.9;
  let contractDuration = 12;

  let itemsListFormatted = '';
  let itemsTableHtml = '';

  if (type === 'Invoice') {
    const inv = data as Invoice;
    docNumber = inv.invoiceNumber || `INV/${new Date().getFullYear()}/001`;
    docDate = formatDateIndonesian(inv.issueDate || new Date().toISOString().split('T')[0]);
    dueDate = formatDateIndonesian(inv.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    totalAmount = inv.grandTotal || 0;
    subtotal = inv.subtotal || 0;
    taxAmount = inv.taxAmount || 0;
    taxPercent = inv.taxPercent ?? 11;
    discountTotal = inv.discountTotal || 0;
    paymentStatus = inv.status === 'Lunas' ? 'LUNAS' : inv.status === 'Dibayar Sebagian' ? 'DIBAYAR SEBAGIAN' : 'BELUM BAYAR';

    if (inv.bankInfo?.accountNumber) {
      bankName = inv.bankInfo.bankName || bankName;
      bankAccount = inv.bankInfo.accountNumber || bankAccount;
      bankHolder = inv.bankInfo.accountHolder || bankHolder;
      bankBranch = inv.bankInfo.branch || bankBranch;
      bankNotes = inv.bankInfo.notes || bankNotes;
    }

    if (inv.items && inv.items.length > 0) {
      itemsListFormatted = inv.items
        .map((item, idx) => {
          const itemTotal = item.qty * item.price - (item.discount || 0);
          return `  ${idx + 1}. ${item.name} (${item.qty} ${item.unit || 'Unit'}) - ${formatIDR(itemTotal)}${item.description ? `\n     * ${item.description}` : ''}`;
        })
        .join('\n');

      itemsTableHtml = inv.items
        .map((item, idx) => {
          const itemTotal = item.qty * item.price - (item.discount || 0);
          return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; font-size: 12px; color: #475569; text-align: center; width: 30px;">${idx + 1}</td>
              <td style="padding: 10px 12px; font-size: 12px; color: #0f172a;">
                <strong>${item.name}</strong>
                ${item.description ? `<br/><span style="font-size: 11px; color: #64748b;">${item.description}</span>` : ''}
              </td>
              <td style="padding: 10px 12px; font-size: 12px; color: #334155; text-align: center; white-space: nowrap;">${item.qty} ${item.unit || 'Unit'}</td>
              <td style="padding: 10px 12px; font-size: 12px; color: #334155; text-align: right; font-family: monospace; white-space: nowrap;">${formatIDR(item.price)}</td>
              <td style="padding: 10px 12px; font-size: 12px; color: #0f172a; font-weight: bold; text-align: right; font-family: monospace; white-space: nowrap;">${formatIDR(itemTotal)}</td>
            </tr>
          `;
        })
        .join('');
    }
  } else if (type === 'SPH') {
    const sph = data as SPH;
    docNumber = sph.sphNumber || `SPH/${new Date().getFullYear()}/001`;
    docDate = formatDateIndonesian(sph.date || new Date().toISOString().split('T')[0]);
    validityDays = sph.validityDays || 14;
    totalAmount = sph.grandTotal || 0;
    subtotal = sph.subtotal || 0;
    taxAmount = sph.taxAmount || 0;
    taxPercent = sph.taxPercent ?? 11;
    discountTotal = sph.discountTotal || 0;
    paymentStatus = 'Penawaran Aktif';

    if (sph.items && sph.items.length > 0) {
      itemsListFormatted = sph.items
        .map((item, idx) => {
          const itemTotal = item.qty * item.price - (item.discount || 0);
          return `  ${idx + 1}. ${item.name} (${item.qty} ${item.unit || 'Unit'}) - ${formatIDR(itemTotal)}${item.description ? `\n     * ${item.description}` : ''}`;
        })
        .join('\n');

      itemsTableHtml = sph.items
        .map((item, idx) => {
          const itemTotal = item.qty * item.price - (item.discount || 0);
          return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; font-size: 12px; color: #475569; text-align: center; width: 30px;">${idx + 1}</td>
              <td style="padding: 10px 12px; font-size: 12px; color: #0f172a;">
                <strong>${item.name}</strong>
                ${item.description ? `<br/><span style="font-size: 11px; color: #64748b;">${item.description}</span>` : ''}
              </td>
              <td style="padding: 10px 12px; font-size: 12px; color: #334155; text-align: center; white-space: nowrap;">${item.qty} ${item.unit || 'Unit'}</td>
              <td style="padding: 10px 12px; font-size: 12px; color: #334155; text-align: right; font-family: monospace; white-space: nowrap;">${formatIDR(item.price)}</td>
              <td style="padding: 10px 12px; font-size: 12px; color: #0f172a; font-weight: bold; text-align: right; font-family: monospace; white-space: nowrap;">${formatIDR(itemTotal)}</td>
            </tr>
          `;
        })
        .join('');
    }
  } else {
    const pks = data as PKS;
    docNumber = pks.pksNumber || `PKS/${new Date().getFullYear()}/001`;
    docDate = `${formatDateIndonesian(pks.startDate)} s/d ${formatDateIndonesian(pks.endDate)}`;
    totalAmount = pks.totalContractValue || 0;
    slaPercent = pks.slaPercent || 99.9;
    contractDuration = pks.contractDurationMonths || 12;
    paymentStatus = pks.status || 'Aktif';

    if (pks.serviceItems && pks.serviceItems.length > 0) {
      itemsListFormatted = pks.serviceItems
        .map((item, idx) => {
          const itemTotal = item.qty * item.price - (item.discount || 0);
          return `  ${idx + 1}. ${item.name} (${item.qty} ${item.unit || 'Bulan'}) - ${formatIDR(itemTotal)}/bln${item.description ? `\n     * ${item.description}` : ''}`;
        })
        .join('\n');

      itemsTableHtml = pks.serviceItems
        .map((item, idx) => {
          const itemTotal = item.qty * item.price - (item.discount || 0);
          return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; font-size: 12px; color: #475569; text-align: center; width: 30px;">${idx + 1}</td>
              <td style="padding: 10px 12px; font-size: 12px; color: #0f172a;">
                <strong>${item.name}</strong>
                ${item.description ? `<br/><span style="font-size: 11px; color: #64748b;">${item.description}</span>` : ''}
              </td>
              <td style="padding: 10px 12px; font-size: 12px; color: #334155; text-align: center; white-space: nowrap;">${item.qty} ${item.unit || 'Bulan'}</td>
              <td style="padding: 10px 12px; font-size: 12px; color: #334155; text-align: right; font-family: monospace; white-space: nowrap;">${formatIDR(item.price)}/bln</td>
              <td style="padding: 10px 12px; font-size: 12px; color: #0f172a; font-weight: bold; text-align: right; font-family: monospace; white-space: nowrap;">${formatIDR(itemTotal)}/bln</td>
            </tr>
          `;
        })
        .join('');
    }
  }

  const bankInfoFormatted = `• Bank: ${bankName}\n• No. Rekening: ${bankAccount}\n• Atas Nama: ${bankHolder}${bankBranch ? `\n• Cabang: ${bankBranch}` : ''}${bankNotes ? `\n• Keterangan: ${bankNotes}` : ''}`;
  const verifyUrl = `https://${domainName}/verify?doc=${encodeURIComponent(docNumber)}`;

  return {
    docNumber,
    customerName,
    docDate,
    dueDate,
    validityDays,
    totalAmount,
    subtotal,
    taxAmount,
    taxPercent,
    discountTotal,
    paymentStatus,
    bankName,
    bankAccount,
    bankHolder,
    bankBranch,
    bankNotes,
    bankInfoFormatted,
    itemsListFormatted: itemsListFormatted || '  1. Layanan Jaringan & Konektivitas Enterprise',
    itemsTableHtml,
    phone,
    email,
    website: `https://${domainName}`,
    companyName,
    legalName,
    verifyUrl,
    slaPercent,
    contractDuration,
  };
}

/**
 * Replaces all supported placeholders in any template string
 */
export function replaceEmailPlaceholders(
  templateStr: string,
  type: 'SPH' | 'PKS' | 'Invoice',
  data: SPH | PKS | Invoice,
  companyProfile?: CompanyProfile,
  customers?: Customer[]
): string {
  if (!templateStr) return '';

  const meta = extractEmailPlaceholderData(type, data, companyProfile, customers);

  let result = templateStr
    .replace(/jagoanserver\.com/gi, 'e-office.ldi.co.id')
    // Document Number variants
    .replace(/\{(?:DOC_NUMBER|INVOICE_NUMBER|SPH_NUMBER|PKS_NUMBER|NOMOR_INVOICE|NO_INVOICE|NOMOR_DOKUMEN|NO_DOKUMEN)\}/gi, meta.docNumber)
    // Customer Name variants
    .replace(/\{(?:CUSTOMER_NAME|NAMA_PELANGGAN|NAMA_KLIEN|KLIEN)\}/gi, meta.customerName)
    // Dates
    .replace(/\{(?:DOC_DATE|TANGGAL_TERBIT|TANGGAL_DOKUMEN|TANGGAL)\}/gi, meta.docDate)
    .replace(/\{(?:DUE_DATE|JATUH_TEMPO|TANGGAL_JATUH_TEMPO)\}/gi, meta.dueDate)
    .replace(/\{(?:VALIDITY_DAYS|MASA_BERLAKU)\}/gi, `${meta.validityDays} Hari`)
    // Financial Totals
    .replace(/\{(?:TOTAL_AMOUNT|GRAND_TOTAL|TOTAL_TAGIHAN|TOTAL|NILAI_KONTRAK)\}/gi, formatIDR(meta.totalAmount))
    .replace(/\{(?:SUBTOTAL|SUB_TOTAL)\}/gi, formatIDR(meta.subtotal))
    .replace(/\{(?:TAX_AMOUNT|PPN|PAJAK)\}/gi, formatIDR(meta.taxAmount))
    .replace(/\{(?:TAX_PERCENT|PERSEN_PPN)\}/gi, `${meta.taxPercent}%`)
    // Status
    .replace(/\{(?:PAYMENT_STATUS|STATUS_BAYAR|STATUS_PEMBAYARAN|STATUS)\}/gi, meta.paymentStatus)
    // Bank & Payment
    .replace(/\{(?:BANK_INFO|REKENING_BANK|INFO_REKENING|INFORMASI_BANK)\}/gi, meta.bankInfoFormatted)
    .replace(/\{(?:BANK_NAME|NAMA_BANK)\}/gi, meta.bankName)
    .replace(/\{(?:BANK_ACCOUNT|NO_REKENING|NOMOR_REKENING)\}/gi, meta.bankAccount)
    .replace(/\{(?:BANK_HOLDER|ATAS_NAMA|PEMILIK_REKENING)\}/gi, meta.bankHolder)
    // Items List
    .replace(/\{(?:ITEMS_LIST|ITEMS_SUMMARY|ITEMS|RINCIAN_LAYANAN|RINCIAN_ITEM|DAFTAR_ITEM)\}/gi, meta.itemsListFormatted)
    // Company Contact & Identity
    .replace(/\{(?:PHONE|WHATSAPP|TELEPON|TELP|NO_HP)\}/gi, meta.phone)
    .replace(/\{(?:EMAIL|EMAIL_PERUSAHAAN|EMAIL_RESMI)\}/gi, meta.email)
    .replace(/\{(?:WEBSITE|WEB|DOMAIN)\}/gi, meta.website)
    .replace(/\{(?:COMPANY_NAME|NAMA_PERUSAHAAN)\}/gi, meta.companyName)
    .replace(/\{(?:LEGAL_NAME)\}/gi, meta.legalName)
    .replace(/\{(?:VERIFY_URL|LINK_VERIFIKASI|URL_VERIFIKASI)\}/gi, meta.verifyUrl);

  return result;
}

/**
 * Standard complete template texts
 */
export const DEFAULT_EMAIL_TEMPLATES = {
  invoiceSubject: '[PT. LDI] Tagihan Faktur Invoice #{DOC_NUMBER} - {CUSTOMER_NAME}',
  invoiceBody: `Kepada Yth. Bapak/Ibu Tim Keuangan & Manajemen {CUSTOMER_NAME},

Bersama email ini, kami dari PT. LINTAS DATA INTERNASIONAL sampaikan Faktur Tagihan Resmi (Invoice) periode layanan berjalan dengan rincian sebagai berikut:

📋 DETAIL INVOICE:
• Nomor Invoice: {DOC_NUMBER}
• Tanggal Terbit: {DOC_DATE}
• Tanggal Jatuh Tempo: {DUE_DATE}
• Status Pembayaran: {PAYMENT_STATUS}

📦 RINCIAN LAYANAN & ITEM TAGIHAN:
{ITEMS_LIST}

💰 RINGKASAN PEMBAYARAN:
• Subtotal: {SUBTOTAL}
• PPN (11%): {TAX_AMOUNT}
• TOTAL TAGIHAN (Grand Total): {TOTAL_AMOUNT}

🏦 INSTRUKSI PEMBAYARAN (REKENING RESMI PT. LDI):
{BANK_INFO}
(Mohon mencantumkan Nomor Invoice #{DOC_NUMBER} pada kolom berita transfer)

Berkas PDF resmi Invoice bertanda tangan digital dan stempel sah PT. LDI telah terlampir pada email ini.

Verifikasi Keaslian Dokumen:
{VERIFY_URL}

Terima kasih atas kerja sama dan kepercayaan Anda terhadap layanan PT. LDI.

Hormat Kami,
Departemen Keuangan PT. LINTAS DATA INTERNASIONAL
Telp/WA: {PHONE} | Website: {WEBSITE}`,

  sphSubject: '[PT. LDI] Surat Penawaran Harga (SPH) #{DOC_NUMBER} - {CUSTOMER_NAME}',
  sphBody: `Kepada Yth. Bapak/Ibu Tim Manajemen {CUSTOMER_NAME},

Bersama email ini, kami dari PT. LINTAS DATA INTERNASIONAL sampaikan Dokumen Resmi Surat Penawaran Harga (SPH) dengan rincian sebagai berikut:

📋 DETAIL PENAWARAN:
• Nomor SPH: {DOC_NUMBER}
• Tanggal Terbit: {DOC_DATE}
• Masa Berlaku: {VALIDITY_DAYS}
• Total Nilai Penawaran: {TOTAL_AMOUNT}

📦 RINCIAN LAYANAN DITAWARKAN:
{ITEMS_LIST}

Berkas PDF resmi SPH bertanda tangan digital dan stempel sah PT. LDI telah terlampir secara otomatis pada email ini.

Verifikasi Keaslian Dokumen:
{VERIFY_URL}

Demikian penawaran ini kami sampaikan. Jika ada pertanyaan lebih lanjut, silakan menghubungi tim kami.

Hormat Kami,
PT. LINTAS DATA INTERNASIONAL
Telp/WA: {PHONE} | Website: {WEBSITE}`,

  pksSubject: '[PT. LDI] Dokumen Perjanjian Kerja Sama (PKS) #{DOC_NUMBER} - {CUSTOMER_NAME}',
  pksBody: `Kepada Yth. Bapak/Ibu Tim Legal & Manajemen {CUSTOMER_NAME},

Bersama email ini, kami sampaikan salinan Dokumen Resmi Perjanjian Kerja Sama (PKS) PT. LINTAS DATA INTERNASIONAL:

📋 DETAIL PERJANJIAN:
• Nomor Kontrak PKS: {DOC_NUMBER}
• Periode Layanan: {DOC_DATE}
• Nilai Kontrak: {TOTAL_AMOUNT}

📦 LAYANAN KERJA SAMA:
{ITEMS_LIST}

Berkas PDF PKS lengkap beserta Lampiran Syarat & Ketentuan Layanan (SLA) telah terlampir pada email ini.

Verifikasi Keaslian Dokumen:
{VERIFY_URL}

Hormat Kami,
PT. LINTAS DATA INTERNASIONAL
Telp/WA: {PHONE} | Website: {WEBSITE}`,
};

/**
 * Builds rich, email-client compatible HTML for the outgoing email
 */
export function buildFullEmailHtml(params: {
  type: 'SPH' | 'PKS' | 'Invoice';
  docNumber: string;
  customerName: string;
  messageBody: string;
  data: SPH | PKS | Invoice;
  companyProfile?: CompanyProfile;
  attachedPdfUrl?: string;
  fileName?: string;
}): string {
  const { type, docNumber, customerName, messageBody, data, companyProfile, attachedPdfUrl, fileName } = params;
  const meta = extractEmailPlaceholderData(type, data, companyProfile);

  const cleanFilename = fileName || `${type}_${docNumber.replace(/[\/\\]/g, '_')}.pdf`;
  const typeLabel = type === 'Invoice' ? 'Faktur Tagihan (Invoice)' : type === 'SPH' ? 'Surat Penawaran Harga (SPH)' : 'Perjanjian Kerja Sama (PKS)';

  // Format message text with paragraphs & breaklines
  const formattedBodyHtml = messageBody
    .split('\n\n')
    .map((block) => {
      const formattedLines = block
        .split('\n')
        .map((line) => {
          let cleanLine = line.trim();
          if (cleanLine.startsWith('•') || cleanLine.startsWith('-') || cleanLine.startsWith('*')) {
            return `<div style="padding-left: 8px; margin: 4px 0; color: #1e293b;">${cleanLine}</div>`;
          }
          if (cleanLine.startsWith('📋') || cleanLine.startsWith('📦') || cleanLine.startsWith('💰') || cleanLine.startsWith('🏦') || cleanLine.startsWith('🛡️')) {
            return `<div style="font-weight: bold; color: #0f172a; margin-top: 12px; margin-bottom: 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${cleanLine}</div>`;
          }
          return cleanLine;
        })
        .join('<br/>');

      return `<p style="margin: 0 0 14px 0; font-size: 13px; line-height: 1.6; color: #334155;">${formattedLines}</p>`;
    })
    .join('');

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${typeLabel} - ${docNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f1f5f9; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="620" style="max-width: 620px; width: 100%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- Corporate Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 26px 24px; text-align: center; border-bottom: 3px solid #0284c7;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #38bdf8;">
                ${meta.companyName}
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
                Portal Dokumen Resmi Enterprise &bull; ${typeLabel}
              </p>
            </td>
          </tr>

          <!-- Document Badge Strip -->
          <tr>
            <td style="background-color: #f8fafc; padding: 14px 24px; border-bottom: 1px solid #e2e8f0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <span style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Nomor Dokumen:</span><br/>
                    <strong style="font-size: 14px; color: #0f172a; font-family: monospace;">${docNumber}</strong>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; ${
                      type === 'Invoice'
                        ? meta.paymentStatus === 'LUNAS'
                          ? 'background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;'
                          : 'background-color: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3;'
                        : 'background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd;'
                    }">
                      ${type === 'Invoice' ? `STATUS: ${meta.paymentStatus}` : type}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message Body Content -->
          <tr>
            <td style="padding: 26px 24px;">
              
              <!-- User Message Body -->
              <div style="font-size: 13px; line-height: 1.65; color: #334155;">
                ${formattedBodyHtml}
              </div>

              ${
                type === 'Invoice' && meta.itemsTableHtml
                  ? `
                <!-- Invoice Items Summary Box -->
                <div style="margin: 22px 0; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; background-color: #ffffff;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #0f172a; color: #ffffff;">
                        <th style="padding: 8px 12px; font-size: 11px; text-align: center; color: #ffffff; width: 30px;">No</th>
                        <th style="padding: 8px 12px; font-size: 11px; text-align: left; color: #ffffff;">Deskripsi Layanan</th>
                        <th style="padding: 8px 12px; font-size: 11px; text-align: center; color: #ffffff; width: 60px;">Vol</th>
                        <th style="padding: 8px 12px; font-size: 11px; text-align: right; color: #ffffff; width: 100px;">Harga</th>
                        <th style="padding: 8px 12px; font-size: 11px; text-align: right; color: #ffffff; width: 110px;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${meta.itemsTableHtml}
                    </tbody>
                    <tfoot>
                      <tr style="background-color: #f8fafc; border-top: 1px solid #cbd5e1;">
                        <td colspan="4" style="padding: 6px 12px; font-size: 12px; text-align: right; color: #64748b;">Subtotal:</td>
                        <td style="padding: 6px 12px; font-size: 12px; text-align: right; font-weight: bold; font-family: monospace; color: #334155;">${formatIDR(meta.subtotal)}</td>
                      </tr>
                      <tr style="background-color: #f8fafc;">
                        <td colspan="4" style="padding: 6px 12px; font-size: 12px; text-align: right; color: #64748b;">PPN (${meta.taxPercent}%):</td>
                        <td style="padding: 6px 12px; font-size: 12px; text-align: right; font-weight: bold; font-family: monospace; color: #334155;">${formatIDR(meta.taxAmount)}</td>
                      </tr>
                      <tr style="background-color: #f0f9ff; border-top: 2px solid #0284c7;">
                        <td colspan="4" style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: 800; color: #0369a1;">TOTAL TAGIHAN:</td>
                        <td style="padding: 10px 12px; font-size: 14px; text-align: right; font-weight: 900; font-family: monospace; color: #0284c7;">${formatIDR(meta.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              `
                  : ''
              }

              ${
                type === 'Invoice'
                  ? `
                <!-- Official Bank Account Card -->
                <div style="background-color: #f8fafc; border: 1.5px dashed #0284c7; border-radius: 12px; padding: 16px; margin: 20px 0;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td>
                        <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: bold; color: #0369a1; text-transform: uppercase;">
                          🏦 REKENING PEMBAYARAN RESMI PT. LDI:
                        </p>
                        <p style="margin: 0; font-size: 13px; font-weight: bold; color: #0f172a;">${meta.bankName}</p>
                        <p style="margin: 4px 0; font-size: 18px; font-weight: 900; color: #0284c7; font-family: monospace; letter-spacing: 1px;">
                          ${meta.bankAccount}
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #475569;">
                          a.n. <strong>${meta.bankHolder}</strong>
                          ${meta.bankBranch ? ` &bull; Cabang: ${meta.bankBranch}` : ''}
                        </p>
                        ${meta.bankNotes ? `<p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b; font-style: italic;">* ${meta.bankNotes}</p>` : ''}
                      </td>
                    </tr>
                  </table>
                </div>
              `
                  : ''
              }

              <!-- Direct Attachment Action Card (Always included to match Email Preview) -->
              <div style="background-color: #f0f9ff; border: 2px solid #0284c7; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #0369a1;">
                  📎 Lampiran Dokumen PDF Resmi Terlampir
                </p>
                <p style="margin: 0 0 16px 0; font-size: 11px; color: #64748b; font-family: monospace;">
                  ${cleanFilename}
                </p>
                <table border="0" cellpadding="0" cellspacing="0" align="center">
                  <tr>
                    <td align="center" style="border-radius: 8px; background-color: #0284c7;">
                      <a href="${attachedPdfUrl || meta.verifyUrl || '#'}" target="_blank" rel="noopener noreferrer" style="font-size: 13px; font-weight: bold; color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 8px; display: inline-block; font-family: sans-serif;">
                        📥 Unduh Berkas PDF Dokumen (${type})
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 14px 0 0 0; font-size: 11px; color: #64748b;">
                  Dokumen ini telah ditandatangani dan diverifikasi secara digital oleh ${meta.companyName}.
                </p>
              </div>

              <!-- Verification Box -->
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; margin-top: 18px; font-size: 12px; color: #475569;">
                <strong style="color: #0f172a; display: block; margin-bottom: 4px;">🛡️ Verifikasi Keaslian Dokumen:</strong>
                Anda dapat memverifikasi otentisitas dokumen ini secara langsung via Portal Keaslian PT. LDI:<br/>
                <a href="${meta.verifyUrl}" style="color: #0284c7; font-weight: bold; text-decoration: underline; word-break: break-all;">
                  ${meta.verifyUrl}
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.5;">
              Email ini dikirim secara otomatis oleh Gateway Resmi <strong>${meta.companyName}</strong>.<br/>
              Kantor Pusat: BSD Green Office Park, Tangerang, Banten &bull; Telp/WA: ${meta.phone}<br/>
              &copy; ${new Date().getFullYear()} ${meta.companyName}. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
