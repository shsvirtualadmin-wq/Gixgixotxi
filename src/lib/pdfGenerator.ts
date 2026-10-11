import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Question } from '../types';
import { renderMath } from './boardyMath';

export interface ChunkedPdfOptions {
  title: string;
  questions: Question[];
  userAnswers?: (number | null)[];
  durationMinutes?: number;
  isSubmitted?: boolean;
  subject?: string;
  onProgress?: (progress: { page: number; totalPages: number; percent: number }) => void;
}

/**
 * Escapes HTML characters.
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates a clean, printable PDF of the test in the browser using page-by-page
 * offscreen DOM chunking. This avoids memory exhaustion and 4096px canvas clipping
 * on mobile browsers while faithfully rendering KaTeX math and fonts.
 */
export async function generateQuizPdfChunked({
  title,
  questions,
  userAnswers = [],
  durationMinutes = 60,
  isSubmitted = false,
  subject = '',
  onProgress,
}: ChunkedPdfOptions): Promise<void> {
  if (!questions || questions.length === 0) {
    throw new Error('No questions available to export.');
  }

  // Group questions into pages: 4 questions per standard page
  const QUESTIONS_PER_PAGE = 4;
  const questionPages: Question[][] = [];
  for (let i = 0; i < questions.length; i += QUESTIONS_PER_PAGE) {
    questionPages.push(questions.slice(i, i + QUESTIONS_PER_PAGE));
  }

  // Answer key pages: ~20 rows per page
  const ANSWERS_PER_PAGE = 22;
  const totalAnswerPages = Math.ceil(questions.length / ANSWERS_PER_PAGE);
  const totalPages = questionPages.length + totalAnswerPages;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Offscreen container for single-page rendering (exact A4 at 96 DPI: 794px x 1123px)
  const pageContainer = document.createElement('div');
  pageContainer.style.position = 'fixed';
  pageContainer.style.left = '-9999px';
  pageContainer.style.top = '0';
  pageContainer.style.width = '794px';
  pageContainer.style.height = '1123px';
  pageContainer.style.backgroundColor = '#ffffff';
  pageContainer.style.color = '#0f172a';
  pageContainer.style.fontFamily = "'Inter', -apple-system, sans-serif";
  pageContainer.style.padding = '40px 48px';
  pageContainer.style.boxSizing = 'border-box';
  pageContainer.style.zIndex = '-9999';
  document.body.appendChild(pageContainer);

  try {
    let currentPageNum = 1;

    // 1. Render Question Pages
    for (let pIdx = 0; pIdx < questionPages.length; pIdx++) {
      const pageQuestions = questionPages[pIdx];
      const startQIndex = pIdx * QUESTIONS_PER_PAGE;

      const headerHtml = `
        <div style="border-bottom: 2px solid #1E5AFF; padding-bottom: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px; font-weight: 900; color: #1E5AFF; letter-spacing: -0.5px;">BOARDLY</span>
              <span style="font-size: 10px; font-weight: 700; color: #64748b; background: #f1f5f9; padding: 2px 8px; rounded: 4px;">TEST WORKSHEET</span>
            </div>
            <h2 style="margin: 4px 0 0 0; font-size: 14px; font-weight: 800; color: #0f172a;">${escapeHtml(title)}</h2>
          </div>
          <div style="text-align: right; font-size: 10px; color: #64748b; font-weight: 600;">
            <div>Date: ${dateStr}</div>
            <div>${questions.length} Questions · ${durationMinutes} Mins</div>
          </div>
        </div>
      `;

      let questionsHtml = '<div style="display: flex; flex-direction: column; gap: 18px;">';

      pageQuestions.forEach((q, qLocalIdx) => {
        const qNumber = startQIndex + qLocalIdx + 1;
        const qStem = q.q || q.question || '';
        const renderedStem = renderMath(qStem);

        const optionsHtml = (q.options || []).map((opt, optIdx) => {
          const letter = String.fromCharCode(65 + optIdx);
          const renderedOpt = renderMath(opt);
          return `
            <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 11px; margin-top: 4px;">
              <span style="display: inline-block; width: 18px; height: 18px; border-radius: 4px; background-color: #f8fafc; border: 1px solid #cbd5e1; text-align: center; line-height: 18px; font-weight: 800; font-size: 10px; color: #334155; flex-shrink: 0;">${letter}</span>
              <div style="flex: 1; color: #1e293b; line-height: 1.4;">${renderedOpt}</div>
            </div>
          `;
        }).join('');

        questionsHtml += `
          <div style="padding-bottom: 12px; border-bottom: 1px dashed #e2e8f0;">
            <div style="display: flex; align-items: baseline; gap: 6px; font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
              <span style="color: #1E5AFF; font-weight: 900;">Q${qNumber}.</span>
              <div style="flex: 1; line-height: 1.4;">${renderedStem}</div>
            </div>
            <div style="padding-left: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px;">
              ${optionsHtml}
            </div>
          </div>
        `;
      });

      questionsHtml += '</div>';

      const footerHtml = `
        <div style="position: absolute; bottom: 24px; left: 48px; right: 48px; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 9px; color: #94a3b8; font-weight: 600;">
          <span>boardly.cfd — Pakistan's Entrance Test &amp; Board Prep Portal</span>
          <span>Page ${currentPageNum} of ${totalPages}</span>
        </div>
      `;

      pageContainer.innerHTML = `
        <div style="position: relative; height: 100%; box-sizing: border-box;">
          ${headerHtml}
          ${questionsHtml}
          ${footerHtml}
        </div>
      `;

      // Wait briefly for KaTeX render paint
      await new Promise((r) => setTimeout(r, 20));

      const canvas = await html2canvas(pageContainer, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      if (currentPageNum > 1) {
        pdf.addPage();
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

      onProgress?.({
        page: currentPageNum,
        totalPages,
        percent: Math.round((currentPageNum / totalPages) * 100),
      });

      currentPageNum++;
    }

    // 2. Render Answer Key Pages
    for (let aIdx = 0; aIdx < totalAnswerPages; aIdx++) {
      const sliceQuestions = questions.slice(aIdx * ANSWERS_PER_PAGE, (aIdx + 1) * ANSWERS_PER_PAGE);
      const startIdx = aIdx * ANSWERS_PER_PAGE;

      const headerHtml = `
        <div style="border-bottom: 2px solid #1E5AFF; padding-bottom: 12px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px; font-weight: 900; color: #1E5AFF; letter-spacing: -0.5px;">BOARDLY</span>
              <span style="font-size: 10px; font-weight: 700; color: #166534; background: #dcfce7; padding: 2px 8px; border-radius: 4px;">OFFICIAL ANSWER KEY</span>
            </div>
            <h2 style="margin: 4px 0 0 0; font-size: 13px; font-weight: 800; color: #0f172a;">${escapeHtml(title)} — Answer Key</h2>
          </div>
          <div style="text-align: right; font-size: 10px; color: #64748b; font-weight: 600;">
            <div>Date: ${dateStr}</div>
            <div>${questions.length} Questions</div>
          </div>
        </div>
      `;

      let tableRows = '';
      sliceQuestions.forEach((q, qLocalIdx) => {
        const qNumber = startIdx + qLocalIdx + 1;
        const correctLetter = String.fromCharCode(65 + (q.correct ?? 0));
        const studentAns = userAnswers[startIdx + qLocalIdx];
        const studentLetter = typeof studentAns === 'number' && studentAns >= 0
          ? String.fromCharCode(65 + studentAns)
          : '—';
        const isStudentCorrect = typeof studentAns === 'number' && studentAns === q.correct;

        const explainSnippet = q.explain || q.explanation || '';
        const renderedExplain = explainSnippet ? renderMath(explainSnippet) : '—';

        tableRows += `
          <tr style="border-bottom: 1px solid #f1f5f9; font-size: 10px;">
            <td style="padding: 6px 8px; font-weight: 800; color: #1E5AFF; text-align: center;">${qNumber}</td>
            ${isSubmitted ? `
              <td style="padding: 6px 8px; text-align: center; font-weight: 700; color: ${isStudentCorrect ? '#16a34a' : studentLetter === '—' ? '#94a3b8' : '#dc2626'};">
                ${studentLetter} ${isStudentCorrect ? '✓' : studentLetter !== '—' ? '✗' : ''}
              </td>
            ` : ''}
            <td style="padding: 6px 8px; text-align: center; font-weight: 800; color: #0f172a;">${correctLetter}</td>
            <td style="padding: 6px 8px; color: #334155; line-height: 1.35;">${renderedExplain}</td>
          </tr>
        `;
      });

      const tableHtml = `
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 1.5px solid #cbd5e1; font-size: 10px; color: #475569; font-weight: 800;">
              <th style="padding: 6px 8px; text-align: center; width: 44px;">Q#</th>
              ${isSubmitted ? '<th style="padding: 6px 8px; text-align: center; width: 64px;">Your Ans</th>' : ''}
              <th style="padding: 6px 8px; text-align: center; width: 54px;">Key</th>
              <th style="padding: 6px 8px;">Step-by-step Derivation &amp; Solution</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;

      const footerHtml = `
        <div style="position: absolute; bottom: 24px; left: 48px; right: 48px; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 9px; color: #94a3b8; font-weight: 600;">
          <span>boardly.cfd — Self-Paced Exam Diagnostics</span>
          <span>Page ${currentPageNum} of ${totalPages}</span>
        </div>
      `;

      pageContainer.innerHTML = `
        <div style="position: relative; height: 100%; box-sizing: border-box;">
          ${headerHtml}
          ${tableHtml}
          ${footerHtml}
        </div>
      `;

      await new Promise((r) => setTimeout(r, 20));

      const canvas = await html2canvas(pageContainer, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      pdf.addPage();
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

      onProgress?.({
        page: currentPageNum,
        totalPages,
        percent: Math.round((currentPageNum / totalPages) * 100),
      });

      currentPageNum++;
    }

    // Save PDF file
    const safeTitle = (title || 'Boardly_Test').replace(/[^a-zA-Z0-9_-]/g, '_');
    pdf.save(`${safeTitle}_Boardly.pdf`);
  } finally {
    if (pageContainer && pageContainer.parentNode) {
      pageContainer.parentNode.removeChild(pageContainer);
    }
  }
}

export interface LegacyPdfOptions {
  subject: string;
  gradeOrPath?: string;
  questions: Question[];
  includeAnswers?: boolean;
  studentName?: string;
  [key: string]: any;
}

/**
 * Backward compatibility export for legacy callers
 */
export async function downloadQuizPdf(options: LegacyPdfOptions): Promise<void> {
  return generateQuizPdfChunked({
    title: `${options.subject} ${options.gradeOrPath ? `(${options.gradeOrPath})` : ''}`.trim(),
    questions: options.questions,
    durationMinutes: Math.max(15, Math.ceil(options.questions.length * 1.5)),
    isSubmitted: Boolean(options.includeAnswers),
    subject: options.subject,
  });
}

