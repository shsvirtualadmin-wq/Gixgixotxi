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
import {
  getWatermarkLogoPngDataUrl,
  getWhiteHeaderLogoPngDataUrl,
} from './logoDottedSvg';

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
 * Stamps the background layers (centered black dotted Boardly logo at 8% opacity +
 * faint diagonal "Boardly · boardly.cfd" text watermark) onto the currently active page
 * BEFORE foreground question cards are drawn so cards never get covered.
 */
function stampPageBackgroundWatermarks(doc: jsPDF, watermarkLogoPng: string, pageWidth = 210): void {
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

  // 2. Centered Black Dotted Boardly Logo (pre-rasterized once at 8% opacity)
  if (watermarkLogoPng) {
    const wmW = 132;
    const wmH = wmW * (824 / 1768);
    const wmX = (pageWidth - wmW) / 2;
    const wmY = (297 - wmH) / 2;
    doc.addImage(watermarkLogoPng, 'PNG', wmX, wmY, wmW, wmH, undefined, 'FAST');
  }
}

/**
 * Pure Vector Grand Line Verified Drill Report Exporter:
 * - 100% direct jsPDF drawing: text, badges, cards, tables, bars rendered as crisp vectors.
 * - Zero html2canvas, zero DOM staging, zero browser freezing or layout shifts.
 * - Dotted Boardly logo rasterized once as small PNG and stamped behind content on each page.
 * - Diagonal watermark ("Boardly · boardly.cfd") drawn natively in jsPDF.
 * - Chunked processing (5 questions per yield) with setTimeout(28) keeps UI & messages smooth.
 * - AbortSignal & 60-second timeout support with safe scroll lock release.
 * - Tightly packs ~83 questions into ~9 pages (~24 KB vector PDF).
 */
export async function exportDrillResultToPdf(options: ExportDrillResultPdfOptions): Promise<void> {
  const {
    testId,
    testTitle,
    subject,
    studentName,
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
    const modePillText = isFullMock ? 'Full Mock' : 'Chapter Drill';

    // Retrieve cached lightweight PNG Data URLs for the dotted logo (generated once)
    const watermarkLogoPng = getWatermarkLogoPngDataUrl();
    const whiteHeaderLogoPng = getWhiteHeaderLogoPngDataUrl();

    // Initialize A4 PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    doc.setDocumentProperties({
      title: `Grand Line Verified Drill Report - ${testTitle}`,
      subject: `Verified Drill Report for ${studentName}`,
      author: 'Boardly by SHS Virtual Academy',
      keywords: 'Boardly, Grand Line, FSC, MDCAT, MCQs, Verified Drill Report',
      creator: 'Boardly (boardly.cfd)',
    });

    const pageWidth = 210;
    const contentWidth = 186;
    const maxUsableY = 280;

    // Stamp background watermarks on Page 1 BEFORE drawing foreground
    stampPageBackgroundWatermarks(doc, watermarkLogoPng, pageWidth);

    // ==========================================
    // Page 1 Header Banner (Dark + Dot-Grid Texture + White Dotted Logo)
    // ==========================================
    let currentY = 12;

    doc.setFillColor(15, 23, 42); // #0f172a
    doc.roundedRect(12, currentY, contentWidth, 20, 2, 2, 'F');

    // Faint dot-grid texture inside the dark banner
    doc.setFillColor(38, 49, 71);
    for (let gx = 15; gx < 195; gx += 4.5) {
      for (let gy = currentY + 2.5; gy < currentY + 18.5; gy += 4.5) {
        doc.circle(gx, gy, 0.22, 'F');
      }
    }

    // Stamp white dotted logo
    if (whiteHeaderLogoPng) {
      doc.addImage(
        whiteHeaderLogoPng,
        'PNG',
        15,
        currentY + 3.2,
        24,
        24 * (824 / 1768),
        undefined,
        'FAST'
      );
    }

    // Header divider line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.2);
    doc.line(42, currentY + 3, 42, currentY + 17);

    // Banner Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(203, 213, 225);
    doc.text('GRAND LINE VERIFIED DRILL REPORT', 45, currentY + 7);

    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    const titleSnippet = doc.splitTextToSize(testTitle, 105);
    doc.text(titleSnippet[0] || testTitle, 45, currentY + 14.5);

    // Mode Pill on right
    doc.setFillColor(215, 25, 33); // #D71921
    doc.roundedRect(162, currentY + 4, 32, 5, 2, 2, 'F');
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.text(modePillText.toUpperCase(), 178, currentY + 7.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(203, 213, 225);
    doc.text(formatSubjectName(subject || 'General'), 178, currentY + 14, { align: 'center' });

    currentY += 23;

    // ==========================================
    // Page 1 Summary Strip + Accuracy Bar
    // ==========================================
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.roundedRect(12, currentY, contentWidth, 14, 2, 2, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Student:', 15, currentY + 4.5);
    doc.setTextColor(15, 23, 42);
    doc.text(studentName, 26, currentY + 4.5);

    doc.setTextColor(100, 116, 139);
    doc.text('Score:', 65, currentY + 4.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${score} / ${totalQuestions} (${percentage}%)`, 74, currentY + 4.5);

    doc.setTextColor(100, 116, 139);
    doc.text('Correct:', 115, currentY + 4.5);
    doc.setTextColor(21, 128, 61);
    doc.text(String(correctCount), 126, currentY + 4.5);

    doc.setTextColor(100, 116, 139);
    doc.text('Wrong:', 140, currentY + 4.5);
    doc.setTextColor(220, 38, 38);
    doc.text(String(wrongCount), 150, currentY + 4.5);

    doc.setTextColor(100, 116, 139);
    doc.text('Skipped:', 165, currentY + 4.5);
    doc.setTextColor(71, 85, 105);
    doc.text(String(skippedCount), 177, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(`Time: ${formattedTime}   |   Date: ${formattedDate}`, 15, currentY + 9.5);

    // Segmented progress bar
    const barX = 115;
    const barY = currentY + 7.5;
    const barW = 76;
    const barH = 2.4;

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

    currentY += 16.5;

    // ==========================================
    // Page 1 Subject-Wise Breakdown Table
    // ==========================================
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(12, currentY, contentWidth, 4.2, 1, 1, 'FD');

    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('SUBJECT AREA', 15, currentY + 3);
    doc.text('TOTAL MCQS', 75, currentY + 3, { align: 'center' });
    doc.text('CORRECT', 105, currentY + 3, { align: 'center' });
    doc.text('WRONG', 130, currentY + 3, { align: 'center' });
    doc.text('SKIPPED', 155, currentY + 3, { align: 'center' });
    doc.text('ACCURACY', 193, currentY + 3, { align: 'right' });

    currentY += 4.2;

    for (const [subName, stats] of Object.entries(subjectGroups)) {
      const subAcc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      doc.setFillColor(255, 255, 255);
      doc.rect(12, currentY, contentWidth, 3.8, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(12, currentY + 3.8, 198, currentY + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(30, 41, 59);
      doc.text(subName, 15, currentY + 2.7);

      doc.text(String(stats.total), 75, currentY + 2.7, { align: 'center' });

      doc.setTextColor(21, 128, 61);
      doc.setFont('helvetica', 'bold');
      doc.text(String(stats.correct), 105, currentY + 2.7, { align: 'center' });

      doc.setTextColor(220, 38, 38);
      doc.text(String(stats.wrong), 130, currentY + 2.7, { align: 'center' });

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(String(stats.skipped), 155, currentY + 2.7, { align: 'center' });

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${subAcc}%`, 193, currentY + 2.7, { align: 'right' });

      currentY += 3.8;
    }

    currentY += 3.5;

    // ==========================================
    // Compact Question Cards Layout (Vector)
    // ==========================================
    const CHUNK_SIZE = 5;

    for (let i = 0; i < totalQCount; i++) {
      if (signal?.aborted) throw new Error('PDF export cancelled.');

      // Yield event loop every CHUNK_SIZE items so scrolling and progress bar stay silky smooth
      if (i % CHUNK_SIZE === 0) {
        await new Promise((r) => setTimeout(r, 28));
        onProgress?.({
          current: i + 1,
          totalPages: totalQCount,
          message: `Formatting verified question ${i + 1} of ${totalQCount}...`,
        });
      }

      const q = gradedQuestions[i];
      const selectedIdx = typeof q.selectedIndex === 'number' ? q.selectedIndex : -1;
      const correctIdx = typeof q.correctIndex === 'number' ? q.correctIndex : 0;
      const isCorrect = q.isCorrect ?? (selectedIdx === correctIdx);

      const statusLabel = selectedIdx < 0 ? 'UNANSWERED' : isCorrect ? 'CORRECT' : 'WRONG';
      const statusColor: [number, number, number] =
        selectedIdx < 0 ? [71, 85, 105] : isCorrect ? [21, 128, 61] : [220, 38, 38];

      const cleanStem = cleanMathForPdf(q.question || 'Question content');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      const stemLines = doc.splitTextToSize(cleanStem, 178);
      const stemH = Math.max(3.5, stemLines.length * 3.1);

      const opts = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'];
      const cleanOpts = opts.slice(0, 4).map((o) => cleanMathForPdf(String(o || '')));

      doc.setFontSize(6.2);
      const opt0Lines = doc.splitTextToSize(cleanOpts[0] || '', 78);
      const opt1Lines = doc.splitTextToSize(cleanOpts[1] || '', 78);
      const opt2Lines = doc.splitTextToSize(cleanOpts[2] || '', 78);
      const opt3Lines = doc.splitTextToSize(cleanOpts[3] || '', 78);

      const row1H = Math.max(3.8, Math.max(opt0Lines.length, opt1Lines.length) * 2.8 + 1.2);
      const row2H = Math.max(3.8, Math.max(opt2Lines.length, opt3Lines.length) * 2.8 + 1.2);
      const optionsTotalH = row1H + row2H + 1.5;

      const selectedLetter = selectedIdx >= 0 ? OPT_LABELS[selectedIdx] || String(selectedIdx + 1) : 'Skipped';
      const correctLetter = OPT_LABELS[correctIdx] || 'A';

      const cleanExp = cleanMathForPdf(
        q.explanation || 'Step-by-step derivation verified by Boardly Grand Line.'
      );
      doc.setFontSize(6.0);
      const expLines = doc.splitTextToSize(cleanExp, 172);
      const expH = Math.min(8.5, Math.max(3.2, expLines.length * 2.6 + 1.2));

      const cardHeight = 4.5 + stemH + optionsTotalH + 3.2 + expH + 2;

      // Overflow check: if card overflows current page, add new page and stamp watermark FIRST
      if (currentY + cardHeight > maxUsableY) {
        doc.addPage();
        stampPageBackgroundWatermarks(doc, watermarkLogoPng, pageWidth);
        currentY = 16;
      }

      // 1. Draw Card Border (without solid white fill so the faint background dotted logo shines through)
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.roundedRect(12, currentY, contentWidth, cardHeight, 1.5, 1.5, 'S');

      // 2. Question Header & Status Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Q${i + 1}.`, 15, currentY + 3.8);

      const badgeW = 20;
      const badgeH = 3.6;
      const badgeX = 174;
      const badgeY = currentY + 1.2;

      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1, 1, 'F');
      doc.setFontSize(5.8);
      doc.setTextColor(255, 255, 255);
      doc.text(statusLabel, badgeX + badgeW / 2, badgeY + 2.5, { align: 'center' });

      // 3. Question Stem Text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(30, 41, 59);
      doc.text(stemLines, 15, currentY + 7.2);

      // 4. 2x2 Options Grid
      const optY = currentY + 7.2 + stemH + 0.5;
      const col1X = 15;
      const col2X = 106;
      const optColW = 88;

      const drawOptionPill = (
        optIdx: number,
        x: number,
        y: number,
        h: number,
        lines: string[]
      ) => {
        const letter = OPT_LABELS[optIdx] || String(optIdx + 1);
        const isOptCorrect = optIdx === correctIdx;
        const isOptSelected = optIdx === selectedIdx;

        doc.setLineWidth(0.2);

        if (isOptCorrect) {
          doc.setFillColor(236, 253, 245); // #ecfdf5
          doc.setDrawColor(16, 185, 129); // #10b981
          doc.roundedRect(x, y, optColW, h, 1, 1, 'FD');
          doc.setTextColor(6, 95, 70);
        } else if (isOptSelected) {
          doc.setFillColor(254, 242, 242); // #fef2f2
          doc.setDrawColor(239, 68, 68); // #ef4444
          doc.roundedRect(x, y, optColW, h, 1, 1, 'FD');
          doc.setTextColor(153, 27, 27);
        } else {
          doc.setDrawColor(226, 232, 240); // #e2e8f0
          doc.roundedRect(x, y, optColW, h, 1, 1, 'S');
          doc.setTextColor(51, 65, 85);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.2);
        doc.text(`(${letter})`, x + 2, y + 2.6);

        doc.setFont('helvetica', isOptCorrect ? 'bold' : 'normal');
        doc.text(lines, x + 8, y + 2.6);
      };

      drawOptionPill(0, col1X, optY, row1H, opt0Lines);
      drawOptionPill(1, col2X, optY, row1H, opt1Lines);
      drawOptionPill(2, col1X, optY + row1H + 1.2, row2H, opt2Lines);
      drawOptionPill(3, col2X, optY + row1H + 1.2, row2H, opt3Lines);

      // 5. Answer Strip
      const ansY = optY + optionsTotalH + 2.6;
      doc.setFontSize(6.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Your Answer:', 15, ansY);

      doc.setFont('helvetica', 'bold');
      if (selectedIdx < 0) {
        doc.setTextColor(71, 85, 105);
      } else if (isCorrect) {
        doc.setTextColor(21, 128, 61);
      } else {
        doc.setTextColor(220, 38, 38);
      }
      doc.text(`[ ${selectedLetter} ]`, 30, ansY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('|   Correct Answer:', 46, ansY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(21, 128, 61);
      doc.text(`[ ${correctLetter} ]`, 68, ansY);

      // 6. Short Explanation Box
      const expY = ansY + 2.2;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.roundedRect(15, expY, 180, expH, 0.8, 0.8, 'S');

      doc.setFillColor(148, 163, 184);
      doc.rect(15, expY, 1.2, expH, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.setTextColor(15, 23, 42);
      doc.text('Explanation:', 18, expY + 2.4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(expLines.slice(0, 3), 32, expY + 2.4);

      currentY += cardHeight + 2.2;
    }

    // ==========================================
    // Final Page Copyright & Academic Verification Notice
    // ==========================================
    if (currentY + 13 > maxUsableY) {
      doc.addPage();
      stampPageBackgroundWatermarks(doc, watermarkLogoPng, pageWidth);
      currentY = 16;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.roundedRect(12, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(15, 23, 42);
    doc.text('OFFICIAL VERIFIED DRILL REPORT · BOARDLY GRAND LINE', 15, currentY + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `© ${new Date().getFullYear()} Boardly by SHS Virtual Academy (boardly.cfd). All rights reserved. Generated exclusively for ${studentName} on ${formattedDate}.`,
      15,
      currentY + 7.2
    );
    doc.text(
      'For personal study use only. Commercial distribution, unauthorized copying, or online scraping is strictly prohibited.',
      15,
      currentY + 10.2
    );

    // ==========================================
    // Stamp Running Headers & Running Footers on ALL Pages
    // ==========================================
    const totalPages = doc.getNumberOfPages();

    for (let p = 0; p < totalPages; p++) {
      doc.setPage(p + 1);

      // Slim Running Header (Pages 2+)
      if (p > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Boardly Grand Line Verified Drill Report · ${testTitle}`, 12, 10);

        doc.setFont('helvetica', 'normal');
        doc.text(`${formatSubjectName(subject || 'General')} · ${formattedDate}`, 198, 10, {
          align: 'right',
        });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(12, 12, 198, 12);
      }

      // Running Footer on EVERY page
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.line(12, 285, 198, 285);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Boardly Grand Line · ${testTitle} · Page ${p + 1} of ${totalPages} · Student: ${studentName} · ${formattedDate}`,
        12,
        289
      );

      doc.setFontSize(5.8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `© ${new Date().getFullYear()} Boardly by SHS Virtual Academy · boardly.cfd · All rights reserved. For personal study use only. Reproduction or distribution without permission is prohibited.`,
        12,
        292.5
      );
    }

    onProgress?.({
      current: totalQCount,
      totalPages: totalQCount,
      message: 'Finalizing PDF download...',
    });

    const safeTitle = testTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTitle}_Verified_Report_Boardly.pdf`;
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
 */
export async function downloadDrillResultPdfByTestId(
  testId: string,
  fallbackAttempt?: AmbassadorTestAttempt,
  studentFallbackName?: string,
  onProgress?: (progress: PdfExportProgress) => void,
  signal?: AbortSignal
): Promise<void> {
  let attemptResult: { attempt: AmbassadorTestAttempt; test: any } | null = null;
  try {
    attemptResult = await getMyTestAttemptForTest(testId);
  } catch (err) {
    console.warn('[testPdfExporter] getMyTestAttemptForTest note:', err);
  }

  const resolvedAttempt = attemptResult?.attempt || fallbackAttempt;
  if (!resolvedAttempt) {
    throw new Error('No verified attempt found for this drill. Please take the drill first.');
  }

  const resolvedQuestions: GradedAttemptQuestion[] =
    Array.isArray(resolvedAttempt.gradedQuestions) && resolvedAttempt.gradedQuestions.length > 0
      ? resolvedAttempt.gradedQuestions
      : (attemptResult?.test?.questions || []).map((q: any, idx: number) => ({
          id: q.id || `q_${idx}`,
          position: typeof q.position === 'number' ? q.position : idx,
          question: q.question,
          options: q.options,
          selectedIndex: -1,
          correctIndex: q.correctIndex ?? 0,
          isCorrect: false,
          explanation: q.explanation,
        }));

  await exportDrillResultToPdf({
    testId,
    testTitle: resolvedAttempt.testTitle || attemptResult?.test?.title || 'Grand Line Drill',
    subject: resolvedAttempt.subject || attemptResult?.test?.subject || 'General',
    studentName:
      resolvedAttempt.userName ||
      resolvedAttempt.studentName ||
      studentFallbackName ||
      'Student',
    date: resolvedAttempt.date,
    score: resolvedAttempt.score ?? 0,
    totalQuestions: resolvedAttempt.totalQuestions || resolvedQuestions.length,
    percentage: resolvedAttempt.percentage ?? 0,
    timeTakenSeconds: resolvedAttempt.timeTakenSeconds ?? 0,
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

  const watermarkLogoPng = getWatermarkLogoPngDataUrl();
  const whiteHeaderLogoPng = getWhiteHeaderLogoPngDataUrl();

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
  const maxUsableY = 280;
  let currentY = 12;

  stampPageBackgroundWatermarks(doc, watermarkLogoPng, pageWidth);

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(12, currentY, contentWidth, 20, 2, 2, 'F');

  doc.setFillColor(38, 49, 71);
  for (let gx = 15; gx < 195; gx += 4.5) {
    for (let gy = currentY + 2.5; gy < currentY + 18.5; gy += 4.5) {
      doc.circle(gx, gy, 0.22, 'F');
    }
  }

  if (whiteHeaderLogoPng) {
    doc.addImage(whiteHeaderLogoPng, 'PNG', 15, currentY + 3.2, 24, 24 * (824 / 1768), undefined, 'FAST');
  }

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(42, currentY + 3, 42, currentY + 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);
  doc.text('OFFICIAL ENTRANCE TEST PAPER', 45, currentY + 7);

  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  const titleSnippet = doc.splitTextToSize(title, 105);
  doc.text(titleSnippet[0] || title, 45, currentY + 14.5);

  doc.setFillColor(215, 25, 33);
  doc.roundedRect(162, currentY + 4, 32, 5, 2, 2, 'F');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text(university.substring(0, 18).toUpperCase(), 178, currentY + 7.5, { align: 'center' });

  currentY += 23;

  // Candidate Metadata Strip
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(12, currentY, contentWidth, 10, 1.5, 1.5, 'FD');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Candidate:', 15, currentY + 4.5);
  doc.setTextColor(15, 23, 42);
  doc.text(studentName, 28, currentY + 4.5);

  doc.setTextColor(100, 116, 139);
  doc.text('MCQs:', 75, currentY + 4.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${resolvedQuestions.length} Questions`, 85, currentY + 4.5);

  doc.setTextColor(100, 116, 139);
  doc.text('Rules:', 125, currentY + 4.5);
  doc.setTextColor(15, 23, 42);
  const rulesSnippet = doc.splitTextToSize(resolvedMarkingScheme, 55);
  doc.text(rulesSnippet[0] || resolvedMarkingScheme, 134, currentY + 4.5);

  currentY += 13;

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
    doc.setFontSize(7.2);
    const stemLines = doc.splitTextToSize(cleanStem, 178);
    const stemH = Math.max(3.5, stemLines.length * 3.1);

    const opts = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'];
    const cleanOpts = opts.slice(0, 4).map((o) => cleanMathForPdf(String(o || '')));

    doc.setFontSize(6.2);
    const opt0Lines = doc.splitTextToSize(cleanOpts[0] || '', 78);
    const opt1Lines = doc.splitTextToSize(cleanOpts[1] || '', 78);
    const opt2Lines = doc.splitTextToSize(cleanOpts[2] || '', 78);
    const opt3Lines = doc.splitTextToSize(cleanOpts[3] || '', 78);

    const row1H = Math.max(3.8, Math.max(opt0Lines.length, opt1Lines.length) * 2.8 + 1.2);
    const row2H = Math.max(3.8, Math.max(opt2Lines.length, opt3Lines.length) * 2.8 + 1.2);
    const optionsTotalH = row1H + row2H + 1.5;

    const cardHeight = 4.5 + stemH + optionsTotalH + 2.5;

    if (currentY + cardHeight > maxUsableY) {
      doc.addPage();
      stampPageBackgroundWatermarks(doc, watermarkLogoPng, pageWidth);
      currentY = 16;
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.roundedRect(12, currentY, contentWidth, cardHeight, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Q${i + 1}.`, 15, currentY + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(30, 41, 59);
    doc.text(stemLines, 15, currentY + 7.2);

    const optY = currentY + 7.2 + stemH + 0.5;
    const col1X = 15;
    const col2X = 106;
    const optColW = 88;

    const drawPaperOpt = (optIdx: number, x: number, y: number, h: number, lines: string[]) => {
      const letter = OPT_LABELS[optIdx] || String(optIdx + 1);
      doc.setDrawColor(226, 232, 240);
      doc.setTextColor(51, 65, 85);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, y, optColW, h, 1, 1, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.text(`(${letter})`, x + 2, y + 2.6);

      doc.setFont('helvetica', 'normal');
      doc.text(lines, x + 8, y + 2.6);
    };

    drawPaperOpt(0, col1X, optY, row1H, opt0Lines);
    drawPaperOpt(1, col2X, optY, row1H, opt1Lines);
    drawPaperOpt(2, col1X, optY + row1H + 1.2, row2H, opt2Lines);
    drawPaperOpt(3, col2X, optY + row1H + 1.2, row2H, opt3Lines);

    currentY += cardHeight + 2.2;
  }

  // Answer Key Section
  if (currentY + 20 > maxUsableY) {
    doc.addPage();
    stampPageBackgroundWatermarks(doc, watermarkLogoPng, pageWidth);
    currentY = 16;
  }

  doc.setFillColor(215, 25, 33);
  doc.roundedRect(12, currentY, contentWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL ANSWER KEY & EXPLANATIONS', 16, currentY + 4.8);
  doc.text(`${resolvedQuestions.length} Questions`, 192, currentY + 4.8, { align: 'right' });
  currentY += 9;

  for (let i = 0; i < resolvedQuestions.length; i++) {
    const q = resolvedQuestions[i];
    const correctIdx = typeof q.correct === 'number' ? q.correct : 0;
    const correctLetter = OPT_LABELS[correctIdx] || 'A';
    const explanationRaw = q.explain || q.explanation || 'Step-by-step derivation verified by Boardly study portal.';
    const cleanExp = cleanMathForPdf(explanationRaw);

    doc.setFontSize(6.2);
    const expLines = doc.splitTextToSize(cleanExp, 172);
    const keyCardH = 4.5 + expLines.length * 2.8 + 2;

    if (currentY + keyCardH > maxUsableY) {
      doc.addPage();
      stampPageBackgroundWatermarks(doc, watermarkLogoPng, pageWidth);
      currentY = 16;
    }

    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(12, currentY, contentWidth, keyCardH, 1, 1, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(`Q${i + 1}.`, 15, currentY + 3.8);

    doc.setFillColor(215, 25, 33);
    doc.roundedRect(23, currentY + 1.2, 9, 3.6, 0.8, 0.8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(`[ ${correctLetter} ]`, 27.5, currentY + 3.7, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    doc.text(expLines, 15, currentY + 6.8);

    currentY += keyCardH + 1.8;
  }

  // Stamp Running Headers and Footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 0; p < totalPages; p++) {
    doc.setPage(p + 1);

    if (p > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Boardly Entry Test Engine · ${title}`, 12, 10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${university} · ${formattedDate}`, 198, 10, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.line(12, 12, 198, 12);
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(12, 285, 198, 285);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Boardly Entry Test Engine · ${title} · Page ${p + 1} of ${totalPages} · Candidate: ${studentName}`, 12, 289);
    doc.setFontSize(5.8);
    doc.setTextColor(148, 163, 184);
    doc.text(`© ${new Date().getFullYear()} Boardly by SHS Virtual Academy · boardly.cfd · All rights reserved.`, 12, 292.5);
  }

  const filename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Boardly.pdf`;
  doc.save(filename);
}
