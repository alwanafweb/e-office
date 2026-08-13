import React, { useState, useRef } from 'react';
import { Building, Globe, Mail, Phone, MapPin, CreditCard, ShieldCheck, Save, Check, Upload, Image as ImageIcon, Trash2, Link, FileImage, RotateCcw, PenTool, Plus, Edit3, Star, Copy, PlusCircle, X } from 'lucide-react';
import { CompanyProfile } from '../types';
import { COMPANY_PROFILE } from '../data/initialData';
import { SignaturePad } from './SignaturePad';
import { D1ConfigPanel } from './D1ConfigPanel';

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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              Logo Perusahaan (Kop Surat PDF & Navigation Bar)
            </h3>
            {profile.logoUrl && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Logo Custom
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upload Zone */}
            <div className="md:col-span-2 space-y-3">
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
                  <span className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-sm transition">
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
                  <div className="mt-2 flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/logo-ldi.png"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 p-2 border border-slate-300 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded-lg text-xs transition"
                    >
                      Gunakan URL
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-inner flex flex-col justify-between space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5 text-cyan-400" /> Preview Kop Surat PDF
                </p>

                <div className="bg-white p-3 rounded-xl border border-slate-700 text-slate-900 flex items-center gap-3">
                  {profile.logoUrl ? (
                    <div className="w-12 h-12 rounded-lg bg-white p-1 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img
                        src={profile.logoUrl}
                        alt="Logo Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-1.5 text-white flex-shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current" strokeWidth="6">
                        <rect x="15" y="15" width="70" height="22" rx="4" className="stroke-cyan-300 fill-blue-950/40" />
                        <rect x="15" y="44" width="70" height="22" rx="4" className="stroke-cyan-400 fill-blue-950/40" />
                        <circle cx="30" cy="26" r="3" className="fill-emerald-400 stroke-none" />
                      </svg>
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-black text-xs text-blue-950 truncate">{profile.legalName}</p>
                    <p className="text-[9px] text-slate-500 font-mono">{profile.website}</p>
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2 gap-2">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              Favicon / Icon Bar Browser Tab
            </h3>
            <div className="flex items-center gap-2">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upload Zone */}
            <div className="md:col-span-2 space-y-3">
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
                  <span className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-sm transition">
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
                  <div className="mt-2 flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/favicon.png"
                      value={faviconUrlInput}
                      onChange={(e) => setFaviconUrlInput(e.target.value)}
                      className="flex-1 p-2 border border-slate-300 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleApplyFaviconUrl}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded-lg text-xs transition"
                    >
                      Gunakan URL
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Live Browser Tab Preview Card */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-inner flex flex-col justify-between space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
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
                          className="w-4 h-4 object-contain rounded-sm flex-shrink-0"
                        />
                      ) : (
                        <span className="text-xs flex-shrink-0">🌐</span>
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
                      <span>https://{profile.website || 'jagoanserver.com'}</span>
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
            I. Profil & Kontak Resmi Perusahaan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Perusahaan / Legal Entity</label>
              <input
                type="text"
                required
                value={profile.legalName}
                onChange={(e) => setProfile({ ...profile, legalName: e.target.value, name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Website Resmi</label>
              <input
                type="text"
                required
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Dukungan / Sales</label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">No. Whatsapp / Support</label>
              <input
                type="text"
                required
                value={profile.whatsapp}
                onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Alamat Kantor Pusat (Kop Surat)</label>
            <textarea
              required
              rows={3}
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg"
            ></textarea>
          </div>
        </div>

        {/* Bank Details Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
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
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition self-start sm:self-auto"
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
                    <div className="flex items-center gap-2">
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

                  <div className="flex items-center gap-1">
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

        {/* Executive Signers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide border-b border-slate-100 pb-2">
            III. Pejabat Penandatangan Dokumen Penawaran, Kontrak & Invoice
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">Penandatangan Utama (Direktur / SPH / PKS)</p>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={profile.directorName}
                  onChange={(e) => setProfile({ ...profile, directorName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block">Jabatan</label>
                <input
                  type="text"
                  value={profile.directorPosition}
                  onChange={(e) => setProfile({ ...profile, directorPosition: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-900">Penandatangan Keuangan (Finance / Invoice)</p>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block">Nama Manager Finance</label>
                <input
                  type="text"
                  value={profile.financeManager}
                  onChange={(e) => setProfile({ ...profile, financeManager: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* DIGITAL SIGNATURE UPLOAD BOX */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                IV. Upload & Tanda Tangan Digital Direksi (.PNG / Canvas Pad)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Gambar tanda tangan akan otomatis ditempelkan secara presisi pada setiap dokumen PDF SPH, PKS, & Invoice saat di-generate.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSigMode('upload')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    sigMode === 'upload'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File (.PNG)
                </button>
                <button
                  type="button"
                  onClick={() => setSigMode('draw')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    sigMode === 'draw'
                      ? 'bg-emerald-700 text-white shadow-sm'
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upload or Draw Zone */}
            <div className="md:col-span-2 space-y-3">
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

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Otomatisasi PDF Aktif:</strong> Setelah diunggah dan disimpan, tanda tangan digital ini akan langsung disematkan pada seluruh cetakan PDF Surat Penawaran Harga (SPH), Perjanjian Kerja Sama (PKS), dan Invoice Penagihan resmi.
                </div>
              </div>
            </div>

            {/* Live Preview Signature Box */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-inner flex flex-col justify-between space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileImage className="w-3.5 h-3.5 text-cyan-400" /> Preview Pada Dokumen PDF
                </p>

                <div className="bg-white p-4 rounded-xl border border-slate-300 text-slate-900 text-center relative overflow-hidden min-h-[110px] flex flex-col items-center justify-center">
                  <p className="text-[10px] text-slate-500 mb-1">Hormat Kami,</p>
                  <p className="font-bold text-[11px] text-blue-950 mb-1">{profile.legalName}</p>

                  <div className="relative my-1 h-14 w-full flex items-center justify-center">
                    {/* Stamp Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                      <div className="border border-red-600 rounded-full w-14 h-14 flex items-center justify-center rotate-[-12deg]">
                        <span className="text-[6px] font-black text-red-600 uppercase text-center leading-none">
                          PT LDI STAMP
                        </span>
                      </div>
                    </div>

                    {profile.defaultSignatureBase64 ? (
                      <img
                        src={profile.defaultSignatureBase64}
                        alt="Preview TTD Transparan"
                        className="max-h-12 max-w-[140px] object-contain z-10"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-serif italic border-b border-slate-300 px-3">
                        [Tanda Tangan Belum Diunggah]
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-[11px] text-slate-900 underline mt-1">{profile.directorName}</p>
                  <p className="text-[9px] text-slate-500">{profile.directorPosition}</p>
                </div>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-[10px] text-slate-300 space-y-1">
                <p className="font-bold text-cyan-300">Status Tanda Tangan:</p>
                <p>
                  {profile.defaultSignatureBase64 ? (
                    <span className="text-emerald-400 font-semibold">✓ TTD Digital PNG Tersimpan</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">⚠ Menggunakan Placeholder Teks</span>
                  )}
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
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-xs text-blue-950 space-y-1">
            <p className="font-bold text-blue-900 flex items-center gap-1.5">
              <span>💡 Variable Otomatis (Dapat Digunakan dalam Subjek & Isi Email):</span>
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] pt-1">
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900">{`{DOC_NUMBER}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900">{`{CUSTOMER_NAME}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900">{`{DOC_DATE}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900">{`{TOTAL_AMOUNT}`}</span>
              <span className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900">{`{PHONE}`}</span>
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
                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1">
                    Subjek Email SPH
                  </label>
                  <input
                    type="text"
                    value={profile.emailTemplates?.sphSubject || ''}
                    onChange={(e) => handleEmailTemplateChange('sphSubject', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1">
                    Isi Pesan Email SPH
                  </label>
                  <textarea
                    rows={8}
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
                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1">
                    Subjek Email PKS
                  </label>
                  <input
                    type="text"
                    value={profile.emailTemplates?.pksSubject || ''}
                    onChange={(e) => handleEmailTemplateChange('pksSubject', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1">
                    Isi Pesan Email PKS
                  </label>
                  <textarea
                    rows={8}
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
                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1">
                    Subjek Email Invoice
                  </label>
                  <input
                    type="text"
                    value={profile.emailTemplates?.invoiceSubject || ''}
                    onChange={(e) => handleEmailTemplateChange('invoiceSubject', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 text-xs block mb-1">
                    Isi Pesan Email Invoice
                  </label>
                  <textarea
                    rows={8}
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
