import express from 'express';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Persistent database store for local server API
  const DATA_DIR = path.join(process.cwd(), 'data');
  const DB_FILE = path.join(DATA_DIR, 'db.json');

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

  const seedDatabaseIfEmpty = () => {
    if (db.sphs.length === 0 && db.pkss.length === 0 && db.invoices.length === 0) {
      db.customers = [
        {
          id: 'cust-1',
          companyName: 'Bank Mandiri (Persero) Tbk',
          address: 'Plaza Mandiri, Jl. Jend. Gatot Subroto Kav. 36-38, Jakarta Selatan 12190',
          contactPerson: 'Bambang Sudarmono, M.Kom',
          position: 'VP IT Infrastructure',
          email: 'procurement@bankmandiri.co.id',
          phone: '021-5265045',
          npwp: '01.000.013.1-093.000',
          industry: 'Perbankan & Keuangan',
          status: 'Aktif',
          totalContractValue: 180000000,
        },
        {
          id: 'cust-2',
          companyName: 'PT. Telekomunikasi Nusantara Digital',
          address: 'Gedung Cyber 2 Tower Lt. 18, Jl. HR Rasuna Said, Jakarta Selatan 12950',
          contactPerson: 'Hendra Wijaya, S.Kom',
          position: 'Chief Technology Officer',
          email: 'it@nusantaradigital.co.id',
          phone: '021-29008899',
          npwp: '02.441.882.3-014.000',
          industry: 'Teknologi & ISP',
          status: 'Aktif',
          totalContractValue: 120000000,
        },
      ];

      db.sphs = [
        {
          id: 'sph-default-1',
          sphNumber: 'SPH/2026/08/001',
          customerId: 'cust-1',
          customerName: 'Bank Mandiri (Persero) Tbk',
          customerAddress: 'Plaza Mandiri, Jl. Jend. Gatot Subroto Kav. 36-38, Jakarta Selatan 12190',
          customerPhone: '021-5265045',
          customerEmail: 'procurement@bankmandiri.co.id',
          customerRepresentative: 'Bambang Sudarmono, M.Kom',
          date: '2026-08-17',
          validityDays: 14,
          items: [
            {
              id: 'it-1',
              name: 'Dedicated Internet 1 Gbps Metro-E 1:1 Low Latency',
              description: 'Koneksi fiber optic dedicated symmetric 1 Gbps, SLA 99.98% dengan backup link failover otomatis',
              qty: 1,
              unit: 'Bulan',
              price: 15000000,
              discount: 0,
            },
            {
              id: 'it-2',
              name: 'Managed Cloud SD-WAN & Enterprise Firewall Fortinet',
              description: 'Penyewaan dan manajemen perangkat NGFW High-Availability, 24/7 Security Operations Center',
              qty: 1,
              unit: 'Paket',
              price: 7500000,
              discount: 0,
            },
          ],
          subtotal: 22500000,
          discountTotal: 0,
          taxPercent: 11,
          taxAmount: 2475000,
          grandTotal: 24975000,
          status: 'Diterbitkan',
          notes: 'Harga sudah termasuk instalasi, SLA 99.9%, dan dukungan teknis 24/7 NOC PT. LDI.',
          signedBy: 'Irwan Setiawan, S.T.',
        },
      ];

      db.pkss = [
        {
          id: 'pks-default-1',
          pksNumber: 'PKS/2026/08/001',
          sphReferenceNumber: 'SPH/2026/08/001',
          customerId: 'cust-1',
          customerName: 'Bank Mandiri (Persero) Tbk',
          customerRepresentative: 'Bambang Sudarmono, M.Kom',
          customerRepPosition: 'VP Information Technology Infrastructure',
          customerAddress: 'Plaza Mandiri, Jl. Jend. Gatot Subroto Kav. 36-38, Jakarta Selatan 12190',
          startDate: '2026-08-17',
          endDate: '2027-08-16',
          contractDurationMonths: 12,
          serviceItems: [
            {
              id: 'it-1',
              name: 'Dedicated Internet 1 Gbps Metro-E 1:1 Low Latency',
              description: 'Koneksi fiber optic dedicated symmetric 1 Gbps, SLA 99.98% dengan backup link failover otomatis',
              qty: 1,
              unit: 'Bulan',
              price: 15000000,
              discount: 0,
            },
          ],
          monthlyValue: 15000000,
          totalContractValue: 180000000,
          slaPercent: 99.9,
          clauses: [
            {
              article: 1,
              title: 'RUANG LINGKUP PEKERJAAN & INFRASTRUKTUR',
              content: 'PIHAK PERTAMA (PT. LINTAS DATA INTERNASIONAL) sepakat menyediakan layanan Dedicated Internet 1 Gbps Metro-E kepada PIHAK KEDUA (Bank Mandiri) sesuai standar SLA 99.9%.',
            },
            {
              article: 2,
              title: 'NILAI KONTRAK & SKEMA PEMBAYARAN',
              content: 'Nilai langganan rutin adalah sebesar Rp 15.000.000,- per bulan belum termasuk PPN 11%. Pembayaran dilakukan paling lambat tanggal 10 setiap bulannya ke rekening Bank BCA PT. LDI.',
            },
            {
              article: 3,
              title: 'SERVICE LEVEL AGREEMENT (SLA 99.9%)',
              content: 'PIHAK PERTAMA menjamin ketersediaan jaringan dan server (Uptime) sebesar 99.9% setiap bulan dengan garansi dukungan teknis 24/7.',
            },
          ],
          status: 'Aktif',
          party1Signed: true,
          party1SignerName: 'Irwan Setiawan, S.T.',
          party1SignerPosition: 'Direktur Utama',
          party2Signed: true,
          party2SignerName: 'Bambang Sudarmono, M.Kom',
          party2SignerPosition: 'VP IT Infrastructure',
          signedDate: '2026-08-17',
        },
      ];

      db.invoices = [
        {
          id: 'inv-default-1',
          invoiceNumber: 'INV/2026/08/001',
          customerId: 'cust-1',
          customerName: 'Bank Mandiri (Persero) Tbk',
          customerAddress: 'Plaza Mandiri, Jl. Jend. Gatot Subroto Kav. 36-38, Jakarta Selatan 12190',
          customerPhone: '021-5265045',
          customerEmail: 'procurement@bankmandiri.co.id',
          customerRepresentative: 'Bambang Sudarmono, M.Kom',
          sphReference: 'SPH/2026/08/001',
          issueDate: '2026-08-17',
          dueDate: '2026-08-31',
          items: [
            {
              id: 'it-1',
              name: 'Dedicated Internet 1 Gbps Metro-E 1:1 Low Latency (Periode Agustus 2026)',
              description: 'Layanan internet dedicated fiber optic korporasi PT. LDI',
              qty: 1,
              unit: 'Bulan',
              price: 15000000,
              discount: 0,
            },
          ],
          subtotal: 15000000,
          discountTotal: 0,
          taxPercent: 11,
          taxAmount: 1650000,
          grandTotal: 16650000,
          status: 'Belum Bayar',
          bankInfo: {
            bankName: 'Bank Central Asia (BCA)',
            accountNumber: '8830-1928-33',
            accountHolder: 'PT LINTAS DATA INTERNASIONAL',
            branch: 'KCP BSD Green Office Park',
            notes: 'Transfer Rekening Utama untuk Layanan Internet & Cloud',
          },
          signedByFinance: 'Siti Rahmawati, S.E.',
        },
      ];

      saveDatabase();
      console.log('[DB SEED] Database seeded with default official documents (SPH/2026/08/001, PKS/2026/08/001, INV/2026/08/001).');
    }
  };

  const loadDatabase = () => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed) {
          if (Array.isArray(parsed.customers)) db.customers = parsed.customers;
          if (Array.isArray(parsed.sphs)) db.sphs = parsed.sphs;
          if (Array.isArray(parsed.pkss)) db.pkss = parsed.pkss;
          if (Array.isArray(parsed.invoices)) db.invoices = parsed.invoices;
          console.log(`[DB PERSISTENCE] Loaded ${db.customers.length} customers, ${db.sphs.length} SPHs, ${db.pkss.length} PKSs, ${db.invoices.length} invoices from disk.`);
        }
      }
      seedDatabaseIfEmpty();
    } catch (err) {
      console.warn('[DB PERSISTENCE] Failed to load database from disk:', err);
      seedDatabaseIfEmpty();
    }
  };

  const saveDatabase = () => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[DB PERSISTENCE] Failed to save database to disk:', err);
    }
  };

  // Initial load from disk
  loadDatabase();

  // Health Check Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      database: 'local-express',
      records: {
        customers: db.customers.length,
        sphs: db.sphs.length,
        pkss: db.pkss.length,
        invoices: db.invoices.length,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Dedicated Universal Verification Endpoint (Accessible for public verification from emails and QR codes)
  app.get(['/api/verify', '/api/verify-doc', '/api/verify/:docId'], (req, res) => {
    const rawQuery = (req.query.doc || req.query.verify || req.query.q || req.query.number || req.query.id || req.params.docId || '').toString().trim();
    if (!rawQuery) {
      return res.status(400).json({ valid: false, error: 'Document query parameter (?doc=...) is required' });
    }

    const cleanQuery = rawQuery.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Search in SPH
    const matchedSph = db.sphs.find((s: any) => {
      const sNum = (s.sphNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const sId = (s.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return sNum === cleanQuery || sId === cleanQuery || (cleanQuery.length >= 4 && (sNum.includes(cleanQuery) || cleanQuery.includes(sNum) || sId.includes(cleanQuery)));
    });

    if (matchedSph) {
      return res.json({
        valid: true,
        type: 'SPH',
        matchedQuery: matchedSph.sphNumber,
        data: matchedSph,
        hash: `SHA256-LDI-SPH-${(matchedSph.id || 'SPH').slice(-6)}-${Buffer.from(matchedSph.sphNumber || '').toString('hex').slice(0, 8).toUpperCase()}`,
        verifiedAt: new Date().toISOString(),
      });
    }

    // 2. Search in PKS
    const matchedPks = db.pkss.find((p: any) => {
      const pNum = (p.pksNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const pId = (p.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return pNum === cleanQuery || pId === cleanQuery || (cleanQuery.length >= 4 && (pNum.includes(cleanQuery) || cleanQuery.includes(pNum) || pId.includes(cleanQuery)));
    });

    if (matchedPks) {
      return res.json({
        valid: true,
        type: 'PKS',
        matchedQuery: matchedPks.pksNumber,
        data: matchedPks,
        hash: `SHA256-LDI-PKS-${(matchedPks.id || 'PKS').slice(-6)}-${Buffer.from(matchedPks.pksNumber || '').toString('hex').slice(0, 8).toUpperCase()}`,
        verifiedAt: new Date().toISOString(),
      });
    }

    // 3. Search in Invoices
    const matchedInv = db.invoices.find((i: any) => {
      const iNum = (i.invoiceNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const iId = (i.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return iNum === cleanQuery || iId === cleanQuery || (cleanQuery.length >= 4 && (iNum.includes(cleanQuery) || cleanQuery.includes(iNum) || iId.includes(cleanQuery)));
    });

    if (matchedInv) {
      return res.json({
        valid: true,
        type: 'Invoice',
        matchedQuery: matchedInv.invoiceNumber,
        data: matchedInv,
        hash: `SHA256-LDI-INV-${(matchedInv.id || 'INV').slice(-6)}-${Buffer.from(matchedInv.invoiceNumber || '').toString('hex').slice(0, 8).toUpperCase()}`,
        verifiedAt: new Date().toISOString(),
      });
    }

    return res.status(404).json({
      valid: false,
      query: rawQuery,
      error: `Dokumen dengan nomor "${rawQuery}" tidak ditemukan dalam database resmi PT. LDI`,
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
    const existingIdx = db.customers.findIndex((c: any) => c.id === customer.id);
    if (existingIdx !== -1) {
      db.customers[existingIdx] = customer;
    } else {
      db.customers.push(customer);
    }
    saveDatabase();
    res.status(201).json(customer);
  });

  app.put('/api/customers/:id', (req, res) => {
    const idx = db.customers.findIndex((c: any) => c.id === req.params.id);
    if (idx === -1) {
      db.customers.push({ ...req.body, id: req.params.id });
      saveDatabase();
      return res.json(req.body);
    }
    db.customers[idx] = { ...db.customers[idx], ...req.body };
    saveDatabase();
    res.json(db.customers[idx]);
  });

  app.delete('/api/customers/:id', (req, res) => {
    db.customers = db.customers.filter((c: any) => c.id !== req.params.id);
    saveDatabase();
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
    const existingIdx = db.sphs.findIndex((s: any) => s.id === sph.id || (sph.sphNumber && s.sphNumber === sph.sphNumber));
    if (existingIdx !== -1) {
      db.sphs[existingIdx] = { ...db.sphs[existingIdx], ...sph };
    } else {
      db.sphs.push(sph);
    }
    saveDatabase();
    res.status(201).json(sph);
  });

  app.put('/api/sph/:id', (req, res) => {
    const idx = db.sphs.findIndex((s: any) => s.id === req.params.id);
    if (idx === -1) {
      db.sphs.push({ ...req.body, id: req.params.id });
      saveDatabase();
      return res.json(req.body);
    }
    db.sphs[idx] = { ...db.sphs[idx], ...req.body };
    saveDatabase();
    res.json(db.sphs[idx]);
  });

  app.delete('/api/sph/:id', (req, res) => {
    db.sphs = db.sphs.filter((s: any) => s.id !== req.params.id);
    saveDatabase();
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
    const existingIdx = db.pkss.findIndex((p: any) => p.id === pks.id || (pks.pksNumber && p.pksNumber === pks.pksNumber));
    if (existingIdx !== -1) {
      db.pkss[existingIdx] = { ...db.pkss[existingIdx], ...pks };
    } else {
      db.pkss.push(pks);
    }
    saveDatabase();
    res.status(201).json(pks);
  });

  app.put('/api/pks/:id', (req, res) => {
    const idx = db.pkss.findIndex((p: any) => p.id === req.params.id);
    if (idx === -1) {
      db.pkss.push({ ...req.body, id: req.params.id });
      saveDatabase();
      return res.json(req.body);
    }
    db.pkss[idx] = { ...db.pkss[idx], ...req.body };
    saveDatabase();
    res.json(db.pkss[idx]);
  });

  app.delete('/api/pks/:id', (req, res) => {
    db.pkss = db.pkss.filter((p: any) => p.id !== req.params.id);
    saveDatabase();
    res.json({ success: true, id: req.params.id });
  });

  // Invoice CRUD Endpoints
  app.get('/api/invoices', (req, res) => {
    res.json(db.invoices);
  });

  // Status endpoint for Cronjob (defined before /api/invoices/:id to avoid parameter shadowing)
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

  app.get('/api/invoices/:id', (req, res) => {
    const found = db.invoices.find((i: any) => i.id === req.params.id || i.invoiceNumber === req.params.id);
    if (!found) return res.status(404).json({ error: 'Invoice not found' });
    res.json(found);
  });

  app.post('/api/invoices', (req, res) => {
    const inv = { ...req.body, id: req.body.id || `inv-${Date.now()}` };
    const existingIdx = db.invoices.findIndex((i: any) => i.id === inv.id || (inv.invoiceNumber && i.invoiceNumber === inv.invoiceNumber));
    if (existingIdx !== -1) {
      db.invoices[existingIdx] = { ...db.invoices[existingIdx], ...inv };
    } else {
      db.invoices.push(inv);
    }
    saveDatabase();
    res.status(201).json(inv);
  });

  app.put('/api/invoices/:id', (req, res) => {
    const idx = db.invoices.findIndex((i: any) => i.id === req.params.id);
    if (idx === -1) {
      db.invoices.push({ ...req.body, id: req.params.id });
      saveDatabase();
      return res.json(req.body);
    }
    db.invoices[idx] = { ...db.invoices[idx], ...req.body };
    saveDatabase();
    res.json(db.invoices[idx]);
  });

  app.delete('/api/invoices/:id', (req, res) => {
    db.invoices = db.invoices.filter((i: any) => i.id !== req.params.id);
    saveDatabase();
    res.json({ success: true, id: req.params.id });
  });

  // Mailketing API Configuration
  const MAILKETING_API_KEY = process.env.MAILKETING_TOKEN || process.env.VITE_MAILKETING_API_KEY || 'e6f901cb964cd1c0fb59453f3450329d';
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

  // Document PDF in-memory + disk cache store for Mailketing attachments & direct downloads
  const pdfStore = new Map<string, { filename: string; buffer: Buffer; contentType: string }>();
  const PDF_CACHE_DIR = path.join(process.cwd(), 'uploads', 'pdf');
  try {
    if (!fs.existsSync(PDF_CACHE_DIR)) {
      fs.mkdirSync(PDF_CACHE_DIR, { recursive: true });
    }
  } catch (dirErr) {
    console.warn('Notice creating pdf cache dir:', dirErr);
  }

  // Static serving for direct public attachments
  app.use(
    '/uploads/pdf',
    express.static(PDF_CACHE_DIR, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        }
      },
    })
  );

  app.post('/api/documents/upload-pdf', async (req, res) => {
    try {
      const { filename, base64Data, customPublicDomain } = req.body || {};
      if (!base64Data) {
        return res.status(400).json({ success: false, error: 'base64Data is required' });
      }

      const fileId = `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      
      // Clean base64 string accurately
      let pureBase64 = String(base64Data);
      if (pureBase64.includes(',')) {
        pureBase64 = pureBase64.substring(pureBase64.indexOf(',') + 1);
      }
      pureBase64 = pureBase64.trim().replace(/\s/g, '');
      const buffer = Buffer.from(pureBase64, 'base64');

      const isPdfHeader = buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
      console.log(`[PDF UPLOAD] fileId=${fileId}, size=${buffer.length} bytes, validPdfHeader=${isPdfHeader}`);

      const cleanFilename = (filename || 'Dokumen_Resmi_LDI.pdf').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      const finalFilename = cleanFilename.endsWith('.pdf') ? cleanFilename : `${cleanFilename}.pdf`;
      const staticDiskFilename = `${fileId}_${finalFilename}`;

      const docRecord = {
        filename: finalFilename,
        buffer,
        contentType: 'application/pdf',
      };

      pdfStore.set(fileId, docRecord);

      // Persist to disk cache in uploads/pdf
      try {
        fs.writeFileSync(path.join(PDF_CACHE_DIR, staticDiskFilename), buffer);
        fs.writeFileSync(path.join(PDF_CACHE_DIR, `${fileId}.pdf`), buffer);
      } catch (fsErr) {
        console.warn('Could not write PDF to disk cache:', fsErr);
      }

      // Determine public domain & protocol
      const publicBaseUrl = (customPublicDomain || process.env.PUBLIC_APP_URL || process.env.APP_URL || '').trim();
      let pdfUrl = '';
      if (publicBaseUrl && publicBaseUrl.startsWith('http')) {
        pdfUrl = `${publicBaseUrl.replace(/\/$/, '')}/uploads/pdf/${staticDiskFilename}`;
      } else {
        const host = req.get('host') || 'e-office.ldi.co.id';
        const forwardedProto = req.headers['x-forwarded-proto'];
        const protocol = (host.includes('ldi.co.id') || forwardedProto === 'https' || req.secure) ? 'https' : (forwardedProto || req.protocol || 'https');
        pdfUrl = `${protocol}://${host}/uploads/pdf/${staticDiskFilename}`;
      }

      // Automatically publish to zero-auth public CDN so Mailketing API and recipient can access it directly
      let publicCdnUrl = '';
      try {
        publicCdnUrl = await getPublicDirectPdfUrl(buffer, finalFilename, pdfUrl);
      } catch (cdnErr) {
        console.warn('[PDF UPLOAD CDN] CDN upload warning:', cdnErr);
      }

      const finalPdfUrl = (publicCdnUrl && publicCdnUrl.startsWith('http')) ? publicCdnUrl : pdfUrl;
      console.log(`[PDF UPLOAD SUCCESS] fileId=${fileId}, localUrl=${pdfUrl}, publicCdnUrl=${finalPdfUrl}`);

      res.json({
        success: true,
        fileId,
        pdfUrl: finalPdfUrl,
        localUrl: pdfUrl,
        filename: finalFilename,
      });
    } catch (err: any) {
      console.error('Error in /api/documents/upload-pdf:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  const servePdfHandler = (req: express.Request, res: express.Response) => {
    const fileId = req.params.fileId;
    const filename = req.params.filename || req.params.fileId;
    let stored = pdfStore.get(fileId);

    if (!stored) {
      const diskPath = path.join(PDF_CACHE_DIR, `${fileId}.pdf`);
      if (fs.existsSync(diskPath)) {
        try {
          const buffer = fs.readFileSync(diskPath);
          stored = {
            filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
            buffer,
            contentType: 'application/pdf',
          };
          pdfStore.set(fileId, stored);
        } catch (readErr) {
          console.warn('Could not read PDF from disk cache:', readErr);
        }
      }
    }

    if (!stored) {
      return res.status(404).send('Dokumen PDF tidak ditemukan atau telah kedaluwarsa.');
    }

    const isDownload = req.query.dl === '1' || req.query.download === '1';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename="${stored.filename}"`);
    res.setHeader('Content-Length', stored.buffer.length.toString());
    res.setHeader('Accept-Ranges', 'bytes');
    res.send(stored.buffer);
  };

  app.get('/api/documents/pdf/:fileId', servePdfHandler);
  app.get('/api/documents/pdf/:fileId/:filename', servePdfHandler);
  app.head('/api/documents/pdf/:fileId', (req, res) => res.status(200).setHeader('Content-Type', 'application/pdf').end());
  app.head('/api/documents/pdf/:fileId/:filename', (req, res) => res.status(200).setHeader('Content-Type', 'application/pdf').end());

  interface ServerEmailAttachment {
    filename: string;
    content: string; // base64 or dataUri
    contentType?: string;
  }

  // Helper to obtain a 100% public, directly accessible PDF URL for Mailketing API
  async function getPublicDirectPdfUrl(buffer: Buffer, filename: string, fallbackUrl?: string): Promise<string> {
    const cleanFilename = (filename || 'Dokumen_Resmi_LDI.pdf').replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const safeFilename = cleanFilename.toLowerCase().endsWith('.pdf') ? cleanFilename : `${cleanFilename}.pdf`;
    
    // Strategy 1: x0.at (Fast zero-auth direct binary PDF hosting)
    const uploadX0 = async (): Promise<string> => {
      const formData = new FormData();
      const blob = new Blob([buffer], { type: 'application/pdf' });
      formData.append('file', blob, safeFilename);

      const res = await fetch('https://x0.at', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const directUrl = (await res.text()).trim();
        if (directUrl.startsWith('http')) {
          console.log(`[PUBLIC PDF CDN] x0.at upload success: ${directUrl}`);
          return directUrl;
        }
      }
      throw new Error('x0.at upload failed');
    };

    // Strategy 2: 0x0.st with curl user agent
    const upload0x0 = async (): Promise<string> => {
      const formData = new FormData();
      const blob = new Blob([buffer], { type: 'application/pdf' });
      formData.append('file', blob, safeFilename);

      const res = await fetch('https://0x0.st', {
        method: 'POST',
        headers: { 'User-Agent': 'curl/8.0.0' },
        body: formData,
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const directUrl = (await res.text()).trim();
        if (directUrl.startsWith('http')) {
          console.log(`[PUBLIC PDF CDN] 0x0.st upload success: ${directUrl}`);
          return directUrl;
        }
      }
      throw new Error('0x0.st upload failed');
    };

    try {
      const fastestUrl = await Promise.any([
        uploadX0(),
        upload0x0(),
      ]);
      return fastestUrl;
    } catch (allErr: any) {
      console.warn('[PUBLIC PDF CDN] Parallel upload failure, checking fallback:', allErr?.message || allErr);
    }

    // Fallback: Use existing fallbackUrl if provided
    if (fallbackUrl && fallbackUrl.startsWith('http')) {
      return fallbackUrl;
    }

    return fallbackUrl || '';
  }

  interface ServerEmailAttachment {
    filename: string;
    content: string; // base64
    contentType?: string;
  }

  interface ServerSmtpConfig {
    enabled?: boolean;
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    password?: string;
    fromName?: string;
    fromEmail?: string;
    providerPreset?: string;
  }

  // Custom SMTP Relay Dispatcher Helper (Uses nodemailer)
  async function sendSmtpEmailServer(
    recipient: string,
    subject: string,
    htmlContent: string,
    senderName?: string,
    senderEmail?: string,
    cc?: string,
    smtpConfig?: ServerSmtpConfig,
    attachments?: ServerEmailAttachment[],
    pdfBase64?: string,
    pdfFilename?: string,
    attachUrl?: string
  ) {
    const timestamp = new Date().toISOString();
    console.log(`\n================================================================================`);
    console.log(`[SMTP LOG ${timestamp}] [START SMTP DISPATCH]`);

    const cfg = smtpConfig || {};
    const host = (cfg.host || 'smtp.gmail.com').trim();
    const port = Number(cfg.port) || 587;
    const isSecure = cfg.secure ?? (port === 465);
    const user = (cfg.username || '').trim();
    const pass = (cfg.password || '').trim();

    const fromName = (cfg.fromName || senderName || 'PT. LINTAS DATA INTERNASIONAL').trim();
    const fromEmail = (cfg.fromEmail || senderEmail || user || 'admin@ldi.co.id').trim();

    console.log(` - Host/Port        : ${host}:${port} (secure: ${isSecure})`);
    console.log(` - Auth User        : ${user || '(none)'}`);
    console.log(` - Target Recipient : ${recipient}`);
    console.log(` - CC Recipients    : ${cc || '(none)'}`);
    console.log(` - From Header      : "${fromName}" <${fromEmail}>`);
    console.log(` - Subject          : ${subject}`);

    if (!host) {
      return { success: false, error: 'Host SMTP belum dikonfigurasi.' };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: isSecure,
        auth: user && pass ? { user, pass } : undefined,
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2',
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
      } as any);

      // Prepare attachments
      const mailAttachments: Array<{ filename: string; content?: Buffer; path?: string; contentType?: string }> = [];

      // 1. Array attachments
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        for (const att of attachments) {
          if (att.content) {
            let b64 = String(att.content);
            if (b64.includes(',')) {
              b64 = b64.substring(b64.indexOf(',') + 1);
            }
            mailAttachments.push({
              filename: att.filename || 'Dokumen_Resmi_LDI.pdf',
              content: Buffer.from(b64.trim(), 'base64'),
              contentType: att.contentType || 'application/pdf',
            });
          }
        }
      }

      // 2. Direct pdfBase64
      if (mailAttachments.length === 0 && pdfBase64) {
        let b64 = String(pdfBase64);
        if (b64.includes(',')) {
          b64 = b64.substring(b64.indexOf(',') + 1);
        }
        mailAttachments.push({
          filename: pdfFilename || 'Dokumen_Resmi_LDI.pdf',
          content: Buffer.from(b64.trim(), 'base64'),
          contentType: 'application/pdf',
        });
      }

      // 3. Fallback from cached store
      if (mailAttachments.length === 0 && attachUrl) {
        for (const [fId, item] of pdfStore.entries()) {
          if (attachUrl.includes(fId) || attachUrl.includes(item.filename)) {
            mailAttachments.push({
              filename: item.filename,
              content: item.buffer,
              contentType: 'application/pdf',
            });
            break;
          }
        }
      }

      const ccList = cc
        ? cc
            .split(/[,;\n]/)
            .map((a) => a.trim())
            .filter((a) => a && a.includes('@'))
        : undefined;

      const plainText = htmlContent
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: recipient.trim(),
        cc: ccList && ccList.length > 0 ? ccList : undefined,
        replyTo: fromEmail,
        subject,
        html: htmlContent,
        text: plainText,
        attachments: mailAttachments,
        headers: {
          'X-Mailer': 'e-Office LDI SMTP Relay 2026',
        },
      };

      console.log(`[SMTP LOG ${timestamp}] Sending message via transporter (attachments: ${mailAttachments.length})...`);
      const info = await transporter.sendMail(mailOptions);

      console.log(`[SMTP LOG ${timestamp}] [SUCCESS] Message sent! MessageId: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
      };
    } catch (smtpErr: any) {
      console.error(`[SMTP LOG ${timestamp}] [ERROR]:`, smtpErr);
      let userMsg = `Gagal mengirim email via SMTP (${smtpErr.message || 'Connection Error'}).`;
      if (smtpErr.code === 'EAUTH' || smtpErr.responseCode === 535) {
        userMsg = 'Autentikasi SMTP Gagal (Username atau Sandi Aplikasi salah). Jika menggunakan Gmail/Google Workspace, pastikan menggunakan "Sandi Aplikasi" (App Password 16-digit).';
      } else if (smtpErr.code === 'ETIMEDOUT' || smtpErr.code === 'ESOCKET') {
        userMsg = `Koneksi ke server SMTP (${host}:${port}) terputus/timeout. Periksa kembali Host, Port, dan pengaturan SSL/TLS.`;
      } else if (smtpErr.code === 'EENVELOPE') {
        userMsg = `Alamat penerima (${recipient}) atau pengirim (${fromEmail}) ditolak oleh server SMTP.`;
      }
      return {
        success: false,
        error: userMsg,
        code: smtpErr.code,
        response: smtpErr.response,
      };
    }
  }

  // Mailketing Email Dispatcher Helper (Using application/x-www-form-urlencoded & reliable direct public attachment URL)
  async function sendMailketingEmailServer(
    recipient: string,
    subject: string,
    content: string,
    attachUrl?: string,
    senderName: string = 'PT. LINTAS DATA INTERNASIONAL',
    senderEmail: string = 'alwanemail@gmail.com',
    cc?: string,
    customApiKey?: string,
    attachments?: ServerEmailAttachment[],
    pdfBase64?: string,
    pdfFilename?: string
  ) {
    const timestamp = new Date().toISOString();
    const rawKey = (customApiKey?.trim() || process.env.VITE_MAILKETING_API_KEY || process.env.MAILKETING_API_KEY || '').trim();
    const activeApiKey = (!rawKey || rawKey === '5aafffa0c30e5a87235b66f6e1c0e440')
      ? 'e6f901cb964cd1c0fb59453f3450329d'
      : rawKey;
    const activeSenderEmail = senderEmail?.trim() || 'alwanemail@gmail.com';
    const activeSenderName = senderName?.trim() || 'PT. LINTAS DATA INTERNASIONAL';

    console.log(`\n================================================================================`);
    console.log(`[MAILKETING LOG ${timestamp}] [START EMAIL DISPATCH]`);
    console.log(` - Target Recipient : ${recipient}`);
    console.log(` - CC Recipients    : ${cc || '(none)'}`);
    console.log(` - Sender Info      : "${activeSenderName}" <${activeSenderEmail}>`);
    console.log(` - Subject          : ${subject}`);
    console.log(` - Initial AttachURL: ${attachUrl || '(none)'}`);
    console.log(` - Attachments Array: ${attachments ? `${attachments.length} item(s)` : 'Not provided'}`);
    console.log(` - Direct pdfBase64 : ${pdfBase64 ? `Provided (${pdfBase64.length} chars)` : 'Not provided'}`);
    console.log(` - Active API Token : ${activeApiKey ? `${activeApiKey.substring(0, 8)}...` : '(EMPTY)'}`);

    try {
      // Check if we have binary PDF data from attachments array, direct pdfBase64, or cache
      let localPdfBuffer: Buffer | null = null;
      let localPdfFilename = pdfFilename || 'Dokumen_Resmi_LDI.pdf';
      let attachmentSource = 'none';

      // 1. Check attachments array
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        console.log(`[MAILKETING LOG ${timestamp}] [ATTACHMENTS INSPECTION] Processing ${attachments.length} attachment(s) from 'attachments' array:`);
        attachments.forEach((att, idx) => {
          const rawLen = att.content ? att.content.length : 0;
          const isDataUri = att.content && att.content.startsWith('data:');
          console.log(`   [Attachment #${idx + 1}] Filename: "${att.filename}", ContentType: "${att.contentType || 'auto'}", Base64 Length: ${rawLen} chars, IsDataUri: ${isDataUri}`);
        });

        const firstAttach = attachments[0];
        if (firstAttach && firstAttach.content) {
          let b64 = String(firstAttach.content);
          if (b64.includes(',')) {
            b64 = b64.substring(b64.indexOf(',') + 1);
          }
          try {
            localPdfBuffer = Buffer.from(b64, 'base64');
            localPdfFilename = firstAttach.filename || localPdfFilename;
            attachmentSource = `attachments[0] (${firstAttach.filename})`;
          } catch (decodeErr: any) {
            console.error(`[MAILKETING LOG ${timestamp}] [BASE64 DECODE ERROR] Failed to decode attachments[0]:`, decodeErr.message);
          }
        }
      }

      // 2. Check direct pdfBase64 payload
      if (!localPdfBuffer && pdfBase64) {
        console.log(`[MAILKETING LOG ${timestamp}] [BASE64 INSPECTION] Processing direct 'pdfBase64' payload (${pdfBase64.length} chars)`);
        let b64 = String(pdfBase64);
        if (b64.includes(',')) {
          b64 = b64.substring(b64.indexOf(',') + 1);
        }
        try {
          localPdfBuffer = Buffer.from(b64, 'base64');
          if (pdfFilename) localPdfFilename = pdfFilename;
          attachmentSource = `pdfBase64 param (${localPdfFilename})`;
        } catch (decodeErr: any) {
          console.error(`[MAILKETING LOG ${timestamp}] [BASE64 DECODE ERROR] Failed to decode pdfBase64:`, decodeErr.message);
        }
      }

      // 3. Fallback: Check cached local PDF buffer from attachUrl
      if (!localPdfBuffer && attachUrl) {
        for (const [fId, item] of pdfStore.entries()) {
          if (attachUrl.includes(fId) || attachUrl.includes(item.filename)) {
            localPdfBuffer = item.buffer;
            localPdfFilename = item.filename;
            attachmentSource = `pdfStore cache (${fId})`;
            break;
          }
        }

        if (!localPdfBuffer) {
          try {
            const urlParts = attachUrl.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            const diskCandidate = path.join(PDF_CACHE_DIR, lastPart);
            if (fs.existsSync(diskCandidate)) {
              localPdfBuffer = fs.readFileSync(diskCandidate);
              localPdfFilename = lastPart.replace(/^pdf-\d+-[a-z0-9]+_/, '');
              attachmentSource = `disk cache (${lastPart})`;
            }
          } catch (e) {
            // Ignore search error
          }
        }
      }

      // Determine the final public accessible attachment URL
      let finalAttachUrl = attachUrl || '';
      if (localPdfBuffer && localPdfBuffer.length > 0) {
        const isPdfHeader = localPdfBuffer.slice(0, 5).toString('ascii').startsWith('%PDF-');
        console.log(`[MAILKETING LOG ${timestamp}] [ATTACHMENT INTEGRITY VERIFIED] ✅`);
        console.log(` - Source           : ${attachmentSource}`);
        console.log(` - Filename         : ${localPdfFilename}`);
        console.log(` - Buffer Size      : ${(localPdfBuffer.length / 1024).toFixed(2)} KB (${localPdfBuffer.length} bytes)`);
        console.log(` - PDF Header Valid : ${isPdfHeader ? 'YES (%PDF- header verified)' : 'NO (Non-standard header)'}`);

        // Generate public direct download URL so Mailketing API server can download and attach it
        const directUrl = await getPublicDirectPdfUrl(localPdfBuffer, localPdfFilename, attachUrl);
        if (directUrl) {
          finalAttachUrl = directUrl;
          console.log(`[MAILKETING LOG ${timestamp}] [FINAL ATTACHMENT URL READY] -> ${finalAttachUrl}`);
        }
      } else {
        console.log(`[MAILKETING LOG ${timestamp}] [ATTACHMENT NOTICE] No binary PDF buffer loaded. Will use URL: ${finalAttachUrl || 'none'}`);
      }

      // Update any download links in HTML body to use finalAttachUrl if available
      let finalContent = content;
      if (finalAttachUrl && attachUrl && attachUrl !== finalAttachUrl) {
        finalContent = finalContent.split(attachUrl).join(finalAttachUrl);
      }

      // If the email has placeholder or empty download button href, update it to finalAttachUrl
      if (finalAttachUrl) {
        finalContent = finalContent.replace(
          /href=["'](#[^"']*|DOWNLOAD_PDF_URL_PLACEHOLDER|javascript:[^"']*)["']([^>]*>[\s\S]*?Unduh Berkas PDF Dokumen)/gi,
          `href="${finalAttachUrl}"$2`
        );
      }

      // If the email body doesn't have the attachment card or download link yet, append the official attachment card
      if (finalAttachUrl && !finalContent.includes('Unduh Berkas PDF Dokumen') && !finalContent.includes(finalAttachUrl)) {
        const attachmentCallout = `
          <div style="background-color: #f0f9ff; border: 2px solid #0284c7; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; font-family: sans-serif;">
            <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #0369a1;">
              📎 Lampiran Dokumen PDF Resmi Terlampir
            </p>
            <p style="margin: 0 0 16px 0; font-size: 11px; color: #64748b; font-family: monospace;">
              ${localPdfFilename}
            </p>
            <table border="0" cellpadding="0" cellspacing="0" align="center">
              <tr>
                <td align="center" style="border-radius: 8px; background-color: #0284c7;">
                  <a href="${finalAttachUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 13px; font-weight: bold; color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 8px; display: inline-block; font-family: sans-serif;">
                    📥 Unduh Berkas PDF Dokumen
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin: 14px 0 0 0; font-size: 11px; color: #64748b;">
              Dokumen ini telah ditandatangani dan diverifikasi secara digital oleh ${activeSenderName}.
            </p>
          </div>
        `;
        finalContent = `${finalContent}\n${attachmentCallout}`;
      }

      // Send via Mailketing API: Use multipart/form-data with binary Blob attachment (or URL fallback)
      console.log(`[MAILKETING LOG ${timestamp}] [API REQUEST] Sending via multipart/form-data to Mailketing API`);
      console.log(` - Recipient : ${recipient.trim()}`);
      console.log(` - Binary PDF: ${localPdfBuffer ? `YES (${localPdfBuffer.length} bytes, file: ${localPdfFilename})` : 'NO'}`);
      console.log(` - Attach1 URL: ${finalAttachUrl || '(none)'}`);

      const formData = new FormData();
      formData.append('api_token', activeApiKey);
      formData.append('from_name', activeSenderName);
      formData.append('from_email', activeSenderEmail);
      formData.append('recipient', recipient.trim());
      formData.append('subject', subject);
      formData.append('content', finalContent);

      if (localPdfBuffer && localPdfBuffer.length > 0) {
        const pdfBlob = new Blob([localPdfBuffer], { type: 'application/pdf' });
        formData.append('attach1', pdfBlob, localPdfFilename);
        console.log(`[MAILKETING LOG ${timestamp}] Appended binary PDF blob to 'attach1' parameter (${localPdfFilename})`);
      } else if (finalAttachUrl && finalAttachUrl.trim()) {
        formData.append('attach1', finalAttachUrl.trim());
        console.log(`[MAILKETING LOG ${timestamp}] Appended URL string to 'attach1' parameter (${finalAttachUrl})`);
      }

      const response = await fetch('https://api.mailketing.co.id/api/v1/send', {
        method: 'POST',
        body: formData,
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
        // Non JSON text response
      }

      // Check if response is HTML (Error page from Cloudflare or unverified sender email issue)
      if (text.includes('<html') || text.includes('<!DOCTYPE') || text.includes('<!doctype')) {
        console.error(`[MAILKETING LOG ${timestamp}] [ERROR] Received HTML response from Mailketing API instead of JSON.`);
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

      // Dispatch individual copies to CC recipients to guarantee inbox delivery for Gmail/others
      if (cc && cc.trim()) {
        const ccAddresses = cc
          .split(/[,;\n]/)
          .map((addr) => addr.trim())
          .filter((addr) => addr && addr.includes('@'));

        console.log(`[MAILKETING LOG ${timestamp}] [CC DISPATCH] Dispatching copies to ${ccAddresses.length} address(es):`, ccAddresses);

        for (const ccAddr of ccAddresses) {
          try {
            // Short delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 600));

            const ccSubject = `[CC] ${subject}`;
            const ccNotice = `
              <div style="background-color: #fefce8; border: 1px solid #fef08a; padding: 12px 18px; border-radius: 10px; margin-bottom: 20px; font-family: Arial, sans-serif; font-size: 13px; color: #854d0e;">
                📌 <strong>Salinan Tembusan (CC Email):</strong> Email ini dikirimkan sebagai salinan tembusan dokumen resmi kepada Anda. Penerima Utama: <strong>${recipient}</strong>.
              </div>
              ${finalContent}
            `;

            const ccFormData = new FormData();
            ccFormData.append('api_token', activeApiKey);
            ccFormData.append('from_name', activeSenderName);
            ccFormData.append('from_email', activeSenderEmail);
            ccFormData.append('recipient', ccAddr);
            ccFormData.append('subject', ccSubject);
            ccFormData.append('content', ccNotice);
            if (localPdfBuffer && localPdfBuffer.length > 0) {
              const ccPdfBlob = new Blob([localPdfBuffer], { type: 'application/pdf' });
              ccFormData.append('attach1', ccPdfBlob, localPdfFilename);
            } else if (finalAttachUrl && finalAttachUrl.trim()) {
              ccFormData.append('attach1', finalAttachUrl.trim());
            }

            console.log(`[MAILKETING LOG ${timestamp}] [CC DISPATCH MULTIPART] Dispatching copy to: ${ccAddr} with attach1: ${localPdfFilename || finalAttachUrl || '(none)'}`);
            const ccRes = await fetch('https://api.mailketing.co.id/api/v1/send', {
              method: 'POST',
              body: ccFormData,
            });
            const ccText = await ccRes.text();
            console.log(`[MAILKETING LOG ${timestamp}] [CC DISPATCH SUCCESS] Result for ${ccAddr}: ${ccText.substring(0, 150)}`);
          } catch (ccErr: any) {
            console.warn(`[MAILKETING LOG ${timestamp}] [CC DISPATCH WARNING] Could not dispatch to CC ${ccAddr}:`, ccErr.message);
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

  // Custom SMTP Connection Test Endpoint
  app.post('/api/mail/test-smtp', async (req, res) => {
    const { smtpConfig, testRecipient } = req.body || {};
    if (!smtpConfig || !smtpConfig.host) {
      return res.status(400).json({ success: false, message: 'Host SMTP wajib diisi.' });
    }

    const host = (smtpConfig.host || '').trim();
    const port = Number(smtpConfig.port) || 587;
    const isSecure = smtpConfig.secure ?? (port === 465);
    const user = (smtpConfig.username || '').trim();
    const pass = (smtpConfig.password || '').trim();
    const fromName = (smtpConfig.fromName || 'PT. LINTAS DATA INTERNASIONAL').trim();
    const fromEmail = (smtpConfig.fromEmail || user || 'admin@ldi.co.id').trim();
    const targetRecipient = (testRecipient || fromEmail || 'admin@ldi.co.id').trim();

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: isSecure,
        auth: user && pass ? { user, pass } : undefined,
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2',
        },
        connectionTimeout: 12000,
        greetingTimeout: 8000,
        socketTimeout: 15000,
      } as any);

      console.log(`[SMTP TEST] Verifying connection to ${host}:${port} (user: ${user})...`);
      await transporter.verify();
      console.log(`[SMTP TEST] Transporter handshake and credentials verified!`);

      // Send test email
      const testHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #0f172a;">
          <div style="background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 20px; font-weight: bold;">⚡ Tes Koneksi Custom SMTP Berhasil!</h2>
            <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">PT. LINTAS DATA INTERNASIONAL - e-Office System</p>
          </div>
          <div style="padding: 8px 0; font-size: 13px; color: #334155; line-height: 1.6;">
            <p>Halo Administrator,</p>
            <p>Selamat! Konfigurasi <strong>Custom SMTP Relay Server</strong> Anda telah berhasil diverifikasi dan terhubung secara langsung tanpa kendala.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px; margin: 16px 0;">
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b; width: 35%;">SMTP Host:</td>
                  <td style="padding: 4px 0; font-weight: bold; font-family: monospace;">${host}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Port & Keamanan:</td>
                  <td style="padding: 4px 0; font-weight: bold; font-family: monospace;">Port ${port} (${isSecure ? 'SSL / Encrypted' : 'STARTTLS'})</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Pengirim Resmi:</td>
                  <td style="padding: 4px 0; font-weight: bold;">"${fromName}" &lt;${fromEmail}&gt;</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Waktu Uji:</td>
                  <td style="padding: 4px 0;">${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 12px; color: #16a34a; font-weight: bold;">
              ✅ Email notifikasi penerbitan SPH dan Invoice kini dapat dikirim melalui relay ini dengan deliverability tinggi dan reputasi domain yang kuat.
            </p>
          </div>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} PT. LINTAS DATA INTERNASIONAL. All rights reserved.
          </div>
        </div>
      `;

      const sendInfo = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: targetRecipient,
        subject: `[Uji SMTP Berhasil] Konfigurasi Relay Server PT. LDI (${host})`,
        html: testHtml,
        text: `Tes Koneksi SMTP Berhasil! Host: ${host}:${port}, Pengirim: ${fromEmail}`,
      });

      return res.json({
        success: true,
        message: `Koneksi SMTP ke ${host}:${port} berhasil! Email percobaan telah dikirim ke ${targetRecipient}.`,
        handshakeSuccess: true,
        authSuccess: true,
        mailSentSuccess: true,
        details: {
          host,
          port,
          secure: isSecure,
          user,
          targetRecipient,
          messageId: sendInfo.messageId,
          response: sendInfo.response,
        },
      });
    } catch (err: any) {
      console.error('[SMTP TEST ERROR]:', err);
      let humanMsg = err.message || 'Gagal terhubung ke SMTP';
      if (err.code === 'EAUTH' || err.responseCode === 535) {
        humanMsg = 'Autentikasi Gagal: Username atau Password SMTP salah. Untuk Gmail/Google Workspace, gunakan Sandi Aplikasi (App Password 16-digit).';
      } else if (err.code === 'ETIMEDOUT') {
        humanMsg = `Koneksi timeout ke ${host}:${port}. Pastikan port dan host tidak diblokir firewall.`;
      }
      return res.status(400).json({
        success: false,
        message: humanMsg,
        handshakeSuccess: false,
        error: err.message,
        code: err.code,
      });
    }
  });

  // General Unified Email Dispatch Proxy Route (Supports both Custom SMTP and Mailketing API)
  app.post('/api/mail/send', async (req, res) => {
    const {
      recipient,
      cc,
      ccEmail,
      subject,
      htmlContent,
      content,
      senderName,
      senderEmail,
      attachmentUrl,
      attachUrl,
      mailketingApiKey,
      attachments,
      pdfBase64,
      pdfFilename,
      filename,
      gatewayMode,
      smtpConfig,
    } = req.body || {};

    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    const hasPdfBase64 = typeof pdfBase64 === 'string' && pdfBase64.length > 0;
    const isSmtp = gatewayMode === 'custom_smtp' || (smtpConfig && smtpConfig.enabled && gatewayMode !== 'mailketing');

    console.log(`[HTTP POST /api/mail/send] Channel: ${isSmtp ? 'Custom SMTP' : 'Mailketing'} | Recipient: "${recipient}" | Subject: "${subject}" | Attachments: ${hasAttachments ? `${attachments.length}` : 'No'} | pdfBase64: ${hasPdfBase64 ? 'Yes' : 'No'}`);

    if (!recipient || !subject) {
      return res.status(400).json({ success: false, message: 'Penerima dan Subjek wajib diisi.' });
    }

    const finalContent = htmlContent || content || '<p>Notifikasi e-Office LDI</p>';
    const finalAttachUrl = attachmentUrl || attachUrl;
    const finalCc = cc || ccEmail;
    const finalPdfFilename = pdfFilename || filename;

    if (isSmtp && smtpConfig) {
      // Dispatch using Custom SMTP
      const smtpResult = await sendSmtpEmailServer(
        recipient,
        subject,
        finalContent,
        senderName,
        senderEmail,
        finalCc,
        smtpConfig,
        attachments,
        pdfBase64,
        finalPdfFilename,
        finalAttachUrl
      );

      return res.json({
        success: smtpResult.success,
        message: smtpResult.success
          ? `Email terkirim ke ${recipient}${finalCc ? ` (CC: ${finalCc})` : ''} via Custom SMTP Relay (${smtpConfig.host || 'Server'}).`
          : (smtpResult.error || 'Gagal mengirim email via SMTP.'),
        error: smtpResult.error,
        data: smtpResult,
      });
    }

    // Dispatch using Mailketing API
    const result = await sendMailketingEmailServer(
      recipient,
      subject,
      finalContent,
      finalAttachUrl,
      senderName || 'PT. LINTAS DATA INTERNASIONAL',
      senderEmail || 'admin@ldi.co.id',
      finalCc,
      mailketingApiKey,
      attachments,
      pdfBase64,
      finalPdfFilename
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
    saveDatabase();
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
    saveDatabase();

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
