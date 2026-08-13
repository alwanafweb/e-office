import React, { useState } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  Eye,
  Trash2,
  PenTool,
  CheckCircle2,
  X,
  Building,
  ShieldCheck,
  Edit2,
  Lock,
  Unlock,
} from 'lucide-react';
import { Customer, PKS, PKSClause, SPH } from '../types';
import { formatDateIndonesian, formatIDR, generateDocNumber } from '../utils/formatters';
import { SignaturePad } from './SignaturePad';
import { COMPANY_PROFILE } from '../data/initialData';
import { CustomPksModal } from './CustomPksModal';

interface PksViewProps {
  pksList: PKS[];
  customers: Customer[];
  sphList: SPH[];
  onAddPks: (pks: PKS) => void;
  onUpdatePks: (pks: PKS) => void;
  onDeletePks: (id: string) => void;
  onBatchDeletePks?: (ids: string[]) => void;
  onBatchUpdatePksStatus?: (ids: string[], status: PKS['status']) => void;
  onPreviewPks: (pks: PKS) => void;
  onToggleLockDocument?: (type: 'SPH' | 'PKS' | 'Invoice', id: string, forceState?: boolean) => void;
}

export const PksView: React.FC<PksViewProps> = ({
  pksList,
  customers,
  sphList,
  onAddPks,
  onUpdatePks,
  onDeletePks,
  onBatchDeletePks,
  onBatchUpdatePksStatus,
  onPreviewPks,
  onToggleLockDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [signingPks, setSigningPks] = useState<PKS | null>(null);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchTargetStatus, setBatchTargetStatus] = useState<PKS['status']>('Aktif');

  // Custom PKS Modal States
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [editingPks, setEditingPks] = useState<PKS | null>(null);

  const handleOpenCreateModal = () => {
    setEditingPks(null);
    setIsCustomModalOpen(true);
  };

  const handleOpenEditModal = (pks: PKS) => {
    setEditingPks(pks);
    setIsCustomModalOpen(true);
  };

  const handleSaveCustomPks = (pksPayload: PKS) => {
    if (editingPks) {
      onUpdatePks(pksPayload);
    } else {
      onAddPks(pksPayload);
      onPreviewPks(pksPayload);
    }
  };

  const filteredPksList = pksList.filter((pks) => {
    const matchesSearch =
      pks.pksNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pks.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || pks.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isAllSelected = filteredPksList.length > 0 && filteredPksList.every((p) => selectedIds.includes(p.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPksList.map((p) => p.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApplyBatchStatus = () => {
    if (selectedIds.length === 0) return;
    if (onBatchUpdatePksStatus) {
      onBatchUpdatePksStatus(selectedIds, batchTargetStatus);
      setSelectedIds([]);
    }
  };

  const handleApplyBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (onBatchDeletePks) {
      onBatchDeletePks(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleSaveSignaturePks = (pks: PKS, party: 1 | 2, signatureDataUrl: string) => {
    const updated: PKS = {
      ...pks,
      party1Signed: party === 1 ? !!signatureDataUrl : pks.party1Signed,
      party1SignatureData: party === 1 ? signatureDataUrl : pks.party1SignatureData,
      party2Signed: party === 2 ? !!signatureDataUrl : pks.party2Signed,
      party2SignatureData: party === 2 ? signatureDataUrl : pks.party2SignatureData,
      status:
        (party === 1 ? !!signatureDataUrl : pks.party1Signed) &&
        (party === 2 ? !!signatureDataUrl : pks.party2Signed)
          ? 'Aktif'
          : 'Menunggu TTD',
    };

    onUpdatePks(updated);
    setSigningPks(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-cyan-600" />
            Sistem Perjanjian Kerja Sama (PKS / Contract Agreement)
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Kelola dokumen PKS hukum, pasal-pasal perjanjian, dan tanda tangan digital dual-pihak PT. LDI.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-900/20 transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Buat Custom PKS Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Nomor PKS / Nama Pelanggan..."
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
            <option value="Aktif">Aktif (TTD Lengkap)</option>
            <option value="Menunggu TTD">Menunggu TTD Digital</option>
            <option value="Draft">Draft</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* Bulk Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 px-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md animate-fadeIn border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="bg-cyan-500 text-slate-950 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
              {selectedIds.length} PKS Dipilih
            </span>
            <p className="text-xs text-slate-300 hidden sm:block">Pilih tindakan masal untuk dokumen PKS terpilih</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <select
                value={batchTargetStatus}
                onChange={(e) => setBatchTargetStatus(e.target.value as PKS['status'])}
                className="bg-transparent text-xs text-white font-bold focus:outline-none px-2 py-1"
              >
                <option value="Aktif" className="text-slate-900">Status: Aktif</option>
                <option value="Menunggu TTD" className="text-slate-900">Status: Menunggu TTD</option>
                <option value="Draft" className="text-slate-900">Status: Draft</option>
                <option value="Selesai" className="text-slate-900">Status: Selesai</option>
                <option value="Dibatalkan" className="text-slate-900">Status: Dibatalkan</option>
              </select>
              <button
                onClick={handleApplyBatchStatus}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Ubah Status
              </button>
            </div>

            <button
              onClick={handleApplyBatchDelete}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus ({selectedIds.length})
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-300 hover:text-white px-2 py-1 transition cursor-pointer"
            >
              Batal Pilih
            </button>
          </div>
        </div>
      )}

      {/* PKS List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto touch-scroll no-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-600 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Nomor PKS</th>
                <th className="p-3.5">Ref SPH</th>
                <th className="p-3.5">Pelanggan (Pihak Ke-2)</th>
                <th className="p-3.5">Durasi Kontrak</th>
                <th className="p-3.5 text-right">Nilai Bulanan</th>
                <th className="p-3.5 text-center">Status TTD Digital</th>
                <th className="p-3.5 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {filteredPksList.length > 0 ? (
                filteredPksList.map((pks) => {
                  const isSelected = selectedIds.includes(pks.id);
                  return (
                    <tr
                      key={pks.id}
                      className={`border-b border-slate-100 transition ${
                        isSelected ? 'bg-cyan-50/70' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(pks.id)}
                          className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5 font-mono font-bold text-cyan-900">{pks.pksNumber}</td>
                    <td className="p-3.5 font-mono text-slate-500">{pks.sphReferenceNumber || '-'}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-800">{pks.customerName}</p>
                      <p className="text-[10px] text-slate-500">Rep: {pks.customerRepresentative}</p>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {pks.contractDurationMonths} Bulan ({formatDateIndonesian(pks.startDate)})
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      {formatIDR(pks.monthlyValue)} /Bln
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            pks.party1Signed && pks.party2Signed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pks.party1Signed && pks.party2Signed ? '✓ Legitimate (Aktif)' : 'Menunggu TTD'}
                        </span>
                        {pks.isLocked && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-[9px] font-black uppercase tracking-wider">
                            <Lock className="w-2.5 h-2.5 text-rose-600" /> TERKUNCI
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400">
                          Pihak 1: {pks.party1Signed ? '✓' : '✗'} | Pihak 2: {pks.party2Signed ? '✓' : '✗'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSigningPks(pks)}
                          className="bg-blue-900 hover:bg-blue-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1"
                        >
                          <PenTool className="w-3 h-3" />
                          TTD Digital
                        </button>

                        <button
                          onClick={() => {
                            if (pks.isLocked) {
                              alert(`Dokumen PKS ${pks.pksNumber} sedang DIKUNCI (Locked) karena PDF sudah diterbitkan. Silakan buka kunci terlebih dahulu jika ingin mengedit.`);
                              return;
                            }
                            handleOpenEditModal(pks);
                          }}
                          className={`p-1.5 rounded transition ${pks.isLocked ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-blue-900 hover:bg-slate-100'}`}
                          title={pks.isLocked ? 'Dokumen Terkunci (Buka kunci untuk mengedit)' : 'Edit Custom PKS'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onPreviewPks(pks)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Preview PKS Resmi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Lock / Unlock Toggle Button */}
                        {onToggleLockDocument && (
                          <button
                            onClick={() => onToggleLockDocument('PKS', pks.id)}
                            className={`p-1.5 rounded transition ${
                              pks.isLocked
                                ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                            title={pks.isLocked ? 'Dokumen Terkunci. Klik untuk membuka kunci.' : 'Klik untuk mengunci dokumen ini.'}
                          >
                            {pks.isLocked ? <Lock className="w-4 h-4 text-rose-600" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (pks.isLocked) {
                              alert(`Dokumen PKS ${pks.pksNumber} sedang DIKUNCI (Locked) karena sudah didownload/diterbitkan sebagai PDF. Silakan buka kunci dokumen terlebih dahulu jika ingin menghapusnya.`);
                              return;
                            }
                            onDeletePks(pks.id);
                          }}
                          className={`p-1.5 rounded transition ${pks.isLocked ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600'}`}
                          title={pks.isLocked ? 'Dokumen Terkunci (Tidak dapat dihapus)' : 'Hapus PKS'}
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
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    Belum ada Perjanjian Kerja Sama (PKS). SPH yang disetujui dapat dikonversi ke PKS.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Digital Signature Signing Modal */}
      {signingPks && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  Tanda Tangan Digital PKS Dokumen
                </h3>
                <p className="text-xs text-cyan-300 font-mono mt-0.5">{signingPks.pksNumber}</p>
              </div>
              <button onClick={() => setSigningPks(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 text-xs overflow-y-auto touch-scroll">
              <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <p className="text-blue-900 font-medium">
                  Pengesahan Tanda Tangan Digital 2-Pihak untuk Perjanjian Kerja Sama antara PT. Lintas Data Internasional dan {signingPks.customerName}.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Party 1 Sign Pad */}
                <SignaturePad
                  label="Tanda Tangan PIHAK PERTAMA (PT LDI)"
                  signerName={signingPks.party1SignerName || COMPANY_PROFILE.directorName}
                  signerPosition={signingPks.party1SignerPosition || COMPANY_PROFILE.directorPosition}
                  existingSignature={signingPks.party1SignatureData}
                  onSaveSignature={(dataUrl) => handleSaveSignaturePks(signingPks, 1, dataUrl)}
                />

                {/* Party 2 Sign Pad */}
                <SignaturePad
                  label={`Tanda Tangan PIHAK KEDUA (${signingPks.customerName})`}
                  signerName={signingPks.party2SignerName || signingPks.customerRepresentative}
                  signerPosition={signingPks.party2SignerPosition || signingPks.customerRepPosition}
                  existingSignature={signingPks.party2SignatureData}
                  onSaveSignature={(dataUrl) => handleSaveSignaturePks(signingPks, 2, dataUrl)}
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => onPreviewPks(signingPks)}
                  className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" /> Preview Dokumen PDF Lengkap
                </button>

                <button
                  type="button"
                  onClick={() => setSigningPks(null)}
                  className="px-5 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800"
                >
                  Selesai & Simpan TTD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom PKS Modal */}
      <CustomPksModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleSaveCustomPks}
        customers={customers}
        sphList={sphList}
        initialPks={editingPks}
      />
    </div>
  );
};
