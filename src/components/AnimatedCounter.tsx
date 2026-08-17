import React from 'react';
import { useCountUp } from '../hooks/useCountUp';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatter?: (val: number, isComplete?: boolean) => string;
  finalDisplay?: string;
  separator?: boolean;
  triggerOnView?: boolean;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatter,
  finalDisplay,
  separator = true,
  triggerOnView = true,
  className = '',
}) => {
  const numericVal = typeof value === 'number' && !isNaN(value) ? value : 0;

  const { ref, displayString } = useCountUp({
    end: numericVal,
    duration,
    decimals,
    prefix,
    suffix,
    separator,
    triggerOnView,
    finalDisplay,
    formattingFn: formatter ? (val, isDone) => formatter(val, isDone) : undefined,
  });

  return (
    <span ref={ref} className={className}>
      {displayString}
    </span>
  );
};
