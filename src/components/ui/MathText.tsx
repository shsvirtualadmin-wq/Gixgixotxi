import React, { useMemo } from 'react';
import katex from 'katex';

/**
 * Normalizes mathematical text before rendering, repairing common string-escape
 * corruption and wrapping bare math expressions with LaTeX delimiters.
 */
export function normalizeMath(str: string | null | undefined): string {
  if (!str) return '';
  let s = String(str);

  // 1. Repair control characters resulting from unescaped LaTeX backslashes
  // \f -> \frac or \forall
  s = s.replace(/\x0C(?:rac)?/g, '\\frac');
  s = s.replace(/\x0Corall/g, '\\forall');

  // \t -> \theta, \times, \tan, \to, \tau
  s = s.replace(/\t(?:heta)?/g, '\\theta');
  s = s.replace(/\tan(?![a-zA-Z])/g, '\\tan');
  s = s.replace(/\times(?![a-zA-Z])/g, '\\times');
  s = s.replace(/\to(?![a-zA-Z])/g, '\\to');
  s = s.replace(/\tau(?![a-zA-Z])/g, '\\tau');

  // \b -> \beta, \bar, \binom
  s = s.replace(/\x08(?:eta)?/g, '\\beta');
  s = s.replace(/\x08ar/g, '\\bar');
  s = s.replace(/\x08inom/g, '\\binom');

  // \r -> \right or \rho
  s = s.replace(/\r(?=ight\b)/g, '\\r');
  s = s.replace(/\r(?=ho\b)/g, '\\r');
  s = s.replace(/([})\]])\s*ight\b/g, '$1 \\right');
  s = s.replace(/(?<=[})\]])\s*ight(?=[)\]}])/g, '\\right');

  // \v -> \vec or \varphi
  s = s.replace(/\x0B(?:ec)?/g, '\\vec');
  s = s.replace(/\x0Barphi/g, '\\varphi');

  // Newline followed by 'eq' (where \n was treated as newline instead of \neq)
  s = s.replace(/\n(?=eq\b)/g, '\\n');

  // 2. Double-escaped backslashes (\\frac -> \frac)
  s = s.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

  // 3. Normalize delimiters: \( \) to $ $, \[ \] to $$ $$
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, '\n$$$$\n$1\n$$$$\n');

  // 4. Wrap bare math without delimiters:
  // If an entire line contains \frac, \sqrt, \int, \sum, \lim and is not wrapped in $ or $$
  const lines = s.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    // If line already starts and ends with math delimiters, keep as is
    if ((trimmed.startsWith('$') && trimmed.endsWith('$')) || trimmed.startsWith('```')) {
      return line;
    }
    // Check if line contains bare math indicators
    if (
      /\\[fF]rac\{/.test(trimmed) ||
      /\\[sS]qrt\{/.test(trimmed) ||
      /\\[iI]nt\b/.test(trimmed) ||
      /\\[sS]um\b/.test(trimmed) ||
      /\\[lL]im\b/.test(trimmed)
    ) {
      // If line doesn't have any $, wrap the math portion or the line
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
      // Bare power like x^2 or y^3 (when not part of a word)
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

interface MathTextProps {
  text: string | null | undefined;
  className?: string;
  inline?: boolean;
}

/**
 * Shared MathText component for rendering mixed Markdown / text and KaTeX math.
 * Correctly parses $...$, $$...$$, \( ... \) and \[ ... \], renders KaTeX,
 * and falls back to plain text if parsing fails.
 */
export const MathText: React.FC<MathTextProps> = ({
  text,
  className = '',
  inline = false,
}) => {
  const renderedContent = useMemo(() => {
    if (!text) return null;
    const normalized = normalizeMath(text);

    // Split on LaTeX delimiters: $$...$$, \[...\], $...$, \(...\)
    const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?:\\\$|[^\$])+?\$|\\\([\s\S]*?\\\))/g;
    const parts = normalized.split(regex);

    return parts.map((part, idx) => {
      if (!part) return null;

      const isBlockDisplay =
        (part.startsWith('$$') && part.endsWith('$$')) ||
        (part.startsWith('\\[') && part.endsWith('\\]'));

      const isInlineMath =
        (!isBlockDisplay && part.startsWith('$') && part.endsWith('$')) ||
        (part.startsWith('\\(') && part.endsWith('\\)'));

      if (isBlockDisplay || isInlineMath) {
        let mathBody = part;
        if (part.startsWith('$$') && part.endsWith('$$')) {
          mathBody = part.slice(2, -2).trim();
        } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
          mathBody = part.slice(2, -2).trim();
        } else if (part.startsWith('$') && part.endsWith('$')) {
          mathBody = part.slice(1, -1).trim();
        } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
          mathBody = part.slice(2, -2).trim();
        }

        try {
          const html = katex.renderToString(mathBody, {
            displayMode: isBlockDisplay && !inline,
            throwOnError: false,
            strict: 'ignore',
          });

          return (
            <span
              key={`math-${idx}`}
              className={
                isBlockDisplay && !inline
                  ? 'block my-2 overflow-x-auto max-w-full text-center py-0.5'
                  : 'inline-block max-w-full overflow-x-auto align-middle px-0.5'
              }
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (err) {
          console.warn('[MathText] KaTeX render error, falling back to plain text:', err);
          return (
            <span key={`fallback-${idx}`} className="font-mono text-xs">
              {mathBody}
            </span>
          );
        }
      }

      // Non-math text segment: preserve whitespace and line breaks
      return (
        <span key={`text-${idx}`} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  }, [text, inline]);

  if (!text) return null;

  return <span className={`math-text-container ${className}`}>{renderedContent}</span>;
};
