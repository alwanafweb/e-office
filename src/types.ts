export type DocumentStatus = 'Draft' | 'Dikirim' | 'Disetujui' | 'Ditolak' | 'Aktif' | 'Selesai' | 'Terbayar' | 'Belum Bayar' | 'Jatuh Tempo' | 'Dibatalkan';

export type ServiceCategory = 'Internet Dedicated' | 'Cloud Server' | 'Colocation Server' | 'Datacenter Managed' | 'Custom Layanan';

export interface ItemService {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  qty: number;
  unit: string; // e.g., 'Mbps', 'Bulan', 'Unit', 'Node'
  price: number; // Dalam IDR
  discount: number; // Dalam IDR atau persen
}

export interface TechnicalSpec {
  title: string;
  value: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  position: string;
  email: string;
  phone: string;
  address: string;
  picName?: string;
  picPosition?: string;
  code?: string;
  city?: string;
  npwp?: string;
  status: 'Aktif' | 'Lead' | 'Nonaktif';
  notes?: string;
  createdAt: string;
}

export interface SPH {
  id: string;
  sphNumber: string; // SPH/LDI/YYYY/MM/XXX
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  validityDays: number; // Masa berlaku
  items: ItemService[];
  technicalSpecs: TechnicalSpec[];
  termsAndConditions: string[];
  subtotal: number;
  discountTotal: number;
  taxPercent: number; // e.g. 11%
  taxAmount: number;
  grandTotal: number;
  status: 'Draft' | 'Dikirim' | 'Disetujui' | 'Ditolak' | 'Dikonversi ke PKS' | 'Dikonversi ke Invoice';
  notes?: string;
  customerRepresentative?: string;
  signedByLDI?: string; // TTD Base64 atau Nama
  signedDate?: string;
  pksConvertedId?: string;
  invoiceConvertedId?: string;
  isLocked?: boolean;
  lockedAt?: string;
  lockedBy?: string;
}

export interface PKSClause {
  article: number;
  title: string;
  content: string;
}

export interface PKS {
  id: string;
  pksNumber: string; // PKS/LDI/YYYY/MM/XXX
  sphReferenceNumber?: string;
  customerId: string;
  customerName: string;
  customerRepresentative: string;
  customerRepPosition: string;
  customerAddress: string;
  startDate: string;
  endDate: string;
  contractDurationMonths: number;
  serviceItems: ItemService[];
  monthlyValue: number;
  totalContractValue: number;
  slaPercent: number; // e.g. 99.9%
  clauses: PKSClause[];
  status: 'Draft' | 'Menunggu TTD' | 'Aktif' | 'Selesai' | 'Dibatalkan';
  party1Signed: boolean;
  party1SignerName: string;
  party1SignerPosition: string;
  party1SignatureData?: string; // Base64
  party2Signed: boolean;
  party2SignerName: string;
  party2SignerPosition: string;
  party2SignatureData?: string; // Base64
  signedDate?: string;
  notes?: string;
  isLocked?: boolean;
  lockedAt?: string;
  lockedBy?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
  recordedBy?: string;
  createdAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // INV/LDI/YYYY/MM/XXX
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail: string;
  customerRepresentative?: string;
  sphReference?: string;
  pksReference?: string;
  issueDate: string;
  dueDate: string;
  billingType?: 'one_time' | 'monthly';
  autoSendMonthly?: boolean;
  lastSentRecurringMonth?: string;
  items: ItemService[];
  subtotal: number;
  discountTotal: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  status: 'Draft' | 'Belum Bayar' | 'Dibayar Sebagian' | 'Lunas' | 'Jatuh Tempo' | 'Dibatalkan';
  paidAmount?: number;
  payments?: PaymentRecord[];
  paymentDate?: string;
  paymentMethod?: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branch?: string;
    notes?: string;
  };
  notes?: string;
  signedByFinance?: string;
  signatureData?: string;
  isLocked?: boolean;
  lockedAt?: string;
  lockedBy?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'SUPER_ADMIN';
  createdAt?: string;
}

export interface EmailTemplates {
  sphSubject?: string;
  sphBody?: string;
  pksSubject?: string;
  pksBody?: string;
  invoiceSubject?: string;
  invoiceBody?: string;
  defaultCc?: string;
  autoSendSph?: boolean;
  autoSendInvoice?: boolean;
}

export interface CompanyProfile {
  name: string;
  legalName: string;
  shortName?: string;
  address: string;
  website: string;
  email: string;
  phone: string;
  whatsapp: string;
  npwp: string;
  logoUrl?: string;
  faviconUrl?: string;
  bankDetails: {
    id?: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branch: string;
    isDefault?: boolean;
    notes?: string;
  }[];
  directorName: string;
  directorPosition: string;
  financeManager: string;
  defaultStampBase64?: string;
  defaultSignatureBase64?: string;
  emailTemplates?: EmailTemplates;
  mailketingApiKey?: string;
  mailketingSenderEmail?: string;
}

export interface FinancialFilter {
  month: number; // 1 - 12
  year: number;
  category?: ServiceCategory | 'Semua';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: 'Dibuat' | 'Diubah' | 'Ditandatangani' | 'Dikirim' | 'Dihapus' | 'Status Diubah' | 'Sistem';
  docType: 'SPH' | 'PKS' | 'Invoice' | 'Pelanggan' | 'Pengaturan';
  docNumberOrName: string;
  performedBy: string;
  details: string;
}
