import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  FileCheck,
  Users,
  AlertCircle,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  CheckCircle,
  Clock,
  PieChart as PieChartIcon,
  Search,
  X,
  FileText,
  Eye,
  Building2,
  Tag,
  ChevronRight,
  Filter,
  BarChart3,
  ShieldCheck,
  Receipt,
  Wallet,
  History,
  UserCheck,
  FilePenLine,
  Send,
  Trash2,
  Sparkles,
  RotateCcw,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ActivityLog, Customer, Invoice, PKS, SPH, ServiceCategory } from '../types';
import { formatDateIndonesian, formatIDR, getMonthName } from '../utils/formatters';
import { exportFinancialReportToExcel, exportInvoicesToExcel } from '../utils/excelExport';

interface DashboardViewProps {
  invoices: Invoice[];
  sphList: SPH[];
  pksList: PKS[];
  customers: Customer[];
  activityLogs?: ActivityLog[];
  onClearActivityLogs?: () => void;
  onNavigateTo: (tab: string) => void;
  onPreviewDoc?: (type: 'SPH' | 'PKS' | 'Invoice', data: SPH | PKS | Invoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  sphList,
  pksList,
  customers,
  activityLogs = [],
  onClearActivityLogs,
  onNavigateTo,
  onPreviewDoc,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [logDocFilter, setLogDocFilter] = useState<string>('Semua');

  const filteredLogs = activityLogs.filter((log) => {
    if (logDocFilter === 'Semua') return true;
    return log.docType === logDocFilter;
  });

  const formatLogTime = (isoString: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return (
        d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB'
      );
    } catch (e) {
      return isoString;
    }
  };

  // Global Search state
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<'ALL' | 'CUSTOMERS' | 'SPH' | 'PKS' | 'INVOICES'>('ALL');

  const q = globalQuery.trim().toLowerCase();

  // Search matches across all modules
  const matchedCustomers = q
    ? customers.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.picName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.code && c.code.toLowerCase().includes(q)) ||
          (c.city && c.city.toLowerCase().includes(q))
      )
    : [];

  const matchedSph = q
    ? sphList.filter(
        (s) =>
          s.sphNumber.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q) ||
          (s.customerEmail && s.customerEmail.toLowerCase().includes(q)) ||
          (s.notes && s.notes.toLowerCase().includes(q))
      )
    : [];

  const matchedPks = q
    ? pksList.filter(
        (p) =>
          p.pksNumber.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q))
      )
    : [];

  const matchedInvoices = q
    ? invoices.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q) ||
          (i.customerEmail && i.customerEmail.toLowerCase().includes(q)) ||
          (i.notes && i.notes.toLowerCase().includes(q))
      )
    : [];

  const totalResultsCount =
    matchedCustomers.length + matchedSph.length + matchedPks.length + matchedInvoices.length;

  // Filter invoices based on month & year
  const filteredInvoices = invoices.filter((inv) => {
    const d = new Date(inv.issueDate);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Helper to calculate paid & remaining amounts accurately
  const getPaidAmt = (inv: Invoice): number => {
    if (typeof inv.paidAmount === 'number') return inv.paidAmount;
    if (inv.status === 'Lunas') return inv.grandTotal;
    if (inv.payments && inv.payments.length > 0) {
      return inv.payments.reduce((sum, p) => sum + p.amount, 0);
    }
    return 0;
  };

  const getRemAmt = (inv: Invoice): number => {
    if (inv.status === 'Dibatalkan') return 0;
    return Math.max(0, inv.grandTotal - getPaidAmt(inv));
  };

  // Calculate Metrics
  const totalRevenuePaid = filteredInvoices.reduce((acc, inv) => acc + getPaidAmt(inv), 0);

  const totalOutstanding = filteredInvoices.reduce((acc, inv) => acc + getRemAmt(inv), 0);

  const totalInvoicedMonth = filteredInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);

  const activeCustomersCount = customers.filter((c) => c.status === 'Aktif').length;

  const totalPksActiveCount = pksList.filter((p) => p.status === 'Aktif').length;

  // Monthly Recurring Revenue (MRR) from active PKS
  const currentMRR = pksList
    .filter((p) => p.status === 'Aktif')
    .reduce((acc, p) => acc + p.monthlyValue, 0);

  // Active PKS Total Accumulated Value
  const activePksList = pksList.filter((p) => p.status === 'Aktif');
  const totalAccumulatedActivePksValue = activePksList.reduce(
    (acc, p) => acc + (p.totalContractValue || 0),
    0
  );

  // 12-Month Financial Chart Data for Selected Year (Recharts)
  const monthlyRevenueChartData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
    const monthInvoices = invoices.filter((inv) => {
      if (!inv.issueDate) return false;
      const d = new Date(inv.issueDate);
      return d.getMonth() + 1 === m && d.getFullYear() === selectedYear;
    });

    const paidRevenue = monthInvoices.reduce((acc, inv) => acc + getPaidAmt(inv), 0);

    const pendingRevenue = monthInvoices.reduce((acc, inv) => acc + getRemAmt(inv), 0);

    return {
      month: getMonthName(m - 1).substring(0, 3),
      fullName: getMonthName(m - 1),
      'Pendapatan Lunas': paidRevenue,
      'Belum Bayar': pendingRevenue,
    };
  });

  const totalYearlyPaidRevenue = monthlyRevenueChartData.reduce(
    (acc, item) => acc + item['Pendapatan Lunas'],
    0
  );

  // Revenue per category breakdown
  const categoryBreakdown: Record<ServiceCategory, number> = {
    'Internet Dedicated': 0,
    'Cloud Server': 0,
    'Colocation Server': 0,
    'Datacenter Managed': 0,
    'Custom Layanan': 0,
  };

  filteredInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (categoryBreakdown[item.category] !== undefined) {
        categoryBreakdown[item.category] += item.qty * item.price - (item.discount || 0);
      }
    });
  });

  const exportFinancialCsv = () => {
    const headers = ['No Invoice', 'Pelanggan', 'Tanggal', 'Jatuh Tempo', 'Status', 'Total (IDR)'];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      `"${inv.customerName}"`,
      inv.issueDate,
      inv.dueDate,
      inv.status,
      inv.grandTotal,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_PT_LDI_${getMonthName(selectedMonth - 1)}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Month/Year Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Laporan Keuangan & Executive Summary
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Ringkasan pendapatan, status tagihan, MRR, dan konversi kontrak PT. Lintas Data Internasional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500 ml-1" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 border-none focus:outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  Bulan: {getMonthName(m - 1)}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 border-none focus:outline-none cursor-pointer border-l border-slate-300 pl-2"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => exportFinancialReportToExcel(invoices, selectedMonth, selectedYear)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
            title="Unduh laporan keuangan bulanan lengkap (Executive Summary, Detail Invoice, Jurnal Setoran) dalam format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Laporan Excel (.xlsx)</span>
          </button>

          <button
            onClick={exportFinancialCsv}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            title="Unduh data dalam format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* GLOBAL SEARCH BAR */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-cyan-200">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Pencarian Global System (Global Search)
              </h3>
              <p className="text-[11px] text-slate-400">
                Cari pelanggan CRM, nomor SPH, PKS, atau Invoice secara cepat di seluruh sistem PT. LDI
              </p>
            </div>
          </div>

          {globalQuery && (
            <div className="text-[11px] font-bold text-cyan-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 self-start sm:self-auto">
              Ditemukan {totalResultsCount} Hasil
            </div>
          )}
        </div>

        {/* Input & Clear Button */}
        <div className="relative">
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder="Ketik nama pelanggan, PIC, nomor SPH (SPH-...), PKS (PKS-...), atau Invoice (INV-...)..."
            className="w-full pl-11 pr-10 py-3 bg-slate-950 border border-slate-700 text-white placeholder-slate-500 rounded-xl font-medium text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition shadow-inner"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          {globalQuery && (
            <button
              onClick={() => setGlobalQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
              title="Bersihkan Pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills (When query exists) */}
        {globalQuery && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Filter Hasil:
            </span>

            <button
              onClick={() => setSearchCategoryFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                searchCategoryFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Semua ({totalResultsCount})
            </button>

            <button
              onClick={() => setSearchCategoryFilter('CUSTOMERS')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                searchCategoryFilter === 'CUSTOMERS'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🏢 Pelanggan ({matchedCustomers.length})
            </button>

            <button
              onClick={() => setSearchCategoryFilter('SPH')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                searchCategoryFilter === 'SPH'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              📄 SPH ({matchedSph.length})
            </button>

            <button
              onClick={() => setSearchCategoryFilter('PKS')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                searchCategoryFilter === 'PKS'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              📑 PKS ({matchedPks.length})
            </button>

            <button
              onClick={() => setSearchCategoryFilter('INVOICES')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                searchCategoryFilter === 'INVOICES'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              💳 Invoice ({matchedInvoices.length})
            </button>
          </div>
        )}

        {/* Global Search Results Panel */}
        {globalQuery && (
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-4 max-h-[480px] overflow-y-auto">
            {totalResultsCount === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto opacity-80" />
                <p className="font-bold text-xs text-slate-300">
                  Tidak ditemukan data matching dengan kata kunci &quot;{globalQuery}&quot;
                </p>
                <p className="text-[11px] text-slate-500">
                  Coba gunakan istilah lain seperti nama perusahaan, PIC, atau nomor dokumen resmi.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1. PELANGGAN CRM RESULTS */}
                {(searchCategoryFilter === 'ALL' || searchCategoryFilter === 'CUSTOMERS') &&
                  matchedCustomers.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-cyan-400" /> Pelanggan CRM ({matchedCustomers.length})
                        </span>
                        <button
                          onClick={() => onNavigateTo('customers')}
                          className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                        >
                          Buka CRM <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {matchedCustomers.map((cust) => (
                          <div
                            key={cust.id}
                            className="bg-slate-900 hover:bg-slate-800/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 transition"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-900 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                  {cust.code || 'CRM'}
                                </span>
                                <h4 className="font-bold text-xs text-white truncate">{cust.companyName}</h4>
                              </div>
                              <p className="text-[11px] text-slate-300">
                                PIC: <strong>{cust.picName}</strong> • {cust.email}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                📍 {cust.city || cust.address || 'Indonesia'} • {cust.phone}
                              </p>
                            </div>

                            <button
                              onClick={() => onNavigateTo('customers')}
                              className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition"
                            >
                              Lihat CRM
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 2. SPH RESULTS */}
                {(searchCategoryFilter === 'ALL' || searchCategoryFilter === 'SPH') &&
                  matchedSph.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-400" /> Surat Penawaran Harga (SPH) ({matchedSph.length})
                        </span>
                        <button
                          onClick={() => onNavigateTo('sph')}
                          className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                        >
                          Buka Modul SPH <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {matchedSph.map((sph) => (
                          <div
                            key={sph.id}
                            className="bg-slate-900 hover:bg-slate-800/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 transition"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-cyan-300">{sph.sphNumber}</span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    sph.status === 'Dikonversi ke PKS'
                                      ? 'bg-emerald-900/80 text-emerald-300'
                                      : 'bg-amber-900/80 text-amber-300'
                                  }`}
                                >
                                  {sph.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-white font-bold truncate">{sph.customerName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Tgl: {formatDateIndonesian(sph.date)} • Nilai: <strong className="text-emerald-400">{formatIDR(sph.grandTotal)}</strong>
                              </p>
                            </div>

                            <div className="flex flex-col gap-1 shrink-0">
                              {onPreviewDoc && (
                                <button
                                  onClick={() => onPreviewDoc('SPH', sph)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> PDF
                                </button>
                              )}
                              <button
                                onClick={() => onNavigateTo('sph')}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] px-2.5 py-1 rounded-lg transition"
                              >
                                Detail
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 3. PKS RESULTS */}
                {(searchCategoryFilter === 'ALL' || searchCategoryFilter === 'PKS') &&
                  matchedPks.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                        <span className="flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-purple-400" /> Perjanjian Kerja Sama (PKS) ({matchedPks.length})
                        </span>
                        <button
                          onClick={() => onNavigateTo('pks')}
                          className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                        >
                          Buka Modul PKS <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {matchedPks.map((pks) => (
                          <div
                            key={pks.id}
                            className="bg-slate-900 hover:bg-slate-800/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 transition"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-purple-300">{pks.pksNumber}</span>
                                <span className="bg-emerald-900/80 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                  {pks.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-white font-bold truncate">{pks.customerName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                MRR: <strong className="text-cyan-300">{formatIDR(pks.monthlyValue)}/bln</strong> • Total: {formatIDR(pks.totalContractValue)}
                              </p>
                            </div>

                            <div className="flex flex-col gap-1 shrink-0">
                              {onPreviewDoc && (
                                <button
                                  onClick={() => onPreviewDoc('PKS', pks)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> PDF
                                </button>
                              )}
                              <button
                                onClick={() => onNavigateTo('pks')}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] px-2.5 py-1 rounded-lg transition"
                              >
                                Detail
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 4. INVOICE RESULTS */}
                {(searchCategoryFilter === 'ALL' || searchCategoryFilter === 'INVOICES') &&
                  matchedInvoices.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Invoice Penagihan ({matchedInvoices.length})
                        </span>
                        <button
                          onClick={() => onNavigateTo('invoices')}
                          className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                        >
                          Buka Modul Invoice <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {matchedInvoices.map((inv) => (
                          <div
                            key={inv.id}
                            className="bg-slate-900 hover:bg-slate-800/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 transition"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-amber-300">{inv.invoiceNumber}</span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    inv.status === 'Lunas'
                                      ? 'bg-emerald-900/80 text-emerald-300'
                                      : inv.status === 'Belum Bayar'
                                      ? 'bg-amber-900/80 text-amber-300'
                                      : 'bg-rose-900/80 text-rose-300'
                                  }`}
                                >
                                  {inv.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-white font-bold truncate">{inv.customerName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Due: {formatDateIndonesian(inv.dueDate)} • Total: <strong className="text-emerald-400">{formatIDR(inv.grandTotal)}</strong>
                              </p>
                            </div>

                            <div className="flex flex-col gap-1 shrink-0">
                              {onPreviewDoc && (
                                <button
                                  onClick={() => onPreviewDoc('Invoice', inv)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> PDF
                                </button>
                              )}
                              <button
                                onClick={() => onNavigateTo('invoices')}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] px-2.5 py-1 rounded-lg transition"
                              >
                                Detail
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Paid Revenue */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Pendapatan Terbayar
            </span>
            <span className="p-2 bg-emerald-800/60 rounded-xl text-emerald-300">
              <CheckCircle className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-black font-mono mt-3 tracking-tight">
            {formatIDR(totalRevenuePaid)}
          </p>
          <p className="text-[11px] text-emerald-200 mt-2 flex items-center gap-1">
            <span>Bulan {getMonthName(selectedMonth - 1)} {selectedYear}</span>
          </p>
        </div>

        {/* Total Outstanding Unpaid */}
        <div className="bg-gradient-to-br from-amber-900 to-orange-950 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
              Tagihan Belum Bayar
            </span>
            <span className="p-2 bg-amber-800/60 rounded-xl text-amber-300">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-black font-mono mt-3 tracking-tight">
            {formatIDR(totalOutstanding)}
          </p>
          <p className="text-[11px] text-amber-200 mt-2 flex items-center gap-1">
            <span>Perlu Follow-up Pelanggan</span>
          </p>
        </div>

        {/* Total Akumulasi Nilai PKS Aktif */}
        <div className="bg-gradient-to-br from-cyan-950 via-slate-900 to-blue-900 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Total Akumulasi PKS Aktif
            </span>
            <span className="p-2 bg-cyan-800/60 rounded-xl text-cyan-200">
              <ShieldCheck className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-black font-mono mt-3 tracking-tight text-cyan-100">
            {formatIDR(totalAccumulatedActivePksValue)}
          </p>
          <p className="text-[11px] text-cyan-200 mt-2 flex items-center justify-between">
            <span>{activePksList.length} PKS Aktif</span>
            <span className="font-mono text-cyan-300">MRR: {formatIDR(currentMRR)}</span>
          </p>
        </div>

        {/* Active Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pelanggan Aktif
            </span>
            <span className="p-2 bg-slate-100 rounded-xl text-blue-600">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{activeCustomersCount}</p>
          <button
            onClick={() => onNavigateTo('customers')}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-bold mt-2 flex items-center gap-0.5"
          >
            Kelola CRM Pelanggan <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* RECHARTS FINANCIAL BAR CHART SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-black text-slate-900 text-base uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Grafik Pendapatan Bulanan (Status Invoice Lunas vs Belum Bayar - Tahun {selectedYear})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Analisis performa realisasi pencairan arus kas invoice pelanggan bulanan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-600" />
              <div className="text-[11px]">
                <span className="text-slate-500">Total Terbayar ({selectedYear}):</span>{' '}
                <strong className="text-emerald-800 font-mono font-bold">{formatIDR(totalYearlyPaidRevenue)}</strong>
              </div>
            </div>

            <div className="bg-cyan-50 border border-cyan-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
              <Wallet className="w-4 h-4 text-cyan-700" />
              <div className="text-[11px]">
                <span className="text-slate-500">Akumulasi PKS Aktif:</span>{' '}
                <strong className="text-cyan-900 font-mono font-bold">{formatIDR(totalAccumulatedActivePksValue)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyRevenueChartData}
              margin={{ top: 10, right: 10, left: 20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(val) =>
                  val >= 1_000_000_000
                    ? `${(val / 1_000_000_000).toFixed(1)}M`
                    : val >= 1_000_000
                    ? `${(val / 1_000_000).toFixed(0)}Jt`
                    : val
                }
                tick={{ fill: '#475569', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const item = monthlyRevenueChartData.find((d) => d.month === label);
                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-700 shadow-2xl text-xs space-y-2">
                        <p className="font-bold text-cyan-300 border-b border-slate-800 pb-1">
                          Bulan {item?.fullName || label} {selectedYear}
                        </p>
                        {payload.map((entry: any, index: number) => (
                          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              {entry.name}:
                            </span>
                            <span className="font-mono font-bold text-white">
                              {formatIDR(entry.value as number)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '15px', fontSize: '12px', fontWeight: 600 }}
              />
              <Bar
                dataKey="Pendapatan Lunas"
                name="Pendapatan Invoice Lunas"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
              <Bar
                dataKey="Belum Bayar"
                name="Invoice Belum Dibayar"
                fill="#f59e0b"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Breakdown by Service Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-blue-600" />
              Breakdown Pendapatan Per Kategori Layanan
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total Invoiced: {formatIDR(totalInvoicedMonth)}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {(Object.keys(categoryBreakdown) as ServiceCategory[]).map((cat) => {
              const val = categoryBreakdown[cat];
              const pct = totalInvoicedMonth > 0 ? Math.round((val / totalInvoicedMonth) * 100) : 0;

              const categoryColors: Record<ServiceCategory, { dot: string; bar: string }> = {
                'Internet Dedicated': { dot: 'bg-blue-600', bar: 'from-blue-900 via-blue-600 to-cyan-500' },
                'Cloud Server': { dot: 'bg-indigo-600', bar: 'from-indigo-900 via-indigo-600 to-sky-400' },
                'Colocation Server': { dot: 'bg-purple-600', bar: 'from-purple-900 via-purple-600 to-pink-500' },
                'Datacenter Managed': { dot: 'bg-emerald-600', bar: 'from-emerald-900 via-emerald-600 to-teal-400' },
                'Custom Layanan': { dot: 'bg-amber-500', bar: 'from-amber-700 via-amber-500 to-orange-400' },
              };
              const color = categoryColors[cat] || { dot: 'bg-blue-600', bar: 'from-blue-900 via-indigo-600 to-cyan-500' };

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`}></span>
                      {cat}
                    </span>
                    <span className="font-mono text-slate-900">
                      {formatIDR(val)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${color.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Stats & Conversion Summary */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide text-blue-300 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              Statistik Dokumen Usaha
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Rasio Konversi Surat Penawaran (SPH) ke Perjanjian Kerja Sama (PKS).
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-xs font-semibold text-slate-300">Total SPH Diterbitkan</span>
                <span className="font-mono font-bold text-blue-200">{sphList.length} SPH</span>
              </div>

              <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-xs font-semibold text-slate-300">SPH Dikonversi ke PKS</span>
                <span className="font-mono font-bold text-emerald-400">
                  {sphList.filter((s) => s.status === 'Dikonversi ke PKS' || s.pksConvertedId).length} SPH
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <span className="text-xs font-semibold text-slate-300">Total PKS Aktif</span>
                <span className="font-mono font-bold text-cyan-300">{pksList.length} Dokumen</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => onNavigateTo('sph')}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition text-center"
            >
              Buat Penawaran Harga Baru (SPH)
            </button>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
            Tagihan Penagihan Terbaru (Invoice)
          </h3>
          <button
            onClick={() => onNavigateTo('invoices')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Lihat Semua Invoice <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                <th className="p-3">No Invoice</th>
                <th className="p-3">Pelanggan</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Jatuh Tempo</th>
                <th className="p-3 text-right">Total Tagihan</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-blue-900">{inv.invoiceNumber}</td>
                    <td className="p-3 font-bold text-slate-800">{inv.customerName}</td>
                    <td className="p-3 text-slate-600">{formatDateIndonesian(inv.issueDate)}</td>
                    <td className="p-3 text-slate-600">{formatDateIndonesian(inv.dueDate)}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatIDR(inv.grandTotal)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          inv.status === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'Belum Bayar'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                    Belum ada invoice untuk bulan dan tahun yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity History Log Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-black text-slate-900 text-base uppercase tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Log Aktivitas & Riwayat Dokumen
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Catatan jejak audit pembuatan, pengubahan, dan penandatanganan dokumen oleh Admin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold mr-1">Filter Dokumen:</span>
            {['Semua', 'SPH', 'PKS', 'Invoice', 'Pelanggan', 'Pengaturan'].map((type) => (
              <button
                key={type}
                onClick={() => setLogDocFilter(type)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  logDocFilter === type
                    ? 'bg-indigo-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}

            {onClearActivityLogs && activityLogs.length > 0 && (
              <button
                onClick={onClearActivityLogs}
                title="Kosongkan Riwayat Log"
                className="p-1.5 ml-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Timeline Log List */}
        <div className="max-h-96 overflow-y-auto pr-1 space-y-3">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              let actionBg = 'bg-slate-100 text-slate-800 border-slate-300';
              let ActionIcon = Sparkles;

              if (log.action === 'Dibuat') {
                actionBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                ActionIcon = PlusCircle;
              } else if (log.action === 'Diubah') {
                actionBg = 'bg-blue-100 text-blue-800 border-blue-300';
                ActionIcon = FilePenLine;
              } else if (log.action === 'Ditandatangani') {
                actionBg = 'bg-purple-100 text-purple-800 border-purple-300';
                ActionIcon = UserCheck;
              } else if (log.action === 'Dikirim') {
                actionBg = 'bg-cyan-100 text-cyan-800 border-cyan-300';
                ActionIcon = Send;
              } else if (log.action === 'Dihapus') {
                actionBg = 'bg-rose-100 text-rose-800 border-rose-300';
                ActionIcon = Trash2;
              } else if (log.action === 'Status Diubah') {
                actionBg = 'bg-amber-100 text-amber-800 border-amber-300';
                ActionIcon = RotateCcw;
              }

              return (
                <div
                  key={log.id}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wide shrink-0 ${actionBg}`}
                    >
                      <ActionIcon className="w-3.5 h-3.5" />
                      {log.action}
                    </span>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          [{log.docType}] {log.docNumberOrName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          oleh <strong className="text-slate-700">{log.performedBy}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{log.details}</p>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 whitespace-nowrap self-end sm:self-center flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatLogTime(log.timestamp)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Belum ada catatan log aktivitas yang sesuai dengan filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
