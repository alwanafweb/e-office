import React, { useState } from 'react';
import { X, Printer, Download, Mail, CheckCircle2, ShieldAlert, Receipt, FileCheck, PenTool, Upload, Check, Lock, Unlock, Eraser } from 'lucide-react';
import { CompanyProfile, Customer, Invoice, PKS, SPH } from '../types';
import { KopSuratHeader } from './KopSuratHeader';
import { QRCodeBadge } from './QRCodeBadge';
import { SendDocEmailModal } from './SendDocEmailModal';
import { SignaturePad } from './SignaturePad';
import { formatDateIndonesian, formatIDR, terbilangRupiah } from '../utils/formatters';
import { COMPANY_PROFILE } from '../data/initialData';
import { exportToPdf } from '../utils/pdfGenerator';

export const getContactPersonName = (
  docRep?: string,
  customerId?: string,
  customerName?: string,
  customers?: Customer[]
) => {
  if (docRep && docRep.trim() !== '' && docRep !== 'Contact Person') {
    return docRep;
  }
  if (customers && customers.length > 0) {
    const found = customers.find(
      (c) => (customerId && c.id === customerId) || c.companyName === customerName
    );
    if (found) {
      if (found.contactPerson && found.contactPerson.trim() !== '') return found.contactPerson;
      if (found.picName && found.picName.trim() !== '') return found.picName;
    }
  }
  return docRep || 'Contact Person';
};

interface DocPreviewModalProps {
  type: 'SPH' | 'PKS' | 'Invoice';
  data: SPH | PKS | Invoice;
  companyProfile?: CompanyProfile;
  customers?: Customer[];
  onClose: () => void;
  onSignDocument?: (type: 'SPH' | 'PKS' | 'Invoice', id: string, signatureData: string) => void;
  onUpdateStatusToSent?: (type: 'SPH' | 'PKS' | 'Invoice', id: string) => void;
  onConvertToInvoice?: (sph: SPH) => void;
  onConvertToPks?: (sph: SPH) => void;
  onToggleLockDocument?: (type: 'SPH' | 'PKS' | 'Invoice', id: string, forceState?: boolean) => void;
}

export const DocPreviewModal: React.FC<DocPreviewModalProps> = ({
  type,
  data,
  companyProfile,
  customers,
  onClose,
  onSignDocument,
  onUpdateStatusToSent,
  onConvertToInvoice,
  onConvertToPks,
  onToggleLockDocument,
}) => {
  const [docData, setDocData] = useState<SPH | PKS | Invoice>(data);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showStamp, setShowStamp] = useState(true);
  const [headerMode, setHeaderMode] = useState<'official' | 'clean'>('official');
  const [isSendEmailOpen, setIsSendEmailOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signMode, setSignMode] = useState<'upload' | 'draw'>('upload');
  const [tempSignature, setTempSignature] = useState<string>('');

  const docNumber =
    type === 'SPH'
      ? (docData as SPH).sphNumber
      : type === 'PKS'
      ? (docData as PKS).pksNumber
      : (docData as Invoice).invoiceNumber;

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    const suffix = headerMode === 'clean' ? '_Clean' : '';
    await exportToPdf('printable-document-content', `${type}_${docNumber.replace(/\//g, '_')}${suffix}`);
    setIsDownloading(false);

    // Otomatis kunci dokumen saat didownload agar tidak diubah sembarangan
    if (!docData.isLocked && onToggleLockDocument) {
      onToggleLockDocument(type, docData.id, true);
      setDocData((prev) => ({ ...prev, isLocked: true }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div className="flex items-center gap-3">
            <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-md tracking-wider uppercase">
              Dokumen Resmi {type}
            </span>
            <span className="font-mono text-sm text-blue-200 font-semibold">{docNumber}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {docData.isLocked ? (
              <button
                onClick={() => {
                  if (onToggleLockDocument) onToggleLockDocument(type, docData.id, false);
                  setDocData((prev) => ({ ...prev, isLocked: false }));
                }}
                className="flex items-center gap-1.5 bg-rose-900/90 hover:bg-rose-800 text-rose-100 border border-rose-600 font-bold text-xs px-3 py-2 rounded-lg shadow transition cursor-pointer"
                title="Dokumen dalam Status Terkunci (Locked). Klik untuk membuka kunci dokumen."
              >
                <Lock className="w-4 h-4 text-rose-300" />
                <span>Terkunci 🔒 (Buka Kunci)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onToggleLockDocument) onToggleLockDocument(type, docData.id, true);
                  setDocData((prev) => ({ ...prev, isLocked: true }));
                }}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-3 py-2 rounded-lg transition cursor-pointer"
                title="Kunci dokumen agar tidak dapat diubah atau dihapus sembarangan"
              >
                <Unlock className="w-4 h-4 text-slate-400" />
                <span>Kunci Dokumen</span>
              </button>
            )}

            {/* Format Header Toggle: Official vs Clean */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold px-1.5 hidden md:inline">Header PDF:</span>
              <button
                type="button"
                onClick={() => setHeaderMode('official')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-xs transition cursor-pointer ${
                  headerMode === 'official'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
                title="Versi Resmi dengan Logo & Kop Surat Alamat Perusahaan"
              >
                <span>Official (Kop Surat)</span>
              </button>
              <button
                type="button"
                onClick={() => setHeaderMode('clean')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-xs transition cursor-pointer ${
                  headerMode === 'clean'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
                title="Versi Polos (Clean) tanpa Kop Surat"
              >
                <span>Clean (Polos)</span>
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition">
              <input
                type="checkbox"
                checked={showStamp}
                onChange={(e) => setShowStamp(e.target.checked)}
                className="rounded border-slate-600 text-blue-500 focus:ring-blue-500"
              />
              Tampilkan Stempel
            </label>

            <button
              onClick={() => setIsSignModalOpen(true)}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow transition"
              title="Upload atau Gambar Tanda Tangan Digital pada Dokumen Ini"
            >
              <PenTool className="w-4 h-4 text-amber-200" />
              <span>Upload TTD Digital</span>
            </button>

            <button
              onClick={() => setIsSendEmailOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow transition"
              title="Kirim PDF Dokumen Ini Langsung ke Email Pelanggan"
            >
              <Mail className="w-4 h-4 text-emerald-200" />
              <span>Kirim Email</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition"
            >
              <Printer className="w-4 h-4" />
              Cetak
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition disabled:opacity-50 cursor-pointer"
              title="Unduh Pratinjau Dokumen Ini sebagai File PDF (jsPDF + html2canvas)"
            >
              <Download className="w-4 h-4 text-blue-100" />
              <span>{isDownloading ? 'Mengunduh PDF...' : 'Unduh PDF'}</span>
            </button>

            {type === 'SPH' && onConvertToInvoice && (
              <button
                onClick={() => {
                  onConvertToInvoice(docData as SPH);
                  onClose();
                }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow transition"
                title="Konversi SPH ini langsung menjadi Invoice Tagihan"
              >
                <Receipt className="w-4 h-4" />
                <span>Konversi ke Invoice</span>
              </button>
            )}

            {type === 'SPH' && onConvertToPks && (
              <button
                onClick={() => {
                  onConvertToPks(docData as SPH);
                  onClose();
                }}
                className="flex items-center gap-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow transition"
                title="Konversi SPH ini menjadi Perjanjian Kerja Sama (PKS)"
              >
                <FileCheck className="w-4 h-4" />
                <span>Konversi ke PKS</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lock Status Warning Banner */}
        {docData.isLocked && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center justify-between text-xs text-rose-900 font-medium print:hidden">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>DOKUMEN DALAM STATUS TERKUNCI (LOCKED):</strong> Dokumen {docNumber} ini telah diterbitkan/didownload. Dokumen ini terlindungi dari perubahan yang tidak disengaja.
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-300 shrink-0">
              PROTECTED PDF
            </span>
          </div>
        )}

        {/* Document Printable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-8 bg-slate-100 print:bg-white print:p-0 touch-scroll">
          <div
            id="printable-document-content"
            className="bg-white text-slate-900 mx-auto max-w-[210mm] min-h-[297mm] print:min-h-0 p-4 sm:p-8 print:p-0 shadow-lg border border-slate-200 rounded-lg print:shadow-none print:border-none print:rounded-none print:m-0 relative text-xs leading-relaxed font-sans min-w-[280px]"
          >
            {/* KopSurat Header - Rendered in Official Mode */}
            {headerMode === 'official' ? (
              <KopSuratHeader companyProfile={companyProfile} />
            ) : (
              <div 
                className="border-b border-slate-200 pb-2 mb-6 flex items-center justify-between text-[10px] text-slate-400 font-mono tracking-wider uppercase"
                style={{ borderBottom: '1px solid #cbd5e1' }}
              >
                <span>{companyProfile?.legalName || 'PT. LINTAS DATA INTERNASIONAL'}</span>
                <span>Dokumen Format Polos (Clean)</span>
              </div>
            )}

            {/* DOCUMENT CONTENT BRANCH */}
            {type === 'SPH' && <SphDocumentView sph={docData as SPH} showStamp={showStamp} companyProfile={companyProfile} customers={customers} />}
            {type === 'PKS' && <PksDocumentView pks={docData as PKS} showStamp={showStamp} companyProfile={companyProfile} customers={customers} />}
            {type === 'Invoice' && <InvoiceDocumentView invoice={docData as Invoice} showStamp={showStamp} companyProfile={companyProfile} customers={customers} />}
          </div>
        </div>
      </div>

      {/* Signature Modal Overlay */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <PenTool className="w-4.5 h-4.5 text-amber-600" />
                Upload / Set Tanda Tangan Digital ({type})
              </h3>
              <button
                onClick={() => setIsSignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode selection */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setSignMode('upload')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  signMode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> Upload File (.PNG)
              </button>
              <button
                onClick={() => setSignMode('draw')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  signMode === 'draw' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" /> Gambar TTD
              </button>
            </div>

            {signMode === 'upload' ? (
              <div className="space-y-3">
                <label className="border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-100/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center">
                  <Upload className="w-8 h-8 text-amber-600" />
                  <span className="font-bold text-xs text-slate-800">Klik atau Tarik Berkas Gambar TTD</span>
                  <span className="text-[11px] text-slate-500">PNG Transparan / JPG (Max 5 MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setTempSignature(ev.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                {tempSignature ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-600" /> Berkas TTD Siap
                    </span>
                    <div className="flex items-center gap-2">
                      <img src={tempSignature} alt="Preview TTD" className="h-10 max-w-[120px] object-contain" />
                      <button
                        type="button"
                        onClick={() => setTempSignature('')}
                        className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                        title="Hapus Berkas TTD"
                      >
                        <Eraser className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  companyProfile?.defaultSignatureBase64 && (
                    <button
                      type="button"
                      onClick={() => setTempSignature(companyProfile.defaultSignatureBase64 || '')}
                      className="w-full text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 p-2.5 rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <span>Gunakan TTD Standar Perusahaan</span>
                      <img src={companyProfile.defaultSignatureBase64} alt="Default TTD" className="h-5 object-contain" />
                    </button>
                  )
                )}
              </div>
            ) : (
              <SignaturePad
                signerName={companyProfile?.directorName || 'Penandatangan Resmi'}
                signerPosition={companyProfile?.directorPosition || 'Direktur Utama'}
                existingSignature={tempSignature}
                onSaveSignature={(dataUrl) => setTempSignature(dataUrl)}
                label="Kanvas Tanda Tangan Digital"
              />
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsSignModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!tempSignature) {
                    alert('Silakan upload berkas gambar atau goreskan tanda tangan pada kanvas.');
                    return;
                  }
                  if (type === 'SPH') {
                    setDocData({ ...(docData as SPH), signedByLDI: tempSignature });
                  } else if (type === 'PKS') {
                    setDocData({ ...(docData as PKS), party1Signed: true });
                  } else if (type === 'Invoice') {
                    setDocData({ ...(docData as Invoice), signedByFinance: tempSignature });
                  }
                  if (onSignDocument) {
                    onSignDocument(type, docData.id, tempSignature);
                  }
                  setIsSignModalOpen(false);
                  alert('Tanda tangan digital berhasil disematkan pada dokumen!');
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Sematkan ke Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      <SendDocEmailModal
        isOpen={isSendEmailOpen}
        type={type}
        data={docData}
        companyProfile={companyProfile}
        onClose={() => setIsSendEmailOpen(false)}
        onSuccessSend={(docType, docId, recipientEmail) => {
          if (onUpdateStatusToSent) {
            onUpdateStatusToSent(docType, docId);
          }
        }}
      />
    </div>
  );
};

/* --- SPH VIEW --- */
const SphDocumentView: React.FC<{ sph: SPH; showStamp: boolean; companyProfile?: CompanyProfile; customers?: Customer[] }> = ({
  sph,
  showStamp,
  companyProfile,
  customers,
}) => {
  const profile = companyProfile || COMPANY_PROFILE;
  const signatureImage = sph.signedByLDI || profile.defaultSignatureBase64;
  return (
    <div className="mt-3 print:mt-1 space-y-5">
      <div 
        className="flex justify-between items-start border-b border-slate-200 pb-4"
        style={{ borderBottom: '1px solid #cbd5e1' }}
      >
        <div>
          <h2 className="text-base font-bold text-blue-950 uppercase tracking-tight">
            SURAT PENAWARAN HARGA (SPH)
          </h2>
          <p className="font-mono text-slate-700 font-semibold text-xs mt-0.5">
            Nomor: {sph.sphNumber}
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-600">Tangerang Kabupaten, {formatDateIndonesian(sph.date)}</p>
          <p className="text-slate-500 text-[11px]">
            Masa Berlaku: {sph.validityDays} Hari Kalender
          </p>
        </div>
      </div>

      {/* Customer Target */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1">
        <p className="font-bold text-slate-900">Kepada Yth:</p>
        <p className="font-bold text-blue-900 text-sm">{sph.customerName}</p>
        <p className="text-slate-700">{sph.customerAddress}</p>
        <p className="text-slate-600">
          Up: Bapak/Ibu {getContactPersonName(sph.customerRepresentative, sph.customerId, sph.customerName, customers)} | Telp: {sph.customerPhone} | Email: {sph.customerEmail}
        </p>
      </div>

      <div>
        <p className="mb-2">Dengan hormat,</p>
        <p className="text-slate-700">
          Sehubungan dengan kebutuhan infrastruktur teknologi informasi perusahaan Anda, kami PT.
          LINTAS DATA INTERNASIONAL (Jagoanserver.com) dengan bangga menyampaikan rincian penawaran
          layanan terbaik sebagai berikut:
        </p>
      </div>

      {/* Rincian Produk/Layanan Table */}
      <div>
        <h3 className="font-bold text-slate-900 uppercase text-[11px] mb-2 tracking-wide text-blue-950">
          I. RINCIAN BIAYA LAYANAN
        </h3>
        <table className="w-full border-collapse border border-slate-300 text-left text-xs">
          <thead>
            <tr className="bg-blue-950 text-white font-bold" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <th className="p-2 border border-slate-300 w-8 text-center text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>No</th>
              <th className="p-2 border border-slate-300 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Deskripsi Layanan</th>
              <th className="p-2 border border-slate-300 text-center w-16 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Vol</th>
              <th className="p-2 border border-slate-300 text-right w-28 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Harga Satuan</th>
              <th className="p-2 border border-slate-300 text-right w-28 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Total Harga</th>
            </tr>
          </thead>
          <tbody>
            {sph.items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50 border-b border-slate-200">
                <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                <td className="p-2 border border-slate-300">
                  <p className="font-bold text-slate-900">{item.name}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{item.description}</p>
                </td>
                <td className="p-2 border border-slate-300 text-center font-medium">
                  {item.qty} {item.unit}
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono">
                  {formatIDR(item.price)}
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                  {formatIDR(item.qty * item.price - (item.discount || 0))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="p-2 border border-slate-300 font-bold text-right">
                Subtotal
              </td>
              <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                {formatIDR(sph.subtotal)}
              </td>
            </tr>
            {sph.discountTotal > 0 && (
              <tr>
                <td colSpan={4} className="p-2 border border-slate-300 font-bold text-right text-emerald-700">
                  Diskon Khusus
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono font-bold text-emerald-700">
                  - {formatIDR(sph.discountTotal)}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={4} className="p-2 border border-slate-300 font-bold text-right">
                {sph.taxPercent > 0 ? `PPN (${sph.taxPercent}%)` : 'PPN (Non-PPN / 0%)'}
              </td>
              <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                {formatIDR(sph.taxAmount)}
              </td>
            </tr>
            <tr className="bg-blue-50 font-black text-blue-950">
              <td colSpan={4} className="p-2.5 border border-slate-300 text-right text-sm">
                TOTAL PENAWARAN {sph.taxPercent > 0 ? '(INC. PPN)' : '(NON-PPN)'}
              </td>
              <td className="p-2.5 border border-slate-300 text-right font-mono text-sm text-blue-900">
                {formatIDR(sph.grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Technical Specs */}
      {sph.technicalSpecs && sph.technicalSpecs.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 uppercase text-[11px] mb-2 tracking-wide text-blue-950">
            II. SPESIFIKASI TEKNIS & QUALITY OF SERVICE
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded border border-slate-200">
            {sph.technicalSpecs.map((spec, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-600 mt-1 flex-shrink-0"></span>
                <div>
                  <span className="font-bold text-slate-800">{spec.title}: </span>
                  <span className="text-slate-600">{spec.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      <div>
        <h3 className="font-bold text-slate-900 uppercase text-[11px] mb-2 tracking-wide text-blue-950">
          III. SYARAT DAN KETENTUAN
        </h3>
        <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
          {sph.termsAndConditions.map((term, i) => (
            <li key={i}>{term}</li>
          ))}
        </ol>
      </div>

      {/* Signatures & Stamp */}
      <div className="pt-6 border-t border-slate-200 flex items-end justify-between gap-6">
        <QRCodeBadge docNumber={sph.sphNumber} docType="SPH" issueDate={formatDateIndonesian(sph.date)} />

        <div className="text-center relative min-w-[200px]">
          <p className="text-slate-600 mb-2">Hormat Kami,</p>
          <p className="font-bold text-blue-950">{profile.legalName || profile.name}</p>

          <div className="relative my-3 h-20 flex items-center justify-center">
            {/* Digital Stamp - Positioned to the left so signature is 100% clear */}
            {showStamp && (
              <div className="absolute -left-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-90 z-0">
                {profile.defaultStampBase64 ? (
                  <img
                    src={profile.defaultStampBase64}
                    alt="Cap Perusahaan"
                    className="max-h-16 max-w-[80px] object-contain rotate-[-8deg]"
                  />
                ) : (
                  <div className="border-2 border-red-600 rounded-full w-20 h-20 flex items-center justify-center rotate-[-12deg] bg-white/30">
                    <div className="border border-red-600 rounded-full w-16 h-16 flex flex-col items-center justify-center text-[7px] font-black text-red-600 uppercase text-center leading-tight">
                      <span>{profile.legalName || 'PT LINTAS DATA'}</span>
                      <span className="text-[6px] text-red-500">OFFICIAL STAMP</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {signatureImage ? (
              <img
                src={signatureImage}
                alt="Tanda Tangan Digital Direksi"
                className="max-h-16 object-contain z-10 relative"
              />
            ) : (
              <div className="w-36 h-14 border-b border-slate-400 z-10 relative flex items-end justify-center pb-1"></div>
            )}
          </div>

          <p className="font-bold text-slate-900 underline">{profile.directorName}</p>
          <p className="text-slate-600 text-[11px]">{profile.directorPosition}</p>
        </div>
      </div>
    </div>
  );
};

/* --- PKS VIEW --- */
const PksDocumentView: React.FC<{ pks: PKS; showStamp: boolean; companyProfile?: CompanyProfile; customers?: Customer[] }> = ({
  pks,
  showStamp,
  companyProfile,
  customers,
}) => {
  const profile = companyProfile || COMPANY_PROFILE;
  const party1Sig = pks.party1SignatureData || profile.defaultSignatureBase64;
  return (
    <div className="mt-3 print:mt-1 space-y-5">
      <div 
        className="text-center space-y-1 border-b border-slate-200 pb-4"
        style={{ borderBottom: '1px solid #cbd5e1' }}
      >
        <h2 className="text-base font-black text-blue-950 uppercase tracking-tight">
          PERJANJIAN KERJA SAMA (PKS)
        </h2>
        <p className="text-xs font-bold text-cyan-800 uppercase">
          LAYANAN INFRASTRUKTUR TEKNOLOGI INFORMASI & INTERNET DEDICATED
        </p>
        <p className="font-mono text-slate-700 font-bold text-xs">
          Nomor: {pks.pksNumber}
        </p>
      </div>

      <p className="text-justify leading-relaxed">
        Pada hari ini, tanggal <b>{formatDateIndonesian(pks.startDate)}</b>, kami yang bertanda tangan di bawah ini:
      </p>

      {/* Parties */}
      <div className="space-y-3">
        <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
          <p className="font-bold text-blue-950">I. {profile.legalName || profile.name}</p>
          <p className="text-slate-700">
            Alamat: {profile.address}
          </p>
          <p className="text-slate-700">
            Diwakili oleh <b>{profile.directorName}</b> selaku <b>{profile.directorPosition}</b>, bertindak untuk dan atas nama {profile.legalName || profile.name}, selanjutnya disebut sebagai <b>PIHAK PERTAMA</b>.
          </p>
        </div>

        <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
          <p className="font-bold text-blue-950">II. {pks.customerName}</p>
          <p className="text-slate-700">
            Alamat: {pks.customerAddress}
          </p>
          <p className="text-slate-700">
            Diwakili oleh <b>{getContactPersonName(pks.customerRepresentative, pks.customerId, pks.customerName, customers)}</b> selaku <b>{pks.customerRepPosition || 'Pimpinan Perusahaan'}</b>, bertindak untuk dan atas nama {pks.customerName}, selanjutnya disebut sebagai <b>PIHAK KEDUA</b>.
          </p>
        </div>
      </div>

      <p className="text-justify">
        PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama disebut <b>PARA PIHAK</b> sepakat untuk mengikatkan diri dalam Perjanjian Kerja Sama dengan klausul pasal-pasal sebagai berikut:
      </p>

      {/* Clauses */}
      <div className="space-y-4">
        {pks.clauses.map((clause) => (
          <div key={clause.article} className="space-y-1">
            <h4 className="font-bold text-blue-950 uppercase text-[11px] text-center border-b border-slate-200 pb-0.5">
              PASAL {clause.article}: {clause.title}
            </h4>
            <p className="text-justify text-slate-800 leading-relaxed pl-2">{clause.content}</p>
          </div>
        ))}
      </div>

      {/* Dual Signatures */}
      <div className="pt-8 border-t border-slate-200 space-y-4">
        <p className="text-center font-bold text-slate-800">
          Demikian Perjanjian ini dibuat dan ditandatangani oleh Para Pihak dengan penuh kesadaran dan tanpa paksaan.
        </p>

        <div className="grid grid-cols-2 gap-8 text-center pt-2">
          {/* Party 1 */}
          <div className="space-y-2">
            <p className="font-bold text-blue-950">PIHAK PERTAMA</p>
            <p className="text-slate-600 text-[11px]">{profile.legalName || profile.name}</p>
            <div className="h-20 flex items-center justify-center relative">
              {showStamp && (
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-90 z-0">
                  {profile.defaultStampBase64 ? (
                    <img
                      src={profile.defaultStampBase64}
                      alt="Cap Perusahaan"
                      className="max-h-16 max-w-[75px] object-contain rotate-[-8deg]"
                    />
                  ) : (
                    <div className="border-2 border-red-600 rounded-full w-18 h-18 flex items-center justify-center rotate-[-10deg] bg-white/30">
                      <span className="text-[7px] font-black text-red-600 text-center">{profile.legalName || 'PT LDI'}</span>
                    </div>
                  )}
                </div>
              )}
              {party1Sig ? (
                <img src={party1Sig} alt="TTD Pihak 1" className="max-h-16 object-contain z-10 relative" />
              ) : (
                <div className="w-36 h-14 border-b border-slate-400 z-10 relative flex items-end justify-center pb-1"></div>
              )}
            </div>
            <p className="font-bold text-slate-900 underline">{pks.party1SignerName || profile.directorName}</p>
            <p className="text-slate-500 text-[10px]">{pks.party1SignerPosition || profile.directorPosition}</p>
          </div>

          {/* Party 2 */}
          <div className="space-y-2">
            <p className="font-bold text-blue-950">PIHAK KEDUA</p>
            <p className="text-slate-600 text-[11px]">{pks.customerName}</p>
            <div className="h-20 flex items-center justify-center">
              {pks.party2SignatureData ? (
                <img src={pks.party2SignatureData} alt="TTD Pihak 2" className="max-h-16 object-contain" />
              ) : (
                <div className="w-36 h-14 border-b border-slate-400 z-10 relative flex items-end justify-center pb-1"></div>
              )}
            </div>
            <p className="font-bold text-slate-900 underline">{pks.party2SignerName}</p>
            <p className="text-slate-500 text-[10px]">{pks.party2SignerPosition}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <QRCodeBadge docNumber={pks.pksNumber} docType="PKS" issueDate={formatDateIndonesian(pks.startDate)} />
        </div>
      </div>
    </div>
  );
};

/* --- INVOICE VIEW --- */
const InvoiceDocumentView: React.FC<{ invoice: Invoice; showStamp: boolean; companyProfile?: CompanyProfile; customers?: Customer[] }> = ({
  invoice,
  showStamp,
  companyProfile,
  customers,
}) => {
  const profile = companyProfile || COMPANY_PROFILE;
  const signatureImage = invoice.signatureData || profile.defaultSignatureBase64;

  const paidAmount = typeof invoice.paidAmount === 'number'
    ? invoice.paidAmount
    : invoice.status === 'Lunas'
    ? invoice.grandTotal
    : (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);

  const remainingAmount = Math.max(0, invoice.grandTotal - paidAmount);
  const percentPaid = invoice.grandTotal > 0 ? Math.min(100, Math.round((paidAmount / invoice.grandTotal) * 100)) : 0;
  const hasPartialPayment = invoice.status === 'Dibayar Sebagian' || (paidAmount > 0 && paidAmount < invoice.grandTotal);

  return (
    <div className="mt-3 print:mt-1 space-y-5">
      <div 
        className="flex justify-between items-start border-b border-slate-200 pb-4"
        style={{ borderBottom: '1px solid #cbd5e1' }}
      >
        <div>
          <h2 className="text-lg font-black text-blue-950 uppercase tracking-tight">
            INVOICE / FAKTUR PENAGIHAN
          </h2>
          <p className="font-mono text-slate-800 font-bold text-sm mt-0.5">
            No: {invoice.invoiceNumber}
          </p>
          {invoice.sphReference && (
            <p className="text-slate-500 text-[11px]">Ref SPH: {invoice.sphReference}</p>
          )}
        </div>

        <div className="text-right space-y-1">
          <div
            className={`inline-block px-3 py-1.5 rounded font-black text-xs uppercase tracking-wider ${
              invoice.status === 'Lunas'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : invoice.status === 'Dibayar Sebagian'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            STATUS: {invoice.status === 'Lunas' ? 'LUNAS' : invoice.status === 'Dibayar Sebagian' ? `BELUM BAYAR (Dibayar Sebagian ${percentPaid}%)` : 'BELUM BAYAR'}
          </div>
          <p className="text-slate-600 font-medium text-xs">Tanggal Diterbitkan: {formatDateIndonesian(invoice.issueDate)}</p>
          <p className="text-rose-700 font-bold text-xs">Jatuh Tempo: {formatDateIndonesian(invoice.dueDate)}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">
            DITAGIHKAN KEPADA:
          </p>
          <p className="font-bold text-blue-950 text-sm">{invoice.customerName}</p>
          <p className="text-slate-700 mt-0.5">{invoice.customerAddress}</p>
          <p className="text-slate-600 text-[11px] mt-1">
            Up: Bapak/Ibu {getContactPersonName(invoice.customerRepresentative, invoice.customerId, invoice.customerName, customers)} | Telp: {invoice.customerPhone} | Email: {invoice.customerEmail}
          </p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">
            REKENING PEMBAYARAN RESMI PT. LDI:
          </p>
          <p className="font-bold text-blue-950">{invoice.bankInfo.bankName}</p>
          <p className="font-mono text-base font-bold text-slate-900 my-0.5">
            {invoice.bankInfo.accountNumber}
          </p>
          <p className="text-slate-700 font-medium text-[11px]">
            a.n. {invoice.bankInfo.accountHolder}
          </p>
          {invoice.bankInfo.branch && (
            <p className="text-slate-500 text-[10px] mt-0.5">
              Cabang: {invoice.bankInfo.branch}
            </p>
          )}
          {invoice.bankInfo.notes && (
            <p className="text-slate-600 italic text-[10px] mt-1 border-t border-slate-200 pt-1">
              * {invoice.bankInfo.notes}
            </p>
          )}
        </div>
      </div>

      {/* Invoice Items Table */}
      <div>
        <table className="w-full border-collapse border border-slate-300 text-left text-xs">
          <thead>
            <tr className="bg-blue-950 text-white font-bold" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
              <th className="p-2.5 border border-slate-300 w-8 text-center text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>No</th>
              <th className="p-2.5 border border-slate-300 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Deskripsi Item Penagihan</th>
              <th className="p-2.5 border border-slate-300 text-center w-20 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Volume</th>
              <th className="p-2.5 border border-slate-300 text-right w-28 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Harga Satuan</th>
              <th className="p-2.5 border border-slate-300 text-right w-32 text-white font-bold" style={{ color: '#ffffff', backgroundColor: '#0f172a' }}>Total Harga</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={item.id || idx} className="border-b border-slate-200">
                <td className="p-2.5 border border-slate-300 text-center">{idx + 1}</td>
                <td className="p-2.5 border border-slate-300">
                  <p className="font-bold text-slate-900">{item.name}</p>
                  <p className="text-[11px] text-slate-600">{item.description}</p>
                </td>
                <td className="p-2.5 border border-slate-300 text-center font-medium">
                  {item.qty} {item.unit}
                </td>
                <td className="p-2.5 border border-slate-300 text-right font-mono">
                  {formatIDR(item.price)}
                </td>
                <td className="p-2.5 border border-slate-300 text-right font-mono font-bold">
                  {formatIDR(item.qty * item.price - (item.discount || 0))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="p-2 border border-slate-300 font-bold text-right">
                Subtotal
              </td>
              <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                {formatIDR(invoice.subtotal)}
              </td>
            </tr>
            {invoice.discountTotal > 0 && (
              <tr>
                <td colSpan={4} className="p-2 border border-slate-300 font-bold text-right text-emerald-700">
                  Diskon
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono font-bold text-emerald-700">
                  - {formatIDR(invoice.discountTotal)}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={4} className="p-2 border border-slate-300 font-bold text-right">
                {invoice.taxPercent > 0 ? `PPN (${invoice.taxPercent}%)` : 'PPN (Non-PPN / 0%)'}
              </td>
              <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                {formatIDR(invoice.taxAmount)}
              </td>
            </tr>
            <tr className="bg-blue-50 font-black text-blue-950">
              <td colSpan={4} className="p-2.5 border border-slate-300 text-right text-sm">
                TOTAL PENAGIHAN {invoice.taxPercent > 0 ? '(INC. PPN)' : '(NON-PPN)'}
              </td>
              <td className="p-2.5 border border-slate-300 text-right font-mono text-sm text-blue-900">
                {formatIDR(invoice.grandTotal)}
              </td>
            </tr>

            {hasPartialPayment && (
              <>
                <tr className="bg-emerald-50 text-emerald-900 font-bold">
                  <td colSpan={4} className="p-2 border border-slate-300 text-right text-xs">
                    TOTAL TELAH DIBAYAR (CICILAN / PARSIAL)
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-mono text-xs font-black text-emerald-800">
                    - {formatIDR(paidAmount)} ({percentPaid}%)
                  </td>
                </tr>
                <tr className="bg-amber-100 text-amber-950 font-black">
                  <td colSpan={4} className="p-2.5 border border-slate-300 text-right text-xs uppercase">
                    SISA PIUTANG TAGIHAN YANG HARUS DILUNASI
                  </td>
                  <td className="p-2.5 border border-slate-300 text-right font-mono text-xs font-black text-rose-800">
                    {formatIDR(remainingAmount)}
                  </td>
                </tr>
              </>
            )}
          </tfoot>
        </table>
      </div>

      {/* Rincian Riwayat Setoran Cicilan (If any exists) */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
          <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
            CATATAN SETORAN / RIWAYAT PEMBAYARAN CICILAN:
          </p>
          <div className="divide-y divide-slate-200">
            {invoice.payments.map((p, i) => (
              <div key={p.id || i} className="py-1 text-[11px] flex justify-between items-center text-slate-700">
                <div>
                  <span className="font-bold font-mono text-slate-900 mr-2">#{i + 1}</span>
                  <span>{formatDateIndonesian(p.paymentDate)} via {p.paymentMethod}</span>
                  {p.notes && <span className="text-slate-500 italic ml-2">({p.notes})</span>}
                </div>
                <span className="font-mono font-bold text-emerald-800">{formatIDR(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terbilang */}
      <div className="bg-slate-50 p-3 rounded border border-slate-200">
        <span className="font-bold text-slate-700">Terbilang (Sisa Tagihan / Total): </span>
        <span className="font-serif italic font-semibold text-blue-950 text-xs">
          "{terbilangRupiah(hasPartialPayment ? remainingAmount : invoice.grandTotal)}"
        </span>
      </div>

      {/* Footer Signatures */}
      <div className="pt-6 border-t border-slate-200 flex items-end justify-between gap-6">
        <QRCodeBadge
          docNumber={invoice.invoiceNumber}
          docType="INVOICE"
          issueDate={formatDateIndonesian(invoice.issueDate)}
        />

        <div className="text-center relative min-w-[180px]">
          <p className="text-slate-600 mb-1">Departemen Keuangan,</p>
          <p className="font-bold text-blue-950">{profile.legalName || profile.name}</p>

          <div className="relative my-2 h-16 flex items-center justify-center">
            {showStamp && (
              <div className="absolute -left-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-90 z-0">
                {invoice.status === 'Lunas' ? (
                  profile.defaultStampBase64 ? (
                    <img
                      src={profile.defaultStampBase64}
                      alt="Cap Stempel Finance Lunas"
                      className="max-h-16 max-w-[80px] object-contain rotate-[-8deg]"
                    />
                  ) : (
                    <div className="border-2 border-emerald-600 rounded-full w-20 h-20 flex flex-col items-center justify-center rotate-[-12deg] bg-emerald-50/70 p-1 text-center shadow-2xs">
                      <span className="text-[7px] font-black text-emerald-900 uppercase tracking-tighter leading-none">
                        {profile.shortName || 'PT LDI'}
                      </span>
                      <span className="text-[11px] font-black text-emerald-700 uppercase my-0.5 leading-none tracking-tight">
                        LUNAS
                      </span>
                      <span className="text-[6px] font-bold text-emerald-800 uppercase leading-none">
                        PAID / OFFICIAL
                      </span>
                    </div>
                  )
                ) : (
                  <div className="border-2 border-red-600 rounded-full w-20 h-20 flex flex-col items-center justify-center rotate-[-12deg] bg-red-50/80 p-1 text-center shadow-2xs">
                    <span className="text-[7px] font-black text-red-900 uppercase tracking-tighter leading-none">
                      {profile.shortName || 'PT LDI'}
                    </span>
                    <span className="text-[10px] font-black text-red-600 uppercase my-0.5 leading-none tracking-tight">
                      BELUM BAYAR
                    </span>
                    <span className="text-[6px] font-bold text-red-700 uppercase leading-none">
                      {invoice.status === 'Dibayar Sebagian' ? `PARSIAL ${percentPaid}%` : 'UNPAID / TAGIHAN'}
                    </span>
                  </div>
                )}
              </div>
            )}
            {signatureImage ? (
              <img
                src={signatureImage}
                alt="Tanda Tangan Digital Finance"
                className="max-h-14 object-contain z-10 relative"
              />
            ) : (
              <div className="w-36 h-12 border-b border-slate-400 z-10 relative flex items-end justify-center pb-1"></div>
            )}
          </div>

          <p className="font-bold text-slate-900 underline">{profile.financeManager}</p>
          <p className="text-slate-500 text-[10px]">Finance Manager</p>
        </div>
      </div>
    </div>
  );
};
