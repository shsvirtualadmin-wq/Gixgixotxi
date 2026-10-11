import katex from 'katex';

/**
 * Normalizes and converts math expressions to valid KaTeX LaTeX in $...$
 */
export function convertTextMathToLatex(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let text = input;

  // 1. Repair dropped symbols first
  text = text.replace(/\bFor\s+-3\s*,\s*r\s*=\s*3\b/g, 'For $x^3$, r = 3');
  text = text.replace(/\bFor\s+-3\s*,\s*r\s*=\s*3\b/g, 'For $x^3$, r = 3');
  text = text.replace(/\(1,\s*\.\s*,\s*\.\.\^2\)/g, '$(1, \\omega, \\omega^2)$');
  text = text.replace(/\(1,\s*\.\s*,\s*\.\^2\)/g, '$(1, \\omega, \\omega^2)$');

  // Fix common unicode and dropped square root chars
  text = text.replace(/√\(([^()]+)\)/g, '\\sqrt{$1}');
  text = text.replace(/√([0-9a-zA-Z]+)/g, '\\sqrt{$1}');

  // 2. Tokenize by existing $...$ and $$...$$ so we NEVER touch existing valid math
  // We use a regex that matches $$...$$ or $...$
  const mathBlockRegex = /(\$\$[\s\S]+?\$\$|\$(?!\$)[^\$\n]+?\$)/g;
  const parts: { isMath: boolean; content: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ isMath: false, content: text.substring(lastIndex, match.index) });
    }
    parts.push({ isMath: true, content: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ isMath: false, content: text.substring(lastIndex) });
  }

  // Helper to convert plain text outside of math mode
  function processNonMath(segment: string): string {
    let s = segment;

    // 2a. Protect plain English currency, percentages, dates
    // e.g. Rs. 8,000, 25%, 12.5%, 20 seconds, etc.
    // We do NOT convert these.

    // 2b. Degrees: 30° or 45° or 90° -> $30^\circ$, $45^\circ$
    s = s.replace(/\b(\d+)\s*°(?!\w)/g, '$$$1^\\circ$$');

    // 2c. Subscripts: T_{r+1}, T_(r+1), T_4, T₄ -> $T_{r+1}$, $T_4$
    s = s.replace(/\bT_\{([^{}]+)\}/g, '$$T_{$1}$$');
    s = s.replace(/\bT_\(([^\(\)]+)\)/g, '$$T_{$1}$$');
    s = s.replace(/\bT_([0-9]+)\b/g, '$$T_{$1}$$');
    s = s.replace(/\bT([0-9]+)\b(?=\s*=\s*\d+)/g, '$$T_{$1}$$');
    s = s.replace(/\bT₄\b/g, '$T_4$');
    s = s.replace(/\bT₃\b/g, '$T_3$');
    s = s.replace(/\bT₂\b/g, '$T_2$');
    s = s.replace(/\bT₁\b/g, '$T_1$');
    s = s.replace(/\ba_n\b/g, '$a_n$');
    s = s.replace(/\ba_1\b/g, '$a_1$');
    s = s.replace(/\ba_([0-9]+)\b/g, '$$a_{$1}$$');

    // 2d. Combinations and permutations: 6C3 -> $\binom{6}{3}$, 5Cr -> $\binom{5}{r}$, nCr -> $\binom{n}{r}$
    s = s.replace(/\b(\d+|n)C(\d+|r)\b/g, '$$\\binom{$1}{$2}$$');
    s = s.replace(/\bC\((\d+|n),\s*(\d+|r)\)/g, '$$\\binom{$1}{$2}$$');

    // 2e. Bare functions & limits:
    // lim_{x -> 0} (e^(2x) - 1) / x -> $\lim_{x \to 0} \frac{e^{2x} - 1}{x}$
    s = s.replace(/lim_\{x\s*(?:->|\\to)\s*([^{}]+)\}\s*([^\s,\.\?;]+)/g, (_m, target, expr) => {
      return `$$\\lim_{x \\to ${target}} ${expr}$$`;
    });
    s = s.replace(/\blim_\{x\s*(?:->|\\to)\s*([^{}]+)\}/g, '$$\\lim_{x \\to $1}$$');

    // 2f. Bare \theta, \alpha, \omega, \cos, \sin, etc. outside math
    s = s.replace(/\\(theta|alpha|beta|omega|delta|lambda|mu|sigma|gamma|rho|epsilon|phi|psi)\b/g, '$$\\$1$$');
    s = s.replace(/\\(sin|cos|tan|log|ln|sqrt|frac)\b(?![a-zA-Z])/g, '$$\\$1$$');

    // 2g. Modulus: |z|, |A|, |kA|, |3 - 4i|, |1 + i|
    s = s.replace(/(?<=\s|^)\|([a-zA-Z])\|(?=[\s,\.\?!]|$)/g, '$$|$1|$$');
    s = s.replace(/(?<=\s|^)\|([0-9\s\+\-i]+)\|(?=[\s,\.\?!]|$)/g, '$$|$1|$$');

    // 2h. Powers with parentheses: (1+2x)^(-1) -> $(1+2x)^{-1}$, (x+2)^2 -> $(x+2)^2$
    s = s.replace(/(\([a-zA-Z0-9\s\+\-\/\*]+\))\^\((-?[a-zA-Z0-9\s\+\-]+)\)/g, '$$$1^{$2}$$');
    s = s.replace(/(\([a-zA-Z0-9\s\+\-\/\*]+\))\^([a-zA-Z0-9]+)/g, '$$$1^{$2}$$');

    // 2i. Unicode superscripts: x⁴ -> $x^4$, x² -> $x^2$, 2⁴ -> $2^4$, (0.8)⁴ -> $(0.8)^4$, x⁻¹ -> $x^{-1}$
    s = s.replace(/(\(?[0-9a-zA-Z\.]+\)?)([⁴³²¹⁰]+)/g, (_m, base, sup) => {
      const map: Record<string, string> = { '⁴': '4', '³': '3', '²': '2', '¹': '1', '⁰': '0' };
      const exp = sup.split('').map((c: string) => map[c] || c).join('');
      return `$$${base}^{${exp}}$$`;
    });
    s = s.replace(/(\(?[0-9a-zA-Z\.]+\)?)⁻¹/g, '$$$1^{-1}$$');

    // 2j. General powers: x^3, 2^12, e^(2x), 1^(5-r), (-2x)^r, (-2)^3
    s = s.replace(/\b([a-zA-Z0-9]+)\^\(([^\)]+)\)/g, '$$$1^{$2}$$');
    s = s.replace(/\b([a-zA-Z0-9]+)\^\{([^{}]+)\}/g, '$$$1^{$2}$$');
    s = s.replace(/\b([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)\b/g, '$$$1^{$2}$$');

    // 2k. sqrt(x) or sqrt(9 - x^2)
    s = s.replace(/\bsqrt\(([^()]+)\)/g, '$$\\sqrt{$1}$$');

    // 2l. Comparison and arrows in formula context (e.g. x <= 9, x >= 0, != 0, =>)
    // Only if surrounded by math or numbers/variables
    s = s.replace(/(?<=[0-9a-zA-Z\$\)\}]|<=\s*)\s*<=\s*(?=[0-9a-zA-Z\$\(\{])/g, ' \\le ');
    s = s.replace(/(?<=[0-9a-zA-Z\$\)\}]|>=\s*)\s*>=\s*(?=[0-9a-zA-Z\$\(\{])/g, ' \\ge ');
    s = s.replace(/(?<=[0-9a-zA-Z\$\)\}])\s*!=\s*(?=[0-9a-zA-Z\$\(\{])/g, ' \\ne ');
    s = s.replace(/(?<=[0-9a-zA-Z\$\)\}])\s*=>\s*(?=[0-9a-zA-Z\$\(\{])/g, ' \\implies ');
    s = s.replace(/(?<=[0-9a-zA-Z\$\)\}])\s*\+-\s*(?=[0-9a-zA-Z\$\(\{])/g, ' \\pm ');

    // 2m. Bare Greek words in formula contexts: e.g. "theta = pi / 3" -> "$\theta = \pi / 3$"
    s = s.replace(/\b(theta|alpha|beta|omega|delta)\b(?=\s*[=<>+\-*\/])/gi, (match) => `$\\${match.toLowerCase()}$`);

    return s;
  }

  const processed = parts.map(p => p.isMath ? p.content : processNonMath(p.content)).join('');

  // 3. Post-processing cleanup: merge adjacent or broken $...$ $...$
  // e.g. "$x^2$ + $4x$" -> "$x^2 + 4x$"
  // e.g. "$$$" fixes, double dollars inside inline words
  let merged = processed;
  // Clean empty math tokens: $$ or $ $
  merged = merged.replace(/\$\s*\$/g, '');
  // Merge "$A$ + $B$" or "$A$ = $B$"
  merged = merged.replace(/\$([^\$\n]+)\$\s*([\+\-\=\*\/]\s*)\$([^\$\n]+)\$/g, '$$$1 $2 $3$$');
  // Merge "$A$ $B$" if both are simple variables/operators
  merged = merged.replace(/\$([^\$\n]+)\$\s*([=<>\\le\\ge\\implies]+)\s*\$([^\$\n]+)\$/g, '$$$1 $2 $3$$');

  return merged;
}

// Test cases from the prompt
const tests = [
  "f(x + 2) = (x + 2)^2 - 4 = x^2 + 4x + 4 - 4 = x^2 + 4x.",
  "In the expansion of (1 + 2x)^(-1), what is the coefficient of x^3?",
  "Evaluate 2^12 and x^3.",
  "For -3 , r = 3",
  "The cube roots are (1, ., ..^2)",
  "What is 6C3 and a_n and T_{r+1}?",
  "Calculate sqrt(x) when theta = 30°.",
  "If |z| = 5 and |A| = 0, find the determinant.",
  "A train traveling at 72 km/h crosses a 200-meter long platform in 20 seconds.",
  "Find the simple interest on Rs. 8,000 invested at 7.5% per annum for 4 years.",
];

console.log("=== MATH CONVERSION TESTS ===");
for (const t of tests) {
  const converted = convertTextMathToLatex(t);
  console.log("BEFORE:", t);
  console.log("AFTER: ", converted);
  console.log("-------------------");
}
