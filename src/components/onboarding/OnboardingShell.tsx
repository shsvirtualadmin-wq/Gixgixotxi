import type { ReactNode } from 'react';

const STEPS = ['University', 'Test Date', 'Subjects', 'Summary'];

interface OnboardingShellProps {
  step: number; // 1-indexed
  children: ReactNode;
}

export function OnboardingShell({ step, children }: OnboardingShellProps) {
  const pct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div
      className="page-enter"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '2rem 1.5rem',
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <img src="/assets/boardly-logo.svg" alt="Boardly" style={{ height: 30 }}
          onError={(e) => { (e.target as HTMLImageElement).src = '/boardly-logo.png'; }} />
      </div>

      {/* Step indicators */}
      <div style={{ width: '100%', maxWidth: 520, marginBottom: 32 }}>
        {/* Label */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step {step} of {STEPS.length}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>{STEPS[step - 1]}</span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--brand), var(--brand-2))',
            borderRadius: 2,
            transition: 'width 600ms var(--ease-out)',
          }} />
        </div>
        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i + 1 <= step ? 'var(--brand)' : 'var(--border)',
                transition: 'background 300ms',
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ width: '100%', maxWidth: 520 }}>
        {children}
      </div>
    </div>
  );
}
