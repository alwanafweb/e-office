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
