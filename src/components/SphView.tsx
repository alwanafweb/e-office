import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Trash2,
  FileCheck,
  Zap,
  X,
  CheckCircle,
  PlusCircle,
  MinusCircle,
  Layers,
  Sparkles,
  Receipt,
  Lock,
  Unlock,
  Clock,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Customer, ItemService, PKS, ServiceCategory, SPH, TechnicalSpec } from '../types';
import { getDecryptedItem, setEncryptedItem, removeEncryptedItem } from '../utils/crypto';
import { formatDateIndonesian, formatIDR, generateDocNumber } from '../utils/formatters';
import { COMPANY_PROFILE } from '../data/initialData';

interface SphViewProps {
  sphList: SPH[];
  customers: Customer[];
  onAddSph: (sph: SPH) => void;
  onUpdateSph: (sph: SPH) => void;
  onDeleteSph: (id: string) => void;
  onConvertToPks: (sph: SPH) => void;
  onConvertToInvoice: (sph: SPH) => void;
  onPreviewSph: (sph: SPH) => void;
  preSelectedCustomer?: Customer | null;
  onToggleLockDocument?: (type: 'SPH' | 'PKS' | 'Invoice', id: string, forceState?: boolean) => void;
}

export const SphView: React.FC<SphViewProps> = ({
  sphList,
  customers,
  onAddSph,
  onUpdateSph,
  onDeleteSph,
  onConvertToPks,
  onConvertToInvoice,
  onPreviewSph,
  preSelectedCustomer,
  onToggleLockDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [selectedCustId, setSelectedCustId] = useState<string>(
    preSelectedCustomer ? preSelectedCustomer.id : customers[0]?.id || ''
  );

  const [validityDays, setValidityDays] = useState<number>(14);
  const [useTax, setUseTax] = useState<boolean>(true);

  const [items, setItems] = useState<ItemService[]>([
    {
      id: 'ITM-01',
      category: 'Internet Dedicated',
      name: 'Fiber Dedicated Corporate Broadband 1:1',
      description: 'Akses Internet Dedicated Symmetrical Speed High Performance SLA 99.9%',
      qty: 100,
      unit: 'Mbps',
      price: 75000,
      discount: 0,
    },
  ]);

  const [technicalSpecs, setTechnicalSpecs] = useState<TechnicalSpec[]>([
    { title: 'Bandwidth Ratio', value: '1:1 Symmetrical Dedicated' },
    { title: 'Service Level Agreement (SLA)', value: '99.9% Uptime Guarantee' },
    { title: 'Public IP Allocation', value: '/29 IPv4 Public Address' },
    { title: '24/7 Technical Support', value: 'NOC Dedicated Jagoanserver' },
  ]);

  const [terms, setTerms] = useState<string[]>([
    'Harga belum termasuk PPN 11%.',
    'Masa berlaku penawaran harga ini adalah 14 hari kalender.',
    'Kontrak minimal berlangganan adalah 12 (dua belas) bulan.',
  ]);

  // Auto-Save Draft State (30 seconds interval)
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);
  const [hasDraftAvailable, setHasDraftAvailable] = useState<boolean>(false);

  // Check if draft exists on mount / form open
  useEffect(() => {
    try {
      const saved = getDecryptedItem<any>('ldi_draft_sph');
      if (saved) {
        setHasDraftAvailable(true);
        if (saved.savedAt) setLastAutoSaveTime(saved.savedAt);
      }
    } catch (e) {
      // Ignore parse error
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
          validityDays,
          useTax,
          items,
          technicalSpecs,
          terms,
          savedAt: timeStr,
        };
        setEncryptedItem('ldi_draft_sph', draftData);
        setLastAutoSaveTime(timeStr);
        setHasDraftAvailable(true);
      } catch (err) {
        console.error('Failed auto-saving SPH draft:', err);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [isFormOpen, selectedCustId, validityDays, useTax, items, technicalSpecs, terms]);

  const handleLoadDraft = () => {
    try {
      const draft = getDecryptedItem<any>('ldi_draft_sph');
      if (draft) {
        if (draft.selectedCustId) setSelectedCustId(draft.selectedCustId);
        if (draft.validityDays) setValidityDays(draft.validityDays);
        if (typeof draft.useTax === 'boolean') setUseTax(draft.useTax);
        if (Array.isArray(draft.items)) setItems(draft.items);
        if (Array.isArray(draft.technicalSpecs)) setTechnicalSpecs(draft.technicalSpecs);
        if (Array.isArray(draft.terms)) setTerms(draft.terms);
        if (draft.savedAt) setLastAutoSaveTime(draft.savedAt);
      }
    } catch (e) {
      console.error('Failed loading SPH draft:', e);
    }
  };

  const handleClearDraft = () => {
    removeEncryptedItem('ldi_draft_sph');
    setHasDraftAvailable(false);
    setLastAutoSaveTime(null);
  };

  const filteredSphList = sphList.filter((sph) => {
    const matchesSearch =
      sph.sphNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sph.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || sph.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `ITM-${Date.now()}`,
        category: 'Internet Dedicated',
        name: 'Layanan Baru',
        description: 'Spesifikasi detail layanan',
        qty: 1,
        unit: 'Unit',
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

  const handleAddSpec = () => {
    setTechnicalSpecs([...technicalSpecs, { title: 'Spesifikasi', value: 'Detail Nilai' }]);
  };

  const handleRemoveSpec = (index: number) => {
    setTechnicalSpecs(technicalSpecs.filter((_, i) => i !== index));
  };

  // Subtotal & Grand Total Calculation
  const subtotal = items.reduce((acc, it) => acc + it.qty * it.price, 0);
  const discountTotal = items.reduce((acc, it) => acc + (it.discount || 0), 0);
  const taxableSubtotal = subtotal - discountTotal;
  const taxPercent = useTax ? 11 : 0;
  const taxAmount = Math.round(taxableSubtotal * (taxPercent / 100));
  const grandTotal = taxableSubtotal + taxAmount;

  const handleSubmitSph = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === selectedCustId);
    if (!cust) return;

    const newSph: SPH = {
      id: `SPH-${Date.now()}`,
      sphNumber: generateDocNumber('SPH', sphList.length + 1),
      customerId: cust.id,
      customerName: cust.companyName,
      customerAddress: cust.address,
      customerPhone: cust.phone,
      customerEmail: cust.email,
      date: new Date().toISOString().split('T')[0],
      validityDays,
      items,
      technicalSpecs,
      termsAndConditions: terms,
      subtotal,
      discountTotal,
      taxPercent,
      taxAmount,
      grandTotal,
      status: 'Disetujui',
      signedByLDI: COMPANY_PROFILE.directorName,
      signedDate: new Date().toISOString().split('T')[0],
    };

    onAddSph(newSph);
    removeEncryptedItem('ldi_draft_sph');
    setHasDraftAvailable(false);
    setLastAutoSaveTime(null);
    setIsFormOpen(false);
    onPreviewSph(newSph);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Sistem Surat Penawaran Harga (SPH / Quotation)
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Buat, kirim, dan konversi Surat Penawaran Harga resmi PT. Lintas Data Internasional ke PKS.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Buat SPH Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Nomor SPH / Nama Pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="Semua">Semua Status</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Dikonversi ke PKS">Dikonversi ke PKS</option>
            <option value="Draft">Draft</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      {/* SPH Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto touch-scroll no-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                <th className="p-3.5">Nomor SPH</th>
                <th className="p-3.5">Pelanggan Target</th>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5 text-right">Nilai Total (Inc PPN)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Tindakan / Konversi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSphList.length > 0 ? (
                filteredSphList.map((sph) => (
                  <tr key={sph.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="p-3.5 font-mono font-bold text-blue-900">{sph.sphNumber}</td>
                    <td className="p-3.5 font-bold text-slate-800">{sph.customerName}</td>
                    <td className="p-3.5 text-slate-600">{formatDateIndonesian(sph.date)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {formatIDR(sph.grandTotal)}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            sph.status === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sph.status === 'Dikonversi ke Invoice'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : sph.status === 'Dikonversi ke PKS'
                              ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sph.status}
                        </span>
                        {sph.isLocked && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-[9px] font-black uppercase tracking-wider">
                            <Lock className="w-2.5 h-2.5 text-rose-600" /> TERKUNCI
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Instant Convert to Invoice Button */}
                        <button
                          onClick={() => onConvertToInvoice(sph)}
                          className="bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1 transition"
                          title="Konversi SPH ini langsung menjadi Invoice Tagihan"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-200" />
                          Ke Invoice
                        </button>

                        {/* Instant Convert to PKS Button */}
                        <button
                          onClick={() => onConvertToPks(sph)}
                          className="bg-blue-900 hover:bg-blue-800 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1 transition"
                          title="Konversi SPH ini menjadi Perjanjian Kerja Sama (PKS) Resmi"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-cyan-200" />
                          Ke PKS
                        </button>

                        {sph.invoiceConvertedId && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Invoice
                          </span>
                        )}

                        {sph.pksConvertedId && (
                          <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                            ✓ PKS
                          </span>
                        )}

                        <button
                          onClick={() => onPreviewSph(sph)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Lihat / Cetak Kop Surat PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Lock / Unlock Toggle Button */}
                        {onToggleLockDocument && (
                          <button
                            onClick={() => onToggleLockDocument('SPH', sph.id)}
                            className={`p-1.5 rounded transition ${
                              sph.isLocked
                                ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                            title={sph.isLocked ? 'Dokumen Terkunci. Klik untuk membuka kunci.' : 'Klik untuk mengunci dokumen ini.'}
                          >
                            {sph.isLocked ? <Lock className="w-4 h-4 text-rose-600" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (sph.isLocked) {
                              alert(`Dokumen SPH ${sph.sphNumber} sedang DIKUNCI (Locked) karena sudah didownload/diterbitkan sebagai PDF. Silakan buka kunci dokumen terlebih dahulu jika ingin menghapusnya.`);
                              return;
                            }
                            onDeleteSph(sph.id);
                          }}
                          className={`p-1.5 rounded transition ${sph.isLocked ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600'}`}
                          title={sph.isLocked ? 'Dokumen Terkunci (Tidak dapat dihapus)' : 'Hapus SPH'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    Belum ada Surat Penawaran Harga (SPH).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SPH Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                  <span>Buat Surat Penawaran Harga (SPH) Baru</span>
                  <span className="bg-blue-800 text-cyan-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-600/50 flex items-center gap-1">
                    <Save className="w-3 h-3 text-cyan-300 animate-pulse" /> Auto-Save 30s
                  </span>
                </h3>
                <p className="text-xs text-blue-300 font-mono mt-0.5">
                  Nomor Auto: {generateDocNumber('SPH', sphList.length + 1)}
                  {lastAutoSaveTime && ` • Draf Tersimpan: ${lastAutoSaveTime}`}
                </p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSph} className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs touch-scroll">
              {/* Draft Banner Notification */}
              {hasDraftAvailable && (
                <div key="sph-draft-banner" className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-amber-900 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Draf SPH Tersimpan Otomatis</p>
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
              {/* Customer Selector */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Pilih Perusahaan Pelanggan *
                  </label>
                  <select
                    value={selectedCustId}
                    onChange={(e) => setSelectedCustId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.contactPerson})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Masa Berlaku Penawaran (Hari)
                  </label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Item Services List Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide text-xs">
                    Detail Produk / Layanan Internet & Cloud
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Tambah Baris
                  </button>
                </div>

                <div className="space-y-3">
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

                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-slate-500 font-bold block">Nama Layanan</label>
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
                            className="w-14 p-1.5 border border-slate-300 rounded bg-white font-mono text-center font-bold"
                          />
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-16 p-1.5 border border-slate-300 rounded bg-white text-[10px]"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-500 font-bold block">Harga Satuan (IDR)</label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(idx, 'price', Number(e.target.value))}
                          className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-right"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-between gap-1">
                        <div className="text-right w-full">
                          <label className="text-[10px] text-slate-500 font-bold block">Subtotal</label>
                          <span className="font-mono font-bold text-blue-900 block pt-1">
                            {formatIDR(item.qty * item.price)}
                          </span>
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications List Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wide text-xs">
                    Spesifikasi Teknis & SLA Quality Guaranteed
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Tambah Poin Spesifikasi
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {technicalSpecs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                      <input
                        type="text"
                        value={spec.title}
                        onChange={(e) => {
                          const updated = [...technicalSpecs];
                          updated[i].title = e.target.value;
                          setTechnicalSpecs(updated);
                        }}
                        placeholder="Parameter (misal: SLA)"
                        className="w-1/3 p-1 border border-slate-300 rounded bg-white font-bold text-[11px]"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => {
                          const updated = [...technicalSpecs];
                          updated[i].value = e.target.value;
                          setTechnicalSpecs(updated);
                        }}
                        placeholder="Nilai (misal: 99.9%)"
                        className="w-2/3 p-1 border border-slate-300 rounded bg-white text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(i)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax PPN 11% Toggle */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-800 text-xs">Ketentuan Pajak PPN (11%)</p>
                  <p className="text-[11px] text-slate-500">
                    Centang jika penawaran SPH ini mengenakan Pajak Pertambahan Nilai 11%. Uncheck jika Non-PPN.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition shrink-0 select-none">
                  <input
                    type="checkbox"
                    checked={useTax}
                    onChange={(e) => setUseTax(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-bold text-xs text-slate-900">
                    {useTax ? 'Gunakan PPN 11%' : 'Tanpa PPN (0%)'}
                  </span>
                </label>
              </div>

              {/* Grand Total Summary Box */}
              <div className="bg-blue-950 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-blue-300 uppercase font-bold">Total Penawaran SPH</p>
                  <p className="text-xs text-blue-200">
                    {useTax ? 'Termasuk PPN 11%' : 'Tanpa PPN (Non-PPN)'}
                  </p>
                </div>
                <p className="text-2xl font-black font-mono text-cyan-300">{formatIDR(grandTotal)}</p>
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
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg shadow-md"
                >
                  Terbitkan SPH Resmi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
