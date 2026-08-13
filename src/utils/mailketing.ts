/**
 * Service Utility untuk Integrasi API Mailketing
 * API Key: 5aafffa0c30e5a87235b66f6e1c0e440
 */

import { sendEmail } from '../api/mailService';

export interface SendEmailOptions {
  recipient: string;
  cc?: string;
  subject: string;
  content: string;
  senderName?: string;
  senderEmail?: string;
}

export interface MailketingResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Mengirim Email Menggunakan API Mailketing via Backend Proxy Server
 */
export async function sendMailketingEmail(options: SendEmailOptions): Promise<MailketingResponse> {
  const { recipient, cc, subject, content, senderName = 'PT. LINTAS DATA INTERNASIONAL', senderEmail = 'alwanemail@gmail.com' } = options;

  try {
    const res = await sendEmail({
      recipient,
      cc,
      subject,
      content,
      senderName,
      senderEmail,
    });

    return {
      success: res.success,
      message: res.message,
      data: res.data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal mengirim email: ${err.message || 'Network error'}`,
    };
  }
}

/**
 * 1. Kirim Email Notifikasi Pendaftaran Akun Admin Baru
 */
export async function sendRegisterNotificationEmail(
  adminName: string,
  adminEmail: string
): Promise<MailketingResponse> {
  const subject = `[PT. LDI] Konfirmasi Pendaftaran Akun Admin Baru - ${adminName}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
      <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; color: #38bdf8;">PT. LINTAS DATA INTERNASIONAL</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Portal Manajemen Administrator Enterprise</p>
      </div>
      <div style="padding: 24px;">
        <h3 style="color: #0369a1; margin-top: 0;">Pendaftaran Akun Admin Berhasil 🎉</h3>
        <p>Halo <strong>${adminName}</strong>,</p>
        <p>Selamat! Akun Administrator Anda di Portal PT. Lintas Data Internasional telah berhasil didaftarkan.</p>
        <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Detail Akun Anda:</strong></p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
            <li><strong>Nama Lengkap:</strong> ${adminName}</li>
            <li><strong>Email Resmi:</strong> ${adminEmail}</li>
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

  return sendMailketingEmail({
    recipient: adminEmail,
    subject,
    content: htmlContent,
  });
}

/**
 * 2. Kirim Email Kode OTP / Instruksi Reset Password Admin
 */
export async function sendForgotPasswordOtpEmail(
  adminEmail: string,
  otpCode: string
): Promise<MailketingResponse> {
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
        <p>Kami menerima permintaan untuk mereset kata sandi akun Admin PT. LDI yang terdaftar dengan email: <strong>${adminEmail}</strong>.</p>
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

  return sendMailketingEmail({
    recipient: adminEmail,
    subject,
    content: htmlContent,
  });
}

/**
 * 3. Kirim Email Peringatan Keamanan Login Admin
 */
export async function sendLoginAlertEmail(
  adminName: string,
  adminEmail: string
): Promise<MailketingResponse> {
  const subject = `[PT. LDI] Notifikasi Keamanan: Sesi Login Admin Aktif (${adminName})`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
      <div style="background-color: #0f172a; padding: 20px; text-align: center; color: #ffffff;">
        <h3 style="margin: 0; font-size: 18px; color: #38bdf8;">PT. LINTAS DATA INTERNASIONAL</h3>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">Sistem Peringatan Keamanan Akses Portal</p>
      </div>
      <div style="padding: 24px;">
        <h4 style="color: #0f172a; margin-top: 0; font-size: 16px;">Sesi Login Berhasil Terdeteksi</h4>
        <p style="font-size: 13px;">Halo <strong>${adminName}</strong>,</p>
        <p style="font-size: 13px;">Akun Administrator Anda baru saja berhasil masuk ke Portal Sistem PT. LINTAS DATA INTERNASIONAL.</p>
        <div style="background-color: #f1f5f9; padding: 14px; border-radius: 8px; font-size: 12px; color: #334155; margin: 16px 0;">
          <p style="margin: 2px 0;"><strong>Pengguna:</strong> ${adminName}</p>
          <p style="margin: 2px 0;"><strong>Email:</strong> ${adminEmail}</p>
          <p style="margin: 2px 0;"><strong>Waktu Sesi:</strong> ${new Date().toLocaleString('id-ID')}</p>
          <p style="margin: 2px 0;"><strong>Status Sesi:</strong> Terotentikasi Sah</p>
        </div>
        <p style="font-size: 11px; color: #64748b;">Notifikasi ini dikirimkan secara otomatis via API Mailketing untuk menjaga keamanan sistem enterprise PT. LDI.</p>
      </div>
    </div>
  `;

  return sendMailketingEmail({
    recipient: adminEmail,
    subject,
    content: htmlContent,
  });
}
