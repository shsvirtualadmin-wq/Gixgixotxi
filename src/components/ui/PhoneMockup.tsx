import React, { useState } from 'react';
import { PhoneMockup, MockupScreen } from '../marketing/PhoneMockup';
import { Smartphone, X } from 'lucide-react';

export { PhoneMockup };
export type { MockupScreen };

export const DashboardPhoneCard: React.FC<{
  title?: string;
  subtitle?: string;
  initialScreen?: MockupScreen;
  onDismiss?: () => void;
}> = ({
  title = 'Boardly Mobile Study Cockpit',
  subtitle = 'Experience distraction-free MCQ drills on any phone or tablet browser',
  initialScreen = 'student',
  onDismiss,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative rounded-[24px] p-5 bg-white/[0.04] backdrop-blur-xl border border-white/12 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] transition-all overflow-hidden mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2F6BFF]/20 border border-[#2F6BFF]/30 text-[#22D3EE] flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(47,107,255,0.3)]">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#EAF0FF] flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2F6BFF]/15 text-[#22D3EE] border border-[#2F6BFF]/30 font-bold uppercase tracking-wider">
                Sample preview
              </span>
            </h4>
            <p className="text-xs text-[#A3B0CC] mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="px-3.5 py-1.5 rounded-xl bg-white/8 hover:bg-white/14 border border-white/12 text-xs font-semibold text-[#EAF0FF] cursor-pointer transition-colors"
          >
            {expanded ? 'Hide Mockup' : 'Preview Phone'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
            className="p-1.5 rounded-xl text-[#6F7C99] hover:text-[#EAF0FF] hover:bg-white/8 cursor-pointer transition-colors"
            title="Dismiss preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-5 pt-5 border-t border-white/10 flex justify-center animate-in fade-in duration-300">
          <PhoneMockup initialScreen={initialScreen} />
        </div>
      )}
    </div>
  );
};

export default PhoneMockup;
