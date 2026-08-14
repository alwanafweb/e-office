import React, { useState } from 'react';
import { X, Send, Mail, Monitor, Smartphone, Paperclip, Lock, ShieldCheck, RefreshCw, CheckCircle2, ArrowLeft, ExternalLink } from 'lucide-react';
import { CompanyProfile, Customer, Invoice, PKS, SPH } from '../types';
import { extractEmailPlaceholderData } from '../utils/emailTemplateHelper';
import { formatIDR } from '../utils/formatters';

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
  data?: SPH | PKS | Invoice;
  customers?: Customer[];
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
  data,
  customers,
}) => {
  if (!isOpen) return null;

  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const fileName = `${type}_${docNumber.replace(/[\/\\]/g, '_')}.pdf`;
  const meta = data ? extractEmailPlaceholderData(type, data, companyProfile, customers) : null;
  const rawDomain = companyProfile?.website ? companyProfile.website.replace(/^https?:\/\//, '') : 'e-office.ldi.co.id';
  const domainName = rawDomain.toLowerCase().includes('jagoanserver') ? 'e-office.ldi.co.id' : rawDomain;
  const verifyUrl = `https://${domainName}/verify?doc=${encodeURIComponent(docNumber)}`;

  const companyName = companyProfile?.name || 'PT. LINTAS DATA INTERNASIONAL';
  const companyEmail = companyProfile?.email || 'admin@ldi.co.id';

  // Helper to format plain text message body with clickable URLs and converted domain
  const formatMessageBodyToHtml = (body: string) => {
    if (!body) return '<i class="text-slate-400">Isi pesan kosong...</i>';

    // Replace any remaining jagoanserver.com references
    let cleanBody = body.replace(/jagoanserver\.com/gi, 'e-office.ldi.co.id');

    // Escape basic HTML special chars
    const escaped = cleanBody
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Regex to match http/https URLs
    const urlRegex = /(https?:\/\/[^\s<]+)/g;

    const blocks = escaped.split('\n\n');
    return blocks
      .map((block) => {
        const formattedLines = block.split('\n').map((line) => {
          let formattedLine = line.replace(urlRegex, (url) => {
            let cleanUrl = url;
            let trailingPunct = '';
            if (/[.,;!?]$/.test(cleanUrl)) {
              trailingPunct = cleanUrl.slice(-1);
              cleanUrl = cleanUrl.slice(0, -1);
            }
            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-bold underline hover:text-blue-800 break-all inline-flex items-center gap-0.5">${cleanUrl}</a>${trailingPunct}`;
          });

          if (formattedLine.startsWith('•') || formattedLine.startsWith('-')) {
            return `<div class="pl-2 my-0.5 text-slate-800">${formattedLine}</div>`;
          }
          if (formattedLine.startsWith('📋') || formattedLine.startsWith('📦') || formattedLine.startsWith('💰') || formattedLine.startsWith('🏦') || formattedLine.startsWith('🛡️')) {
            return `<div class="font-bold text-slate-900 mt-2 mb-1 uppercase tracking-wide text-xs">${formattedLine}</div>`;
          }
          return formattedLine;
        });

        return `<p class="mb-3 leading-relaxed text-slate-700">${formattedLines.join('<br/>')}</p>`;
      })
      .join('');
  };

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
                Melihat persis bagaimana email dan rincian dokumen akan diterima oleh pelanggan di inbox.
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
            <div className="bg-slate-900 p-6 text-center text-white border-b-2 border-sky-500">
              <h2 className="m-0 text-lg font-black uppercase tracking-wider text-cyan-400">
                {companyName}
              </h2>
              <p className="m-0 mt-1 text-xs text-slate-400 font-medium">
                Portal Dokumen Resmi Enterprise &bull; {type === 'Invoice' ? 'Faktur Tagihan (Invoice)' : type === 'SPH' ? 'Surat Penawaran Harga (SPH)' : 'Perjanjian Kerja Sama (PKS)'}
              </p>
            </div>

            {/* Document Info Strip */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Nomor Dokumen:</span>
                <strong className="text-xs font-mono text-slate-900">{docNumber}</strong>
              </div>
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${
                  type === 'Invoice'
                    ? (meta?.paymentStatus === 'LUNAS'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300')
                    : 'bg-sky-100 text-sky-800 border-sky-300'
                }`}
              >
                {type === 'Invoice' ? `STATUS: ${meta?.paymentStatus || 'BELUM BAYAR'}` : type}
              </span>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              {/* Message Content */}
              <div
                className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans"
                dangerouslySetInnerHTML={{
                  __html: formatMessageBodyToHtml(messageBody),
                }}
              />

              {/* Invoice Items Summary Box */}
              {type === 'Invoice' && meta && (
                <div className="border border-slate-300 rounded-xl overflow-hidden bg-white my-4 shadow-sm">
                  <div className="bg-slate-900 text-white px-3.5 py-2 font-bold text-xs uppercase tracking-wide flex items-center justify-between">
                    <span>Rincian Tagihan Layanan</span>
                    <span className="font-mono text-[11px] text-cyan-300 font-normal">#{docNumber}</span>
                  </div>
                  <div className="p-3 text-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-600 text-[11px] border-b border-slate-100 pb-2">
                      <span>Jatuh Tempo: <strong className="text-rose-700 font-bold">{meta.dueDate}</strong></span>
                      <span>Tanggal: <strong className="text-slate-800">{meta.docDate}</strong></span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal Tagihan:</span>
                        <span className="font-mono font-medium text-slate-800">{formatIDR(meta.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>PPN ({meta.taxPercent}%):</span>
                        <span className="font-mono font-medium text-slate-800">{formatIDR(meta.taxAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sky-950 font-black text-xs pt-2 border-t-2 border-sky-600">
                        <span className="uppercase">Total Tagihan (Grand Total):</span>
                        <span className="font-mono text-sm text-sky-700 font-black">{formatIDR(meta.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Official Bank Account Card */}
              {type === 'Invoice' && meta && (
                <div className="bg-slate-50 border-2 border-dashed border-sky-600 rounded-xl p-4 my-4 space-y-1">
                  <p className="text-[10px] font-black text-sky-800 uppercase tracking-wide flex items-center gap-1.5">
                    🏦 Rekening Pembayaran Resmi PT. LDI:
                  </p>
                  <p className="font-bold text-xs text-slate-900">{meta.bankName}</p>
                  <p className="font-mono text-base font-black text-sky-700 tracking-wider my-0.5">
                    {meta.bankAccount}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    a.n. <strong>{meta.bankHolder}</strong> {meta.bankBranch ? `• Cabang: ${meta.bankBranch}` : ''}
                  </p>
                  {meta.bankNotes && (
                    <p className="text-[10px] text-slate-500 italic mt-1 pt-1 border-t border-slate-200">
                      * {meta.bankNotes}
                    </p>
                  )}
                </div>
              )}

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
              Email ini dikirim secara otomatis oleh Gateway Resmi {companyName}.<br />
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
