import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { normalizeBoardyMath } from '../lib/boardyMath';

interface FormattedExplanationProps {
  text: string;
  className?: string;
  isUrduOrIslamiat?: boolean;
}

export const FormattedExplanation: React.FC<FormattedExplanationProps> = React.memo(({
  text,
  className = '',
  isUrduOrIslamiat = false,
}) => {
  if (!text) return null;

  const processedText = normalizeBoardyMath(text);

  return (
    <div className={`formatted-explanation ${isUrduOrIslamiat ? 'font-["Noto_Nastaliq_Urdu","Noto_Sans_Arabic",serif] text-right' : ''} ${className}`}>
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
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-700">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-indigo-700">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
          h1: ({ children }) => <h1 className="font-bold text-base mt-2 mb-1 text-indigo-900">{children}</h1>,
          h2: ({ children }) => <h2 className="font-bold text-sm mt-2 mb-1 text-indigo-800">{children}</h2>,
          h3: ({ children }) => <h3 className="font-semibold text-xs mt-1.5 mb-1 text-indigo-700">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc list-outside ml-4 my-2 space-y-1 text-slate-700">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside ml-4 my-2 space-y-1 text-slate-700">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
          code: ({ inline, children, ...props }: any) => (
            inline ? (
              <code className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-indigo-700 border border-slate-200" {...props}>
                {children}
              </code>
            ) : (
              <code className="block p-2 rounded-lg text-xs font-mono bg-slate-900 text-slate-200 border border-slate-700/60 my-2 overflow-x-auto" {...props}>
                {children}
              </code>
            )
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-indigo-500 pl-3 my-2 italic text-slate-700 bg-indigo-50/50 py-1 rounded-r">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-100 font-bold">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-slate-200">{children}</tbody>,
          th: ({ children }) => <th className="px-3 py-2 font-semibold">{children}</th>,
          td: ({ children }) => <td className="px-3 py-1.5">{children}</td>,
        }}
      >
        {processedText}
      </ReactMarkdown>
    </div>
  );
});

export default FormattedExplanation;
