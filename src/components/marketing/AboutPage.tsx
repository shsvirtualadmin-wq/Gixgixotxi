import React from 'react';
import { Sparkles, Target, Compass, Award, Users, BookOpen, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { MarketingPage } from './Navbar';

interface AboutPageProps {
  onNavigate: (page: MarketingPage) => void;
  onGetStarted: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, onGetStarted }) => {
  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-16">
      {/* 1. Header */}
      <header className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
          <Compass className="w-3.5 h-3.5 text-indigo-600" />
          <span>Our Academic Mission &amp; Heritage</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#0A1330] font-poppins tracking-tight">
          About Boardly — Built by SHS Virtual Academy
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Boardly was founded with a straightforward goal: provide every Matric, Intermediate, and competitive entrance test aspirant in Pakistan with world-class diagnostic testing, transparent solution derivations, and 24/7 AI-guided conceptual mastery.
        </p>
      </header>

      {/* 2. Institutional Heritage & SHS Virtual Academy Link */}
      <section className="p-8 sm:p-10 rounded-[28px] bg-gradient-to-br from-indigo-950 via-[#0d1b3e] to-slate-900 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Institutional Partnership
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-white">
              Proudly Engineered by SHS Virtual Academy
            </h2>
          </div>
          <a
            href="https://shsvirtualacademy.pro"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors w-fit"
          >
            <span>Visit shsvirtualacademy.pro</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
          </a>
        </div>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
          Boardly operates under the curriculum leadership and academic direction of{' '}
          <a
            href="https://shsvirtualacademy.pro"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-300 underline font-semibold hover:text-white transition-colors"
          >
            SHS Virtual Academy (shsvirtualacademy.pro)
          </a>
          . While SHS Virtual Academy leads online secondary classes, student counseling, and live pedagogical mentorship, Boardly serves as the high-yield diagnostic testing engine where students test retention, benchmark speed, and analyze performance against thousands of peers nationwide.
        </p>
      </section>

      {/* 3. Story & Background */}
      <section className="p-8 sm:p-12 rounded-[28px] bg-white border border-slate-200/80 shadow-lg space-y-8 text-slate-700 text-sm sm:text-base leading-relaxed">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-poppins text-[#0A1330]">
            The Problem with Traditional Exam Revision
          </h2>
          <p>
            For decades, exam preparation in Pakistan has relied on repetitive rote memorization from dense paper guidebooks. Students memorized answers without understanding the underlying physical mechanics or mathematical justifications. When modern examinations like PMDC MDCAT, FAST-NU, or FBISE SLO papers introduced application-based numericals, thousands struggled.
          </p>
          <p>
            Traditional private academies charge exorbitant fees upwards of PKR 50,000 to PKR 85,000 per season, pricing out talented students in smaller cities and remote districts. We built Boardly to eliminate these barriers. Every student deserves access to premium diagnostic testing and instant AI derivations on their own schedule.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Active Recall Testing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Drilling short, high-frequency quizzes trains your brain to retrieve knowledge under authentic exam clock pressure.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Boardy AI Partner</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Boardy, your 24/7 study buddy, guides you step-by-step through derivations and difficult numericals.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Merit Democracy</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Affordable PKR pricing ensures that quality education and top-tier test analytics are accessible to every family.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Curriculum Leadership */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Curriculum Committee
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#0A1330]">
            Created by Experienced Academic Educators
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Our content is authored and vetted by veteran teachers with decades of experience guiding students toward top positions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-sm space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl flex items-center justify-center mx-auto">
              SA
            </div>
            <h3 className="font-bold text-slate-900 text-base">Prof. Salman Ahmed</h3>
            <span className="text-xs text-indigo-600 font-semibold block">Head of Physics &amp; Numerical Analysis</span>
            <p className="text-xs text-slate-500 leading-relaxed">
              18+ years mentoring FBISE and Punjab Board position holders. Author of conceptual MCQ drill series.
            </p>
          </div>

          <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-sm space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 font-bold text-xl flex items-center justify-center mx-auto">
              MK
            </div>
            <h3 className="font-bold text-slate-900 text-base">Dr. Maryam Khalid</h3>
            <span className="text-xs text-teal-700 font-semibold block">MDCAT Biology &amp; Physiology Lead</span>
            <p className="text-xs text-slate-500 leading-relaxed">
              King Edward Medical University alumna; specialist in high-yield medical entrance question structuring.
            </p>
          </div>

          <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-sm space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-700 font-bold text-xl flex items-center justify-center mx-auto">
              TR
            </div>
            <h3 className="font-bold text-slate-900 text-base">Tariq Rehman, M.Sc.</h3>
            <span className="text-xs text-violet-700 font-semibold block">Chemistry &amp; SLO Exam Designer</span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Senior textbook reviewer for National Book Foundation; designer of SLO model assessment papers.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Bottom CTA */}
      <div className="text-center p-8 sm:p-10 rounded-[28px] bg-indigo-50 border border-indigo-200/70 space-y-4">
        <h3 className="text-xl sm:text-2xl font-bold font-poppins text-[#0A1330]">
          Join Our Growing Community of Achievers
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Start with our permanent Free tier or accelerate with full Pro access today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onGetStarted}
            className="px-8 py-3.5 rounded-full font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="https://shsvirtualacademy.pro"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-full font-semibold text-sm text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition-colors inline-flex items-center gap-2"
          >
            <span>Learn About SHS Virtual Academy</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
