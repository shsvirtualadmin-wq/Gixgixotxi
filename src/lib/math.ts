/**
 * Resilient KaTeX math normalization pipeline.
 * Repairs corrupted/unescaped LaTeX found in legacy database questions
 * before passing to KaTeX parser.
 */

export function normalizeMath(input: string | null | undefined): string {
  if (!input) return '';
  let s = String(input);

  // 1. Repair JavaScript control characters caused by unescaped backslashes in JSON/strings
  // \f (form feed, \x0c) -> \frac or \forall
  s = s.replace(/\x0C(?:rac)?(?=\{|\d|[a-zA-Z])/g, '\\frac');
  s = s.replace(/\x0C/g, '\\frac');
  s = s.replace(/\\forall(?![a-zA-Z])/g, '\\forall');

  // \t (tab, \x09) -> restore to \theta, \times, \tan, \tau, \text, \to, \triangle, \top
  s = s.replace(/\t(?:heta)?/g, '\\theta');
  s = s.replace(/\times(?![a-zA-Z])/g, '\\times');
  s = s.replace(/\tan(?![a-zA-Z])/g, '\\tan');
  s = s.replace(/\tau(?![a-zA-Z])/g, '\\tau');
  s = s.replace(/\text(?=\{)/g, '\\text');
  s = s.replace(/\to(?![a-zA-Z])/g, '\\to');
  s = s.replace(/\triangle(?![a-zA-Z])/g, '\\triangle');
  s = s.replace(/\top(?![a-zA-Z])/g, '\\top');
  s = s.replace(/\t/g, ' ');

  // \b (backspace, \x08) -> \beta, \bar, \binom, \begin, \bullet, \bold
  s = s.replace(/\x08(?:eta)?/g, '\\beta');
  s = s.replace(/\x08ar/g, '\\bar');
  s = s.replace(/\x08inom/g, '\\binom');
  s = s.replace(/\x08egin/g, '\\begin');
  s = s.replace(/\x08ullet/g, '\\bullet');
  s = s.replace(/\x08old/g, '\\bold');
  s = s.replace(/\x08/g, '\\beta');

  // \r (carriage return, \x0d) -> \right, \rho, \sqrt
  s = s.replace(/\r(?=ight\b)/g, '\\r');
  s = s.replace(/\r(?=ho\b)/g, '\\r');
  s = s.replace(/([})\]])\s*ight\b/g, '$1 \\right');
  s = s.replace(/(?<=[})\]])\s*ight(?=[)\]}])/g, '\\right');
  s = s.replace(/sq\r/g, '\\sqrt');

  // \v (vertical tab, \x0b) -> \vec, \varphi, \varepsilon
  s = s.replace(/\x0B(?:ec)?/g, '\\vec');
  s = s.replace(/\x0Barphi/g, '\\varphi');
  s = s.replace(/\x0B/g, '\\vec');

  // \n within math expressions -> \neq, \nu, \nabla, \neg
  s = s.replace(/([0-9a-zA-Z\$\s])\n(?=eq\b)/g, '$1 \\neq ');
  s = s.replace(/([0-9a-zA-Z\$\s])\n(?=abla\b)/g, '$1 \\nabla ');

  // 2. Collapse quadruple and triple backslashes: \\\\ -> \\, \\\frac -> \frac
  s = s.replace(/\\\\\\\\/g, '\\\\');
  s = s.replace(/\\\\\\([a-zA-Z]+)/g, '\\$1');
  s = s.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

  // 3. Normalize delimiters: \( \) to $ $, \[ \] to $$ $$
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, '\n$$$$\n$1\n$$$$\n');

  // 4. Wrap bare math commands without delimiters in $...$
  const lines = s.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    if ((trimmed.startsWith('$') && trimmed.endsWith('$')) || trimmed.startsWith('```')) {
      return line;
    }
    if (
      /\\[fF]rac\{/.test(trimmed) ||
      /\\[sS]qrt\{/.test(trimmed) ||
      /\\[iI]nt\b/.test(trimmed) ||
      /\\[sS]um\b/.test(trimmed) ||
      /\\[lL]im\b/.test(trimmed)
    ) {
      if (!trimmed.includes('$')) {
        return `$${trimmed}$`;
      }
    }
    return line;
  });
  s = processedLines.join('\n');

  // 5. Wrap inline bare math commands not enclosed in $ ... $
  const tokens = s.split(/(\$\$[\s\S]+?\$\$|\$(?!\$)[^\$\n]+?\$)/g);
  s = tokens
    .map((token) => {
      if (
        (token.startsWith('$$') && token.endsWith('$$')) ||
        (token.startsWith('$') && token.endsWith('$'))
      ) {
        return token;
      }
      let chunk = token;
      // Bare \frac{...}{...}
      chunk = chunk.replace(/(?<![\$\w\\])(\\frac\{[^{}]+\}\{[^{}]+\})(?![\$\w])/g, '$$$1$$');
      // Bare \sqrt{...}
      chunk = chunk.replace(/(?<![\$\w\\])(\\sqrt\{[^{}]+\})(?![\$\w])/g, '$$$1$$');
      // Bare exponent terms like x^2/25
      chunk = chunk.replace(/(?<![\$\w])([a-zA-Z])\^(\d+)\s*\/\s*(\d+)(?![\$\w])/g, '$\\frac{$1^{$2}}{$3}$');
      // Bare power like x^2 or y^3
      chunk = chunk.replace(/(?<![\$\w])([a-zA-Z])\^(\d+)(?![\$\w])/g, '$$$1^{$2}$$');
      // Bare common math Greek letters outside delimiters
      chunk = chunk.replace(
        /(?<![\$\w\\])(\\(?:alpha|beta|gamma|delta|theta|lambda|mu|pi|rho|sigma|omega|Delta|Omega|times|pm|cdot|approx|neq|leq|geq))\b(?![\$\w\{])/g,
        '$$$1$$'
      );
      return chunk;
    })
    .join('');

  return s;
}
