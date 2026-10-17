import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useMemo, type CSSProperties } from 'react';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br/>');
}

function renderMathSegment(mathStr: string, isBlock: boolean): string {
  try {
    const html = katex.renderToString(mathStr.trim(), {
      throwOnError: false,
      strict: 'ignore',
      trust: false,
      output: 'htmlAndMathml',
      displayMode: isBlock,
    });

    if (isBlock) {
      return `<div class="katex-display-scroll" style="overflow-x: auto; max-width: 100%; margin: 0.65em 0; text-align: center; -webkit-overflow-scrolling: touch;">${html}</div>`;
    }
    return `<span class="katex-inline-math" style="display: inline; line-height: 1;">${html}</span>`;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('[MathText] KaTeX rendering exception:', errorMsg, mathStr);
    return `<span style="color:var(--red, #D71921);font-family:monospace;font-size:0.85em;">[Math Error: ${escapeHtml(mathStr)}]</span>`;
  }
}

export function parseAndRenderMath(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  const patterns = [
    { re: /\$\$([\s\S]+?)\$\$/, block: true },
    { re: /\\\[([\s\S]+?)\\\]/, block: true },
    { re: /\$([^$\n]+?)\$/, block: false },
    { re: /\\\(([\s\S]+?)\\\)/, block: false },
  ];

  const parts: string[] = [];
  let remaining = rawText;

  while (remaining.length > 0) {
    let earliest: { index: number; match: RegExpMatchArray; block: boolean } | null = null;

    for (const { re, block } of patterns) {
      const m = remaining.match(re);
      if (m && m.index !== undefined) {
        if (!earliest || m.index < earliest.index) {
          earliest = { index: m.index, match: m, block };
        }
      }
    }

    if (!earliest) {
      // Remaining is plain text
      parts.push(`<span class="katex-text-segment">${escapeHtml(remaining)}</span>`);
      break;
    }

    if (earliest.index > 0) {
      const textBefore = remaining.slice(0, earliest.index);
      parts.push(`<span class="katex-text-segment">${escapeHtml(textBefore)}</span>`);
    }

    const formula = earliest.match[1];
    parts.push(renderMathSegment(formula, earliest.block));
    remaining = remaining.slice(earliest.index + earliest.match[0].length);
  }

  return parts.join('');
}

export interface MathTextProps {
  children?: string;
  text?: string;
  className?: string;
  block?: boolean;
  style?: CSSProperties;
}

export function MathText({ children, text, className = '', block = false, style }: MathTextProps) {
  const content = text ?? children ?? '';
  const html = useMemo(() => parseAndRenderMath(content), [content]);

  // Unified typeset typography: words and math look like one document
  const baseStyle: CSSProperties = {
    fontFamily: 'KaTeX_Main, "Times New Roman", Times, serif',
    lineHeight: 1.6,
    color: 'inherit',
    ...style,
  };

  if (block) {
    return (
      <div
        className={`math-typeset-doc text-[17px] sm:text-[19px] ${className}`}
        style={baseStyle}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`math-typeset-doc text-[16px] sm:text-[18px] ${className}`}
      style={baseStyle}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default MathText;
