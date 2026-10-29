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
 * Deterministically repairs common LLM LaTeX syntax quirks inside $...$ and $$...$$
 * (such as \begin{align*} -> \begin{aligned}, \begin{equation*}, unescaped %, etc.)
 * BEFORE running strict katex.renderToString({ throwOnError: true }) validation.
 */
export function repairLatexLocally(text: string): string {
  const input = String(text || '');
  if (!input.includes('$')) return input;

  const fixMathSegment = (expr: string): string => {
    let fixed = expr
      .replace(/\\begin\{align\*?\}/g, '\\begin{aligned}')
      .replace(/\\end\{align\*?\}/g, '\\end{aligned}')
      .replace(/\\begin\{equation\*?\}/g, '')
      .replace(/\\end\{equation\*?\}/g, '')
      .replace(/\\begin\{gather\*?\}/g, '\\begin{gathered}')
      .replace(/\\end\{gather\*?\}/g, '\\end{gathered}')
      .replace(/(?<!\\)%/g, '\\%');

    // Balance simple unclosed curly braces inside a math segment
    let openBraces = 0;
    for (let k = 0; k < fixed.length; k++) {
      if (fixed[k] === '\\') {
        k++;
        continue;
      }
      if (fixed[k] === '{') openBraces++;
      else if (fixed[k] === '}' && openBraces > 0) openBraces--;
    }
    if (openBraces > 0 && openBraces <= 3) {
      fixed = fixed + '}'.repeat(openBraces);
    }
    return fixed.trim();
  };

  // Replace block $$...$$ first, then inline $...$
  let out = input.replace(/\$\$([\s\S]*?)\$\$/g, (_match, inner) => {
    const cleaned = fixMathSegment(String(inner || ''));
    return cleaned ? `$$${cleaned}$$` : '';
  });

  out = out.replace(/(?<!\$)\$(?!\$)([^\n$]+?)\$(?!\$)/g, (_match, inner) => {
    const cleaned = fixMathSegment(String(inner || ''));
    return cleaned ? `$${cleaned}$` : '';
  });

  return out;
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

export function normalizeQuestionMathDelimiters(raw: string): string {
  let text = String(raw || '').trim();
  if (!text) return '';
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `$$${String(inner).trim()}$$`);
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${String(inner).trim()}$`);
  text = text.replace(/\\ce\{([^{}]*)\}/g, (_m, formula) => `\\text{${formula}}`);
  return repairLatexLocally(text);
}

export function validateAndNormalizeQuestionMath(
  questionText: string,
  options: string[],
  explanation: string
): {
  questionText: string;
  options: [string, string, string, string];
  explanation: string;
  valid: boolean;
  errors: string[];
} {
  const normQ = normalizeQuestionMathDelimiters(questionText);
  const normOpts: [string, string, string, string] = [
    normalizeQuestionMathDelimiters(options[0] || ''),
    normalizeQuestionMathDelimiters(options[1] || ''),
    normalizeQuestionMathDelimiters(options[2] || ''),
    normalizeQuestionMathDelimiters(options[3] || ''),
  ];
  const normExp = normalizeQuestionMathDelimiters(explanation);

  const errors: string[] = [];
  const qCheck = validateMathInText(normQ);
  if (!qCheck.valid) errors.push(...qCheck.errors.map((e) => `question_text: ${e}`));

  normOpts.forEach((opt, idx) => {
    const oCheck = validateMathInText(opt);
    if (!oCheck.valid) errors.push(...oCheck.errors.map((e) => `option_${idx}: ${e}`));
  });

  const expCheck = validateMathInText(normExp);
  if (!expCheck.valid) errors.push(...expCheck.errors.map((e) => `explanation: ${e}`));

  return {
    questionText: normQ,
    options: normOpts,
    explanation: normExp,
    valid: errors.length === 0,
    errors,
  };
}


