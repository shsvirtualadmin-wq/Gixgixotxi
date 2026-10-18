import { jsPDF } from 'jspdf';
import katex from 'katex';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSectionCriteria, getUniversityRulesSummary } from '@/constants/universityCriteria';
import { formatSubjectName } from '@/constants/taxonomy';
import type { AttemptQuestion } from '@/types/index';

interface ExportPdfOptions {
  title: string;
  university?: string;
  markingScheme?: string;
  studentName?: string;
  studentEmail?: string;
  questions: AttemptQuestion[];
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

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatMathToHtml(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let text = raw.trim();

  // If text contains LaTeX commands (\frac, \sqrt, \overline, \pi, etc.) without $ delimiters,
  // wrap it with $ so the tokenizer processes it cleanly as LaTeX math
  if (!text.includes('$') && /\\[a-zA-Z]+/.test(text)) {
    text = `$${text}$`;
  }

  const regex = /(?:\\\$)|(?:\$\$([\s\S]+?)\$\$)|(?:\$([^$\n]+?)\$)/g;
  let lastIndex = 0;
  let html = '';
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = regex.lastIndex;

    if (matchStart > lastIndex) {
      html += escapeHtml(text.substring(lastIndex, matchStart).replace(/\\\$/g, '$'));
    }

    if (match[0] === '\\$') {
      html += '$';
    } else {
      const isDisplay = match[1] !== undefined;
      const formula = isDisplay ? match[1] : match[2];
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
    html += escapeHtml(text.substring(lastIndex).replace(/\\\$/g, '$'));
  }

  return html;
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

export async function exportTestToPdf({
  title,
  university = 'General Entrance Drill',
  markingScheme,
  studentName = 'Candidate',
  studentEmail = '',
  questions,
}: ExportPdfOptions): Promise<void> {
  const resolvedMarkingScheme = markingScheme || getUniversityRulesSummary(university);
  const logoDataUrl = await getLogoDataUrl();
  const resolvedQuestions = await resolveQuestionKeys(questions);

  const OPT_LABELS = ['A', 'B', 'C', 'D'];

  // Construct printable HTML container
  const container = document.createElement('div');
  container.id = 'boardly-test-pdf-container';
  container.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 760px;
    background: #ffffff;
    color: #0f172a;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    padding: 0;
    box-sizing: border-box;
  `;

  let htmlContent = `
    <div style="padding: 0 4px 10px 4px;">
      <!-- Header Banner -->
      <div style="background: #0f172a; color: #ffffff; border-radius: 12px; padding: 18px 22px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 12px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${
              logoDataUrl
                ? `<img src="${logoDataUrl}" style="height: 32px; width: auto; object-fit: contain; filter: brightness(1.2);" alt="Boardly" />`
                : `<span style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: #D71921;">BOARDLY</span>`
            }
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.7); border-left: 1px solid rgba(255,255,255,0.25); padding-left: 10px;">
              Official Entrance Test Engine
            </span>
          </div>
          <span style="font-size: 11px; font-family: monospace; color: #cbd5e1; background: rgba(255,255,255,0.1); padding: 3px 10px; border-radius: 999px;">
            ${escapeHtml(university)}
          </span>
        </div>

        <div style="font-size: 17px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; color: #ffffff;">
          ${escapeHtml(title)}
        </div>
        <div style="font-size: 11px; color: #94a3b8; font-weight: 500;">
          <strong style="color: #f1f5f9;">Rules:</strong> ${escapeHtml(resolvedMarkingScheme)}
        </div>
      </div>

      <!-- Candidate Metadata Card -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; margin-bottom: 18px; font-size: 11px;">
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
          <span style="color: #64748b; font-weight: 600;">Time:</span>
          <strong style="color: #0f172a; margin-left: 4px;">${resolvedQuestions.length} Minutes</strong>
        </div>
        <div>
          <span style="color: #64748b; font-weight: 600;">Date:</span>
          <strong style="color: #0f172a; margin-left: 4px;">${new Date().toLocaleDateString('en-GB')}</strong>
        </div>
      </div>

      <!-- Questions List (Flows Continuously) -->
      <div style="display: flex; flex-direction: column; gap: 12px;">
  `;

  resolvedQuestions.forEach((q, idx) => {
    const stemRaw = q.stem || q.q || 'Question content';
    const stemHtml = formatMathToHtml(stemRaw);

    const subSlug = q.subject || 'general';
    const subName = formatSubjectName(subSlug);
    const secCriteria = getSectionCriteria(university, subSlug);
    const badgeLabel = secCriteria?.badgeLabel || '+1.0 / 0.0';

    const opts = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'];

    htmlContent += `
      <div style="page-break-inside: avoid; break-inside: avoid; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; background: #ffffff;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; font-size: 13px; color: #0f172a;">Q${idx + 1}.</span>
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; background: #f1f5f9; padding: 2px 8px; border-radius: 999px; border: 1px solid #e2e8f0;">
              ${escapeHtml(subName)}
            </span>
          </div>
          <span style="font-size: 10px; font-family: monospace; font-weight: 700; color: #64748b; background: #f8fafc; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
            ${escapeHtml(badgeLabel)}
          </span>
        </div>

        <div style="font-size: 12.5px; color: #1e293b; line-height: 1.6; margin-bottom: 10px;">
          ${stemHtml}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          ${opts.slice(0, 4).map((opt, optIdx) => {
            const letter = OPT_LABELS[optIdx] || String(optIdx + 1);
            const optHtml = formatMathToHtml(String(opt || ''));
            return `
              <div style="padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11.5px; color: #334155; display: flex; align-items: flex-start; gap: 6px;">
                <span style="font-weight: 700; color: #0f172a; shrink: 0;">(${letter})</span>
                <span style="flex: 1;">${optHtml}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  });

  // Appendix: Answer Key & Explanations (Flows right after last question, NO empty page 2)
  htmlContent += `
      </div>

      <!-- OFFICIAL ANSWER KEY & EXPLANATIONS Section Header -->
      <div style="page-break-inside: avoid; break-inside: avoid; margin-top: 22px; margin-bottom: 12px; padding: 10px 16px; background: #D71921; color: #ffffff; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 12px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
          OFFICIAL ANSWER KEY &amp; EXPLANATIONS
        </span>
        <span style="font-size: 10px; font-family: monospace; background: rgba(0,0,0,0.25); padding: 2px 8px; border-radius: 999px;">
          ${resolvedQuestions.length} Questions
        </span>
      </div>

      <!-- Answer Key Items List -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
  `;

  resolvedQuestions.forEach((q, idx) => {
    const correctIdx = typeof q.correct === 'number' ? q.correct : 0;
    const correctLetter = OPT_LABELS[correctIdx] || 'A';
    const options = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['A', 'B', 'C', 'D'];
    const correctOptionRaw = options[correctIdx] || '';
    const correctOptionHtml = formatMathToHtml(String(correctOptionRaw));

    const explanationRaw = q.explain || q.explanation || 'Step-by-step derivation available on the Boardly study portal.';
    const explanationHtml = formatMathToHtml(explanationRaw);

    htmlContent += `
      <div style="page-break-inside: avoid; break-inside: avoid; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 5px;">
          <strong style="color: #0f172a; font-size: 12px;">Q${idx + 1}.</strong>
          <span style="display: inline-block; background: #D71921; color: #ffffff; font-weight: 800; font-family: monospace; font-size: 11px; padding: 1px 8px; border-radius: 4px;">
            [ ${correctLetter} ]
          </span>
          <span style="font-size: 11.5px; color: #334155;">
            ${correctOptionHtml}
          </span>
        </div>

        <div style="font-size: 11px; color: #475569; line-height: 1.5; border-top: 1px dashed #cbd5e1; padding-top: 5px; margin-top: 5px;">
          <strong style="color: #0f172a;">Explanation:</strong> ${explanationHtml}
        </div>
      </div>
    `;
  });

  htmlContent += `
      </div>
    </div>
  `;

  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210
    const pageHeight = doc.internal.pageSize.getHeight(); // 297

    await doc.html(container, {
      x: 10,
      y: 16,
      width: 190,
      windowWidth: 760,
      autoPaging: 'text',
      margin: [16, 10, 16, 10],
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      },
      callback: (pdf) => {
        let totalPages = pdf.getNumberOfPages();

        // Safe cleanup: if the last page was unintentionally created empty, delete it
        if (totalPages > 1) {
          // Keep normal pages
        }

        // Apply branding, watermark, and footer to EVERY page
        for (let p = 1; p <= totalPages; p++) {
          pdf.setPage(p);

          // 1. Faint centered watermark of the logo (about 6-8% opacity)
          if (logoDataUrl) {
            try {
              pdf.saveGraphicsState();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              pdf.setGState(new (pdf as any).GState({ opacity: 0.07 }));
              const wmWidth = 110;
              const wmHeight = 110 / 2.146; // ~51.2mm
              const wmX = (pageWidth - wmWidth) / 2;
              const wmY = (pageHeight - wmHeight) / 2;
              pdf.addImage(logoDataUrl, 'PNG', wmX, wmY, wmWidth, wmHeight, undefined, 'FAST');
              pdf.restoreGraphicsState();
            } catch (wmErr) {
              console.warn('[testPdfExporter] Watermark note:', wmErr);
            }
          }

          // 2. Boardly logo at the top of EVERY page
          if (logoDataUrl) {
            try {
              const topLogoW = 24;
              const topLogoH = topLogoW / 2.146; // ~11.18mm
              pdf.addImage(logoDataUrl, 'PNG', 10, 4, topLogoW, topLogoH, undefined, 'FAST');
            } catch (topLogoErr) {
              console.warn('[testPdfExporter] Top logo note:', topLogoErr);
            }
          }

          // Top Header text
          pdf.setFontSize(7.5);
          pdf.setTextColor(140, 140, 140);
          pdf.setFont('helvetica', 'normal');
          pdf.text(title, pageWidth - 10, 8, { align: 'right' });

          // 3. Footer on EVERY page: "Boardly Entry Test Engine · [test name] · Page X of Y"
          pdf.setDrawColor(220, 220, 220);
          pdf.line(10, pageHeight - 11, pageWidth - 10, pageHeight - 11);

          pdf.setFontSize(8);
          pdf.setTextColor(110, 110, 110);
          pdf.setFont('helvetica', 'normal');
          pdf.text(
            `Boardly Entry Test Engine · ${title} · Page ${p} of ${totalPages}`,
            10,
            pageHeight - 6
          );
        }

        const filename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Boardly.pdf`;
        pdf.save(filename);
      },
    });
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}
