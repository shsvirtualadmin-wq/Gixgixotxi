import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ExportCertificateOptions {
  element: HTMLElement;
  serial: string;
  studentName?: string;
  mockName?: string;
}

/**
 * Renders an element to a crisp Canvas using html2canvas.
 * Honors scale factor (2x for crisp 300DPI-equivalent print quality).
 */
export async function renderCertificateToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  const originalTransform = element.style.transform;
  element.style.transform = 'none';

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      windowWidth: 1200,
      windowHeight: 850,
    });
    return canvas;
  } finally {
    element.style.transform = originalTransform;
  }
}

/**
 * Generates and triggers download of high-resolution PNG
 */
export async function downloadCertificatePng(options: ExportCertificateOptions): Promise<string> {
  const { element, serial } = options;
  const canvas = await renderCertificateToCanvas(element);
  const dataUrl = canvas.toDataURL('image/png', 1.0);

  const cleanSerial = (serial || 'BDLY-CERT').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Boardly_Certificate_${cleanSerial}.png`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}

/**
 * Generates and triggers download of A4 landscape PDF
 */
export async function downloadCertificatePdf(options: ExportCertificateOptions): Promise<void> {
  const { element, serial } = options;
  const canvas = await renderCertificateToCanvas(element);
  const imgData = canvas.toDataURL('image/png', 1.0);

  // A4 Landscape: 297mm x 210mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 297
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 210

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  const cleanSerial = (serial || 'BDLY-CERT').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Boardly_Certificate_${cleanSerial}.pdf`;

  pdf.save(filename);
}

/**
 * Exports data URL for previews or upload
 */
export async function exportCertificateDataUrl(element: HTMLElement): Promise<string> {
  const canvas = await renderCertificateToCanvas(element);
  return canvas.toDataURL('image/png', 0.95);
}
