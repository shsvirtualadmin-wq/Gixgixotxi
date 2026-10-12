import { renderMath } from './boardyMath';
import { Question } from '../types';

export const KATEX_CACHE_VERSION = 'v1';

export interface ConvertedMcqHtml {
  qHtml: string;
  optionsHtml: string[];
  explainHtml: string;
  version: string;
}

// In-memory cache for ultra-fast access
const inMemoryCache = new Map<string, ConvertedMcqHtml>();

// Helper to escape plain text if conversion falls back
function escapeHtmlFallback(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Gets cached converted HTML for a question, or null if not yet cached.
 */
export function getCachedQuestionHtml(qId: string): ConvertedMcqHtml | null {
  if (!qId) return null;
  if (inMemoryCache.has(qId)) {
    return inMemoryCache.get(qId)!;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(`boardly_katex_${KATEX_CACHE_VERSION}_${qId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as ConvertedMcqHtml;
        if (parsed && parsed.version === KATEX_CACHE_VERSION) {
          inMemoryCache.set(qId, parsed);
          return parsed;
        }
      }
    } catch {
      // ignore localStorage quota errors
    }
  }
  return null;
}

/**
 * Caches converted HTML for a question in memory and localStorage.
 */
export function setCachedQuestionHtml(qId: string, data: ConvertedMcqHtml): void {
  if (!qId) return;
  inMemoryCache.set(qId, data);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(`boardly_katex_${KATEX_CACHE_VERSION}_${qId}`, JSON.stringify(data));
    } catch {
      // Quota exceeded, in-memory cache remains active
    }
  }
}

/**
 * Converts a single question's stem, options, and explanation through KaTeX.
 * If conversion fails on any question, logs the ID and falls back gracefully to sanitized text.
 */
export function convertSingleQuestion(q: Question): ConvertedMcqHtml {
  const existing = getCachedQuestionHtml(q.id);
  if (existing) return existing;

  let qHtml = '';
  let optionsHtml: string[] = [];
  let explainHtml = '';

  try {
    qHtml = renderMath(q.q || q.question || '');
  } catch (err) {
    console.warn(`[KaTeX Fallback] Failed to convert question stem id=${q.id}:`, err);
    qHtml = `<span class="katex-fallback">${escapeHtmlFallback(q.q || q.question || '')}</span>`;
  }

  try {
    optionsHtml = (q.options || []).map((opt) => {
      try {
        return renderMath(opt || '');
      } catch (optErr) {
        console.warn(`[KaTeX Fallback] Option conversion id=${q.id}:`, optErr);
        return `<span class="katex-fallback">${escapeHtmlFallback(opt || '')}</span>`;
      }
    });
  } catch (err) {
    console.warn(`[KaTeX Fallback] Failed to convert options id=${q.id}:`, err);
    optionsHtml = (q.options || []).map((opt) => escapeHtmlFallback(opt || ''));
  }

  try {
    explainHtml = renderMath(q.explain || q.explanation || '');
  } catch (err) {
    console.warn(`[KaTeX Fallback] Failed to convert explanation id=${q.id}:`, err);
    explainHtml = `<span class="katex-fallback">${escapeHtmlFallback(q.explain || q.explanation || '')}</span>`;
  }

  const result: ConvertedMcqHtml = {
    qHtml,
    optionsHtml,
    explainHtml,
    version: KATEX_CACHE_VERSION,
  };

  setCachedQuestionHtml(q.id, result);
  return result;
}

/**
 * Prepares an array of questions for a test session chunk by chunk.
 * Shows true progress (n of N) and yields to UI via requestAnimationFrame so the browser renders smoothly.
 * If already cached, completes in milliseconds.
 */
export async function prepareQuestionsWithProgress(
  questions: Question[],
  onProgress?: (preparedCount: number, totalCount: number) => void
): Promise<ConvertedMcqHtml[]> {
  const results: ConvertedMcqHtml[] = [];
  const total = questions.length;

  if (total === 0) {
    if (onProgress) onProgress(0, 0);
    return [];
  }

  let prepared = 0;
  for (let i = 0; i < total; i++) {
    const q = questions[i];
    const converted = convertSingleQuestion(q);
    results.push(converted);
    prepared++;

    if (onProgress) {
      onProgress(prepared, total);
    }

    // Yield every 3 questions if live conversion is needed, keeping main thread responsive
    if (i % 3 === 0 && i < total - 1) {
      await new Promise<void>((resolve) => {
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(() => resolve());
        } else {
          setTimeout(resolve, 0);
        }
      });
    }
  }

  return results;
}
