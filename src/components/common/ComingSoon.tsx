import React from 'react';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { SeoHead } from '../common/SeoHead';

interface ComingSoonProps {
  title: string;
  icon?: React.ReactNode;
  text?: string;
  onBack?: () => void;
  badge?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  title,
  icon,
  text,
  onBack,
  badge = 'Beta / In Development',
}) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <SeoHead noIndex={true} />
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-white shadow-xl shadow-indigo-950/5 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
          {icon || <Sparkles className="w-8 h-8" />}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{badge}</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[#0d1b3e] tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            {text || 'This feature is currently in active development for the Boardly learning suite. Check back soon for full interactive access!'}
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        )}
      </div>
    </div>
  );
};
