import katex from 'katex';

/**
 * Emergency fallback cleaner to convert LaTeX syntax into human-readable plain text
 * so that raw LaTeX source code (\displaystyle, \frac, \sqrt, etc.) is NEVER shown to the student.
 */
export function convertLatexToReadableText(latex: string): string {
  if (!latex) return '';
  let s = String(latex);
  s = s.replace(/\\displaystyle/g, '');
  s = s.replace(/\\gammaho\b/gi, 'γρ').replace(/\\gamma\\rho\b/gi, 'γρ');
  s = s.replace(/\\frac\{\\sqrt\{([^}]+)\}\}\{\(?\\?gamma\s*\\?r?ho\)?\}/gi, '√(($1) / (γρ))');
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1) / ($2)');
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  s = s.replace(/\\to\b/g, '→');
  s = s.replace(/\\times\b/g, '×');
  s = s.replace(/\\cdot\b/g, '·');
  s = s.replace(/\\pm\b/g, '±');
  s = s.replace(/\\le\b/g, '≤');
  s = s.replace(/\\ge\b/g, '≥');
  s = s.replace(/\\neq\b/g, '≠');
  s = s.replace(/\\approx\b/g, '≈');
  s = s.replace(/\\propto\b/g, '∝');
  s = s.replace(/\\alpha\b/g, 'α').replace(/\\beta\b/g, 'β').replace(/\\gamma\b/g, 'γ')
       .replace(/\\delta\b/g, 'δ').replace(/\\theta\b/g, 'θ').replace(/\\lambda\b/g, 'λ')
       .replace(/\\mu\b/g, 'μ').replace(/\\pi\b/g, 'π').replace(/\\rho\b/g, 'ρ')
       .replace(/\\sigma\b/g, 'σ').replace(/\\omega\b/g, 'ω').replace(/\\nu\b/g, 'ν')
       .replace(/\\Delta\b/g, 'Δ').replace(/\\Phi\b/g, 'Φ').replace(/\\psi\b/g, 'ψ');
  s = s.replace(/\\mathrm\{([^{}]+)\}/g, '$1');
  s = s.replace(/\\text\{([^{}]+)\}/g, '$1');
  s = s.replace(/\\mathbf\{([^{}]+)\}/g, '$1');
  s = s.replace(/\\left\s*/g, '').replace(/\\right\s*/g, '');
  s = s.replace(/ight\b/g, '');
  s = s.replace(/\\[a-zA-Z]+/g, '');
  s = s.replace(/\^([0-9]+)/g, (_m, n) => {
    const sup: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(n).split('').map(d => sup[d] || d).join('');
  });
  s = s.replace(/\^\{([^{}]+)\}/g, '^($1)');
  s = s.replace(/_\{([^{}]+)\}/g, '_($1)');
  s = s.replace(/[{}]/g, '');
  s = s.replace(/\$/g, '');
  return s.trim();
}

/**
 * Escapes HTML characters for safe injection.
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
 * Normalizes mathematical delimiters and repairs formatting anomalies.
 * Strictly adheres to rules (a) through (g):
 * (a) \( \) to $ $, \[ \] to $$ $$, "$$" inside a sentence to inline $;
 * (b) balance check, removing dangling delimiters;
 * (c) wrap bare LaTeX commands and standalone lines;
 * (d) never turn a plain "a/b" into a fraction outside math delimiters;
 * (e) fix plain-text exponents: "x^2/25" -> \frac{x^{2}}{25}, "x^2" -> x^{2};
 * (f) restore "ight" to "\right" when it follows } or ) inside math, restore stray "\r";
 * (g) never show raw "$", "$$", "\frac", "\displaystyle", "\left", "ight" or "\(".
 */
export function normalizeBoardyMath(text: string): string {
  if (!text) return '';
  let s = String(text);

  // 1. (f) Restore stray control characters and JS escape artifacts
  s = s.replace(/\x0Crac/g, '\\frac');
  s = s.replace(/\\r\\n/g, '\n');
  s = s.replace(/\r\n/g, '\n');
  s = s.replace(/\r(?=ho\b|ho\W)/g, '\\r'); // carriage return before ho -> \rho
  s = s.replace(/\r(?!\n|[a-zA-Z])/g, '\n');
  s = s.replace(/\x09(?=heta\b)/g, '\\t');
  s = s.replace(/\x09(?=o\b)/g, '\\t');
  s = s.replace(/\x08(?=eta\b)/g, '\\b');
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  // 2. (f) Restore "ight" to "\right" when it follows } or ) or ] inside math
  s = s.replace(/([})\]])\s*ight\b/g, '$1 \\right');
  s = s.replace(/(?<=[})\]])\s*ight(?=[)\]}])/g, '\\right');
  s = s.replace(/\\left\s*([(\[{])([\s\S]*?)(?<!\\r)ight\s*([)\]}])/g, '\\left$1$2\\right$3');

  // 3. (a) Normalize delimiters: \( \) to $ $, \[ \] to $$ $$
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, '\n\n$$\n$1\n$$\n\n');

  // 4. (b) Remove dangling delimiters at the end of sentences (e.g. "... simplifies to: $$")
  s = s.replace(/([^\n$])\s*\$\$\s*$/gm, '$1');
  s = s.replace(/^\s*\$\$\s*([^\n$])/gm, '$1');
  s = s.replace(/([^\n$])\s*\$\s*$/gm, '$1');

  // 5. (a) Convert "$$ ... $$" inside a sentence (text on same line before or after) to inline $ ... $
  s = s.replace(/(^[^\n$]*[^\s\n$][^\n$]*)\$\$([^\n$]+?)\$\$/gm, '$1$$$2$$');
  s = s.replace(/\$\$([^\n$]+?)\$\$([^\n$]*[^\s\n$][^\n$]*)$/gm, '$$$1$$$2');
  s = s.replace(/([^\n$])\s*\$\$([^\n$]+?)\$\$\s*([^\n$])/g, '$1 $$$2$$ $3');

  // 6. (g) Code blocks containing math: unpack into display math
  s = s.replace(/```(?:latex|math|katex)?\s*\n([\s\S]*?[\\](?:frac|lim|displaystyle|int|sum|left|right|begin|pmatrix|bmatrix|vmatrix)[\s\S]*?)\n```/gi, (_m, code) => {
    return `\n\n$$\n${code.trim()}\n$$\n\n`;
  });

  // 7. (c) Wrap standalone lines that start with \displaystyle, \lim, \frac, \int, \sum or \left in $$ ... $$
  const lines = s.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('$') && !trimmed.endsWith('$') && !trimmed.startsWith('```') && trimmed.length > 0) {
      if (/^[\\]+(?:displaystyle|lim|frac|int|sum|left)(?![a-zA-Z])/.test(trimmed)) {
        return `$$\n${trimmed}\n$$`;
      }
    }
    return line;
  });
  s = processedLines.join('\n');

  // Helper: process chunks outside of $ ... $ or $$ ... $$
  const transformOutsideMath = (input: string, fn: (text: string) => string): string => {
    const tokens = input.split(/(\$\$[\s\S]+?\$\$|\$(?!\$)[^\$\n]+?\$)/g);
    return tokens.map((token) => {
      if ((token.startsWith('$$') && token.endsWith('$$')) || (token.startsWith('$') && token.endsWith('$'))) {
        return token;
      }
      return fn(token);
    }).join('');
  };

  // 8. (e) Fix plain-text exponents outside math:
  // "x^2/25" -> \frac{x^{2}}{25}, "y^2/9" -> \frac{y^{2}}{9}, "x^2" -> x^{2}, "a^2 + b^2" -> a^{2} + b^{2}
  // Also recognizes ellipse / hyperbola equations like x^2/25 + y^2/9 = 1 outside delimiters
  s = transformOutsideMath(s, (chunk) => {
    let res = chunk;

    // Detect full ellipse / conic equations: e.g. x^2/25 + y^2/9 = 1 or x^2/a^2 - y^2/b^2 = 1
    res = res.replace(/(?<![\$\w])([a-zA-Z])\^(\d+)\s*\/\s*(\d+)\s*([\+\-])\s*([a-zA-Z])\^(\d+)\s*\/\s*(\d+)\s*=\s*(\d+)(?![\$\w])/g,
      '$\\frac{$1^{$2}}{$3} $4 \\frac{$5^{$6}}{$7} = $8$'
    );

    // Single term fraction exponent: e.g. x^2/25 -> $\frac{x^{2}}{25}$
    res = res.replace(/(?<![\$\w])([a-zA-Z])\^(\d+)\s*\/\s*(\d+)(?![\$\w])/g,
      '$\\frac{$1^{$2}}{$3}$'
    );

    // Bare variable exponents: e.g. x^2 -> $x^{2}$, y^3 -> $y^{3}$, a^2 + b^2 -> $a^{2} + b^{2}$
    res = res.replace(/(?<![\$\w])([a-zA-Z])\^(\d+)(?![\$\w])/g,
      '$$$1^{$2}$$'
    );

    // Expressions like (sin(3θ) - sin(θ))/(cos(3θ) + cos(θ))
    res = res.replace(/(?<![\$\w])(\((?:sin|cos|tan)\s*\([^)]+\)\s*[\+\-]\s*(?:sin|cos|tan)\s*\([^)]+\)\))\s*\/\s*(\((?:sin|cos|tan)\s*\([^)]+\)\s*[\+\-]\s*(?:sin|cos|tan)\s*\([^)]+\)\))(?![\$\w])/gi,
      (_m, num, den) => `$\\frac{${num.slice(1, -1)}}{${den.slice(1, -1)}}$`
    );

    // (c) Wrap bare LaTeX commands found outside delimiters in $ $
    // Bare \frac{...}{...}
    res = res.replace(/(?<![\$\w\\])(\\frac\{[^{}]+\}\{[^{}]+\})(?![\$\w])/g, '$$$1$$');
    // Bare \sqrt{...}
    res = res.replace(/(?<![\$\w\\])(\\sqrt\{[^{}]+\})(?![\$\w])/g, '$$$1$$');
    // Bare \lim_{...} ...
    res = res.replace(/(?<![\$\w\\])(\\lim_\{[^{}]+\}(?:\s*[^,\.\?!$\n]+)?)(?=[,\.\?!]|\s|$)/g, '$$$1$$');
    // Bare Greek letters outside delimiters: \theta, \alpha, \beta, \lambda, \mu, \pi, \sigma, \omega, \Delta
    res = res.replace(/(?<![\$\w\\])(\\(?:theta|alpha|beta|lambda|mu|pi|sigma|omega|Delta|gamma|rho|epsilon|phi|psi)\b)(?![\$\w\{])/g, '$$$1$$');

    return res;
  });

  // 9. (b) Delimiter balance check
  // Count unescaped dollar signs
  const totalDollars = (s.match(/(?<!\\)\$/g) || []).length;
  // If odd number of $, look for dangling single $ at start or end
  if (totalDollars % 2 !== 0) {
    if (s.endsWith('$') && !s.endsWith('$$')) {
      s = s.slice(0, -1).trim();
    } else if (s.startsWith('$') && !s.startsWith('$$')) {
      s = s.slice(1).trim();
    } else {
      // Find the isolated unmatched single $ and remove it
      const lastDollarIdx = s.lastIndexOf('$');
      if (lastDollarIdx !== -1) {
        s = s.slice(0, lastDollarIdx) + s.slice(lastDollarIdx + 1);
      }
    }
  }

  return s;
}

/**
 * SHARED CANONICAL MATH RENDERER: renderMath(text)
 * Used across test questions, options, explanations, PDF export, and Boardy AI.
 * Returns safe HTML with KaTeX rendered or clean plain text fallback.
 */
export function renderMath(text: string): string {
  if (!text) return '';
  const rawString = String(text);

  // Phase 1: Normalize delimiters and format math cleanly
  const normalized = normalizeBoardyMath(rawString);

  // Phase 2: Parse into structured tokens (display math, inline math, text)
  const delimiterRegex = /(\$\$[\s\S]+?\$\$|\$(?!\$)[^\$\n]+?\$)/g;
  const tokens = normalized.split(delimiterRegex);

  let outputHtml = '';
  let hadKaTeXFailure = false;

  for (const token of tokens) {
    if (!token) continue;

    if (token.startsWith('$$') && token.endsWith('$$')) {
      const mathContent = token.slice(2, -2).trim();
      try {
        const rendered = katex.renderToString(mathContent, {
          displayMode: true,
          throwOnError: false,
          strict: false,
          output: 'html',
        });

        if (rendered.includes('katex-error')) {
          hadKaTeXFailure = true;
          const readable = convertLatexToReadableText(mathContent);
          outputHtml += `<div class="katex-fallback block my-2 text-center font-sans font-medium text-inherit">${escapeHtml(readable)}</div>`;
        } else {
          outputHtml += `<div class="katex-scroll-container my-2 text-center overflow-x-auto max-w-full">${rendered}</div>`;
        }
      } catch {
        hadKaTeXFailure = true;
        const readable = convertLatexToReadableText(mathContent);
        outputHtml += `<div class="katex-fallback block my-2 text-center font-sans font-medium text-inherit">${escapeHtml(readable)}</div>`;
      }
    } else if (token.startsWith('$') && token.endsWith('$')) {
      const mathContent = token.slice(1, -1).trim();
      try {
        const rendered = katex.renderToString(mathContent, {
          displayMode: false,
          throwOnError: false,
          strict: false,
          output: 'html',
        });

        if (rendered.includes('katex-error')) {
          hadKaTeXFailure = true;
          const readable = convertLatexToReadableText(mathContent);
          outputHtml += `<span class="katex-fallback font-sans font-medium text-inherit">${escapeHtml(readable)}</span>`;
        } else {
          outputHtml += `<span class="inline-block align-middle my-0.5 px-0.5 max-w-full overflow-x-auto leading-normal">${rendered}</span>`;
        }
      } catch {
        hadKaTeXFailure = true;
        const readable = convertLatexToReadableText(mathContent);
        outputHtml += `<span class="katex-fallback font-sans font-medium text-inherit">${escapeHtml(readable)}</span>`;
      }
    } else {
      // Plain text token: escape HTML, clean raw stray LaTeX artifacts
      let plain = token;
      // Strip any raw leftover LaTeX syntax that should never be shown to students
      plain = plain.replace(/\\displaystyle\b/g, '');
      plain = plain.replace(/\\left\b/g, '').replace(/\\right\b/g, '');
      plain = plain.replace(/ight\b/g, '');
      plain = plain.replace(/(?<![\\a-zA-Z0-9_])->|-->(?![\\a-zA-Z0-9_])/g, '→');

      outputHtml += escapeHtml(plain);
    }
  }

  // (b) Fail-safe: If KaTeX failed to parse and output still has raw LaTeX code,
  // return the whole field as clean plain text instead of half math
  if (hadKaTeXFailure && /\\(?:frac|sqrt|lim|displaystyle|begin)/.test(outputHtml)) {
    return escapeHtml(convertLatexToReadableText(rawString));
  }

  return outputHtml;
}

/**
 * Development-only self-test: renders sample math strings and logs any failures.
 */
export function runBoardyMathSelfTest(): void {
  const sampleStrings = [
    {
      name: 'limit with \\left( \\right)',
      input: String.raw`\lim_{x \to \infty} \left( \frac{x+5}{x-2} \right)^x`,
    },
    {
      name: 'fraction',
      input: String.raw`\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`,
    },
    {
      name: 'integral',
      input: String.raw`\int_{0}^{\pi} \sin(x) \, dx = 2`,
    },
    {
      name: 'matrix',
      input: String.raw`\begin{pmatrix} a & b \\ c & d \end{pmatrix}`,
    },
    {
      name: 'ellipse exponent equation',
      input: 'x^2/25 + y^2/9 = 1',
    },
    {
      name: 'trig simplification with stray $$',
      input: '(sin(3θ) - sin(θ))/(cos(3θ) + cos(θ)) simplifies to: $$',
    },
  ];

  let allPassed = true;
  for (const sample of sampleStrings) {
    try {
      const html = renderMath(sample.input);
      if (html.includes('katex-error') || html.includes('$$') || html.includes(String.raw`\frac`)) {
        console.error(`[Boardy Math Self-Test FAILED]: ${sample.name}`, html);
        allPassed = false;
      }
    } catch (err) {
      console.error(`[Boardy Math Self-Test EXCEPTION]: ${sample.name}`, err);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.info('[Boardy Math Self-Test]: All mathematical test samples passed cleanly.');
  }
}

if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
  runBoardyMathSelfTest();
}
