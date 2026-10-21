import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';

const STEPS = ['Subjects', 'Summary'];

interface OnboardingShellProps {
  step: number; // 1-indexed
  children: ReactNode;
}

export function OnboardingShell({ step, children }: OnboardingShellProps) {
  const pct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-black">
      {/* Centered container with max-w-lg card */}
      <div className="w-full max-w-lg mx-auto my-auto flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center">
          <Logo size="onboarding" />
        </div>

        {/* Step indicators */}
        <div className="w-full mb-6">
          {/* Label */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
              Step {step} of {STEPS.length}
            </span>
            <span className="text-xs font-bold text-[var(--red)]">
              {STEPS[step - 1]}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--red)] rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Step dots */}
          <div className="flex justify-between mt-2 px-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center">
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i + 1 <= step ? 'bg-[var(--red)]' : 'bg-neutral-800'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Card: w-full max-w-lg mx-auto p-6 sm:p-8, readable typography */}
        <div className="w-full rounded-2xl bg-[#111111] border border-[#2A2A2A] p-6 sm:p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}

export default OnboardingShell;
