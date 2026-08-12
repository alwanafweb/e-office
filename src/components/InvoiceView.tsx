import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  DollarSign,
  Wallet,
  History,
  CheckCircle2,
  PieChart,
  PlusCircle,
  Calendar,
  FileText,
  FileSpreadsheet,
  Download,
  Lock,
  Unlock,
  Save,
  RotateCcw,
} from 'lucide-react';
import { CompanyProfile, Customer, Invoice, ItemService, PaymentRecord, PKS, ServiceCategory, SPH } from '../types';
import { formatDateIndonesian, formatIDR, generateDocNumber } from '../utils/formatters';
import { COMPANY_PROFILE } from '../data/initialData';
import { exportInvoicesToExcel } from '../utils/excelExport';

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

interface InvoiceViewProps {
  invoices: Invoice[];
  customers: Customer[];
  sphList: SPH[];
  pksList: PKS[];
  companyProfile?: CompanyProfile;
  onAddInvoice: (invoice: Invoice) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onPreviewInvoice: (invoice: Invoice) => void;
  preSelectedCustomer?: Customer | null;
  onUpdateCompanyProfile?: (profile: CompanyProfile) => void;
  onToggleLockDocument?: (type: 'SPH' | 'PKS' | 'Invoice', id: string, forceState?: boolean) => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  invoices,
  customers,
  sphList,
  pksList,
  companyProfile,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onPreviewInvoice,
  preSelectedCustomer,
  onUpdateCompanyProfile,
  onToggleLockDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [historyModalInvoice, setHistoryModalInvoice] = useState<Invoice | null>(null);

  // Bank Account Resolution
  const availableBanks = companyProfile?.bankDetails || COMPANY_PROFILE.bankDetails;
  const defaultBankIndex = availableBanks.findIndex((b) => b.isDefault) >= 0
    ? availableBanks.findIndex((b) => b.isDefault)
    : 0;

  const [selectedBankKey, setSelectedBankKey] = useState<string>(String(defaultBankIndex));
  const [customBankName, setCustomBankName] = useState('Bank Central Asia (BCA)');
  const [customAccountNumber, setCustomAccountNumber] = useState('');
  const [customAccountHolder, setCustomAccountHolder] = useState(companyProfile?.legalName || COMPANY_PROFILE.legalName);
  const [customBranch, setCustomBranch] = useState('KCP Utama');
  const [customNotes, setCustomNotes] = useState('');

  // Payment Form State (Partial / Full)
  const [paymentType, setPaymentType] = useState<'PELUNASAN' | 'PARSIAL'>('PARSIAL');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank BCA');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Form State
  const [selectedCustId, setSelectedCustId] = useState<string>(
    preSelectedCustomer ? preSelectedCustomer.id : customers[0]?.id || ''
  );
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  const [sphRef, setSphRef] = useState('');
  const [pksRef, setPksRef] = useState('');
  const [useTax, setUseTax] = useState<boolean>(true);

  const [items, setItems] = useState<ItemService[]>([
    {
      id: 'ITM-INV-01',
      category: 'Internet Dedicated',
      name: 'Tagihan Layanan Internet Dedicated (Periode Bulan Ini)',
      description: 'Layanan Internet Dedicated Fiber Optic 1:1 Symmetrical Speed SLA 99.9%',
      qty: 100,
      unit: 'Mbps',
      price: 75000,
      discount: 0,
    },
  ]);

  // Auto-Save Draft State (30 seconds interval)
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);
  const [hasDraftAvailable, setHasDraftAvailable] = useState<boolean>(false);

  // Check if draft exists on mount / form open
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ldi_draft_invoice');
      if (saved) {
        setHasDraftAvailable(true);
        const parsed = JSON.parse(saved);
        if (parsed.savedAt) setLastAutoSaveTime(parsed.savedAt);
      }
    } catch (e) {
      // Ignore
    }
  }, [isFormOpen]);

  // Auto-save every 30 seconds when form modal is open
  useEffect(() => {
    if (!isFormOpen) return;

    const autoSaveInterval = setInterval(() => {
      try {
        const timeStr = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const draftData = {
          selectedCustId,
          issueDate,
          dueDate,
          sphRef,
          pksRef,
          useTax,
          items,
          selectedBankKey,
          customBankName,
          customAccountNumber,
          customAccountHolder,
          customBranch,
          customNotes,
          savedAt: timeStr,
        };
        localStorage.setItem('ldi_draft_invoice', JSON.stringify(draftData));
        setLastAutoSaveTime(timeStr);
        setHasDraftAvailable(true);
      } catch (err) {
        console.error('Failed auto-saving Invoice draft:', err);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [
    isFormOpen,
    selectedCustId,
    issueDate,
    dueDate,
    sphRef,
    pksRef,
    useTax,
    items,
    selectedBankKey,
    customBankName,
    customAccountNumber,
    customAccountHolder,
    customBranch,
    customNotes,
  ]);

  const handleLoadDraft = () => {
    try {
      const saved = localStorage.getItem('ldi_draft_invoice');
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.selectedCustId) setSelectedCustId(draft.selectedCustId);
        if (draft.issueDate) setIssueDate(draft.issueDate);
        if (draft.dueDate) setDueDate(draft.dueDate);
        if (draft.sphRef !== undefined) setSphRef(draft.sphRef);
        if (draft.pksRef !== undefined) setPksRef(draft.pksRef);
        if (typeof draft.useTax === 'boolean') setUseTax(draft.useTax);
        if (Array.isArray(draft.items)) setItems(draft.items);
        if (draft.selectedBankKey) setSelectedBankKey(draft.selectedBankKey);
        if (draft.customBankName) setCustomBankName(draft.customBankName);
        if (draft.customAccountNumber !== undefined) setCustomAccountNumber(draft.customAccountNumber);
        if (draft.customAccountHolder !== undefined) setCustomAccountHolder(draft.customAccountHolder);
        if (draft.customBranch !== undefined) setCustomBranch(draft.customBranch);
        if (draft.customNotes !== undefined) setCustomNotes(draft.customNotes);
        if (draft.savedAt) setLastAutoSaveTime(draft.savedAt);
      }
    } catch (e) {
      console.error('Failed loading Invoice draft:', e);
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem('ldi_draft_invoice');
    setHasDraftAvailable(false);
    setLastAutoSaveTime(null);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `ITM-INV-${Date.now()}`,
        category: 'Internet Dedicated',
        name: 'Item Layanan',
        description: 'Rincian deskripsi',
        qty: 1,
        unit: 'Bulan',
        price: 1000000,
        discount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemService, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const subtotal = items.reduce((acc, it) => acc + it.qty * it.price, 0);
  const discountTotal = items.reduce((acc, it) => acc + (it.discount || 0), 0);
  const taxableSubtotal = subtotal - discountTotal;
  const taxPercent = useTax ? 11 : 0;
  const taxAmount = Math.round(taxableSubtotal * (taxPercent / 100));
  const grandTotal = taxableSubtotal + taxAmount;

  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === selectedCustId);
    if (!cust) return;

    let selectedBankInfo;
    if (selectedBankKey === 'CUSTOM') {
      selectedBankInfo = {
        bankName: customBankName.trim() || 'Bank Custom',
        accountNumber: customAccountNumber.trim() || '000-000-0000',
        accountHolder: customAccountHolder.trim() || companyProfile?.legalName || COMPANY_PROFILE.legalName,
        branch: customBranch.trim() || 'KCP Utama',
        notes: customNotes.trim(),
      };
    } else {
      const idx = Number(selectedBankKey);
      const b = availableBanks[idx] || availableBanks[0];
      selectedBankInfo = {
        bankName: b.bankName,
        accountNumber: b.accountNumber,
        accountHolder: b.accountHolder,
        branch: b.branch,
        notes: b.notes,
      };
    }

    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: generateDocNumber('INV', invoices.length + 1),
      customerId: cust.id,
      customerName: cust.companyName,
      customerAddress: cust.address,
      customerPhone: cust.phone,
      customerEmail: cust.email,
      sphReference: sphRef || undefined,
      pksReference: pksRef || undefined,
      issueDate,
      dueDate,
      items,
      subtotal,
      discountTotal,
      taxPercent,
      taxAmount,
      grandTotal,
      status: 'Belum Bayar',
      bankInfo: selectedBankInfo,
      signedByFinance: companyProfile?.financeManager || COMPANY_PROFILE.financeManager,
    };

    onAddInvoice(newInvoice);
    localStorage.removeItem('ldi_draft_invoice');
    setHasDraftAvailable(false);
    setLastAutoSaveTime(null);
    setIsFormOpen(false);
    onPreviewInvoice(newInvoice);
  };

  const handleDeleteBankOption = (indexToDelete: number) => {
    if (indexToDelete < 0 || indexToDelete >= availableBanks.length) return;

    if (availableBanks.length <= 1) {
      alert('Minimal harus ada 1 rekening penampung. Anda tidak dapat menghapus semua pilihan rekening.');
      return;
    }

    const updatedBanks = availableBanks.filter((_, idx) => idx !== indexToDelete);

    if (onUpdateCompanyProfile && companyProfile) {
      onUpdateCompanyProfile({
        ...companyProfile,
        bankDetails: updatedBanks,
      });
    }

    setSelectedBankKey('0');
  };

  const handleOpenPaymentModal = (inv: Invoice) => {
    setPaymentModalInvoice(inv);
    const currentPaid = getInvoicePaidAmount(inv);
    const remaining = Math.max(0, inv.grandTotal - currentPaid);
    setPaymentType('PARSIAL');
    setPaymentAmount(remaining > 0 ? remaining : inv.grandTotal);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Transfer Bank BCA');
    setPaymentNotes('');
  };

  const handleConfirmPayment = () => {
    if (!paymentModalInvoice) return;
    const currentPaid = getInvoicePaidAmount(paymentModalInvoice);
    const remaining = Math.max(0, paymentModalInvoice.grandTotal - currentPaid);

    let amountToPay = paymentAmount;
    if (paymentType === 'PELUNASAN') {
      amountToPay = remaining;
    }

    if (amountToPay <= 0) {
      alert('Nominal pembayaran harus lebih besar dari Rp 0.');
      return;
    }

    if (amountToPay > remaining && remaining > 0) {
      amountToPay = remaining;
    }

    const newRecord: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      amount: amountToPay,
      paymentDate,
      paymentMethod,
      notes: paymentNotes.trim() || (amountToPay >= remaining ? 'Pelunasan Invoice' : 'Pembayaran Cicilan (DP / Term)'),
      recordedBy: 'Admin Finance',
      createdAt: new Date().toISOString(),
    };

    const newPayments = [...(paymentModalInvoice.payments || []), newRecord];
    const newPaidTotal = currentPaid + amountToPay;

    let newStatus: Invoice['status'] = 'Belum Bayar';
    if (newPaidTotal >= paymentModalInvoice.grandTotal) {
      newStatus = 'Lunas';
    } else if (newPaidTotal > 0) {
      newStatus = 'Dibayar Sebagian';
    }

    const updated: Invoice = {
      ...paymentModalInvoice,
      status: newStatus,
      paidAmount: newPaidTotal,
      payments: newPayments,
      paymentDate,
      paymentMethod,
    };

    onUpdateInvoice(updated);
    setPaymentModalInvoice(null);
    if (historyModalInvoice?.id === paymentModalInvoice.id) {
      setHistoryModalInvoice(updated);
    }
  };

  const handleDeletePaymentRecord = (paymentId: string) => {
    if (!historyModalInvoice) return;

    const currentPayments = historyModalInvoice.payments || [];
    const updatedPayments = currentPayments.filter((p) => p.id !== paymentId);
    const newPaidTotal = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

    let newStatus: Invoice['status'] = 'Belum Bayar';
    if (newPaidTotal >= historyModalInvoice.grandTotal) {
      newStatus = 'Lunas';
    } else if (newPaidTotal > 0) {
      newStatus = 'Dibayar Sebagian';
    }

    const updated: Invoice = {
      ...historyModalInvoice,
      status: newStatus,
      paidAmount: newPaidTotal,
      payments: updatedPayments,
    };

    onUpdateInvoice(updated);
    setHistoryModalInvoice(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            Sistem Tagihan & Faktur Penagihan (Invoice)
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Terbitkan faktur tagihan resmi, verifikasi pembayaran lunas, dan kirimkan invoice PDF Kop Surat PT LDI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => exportInvoicesToExcel(filteredInvoices, 'Daftar_Invoice_PT_LDI')}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            title="Unduh seluruh data invoice ke format file Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Invoice Baru</span>
          </button>
        </div>
      </div>

      {/* Summary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tagihan Diterbitkan</p>
            <p className="font-mono text-lg font-black text-slate-900 mt-0.5">
              {formatIDR(invoices.reduce((a, b) => a + b.grandTotal, 0))}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{invoices.length} dokumen invoice</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Terbayar / Realisasi</p>
            <p className="font-mono text-lg font-black text-emerald-700 mt-0.5">
              {formatIDR(invoices.reduce((a, b) => a + getInvoicePaidAmount(b), 0))}
            </p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              {invoices.filter((i) => i.status === 'Lunas').length} Lunas • {invoices.filter((i) => i.status === 'Dibayar Sebagian').length} Sebagian
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sisa Piutang Belum Lunas</p>
            <p className="font-mono text-lg font-black text-amber-700 mt-0.5">
              {formatIDR(invoices.reduce((a, b) => a + getInvoiceRemainingAmount(b), 0))}
            </p>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">
              {invoices.filter((i) => i.status === 'Belum Bayar' || i.status === 'Dibayar Sebagian' || i.status === 'Jatuh Tempo').length} tagihan outstanding
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Pembayaran</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                {invoices.filter((i) => i.status === 'Lunas').length} Lunas
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-black">
                {invoices.filter((i) => i.status === 'Dibayar Sebagian').length} Cicil
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">
              {invoices.filter((i) => i.status === 'Belum Bayar').length} Belum Bayar
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. Invoice / Pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Status Pembayaran:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="Semua">Semua Status</option>
            <option value="Lunas">Lunas (Paid)</option>
            <option value="Dibayar Sebagian">Dibayar Sebagian (Partial)</option>
            <option value="Belum Bayar">Belum Bayar (Unpaid)</option>
            <option value="Jatuh Tempo">Jatuh Tempo (Overdue)</option>
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto touch-scroll no-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                <th className="p-3.5">Nomor Invoice</th>
                <th className="p-3.5">Pelanggan Tagihan</th>
                <th className="p-3.5">Tgl Terbit</th>
                <th className="p-3.5">Jatuh Tempo</th>
                <th className="p-3.5 text-right">Rincian Pembayaran</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const paid = getInvoicePaidAmount(inv);
                  const remaining = getInvoiceRemainingAmount(inv);
                  const percentPaid = inv.grandTotal > 0 ? Math.min(100, Math.round((paid / inv.grandTotal) * 100)) : 0;
                  const hasPayments = inv.payments && inv.payments.length > 0;

                  return (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="p-3.5">
                        <p className="font-mono font-bold text-blue-900">{inv.invoiceNumber}</p>
                        {inv.bankInfo && (
                          <p className="text-[10px] text-slate-500 font-sans mt-0.5 flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[180px] font-medium" title={`${inv.bankInfo.bankName} - ${inv.bankInfo.accountNumber}`}>
                              {inv.bankInfo.bankName.split('(')[0]}: <span className="font-mono font-bold text-slate-700">{inv.bankInfo.accountNumber}</span>
                            </span>
                          </p>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">{inv.customerName}</td>
                      <td className="p-3.5 text-slate-600">{formatDateIndonesian(inv.issueDate)}</td>
                      <td className="p-3.5 text-rose-700 font-semibold">{formatDateIndonesian(inv.dueDate)}</td>
                      <td className="p-3.5 text-right font-mono">
                        <p className="font-bold text-slate-900">{formatIDR(inv.grandTotal)}</p>
                        {inv.status === 'Dibayar Sebagian' || (paid > 0 && inv.status !== 'Lunas') ? (
                          <div className="mt-1 space-y-0.5">
                            <div className="text-[10px] text-emerald-700 font-bold">
                              Masuk: {formatIDR(paid)}
                            </div>
                            <div className="text-[10px] text-rose-600 font-bold">
                              Sisa: {formatIDR(remaining)}
                            </div>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-auto mt-1 border border-slate-200">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${percentPaid}%` }}
                              />
                            </div>
                          </div>
                        ) : paid >= inv.grandTotal && inv.grandTotal > 0 ? (
                          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            Lunas 100%
                          </p>
                        ) : null}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border shadow-2xs ${
                              inv.status === 'Lunas'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : inv.status === 'Dibayar Sebagian'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : inv.status === 'Belum Bayar'
                                ? 'bg-orange-100 text-orange-800 border-orange-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {inv.status === 'Dibayar Sebagian' ? `Dibayar Sebagian (${percentPaid}%)` : inv.status}
                          </span>
                          {inv.isLocked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-[9px] font-black uppercase tracking-wider">
                              <Lock className="w-2.5 h-2.5 text-rose-600" /> TERKUNCI
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {inv.status !== 'Lunas' && (
                            <button
                              onClick={() => handleOpenPaymentModal(inv)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs"
                              title="Catat Pembayaran Parsial / Pelunasan"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              Bayar / Cicil
                            </button>
                          )}

                          <button
                            onClick={() => setHistoryModalInvoice(inv)}
                            className={`p-1.5 rounded relative ${
                              hasPayments
                                ? 'text-indigo-700 hover:bg-indigo-50 font-bold'
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                            title="Lihat Riwayat Cicilan / Catatan Pembayaran"
                          >
                            <History className="w-4 h-4" />
                            {hasPayments && (
                              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                                {inv.payments?.length}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => onPreviewInvoice(inv)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Lihat / Print PDF Invoice Kop Surat"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Lock / Unlock Toggle Button */}
                          {onToggleLockDocument && (
                            <button
                              onClick={() => onToggleLockDocument('Invoice', inv.id)}
                              className={`p-1.5 rounded transition ${
                                inv.isLocked
                                  ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title={inv.isLocked ? 'Dokumen Terkunci. Klik untuk membuka kunci.' : 'Klik untuk mengunci dokumen ini.'}
                            >
                              {inv.isLocked ? <Lock className="w-4 h-4 text-rose-600" /> : <Unlock className="w-4 h-4" />}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (inv.isLocked) {
                                alert(`Dokumen Invoice ${inv.invoiceNumber} sedang DIKUNCI (Locked) karena sudah didownload/diterbitkan sebagai PDF. Silakan buka kunci dokumen terlebih dahulu jika ingin menghapusnya.`);
                                return;
                              }
                              onDeleteInvoice(inv.id);
                            }}
                            className={`p-1.5 rounded transition ${inv.isLocked ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600'}`}
                            title={inv.isLocked ? 'Dokumen Terkunci (Tidak dapat dihapus)' : 'Hapus Invoice'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    Belum ada Invoice Tagihan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                  <span>Buat Invoice Penagihan Baru</span>
                  <span className="bg-blue-800 text-cyan-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-600/50 flex items-center gap-1 font-normal">
                    <Save className="w-3 h-3 text-cyan-300 animate-pulse" /> Auto-Save 30s
                  </span>
                </h3>
                <p className="text-xs text-blue-300 font-mono mt-0.5">
                  Nomor Auto: {generateDocNumber('INV', invoices.length + 1)}
                  {lastAutoSaveTime && ` • Draf Tersimpan: ${lastAutoSaveTime}`}
                </p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs touch-scroll">
              {/* Draft Banner Notification */}
              {hasDraftAvailable && (
                <div key="invoice-draft-banner" className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-amber-900 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Draf Invoice Tagihan Tersimpan Otomatis</p>
                      <p className="text-[11px] text-amber-800">
                        {lastAutoSaveTime ? `Terakhir disimpan pukul ${lastAutoSaveTime}.` : 'Data form otomatis disimpan ke memori lokal setiap 30 detik.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadDraft}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Muat Draf
                    </button>
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="text-amber-800 hover:text-amber-950 font-bold px-2 py-1 text-xs hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Pelanggan Tagihan *</label>
                  <select
                    value={selectedCustId}
                    onChange={(e) => setSelectedCustId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-900"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Referensi SPH (Opsional)</label>
                  <select
                    value={sphRef}
                    onChange={(e) => {
                      const selectedNo = e.target.value;
                      setSphRef(selectedNo);
                      const foundSph = sphList.find((s) => s.sphNumber === selectedNo);
                      if (foundSph) {
                        setSelectedCustId(foundSph.customerId);
                        setItems(foundSph.items);
                        setUseTax(foundSph.taxPercent > 0);
                      }
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-900"
                  >
                    <option value="">-- Tanpa Referensi SPH --</option>
                    {sphList.map((s) => (
                      <option key={s.id} value={s.sphNumber}>
                        {s.sphNumber} - {s.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Tanggal Terbit</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Tanggal Jatuh Tempo</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-rose-700 font-bold"
                  />
                </div>
              </div>

              {/* Rekening Bank Pembayaran Invoice */}
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="font-bold text-emerald-950 uppercase tracking-wide text-xs flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    Pilih Rekening Bank Pembayaran Invoice
                  </h4>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    (Rekening Bank Penampung Resmi PT LDI / Custom Nomor Rekening)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800">
                        Pilihan Rekening Penampung
                      </label>
                      {selectedBankKey !== 'CUSTOM' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteBankOption(Number(selectedBankKey))}
                          className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1 hover:underline"
                          title="Hapus Rekening Penampung Ini dari Pilihan"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          Hapus Rekening Ini
                        </button>
                      )}
                    </div>
                    <select
                      value={selectedBankKey}
                      onChange={(e) => setSelectedBankKey(e.target.value)}
                      className="w-full p-2.5 border border-emerald-300 rounded-lg bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    >
                      {availableBanks.map((b, idx) => (
                        <option key={b.id || idx} value={String(idx)}>
                          {b.bankName} - {b.accountNumber} ({b.accountHolder}) {b.isDefault ? '★ [Utama]' : ''}
                        </option>
                      ))}
                      <option value="CUSTOM">-- Custom Rekening Khusus / Virtual Account... --</option>
                    </select>
                  </div>

                  {selectedBankKey !== 'CUSTOM' && (
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between gap-2">
                      <div className="flex flex-col justify-center">
                        <p className="font-black text-emerald-950 text-xs">
                          {availableBanks[Number(selectedBankKey)]?.bankName || ''}
                        </p>
                        <p className="font-mono font-bold text-slate-900 text-sm">
                          {availableBanks[Number(selectedBankKey)]?.accountNumber || ''}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          a.n. {availableBanks[Number(selectedBankKey)]?.accountHolder || ''}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteBankOption(Number(selectedBankKey))}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition shrink-0"
                        title="Hapus Rekening Penampung Ini dari Daftar Pilihan"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span className="hidden sm:inline">Hapus Rekening</span>
                      </button>
                    </div>
                  )}
                </div>

                {selectedBankKey === 'CUSTOM' && (
                  <div className="bg-white p-3 rounded-xl border border-emerald-300 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Nama Bank Custom *</label>
                      <input
                        type="text"
                        required
                        value={customBankName}
                        onChange={(e) => setCustomBankName(e.target.value)}
                        placeholder="BCA / Mandiri / BSI"
                        className="w-full p-2 border border-slate-300 rounded font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Nomor Rekening *</label>
                      <input
                        type="text"
                        required
                        value={customAccountNumber}
                        onChange={(e) => setCustomAccountNumber(e.target.value)}
                        placeholder="123-456-7890"
                        className="w-full p-2 border border-slate-300 rounded font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Atas Nama (a.n.) *</label>
                      <input
                        type="text"
                        required
                        value={customAccountHolder}
                        onChange={(e) => setCustomAccountHolder(e.target.value)}
                        placeholder="PT LINTAS DATA INTERNASIONAL"
                        className="w-full p-2 border border-slate-300 rounded font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">Cabang / KCP</label>
                      <input
                        type="text"
                        value={customBranch}
                        onChange={(e) => setCustomBranch(e.target.value)}
                        placeholder="KCP BSD"
                        className="w-full p-2 border border-slate-300 rounded"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide text-xs">
                    Rincian Item Penagihan Layanan
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-blue-700 font-bold hover:underline"
                  >
                    + Tambah Item Tagihan
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-slate-500 font-bold block">Kategori</label>
                      <select
                        value={item.category}
                        onChange={(e) =>
                          handleItemChange(idx, 'category', e.target.value as ServiceCategory)
                        }
                        className="w-full p-1.5 border border-slate-300 rounded bg-white text-[11px] font-semibold"
                      >
                        <option value="Internet Dedicated">Internet Dedicated</option>
                        <option value="Cloud Server">Cloud Server</option>
                        <option value="Colocation Server">Colocation Server</option>
                        <option value="Datacenter Managed">Datacenter Managed</option>
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="text-[10px] text-slate-500 font-bold block">
                        Nama & Periode Layanan
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded bg-white font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 font-bold block">Vol & Satuan</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))}
                          className="w-12 p-1.5 border border-slate-300 rounded bg-white font-mono text-center font-bold"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-14 p-1.5 border border-slate-300 rounded bg-white text-[10px]"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3 text-right">
                      <label className="text-[10px] text-slate-500 font-bold block">
                        Harga Satuan (IDR)
                      </label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, 'price', Number(e.target.value))}
                        className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Tax PPN 11% Toggle */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-800 text-xs">Ketentuan Pajak PPN (11%)</p>
                  <p className="text-[11px] text-slate-500">
                    Centang jika tagihan invoice ini mengenakan Pajak Pertambahan Nilai 11%. Uncheck jika Non-PPN.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition shrink-0 select-none">
                  <input
                    type="checkbox"
                    checked={useTax}
                    onChange={(e) => setUseTax(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="font-bold text-xs text-slate-900">
                    {useTax ? 'Gunakan PPN 11%' : 'Tanpa PPN (0%)'}
                  </span>
                </label>
              </div>

              {/* Total Summary */}
              <div className="bg-emerald-950 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-300 uppercase font-bold">Grand Total Penagihan</p>
                  <p className="text-xs text-emerald-200">
                    {useTax ? 'Termasuk PPN 11%' : 'Tanpa PPN (Non-PPN)'}
                  </p>
                </div>
                <p className="text-2xl font-black font-mono text-emerald-300">{formatIDR(grandTotal)}</p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-md"
                >
                  Terbitkan Invoice Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Recording Modal (Partial / Full) */}
      {paymentModalInvoice && (() => {
        const currentPaid = getInvoicePaidAmount(paymentModalInvoice);
        const remaining = getInvoiceRemainingAmount(paymentModalInvoice);
        const percentPaid = paymentModalInvoice.grandTotal > 0 ? Math.min(100, Math.round((currentPaid / paymentModalInvoice.grandTotal) * 100)) : 0;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    Pencatatan Pembayaran & Cicilan Invoice
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    No: {paymentModalInvoice.invoiceNumber} • {paymentModalInvoice.customerName}
                  </p>
                </div>
                <button
                  onClick={() => setPaymentModalInvoice(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Financial Summary Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Total Tagihan Invoice:</span>
                    <span className="font-mono font-bold text-slate-900">{formatIDR(paymentModalInvoice.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>Total Telah Dibayar (Cicilan):</span>
                    <span className="font-mono font-bold">{formatIDR(currentPaid)} ({percentPaid}%)</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-700 pt-1 border-t border-slate-200 font-bold">
                    <span>Sisa Piutang Tagihan:</span>
                    <span className="font-mono text-sm">{formatIDR(remaining)}</span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                </div>

                {/* Jenis Pembayaran */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">Jenis Pembayaran *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType('PARSIAL');
                        setPaymentAmount(remaining > 0 ? Math.round(remaining / 2) : paymentModalInvoice.grandTotal);
                      }}
                      className={`p-2.5 rounded-xl border font-bold text-center transition flex items-center justify-center gap-2 ${
                        paymentType === 'PARSIAL'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400/30'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <PieChart className="w-4 h-4 text-amber-600" />
                      Cicilan / Parsial
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType('PELUNASAN');
                        setPaymentAmount(remaining);
                      }}
                      className={`p-2.5 rounded-xl border font-bold text-center transition flex items-center justify-center gap-2 ${
                        paymentType === 'PELUNASAN'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400/30'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Pelunasan Sisa
                    </button>
                  </div>
                </div>

                {/* Nominal Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-800">Nominal Pembayaran Diterima (IDR) *</label>
                    <span className="text-[10px] text-slate-500">Maksimal: {formatIDR(remaining)}</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={remaining}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    disabled={paymentType === 'PELUNASAN'}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold text-base text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />

                  {/* Preset Buttons */}
                  {paymentType === 'PARSIAL' && remaining > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-500 font-bold mr-1">Opsi Cepat:</span>
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(Math.round(paymentModalInvoice.grandTotal * 0.25))}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700"
                      >
                        25% Total
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(Math.round(paymentModalInvoice.grandTotal * 0.5))}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700"
                      >
                        50% Total
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(Math.round(paymentModalInvoice.grandTotal * 0.75))}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700"
                      >
                        75% Total
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(remaining)}
                        className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 rounded text-[10px] font-bold text-emerald-800"
                      >
                        Sisa 100%
                      </button>
                    </div>
                  )}
                </div>

                {/* Tanggal & Metode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tanggal Pembayaran *</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Metode Pembayaran *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                    >
                      <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                      <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                      <option value="Transfer Bank BSI">Transfer Bank BSI</option>
                      <option value="Virtual Account">Virtual Account Enterprise</option>
                      <option value="Giro / Cek">Giro / Cek Bank</option>
                      <option value="Tunai / Cash">Tunai / Cash</option>
                    </select>
                  </div>
                </div>

                {/* Catatan Cicilan */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catatan / Keterangan Pembayaran</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Contoh: Cicilan Term I (50%) via BCA Ref #98123"
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPaymentModalInvoice(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Simpan & Verifikasi Pembayaran
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Payment History Modal */}
      {historyModalInvoice && (() => {
        const paid = getInvoicePaidAmount(historyModalInvoice);
        const remaining = getInvoiceRemainingAmount(historyModalInvoice);
        const payments = historyModalInvoice.payments || [];

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-400" />
                    Riwayat Pembayaran & Cicilan
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Invoice: <strong className="text-white">{historyModalInvoice.invoiceNumber}</strong> • {historyModalInvoice.customerName}
                  </p>
                </div>
                <button
                  onClick={() => setHistoryModalInvoice(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Summary Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Tagihan</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{formatIDR(historyModalInvoice.grandTotal)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 font-bold block uppercase">Total Terbayar</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">{formatIDR(paid)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-700 font-bold block uppercase">Sisa Tagihan</span>
                    <span className="font-mono font-black text-rose-700 text-sm">{formatIDR(remaining)}</span>
                  </div>
                </div>

                {/* Payment History List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 uppercase text-[11px]">
                      Daftar Setoran Cicilan ({payments.length})
                    </h4>
                    {historyModalInvoice.status !== 'Lunas' && (
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenPaymentModal(historyModalInvoice);
                        }}
                        className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        + Catat Setoran Baru
                      </button>
                    )}
                  </div>

                  {payments.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {payments.map((p, idx) => (
                        <div key={p.id || idx} className="p-3 bg-white hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-emerald-700 text-xs">
                                {formatIDR(p.amount)}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                                {p.paymentMethod}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium">
                              {p.notes || 'Pembayaran Cicilan'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Diterima pada {formatDateIndonesian(p.paymentDate)} • Dicatat oleh {p.recordedBy || 'Admin'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeletePaymentRecord(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded self-start sm:self-center transition"
                            title="Hapus Catatan Pembayaran Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 italic">
                      Belum ada catatan setoran cicilan yang terekam secara terpisah.
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Status: <strong className="text-slate-800">{historyModalInvoice.status}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setHistoryModalInvoice(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
