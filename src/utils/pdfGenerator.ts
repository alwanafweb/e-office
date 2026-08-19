import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CompanyProfile, Customer, Invoice, PKS, SPH } from '../types';
import { COMPANY_PROFILE } from '../data/initialData';
import { PDFTemplate } from '../components/PDFTemplate';

export const getOfficialDomain = (customWebsite?: string): string => {
  if (!customWebsite) return 'e-office.ldi.co.id';
  const clean = customWebsite.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
  if (!clean || clean.toLowerCase().includes('jagoan') || clean.toLowerCase().includes('localhost') || clean.toLowerCase().includes('run.app')) {
    return 'e-office.ldi.co.id';
  }
  return clean;
};

export interface PDFGenerationOptions {
  headerMode?: 'official' | 'clean';
  showStamp?: boolean;
  showSignatures?: boolean;
  className?: string;
}

export interface PDFBase64Result {
  base64: string;      // Pure RFC-4648 Base64 string without data URI scheme, optimal for email API attachments array
  dataUri: string;     // Full data URI string (data:application/pdf;base64,...)
  filename: string;    // Document filename ending in .pdf
  contentType: string; // 'application/pdf'
  byteLength: number;
}

/**
 * Converts a jsPDF document instance into a standard RFC-4648 Base64 result.
 */
export const convertPdfToBase64Result = (
  pdf: jsPDF,
  filename: string
): PDFBase64Result => {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const arrayBuffer = pdf.output('arraybuffer');
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const rawBase64 = btoa(binary);
  const dataUri = `data:application/pdf;base64,${rawBase64}`;

  return {
    base64: rawBase64,
    dataUri,
    filename: cleanFilename,
    contentType: 'application/pdf',
    byteLength: len,
  };
};

/**
 * Adjusts margin spacing for elements marked with page-break so that in multi-page PDF generation
 * (html2canvas slicing), the signature block & "Hormat Kami" start cleanly at the top of the next page.
 * Returns a restoration function to revert the DOM style afterwards.
 */
export const applyPageBreakSpacing = (container: HTMLElement): (() => void) => {
  const pageBreakElements = container.querySelectorAll<HTMLElement>(
    '[data-page-break="true"], .page-break-before, .break-before-page'
  );
  const effectiveWidth = container.clientWidth || 794;
  const pageHeightInPx = effectiveWidth * (297 / 210); // Standard A4 Aspect Ratio (~1123px)

  const originalStyles: Array<{ el: HTMLElement; marginTop: string }> = [];

  pageBreakElements.forEach((el) => {
    originalStyles.push({ el, marginTop: el.style.marginTop });
    const rect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const topRelativeToContainer = rect.top - containerRect.top;
    const pageIndex = Math.floor(topRelativeToContainer / pageHeightInPx);
    const targetPageTop = (pageIndex + 1) * pageHeightInPx;
    const gap = targetPageTop - topRelativeToContainer;

    if (gap > 10) {
      el.style.marginTop = `${gap + 28}px`;
    }
  });

  return () => {
    originalStyles.forEach(({ el, marginTop }) => {
      el.style.marginTop = marginTop;
    });
  };
};

/**
 * High-fidelity offscreen renderer for PDFTemplate.
 * Guarantees 100% visual parity between preview, direct downloads, and email attachments.
 */
export const renderTemplateToPdf = async (
  type: 'SPH' | 'PKS' | 'Invoice',
  data: SPH | PKS | Invoice,
  companyProfile?: CompanyProfile,
  customers?: Customer[],
  options?: 'official' | 'clean' | PDFGenerationOptions
): Promise<jsPDF | null> => {
  if (typeof document === 'undefined') return null;

  const headerMode: 'official' | 'clean' =
    typeof options === 'string'
      ? options
      : options?.headerMode || 'official';

  const showStamp =
    typeof options === 'object' && options?.showStamp !== undefined
      ? options.showStamp
      : true;

  const showSignatures =
    typeof options === 'object' && options?.showSignatures !== undefined
      ? options.showSignatures
      : true;

  const customClassName =
    typeof options === 'object' && options?.className
      ? options.className
      : 'bg-white text-slate-900 mx-auto w-[794px] max-w-[794px] min-h-[1123px] p-8 shadow-none border-none rounded-none m-0 relative text-xs leading-relaxed font-sans';

  // Create temporary container off-screen with exact A4 dimensions
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.zIndex = '-9999';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';
  container.style.boxSizing = 'border-box';
  container.style.padding = '0';
  container.style.margin = '0';

  document.body.appendChild(container);

  const root = createRoot(container);

  root.render(
    React.createElement(PDFTemplate, {
      id: 'offscreen-printable-document',
      type,
      data,
      companyProfile: companyProfile || COMPANY_PROFILE,
      customers,
      headerMode,
      showStamp,
      showSignatures,
      className: customClassName,
    })
  );

  // Wait for React to render DOM, fonts, and initialize QR Codes
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Wait for all images inside container to finish loading
  const images = container.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve(true);
      return new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(true);
      });
    })
  );

  // Additional settlement time for canvas/fonts/SVGs
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Adjust spacing for elements marked with page-break so that in multi-page PDF generation they begin cleanly at the top of the next page
  applyPageBreakSpacing(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: 794,
    });

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

    return pdf;
  } catch (err) {
    console.error('Error generating PDF from template:', err);
    return null;
  } finally {
    try {
      root.unmount();
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    } catch (cleanErr) {
      console.warn('Container cleanup warning:', cleanErr);
    }
  }
};

/**
 * Exports a document element or data to downloadable PDF file.
 */
export const exportToPdf = async (
  elementId: string,
  filename: string,
  docFallback?: {
    type: 'SPH' | 'PKS' | 'Invoice';
    data: SPH | PKS | Invoice;
    companyProfile?: CompanyProfile;
    customers?: Customer[];
    headerMode?: 'official' | 'clean';
    showStamp?: boolean;
    showSignatures?: boolean;
  }
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  if (element) {
    let revertPageBreakSpacing: (() => void) | null = null;
    try {
      const originalScrollPos = window.scrollY;
      window.scrollTo(0, 0);

      // Dynamically calculate and apply page break margin to push "Hormat Kami" and signatures to next page
      revertPageBreakSpacing = applyPageBreakSpacing(element);
      await new Promise((r) => setTimeout(r, 60));

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

      if (revertPageBreakSpacing) {
        revertPageBreakSpacing();
        revertPageBreakSpacing = null;
      }

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

      pdf.save(cleanFilename);
      return true;
    } catch (err) {
      if (revertPageBreakSpacing) {
        revertPageBreakSpacing();
      }
      console.error('Error in element-based PDF export:', err);
    }
  }

  // Fallback to standalone offscreen renderer
  if (docFallback) {
    try {
      const pdf = await renderTemplateToPdf(
        docFallback.type,
        docFallback.data,
        docFallback.companyProfile,
        docFallback.customers,
        {
          headerMode: docFallback.headerMode || 'official',
          showStamp: docFallback.showStamp ?? true,
          showSignatures: docFallback.showSignatures ?? true,
        }
      );
      if (pdf) {
        pdf.save(cleanFilename);
        return true;
      }
    } catch (renderErr) {
      console.error('Error in standalone fallback PDF export:', renderErr);
    }
  }

  window.print();
  return false;
};

/**
 * Generates base64 data result of a document element.
 */
export const generatePdfBase64 = async (
  elementId: string,
  filename: string
): Promise<PDFBase64Result | null> => {
  const element = document.getElementById(elementId);
  if (!element) {
    return null;
  }

  let revertPageBreakSpacing: (() => void) | null = null;
  try {
    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);

    revertPageBreakSpacing = applyPageBreakSpacing(element);
    await new Promise((r) => setTimeout(r, 60));

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

    if (revertPageBreakSpacing) {
      revertPageBreakSpacing();
      revertPageBreakSpacing = null;
    }

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

    return convertPdfToBase64Result(pdf, filename);
  } catch (err) {
    if (revertPageBreakSpacing) {
      revertPageBreakSpacing();
    }
    console.error('Error generating PDF Base64 from element:', err);
    return null;
  }
};

/**
 * Generates 100% pixel-perfect standalone PDF Base64 for Email Attachment & Gateway Upload.
 * Uses the exact same PDFTemplate component and configuration as the on-screen preview and download.
 */
export const generateStandaloneDocPdfBase64 = async (
  type: 'SPH' | 'PKS' | 'Invoice',
  data: SPH | PKS | Invoice,
  companyProfile?: CompanyProfile,
  customers?: Customer[],
  options?: 'official' | 'clean' | PDFGenerationOptions
): Promise<PDFBase64Result | null> => {
  const docNumber =
    type === 'SPH'
      ? (data as SPH).sphNumber
      : type === 'PKS'
      ? (data as PKS).pksNumber
      : (data as Invoice).invoiceNumber;

  const cleanDocNumber = (docNumber || `${type}_${Date.now()}`).replace(/[\/\\]/g, '_');
  const filename = `${type}_${cleanDocNumber}.pdf`;

  // Use the high-fidelity offscreen renderer with exact PDFTemplate configuration
  const pdf = await renderTemplateToPdf(
    type,
    data,
    companyProfile,
    customers,
    options
  );

  if (!pdf) {
    console.error('Failed to generate standalone PDF for attachment.');
    return null;
  }

  return convertPdfToBase64Result(pdf, filename);
};

