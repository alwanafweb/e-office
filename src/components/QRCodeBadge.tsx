import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, ExternalLink, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface QRCodeBadgeProps {
  docNumber: string;
  docType: string;
  issueDate: string;
  compact?: boolean;
}

export const QRCodeBadge: React.FC<QRCodeBadgeProps> = ({ docNumber, docType, issueDate, compact = false }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Construct absolute verification URL strictly pointing to official e-office.ldi.co.id domain
  const verifyUrl = `https://e-office.ldi.co.id/verify?doc=${encodeURIComponent(docNumber)}`;

  // Fallback API if client-side QR generation takes a moment
  const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}&color=0f172a&bgcolor=ffffff`;

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(verifyUrl, {
      width: 250,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.warn('QR Code generation fallback:', err);
        if (isMounted) setQrDataUrl(fallbackQrUrl);
      });

    return () => {
      isMounted = false;
    };
  }, [verifyUrl, fallbackQrUrl]);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex items-center gap-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs shadow-2xs ${compact ? 'p-2' : 'p-3'}`}>
      {/* Real Scannable High-Res QR Code */}
      <a
        href={verifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Klik untuk buka Halaman Verifikasi Dokumen"
        className="w-16 h-16 sm:w-20 sm:h-20 bg-white p-1 border-2 border-slate-300 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-xs overflow-hidden relative group cursor-pointer hover:border-blue-600 transition"
      >
        <img
          src={qrDataUrl || fallbackQrUrl}
          alt={`QR Code Verifikasi ${docNumber}`}
          className="w-full h-full object-contain"
          loading="eager"
        />
        <div className="absolute inset-0 bg-blue-900/80 text-white opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center p-1 text-[9px] font-bold text-center">
          <ExternalLink className="w-4 h-4 text-cyan-300 mb-0.5" />
          <span>Verifikasi</span>
        </div>
      </a>

      <div className="flex flex-col justify-center leading-tight space-y-0.5 min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 font-black text-blue-950 text-[11px] uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Verifikasi Otentisitas ({docType})</span>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            title="Salin Link Verifikasi Dokumen"
            className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition shrink-0 print:hidden"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <p className="font-mono font-bold text-slate-900 text-[11px] truncate">
          No: {docNumber}
        </p>

        <p className="text-[10px] text-slate-600 font-medium">
          Diterbitkan: {issueDate} • PT. LINTAS DATA INTERNASIONAL
        </p>

        <p className="text-[9px] text-emerald-700 font-bold flex items-center gap-1 pt-0.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Pindai QR Code untuk Cek Keaslian Resmi (Server PT. LDI)</span>
        </p>
      </div>
    </div>
  );
};

