import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface QRCodeBadgeProps {
  docNumber: string;
  docType: string;
  issueDate: string;
}

export const QRCodeBadge: React.FC<QRCodeBadgeProps> = ({ docNumber, docType, issueDate }) => {
  // Direct verification URL pointing to the app with ?doc= parameter
  const verifyUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?doc=${encodeURIComponent(docNumber)}`
    : `https://jagoanserver.com/verify?doc=${encodeURIComponent(docNumber)}`;

  // High Resolution QR Code Image API
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}&color=0f172a&bgcolor=ffffff`;

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs shadow-2xs">
      {/* High Resolution Real Scannable QR Code */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white p-1 border-2 border-slate-300 rounded-lg flex flex-col items-center justify-center flex-shrink-0 shadow-sm overflow-hidden relative group">
        <img
          src={qrImageUrl}
          alt={`QR Code Verifikasi ${docNumber}`}
          className="w-full h-full object-contain"
          loading="eager"
        />
        <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-blue-900" />
        </div>
      </div>

      <div className="flex flex-col justify-center leading-tight space-y-0.5 min-w-0">
        <div className="flex items-center gap-1.5 font-black text-blue-950 text-[11px] uppercase tracking-wide">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Verifikasi Otentisitas Dokumen</span>
        </div>
        <p className="font-mono font-bold text-slate-900 text-[11px]">
          No: {docNumber}
        </p>
        <p className="text-[10px] text-slate-600 font-medium">
          Diterbitkan: {issueDate} • PT. LINTAS DATA INTERNASIONAL
        </p>
        <p className="text-[9px] text-emerald-700 font-bold flex items-center gap-1 pt-0.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
          Scan QR Code untuk Verifikasi Keaslian (Resmi Server PT. LDI)
        </p>
      </div>
    </div>
  );
};
