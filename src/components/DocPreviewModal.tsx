import React, { useState } from 'react';
import { X, Printer, Download, Mail, PenTool, Upload, Check, Lock, Unlock, Eraser, Receipt, FileCheck, ShieldCheck } from 'lucide-react';
import { CompanyProfile, Customer, Invoice, PKS, SPH } from '../types';
import { PDFTemplate, getContactPersonName } from './PDFTemplate';
import { SendDocEmailModal } from './SendDocEmailModal';
import { SignaturePad } from './SignaturePad';
import { exportToPdf } from '../utils/pdfGenerator';

export { getContactPersonName };

interface DocPreviewModalProps {
  type: 'SPH' | 'PKS' | 'Invoice';
  data: SPH | PKS | Invoice;
  companyProfile?: CompanyProfile;
  customers?: Customer[];
  isPublic?: boolean;
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
  isPublic = false,
  onClose,
  onSignDocument,
  onUpdateStatusToSent,
  onConvertToInvoice,
  onConvertToPks,
  onToggleLockDocument,
}) => {
  // In public view, documents are always strictly locked
  const [docData, setDocData] = useState<SPH | PKS | Invoice>(() => {
    if (isPublic) {
      return { ...data, isLocked: true };
    }
    return data;
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [showStamp, setShowStamp] = useState(true);
  const [headerMode, setHeaderMode] = useState<'official' | 'clean'>('official');
  const [isSendEmailOpen, setIsSendEmailOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signMode, setSignMode] = useState<'upload' | 'draw'>('upload');
  const [tempSignature, setTempSignature] = useState<string>('');
  const [publicLockAlert, setPublicLockAlert] = useState(false);

  const docNumber =
    type === 'SPH'
      ? (docData as SPH).sphNumber
      : type === 'PKS'
      ? (docData as PKS).pksNumber
      : (docData as Invoice).invoiceNumber;

  // Check whether this document has been digitally signed
  const isDocSigned =
    type === 'SPH'
      ? Boolean((docData as SPH).signedByLDI || companyProfile?.defaultSignatureBase64)
      : type === 'PKS'
      ? Boolean((docData as PKS).party1Signed || (docData as PKS).party1SignatureData || companyProfile?.defaultSignatureBase64)
      : Boolean((docData as Invoice).signedByFinance || (docData as Invoice).signatureData || companyProfile?.defaultSignatureBase64);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    const suffix = headerMode === 'clean' ? '_Clean' : '';
    await exportToPdf('printable-document-content', `${type}_${docNumber.replace(/\//g, '_')}${suffix}`);
    setIsDownloading(false);

    // Otomatis kunci dokumen saat didownload agar tidak diubah sembarangan
    if (!isPublic && !docData.isLocked && onToggleLockDocument) {
      onToggleLockDocument(type, docData.id, true);
      setDocData((prev) => ({ ...prev, isLocked: true }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLockClick = () => {
    if (isPublic) {
      // In public mode, documents CANNOT be unlocked under any circumstances
      setPublicLockAlert(true);
      setTimeout(() => setPublicLockAlert(false), 5000);
      return;
    }

    if (docData.isLocked) {
      if (onToggleLockDocument) onToggleLockDocument(type, docData.id, false);
      setDocData((prev) => ({ ...prev, isLocked: false }));
    } else {
      if (onToggleLockDocument) onToggleLockDocument(type, docData.id, true);
      setDocData((prev) => ({ ...prev, isLocked: true }));
    }
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
            {isPublic && (
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> Read-Only Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Lock Status Button */}
            {isPublic ? (
              <button
                type="button"
                onClick={handleLockClick}
                className="flex items-center gap-1.5 bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-500/50 font-bold text-xs px-3 py-2 rounded-lg shadow transition cursor-pointer"
                title="Dokumen Resmi Terkunci & Dilindungi oleh Sistem PT. LDI (Akses Publik)"
              >
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Terkunci 🔒 (Dilindungi)</span>
              </button>
            ) : docData.isLocked ? (
              <button
                type="button"
                onClick={handleLockClick}
                className="flex items-center gap-1.5 bg-rose-900/90 hover:bg-rose-800 text-rose-100 border border-rose-600 font-bold text-xs px-3 py-2 rounded-lg shadow transition cursor-pointer"
                title="Dokumen dalam Status Terkunci (Locked). Klik untuk membuka kunci dokumen."
              >
                <Lock className="w-4 h-4 text-rose-300" />
                <span>Terkunci 🔒 (Buka Kunci)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLockClick}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-3 py-2 rounded-lg transition cursor-pointer"
                title="Kunci dokumen agar tidak dapat diubah atau dihapus sembarangan"
              >
                <Unlock className="w-4 h-4 text-slate-400" />
                <span>Kunci Dokumen</span>
              </button>
            )}

            {/* Format Header Toggle: Only available for Authenticated Admin */}
            {!isPublic && (
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
            )}

            {/* Toggle Stempel: Only available for Authenticated Admin */}
            {!isPublic && (
              <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition">
                <input
                  type="checkbox"
                  checked={showStamp}
                  onChange={(e) => setShowStamp(e.target.checked)}
                  className="rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                Tampilkan Stempel
              </label>
            )}

            {/* Upload TTD Digital: Only available for Authenticated Admin */}
            {!isPublic && (
              <button
                type="button"
                onClick={() => setIsSignModalOpen(true)}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow transition cursor-pointer"
                title="Upload atau Gambar Tanda Tangan Digital pada Dokumen Ini"
              >
                <PenTool className="w-4 h-4 text-amber-200" />
                <span>Upload TTD Digital</span>
              </button>
            )}

            {/* Kirim Email: Only available for Authenticated Admin */}
            {!isPublic && (
              <button
                type="button"
                onClick={() => setIsSendEmailOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow transition cursor-pointer"
                title="Kirim PDF Dokumen Ini Langsung ke Email Pelanggan"
              >
                <Mail className="w-4 h-4 text-emerald-200" />
                <span>Kirim Email</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition disabled:opacity-50 cursor-pointer"
              title="Unduh Pratinjau Dokumen Ini sebagai File PDF (jsPDF + html2canvas)"
            >
              <Download className="w-4 h-4 text-blue-100" />
              <span>{isDownloading ? 'Mengunduh PDF...' : 'Unduh PDF'}</span>
            </button>

            {!isPublic && type === 'SPH' && onConvertToInvoice && (
              <button
                type="button"
                onClick={() => {
                  onConvertToInvoice(docData as SPH);
                  onClose();
                }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow transition cursor-pointer"
                title="Konversi SPH ini langsung menjadi Invoice Tagihan"
              >
                <Receipt className="w-4 h-4" />
                <span>Konversi ke Invoice</span>
              </button>
            )}

            {!isPublic && type === 'SPH' && onConvertToPks && (
              <button
                type="button"
                onClick={() => {
                  onConvertToPks(docData as SPH);
                  onClose();
                }}
                className="flex items-center gap-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow transition cursor-pointer"
                title="Konversi SPH ini menjadi Perjanjian Kerja Sama (PKS)"
              >
                <FileCheck className="w-4 h-4" />
                <span>Konversi ke PKS</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Public Lock Alert Banner when user clicks lock button */}
        {publicLockAlert && (
          <div className="bg-amber-50 border-b border-amber-300 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 font-semibold print:hidden animate-fade-in">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                🔒 <strong>AKSES PUBLIK TERPROTEKSI:</strong> Dokumen resmi PT. LDI ini dilindungi dan dikunci secara permanen pada portal publik. Pembukaan kunci hanya dapat dilakukan melalui Akun Administrator PT. LDI.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPublicLockAlert(false)}
              className="text-amber-800 hover:text-amber-950 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Lock Status Warning Banner */}
        {(isPublic || docData.isLocked) && !publicLockAlert && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center justify-between text-xs text-rose-900 font-medium print:hidden">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                {isPublic ? (
                  <>
                    <strong>DOKUMEN RESMI PT. LDI (TERKUNCI & READ-ONLY):</strong> Dokumen {docNumber} ini sah, terlindungi secara digital, dan terdaftar dalam basis data resmi PT. Lintas Data Internasional.
                  </>
                ) : (
                  <>
                    <strong>DOKUMEN DALAM STATUS TERKUNCI (LOCKED):</strong> Dokumen {docNumber} ini telah diterbitkan/didownload. Dokumen ini terlindungi dari perubahan yang tidak disengaja.
                  </>
                )}
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-300 shrink-0">
              PROTECTED PDF
            </span>
          </div>
        )}

        {/* Digital Signature Verified Indicator Banner */}
        {isDocSigned && (
          <div className="bg-emerald-50 border-b border-emerald-300 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Lock className="w-3.5 h-3.5 text-white" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-emerald-950 text-xs">
                    Verified by PT. Lintas Data Internasional Digital Sign
                  </span>
                  <span className="bg-emerald-200/80 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-400/60 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" /> TTD Terverifikasi
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Integritas dokumen {docNumber} terjamin sah dan ditandatangani secara elektronik melalui sistem resmi PT. LDI.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-white/80 border border-emerald-300 px-3 py-1 rounded-lg text-[10px] font-mono text-emerald-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SHA256: VALID</span>
            </div>
          </div>
        )}

        {/* Document Printable Area - Unified PDFTemplate Engine */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-8 bg-slate-100 print:bg-white print:p-0 touch-scroll">
          <PDFTemplate
            id="printable-document-content"
            type={type}
            data={docData}
            companyProfile={companyProfile}
            customers={customers}
            headerMode={headerMode}
            showStamp={showStamp}
            showSignatures={true}
          />
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
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode selection */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setSignMode('upload')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  signMode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> Upload File (.PNG)
              </button>
              <button
                onClick={() => setSignMode('draw')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
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
                      className="w-full text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 p-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
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
                    setDocData({ ...(docData as PKS), party1Signed: true, party1SignatureData: tempSignature });
                  } else if (type === 'Invoice') {
                    setDocData({ ...(docData as Invoice), signedByFinance: tempSignature, signatureData: tempSignature });
                  }
                  if (onSignDocument) {
                    onSignDocument(type, docData.id, tempSignature);
                  }
                  setIsSignModalOpen(false);
                  alert('Tanda tangan digital berhasil disematkan pada dokumen!');
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
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
        customers={customers}
        headerMode={headerMode}
        showStamp={showStamp}
        showSignatures={true}
        onClose={() => setIsSendEmailOpen(false)}
        onSuccessSend={(docType, docId) => {
          if (onUpdateStatusToSent) {
            onUpdateStatusToSent(docType, docId);
          }
        }}
      />
    </div>
  );
};
