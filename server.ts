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

  // Mailketing Email Dispatcher Helper
  async function sendMailketingEmailServer(recipient: string, subject: string, content: string) {
    try {
      const params = new URLSearchParams();
      params.append('api_key', MAILKETING_API_KEY);
      params.append('recipient', recipient);
      params.append('subject', subject);
      params.append('content', content);
      params.append('sender_name', 'PT. LINTAS DATA INTERNASIONAL');
      params.append('sender_email', 'support@ldi.co.id');

      const response = await fetch('https://api.mailketing.co.id/api/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const text = await response.text();
      console.log(`[MAILKETING API DISPATCH] Recipient: ${recipient} | Response: ${text.slice(0, 100)}`);
      return { success: true, response: text };
    } catch (err: any) {
      console.error(`[MAILKETING ERROR]: ${err.message}`);
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
    const { recipient, subject, htmlContent } = req.body || {};
    if (!recipient || !subject) {
      return res.status(400).json({ success: false, message: 'Penerima dan Subjek wajib diisi.' });
    }

    const result = await sendMailketingEmailServer(recipient, subject, htmlContent || '<p>Notifikasi e-Office LDI</p>');
    return res.json({
      success: result.success,
      message: result.success ? `Email terkirim ke ${recipient} via Mailketing API.` : `Gagal mengirim email: ${result.error}`
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
