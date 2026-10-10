import React from 'react';
import { X, Users, Sparkles, Gift, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ProgramsModalProps {
  program: 'circles' | 'captains';
  onClose: () => void;
  onGetStarted: () => void;
  onNavigateContact: () => void;
}

export const ProgramsModal: React.FC<ProgramsModalProps> = ({
  program,
  onClose,
  onGetStarted,
  onNavigateContact,
}) => {
  const isCircles = program === 'circles';

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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 text-violet-700 text-xs font-bold border border-violet-200/60">
            {isCircles ? <Users className="w-4 h-4 text-violet-600" /> : <GraduationCap className="w-4 h-4 text-violet-600" />}
            <span>{isCircles ? 'Group Study' : 'Apply Now'}</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-poppins text-[#0A1330]">
              {isCircles ? 'Study Circles' : 'Campus Captains'}
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {isCircles
                ? 'Create a study circle with classmates. Compare accuracy benchmarks, challenge friends to topic drills, and unlock 20% group savings.'
                : 'Represent Boardly at your institution. Lead campus prep initiatives, organize mini-drills, and earn free Premium access and leadership credentials.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">
                {isCircles ? 'Circle Size' : 'Who Can Apply'}
              </span>
              <span className="text-slate-500">
                {isCircles ? '3 to 10 Students' : 'Class 9, 10, 11, 12 & Gap Year'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">
                {isCircles ? 'Group Perk' : 'Perks & Stipend'}
              </span>
              <span className="text-slate-500">
                {isCircles ? '20% Off Pro & Premium' : 'Free Premium + Performance Grant'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">
                {isCircles ? 'Shared Leaderboard' : 'Official Certificate'}
              </span>
              <span className="text-slate-500">
                {isCircles ? 'Real-Time Circle Rank' : 'Signed by Academic Leadership'}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isCircles ? 'How Study Circles Work' : 'Campus Captain Responsibilities'}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
              {isCircles ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Invite peers using your unique study circle invite link or code.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Compare topic accuracies and resolve collective class weak spots.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Automatic bulk discount applies when checking out together as a circle.</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Host weekly prep sessions at your school, college, or study group.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Distribute promo vouchers and guide classmates through tricky board topics.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Receive direct mentorship from Boardly academic authors and leadership.</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                onClose();
                if (isCircles) {
                  onGetStarted();
                } else {
                  onNavigateContact();
                }
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 glow-btn flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isCircles ? 'Form a Study Circle' : 'Apply as Campus Captain'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl font-semibold text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
