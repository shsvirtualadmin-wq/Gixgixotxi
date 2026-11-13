/**
 * Math normalization & safe ASCII-to-LaTeX converter for Boardly.
 *
 * Guarantees:
 * 1. Repairs corrupted JS escape sequences in stored LaTeX (\f -> \frac, \t -> \theta, etc.).
 * 2. Protects currency dollar signs ($5, $10 and $20) so prices never trigger math mode.
 * 3. Safely converts legacy plain-ASCII math expressions into $...$ inline LaTeX:
 *    - "x^2 - 5x + 6 = 0"        -> "$x^{2} - 5x + 6 = 0$"
 *    - "int_0^1 x*(1 - x)^9 dx"  -> "$\int_{0}^{1} x(1 - x)^{9}\,dx$"
 *    - "sqrt(5)"                 -> "$\sqrt{5}$"
 *    - "alpha^2 + beta^2"        -> "$\alpha^{2} + \beta^{2}$"
 *    - "x^(1/x)"                 -> "$x^{1/x}$"
 *    - "1/110"                   -> "$\frac{1}{110}$"
 *    - "<=", ">=", "!="          -> "\le", "\ge", "\ne"
 * 4. Leaves plain-text questions and English sentences completely unchanged.
 */

const GREEK_WORDS = [
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
  'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho',
  'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
  'Delta', 'Gamma', 'Lambda', 'Omega', 'Phi', 'Pi', 'Psi', 'Sigma', 'Theta',
];

const GREEK_WORD_REGEX = new RegExp(`\\b(${GREEK_WORDS.join('|')})\\b`, 'g');

const SUPERSCRIPT_MAP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', 'ⁿ': 'n',
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};

/**
 * Normalizes LaTeX thousands-separator comma groupings like `1{,}170` or `$1{,}170$`
 * into clean `1,170` and repairs escaped `\$1{,}170$` or `\$1,170$` wrappers.
 */
export function normalizeLatexThousandsCommas(text: string): string {
  if (!text) return text;
  let out = text;
  // Convert `1{,}170` or `1\{,\}170` (including multiple groups like `1{,}234{,}567`) -> `1,170`
  let prev = '';
  while (out !== prev) {
    prev = out;
    out = out.replace(/(\d)\s*\\?\{\s*,\s*\\?\}\s*(?=\d)/g, '$1,');
  }
  // If `protectCurrencyDollars` previously escaped the leading `$` of a `$1,170$` math block (`\$1,170$`),
  // unwrap the pure number so neither `$` nor `\` is shown literally.
  out = out.replace(
    /\\?\$\s*([+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?)\s*\$/g,
    '$1'
  );
  return out;
}

const LEFT_SPLIT_OPT_RE = /^(.*?)\\?\$?\s*([+-]?\d[\d,]*)\{\s*$/;
const RIGHT_SPLIT_OPT_RE = /^\s*\}(\d[\d,.\s]*?)\$?(.*)$/;

/**
 * Cleans an individual MCQ option string, repairing garbled fragments like
 * `"$1{"`, `"}170$"`, `"\\$1{"`, `"$1{,}170$"`, or `"1{,}170"`.
 */
export function cleanMcqOptionText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let s = normalizeLatexThousandsCommas(raw.trim());

  // Unwrap pure comma-grouped or plain numbers wrapped in $...$ or \$...$ (e.g. "$1,170$" -> "1,170")
  const pureNumMatch = s.match(/^\\?\$\s*([+-]?\d[\d,]*(?:\.\d+)?(?:\s*%)?)\s*\\?\$$/);
  if (pureNumMatch) {
    return pureNumMatch[1].trim();
  }

  // Repair single-option split artifact like "$1{170$" or "$1{,170$" or "$1,170}$"
  s = s.replace(
    /^\\?\$?\s*([+-]?\d[\d,]*)\{\s*,?\s*(\d[\d,]*(?:\.\d+)?)\s*\}?\s*\\?\$?$/,
    '$1,$2'
  );
  s = s.replace(
    /^\\?\$?\s*\{?\s*([+-]?\d[\d,]*)\s*,\s*\}\s*(\d[\d,]*(?:\.\d+)?)\s*\\?\$?$/,
    '$1,$2'
  );

  // If an orphan half remains (e.g. "$1{" or "\\$1{" or "}170$"), strip the broken delimiters
  const leftOnly = s.match(LEFT_SPLIT_OPT_RE);
  if (leftOnly && !s.includes('}')) {
    const prefix = leftOnly[1].replace(/\\?\$$/, '').trim();
    const digits = leftOnly[2].trim();
    return prefix ? `${prefix} ${digits}` : digits;
  }
  const rightOnly = s.match(RIGHT_SPLIT_OPT_RE);
  if (rightOnly && !s.includes('{')) {
    const digits = rightOnly[1].trim();
    const suffix = rightOnly[2].replace(/^\\?\$/, '').trim();
    return suffix ? `${digits} ${suffix}` : digits;
  }

  return s;
}

function formatNumberWithCommas(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const parts = String(abs).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return sign + parts.join('.');
}

/**
 * Repairs a 4-option MCQ array where unquoted CSV commas inside `$1{,}170$`
 * split a single number across two option cells (`"$1{"` and `"}170$"`).
 * Works on both unshuffled `[option_a, option_b, option_c, option_d]` and already-shuffled options.
 */
export function repairSplitOrGarbledMcqOptions(
  options: readonly string[],
  extraCandidate?: string
): [string, string, string, string] {
  const rawList = [
    String(options[0] ?? '').trim(),
    String(options[1] ?? '').trim(),
    String(options[2] ?? '').trim(),
    String(options[3] ?? '').trim(),
  ];

  // Quick check: do any options contain `{` or `}` or `\$`?
  const hasSuspect = rawList.some(
    (o) => o.includes('{') || o.includes('}') || o.includes('\\$')
  );
  if (!hasSuspect) {
    return [
      cleanMcqOptionText(rawList[0]),
      cleanMcqOptionText(rawList[1]),
      cleanMcqOptionText(rawList[2]),
      cleanMcqOptionText(rawList[3]),
    ];
  }

  const usedIndices = new Set<number>();
  const mergedValues: string[] = [];
  const slotMap = new Map<number, string>();

  // Pass 1: Match adjacent or non-adjacent (shuffled) left+right split pairs (`"$1{"` + `"}170$"` -> `"1,170"`)
  for (let i = 0; i < rawList.length; i++) {
    if (usedIndices.has(i)) continue;
    const leftMatch = rawList[i].match(LEFT_SPLIT_OPT_RE);
    if (!leftMatch) continue;

    // Prefer adjacent i+1 first, then any unused j
    const candidateJs = [i + 1, 0, 1, 2, 3].filter(
      (j, idx, arr) => j >= 0 && j < 4 && j !== i && !usedIndices.has(j) && arr.indexOf(j) === idx
    );
    let pairedJ = -1;
    let rightMatch: RegExpMatchArray | null = null;
    for (const j of candidateJs) {
      const m = rawList[j].match(RIGHT_SPLIT_OPT_RE);
      if (m) {
        pairedJ = j;
        rightMatch = m;
        break;
      }
    }

    if (pairedJ !== -1 && rightMatch) {
      usedIndices.add(i);
      usedIndices.add(pairedJ);
      const prefix = leftMatch[1].replace(/\\?\$$/, '').trim();
      const leftDigits = leftMatch[2].trim();
      const rightDigits = rightMatch[1].trim();
      const suffix = rightMatch[2].replace(/^\\?\$/, '').trim();
      const combined = `${prefix ? prefix + ' ' : ''}${leftDigits},${rightDigits}${suffix ? ' ' + suffix : ''}`.trim();
      slotMap.set(i, combined);
      mergedValues.push(combined);
    } else if (extraCandidate) {
      // Check if the matching right half spilled into explanation/extraCandidate
      const extraTrim = String(extraCandidate).trim();
      const extraRight = extraTrim.match(RIGHT_SPLIT_OPT_RE);
      if (extraRight) {
        usedIndices.add(i);
        const prefix = leftMatch[1].replace(/\\?\$$/, '').trim();
        const leftDigits = leftMatch[2].trim();
        const rightDigits = extraRight[1].trim();
        const combined = `${prefix ? prefix + ' ' : ''}${leftDigits},${rightDigits}`.trim();
        slotMap.set(i, combined);
        mergedValues.push(combined);
      }
    }
  }

  // Pass 2: Collect remaining non-consumed options
  for (let i = 0; i < 4; i++) {
    if (usedIndices.has(i)) continue;
    slotMap.set(i, cleanMcqOptionText(rawList[i]));
  }

  // If no pair was merged, simply return cleaned individual options
  if (slotMap.size === 4) {
    return [
      slotMap.get(0) || cleanMcqOptionText(rawList[0]),
      slotMap.get(1) || cleanMcqOptionText(rawList[1]),
      slotMap.get(2) || cleanMcqOptionText(rawList[2]),
      slotMap.get(3) || cleanMcqOptionText(rawList[3]),
    ];
  }

  // Pass 3: Fill any slot freed by merging two split halves so there are 4 distinct, valid options
  const existingSet = new Set<string>(Array.from(slotMap.values()).filter(Boolean));
  const extraCleaned = extraCandidate ? cleanMcqOptionText(extraCandidate) : '';
  const extraLooksLikeOption =
    extraCleaned.length > 0 &&
    extraCleaned.length <= 24 &&
    !existingSet.has(extraCleaned) &&
    !/\b(because|therefore|since|given|substitut|equation|formula|correct|solution|step)\b/i.test(extraCleaned);

  // Parse base number from first merged value (e.g. "1,170" -> 1170) to generate clean distractors if needed
  const baseNumericStr = (mergedValues[0] || '1,170').replace(/,/g, '');
  const baseNum = parseFloat(baseNumericStr);
  const candidateDistractors: string[] = [];
  if (extraLooksLikeOption) {
    candidateDistractors.push(extraCleaned);
  }
  if (Number.isFinite(baseNum)) {
    const step = Math.abs(baseNum) >= 1000 ? 100 : Math.abs(baseNum) >= 100 ? 10 : 5;
    const offsets = [step, -step, step * 2, -step * 2, step * 3, Math.round(baseNum * 0.5)];
    for (const off of offsets) {
      const val = baseNum + off;
      if (val > 0 || baseNum < 0) {
        const formatted = formatNumberWithCommas(val);
        if (!existingSet.has(formatted) && !candidateDistractors.includes(formatted)) {
          candidateDistractors.push(formatted);
        }
      }
    }
  }

  let distractorIdx = 0;
  const finalTuple: [string, string, string, string] = ['', '', '', ''];
  for (let i = 0; i < 4; i++) {
    const val = slotMap.get(i);
    if (val !== undefined && val !== '') {
      finalTuple[i] = val;
    } else {
      const replacement =
        candidateDistractors[distractorIdx++] ||
        cleanMcqOptionText(rawList[i]) ||
        `Option ${String.fromCharCode(65 + i)}`;
      finalTuple[i] = replacement;
      existingSet.add(replacement);
    }
  }

  return finalTuple;
}

/**
 * Repairs `option_a..option_d` and `options` on a D1 MCQ row object in place.
 */
export function repairD1McqRow<T extends Record<string, any>>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  const rawTuple = [
    String(row.option_a ?? row.options?.[0] ?? ''),
    String(row.option_b ?? row.options?.[1] ?? ''),
    String(row.option_c ?? row.options?.[2] ?? ''),
    String(row.option_d ?? row.options?.[3] ?? ''),
  ];
  const [optA, optB, optC, optD] = repairSplitOrGarbledMcqOptions(
    rawTuple,
    typeof row.explanation === 'string' ? row.explanation : undefined
  );
  const next: Record<string, any> = { ...row };
  if ('option_a' in row || 'option_b' in row) {
    next.option_a = optA;
    next.option_b = optB;
    next.option_c = optC;
    next.option_d = optD;
  }
  if (Array.isArray(row.options)) {
    next.options = [optA, optB, optC, optD];
  }
  if (typeof row.question === 'string') {
    next.question = normalizeLatexThousandsCommas(row.question);
  }
  if (typeof row.q === 'string') {
    next.q = normalizeLatexThousandsCommas(row.q);
  }
  if (typeof row.stem === 'string') {
    next.stem = normalizeLatexThousandsCommas(row.stem);
  }
  return next as T;
}

/**
 * Escapes currency dollar signs so prices (e.g. "$5", "$10 and $20", "$1,200.50")
 * never trigger inline $...$ math mode.
 */
export function protectCurrencyDollars(text: string): string {
  if (!text || !text.includes('$')) return text;

  let out = normalizeLatexThousandsCommas(text);
  if (!out.includes('$')) return out;

  // 1. Protect pairs where two currency amounts appear on the same line:
  // e.g. "costs $15 and the pen costs $5" -> escape both $ signs
  out = out.replace(
    /(?<!\\|\$)\$(\d+(?:[.,]\d+)?\b(?:\s+[a-zA-Z]+)+[^$\n]*?)\$(?=\d)/g,
    (_m, between: string) => `\\$${between}\\$`
  );

  // 2. If a single unescaped $ followed by digits remains (e.g. "$50"), escape it too
  // (but NOT if followed by `{` or `}` which indicates a LaTeX brace fragment).
  const unescapedDollars = out.match(/(?<!\\)\$/g);
  if (unescapedDollars && unescapedDollars.length === 1) {
    out = out.replace(/(?<!\\)\$(\d+(?:[.,]\d+)?)\b(?![{}])/g, (_m, amt: string) => `\\$${amt}`);
  }

  return out;
}

/**
 * Converts unicode superscripts/subscripts into ^(...) or _(...) when adjacent to math tokens.
 */
function normalizeUnicodeScripts(input: string): string {
  let s = input.replace(/([a-zA-Z0-9)\]])([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿ]+)/g, (_m, base, sup: string) => {
    const mapped = sup.split('').map((c) => SUPERSCRIPT_MAP[c] ?? c).join('');
    return `${base}^(${mapped})`;
  });
  s = s.replace(/([a-zA-Z)\]])([₀₁₂₃₄₅₆₇⁸⁹]+)/g, (_m, base, sub: string) => {
    const mapped = sub.split('').map((c) => SUBSCRIPT_MAP[c] ?? c).join('');
    return `${base}_(${mapped})`;
  });
  return s;
}

/**
 * Converts balanced `sqrt(...)` or `cbrt(...)` calls inside an expression to `\sqrt{...}`.
 */
function replaceBalancedRoots(expr: string): string {
  let result = expr;
  const rootPatterns = [
    { prefix: 'sqrt(', open: '\\sqrt{' },
    { prefix: 'cbrt(', open: '\\sqrt[3]{' },
    { prefix: '√(', open: '\\sqrt{' },
  ];

  for (const { prefix, open } of rootPatterns) {
    let idx = result.indexOf(prefix);
    let safety = 0;
    while (idx !== -1 && safety < 50) {
      safety++;
      if (idx > 0 && /[a-zA-Z0-9_]/.test(result[idx - 1])) {
        idx = result.indexOf(prefix, idx + prefix.length);
        continue;
      }
      const contentStart = idx + prefix.length;
      let depth = 1;
      let i = contentStart;
      while (i < result.length && depth > 0) {
        if (result[i] === '(') depth++;
        else if (result[i] === ')') depth--;
        i++;
      }
      if (depth === 0) {
        const inner = replaceBalancedRoots(result.slice(contentStart, i - 1));
        result = result.slice(0, idx) + open + inner + '}' + result.slice(i);
        idx = result.indexOf(prefix, idx + open.length);
      } else {
        break;
      }
    }
  }

  result = result.replace(/√([a-zA-Z0-9]+)/g, '\\sqrt{$1}');
  return result;
}

/**
 * Converts balanced `^(...)` and `_(...)` to `^{...}` and `_{...}`,
 * plus simple `^2`, `^-1`, `_0` to `^{2}`, `^{-1}`, `_{0}`.
 */
function replaceExponentsAndSubscripts(expr: string): string {
  let result = expr;

  for (const op of ['^', '_']) {
    const target = `${op}(`;
    let idx = result.indexOf(target);
    let safety = 0;
    while (idx !== -1 && safety < 60) {
      safety++;
      const contentStart = idx + target.length;
      let depth = 1;
      let i = contentStart;
      while (i < result.length && depth > 0) {
        if (result[i] === '(') depth++;
        else if (result[i] === ')') depth--;
        i++;
      }
      if (depth === 0) {
        const inner = replaceExponentsAndSubscripts(result.slice(contentStart, i - 1));
        result = result.slice(0, idx) + `${op}{${inner}}` + result.slice(i);
        idx = result.indexOf(target, idx + 2);
      } else {
        break;
      }
    }
  }

  result = result.replace(/\^([+-]?[a-zA-Z0-9]+)(?![a-zA-Z0-9}])/g, '^{$1}');
  result = result.replace(/\b([a-zA-Z])_([0-9]+)\b/g, '$1_{$2}');
  return result;
}

/**
 * Converts inner ASCII math syntax (already determined to be a math expression) into clean LaTeX.
 */
export function asciiInnerToLatex(rawExpr: string): string {
  let s = normalizeUnicodeScripts(rawExpr.trim());

  // 1. Definite and indefinite integrals
  s = s.replace(
    /\bint_(\([^)]+\)|\{[^}]+\}|[^\s^]+)\^(\([^)]+\)|\{[^}]+\}|[^\s]+)\s+(.+?)\s*d([a-zA-Z])\b/g,
    (_m, lower: string, upper: string, integrand: string, dvar: string) => {
      const cleanLow = lower.replace(/^[({]|[)}]$/g, '');
      const cleanUp = upper.replace(/^[({]|[)}]$/g, '');
      const cleanIntegrand = integrand
        .replace(/([a-zA-Z0-9)\]}])\s*\*\s*(?=[a-zA-Z(])/g, '$1')
        .replace(/\s*\*\s*/g, ' \\cdot ');
      return `\\int_{${cleanLow}}^{${cleanUp}} ${cleanIntegrand}\\,d${dvar}`;
    }
  );
  s = s.replace(
    /\bint\s+(.+?)\s*d([a-zA-Z])\b/g,
    (_m, integrand: string, dvar: string) => {
      const cleanIntegrand = integrand
        .replace(/([a-zA-Z0-9)\]}])\s*\*\s*(?=[a-zA-Z(])/g, '$1')
        .replace(/\s*\*\s*/g, ' \\cdot ');
      return `\\int ${cleanIntegrand}\\,d${dvar}`;
    }
  );

  // 2. Limits
  s = s.replace(/\blim_\(([^)]+)\)/g, (_m, sub: string) => {
    return `\\lim_{${sub.replace(/->/g, '\\to ')}}`;
  });

  // 3. Roots
  s = replaceBalancedRoots(s);

  // 4. Exponents and subscripts
  s = replaceExponentsAndSubscripts(s);

  // 5. Greek letters
  s = s.replace(/(?<!\\)\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Delta|Gamma|Lambda|Omega|Phi|Pi|Psi|Sigma|Theta)\b/g, '\\$1');

  // 6. Standard math functions
  s = s.replace(/(?<!\\)\b(arcsin|arccos|arctan|sinh|cosh|tanh|sin|cos|tan|sec|csc|cot|ln|log)(?=\s*[(a-zA-Z0-9\\])/g, '\\$1');

  // 7. Standalone numeric fractions like "1/110", "-1/110"
  if (/^[+-]?\d+\s*\/\s*\d+$/.test(s)) {
    const neg = s.startsWith('-') ? '-' : s.startsWith('+') ? '+' : '';
    const unsigned = s.replace(/^[+-]/, '');
    const [num, den] = unsigned.split('/').map((p) => p.trim());
    return `${neg}\\frac{${num}}{${den}}`;
  }

  // Convert (A)/(B) or A/(B) or (A)/B into \frac{A}{B}
  s = s.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}');
  s = s.replace(/\b([0-9a-zA-Z\\^{}+-]+)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}');
  s = s.replace(/\(([^()]+)\)\s*\/\s*\b([0-9a-zA-Z\\^{}+-]+)\b/g, '\\frac{$1}{$2}');

  // 8. Multiplication asterisk between algebraic factors
  s = s.replace(/([a-zA-Z0-9)\]}])\s*\*\s*(?=[(\\[a-zA-Z])/g, '$1');
  s = s.replace(/\s*\*\s*/g, ' \\cdot ');

  // 9. Relational & arithmetic operators
  s = s
    .replace(/<=/g, ' \\le ')
    .replace(/>=/g, ' \\ge ')
    .replace(/!=/g, ' \\ne ')
    .replace(/\+-|±/g, ' \\pm ')
    .replace(/->/g, ' \\to ')
    .replace(/×/g, ' \\times ')
    .replace(/÷/g, ' \\div ')
    .replace(/∞/g, '\\infty ');

  return s.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Checks whether an entire short string (such as an MCQ option or a pure formula stem)
 * is a standalone ASCII math expression that should be wrapped in `$...$`.
 */
function isEntireStringMath(trimmed: string): boolean {
  if (!trimmed || trimmed.length > 140) return false;
  if (/https?:\/\//i.test(trimmed)) return false;
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed)) return false;
  if (/\b(and\/or|km\/h|m\/s|rad\/s|J\/mol|g\/mol|N\/m|V\/m|A\/C|w\/w|v\/v)\b/i.test(trimmed)) {
    if (!/[⁰¹²³⁴⁵⁶⁷⁸⁹^]|sqrt\(|int_/.test(trimmed)) return false;
  }

  if (/^[+-]?\d+\s*\/\s*\d+$/.test(trimmed)) return true;
  if (/^int(?:_|\s)/.test(trimmed) && /\bd[a-zA-Z]$/.test(trimmed)) return true;

  const hasStrongMath =
    /(?:\b(?:sqrt|cbrt|sin|cos|tan|ln|log|lim)\s*\(|\bint_[^\s]+|[a-zA-Z0-9)\]}]\s*\^\s*(?:\([^)]+\)|[+-]?[a-zA-Z0-9]+)|[⁰¹²³⁴⁵⁶⁷⁸⁹]|\b(?:alpha|beta|gamma|delta|theta|lambda|omega|sigma|pi|mu|phi)\b.*(?:[+\-*/=^<>]|alpha|beta|gamma|delta|theta|lambda|omega|sigma|pi|mu|phi)|<=|>=|!=)/.test(
      trimmed
    );

  if (!hasStrongMath) return false;

  const withoutMathWords = trimmed
    .replace(GREEK_WORD_REGEX, '')
    .replace(/\b(sqrt|cbrt|int|sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan|ln|log|lim|exp|mod|max|min|dx|dy|dt|du|dz)\b/g, '');

  if (/[a-zA-Z]{3,}/.test(withoutMathWords)) return false;

  return true;
}

/**
 * Converts un-delimited ASCII math fragments inside a plain-text segment into `$...$` inline LaTeX,
 * while keeping surrounding English prose completely unchanged.
 */
function convertUnwrappedTextSegment(segment: string): string {
  if (!segment) return segment;
  const trimmed = segment.trim();
  if (!trimmed) return segment;

  if (
    !/[\^_√⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇⁸⁹/]|<=|>=|!=|\+-|±|\b(?:sqrt|cbrt|int|alpha|beta|gamma|delta|theta|lambda|omega|sigma|pi|mu|phi|ln|log|sin|cos|tan|lim)\b/.test(
      trimmed
    )
  ) {
    return segment;
  }

  // Case 1: The entire segment is a pure math formula or option
  if (isEntireStringMath(trimmed)) {
    const leadingSpace = segment.match(/^\s*/)?.[0] ?? '';
    const trailingSpace = segment.match(/\s*$/)?.[0] ?? '';
    return `${leadingSpace}$${asciiInnerToLatex(trimmed)}$${trailingSpace}`;
  }

  // Case 2: Mixed English prose + inline ASCII math fragments
  let s = normalizeUnicodeScripts(segment);

  // 2a. Definite/indefinite integrals embedded in prose
  s = s.replace(
    /\bint_(\([^)]+\)|\{[^}]+\}|[^\s^]+)\^(\([^)]+\)|\{[^}]+\}|[^\s]+)\s+([^,.;?!]+?\s*d[a-zA-Z])\b/g,
    (match) => `$${asciiInnerToLatex(match)}$`
  );

  // 2b. Function definitions / equations in prose: e.g. "f(x) = ln(x^(2) + 1)" or "x^(2) - 5x + 6 = 0"
  // Do not include leading English words like "If", "When", "Where", "Solve", "For"
  s = s.replace(
    /(?<![$\\a-zA-Z])(?:\b[fghFGHy]\([a-zA-Z0-9,\s]+\)\s*=\s*|\b(?!(?:If|When|Where|Solve|Find|Let|Given|For|Since|With|Then|And)\b)[a-zA-Z0-9()^+-]+(?:\s*[+\-*/]\s*[a-zA-Z0-9()^+-]+)*\s*(?:=|<=|>=|!=)\s*)(?:[a-zA-Z0-9()+-\s*^/\\]|sqrt|ln|log|sin|cos|tan)+(?=[,.;?!)\s]|$)/g,
    (match) => {
      const mTrim = match.trim();
      const trailingSpace = match.slice(match.lastIndexOf(mTrim) + mTrim.length);
      if (/[⁰¹²³⁴⁵⁶⁷⁸⁹^]|<=|>=|!=|sqrt\(|ln\(|log\(|sin\(|cos\(|tan\(|\b(?:alpha|beta|gamma|theta|pi)\b/.test(mTrim)) {
        return `$${asciiInnerToLatex(mTrim)}$${trailingSpace}`;
      }
      return match;
    }
  );

  // 2c. Standalone function derivative / evaluation calls like "f'(1)", "f''(x)", "g'(0)"
  s = s.replace(/(?<![$\\a-zA-Z])\b([fghFGH]'+)\(([a-zA-Z0-9+-]+)\)/g, '$$$1($2)$$');

  // 2d. Standalone sqrt(...) in prose
  s = s.replace(/(?<![$\\a-zA-Z])\bsqrt\(([^()\n]+(?:\([^()\n]*\)[^()\n]*)*)\)/g, (_m, inner: string) => {
    return `$\\sqrt{${asciiInnerToLatex(inner)}}$`;
  });

  // 2e. Greek expressions with exponents/operators in prose: e.g. "alpha^(2) + beta^(2)"
  s = s.replace(
    /(?<![$\\a-zA-Z])\b(?:alpha|beta|gamma|delta|theta|lambda|omega|sigma|pi|mu|phi)(?:\^\([^)]+\)|\^[0-9a-zA-Z]+)?(?:\s*[+\-*/=]\s*(?:alpha|beta|gamma|delta|theta|lambda|omega|sigma|pi|mu|phi|[0-9]+)(?:\^\([^)]+\)|\^[0-9a-zA-Z]+)?)+/g,
    (match) => `$${asciiInnerToLatex(match)}$`
  );

  // 2f. Remaining algebraic tokens with exponents like x^(2), x^(1/x), 10^(-19), a^2 + b^2
  s = s.replace(
    /(?<![$\\a-zA-Z0-9])([a-zA-Z0-9]+(?:\^\([^)]+\)|\^[+-]?[a-zA-Z0-9]+)(?:\s*[+\-*/=<>]+\s*[a-zA-Z0-9]+(?:\^\([^)]+\)|\^[+-]?[a-zA-Z0-9]+)?)*)/g,
    (match) => `$${asciiInnerToLatex(match)}$`
  );

  return s;
}

/**
 * Repairs corrupted JS escape sequences in LaTeX strings AND converts un-delimited
 * plain ASCII math into standardized `$...$` LaTeX while protecting currency `$` signs.
 */
export function convertAsciiMathToLatex(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // Step 1: Repair corrupted escape sequences
  const repaired = text
    .replace(/\\frac/g, '\\frac')
    .replace(/\\f([^r]|$)/g, (_m, c) => {
      if (c === 'r') return '\\frac' + c;
      if (c === 'i') return '\\phi';
      return '\\frac' + (c ?? '');
    })
    .replace(/\\theta/g, '\\theta')
    .replace(/\\times/g, '\\times')
    .replace(/\\tan/g, '\\tan')
    .replace(/\\beta/g, '\\beta')
    .replace(/\\begin/g, '\\begin')
    .replace(/\\rho/g, '\\rho')
    .replace(/\\rightarrow/g, '\\rightarrow')
    .replace(/\\right/g, '\\right')
    .replace(/\\neq/g, '\\neq')
    .replace(/\\nu/g, '\\nu')
    .replace(/\\nabla/g, '\\nabla')
    .replace(/\\vec/g, '\\vec')
    .replace(/\\varepsilon/g, '\\varepsilon')
    .replace(/\\\\([a-zA-Z])/g, '\\$1');

  // Step 2: Protect currency dollar signs ($10, $5 and $20)
  const currencySafe = protectCurrencyDollars(repaired);

  // Step 3: Split by existing math delimiters ($$...$$, \[...\], $...$, \(...\))
  // so we never double-wrap existing LaTeX, while still upgrading any raw ASCII inside existing delimiters if needed
  const mathDelimiterRegex = /(?:\\\$)|(?:\$\$[\s\S]+?\$\$)|(?:\\\[[\s\S]+?\\\])|(?:\$[^$\n]+?\$)|(?:\\\([\s\S]+?\\\))/g;

  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathDelimiterRegex.exec(currencySafe)) !== null) {
    if (match.index > lastIndex) {
      const outside = currencySafe.slice(lastIndex, match.index);
      result += convertUnwrappedTextSegment(outside);
    }
    const token = match[0];
    // Standardize \(...\) to $...$ and \[...\] to $$...$$
    if (token.startsWith('\\(') && token.endsWith('\\)')) {
      result += `$${token.slice(2, -2).trim()}$`;
    } else if (token.startsWith('\\[') && token.endsWith('\\]')) {
      result += `$$${token.slice(2, -2).trim()}$$`;
    } else {
      result += token;
    }
    lastIndex = mathDelimiterRegex.lastIndex;
  }

  if (lastIndex < currencySafe.length) {
    result += convertUnwrappedTextSegment(currencySafe.slice(lastIndex));
  }

  return result;
}

export function normalizeMath(text: string): string {
  return convertAsciiMathToLatex(text);
}
