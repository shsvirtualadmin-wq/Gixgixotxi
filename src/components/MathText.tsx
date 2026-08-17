import React from 'react';
import { parseMathParts, renderKaTeX } from '../lib/mathConverter';

interface MathTextProps {
  text: string;
  className?: string;
  isUrduOrIslamiat?: boolean;
  block?: boolean;
}

export const MathText: React.FC<MathTextProps> = React.memo(({
  text,
  className = '',
  isUrduOrIslamiat = false,
  block = false,
}) => {
  if (!text) return null;

  const parts = parseMathParts(text);

  const containerClasses = `${block ? 'block' : 'inline-wrap'} ${
    isUrduOrIslamiat ? 'font-["Noto_Nastaliq_Urdu","Noto_Sans_Arabic",serif]' : ''
  } ${className}`;

  return (
    <span className={containerClasses}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          // Fail-safe check: if part.content contains un-delimited raw LaTeX commands (e.g. \displaystyle or \begin{)
          // renderKaTeX them so raw LaTeX source code is NEVER displayed as raw text to the user
          if (/\\+(?:displaystyle|begin|end|pmatrix|bmatrix|vmatrix|frac|sqrt|lim|int|sum|prod|alpha|beta|gamma|delta|theta|pi|lambda|mu|sigma|omega|Delta)/.test(part.content)) {
            const html = renderKaTeX(part.content, false);
            return (
              <span
                key={index}
                className="inline-block align-middle my-0.5 py-0.5 px-1 max-w-full overflow-x-auto text-current leading-normal"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }
          return <React.Fragment key={index}>{part.content}</React.Fragment>;
        }

        const isDisplay = part.type === 'display-math';
        const html = renderKaTeX(part.content, isDisplay);

        if (isDisplay) {
          return (
            <span
              key={index}
              className="block my-2 text-center overflow-x-auto py-1.5 px-2 bg-black/5  rounded-xl border border-black/5 "
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return (
          <span
            key={index}
            className="inline-block align-middle my-0.5 py-0.5 px-1 max-w-full overflow-x-auto text-current leading-normal"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
});

export default MathText;
