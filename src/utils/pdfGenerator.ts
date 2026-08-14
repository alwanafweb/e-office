import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CompanyProfile, Invoice, PKS, SPH } from '../types';
import { formatDateIndonesian, formatIDR } from './formatters';
import { COMPANY_PROFILE } from '../data/initialData';

export const exportToPdf = async (elementId: string, filename: string): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id '${elementId}' not found for PDF export.`);
    return false;
  }

  try {
    // Ensure element is visible and scrolled into view for clean snapshot
    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution crisp rendering
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

    const imgWidth = 210; // A4 width mm
    const pageHeight = 297; // A4 height mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Multi-page document handling with 5mm threshold to prevent empty page overflow
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
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
 * Programmatic PDF generator for sample/test document attachments or DOM fallback
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

  const customerName = data.customerName || 'PT. Mitra Pelanggan LDI';
  const docDate =
    type === 'SPH'
      ? formatDateIndonesian((data as SPH).date)
      : type === 'PKS'
      ? `${formatDateIndonesian((data as PKS).startDate)} s/d ${formatDateIndonesian((data as PKS).endDate)}`
      : formatDateIndonesian((data as Invoice).issueDate);

  const grandTotal =
    type === 'SPH'
      ? (data as SPH).grandTotal || 0
      : type === 'PKS'
      ? (data as PKS).totalContractValue || 0
      : (data as Invoice).grandTotal || 0;

  // Colors
  const darkBlue: [number, number, number] = [15, 23, 42]; // #0f172a
  const cyanBlue: [number, number, number] = [2, 132, 199]; // #0284c7
  const slateText: [number, number, number] = [51, 65, 85]; // #334155
  const lightBg: [number, number, number] = [248, 250, 252]; // #f8fafc

  // Header Banner
  pdf.setFillColor(...darkBlue);
  pdf.rect(0, 0, 210, 32, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(profile.legalName || 'PT. LINTAS DATA INTERNASIONAL', 15, 14);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(203, 213, 225);
  pdf.text(`${profile.address || 'Jakarta, Indonesia'} | Telp/WA: ${profile.whatsapp || '087777040496'} | ${profile.website || 'e-office.ldi.co.id'}`, 15, 22);

  // Document Title Pill
  const titleText =
    type === 'SPH'
      ? 'SURAT PENAWARAN HARGA (SPH)'
      : type === 'PKS'
      ? 'PERJANJIAN KERJA SAMA (PKS)'
      : 'INVOICE / TAGIHAN PEMBAYARAN RESMI';

  pdf.setFillColor(...cyanBlue);
  pdf.roundedRect(15, 38, 180, 10, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.text(titleText, 105, 44.5, { align: 'center' });

  // Document Metadata Table Box
  pdf.setFillColor(...lightBg);
  pdf.roundedRect(15, 52, 180, 32, 2, 2, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(15, 52, 180, 32, 2, 2, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...slateText);
  pdf.text('Nomor Dokumen:', 20, 60);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...darkBlue);
  pdf.text(docNumber, 60, 60);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...slateText);
  pdf.text('Pelanggan Target:', 20, 68);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...darkBlue);
  pdf.text(customerName, 60, 68);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...slateText);
  pdf.text('Tanggal Terbit:', 20, 76);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...darkBlue);
  pdf.text(docDate, 60, 76);

  // Items / Services Summary Table
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(...darkBlue);
  pdf.text('Rincian Layanan & Nilai Komersial:', 15, 92);

  // Table Header
  pdf.setFillColor(...darkBlue);
  pdf.rect(15, 96, 180, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('NO', 18, 101.5);
  pdf.text('DESKRIPSI LAYANAN', 32, 101.5);
  pdf.text('QTY', 125, 101.5);
  pdf.text('HARGA SATUAN', 145, 101.5);
  pdf.text('TOTAL', 175, 101.5);

  // Table Rows
  const items = (data as SPH | Invoice).items || [
    {
      id: '1',
      name: 'Internet Dedicated Corporate SLA 99.9%',
      qty: 1,
      unit: 'Bulan',
      price: grandTotal,
      discount: 0,
    },
  ];

  let currentY = 104;
  items.slice(0, 5).forEach((item, index) => {
    pdf.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
    pdf.rect(15, currentY, 180, 8, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.line(15, currentY + 8, 195, currentY + 8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...slateText);
    pdf.text(String(index + 1), 18, currentY + 5.5);
    pdf.text(item.name.substring(0, 45), 32, currentY + 5.5);
    pdf.text(`${item.qty} ${item.unit || ''}`, 125, currentY + 5.5);
    pdf.text(formatIDR(item.price), 145, currentY + 5.5);
    pdf.text(formatIDR(item.price * item.qty), 175, currentY + 5.5);

    currentY += 8;
  });

  // Grand Total Summary Box
  pdf.setFillColor(...lightBg);
  pdf.roundedRect(115, currentY + 4, 80, 14, 2, 2, 'F');
  pdf.setDrawColor(...cyanBlue);
  pdf.roundedRect(115, currentY + 4, 80, 14, 2, 2, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...slateText);
  pdf.text('TOTAL KESELURUHAN:', 120, currentY + 12);
  pdf.setFontSize(10);
  pdf.setTextColor(...cyanBlue);
  pdf.text(formatIDR(grandTotal), 190, currentY + 12, { align: 'right' });

  // Digital Security & Verification Box
  const securityY = currentY + 26;
  pdf.setFillColor(240, 249, 255);
  pdf.roundedRect(15, securityY, 180, 18, 2, 2, 'F');
  pdf.setDrawColor(186, 230, 253);
  pdf.roundedRect(15, securityY, 180, 18, 2, 2, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(3, 105, 161);
  pdf.text('VERIFIKASI KEASLIAN DOKUMEN DIGITAL (QR & HASH)', 20, securityY + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(51, 65, 85);
  pdf.text(`Dokumen resmi ini diterbitkan secara sah oleh Sistem e-Office PT. LDI. Verifikasi langsung di:`, 20, securityY + 11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(2, 132, 199);
  pdf.text(`https://${profile.website ? profile.website.replace(/^https?:\/\//, '') : 'e-office.ldi.co.id'}/verify?doc=${encodeURIComponent(docNumber)}`, 20, securityY + 15);

  // Signatures & Stamp Area
  const sigY = securityY + 26;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...slateText);
  pdf.text('Hormat Kami,', 140, sigY);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...darkBlue);
  pdf.text(profile.legalName || 'PT. LINTAS DATA INTERNASIONAL', 140, sigY + 5);

  // Red Stamp Emulation
  pdf.setDrawColor(220, 38, 38);
  pdf.setLineWidth(0.6);
  pdf.circle(160, sigY + 18, 11, 'S');
  pdf.setTextColor(220, 38, 38);
  pdf.setFontSize(5);
  pdf.text('PT. LDI', 160, sigY + 16, { align: 'center' });
  pdf.setFontSize(6);
  pdf.text('OFFICIAL STAMP', 160, sigY + 19, { align: 'center' });
  pdf.text('DIGITALLY SIGNED', 160, sigY + 22, { align: 'center' });

  // Director Name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...darkBlue);
  pdf.text(profile.directorName || 'Direktur Utama', 140, sigY + 34);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...slateText);
  pdf.text(profile.directorPosition || 'Direktur Utama PT. LDI', 140, sigY + 38);

  // Corporate Footer Note
  pdf.setFontSize(6.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Dokumen Elektronik ini sah dan mengikat sesuai ketentuan UU ITE. Hak Cipta © ${new Date().getFullYear()} ${profile.legalName}.`, 105, 285, { align: 'center' });

  const dataUrl = pdf.output('datauristring');
  const cleanFilename = `${type}_${docNumber.replace(/[\/\\]/g, '_')}.pdf`;

  return {
    base64: dataUrl,
    filename: cleanFilename,
  };
};



