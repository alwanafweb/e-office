import { CompanyProfile, Customer, Invoice, PKS, ServiceCategory, SPH } from '../types';

export const COMPANY_PROFILE: CompanyProfile = {
  name: 'PT. LINTAS DATA INTERNASIONAL',
  legalName: 'PT. LINTAS DATA INTERNASIONAL',
  address: 'My Republic Plaza, Jl. BSD Green Office Park Jl. BSD Grand Boulevard No.6 Wing A Lantai Dasar Zona 6, Sampora, Kec. Cisauk, Kabupaten Tangerang, Banten 15345',
  website: 'e-office.ldi.co.id',
  email: 'support@ldi.co.id',
  phone: '087777040496',
  whatsapp: '087777040496',
  npwp: '01.234.567.8-411.000',
  bankDetails: [
    {
      id: 'bank-1',
      bankName: 'Bank Central Asia (BCA)',
      accountNumber: '8830-1928-33',
      accountHolder: 'PT LINTAS DATA INTERNASIONAL',
      branch: 'KCP BSD Green Office Park',
      isDefault: true,
      notes: 'Transfer Rekening Utama untuk Layanan Internet & Cloud',
    },
    {
      id: 'bank-2',
      bankName: 'Bank Mandiri',
      accountNumber: '164-00-0982711-2',
      accountHolder: 'PT LINTAS DATA INTERNASIONAL',
      branch: 'KCP BSD City Tangerang',
      isDefault: false,
      notes: 'Rekening Cadangan Pembayaran Faktur Kontrak PKS',
    },
  ],
  directorName: 'Irwan Setiawan, S.T.',
  directorPosition: 'Direktur Utama',
  financeManager: 'Siti Rahmawati, S.E.',
  emailGatewayMode: 'mailketing',
  mailketingApiKey: 'e6f901cb964cd1c0fb59453f3450329d',
  mailketingSenderEmail: 'alwanemail@gmail.com',
  smtpConfig: {
    enabled: false,
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromName: 'PT. LINTAS DATA INTERNASIONAL',
    fromEmail: 'admin@ldi.co.id',
    providerPreset: 'gmail',
  },
  emailTemplates: {
    autoSendSph: true,
    autoSendInvoice: true,
    defaultCc: 'finance@ldi.co.id, sales@ldi.co.id',
    sphSubject: '[PT. LDI] Surat Penawaran Harga (SPH) #{DOC_NUMBER} - {CUSTOMER_NAME}',
    sphBody: `Kepada Yth. Bapak/Ibu Tim Manajemen {CUSTOMER_NAME},

Bersama email ini, kami dari PT. LINTAS DATA INTERNASIONAL menyampaikan Dokumen Resmi Surat Penawaran Harga (SPH) dengan rincian sebagai berikut:

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
  },
};

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_SPH: SPH[] = [];

export const INITIAL_PKS: PKS[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

