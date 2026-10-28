import katex from 'katex';

export interface KatexValidationResult {
  valid: boolean;
  errors: string[];
  mathSegmentsCount: number;
}

/**
 * Extracts all inline ($...$) and block ($$...$$) LaTeX math segments from a string
 * and validates each one strictly with `katex.renderToString(expr, { throwOnError: true })`.
 * Also rejects unclosed `$` or `$$` delimiters.
 */
export function validateMathInText(text: string): KatexValidationResult {
  const input = String(text || '');
  if (!input.includes('$')) {
    return { valid: true, errors: [], mathSegmentsCount: 0 };
  }

  const errors: string[] = [];
  const segments: Array<{ expr: string; displayMode: boolean }> = [];

  let i = 0;
  const len = input.length;

  while (i < len) {
    // Skip escaped dollar \$
    if (input[i] === '\\' && i + 1 < len && input[i + 1] === '$') {
      i += 2;
      continue;
    }

    if (input[i] === '$') {
      // Check for block math $$...$$
      if (i + 1 < len && input[i + 1] === '$') {
        const start = i + 2;
        let end = -1;
        let j = start;
        while (j < len - 1) {
          if (input[j] === '\\' && input[j + 1] === '$') {
            j += 2;
            continue;
          }
          if (input[j] === '$' && input[j + 1] === '$') {
            end = j;
            break;
          }
          j++;
        }

        if (end === -1) {
          errors.push('Unclosed block math delimiter $$...$$');
          break;
        }

        const expr = input.slice(start, end).trim();
        if (!expr) {
          errors.push('Empty block math expression $$$$');
        } else {
          segments.push({ expr, displayMode: true });
        }
        i = end + 2;
        continue;
      } else {
        // Inline math $...$
        const start = i + 1;
        let end = -1;
        let j = start;
        while (j < len) {
          if (input[j] === '\\' && j + 1 < len && input[j + 1] === '$') {
            j += 2;
            continue;
          }
          if (input[j] === '\n') {
            // Inline math should not span across blank paragraphs unclosed
          }
          if (input[j] === '$') {
            end = j;
            break;
          }
          j++;
        }

        if (end === -1) {
          errors.push('Unclosed inline math delimiter $...$');
          break;
        }

        const expr = input.slice(start, end).trim();
        if (!expr) {
          errors.push('Empty inline math expression $$');
        } else {
          segments.push({ expr, displayMode: false });
        }
        i = end + 1;
        continue;
      }
    }

    i++;
  }

  for (const seg of segments) {
    try {
      katex.renderToString(seg.expr, {
        throwOnError: true,
        displayMode: seg.displayMode,
        strict: 'ignore',
      });
    } catch (err: any) {
      const msg = err?.message || String(err);
      errors.push(`Invalid KaTeX in ${seg.displayMode ? '$$...$$' : '$...$'} ("${seg.expr.slice(0, 80)}"): ${msg}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    mathSegmentsCount: segments.length,
  };
}

/**
 * Validates both title and description of a post or comment.
 */
export function validatePostMath(title: string, description: string): KatexValidationResult {
  const titleRes = validateMathInText(title);
  const descRes = validateMathInText(description);
  return {
    valid: titleRes.valid && descRes.valid,
    errors: [...titleRes.errors, ...descRes.errors],
    mathSegmentsCount: titleRes.mathSegmentsCount + descRes.mathSegmentsCount,
  };
}
