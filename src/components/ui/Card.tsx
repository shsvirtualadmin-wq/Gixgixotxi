import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hero' | 'animated-border' | 'solid';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  ...props
}) => {
  if (variant === 'animated-border') {
    return (
      <div
        className={`animated-border-card ${interactive ? 'hover:scale-[1.01] transition-transform duration-300' : ''} ${className}`}
        {...props}
      >
        <div className="inner-content p-6 sm:p-8 backdrop-blur-xl border border-white/10">
          {children}
        </div>
      </div>
    );
  }

  const radiusClass = variant === 'hero' ? 'rounded-[28px]' : 'rounded-[20px]';
  const interactiveClasses = interactive
    ? 'hover:bg-[rgba(255,255,255,0.09)] hover:border-white/20 hover:scale-[1.01] transition-all duration-300 cursor-pointer'
    : '';

  return (
    <div
      className={`relative bg-[rgba(255,255,255,0.06)] backdrop-blur-[20px] saturate-[140%] border border-white/12 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.08)] ${radiusClass} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
