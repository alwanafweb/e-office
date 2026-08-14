import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { CompanyProfile, Invoice, PKS, SPH, ItemService } from '../types';
import { formatDateIndonesian, formatIDR, terbilangRupiah } from './formatters';
import { COMPANY_PROFILE } from '../data/initialData';

export const getOfficialDomain = (customWebsite?: string): string => {
  if (!customWebsite) return 'e-office.ldi.co.id';
  const clean = customWebsite.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
  if (!clean || clean.toLowerCase().includes('jagoan') || clean.toLowerCase().includes('localhost') || clean.toLowerCase().includes('run.app')) {
    return 'e-office.ldi.co.id';
  }
  return clean;
};

export const exportToPdf = async (elementId: string, filename: string): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id '${elementId}' not found for PDF export.`);
    return false;
  }

  try {
    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth || 800,
    });

    window.scrollTo(0, originalScrollPos);

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(cleanFilename);
    return true;
  } catch (err) {
    console.error('Error generating PDF:', err);
    window.print();
    return false;
  }
};

export const generatePdfBase64 = async (
  elementId: string,
  filename: string
): Promise<{ base64: string; filename: string } | null> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with id '${elementId}' not found for DOM PDF Base64 generation. Falling back to programmatic PDF.`);
    return null;
  }

  try {
    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth || 800,
    });

    window.scrollTo(0, originalScrollPos);

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const dataUrl = pdf.output('datauristring');
    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    return {
      base64: dataUrl,
      filename: cleanFilename,
    };
  } catch (err) {
    console.error('Error generating PDF Base64:', err);
    return null;
  }
};

/**
 * Draws the Official Indonesian Kop Surat Header for PT. LDI
 */
const drawOfficialKopSurat = (pdf: jsPDF, profile: CompanyProfile) => {
  // Top stylized corporate badge / logo placeholder
  const darkNavy: [number, number, number] = [15, 23, 42]; // #0f172a
  const cyanBlue: [number, number, number] = [6, 182, 212]; // #06b6d4
  const slateText: [number, number, number] = [71, 85, 105]; // #475569

  // Stylized LDI Logo Icon
  pdf.setFillColor(15, 23, 42);
  pdf.roundedRect(16, 10, 14, 14, 2.5, 2.5, 'F');
  pdf.setDrawColor(6, 182, 212);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(16, 10, 14, 14, 2.5, 2.5, 'S');

  // Mini server rack lines inside badge
  pdf.setFillColor(6, 182, 212);
  pdf.rect(19, 13, 8, 2, 'F');
  pdf.rect(19, 16.5, 8, 2, 'F');
  pdf.rect(19, 20, 8, 2, 'F');

  // Company Legal Name - Centered
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.setTextColor(...darkNavy);
  pdf.text(profile.legalName || 'PT. LINTAS DATA INTERNASIONAL', 105, 14, { align: 'center' });

  // Subtitle / Tagline
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...slateText);
  pdf.text('HIGH PERFORMANCE CLOUD, INTERNET DEDICATED & DATACENTER PROVIDER', 105, 18, { align: 'center' });

  // Company Address
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(51, 65, 85);
  const addressText = profile.address || 'My Republic Plaza, Jl. BSD Green Office Park Jl. BSD Grand Boulevard No.6 Wing A Lantai Dasar Zona 6, Sampora, Kec. Cisauk, Kabupaten Tangerang, Banten 15345';
  const splitAddress = pdf.splitTextToSize(addressText, 160);
  pdf.text(splitAddress, 105, 22, { align: 'center' });

  const contactY = 22 + (splitAddress.length * 3);
  pdf.setFontSize(7.2);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(2, 132, 199);
  pdf.text(`${getOfficialDomain(profile.website)}   •   ${profile.email || 'support@ldi.co.id'}   •   Whatsapp: ${profile.whatsapp || '087777040496'}`, 105, contactY, { align: 'center' });

  // Indonesian Official Kop Surat Double Separator Line
  const lineY = contactY + 3;
  // Thick navy line
  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(0.8);
  pdf.line(14, lineY, 196, lineY);

  // Thin cyan line
  pdf.setDrawColor(6, 182, 212);
  pdf.setLineWidth(0.35);
  pdf.line(14, lineY + 1.2, 196, lineY + 1.2);

  return lineY + 4;
};

/**
 * Draws the bottom Digital Verification & Signature Box
 */
const drawFooterAndSignatures = async (
  pdf: jsPDF,
  startY: number,
  docNumber: string,
  docType: 'SPH' | 'PKS' | 'Invoice',
  profile: CompanyProfile,
  status: string,
  signatureData?: string,
  customSignerName?: string,
  customSignerPosition?: string
) => {
  const domain = getOfficialDomain(profile.website);
  const verifyUrl = `https://${domain}/verify?doc=${encodeURIComponent(docNumber)}`;

  // Generate real scannable QR Code Data URL
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 160,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (e) {
    console.warn('QR Code generation notice:', e);
  }

  // Left: Digital Verification Box
  pdf.setFillColor(240, 249, 255); // #f0f9ff
  pdf.roundedRect(14, startY, 102, 34, 2, 2, 'F');
  pdf.setDrawColor(186, 230, 253); // #bae6fd
  pdf.setLineWidth(0.3);
  pdf.roundedRect(14, startY, 102, 34, 2, 2, 'S');

  // Insert QR Code image inside verification box
  if (qrDataUrl) {
    try {
      pdf.addImage(qrDataUrl, 'PNG', 16, startY + 3, 28, 28);
    } catch (err) {
      console.warn('Error embedding QR image in PDF:', err);
    }
  }

  // Verification Details Text
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(3, 105, 161);
  pdf.text('VERIFIKASI KEASLIAN DOKUMEN DIGITAL (QR & HASH)', 47, startY + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(51, 65, 85);
  const verifyDesc = 'Dokumen resmi ini diterbitkan secara sah oleh Sistem e-Office PT. LDI. Verifikasi langsung di:';
  const splitDesc = pdf.splitTextToSize(verifyDesc, 66);
  pdf.text(splitDesc, 47, startY + 11);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.8);
  pdf.setTextColor(2, 132, 199);
  const splitUrl = pdf.splitTextToSize(verifyUrl, 66);
  pdf.text(splitUrl, 47, startY + 18);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Pindai kode QR dengan kamera smartphone untuk validasi dokumen.', 47, startY + 30);

  // Right: Signature & Official Stamp Section
  const rightX = 125;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(51, 65, 85);

  const deptText = docType === 'Invoice' ? 'Departemen Keuangan,' : 'Hormat Kami,';
  pdf.text(deptText, rightX, startY + 4);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text(profile.legalName || 'PT. LINTAS DATA INTERNASIONAL', rightX, startY + 8);

  // Official Stamp
  const isLunas = status.toLowerCase() === 'lunas';
  const stampColor: [number, number, number] = isLunas ? [16, 185, 129] : [220, 38, 38];
  const stampText1 = isLunas ? 'LUNAS' : 'BELUM BAYAR';
  const stampText2 = isLunas ? 'PAID / OFFICIAL' : 'UNPAID / TAGIHAN';

  pdf.setDrawColor(...stampColor);
  pdf.setLineWidth(0.5);
  pdf.circle(rightX + 18, startY + 20, 10, 'S');
  pdf.setLineWidth(0.2);
  pdf.circle(rightX + 18, startY + 20, 8.5, 'S');

  pdf.setTextColor(...stampColor);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(4.5);
  pdf.text('PT LINTAS DATA', rightX + 18, startY + 16, { align: 'center' });
  pdf.setFontSize(5.5);
  pdf.text(stampText1, rightX + 18, startY + 20.5, { align: 'center' });
  pdf.setFontSize(4);
  pdf.text(stampText2, rightX + 18, startY + 24, { align: 'center' });

  // Signature Image if available
  const activeSig = signatureData || profile.defaultSignatureBase64;
  if (activeSig && activeSig.startsWith('data:image')) {
    try {
      pdf.addImage(activeSig, 'PNG', rightX + 26, startY + 12, 28, 14);
    } catch (e) {
      console.warn('Signature image embed notice:', e);
    }
  }

  // Underlined Signer Name
  const signerName = customSignerName || (docType === 'Invoice' ? (profile.financeManager || 'Siti Rahmawati, S.E.') : (profile.directorName || 'Irwan Setiawan, S.T.'));
  const signerPos = customSignerPosition || (docType === 'Invoice' ? 'Finance Manager' : (profile.directorPosition || 'Direktur Utama'));

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text(signerName, rightX, startY + 30);
  pdf.setLineWidth(0.2);
  pdf.setDrawColor(15, 23, 42);
  const nameWidth = pdf.getTextWidth(signerName);
  pdf.line(rightX, startY + 30.8, rightX + nameWidth, startY + 30.8);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.8);
  pdf.setTextColor(71, 85, 105);
  pdf.text(signerPos, rightX, startY + 34);

  // Bottom Disclaimer Footer
  pdf.setFontSize(6.2);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Dokumen Elektronik ini sah dan mengikat secara hukum sesuai ketentuan UU ITE No. 11 Tahun 2008. Hak Cipta © ${new Date().getFullYear()} ${profile.legalName || 'PT. LINTAS DATA INTERNASIONAL'}. (${domain})`, 105, 289, { align: 'center' });
};

/**
 * Programmatic Vector PDF generator for Invoice, SPH, and PKS
 */
export const generateStandaloneDocPdfBase64 = async (
  type: 'SPH' | 'PKS' | 'Invoice',
  data: SPH | PKS | Invoice,
  companyProfile?: CompanyProfile
): Promise<{ base64: string; filename: string }> => {
  const profile = companyProfile || COMPANY_PROFILE;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const docNumber =
    type === 'SPH'
      ? (data as SPH).sphNumber
      : type === 'PKS'
      ? (data as PKS).pksNumber
      : (data as Invoice).invoiceNumber;

  const darkNavy: [number, number, number] = [15, 23, 42]; // #0f172a
  const cyanBlue: [number, number, number] = [2, 132, 199]; // #0284c7
  const slateText: [number, number, number] = [51, 65, 85]; // #334155
  const lightBg: [number, number, number] = [248, 250, 252]; // #f8fafc

  // 1. Draw Kop Surat Header
  const contentStartY = drawOfficialKopSurat(pdf, profile);

  if (type === 'Invoice') {
    const invoice = data as Invoice;
    let curY = contentStartY + 2;

    // Document Title & Number
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(...darkNavy);
    pdf.text('INVOICE / FAKTUR PENAGIHAN', 14, curY + 4);

    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text(`No: ${invoice.invoiceNumber}`, 14, curY + 9);

    if (invoice.sphReference) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text(`Ref SPH: ${invoice.sphReference}`, 14, curY + 13);
    }

    // Status Badge & Dates (Right Aligned)
    const paidAmount = typeof invoice.paidAmount === 'number'
      ? invoice.paidAmount
      : invoice.status === 'Lunas'
      ? invoice.grandTotal
      : (invoice.payments || []).reduce((acc, p) => acc + p.amount, 0);

    const isLunas = invoice.status === 'Lunas';
    const isPartial = invoice.status === 'Dibayar Sebagian' || (paidAmount > 0 && paidAmount < invoice.grandTotal);
    const percentPaid = invoice.grandTotal > 0 ? Math.min(100, Math.round((paidAmount / invoice.grandTotal) * 100)) : 0;

    let badgeText = 'STATUS: BELUM BAYAR';
    let badgeBg: [number, number, number] = [254, 242, 242];
    let badgeBorder: [number, number, number] = [239, 68, 68];
    let badgeTextColor: [number, number, number] = [185, 28, 28];

    if (isLunas) {
      badgeText = 'STATUS: LUNAS';
      badgeBg = [236, 253, 245];
      badgeBorder = [16, 185, 129];
      badgeTextColor = [4, 120, 87];
    } else if (isPartial) {
      badgeText = `STATUS: BELUM BAYAR (Dibayar Sebagian ${percentPaid}%)`;
      badgeBg = [255, 251, 235];
      badgeBorder = [245, 158, 11];
      badgeTextColor = [180, 83, 9];
    }

    pdf.setFillColor(...badgeBg);
    pdf.setDrawColor(...badgeBorder);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(128, curY, 68, 5.5, 1.5, 1.5, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.8);
    pdf.setTextColor(...badgeTextColor);
    pdf.text(badgeText, 162, curY + 3.8, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...slateText);
    pdf.text(`Tanggal Diterbitkan: ${formatDateIndonesian(invoice.issueDate)}`, 196, curY + 9, { align: 'right' });

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(220, 38, 38);
    pdf.text(`Jatuh Tempo: ${formatDateIndonesian(invoice.dueDate)}`, 196, curY + 13, { align: 'right' });

    curY += 17;

    // Two Side-by-Side Information Cards
    const cardWidth = 88;
    const cardHeight = 24;

    // Left Card: Customer Details
    pdf.setFillColor(...lightBg);
    pdf.roundedRect(14, curY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(14, curY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(2, 132, 199);
    pdf.text('DITAGIHKAN KEPADA:', 17, curY + 4.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...darkNavy);
    pdf.text(invoice.customerName || 'PT. Pelanggan LDI', 17, curY + 9);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(...slateText);
    const splitCustAddr = pdf.splitTextToSize(invoice.customerAddress || 'Gedung Cyber, Jl. Kuningan Barat No. 8, Jakarta Selatan', 82);
    pdf.text(splitCustAddr.slice(0, 2), 17, curY + 13);

    const contactStr = `Telp: ${invoice.customerPhone || '-'} | Email: ${invoice.customerEmail || '-'}`;
    pdf.text(contactStr.substring(0, 50), 17, curY + 21);

    // Right Card: Official Bank Account Box
    const bank = invoice.bankInfo || profile.bankDetails?.[0] || COMPANY_PROFILE.bankDetails[0];
    pdf.setFillColor(240, 249, 255);
    pdf.roundedRect(108, curY, cardWidth, cardHeight, 1.5, 1.5, 'F');
    pdf.setDrawColor(186, 230, 253);
    pdf.roundedRect(108, curY, cardWidth, cardHeight, 1.5, 1.5, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(3, 105, 161);
    pdf.text('REKENING PEMBAYARAN RESMI PT. LDI:', 111, curY + 4.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...darkNavy);
    pdf.text(bank.bankName || 'Bank Central Asia (BCA)', 111, curY + 9);

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(2, 132, 199);
    pdf.text(bank.accountNumber || '8830-1928-33', 111, curY + 14);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(...slateText);
    pdf.text(`a.n. ${bank.accountHolder || profile.legalName || 'PT LINTAS DATA INTERNASIONAL'}`, 111, curY + 18);
    pdf.text(`* ${bank.notes || 'Transfer Rekening Utama untuk Layanan Internet & Cloud'}`, 111, curY + 22);

    curY += cardHeight + 4;

    // Items Table Header
    pdf.setFillColor(...darkNavy);
    pdf.rect(14, curY, 182, 7, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.2);
    pdf.text('NO', 17, curY + 4.5);
    pdf.text('DESKRIPSI ITEM PENAGIHAN', 30, curY + 4.5);
    pdf.text('VOLUME', 120, curY + 4.5);
    pdf.text('HARGA SATUAN', 145, curY + 4.5);
    pdf.text('TOTAL HARGA', 192, curY + 4.5, { align: 'right' });

    curY += 7;

    const items: ItemService[] = (invoice.items && invoice.items.length > 0) ? invoice.items : [
      {
        id: '1',
        category: 'Internet Dedicated',
        name: 'Internet Dedicated DIA 1:1 Bandwidth 1 Gbps SLA 99.9%',
        description: 'Paket Internet Dedicated Corporate dengan proteksi anti DDoS',
        qty: 1,
        unit: 'Bulan',
        price: invoice.grandTotal || 15000000,
        discount: 0,
      }
    ];

    items.forEach((item, index) => {
      const rowHeight = item.description ? 9 : 7;
      pdf.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
      pdf.rect(14, curY, 182, rowHeight, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.2);
      pdf.line(14, curY + rowHeight, 196, curY + rowHeight);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.2);
      pdf.setTextColor(...darkNavy);
      pdf.text(String(index + 1), 17, curY + 4.5);
      pdf.text(item.name.substring(0, 52), 30, curY + 4.5);

      if (item.description) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.2);
        pdf.setTextColor(100, 116, 139);
        pdf.text(item.description.substring(0, 60), 30, curY + 7.8);
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.2);
      pdf.setTextColor(...slateText);
      pdf.text(`${item.qty} ${item.unit || 'Bulan'}`, 120, curY + 4.5);
      pdf.text(formatIDR(item.price), 145, curY + 4.5);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...darkNavy);
      pdf.text(formatIDR(item.price * item.qty), 192, curY + 4.5, { align: 'right' });

      curY += rowHeight;
    });

    // Summary & Totals Block
    curY += 2;
    const subtotal = invoice.subtotal || items.reduce((sum, it) => sum + (it.price * it.qty), 0);
    const taxPercent = typeof invoice.taxPercent === 'number' ? invoice.taxPercent : 11;
    const taxAmount = typeof invoice.taxAmount === 'number' ? invoice.taxAmount : (subtotal * (taxPercent / 100));
    const grandTotal = invoice.grandTotal || (subtotal + taxAmount);
    const remainingAmount = Math.max(0, grandTotal - paidAmount);

    const summaryX = 125;
    const valX = 192;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.2);
    pdf.setTextColor(...slateText);
    pdf.text('Subtotal:', summaryX, curY + 4);
    pdf.text(formatIDR(subtotal), valX, curY + 4, { align: 'right' });

    if (invoice.discountTotal && invoice.discountTotal > 0) {
      curY += 4.5;
      pdf.text('Diskon:', summaryX, curY + 4);
      pdf.setTextColor(220, 38, 38);
      pdf.text(`- ${formatIDR(invoice.discountTotal)}`, valX, curY + 4, { align: 'right' });
      pdf.setTextColor(...slateText);
    }

    curY += 4.5;
    const taxLabel = taxPercent > 0 ? `PPN (${taxPercent}%):` : 'PPN (Non-PPN / 0%):';
    pdf.text(taxLabel, summaryX, curY + 4);
    pdf.text(formatIDR(taxAmount), valX, curY + 4, { align: 'right' });

    curY += 6;
    // Grand Total Banner
    pdf.setFillColor(239, 246, 255); // #eff6ff
    pdf.roundedRect(summaryX - 4, curY, 75, 8.5, 1.5, 1.5, 'F');
    pdf.setDrawColor(191, 219, 254);
    pdf.roundedRect(summaryX - 4, curY, 75, 8.5, 1.5, 1.5, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(30, 58, 138);
    pdf.text(taxPercent > 0 ? 'TOTAL PENAGIHAN (INC. PPN):' : 'TOTAL PENAGIHAN (NON-PPN):', summaryX, curY + 5.5);
    pdf.setFontSize(8.8);
    pdf.text(formatIDR(grandTotal), valX, curY + 5.5, { align: 'right' });

    if (isPartial) {
      curY += 9.5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(4, 120, 87);
      pdf.text('Total Telah Dibayar (Cicilan):', summaryX, curY + 4);
      pdf.text(`- ${formatIDR(paidAmount)}`, valX, curY + 4, { align: 'right' });

      curY += 4.5;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(185, 28, 28);
      pdf.text('Sisa Piutang Harus Dilunasi:', summaryX, curY + 4);
      pdf.text(formatIDR(remainingAmount), valX, curY + 4, { align: 'right' });
    }

    // Terbilang Box on Left
    const terbilangAmount = isPartial ? remainingAmount : grandTotal;
    const terbilangStr = terbilangRupiah(terbilangAmount);

    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(14, curY - (isPartial ? 14 : 9), 102, 14, 1.5, 1.5, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(14, curY - (isPartial ? 14 : 9), 102, 14, 1.5, 1.5, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(isPartial ? 'Terbilang (Sisa Tagihan):' : 'Terbilang (Total Penagihan):', 17, curY - (isPartial ? 14 : 9) + 4.5);

    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7);
    pdf.setTextColor(15, 23, 42);
    const splitTerbilang = pdf.splitTextToSize(`"${terbilangStr}"`, 96);
    pdf.text(splitTerbilang.slice(0, 2), 17, curY - (isPartial ? 14 : 9) + 8.5);

    curY += 12;

    // Draw Bottom QR Code Verification & Signatures
    await drawFooterAndSignatures(
      pdf,
      curY,
      invoice.invoiceNumber,
      'Invoice',
      profile,
      invoice.status,
      invoice.signatureData,
      profile.financeManager || 'Siti Rahmawati, S.E.',
      'Finance Manager'
    );
  } else if (type === 'SPH') {
    const sph = data as SPH;
    let curY = contentStartY + 2;

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(...darkNavy);
    pdf.text('SURAT PENAWARAN HARGA (SPH)', 105, curY + 4, { align: 'center' });

    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(2, 132, 199);
    pdf.text(`Nomor: ${sph.sphNumber}`, 105, curY + 9, { align: 'center' });

    curY += 13;

    // Customer Target Box
    pdf.setFillColor(...lightBg);
    pdf.roundedRect(14, curY, 182, 18, 1.5, 1.5, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(14, curY, 182, 18, 1.5, 1.5, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...slateText);
    pdf.text('Kepada Yth:', 18, curY + 5);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...darkNavy);
    pdf.text(sph.customerName || 'Pimpinan Perusahaan', 18, curY + 9.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...slateText);
    pdf.text(`Alamat: ${sph.customerAddress || 'Jakarta, Indonesia'}`, 18, curY + 14);

    pdf.setFont('helvetica', 'bold');
    pdf.text(`Tanggal: ${formatDateIndonesian(sph.date)}`, 190, curY + 5, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Masa Berlaku: ${sph.validityDays || 14} Hari Kalender`, 190, curY + 9.5, { align: 'right' });

    curY += 22;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);
    const intro = 'Dengan hormat, Sehubungan dengan kebutuhan infrastruktur teknologi informasi perusahaan Anda, kami PT. LINTAS DATA INTERNASIONAL menyampaikan rincian penawaran layanan terbaik sebagai berikut:';
    const splitIntro = pdf.splitTextToSize(intro, 182);
    pdf.text(splitIntro, 14, curY);

    curY += splitIntro.length * 3.8 + 2;

    // Section I Table Header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...darkNavy);
    pdf.text('I. RINCIAN BIAYA LAYANAN', 14, curY);

    curY += 3;
    pdf.setFillColor(...darkNavy);
    pdf.rect(14, curY, 182, 7, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7.2);
    pdf.text('NO', 17, curY + 4.5);
    pdf.text('DESKRIPSI LAYANAN', 30, curY + 4.5);
    pdf.text('VOLUME', 120, curY + 4.5);
    pdf.text('HARGA SATUAN', 145, curY + 4.5);
    pdf.text('TOTAL HARGA', 192, curY + 4.5, { align: 'right' });

    curY += 7;
    sph.items.forEach((item, index) => {
      pdf.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
      pdf.rect(14, curY, 182, 7, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.line(14, curY + 7, 196, curY + 7);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.2);
      pdf.setTextColor(...slateText);
      pdf.text(String(index + 1), 17, curY + 4.5);
      pdf.text(item.name.substring(0, 55), 30, curY + 4.5);
      pdf.text(`${item.qty} ${item.unit || 'Bulan'}`, 120, curY + 4.5);
      pdf.text(formatIDR(item.price), 145, curY + 4.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...darkNavy);
      pdf.text(formatIDR(item.price * item.qty), 192, curY + 4.5, { align: 'right' });
      curY += 7;
    });

    curY += 4;
    // Total Penawaran
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(2, 132, 199);
    pdf.text(`TOTAL PENAWARAN: ${formatIDR(sph.grandTotal)}`, 192, curY + 3, { align: 'right' });

    curY += 8;
    // Terms & Conditions
    if (sph.termsAndConditions && sph.termsAndConditions.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...darkNavy);
      pdf.text('II. SYARAT DAN KETENTUAN', 14, curY);
      curY += 3.5;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.8);
      pdf.setTextColor(71, 85, 105);
      sph.termsAndConditions.slice(0, 4).forEach((term, idx) => {
        const splitTerm = pdf.splitTextToSize(`${idx + 1}. ${term}`, 180);
        pdf.text(splitTerm, 16, curY);
        curY += splitTerm.length * 3.2;
      });
    }

    curY += 4;
    await drawFooterAndSignatures(
      pdf,
      curY,
      sph.sphNumber,
      'SPH',
      profile,
      sph.status || 'Aktif',
      sph.signedByLDI,
      profile.directorName || 'Irwan Setiawan, S.T.',
      profile.directorPosition || 'Direktur Utama'
    );
  } else if (type === 'PKS') {
    const pks = data as PKS;
    let curY = contentStartY + 2;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(...darkNavy);
    pdf.text('PERJANJIAN KERJA SAMA (PKS)', 105, curY + 4, { align: 'center' });

    pdf.setFontSize(8);
    pdf.setTextColor(2, 132, 199);
    pdf.text('LAYANAN INFRASTRUKTUR TEKNOLOGI INFORMASI & INTERNET DEDICATED', 105, curY + 8.5, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Nomor: ${pks.pksNumber}`, 105, curY + 13, { align: 'center' });

    curY += 18;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);
    pdf.text(`Pada hari ini, tanggal ${formatDateIndonesian(pks.startDate)}, kami yang bertanda tangan di bawah ini:`, 14, curY);

    curY += 4.5;
    // Parties Box
    pdf.setFillColor(...lightBg);
    pdf.roundedRect(14, curY, 182, 28, 1.5, 1.5, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(14, curY, 182, 28, 1.5, 1.5, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...darkNavy);
    pdf.text(`I. ${profile.legalName || 'PT. LINTAS DATA INTERNASIONAL'}`, 18, curY + 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(...slateText);
    pdf.text(`Diwakili oleh ${profile.directorName || 'Irwan Setiawan, S.T.'} selaku ${profile.directorPosition || 'Direktur Utama'}, disebut sebagai PIHAK PERTAMA.`, 18, curY + 9);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...darkNavy);
    pdf.text(`II. ${pks.customerName || 'PT. Pelanggan'}`, 18, curY + 16);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(...slateText);
    pdf.text(`Diwakili oleh ${pks.party2SignerName || 'Pimpinan Perusahaan'} selaku ${pks.party2SignerPosition || 'Direktur'}, disebut sebagai PIHAK KEDUA.`, 18, curY + 20);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(2, 132, 199);
    pdf.text(`Total Nilai Kontrak: ${formatIDR(pks.totalContractValue || 0)} | Periode: ${formatDateIndonesian(pks.startDate)} s/d ${formatDateIndonesian(pks.endDate)}`, 18, curY + 25);

    curY += 32;

    // Clauses sample
    if (pks.clauses && pks.clauses.length > 0) {
      pks.clauses.slice(0, 3).forEach((clause) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(...darkNavy);
        pdf.text(`PASAL ${clause.article}: ${clause.title}`, 14, curY);
        curY += 3.5;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        pdf.setTextColor(71, 85, 105);
        const splitClause = pdf.splitTextToSize(clause.content, 180);
        pdf.text(splitClause.slice(0, 3), 16, curY);
        curY += (Math.min(3, splitClause.length) * 3) + 2;
      });
    }

    curY += 2;
    await drawFooterAndSignatures(
      pdf,
      curY,
      pks.pksNumber,
      'PKS',
      profile,
      pks.status || 'Aktif',
      pks.party1SignatureData,
      pks.party1SignerName || profile.directorName || 'Irwan Setiawan, S.T.',
      pks.party1SignerPosition || profile.directorPosition || 'Direktur Utama'
    );
  }

  const dataUrl = pdf.output('datauristring');
  const cleanFilename = `${type}_${docNumber.replace(/[\/\\]/g, '_')}.pdf`;

  return {
    base64: dataUrl,
    filename: cleanFilename,
  };
};
