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
  mailketingApiKey: 'e6f901cb964cd1c0fb59453f3450329d',
  mailketingSenderEmail: 'alwanemail@gmail.com',
  emailTemplates: {
    defaultCc: 'finance@ldi.co.id, sales@ldi.co.id',
    sphSubject: '[PT. LDI] Dokumen Penawaran Harga (SPH) {DOC_NUMBER} - {CUSTOMER_NAME}',
    sphBody: `Kepada Yth. Bapak/Ibu Tim Manajemen {CUSTOMER_NAME},

Bersama email ini, kami dari PT. LINTAS DATA INTERNASIONAL sampaikan Dokumen Resmi Surat Penawaran Harga (SPH) dengan rincian berikut:

• Nomor SPH: {DOC_NUMBER}
• Tanggal Terbit: {DOC_DATE}
• Total Nilai Penawaran: {TOTAL_AMOUNT}

Berkas PDF resmi bertanda tangan digital dan stempel sah PT. LDI telah terlampir secara otomatis pada email ini.

Anda dapat melakukan verifikasi keaslian dokumen secara langsung melalui Portal Keaslian PT. LDI:
https://e-office.ldi.co.id/verify?doc={DOC_NUMBER}

Demikian disampaikan. Jika ada pertanyaan lebih lanjut, silakan menghubungi kami.

Hormat Kami,
PT. LINTAS DATA INTERNASIONAL
Telp/WA: {PHONE} | Website: https://e-office.ldi.co.id`,
    pksSubject: '[PT. LDI] Perjanjian Kerja Sama (PKS) {DOC_NUMBER} - {CUSTOMER_NAME}',
    pksBody: `Kepada Yth. Bapak/Ibu Tim Manajemen {CUSTOMER_NAME},

Bersama email ini, kami sampaikan salinan Dokumen Resmi Perjanjian Kerja Sama (PKS) PT. LINTAS DATA INTERNASIONAL:

• Nomor Kontrak PKS: {DOC_NUMBER}
• Periode Layanan: {DOC_DATE}
• Nilai Kontrak: {TOTAL_AMOUNT}

Berkas PDF PKS lengkap beserta Lampiran Syarat & Ketentuan Layanan (SLA) telah terlampir pada email ini.

Hormat Kami,
PT. LINTAS DATA INTERNASIONAL
Telp/WA: {PHONE} | Website: https://e-office.ldi.co.id`,
    invoiceSubject: '[PT. LDI] Tagihan Penagihan (Invoice) {DOC_NUMBER} - {CUSTOMER_NAME}',
    invoiceBody: `Kepada Yth. Bapak/Ibu Tim Keuangan {CUSTOMER_NAME},

Terlampir dokumen Tagihan Invoice Resmi dari PT. LINTAS DATA INTERNASIONAL untuk periode layanan berjalan:

• Nomor Invoice: {DOC_NUMBER}
• Tanggal Terbit: {DOC_DATE}
• Total Tagihan: {TOTAL_AMOUNT}

Pembayaran dapat ditransfer ke rekening resmi PT. LDI yang tertera pada lembar invoice PDF terlampir.

Terima kasih atas kerja sama dan kepercayaan Anda.

Hormat Kami,
Departemen Keuangan PT. LINTAS DATA INTERNASIONAL
Telp/WA: {PHONE} | Website: https://e-office.ldi.co.id`,
  },
};

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_SPH: SPH[] = [];

export const INITIAL_PKS: PKS[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

