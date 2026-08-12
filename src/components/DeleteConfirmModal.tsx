import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  itemType: string; // 'Pelanggan' | 'SPH' | 'PKS' | 'Invoice' | 'Catatan Pembayaran' | 'Rekening Bank' | string;
  itemName: string;
  description?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title = 'Konfirmasi Hapus Data',
  itemType,
  itemName,
  description = 'Tindakan ini akan menghapus data secara permanen dari sistem PT. Lintas Data Internasional dan tidak dapat dikembalikan.',
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-rose-100 transform transition-all scale-100 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">{title}</h3>
              <span className="inline-block bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md mt-0.5">
                {itemType}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus <strong className="text-slate-900">{itemType}</strong> berikut?
          </p>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-slate-200/80 text-slate-700 rounded-lg shrink-0">
              <Trash2 className="w-4 h-4 text-rose-600" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Item Dihapus</p>
              <p className="font-mono font-bold text-slate-900 text-xs truncate">{itemName}</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight text-amber-800 font-medium">{description}</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-white hover:border-slate-400 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Ya, Hapus Permanent
          </button>
        </div>
      </div>
    </div>
  );
};
