import React from 'react';
import { Wrench, Sparkles, Calculator, ArrowRight, ArrowLeft } from 'lucide-react';
import { SeoHead } from '../common/SeoHead';

interface AdmissionPredictorProps {
  onNavigateMeritMeter?: () => void;
  onNavigateUniversities?: () => void;
}

export const AdmissionPredictor: React.FC<AdmissionPredictorProps> = ({
  onNavigateMeritMeter,
  onNavigateUniversities,
}) => {
  const handleMeritMeterClick = () => {
    if (onNavigateMeritMeter) {
      onNavigateMeritMeter();
    } else {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/app/merit-meter');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  const handleUniversitiesClick = () => {
    if (onNavigateUniversities) {
      onNavigateUniversities();
    } else {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/app/universities');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center">
      <SeoHead noIndex={true} />
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-3xl p-8 border border-white shadow-xl shadow-indigo-950/5 space-y-5">
        {/* IN DEVELOPMENT pill with a wrench icon */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold tracking-wide mx-auto">
          <Wrench className="w-3.5 h-3.5 text-amber-600" />
          <span>IN DEVELOPMENT</span>
        </div>

        {/* Headline: Coming <accent>Soon.</accent> */}
        <h1 className="text-3xl sm:text-4xl font-black text-[#0d1b3e] tracking-tight">
          Coming <span className="text-indigo-600">Soon.</span>
        </h1>

        {/* 2 lines of text */}
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          Our automated ML admission cut-off predictor is currently training on historical merit shifts across engineering and medical faculties.
          In the meantime, simulate your exact prospective scores using the formula-backed Merit Meter.
        </p>

        {/* Buttons: "Use the Merit Meter" and "Back to Universities" */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleMeritMeterClick}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Use the Merit Meter</span>
          </button>

          <button
            type="button"
            onClick={handleUniversitiesClick}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Universities</span>
          </button>
        </div>
      </div>
    </div>
  );
};
