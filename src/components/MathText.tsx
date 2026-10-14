import React from 'react';
import { MathText as UiMathText, normalizeMath } from './ui/MathText';

export { normalizeMath };

export interface MathTextProps {
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
  return <UiMathText text={text} className={className} isUrduOrIslamiat={isUrduOrIslamiat} block={block} />;
});

export default MathText;
