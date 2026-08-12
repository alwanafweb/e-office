/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActivityLog, CompanyProfile, Customer, Invoice, PKS, SPH, User } from './types';
import {
  COMPANY_PROFILE,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_PKS,
  INITIAL_SPH,
} from './data/initialData';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { CustomerView } from './components/CustomerView';
import { SphView } from './components/SphView';
import { PksView } from './components/PksView';
import { InvoiceView } from './components/InvoiceView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { DocVerificationView } from './components/DocVerificationView';
import { DocPreviewModal } from './components/DocPreviewModal';
import { AuthModal } from './components/AuthModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { generateDocNumber } from './utils/formatters';
import {
  apiCheckHealth,
  apiGetCustomers,
  apiGetSPHs,
  apiGetPKSs,
  apiGetInvoices,
  apiCreateCustomer,
  apiUpdateCustomer,
  apiDeleteCustomer,
  apiCreateSPH,
  apiUpdateSPH,
  apiDeleteSPH,
  apiCreatePKS,
  apiUpdatePKS,
  apiDeletePKS,
  apiCreateInvoice,
  apiUpdateInvoice,
  apiDeleteInvoice,
} from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('verifyDoc'); // Public default view
  const [initialVerifyQuery, setInitialVerifyQuery] = useState<string>('');

  // Global Theme State (Light / Dark mode)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ldi_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    localStorage.setItem('ldi_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Current User / Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ldi_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [requestedTabAfterAuth, setRequestedTabAfterAuth] = useState<string | null>(null);

  // Sync current user to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ldi_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ldi_current_user');
    }
  }, [currentUser]);

  // Auto detect ?doc= or ?verify= parameter in URL for instant verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const docParam = params.get('doc') || params.get('verify');
      if (docParam) {
        setInitialVerifyQuery(docParam);
        setActiveTab('verifyDoc');
      }
    }
  }, []);

  // Detect /loginadmin path, hash or search parameter to trigger Admin Login Modal
  useEffect(() => {
    const checkLoginAdminRoute = () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        const hash = window.location.hash.toLowerCase();

        if (path.includes('loginadmin') || search.includes('loginadmin') || hash.includes('loginadmin')) {
          setIsAuthModalOpen(true);
          // Clean URL path back to root without reloading page
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname.replace(/\/loginadmin/i, '/').replace(/\?loginadmin/i, ''));
          }
        }
      }
    };

    checkLoginAdminRoute();

    window.addEventListener('popstate', checkLoginAdminRoute);
    window.addEventListener('hashchange', checkLoginAdminRoute);

    return () => {
      window.removeEventListener('popstate', checkLoginAdminRoute);
      window.removeEventListener('hashchange', checkLoginAdminRoute);
    };
  }, []);

  // Load from localStorage or seed initial data
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem('ldi_company_profile');
    return saved ? JSON.parse(saved) : COMPANY_PROFILE;
  });

  // Dynamic update favicon & title in browser tab
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const activeFavicon = companyProfile.faviconUrl || companyProfile.logoUrl;
      if (activeFavicon) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'shortcut icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = activeFavicon;
      }
      if (companyProfile.name) {
        document.title = `${companyProfile.name} - E-Office System`;
      }
    }
  }, [companyProfile.faviconUrl, companyProfile.logoUrl, companyProfile.name]);

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const resetDone = localStorage.getItem('ldi_reset_v2_clean');
    if (!resetDone) {
      localStorage.removeItem('ldi_customers');
      localStorage.removeItem('ldi_sph_list');
      localStorage.removeItem('ldi_pks_list');
      localStorage.removeItem('ldi_invoices');
      localStorage.setItem('ldi_reset_v2_clean', 'true');
      return [];
    }
    const saved = localStorage.getItem('ldi_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [sphList, setSphList] = useState<SPH[]>(() => {
    const resetDone = localStorage.getItem('ldi_reset_v2_clean');
    if (!resetDone) return [];
    const saved = localStorage.getItem('ldi_sph_list');
    return saved ? JSON.parse(saved) : [];
  });

  const [pksList, setPksList] = useState<PKS[]>(() => {
    const resetDone = localStorage.getItem('ldi_reset_v2_clean');
    if (!resetDone) return [];
    const saved = localStorage.getItem('ldi_pks_list');
    return saved ? JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const resetDone = localStorage.getItem('ldi_reset_v2_clean');
    if (!resetDone) return [];
    const saved = localStorage.getItem('ldi_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('ldi_activity_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'log-init-1',
        timestamp: new Date().toISOString(),
        action: 'Sistem',
        docType: 'Pengaturan',
        docNumberOrName: 'Sistem Portal LDI',
        performedBy: 'Irwan Setiawan, S.T.',
        details: 'Sistem administrasi & portal verifikasi dokumen LDI diaktifkan.',
      },
    ];
  });

  const [deleteModalInfo, setDeleteModalInfo] = useState<{
    itemType: 'Pelanggan' | 'SPH' | 'PKS' | 'Invoice';
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem('ldi_activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  const addActivityLog = (
    action: ActivityLog['action'],
    docType: ActivityLog['docType'],
    docNumberOrName: string,
    details: string
  ) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      docType,
      docNumberOrName,
      performedBy: currentUser?.name || companyProfile.directorName || 'Admin LDI',
      details,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const handleClearActivityLogs = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan riwayat log aktivitas?')) {
      setActivityLogs([]);
      localStorage.removeItem('ldi_activity_logs');
    }
  };

  const handleResetAllData = () => {
    setCustomers([]);
    setSphList([]);
    setPksList([]);
    setInvoices([]);
    localStorage.removeItem('ldi_customers');
    localStorage.removeItem('ldi_sph_list');
    localStorage.removeItem('ldi_pks_list');
    localStorage.removeItem('ldi_invoices');
    addActivityLog('Sistem', 'Pengaturan', 'Database', 'Seluruh data operasional direset oleh Admin');
  };

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<{
    type: 'SPH' | 'PKS' | 'Invoice';
    data: SPH | PKS | Invoice;
  } | null>(null);

  const [preSelectedCustomer, setPreSelectedCustomer] = useState<Customer | null>(null);

  // Cloudflare D1 Connection State
  const [d1Status, setD1Status] = useState<'connected' | 'loading' | 'offline'>('loading');

  // Fetch initial data from Cloudflare Worker D1 Database
  useEffect(() => {
    let isMounted = true;
    async function loadDataFromD1() {
      try {
        const health = await apiCheckHealth();
        if (health && health.status === 'online') {
          if (isMounted) setD1Status('loading');

          const [fetchedCustomers, fetchedSphs, fetchedPkss, fetchedInvoices] = await Promise.all([
            apiGetCustomers().catch(() => []),
            apiGetSPHs().catch(() => []),
            apiGetPKSs().catch(() => []),
            apiGetInvoices().catch(() => []),
          ]);

          if (isMounted) {
            if (fetchedCustomers && fetchedCustomers.length > 0) setCustomers(fetchedCustomers);
            if (fetchedSphs && fetchedSphs.length > 0) setSphList(fetchedSphs);
            if (fetchedPkss && fetchedPkss.length > 0) setPksList(fetchedPkss);
            if (fetchedInvoices && fetchedInvoices.length > 0) setInvoices(fetchedInvoices);
            setD1Status('connected');
          }
        } else {
          if (isMounted) setD1Status('offline');
        }
      } catch (err) {
        console.warn('Cloudflare Worker D1 connection unavailable, using Local Storage:', err);
        if (isMounted) setD1Status('offline');
      }
    }

    loadDataFromD1();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('ldi_company_profile', JSON.stringify(companyProfile));
  }, [companyProfile]);

  useEffect(() => {
    localStorage.setItem('ldi_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('ldi_sph_list', JSON.stringify(sphList));
  }, [sphList]);

  useEffect(() => {
    localStorage.setItem('ldi_pks_list', JSON.stringify(pksList));
  }, [pksList]);

  useEffect(() => {
    localStorage.setItem('ldi_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Customer Handlers
  const handleAddCustomer = (cust: Customer) => {
    setCustomers([cust, ...customers]);
    addActivityLog('Dibuat', 'Pelanggan', cust.companyName, `Menambahkan data pelanggan baru: ${cust.companyName}`);
    apiCreateCustomer(cust).catch((e) => console.error('D1 Create Customer Error:', e));
  };

  const handleUpdateCustomer = (cust: Customer) => {
    setCustomers(customers.map((c) => (c.id === cust.id ? cust : c)));
    addActivityLog('Diubah', 'Pelanggan', cust.companyName, `Memperbarui data profil pelanggan ${cust.companyName}`);
    apiUpdateCustomer(cust.id, cust).catch((e) => console.error('D1 Update Customer Error:', e));
  };

  const handleDeleteCustomer = (id: string) => {
    const cust = customers.find((c) => c.id === id);
    if (cust) {
      setDeleteModalInfo({
        itemType: 'Pelanggan',
        id: cust.id,
        name: cust.companyName,
      });
    }
  };

  const handleCreateSphForCustomer = (cust: Customer) => {
    setPreSelectedCustomer(cust);
    setActiveTab('sph');
  };

  const handleCreateInvoiceForCustomer = (cust: Customer) => {
    setPreSelectedCustomer(cust);
    setActiveTab('invoices');
  };

  // SPH Handlers
  const handleAddSph = (sph: SPH) => {
    setSphList([sph, ...sphList]);
    addActivityLog('Dibuat', 'SPH', sph.sphNumber, `Menerbitkan Penawaran Harga (SPH) untuk ${sph.customerName}`);
    apiCreateSPH(sph).catch((e) => console.error('D1 Create SPH Error:', e));
  };

  const handleUpdateSph = (sph: SPH) => {
    setSphList(sphList.map((s) => (s.id === sph.id ? sph : s)));
    addActivityLog('Diubah', 'SPH', sph.sphNumber, `Memperbarui rincian dokumen Penawaran Harga`);
    apiUpdateSPH(sph.id, sph).catch((e) => console.error('D1 Update SPH Error:', e));
  };

  const handleDeleteSph = (id: string) => {
    const targetSph = sphList.find((s) => s.id === id);
    if (targetSph) {
      if (targetSph.isLocked) {
        alert(`Dokumen SPH ${targetSph.sphNumber} sedang DIKUNCI (Locked). Buka kunci dokumen terlebih dahulu di tombol kunci jika ingin menghapusnya.`);
        return;
      }
      setDeleteModalInfo({
        itemType: 'SPH',
        id: targetSph.id,
        name: targetSph.sphNumber,
      });
    }
  };

  // INSTANT SPH TO PKS CONVERSION FUNCTION
  const handleConvertToPks = (sph: SPH) => {
    const pksSeq = pksList.length + 1;
    const newPksNumber = generateDocNumber('PKS', pksSeq);

    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const monthlyVal = sph.items.reduce((acc, it) => acc + (it.qty * it.price - (it.discount || 0)), 0);

    const newPks: PKS = {
      id: `PKS-${Date.now()}`,
      pksNumber: newPksNumber,
      sphReferenceNumber: sph.sphNumber,
      customerId: sph.customerId,
      customerName: sph.customerName,
      customerRepresentative: 'Contact Person',
      customerRepPosition: 'Direktur / Penanggung Jawab',
      customerAddress: sph.customerAddress,
      startDate: today,
      endDate: endDate.toISOString().split('T')[0],
      contractDurationMonths: 12,
      serviceItems: sph.items,
      monthlyValue: monthlyVal,
      totalContractValue: monthlyVal * 12,
      slaPercent: 99.9,
      clauses: [
        {
          article: 1,
          title: 'RUANG LINGKUP PEKERJAAN & INFRASTRUKTUR',
          content: `PIHAK PERTAMA (${companyProfile.legalName}) sepakat menyediakan layanan ${sph.items.map((i) => i.name).join(', ')} kepada PIHAK KEDUA (${sph.customerName}) sesuai standar kualitas Jagoanserver.com.`,
        },
        {
          article: 2,
          title: 'NILAI KONTRAK & SKEMA PEMBAYARAN',
          content: `Nilai langganan rutin adalah sebesar Rp ${monthlyVal.toLocaleString('id-ID')},- per bulan belum termasuk PPN 11%. Pembayaran dilakukan paling lambat tanggal 10 setiap bulannya ke rekening Bank resmi PT. Lintas Data Internasional.`,
        },
        {
          article: 3,
          title: 'SERVICE LEVEL AGREEMENT (SLA 99.9%)',
          content: `PIHAK PERTAMA menjamin ketersediaan jaringan dan server (Uptime) sebesar 99.9% setiap bulan dengan garansi dukungan teknis 24/7.`,
        },
        {
          article: 4,
          title: 'KERAHASIAAN DATA (NON-DISCLOSURE AGREEMENT)',
          content: `Para pihak sepakat untuk menjaga seluruh data jaringan, server, dan rahasia bisnis yang tertera dalam perjanjian ini.`,
        },
        {
          article: 5,
          title: 'PENYELESAIAN PERSELISIHAN',
          content: `Segala perselisihan yang timbul akan diselesaikan secara musyawarah untuk mufakat atau melalui Pengadilan Negeri Tangerang.`,
        },
      ],
      status: 'Menunggu TTD',
      party1Signed: true,
      party1SignerName: companyProfile.directorName,
      party1SignerPosition: companyProfile.directorPosition,
      party2Signed: false,
      party2SignerName: 'Penanggung Jawab Pelanggan',
      party2SignerPosition: 'Direktur / VP IT',
      signedDate: today,
    };

    // Update SPH status
    const updatedSph: SPH = {
      ...sph,
      status: 'Dikonversi ke PKS',
      pksConvertedId: newPks.id,
    };

    setSphList(sphList.map((s) => (s.id === sph.id ? updatedSph : s)));
    setPksList([newPks, ...pksList]);

    addActivityLog('Status Diubah', 'SPH', sph.sphNumber, `SPH dikonversi menjadi Kontrak PKS No. ${newPksNumber}`);
    addActivityLog('Dibuat', 'PKS', newPksNumber, `PKS diterbitkan dari hasil konversi SPH ${sph.sphNumber}`);

    // Redirect to PKS view
    setActiveTab('pks');
    alert(`Berhasil! SPH ${sph.sphNumber} telah dikonversi menjadi Perjanjian Kerja Sama (PKS) No. ${newPksNumber}`);
  };

  // INSTANT SPH TO INVOICE CONVERSION FUNCTION
  const handleConvertToInvoice = (sph: SPH) => {
    const invSeq = invoices.length + 1;
    const newInvoiceNumber = generateDocNumber('INV', invSeq);

    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: newInvoiceNumber,
      customerId: sph.customerId,
      customerName: sph.customerName,
      customerAddress: sph.customerAddress,
      customerPhone: sph.customerPhone,
      customerEmail: sph.customerEmail,
      sphReference: sph.sphNumber,
      issueDate: today,
      dueDate: dueDate.toISOString().split('T')[0],
      items: sph.items,
      subtotal: sph.subtotal,
      discountTotal: sph.discountTotal,
      taxPercent: sph.taxPercent,
      taxAmount: sph.taxAmount,
      grandTotal: sph.grandTotal,
      status: 'Belum Bayar',
      bankInfo: companyProfile.bankDetails.find((b) => b.isDefault) || companyProfile.bankDetails[0] || {
        bankName: 'Bank Central Asia (BCA)',
        accountNumber: '8830-1928-33',
        accountHolder: companyProfile.legalName,
        branch: 'KCP Utama',
      },
      signedByFinance: companyProfile.financeManager || companyProfile.directorName,
    };

    // Update SPH status
    const updatedSph: SPH = {
      ...sph,
      status: 'Dikonversi ke Invoice',
      invoiceConvertedId: newInvoice.id,
    };

    setSphList(sphList.map((s) => (s.id === sph.id ? updatedSph : s)));
    setInvoices([newInvoice, ...invoices]);

    addActivityLog('Status Diubah', 'SPH', sph.sphNumber, `SPH dikonversi menjadi Invoice Tagihan No. ${newInvoiceNumber}`);
    addActivityLog('Dibuat', 'Invoice', newInvoiceNumber, `Invoice diterbitkan dari hasil konversi SPH ${sph.sphNumber}`);

    // Redirect to Invoice view
    setActiveTab('invoices');
    alert(`Berhasil! SPH ${sph.sphNumber} telah dikonversi menjadi Invoice Tagihan No. ${newInvoiceNumber}`);
  };

  // PKS Handlers
  const handleAddPks = (pks: PKS) => {
    setPksList([pks, ...pksList]);
    addActivityLog('Dibuat', 'PKS', pks.pksNumber, `Menerbitkan Perjanjian Kerja Sama dengan ${pks.customerName}`);
    apiCreatePKS(pks).catch((e) => console.error('D1 Create PKS Error:', e));
  };

  const handleUpdatePks = (pks: PKS) => {
    setPksList(pksList.map((p) => (p.id === pks.id ? pks : p)));
    addActivityLog('Diubah', 'PKS', pks.pksNumber, `Memperbarui rincian/klausa Perjanjian Kerja Sama`);
    apiUpdatePKS(pks.id, pks).catch((e) => console.error('D1 Update PKS Error:', e));
  };

  const handleDeletePks = (id: string) => {
    const targetPks = pksList.find((p) => p.id === id);
    if (targetPks) {
      if (targetPks.isLocked) {
        alert(`Dokumen PKS ${targetPks.pksNumber} sedang DIKUNCI (Locked). Buka kunci dokumen terlebih dahulu di tombol kunci jika ingin menghapusnya.`);
        return;
      }
      setDeleteModalInfo({
        itemType: 'PKS',
        id: targetPks.id,
        name: targetPks.pksNumber,
      });
    }
  };

  // Invoice Handlers
  const handleAddInvoice = (inv: Invoice) => {
    setInvoices([inv, ...invoices]);
    addActivityLog('Dibuat', 'Invoice', inv.invoiceNumber, `Menerbitkan Invoice Tagihan untuk ${inv.customerName}`);
    apiCreateInvoice(inv).catch((e) => console.error('D1 Create Invoice Error:', e));
  };

  const handleUpdateInvoice = (inv: Invoice) => {
    setInvoices(invoices.map((i) => (i.id === inv.id ? inv : i)));
    addActivityLog('Diubah', 'Invoice', inv.invoiceNumber, `Memperbarui data/status pembayaran invoice`);
    apiUpdateInvoice(inv.id, inv).catch((e) => console.error('D1 Update Invoice Error:', e));
  };

  const handleDeleteInvoice = (id: string) => {
    const targetInv = invoices.find((i) => i.id === id);
    if (targetInv) {
      if (targetInv.isLocked) {
        alert(`Dokumen Invoice ${targetInv.invoiceNumber} sedang DIKUNCI (Locked). Buka kunci dokumen terlebih dahulu di tombol kunci jika ingin menghapusnya.`);
        return;
      }
      setDeleteModalInfo({
        itemType: 'Invoice',
        id: targetInv.id,
        name: targetInv.invoiceNumber,
      });
    }
  };

  const handleConfirmDeleteFromModal = () => {
    if (!deleteModalInfo) return;
    const { itemType, id, name } = deleteModalInfo;

    if (itemType === 'Pelanggan') {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      addActivityLog('Dihapus', 'Pelanggan', name, `Menghapus data pelanggan dari sistem`);
      apiDeleteCustomer(id).catch((e) => console.error('D1 Delete Customer Error:', e));
    } else if (itemType === 'SPH') {
      setSphList((prev) => prev.filter((s) => s.id !== id));
      addActivityLog('Dihapus', 'SPH', name, `Menghapus dokumen SPH dari sistem`);
      apiDeleteSPH(id).catch((e) => console.error('D1 Delete SPH Error:', e));
    } else if (itemType === 'PKS') {
      setPksList((prev) => prev.filter((p) => p.id !== id));
      addActivityLog('Dihapus', 'PKS', name, `Menghapus dokumen PKS dari sistem`);
      apiDeletePKS(id).catch((e) => console.error('D1 Delete PKS Error:', e));
    } else if (itemType === 'Invoice') {
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      addActivityLog('Dihapus', 'Invoice', name, `Menghapus Invoice dari sistem`);
      apiDeleteInvoice(id).catch((e) => console.error('D1 Delete Invoice Error:', e));
    }

    setDeleteModalInfo(null);
  };

  const unpaidInvoicesCount = invoices.filter((i) => i.status === 'Belum Bayar' || i.status === 'Jatuh Tempo').length;

  // Auth Action Handlers
  const handleOpenAuthModal = (requestedTab?: string) => {
    if (requestedTab) {
      setRequestedTabAfterAuth(requestedTab);
    } else {
      setRequestedTabAfterAuth(null);
    }
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    addActivityLog('Sistem', 'Pengaturan', user.name, `User ${user.name} (${user.role}) berhasil masuk/login`);
    if (requestedTabAfterAuth) {
      setActiveTab(requestedTabAfterAuth);
      setRequestedTabAfterAuth(null);
    } else if (activeTab === 'verifyDoc') {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      addActivityLog('Sistem', 'Pengaturan', currentUser.name, `User ${currentUser.name} keluar/logout`);
    }
    setCurrentUser(null);
    setActiveTab('verifyDoc'); // Switch to public verification view upon logout
  };

  const handleUpdateStatusToSent = (docType: 'SPH' | 'PKS' | 'Invoice', docId: string) => {
    let docNum = docId;
    if (docType === 'SPH') {
      const target = sphList.find((s) => s.id === docId);
      if (target) docNum = target.sphNumber;
      setSphList((prev) =>
        prev.map((item) => (item.id === docId && item.status === 'Draft' ? { ...item, status: 'Dikirim' } : item))
      );
    } else if (docType === 'Invoice') {
      const target = invoices.find((i) => i.id === docId);
      if (target) docNum = target.invoiceNumber;
      setInvoices((prev) =>
        prev.map((item) => (item.id === docId && item.status === 'Draft' ? { ...item, status: 'Belum Bayar' } : item))
      );
    }
    addActivityLog('Dikirim', docType, docNum, `Dokumen ${docType} dikirim via Email ke pelanggan`);
  };

  const handleSignDocument = (docType: 'SPH' | 'PKS' | 'Invoice', docId: string, signatureData: string) => {
    let docNum = docId;
    if (docType === 'SPH') {
      const target = sphList.find((s) => s.id === docId);
      if (target) docNum = target.sphNumber;
      setSphList((prev) =>
        prev.map((item) => (item.id === docId ? { ...item, signedByLDI: signatureData, signedDate: new Date().toISOString().split('T')[0] } : item))
      );
    } else if (docType === 'PKS') {
      const target = pksList.find((p) => p.id === docId);
      if (target) docNum = target.pksNumber;
      setPksList((prev) =>
        prev.map((item) => (item.id === docId ? { ...item, party1Signed: true } : item))
      );
    } else if (docType === 'Invoice') {
      const target = invoices.find((i) => i.id === docId);
      if (target) docNum = target.invoiceNumber;
      setInvoices((prev) =>
        prev.map((item) => (item.id === docId ? { ...item, signedByFinance: signatureData } : item))
      );
    }
    addActivityLog('Ditandatangani', docType, docNum, `Dokumen ${docType} ditandatangani secara digital oleh Admin`);
  };

  const handleToggleLockDocument = (type: 'SPH' | 'PKS' | 'Invoice', id: string, forceState?: boolean) => {
    if (type === 'SPH') {
      const target = sphList.find((s) => s.id === id);
      const newLocked = forceState !== undefined ? forceState : !target?.isLocked;
      setSphList((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                isLocked: newLocked,
                lockedAt: newLocked ? new Date().toISOString() : undefined,
                lockedBy: currentUser?.name || 'Admin LDI',
              }
            : item
        )
      );
      if (target) {
        addActivityLog(
          'Diubah',
          'SPH',
          target.sphNumber,
          newLocked
            ? `DOKUMEN DIKUNCI (LOCKED) — PDF Penawaran SPH telah dikunci agar tidak dapat diubah sembarangan`
            : `DOKUMEN DIBUKA KUNCI (UNLOCKED) — Kunci SPH dibuka untuk pengeditan`
        );
      }
    } else if (type === 'PKS') {
      const target = pksList.find((p) => p.id === id);
      const newLocked = forceState !== undefined ? forceState : !target?.isLocked;
      setPksList((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                isLocked: newLocked,
                lockedAt: newLocked ? new Date().toISOString() : undefined,
                lockedBy: currentUser?.name || 'Admin LDI',
              }
            : item
        )
      );
      if (target) {
        addActivityLog(
          'Diubah',
          'PKS',
          target.pksNumber,
          newLocked
            ? `DOKUMEN DIKUNCI (LOCKED) — PDF Kontrak PKS telah dikunci agar tidak dapat diubah sembarangan`
            : `DOKUMEN DIBUKA KUNCI (UNLOCKED) — Kunci PKS dibuka untuk pengeditan`
        );
      }
    } else if (type === 'Invoice') {
      const target = invoices.find((i) => i.id === id);
      const newLocked = forceState !== undefined ? forceState : !target?.isLocked;
      setInvoices((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                isLocked: newLocked,
                lockedAt: newLocked ? new Date().toISOString() : undefined,
                lockedBy: currentUser?.name || 'Admin LDI',
              }
            : item
        )
      );
      if (target) {
        addActivityLog(
          'Diubah',
          'Invoice',
          target.invoiceNumber,
          newLocked
            ? `DOKUMEN DIKUNCI (LOCKED) — PDF Invoice telah dikunci agar tidak dapat diubah sembarangan`
            : `DOKUMEN DIBUKA KUNCI (UNLOCKED) — Kunci Invoice dibuka untuk pengeditan`
        );
      }
    }

    setPreviewDoc((prev) => {
      if (prev && prev.type === type && prev.data.id === id) {
        const targetLocked = forceState !== undefined ? forceState : !prev.data.isLocked;
        return {
          ...prev,
          data: {
            ...prev.data,
            isLocked: targetLocked,
            lockedAt: targetLocked ? new Date().toISOString() : undefined,
            lockedBy: currentUser?.name || 'Admin LDI',
          },
        };
      }
      return prev;
    });
  };

  const handleUpdateProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    addActivityLog('Diubah', 'Pengaturan', 'Profil Perusahaan', 'Memperbarui profil perusahaan, template email, & stempel TTD');
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col antialiased transition-colors duration-200 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Top Header Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unpaidCount={unpaidInvoicesCount}
        companyProfile={companyProfile}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        d1Status={d1Status}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && currentUser && (
          <DashboardView
            invoices={invoices}
            sphList={sphList}
            pksList={pksList}
            customers={customers}
            activityLogs={activityLogs}
            onClearActivityLogs={handleClearActivityLogs}
            onNavigateTo={setActiveTab}
            onPreviewDoc={(type, data) => setPreviewDoc({ type, data })}
          />
        )}

        {activeTab === 'customers' && currentUser && (
          <CustomerView
            customers={customers}
            sphList={sphList}
            pksList={pksList}
            invoices={invoices}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onCreateSphForCustomer={handleCreateSphForCustomer}
            onCreateInvoiceForCustomer={handleCreateInvoiceForCustomer}
          />
        )}

        {activeTab === 'sph' && currentUser && (
          <SphView
            sphList={sphList}
            customers={customers}
            onAddSph={handleAddSph}
            onUpdateSph={handleUpdateSph}
            onDeleteSph={handleDeleteSph}
            onConvertToPks={handleConvertToPks}
            onConvertToInvoice={handleConvertToInvoice}
            onPreviewSph={(sph) => setPreviewDoc({ type: 'SPH', data: sph })}
            preSelectedCustomer={preSelectedCustomer}
            onToggleLockDocument={handleToggleLockDocument}
          />
        )}

        {activeTab === 'pks' && currentUser && (
          <PksView
            pksList={pksList}
            customers={customers}
            sphList={sphList}
            onAddPks={handleAddPks}
            onUpdatePks={handleUpdatePks}
            onDeletePks={handleDeletePks}
            onPreviewPks={(pks) => setPreviewDoc({ type: 'PKS', data: pks })}
            onToggleLockDocument={handleToggleLockDocument}
          />
        )}

        {activeTab === 'invoices' && currentUser && (
          <InvoiceView
            invoices={invoices}
            customers={customers}
            sphList={sphList}
            pksList={pksList}
            companyProfile={companyProfile}
            onAddInvoice={handleAddInvoice}
            onUpdateInvoice={handleUpdateInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onPreviewInvoice={(inv) => setPreviewDoc({ type: 'Invoice', data: inv })}
            preSelectedCustomer={preSelectedCustomer}
            onUpdateCompanyProfile={handleUpdateProfile}
            onToggleLockDocument={handleToggleLockDocument}
          />
        )}

        {(activeTab === 'verifyDoc' || (!currentUser && activeTab !== 'verifyDoc')) && (
          <DocVerificationView
            sphList={sphList}
            pksList={pksList}
            invoices={invoices}
            companyProfile={companyProfile}
            initialDocQuery={initialVerifyQuery}
            onPreviewDoc={(type, data) => setPreviewDoc({ type, data })}
          />
        )}

        {activeTab === 'settings' && currentUser && (
          <CompanySettingsView
            companyProfile={companyProfile}
            onUpdateProfile={handleUpdateProfile}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Auth Modal (Masuk, Daftar, Lupa Password) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        targetTabName={
          requestedTabAfterAuth === 'dashboard'
            ? 'Dashboard Admin'
            : requestedTabAfterAuth === 'customers'
            ? 'Pelanggan CRM'
            : requestedTabAfterAuth === 'sph'
            ? 'Quotation (SPH)'
            : requestedTabAfterAuth === 'pks'
            ? 'Kontrak PKS'
            : requestedTabAfterAuth === 'invoices'
            ? 'Invoice Manager'
            : requestedTabAfterAuth === 'settings'
            ? 'Profil PT. LDI'
            : undefined
        }
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 print:hidden mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="font-bold text-slate-300">
            PT. LINTAS DATA INTERNASIONAL — Jagoanserver.com
          </p>
          <p className="text-slate-500 text-[11px]">
            My Republic Plaza, Jl. BSD Green Office Park Wing A Lantai Dasar Zona 6, Sampora, Cisauk, Tangerang, Banten 15345 | Support: support@ldi.co.id
          </p>
        </div>
      </footer>

      {/* Delete Confirmation Modal */}
      {deleteModalInfo && (
        <DeleteConfirmModal
          isOpen={!!deleteModalInfo}
          itemType={deleteModalInfo.itemType}
          itemName={deleteModalInfo.name}
          onConfirm={handleConfirmDeleteFromModal}
          onClose={() => setDeleteModalInfo(null)}
        />
      )}

      {/* Printable PDF Preview Modal */}
      {previewDoc && (
        <DocPreviewModal
          type={previewDoc.type}
          data={previewDoc.data}
          companyProfile={companyProfile}
          onClose={() => setPreviewDoc(null)}
          onSignDocument={handleSignDocument}
          onUpdateStatusToSent={handleUpdateStatusToSent}
          onConvertToInvoice={handleConvertToInvoice}
          onConvertToPks={handleConvertToPks}
          onToggleLockDocument={handleToggleLockDocument}
        />
      )}
    </div>
  );
}
