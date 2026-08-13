import React, { useState } from 'react';
import { X, Send, Mail, Monitor, Smartphone, Paperclip, Lock, ShieldCheck, RefreshCw, CheckCircle2, ArrowLeft, ExternalLink } from 'lucide-react';
import { CompanyProfile } from '../types';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendNow: () => void;
  isSending?: boolean;
  sendStep?: string;
  type: 'SPH' | 'PKS' | 'Invoice';
  docNumber: string;
  customerName: string;
  recipientEmail: string;
  ccEmail?: string;
  subject: string;
  messageBody: string;
  companyProfile?: CompanyProfile;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  onSendNow,
  isSending = false,
  sendStep = '',
  type,
  docNumber,
  customerName,
  recipientEmail,
  ccEmail,
  subject,
  messageBody,
  companyProfile,
}) => {
  if (!isOpen) return null;

  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const fileName = `${type}_${docNumber.replace(/\//g, '_')}.pdf`;
  const domainName = companyProfile?.website ? companyProfile.website.replace(/^https?:\/\//, '') : 'e-office.ldi.co.id';
  const verifyUrl = `https://${domainName}/verify?doc=${encodeURIComponent(docNumber)}`;

  const companyName = companyProfile?.name || 'PT. LINTAS DATA INTERNASIONAL';
  const companyEmail = companyProfile?.email || 'admin@ldi.co.id';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in print:hidden">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-4xl w-full overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header Bar */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              <Mail className="w-4 h-4 text-cyan-200" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                Pratinjau Tampilan Email (Email Preview)
                <span className="bg-blue-900/80 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full border border-blue-700 font-mono">
                  Live Client Render
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Melihat persis bagaimana email akan diterima oleh pelanggan sebelum dikirim.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Device Switcher */}
            <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  deviceMode === 'desktop'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="Tampilan Desktop / Laptop"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  deviceMode === 'mobile'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title="Tampilan Layar HP / Mobile"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Client Header Metadata */}
        <div className="bg-slate-800/80 p-3 sm:p-4 border-b border-slate-700 space-y-1.5 text-xs text-slate-300 font-mono shrink-0">
          <div className="flex items-start sm:items-center gap-2">
            <span className="text-slate-500 w-16 shrink-0 font-sans font-bold">Subjek:</span>
            <span className="font-bold text-white text-xs sm:text-sm truncate">{subject || '(Tanpa Subjek)'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 w-16 shrink-0 font-sans font-bold">Pengirim:</span>
            <span className="text-cyan-300 font-semibold truncate">
              {companyName} &lt;{companyEmail}&gt;
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 w-16 shrink-0 font-sans font-bold">Penerima:</span>
            <span className="text-emerald-400 font-bold truncate">{recipientEmail || '(Belum Diisi)'}</span>
          </div>

          {ccEmail && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 w-16 shrink-0 font-sans font-bold">CC:</span>
              <span className="text-indigo-300 truncate">{ccEmail}</span>
            </div>
          )}
        </div>

        {/* Body Render Frame */}
        <div className="flex-1 bg-slate-950 p-4 overflow-y-auto flex justify-center items-start">
          <div
            className={`transition-all duration-300 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 ${
              deviceMode === 'mobile' ? 'w-[360px] max-w-full' : 'w-[620px] max-w-full'
            }`}
          >
            {/* Corporate Email Banner */}
            <div className="bg-slate-900 p-6 text-center text-white">
              <h2 className="m-0 text-lg font-black uppercase tracking-wider text-cyan-400">
                {companyName}
              </h2>
              <p className="m-0 mt-1 text-xs text-slate-400 font-medium">
                Pengiriman Dokumen Resmi {type} ({docNumber})
              </p>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5">
              {/* Message Content */}
              <div
                className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: messageBody
                    ? messageBody.replace(/\n/g, '<br/>')
                    : '<i class="text-slate-400">Isi pesan kosong...</i>',
                }}
              />

              {/* Attachment Preview Card */}
              <div className="bg-sky-50 border-2 border-sky-500/80 rounded-xl p-4 text-center space-y-2">
                <p className="m-0 text-xs font-bold text-sky-900 flex items-center justify-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-sky-600" />
                  Lampiran Dokumen PDF Resmi Terlampir
                </p>
                <p className="m-0 text-[11px] text-slate-500 font-mono">{fileName}</p>

                <div className="pt-1">
                  <span className="bg-sky-600 text-white px-4 py-2 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 shadow-sm">
                    📥 Unduh Berkas PDF Dokumen ({type})
                  </span>
                </div>
                <p className="m-0 text-[10px] text-slate-500 pt-1">
                  Dokumen ini telah ditandatangani dan diverifikasi secara digital oleh PT. LDI.
                </p>
              </div>

              {/* Portal Verification Card */}
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
                <p className="m-0 font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verifikasi Keaslian Dokumen:
                </p>
                <p className="m-0 text-[11px] text-slate-600 leading-normal">
                  Anda juga dapat memverifikasi otentisitas dokumen ini secara langsung via Portal Keaslian PT. LDI:
                </p>
                <a
                  href={verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-700 font-bold underline text-[11px] break-all inline-flex items-center gap-1 hover:text-sky-900"
                >
                  {verifyUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Email Footer */}
            <div className="bg-slate-100 p-4 text-center text-[11px] text-slate-500 border-t border-slate-200">
              Email ini dikirim secara otomatis oleh Mailketing Gateway {companyName}.<br />
              &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
            </div>
          </div>
        </div>

        {/* Footer Actions Bar */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold transition text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali Edit Pesan</span>
          </button>

          <button
            type="button"
            onClick={onSendNow}
            disabled={isSending || !recipientEmail}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition text-xs"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                <span>{sendStep || 'Mengirim...'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-cyan-200" />
                <span>Kirim Email Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
