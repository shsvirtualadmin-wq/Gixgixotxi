import React, { useState } from 'react';
import { Lock, UserPlus, X } from 'lucide-react';
import { GuestUpgradeModal } from '@/components/auth/GuestUpgradeModal';

export interface GuestProBlockedViewProps {
  /** When rendered inside a modal/sheet, provide an onClose callback */
  onClose?: () => void;
  variant?: 'page' | 'sheet';
}

/**
 * PART B Rule 5:
 * "PRO IS NOT AVAILABLE TO GUESTS.
 * - Do NOT list, describe, advertise, or explain Pro features anywhere for guests.
 *   No feature lists, no pricing pitch, no upsell cards, no 'unlock Pro' banners in guest mode.
 * - If a guest taps anything that is Pro-only, or tries to open the Pro, plans or checkout pages,
 *   show only one short message: 'You can't use this feature as a guest.' with a button 'Create account'
 *   (Google or email and password). Nothing else about Pro is shown."
 */
export const GuestProBlockedView: React.FC<GuestProBlockedViewProps> = ({
  onClose,
  variant = 'page',
}) => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (variant === 'sheet') {
    return (
      <>
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          onClick={onClose}
        >
          <div
            className="relative w-full max-w-sm rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 sm:p-7 text-center space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full glass-pill flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            )}

            <div className="w-12 h-12 rounded-2xl bg-[#D71921]/15 border border-[#D71921]/30 text-[#D71921] flex items-center justify-center mx-auto">
              <Lock size={22} />
            </div>

            <p
              className="text-base sm:text-lg font-bold text-[var(--text)] leading-snug"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              You can&apos;t use this feature as a guest.
            </p>

            <button
              type="button"
              onClick={() => setUpgradeOpen(true)}
              className="btn-primary w-full py-3 px-5 rounded-full font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Create account</span>
            </button>
          </div>
        </div>

        <GuestUpgradeModal
          isOpen={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          onUpgraded={() => {
            setUpgradeOpen(false);
            onClose?.();
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-7 sm:p-9 text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-[#D71921]/15 border border-[#D71921]/30 text-[#D71921] flex items-center justify-center mx-auto">
          <Lock size={22} />
        </div>

        <h1
          className="text-lg sm:text-xl font-bold text-[var(--text)] leading-snug"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          You can&apos;t use this feature as a guest.
        </h1>

        <button
          type="button"
          onClick={() => setUpgradeOpen(true)}
          className="btn-primary w-full py-3 px-5 rounded-full font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          style={{ height: '48px' }}
        >
          <UserPlus size={16} />
          <span>Create account</span>
        </button>
      </div>

      <GuestUpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
      />
    </div>
  );
};

export default GuestProBlockedView;
