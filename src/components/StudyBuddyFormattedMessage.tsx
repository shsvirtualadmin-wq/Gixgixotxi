import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { sanitizeStudyBuddyText } from '../lib/studyBuddySanitizer';
import { preprocessMathText, renderKaTeX } from '../lib/mathConverter';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface StudyBuddyFormattedMessageProps {
  content: string;
  className?: string;
  isUser?: boolean;
  theme?: 'light' | 'dark';
}

const CodeBlock: React.FC<{ codeText: string; language?: string; isLight?: boolean }> = ({
  codeText,
  language,
  isLight = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="relative my-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 shadow-sm font-mono text-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/70 border-b border-slate-800 text-[11px] text-slate-400 font-sans">
        <span className="uppercase tracking-wider font-semibold">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto leading-relaxed text-slate-100">
        <code>{codeText}</code>
      </pre>
    </div>
  );
};

export const StudyBuddyFormattedMessage: React.FC<StudyBuddyFormattedMessageProps> = React.memo(({
  content,
  className = '',
  isUser = false,
  theme = 'light',
}) => {
  const sanitized = sanitizeStudyBuddyText(content);
  const processed = sanitized ? preprocessMathText(sanitized) : '';

  if (!processed) return null;

  const isLight = theme === 'light';

  return (
    <div
      className={`study-buddy-message font-sans space-y-2 text-xs sm:text-sm leading-relaxed overflow-x-auto ${
        isUser
          ? 'is-user text-white font-medium'
          : isLight
          ? 'text-slate-800'
          : 'text-slate-100'
      } ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [
            rehypeKatex,
            {
              throwOnError: false,
              strict: false,
              trust: true,
              errorColor: 'inherit',
            },
          ],
        ]}
        components={{
          p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed block">{children}</p>,
          h1: ({ children }) => (
            <h1
              className={`font-black text-base sm:text-lg mt-3 mb-2 border-b pb-1.5 block tracking-tight ${
                isUser
                  ? 'text-white border-white/20'
                  : isLight
                  ? 'text-slate-900 border-slate-200'
                  : 'text-violet-300 border-violet-500/30'
              }`}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={`font-black text-sm sm:text-base mt-3 mb-1.5 block tracking-tight ${
                isUser
                  ? 'text-white'
                  : isLight
                  ? 'text-slate-900'
                  : 'text-violet-300'
              }`}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={`font-extrabold text-xs sm:text-sm mt-2.5 mb-1 block tracking-wide ${
                isUser
                  ? 'text-white font-black'
                  : isLight
                  ? 'text-slate-900'
                  : 'text-violet-300'
              }`}
            >
              {children}
            </h3>
          ),
          strong: ({ children }) => (
            <strong
              className={`font-bold ${
                isUser
                  ? 'text-white font-black'
                  : isLight
                  ? 'text-slate-950 font-extrabold'
                  : 'text-indigo-300 font-extrabold'
              }`}
            >
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className={`italic ${isUser ? 'text-white/90' : isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul
              className={`list-disc list-outside ml-4 my-2 space-y-1 ${
                isUser ? 'text-white' : isLight ? 'text-slate-800' : 'text-slate-100'
              }`}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className={`list-decimal list-outside ml-4 my-2 space-y-1 ${
                isUser ? 'text-white' : isLight ? 'text-slate-800' : 'text-slate-100'
              }`}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
          code: ({ inline, children, className: codeClassName, ...props }: any) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const rawString = String(children).replace(/\n$/, '');
            const lang = (match?.[1] || '').toLowerCase();
            const isMathCode =
              lang === 'math' ||
              lang === 'latex' ||
              lang === 'katex' ||
              /\\+(?:displaystyle|lim|frac|sqrt|int|sum|prod|alpha|beta|gamma|delta|theta|pi|lambda|mu|sigma|omega|Delta|begin|end|mathbf|mathrm|partial|infty|approx|neq|le|ge|pm|times|cdot)/.test(
                rawString
              );

            if (isMathCode) {
              const html = renderKaTeX(rawString, !inline || rawString.includes('\n'));
              return (
                <span
                  className={
                    inline
                      ? 'inline-block align-middle my-0.5 px-0.5 max-w-full text-current leading-normal overflow-visible'
                      : 'block my-2.5 overflow-x-auto text-center max-w-full py-1'
                  }
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            }

            if (!inline && (codeClassName || rawString.includes('\n'))) {
              return <CodeBlock codeText={rawString} language={match?.[1]} isLight={isLight} />;
            }
            return (
              <code
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                  isUser
                    ? 'bg-white/20 text-white'
                    : isLight
                    ? 'bg-slate-100 text-indigo-700 border border-slate-200 font-semibold'
                    : 'bg-slate-900/80 text-violet-300 border border-violet-500/30'
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote
              className={`border-l-3 pl-3.5 my-2.5 italic py-1 rounded-r-xl ${
                isUser
                  ? 'border-white/60 text-white bg-white/10'
                  : isLight
                  ? 'border-indigo-500 text-slate-700 bg-indigo-50/50'
                  : 'border-violet-500 text-slate-300 bg-violet-950/20'
              }`}
            >
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={isLight ? 'bg-slate-100/90 text-slate-900 font-bold' : 'bg-slate-800 text-slate-100 font-bold'}>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {children}
            </tbody>
          ),
          tr: ({ children }) => <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3.5 py-2.5 font-bold tracking-tight">{children}</th>,
          td: ({ children }) => <td className="px-3.5 py-2 leading-normal">{children}</td>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-0.5 underline font-semibold transition-colors ${
                isUser
                  ? 'text-white hover:text-white/80'
                  : isLight
                  ? 'text-indigo-600 hover:text-indigo-800'
                  : 'text-violet-400 hover:text-violet-300'
              }`}
            >
              <span>{children}</span>
              <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-70" />
            </a>
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
});

export default StudyBuddyFormattedMessage;
