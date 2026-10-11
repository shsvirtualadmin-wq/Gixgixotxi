import fs from 'fs';
import path from 'path';
import katex from 'katex';

export function convertMathClean(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText;

  // Restore JS string escape artifacts
  text = text.replace(/\x09(?=heta\b)/g, '\\t');
  text = text.replace(/\x09(?=o\b)/g, '\\t');
  text = text.replace(/\x08(?=eta\b)/g, '\\b');
  text = text.replace(/\r(?=ho\b|ho\W)/g, '\\r');

  // 1. Repair dropped symbols first
  text = text.replace(/\bFor\s+-3\s*,\s*r\s*=\s*3\b/g, 'For $x^3$, r = 3');
  text = text.replace(/\bFor\s+-3,\s*r\s*=\s*3\b/g, 'For $x^3$, r = 3');
  text = text.replace(/\(1,\s*\.\s*,\s*\.\.\^2\)/g, '$(1, \\omega, \\omega^2)$');
  text = text.replace(/\(1,\s*\.\s*,\s*\.\^2\)/g, '$(1, \\omega, \\omega^2)$');
  text = text.replace(/\(1,\s*2\)\s*and\s*\\omega\b/g, '(1, \\omega, \\omega^2) and \\omega');

  // Convert \( ... \) and \[ ... \]
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');

  // Tokenize by existing $...$ and $$...$$
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

  function formatMathContent(math: string): string {
    let m = math.trim();
    // Repair sqrt(...) -> \sqrt{...}
    m = m.replace(/sqrt\(([^()]+)\)/g, '\\sqrt{$1}');
    m = m.replace(/√\(([^()]+)\)/g, '\\sqrt{$1}');
    m = m.replace(/√([0-9a-zA-Z]+)/g, '\\sqrt{$1}');
    // Format combinations
    m = m.replace(/\b(\d+|n)C(\d+|r)\b/g, '\\binom{$1}{$2}');
    m = m.replace(/\bC\((\d+|n),\s*(\d+|r)\)/g, '\\binom{$1}{$2}');
    // Format symbols
    m = m.replace(/<=/g, ' \\le ');
    m = m.replace(/>=/g, ' \\ge ');
    m = m.replace(/!=/g, ' \\ne ');
    m = m.replace(/=>/g, ' \\implies ');
    m = m.replace(/\+-/g, ' \\pm ');
    m = m.replace(/°/g, '^\\circ');
    // Unicode powers
    m = m.replace(/⁴/g, '^{4}').replace(/³/g, '^{3}').replace(/²/g, '^{2}').replace(/¹/g, '^{1}').replace(/⁰/g, '^{0}').replace(/⁻¹/g, '^{-1}');
    return m;
  }

  function processNonMath(seg: string): string {
    let s = seg;

    // 1. Wrap existing LaTeX commands with their arguments first:
    // e.g. \lim_{x \to 0} \frac{\sin(7x)}{x}
    s = s.replace(/(?<!\$)\\lim_\{[^\}]+\}\s*(?:\\frac\{[^\}]+\}\{[^\}]+\}|[^\s,\.\?;]+)(?!\$)/g, (m) => `$$${m}$$`);
    s = s.replace(/(?<!\$)\\(?:frac|sqrt)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})?(?!\$)/g, (m) => `$$${m}$$`);

    // 2. Wrap plain sqrt(...) constructs
    s = s.replace(/(?<!\$)\bsqrt\(([^\)]+)\)(?!\$)/g, (_m, inner) => `$$\\sqrt{${formatMathContent(inner)}}$$`);
    s = s.replace(/(?<!\$)√\(([^\)]+)\)(?!\$)/g, (_m, inner) => `$$\\sqrt{${formatMathContent(inner)}}$$`);
    s = s.replace(/(?<!\$)√([0-9a-zA-Z]+)(?!\$)/g, (_m, inner) => `$$\\sqrt{${inner}}$$`);

    // 3. Mathematical expressions with parenthesized bases/exponents:
    // e.g. (1 + 2x)^(-1), (x + 2)^2
    s = s.replace(/(?<!\$)(\([a-zA-Z0-9\s\+\-\/\*]+\))\^\((-?[a-zA-Z0-9\s\+\-]+)\)(?!\$)/g, (_m, base, exp) => `$$${base}^{${exp.trim()}}$$`);
    s = s.replace(/(?<!\$)(\([a-zA-Z0-9\s\+\-\/\*]+\))\^([a-zA-Z0-9]+)(?!\$)/g, (_m, base, exp) => `$$${base}^{${exp.trim()}}$$`);

    // 4. Degrees: 30° -> $30^\circ$
    s = s.replace(/(?<!\$)\b(\d+)\s*°(?!\w)(?!\$)/g, '$$$1^\\circ$$');

    // 5. Binomial indices: T_{r+1}, T_(r+1), T_4, T₄, a_n
    s = s.replace(/(?<!\$)\bT_\{([^{}]+)\}(?!\$)/g, '$$T_{$1}$$');
    s = s.replace(/(?<!\$)\bT_\(([^\(\)]+)\)(?!\$)/g, '$$T_{$1}$$');
    s = s.replace(/(?<!\$)\bT_([0-9]+)\b(?!\$)/g, '$$T_{$1}$$');
    s = s.replace(/(?<!\$)\bT([0-9]+)\b(?=\s*=\s*\d+)(?!\$)/g, '$$T_{$1}$$');
    s = s.replace(/(?<!\$)\bT₄\b(?!\$)/g, '$T_4$');
    s = s.replace(/(?<!\$)\bT₃\b(?!\$)/g, '$T_3$');
    s = s.replace(/(?<!\$)\bT₂\b(?!\$)/g, '$T_2$');
    s = s.replace(/(?<!\$)\bT₁\b(?!\$)/g, '$T_1$');
    s = s.replace(/(?<!\$)\ba_n\b(?!\$)/g, '$a_n$');
    s = s.replace(/(?<!\$)\ba_1\b(?!\$)/g, '$a_1$');
    s = s.replace(/(?<!\$)\ba_([0-9]+)\b(?!\$)/g, '$$a_{$1}$$');

    // 6. Combinations: 6C3, 5Cr, nCr, C(6, 3)
    s = s.replace(/(?<!\$)\b(\d+|n)C(\d+|r)\b(?!\$)/g, '$$\\binom{$1}{$2}$$');
    s = s.replace(/(?<!\$)\bC\((\d+|n),\s*(\d+|r)\)(?!\$)/g, '$$\\binom{$1}{$2}$$');

    // 7. Modulus: |z|, |A|, |kA|
    s = s.replace(/(?<=\s|^)\|([a-zA-Z])\|(?=[\s,\.\?!]|$)/g, '$$|$1|$$');

    // 8. Unicode exponents
    s = s.replace(/(?<!\$)(\(?[0-9a-zA-Z\.]+\)?)([⁴³²¹⁰]+)(?!\$)/g, (_m, base, sup) => {
      const map: Record<string, string> = { '⁴': '4', '³': '3', '²': '2', '¹': '1', '⁰': '0' };
      const exp = sup.split('').map((c: string) => map[c] || c).join('');
      return `$$${base}^{${exp}}$$`;
    });
    s = s.replace(/(?<!\$)(\(?[0-9a-zA-Z\.]+\)?)⁻¹(?!\$)/g, '$$$1^{-1}$$');

    // 9. Simple variable powers: x^3, 2^12, e^(2x)
    s = s.replace(/(?<!\$)(\b[a-zA-Z0-9]+)\^\(([^\)]+)\)(?!\$)/g, '$$$1^{$2}$$');
    s = s.replace(/(?<!\$)(\b[a-zA-Z0-9]+)\^\{([^{}]+)\}(?!\$)/g, '$$$1^{$2}$$');
    s = s.replace(/(?<!\$)(\b[a-zA-Z0-9]+)\^([a-zA-Z0-9]+)\b(?!\$)/g, '$$$1^{$2}$$');

    // 10. Bare Greek and function commands
    s = s.replace(/(?<!\$)\\(theta|alpha|beta|omega|delta|lambda|mu|sigma|gamma|rho|epsilon|phi|psi)\b(?!\$)/g, '$$\\$1$$');
    s = s.replace(/(?<!\$)\\(sin|cos|tan|sec|csc|cot|log|ln)\b(\([^\)]+\))(?!\$)/g, '$$\\$1$2$$');
    s = s.replace(/(?<!\$)\\(Delta)\b(?!\$)/g, '$$\\Delta$$');

    return s;
  }

  const processed = parts.map(p => {
    if (p.isMath) {
      const isDisplay = p.content.startsWith('$$');
      const inner = isDisplay ? p.content.slice(2, -2) : p.content.slice(1, -1);
      const formatted = formatMathContent(inner);
      return isDisplay ? `$$${formatted}$$` : `$${formatted}$`;
    }
    return processNonMath(p.content);
  }).join('');

  // Merge adjacent math tokens separated by standard operators: e.g. "$x^2$ + $4x$" -> "$x^2 + 4x$"
  let merged = processed;
  merged = merged.replace(/\$\s*\$/g, '');
  merged = merged.replace(/\$([^\$\n]+)\$\s*([\+\-\=\*\/])\s*\$([^\$\n]+)\$/g, (_m, a, op, b) => `$${a} ${op} ${b}$`);
  merged = merged.replace(/\$([^\$\n]+)\$\s*([=<>\\le\\ge\\implies]+)\s*\$([^\$\n]+)\$/g, (_m, a, op, b) => `$${a} ${op} ${b}$`);
  merged = merged.replace(/\$([^\$\n]+)\$\s*\$([^\$\n]+)\$/g, (_m, a, b) => `$${a} ${b}$`);

  // Delimiter balance check
  const dollarCount = (merged.match(/(?<!\\)\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    if (merged.endsWith('$')) {
      merged = merged.slice(0, -1);
    } else {
      merged = merged + '$';
    }
  }

  return merged;
}

// Test against backup tcatMathQuestions
const backupPath = path.join(process.cwd(), 'src/data_backup/tcatMathQuestions.ts');
import(backupPath).then(mod => {
  const qs = mod.TCAT_MATH_QUESTIONS || [];
  let failures = 0;
  let converted = 0;

  for (const q of qs) {
    const fieldsToTest = [q.q, q.explain, ...(q.options || [])];
    for (const field of fieldsToTest) {
      if (!field) continue;
      const convertedText = convertMathClean(field);
      if (convertedText !== field) converted++;

      const mathTokens = convertedText.match(/(\$\$[\s\S]+?\$\$|\$(?!\$)[^\$\n]+?\$)/g) || [];
      for (const tok of mathTokens) {
        const mathContent = tok.startsWith('$$') ? tok.slice(2, -2).trim() : tok.slice(1, -1).trim();
        try {
          katex.renderToString(mathContent, { throwOnError: true, strict: false });
        } catch (e: any) {
          failures++;
          console.error(`[KaTeX FAIL on ${q.id}]: "${mathContent}" -> ${e.message}`);
        }
      }
    }
  }

  console.log(`Test complete on ${qs.length} TCAT math questions:`);
  console.log(`Converted: ${converted}`);
  console.log(`KaTeX Failures: ${failures}`);
});
