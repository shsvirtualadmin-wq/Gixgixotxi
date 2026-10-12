import React from 'react';

export interface SectionProps {
  id?: string;
  variant?: 'light' | 'dark';
  accent?: 'default' | 'captain' | 'crew';
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  id,
  variant = 'light',
  accent = 'default',
  className = '',
  containerClassName = '',
  children,
}) => {
  // Accent glow colors for dark sections
  const darkGlow = {
    default: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.18) 0%, rgba(13, 148, 136, 0.08) 50%, transparent 80%)',
    captain: 'radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.18) 0%, rgba(13, 148, 136, 0.10) 50%, transparent 80%)',
    crew: 'radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.18) 0%, rgba(13, 148, 136, 0.10) 50%, transparent 80%)',
  }[accent];

  if (variant === 'dark') {
    return (
      <section
        id={id}
        className={`relative w-full py-16 sm:py-24 overflow-hidden bg-[#0a0d24] text-slate-100 border-y border-indigo-950/40 ${className}`}
      >
        {/* Deep indigo background with subtle grid and accent glow */}
        <div
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            background: darkGlow,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] -z-10"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
          aria-hidden="true"
        />

        <div className={`max-w-6xl mx-auto px-4 sm:px-6 relative z-10 ${containerClassName}`}>
          {children}
        </div>
      </section>
    );
  }

  // Light variant: soft lavender/blue tinted gradient with faint grid
  return (
    <section
      id={id}
      className={`relative w-full py-16 sm:py-24 overflow-hidden bg-gradient-to-b from-[#f6f5ff] via-[#eef2ff] to-[#f0f6ff] text-slate-900 ${className}`}
    >
      {/* Faint 40px grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.45] -z-10"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(99, 102, 241, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      <div className={`max-w-6xl mx-auto px-4 sm:px-6 relative z-10 ${containerClassName}`}>
        {children}
      </div>
    </section>
  );
};
