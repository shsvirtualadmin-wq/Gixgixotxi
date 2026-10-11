import React from 'react';
import { renderMath } from '../lib/boardyMath';

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

  const html = renderMath(text);

  const containerClasses = `${block ? 'block' : 'inline'} ${
    isUrduOrIslamiat ? 'font-["Noto_Nastaliq_Urdu","Noto_Sans_Arabic",serif]' : ''
  } ${className}`;

  return (
    <span
      className={containerClasses}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

export default MathText;
