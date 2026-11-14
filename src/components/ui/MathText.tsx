import React, { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type katexType from 'katex';
import 'katex/dist/katex.min.css';
import { convertAsciiMathToLatex, normalizeLatexThousandsCommas, cleanMcqOptionText } from '@/lib/math';

type KatexModule = typeof katexType;

let katexInstance: KatexModule | null = null;
let katexLoadPromise: Promise<KatexModule> | null = null;
const katexListeners = new Set<() => void>();

/**
 * Lazy-loads KaTeX and mhchem only when a math segment is actually rendered or validated.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function ensureKatexLoaded(): Promise<KatexModule | null> {
  if (katexInstance) {
    return Promise.resolve(katexInstance);
  }
  if (!katexLoadPromise) {
    katexLoadPromise = import('katex')
      .then(async (mod) => {
        const resolved = (mod.default ?? mod) as KatexModule;
        try {
          await import('katex/contrib/mhchem');
        } catch {
          // mhchem optional contrib
        }
        katexInstance = resolved;
        katexListeners.forEach((cb) => cb());
        katexListeners.clear();
        return resolved;
      })
      .catch((err) => {
        console.warn('[MathText] Failed to load KaTeX chunk:', err);
        katexLoadPromise = null;
        return null as unknown as KatexModule;
      });
  }
  return katexLoadPromise;
}

export interface ValidateMathResult {
  ok: boolean;
  errors: string[];
  valid?: boolean;
  error?: string;
}

/**
 * Validates all math segments ($...$ and $$...$$) in the provided text.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function validateMath(text: string): ValidateMathResult {
  if (!text || typeof text !== 'string') {
    return { ok: true, valid: true, errors: [] };
  }

  const normalized = convertAsciiMathToLatex(text);
  const errors: string[] = [];
  const regex = /(?:\\\$)|(?:\$\$([\s\S]+?)\$\$)|(?:\\\[([\s\S]+?)\\\])|(?:\$([^$\n]+?)\$)|(?:\\\(([\s\S]+?)\\\))/g;
  let match: RegExpExecArray | null;

  // Trigger lazy load in background if not yet loaded
  if (!katexInstance) {
    void ensureKatexLoaded();
  }

  while ((match = regex.exec(normalized)) !== null) {
    if (match[0] === '\\$') {
      continue;
    }

    const isDisplay = match[1] !== undefined || match[2] !== undefined;
    const formula = match[1] ?? match[2] ?? match[3] ?? match[4];

    if (!formula || formula.trim().length === 0) {
      errors.push('Empty math block found');
      continue;
    }

    if (katexInstance) {
      try {
        katexInstance.renderToString(formula.trim(), {
          displayMode: isDisplay,
          throwOnError: true,
          strict: false,
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

const convertedTextCache = new Map<string, string>();
const MAX_CONVERTED_CACHE = 2000;

function getNormalizedMathString(raw: string): string {
  const cached = convertedTextCache.get(raw);
  if (cached !== undefined) return cached;

  const preCleaned =
    raw.length <= 48 ? cleanMcqOptionText(raw) : normalizeLatexThousandsCommas(raw);
  const converted = convertAsciiMathToLatex(preCleaned);
  if (convertedTextCache.size >= MAX_CONVERTED_CACHE) {
    const firstKey = convertedTextCache.keys().next().value;
    if (firstKey !== undefined) convertedTextCache.delete(firstKey);
  }
  convertedTextCache.set(raw, converted);
  return converted;
}

/**
 * Tokenizes string into plain text, inline math ($...$ or \(...\)), and display math ($$...$$ or \[...\]).
 * Automatically runs the safe ASCII-to-LaTeX fallback converter and protects currency dollar signs.
 */
function parseMathText(raw: string): ParsedSegment[] {
  if (!raw || typeof raw !== 'string') return [];

  const normalized = getNormalizedMathString(raw);
  const segments: ParsedSegment[] = [];
  const regex = /(?:\\\$)|(?:\$\$([\s\S]+?)\$\$)|(?:\\\[([\s\S]+?)\\\])|(?:\$([^$\n]+?)\$)|(?:\\\(([\s\S]+?)\\\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    const matchStart = match.index;
    const matchEnd = regex.lastIndex;

    if (matchStart > lastIndex) {
      const textBefore = normalized.substring(lastIndex, matchStart).replace(/\\\$/g, '$');
      if (textBefore.length > 0) {
        segments.push({ type: 'text', content: textBefore });
      }
    }

    if (match[0] === '\\$') {
      segments.push({ type: 'text', content: '$' });
    } else if (match[1] !== undefined || match[2] !== undefined) {
      segments.push({ type: 'display-math', content: (match[1] ?? match[2])! });
    } else if (match[3] !== undefined || match[4] !== undefined) {
      segments.push({ type: 'inline-math', content: (match[3] ?? match[4])! });
    }

    lastIndex = matchEnd;
  }

  if (lastIndex < normalized.length) {
    const remaining = normalized.substring(lastIndex).replace(/\\\$/g, '$');
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
 */
function renderInlineMarkdown(text: string, keyPrefix: string): React.ReactNode[] {
  if (!text) return [];

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
const MAX_KATEX_CACHE = 1600;

function renderFormulaWithKatex(formula: string, isDisplay: boolean): string {
  const trimmed = formula.trim();
  const cacheKey = `${isDisplay ? 'D' : 'I'}:${trimmed}`;
  const cached = katexHtmlCache.get(cacheKey);
  if (cached !== undefined) return cached;

  if (!katexInstance) {
    void ensureKatexLoaded();
    return '';
  }

  try {
    const html = katexInstance.renderToString(trimmed, {
      displayMode: isDisplay,
      throwOnError: false,
      errorColor: '#D71921',
      strict: false,
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
    return html;
  } catch (err) {
    console.warn('[MathText] Rendering error fallback:', err, formula);
    return '';
  }
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
  const html = renderFormulaWithKatex(seg.content, isDisplay);

  if (!html) {
    return (
      <span
        key={`${prefix}-fallback-${index}`}
        dir="ltr"
        style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
        className="katex-fallback font-mono text-sm px-1 py-0.5 rounded bg-[var(--surface-2)] [overflow-wrap:anywhere] [word-break:break-word]"
      >
        {seg.content}
      </span>
    );
  }

  if (isDisplay) {
    return (
      <span
        key={`${prefix}-disp-${index}`}
        dir="ltr"
        className="katex-display-box block my-2.5 overflow-x-auto max-w-full min-w-0 text-center py-1 scrollbar-none"
        style={{ WebkitOverflowScrolling: 'touch', direction: 'ltr', unicodeBidi: 'isolate' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      key={`${prefix}-inline-${index}`}
      dir="ltr"
      className="katex-inline-math inline leading-none align-baseline max-w-full min-w-0 overflow-x-auto"
      style={{ WebkitOverflowScrolling: 'touch', direction: 'ltr', unicodeBidi: 'isolate' }}
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
 * Universal MathText renderer with lazy-loaded KaTeX, string memoization/caching,
 * currency-dollar protection, and automatic ASCII-to-LaTeX fallback conversion.
 */
export const MathText = React.memo(function MathText({
  children,
  text,
  className = '',
  block = false,
  style,
}: MathTextProps) {
  const content = text ?? children ?? '';
  const [katexReady, setKatexReady] = useState<boolean>(() => Boolean(katexInstance));

  useEffect(() => {
    if (katexInstance || !content) return;
    let mounted = true;
    const onLoaded = () => {
      if (mounted) setKatexReady(true);
    };
    katexListeners.add(onLoaded);
    void ensureKatexLoaded().then(onLoaded);
    return () => {
      mounted = false;
      katexListeners.delete(onLoaded);
    };
  }, [content]);

  const renderedContent = useMemo(() => {
    if (!content) return null;
    // Reference katexReady so useMemo recomputes once lazy KaTeX resolves
    void katexReady;

    if (!block) {
      const parsed = parseMathText(content);
      return parsed.map((seg, index) => renderMathSegment(seg, index, 'inline'));
    }

    const lines = content.split('\n');

    return lines.map((line, lIdx) => {
      const lineKey = `line-${lIdx}`;
      const trimmed = line.trim();

      if (line.startsWith('### ')) {
        const title = line.slice(4).trim();
        return (
          <h4
            key={lineKey}
            dir="ltr"
            className="font-bold text-xs uppercase tracking-wider text-[var(--accent,#D71921)] mt-3.5 mb-1.5 font-mono select-none [overflow-wrap:anywhere] [word-break:break-word]"
          >
            {renderLineSegments(title, lineKey)}
          </h4>
        );
      }

      if (line.startsWith('## ')) {
        const title = line.slice(3).trim();
        return (
          <h3
            key={lineKey}
            dir="ltr"
            className="font-bold text-sm uppercase tracking-wide text-[var(--accent,#D71921)] mt-4 mb-2 font-display [overflow-wrap:anywhere] [word-break:break-word]"
          >
            {renderLineSegments(title, lineKey)}
          </h3>
        );
      }

      if (line.startsWith('# ')) {
        const title = line.slice(2).trim();
        return (
          <h2
            key={lineKey}
            dir="ltr"
            className="font-bold text-base text-[var(--text)] mt-4 mb-2 font-display [overflow-wrap:anywhere] [word-break:break-word]"
          >
            {renderLineSegments(title, lineKey)}
          </h2>
        );
      }

      const orderedMatch = line.match(/^(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        const num = orderedMatch[1];
        const body = orderedMatch[2];
        return (
          <div key={lineKey} dir="ltr" className="flex items-start gap-2 my-1 text-sm leading-relaxed min-w-0 max-w-full">
            <span className="font-bold text-xs text-[var(--accent,#D71921)] min-w-[20px] select-none pt-0.5 shrink-0">
              {num}.
            </span>
            <div className="flex-1 min-w-0 [overflow-wrap:anywhere] [word-break:break-word]">
              {renderLineSegments(body, lineKey)}
            </div>
          </div>
        );
      }

      const bulletMatch = line.match(/^[-*]\s+(.*)$/);
      if (bulletMatch) {
        const body = bulletMatch[1];
        return (
          <div key={lineKey} dir="ltr" className="flex items-start gap-2 my-1 text-sm leading-relaxed min-w-0 max-w-full">
            <span className="text-[var(--accent,#D71921)] select-none text-base leading-none pt-0.5 shrink-0">
              &bull;
            </span>
            <div className="flex-1 min-w-0 [overflow-wrap:anywhere] [word-break:break-word]">
              {renderLineSegments(body, lineKey)}
            </div>
          </div>
        );
      }

      if (!trimmed) {
        return <div key={lineKey} className="h-1.5" />;
      }

      return (
        <div
          key={lineKey}
          dir="ltr"
          className="my-1 text-sm leading-relaxed min-w-0 max-w-full [overflow-wrap:anywhere] [word-break:break-word]"
        >
          {renderLineSegments(line, lineKey)}
        </div>
      );
    });
  }, [content, block, katexReady]);

  const baseStyle: CSSProperties = {
    color: 'inherit',
    direction: 'ltr',
    unicodeBidi: 'isolate',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    ...style,
  };

  if (block) {
    return (
      <div
        dir="ltr"
        className={`katex-root-block w-full max-w-full min-w-0 overflow-x-hidden [overflow-wrap:anywhere] [word-break:break-word] ${className}`}
        style={baseStyle}
      >
        {renderedContent}
      </div>
    );
  }

  return (
    <span
      dir="ltr"
      className={`katex-root-inline max-w-full min-w-0 [overflow-wrap:anywhere] [word-break:break-word] ${className}`}
      style={baseStyle}
    >
      {renderedContent}
    </span>
  );
});

export default MathText;
