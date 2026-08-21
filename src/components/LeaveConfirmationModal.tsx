import React from 'react';
import { AlertTriangle, Sparkles, LogOut, ArrowRight, X } from 'lucide-react';

export interface LeaveConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  stayLabel?: string;
  leaveLabel?: string;
  sublabel?: string;
  onStay: () => void;
  onLeaveAnyway: () => void;
}

export const LeaveConfirmationModal: React.FC<LeaveConfirmationModalProps> = ({
  isOpen,
  title = 'Leave this page?',
  message = 'Question generation is still in progress and will be lost.',
  stayLabel = 'Stay',
  leaveLabel = 'Leave Anyway',
  sublabel,
  onStay,
  onLeaveAnyway,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[350] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-ios-spring"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow-2xl flex flex-col items-center text-center gap-5 relative">
        {/* Close "X" button triggers Stay */}
        <button
          onClick={onStay}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          title="Dismiss"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xs">
          <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3
            id="leave-modal-title"
            className="text-xl font-bold font-['Space_Grotesk'] text-slate-900 tracking-tight"
          >
            {title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {message}
          </p>
          {sublabel && (
            <p className="text-xs text-slate-400 font-medium">
              {sublabel}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
          <button
            type="button"
            onClick={onStay}
            id="leave-confirm-stay-btn"
            className="w-full sm:flex-1 py-3 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400/50"
          >
            {stayLabel}
          </button>
          <button
            type="button"
            onClick={onLeaveAnyway}
            id="leave-confirm-leave-btn"
            className="w-full sm:flex-1 py-3 px-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all shadow-md shadow-rose-600/25 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          >
            {leaveLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
