import React, { useMemo } from 'react';
import katex from 'katex';
import { normalizeMath } from '../../lib/math';

export { normalizeMath };

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
            trust: false,
          });

          return (
            <span
              key={`math-${idx}`}
              className={
                isBlockDisplay && !inline
                  ? 'block my-2 overflow-x-auto overflow-y-hidden max-w-full text-center py-0.5 text-[1em]'
                  : 'inline-block max-w-full overflow-x-auto overflow-y-hidden align-middle px-0.5 text-[1em]'
              }
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (err) {
          console.warn('[MathText] KaTeX render error, falling back to plain text:', err);
          return (
            <span key={`fallback-${idx}`} className="font-mono text-xs text-amber-300">
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

  return <span className={`math-text-container leading-relaxed ${className}`}>{renderedContent}</span>;
};

export default MathText;
