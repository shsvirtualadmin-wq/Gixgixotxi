import { jsPDF } from 'jspdf';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUniversityRulesSummary } from '@/constants/universityCriteria';
import { formatSubjectName } from '@/constants/taxonomy';
import {
  getMyTestAttemptForTest,
  type AmbassadorTestAttempt,
  type GradedAttemptQuestion,
} from '@/services/ambassadorTestService';
import type { AttemptQuestion } from '@/types/index';
import { drawVectorDottedLogoOnPdf } from './logoDottedSvg';

export interface PdfExportProgress {
  current: number;
  totalPages: number;
  message: string;
}

export interface ExportPdfOptions {
  title: string;
  university?: string;
  markingScheme?: string;
  studentName?: string;
  studentEmail?: string;
  questions: AttemptQuestion[];
  signal?: AbortSignal;
  onProgress?: (progress: PdfExportProgress) => void;
}

export interface ExportDrillResultPdfOptions {
  testId?: string;
  testTitle: string;
  subject: string;
  studentName: string;
  adminName?: string;
  isAdminAnswerKey?: boolean;
  date?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  gradedQuestions?: GradedAttemptQuestion[];
  signal?: AbortSignal;
  onProgress?: (progress: PdfExportProgress) => void;
}

/**
 * Sanitizes and converts LaTeX math, Greek characters, subscripts, and superscripts
 * into clean, universally renderable Unicode strings for direct vector jsPDF output.
 */
export function cleanMathForPdf(raw: string): string {
  if (!raw) return '';
  let str = String(raw).trim();

  // Greek alphabet
  const greek: Record<string, string> = {
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\delta': 'δ',
    '\\epsilon': 'ε',
    '\\theta': 'θ',
    '\\lambda': 'λ',
    '\\mu': 'μ',
    '\\pi': 'π',
    '\\sigma': 'σ',
    '\\omega': 'ω',
    '\\Delta': 'Δ',
    '\\Omega': 'Ω',
    '\\phi': 'φ',
    '\\rho': 'ρ',
    '\\tau': 'τ',
    '\\nu': 'ν',
    '\\eta': 'η',
  };
  for (const [k, v] of Object.entries(greek)) {
    str = str.split(k).join(v);
  }

  // Math operators & symbols
  str = str
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\infty/g, '∞')
    .replace(/\\degree|\^\\circ/g, '°')
    .replace(/\\to|\\rightarrow/g, '→')
    .replace(/\\leftarrow/g, '←');

  // Fractions: \frac{num}{den} -> (num / den)
  str = str.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');

  // Square roots: \sqrt{val} -> √(val)
  str = str.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');

  // Text wrapper: \text{...} -> ...
  str = str.replace(/\\text\{([^}]+)\}/g, '$1');

  // Superscripts
  const supers: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', 'n': 'ⁿ', 'x': 'ˣ',
  };
  str = str.replace(/\^([0-9+\-nx])/g, (_, ch) => supers[ch] || '^' + ch);
  str = str.replace(/\^\{([0-9+\-nx]+)\}/g, (_, seq) =>
    seq.split('').map((c: string) => supers[c] || c).join('')
  );

  // Subscripts
  const subs: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', 'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ',
  };
  str = str.replace(/_([0-9+\-aeox])/g, (_, ch) => subs[ch] || '_' + ch);
  str = str.replace(/_\{([0-9+\-aeox]+)\}/g, (_, seq) =>
    seq.split('').map((c: string) => subs[c] || c).join('')
  );

  // Remove LaTeX delimiters and dangling macros
  str = str.replace(/\$/g, '').replace(/\\([a-zA-Z]+)/g, '$1');

  // Collapse consecutive whitespace
  return str.replace(/\s+/g, ' ').trim();
}

async function resolveQuestionKeys(questions: AttemptQuestion[]): Promise<AttemptQuestion[]> {
  const unresolved = questions.filter(
    (q) => q.correct === undefined || (q.correct === 0 && !q.explain)
  );

  const keyMap = new Map<string, { correct: number; explain?: string }>();

  if (unresolved.length > 0) {
    await Promise.all(
      unresolved.map(async (q) => {
        try {
          const snap = await getDoc(doc(db, 'questionKeys', q.id));
          if (snap.exists()) {
            const data = snap.data();
            keyMap.set(q.id, {
              correct: typeof data.correct === 'number' ? data.correct : 0,
              explain: data.explain || data.explanation || '',
            });
          }
        } catch (err) {
          console.warn(`[testPdfExporter] Key load fallback for ${q.id}:`, err);
        }
      })
    );
  }

  return questions.map((q) => {
    const key = keyMap.get(q.id);
    let resolvedCorrect = typeof q.correct === 'number' ? q.correct : (key?.correct ?? 0);

    if (key && Array.isArray(q.optionMapping) && q.optionMapping.length > 0) {
      const mappedIdx = q.optionMapping.indexOf(key.correct);
      if (mappedIdx !== -1) {
        resolvedCorrect = mappedIdx;
      }
    }

    return {
      ...q,
      correct: resolvedCorrect,
      explain: key?.explain || q.explain || '',
    };
  });
}

/**
 * Stamps the background watermarks onto the currently active page BEFORE foreground cards are drawn:
 * 1. Faint repeating diagonal text watermark ("Boardly · boardly.cfd")
 * 2. Large centered BLACK dotted Boardly logo (both the boxed 'B' icon and the 'oardly' wordmark)
 *    drawn as pure vector circles at ~8% black opacity (RGB [233, 233, 233] on white paper)
 *    so it stays 100% sharp at any zoom level and repeats on EVERY page behind the content.
 */
function stampPageBackgroundWatermarks(doc: jsPDF, pageWidth = 210): void {
  // 1. Faint Diagonal Watermark Text: Boardly · boardly.cfd
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

  // 2. Centered Black Dotted Boardly Logo (Icon + "Boardly" wordmark) at ~8% opacity
  const wmW = 148;
  const wmH = wmW * (824 / 1768);
  const wmX = (pageWidth - wmW) / 2;
  const wmY = (297 - wmH) / 2;
  drawVectorDottedLogoOnPdf(doc, wmX, wmY, wmW, [233, 233, 233]);
}

/**
 * Pure Vector Grand Line Verified Drill Report Exporter:
 * - 100% direct jsPDF vector drawing: zero html2canvas, zero DOM staging, zero clipped text.
 * - All badges (UNANSWERED, CORRECT, WRONG, FULL MOCK) and option boxes use exact baseline
 *   math (`boxY + boxH/2 + capHeight/2` or generous top/bottom padding) so no text ever touches
 *   or gets sliced by a border.
 * - Only ONE "FULL MOCK" pill (the red one) in the Page 1 dark header banner.
 * - Full dotted Boardly logo (icon + "Boardly" wordmark) drawn in black dots at ~8% opacity
 *   centered behind the content on EVERY page, while the logo inside the Page 1 dark header
 *   banner is drawn in solid white dots.
 * - Question cards and option boxes let the background dotted logo show through cleanly.
 * - Student name has ample single-line width on Page 1.
 * - Tightly packs 83 questions into ~8 to 10 pages with only ONE slim running header on Page 2+.
 */
export async function exportDrillResultToPdf(options: ExportDrillResultPdfOptions): Promise<void> {
  const {
    testId,
    testTitle,
    subject,
    studentName,
    adminName,
    isAdminAnswerKey = false,
    date,
    score,
    totalQuestions,
    percentage,
    timeTakenSeconds,
    gradedQuestions: passedQuestions,
    signal,
    onProgress,
  } = options;

  const timeoutId = setTimeout(() => {
    if (!signal?.aborted) {
      console.warn('[testPdfExporter] PDF generation timeout reached (60s).');
    }
  }, 60000);

  try {
    if (signal?.aborted) throw new Error('PDF export cancelled.');

    onProgress?.({
      current: 1,
      totalPages: 100,
      message: 'Preparing document layout and vector assets...',
    });

    let gradedQuestions = passedQuestions;
    if ((!gradedQuestions || gradedQuestions.length === 0) && testId) {
      try {
        const fetched = await getMyTestAttemptForTest(testId);
        gradedQuestions =
          fetched?.attempt?.gradedQuestions && fetched.attempt.gradedQuestions.length > 0
            ? fetched.attempt.gradedQuestions
            : (fetched?.test?.questions || []).map((q, idx) => ({
                id: q.id || `q_${idx}`,
                position: typeof q.position === 'number' ? q.position : idx,
                question: q.question,
                options: q.options,
                selectedIndex: -1,
                correctIndex: q.correctIndex ?? 0,
                isCorrect: false,
                explanation: q.explanation,
              }));
      } catch (fetchErr) {
        console.warn('[testPdfExporter] Could not fetch attempt from API:', fetchErr);
      }
    }

    if (!gradedQuestions || gradedQuestions.length === 0) {
      throw new Error('No question data available for this drill attempt.');
    }

    const totalQCount = gradedQuestions.length;
    const OPT_LABELS = ['A', 'B', 'C', 'D'];
    const mins = Math.floor(Math.max(0, timeTakenSeconds || 0) / 60);
    const secs = Math.max(0, Math.round(timeTakenSeconds || 0)) % 60;
    const formattedTime = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    const formattedDate = date
      ? new Date(date).toLocaleDateString('en-GB')
      : new Date().toLocaleDateString('en-GB');

    // Aggregate statistics
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    const subjectGroups: Record<
      string,
      { total: number; correct: number; wrong: number; skipped: number }
    > = {};

    gradedQuestions.forEach((q) => {
      const selectedIdx = typeof q.selectedIndex === 'number' ? q.selectedIndex : -1;
      const correctIdx = typeof q.correctIndex === 'number' ? q.correctIndex : 0;
      const isCorrect = q.isCorrect ?? (selectedIdx === correctIdx);

      if (selectedIdx < 0) {
        skippedCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }

      const rawSub = (q as any).subject || (q as any).subjectSlug || subject || 'General';
      const subLabel = formatSubjectName(rawSub);

      if (!subjectGroups[subLabel]) {
        subjectGroups[subLabel] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
      }
      subjectGroups[subLabel].total++;
      if (selectedIdx < 0) {
        subjectGroups[subLabel].skipped++;
      } else if (isCorrect) {
        subjectGroups[subLabel].correct++;
      } else {
        subjectGroups[subLabel].wrong++;
      }
    });

    const correctPct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const wrongPct = totalQuestions > 0 ? Math.round((wrongCount / totalQuestions) * 100) : 0;
    const skippedPct = Math.max(0, 100 - correctPct - wrongPct);

    const isFullMock =
      /mock|mdcat|nums|etea|ecat/i.test(testTitle) || totalQuestions >= 60;
    const modePillText = isAdminAnswerKey ? 'OFFICIAL KEY' : isFullMock ? 'FULL MOCK' : 'CHAPTER DRILL';

    // Initialize A4 PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    doc.setDocumentProperties({
      title: isAdminAnswerKey
        ? `Grand Line Official Answer Key - ${testTitle}`
        : `Grand Line Verified Drill Report - ${testTitle}`,
      subject: isAdminAnswerKey
        ? `Official Answer Key for ${testTitle} (Admin: ${adminName || studentName})`
        : `Verified Drill Report for ${studentName}`,
      author: 'Boardly by SHS Virtual Academy',
      keywords: 'Boardly, Grand Line, FSC, MDCAT, MCQs, Verified Drill Report, Answer Key',
      creator: 'Boardly (boardly.cfd)',
    });

    const pageWidth = 210;
    const contentWidth = 186;
    const maxUsableY = 281.5;

    // Stamp background watermarks on Page 1 BEFORE drawing foreground
    stampPageBackgroundWatermarks(doc, pageWidth);

    // ==========================================
    // Page 1 Header Banner (Dark + Dot-Grid Texture + White Dotted Logo + Single Red Pill)
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

    // Draw white dotted Boardly logo (Icon + "Boardly" wordmark) in pure vectors
    drawVectorDottedLogoOnPdf(doc, 14.5, currentY + 2.6, 26, [255, 255, 255]);

    // Header vertical divider line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.2);
    doc.line(43, currentY + 3, 43, currentY + bannerH - 3);

    // Banner Title & Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(203, 213, 225);
    doc.text(
      isAdminAnswerKey ? 'ADMIN ANSWER KEY · BOARDLY GRAND LINE' : 'GRAND LINE VERIFIED DRILL REPORT',
      46,
      currentY + 6.4
    );

    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    const titleSnippet = doc.splitTextToSize(testTitle, 110);
    doc.text(titleSnippet[0] || testTitle, 46, currentY + 13.8);

    // Single RED Mode Pill on the right (no duplicate grey pill, vertically centered baseline)
    const pillW = 31;
    const pillH = 6.2;
    const pillX = 163;
    const pillY = currentY + (bannerH - pillH) / 2;
    doc.setFillColor(215, 25, 33); // #D71921
    doc.roundedRect(pillX, pillY, pillW, pillH, 1.6, 1.6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(255, 255, 255);
    // Exact vertical centering: pillY + pillH/2 + 0.78mm
    doc.text(modePillText, pillX + pillW / 2, pillY + pillH / 2 + 0.78, { align: 'center' });

    currentY += bannerH + 2.2;

    // ==========================================
    // Page 1 Summary Strip (Admin Answer Key vs Student Report)
    // ==========================================
    const summaryH = isAdminAnswerKey ? 10.5 : 13.5;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.roundedRect(12, currentY, contentWidth, summaryH, 1.8, 1.8, 'S');

    if (isAdminAnswerKey) {
      // Admin Answer Key Strip: Admin Name, Total MCQs, Date, Subject Area
      const adminNameStr = String(adminName || studentName || 'Administrator').replace(/\s+/g, ' ').trim();
      const row1Baseline = currentY + 6.6;
      doc.setFontSize(6.6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Admin:', 15, row1Baseline);
      doc.setTextColor(15, 23, 42);
      const singleLineAdmin = doc.splitTextToSize(adminNameStr, 50)[0] || adminNameStr;
      doc.text(singleLineAdmin, 26, row1Baseline);

      doc.setTextColor(100, 116, 139);
      doc.text('Total MCQs:', 80, row1Baseline);
      doc.setTextColor(15, 23, 42);
      doc.text(String(totalQuestions), 98, row1Baseline);

      doc.setTextColor(100, 116, 139);
      doc.text('Subject:', 115, row1Baseline);
      doc.setTextColor(15, 23, 42);
      const subFormatted = formatSubjectName(subject || 'General');
      doc.text(subFormatted, 128, row1Baseline);

      doc.setTextColor(100, 116, 139);
      doc.text('Date:', 160, row1Baseline);
      doc.setTextColor(15, 23, 42);
      doc.text(formattedDate, 170, row1Baseline);
    } else {
      // Row 1: Student Name, Score, Correct, Wrong, Skipped
      const row1Baseline = currentY + 4.8;
      doc.setFontSize(6.6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Student:', 15, row1Baseline);
      doc.setTextColor(15, 23, 42);
      const cleanStudent = String(studentName || 'Student').replace(/\s+/g, ' ').trim();
      const singleLineStudent = doc.splitTextToSize(cleanStudent, 56)[0] || cleanStudent;
      doc.text(singleLineStudent, 25.5, row1Baseline);

      doc.setTextColor(100, 116, 139);
      doc.text('Score:', 84, row1Baseline);
      doc.setTextColor(15, 23, 42);
      doc.text(`${score} / ${totalQuestions} (${percentage}%)`, 92.5, row1Baseline);

      doc.setTextColor(100, 116, 139);
      doc.text('Correct:', 126, row1Baseline);
      doc.setTextColor(21, 128, 61);
      doc.text(String(correctCount), 136, row1Baseline);

      doc.setTextColor(100, 116, 139);
      doc.text('Wrong:', 147, row1Baseline);
      doc.setTextColor(220, 38, 38);
      doc.text(String(wrongCount), 156, row1Baseline);

      doc.setTextColor(100, 116, 139);
      doc.text('Skipped:', 167, row1Baseline);
      doc.setTextColor(71, 85, 105);
      doc.text(String(skippedCount), 178, row1Baseline);

      // Row 2: Time & Date + Segmented Accuracy Bar
      const row2Baseline = currentY + 10.2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(100, 116, 139);
      doc.text(`Time: ${formattedTime}   |   Date: ${formattedDate}`, 15, row2Baseline);

      const barX = 115;
      const barY = currentY + 8.1;
      const barW = 78;
      const barH = 2.5;

      doc.setFillColor(226, 232, 240);
      doc.roundedRect(barX, barY, barW, barH, 1, 1, 'F');

      const cW = (correctPct / 100) * barW;
      const wW = (wrongPct / 100) * barW;
      const sW = (skippedPct / 100) * barW;

      if (cW > 0) {
        doc.setFillColor(21, 128, 61);
        doc.rect(barX, barY, cW, barH, 'F');
      }
      if (wW > 0) {
        doc.setFillColor(220, 38, 38);
        doc.rect(barX + cW, barY, wW, barH, 'F');
      }
      if (sW > 0) {
        doc.setFillColor(148, 163, 184);
        doc.rect(barX + cW + wW, barY, sW, barH, 'F');
      }
    }

    currentY += summaryH + 2.0;

    // ==========================================
    // Page 1 Subject-Wise Breakdown Table
    // ==========================================
    const thH = 4.6;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(12, currentY, contentWidth, thH, 1, 1, 'FD');

    const thBaseline = currentY + thH / 2 + 0.75;
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);

    if (isAdminAnswerKey) {
      // Simplified table for Admin Answer Key: Subject Area and Total MCQs
      doc.text('SUBJECT AREA', 15, thBaseline);
      doc.text('TOTAL MCQS', 193, thBaseline, { align: 'right' });
    } else {
      doc.text('SUBJECT AREA', 15, thBaseline);
      doc.text('TOTAL MCQS', 75, thBaseline, { align: 'center' });
      doc.text('CORRECT', 105, thBaseline, { align: 'center' });
      doc.text('WRONG', 130, thBaseline, { align: 'center' });
      doc.text('SKIPPED', 155, thBaseline, { align: 'center' });
      doc.text('ACCURACY', 193, thBaseline, { align: 'right' });
    }

    currentY += thH;

    const rowH = 4.0;
    for (const [subName, stats] of Object.entries(subjectGroups)) {
      doc.setDrawColor(226, 232, 240);
      doc.line(12, currentY + rowH, 198, currentY + rowH);

      const trBaseline = currentY + rowH / 2 + 0.75;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(30, 41, 59);
      doc.text(subName, 15, trBaseline);

      if (isAdminAnswerKey) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${stats.total} MCQs`, 193, trBaseline, { align: 'right' });
      } else {
        const subAcc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        doc.text(String(stats.total), 75, trBaseline, { align: 'center' });

        doc.setTextColor(21, 128, 61);
        doc.setFont('helvetica', 'bold');
        doc.text(String(stats.correct), 105, trBaseline, { align: 'center' });

        doc.setTextColor(220, 38, 38);
        doc.text(String(stats.wrong), 130, trBaseline, { align: 'center' });

        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(String(stats.skipped), 155, trBaseline, { align: 'center' });

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(`${subAcc}%`, 193, trBaseline, { align: 'right' });
      }

      currentY += rowH;
    }

    currentY += 2.5;

    // ==========================================
    // Compact Question Cards Layout (Vector, High Density, Unclipped Text)
    // ==========================================
    const CHUNK_SIZE = 5;

    for (let i = 0; i < totalQCount; i++) {
      if (signal?.aborted) throw new Error('PDF export cancelled.');

      if (i % CHUNK_SIZE === 0) {
        await new Promise((r) => setTimeout(r, 25));
        onProgress?.({
          current: i + 1,
          totalPages: totalQCount,
          message: isAdminAnswerKey
            ? `Formatting answer key question ${i + 1} of ${totalQCount}...`
            : `Formatting verified question ${i + 1} of ${totalQCount}...`,
        });
      }

      const q = gradedQuestions[i];
      const selectedIdx = typeof q.selectedIndex === 'number' ? q.selectedIndex : -1;
      const correctIdx = typeof q.correctIndex === 'number' ? q.correctIndex : 0;
      const isCorrect = q.isCorrect ?? (selectedIdx === correctIdx);

      const statusLabel = isAdminAnswerKey ? 'ANSWER KEY' : selectedIdx < 0 ? 'UNANSWERED' : isCorrect ? 'CORRECT' : 'WRONG';
      const statusColor: [number, number, number] = isAdminAnswerKey
        ? [16, 185, 129] // Emerald for answer key
        : selectedIdx < 0
        ? [71, 85, 105]
        : isCorrect
        ? [21, 128, 61]
        : [220, 38, 38];

      const cleanStem = cleanMathForPdf(q.question || 'Question content');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      const stemLineH = 2.65;
      const stemLines = doc.splitTextToSize(cleanStem, 178);
      const stemH = Math.max(2.8, stemLines.length * stemLineH);

      const opts = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'];
      const cleanOpts = opts.slice(0, 4).map((o) => cleanMathForPdf(String(o || '')));

      doc.setFontSize(6.0);
      const optLineH = 2.45;
      const opt0Lines = doc.splitTextToSize(cleanOpts[0] || '', 77);
      const opt1Lines = doc.splitTextToSize(cleanOpts[1] || '', 77);
      const opt2Lines = doc.splitTextToSize(cleanOpts[2] || '', 77);
      const opt3Lines = doc.splitTextToSize(cleanOpts[3] || '', 77);

      const row1MaxLines = Math.max(1, opt0Lines.length, opt1Lines.length);
      const row2MaxLines = Math.max(1, opt2Lines.length, opt3Lines.length);

      // Generous vertical padding inside option boxes so text never touches top or bottom border
      const row1H = row1MaxLines * optLineH + 1.85;
      const row2H = row2MaxLines * optLineH + 1.85;
      const optionsTotalH = row1H + row2H + 0.9;

      const selectedLetter = selectedIdx >= 0 ? OPT_LABELS[selectedIdx] || String(selectedIdx + 1) : 'Skipped';
      const correctLetter = OPT_LABELS[correctIdx] || 'A';

      const cleanExp = cleanMathForPdf(
        q.explanation || 'Step-by-step derivation verified by Boardly Grand Line.'
      );
      doc.setFontSize(5.8);
      const expLineH = 2.4;
      const expLines = doc.splitTextToSize(cleanExp, 162).slice(0, 2);
      const expBoxH = Math.max(1, expLines.length) * expLineH + 1.7;

      // Total height of question card
      const headerRowH = 4.9;
      const answerStripH = 3.4;
      const cardHeight = headerRowH + stemH + 0.8 + optionsTotalH + answerStripH + expBoxH + 1.2;

      // Only start a new page if this question card would cross maxUsableY
      if (currentY + cardHeight > maxUsableY) {
        doc.addPage();
        stampPageBackgroundWatermarks(doc, pageWidth);
        currentY = 14.0; // Starts right below the single slim running header on Page 2+
      }

      // 1. Draw Card Outer Border
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.roundedRect(12, currentY, contentWidth, cardHeight, 1.4, 1.4, 'S');

      // 2. Question Number & Status Badge
      const badgeW = isAdminAnswerKey ? 24.0 : 22.0;
      const badgeH = 4.0;
      const badgeX = isAdminAnswerKey ? 171.0 : 173.0;
      const badgeY = currentY + 0.85;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(15, 23, 42);
      doc.text(`Q${i + 1}.`, 15, badgeY + badgeH / 2 + 0.85);

      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.0, 1.0, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.6);
      doc.setTextColor(255, 255, 255);
      doc.text(statusLabel, badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.68, {
        align: 'center',
      });

      // 3. Question Stem Text
      const stemTopY = currentY + headerRowH;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);
      doc.text(stemLines, 15, stemTopY + 2.0, { lineHeightFactor: 1.15 });

      // 4. 2x2 Options Grid
      const optY = stemTopY + stemH + 0.8;
      const col1X = 15;
      const col2X = 106;
      const optColW = 89;

      const drawOptionBox = (
        optIdx: number,
        x: number,
        y: number,
        h: number,
        lines: string[]
      ) => {
        const letter = OPT_LABELS[optIdx] || String(optIdx + 1);
        const isOptCorrect = optIdx === correctIdx;
        const isOptSelected = !isAdminAnswerKey && optIdx === selectedIdx;

        doc.setLineWidth(0.22);

        if (isOptCorrect) {
          doc.setFillColor(236, 253, 245); // light emerald tint
          doc.setDrawColor(16, 185, 129); // #10b981
          doc.roundedRect(x, y, optColW, h, 1.0, 1.0, 'FD');
          doc.setTextColor(6, 95, 70);
        } else if (isOptSelected) {
          doc.setFillColor(254, 242, 242); // light red tint
          doc.setDrawColor(239, 68, 68); // #ef4444
          doc.roundedRect(x, y, optColW, h, 1.0, 1.0, 'FD');
          doc.setTextColor(153, 27, 27);
        } else {
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(x, y, optColW, h, 1.0, 1.0, 'S');
          doc.setTextColor(30, 41, 59);
        }

        const nLines = Math.max(1, lines.length);
        const blockH = (nLines - 1) * optLineH;
        const firstLineBaseline = y + (h - blockH) / 2 + 0.68;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.0);
        doc.text(`(${letter})`, x + 2.2, firstLineBaseline);

        doc.setFont('helvetica', isOptCorrect ? 'bold' : 'normal');
        doc.text(lines, x + 8.0, firstLineBaseline, { lineHeightFactor: 1.16 });
      };

      drawOptionBox(0, col1X, optY, row1H, opt0Lines);
      drawOptionBox(1, col2X, optY, row1H, opt1Lines);
      drawOptionBox(2, col1X, optY + row1H + 0.9, row2H, opt2Lines);
      drawOptionBox(3, col2X, optY + row1H + 0.9, row2H, opt3Lines);

      // 5. Answer Strip
      const ansRowTop = optY + optionsTotalH;
      const ansBaseline = ansRowTop + 2.4;
      doc.setFontSize(6.0);

      if (isAdminAnswerKey) {
        // Answer Key Mode: No "Your Answer" or "UNANSWERED" label
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('Correct Answer:', 15, ansBaseline);

        doc.setTextColor(21, 128, 61);
        doc.text(`[ ${correctLetter} ]`, 32.5, ansBaseline);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`(Option ${correctLetter} is the verified key)`, 40.5, ansBaseline);
      } else {
        // Student Mode: "Your Answer [ X ] | Correct Answer [ Y ]"
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('Your Answer:', 15, ansBaseline);

        if (selectedIdx < 0) {
          doc.setTextColor(71, 85, 105);
        } else if (isCorrect) {
          doc.setTextColor(21, 128, 61);
        } else {
          doc.setTextColor(220, 38, 38);
        }
        doc.text(`[ ${selectedLetter} ]`, 30.0, ansBaseline);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('|', 44.5, ansBaseline);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('Correct Answer:', 48.0, ansBaseline);

        doc.setTextColor(21, 128, 61);
        doc.text(`[ ${correctLetter} ]`, 65.5, ansBaseline);
      }

      // 6. Short Explanation Box
      const expY = ansRowTop + answerStripH;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.roundedRect(15, expY, 180, expBoxH, 0.8, 0.8, 'S');

      doc.setFillColor(100, 116, 139);
      doc.rect(15, expY, 1.2, expBoxH, 'F');

      const nExpLines = Math.max(1, expLines.length);
      const expBlockH = (nExpLines - 1) * expLineH;
      const expFirstBaseline = expY + (expBoxH - expBlockH) / 2 + 0.66;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(15, 23, 42);
      doc.text('Explanation:', 18, expFirstBaseline);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(expLines, 31.5, expFirstBaseline, { lineHeightFactor: 1.15 });

      currentY += cardHeight + 1.35;
    }

    // ==========================================
    // Final Page Copyright & Academic Verification Notice
    // ==========================================
    if (currentY + 12.5 > maxUsableY) {
      doc.addPage();
      stampPageBackgroundWatermarks(doc, pageWidth);
      currentY = 14.5;
    }

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.roundedRect(12, currentY, contentWidth, 11.5, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(15, 23, 42);
    doc.text(
      isAdminAnswerKey
        ? 'OFFICIAL VERIFIED ANSWER KEY · BOARDLY GRAND LINE'
        : 'OFFICIAL VERIFIED DRILL REPORT · BOARDLY GRAND LINE',
      15,
      currentY + 3.8
    );

    const recipientLabel = isAdminAnswerKey ? (adminName || 'Authorized Administrator') : studentName;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `© ${new Date().getFullYear()} Boardly by SHS Virtual Academy (boardly.cfd). All rights reserved. Generated exclusively for ${recipientLabel} on ${formattedDate}.`,
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
    const footerUserLabel = isAdminAnswerKey
      ? `Admin: ${adminName || 'Administrator'}`
      : `Student: ${studentName}`;

    for (let p = 0; p < totalPages; p++) {
      doc.setPage(p + 1);

      // ONE Slim Running Header on Pages 2+
      if (p > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(71, 85, 105);
        const headerTitle = isAdminAnswerKey
          ? `Boardly Grand Line (Answer Key) · ${testTitle}`
          : `Boardly Grand Line · ${testTitle}`;
        doc.text(headerTitle, 12, 9.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`${formatSubjectName(subject || 'General')} · Page ${p + 1} of ${totalPages}`, 198, 9.5, {
          align: 'right',
        });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.22);
        doc.line(12, 11.5, 198, 11.5);
      }

      // EXACTLY ONE clean Running Footer line on EVERY page (no duplicated lines)
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.line(12, 285, 198, 285);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.6);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Boardly Grand Line · ${testTitle} · Page ${p + 1} of ${totalPages} · ${footerUserLabel} · ${formattedDate}`,
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
      current: totalQCount,
      totalPages: totalQCount,
      message: 'Finalizing PDF download...',
    });

    const safeTitle = testTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = isAdminAnswerKey
      ? `Boardly_${safeTitle}_AnswerKey.pdf`
      : `Boardly_${safeTitle}_Report.pdf`;
    doc.save(filename);
  } finally {
    clearTimeout(timeoutId);
    if (typeof document !== 'undefined' && document.body) {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    }
  }
}

/**
 * Downloads a Grand Line test result PDF by its test ID.
 * Supports downloading student attempt reports or official admin answer keys.
 */
export async function downloadDrillResultPdfByTestId(
  testId: string,
  fallbackAttempt?: AmbassadorTestAttempt,
  studentFallbackName?: string,
  onProgress?: (progress: PdfExportProgress) => void,
  signal?: AbortSignal,
  preferAnswerKey?: boolean
): Promise<void> {
  let attemptResult: {
    attempt: AmbassadorTestAttempt | null;
    test: any;
    gradedQuestions?: GradedAttemptQuestion[];
    isAdminAnswerKey?: boolean;
    isAdmin?: boolean;
  } | null = null;

  try {
    attemptResult = await getMyTestAttemptForTest(testId);
  } catch (err) {
    console.warn('[testPdfExporter] getMyTestAttemptForTest note:', err);
  }

  const isAnswerKey =
    preferAnswerKey ||
    Boolean(attemptResult?.isAdminAnswerKey) ||
    (!attemptResult?.attempt && !fallbackAttempt && Boolean(attemptResult?.test));

  const resolvedAttempt = attemptResult?.attempt || fallbackAttempt;

  if (!resolvedAttempt && !isAnswerKey) {
    throw new Error('No verified attempt found for this drill. Please take the drill first.');
  }

  const resolvedQuestions: GradedAttemptQuestion[] =
    Array.isArray(attemptResult?.gradedQuestions) && attemptResult.gradedQuestions.length > 0
      ? attemptResult.gradedQuestions
      : Array.isArray(resolvedAttempt?.gradedQuestions) && resolvedAttempt.gradedQuestions.length > 0
      ? resolvedAttempt.gradedQuestions
      : (attemptResult?.test?.questions || []).map((q: any, idx: number) => ({
          id: q.id || `q_${idx}`,
          position: typeof q.position === 'number' ? q.position : idx,
          question: q.question,
          options: q.options,
          selectedIndex: isAnswerKey ? -1 : -1,
          correctIndex: q.correctIndex ?? 0,
          isCorrect: isAnswerKey ? true : false,
          explanation: q.explanation,
        }));

  const testTitle =
    resolvedAttempt?.testTitle ||
    attemptResult?.test?.title ||
    'Grand Line Drill';
  const subject =
    resolvedAttempt?.subject ||
    attemptResult?.test?.subject ||
    'General';

  const userDisplayName =
    resolvedAttempt?.userName ||
    resolvedAttempt?.studentName ||
    studentFallbackName ||
    'Student';

  const adminName =
    attemptResult?.test?.adminName ||
    studentFallbackName ||
    'Administrator';

  await exportDrillResultToPdf({
    testId,
    testTitle,
    subject,
    studentName: userDisplayName,
    adminName,
    isAdminAnswerKey: isAnswerKey,
    date: resolvedAttempt?.date,
    score: resolvedAttempt?.score ?? 0,
    totalQuestions: resolvedAttempt?.totalQuestions || resolvedQuestions.length,
    percentage: resolvedAttempt?.percentage ?? 0,
    timeTakenSeconds: resolvedAttempt?.timeTakenSeconds ?? 0,
    gradedQuestions: resolvedQuestions,
    signal,
    onProgress,
  });
}

/**
 * Exports a full Practice Test paper with questions and official answer key appendix (pure vector jsPDF).
 */
export async function exportTestToPdf(
  options: ExportPdfOptions,
  legacyProgressCallback?: (text: string) => void
): Promise<void> {
  const {
    title,
    university = 'General Entrance Drill',
    markingScheme,
    studentName = 'Candidate',
    questions,
    signal,
    onProgress,
  } = options;

  if (!questions || questions.length === 0) {
    throw new Error('No questions available in this test to export.');
  }

  legacyProgressCallback?.('Formatting test paper layout...');
  onProgress?.({ current: 1, totalPages: 1, message: 'Formatting test paper layout...' });

  const resolvedMarkingScheme = markingScheme || getUniversityRulesSummary(university);
  const resolvedQuestions = await resolveQuestionKeys(questions);
  const OPT_LABELS = ['A', 'B', 'C', 'D'];
  const formattedDate = new Date().toLocaleDateString('en-GB');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  doc.setDocumentProperties({
    title: `Boardly Entry Test Paper - ${title}`,
    subject: `Official Test Paper for ${studentName}`,
    author: 'Boardly by SHS Virtual Academy',
    keywords: 'Boardly, Practice Test, Entry Test, MCQs',
    creator: 'Boardly (boardly.cfd)',
  });

  const pageWidth = 210;
  const contentWidth = 186;
  const maxUsableY = 281.5;
  let currentY = 10;

  stampPageBackgroundWatermarks(doc, pageWidth);

  // Header Banner
  const bannerH = 18.5;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(12, currentY, contentWidth, bannerH, 2, 2, 'F');

  doc.setFillColor(38, 49, 71);
  for (let gx = 15; gx < 195; gx += 4.5) {
    for (let gy = currentY + 2.2; gy < currentY + bannerH - 1.5; gy += 4.5) {
      doc.circle(gx, gy, 0.22, 'F');
    }
  }

  drawVectorDottedLogoOnPdf(doc, 14.5, currentY + 2.6, 26, [255, 255, 255]);

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(43, currentY + 3, 43, currentY + bannerH - 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(203, 213, 225);
  doc.text('OFFICIAL ENTRANCE TEST PAPER', 46, currentY + 6.4);

  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  const titleSnippet = doc.splitTextToSize(title, 110);
  doc.text(titleSnippet[0] || title, 46, currentY + 13.8);

  const pillW = 31;
  const pillH = 6.2;
  const pillX = 163;
  const pillY = currentY + (bannerH - pillH) / 2;
  doc.setFillColor(215, 25, 33);
  doc.roundedRect(pillX, pillY, pillW, pillH, 1.6, 1.6, 'F');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text(university.substring(0, 16).toUpperCase(), pillX + pillW / 2, pillY + pillH / 2 + 0.78, {
    align: 'center',
  });

  currentY += bannerH + 2.2;

  // Candidate Metadata Strip
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(12, currentY, contentWidth, 9.5, 1.5, 1.5, 'S');

  const metaBaseline = currentY + 5.5;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Candidate:', 15, metaBaseline);
  doc.setTextColor(15, 23, 42);
  const singleCandidate = doc.splitTextToSize(String(studentName || 'Candidate'), 55)[0] || studentName;
  doc.text(singleCandidate, 28, metaBaseline);

  doc.setTextColor(100, 116, 139);
  doc.text('MCQs:', 86, metaBaseline);
  doc.setTextColor(15, 23, 42);
  doc.text(`${resolvedQuestions.length} Questions`, 95, metaBaseline);

  doc.setTextColor(100, 116, 139);
  doc.text('Rules:', 130, metaBaseline);
  doc.setTextColor(15, 23, 42);
  const rulesSnippet = doc.splitTextToSize(resolvedMarkingScheme, 55);
  doc.text(rulesSnippet[0] || resolvedMarkingScheme, 138, metaBaseline);

  currentY += 12;

  // Questions
  for (let i = 0; i < resolvedQuestions.length; i++) {
    if (signal?.aborted) throw new Error('PDF export cancelled.');

    if (i % 5 === 0) {
      await new Promise((r) => setTimeout(r, 20));
    }

    const q = resolvedQuestions[i];
    const stemRaw = q.stem || q.q || 'Question content';
    const cleanStem = cleanMathForPdf(stemRaw);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.0);
    const stemLineH = 2.85;
    const stemLines = doc.splitTextToSize(cleanStem, 178);
    const stemH = Math.max(3.2, stemLines.length * stemLineH);

    const opts = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'];
    const cleanOpts = opts.slice(0, 4).map((o) => cleanMathForPdf(String(o || '')));

    doc.setFontSize(6.2);
    const optLineH = 2.65;
    const opt0Lines = doc.splitTextToSize(cleanOpts[0] || '', 77);
    const opt1Lines = doc.splitTextToSize(cleanOpts[1] || '', 77);
    const opt2Lines = doc.splitTextToSize(cleanOpts[2] || '', 77);
    const opt3Lines = doc.splitTextToSize(cleanOpts[3] || '', 77);

    const row1Max = Math.max(1, opt0Lines.length, opt1Lines.length);
    const row2Max = Math.max(1, opt2Lines.length, opt3Lines.length);
    const row1H = row1Max * optLineH + 2.2;
    const row2H = row2Max * optLineH + 2.2;
    const optionsTotalH = row1H + row2H + 1.2;

    const cardHeight = 4.8 + stemH + optionsTotalH + 2.2;

    if (currentY + cardHeight > maxUsableY) {
      doc.addPage();
      stampPageBackgroundWatermarks(doc, pageWidth);
      currentY = 14.5;
    }

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.roundedRect(12, currentY, contentWidth, cardHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    doc.setTextColor(15, 23, 42);
    doc.text(`Q${i + 1}.`, 15, currentY + 4.0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.0);
    doc.setTextColor(15, 23, 42);
    doc.text(stemLines, 15, currentY + 7.2, { lineHeightFactor: 1.15 });

    const optY = currentY + 5.2 + stemH + 0.6;
    const col1X = 15;
    const col2X = 106;
    const optColW = 89;

    const drawPaperOpt = (optIdx: number, x: number, y: number, h: number, lines: string[]) => {
      const letter = OPT_LABELS[optIdx] || String(optIdx + 1);
      doc.setDrawColor(203, 213, 225);
      doc.setTextColor(30, 41, 59);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, y, optColW, h, 1.1, 1.1, 'S');

      const nLines = Math.max(1, lines.length);
      const blockH = (nLines - 1) * optLineH;
      const firstBaseline = y + (h - blockH) / 2 + 0.72;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.text(`(${letter})`, x + 2.2, firstBaseline);

      doc.setFont('helvetica', 'normal');
      doc.text(lines, x + 8.2, firstBaseline, { lineHeightFactor: 1.18 });
    };

    drawPaperOpt(0, col1X, optY, row1H, opt0Lines);
    drawPaperOpt(1, col2X, optY, row1H, opt1Lines);
    drawPaperOpt(2, col1X, optY + row1H + 1.2, row2H, opt2Lines);
    drawPaperOpt(3, col2X, optY + row1H + 1.2, row2H, opt3Lines);

    currentY += cardHeight + 1.8;
  }

  // Answer Key Section
  if (currentY + 18 > maxUsableY) {
    doc.addPage();
    stampPageBackgroundWatermarks(doc, pageWidth);
    currentY = 14.5;
  }

  doc.setFillColor(215, 25, 33);
  doc.roundedRect(12, currentY, contentWidth, 6.8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL ANSWER KEY & EXPLANATIONS', 16, currentY + 4.3);
  doc.text(`${resolvedQuestions.length} Questions`, 192, currentY + 4.3, { align: 'right' });
  currentY += 8.5;

  for (let i = 0; i < resolvedQuestions.length; i++) {
    const q = resolvedQuestions[i];
    const correctIdx = typeof q.correct === 'number' ? q.correct : 0;
    const correctLetter = OPT_LABELS[correctIdx] || 'A';
    const explanationRaw = q.explain || q.explanation || 'Step-by-step derivation verified by Boardly study portal.';
    const cleanExp = cleanMathForPdf(explanationRaw);

    doc.setFontSize(6.0);
    const expLines = doc.splitTextToSize(cleanExp, 172);
    const keyCardH = 5.2 + expLines.length * 2.6 + 2.0;

    if (currentY + keyCardH > maxUsableY) {
      doc.addPage();
      stampPageBackgroundWatermarks(doc, pageWidth);
      currentY = 14.5;
    }

    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(12, currentY, contentWidth, keyCardH, 1.1, 1.1, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(`Q${i + 1}.`, 15, currentY + 3.8);

    const kBadgeX = 23;
    const kBadgeY = currentY + 1.0;
    const kBadgeW = 9.5;
    const kBadgeH = 4.0;
    doc.setFillColor(215, 25, 33);
    doc.roundedRect(kBadgeX, kBadgeY, kBadgeW, kBadgeH, 0.9, 0.9, 'F');
    doc.setFontSize(5.8);
    doc.setTextColor(255, 255, 255);
    doc.text(`[ ${correctLetter} ]`, kBadgeX + kBadgeW / 2, kBadgeY + kBadgeH / 2 + 0.72, {
      align: 'center',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.0);
    doc.setTextColor(51, 65, 85);
    doc.text(expLines, 15, currentY + 7.2, { lineHeightFactor: 1.15 });

    currentY += keyCardH + 1.6;
  }

  // Stamp Running Headers and Footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 0; p < totalPages; p++) {
    doc.setPage(p + 1);

    if (p > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Boardly Entry Test Engine · ${title}`, 12, 9.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${university} · Page ${p + 1} of ${totalPages}`, 198, 9.5, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.line(12, 11.5, 198, 11.5);
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(12, 285, 198, 285);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor(100, 116, 139);
    doc.text(`Boardly Entry Test Engine · ${title} · Page ${p + 1} of ${totalPages} · Candidate: ${studentName}`, 12, 288.8);
    doc.setFontSize(5.7);
    doc.setTextColor(148, 163, 184);
    doc.text(`© ${new Date().getFullYear()} Boardly by SHS Virtual Academy · boardly.cfd · All rights reserved.`, 12, 292.3);
  }

  const filename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Boardly.pdf`;
  doc.save(filename);
}
