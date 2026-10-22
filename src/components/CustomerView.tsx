import React, { useState, useRef } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  FileCheck,
  Receipt,
  X,
  Phone,
  Mail,
  MapPin,
  Building2,
  CheckCircle2,
  Clock,
  Upload,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { Customer, Invoice, PKS, SPH } from '../types';
import { formatDateIndonesian, formatIDR } from '../utils/formatters';

interface CustomerViewProps {
  customers: Customer[];
  sphList: SPH[];
  pksList: PKS[];
  invoices: Invoice[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onBulkAddCustomers?: (customers: Customer[]) => void;
  onCreateSphForCustomer: (customer: Customer) => void;
  onCreateInvoiceForCustomer: (customer: Customer) => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  customers,
  sphList,
  pksList,
  invoices,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onBulkAddCustomers,
  onCreateSphForCustomer,
  onCreateInvoiceForCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<Customer | null>(null);

  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRawText, setImportRawText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setImportRawText(content);
        setImportStatus(`Berkas "${file.name}" siap diimpor (${(file.size / 1024).toFixed(1)} KB). Klik "Proses Simpan ke Database".`);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    if (!importRawText.trim()) {
      alert('Harap unggah berkas atau tempelkan data pelanggan terlebih dahulu.');
      return;
    }

    try {
      let parsedCustomers: any[] = [];
      const trimmed = importRawText.trim();

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        // Parse JSON
        const rawJson = JSON.parse(trimmed);
        parsedCustomers = Array.isArray(rawJson) ? rawJson : (rawJson.customers || [rawJson]);
      } else {
        // Parse CSV
        const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          alert('Data CSV tidak memiliki baris data.');
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          const rowObj: any = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cols[idx] || '';
          });
          parsedCustomers.push({
            companyName: rowObj.companyname || rowObj.perusahaan || rowObj.name || rowObj.nama || 'Perusahaan',
            contactPerson: rowObj.contactperson || rowObj.kontak || rowObj.pic || 'PIC',
            position: rowObj.position || rowObj.jabatan || 'Penanggung Jawab',
            email: rowObj.email || 'customer@ldi.co.id',
            phone: rowObj.phone || rowObj.telepon || rowObj.hp || '08123456789',
            address: rowObj.address || rowObj.alamat || '',
            npwp: rowObj.npwp || '',
            status: rowObj.status === 'Lead' || rowObj.status === 'Nonaktif' ? rowObj.status : 'Aktif',
            notes: rowObj.notes || rowObj.catatan || '',
          });
        }
      }

      const validCustomers: Customer[] = parsedCustomers.map((p, idx) => ({
        id: p.id || `CUST-${String(customers.length + idx + 1).padStart(3, '0')}`,
        companyName: p.companyName || p.name || 'Perusahaan Pelanggan',
        contactPerson: p.contactPerson || p.pic || 'PIC',
        position: p.position || 'Manager',
        email: p.email || 'info@client.com',
        phone: p.phone || '08123456789',
        address: p.address || '',
        npwp: p.npwp || '',
        status: p.status || 'Aktif',
        notes: p.notes || '',
        createdAt: p.createdAt || new Date().toISOString().split('T')[0],
      }));

      if (validCustomers.length === 0) {
        alert('Tidak ditemukan data pelanggan yang valid.');
        return;
      }

      if (onBulkAddCustomers) {
        onBulkAddCustomers(validCustomers);
      } else {
        validCustomers.forEach((c) => onAddCustomer(c));
      }

      alert(`✅ Berhasil mengimpor/mengunggah ${validCustomers.length} data pelanggan ke server backend!`);
      setIsImportModalOpen(false);
      setImportRawText('');
      setImportStatus(null);
    } catch (err: any) {
      alert(`Format berkas tidak valid: ${err.message}`);
    }
  };

  // Form State
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'createdAt'>>({
    companyName: '',
    contactPerson: '',
    position: '',
    email: '',
    phone: '',
    address: '',
    npwp: '',
    status: 'Aktif',
    notes: '',
  });

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      companyName: '',
      contactPerson: '',
      position: '',
      email: '',
      phone: '',
      address: '',
      npwp: '',
      status: 'Aktif',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      companyName: customer.companyName,
      contactPerson: customer.contactPerson,
      position: customer.position,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      npwp: customer.npwp || '',
      status: customer.status,
      notes: customer.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        ...formData,
      });
    } else {
      const newCust: Customer = {
        id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddCustomer(newCust);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Manajemen Database Pelanggan (CRM)
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Kelola profil kontak perusahaan pelanggan PT. Lintas Data Internasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Upload className="w-4 h-4" />
            Unggah / Impor Pelanggan
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Pelanggan Baru
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari perusahaan / kontak / email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Lead">Lead / Prospek</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((cust) => {
          const custInvoices = invoices.filter((i) => i.customerId === cust.id);
          const custPks = pksList.filter((p) => p.customerId === cust.id);
          const custSph = sphList.filter((s) => s.customerId === cust.id);

          return (
            <div
              key={cust.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                      {cust.id}
                    </span>
                    <h3 className="font-black text-slate-900 text-sm mt-1">{cust.companyName}</h3>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      cust.status === 'Aktif'
                        ? 'bg-emerald-100 text-emerald-800'
                        : cust.status === 'Lead'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cust.status}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-800">{cust.contactPerson}</span>
                    <span className="text-slate-400">({cust.position})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{cust.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{cust.phone}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2 text-[11px]">{cust.address}</span>
                  </div>
                </div>

                {/* Customer Records Count Badges */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-[10px] font-bold">
                  <span className="bg-blue-50 text-blue-900 px-2 py-1 rounded border border-blue-100">
                    {custSph.length} SPH
                  </span>
                  <span className="bg-cyan-50 text-cyan-900 px-2 py-1 rounded border border-cyan-100">
                    {custPks.length} PKS
                  </span>
                  <span className="bg-emerald-50 text-emerald-900 px-2 py-1 rounded border border-emerald-100">
                    {custInvoices.length} Invoice
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedHistoryCustomer(cust)}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Riwayat Dokumen
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onCreateSphForCustomer(cust)}
                    className="bg-blue-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded hover:bg-blue-800 transition"
                  >
                    + SPH
                  </button>
                  <button
                    onClick={() => onCreateInvoiceForCustomer(cust)}
                    className="bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded hover:bg-emerald-800 transition"
                  >
                    + INV
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(cust)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteCustomer(cust.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-wide">
                {editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto touch-scroll">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Perusahaan / Instansi *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Contoh: PT. Solusi Digital Mandiri"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person (CP) *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Nama Kontak"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jabatan CP</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Contoh: IT Manager / CTO"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Perusahaan *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="support@perusahaan.com"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. Telp / WA *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap Perusahaan *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Boulevard Barat No. 12, Jakarta..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NPWP Perusahaan</label>
                  <input
                    type="text"
                    value={formData.npwp}
                    onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                    placeholder="01.234.567.8-xxx.000"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Kemitraan</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Lead">Lead / Prospek</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Khusus / Layanan Requested</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Misal: Butuh Internet 100Mbps Dedicated + Cloud VPS"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Document History Modal */}
      {selectedHistoryCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  Riwayat Dokumen Pelanggan
                </h3>
                <p className="text-xs text-blue-300 font-bold mt-0.5">
                  {selectedHistoryCustomer.companyName}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs">
              {/* SPH List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase flex items-center gap-2 text-xs">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Daftar Surat Penawaran Harga (SPH)
                </h4>
                {sphList.filter((s) => s.customerId === selectedHistoryCustomer.id).length > 0 ? (
                  <div className="space-y-1.5">
                    {sphList
                      .filter((s) => s.customerId === selectedHistoryCustomer.id)
                      .map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between bg-slate-50 p-2.5 rounded border border-slate-200"
                        >
                          <span className="font-mono font-bold text-blue-900">{s.sphNumber}</span>
                          <span className="text-slate-600">{formatDateIndonesian(s.date)}</span>
                          <span className="font-mono font-bold">{formatIDR(s.grandTotal)}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                            {s.status}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Belum ada dokumen SPH.</p>
                )}
              </div>

              {/* PKS List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase flex items-center gap-2 text-xs">
                  <FileCheck className="w-4 h-4 text-cyan-600" />
                  Daftar Perjanjian Kerja Sama (PKS)
                </h4>
                {pksList.filter((p) => p.customerId === selectedHistoryCustomer.id).length > 0 ? (
                  <div className="space-y-1.5">
                    {pksList
                      .filter((p) => p.customerId === selectedHistoryCustomer.id)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between bg-slate-50 p-2.5 rounded border border-slate-200"
                        >
                          <span className="font-mono font-bold text-cyan-900">{p.pksNumber}</span>
                          <span className="text-slate-600">Durasi: {p.contractDurationMonths} Bulan</span>
                          <span className="font-mono font-bold">{formatIDR(p.monthlyValue)}/Bln</span>
                          <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded font-bold text-[10px]">
                            {p.status}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Belum ada dokumen PKS.</p>
                )}
              </div>

              {/* Invoice List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase flex items-center gap-2 text-xs">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  Daftar Tagihan (Invoice)
                </h4>
                {invoices.filter((i) => i.customerId === selectedHistoryCustomer.id).length > 0 ? (
                  <div className="space-y-1.5">
                    {invoices
                      .filter((i) => i.customerId === selectedHistoryCustomer.id)
                      .map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between bg-slate-50 p-2.5 rounded border border-slate-200"
                        >
                          <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                          <span className="text-slate-600">{formatDateIndonesian(inv.issueDate)}</span>
                          <span className="font-mono font-bold">{formatIDR(inv.grandTotal)}</span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              inv.status === 'Lunas'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Belum ada invoice tagihan.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Customer Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Unggah / Impor Data Pelanggan</h3>
                  <p className="text-[11px] text-slate-500">
                    Mendukung berkas JSON atau teks baris CSV (Nama Perusahaan, PIC, Email, HP, Alamat).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStatus(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* File upload selector */}
              <div className="p-4 border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-xl text-center space-y-2">
                <input
                  ref={fileUploadRef}
                  type="file"
                  accept=".json,.csv,text/csv,application/json,text/plain"
                  onChange={handleUploadFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileUploadRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Pilih Berkas Pelanggan (.JSON atau .CSV)
                </button>
                <p className="text-[11px] text-slate-500">
                  Atau tempelkan isi data pelanggan langsung pada kotak teks di bawah.
                </p>
              </div>

              {importStatus && (
                <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>{importStatus}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Isi Data JSON / CSV (Dapat diedit langsung)
                </label>
                <textarea
                  rows={8}
                  placeholder={`Contoh JSON:
[
  {
    "companyName": "PT. Solusi Digital Mandiri",
    "contactPerson": "Ahmad Dani",
    "position": "IT Manager",
    "email": "ahmad@solusidigital.co.id",
    "phone": "081298765432",
    "address": "Gedung Cyber Lt. 5, Jakarta Selatan",
    "npwp": "01.888.777.6-012.000"
  }
]`}
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  className="w-full p-3 font-mono text-[11px] border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Data akan tersimpan permanen di server <code>data/db.json</code>.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleProcessImport}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition text-xs flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  Proses Simpan ke Database
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
