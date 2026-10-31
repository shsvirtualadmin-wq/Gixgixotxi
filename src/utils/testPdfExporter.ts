import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSectionCriteria, getUniversityRulesSummary } from '@/constants/universityCriteria';
import { formatSubjectName } from '@/constants/taxonomy';
import {
  getMyTestAttemptForTest,
  type AmbassadorTestAttempt,
  type GradedAttemptQuestion,
} from '@/services/ambassadorTestService';
import type { AttemptQuestion } from '@/types/index';
import { getBoardlyDottedLogoSvg } from './logoDottedSvg';

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
  onProgress?: (progress: PdfExportProgress) => void;
}

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function containsRtlText(str: string): boolean {
  if (!str) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str);
}

export function formatMathToHtml(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let text = raw.trim();

  // If text contains LaTeX commands without $ delimiters, wrap it
  if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\[') && /\\[a-zA-Z]+/.test(text)) {
    text = `$${text}$`;
  }

  const regex = /(?:\\\$)|(?:\$\$([\s\S]+?)\$\$)|(?:\\\[([\s\S]+?)\\\])|(?:\$([^$\n]+?)\$)|(?:\\\(([\s\S]+?)\\\))/g;
  let lastIndex = 0;
  let html = '';
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = regex.lastIndex;

    if (matchStart > lastIndex) {
      const segment = text.substring(lastIndex, matchStart).replace(/\\\$/g, '$');
      const escaped = escapeHtml(segment).replace(/\n/g, '<br/>');
      html += escaped
        .replace(/([A-Za-z0-9]+)\^([0-9+\-n]+)/g, '$1<sup>$2</sup>')
        .replace(/([A-Z][a-z]?)_([0-9]+)/g, '$1<sub>$2</sub>');
    }

    if (match[0] === '\\$') {
      html += '$';
    } else {
      const isDisplay = match[1] !== undefined || match[2] !== undefined;
      const formula = (match[1] ?? match[2] ?? match[3] ?? match[4]) || '';
      try {
        html += katex.renderToString(formula.trim(), {
          output: 'html',
          throwOnError: false,
          displayMode: isDisplay,
        });
      } catch {
        html += escapeHtml(formula);
      }
    }
    lastIndex = matchEnd;
  }

  if (lastIndex < text.length) {
    const remainder = text.substring(lastIndex).replace(/\\\$/g, '$');
    const escaped = escapeHtml(remainder).replace(/\n/g, '<br/>');
    html += escaped
      .replace(/([A-Za-z0-9]+)\^([0-9+\-n]+)/g, '$1<sup>$2</sup>')
      .replace(/([A-Z][a-z]?)_([0-9]+)/g, '$1<sub>$2</sub>');
  }

  return html;
}

/**
 * Checks whether a rendered canvas is completely blank (all pixels white or transparent).
 */
function isCanvasBlank(canvas: HTMLCanvasElement): boolean {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return true;
  try {
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 64;
    sampleCanvas.height = 64;
    const sCtx = sampleCanvas.getContext('2d');
    if (!sCtx) return false;

    sCtx.fillStyle = '#ffffff';
    sCtx.fillRect(0, 0, 64, 64);
    sCtx.drawImage(canvas, 0, 0, 64, 64);

    const imgData = sCtx.getImageData(0, 0, 64, 64);
    const d = imgData.data;

    let nonWhitePixels = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const a = d[i + 3];
      if (a > 30 && (r < 240 || g < 240 || b < 240)) {
        nonWhitePixels++;
        if (nonWhitePixels > 10) {
          return false;
        }
      }
    }
    return nonWhitePixels <= 10;
  } catch (err) {
    console.warn('[testPdfExporter] Canvas verification check exception:', err);
    return false;
  }
}

/**
 * Ensures all images and fonts inside a staging element are fully loaded before capturing
 */
async function waitForAssets(element: HTMLElement): Promise<void> {
  try {
    await document.fonts.ready;
  } catch (err) {
    console.warn('[testPdfExporter] document.fonts.ready warning:', err);
  }

  const imgs = Array.from(element.querySelectorAll('img'));
  if (imgs.length > 0) {
    await Promise.all(
      imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      })
    );
  }
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
 * Creates an isolated, visible off-screen staging host in the DOM.
 */
function createStagingHost(id: string): HTMLDivElement {
  const host = document.createElement('div');
  host.id = id;
  host.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 760px;
    z-index: -99999;
    pointer-events: none;
    opacity: 1;
    visibility: visible;
    background: #ffffff !important;
    color: #0f172a !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Noto Sans Arabic", "Urdu Typesetting", "Jameel Noori Nastaleeq", "Noto Nastaliq Urdu", sans-serif;
    font-size: 11px;
    line-height: 1.4;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    text-align: left;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  `;
  document.body.appendChild(host);
  return host;
}

/**
 * Generates the vector watermark background for each page:
 * 1. Centered large black dotted Boardly logo at 8% opacity
 * 2. Very faint repeating diagonal watermark text "Boardly · boardly.cfd"
 */
function getWatermarkOverlayHtml(): string {
  return `
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; overflow: hidden;">
      <!-- Large Centered Black Dotted Boardly Logo (8% opacity) -->
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 560px; max-width: 82%; opacity: 0.08;">
        ${getBoardlyDottedLogoSvg('#000000', 1)}
      </div>
      <!-- Very Faint Repeating Diagonal Watermark: Boardly · boardly.cfd -->
      <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.035;" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="boardly-diag-wm" width="220" height="110" patternUnits="userSpaceOnUse" patternTransform="rotate(-26)">
            <text x="15" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#000000">
              Boardly · boardly.cfd
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#boardly-diag-wm)" />
      </svg>
    </div>
  `;
}

/**
 * Creates a discrete page container with watermark background and structured content wrapper
 */
function createPageContainer(pageIndex: number): { container: HTMLDivElement; content: HTMLDivElement } {
  const container = document.createElement('div');
  container.className = `pdf-page-container pdf-page-${pageIndex}`;
  container.style.cssText = `
    position: relative;
    width: 760px;
    min-height: 80px;
    background: #ffffff !important;
    color: #0f172a !important;
    padding: 10px 14px 14px 14px;
    box-sizing: border-box;
    margin-bottom: 24px;
    overflow: hidden;
  `;

  // Watermark layer
  const watermarkDiv = document.createElement('div');
  watermarkDiv.innerHTML = getWatermarkOverlayHtml();
  container.appendChild(watermarkDiv);

  // Foreground content wrapper
  const content = document.createElement('div');
  content.className = 'pdf-page-content';
  content.style.cssText = `
    position: relative;
    z-index: 1;
    width: 100%;
  `;
  container.appendChild(content);

  return { container, content };
}

/**
 * Redesigned Grand Line Verified Drill Report PDF exporter:
 * - Part 1: Black dotted logo background watermark (8% opacity), white dotted logo in page 1 dark banner
 *   with dot-grid texture. Removed old faded logo from top-left.
 * - Part 2: Fixed UNANSWERED badge clipping. Packed tightly targeting ~8 to 10 pages for 83 questions.
 *   Page 1 dark banner, summary strip with accuracy bar, subject-wise breakdown table, compact 2x2 cards.
 *   Slim running header on pages 2+.
 * - Part 3: Running footer with page X of Y, full copyright, student traceability, bottom-of-last-page notice,
 *   and jsPDF document metadata.
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
    onProgress,
  } = options;

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

  const OPT_LABELS = ['A', 'B', 'C', 'D'];
  const mins = Math.floor(Math.max(0, timeTakenSeconds || 0) / 60);
  const secs = Math.max(0, Math.round(timeTakenSeconds || 0)) % 60;
  const formattedTime = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  // Compute stats
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  // Group by subjects for Subject-Wise Breakdown Table
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

    // Determine subject name
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

  // Determine mode pill label
  const isFullMock =
    /mock|mdcat|nums|etea|ecat/i.test(testTitle) || totalQuestions >= 60;
  const modePillText = isFullMock ? 'Full Mock' : 'Chapter Drill';

  // Step 1: Create visible off-screen staging host in DOM
  const stagingHost = createStagingHost('boardly-drill-result-staging');

  try {
    onProgress?.({
      current: 0,
      totalPages: 1,
      message: 'Preparing document layout and typography...',
    });

    const pageContainers: HTMLDivElement[] = [];
    const pageContents: HTMLDivElement[] = [];

    // Initialize Page 1
    const p1 = createPageContainer(1);
    stagingHost.appendChild(p1.container);
    pageContainers.push(p1.container);
    pageContents.push(p1.content);

    // ==========================================
    // Page 1 Header Banner (Dark + Dot Grid + White Dotted Logo)
    // ==========================================
    const headerBanner = document.createElement('div');
    headerBanner.style.cssText = `
      position: relative;
      background-color: #0f172a !important;
      background-image: radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px) !important;
      background-size: 10px 10px !important;
      color: #ffffff !important;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 8px;
      box-sizing: border-box;
      border: 1px solid rgba(255,255,255,0.1);
    `;
    headerBanner.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.18); padding-bottom: 8px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <!-- White Dotted Boardly Logo -->
          <div style="width: 110px; height: auto;">
            ${getBoardlyDottedLogoSvg('#ffffff', 1)}
          </div>
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.85); border-left: 1px solid rgba(255,255,255,0.25); padding-left: 10px;">
            GRAND LINE VERIFIED DRILL REPORT
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 9px; font-weight: 700; color: #ffffff; background: #D71921; padding: 2.5px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em;">
            ${escapeHtml(modePillText)}
          </span>
          <span style="font-size: 9px; font-family: monospace; color: #cbd5e1; background: rgba(255,255,255,0.14); padding: 2.5px 8px; border-radius: 999px;">
            ${escapeHtml(formatSubjectName(subject || 'General'))}
          </span>
        </div>
      </div>
      <div style="font-size: 15px; font-weight: 800; letter-spacing: -0.01em; color: #ffffff; line-height: 1.2;">
        ${escapeHtml(testTitle)}
      </div>
    `;
    p1.content.appendChild(headerBanner);

    // ==========================================
    // Page 1 Summary Strip + Accuracy Bar
    // ==========================================
    const summaryStrip = document.createElement('div');
    summaryStrip.style.cssText = `
      background: #f8fafc !important;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
      box-sizing: border-box;
      color: #0f172a !important;
    `;

    summaryStrip.innerHTML = `
      <div style="display: grid; grid-template-columns: 1.4fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr 1fr; gap: 6px; font-size: 10px; align-items: center; margin-bottom: 6px;">
        <div>
          <span style="color: #64748b; font-weight: 600;">Student:</span>
          <strong style="color: #0f172a; margin-left: 3px; font-size: 10.5px;">${escapeHtml(studentName)}</strong>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">Score:</span>
          <strong style="color: #0f172a; margin-left: 3px; font-size: 10.5px;">${score} / ${totalQuestions} (${percentage}%)</strong>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">Correct:</span>
          <strong style="color: #15803d; margin-left: 3px;">${correctCount}</strong>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">Wrong:</span>
          <strong style="color: #dc2626; margin-left: 3px;">${wrongCount}</strong>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">Skipped:</span>
          <strong style="color: #475569; margin-left: 3px;">${skippedCount}</strong>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">Time:</span>
          <strong style="color: #0f172a; margin-left: 3px;">${escapeHtml(formattedTime)}</strong>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">Date:</span>
          <strong style="color: #0f172a; margin-left: 3px;">${escapeHtml(formattedDate)}</strong>
        </div>
      </div>
      <!-- Segmented Accuracy Progress Bar -->
      <div style="display: flex; flex-direction: column; gap: 3px;">
        <div style="width: 100%; height: 5px; background: #e2e8f0; border-radius: 999px; overflow: hidden; display: flex;">
          <div style="width: ${correctPct}%; height: 100%; background: #15803d;" title="Correct: ${correctPct}%"></div>
          <div style="width: ${wrongPct}%; height: 100%; background: #dc2626;" title="Wrong: ${wrongPct}%"></div>
          <div style="width: ${skippedPct}%; height: 100%; background: #94a3b8;" title="Skipped: ${skippedPct}%"></div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; font-size: 8.5px; color: #64748b;">
          <span><span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #15803d; margin-right: 3px;"></span>Correct: ${correctPct}%</span>
          <span><span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #dc2626; margin-right: 3px;"></span>Wrong: ${wrongPct}%</span>
          <span><span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #94a3b8; margin-right: 3px;"></span>Skipped: ${skippedPct}%</span>
        </div>
      </div>
    `;
    p1.content.appendChild(summaryStrip);

    // ==========================================
    // Page 1 Subject-Wise Breakdown Table
    // ==========================================
    const breakdownTable = document.createElement('div');
    breakdownTable.style.cssText = `
      background: #ffffff !important;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 8px;
      box-sizing: border-box;
    `;

    const subjectRows = Object.entries(subjectGroups).map(([subName, stats]) => {
      const subAcc = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      return `
        <tr style="border-bottom: 1px solid #f1f5f9; font-size: 9.5px; color: #1e293b;">
          <td style="padding: 3px 8px; font-weight: 600;">${escapeHtml(subName)}</td>
          <td style="padding: 3px 8px; text-align: center; color: #475569;">${stats.total}</td>
          <td style="padding: 3px 8px; text-align: center; font-weight: 700; color: #15803d;">${stats.correct}</td>
          <td style="padding: 3px 8px; text-align: center; font-weight: 700; color: #dc2626;">${stats.wrong}</td>
          <td style="padding: 3px 8px; text-align: center; color: #64748b;">${stats.skipped}</td>
          <td style="padding: 3px 8px; text-align: right; font-weight: 700; color: #0f172a;">${subAcc}%</td>
        </tr>
      `;
    }).join('');

    breakdownTable.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; color: #475569;">
            <th style="padding: 4px 8px; font-weight: 700;">Subject Area</th>
            <th style="padding: 4px 8px; text-align: center; font-weight: 700;">MCQs</th>
            <th style="padding: 4px 8px; text-align: center; font-weight: 700;">Correct</th>
            <th style="padding: 4px 8px; text-align: center; font-weight: 700;">Wrong</th>
            <th style="padding: 4px 8px; text-align: center; font-weight: 700;">Skipped</th>
            <th style="padding: 4px 8px; text-align: right; font-weight: 700;">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          ${subjectRows}
        </tbody>
      </table>
    `;
    p1.content.appendChild(breakdownTable);

    // ==========================================
    // Compact Question Cards Layout & Tight Packing
    // ==========================================
    // Target ~8 to 10 pages for 83 questions:
    // With 760px container width:
    // Page 1 budget: ~1010px. (Header banner ~80px + Summary ~50px + Table ~55px + padding = ~220px, leaves ~790px for ~7-8 questions)
    // Subsequent pages budget: ~1025px (leaves ~990px for ~9-10 questions)
    const MAX_PAGE_1_HEIGHT = 1010;
    const MAX_SUBSEQUENT_PAGE_HEIGHT = 1025;

    let currentContainer = p1.container;
    let currentContent = p1.content;

    const createNextPage = () => {
      const nextIdx = pageContainers.length + 1;
      const nextP = createPageContainer(nextIdx);
      stagingHost.appendChild(nextP.container);
      pageContainers.push(nextP.container);
      pageContents.push(nextP.content);

      // Add slim running header on Page 2+
      const runningHeader = document.createElement('div');
      runningHeader.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 4px;
        margin-bottom: 6px;
        font-size: 8.5px;
        color: #64748b;
        font-weight: 600;
      `;
      runningHeader.innerHTML = `
        <span style="color: #0f172a; font-weight: 700;">
          Boardly Grand Line Verified Drill Report &middot; ${escapeHtml(testTitle)}
        </span>
        <span>${escapeHtml(formatSubjectName(subject || 'General'))} &middot; ${escapeHtml(formattedDate)}</span>
      `;
      nextP.content.appendChild(runningHeader);

      currentContainer = nextP.container;
      currentContent = nextP.content;
      return nextP;
    };

    gradedQuestions.forEach((q, idx) => {
      const stemHtml = formatMathToHtml(q.question || '');
      const isRtl = containsRtlText(q.question || '');
      const selectedIdx = typeof q.selectedIndex === 'number' ? q.selectedIndex : -1;
      const correctIdx = typeof q.correctIndex === 'number' ? q.correctIndex : 0;
      const isCorrect = q.isCorrect ?? (selectedIdx === correctIdx);

      // Unclipped Status Badges: inline-flex, center alignment, line-height: 1
      const statusLabel = selectedIdx < 0 ? 'UNANSWERED' : isCorrect ? 'CORRECT' : 'WRONG';
      const statusBg = selectedIdx < 0 ? '#475569' : isCorrect ? '#15803d' : '#dc2626';

      const opts = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'];
      const selectedLetter = selectedIdx >= 0 ? OPT_LABELS[selectedIdx] || String(selectedIdx + 1) : 'Skipped';
      const correctLetter = OPT_LABELS[correctIdx] || 'A';
      const explainHtml = formatMathToHtml(
        q.explanation || 'Step-by-step derivation verified by Boardly Grand Line.'
      );

      const qCard = document.createElement('div');
      qCard.className = 'pdf-question-item';
      qCard.style.cssText = `
        padding: 5px 8px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.97) !important;
        margin-bottom: 5px;
        box-sizing: border-box;
        page-break-inside: avoid;
        break-inside: avoid;
      `;

      qCard.innerHTML = `
        <!-- Question Header Row -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-weight: 800; font-size: 11px; color: #0f172a;">Q${idx + 1}.</span>
          </div>
          <!-- Fully unclipped status badge -->
          <span style="display: inline-flex; align-items: center; justify-content: center; line-height: 1; padding: 2.5px 7px; font-size: 8px; font-weight: 700; color: #ffffff; background: ${statusBg}; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.04em;">
            ${statusLabel}
          </span>
        </div>

        <!-- Question Stem Text -->
        <div dir="${isRtl ? 'rtl' : 'auto'}" style="font-size: 10px; color: #1e293b; line-height: 1.35; margin-bottom: 4px; white-space: pre-line; word-break: break-word;">
          ${stemHtml}
        </div>

        <!-- Compact 2x2 Options Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 3px;">
          ${opts
            .slice(0, 4)
            .map((opt, optIdx) => {
              const letter = OPT_LABELS[optIdx] || String(optIdx + 1);
              const optHtml = formatMathToHtml(String(opt || ''));
              const isOptCorrect = optIdx === correctIdx;
              const isOptSelected = optIdx === selectedIdx;
              const borderCol = isOptCorrect ? '#10b981' : isOptSelected ? '#ef4444' : '#e2e8f0';
              const bgCol = isOptCorrect ? '#ecfdf5' : isOptSelected ? '#fef2f2' : '#f8fafc';
              const textCol = isOptCorrect ? '#065f46' : isOptSelected ? '#991b1b' : '#334155';
              return `
                <div style="padding: 2.5px 6px; background: ${bgCol} !important; border: 1px solid ${borderCol}; border-radius: 4px; font-size: 9px; line-height: 1.25; color: ${textCol} !important; display: flex; align-items: flex-start; gap: 4px; box-sizing: border-box;">
                  <span style="font-weight: 700; color: #0f172a; shrink: 0;">(${letter})</span>
                  <span style="flex: 1; word-break: break-word;">${optHtml}</span>
                </div>
              `;
            })
            .join('')}
        </div>

        <!-- Answer Comparison Strip -->
        <div style="display: flex; align-items: center; gap: 12px; font-size: 9px; color: #475569; margin-bottom: 2px;">
          <span>
            <strong>Your Answer:</strong>
            <span style="font-weight: 700; color: ${selectedIdx < 0 ? '#64748b' : isCorrect ? '#15803d' : '#dc2626'}; margin-left: 3px;">
              [ ${escapeHtml(selectedLetter)} ]
            </span>
          </span>
          <span>
            <strong>Correct Answer:</strong>
            <span style="font-weight: 700; color: #15803d; margin-left: 3px;">
              [ ${escapeHtml(correctLetter)} ]
            </span>
          </span>
        </div>

        <!-- Short Explanation -->
        <div dir="auto" style="font-size: 8.5px; color: #475569; line-height: 1.3; background: #f8fafc; border-left: 2.5px solid #cbd5e1; padding: 2px 6px; border-radius: 0 4px 4px 0; margin-top: 2px; white-space: pre-line; word-break: break-word;">
          <strong style="color: #0f172a;">Explanation:</strong> ${explainHtml}
        </div>
      `;

      currentContent.appendChild(qCard);

      const maxLimit = pageContainers.length === 1 ? MAX_PAGE_1_HEIGHT : MAX_SUBSEQUENT_PAGE_HEIGHT;
      const questionsOnCurrentPage = currentContent.querySelectorAll('.pdf-question-item').length;

      // If adding this card overflows the page budget AND there is at least one question already:
      // move it neatly to a fresh page!
      if (currentContainer.offsetHeight > maxLimit && questionsOnCurrentPage > 1) {
        currentContent.removeChild(qCard);
        createNextPage();
        currentContent.appendChild(qCard);
      }
    });

    // ==========================================
    // Copyright Notice Block on Final Page
    // ==========================================
    const copyrightBlock = document.createElement('div');
    copyrightBlock.style.cssText = `
      margin-top: 8px;
      padding: 6px 10px;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 8px;
      color: #64748b;
      line-height: 1.35;
      box-sizing: border-box;
      page-break-inside: avoid;
      break-inside: avoid;
    `;
    copyrightBlock.innerHTML = `
      <div style="font-weight: 800; color: #0f172a; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.04em;">
        VERIFIED ACADEMIC DRILL REPORT &middot; BOARDLY GRAND LINE
      </div>
      <div>
        &copy; ${new Date().getFullYear()} Boardly by SHS Virtual Academy (boardly.cfd). All rights reserved.
        This verified report was generated exclusively for the candidate <strong>${escapeHtml(studentName)}</strong> on ${escapeHtml(formattedDate)}.
        For personal study use only. Commercial distribution, scraping, or redistribution without permission is strictly prohibited.
      </div>
    `;

    // Check if appending copyright block fits on current page or needs a clean page
    currentContent.appendChild(copyrightBlock);
    const maxLimitForLast = pageContainers.length === 1 ? MAX_PAGE_1_HEIGHT : MAX_SUBSEQUENT_PAGE_HEIGHT;
    if (currentContainer.offsetHeight > maxLimitForLast && currentContent.querySelectorAll('.pdf-question-item').length > 1) {
      currentContent.removeChild(copyrightBlock);
      createNextPage();
      currentContent.appendChild(copyrightBlock);
    }

    const totalPages = pageContainers.length;

    console.log('[testPdfExporter] Drill Result PDF Layout Diagnostics:', {
      testTitle,
      subject,
      studentName,
      totalQuestions: gradedQuestions.length,
      totalPagesCalculated: totalPages,
      stagingHostVisible: stagingHost.offsetWidth > 0 && stagingHost.offsetHeight > 0,
      stagingHostWidth: stagingHost.offsetWidth,
      stagingHostHeight: stagingHost.offsetHeight,
    });

    // Step 2: Wait for KaTeX math and fonts
    await waitForAssets(stagingHost);

    // Step 3: Initialize jsPDF document (A4 portrait)
    const pdfDoc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Set PDF document metadata
    pdfDoc.setDocumentProperties({
      title: `Grand Line Verified Drill Report - ${testTitle}`,
      subject: `Verified Drill Report for ${studentName}`,
      author: 'Boardly by SHS Virtual Academy',
      keywords: 'Boardly, Grand Line, FSC, MDCAT, MCQs, Verified Drill Report',
      creator: 'Boardly (boardly.cfd)',
    });

    const pageWidth = pdfDoc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdfDoc.internal.pageSize.getHeight(); // 297mm

    // Step 4: Render each page individually via html2canvas
    for (let p = 0; p < totalPages; p++) {
      const pageDiv = pageContainers[p];

      onProgress?.({
        current: p + 1,
        totalPages,
        message: `Generating page ${p + 1} of ${totalPages}...`,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const canvas = await html2canvas(pageDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 760,
      });

      if (isCanvasBlank(canvas)) {
        console.error(`[testPdfExporter] Warning: Canvas rendered blank on page ${p + 1}!`);
        throw new Error(
          `PDF generation failed on page ${p + 1}: Render canvas was blank. Please retry.`
        );
      }

      if (p > 0) {
        pdfDoc.addPage();
      }

      const contentHeightMm = (pageDiv.offsetHeight * 190) / 760;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Add the page image (top margin 10mm, left margin 10mm)
      pdfDoc.addImage(imgData, 'JPEG', 10, 10, 190, contentHeightMm, undefined, 'FAST');

      // Top running header line in jsPDF for pages 2+
      if (p > 0) {
        pdfDoc.setFontSize(7);
        pdfDoc.setTextColor(140, 140, 140);
        pdfDoc.setFont('helvetica', 'normal');
        pdfDoc.text(
          `Boardly Grand Line · ${testTitle}`,
          pageWidth - 10,
          7,
          { align: 'right' }
        );
      }

      // Bottom Running Footer on EVERY page: Dividing line + Page X of Y + Copyright + Traceability
      pdfDoc.setDrawColor(220, 220, 220);
      pdfDoc.line(10, pageHeight - 11, pageWidth - 10, pageHeight - 11);

      pdfDoc.setFontSize(7.5);
      pdfDoc.setTextColor(90, 100, 115);
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.text(
        `Boardly Grand Line · ${testTitle} · Page ${p + 1} of ${totalPages} · Student: ${studentName} · Generated: ${formattedDate}`,
        10,
        pageHeight - 7
      );

      pdfDoc.setFontSize(6.5);
      pdfDoc.setTextColor(140, 140, 140);
      pdfDoc.text(
        `© ${new Date().getFullYear()} Boardly by SHS Virtual Academy · boardly.cfd · For personal study use only.`,
        10,
        pageHeight - 3.5
      );
    }

    onProgress?.({
      current: totalPages,
      totalPages,
      message: 'Finalizing PDF download...',
    });

    const safeTitle = testTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTitle}_Verified_Report_Boardly.pdf`;
    pdfDoc.save(filename);
  } finally {
    if (stagingHost.parentNode) {
      stagingHost.parentNode.removeChild(stagingHost);
    }
  }
}

/**
 * Exports a full Practice Test paper with questions and an official answer key appendix.
 */
export async function exportTestToPdf(options: ExportPdfOptions): Promise<void> {
  const {
    title,
    university = 'General Entrance Drill',
    markingScheme,
    studentName = 'Candidate',
    studentEmail = '',
    questions,
    onProgress,
  } = options;

  if (!questions || questions.length === 0) {
    throw new Error('No questions available in this test to export.');
  }

  const resolvedMarkingScheme = markingScheme || getUniversityRulesSummary(university);
  const resolvedQuestions = await resolveQuestionKeys(questions);
  const OPT_LABELS = ['A', 'B', 'C', 'D'];
  const formattedDate = new Date().toLocaleDateString('en-GB');

  const stagingHost = createStagingHost('boardly-practice-test-staging');

  try {
    onProgress?.({
      current: 0,
      totalPages: 1,
      message: 'Formatting test paper layout...',
    });

    const pageContainers: HTMLDivElement[] = [];
    const pageContents: HTMLDivElement[] = [];

    // Page 1
    const p1 = createPageContainer(1);
    stagingHost.appendChild(p1.container);
    pageContainers.push(p1.container);
    pageContents.push(p1.content);

    // Header Banner
    const headerBanner = document.createElement('div');
    headerBanner.style.cssText = `
      position: relative;
      background-color: #0f172a !important;
      background-image: radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px) !important;
      background-size: 10px 10px !important;
      color: #ffffff !important;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 8px;
      box-sizing: border-box;
      border: 1px solid rgba(255,255,255,0.1);
    `;
    headerBanner.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.18); padding-bottom: 8px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 110px; height: auto;">
            ${getBoardlyDottedLogoSvg('#ffffff', 1)}
          </div>
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.85); border-left: 1px solid rgba(255,255,255,0.25); padding-left: 10px;">
            OFFICIAL ENTRANCE TEST PAPER
          </span>
        </div>
        <span style="font-size: 9px; font-family: monospace; color: #cbd5e1; background: rgba(255,255,255,0.14); padding: 2.5px 8px; border-radius: 999px;">
          ${escapeHtml(university)}
        </span>
      </div>
      <div style="font-size: 15px; font-weight: 800; letter-spacing: -0.01em; color: #ffffff; margin-bottom: 2px;">
        ${escapeHtml(title)}
      </div>
      <div style="font-size: 9.5px; color: #94a3b8; font-weight: 500;">
        <strong style="color: #f1f5f9;">Rules:</strong> ${escapeHtml(resolvedMarkingScheme)}
      </div>
    `;
    p1.content.appendChild(headerBanner);

    // Candidate Metadata Card
    const metaCard = document.createElement('div');
    metaCard.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
      font-size: 10px;
      box-sizing: border-box;
      color: #0f172a !important;
    `;
    metaCard.innerHTML = `
      <div>
        <span style="color: #64748b; font-weight: 600;">Candidate:</span>
        <strong style="color: #0f172a; margin-left: 3px;">${escapeHtml(studentName)}</strong>
        ${studentEmail ? `<span style="color: #94a3b8; margin-left: 3px;">(${escapeHtml(studentEmail)})</span>` : ''}
      </div>
      <div>
        <span style="color: #64748b; font-weight: 600;">MCQs:</span>
        <strong style="color: #0f172a; margin-left: 3px;">${resolvedQuestions.length} Questions</strong>
      </div>
      <div>
        <span style="color: #64748b; font-weight: 600;">Time:</span>
        <strong style="color: #0f172a; margin-left: 3px;">${resolvedQuestions.length} Mins</strong>
      </div>
      <div>
        <span style="color: #64748b; font-weight: 600;">Date:</span>
        <strong style="color: #0f172a; margin-left: 3px;">${escapeHtml(formattedDate)}</strong>
      </div>
    `;
    p1.content.appendChild(metaCard);

    const MAX_PAGE_1_HEIGHT = 1010;
    const MAX_SUBSEQUENT_PAGE_HEIGHT = 1025;
    let currentContainer = p1.container;
    let currentContent = p1.content;

    const createNextTestPage = () => {
      const nextIdx = pageContainers.length + 1;
      const nextP = createPageContainer(nextIdx);
      stagingHost.appendChild(nextP.container);
      pageContainers.push(nextP.container);
      pageContents.push(nextP.content);

      const runningHeader = document.createElement('div');
      runningHeader.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 4px;
        margin-bottom: 6px;
        font-size: 8.5px;
        color: #64748b;
        font-weight: 600;
      `;
      runningHeader.innerHTML = `
        <span style="color: #0f172a; font-weight: 700;">
          Boardly Official Test Paper &middot; ${escapeHtml(title)}
        </span>
        <span>${escapeHtml(university)} &middot; ${escapeHtml(formattedDate)}</span>
      `;
      nextP.content.appendChild(runningHeader);

      currentContainer = nextP.container;
      currentContent = nextP.content;
      return nextP;
    };

    // Questions
    resolvedQuestions.forEach((q, idx) => {
      const stemRaw = q.stem || q.q || 'Question content';
      const stemHtml = formatMathToHtml(stemRaw);
      const isRtl = containsRtlText(stemRaw);
      const subSlug = q.subject || 'general';
      const subName = formatSubjectName(subSlug);
      const secCriteria = getSectionCriteria(university, subSlug);
      const badgeLabel = secCriteria?.badgeLabel || '+1.0 / 0.0';
      const opts = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'];

      const qCard = document.createElement('div');
      qCard.className = 'pdf-question-item';
      qCard.style.cssText = `
        padding: 6px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.97) !important;
        margin-bottom: 6px;
        box-sizing: border-box;
      `;

      qCard.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-weight: 800; font-size: 11px; color: #0f172a;">Q${idx + 1}.</span>
            <span style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #475569; background: #f1f5f9 !important; padding: 1.5px 6px; border-radius: 999px; border: 1px solid #e2e8f0;">
              ${escapeHtml(subName)}
            </span>
          </div>
          <span style="font-size: 8.5px; font-family: monospace; font-weight: 700; color: #64748b; background: #f8fafc !important; padding: 1px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
            ${escapeHtml(badgeLabel)}
          </span>
        </div>
        <div dir="${isRtl ? 'rtl' : 'auto'}" style="font-size: 10px; color: #1e293b; line-height: 1.35; margin-bottom: 4px; white-space: pre-line; word-break: break-word;">
          ${stemHtml}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
          ${opts.slice(0, 4).map((opt, optIdx) => {
            const letter = OPT_LABELS[optIdx] || String(optIdx + 1);
            const optHtml = formatMathToHtml(String(opt || ''));
            return `
              <div style="padding: 2.5px 6px; background: #f8fafc !important; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 9px; line-height: 1.25; color: #334155 !important; display: flex; align-items: flex-start; gap: 4px; box-sizing: border-box;">
                <span style="font-weight: 700; color: #0f172a; shrink: 0;">(${letter})</span>
                <span style="flex: 1; word-break: break-word;">${optHtml}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;

      currentContent.appendChild(qCard);

      const maxLimit = pageContainers.length === 1 ? MAX_PAGE_1_HEIGHT : MAX_SUBSEQUENT_PAGE_HEIGHT;
      const questionCountOnCurrentPage = currentContent.querySelectorAll('.pdf-question-item').length;

      if (currentContainer.offsetHeight > maxLimit && questionCountOnCurrentPage > 1) {
        currentContent.removeChild(qCard);
        createNextTestPage();
        currentContent.appendChild(qCard);
      }
    });

    // Answer Key Appendix
    const appendixHeader = document.createElement('div');
    appendixHeader.className = 'pdf-appendix-header';
    appendixHeader.style.cssText = `
      margin-top: 10px;
      margin-bottom: 8px;
      padding: 6px 12px;
      background: #D71921 !important;
      color: #ffffff !important;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
    `;
    appendixHeader.innerHTML = `
      <span style="font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
        OFFICIAL ANSWER KEY &amp; EXPLANATIONS
      </span>
      <span style="font-size: 9px; font-family: monospace; background: rgba(0,0,0,0.25); padding: 1.5px 6px; border-radius: 999px;">
        ${resolvedQuestions.length} Questions
      </span>
    `;

    currentContent.appendChild(appendixHeader);
    if (currentContainer.offsetHeight > MAX_SUBSEQUENT_PAGE_HEIGHT && currentContent.querySelectorAll('.pdf-question-item').length > 0) {
      currentContent.removeChild(appendixHeader);
      createNextTestPage();
      currentContent.appendChild(appendixHeader);
    }

    resolvedQuestions.forEach((q, idx) => {
      const correctIdx = typeof q.correct === 'number' ? q.correct : 0;
      const correctLetter = OPT_LABELS[correctIdx] || 'A';
      const options = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'];
      const correctOptionRaw = options[correctIdx] || '';
      const correctOptionHtml = formatMathToHtml(String(correctOptionRaw));
      const explanationRaw = q.explain || q.explanation || 'Step-by-step derivation verified by Boardly study portal.';
      const explanationHtml = formatMathToHtml(explanationRaw);

      const keyCard = document.createElement('div');
      keyCard.className = 'pdf-answer-key-item';
      keyCard.style.cssText = `
        padding: 5px 8px;
        background: #f8fafc !important;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-bottom: 5px;
        box-sizing: border-box;
      `;
      keyCard.innerHTML = `
        <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 2px;">
          <strong style="color: #0f172a; font-size: 10px;">Q${idx + 1}.</strong>
          <span style="display: inline-block; background: #D71921 !important; color: #ffffff !important; font-weight: 800; font-family: monospace; font-size: 9px; padding: 1px 6px; border-radius: 4px;">
            [ ${correctLetter} ]
          </span>
          <span style="font-size: 9.5px; color: #334155; word-break: break-word;">
            ${correctOptionHtml}
          </span>
        </div>
        <div dir="auto" style="font-size: 8.5px; color: #475569; line-height: 1.35; border-top: 1px dashed #cbd5e1; padding-top: 2px; margin-top: 2px; white-space: pre-line; word-break: break-word;">
          <strong style="color: #0f172a;">Explanation:</strong> ${explanationHtml}
        </div>
      `;

      currentContent.appendChild(keyCard);

      const itemsOnPage = currentContent.querySelectorAll('.pdf-question-item, .pdf-answer-key-item').length;
      if (currentContainer.offsetHeight > MAX_SUBSEQUENT_PAGE_HEIGHT && itemsOnPage > 1) {
        currentContent.removeChild(keyCard);
        createNextTestPage();
        currentContent.appendChild(keyCard);
      }
    });

    const totalPages = pageContainers.length;

    console.log('[testPdfExporter] Practice Test PDF Layout Diagnostics:', {
      title,
      university,
      totalQuestions: resolvedQuestions.length,
      totalPagesCalculated: totalPages,
      stagingHostVisible: stagingHost.offsetWidth > 0 && stagingHost.offsetHeight > 0,
    });

    await waitForAssets(stagingHost);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    pdf.setDocumentProperties({
      title: `Boardly Entry Test Paper - ${title}`,
      subject: `Official Test Paper for ${studentName}`,
      author: 'Boardly by SHS Virtual Academy',
      keywords: 'Boardly, Practice Test, Entry Test, MCQs',
      creator: 'Boardly (boardly.cfd)',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let p = 0; p < totalPages; p++) {
      const pageDiv = pageContainers[p];

      onProgress?.({
        current: p + 1,
        totalPages,
        message: `Rendering page ${p + 1} of ${totalPages}...`,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const canvas = await html2canvas(pageDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 760,
      });

      if (isCanvasBlank(canvas)) {
        console.error(`[testPdfExporter] Blank canvas detected on page ${p + 1}!`);
        throw new Error(
          `PDF generation failed on page ${p + 1}: Render canvas was blank. Please retry.`
        );
      }

      if (p > 0) {
        pdf.addPage();
      }

      const contentHeightMm = (pageDiv.offsetHeight * 190) / 760;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      pdf.addImage(imgData, 'JPEG', 10, 10, 190, contentHeightMm, undefined, 'FAST');

      if (p > 0) {
        pdf.setFontSize(7);
        pdf.setTextColor(140, 140, 140);
        pdf.setFont('helvetica', 'normal');
        pdf.text(title, pageWidth - 10, 7, { align: 'right' });
      }

      pdf.setDrawColor(220, 220, 220);
      pdf.line(10, pageHeight - 11, pageWidth - 10, pageHeight - 11);

      pdf.setFontSize(7.5);
      pdf.setTextColor(90, 100, 115);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Boardly Entry Test Engine · ${title} · Page ${p + 1} of ${totalPages} · Candidate: ${studentName}`,
        10,
        pageHeight - 7
      );

      pdf.setFontSize(6.5);
      pdf.setTextColor(140, 140, 140);
      pdf.text(
        `© ${new Date().getFullYear()} Boardly by SHS Virtual Academy · boardly.cfd · All rights reserved.`,
        10,
        pageHeight - 3.5
      );
    }

    onProgress?.({
      current: totalPages,
      totalPages,
      message: 'Downloading test PDF...',
    });

    const filename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Boardly.pdf`;
    pdf.save(filename);
  } finally {
    if (stagingHost.parentNode) {
      stagingHost.parentNode.removeChild(stagingHost);
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
  onProgress?: (progress: PdfExportProgress) => void
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
    onProgress,
  });
}
