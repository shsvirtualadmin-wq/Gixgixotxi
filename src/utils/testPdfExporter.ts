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

let cachedLogoDataUrl: string | null = null;

async function getLogoDataUrl(): Promise<string> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const res = await fetch('/logo.png');
    if (!res.ok) throw new Error('Logo fetch failed');
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        cachedLogoDataUrl = result;
        resolve(result);
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('[testPdfExporter] Could not load logo.png Data URL:', err);
    return '';
  }
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

  // If text contains LaTeX commands (\frac, \sqrt, \overline, \pi, etc.) without $ delimiters,
  // wrap it with $ so the tokenizer processes it cleanly as LaTeX math
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
 * Uses a small 64x64 downscaled sampling canvas for sub-millisecond verification.
 */
function isCanvasBlank(canvas: HTMLCanvasElement): boolean {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return true;
  try {
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 64;
    sampleCanvas.height = 64;
    const sCtx = sampleCanvas.getContext('2d');
    if (!sCtx) return false;

    // Draw the full canvas downscaled to 64x64
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
      // Count pixels that are visibly non-white and non-transparent
      if (a > 30 && (r < 240 || g < 240 || b < 240)) {
        nonWhitePixels++;
        if (nonWhitePixels > 10) {
          return false; // Contains genuine text / graphics!
        }
      }
    }
    return nonWhitePixels <= 10;
  } catch (err) {
    console.warn('[testPdfExporter] Canvas verification check exception (allowing render):', err);
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

    // If options were shuffled, map the original correct index to the shuffled position
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
 * By placing it at top: 0, left: 0 with z-index: -99999 and pointer-events: none,
 * the browser performs full layout, font rendering, and KaTeX math shaping,
 * avoiding the blank-page bugs caused by left: -9999px or display: none.
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
    font-size: 13px;
    line-height: 1.5;
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

function createPageContainer(pageIndex: number): HTMLDivElement {
  const pageDiv = document.createElement('div');
  pageDiv.className = `pdf-page-container pdf-page-${pageIndex}`;
  pageDiv.style.cssText = `
    width: 760px;
    min-height: 50px;
    background: #ffffff !important;
    color: #0f172a !important;
    padding: 2px 4px 10px 4px;
    box-sizing: border-box;
    margin-bottom: 30px;
  `;
  return pageDiv;
}

/**
 * Exports a Grand Line verified drill attempt to a multi-page PDF.
 * Uses intelligent page-by-page chunking to guarantee that questions are never split across
 * page boundaries, that canvas height limits are never exceeded, and that blank pages cannot occur.
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

  const logoDataUrl = await getLogoDataUrl();
  const OPT_LABELS = ['A', 'B', 'C', 'D'];
  const mins = Math.floor(Math.max(0, timeTakenSeconds || 0) / 60);
  const secs = Math.max(0, Math.round(timeTakenSeconds || 0)) % 60;
  const formattedTime = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  // Step 1: Create visible off-screen staging host in DOM
  const stagingHost = createStagingHost('boardly-drill-result-staging');

  try {
    onProgress?.({
      current: 0,
      totalPages: 1,
      message: 'Preparing document layout and typography...',
    });

    const pages: HTMLDivElement[] = [];

    // Initialize Page 1
    const page1 = createPageContainer(1);
    stagingHost.appendChild(page1);
    pages.push(page1);

    // Page 1 Header Banner
    const headerBanner = document.createElement('div');
    headerBanner.style.cssText = `
      background: #0f172a !important;
      color: #ffffff !important;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 12px;
      box-sizing: border-box;
    `;
    headerBanner.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.18); padding-bottom: 10px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${
            logoDataUrl
              ? `<img src="${logoDataUrl}" style="height: 30px; width: auto; object-fit: contain; filter: brightness(1.2);" alt="Boardly" />`
              : `<span style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: #D71921;">BOARDLY</span>`
          }
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.75); border-left: 1px solid rgba(255,255,255,0.25); padding-left: 10px;">
            Grand Line Verified Drill Report
          </span>
        </div>
        <span style="font-size: 11px; font-family: monospace; color: #cbd5e1; background: rgba(255,255,255,0.12); padding: 3px 10px; border-radius: 999px;">
          ${escapeHtml(formatSubjectName(subject || 'General'))}
        </span>
      </div>
      <div style="font-size: 17px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff;">
        ${escapeHtml(testTitle)}
      </div>
    `;
    page1.appendChild(headerBanner);

    // Page 1 Candidate & Score Metadata Card
    const metaCard = document.createElement('div');
    metaCard.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 14px;
      font-size: 11px;
      box-sizing: border-box;
      color: #0f172a !important;
    `;
    metaCard.innerHTML = `
      <div>
        <span style="color: #64748b; font-weight: 600;">Student:</span>
        <strong style="color: #0f172a; margin-left: 4px;">${escapeHtml(studentName)}</strong>
      </div>
      <div>
        <span style="color: #64748b; font-weight: 600;">Score:</span>
        <strong style="color: #0f172a; margin-left: 4px;">${score} / ${totalQuestions} (${percentage}%)</strong>
      </div>
      <div>
        <span style="color: #64748b; font-weight: 600;">Time:</span>
        <strong style="color: #0f172a; margin-left: 4px;">${escapeHtml(formattedTime)}</strong>
      </div>
      <div>
        <span style="color: #64748b; font-weight: 600;">Date:</span>
        <strong style="color: #0f172a; margin-left: 4px;">${escapeHtml(formattedDate)}</strong>
      </div>
    `;
    page1.appendChild(metaCard);

    // Target height per A4 page in 760px coordinates:
    // A4 printable height is 267mm (297 - 16 top - 14 bottom).
    // 267mm / 0.25mm per px = ~1068px.
    // We use a safe target of 1000px on Page 2+, and 820px on Page 1 (to account for the header/metadata).
    const MAX_PAGE_1_HEIGHT = 820;
    const MAX_SUBSEQUENT_PAGE_HEIGHT = 1000;

    let currentPage = page1;

    // Distribute questions into discrete page containers
    gradedQuestions.forEach((q, idx) => {
      const stemHtml = formatMathToHtml(q.question || '');
      const isRtl = containsRtlText(q.question || '');
      const selectedIdx = typeof q.selectedIndex === 'number' ? q.selectedIndex : -1;
      const correctIdx = typeof q.correctIndex === 'number' ? q.correctIndex : 0;
      const isCorrect = q.isCorrect ?? (selectedIdx === correctIdx);
      const statusLabel = selectedIdx < 0 ? 'UNANSWERED' : isCorrect ? 'CORRECT' : 'WRONG';
      const statusBg = selectedIdx < 0 ? '#64748b' : isCorrect ? '#059669' : '#dc2626';
      const opts = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'];
      const selectedLetter = selectedIdx >= 0 ? OPT_LABELS[selectedIdx] || String(selectedIdx + 1) : 'Skipped';
      const correctLetter = OPT_LABELS[correctIdx] || 'A';
      const explainHtml = formatMathToHtml(
        q.explanation || 'Step-by-step derivation verified by Boardly Grand Line.'
      );

      const qCard = document.createElement('div');
      qCard.className = 'pdf-question-item';
      qCard.style.cssText = `
        padding: 10px 14px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #ffffff !important;
        margin-bottom: 10px;
        box-sizing: border-box;
        page-break-inside: avoid;
        break-inside: avoid;
      `;

      qCard.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-weight: 800; font-size: 12.5px; color: #0f172a;">Question ${idx + 1}</span>
          <span style="font-size: 9.5px; font-weight: 800; color: #ffffff; background: ${statusBg}; padding: 1.5px 7px; border-radius: 999px; text-transform: uppercase;">
            ${statusLabel}
          </span>
        </div>
        <div dir="${isRtl ? 'rtl' : 'auto'}" style="font-size: 12px; color: #1e293b; line-height: 1.55; margin-bottom: 8px; white-space: pre-line; word-break: break-word;">
          ${stemHtml}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 6px;">
          ${opts
            .slice(0, 4)
            .map((opt, optIdx) => {
              const letter = OPT_LABELS[optIdx] || String(optIdx + 1);
              const optHtml = formatMathToHtml(String(opt || ''));
              const isOptCorrect = optIdx === correctIdx;
              const isOptSelected = optIdx === selectedIdx;
              const borderCol = isOptCorrect ? '#059669' : isOptSelected ? '#dc2626' : '#e2e8f0';
              const bgCol = isOptCorrect ? '#ecfdf5' : isOptSelected ? '#fef2f2' : '#f8fafc';
              const textCol = isOptCorrect ? '#065f46' : isOptSelected ? '#991b1b' : '#334155';
              return `
                <div style="padding: 5px 8px; background: ${bgCol} !important; border: 1px solid ${borderCol}; border-radius: 6px; font-size: 11px; color: ${textCol} !important; display: flex; align-items: flex-start; gap: 5px; box-sizing: border-box;">
                  <span style="font-weight: 700; color: #0f172a; shrink: 0;">(${letter})</span>
                  <span style="flex: 1; word-break: break-word;">${optHtml}</span>
                </div>
              `;
            })
            .join('')}
        </div>
        <div style="font-size: 10.5px; color: #334155; margin-bottom: 4px;">
          <strong>Your Answer:</strong> ${escapeHtml(selectedLetter)} &nbsp;|&nbsp;
          <strong>Correct Answer:</strong> [${escapeHtml(correctLetter)}]
        </div>
        <div dir="auto" style="font-size: 10.5px; color: #475569; line-height: 1.5; border-top: 1px dashed #cbd5e1; padding-top: 4px; margin-top: 4px; white-space: pre-line; word-break: break-word;">
          <strong style="color: #0f172a;">Explanation:</strong> ${explainHtml}
        </div>
      `;

      // Temporarily append to measure height
      currentPage.appendChild(qCard);

      const maxLimit = pages.length === 1 ? MAX_PAGE_1_HEIGHT : MAX_SUBSEQUENT_PAGE_HEIGHT;
      const questionCountOnCurrentPage = currentPage.querySelectorAll('.pdf-question-item').length;

      // If adding this question causes an overflow AND there is already at least 1 question on this page:
      // move it to a fresh page!
      if (currentPage.offsetHeight > maxLimit && questionCountOnCurrentPage > 1) {
        currentPage.removeChild(qCard);
        const nextPage = createPageContainer(pages.length + 1);
        stagingHost.appendChild(nextPage);
        pages.push(nextPage);
        nextPage.appendChild(qCard);
        currentPage = nextPage;
      }
    });

    const totalPages = pages.length;

    // Step 2: Diagnostic log
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

    // Step 3: Wait for all fonts and KaTeX equations to finish rendering
    await waitForAssets(stagingHost);

    // Step 4: Initialize jsPDF document (A4 portrait)
    const pdfDoc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdfDoc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdfDoc.internal.pageSize.getHeight(); // 297mm

    // Step 5: Render each page individually via html2canvas
    for (let p = 0; p < totalPages; p++) {
      const pageDiv = pages[p];

      onProgress?.({
        current: p + 1,
        totalPages,
        message: `Generating page ${p + 1} of ${totalPages}...`,
      });

      // Yield event loop so UI progress text and spinner can repaint
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
          `PDF generation failed on page ${p + 1}: Render canvas was blank. Please tap Download PDF to retry.`
        );
      }

      if (p > 0) {
        pdfDoc.addPage();
      }

      const contentHeightMm = (pageDiv.offsetHeight * 190) / 760;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Add the rendered page image between top margin (16mm) and bottom margin (14mm)
      pdfDoc.addImage(imgData, 'JPEG', 10, 16, 190, contentHeightMm, undefined, 'FAST');

      // Top Header: Logo + Test Title
      if (logoDataUrl) {
        try {
          const topLogoW = 22;
          const topLogoH = topLogoW / 2.146; // ~10.25mm
          pdfDoc.addImage(logoDataUrl, 'PNG', 10, 4, topLogoW, topLogoH, undefined, 'FAST');
        } catch {
          // ignore logo drawing exception
        }
      }

      pdfDoc.setFontSize(7.5);
      pdfDoc.setTextColor(140, 140, 140);
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.text(testTitle, pageWidth - 10, 8, { align: 'right' });

      // Bottom Footer on EVERY page: Dividing line + Page X of Y
      pdfDoc.setDrawColor(220, 220, 220);
      pdfDoc.line(10, pageHeight - 11, pageWidth - 10, pageHeight - 11);

      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(110, 110, 110);
      pdfDoc.setFont('helvetica', 'normal');
      pdfDoc.text(
        `Boardly Grand Line · ${testTitle} · Page ${p + 1} of ${totalPages}`,
        10,
        pageHeight - 6
      );
    }

    onProgress?.({
      current: totalPages,
      totalPages,
      message: 'Finalizing PDF download...',
    });

    const filename = `${testTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Result_Boardly.pdf`;
    pdfDoc.save(filename);
  } finally {
    if (stagingHost.parentNode) {
      stagingHost.parentNode.removeChild(stagingHost);
    }
  }
}

/**
 * Exports a full Practice Test paper with questions and an official answer key appendix.
 * Paginates in manageable chunks to avoid single giant DOM elements and canvas dimension limits.
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
  const logoDataUrl = await getLogoDataUrl();
  const resolvedQuestions = await resolveQuestionKeys(questions);
  const OPT_LABELS = ['A', 'B', 'C', 'D'];

  const stagingHost = createStagingHost('boardly-practice-test-staging');

  try {
    onProgress?.({
      current: 0,
      totalPages: 1,
      message: 'Formatting test paper layout...',
    });

    const pages: HTMLDivElement[] = [];

    // Page 1
    const page1 = createPageContainer(1);
    stagingHost.appendChild(page1);
    pages.push(page1);

    // Header Banner
    const headerBanner = document.createElement('div');
    headerBanner.style.cssText = `
      background: #0f172a !important;
      color: #ffffff !important;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 12px;
      box-sizing: border-box;
    `;
    headerBanner.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.18); padding-bottom: 10px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${
            logoDataUrl
              ? `<img src="${logoDataUrl}" style="height: 30px; width: auto; object-fit: contain; filter: brightness(1.2);" alt="Boardly" />`
              : `<span style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: #D71921;">BOARDLY</span>`
          }
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.75); border-left: 1px solid rgba(255,255,255,0.25); padding-left: 10px;">
            Official Entrance Test Paper
          </span>
        </div>
        <span style="font-size: 11px; font-family: monospace; color: #cbd5e1; background: rgba(255,255,255,0.12); padding: 3px 10px; border-radius: 999px;">
          ${escapeHtml(university)}
        </span>
      </div>
      <div style="font-size: 17px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; margin-bottom: 3px;">
        ${escapeHtml(title)}
      </div>
      <div style="font-size: 10.5px; color: #94a3b8; font-weight: 500;">
        <strong style="color: #f1f5f9;">Rules:</strong> ${escapeHtml(resolvedMarkingScheme)}
      </div>
    `;
    page1.appendChild(headerBanner);

    // Candidate Metadata Card
    const metaCard = document.createElement('div');
    metaCard.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc !important;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 14px;
      font-size: 11px;
      box-sizing: border-box;
      color: #0f172a !important;
    `;
    metaCard.innerHTML = `
      <div>
        <span style="color: #64748b; font-weight: 600;">Candidate:</span>
        <strong style="color: #0f172a; margin-left: 4px;">${escapeHtml(studentName)}</strong>
        ${studentEmail ? `<span style="color: #94a3b8; margin-left: 4px;">(${escapeHtml(studentEmail)})</span>` : ''}
      </div>
      <div>
        <span style="color: #64748b; font-weight: 600;">MCQs:</span>
        <strong style="color: #0f172a; margin-left: 4px;">${resolvedQuestions.length} Questions</strong>
      </div>
      <div>
        <span style="color: #64748b; font-weight: 600;">Time Allowed:</span>
        <strong style="color: #0f172a; margin-left: 4px;">${resolvedQuestions.length} Minutes</strong>
      </div>
      <div>
        <span style="color: #64748b; font-weight: 600;">Date:</span>
        <strong style="color: #0f172a; margin-left: 4px;">${new Date().toLocaleDateString('en-GB')}</strong>
      </div>
    `;
    page1.appendChild(metaCard);

    const MAX_PAGE_1_HEIGHT = 800;
    const MAX_SUBSEQUENT_PAGE_HEIGHT = 1000;
    let currentPage = page1;

    // Part 1: Questions
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
        padding: 10px 14px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #ffffff !important;
        margin-bottom: 10px;
        box-sizing: border-box;
      `;

      qCard.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; font-size: 12.5px; color: #0f172a;">Q${idx + 1}.</span>
            <span style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #475569; background: #f1f5f9 !important; padding: 1.5px 7px; border-radius: 999px; border: 1px solid #e2e8f0;">
              ${escapeHtml(subName)}
            </span>
          </div>
          <span style="font-size: 9.5px; font-family: monospace; font-weight: 700; color: #64748b; background: #f8fafc !important; padding: 1.5px 7px; border-radius: 6px; border: 1px solid #e2e8f0;">
            ${escapeHtml(badgeLabel)}
          </span>
        </div>
        <div dir="${isRtl ? 'rtl' : 'auto'}" style="font-size: 12px; color: #1e293b; line-height: 1.55; margin-bottom: 8px; white-space: pre-line; word-break: break-word;">
          ${stemHtml}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
          ${opts.slice(0, 4).map((opt, optIdx) => {
            const letter = OPT_LABELS[optIdx] || String(optIdx + 1);
            const optHtml = formatMathToHtml(String(opt || ''));
            return `
              <div style="padding: 5px 8px; background: #f8fafc !important; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; color: #334155 !important; display: flex; align-items: flex-start; gap: 5px; box-sizing: border-box;">
                <span style="font-weight: 700; color: #0f172a; shrink: 0;">(${letter})</span>
                <span style="flex: 1; word-break: break-word;">${optHtml}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;

      currentPage.appendChild(qCard);

      const maxLimit = pages.length === 1 ? MAX_PAGE_1_HEIGHT : MAX_SUBSEQUENT_PAGE_HEIGHT;
      const questionCountOnCurrentPage = currentPage.querySelectorAll('.pdf-question-item').length;

      if (currentPage.offsetHeight > maxLimit && questionCountOnCurrentPage > 1) {
        currentPage.removeChild(qCard);
        const nextPage = createPageContainer(pages.length + 1);
        stagingHost.appendChild(nextPage);
        pages.push(nextPage);
        nextPage.appendChild(qCard);
        currentPage = nextPage;
      }
    });

    // Part 2: Official Answer Key & Explanations Appendix Header
    const appendixHeader = document.createElement('div');
    appendixHeader.className = 'pdf-appendix-header';
    appendixHeader.style.cssText = `
      margin-top: 14px;
      margin-bottom: 10px;
      padding: 8px 14px;
      background: #D71921 !important;
      color: #ffffff !important;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
    `;
    appendixHeader.innerHTML = `
      <span style="font-size: 11.5px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
        OFFICIAL ANSWER KEY &amp; EXPLANATIONS
      </span>
      <span style="font-size: 9.5px; font-family: monospace; background: rgba(0,0,0,0.25); padding: 1.5px 7px; border-radius: 999px;">
        ${resolvedQuestions.length} Questions
      </span>
    `;

    // Append section header; if it overflows, start a new page
    currentPage.appendChild(appendixHeader);
    if (currentPage.offsetHeight > MAX_SUBSEQUENT_PAGE_HEIGHT && currentPage.querySelectorAll('.pdf-question-item').length > 0) {
      currentPage.removeChild(appendixHeader);
      const nextPage = createPageContainer(pages.length + 1);
      stagingHost.appendChild(nextPage);
      pages.push(nextPage);
      nextPage.appendChild(appendixHeader);
      currentPage = nextPage;
    }

    // Part 2: Answer Key & Explanation Items
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
        padding: 8px 12px;
        background: #f8fafc !important;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 8px;
        box-sizing: border-box;
      `;
      keyCard.innerHTML = `
        <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px;">
          <strong style="color: #0f172a; font-size: 11.5px;">Q${idx + 1}.</strong>
          <span style="display: inline-block; background: #D71921 !important; color: #ffffff !important; font-weight: 800; font-family: monospace; font-size: 10px; padding: 1px 7px; border-radius: 4px;">
            [ ${correctLetter} ]
          </span>
          <span style="font-size: 11px; color: #334155; word-break: break-word;">
            ${correctOptionHtml}
          </span>
        </div>
        <div dir="auto" style="font-size: 10.5px; color: #475569; line-height: 1.45; border-top: 1px dashed #cbd5e1; padding-top: 4px; margin-top: 4px; white-space: pre-line; word-break: break-word;">
          <strong style="color: #0f172a;">Explanation:</strong> ${explanationHtml}
        </div>
      `;

      currentPage.appendChild(keyCard);

      const itemsOnPage = currentPage.querySelectorAll('.pdf-question-item, .pdf-answer-key-item').length;
      if (currentPage.offsetHeight > MAX_SUBSEQUENT_PAGE_HEIGHT && itemsOnPage > 1) {
        currentPage.removeChild(keyCard);
        const nextPage = createPageContainer(pages.length + 1);
        stagingHost.appendChild(nextPage);
        pages.push(nextPage);
        nextPage.appendChild(keyCard);
        currentPage = nextPage;
      }
    });

    const totalPages = pages.length;

    console.log('[testPdfExporter] Practice Test PDF Layout Diagnostics:', {
      title,
      university,
      totalQuestions: resolvedQuestions.length,
      totalPagesCalculated: totalPages,
      stagingHostVisible: stagingHost.offsetWidth > 0 && stagingHost.offsetHeight > 0,
      stagingHostWidth: stagingHost.offsetWidth,
      stagingHostHeight: stagingHost.offsetHeight,
    });

    await waitForAssets(stagingHost);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let p = 0; p < totalPages; p++) {
      const pageDiv = pages[p];

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
        console.error(`[testPdfExporter] Warning: Blank canvas detected on page ${p + 1}!`);
        throw new Error(
          `PDF generation failed on page ${p + 1}: Render canvas was blank. Please retry.`
        );
      }

      if (p > 0) {
        pdf.addPage();
      }

      const contentHeightMm = (pageDiv.offsetHeight * 190) / 760;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      pdf.addImage(imgData, 'JPEG', 10, 16, 190, contentHeightMm, undefined, 'FAST');

      if (logoDataUrl) {
        try {
          const topLogoW = 22;
          const topLogoH = topLogoW / 2.146;
          pdf.addImage(logoDataUrl, 'PNG', 10, 4, topLogoW, topLogoH, undefined, 'FAST');
        } catch {
          // ignore
        }
      }

      pdf.setFontSize(7.5);
      pdf.setTextColor(140, 140, 140);
      pdf.setFont('helvetica', 'normal');
      pdf.text(title, pageWidth - 10, 8, { align: 'right' });

      pdf.setDrawColor(220, 220, 220);
      pdf.line(10, pageHeight - 11, pageWidth - 10, pageHeight - 11);

      pdf.setFontSize(8);
      pdf.setTextColor(110, 110, 110);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Boardly Entry Test Engine · ${title} · Page ${p + 1} of ${totalPages}`,
        10,
        pageHeight - 6
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
 * Safely unpacks the API response object ({ attempt, test }) and passes student fallback name and onProgress.
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
