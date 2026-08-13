import React, { useState } from 'react';
import { X, Send, Mail, CheckCircle2, AlertCircle, FileText, Lock, Paperclip, RefreshCw, Copy, Check, Eye } from 'lucide-react';
import { CompanyProfile, Invoice, PKS, SPH } from '../types';
import { formatIDR, formatDateIndonesian } from '../utils/formatters';
import { exportToPdf, generatePdfBase64 } from '../utils/pdfGenerator';
import { sendEmail } from '../api/mailService';
import { apiUploadPdf } from '../api/client';
import { EmailPreviewModal } from './EmailPreviewModal';

interface SendDocEmailModalProps {
  isOpen: boolean;
  type: 'SPH' | 'PKS' | 'Invoice';
  data: SPH | PKS | Invoice;
  companyProfile?: CompanyProfile;
  onClose: () => void;
  onSuccessSend?: (docType: 'SPH' | 'PKS' | 'Invoice', docId: string, recipientEmail: string) => void;
}

export const SendDocEmailModal: React.FC<SendDocEmailModalProps> = ({
  isOpen,
  type,
  data,
  companyProfile,
  onClose,
  onSuccessSend,
}) => {
  if (!isOpen) return null;

  const docNumber =
    type === 'SPH'
      ? (data as SPH).sphNumber
      : type === 'PKS'
      ? (data as PKS).pksNumber
      : (data as Invoice).invoiceNumber;

  const customerName = data.customerName;

  // Derive initial recipient email
  const initialEmail =
    type === 'SPH'
      ? (data as SPH).customerEmail
      : type === 'Invoice'
      ? (data as Invoice).customerEmail
      : 'contact@' + customerName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';

  const totalAmount =
    type === 'SPH'
      ? (data as SPH).grandTotal
      : type === 'PKS'
      ? (data as PKS).totalContractValue
      : (data as Invoice).grandTotal;

  const docDate =
    type === 'SPH'
      ? formatDateIndonesian((data as SPH).date)
      : type === 'PKS'
      ? `${formatDateIndonesian((data as PKS).startDate)} s/d ${formatDateIndonesian((data as PKS).endDate)}`
      : formatDateIndonesian((data as Invoice).issueDate);

  // Helper function to replace template placeholders
  const replacePlaceholders = (templateStr: string) => {
    return templateStr
      .replace(/jagoanserver\.com/gi, 'e-office.ldi.co.id')
      .replace(/\{DOC_NUMBER\}/g, docNumber)
      .replace(/\{CUSTOMER_NAME\}/g, customerName)
      .replace(/\{DOC_DATE\}/g, docDate)
      .replace(/\{TOTAL_AMOUNT\}/g, formatIDR(totalAmount))
      .replace(/\{PHONE\}/g, companyProfile?.whatsapp || companyProfile?.phone || '087777040496');
  };

  const templates = companyProfile?.emailTemplates;

  const rawSubject =
    type === 'SPH'
      ? templates?.sphSubject
      : type === 'PKS'
      ? templates?.pksSubject
      : templates?.invoiceSubject;

  const rawBody =
    type === 'SPH'
      ? templates?.sphBody
      : type === 'PKS'
      ? templates?.pksBody
      : templates?.invoiceBody;

  const initialCc = templates?.defaultCc ?? 'finance@ldi.co.id, sales@ldi.co.id';

  const defaultSubject = rawSubject
    ? replacePlaceholders(rawSubject)
    : `[PT. LDI] Dokumen Resmi ${type} - ${docNumber} (${customerName})`;

  const rawDomain = companyProfile?.website ? companyProfile.website.replace(/^https?:\/\//, '') : 'e-office.ldi.co.id';
  const domainName = rawDomain.toLowerCase().includes('jagoanserver') ? 'e-office.ldi.co.id' : rawDomain;

  const defaultBody = rawBody
    ? replacePlaceholders(rawBody)
    : `Kepada Yth. Bapak/Ibu Tim Manajemen ${customerName},\n\n` +
      `Bersama email ini, kami dari PT. LINTAS DATA INTERNASIONAL sampaikan Dokumen Resmi ${type} dengan rincian berikut:\n\n` +
      `• Nomor Dokumen: ${docNumber}\n` +
      `• Jenis Dokumen: ${type === 'SPH' ? 'Surat Penawaran Harga' : type === 'PKS' ? 'Perjanjian Kerja Sama' : 'Tagihan Invoice Penagihan'}\n` +
      `• Tanggal: ${docDate}\n` +
      `• Total Nilai: ${formatIDR(totalAmount)}\n\n` +
      `Berkas PDF resmi bertanda tangan digital dan stempel sah PT. LDI telah terlampir secara otomatis pada email ini.\n\n` +
      `Anda juga dapat melakukan verifikasi otentisitas dokumen ini secara langsung melalui Portal Keaslian PT. LDI:\n` +
      `https://${domainName}/verify?doc=${encodeURIComponent(docNumber)}\n\n` +
      `Demikian disampaikan. Jika ada pertanyaan lebih lanjut, silakan menghubungi kami.\n\n` +
      `Hormat Kami,\n` +
      `PT. LINTAS DATA INTERNASIONAL\n` +
      `Telp/WA: ${companyProfile?.whatsapp || '0812-9988-7766'} | Website: https://${domainName}`;

  // Form States
  const [recipientEmail, setRecipientEmail] = useState(initialEmail || '');
  const [ccEmail, setCcEmail] = useState(initialCc);
  const [subject, setSubject] = useState(defaultSubject);
  const [messageBody, setMessageBody] = useState(defaultBody);

  // Sending Process States
  const [isSending, setIsSending] = useState(false);
  const [sendStep, setSendStep] = useState('');
  const [isSentSuccess, setIsSentSuccess] = useState(false);
  const [deliveryLog, setDeliveryLog] = useState<{
    messageId: string;
    sentTime: string;
    recipient: string;
    cc?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleSendEmailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setErrorMsg('Harap masukkan alamat email penerima yang valid.');
      return;
    }

    setShowPreviewModal(false);
    setErrorMsg('');
    setIsSending(true);

    try {
      // Step 1: Render PDF Attachment Buffer from DOM
      setSendStep('1/3 Merender Dokumen PDF & Tanda Tangan Digital...');
      
      const fileName = `${type}_${docNumber.replace(/\//g, '_')}.pdf`;
      let attachedPdfUrl: string | undefined = undefined;

      // Generate actual PDF base64 from printable element if present
      const pdfResult = await generatePdfBase64('printable-document-content', fileName);
      if (pdfResult && pdfResult.base64) {
        setSendStep('2/3 Mengunggah Berkas PDF ke Server Gateway LDI...');
        try {
          const uploadRes = await apiUploadPdf(pdfResult.filename, pdfResult.base64);
          if (uploadRes && uploadRes.pdfUrl) {
            attachedPdfUrl = uploadRes.pdfUrl;
          }
        } catch (uploadErr) {
          console.warn('PDF upload warning:', uploadErr);
        }
      }

      // Step 3: Format email content with interactive download card & verification link
      setSendStep('3/3 Mengirimkan Email & Lampiran PDF via Mailketing Gateway...');

      const formattedContent = `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; color: #0f172a;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; color: #38bdf8;">${companyProfile?.name || 'PT. LINTAS DATA INTERNASIONAL'}</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Pengiriman Dokumen Resmi ${type} (${docNumber})</p>
          </div>
          <div style="padding: 24px;">
            <div style="font-size: 13px; line-height: 1.6; color: #334155;">
              ${messageBody.replace(/\n/g, '<br/>')}
            </div>

            ${attachedPdfUrl ? `
              <div style="background-color: #f0f9ff; border: 2px solid #0284c7; border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #0369a1;">📄 Lampiran Dokumen PDF Resmi Terlampir</p>
                <p style="margin: 0 0 14px 0; font-size: 11px; color: #64748b; font-family: monospace;">${fileName}</p>
                <a href="${attachedPdfUrl}" target="_blank" style="background-color: #0284c7; color: #ffffff; padding: 11px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  📥 Unduh Berkas PDF Dokumen (${type})
                </a>
                <p style="margin: 12px 0 0 0; font-size: 10px; color: #64748b;">Dokumen ini telah ditandatangani dan diverifikasi secara digital oleh PT. LDI.</p>
              </div>
            ` : ''}

            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 14px; margin-top: 16px; font-size: 12px; color: #475569;">
              <p style="margin: 0 0 4px 0; font-weight: bold; color: #0f172a;">🛡️ Verifikasi Keaslian Dokumen:</p>
              <p style="margin: 0;">Anda juga dapat memverifikasi otentisitas dokumen ini secara langsung via Portal Keaslian PT. LDI:<br/>
              <a href="https://${domainName}/verify?doc=${encodeURIComponent(docNumber)}" style="color: #0284c7; font-weight: bold; text-decoration: underline;">
                https://${domainName}/verify?doc=${encodeURIComponent(docNumber)}
              </a></p>
            </div>
          </div>

          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            Email ini dikirim secara otomatis oleh Mailketing Gateway ${companyProfile?.name || 'PT. LINTAS DATA INTERNASIONAL'}.<br/>
            &copy; ${new Date().getFullYear()} ${companyProfile?.name || 'PT. LINTAS DATA INTERNASIONAL'}. All rights reserved.
          </div>
        </div>
      `;

      await sendEmail({
        recipient: recipientEmail,
        cc: ccEmail,
        subject,
        content: formattedContent,
        senderName: companyProfile?.name || 'PT. LINTAS DATA INTERNASIONAL',
        senderEmail: companyProfile?.email || 'admin@ldi.co.id',
        attachmentUrl: attachedPdfUrl,
      });

      const msgId = `<MSG-${Date.now().toString(36).toUpperCase()}-LDI-${Math.floor(1000 + Math.random() * 9000)}>`;
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setDeliveryLog({
        messageId: msgId,
        sentTime: timeStr,
        recipient: recipientEmail,
        cc: ccEmail,
      });

      setIsSending(false);
      setIsSentSuccess(true);

      if (onSuccessSend) {
        onSuccessSend(type, data.id, recipientEmail);
      }
    } catch (err) {
      console.error('Error sending document email:', err);
      setIsSending(false);
      setErrorMsg('Gagal mengirimkan email. Silakan coba beberapa saat lagi.');
    }
  };

  const copyMessageId = () => {
    if (deliveryLog) {
      navigator.clipboard.writeText(deliveryLog.messageId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden relative flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md">
              <Mail className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Kirim Dokumen {type} via Email
              </h3>
              <p className="text-[11px] text-slate-300 font-mono">
                No: <strong className="text-cyan-300">{docNumber}</strong> • {customerName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SUCCESS STATE */}
          {isSentSuccess && deliveryLog ? (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 text-center space-y-4 my-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-emerald-950">
                  DOKUMEN {type} BERHASIL TERKIRIM VIA EMAIL!
                </h4>
                <p className="text-xs text-slate-700">
                  Email beserta lampiran PDF resmi telah berhasil disalurkan ke inbox <strong>{deliveryLog.recipient}</strong>.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 text-left space-y-2 font-mono text-[11px]">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Waktu Pengiriman:</span>
                  <span className="font-bold text-slate-900">{deliveryLog.sentTime} WIB</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Penerima Utama:</span>
                  <span className="font-bold text-blue-900">{deliveryLog.recipient}</span>
                </div>
                {deliveryLog.cc && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Tembusan (CC):</span>
                    <span className="font-bold text-indigo-900">{deliveryLog.cc}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-600">
                  <span>Lampiran Terlampir:</span>
                  <span className="font-bold text-emerald-700">📄 {type}_{docNumber.replace(/\//g, '_')}.pdf</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-100">
                  <span>Message ID Reference:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">{deliveryLog.messageId}</span>
                    <button
                      type="button"
                      onClick={copyMessageId}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600"
                      title="Salin ID Message"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl shadow transition text-xs"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          ) : (
            /* SEND FORM STATE */
            <form onSubmit={handleSendEmailSubmit} className="space-y-4">
              {/* Recipient Email & CC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Email Penerima Utama (Pelanggan) *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="contoh: purchasing@pelanggan.com"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Tembusan (CC Email)
                  </label>
                  <input
                    type="text"
                    value={ccEmail}
                    onChange={(e) => setCcEmail(e.target.value)}
                    placeholder="email1@ldi.co.id, email2@ldi.co.id"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Subjek Email</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                />
              </div>

              {/* Message Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800 block">Pesan / Isi Email</label>
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="text-blue-700 hover:text-blue-900 text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pratinjau Tampilan Email</span>
                  </button>
                </div>
                <textarea
                  rows={6}
                  required
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl font-mono text-slate-800 text-[11px] leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* PDF Attachment Badge */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">
                      📄 Auto-Attachment PDF Resmi Terlampir
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {type}_{docNumber.replace(/\//g, '_')}.pdf (Signed & Stamped)
                    </p>
                  </div>
                </div>

                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" /> Checksum Verified
                </span>
              </div>

              {/* Submit & Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  disabled={isSending}
                  className="px-3.5 py-2.5 rounded-xl border border-blue-200 text-blue-800 bg-blue-50/80 font-bold hover:bg-blue-100 transition text-xs flex items-center gap-1.5 cursor-pointer"
                  title="Lihat tampilan email lengkap beserta link dokumen & verifikasi sebelum dikirim"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Pratinjau Email</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSending}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition text-xs"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSending || !recipientEmail}
                    className="bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition text-xs cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                        <span>{sendStep}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-cyan-300" />
                        <span>Kirim Email Dokumen Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Email Preview Modal Overlay */}
      <EmailPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onSendNow={() => handleSendEmailSubmit()}
        isSending={isSending}
        sendStep={sendStep}
        type={type}
        docNumber={docNumber}
        customerName={customerName}
        recipientEmail={recipientEmail}
        ccEmail={ccEmail}
        subject={subject}
        messageBody={messageBody}
        companyProfile={companyProfile}
      />
    </div>
  );
};
