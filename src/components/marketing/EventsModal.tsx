import React from 'react';
import { X, Trophy, Calendar, Users, Award, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface EventsModalProps {
  event: 'blitz' | 'arena';
  onClose: () => void;
  onGetStarted: () => void;
}

export const EventsModal: React.FC<EventsModalProps> = ({ event, onClose, onGetStarted }) => {
  const isBlitz = event === 'blitz';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-[28px] border border-slate-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/60">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{isBlitz ? 'Weekly Live Drills' : 'Grand Mock Tournaments'}</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-poppins text-[#0A1330]">
              {isBlitz ? 'Boardly Blitz' : 'Boardly Arena'}
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {isBlitz
                ? 'Rapid weekly timed drill tournaments designed to benchmark your solving speed against thousands of Matric and FSc candidates across Pakistan.'
                : 'Full-length, high-stakes mock exam simulations reflecting exact timing, sectional weightages, and negative marking rules for boards and entrance tests.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block">Every Saturday</span>
                <span className="text-slate-500">8:00 PM – 10:00 PM PKT</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <Award className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block">Cash Prizes</span>
                <span className="text-slate-500">Top 3 National Ranks</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <Users className="w-5 h-5 text-teal-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block">Free Entry</span>
                <span className="text-slate-500">All Registered Students</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tournament Rules & Format
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Real-time anti-cheat algorithms monitor tab switching and speed patterns.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Instant percentile breakdown provided within 10 minutes of test submission.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Complete step-by-step video and textual derivations unlocked immediately after event closure.</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onGetStarted();
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 glow-btn flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Register for Next Event</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl font-semibold text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
