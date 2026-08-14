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

/**
 * High-fidelity offscreen renderer for PDFTemplate.
 * Guarantees 100% visual parity between preview, direct downloads, and email attachments.
 */
export const renderTemplateToPdf = async (
  type: 'SPH' | 'PKS' | 'Invoice',
  data: SPH | PKS | Invoice,
  companyProfile?: CompanyProfile,
  customers?: Customer[],
  headerMode: 'official' | 'clean' = 'official'
): Promise<jsPDF | null> => {
  if (typeof document === 'undefined') return null;

  // Create temporary container off-screen with exact A4 dimensions
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm';
  container.style.minHeight = '297mm';
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
      type,
      data,
      companyProfile: companyProfile || COMPANY_PROFILE,
      customers,
      headerMode,
      showStamp: true,
      showSignatures: true,
      className: '!shadow-none !border-none !rounded-none !p-8 !m-0 !w-[210mm] !max-w-[210mm]',
    })
  );

  // Wait for React to render DOM and initialize QR Codes
  await new Promise((resolve) => setTimeout(resolve, 400));

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

  // Additional settlement time for canvas/fonts
  await new Promise((resolve) => setTimeout(resolve, 200));

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: container.scrollWidth || 800,
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
  }
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  if (element) {
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

      pdf.save(cleanFilename);
      return true;
    } catch (err) {
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
        docFallback.headerMode || 'official'
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
 * Generates base64 data URI of a document element.
 */
export const generatePdfBase64 = async (
  elementId: string,
  filename: string
): Promise<{ base64: string; filename: string } | null> => {
  const element = document.getElementById(elementId);
  if (!element) {
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
    console.error('Error generating PDF Base64 from element:', err);
    return null;
  }
};

/**
 * Generates 100% pixel-perfect standalone PDF Base64 for Email Attachment & Gateway Upload.
 * Uses the exact same PDFTemplate component and rendering pipeline as the on-screen preview and download.
 */
export const generateStandaloneDocPdfBase64 = async (
  type: 'SPH' | 'PKS' | 'Invoice',
  data: SPH | PKS | Invoice,
  companyProfile?: CompanyProfile,
  customers?: Customer[],
  headerMode: 'official' | 'clean' = 'official'
): Promise<{ base64: string; filename: string } | null> => {
  const docNumber =
    type === 'SPH'
      ? (data as SPH).sphNumber
      : type === 'PKS'
      ? (data as PKS).pksNumber
      : (data as Invoice).invoiceNumber;

  const cleanDocNumber = (docNumber || `${type}_${Date.now()}`).replace(/[\/\\]/g, '_');
  const filename = `${type}_${cleanDocNumber}.pdf`;

  // Use the high-fidelity offscreen renderer with exact PDFTemplate
  const pdf = await renderTemplateToPdf(
    type,
    data,
    companyProfile,
    customers,
    headerMode
  );

  if (!pdf) {
    console.error('Failed to generate standalone PDF for attachment.');
    return null;
  }

  const dataUrl = pdf.output('datauristring');
  return {
    base64: dataUrl,
    filename,
  };
};
