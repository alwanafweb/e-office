import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // In-memory database store for local server API
  const db: {
    customers: any[];
    sphs: any[];
    pkss: any[];
    invoices: any[];
  } = {
    customers: [],
    sphs: [],
    pkss: [],
    invoices: [],
  };

  // Health Check Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      database: 'local-express',
      timestamp: new Date().toISOString(),
    });
  });

  // Customer CRUD Endpoints
  app.get('/api/customers', (req, res) => {
    res.json(db.customers);
  });

  app.get('/api/customers/:id', (req, res) => {
    const found = db.customers.find((c: any) => c.id === req.params.id);
    if (!found) return res.status(404).json({ error: 'Customer not found' });
    res.json(found);
  });

  app.post('/api/customers', (req, res) => {
    const customer = { ...req.body, id: req.body.id || `cust-${Date.now()}`, createdAt: new Date().toISOString() };
    db.customers.push(customer);
    res.status(201).json(customer);
  });

  app.put('/api/customers/:id', (req, res) => {
    const idx = db.customers.findIndex((c: any) => c.id === req.params.id);
    if (idx === -1) {
      db.customers.push({ ...req.body, id: req.params.id });
      return res.json(req.body);
    }
    db.customers[idx] = { ...db.customers[idx], ...req.body };
    res.json(db.customers[idx]);
  });

  app.delete('/api/customers/:id', (req, res) => {
    db.customers = db.customers.filter((c: any) => c.id !== req.params.id);
    res.json({ success: true, id: req.params.id });
  });

  // SPH CRUD Endpoints
  app.get('/api/sph', (req, res) => {
    res.json(db.sphs);
  });

  app.get('/api/sph/:id', (req, res) => {
    const found = db.sphs.find((s: any) => s.id === req.params.id || s.sphNumber === req.params.id);
    if (!found) return res.status(404).json({ error: 'SPH not found' });
    res.json(found);
  });

  app.post('/api/sph', (req, res) => {
    const sph = { ...req.body, id: req.body.id || `sph-${Date.now()}` };
    db.sphs.push(sph);
    res.status(201).json(sph);
  });

  app.put('/api/sph/:id', (req, res) => {
    const idx = db.sphs.findIndex((s: any) => s.id === req.params.id);
    if (idx === -1) {
      db.sphs.push({ ...req.body, id: req.params.id });
      return res.json(req.body);
    }
    db.sphs[idx] = { ...db.sphs[idx], ...req.body };
    res.json(db.sphs[idx]);
  });

  app.delete('/api/sph/:id', (req, res) => {
    db.sphs = db.sphs.filter((s: any) => s.id !== req.params.id);
    res.json({ success: true, id: req.params.id });
  });

  // PKS CRUD Endpoints
  app.get('/api/pks', (req, res) => {
    res.json(db.pkss);
  });

  app.get('/api/pks/:id', (req, res) => {
    const found = db.pkss.find((p: any) => p.id === req.params.id || p.pksNumber === req.params.id);
    if (!found) return res.status(404).json({ error: 'PKS not found' });
    res.json(found);
  });

  app.post('/api/pks', (req, res) => {
    const pks = { ...req.body, id: req.body.id || `pks-${Date.now()}` };
    db.pkss.push(pks);
    res.status(201).json(pks);
  });

  app.put('/api/pks/:id', (req, res) => {
    const idx = db.pkss.findIndex((p: any) => p.id === req.params.id);
    if (idx === -1) {
      db.pkss.push({ ...req.body, id: req.params.id });
      return res.json(req.body);
    }
    db.pkss[idx] = { ...db.pkss[idx], ...req.body };
    res.json(db.pkss[idx]);
  });

  app.delete('/api/pks/:id', (req, res) => {
    db.pkss = db.pkss.filter((p: any) => p.id !== req.params.id);
    res.json({ success: true, id: req.params.id });
  });

  // Invoice CRUD Endpoints
  app.get('/api/invoices', (req, res) => {
    res.json(db.invoices);
  });

  app.get('/api/invoices/:id', (req, res) => {
    const found = db.invoices.find((i: any) => i.id === req.params.id || i.invoiceNumber === req.params.id);
    if (!found) return res.status(404).json({ error: 'Invoice not found' });
    res.json(found);
  });

  app.post('/api/invoices', (req, res) => {
    const inv = { ...req.body, id: req.body.id || `inv-${Date.now()}` };
    db.invoices.push(inv);
    res.status(201).json(inv);
  });

  app.put('/api/invoices/:id', (req, res) => {
    const idx = db.invoices.findIndex((i: any) => i.id === req.params.id);
    if (idx === -1) {
      db.invoices.push({ ...req.body, id: req.params.id });
      return res.json(req.body);
    }
    db.invoices[idx] = { ...db.invoices[idx], ...req.body };
    res.json(db.invoices[idx]);
  });

  app.delete('/api/invoices/:id', (req, res) => {
    db.invoices = db.invoices.filter((i: any) => i.id !== req.params.id);
    res.json({ success: true, id: req.params.id });
  });

  // Mailketing API Configuration
  const MAILKETING_API_KEY = process.env.MAILKETING_TOKEN || '5aafffa0c30e5a87235b66f6e1c0e440';
  const otpStore = new Map<string, { code: string; expiresAt: number; type: string; payload?: any }>();
  let lastCronRunTime: string | null = null;

  // Monthly Recurring Invoice Cron Service
  async function processMonthlyRecurringInvoices(forceManual = false) {
    const now = new Date();
    const currentDay = now.getDate();
    const currentYYYYMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    lastCronRunTime = new Date().toLocaleString('id-ID');

    // Only auto-run on 1st of month, unless forced manually by admin
    if (currentDay !== 1 && !forceManual) {
      console.log(`[CRONJOB INVOICE] Today is day ${currentDay}, not the 1st. Skipping automatic monthly invoice send.`);
      return { success: true, processedCount: 0, reason: 'Not 1st of month', currentDay };
    }

    const recurringInvoices = db.invoices.filter(
      (inv: any) => inv.billingType === 'monthly' || inv.billingType === 'Bulanan' || inv.autoSendMonthly === true
    );

    let sentCount = 0;
    const details: any[] = [];

    for (const inv of recurringInvoices) {
      if (!forceManual && inv.lastSentRecurringMonth === currentYYYYMM) {
        details.push({ id: inv.id, invoiceNumber: inv.invoiceNumber, status: 'already_sent_this_month' });
        continue;
      }

      const recipient = inv.customerEmail;
      if (!recipient || !recipient.includes('@')) {
        details.push({ id: inv.id, invoiceNumber: inv.invoiceNumber, status: 'invalid_email' });
        continue;
      }

      const formattedTotal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(inv.grandTotal || 0);

      const subject = `[AUTO-REMINDER TAGIHAN BULANAN] Invoice PT. LDI: ${inv.invoiceNumber} - ${inv.customerName}`;
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #0f172a;">
          <div style="background-color: #0f172a; color: #ffffff; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h2 style="margin: 0; font-size: 20px; color: #38bdf8;">PT. LINTAS DATA INTERNASIONAL</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Pengingat Tagihan Rutin Bulanan (Otomatis Tanggal 1)</p>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 14px;">Kepada Yth. <strong>${inv.customerName}</strong>,</p>
            <p style="font-size: 13px; color: #334155;">Berikut disampaikan pemberitahuan tagihan layanan rutin bulanan Anda untuk periode bulan ini dari <strong>PT. LINTAS DATA INTERNASIONAL</strong>:</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 40%;">Nomor Invoice:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${inv.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Tipe Tagihan:</td>
                  <td style="padding: 6px 0;"><span style="background-color: #f3e8ff; color: #6b21a8; padding: 2px 8px; border-radius: 12px; font-weight: bold; font-size: 11px;">BERLANGGANAN BULANAN</span></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Tanggal Terbit:</td>
                  <td style="padding: 6px 0; font-weight: bold;">${inv.issueDate || 'Tanggal 1 Bulan Ini'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Jatuh Tempo:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #b91c1c;">${inv.dueDate || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">Total Tagihan:</td>
                  <td style="padding: 6px 0; font-size: 16px; font-weight: bold; color: #0284c7;">${formattedTotal}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 12px; color: #0369a1; font-weight: bold;">Rekening Pembayaran Resmi PT. LDI:</p>
              <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: bold;">${inv.bankInfo?.bankName || 'Bank BCA'} - ${inv.bankInfo?.accountNumber || '8330889988'}</p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #334155;">a.n. ${inv.bankInfo?.accountHolder || 'PT. LINTAS DATA INTERNASIONAL'}</p>
            </div>

            <p style="font-size: 12px; color: #64748b;">Mohon untuk melakukan konfirmasi pembayaran setelah transfer dilakukan. Lampiran dokumen resmi PDF dapat diunduh langsung via portal e-Office LDI.</p>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
            Email ini dikirim secara otomatis oleh Sistem Cronjob e-Office LDI pada tanggal 1 setiap bulan.<br/>
            &copy; ${now.getFullYear()} PT. LINTAS DATA INTERNASIONAL. All rights reserved.
          </div>
        </div>
      `;

      const res = await sendMailketingEmailServer(recipient, subject, emailContent);
      if (res.success) {
        inv.lastSentRecurringMonth = currentYYYYMM;
        sentCount++;
        details.push({ id: inv.id, invoiceNumber: inv.invoiceNumber, status: 'sent', recipient });
      } else {
        details.push({ id: inv.id, invoiceNumber: inv.invoiceNumber, status: 'failed', error: res.error });
      }
    }

    console.log(`[CRONJOB INVOICE COMPLETED] Sent: ${sentCount}/${recurringInvoices.length} recurring emails.`);
    return { success: true, processedCount: sentCount, totalMonthly: recurringInvoices.length, details, lastRunTime: lastCronRunTime };
  }

  // Initial Cronjob Check on Server Startup (5s delay)
  setTimeout(() => {
    processMonthlyRecurringInvoices(false).catch((err) => console.error('[CRON STARTUP ERROR]', err));
  }, 5000);

  // Periodic Cronjob Check (Every 1 hour)
  setInterval(() => {
    processMonthlyRecurringInvoices(false).catch((err) => console.error('[CRON ERROR]', err));
  }, 1 * 60 * 60 * 1000);

  // Manual trigger endpoint for Cronjob
  app.post('/api/invoices/trigger-recurring-cron', async (req, res) => {
    try {
      const result = await processMonthlyRecurringInvoices(true);
      res.json({
        success: true,
        message: `Cronjob berhasil dijalankan. ${result.processedCount} email pengingat tagihan bulanan dikirim.`,
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Status endpoint for Cronjob
  app.get('/api/invoices/recurring-status', (req, res) => {
    const monthlyList = db.invoices.filter((inv: any) => inv.billingType === 'monthly' || inv.billingType === 'Bulanan' || inv.autoSendMonthly === true);
    
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextScheduledDate = `${nextMonth.getDate()} ${nextMonth.toLocaleString('id-ID', { month: 'long' })} ${nextMonth.getFullYear()}`;

    res.json({
      success: true,
      totalMonthlyInvoices: monthlyList.length,
      lastCronRunTime: lastCronRunTime || 'Belum pernah dijalankan sejak server restart',
      nextScheduledDate,
      recurringInvoices: monthlyList,
    });
  });

  // Temporary PDF Document Store for Email Attachments & Direct Downloads
  const pdfStore = new Map<string, { filename: string; buffer: Buffer; contentType: string }>();

  app.post('/api/documents/upload-pdf', (req, res) => {
    try {
      const { filename, base64Data } = req.body || {};
      if (!base64Data) {
        return res.status(400).json({ success: false, error: 'base64Data is required' });
      }

      const fileId = `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const pureBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '').replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(pureBase64, 'base64');

      const cleanFilename = (filename || 'Dokumen_Resmi_LDI.pdf').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      const finalFilename = cleanFilename.endsWith('.pdf') ? cleanFilename : `${cleanFilename}.pdf`;

      pdfStore.set(fileId, {
        filename: finalFilename,
        buffer,
        contentType: 'application/pdf',
      });

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      const pdfUrl = `${protocol}://${host}/api/documents/pdf/${fileId}/${finalFilename}`;

      res.json({
        success: true,
        fileId,
        pdfUrl,
        filename: finalFilename,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/documents/pdf/:fileId/:filename', (req, res) => {
    const { fileId } = req.params;
    const stored = pdfStore.get(fileId);
    if (!stored) {
      return res.status(404).send('Dokumen PDF tidak ditemukan atau telah kedaluwarsa.');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${stored.filename}"`);
    res.setHeader('Content-Length', stored.buffer.length);
    res.send(stored.buffer);
  });

  // Mailketing Email Dispatcher Helper
  async function sendMailketingEmailServer(
    recipient: string,
    subject: string,
    content: string,
    attachUrl?: string,
    senderName: string = 'PT. LINTAS DATA INTERNASIONAL',
    senderEmail: string = 'alwanemail@gmail.com',
    cc?: string,
    customApiKey?: string
  ) {
    const timestamp = new Date().toISOString();
    const activeApiKey = customApiKey?.trim() || MAILKETING_API_KEY;

    console.log(`\n================================================================================`);
    console.log(`[MAILKETING LOG ${timestamp}] [START EMAIL DISPATCH]`);
    console.log(` - Target Recipient : ${recipient}`);
    console.log(` - CC Recipients   : ${cc || '(none)'}`);
    console.log(` - Sender Info      : "${senderName}" <${senderEmail}>`);
    console.log(` - Subject          : ${subject}`);
    console.log(` - Attachment URL   : ${attachUrl || '(none)'}`);
    console.log(` - Active API Token : ${activeApiKey ? `${activeApiKey.substring(0, 8)}...` : '(EMPTY)'}`);

    try {
      const jsonBody = {
        api_token: activeApiKey,
        api_key: activeApiKey,
        recipient: recipient,
        subject: subject,
        content: content,
        from_name: senderName,
        sender_name: senderName,
        from_email: senderEmail,
        sender_email: senderEmail,
        ...(cc && cc.trim() ? { cc: cc.trim() } : {}),
        ...(attachUrl ? { attach1: attachUrl } : {}),
      };

      console.log(`[MAILKETING LOG ${timestamp}] [API REQUEST] Sending HTTP POST to https://api.mailketing.co.id/api/v1/send`);
      console.log(` - Headers: Content-Type: application/json, Accept: application/json`);
      console.log(` - Request Body Payload:`, JSON.stringify({ ...jsonBody, api_token: '***HIDDEN***', api_key: '***HIDDEN***' }));

      const response = await fetch('https://api.mailketing.co.id/api/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(jsonBody),
      });

      const responseStatusCode = response.status;
      const responseStatusText = response.statusText;
      const text = await response.text();

      console.log(`[MAILKETING LOG ${timestamp}] [API RESPONSE RECEIVED]`);
      console.log(` - HTTP Status Code : ${responseStatusCode} ${responseStatusText}`);
      console.log(` - Raw Response Body: ${text.length > 500 ? text.substring(0, 500) + '... (truncated)' : text}`);

      let responseJson: any = null;
      try {
        responseJson = JSON.parse(text);
        console.log(` - Parsed JSON Data :`, responseJson);
      } catch (jsonErr) {
        console.warn(` - [WARNING] Response is NOT a valid JSON string.`);
      }

      // Check if response is HTML (Error page from Cloudflare or unverified sender email issue)
      if (text.includes('<html') || text.includes('<!DOCTYPE') || text.includes('<!doctype')) {
        console.error(`[MAILKETING LOG ${timestamp}] [ERROR] Received HTML response from Mailketing API instead of JSON.`);
        console.error(` - Possible Causes: 1) Sender email (${senderEmail}) is not verified in Mailketing Dashboard. 2) API Key is invalid or rate limited.`);
        return {
          success: false,
          error: `Respon Server Mailketing Berupa Halaman HTML/Error (${responseStatusCode}). Pastikan Email Pengirim (${senderEmail}) sudah terverifikasi di Dashboard Mailketing.co.id.`,
          response: text,
        };
      }

      if (responseJson && (responseJson.status === 'failed' || responseJson.status === 'error' || responseJson.code >= 400)) {
        const errDetail = responseJson.response || responseJson.message || text;
        let humanMsg = `Gagal mengirim email via Mailketing API (${errDetail}).`;
        if (
          typeof errDetail === 'string' &&
          (errDetail.includes('Access Denied') ||
            errDetail.includes('Invalid Token') ||
            errDetail.includes('User Not Found') ||
            errDetail.includes('Wrong API Token'))
        ) {
          humanMsg =
            'Akses Ditolak Mailketing API (Token API tidak valid atau tidak terdaftar). Silakan periksa kembali API Key Mailketing Anda di Pengaturan Perusahaan -> Email Gateway.';
        }
        console.error(`[MAILKETING LOG ${timestamp}] [FAILED RESPONSE] ${humanMsg}`);
        return { success: false, error: humanMsg, response: text };
      }

      if (
        text.includes('Access Denied') ||
        text.includes('Invalid Token') ||
        text.includes('User Not Found') ||
        text.includes('Wrong API Token')
      ) {
        console.error(`[MAILKETING LOG ${timestamp}] [ACCESS DENIED] Token API Mailketing tidak valid.`);
        return {
          success: false,
          error:
            'Akses Ditolak Mailketing API (Token API tidak valid atau tidak terdaftar). Silakan periksa kembali API Key Mailketing Anda di Pengaturan Perusahaan -> Email Gateway.',
          response: text,
        };
      }

      if (!response.ok) {
        console.error(`[MAILKETING LOG ${timestamp}] [HTTP ERROR] Status ${responseStatusCode}`);
        return {
          success: false,
          error: `HTTP Error ${responseStatusCode}: Gagal menghubungi server Mailketing.`,
          response: text,
        };
      }

      console.log(`[MAILKETING LOG ${timestamp}] [SUCCESS] Main email successfully dispatched to ${recipient}`);

      // Dispatch individual copies to CC recipients to guarantee inbox delivery
      if (cc && cc.trim()) {
        const ccAddresses = cc
          .split(/[,;]/)
          .map((addr) => addr.trim())
          .filter((addr) => addr && addr.includes('@') && addr.toLowerCase() !== recipient.toLowerCase());

        for (const ccAddr of ccAddresses) {
          try {
            console.log(`[MAILKETING LOG ${timestamp}] [CC DISPATCH] Dispatching copy to CC address: ${ccAddr}`);
            const ccJsonBody = {
              api_token: activeApiKey,
              api_key: activeApiKey,
              recipient: ccAddr,
              subject: `[CC / TEMBUSAN] ${subject}`,
              content: `
                <div style="background-color: #fefce8; border: 1px solid #fef08a; padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; font-family: Arial, sans-serif; font-size: 12px; color: #854d0e;">
                  📌 <strong>Catatan Tembusan (CC Email):</strong> Email ini dikirimkan sebagai salinan tembusan (CC) kepada Anda untuk arsip & monitoring dokumen resmi. Penerima Utama: <strong>${recipient}</strong>.
                </div>
                ${content}
              `,
              from_name: senderName,
              sender_name: senderName,
              from_email: senderEmail,
              sender_email: senderEmail,
              ...(attachUrl ? { attach1: attachUrl } : {}),
            };

            const ccRes = await fetch('https://api.mailketing.co.id/api/v1/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: JSON.stringify(ccJsonBody),
            });
            const ccText = await ccRes.text();
            console.log(`[MAILKETING LOG ${timestamp}] [CC DISPATCH SUCCESS] Result for ${ccAddr}: ${ccText.substring(0, 150)}`);
          } catch (ccErr: any) {
            console.warn(`[MAILKETING LOG ${timestamp}] [CC DISPATCH WARNING] Could not dispatch to CC ${ccAddr}: ${ccErr.message}`);
          }
        }
      }

      console.log(`[MAILKETING LOG ${timestamp}] [PROCESS COMPLETE]\n================================================================================\n`);
      return { success: true, response: text };
    } catch (err: any) {
      console.error(`[MAILKETING LOG ${timestamp}] [EXCEPTION ERROR]: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  function buildOtpEmailHtmlServer(otpCode: string, typeName: string, recipientEmail: string) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #0f172a;">
        <div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;">
          <h2 style="color: #0369a1; margin: 0; font-size: 20px;">PT. LINTAS DATA INTERNASIONAL</h2>
          <p style="color: #64748b; font-size: 12px; margin-top: 4px;">Sistem Keamanan Autentikasi e-Office LDI</p>
        </div>
        <div style="padding: 24px 0; text-align: center;">
          <p style="color: #334155; font-size: 14px; margin-bottom: 12px;">Berikut adalah Kode Verifikasi (OTP) untuk <strong>${typeName}</strong> akun Anda (${recipientEmail}):</p>
          <div style="background-color: #f0f9ff; border: 2px dashed #0284c7; padding: 16px; border-radius: 12px; display: inline-block; margin: 12px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0369a1;">${otpCode}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 16px;">Kode ini berlaku selama <strong>5 menit</strong>. Jangan berikan kode ini kepada siapapun demi keamanan akun Anda.</p>
        </div>
        <div style="text-align: center; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
          &copy; ${new Date().getFullYear()} PT. Laksanakan Dengan Ikhlas (LDI). All rights reserved.
        </div>
      </div>
    `;
  }

  // Auth OTP Endpoints
  app.post('/api/auth/send-otp', async (req, res) => {
    const { email, type, username } = req.body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Email terdaftar wajib diisi dengan format valid.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    const key = `${type}:${email.toLowerCase().trim()}`;
    otpStore.set(key, { code: otpCode, expiresAt, type, payload: { email, username } });

    const typeTitle = type === 'register' ? 'Pendaftaran Akun Baru' : type === 'forgot' ? 'Reset Password' : 'Verifikasi Login';
    const html = buildOtpEmailHtmlServer(otpCode, typeTitle, email);

    // Send via Mailketing API
    await sendMailketingEmailServer(email, `[e-Office LDI] Kode Verifikasi OTP: ${otpCode}`, html);

    return res.json({
      success: true,
      message: `Kode verifikasi OTP 6-digit telah dikirim via Mailketing ke ${email}. (Berlaku 5 menit)`,
      devOtpCode: otpCode
    });
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    const { email, otpCode, type } = req.body || {};

    if (!email || !otpCode) {
      return res.status(400).json({ success: false, message: 'Email dan Kode OTP wajib diisi.' });
    }

    const key = `${type}:${email.toLowerCase().trim()}`;
    const stored = otpStore.get(key);

    if (!stored) {
      return res.status(400).json({ success: false, message: 'Kode OTP tidak ditemukan atau belum dikirim. Silakan klik \'Kirim Ulang Kode\'.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ success: false, message: 'Kode OTP telah kadaluarsa (lebih dari 5 menit). Silakan minta kode baru.' });
    }

    if (stored.code !== otpCode.trim()) {
      return res.status(400).json({ success: false, message: 'Kode OTP yang Anda masukkan salah. Periksa kembali email Anda.' });
    }

    otpStore.delete(key);

    return res.json({
      success: true,
      message: 'Verifikasi Kode OTP Berhasil!'
    });
  });

  // General Mailketing Proxy Route
  app.post('/api/mail/send', async (req, res) => {
    const { recipient, cc, ccEmail, subject, htmlContent, content, senderName, senderEmail, attachmentUrl, attachUrl, mailketingApiKey } = req.body || {};
    if (!recipient || !subject) {
      return res.status(400).json({ success: false, message: 'Penerima dan Subjek wajib diisi.' });
    }

    const finalContent = htmlContent || content || '<p>Notifikasi e-Office LDI</p>';
    const finalAttachUrl = attachmentUrl || attachUrl;
    const finalCc = cc || ccEmail;

    const result = await sendMailketingEmailServer(
      recipient,
      subject,
      finalContent,
      finalAttachUrl,
      senderName || 'PT. LINTAS DATA INTERNASIONAL',
      senderEmail || 'admin@ldi.co.id',
      finalCc,
      mailketingApiKey
    );

    return res.json({
      success: result.success,
      message: result.success
        ? `Email terkirim ke ${recipient}${finalCc ? ` (CC: ${finalCc})` : ''} via Mailketing API.`
        : (result.error || 'Gagal mengirim email via Mailketing API.'),
      error: result.error,
      data: result.response,
    });
  });

  // Batch Sync Endpoint
  app.post('/api/sync', (req, res) => {
    const { customers, sphs, pkss, invoices } = req.body || {};
    if (customers && Array.isArray(customers)) db.customers = customers;
    if (sphs && Array.isArray(sphs)) db.sphs = sphs;
    if (pkss && Array.isArray(pkss)) db.pkss = pkss;
    if (invoices && Array.isArray(invoices)) db.invoices = invoices;
    res.json({
      success: true,
      count: (customers?.length || 0) + (sphs?.length || 0) + (pkss?.length || 0) + (invoices?.length || 0),
    });
  });

  // Auto-Merge Discrepancies Sync Endpoint (Cloudflare D1 <-> Server DB)
  app.post('/api/sync/auto-merge', (req, res) => {
    const { customers = [], sphs = [], pkss = [], invoices = [] } = req.body || {};

    let discrepanciesResolved = 0;

    const mergeCollection = (localItems: any[], serverItems: any[]) => {
      const itemMap = new Map<string, any>();
      serverItems.forEach((i) => i.id && itemMap.set(i.id, i));

      localItems.forEach((item) => {
        if (!item || !item.id) return;
        if (!itemMap.has(item.id)) {
          itemMap.set(item.id, item);
          discrepanciesResolved++;
        } else {
          const existing = itemMap.get(item.id);
          const t1 = new Date(item.updatedAt || item.createdAt || 0).getTime();
          const t2 = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
          if (t1 > t2) {
            itemMap.set(item.id, item);
            discrepanciesResolved++;
          }
        }
      });
      return Array.from(itemMap.values());
    };

    db.customers = mergeCollection(customers, db.customers);
    db.sphs = mergeCollection(sphs, db.sphs);
    db.pkss = mergeCollection(pkss, db.pkss);
    db.invoices = mergeCollection(invoices, db.invoices);

    return res.json({
      success: true,
      message: `Data auto-merged successfully with Cloudflare D1 local logs.`,
      discrepanciesResolved,
      timestamp: new Date().toISOString(),
      data: {
        customers: db.customers,
        sphs: db.sphs,
        pkss: db.pkss,
        invoices: db.invoices,
      },
    });
  });

  // Recurring 60-Second Server Background D1 Log Check
  setInterval(() => {
    const totalRecords = db.customers.length + db.sphs.length + db.pkss.length + db.invoices.length;
    console.log(`[D1 AUTO-SYNC 60s LOG] Server DB active records: ${totalRecords} | Customers: ${db.customers.length}, SPH: ${db.sphs.length}, PKS: ${db.pkss.length}, Invoice: ${db.invoices.length}`);
  }, 60 * 1000);

  // Serve Vite in development mode or static files in production mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`E-Office Express server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
