import katex from 'katex';

/**
 * Normalizes mathematical delimiters and repairs common formatting anomalies
 * from LLM outputs without altering original backslashes.
 */
export function normalizeBoardyMath(text: string): string {
  if (!text) return '';
  let s = String(text);

  // 1. Repair damaged text where "ight" follows } or ) inside math by restoring "\right"
  s = s.replace(/([})\]])\s*ight\b/g, '$1 \\right');
  s = s.replace(/(?<=[})\]])\s*ight(?=[)\]}])/g, '\\right');
  s = s.replace(/\\left\s*([(\[{])([\s\S]*?)(?<!\\r)ight\s*([)\]}])/g, '\\left$1$2\\right$3');

  // 2. Normalize delimiters: \( ... \) to $ ... $, \[ ... \] to $$ ... $$
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, '\n\n$$\n$1\n$$\n\n');

  // 3. Convert "$$ ... $$" inside a sentence to inline $ ... $
  // Matches "$$...$$" when there is non-newline, non-$ text on the same line before or after
  s = s.replace(/(^[^\n$]*[^\s\n$][^\n$]*)\$\$([^\n$]+?)\$\$/gm, '$1$$$2$$');
  s = s.replace(/\$\$([^\n$]+?)\$\$([^\n$]*[^\s\n$][^\n$]*)$/gm, '$$$1$$$2');
  s = s.replace(/([^\n$])\s*\$\$([^\n$]+?)\$\$\s*([^\n$])/g, '$1 $$$2$$ $3');

  // 4. Wrap standalone lines that start with \displaystyle, \lim, \frac, \int, \sum or \left in $$ ... $$
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

  // 5. Code fences with math: unpack into display math so math never appears inside code blocks
  s = s.replace(/```(?:latex|math|katex)?\s*\n([\s\S]*?[\\](?:frac|lim|displaystyle|int|sum|left|right|begin|pmatrix|bmatrix|vmatrix)[\s\S]*?)\n```/gi, (_m, code) => {
    return `\n\n$$\n${code.trim()}\n$$\n\n`;
  });

  return s;
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
      name: 'chemical formula with subscripts',
      input: String.raw`\mathrm{H_2SO_4 + 2NaOH \to Na_2SO_4 + 2H_2O}`,
    },
  ];

  let allPassed = true;
  for (const sample of sampleStrings) {
    try {
      const html = katex.renderToString(sample.input, {
        throwOnError: false,
        displayMode: true,
      });
      if (html.includes('katex-error')) {
        console.error(`[Boardy Math Self-Test FAILED]: ${sample.name}`, sample.input);
        allPassed = false;
      }
    } catch (err) {
      console.error(`[Boardy Math Self-Test EXCEPTION]: ${sample.name}`, err);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.info('[Boardy Math Self-Test]: All 5 mathematical test samples rendered cleanly via KaTeX.');
  }
}

// Automatically run self-test in development mode only
if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
  runBoardyMathSelfTest();
}
