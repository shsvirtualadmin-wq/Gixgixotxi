import React from 'react';
import { Sparkles, Target, Compass, Award, Users, BookOpen, ArrowRight } from 'lucide-react';
import { MarketingPage } from './Navbar';

interface AboutPageProps {
  onNavigate: (page: MarketingPage) => void;
  onGetStarted: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, onGetStarted }) => {
  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
          <Compass className="w-3.5 h-3.5 text-indigo-600" />
          <span>Our Academic Mission</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#0A1330] font-poppins tracking-tight">
          Equalizing High-Yield Exam Preparation Across Pakistan
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Boardly was founded with a straightforward goal: give every Matric, Intermediate, and Entry Test student access to world-class diagnostic drills and 24/7 conceptual mentorship.
        </p>
      </div>

      {/* Story & Background */}
      <div className="p-8 sm:p-12 rounded-[28px] bg-white border border-slate-200/80 shadow-lg space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-poppins text-[#0A1330]">
            The Problem with Traditional Exam Revision
          </h2>
          <p>
            For decades, exam preparation in Pakistan has relied on repetitive rote learning from dense guidebooks. Students memorized answers without understanding the underlying physical mechanics or mathematical justifications. When competitive exams like MDCAT, ECAT, or FBISE SLO papers introduced conceptual numericals, thousands struggled.
          </p>
          <p>
            High-end private academies charge exorbitant fees, pricing out talented students in smaller cities and remote districts. We built Boardly to remove that barrier.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Active Recall</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Drilling short, high-frequency quizzes trains your brain to retrieve knowledge under authentic exam clock pressure.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Ustaad AI</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Instead of passive answer keys, Ustaad AI guides you step-by-step to calculate derivations and master concepts.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Merit Democracy</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Affordable PKR pricing ensures that quality education and top-tier test analytics are accessible to every family.
            </p>
          </div>
        </div>
      </div>

      {/* Leadership & Academic Authors */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Curriculum Committee
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#0A1330]">
            Created by Experienced Educators
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-sm space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl flex items-center justify-center mx-auto">
              SA
            </div>
            <h4 className="font-bold text-slate-900 text-base">Prof. Salman Ahmed</h4>
            <span className="text-xs text-indigo-600 font-semibold block">Head of Physics & Numerical Analysis</span>
            <p className="text-xs text-slate-500 leading-relaxed">
              18+ years mentoring FBISE and Punjab Board top position holders. Author of conceptual MCQ drill series.
            </p>
          </div>

          <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-sm space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 font-bold text-xl flex items-center justify-center mx-auto">
              MK
            </div>
            <h4 className="font-bold text-slate-900 text-base">Dr. Maryam Khalid</h4>
            <span className="text-xs text-teal-700 font-semibold block">MDCAT Biology & Physiology Lead</span>
            <p className="text-xs text-slate-500 leading-relaxed">
              King Edward Medical University alumna; specialist in high-yield medical entrance question structuring.
            </p>
          </div>

          <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-sm space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-700 font-bold text-xl flex items-center justify-center mx-auto">
              TR
            </div>
            <h4 className="font-bold text-slate-900 text-base">Tariq Rehman, M.Sc.</h4>
            <span className="text-xs text-violet-700 font-semibold block">Chemistry & SLO Exam Designer</span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Senior textbook reviewer for National Book Foundation; designer of SLO model assessment papers.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center p-8 rounded-[28px] bg-indigo-50 border border-indigo-200/70 space-y-4">
        <h3 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
          Join Our Growing Community of Achievers
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Start with our permanent Free tier or accelerate with full Pro access today.
        </p>
        <button
          onClick={onGetStarted}
          className="px-8 py-3.5 rounded-full font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Get Started Free</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
