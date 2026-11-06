import React, { useMemo, type CSSProperties } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import 'katex/contrib/mhchem';

export interface ValidateMathResult {
  ok: boolean;
  errors: string[];
  valid?: boolean;
  error?: string;
}

/**
 * Validates all math segments ($...$ and $$...$$) in the provided text.
 * Uses throwOnError: true so any malformed LaTeX syntax is reported.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function validateMath(text: string): ValidateMathResult {
  if (!text || typeof text !== 'string') {
    return { ok: true, valid: true, errors: [] };
  }

  const errors: string[] = [];
  // Tokenize looking for escaped \$, $$...$$, \[...\], $...$, and \(...\)
  const regex = /(?:\\\$)|(?:\$\$([\s\S]+?)\$\$)|(?:\\\[([\s\S]+?)\\\])|(?:\$([^$\n]+?)\$)|(?:\\\(([\s\S]+?)\\\))/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match[0] === '\\$') {
      // Literal dollar sign - skip validation
      continue;
    }

    const isDisplay = match[1] !== undefined || match[2] !== undefined;
    const formula = match[1] ?? match[2] ?? match[3] ?? match[4];

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
    valid: errors.length === 0,
    errors,
    error: errors[0],
  };
}

interface ParsedSegment {
  type: 'text' | 'inline-math' | 'display-math';
  content: string;
}

/**
 * Tokenizes string into plain text, inline math ($...$ or \(...\)), and display math ($$...$$ or \[...\]).
 * Handles literal escaped dollar signs (\$ -> $ in plain text).
 */
function parseMathText(raw: string): ParsedSegment[] {
  if (!raw || typeof raw !== 'string') return [];

  const segments: ParsedSegment[] = [];
  const regex = /(?:\\\$)|(?:\$\$([\s\S]+?)\$\$)|(?:\\\[([\s\S]+?)\\\])|(?:\$([^$\n]+?)\$)|(?:\\\(([\s\S]+?)\\\))/g;

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
    } else if (match[1] !== undefined || match[2] !== undefined) {
      // Display math $$...$$ or \[...\]
      segments.push({ type: 'display-math', content: (match[1] ?? match[2])! });
    } else if (match[3] !== undefined || match[4] !== undefined) {
      // Inline math $...$ or \(...\)
      segments.push({ type: 'inline-math', content: (match[3] ?? match[4])! });
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
 * Renders plain text with auto-linked URLs that wrap cleanly on narrow screens.
 */
function renderTextWithLinks(text: string, keyPrefix: string): React.ReactNode[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s<>()]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, idx) => {
    if (!part) return null;
    if (/^https?:\/\//i.test(part)) {
      return (
        <a
          key={`${keyPrefix}-url-${idx}`}
          href={part}
          target="_blank"
          rel="ugc nofollow noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[var(--accent,#D71921)] underline hover:opacity-85 [overflow-wrap:anywhere] [word-break:break-all]"
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={`${keyPrefix}-txt-${idx}`}>{part}</React.Fragment>;
  });
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
        <strong key={subKey} className="font-bold text-[var(--text)] [overflow-wrap:anywhere] [word-break:break-word]">
          {renderTextWithLinks(part.slice(2, -2), subKey)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={subKey} className="italic text-[var(--text-muted)] [overflow-wrap:anywhere] [word-break:break-word]">
          {renderTextWithLinks(part.slice(1, -1), subKey)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={subKey}
          className="font-mono text-xs px-1 py-0.5 rounded bg-[var(--surface-2)] text-[var(--accent,#D71921)] [overflow-wrap:anywhere] [word-break:break-word]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={subKey}>{renderTextWithLinks(part, subKey)}</React.Fragment>;
  });
}

const katexHtmlCache = new Map<string, string>();
const MAX_KATEX_CACHE = 1200;

function renderMathSegment(seg: ParsedSegment, index: number, prefix: string) {
  if (seg.type === 'text') {
    return (
      <React.Fragment key={`${prefix}-txt-${index}`}>
        {renderInlineMarkdown(seg.content, `${prefix}-txt-${index}`)}
      </React.Fragment>
    );
  }

  const isDisplay = seg.type === 'display-math';
  const trimmed = seg.content.trim();
  const cacheKey = `${isDisplay ? 'D' : 'I'}:${trimmed}`;
  let html = katexHtmlCache.get(cacheKey) || '';
  let hasError = false;

  if (!html) {
    try {
      html = katex.renderToString(trimmed, {
        displayMode: isDisplay,
        throwOnError: false,
        errorColor: '#D71921',
        strict: 'warn',
        trust: false,
        output: 'htmlAndMathml',
        maxSize: 20,
        maxExpand: 1000,
      });

      if (katexHtmlCache.size >= MAX_KATEX_CACHE) {
        const first = katexHtmlCache.keys().next().value;
        if (first) katexHtmlCache.delete(first);
      }
      katexHtmlCache.set(cacheKey, html);
    } catch (err) {
      console.warn('[MathText] Rendering error fallback:', err, seg.content);
      hasError = true;
    }
  }

  if (hasError || !html) {
    return (
      <span
        key={`${prefix}-err-${index}`}
        className="katex-fallback text-[var(--accent,#D71921)] font-mono text-sm px-1 py-0.5 rounded bg-[var(--surface-2)] [overflow-wrap:anywhere] [word-break:break-word]"
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
 * Universal MathText renderer with KaTeX string caching.
 * - Renders markdown headers (###), bold (**text**), italics (*text*), and lists cleanly
 * - Never shows raw asterisks or unformatted hashes
 * - Math segments rendered safely via KaTeX with fallback to raw text on error
 * - Display math scrolls horizontally inside its own overflow-x:auto box
 */
export const MathText = React.memo(function MathText({ children, text, className = '', block = false, style }: MathTextProps) {
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
            className="font-bold text-xs uppercase tracking-wider text-[var(--accent,#D71921)] mt-3.5 mb-1.5 font-mono select-none [overflow-wrap:anywhere] [word-break:break-word]"
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
            className="font-bold text-sm uppercase tracking-wide text-[var(--accent,#D71921)] mt-4 mb-2 font-display [overflow-wrap:anywhere] [word-break:break-word]"
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
            className="font-bold text-base text-[var(--text)] mt-4 mb-2 font-display [overflow-wrap:anywhere] [word-break:break-word]"
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
          <div key={lineKey} className="flex items-start gap-2 my-1 text-sm leading-relaxed min-w-0 max-w-full">
            <span className="font-bold text-xs text-[var(--accent,#D71921)] min-w-[20px] select-none pt-0.5 shrink-0">
              {num}.
            </span>
            <div className="flex-1 min-w-0 [overflow-wrap:anywhere] [word-break:break-word]">{renderLineSegments(body, lineKey)}</div>
          </div>
        );
      }

      // Bullet list: - Item or * Item
      const bulletMatch = line.match(/^[-*]\s+(.*)$/);
      if (bulletMatch) {
        const body = bulletMatch[1];
        return (
          <div key={lineKey} className="flex items-start gap-2 my-1 text-sm leading-relaxed min-w-0 max-w-full">
            <span className="text-[var(--accent,#D71921)] select-none text-base leading-none pt-0.5 shrink-0">
              &bull;
            </span>
            <div className="flex-1 min-w-0 [overflow-wrap:anywhere] [word-break:break-word]">{renderLineSegments(body, lineKey)}</div>
          </div>
        );
      }

      // Blank line
      if (!trimmed) {
        return <div key={lineKey} className="h-1.5" />;
      }

      // Normal paragraph line
      return (
        <div key={lineKey} className="my-1 text-sm leading-relaxed min-w-0 max-w-full [overflow-wrap:anywhere] [word-break:break-word]">
          {renderLineSegments(line, lineKey)}
        </div>
      );
    });
  }, [content, block]);

  const baseStyle: CSSProperties = {
    color: 'inherit',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    ...style,
  };

  if (block) {
    return (
      <div className={`katex-root-block w-full max-w-full min-w-0 overflow-x-hidden [overflow-wrap:anywhere] [word-break:break-word] ${className}`} style={baseStyle}>
        {renderedContent}
      </div>
    );
  }

  return (
    <span className={`katex-root-inline max-w-full min-w-0 [overflow-wrap:anywhere] [word-break:break-word] ${className}`} style={baseStyle}>
      {renderedContent}
    </span>
  );
});

export default MathText;
