import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileCheck,
  Building,
  Calendar,
  DollarSign,
  FileText,
  UserCheck,
  CheckCircle,
  Clock,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Customer, ItemService, PKS, PKSClause, ServiceCategory, SPH } from '../types';
import { formatIDR, generateDocNumber } from '../utils/formatters';
import { COMPANY_PROFILE } from '../data/initialData';

interface CustomPksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pks: PKS) => void;
  customers: Customer[];
  sphList: SPH[];
  initialPks?: PKS | null;
}

const DEFAULT_CLAUSES: PKSClause[] = [
  {
    article: 1,
    title: 'MAKSUD DAN TUJUAN',
    content:
      'Pihak Pertama setuju untuk menyediakan layanan teknologi informasi dan infrastruktur jaringan/server kepada Pihak Kedua sesuai dengan spesifikasi teknis dan rincian layanan yang disepakati.',
  },
  {
    article: 2,
    title: 'RUANG LINGKUP LAYANAN',
    content:
      'Ruang lingkup pekerjaan mencakup pengadaan, instalasi, konfigurasi, pemeliharaan rutin, serta dukungan teknis 24/7/365 untuk seluruh item layanan yang tertera dalam Lampiran Perjanjian ini.',
  },
  {
    article: 3,
    title: 'BIAYA KONTRAK DAN CARA PEMBAYARAN',
    content:
      'Pihak Kedua wajib melakukan pembayaran biaya berlangganan bulanan paling lambat tanggal 10 (sepuluh) setiap bulannya berdasarkan Invoice resmi yang diterbitkan oleh Pihak Pertama.',
  },
  {
    article: 4,
    title: 'SERVICE LEVEL AGREEMENT (SLA) DAN KOMPENSASI',
    content:
      'Pihak Pertama menjamin jaminan ketersediaan layanan (Uptime SLA) sekurang-kurangnya sebesar 99.9% setiap bulannya. Apabila terjadi downtime melebihi batas toleransi SLA di luar pemeliharaan terencana (scheduled maintenance), Pihak Kedua berhak menerima restitusi sesuai ketentuan yang berlaku.',
  },
  {
    article: 5,
    title: 'KERAHASIAAN INFORMASI (NON-DISCLOSURE)',
    content:
      'Para Pihak sepakat untuk saling menjaga kerahasiaan seluruh data, informasi teknis, dan rahasia dagang yang diperoleh selama berjalannya kerja sama ini dan tidak mempublikasikannya kepada pihak ketiga tanpa persetujuan tertulis.',
  },
  {
    article: 6,
    title: 'KEADAAN KAHAR (FORCE MAJEURE)',
    content:
      'Tidak ada Pihak yang dianggap lalai atau melanggar perjanjian apabila kegagalan pelaksanaan disebabkan oleh Kejadian Keadaan Kahar seperti bencana alam, kerusuhan massal, perang, kebakaran, atau kebijakan pemerintah di bidang telekomunikasi.',
  },
  {
    article: 7,
    title: 'PENYELESAIAN PERSELISIHAN',
    content:
      'Segala perselisihan yang timbul dari pelaksanaan Perjanjian ini akan diselesaikan secara musyawarah untuk mufakat. Apabila musyawarah tidak mencapai kesepakatan, Para Pihak sepakat memilih domisili hukum di Kepaniteraan Pengadilan Negeri Jakarta Selatan.',
  },
];

export const CustomPksModal: React.FC<CustomPksModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customers,
  sphList,
  initialPks,
}) => {
  if (!isOpen) return null;

  // Selected customer ID
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialPks?.customerId || ''
  );
  const [customerName, setCustomerName] = useState<string>(
    initialPks?.customerName || ''
  );
  const [customerRepresentative, setCustomerRepresentative] = useState<string>(
    initialPks?.customerRepresentative || ''
  );
  const [customerRepPosition, setCustomerRepPosition] = useState<string>(
    initialPks?.customerRepPosition || 'Direktur / Manajemen'
  );
  const [customerAddress, setCustomerAddress] = useState<string>(
    initialPks?.customerAddress || ''
  );

  // Document metadata
  const [pksNumber, setPksNumber] = useState<string>(
    initialPks?.pksNumber || generateDocNumber('PKS')
  );
  const [sphReferenceNumber, setSphReferenceNumber] = useState<string>(
    initialPks?.sphReferenceNumber || ''
  );

  // Contract duration
  const todayStr = new Date().toISOString().split('T')[0];
  const nextYearStr = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    .toISOString()
    .split('T')[0];

  const [startDate, setStartDate] = useState<string>(
    initialPks?.startDate || todayStr
  );
  const [endDate, setEndDate] = useState<string>(
    initialPks?.endDate || nextYearStr
  );
  const [contractDurationMonths, setContractDurationMonths] = useState<number>(
    initialPks?.contractDurationMonths || 12
  );

  // Service Items
  const [serviceItems, setServiceItems] = useState<ItemService[]>(
    initialPks?.serviceItems && initialPks.serviceItems.length > 0
      ? initialPks.serviceItems
      : [
          {
            id: '1',
            category: 'Cloud Server',
            name: 'Dedicated High Performance Enterprise Server',
            description: 'RAM 128GB, NVMe 2TB RAID1, Bandwidth 1Gbps Unmetered',
            qty: 1,
            unit: 'Unit',
            price: 3500000,
            discount: 0,
          },
        ]
  );

  const [slaPercent, setSlaPercent] = useState<number>(
    initialPks?.slaPercent || 99.9
  );

  // Clauses
  const [clauses, setClauses] = useState<PKSClause[]>(
    initialPks?.clauses && initialPks.clauses.length > 0
      ? initialPks.clauses
      : DEFAULT_CLAUSES
  );

  // Signer Details
  const [party1SignerName, setParty1SignerName] = useState<string>(
    initialPks?.party1SignerName || COMPANY_PROFILE.directorName
  );
  const [party1SignerPosition, setParty1SignerPosition] = useState<string>(
    initialPks?.party1SignerPosition || COMPANY_PROFILE.directorPosition
  );

  const [party2SignerName, setParty2SignerName] = useState<string>(
    initialPks?.party2SignerName || customerRepresentative
  );
  const [party2SignerPosition, setParty2SignerPosition] = useState<string>(
    initialPks?.party2SignerPosition || customerRepPosition
  );

  // Auto-Save Draft State (30 seconds interval)
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);
  const [hasDraftAvailable, setHasDraftAvailable] = useState<boolean>(false);

  // Check if draft exists on mount / modal open
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ldi_draft_pks');
      if (saved) {
        setHasDraftAvailable(true);
        const parsed = JSON.parse(saved);
        if (parsed.savedAt) setLastAutoSaveTime(parsed.savedAt);
      }
    } catch (e) {
      // Ignore
    }
  }, [isOpen]);

  // Auto-save every 30 seconds when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const autoSaveInterval = setInterval(() => {
      try {
        const timeStr = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const draftData = {
          selectedCustomerId,
          customerName,
          customerRepresentative,
          customerRepPosition,
          customerAddress,
          pksNumber,
          sphReferenceNumber,
          startDate,
          endDate,
          contractDurationMonths,
          serviceItems,
          slaPercent,
          clauses,
          party1SignerName,
          party1SignerPosition,
          party2SignerName,
          party2SignerPosition,
          savedAt: timeStr,
        };
        localStorage.setItem('ldi_draft_pks', JSON.stringify(draftData));
        setLastAutoSaveTime(timeStr);
        setHasDraftAvailable(true);
      } catch (err) {
        console.error('Failed auto-saving PKS draft:', err);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [
    isOpen,
    selectedCustomerId,
    customerName,
    customerRepresentative,
    customerRepPosition,
    customerAddress,
    pksNumber,
    sphReferenceNumber,
    startDate,
    endDate,
    contractDurationMonths,
    serviceItems,
    slaPercent,
    clauses,
    party1SignerName,
    party1SignerPosition,
    party2SignerName,
    party2SignerPosition,
  ]);

  const handleLoadDraft = () => {
    try {
      const saved = localStorage.getItem('ldi_draft_pks');
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.selectedCustomerId) setSelectedCustomerId(draft.selectedCustomerId);
        if (draft.customerName) setCustomerName(draft.customerName);
        if (draft.customerRepresentative) setCustomerRepresentative(draft.customerRepresentative);
        if (draft.customerRepPosition) setCustomerRepPosition(draft.customerRepPosition);
        if (draft.customerAddress) setCustomerAddress(draft.customerAddress);
        if (draft.pksNumber) setPksNumber(draft.pksNumber);
        if (draft.sphReferenceNumber) setSphReferenceNumber(draft.sphReferenceNumber);
        if (draft.startDate) setStartDate(draft.startDate);
        if (draft.endDate) setEndDate(draft.endDate);
        if (draft.contractDurationMonths) setContractDurationMonths(draft.contractDurationMonths);
        if (Array.isArray(draft.serviceItems)) setServiceItems(draft.serviceItems);
        if (draft.slaPercent) setSlaPercent(draft.slaPercent);
        if (Array.isArray(draft.clauses)) setClauses(draft.clauses);
        if (draft.party1SignerName) setParty1SignerName(draft.party1SignerName);
        if (draft.party1SignerPosition) setParty1SignerPosition(draft.party1SignerPosition);
        if (draft.party2SignerName) setParty2SignerName(draft.party2SignerName);
        if (draft.party2SignerPosition) setParty2SignerPosition(draft.party2SignerPosition);
        if (draft.savedAt) setLastAutoSaveTime(draft.savedAt);
      }
    } catch (e) {
      console.error('Failed loading PKS draft:', e);
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem('ldi_draft_pks');
    setHasDraftAvailable(false);
    setLastAutoSaveTime(null);
  };

  // Handle Customer Selection
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setCustomerName(found.companyName);
      setCustomerRepresentative(found.picName);
      setCustomerRepPosition(found.picPosition || 'Direktur / Manajemen');
      setCustomerAddress(found.address);
      setParty2SignerName(found.picName);
      setParty2SignerPosition(found.picPosition || 'Direktur / Manajemen');
    }
  };

  // Handle Reference SPH Selection
  const handleSphRefChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sphNum = e.target.value;
    setSphReferenceNumber(sphNum);
    const foundSph = sphList.find((s) => s.sphNumber === sphNum);
    if (foundSph) {
      if (foundSph.customerId) {
        setSelectedCustomerId(foundSph.customerId);
      }
      setCustomerName(foundSph.customerName);
      setCustomerRepresentative(foundSph.customerRepresentative);
      setCustomerAddress(foundSph.customerAddress);
      setParty2SignerName(foundSph.customerRepresentative);

      if (foundSph.items && foundSph.items.length > 0) {
        setServiceItems(foundSph.items);
      }
    }
  };

  // Calculate monthly value & total contract value
  const monthlyValue = serviceItems.reduce(
    (acc, item) => acc + (item.qty * item.price - (item.discount || 0)),
    0
  );
  const totalContractValue = monthlyValue * contractDurationMonths;

  // Items handlers
  const handleAddItem = () => {
    const newItem: ItemService = {
      id: Date.now().toString(),
      category: 'Cloud Server',
      name: 'Layanan Komputasi / Network Baru',
      description: 'Deskripsi dan spesifikasi teknis layanan',
      qty: 1,
      unit: 'Bulan',
      price: 1000000,
      discount: 0,
    };
    setServiceItems([...serviceItems, newItem]);
  };

  const handleUpdateItem = (
    id: string,
    field: keyof ItemService,
    val: string | number
  ) => {
    setServiceItems(
      serviceItems.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setServiceItems(serviceItems.filter((i) => i.id !== id));
  };

  // Clause Handlers
  const handleAddClause = () => {
    const nextArticle = clauses.length + 1;
    const newClause: PKSClause = {
      article: nextArticle,
      title: 'PASAL TAMBAHAN KUSTOM',
      content: 'Isi pasal kustom perjanjian kerja sama...',
    };
    setClauses([...clauses, newClause]);
  };

  const handleUpdateClause = (
    index: number,
    field: 'title' | 'content',
    val: string
  ) => {
    const updated = [...clauses];
    updated[index] = { ...updated[index], [field]: val };
    setClauses(updated);
  };

  const handleRemoveClause = (index: number) => {
    const updated = clauses
      .filter((_, i) => i !== index)
      .map((c, i) => ({ ...c, article: i + 1 }));
    setClauses(updated);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Mohon isi nama pelanggan / Pihak Kedua.');
      return;
    }

    const pksPayload: PKS = {
      id: initialPks?.id || Date.now().toString(),
      pksNumber: pksNumber || generateDocNumber('PKS'),
      sphReferenceNumber: sphReferenceNumber || undefined,
      customerId: selectedCustomerId || 'cust-custom',
      customerName,
      customerRepresentative: customerRepresentative || 'Pimpinan Perusahaan',
      customerRepPosition: customerRepPosition || 'Direktur',
      customerAddress: customerAddress || 'Indonesia',
      startDate,
      endDate,
      contractDurationMonths: Number(contractDurationMonths) || 12,
      serviceItems,
      monthlyValue,
      totalContractValue,
      slaPercent: Number(slaPercent) || 99.9,
      clauses,
      status: initialPks?.status || 'Menunggu TTD',
      party1Signed: initialPks?.party1Signed || false,
      party1SignerName: party1SignerName || COMPANY_PROFILE.directorName,
      party1SignerPosition: party1SignerPosition || COMPANY_PROFILE.directorPosition,
      party1SignatureData: initialPks?.party1SignatureData,
      party2Signed: initialPks?.party2Signed || false,
      party2SignerName: party2SignerName || customerRepresentative,
      party2SignerPosition: party2SignerPosition || customerRepPosition,
      party2SignatureData: initialPks?.party2SignatureData,
      signedDate: initialPks?.signedDate,
    };

    onSave(pksPayload);
    localStorage.removeItem('ldi_draft_pks');
    setHasDraftAvailable(false);
    setLastAutoSaveTime(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-base uppercase tracking-wide text-white flex items-center gap-2">
                <span>{initialPks ? 'Edit Custom PKS' : 'Buat Custom Perjanjian Kerja Sama (PKS) Baru'}</span>
                <span className="bg-blue-800 text-cyan-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-600/50 flex items-center gap-1 font-normal">
                  <Save className="w-3 h-3 text-cyan-300 animate-pulse" /> Auto-Save 30s
                </span>
              </h3>
              <p className="text-[10px] sm:text-xs text-cyan-300 font-mono mt-0.5">
                Dokumen Resmi Legalitas Layanan & Kontrak PT. LDI
                {lastAutoSaveTime && ` • Draf Tersimpan: ${lastAutoSaveTime}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 text-xs overflow-y-auto touch-scroll">
          {/* Draft Banner Notification */}
          {hasDraftAvailable && (
            <div key="pks-draft-banner" className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-amber-900 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">Draf Kontrak PKS Tersimpan Otomatis</p>
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
          {/* SECTION 1: DOKUMEN & PELANGGAN (PIHAK KEDUA) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
              <Building className="w-4 h-4 text-blue-600" />
              1. Identitas Dokumen & Pihak Kedua (Pelanggan)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Pilih dari CRM (Opsional):
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={handleCustomerChange}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Pilih Pelanggan CRM --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.picName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Referensi Nomor SPH (Opsional):
                </label>
                <select
                  value={sphReferenceNumber}
                  onChange={handleSphRefChange}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                <label className="font-bold text-slate-700 block mb-1">
                  Nomor PKS Resmi:
                </label>
                <input
                  type="text"
                  value={pksNumber}
                  onChange={(e) => setPksNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-cyan-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nama Perusahaan / Pihak Kedua:
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: PT. Bintang Digital Indonesia"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Perwakilan PIC:
                  </label>
                  <input
                    type="text"
                    value={customerRepresentative}
                    onChange={(e) => {
                      setCustomerRepresentative(e.target.value);
                      if (!party2SignerName) setParty2SignerName(e.target.value);
                    }}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Jabatan PIC:
                  </label>
                  <input
                    type="text"
                    value={customerRepPosition}
                    onChange={(e) => {
                      setCustomerRepPosition(e.target.value);
                      if (!party2SignerPosition) setParty2SignerPosition(e.target.value);
                    }}
                    placeholder="Contoh: Direktur Utama"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Alamat Lengkap Perusahaan Pihak Kedua:
              </label>
              <textarea
                rows={2}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Alamat kantor pelanggan..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 2: PERIODE KONTRAK & SLA */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              2. Jangka Waktu Perjanjian & Service Level Agreement (SLA)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tanggal Mulai Kontrak:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tanggal Berakhir Kontrak:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Durasi Kontrak (Bulan):
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={contractDurationMonths}
                  onChange={(e) => setContractDurationMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Target Uptime SLA (%):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={90}
                  max={100}
                  value={slaPercent}
                  onChange={(e) => setSlaPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: RINCIAN LAYANAN & BIAYA BULANAN */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                3. Ruang Lingkup Layanan & Biaya Berlangganan Bulanan
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="bg-blue-900 hover:bg-blue-800 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Item Layanan
              </button>
            </div>

            <div className="space-y-3">
              {serviceItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-500 text-[10px] uppercase">
                      # Item Layanan {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      title="Hapus Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Kategori</label>
                      <select
                        value={item.category}
                        onChange={(e) =>
                          handleUpdateItem(item.id, 'category', e.target.value as ServiceCategory)
                        }
                        className="w-full p-1.5 border border-slate-300 rounded text-xs font-medium"
                      >
                        <option value="Internet Dedicated">Internet Dedicated</option>
                        <option value="Cloud Server">Cloud Server</option>
                        <option value="Colocation Server">Colocation Server</option>
                        <option value="Datacenter Managed">Datacenter Managed</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Nama Layanan</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded text-xs font-bold text-slate-900"
                        placeholder="Nama spesifik layanan"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Jumlah & Satuan</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(item.id, 'qty', Number(e.target.value))}
                          className="w-16 p-1.5 border border-slate-300 rounded text-xs font-bold text-slate-900"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs text-slate-700"
                          placeholder="Unit/Bulan/Mbps"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Harga / Bln (Rp)</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleUpdateItem(item.id, 'price', Number(e.target.value))}
                        className="w-full p-1.5 border border-slate-300 rounded text-xs font-bold text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Spesifikasi Teknis / Rincian SLA</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs text-slate-700"
                      placeholder="Spesifikasi hardware, RAM, bandwidth, IP Publik, dsb."
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary Banner */}
            <div className="bg-blue-900 text-white p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
              <div>
                <p className="text-[10px] text-blue-200 uppercase font-sans font-bold">Total MRR Bulanan:</p>
                <p className="text-base font-bold text-cyan-300">{formatIDR(monthlyValue)} /Bln</p>
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] text-blue-200 uppercase font-sans font-bold">
                  Total Nilai Kontrak ({contractDurationMonths} Bulan):
                </p>
                <p className="text-base font-bold text-emerald-400">{formatIDR(totalContractValue)}</p>
              </div>
            </div>
          </div>

          {/* SECTION 4: PASAL-PASAL PERJANJIAN (CUSTOM CLAUSES) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  4. Pasal-Pasal Perjanjian Kerja Sama (Legal Clauses)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sesuaikan, tambah, atau edit isi pasal-pasal kesepakatan hukum sesuai kebutuhan kustom.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddClause}
                className="bg-blue-900 hover:bg-blue-800 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Pasal Baru
              </button>
            </div>

            <div className="space-y-4">
              {clauses.map((clause, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="font-mono font-black text-blue-950 text-xs uppercase">
                      Pasal {clause.article}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveClause(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      title="Hapus Pasal Ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                        Judul Pasal:
                      </label>
                      <input
                        type="text"
                        value={clause.title}
                        onChange={(e) => handleUpdateClause(idx, 'title', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-xs font-bold uppercase text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                        Isi Ketentuan Pasal:
                      </label>
                      <textarea
                        rows={3}
                        value={clause.content}
                        onChange={(e) => handleUpdateClause(idx, 'content', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-xs text-slate-800 leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: SIGNER DETAILS */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              5. Penandatangan Resmi Para Pihak
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Party 1 */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-blue-950 text-xs uppercase">
                  PIHAK PERTAMA ({COMPANY_PROFILE.name})
                </p>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Nama Penandatangan:
                  </label>
                  <input
                    type="text"
                    value={party1SignerName}
                    onChange={(e) => setParty1SignerName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Jabatan:
                  </label>
                  <input
                    type="text"
                    value={party1SignerPosition}
                    onChange={(e) => setParty1SignerPosition(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-700"
                  />
                </div>
              </div>

              {/* Party 2 */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-blue-950 text-xs uppercase">
                  PIHAK KEDUA ({customerName || 'Pelanggan'})
                </p>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Nama Penandatangan:
                  </label>
                  <input
                    type="text"
                    value={party2SignerName}
                    onChange={(e) => setParty2SignerName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs font-bold text-slate-900"
                    placeholder="Nama Direktur / PIC Pelanggan"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                    Jabatan:
                  </label>
                  <input
                    type="text"
                    value={party2SignerPosition}
                    onChange={(e) => setParty2SignerPosition(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs text-slate-700"
                    placeholder="Jabatan Resmi"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Simpan Custom PKS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
