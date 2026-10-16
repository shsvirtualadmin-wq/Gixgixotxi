import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';
import { normalizeMath } from '../../lib/math';

function renderSegment(segment: string, isBlock: boolean): string {
  try {
    return katex.renderToString(segment, {
      throwOnError: false,
      displayMode: isBlock,
      strict: false,
    });
  } catch {
    return `<span style="color:var(--danger);font-size:0.85em">[Math error: ${segment}]</span>`;
  }
}

function parseAndRenderMath(text: string): string {
  const normalized = normalizeMath(text);
  // Split on $$...$$, $...$, \[...\], \(...\)
  const parts: string[] = [];
  let remaining = normalized;

  const patterns = [
    { re: /\$\$([\s\S]+?)\$\$/, block: true },
    { re: /\$([^$\n]+?)\$/, block: false },
    { re: /\\\[([\s\S]+?)\\\]/, block: true },
    { re: /\\\(([\s\S]+?)\\\)/, block: false },
  ];

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
      parts.push(
        remaining
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>')
      );
      break;
    }

    if (earliest.index > 0) {
      const before = remaining.slice(0, earliest.index);
      parts.push(
        before
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>')
      );
    }

    parts.push(renderSegment(earliest.match[1], earliest.block));
    remaining = remaining.slice(earliest.index + earliest.match[0].length);
  }

  return parts.join('');
}

interface MathTextProps {
  children: string;
  className?: string;
  block?: boolean;
}

export function MathText({ children, className = '', block = false }: MathTextProps) {
  const html = useMemo(() => parseAndRenderMath(children), [children]);

  if (block) {
    return (
      <div
        className={`math-text ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ lineHeight: 1.7 }}
      />
    );
  }

  return (
    <span
      className={`math-text ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
