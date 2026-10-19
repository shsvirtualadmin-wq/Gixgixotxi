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

/**
 * Renders inline markdown formatting: bold (**text**), italic (*text*), code (`code`).
 * Strips raw markdown syntax characters and outputs React elements.
 */
function renderInlineMarkdown(text: string, keyPrefix: string): React.ReactNode[] {
  if (!text) return [];

  // Match **bold**, *italic*, `code`
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, pIdx) => {
    if (!part) return null;
    const subKey = `${keyPrefix}-p${pIdx}`;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={subKey} className="font-bold text-[var(--text)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={subKey} className="italic text-[var(--text-muted)]">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={subKey}
          className="font-mono text-xs px-1 py-0.5 rounded bg-[var(--surface-2)] text-[var(--accent,#D71921)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={subKey}>{part}</React.Fragment>;
  });
}

function renderMathSegment(seg: ParsedSegment, index: number, prefix: string) {
  if (seg.type === 'text') {
    return (
      <React.Fragment key={`${prefix}-txt-${index}`}>
        {renderInlineMarkdown(seg.content, `${prefix}-txt-${index}`)}
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
    return (
      <span
        key={`${prefix}-err-${index}`}
        className="katex-fallback text-[var(--accent,#D71921)] font-mono text-sm px-1 py-0.5 rounded bg-[var(--surface-2)]"
      >
        {isDisplay ? `$$${seg.content}$$` : `$${seg.content}$`}
      </span>
    );
  }

  if (isDisplay) {
    return (
      <span
        key={`${prefix}-disp-${index}`}
        className="katex-display-box block my-2.5 overflow-x-auto max-w-full min-w-0 text-center py-1 scrollbar-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      key={`${prefix}-inline-${index}`}
      className="katex-inline-math inline leading-none align-baseline max-w-full min-w-0 overflow-x-auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderLineSegments(lineText: string, lineKey: string): React.ReactNode {
  const segments = parseMathText(lineText);
  return segments.map((seg, sIdx) => renderMathSegment(seg, sIdx, lineKey));
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
 * - Renders markdown headers (###), bold (**text**), italics (*text*), and lists cleanly
 * - Never shows raw asterisks or unformatted hashes
 * - Math segments rendered safely via KaTeX with fallback to raw text on error
 * - Display math scrolls horizontally inside its own overflow-x:auto box
 */
export function MathText({ children, text, className = '', block = false, style }: MathTextProps) {
  const content = text ?? children ?? '';

  const renderedContent = useMemo(() => {
    if (!content) return null;

    if (!block) {
      const parsed = parseMathText(content);
      return parsed.map((seg, index) => renderMathSegment(seg, index, 'inline'));
    }

    // Block-level parsing: handle headings, lists, paragraphs, and KaTeX math
    const lines = content.split('\n');

    return lines.map((line, lIdx) => {
      const lineKey = `line-${lIdx}`;
      const trimmed = line.trim();

      // Heading 3: ### Heading
      if (line.startsWith('### ')) {
        const title = line.slice(4).trim();
        return (
          <h4
            key={lineKey}
            className="font-bold text-xs uppercase tracking-wider text-[var(--accent,#D71921)] mt-3.5 mb-1.5 font-mono select-none"
          >
            {renderLineSegments(title, lineKey)}
          </h4>
        );
      }

      // Heading 2: ## Heading
      if (line.startsWith('## ')) {
        const title = line.slice(3).trim();
        return (
          <h3
            key={lineKey}
            className="font-bold text-sm uppercase tracking-wide text-[var(--accent,#D71921)] mt-4 mb-2 font-display"
          >
            {renderLineSegments(title, lineKey)}
          </h3>
        );
      }

      // Heading 1: # Heading
      if (line.startsWith('# ')) {
        const title = line.slice(2).trim();
        return (
          <h2
            key={lineKey}
            className="font-bold text-base text-[var(--text)] mt-4 mb-2 font-display"
          >
            {renderLineSegments(title, lineKey)}
          </h2>
        );
      }

      // Ordered list: 1. Item
      const orderedMatch = line.match(/^(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        const num = orderedMatch[1];
        const body = orderedMatch[2];
        return (
          <div key={lineKey} className="flex items-start gap-2 my-1 text-sm leading-relaxed">
            <span className="font-bold text-xs text-[var(--accent,#D71921)] min-w-[20px] select-none pt-0.5">
              {num}.
            </span>
            <div className="flex-1 break-words">{renderLineSegments(body, lineKey)}</div>
          </div>
        );
      }

      // Bullet list: - Item or * Item
      const bulletMatch = line.match(/^[-*]\s+(.*)$/);
      if (bulletMatch) {
        const body = bulletMatch[1];
        return (
          <div key={lineKey} className="flex items-start gap-2 my-1 text-sm leading-relaxed">
            <span className="text-[var(--accent,#D71921)] select-none text-base leading-none pt-0.5">
              &bull;
            </span>
            <div className="flex-1 break-words">{renderLineSegments(body, lineKey)}</div>
          </div>
        );
      }

      // Blank line
      if (!trimmed) {
        return <div key={lineKey} className="h-1.5" />;
      }

      // Normal paragraph line
      return (
        <div key={lineKey} className="my-1 text-sm leading-relaxed break-words">
          {renderLineSegments(line, lineKey)}
        </div>
      );
    });
  }, [content, block]);

  const baseStyle: CSSProperties = {
    color: 'inherit',
    ...style,
  };

  if (block) {
    return (
      <div className={`katex-root-block max-w-full min-w-0 overflow-x-auto ${className}`} style={baseStyle}>
        {renderedContent}
      </div>
    );
  }

  return (
    <span className={`katex-root-inline max-w-full min-w-0 ${className}`} style={baseStyle}>
      {renderedContent}
    </span>
  );
}

export default MathText;
