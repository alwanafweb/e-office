/**
 * Mailketing API Service Module
 * Handles sending emails, user registration email dispatch, and forgot password OTP notifications.
 */

import { getWorkerUrl } from './client';

export interface MailOptions {
  recipient: string;
  cc?: string;
  subject: string;
  content: string;
  senderName?: string;
  senderEmail?: string;
  attachmentUrl?: string;
  mailketingApiKey?: string;
}

export interface MailServiceResult {
  success: boolean;
  message: string;
  data?: unknown;
}

const getMailketingApiKey = (): string => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};
  const proc = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;
  return metaEnv.VITE_MAILKETING_API_KEY || proc.VITE_MAILKETING_API_KEY || 'e6f901cb964cd1c0fb59453f3450329d';
};

const MAILKETING_API_URL = 'https://api.mailketing.co.id/api/v1/send';

/**
 * Direct client-side call to Mailketing API (used as fallback when backend /api/mail/send is unavailable or returns HTML)
 */
async function sendDirectMailketing(options: MailOptions): Promise<MailServiceResult> {
  const {
    recipient,
    cc,
    subject,
    content,
    senderName = 'PT. LINTAS DATA INTERNASIONAL',
    senderEmail = 'alwanemail@gmail.com',
    attachmentUrl,
    mailketingApiKey,
  } = options;

  const apiKey = (mailketingApiKey && mailketingApiKey.trim()) || getMailketingApiKey();

  const jsonPayload = {
    api_token: apiKey,
    api_key: apiKey,
    recipient: recipient,
    subject: subject,
    content: content,
    from_name: senderName,
    sender_name: senderName,
    from_email: senderEmail,
    sender_email: senderEmail,
    ...(cc && cc.trim() ? { cc: cc.trim() } : {}),
    ...(attachmentUrl ? { attach1: attachmentUrl } : {}),
  };

  console.group(`[MAILKETING CLIENT] Email Dispatch -> ${recipient}`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Target Endpoint:', MAILKETING_API_URL);
  console.log('Sender:', `"${senderName}" <${senderEmail}>`);
  console.log('Subject:', subject);
  console.log('Payload Headers:', { 'Content-Type': 'application/json', Accept: 'application/json' });
  console.log('Payload Body:', { ...jsonPayload, api_token: '***HIDDEN***', api_key: '***HIDDEN***' });

  try {
    const response = await fetch(MAILKETING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(jsonPayload),
    });

    const responseStatus = response.status;
    const responseContentType = response.headers.get('content-type') || '';
    const responseText = await response.text();

    console.log('Response Status:', responseStatus, response.statusText);
    console.log('Response Content-Type:', responseContentType);
    console.log('Response Body:', responseText.length > 300 ? responseText.substring(0, 300) + '...' : responseText);
    console.groupEnd();

    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // Ignore text parse
    }

    if (responseData.status === 'success' || responseData.response === 'Mail Sent' || responseText.includes('Mail Sent')) {
      return {
        success: true,
        message: `Email terkirim ke ${recipient} via Mailketing API.`,
        data: responseData,
      };
    }

    if (responseText.includes('<html') || responseText.includes('<!DOCTYPE') || responseContentType.includes('text/html')) {
      return {
        success: false,
        message: `Respon Mailketing berupa halaman HTML (${responseStatus}). Pastikan Email Pengirim (${senderEmail}) telah terverifikasi di dashboard Mailketing.co.id.`,
        data: responseData,
      };
    }

    if (
      responseData.status === 'failed' ||
      responseData.status === 'error' ||
      responseText.includes('Access Denied') ||
      responseText.includes('Invalid Token') ||
      responseText.includes('User Not Found') ||
      responseText.includes('Wrong API Token')
    ) {
      const errDetail = responseData.response || responseData.message || responseText;
      let msg = `Gagal mengirim email via Mailketing: ${errDetail}`;
      if (
        typeof errDetail === 'string' &&
        (errDetail.includes('Access Denied') ||
          errDetail.includes('Invalid Token') ||
          errDetail.includes('User Not Found') ||
          errDetail.includes('Wrong API Token'))
      ) {
        msg = 'Akses Ditolak Mailketing API (Token API tidak valid atau tidak terdaftar). Silakan periksa kembali API Key Mailketing Anda di Pengaturan Perusahaan.';
      }
      return {
        success: false,
        message: msg,
        data: responseData,
      };
    }

    return {
      success: true,
      message: `Email terkirim ke ${recipient} via Mailketing API.`,
      data: responseData,
    };
  } catch (err: any) {
    console.error('Direct Mailketing fetch error:', err);
    console.groupEnd();

    const isCorsOrNetwork = err.message?.includes('Failed to fetch') || err.name === 'TypeError';
    const detailMsg = isCorsOrNetwork
      ? `Gagal terhubung ke Backend Server (/api/mail/send).\n\nSebab: Server Node.js di VPS belum berjalan atau Nginx belum memproksi rute /api/ ke port 3000. (Mailketing API memblokir request langsung dari browser via CORS, sehingga WAJIB melewati server backend). Jalankan 'update-app' atau './fix-backend.sh' di terminal VPS untuk mengaktifkannya.`
      : `Gagal terhubung ke Mailketing API: ${err.message || 'Network error'}`;
    return {
      success: false,
      message: detailMsg,
    };
  }
}

/**
 * Sends a generic email using Mailketing API
 */
export async function sendEmail(options: MailOptions): Promise<MailServiceResult> {
  const {
    recipient,
    cc,
    subject,
    content,
    senderName = 'PT. LINTAS DATA INTERNASIONAL',
    senderEmail = 'alwanemail@gmail.com',
    attachmentUrl,
    mailketingApiKey,
  } = options;

  const baseUrl = getWorkerUrl();
  const mailApiEndpoint = `${baseUrl}/api/mail/send`;

  try {
    const response = await fetch(mailApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient,
        cc,
        subject,
        htmlContent: content,
        senderName,
        senderEmail,
        attachmentUrl,
        mailketingApiKey,
      }),
    });

    const responseText = await response.text();

    // If backend proxy endpoint returns HTML or non-JSON (e.g. static host SPA fallback index.html), fall back to direct fetch
    if (!response.ok || responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
      console.warn(`Backend proxy ${mailApiEndpoint} returned HTML/Non-API response (${response.status}). Executing direct Mailketing fallback.`);
      return sendDirectMailketing(options);
    }

    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.warn('Failed to parse backend JSON response. Executing direct Mailketing fallback.');
      return sendDirectMailketing(options);
    }

    if (responseData.success) {
      return {
        success: true,
        message: responseData.message || 'Email berhasil terkirim via Mailketing API.',
        data: responseData,
      };
    } else {
      // If backend returned explicit failure JSON (e.g. Invalid token), return failure
      return {
        success: false,
        message: responseData.message || responseData.error || 'Gagal mengirim email via Mailketing API.',
        data: responseData,
      };
    }
  } catch (err: any) {
    console.warn('Backend proxy fetch failed. Executing direct Mailketing fallback.', err);
    return sendDirectMailketing(options);
  }
}

/**
 * Dispatches welcome & registration email for new user/admin
 */
export async function registerUser(
  name: string,
  email: string
): Promise<MailServiceResult> {
  const subject = `[PT. LDI] Konfirmasi Pendaftaran Akun Admin - ${name}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
      <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; color: #38bdf8;">PT. LINTAS DATA INTERNASIONAL</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Portal Manajemen Administrator Enterprise</p>
      </div>
      <div style="padding: 24px;">
        <h3 style="color: #0369a1; margin-top: 0;">Pendaftaran Akun Admin Berhasil 🎉</h3>
        <p>Halo <strong>${name}</strong>,</p>
        <p>Selamat! Akun Administrator Anda di Portal PT. Lintas Data Internasional telah berhasil didaftarkan.</p>
        <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Detail Akun Anda:</strong></p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
            <li><strong>Nama Lengkap:</strong> ${name}</li>
            <li><strong>Email Resmi:</strong> ${email}</li>
            <li><strong>Hak Akses:</strong> Administrator System (ADMIN)</li>
            <li><strong>Waktu Pendaftaran:</strong> ${new Date().toLocaleString('id-ID')}</li>
          </ul>
        </div>
        <p style="font-size: 13px; color: #475569;">Gunakan email dan kata sandi yang Anda daftarkan untuk masuk ke Dashboard Admin PT. LDI.</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          Email ini dikirim secara otomatis oleh Mailketing Gateway PT. LDI. Harap tidak membalas email ini secara langsung.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    recipient: email,
    subject,
    content: htmlContent,
  });
}

/**
 * Dispatches Forgot Password OTP email to user/admin
 */
export async function forgotPassword(
  email: string,
  otpCode: string
): Promise<MailServiceResult> {
  const subject = `[PT. LDI] Kode OTP Reset Password Admin (${otpCode})`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; color: #0f172a;">
      <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; color: #38bdf8;">PT. LINTAS DATA INTERNASIONAL</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Layanan Reset Kata Sandi Admin</p>
      </div>
      <div style="padding: 24px;">
        <h3 style="color: #0f172a; margin-top: 0;">Permintaan Reset Password</h3>
        <p>Halo Admin,</p>
        <p>Kami menerima permintaan untuk mereset kata sandi akun Admin PT. LDI yang terdaftar dengan email: <strong>${email}</strong>.</p>
        <div style="background-color: #f0f9ff; border: 2px dashed #0284c7; padding: 20px; text-align: center; margin: 20px 0; border-radius: 12px;">
          <p style="margin: 0; font-size: 12px; color: #0369a1; font-weight: bold; text-transform: uppercase;">Kode OTP Reset Password Anda:</p>
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #0f172a; margin: 10px 0; font-family: monospace;">
            ${otpCode}
          </div>
          <p style="margin: 0; font-size: 11px; color: #64748b;">Masa berlaku kode OTP ini adalah 15 menit.</p>
        </div>
        <p style="font-size: 13px; color: #334155;">Masukkan kode OTP di atas pada portal reset password untuk melanjutkan pembuatan kata sandi baru Anda.</p>
        <p style="font-size: 12px; color: #ef4444; margin-top: 16px;">
          ⚠️ Jika Anda tidak merasa melakukan permintaan ini, segera abaikan email ini atau hubungi Tim Security IT PT. LDI.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    recipient: email,
    subject,
    content: htmlContent,
  });
}
