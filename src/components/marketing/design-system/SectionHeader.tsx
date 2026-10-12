import React from 'react';

export interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  highlight?: string;
  description?: string;
  accent?: 'default' | 'captain' | 'crew';
  align?: 'center' | 'left';
  className?: string;
  dark?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  highlight,
  description,
  accent = 'default',
  align = 'center',
  className = '',
  dark = false,
}) => {
  const accentClasses = {
    default: {
      eyebrow: dark ? 'text-teal-400' : 'text-indigo-600',
      highlight: 'bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400 bg-clip-text text-transparent',
    },
    captain: {
      eyebrow: dark ? 'text-amber-400' : 'text-amber-600',
      highlight: 'bg-gradient-to-r from-amber-500 via-orange-400 to-teal-400 bg-clip-text text-transparent',
    },
    crew: {
      eyebrow: dark ? 'text-violet-400' : 'text-violet-600',
      highlight: 'bg-gradient-to-r from-violet-500 via-indigo-500 to-teal-400 bg-clip-text text-transparent',
    },
  }[accent];

  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <div className={`max-w-3xl mb-12 sm:mb-16 ${alignment} ${className}`}>
      {/* Eyebrow Label */}
      <div className="mb-3">
        <span
          className={`font-mono text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 shadow-xs ${accentClasses.eyebrow}`}
        >
          {eyebrow}
        </span>
      </div>

      {/* Two-tone Heading */}
      <h2
        className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight font-display ${
          dark ? 'text-white' : 'text-slate-950'
        }`}
      >
        {title}{' '}
        {highlight && (
          <span className={`inline-block ${accentClasses.highlight}`}>
            {highlight}
          </span>
        )}
      </h2>

      {/* Description */}
      {description && (
        <p
          className={`mt-4 text-sm sm:text-base lg:text-lg leading-relaxed ${
            dark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
};
