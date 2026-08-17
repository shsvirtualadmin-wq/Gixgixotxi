import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { preprocessMathText } from '../lib/mathConverter';

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

  const processedText = preprocessMathText(text);

  return (
    <div className={`formatted-explanation ${isUrduOrIslamiat ? 'font-["Noto_Nastaliq_Urdu","Noto_Sans_Arabic",serif] text-right' : ''} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-200">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-[#F2B90C]">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
          h1: ({ children }) => <h1 className="font-bold text-base mt-2 mb-1 text-[#F2B90C]">{children}</h1>,
          h2: ({ children }) => <h2 className="font-bold text-sm mt-2 mb-1 text-[#F2B90C]">{children}</h2>,
          h3: ({ children }) => <h3 className="font-semibold text-xs mt-1.5 mb-1 text-[#F2B90C]">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc list-outside ml-4 my-2 space-y-1 text-slate-200">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside ml-4 my-2 space-y-1 text-slate-200">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
          code: ({ inline, children, ...props }: any) => (
            inline ? (
              <code className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-[#F2B90C] border border-slate-700/60" {...props}>
                {children}
              </code>
            ) : (
              <code className="block p-2 rounded-lg text-xs font-mono bg-slate-900 text-slate-200 border border-slate-700/60 my-2 overflow-x-auto" {...props}>
                {children}
              </code>
            )
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#F2B90C]/60 pl-3 my-2 italic text-slate-300 bg-white/5 py-1 rounded-r">
              {children}
            </blockquote>
          ),
        }}
      >
        {processedText}
      </ReactMarkdown>
    </div>
  );
});

export default FormattedExplanation;
