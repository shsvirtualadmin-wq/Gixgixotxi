import { jsPDF } from 'jspdf';
import { cleanMathForPdf, type PdfExportProgress } from './testPdfExporter';
import { drawVectorDottedLogoOnPdf } from './logoDottedSvg';
import type { D1FormulaChapterRow, D1FormulaItemRow } from '../constants/formulaVaultSeed';

export interface ExportFormulaSheetPdfOptions {
  chapter: D1FormulaChapterRow;
  subjectName: string;
  formulas: D1FormulaItemRow[];
  studentName?: string;
  signal?: AbortSignal;
  onProgress?: (progress: PdfExportProgress) => void;
}

/**
 * Stamps the exact Grand Line background watermarks onto the currently active page
 * BEFORE foreground cards are drawn:
 * 1. Faint repeating diagonal text watermark ("Boardly · boardly.cfd")
 * 2. Large centered BLACK dotted Boardly logo (icon + "Boardly" wordmark)
 *    drawn as pure vector circles at ~8% black opacity (RGB [233, 233, 233] on white paper).
 */
function stampGrandLineBackgroundWatermarks(doc: jsPDF, pageWidth = 210): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(242, 245, 249);
  const wmRows = [50, 100, 150, 200, 250];
  const wmCols = [25, 75, 125, 175];
  for (let r = 0; r < wmRows.length; r++) {
    const offset = (r % 2) * 25;
    for (const c of wmCols) {
      doc.text('Boardly · boardly.cfd', c + offset, wmRows[r], { angle: -28 });
    }
  }

  const wmW = 148;
  const wmH = wmW * (824 / 1768);
  const wmX = (pageWidth - wmW) / 2;
  const wmY = (297 - wmH) / 2;
  drawVectorDottedLogoOnPdf(doc, wmX, wmY, wmW, [233, 233, 233]);
}

/**
 * Formats a formula expression into readable print math using the Grand Line vector math sanitizer,
 * plus common chemistry/physics/calculus notations so fractions, subscripts, exponents, and symbols
 * render cleanly in vector PDF output without clipping or raw LaTeX noise.
 */
function formatFormulaForGrandLinePdf(formula: D1FormulaItemRow): string {
  const rawLatex = String(formula.formula_latex || formula.plain_text || '').trim();
  if (!rawLatex) return '';

  // Pre-normalize common LaTeX constructs before running cleanMathForPdf
  let pre = rawLatex
    .replace(/\\ce\{([^{}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^{}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^{}]+)\}/g, '$1')
    .replace(/\\mathit\{([^{}]+)\}/g, '$1')
    .replace(/\\operatorname\{([^{}]+)\}/g, '$1')
    .replace(/\\left\s*([()[\]|])/g, '$1')
    .replace(/\\right\s*([()[\]|])/g, '$1')
    .replace(/\\left\\\{/g, '{')
    .replace(/\\right\\\}/g, '}')
    .replace(/\\overline\{([^{}]+)\}/g, 'bar($1)')
    .replace(/\\vec\{([^{}]+)\}/g, '$1⃗')
    .replace(/\\hat\{([^{}]+)\}/g, '$1̂')
    .replace(/\\dot\{([^{}]+)\}/g, '$1̇')
    .replace(/\\binom\{([^{}]+)\}\{([^{}]+)\}/g, 'C($1, $2)')
    .replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, '∑[$1→$2] ')
    .replace(/\\sum\b/g, '∑ ')
    .replace(/\\prod_\{([^{}]+)\}\^\{([^{}]+)\}/g, '∏[$1→$2] ')
    .replace(/\\prod\b/g, '∏ ')
    .replace(/\\lim_\{([^{}]+)\}/g, 'lim[$1] ')
    .replace(/\\partial\b/g, '∂')
    .replace(/\\nabla\b/g, '∇')
    .replace(/\\propto\b/g, '∝')
    .replace(/\\equiv\b/g, '≡')
    .replace(/\\sim\b/g, '∼')
    .replace(/\\perp\b/g, '⊥')
    .replace(/\\parallel\b/g, '∥')
    .replace(/\\angle\b/g, '∠')
    .replace(/\\in\b/g, '∈')
    .replace(/\\notin\b/g, '∉')
    .replace(/\\subset\b/g, '⊂')
    .replace(/\\subseteq\b/g, '⊆')
    .replace(/\\cup\b/g, '∪')
    .replace(/\\cap\b/g, '∩')
    .replace(/\\emptyset\b/g, '∅')
    .replace(/\\forall\b/g, '∀')
    .replace(/\\exists\b/g, '∃')
    .replace(/\\neg\b/g, '¬')
    .replace(/\\land\b/g, '∧')
    .replace(/\\lor\b/g, '∨')
    .replace(/\\oplus\b/g, '⊕')
    .replace(/\\iff\b|\\Leftrightarrow\b/g, '⇔')
    .replace(/\\leftrightarrow\b/g, '↔')
    .replace(/\\uparrow\b/g, '↑')
    .replace(/\\downarrow\b/g, '↓')
    .replace(/\\quad|\\qquad|\\;|\\,|\\:/g, ' ')
    .replace(/\\%/g, '%');

  // Resolve nested \frac{...}{...} up to 2 passes
  for (let pass = 0; pass < 2; pass++) {
    pre = pre.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_m, num: string, den: string) => {
      const n = num.trim();
      const d = den.trim();
      if (/^[0-9a-zA-Zα-ωΑ-Ω+\-*/]+$/.test(n) && /^[0-9a-zA-Zα-ωΑ-Ω+\-*/]+$/.test(d)) {
        return `${n}/${d}`;
      }
      return `(${n}) / (${d})`;
    });
  }

  const cleaned = cleanMathForPdf(pre);
  return cleaned || String(formula.plain_text || formula.formula_latex || '').trim();
}

/**
 * Pure Vector Grand Line Formula Sheet PDF Exporter:
 * Reuses the exact Grand Line PDF design from testPdfExporter.ts:
 * - Same A4 page geometry (210mm x 297mm, 12mm margins, 186mm content width, 281.5mm maxUsableY)
 * - Always renders in the light "print" look regardless of app theme
 * - Same diagonal text watermark + centered black dotted vector Boardly logo on every page
 * - Same dark slate Page 1 Header Banner (#0f172a) with dot-grid texture, white dotted vector logo,
 *   vertical divider, title/subtitle, and single red mode pill (#D71921)
 * - Same Summary Strip on Page 1
 * - Numbered formula cards (number, title, formula, note) with non-splitting page breaks and
 *   automatic wrapping/font-scaling so long formulas never clip or overflow
 * - Same Final Page Copyright & Academic Verification Notice
 * - Same Page 2+ slim running header and every-page running footer + page numbering
 * - Same file-naming pattern: Boardly_<ChapterTitle>_FormulaSheet.pdf
 */
export async function exportFormulaSheetToPdf(options: ExportFormulaSheetPdfOptions): Promise<void> {
  const {
    chapter,
    subjectName,
    formulas,
    studentName = 'Student',
    signal,
    onProgress,
  } = options;

  if (signal?.aborted) {
    throw new Error('PDF export cancelled.');
  }

  if (!formulas || formulas.length === 0) {
    throw new Error('No formulas available in this chapter to export.');
  }

  onProgress?.({
    current: 1,
    totalPages: Math.max(1, formulas.length),
    message: 'Preparing Grand Line formula sheet layout...',
  });

  const chapterHeading = `${chapter.chapter_no} ${chapter.title}`.trim();
  const cleanSubject = String(subjectName || 'Formula Library').trim();
  const cleanStudent = String(studentName || 'Student').replace(/\s+/g, ' ').trim();
  const formattedDate = new Date().toLocaleDateString('en-GB');
  const totalFormulas = formulas.length;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  doc.setDocumentProperties({
    title: `Boardly Formula Sheet - ${chapterHeading}`,
    subject: `${cleanSubject} · ${chapterHeading} (${totalFormulas} Formulas)`,
    author: 'Boardly by SHS Virtual Academy',
    keywords: `Boardly, Formula Sheet, ${cleanSubject}, ${chapter.title}`,
    creator: 'Boardly (boardly.cfd)',
  });

  const pageWidth = 210;
  const contentWidth = 186;
  const maxUsableY = 281.5;

  // Stamp background watermarks on Page 1 BEFORE drawing foreground
  stampGrandLineBackgroundWatermarks(doc, pageWidth);

  // ==========================================
  // Page 1 Header Banner (Exact Grand Line Dark Banner + Dot-Grid + White Vector Logo + Red Pill)
  // ==========================================
  let currentY = 10;
  const bannerH = 18.5;

  doc.setFillColor(15, 23, 42); // #0f172a
  doc.roundedRect(12, currentY, contentWidth, bannerH, 2, 2, 'F');

  // Faint dot-grid texture inside the dark banner
  doc.setFillColor(38, 49, 71);
  for (let gx = 15; gx < 195; gx += 4.5) {
    for (let gy = currentY + 2.2; gy < currentY + bannerH - 1.5; gy += 4.5) {
      doc.circle(gx, gy, 0.22, 'F');
    }
  }

  // White dotted Boardly logo (Icon + "Boardly" wordmark) in pure vectors
  drawVectorDottedLogoOnPdf(doc, 14.5, currentY + 2.6, 26, [255, 255, 255]);

  // Header vertical divider line
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(43, currentY + 3, 43, currentY + bannerH - 3);

  // Banner Subtitle & Chapter Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `OFFICIAL FORMULA SHEET · ${cleanSubject.toUpperCase()}`,
    46,
    currentY + 6.4
  );

  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  const titleSnippet = doc.splitTextToSize(`Chapter ${chapterHeading}`, 112);
  doc.text(titleSnippet[0] || `Chapter ${chapterHeading}`, 46, currentY + 13.8);

  // Single RED Mode Pill on the right
  const pillW = 31;
  const pillH = 6.2;
  const pillX = 163;
  const pillY = currentY + (bannerH - pillH) / 2;
  doc.setFillColor(215, 25, 33); // #D71921
  doc.roundedRect(pillX, pillY, pillW, pillH, 1.6, 1.6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.0);
  doc.setTextColor(255, 255, 255);
  doc.text('SHEET LIBRARY', pillX + pillW / 2, pillY + pillH / 2 + 0.78, { align: 'center' });

  currentY += bannerH + 2.2;

  // ==========================================
  // Page 1 Metadata Summary Strip (Exact Grand Line Summary Strip style)
  // ==========================================
  const summaryH = 10.5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(12, currentY, contentWidth, summaryH, 1.8, 1.8, 'S');

  const row1Baseline = currentY + 6.6;
  doc.setFontSize(6.6);
  doc.setFont('helvetica', 'bold');

  doc.setTextColor(100, 116, 139);
  doc.text('Subject:', 15, row1Baseline);
  doc.setTextColor(15, 23, 42);
  const subSingle = doc.splitTextToSize(cleanSubject, 45)[0] || cleanSubject;
  doc.text(subSingle, 26, row1Baseline);

  doc.setTextColor(100, 116, 139);
  doc.text('Chapter:', 74, row1Baseline);
  doc.setTextColor(15, 23, 42);
  const chapSingle = doc.splitTextToSize(chapterHeading, 46)[0] || chapterHeading;
  doc.text(chapSingle, 85.5, row1Baseline);

  doc.setTextColor(100, 116, 139);
  doc.text('Formulas:', 134, row1Baseline);
  doc.setTextColor(215, 25, 33);
  doc.text(`${totalFormulas} Numbered`, 146.5, row1Baseline);

  doc.setTextColor(100, 116, 139);
  doc.text('Date:', 168, row1Baseline);
  doc.setTextColor(15, 23, 42);
  doc.text(formattedDate, 175.5, row1Baseline);

  currentY += summaryH + 2.5;

  // ==========================================
  // Numbered Formula Cards (Never split across pages, never clipped)
  // ==========================================
  const CHUNK_SIZE = 8;

  for (let i = 0; i < totalFormulas; i++) {
    if (signal?.aborted) {
      throw new Error('PDF export cancelled.');
    }

    if (i % CHUNK_SIZE === 0) {
      await new Promise((r) => setTimeout(r, 15));
      onProgress?.({
        current: i + 1,
        totalPages: totalFormulas,
        message: `Formatting formula ${i + 1} of ${totalFormulas}...`,
      });
    }

    const item = formulas[i];
    const formulaNo = item.formula_no || i + 1;
    const rawTitle = String(item.title || `Formula #${formulaNo}`).trim();
    const cleanTitle = cleanMathForPdf(rawTitle) || rawTitle;
    const formattedMath = formatFormulaForGrandLinePdf(item);
    const rawNote = String(item.note || '').trim();
    const cleanNote = rawNote ? cleanMathForPdf(rawNote) : '';

    // 1. Measure title lines
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    const titleLineH = 3.1;
    const titleLines = doc.splitTextToSize(cleanTitle, 148);
    const titleBlockH = Math.max(3.6, titleLines.length * titleLineH);

    // 2. Measure formula expression box (scale font down slightly if expression is very long)
    const mathFontSize = formattedMath.length > 130 ? 7.2 : formattedMath.length > 85 ? 8.0 : 8.8;
    const mathLineH = mathFontSize <= 7.2 ? 3.2 : mathFontSize <= 8.0 ? 3.5 : 3.85;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(mathFontSize);
    const mathLines = doc.splitTextToSize(formattedMath, 172);
    const mathBoxInnerH = Math.max(1, mathLines.length) * mathLineH;
    const mathBoxH = mathBoxInnerH + 4.2;

    // 3. Measure optional note box
    let noteLines: string[] = [];
    let noteBoxH = 0;
    const noteLineH = 2.6;
    if (cleanNote) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      noteLines = doc.splitTextToSize(cleanNote, 160);
      noteBoxH = Math.max(1, noteLines.length) * noteLineH + 2.2;
    }

    // Total formula card height
    const headerTopPad = 2.2;
    const gapAfterHeader = 1.6;
    const gapAfterMath = cleanNote ? 1.6 : 0;
    const bottomPad = 2.2;
    const cardHeight =
      headerTopPad +
      titleBlockH +
      gapAfterHeader +
      mathBoxH +
      gapAfterMath +
      noteBoxH +
      bottomPad;

    // Page break guard: never split a formula card across two pages
    if (currentY + cardHeight > maxUsableY) {
      doc.addPage();
      stampGrandLineBackgroundWatermarks(doc, pageWidth);
      currentY = 14.0;
    }

    // Draw Outer Formula Card Border
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.roundedRect(12, currentY, contentWidth, cardHeight, 1.5, 1.5, 'S');

    // Draw Red Formula Number Badge (#formulaNo)
    const badgeW = 14.5;
    const badgeH = 4.4;
    const badgeX = 15;
    const badgeY = currentY + headerTopPad;
    doc.setFillColor(215, 25, 33); // #D71921
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.1, 1.1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    doc.setTextColor(255, 255, 255);
    doc.text(`#${formulaNo}`, badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.75, {
      align: 'center',
    });

    // Draw Formula Title next to badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(15, 23, 42);
    doc.text(titleLines, badgeX + badgeW + 3.0, badgeY + 3.0, { lineHeightFactor: 1.15 });

    // Subject + Chapter tag on the right side of the card header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Ch. ${chapter.chapter_no}`,
      195,
      badgeY + badgeH / 2 + 0.68,
      { align: 'right' }
    );

    // Draw Formula Expression Box (light slate-tinted print box)
    const mathBoxY = currentY + headerTopPad + titleBlockH + gapAfterHeader;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.22);
    doc.roundedRect(15, mathBoxY, 180, mathBoxH, 1.1, 1.1, 'FD');

    // Left accent bar on formula box
    doc.setFillColor(215, 25, 33);
    doc.rect(15, mathBoxY, 1.2, mathBoxH, 'F');

    const nMathLines = Math.max(1, mathLines.length);
    const mathBlockSpan = (nMathLines - 1) * mathLineH;
    const mathFirstBaseline = mathBoxY + (mathBoxH - mathBlockSpan) / 2 + 0.85;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(mathFontSize);
    doc.setTextColor(15, 23, 42);
    doc.text(mathLines, 19.5, mathFirstBaseline, { lineHeightFactor: 1.18 });

    // Draw Note Box if present
    if (cleanNote && noteLines.length > 0) {
      const noteY = mathBoxY + mathBoxH + gapAfterMath;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.18);
      doc.roundedRect(15, noteY, 180, noteBoxH, 0.8, 0.8, 'S');

      doc.setFillColor(100, 116, 139);
      doc.rect(15, noteY, 1.1, noteBoxH, 'F');

      const nNoteLines = Math.max(1, noteLines.length);
      const noteSpan = (nNoteLines - 1) * noteLineH;
      const noteFirstBaseline = noteY + (noteBoxH - noteSpan) / 2 + 0.7;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.0);
      doc.setTextColor(15, 23, 42);
      doc.text('Note:', 18, noteFirstBaseline);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(51, 65, 85);
      doc.text(noteLines, 25.5, noteFirstBaseline, { lineHeightFactor: 1.15 });
    }

    currentY += cardHeight + 1.8;
  }

  // ==========================================
  // Final Page Copyright & Academic Verification Notice (Exact Grand Line Footer Box)
  // ==========================================
  if (currentY + 12.5 > maxUsableY) {
    doc.addPage();
    stampGrandLineBackgroundWatermarks(doc, pageWidth);
    currentY = 14.5;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(12, currentY, contentWidth, 11.5, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(
    'OFFICIAL VERIFIED FORMULA SHEET · BOARDLY SHEET LIBRARY',
    15,
    currentY + 3.8
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `© ${new Date().getFullYear()} Boardly by SHS Virtual Academy (boardly.cfd). All rights reserved. Generated exclusively for ${cleanStudent} on ${formattedDate}.`,
    15,
    currentY + 7.1
  );
  doc.text(
    'For personal study use only. Commercial distribution, unauthorized copying, or online scraping is strictly prohibited.',
    15,
    currentY + 10.0
  );

  // ==========================================
  // Stamp Single Slim Running Header (Pages 2+) & Running Footer on ALL Pages
  // ==========================================
  const totalPages = doc.getNumberOfPages();

  for (let p = 0; p < totalPages; p++) {
    doc.setPage(p + 1);

    // ONE Slim Running Header on Pages 2+
    if (p > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Boardly Sheet Library · Chapter ${chapterHeading}`, 12, 9.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${cleanSubject} · Page ${p + 1} of ${totalPages}`, 198, 9.5, {
        align: 'right',
      });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.22);
      doc.line(12, 11.5, 198, 11.5);
    }

    // Running Footer line on EVERY page
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(12, 285, 198, 285);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Boardly Sheet Library · ${chapterHeading} · Page ${p + 1} of ${totalPages} · Subject: ${cleanSubject} · ${formattedDate}`,
      12,
      288.8
    );

    doc.setFontSize(5.7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `© ${new Date().getFullYear()} Boardly by SHS Virtual Academy · boardly.cfd · All rights reserved. For personal study use only. Reproduction or distribution without permission is prohibited.`,
      12,
      292.3
    );
  }

  onProgress?.({
    current: totalFormulas,
    totalPages: totalFormulas,
    message: 'Finalizing PDF download...',
  });

  const safeTitle = `${cleanSubject}_Chapter_${chapter.chapter_no}_${chapter.title}`
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const filename = `Boardly_${safeTitle}_FormulaSheet.pdf`;
  doc.save(filename);
}
