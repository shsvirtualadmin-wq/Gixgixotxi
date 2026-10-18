import { jsPDF } from 'jspdf';
import type { AttemptQuestion } from '@/types/index';

interface ExportPdfOptions {
  title: string;
  university?: string;
  markingScheme?: string;
  studentName?: string;
  studentEmail?: string;
  questions: AttemptQuestion[];
}

export function exportTestToPdf({
  title,
  university = 'General Entrance Drill',
  markingScheme = 'Standard Scheme (+1.0 / 0.0)',
  studentName = 'Candidate',
  studentEmail = '',
  questions,
}: ExportPdfOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin - 10) {
      doc.addPage();
      cursorY = margin;
      drawPageFooter();
    }
  };

  const drawPageFooter = () => {
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Boardly Entry Test Engine · ${title} · Confirmed Practice Paper`,
        margin,
        pageHeight - 8
      );
      doc.text(
        `Page ${p} of ${totalPages}`,
        pageWidth - margin - 18,
        pageHeight - 8
      );
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    }
  };

  // Header Banner
  doc.setFillColor(15, 15, 15);
  doc.rect(margin, cursorY, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BOARDLY · OFFICIAL ENTRANCE TEST DRILL', margin + 6, cursorY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(215, 215, 215);
  doc.text(`${title} · ${university}`, margin + 6, cursorY + 16);
  doc.text(`Rules: ${markingScheme}`, margin + 6, cursorY + 21);

  cursorY += 28;

  // Metadata Box
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, cursorY, contentWidth, 14, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text('Candidate:', margin + 4, cursorY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${studentName} ${studentEmail ? `(${studentEmail})` : ''}`, margin + 22, cursorY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Total MCQs:', margin + 4, cursorY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${questions.length} Questions`, margin + 22, cursorY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Time Budget:', margin + 80, cursorY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${questions.length} Minutes`, margin + 100, cursorY + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', margin + 140, cursorY + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('en-GB'), margin + 150, cursorY + 10.5);

  cursorY += 18;

  // Questions Loop
  const OPT_LABELS = ['A', 'B', 'C', 'D'];

  questions.forEach((q, idx) => {
    const rawStem = (q.stem || q.q || 'Question').replace(/\$/g, '').trim();
    const stemLines = doc.splitTextToSize(`Q${idx + 1}. ${rawStem}`, contentWidth - 4);
    const neededH = stemLines.length * 4.5 + 26;
    checkPageBreak(neededH);

    // Question box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 20);
    doc.text(stemLines, margin + 2, cursorY + 4);
    cursorY += stemLines.length * 4.5 + 2;

    // Options (2 columns x 2 rows)
    const options = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'];
    const colWidth = (contentWidth - 6) / 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);

    options.slice(0, 4).forEach((opt, optIdx) => {
      const col = optIdx % 2;
      const row = Math.floor(optIdx / 2);
      const optX = margin + 4 + col * colWidth;
      const optY = cursorY + 2 + row * 6;

      const rawOpt = String(opt || '').replace(/\$/g, '').trim();
      const label = OPT_LABELS[optIdx] || String(optIdx + 1);
      const formatted = `(${label}) ${rawOpt}`;
      const truncated = doc.splitTextToSize(formatted, colWidth - 4)[0] || formatted;

      doc.text(truncated, optX, optY);
    });

    cursorY += 15;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, cursorY, margin + contentWidth, cursorY);
    cursorY += 4;
  });

  // Appendix: Answer Key Page
  doc.addPage();
  cursorY = margin;

  doc.setFillColor(215, 25, 33);
  doc.rect(margin, cursorY, contentWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('OFFICIAL ANSWER KEY & EXPLANATIONS', margin + 6, cursorY + 8);

  cursorY += 18;

  // Answer Key Grid Table
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);

  const cols = 5;
  const itemW = contentWidth / cols;
  const rows = Math.ceil(questions.length / cols);

  for (let r = 0; r < rows; r++) {
    checkPageBreak(8);
    for (let c = 0; c < cols; c++) {
      const qIndex = r * cols + c;
      if (qIndex < questions.length) {
        const q = questions[qIndex];
        const correctIdx = typeof q.correctIndex === 'number' ? q.correctIndex : (q.correct ?? 0);
        const correctLetter = OPT_LABELS[correctIdx] || 'A';
        const itemX = margin + c * itemW;

        doc.setFont('helvetica', 'bold');
        doc.text(`Q${qIndex + 1}: `, itemX + 2, cursorY);
        doc.setFont('helvetica', 'normal');
        doc.text(`[ ${correctLetter} ]`, itemX + 12, cursorY);
      }
    }
    cursorY += 6;
  }

  // Finalize page footers
  drawPageFooter();

  // Save PDF
  const filename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Boardly.pdf`;
  doc.save(filename);
}
