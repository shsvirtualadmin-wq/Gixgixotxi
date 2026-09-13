import React, { useState, useEffect } from 'react';
import { parseMathParts, renderKaTeX, isKaTeXLoaded, loadKaTeX } from '../lib/mathConverter';

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
  const [katexReady, setKatexReady] = useState(() => isKaTeXLoaded());

  if (!text) return null;

  const parts = parseMathParts(text);
  const hasMath = parts.some(
    p => p.type !== 'text' || /\\+(?:displaystyle|begin|end|pmatrix|bmatrix|vmatrix|frac|sqrt|lim|int|sum|prod|alpha|beta|gamma|delta|theta|pi|lambda|mu|sigma|omega|Delta)/.test(p.content)
  );

  useEffect(() => {
    if (hasMath && !katexReady) {
      loadKaTeX().then(() => {
        setKatexReady(true);
      });
    }
  }, [hasMath, katexReady]);

  const containerClasses = `${block ? 'block' : 'inline'} ${
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
                className="inline-block align-middle my-0.5 py-0.5 px-0.5 max-w-full text-current leading-normal overflow-visible math-inline-wrapper"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }
          const cleanText = part.content
            .replace(/(?<![\\a-zA-Z0-9_])->|-->(?![\\a-zA-Z0-9_])/g, '→')
            .replace(/(?<=\b[a-zA-Z0-9]\b)\s*\*\s*(?=\b[a-zA-Z0-9]\b)/g, ' × ');
          return <React.Fragment key={index}>{cleanText}</React.Fragment>;
        }

        const isDisplay = part.type === 'display-math';
        const html = renderKaTeX(part.content, isDisplay);

        if (isDisplay) {
          return (
            <span
              key={index}
              className="block my-1.5 text-center overflow-x-auto overflow-y-hidden max-w-full"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return (
          <span
            key={index}
            className="inline-block align-middle my-0.5 py-0.5 px-0.5 max-w-full text-current leading-normal overflow-visible math-inline-wrapper"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
});

export default MathText;

