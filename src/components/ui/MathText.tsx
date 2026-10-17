import React, { useMemo, type CSSProperties } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import 'katex/contrib/mhchem';

export interface ValidateMathResult {
  ok: boolean;
  errors: string[];
}

/**
 * Validates all math segments ($...$ and $$...$$) in the provided text.
 * Uses throwOnError: true so any malformed LaTeX syntax is reported.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function validateMath(text: string): ValidateMathResult {
  if (!text || typeof text !== 'string') {
    return { ok: true, errors: [] };
  }

  const errors: string[] = [];
  // Tokenize looking for escaped \$, $$, and $
  const regex = /(?:\\\$)|(?:\$\$([\s\S]+?)\$\$)|(?:\$([^$\n]+?)\$)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match[0] === '\\$') {
      // Literal dollar sign - skip validation
      continue;
    }

    const isDisplay = match[1] !== undefined;
    const formula = isDisplay ? match[1] : match[2];

    if (!formula || formula.trim().length === 0) {
      errors.push('Empty math block found');
      continue;
    }

    try {
      katex.renderToString(formula.trim(), {
        displayMode: isDisplay,
        throwOnError: true,
        strict: 'warn',
        trust: false,
        output: 'htmlAndMathml',
        maxSize: 20,
        maxExpand: 1000,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Math error in "${formula.slice(0, 30)}...": ${msg}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

interface ParsedSegment {
  type: 'text' | 'inline-math' | 'display-math';
  content: string;
}

/**
 * Tokenizes string into plain text, inline math ($...$), and display math ($$...$$).
 * Handles literal escaped dollar signs (\$ -> $ in plain text).
 */
function parseMathText(raw: string): ParsedSegment[] {
  if (!raw || typeof raw !== 'string') return [];

  const segments: ParsedSegment[] = [];
  const regex = /(?:\\\$)|(?:\$\$([\s\S]+?)\$\$)|(?:\$([^$\n]+?)\$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    const matchStart = match.index;
    const matchEnd = regex.lastIndex;

    // Plain text before the match
    if (matchStart > lastIndex) {
      const textBefore = raw.substring(lastIndex, matchStart).replace(/\\\$/g, '$');
      if (textBefore.length > 0) {
        segments.push({ type: 'text', content: textBefore });
      }
    }

    if (match[0] === '\\$') {
      // Escaped literal dollar sign in plain text
      segments.push({ type: 'text', content: '$' });
    } else if (match[1] !== undefined) {
      // Display math $$...$$
      segments.push({ type: 'display-math', content: match[1] });
    } else if (match[2] !== undefined) {
      // Inline math $...$
      segments.push({ type: 'inline-math', content: match[2] });
    }

    lastIndex = matchEnd;
  }

  // Any remaining text after the last match
  if (lastIndex < raw.length) {
    const remaining = raw.substring(lastIndex).replace(/\\\$/g, '$');
    if (remaining.length > 0) {
      segments.push({ type: 'text', content: remaining });
    }
  }

  return segments;
}

export interface MathTextProps {
  children?: string;
  text?: string;
  className?: string;
  block?: boolean;
  style?: CSSProperties;
}

/**
 * Universal MathText renderer.
 * - Plain text is rendered strictly as React text nodes (NEVER as HTML)
 * - Math segments rendered safely via KaTeX with fallback to raw text on error
 * - Display math scrolls horizontally inside its own overflow-x:auto box
 */
export function MathText({ children, text, className = '', block = false, style }: MathTextProps) {
  const content = text ?? children ?? '';

  const renderedSegments = useMemo(() => {
    if (!content) return [];
    const parsed = parseMathText(content);

    return parsed.map((seg, index) => {
      if (seg.type === 'text') {
        return (
          <React.Fragment key={`txt-${index}`}>
            {seg.content}
          </React.Fragment>
        );
      }

      const isDisplay = seg.type === 'display-math';
      let html = '';
      let hasError = false;

      try {
        html = katex.renderToString(seg.content.trim(), {
          displayMode: isDisplay,
          throwOnError: false,
          errorColor: '#D71921',
          strict: 'warn',
          trust: false,
          output: 'htmlAndMathml',
          maxSize: 20,
          maxExpand: 1000,
        });
      } catch (err) {
        console.warn('[MathText] Rendering error fallback:', err, seg.content);
        hasError = true;
      }

      if (hasError || !html) {
        // Fallback: render raw text safely as React text node
        return (
          <span
            key={`err-${index}`}
            className="katex-fallback text-[var(--accent,#D71921)] font-mono text-sm px-1 py-0.5 rounded bg-[var(--surface-2)]"
          >
            {isDisplay ? `$$${seg.content}$$` : `$${seg.content}$`}
          </span>
        );
      }

      if (isDisplay) {
        return (
          <div
            key={`disp-${index}`}
            className="katex-display-box my-2.5 overflow-x-auto max-w-full text-center py-1 scrollbar-none"
            style={{ WebkitOverflowScrolling: 'touch' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }

      return (
        <span
          key={`inline-${index}`}
          className="katex-inline-math inline leading-none align-baseline"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  }, [content]);

  const baseStyle: CSSProperties = {
    color: 'inherit',
    ...style,
  };

  if (block) {
    return (
      <div className={`katex-root-block ${className}`} style={baseStyle}>
        {renderedSegments}
      </div>
    );
  }

  return (
    <span className={`katex-root-inline ${className}`} style={baseStyle}>
      {renderedSegments}
    </span>
  );
}

export default MathText;
