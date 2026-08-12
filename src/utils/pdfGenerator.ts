import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

