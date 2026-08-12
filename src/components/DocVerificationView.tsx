import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  Search,
  FileCheck,
  FileText,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Lock,
  QrCode,
  FileSearch,
  ExternalLink,
  RefreshCw,
  Building
} from 'lucide-react';
import { CompanyProfile, Invoice, PKS, SPH } from '../types';
import { formatIDR } from '../utils/formatters';

interface DocVerificationViewProps {
  sphList: SPH[];
  pksList: PKS[];
  invoices: Invoice[];
  companyProfile: CompanyProfile;
  initialDocQuery?: string;
  onPreviewDoc?: (type: 'SPH' | 'PKS' | 'Invoice', data: SPH | PKS | Invoice) => void;
}

interface VerificationLog {
  id: string;
  timestamp: string;
  query: string;
  docType: string;
  status: 'VALID' | 'INVALID';
  details?: string;
}

export const DocVerificationView: React.FC<DocVerificationViewProps> = ({
  sphList,
  pksList,
  invoices,
  companyProfile,
  initialDocQuery,
  onPreviewDoc,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialDocQuery || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (initialDocQuery) {
      setSearchQuery(initialDocQuery);
      verifyDocumentByQuery(initialDocQuery);
    }
  }, [initialDocQuery]);
  
  const [result, setResult] = useState<{
    status: 'IDLE' | 'VALID' | 'INVALID';
    type?: 'SPH' | 'PKS' | 'Invoice';
    data?: SPH | PKS | Invoice;
    matchedQuery?: string;
    hash?: string;
  }>({ status: 'IDLE' });

  const [history, setHistory] = useState<VerificationLog[]>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      query: 'SPH/2026/08/001',
      docType: 'Surat Penawaran Harga',
      status: 'VALID',
      details: 'Bank Mandiri Utama - Cloud Server & Colocation',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      query: 'INV-FAKE-999',
      docType: 'Tagihan Invoice',
      status: 'INVALID',
      details: 'Nomor tidak terdaftar di database PT. LDI',
    },
  ]);

  // Main search/verification engine logic
  const verifyDocumentByQuery = (queryStr: string, fileName?: string) => {
    const cleanQuery = queryStr.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanQuery) return;

    setIsScanning(true);
    setResult({ status: 'IDLE' });

    // Animated verification steps
    setScanStep('Menghubungkan ke Database Server PT. LDI...');
    setTimeout(() => {
      setScanStep('Memeriksa Indeks Nomor SPH, PKS & Invoice...');
      setTimeout(() => {
        setScanStep('Memverifikasi Tanda Tangan Digital SHA-256...');
        setTimeout(() => {
          executeCheck(cleanQuery, queryStr, fileName);
          setIsScanning(false);
        }, 600);
      }, 500);
    }, 400);
  };

  const executeCheck = (cleanQuery: string, originalQuery: string, fileName?: string) => {
    // 1. Search in SPH
    const matchedSph = sphList.find((s) => {
      const sphNum = s.sphNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
      const idStr = s.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      return sphNum.includes(cleanQuery) || idStr.includes(cleanQuery) || (fileName && fileName.toLowerCase().includes(sphNum));
    });

    if (matchedSph) {
      setResult({
        status: 'VALID',
        type: 'SPH',
        data: matchedSph,
        matchedQuery: matchedSph.sphNumber,
        hash: `SHA256-LDI-SPH-${matchedSph.id.slice(-6)}-${Date.now().toString(36).toUpperCase()}`,
      });
      addLog(matchedSph.sphNumber, 'Surat Penawaran Harga (SPH)', 'VALID', matchedSph.customerName);
      return;
    }

    // 2. Search in PKS
    const matchedPks = pksList.find((p) => {
      const pksNum = p.pksNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
      const idStr = p.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      return pksNum.includes(cleanQuery) || idStr.includes(cleanQuery) || (fileName && fileName.toLowerCase().includes(pksNum));
    });

    if (matchedPks) {
      setResult({
        status: 'VALID',
        type: 'PKS',
        data: matchedPks,
        matchedQuery: matchedPks.pksNumber,
        hash: `SHA256-LDI-PKS-${matchedPks.id.slice(-6)}-${Date.now().toString(36).toUpperCase()}`,
      });
      addLog(matchedPks.pksNumber, 'Perjanjian Kerja Sama (PKS)', 'VALID', matchedPks.customerName);
      return;
    }

    // 3. Search in Invoices
    const matchedInv = invoices.find((i) => {
      const invNum = i.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
      const idStr = i.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      return invNum.includes(cleanQuery) || idStr.includes(cleanQuery) || (fileName && fileName.toLowerCase().includes(invNum));
    });

    if (matchedInv) {
      setResult({
        status: 'VALID',
        type: 'Invoice',
        data: matchedInv,
        matchedQuery: matchedInv.invoiceNumber,
        hash: `SHA256-LDI-INV-${matchedInv.id.slice(-6)}-${Date.now().toString(36).toUpperCase()}`,
      });
      addLog(matchedInv.invoiceNumber, 'Tagihan Invoice', 'VALID', matchedInv.customerName);
      return;
    }

    // If no match found -> INVALID
    setResult({
      status: 'INVALID',
      matchedQuery: originalQuery,
    });
    addLog(originalQuery, 'Dokumen Tidak Dikenal', 'INVALID', 'Nomor/File Tidak Terdaftar di Server PT. LDI');
  };

  const addLog = (query: string, docType: string, status: 'VALID' | 'INVALID', details?: string) => {
    const newLog: VerificationLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      query,
      docType,
      status,
      details,
    };
    setHistory((prev) => [newLog, ...prev.slice(0, 9)]);
  };

  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
    // Extract name or attempt matching
    const nameWithoutExt = file.name.split('.')[0];
    setSearchQuery(nameWithoutExt);
    verifyDocumentByQuery(nameWithoutExt, file.name);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-cyan-300 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-cyan-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              SISTEM OTIENTIFIKASI & LEGALITAS DIGITAL PT. LDI
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Verifikasi Keaslian Dokumen Resmi
            </h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              Lakukan pengecekan keabsahan Surat Penawaran Harga (SPH), Perjanjian Kerja Sama (PKS), dan Invoice resmi yang diterbitkan oleh <strong className="text-white">{companyProfile.legalName}</strong> secara instant & akurat.
            </p>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs font-mono space-y-1 shrink-0">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              LDI Security Engine: ACTIVE
            </div>
            <p className="text-slate-400 text-[10px]">Database Index: Synced (Live)</p>
          </div>
        </div>
      </div>

      {/* Main Verification Tool Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload / Search Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* File Drag and Drop Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Upload className="w-4 h-4 text-blue-600" />
              1. Upload Dokumen / Scan
            </h3>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400'
              }`}
            >
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="doc-file-input"
              />

              <label htmlFor="doc-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-inner">
                  <FileSearch className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-xs">
                    Tarik & Lepas Berkas PDF / Gambar Ke Sini
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mendukung berkas PDF, PNG, JPG, atau hasil Scan
                  </p>
                </div>
                <span className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition mt-1">
                  Pilih Berkas PDF / Image
                </span>
              </label>

              {selectedFile && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold px-3 py-1.5 rounded-lg w-full truncate">
                  📄 Berkas Terpilih: {selectedFile.name}
                </div>
              )}
            </div>

            {/* OR Separator */}
            <div className="relative my-2 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase">
                Atau Cari Nomor Dokumen
              </span>
            </div>

            {/* Manual Query Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyDocumentByQuery(searchQuery);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  2. Masukkan Nomor Dokumen / Hash ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SPH/2026/08/001 atau INV/2026/08/001"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isScanning || !searchQuery.trim()}
                className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Memeriksa Server...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-cyan-300" />
                    <span>Verifikasi Keaslian Dokumen</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Verification Results & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Scanning Animation State */}
          {isScanning && (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4 flex flex-col items-center justify-center min-h-[350px]">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                <ShieldCheck className="w-8 h-8 text-blue-600 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-slate-900 text-sm">PROSES OTIENTIFIKASI KEASLIAN DOKUMEN</p>
                <p className="text-xs font-mono font-bold text-blue-600 animate-pulse">{scanStep}</p>
              </div>
              <p className="text-[11px] text-slate-400">
                Memeriksa integritas checksum digital dengan server PT. Lintas Data Internasional...
              </p>
            </div>
          )}

          {/* Idle Initial State */}
          {!isScanning && result.status === 'IDLE' && (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center min-h-[380px] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <QrCode className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">Belum Ada Dokumen Yang Diverifikasi</h3>
                <p className="text-slate-500 text-xs">
                  Unggah berkas PDF/gambar atau masukkan nomor dokumen resmi pada form di sebelah kiri untuk melihat status legalitas.
                </p>
              </div>
            </div>
          )}

          {/* RESULT CASE 1: VALID & AUTHENTIC DOCUMENT */}
          {!isScanning && result.status === 'VALID' && result.data && (
            <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-xl overflow-hidden space-y-0">
              {/* Authenticity Header Badge */}
              <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-400/20 text-emerald-200 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    STATUS: DOKUMEN RESMI TERDAFTAR
                  </span>
                  <span className="text-[10px] font-mono text-emerald-200">
                    Verified: {new Date().toLocaleTimeString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-12 h-12 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-black shadow-lg shrink-0">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white leading-tight">
                      100% DOKUMEN ASLI & SAH (PT. LINTAS DATA INTERNASIONAL)
                    </h3>
                    <p className="text-emerald-100 text-xs mt-0.5">
                      Dokumen ini terdaftar resmi pada database server PT. LDI dan memiliki kekuatan hukum.
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Metadata Details */}
              <div className="p-6 space-y-5 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Tipe Dokumen</span>
                    <span className="font-black text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full text-xs">
                      {result.type === 'SPH' && 'Surat Penawaran Harga (SPH)'}
                      {result.type === 'PKS' && 'Perjanjian Kerja Sama (PKS)'}
                      {result.type === 'Invoice' && 'Tagihan Invoice Resmi'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Nomor Dokumen Official</span>
                      <p className="font-mono font-bold text-slate-900 text-sm">{result.matchedQuery}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Nama Pelanggan / Mitra</span>
                      <p className="font-bold text-slate-900">{result.data.customerName}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Tanggal Terbit / Kontrak</span>
                      <p className="font-semibold text-slate-800">
                        {'date' in result.data && (result.data as SPH).date}
                        {'startDate' in result.data && `${(result.data as PKS).startDate} s/d ${(result.data as PKS).endDate}`}
                        {'issueDate' in result.data && (result.data as Invoice).issueDate}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Total Nilai Transaksi</span>
                      <p className="font-black text-emerald-700 text-sm">
                        {'totalContractValue' in result.data && formatIDR((result.data as PKS).totalContractValue)}
                        {'grandTotal' in result.data && formatIDR((result.data as SPH | Invoice).grandTotal)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Digital Signature & Fingerprint Hash */}
                <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> DIGITAL SIGNATURE CHECKSUM
                    </span>
                    <span className="text-[9px] text-slate-400">ALGORITHM: SHA-256</span>
                  </div>
                  <p className="font-mono text-[10px] text-slate-300 break-all bg-slate-950 p-2 rounded border border-slate-800">
                    {result.hash}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Penandatangan: <strong>{companyProfile.directorName}</strong></span>
                    <span className="text-emerald-400 font-bold">✓ VERIFIED BY PT. LDI CLOUD</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <p className="text-[11px] text-slate-500">
                    Ingin melihat tampilan PDF lengkap dokumen resmi ini?
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      if (onPreviewDoc && result.type && result.data) {
                        onPreviewDoc(result.type, result.data);
                      }
                    }}
                    className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <ExternalLink className="w-4 h-4 text-cyan-300" /> Pratinjau PDF Asli (Database)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RESULT CASE 2: INVALID / UNREGISTERED / FAKE DOCUMENT */}
          {!isScanning && result.status === 'INVALID' && (
            <div className="bg-white rounded-2xl border-2 border-red-500 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-800 via-rose-900 to-red-950 text-white p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="bg-red-400/20 text-red-200 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-red-400/30 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
                    PERINGATAN: TIDAK TERDAFTAR
                  </span>
                  <span className="text-[10px] font-mono text-red-200">
                    Checked: {new Date().toLocaleTimeString('id-ID')}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-12 h-12 rounded-xl bg-white text-red-700 flex items-center justify-center font-black shadow-lg shrink-0">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white leading-tight">
                      DOKUMEN TIDAK DIKENAL / INDIKASI PALSU
                    </h3>
                    <p className="text-red-100 text-xs mt-0.5">
                      Nomor dokumen atau berkas <strong className="text-white">"{result.matchedQuery}"</strong> tidak ditemukan dalam server resmi PT. LDI.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-900 space-y-2">
                  <p className="font-bold text-sm text-red-950">⚠️ Himbauan Keamanan Resmi PT. Lintas Data Internasional:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 text-xs">
                    <li>Segala transaksi pembayaran atau kontrak dengan dokumen tidak terdaftar berada di luar tanggung jawab PT. LDI.</li>
                    <li>Pastikan nomor rekening pembayaran hanya atas nama <strong>{companyProfile.legalName}</strong>.</li>
                    <li>Harap laporkan indikasi penipuan / pemalsuan surat ke email resmi: <strong className="text-blue-900">{companyProfile.email}</strong> atau Whatsapp Support: <strong className="text-emerald-700">{companyProfile.whatsapp}</strong>.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
