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

// Convert any uppercase or mixed string to sentence case
function formatSentenceCase(str: string): string {
  if (!str) return '';
  const trimmed = str.trim();
  // If it's already mixed/sentence case without being all-caps, keep it as is
  if (!/^[A-Z\s\-_0-9&,.]+$/.test(trimmed)) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
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
      eyebrowDark: 'text-[#93c5fd]',
      eyebrowLight: 'text-indigo-600',
      highlight: 'bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-400 bg-clip-text text-transparent',
    },
    captain: {
      eyebrowDark: 'text-[#fcd34d]',
      eyebrowLight: 'text-amber-700',
      highlight: 'bg-gradient-to-r from-amber-500 via-orange-400 to-teal-400 bg-clip-text text-transparent',
    },
    crew: {
      eyebrowDark: 'text-[#c7d2fe]',
      eyebrowLight: 'text-violet-700',
      highlight: 'bg-gradient-to-r from-violet-500 via-indigo-500 to-teal-400 bg-clip-text text-transparent',
    },
  }[accent];

  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <div className={`max-w-3xl mb-10 sm:mb-14 ${alignment} ${className}`}>
      {/* Eyebrow Label - Sentence case, 12-13px, weight 600, letter-spacing 0 */}
      <div className="mb-3">
        <span
          className={`inline-block text-[12px] sm:text-[13px] font-semibold tracking-normal px-3 py-1 rounded-full shadow-xs ${
            dark
              ? `${accentClasses.eyebrowDark}`
              : `bg-white/80 border border-slate-200/80 ${accentClasses.eyebrowLight}`
          }`}
          style={
            dark
              ? {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                }
              : undefined
          }
        >
          {formatSentenceCase(eyebrow)}
        </span>
      </div>

      {/* Two-tone Heading: 1.2 line height */}
      <h2
        className={`text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.2] font-display ${
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
          className={`mt-4 text-sm sm:text-base leading-relaxed ${
            dark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
};
