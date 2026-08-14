import React, { useState, useRef } from 'react';
import { Building, Globe, Mail, Phone, MapPin, CreditCard, ShieldCheck, Save, Check, Upload, Image as ImageIcon, Trash2, Link, FileImage, RotateCcw, PenTool, Plus, Edit3, Star, Copy, PlusCircle, X, Send, Key, RefreshCw, FileText, CheckCircle2, AlertCircle, Paperclip, ExternalLink } from 'lucide-react';
import { CompanyProfile, Invoice, PKS, SPH } from '../types';
import { COMPANY_PROFILE } from '../data/initialData';
import { SignaturePad } from './SignaturePad';
import { D1ConfigPanel } from './D1ConfigPanel';
import { sendEmail } from '../api/mailService';
import { apiUploadPdf } from '../api/client';
import { generateStandaloneDocPdfBase64 } from '../utils/pdfGenerator';
import { formatDateIndonesian, formatIDR } from '../utils/formatters';
import { buildFullEmailHtml, replaceEmailPlaceholders, DEFAULT_EMAIL_TEMPLATES } from '../utils/emailTemplateHelper';

interface CompanySettingsViewProps {
  companyProfile: CompanyProfile;
  onUpdateProfile: (profile: CompanyProfile) => void;
  onResetAllData?: () => void;
}

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({
  companyProfile,
  onUpdateProfile,
  onResetAllData,
}) => {
  const [profile, setProfile] = useState<CompanyProfile>(companyProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState(profile.logoUrl || '');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Favicon State
  const [isFaviconDragging, setIsFaviconDragging] = useState(false);
  const [faviconUrlInput, setFaviconUrlInput] = useState(profile.faviconUrl || '');
  const [showFaviconUrlInput, setShowFaviconUrlInput] = useState(false);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [isSigDragging, setIsSigDragging] = useState(false);
  const [sigMode, setSigMode] = useState<'upload' | 'draw'>('upload');
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [emailTemplateTab, setEmailTemplateTab] = useState<'SPH' | 'PKS' | 'Invoice'>('SPH');
  const [testRecipientEmail, setTestRecipientEmail] = useState<string>(profile.mailketingSenderEmail || profile.email || 'alwanemail@gmail.com');
  const [testCcEmail, setTestCcEmail] = useState<string>(profile.emailTemplates?.defaultCc || '');
  const [testIncludePdf, setTestIncludePdf] = useState<boolean>(true);
  const [testDocType, setTestDocType] = useState<'SPH' | 'PKS' | 'Invoice'>('SPH');
  const [testEmailStatus, setTestEmailStatus] = useState<{
    loading: boolean;
    step?: string;
    success?: boolean;
    message?: string;
    pdfUrl?: string;
    pdfFilename?: string;
  } | null>(null);

  const handleTestMailketingConnection = async (typeToTest?: 'SPH' | 'PKS' | 'Invoice') => {
    const selectedType = typeToTest || testDocType || emailTemplateTab || 'SPH';
    const targetRecipient = (testRecipientEmail || profile.mailketingSenderEmail || profile.email || 'alwanemail@gmail.com').trim();
    const targetCc = testCcEmail.trim();
    
    if (!profile.mailketingApiKey?.trim()) {
      setTestEmailStatus({
        loading: false,
        success: false,
        message: '❌ Harap isi API Key Mailketing terlebih dahulu sebelum menguji pengiriman email.'
      });
      return;
    }

    setTestEmailStatus({ 
      loading: true, 
      step: '1/3 Menyiapkan data template & merender contoh dokumen PDF...' 
    });

    try {
      const rawDomain = profile.website ? profile.website.replace(/^https?:\/\//, '') : 'e-office.ldi.co.id';
      const domainName = rawDomain.toLowerCase().includes('jagoanserver') ? 'e-office.ldi.co.id' : rawDomain;

      // Prepare realistic sample document data
      let sampleData: SPH | PKS | Invoice;
      let docNumber = '';
      let customerName = 'PT. Solusi Digital Nusantara';
      let docDate = formatDateIndonesian(new Date().toISOString().split('T')[0]);
      let totalAmount = 15000000;
      let subjectTemplate = '';
      let bodyTemplate = '';

      if (selectedType === 'SPH') {
        docNumber = `SPH/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/LDI-0089`;
        sampleData = {
          id: `sample-sph-${Date.now()}`,
          sphNumber: docNumber,
          customerId: 'cust-sample-01',
          customerName,
          customerEmail: targetRecipient,
          customerPhone: '081234567890',
          customerAddress: 'Cyber Building Lt. 8, Jl. Kuningan Barat No. 8, Jakarta Selatan',
          date: new Date().toISOString().split('T')[0],
          validityDays: 14,
          items: [
            {
              id: '1',
              name: 'Dedicated Internet 100 Mbps 1:1 Symmetric (SLA 99.9%)',
              description: 'Koneksi internet dedicated kecepatan simetris 1:1 tanpa FUP dengan dukungan teknis 24/7.',
              category: 'Internet Dedicated',
              qty: 1,
              unit: 'Bulan',
              price: 15000000,
              discount: 0,
            }
          ],
          technicalSpecs: [
            { title: 'Bandwidth Ratio', value: '1:1 Symmetric' },
            { title: 'SLA Guarantee', value: '99.9%' }
          ],
          termsAndConditions: [
            'Harga belum termasuk PPN 11%',
            'Pembayaran tagihan jatuh tempo 14 hari kalender sejak invoice diterbitkan'
          ],
          subtotal: 15000000,
          discountTotal: 0,
          taxPercent: 11,
          taxAmount: 1650000,
          grandTotal: 16650000,
          notes: 'Biaya instalasi & setup perangkat router mikrotik digratiskan.',
          status: 'Dikirim',
          isLocked: true,
        };
        subjectTemplate = profile.emailTemplates?.sphSubject || `[PT. LDI] Surat Penawaran Harga {DOC_NUMBER} - {CUSTOMER_NAME}`;
        bodyTemplate = profile.emailTemplates?.sphBody || `Kepada Yth. Manajemen {CUSTOMER_NAME},\n\nTerlampir kami sampaikan Surat Penawaran Harga {DOC_NUMBER} dari PT. LINTAS DATA INTERNASIONAL untuk pertimbangan kerja sama layanan internet & jaringan.\n\nTotal Nilai: {TOTAL_AMOUNT}\nTanggal: {DOC_DATE}\n\nSilakan periksa berkas PDF terlampir untuk rincian penawaran resmi.`;
      } else if (selectedType === 'PKS') {
        docNumber = `PKS/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/LDI-0052`;
        sampleData = {
          id: `sample-pks-${Date.now()}`,
          pksNumber: docNumber,
          customerId: 'cust-sample-01',
          customerName,
          customerRepresentative: 'Bapak Hendra Wijaya, S.Kom',
          customerRepPosition: 'Head of IT & Infrastructure',
          customerAddress: 'Cyber Building Lt. 8, Jl. Kuningan Barat No. 8, Jakarta Selatan',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
          contractDurationMonths: 12,
          serviceItems: [
            {
              id: '1',
              name: 'Dedicated Internet 100 Mbps Corporate Fiber Optic',
              description: 'Layanan internet dedicated simetris 100 Mbps.',
              category: 'Internet Dedicated',
              qty: 1,
              unit: 'Bulan',
              price: 15000000,
              discount: 0,
            }
          ],
          monthlyValue: 15000000,
          totalContractValue: 180000000,
          slaPercent: 99.9,
          clauses: [],
          status: 'Aktif',
          party1Signed: true,
          party1SignerName: profile.directorName || 'Direktur Utama LDI',
          party1SignerPosition: 'Direktur Utama',
          party2Signed: false,
          party2SignerName: 'Bapak Hendra Wijaya, S.Kom',
          party2SignerPosition: 'Head of IT',
          isLocked: true,
        };
        subjectTemplate = profile.emailTemplates?.pksSubject || `[PT. LDI] Dokumen Perjanjian Kerja Sama (PKS) {DOC_NUMBER} - {CUSTOMER_NAME}`;
        bodyTemplate = profile.emailTemplates?.pksBody || `Kepada Yth. Tim Legal & Manajemen {CUSTOMER_NAME},\n\nBersama ini kami kirimkan Dokumen Perjanjian Kerja Sama (PKS) {DOC_NUMBER} antara PT. LINTAS DATA INTERNASIONAL dan {CUSTOMER_NAME}.\n\nTotal Nilai Kontrak: {TOTAL_AMOUNT}\nPeriode: {DOC_DATE}\n\nDokumen PDF resmi bertanda tangan digital dapat diunduh pada lampiran email ini.`;
      } else {
        docNumber = `INV/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/LDI-0129`;
        sampleData = {
          id: `sample-inv-${Date.now()}`,
          invoiceNumber: docNumber,
          customerId: 'cust-sample-01',
          customerName,
          customerEmail: targetRecipient,
          customerPhone: '081234567890',
          customerAddress: 'Cyber Building Lt. 8, Jl. Kuningan Barat No. 8, Jakarta Selatan',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          items: [
            {
              id: '1',
              name: 'Tagihan Layanan Internet Dedicated Corporate Periode Bulan Berjalan',
              description: 'Tagihan bulanan layanan dedicated internet korporat.',
              category: 'Internet Dedicated',
              qty: 1,
              unit: 'Bulan',
              price: 15000000,
              discount: 0,
            }
          ],
          subtotal: 15000000,
          discountTotal: 0,
          taxPercent: 11,
          taxAmount: 1650000,
          grandTotal: 16650000,
          paidAmount: 0,
          status: 'Belum Bayar',
          billingType: 'monthly',
          bankInfo: {
            bankName: profile.bankDetails?.[0]?.bankName || 'Bank Central Asia (BCA)',
            accountNumber: profile.bankDetails?.[0]?.accountNumber || '1234567890',
            accountHolder: profile.bankDetails?.[0]?.accountHolder || profile.legalName || 'PT. LINTAS DATA INTERNASIONAL',
          },
          isLocked: true,
        };
        subjectTemplate = profile.emailTemplates?.invoiceSubject || `[PT. LDI] Tagihan Resmi Invoice #{DOC_NUMBER} - {CUSTOMER_NAME}`;
        bodyTemplate = profile.emailTemplates?.invoiceBody || `Kepada Yth. Bagian Keuangan {CUSTOMER_NAME},\n\nBerikut kami sampaikan Invoice Tagihan Resmi #{DOC_NUMBER} dari PT. LINTAS DATA INTERNASIONAL.\n\nTotal Tagihan: {TOTAL_AMOUNT}\nTanggal Terbit: {DOC_DATE}\n\nSilakan unduh dokumen PDF terlampir untuk petunjuk pembayaran dan nomor rekening resmi.`;
      }

      // Replace placeholders in subject and body using helper
      const finalSubject = replaceEmailPlaceholders(subjectTemplate, selectedType, sampleData, profile);
      const finalBodyText = replaceEmailPlaceholders(bodyTemplate, selectedType, sampleData, profile);

      let attachedPdfUrl: string | undefined = undefined;
      let generatedPdfFilename = `${selectedType}_${docNumber.replace(/[\/\\]/g, '_')}.pdf`;

      let testPdfBase64: string | undefined = undefined;

      // Step 2: Auto Generate Official Sample PDF and Upload to Gateway
      if (testIncludePdf) {
        setTestEmailStatus({ 
          loading: true, 
          step: `2/3 Mengunggah Berkas PDF Resmi Contoh (${generatedPdfFilename}) ke Gateway Server...` 
        });

        try {
          const pdfResult = await generateStandaloneDocPdfBase64(selectedType, sampleData, profile);
          if (pdfResult && pdfResult.base64) {
            testPdfBase64 = pdfResult.base64;
            const customPublicDomain =
              typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
                ? window.location.origin
                : (profile?.website ? (profile.website.startsWith('http') ? profile.website : `https://${profile.website}`) : undefined);
            const uploadRes = await apiUploadPdf(pdfResult.filename, pdfResult.base64, customPublicDomain);
            if (uploadRes && uploadRes.pdfUrl) {
              attachedPdfUrl = uploadRes.pdfUrl;
              generatedPdfFilename = uploadRes.filename || generatedPdfFilename;
              console.log(`[TEST EMAIL ATTACHMENT READY] ${uploadRes.filename} -> ${attachedPdfUrl}`);
            }
          }
        } catch (pdfErr) {
          console.warn('Sample PDF generation/upload notice:', pdfErr);
        }
      }

      // Step 3: Send via Mailketing API
      setTestEmailStatus({ 
        loading: true, 
        step: `3/3 Mengirimkan Email Template ${selectedType} ke ${targetRecipient} via Mailketing API...` 
      });

      const formattedHtmlContent = buildFullEmailHtml({
        type: selectedType,
        docNumber,
        customerName,
        messageBody: finalBodyText,
        data: sampleData,
        companyProfile: profile,
        attachedPdfUrl,
        fileName: generatedPdfFilename,
      });

      const res = await sendEmail({
        recipient: targetRecipient,
        cc: targetCc,
        subject: finalSubject,
        content: formattedHtmlContent,
        senderName: profile.name || 'PT. LINTAS DATA INTERNASIONAL',
        senderEmail: profile.mailketingSenderEmail || profile.email || 'alwanemail@gmail.com',
        attachmentUrl: attachedPdfUrl,
        attachments: testPdfBase64
          ? [
              {
                filename: generatedPdfFilename,
                content: testPdfBase64,
                contentType: 'application/pdf',
              },
            ]
          : undefined,
        pdfBase64: testPdfBase64,
        pdfFilename: generatedPdfFilename,
        mailketingApiKey: profile.mailketingApiKey,
      });

      if (res.success) {
        setTestEmailStatus({
          loading: false,
          success: true,
          message: `✅ Sukses! Email sesuai Template ${selectedType} beserta Lampiran PDF (${generatedPdfFilename}) berhasil dikirim ke ${targetRecipient}${targetCc ? ` dan CC ke ${targetCc}` : ''} via Mailketing Gateway.`,
          pdfUrl: attachedPdfUrl,
          pdfFilename: generatedPdfFilename,
        });
      } else {
        setTestEmailStatus({
          loading: false,
          success: false,
          message: `❌ ${res.message || 'Gagal terhubung ke Mailketing API.'}`
        });
      }
    } catch (err: any) {
      setTestEmailStatus({
        loading: false,
        success: false,
        message: `❌ Error: ${err.message || 'Gagal menguji pengiriman email template.'}`
      });
    }
  };

  // Custom Bank Account State
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBankIndex, setEditingBankIndex] = useState<number | null>(null);
  const [bankForm, setBankForm] = useState({
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '',
    accountHolder: profile.legalName || 'PT LINTAS DATA INTERNASIONAL',
    branch: '',
    notes: '',
    isDefault: false,
  });

  const handleOpenAddBank = () => {
    setEditingBankIndex(null);
    setBankForm({
      bankName: 'Bank Central Asia (BCA)',
      accountNumber: '',
      accountHolder: profile.legalName || 'PT LINTAS DATA INTERNASIONAL',
      branch: 'KCP Utama',
      notes: 'Sertakan nomor invoice pada berita transfer',
      isDefault: profile.bankDetails.length === 0,
    });
    setIsBankModalOpen(true);
  };

  const handleOpenEditBank = (index: number) => {
    const bank = profile.bankDetails[index];
    setEditingBankIndex(index);
    setBankForm({
      bankName: bank.bankName || '',
      accountNumber: bank.accountNumber || '',
      accountHolder: bank.accountHolder || profile.legalName || 'PT LINTAS DATA INTERNASIONAL',
      branch: bank.branch || '',
      notes: bank.notes || '',
      isDefault: !!bank.isDefault,
    });
    setIsBankModalOpen(true);
  };

  const handleSaveBank = () => {
    if (!bankForm.bankName.trim() || !bankForm.accountNumber.trim()) {
      alert('Nama Bank dan Nomor Rekening wajib diisi.');
      return;
    }

    let updatedBanks = [...profile.bankDetails];

    if (bankForm.isDefault) {
      updatedBanks = updatedBanks.map((b) => ({ ...b, isDefault: false }));
    }

    const newBankObj = {
      id: editingBankIndex !== null ? updatedBanks[editingBankIndex].id || `bank-${Date.now()}` : `bank-${Date.now()}`,
      bankName: bankForm.bankName.trim(),
      accountNumber: bankForm.accountNumber.trim(),
      accountHolder: bankForm.accountHolder.trim() || profile.legalName,
      branch: bankForm.branch.trim() || 'KCP Utama',
      notes: bankForm.notes.trim(),
      isDefault: bankForm.isDefault || updatedBanks.length === 0,
    };

    if (editingBankIndex !== null) {
      updatedBanks[editingBankIndex] = newBankObj;
    } else {
      updatedBanks.push(newBankObj);
    }

    setProfile({ ...profile, bankDetails: updatedBanks });
    setIsBankModalOpen(false);
  };

  const handleDeleteBank = (index: number) => {
    const updated = profile.bankDetails.filter((_, idx) => idx !== index);
    if (updated.length > 0 && !updated.some((b) => b.isDefault)) {
      updated[0].isDefault = true;
    }
    setProfile({ ...profile, bankDetails: updated });
  };

  const handleSetDefaultBank = (index: number) => {
    const updated = profile.bankDetails.map((b, idx) => ({
      ...b,
      isDefault: idx === index,
    }));
    setProfile({ ...profile, bankDetails: updated });
  };

  const handleEmailTemplateChange = (field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      emailTemplates: {
        ...prev.emailTemplates,
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSignatureUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Harap unggah berkas gambar (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran berkas terlalu besar. Maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setProfile((prev) => ({ ...prev, defaultSignatureBase64: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    setProfile((prev) => ({ ...prev, defaultSignatureBase64: undefined }));
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Harap unggah berkas gambar (PNG, JPG, SVG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran berkas terlalu besar. Maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setProfile((prev) => ({ ...prev, logoUrl: base64 }));
        setUrlInput(base64);
      }
    };
    reader.readAsDataURL(file);
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

  const handleRemoveLogo = () => {
    setProfile((prev) => ({ ...prev, logoUrl: undefined }));
    setUrlInput('');
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setProfile((prev) => ({ ...prev, logoUrl: urlInput.trim() }));
    }
  };

  const handleFaviconUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Harap unggah berkas gambar (PNG, ICO, SVG, WEBP, JPG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran berkas favicon terlalu besar. Maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setProfile((prev) => ({ ...prev, faviconUrl: base64 }));
        setFaviconUrlInput(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFaviconDragging(true);
  };

  const handleFaviconDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFaviconDragging(false);
  };

  const handleFaviconDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFaviconDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFaviconUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFavicon = () => {
    setProfile((prev) => ({ ...prev, faviconUrl: undefined }));
    setFaviconUrlInput('');
  };

  const handleApplyFaviconUrl = () => {
    if (faviconUrlInput.trim()) {
      setProfile((prev) => ({ ...prev, faviconUrl: faviconUrlInput.trim() }));
    }
  };

  const handleUseLogoAsFavicon = () => {
    if (profile.logoUrl) {
      setProfile((prev) => ({ ...prev, faviconUrl: profile.logoUrl }));
      setFaviconUrlInput(profile.logoUrl);
    } else {
      alert('Logo perusahaan belum diunggah.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-600" />
            Pengaturan Profil & Legitimasi Perusahaan
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Atur identitas resmi PT. Lintas Data Internasional untuk Kop Surat PDF, logo perusahaan, rekening bank, dan tanda tangan direksi.
          </p>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4" /> Profil Berhasil Diperbarui!
          </div>
        )}
      </div>

      {/* D1 Cloudflare Backend Config Panel */}
      <D1ConfigPanel />

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* LOGO UPLOAD BOX */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              Logo Perusahaan (Kop Surat PDF & Navigation Bar)
            </h3>
            {profile.logoUrl && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Logo Custom
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Upload Zone */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-3">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-blue-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-xs">
                    Klik atau Tarik Berkas Logo ke Sini
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Format: PNG, JPG, SVG, atau WEBP (Maksimal 5 MB)
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg shadow-sm transition">
                    Pilih Berkas Gambar
                  </span>
                </div>
              </div>

              {/* URL Input Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-blue-600 hover:underline text-xs font-semibold flex items-center gap-1"
                >
                  <Link className="w-3.5 h-3.5" />
                  {showUrlInput ? 'Sembunyikan Opsi URL' : 'Atau Masukkan Tautan URL Logo Direct'}
                </button>

                {showUrlInput && (
                  <div className="mt-2 flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/logo-ldi.png"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition"
                    >
                      Gunakan URL
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="lg:col-span-5 xl:col-span-4 bg-slate-900 text-white p-4.5 rounded-2xl border border-slate-800 shadow-inner flex flex-col justify-between space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5 text-cyan-400" /> Preview Kop Surat PDF
                </p>

                <div className="bg-white p-3.5 rounded-xl border border-slate-700 text-slate-900 flex items-center gap-3">
                  {profile.logoUrl ? (
                    <div className="w-12 h-12 rounded-lg bg-white p-1 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={profile.logoUrl}
                        alt="Logo Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-1.5 text-white shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current" strokeWidth="6">
                        <rect x="15" y="15" width="70" height="22" rx="4" className="stroke-cyan-300 fill-blue-950/40" />
                        <rect x="15" y="44" width="70" height="22" rx="4" className="stroke-cyan-400 fill-blue-950/40" />
                        <circle cx="30" cy="26" r="3" className="fill-emerald-400 stroke-none" />
                      </svg>
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-black text-xs text-blue-950 truncate">{profile.legalName}</p>
                    <p className="text-[9px] text-slate-500 font-mono truncate">{profile.website}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-[10px] text-slate-300 space-y-1">
                <p className="font-bold text-cyan-300">Status Logo Saat Ini:</p>
                <p>
                  {profile.logoUrl ? (
                    <span className="text-emerald-400 font-semibold">✓ Custom Logo Aktif</span>
                  ) : (
                    <span className="text-slate-400">Standard Vector Logo (Default)</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAVICON UPLOAD BOX */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              Favicon / Icon Bar Browser Tab
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {profile.logoUrl && !profile.faviconUrl && (
                <button
                  type="button"
                  onClick={handleUseLogoAsFavicon}
                  className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition"
                >
                  <Copy className="w-3.5 h-3.5" /> Gunakan Logo Perusahaan
                </button>
              )}
              {profile.faviconUrl && (
                <button
                  type="button"
                  onClick={handleRemoveFavicon}
                  className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Favicon Custom
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Upload Zone */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-3">
              <div
                onDragOver={handleFaviconDragOver}
                onDragLeave={handleFaviconDragLeave}
                onDrop={handleFaviconDrop}
                onClick={() => faviconInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isFaviconDragging
                    ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-indigo-400'
                }`}
              >
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFaviconUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                  <Globe className="w-6 h-6" />
                </div>

                <div>
                  <p className="font-bold text-slate-800 text-xs">
                    Klik atau Tarik Berkas Icon Favicon ke Sini
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Rekomendasi Persegi (32x32 atau 64x64 px). Format: PNG, ICO, SVG, WEBP, JPG
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg shadow-sm transition">
                    Pilih Berkas Favicon
                  </span>
                </div>
              </div>

              {/* URL Input Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowFaviconUrlInput(!showFaviconUrlInput)}
                  className="text-indigo-600 hover:underline text-xs font-semibold flex items-center gap-1"
                >
                  <Link className="w-3.5 h-3.5" />
                  {showFaviconUrlInput ? 'Sembunyikan Opsi URL Favicon' : 'Atau Masukkan Tautan URL Favicon Direct'}
                </button>

                {showFaviconUrlInput && (
                  <div className="mt-2 flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/favicon.png"
                      value={faviconUrlInput}
                      onChange={(e) => setFaviconUrlInput(e.target.value)}
                      className="flex-1 p-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleApplyFaviconUrl}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition"
                    >
                      Gunakan URL
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Live Browser Tab Preview Card */}
            <div className="lg:col-span-5 xl:col-span-4 bg-slate-900 text-white p-4.5 rounded-2xl border border-slate-800 shadow-inner flex flex-col justify-between space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" /> Preview Browser Tab (Bar)
                </p>

                {/* Browser Frame Simulation */}
                <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                  {/* Window control buttons */}
                  <div className="bg-slate-800 px-3 py-2 flex items-center gap-1.5 border-b border-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                  </div>

                  {/* Browser Tab */}
                  <div className="bg-slate-900 px-3 py-2 border-b border-slate-800">
                    <div className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-t-lg border-t border-x border-slate-700 flex items-center gap-2 max-w-[220px]">
                      {/* Active Favicon Image */}
                      {profile.faviconUrl || profile.logoUrl ? (
                        <img
                          src={profile.faviconUrl || profile.logoUrl}
                          alt="Favicon Tab"
                          className="w-4 h-4 object-contain rounded-sm shrink-0"
                        />
                      ) : (
                        <span className="text-xs shrink-0">🌐</span>
                      )}
                      <span className="text-[10px] font-semibold truncate text-slate-200">
                        {profile.name} - E-Office System
                      </span>
                    </div>
                  </div>

                  {/* Address Bar */}
                  <div className="bg-slate-900 p-2 border-t border-slate-800/80">
                    <div className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-[10px] text-slate-400 font-mono flex items-center gap-1.5 truncate">
                      <span className="text-emerald-400">🔒</span>
                      <span className="truncate">https://{profile.website || 'e-office.ldi.co.id'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-[10px] text-slate-300 space-y-1">
                <p className="font-bold text-cyan-300">Status Favicon Bar:</p>
                <p>
                  {profile.faviconUrl ? (
                    <span className="text-emerald-400 font-semibold">✓ Custom Favicon Aktif</span>
                  ) : profile.logoUrl ? (
                    <span className="text-cyan-400 font-semibold">⚡ Menggunakan Logo Perusahaan</span>
                  ) : (
                    <span className="text-slate-400">Default Web Globe Icon</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION I: PROFIL & KONTAK RESMI */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            I. Profil & Kontak Resmi Perusahaan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Perusahaan / Legal Entity</label>
              <input
                type="text"
                required
                value={profile.legalName}
                onChange={(e) => setProfile({ ...profile, legalName: e.target.value, name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Website Resmi</label>
              <input
                type="text"
                required
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Dukungan / Sales</label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">No. Whatsapp / Support</label>
              <input
                type="text"
                required
                value={profile.whatsapp}
                onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Alamat Kantor Pusat (Kop Surat)</label>
              <textarea
                required
                rows={3}
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
              ></textarea>
            </div>
          </div>
        </div>

        {/* SECTION II: REKENING BANK */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                II. Rekening Bank Penampung Resmi (Atur Custom Nomor Rekening)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kelola daftar rekening bank resmi PT LDI untuk penagihan Invoice, nomor Virtual Account, dan petunjuk transfer pembayaran.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddBank}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition self-start sm:self-auto shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              Tambah Rekening Resmi
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.bankDetails.map((bank, idx) => (
              <div
                key={bank.id || idx}
                className={`p-4 rounded-xl border transition space-y-3 relative ${
                  bank.isDefault
                    ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-blue-950 text-sm">{bank.bankName}</p>
                      {bank.isDefault && (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3 fill-white" /> Utama / Default
                        </span>
                      )}
                    </div>
                    {bank.branch && (
                      <p className="text-[11px] text-slate-500 font-medium">Cabang: {bank.branch}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditBank(idx)}
                      title="Edit Rekening"
                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBank(idx)}
                      title="Hapus Rekening"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono space-y-1">
                  <div className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider">
                    Nomor Rekening Resmi
                  </div>
                  <div className="text-base font-black text-slate-900 tracking-wide flex items-center justify-between">
                    <span>{bank.accountNumber}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(bank.accountNumber);
                        alert(`Nomor rekening ${bank.accountNumber} berhasil disalin!`);
                      }}
                      className="text-[10px] font-sans font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Salin
                    </button>
                  </div>
                  <div className="text-[11px] font-sans text-slate-600">
                    a.n. <strong className="text-slate-900">{bank.accountHolder}</strong>
                  </div>
                </div>

                {bank.notes && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-100/80 p-2 rounded border border-slate-200">
                    💡 {bank.notes}
                  </p>
                )}

                {!bank.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefaultBank(idx)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 pt-1"
                  >
                    <Star className="w-3 h-3" /> Jadikan Rekening Utama untuk Invoice
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION III: PEJABAT PENANDATANGAN */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
            III. Pejabat Penandatangan Dokumen Penawaran, Kontrak & Invoice
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <PenTool className="w-3.5 h-3.5 text-blue-600" />
                Penandatangan Utama (Direktur / SPH / PKS)
              </p>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={profile.directorName}
                  onChange={(e) => setProfile({ ...profile, directorName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Jabatan</label>
                <input
                  type="text"
                  value={profile.directorPosition}
                  onChange={(e) => setProfile({ ...profile, directorPosition: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                Penandatangan Keuangan (Finance / Invoice)
              </p>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Nama Manager Finance</label>
                <input
                  type="text"
                  value={profile.financeManager}
                  onChange={(e) => setProfile({ ...profile, financeManager: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION IV: DIGITAL SIGNATURE & STAMP PREVIEW */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                IV. Upload & Tanda Tangan Digital Direksi (.PNG / Canvas Pad)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Gambar tanda tangan dan stempel resmi akan ditempelkan secara otomatis pada setiap dokumen PDF SPH, PKS, & Invoice.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSigMode('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    sigMode === 'upload'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File (.PNG)
                </button>
                <button
                  type="button"
                  onClick={() => setSigMode('draw')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    sigMode === 'draw'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" /> Gambar TTD
                </button>
              </div>

              {profile.defaultSignatureBase64 && (
                <button
                  type="button"
                  onClick={handleRemoveSignature}
                  className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Tanda Tangan
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Upload or Draw Pad Zone */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-4">
              {sigMode === 'upload' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsSigDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsSigDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsSigDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleSignatureUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => signatureInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isSigDragging
                      ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-emerald-400'
                  }`}
                >
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/png,image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSignatureUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 text-xs">
                      Klik atau Tarik Berkas File Tanda Tangan ke Sini
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Rekomendasi: Format PNG Transparan / Background Bening (Maksimal 5 MB)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg shadow-sm transition">
                      Pilih Gambar TTD (.PNG / .JPG / .SVG)
                    </span>
                  </div>
                </div>
              ) : (
                <SignaturePad
                  signerName={profile.directorName || 'Direktur PT LDI'}
                  signerPosition={profile.directorPosition || 'Direktur Utama'}
                  existingSignature={profile.defaultSignatureBase64}
                  onSaveSignature={(dataUrl) => {
                    setProfile((prev) => ({
                      ...prev,
                      defaultSignatureBase64: dataUrl,
                    }));
                  }}
                  label="Kanvas Tanda Tangan Digital Direksi"
                />
              )}

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-[11px] text-emerald-900 flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Otomatisasi PDF Aktif:</strong> Setelah diunggah dan disimpan, tanda tangan digital dan stempel resmi ini akan langsung disematkan pada seluruh cetakan PDF SPH, PKS, dan Invoice Penagihan resmi.
                </div>
              </div>
            </div>

            {/* Live Preview Signature & Stamp Box */}
            <div className="lg:col-span-5 xl:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 lg:sticky lg:top-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <p className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileImage className="w-4 h-4 text-cyan-400" /> Pratinjau Stempel & TTD PDF
                </p>
                <span className="bg-cyan-950 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-800">
                  Simulasi SPH / PKS
                </span>
              </div>

              {/* Realistic Paper Slip Preview */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 text-slate-900 text-center relative overflow-hidden shadow-sm space-y-1">
                <p className="text-[10px] text-slate-500 font-medium">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="text-[10px] font-semibold text-slate-600">Hormat Kami,</p>
                <p className="font-extrabold text-xs text-blue-950">{profile.legalName}</p>

                {/* Stamp & Signature Container */}
                <div className="relative my-2 py-1 h-20 w-full flex items-center justify-center overflow-hidden">
                  {/* Official Company Stamp Overlay (Realistic Crimson/Red Stamp Ring) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-85 select-none">
                    <div className="border-2 border-red-600 rounded-full w-18 h-18 flex flex-col items-center justify-center rotate-[-12deg] p-1 bg-red-50/10 shadow-2xs">
                      <div className="border border-red-500 border-dashed rounded-full w-full h-full flex flex-col items-center justify-center p-0.5 text-[6px] font-black text-red-600 uppercase text-center leading-tight">
                        <span className="text-[5.5px] tracking-tight">PT LINTAS DATA</span>
                        <span className="text-[5px] text-red-500 font-serif my-0.2">★ STAMP ★</span>
                        <span className="text-[5.5px] tracking-tight">INTERNASIONAL</span>
                      </div>
                    </div>
                  </div>

                  {/* Digital Signature Overlay */}
                  {profile.defaultSignatureBase64 ? (
                    <img
                      src={profile.defaultSignatureBase64}
                      alt="Preview TTD Transparan"
                      className="max-h-16 max-w-[160px] object-contain z-10 filter drop-shadow-xs transition-all duration-200"
                    />
                  ) : (
                    <div className="z-10 py-2 px-4 border-b border-slate-300 text-slate-400 font-serif italic text-[11px]">
                      [Tanda Tangan Belum Diunggah]
                    </div>
                  )}
                </div>

                <p className="font-bold text-xs text-slate-900 underline decoration-slate-400 decoration-1 underline-offset-2">{profile.directorName || 'Nama Direktur'}</p>
                <p className="text-[10px] text-slate-500 font-medium">{profile.directorPosition || 'Direktur Utama'}</p>
              </div>

              {/* Status Footer */}
              <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/80 text-[10px] text-slate-300 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">Status Stempel & TTD:</span>
                  {profile.defaultSignatureBase64 ? (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Digital PNG Active
                    </span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      ⚠ Placeholder Teks
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-[10px] leading-tight">
                  Stempel merah & tanda tangan transparan akan dicetak otomatis di bagian bawah dokumen resmi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* V. EMAIL TEMPLATE SETTINGS SECTION */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                V. Template Pesan Email Pengiriman Dokumen (SPH / PKS / Invoice)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Atur subjek dan isi pesan email kustom yang dapat digunakan saat mengirimkan dokumen kepada pelanggan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm('Kembalikan semua template email ke format standar PT. LDI?')) {
                  setProfile((prev) => ({
                    ...prev,
                    emailTemplates: COMPANY_PROFILE.emailTemplates,
                  }));
                }
              }}
              className="text-slate-600 hover:text-blue-900 text-[11px] font-bold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Template Standar
            </button>
          </div>

          {/* Placeholders Help Box */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-950 space-y-2">
            <p className="font-bold text-blue-900 flex items-center justify-between">
              <span>💡 Variabel Otomatis Tersedia (Subjek & Isi Email):</span>
              <span className="text-[11px] text-blue-700 font-normal">Otomatis diganti sesuai data dokumen real</span>
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900" title="Nomor Dokumen SPH/PKS/Invoice">{`{DOC_NUMBER}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900" title="Nama Klien / Perusahaan">{`{CUSTOMER_NAME}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900" title="Tanggal Terbit Dokumen">{`{DOC_DATE}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900" title="Total Nilai / Grand Total">{`{TOTAL_AMOUNT}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900" title="Daftar Rincian Layanan / Item">{`{ITEMS_LIST}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900" title="Subtotal Sebelum Pajak">{`{SUBTOTAL}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900" title="Nilai PPN 11%">{`{TAX_AMOUNT}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900" title="Rekening Transfer Resmi PT LDI">{`{BANK_INFO}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900" title="Tanggal Jatuh Tempo">{`{DUE_DATE}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900" title="Status Pembayaran (LUNAS / BELUM BAYAR)">{`{PAYMENT_STATUS}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900" title="Masa Berlaku Dokumen">{`{VALIDITY_DAYS}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900" title="Tautan Verifikasi Keaslian Dokumen">{`{VERIFY_URL}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900" title="Nomor Telepon / WhatsApp">{`{PHONE}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900" title="Domain / Website PT LDI">{`{WEBSITE}`}</span>
            </div>
          </div>

          {/* Default CC Field */}
          <div>
            <label className="font-bold text-slate-800 text-xs block mb-1">
              Email Tembusan Standar (Default CC)
            </label>
            <input
              type="text"
              value={profile.emailTemplates?.defaultCc || ''}
              onChange={(e) => handleEmailTemplateChange('defaultCc', e.target.value)}
              placeholder="finance@ldi.co.id, sales@ldi.co.id"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* MAILKETING API GATEWAY CONFIGURATION */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-700" />
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                  Konfigurasi Email Gateway (Mailketing API Key)
                </h4>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                Mailketing API v1
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 text-xs block mb-1">
                  API Key Mailketing *
                </label>
                <input
                  type="text"
                  value={profile.mailketingApiKey || ''}
                  onChange={(e) => setProfile({ ...profile, mailketingApiKey: e.target.value })}
                  placeholder="5aafffa0c30e5a..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 text-xs block mb-1">
                  Email Pengirim Gateway (Sender Email) *
                </label>
                <input
                  type="email"
                  value={profile.mailketingSenderEmail || ''}
                  onChange={(e) => setProfile({ ...profile, mailketingSenderEmail: e.target.value })}
                  placeholder="admin@ldi.co.id"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* ENHANCED TEST EMAIL CONTROLLER */}
            <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-blue-600" />
                    Uji Kirim Email Sesuai Template Dokumen & Lampiran PDF
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Uji coba pengiriman nyata ke inbox menggunakan template aktif dan berkas PDF berstempel resmi.
                  </p>
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md border border-blue-200 self-start sm:self-auto">
                  LIVE TESTER
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4">
                  <label className="font-bold text-slate-700 text-[11px] block mb-1">
                    Email Penerima Utama (Target Inbox) *
                  </label>
                  <input
                    type="email"
                    value={testRecipientEmail}
                    onChange={(e) => setTestRecipientEmail(e.target.value)}
                    placeholder="alwanemail@gmail.com"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="font-bold text-slate-700 text-[11px] block mb-1">
                    Email Tembusan (CC) <span className="text-slate-400 font-normal text-[10px]">(Opsional, cth: alwanemail@gmail.com)</span>
                  </label>
                  <input
                    type="text"
                    value={testCcEmail}
                    onChange={(e) => setTestCcEmail(e.target.value)}
                    placeholder="alwanemail@gmail.com, finance@ldi.co.id"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="font-bold text-slate-700 text-[11px] block mb-1">
                    Pilih Jenis Template Dokumen
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTestDocType('SPH')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition text-center ${
                        testDocType === 'SPH'
                          ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      📄 SPH
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestDocType('PKS')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition text-center ${
                        testDocType === 'PKS'
                          ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      📑 PKS
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestDocType('Invoice')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition text-center ${
                        testDocType === 'Invoice'
                          ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      💳 Invoice
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={testIncludePdf}
                    onChange={(e) => setTestIncludePdf(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sertakan Contoh Lampiran Berkas PDF Resmi (Auto-Generated PDF)</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleTestMailketingConnection(testDocType)}
                  disabled={testEmailStatus?.loading}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {testEmailStatus?.loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses Pengiriman...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-blue-200" />
                      <span>Kirim Email Uji Coba ({testDocType})</span>
                    </>
                  )}
                </button>
              </div>

              {testEmailStatus?.loading && testEmailStatus.step && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900 flex items-center gap-2 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>{testEmailStatus.step}</span>
                </div>
              )}

              {testEmailStatus?.message && !testEmailStatus.loading && (
                <div
                  className={`p-3.5 rounded-xl text-xs space-y-2 ${
                    testEmailStatus.success
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                      : 'bg-red-50 text-red-900 border border-red-300'
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    {testEmailStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{testEmailStatus.message}</span>
                  </p>

                  {testEmailStatus.pdfUrl && (
                    <div className="bg-white/80 border border-emerald-200 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="font-mono text-emerald-800 font-bold flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        Lampiran PDF: {testEmailStatus.pdfFilename}
                      </span>
                      <a
                        href={testEmailStatus.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1 shadow-xs transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Buka / Unduh Berkas PDF
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabs for SPH, PKS, Invoice */}
          <div className="pt-2">
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setEmailTemplateTab('SPH')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  emailTemplateTab === 'SPH'
                    ? 'bg-blue-900 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📄 Template Email SPH
              </button>
              <button
                type="button"
                onClick={() => setEmailTemplateTab('PKS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  emailTemplateTab === 'PKS'
                    ? 'bg-blue-900 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📑 Template Email PKS
              </button>
              <button
                type="button"
                onClick={() => setEmailTemplateTab('Invoice')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  emailTemplateTab === 'Invoice'
                    ? 'bg-blue-900 text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                💳 Template Email Invoice
              </button>
            </div>

            {/* Editor SPH */}
            {emailTemplateTab === 'SPH' && (
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs">
                    Subjek Email SPH
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset template email SPH ke format standar lengkap?')) {
                        handleEmailTemplateChange('sphSubject', DEFAULT_EMAIL_TEMPLATES.sphSubject);
                        handleEmailTemplateChange('sphBody', DEFAULT_EMAIL_TEMPLATES.sphBody);
                      }
                    }}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Template SPH Standar
                  </button>
                </div>
                <input
                  type="text"
                  value={profile.emailTemplates?.sphSubject || ''}
                  onChange={(e) => handleEmailTemplateChange('sphSubject', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1">
                    Isi Pesan Email SPH
                  </label>
                  <textarea
                    rows={10}
                    value={profile.emailTemplates?.sphBody || ''}
                    onChange={(e) => handleEmailTemplateChange('sphBody', e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Editor PKS */}
            {emailTemplateTab === 'PKS' && (
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs">
                    Subjek Email PKS
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset template email PKS ke format standar lengkap?')) {
                        handleEmailTemplateChange('pksSubject', DEFAULT_EMAIL_TEMPLATES.pksSubject);
                        handleEmailTemplateChange('pksBody', DEFAULT_EMAIL_TEMPLATES.pksBody);
                      }
                    }}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Template PKS Standar
                  </button>
                </div>
                <input
                  type="text"
                  value={profile.emailTemplates?.pksSubject || ''}
                  onChange={(e) => handleEmailTemplateChange('pksSubject', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1">
                    Isi Pesan Email PKS
                  </label>
                  <textarea
                    rows={10}
                    value={profile.emailTemplates?.pksBody || ''}
                    onChange={(e) => handleEmailTemplateChange('pksBody', e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Editor Invoice */}
            {emailTemplateTab === 'Invoice' && (
              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs">
                    Subjek Email Invoice
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset template email Invoice ke format standar lengkap?')) {
                        handleEmailTemplateChange('invoiceSubject', DEFAULT_EMAIL_TEMPLATES.invoiceSubject);
                        handleEmailTemplateChange('invoiceBody', DEFAULT_EMAIL_TEMPLATES.invoiceBody);
                      }
                    }}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Template Invoice Standar
                  </button>
                </div>
                <input
                  type="text"
                  value={profile.emailTemplates?.invoiceSubject || ''}
                  onChange={(e) => handleEmailTemplateChange('invoiceSubject', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1">
                    Isi Pesan Email Invoice
                  </label>
                  <textarea
                    rows={10}
                    value={profile.emailTemplates?.invoiceBody || ''}
                    onChange={(e) => handleEmailTemplateChange('invoiceBody', e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reset / Danger Zone */}
        {onResetAllData && (
          <div className="bg-rose-50 rounded-2xl p-6 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-rose-900 text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                Reset & Hapus Seluruh Data Pelanggan, SPH, PKS & Invoice
              </h3>
              <p className="text-xs text-rose-700 mt-1">
                Aksi ini akan menghapus semua data transaksi dan pelanggan agar Anda dapat memulai input data baru dari nol.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Apakah Anda yakin ingin menghapus seluruh data dan memulai dari 0?')) {
                  onResetAllData();
                  alert('Seluruh data berhasil dihapus. Aplikasi kini bersih (0 data).');
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition shrink-0 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset Data Ke 0
            </button>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition"
          >
            <Save className="w-4 h-4" /> Simpan Perubahan Profil PT LDI
          </button>
        </div>
      </form>

      {/* Modal Custom Bank Account Form */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    {editingBankIndex !== null ? 'Edit Rekening Bank Penampung' : 'Tambah Rekening Bank Resmi Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Atur custom nomor rekening resmi untuk penagihan invoice.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Preset Bank Dropdown */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Pilih / Preset Nama Bank</label>
                <select
                  value={
                    [
                      'Bank Central Asia (BCA)',
                      'Bank Mandiri',
                      'Bank Negara Indonesia (BNI)',
                      'Bank Rakyat Indonesia (BRI)',
                      'Bank Syariah Indonesia (BSI)',
                      'Bank Permata',
                      'CIMB Niaga',
                      'Bank Danamon',
                      'Bank DKI',
                      'Bank BJB',
                    ].includes(bankForm.bankName)
                      ? bankForm.bankName
                      : 'CUSTOM'
                  }
                  onChange={(e) => {
                    if (e.target.value !== 'CUSTOM') {
                      setBankForm({ ...bankForm, bankName: e.target.value });
                    }
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Bank Central Asia (BCA)">Bank Central Asia (BCA)</option>
                  <option value="Bank Mandiri">Bank Mandiri</option>
                  <option value="Bank Negara Indonesia (BNI)">Bank Negara Indonesia (BNI)</option>
                  <option value="Bank Rakyat Indonesia (BRI)">Bank Rakyat Indonesia (BRI)</option>
                  <option value="Bank Syariah Indonesia (BSI)">Bank Syariah Indonesia (BSI)</option>
                  <option value="Bank Permata">Bank Permata</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Bank Danamon">Bank Danamon</option>
                  <option value="Bank DKI">Bank DKI</option>
                  <option value="Bank BJB">Bank BJB</option>
                  <option value="CUSTOM">-- Nama Bank Custom Lainnya --</option>
                </select>
              </div>

              {/* Custom Bank Name Input */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Nama Resmi Bank (Custom Text)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bank Central Asia (BCA) / Bank Mandiri Virtual Account"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Nomor Rekening */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Nomor Rekening / Virtual Account (Custom)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 8830-1928-33 atau 8800-0812-3456"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Atas Nama */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Atas Nama Rekening (a.n.)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT LINTAS DATA INTERNASIONAL"
                  value={bankForm.accountHolder}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Cabang / KCP */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Cabang / KCP Pembukaan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: KCP BSD Green Office Park Tangerang"
                  value={bankForm.branch}
                  onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Catatan / Instruksi Transfer */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Catatan / Instruksi Transfer (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Mohon cantumkan No. Invoice pada berita transfer"
                  value={bankForm.notes}
                  onChange={(e) => setBankForm({ ...bankForm, notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Default Checkbox */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bankForm.isDefault}
                  onChange={(e) => setBankForm({ ...bankForm, isDefault: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800 text-xs">
                  Set sebagai Rekening Utama (Default saat membuat Invoice Baru)
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveBank}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition"
              >
                Simpan Rekening Bank
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
