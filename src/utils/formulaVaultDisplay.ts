import type { D1FormulaItemRow } from '../constants/formulaVaultSeed';

/**
 * Removes a redundant leading chapter number prefix from a chapter title
 * (e.g. "1 Number System", "01. Number System", "Chapter 1: Number System" -> "Number System")
 * so the chapter number is never rendered twice next to a chapter badge.
 */
export function stripLeadingChapterNumber(
  title?: string | null,
  chapterNo?: number | string | null
): string {
  const raw = String(title || '').trim();
  if (!raw) return '';

  const num = Number(chapterNo);
  if (Number.isFinite(num) && num > 0) {
    const escapedNum = String(Math.trunc(num));
    // Matches "1 Title", "01 Title", "01. Title", "1) Title", "1 - Title", "Chapter 1: Title"
    // Does NOT match ordinals like "1st Law" because the separator requires whitespace or punctuation.
    const exactPrefix = new RegExp(
      `^(?:chapter\\s+)?0*${escapedNum}(?:\\s*[.):–—-]\\s*|\\s+)`,
      'i'
    );
    const stripped = raw.replace(exactPrefix, '').trim();
    if (stripped) return stripped;
  }

  return raw;
}

/**
 * Formats a chapter number and title with the chapter number shown strictly once
 * (e.g. "01 Number System"), even if the raw title already started with the chapter number.
 */
export function formatChapterTitleWithNumber(
  chapterNo?: number | string | null,
  title?: string | null,
  options?: { padDigits?: number }
): string {
  const cleanTitle = stripLeadingChapterNumber(title, chapterNo);
  const num = Number(chapterNo);
  if (!Number.isFinite(num) || num <= 0) {
    return cleanTitle;
  }
  const padDigits = options?.padDigits ?? 2;
  const formattedNo =
    padDigits > 1 ? String(Math.trunc(num)).padStart(padDigits, '0') : String(Math.trunc(num));
  return cleanTitle ? `${formattedNo} ${cleanTitle}` : formattedNo;
}

/**
 * Splits a multi-clause LaTeX formula (such as equations separated by top-level
 * `, \qquad`, `, \quad`, `; \quad`, `\qquad`, or top-level `\\`) into individual
 * renderable segments so wide compound formulas can wrap neatly across lines instead
 * of clipping horizontally.
 *
 * Never splits inside `{...}` groups or `\begin{...}...\end{...}` environments
 * (such as `\begin{cases}...\end{cases}` or matrices).
 */
export function splitCompoundFormulaLatex(latex?: string | null): string[] {
  const raw = String(latex || '').trim();
  if (!raw) return [];

  const segments: string[] = [];
  let current = '';
  let braceDepth = 0;
  let envDepth = 0;
  let i = 0;

  const pushCurrent = () => {
    const trimmed = current.trim();
    if (trimmed) segments.push(trimmed);
    current = '';
  };

  while (i < raw.length) {
    const rest = raw.slice(i);

    if (rest.startsWith('\\begin{')) {
      const closeIdx = raw.indexOf('}', i + 7);
      if (closeIdx !== -1) {
        envDepth++;
        current += raw.slice(i, closeIdx + 1);
        i = closeIdx + 1;
        continue;
      }
    }

    if (rest.startsWith('\\end{')) {
      const closeIdx = raw.indexOf('}', i + 5);
      if (closeIdx !== -1) {
        envDepth = Math.max(0, envDepth - 1);
        current += raw.slice(i, closeIdx + 1);
        i = closeIdx + 1;
        continue;
      }
    }

    const ch = raw[i];
    if (ch === '\\' && i + 1 < raw.length && (raw[i + 1] === '{' || raw[i + 1] === '}')) {
      current += raw.slice(i, i + 2);
      i += 2;
      continue;
    }

    if (ch === '{') {
      braceDepth++;
      current += ch;
      i++;
      continue;
    }
    if (ch === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
      current += ch;
      i++;
      continue;
    }

    if (braceDepth === 0 && envDepth === 0) {
      // Split on top-level `, \qquad`, `, \quad`, `; \qquad`, `; \quad`
      const punctSpacerMatch = rest.match(/^([,;])\s*\\q?quad(?![a-zA-Z])\s*/);
      if (punctSpacerMatch) {
        current += punctSpacerMatch[1];
        pushCurrent();
        i += punctSpacerMatch[0].length;
        continue;
      }

      // Split on top-level `\qquad`
      const qquadMatch = rest.match(/^\\qquad(?![a-zA-Z])\s*/);
      if (qquadMatch) {
        pushCurrent();
        i += qquadMatch[0].length;
        continue;
      }

      // Split on top-level explicit LaTeX line break `\\` (outside environments)
      const lineBreakMatch = rest.match(/^\\\\(?:\s*\[[^\]]*\])?\s*/);
      if (lineBreakMatch) {
        pushCurrent();
        i += lineBreakMatch[0].length;
        continue;
      }
    }

    current += ch;
    i++;
  }

  pushCurrent();
  return segments.length > 0 ? segments : [raw];
}

/**
 * Builds a deterministic, deduplicated, sorted pager pool for the enlarged formula dialog
 * and guarantees the target formula is present in the pool so Previous/Next navigation works.
 */
export function buildEnlargedFormulaPool<T extends Pick<D1FormulaItemRow, 'id' | 'formula_no' | 'sort_order'>>(
  targetFormula: T,
  candidates: readonly T[]
): T[] {
  const byId = new Map<string, T>();
  for (const item of candidates) {
    if (item && item.id) {
      byId.set(item.id, item);
    }
  }
  if (!byId.has(targetFormula.id)) {
    byId.set(targetFormula.id, targetFormula);
  }
  return Array.from(byId.values()).sort(
    (a, b) =>
      Number(a.formula_no || 0) - Number(b.formula_no || 0) ||
      Number(a.sort_order || 0) - Number(b.sort_order || 0)
  );
}
