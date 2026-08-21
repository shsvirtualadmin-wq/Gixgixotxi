import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { sanitizeStudyBuddyText } from '../lib/studyBuddySanitizer';
import { preprocessMathText } from '../lib/mathConverter';

interface StudyBuddyFormattedMessageProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

export const StudyBuddyFormattedMessage: React.FC<StudyBuddyFormattedMessageProps> = React.memo(({
  content,
  className = '',
  isUser = false,
}) => {
  const sanitized = sanitizeStudyBuddyText(content);
  const processed = sanitized ? preprocessMathText(sanitized) : '';

  if (!processed) return null;

  return (
    <div
      className={`study-buddy-message font-sans space-y-2 text-xs sm:text-sm leading-relaxed overflow-x-auto ${
        isUser ? 'is-user text-white font-medium' : 'text-slate-100'
      } ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed block">{children}</p>,
          h1: ({ children }) => (
            <h1
              className={`font-black text-base sm:text-lg mt-4 mb-2.5 border-b pb-1.5 block tracking-tight ${
                isUser ? 'text-slate-950 border-slate-950/20' : 'text-blue-300  border-blue-500/30'
              }`}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={`font-black text-sm sm:text-base mt-4 mb-2 block tracking-tight ${
                isUser ? 'text-slate-950' : 'text-blue-300 '
              }`}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={`font-extrabold text-xs sm:text-sm mt-3.5 mb-1.5 block tracking-wide ${
                isUser ? 'text-slate-950 font-black' : 'text-blue-300 '
              }`}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className={`font-bold text-xs mt-3 mb-1 block ${
                isUser ? 'text-slate-950' : 'text-blue-300 '
              }`}
            >
              {children}
            </h4>
          ),
          strong: ({ children }) => (
            <strong className={`font-bold ${isUser ? 'text-slate-950 font-black' : 'text-[#60A5FA]'}`}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className={`italic ${isUser ? 'text-slate-900' : 'text-slate-200'}`}>{children}</em>
          ),
          ul: ({ children }) => (
            <ul
              className={`list-disc list-outside ml-4 my-2 space-y-1 ${
                isUser ? 'text-slate-950' : 'text-slate-100'
              }`}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className={`list-decimal list-outside ml-4 my-2 space-y-1 ${
                isUser ? 'text-slate-950' : 'text-slate-100'
              }`}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
          code: ({ inline, children, className, ...props }: any) => {
            return inline ? (
              <code
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                  isUser
                    ? 'bg-slate-900/10 text-slate-950 border border-slate-950/20'
                    : 'bg-slate-900/80 text-[#60A5FA] border border-[#1E5AFF]/30'
                }`}
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                className={`block p-2.5 rounded-lg text-xs font-mono overflow-x-auto my-2 ${
                  isUser
                    ? 'bg-slate-900/10 text-slate-950 border border-slate-950/20'
                    : 'bg-slate-950 text-slate-200 border border-[#1E5AFF]/30'
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote
              className={`border-l-2 pl-3 my-2 italic py-1 rounded-r ${
                isUser
                  ? 'border-slate-900/60 text-slate-900 bg-slate-900/5'
                  : 'border-[#1E5AFF]/60 text-slate-300 bg-[#1E5AFF]/10'
              }`}
            >
              {children}
            </blockquote>
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
});

export default StudyBuddyFormattedMessage;
