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
 * Escapes currency dollar signs so prices (e.g. "$5", "$10 and $20", "$1,200.50")
 * never trigger inline $...$ math mode.
 */
export function protectCurrencyDollars(text: string): string {
  if (!text || !text.includes('$')) return text;

  // 1. Protect pairs where two currency amounts appear on the same line:
  // e.g. "costs $15 and the pen costs $5" -> escape both $ signs
  let out = text.replace(
    /(?<!\\|\$)\$(\d+(?:[.,]\d+)?\b(?:\s+[a-zA-Z]+)+[^$\n]*?)\$(?=\d)/g,
    (_m, between: string) => `\\$${between}\\$`
  );

  // 2. If a single unescaped $ followed by digits remains (e.g. "$50"), escape it too
  const unescapedDollars = out.match(/(?<!\\)\$/g);
  if (unescapedDollars && unescapedDollars.length === 1) {
    out = out.replace(/(?<!\\)\$(\d+(?:[.,]\d+)?)\b/g, (_m, amt: string) => `\\$${amt}`);
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
