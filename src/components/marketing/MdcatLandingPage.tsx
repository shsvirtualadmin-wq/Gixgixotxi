import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Timer,
  BarChart3,
  Award,
  HelpCircle,
  Stethoscope,
  Microscope,
  Atom,
  Brain,
  ChevronDown,
} from 'lucide-react';

interface MdcatLandingPageProps {
  onGetStarted: () => void;
  onNavigatePricing: () => void;
}

export const MdcatLandingPage: React.FC<MdcatLandingPageProps> = ({
  onGetStarted,
  onNavigatePricing,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const sampleQuestion = {
    subject: 'Biology (Cell Structure)',
    stem: 'Which organelle is primarily responsible for lipid synthesis and detoxification of drugs within eukaryotic cells?',
    options: [
      'Rough Endoplasmic Reticulum',
      'Smooth Endoplasmic Reticulum',
      'Golgi Apparatus',
      'Lysosomes',
    ],
    correctIndex: 1,
    explanation:
      'The Smooth Endoplasmic Reticulum (SER) is specialized for lipid metabolism, phospholipid synthesis, steroid hormone production, and detoxification of chemical toxins and drugs via cytochrome P450 enzymes. In contrast, the Rough Endoplasmic Reticulum (RER) is coated with ribosomes and specializes in protein synthesis.',
  };

  const highYieldTopics = [
    {
      subject: 'Biology',
      icon: <Microscope className="w-5 h-5 text-emerald-600" />,
      weightage: '34% (68 Questions)',
      topics: [
        'Cell Structure & Function',
        'Biological Molecules & Enzymes',
        'Bioenergetics (Photosynthesis & Cellular Respiration)',
        'Coordination, Nervous System & Hormones',
        'Genetics, DNA Replication & Biotechnology',
        'Evolution & Biodiversity Mechanisms',
      ],
    },
    {
      subject: 'Chemistry',
      icon: <Atom className="w-5 h-5 text-indigo-600" />,
      weightage: '27% (54 Questions)',
      topics: [
        'Atomic Structure & Quantum Numbers',
        'Chemical Bonding & Hybridization',
        'Gases, Liquids & Intermolecular Forces',
        'Chemical Equilibrium & Le Chatelier Principle',
        'Reaction Kinetics & Thermochemistry',
        'Organic Hydrocarbons, Alkyl Halides & Carbonyls',
      ],
    },
    {
      subject: 'Physics',
      icon: <Brain className="w-5 h-5 text-blue-600" />,
      weightage: '27% (54 Questions)',
      topics: [
        'Force, Motion & Momentum',
        'Work, Energy & Conservation Laws',
        'Rotational & Circular Dynamics',
        'Waves, Doppler Effect & Acoustics',
        'Current Electricity, Circuits & Kirchhoff Rules',
        'Electromagnetism, Induction & Nuclear Physics',
      ],
    },
    {
      subject: 'English & Logic',
      icon: <BookOpen className="w-5 h-5 text-amber-600" />,
      weightage: '12% (24 Questions)',
      topics: [
        'Subject-Verb Agreement & Tenses',
        'Vocabulary & Contextual Phrasal Verbs',
        'Critical Deduction & Cause-and-Effect',
        'Logical Sequence, Syllogisms & Statements',
      ],
    },
  ];

  const faqs = [
    {
      q: 'Does Boardly follow the official PMDC MDCAT test syllabus?',
      a: 'Yes. Every question in Boardly is strictly categorized according to the official Pakistan Medical and Dental Council (PMDC) syllabus guidelines. Our curriculum team constantly audits questions against the latest paper blueprints across Punjab, Sindh, KPK, and Federal domains.',
    },
    {
      q: 'How does Boardly simulate the authentic MDCAT clock pressure?',
      a: 'Our mock exam mode delivers 200 questions in an exact 3.5-hour timed window with zero distractions. The interface matches the formal testing environment and calculates your national percentile against thousands of competing peers immediately upon submission.',
    },
    {
      q: 'Can I review full derivations if I answer an MDCAT question incorrectly?',
      a: 'Absolutely. Every single multiple-choice question features an in-depth derivation and conceptual formula explanation. You can also prompt Boardy AI tutor directly to ask follow-up questions about complex numerical steps or physiological pathways.',
    },
  ];

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-20">
      {/* 1. Header Hero */}
      <header className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
          <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
          <span>PMDC MDCAT 2026 Preparation Suite</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#0A1330] font-poppins tracking-tight">
          MDCAT MCQ Practice &amp; Mock Exam Portal
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Equip yourself for medical college admission with 10,000+ PMDC-aligned questions, timed full-length diagnostic mocks, and 24/7 AI-guided solution derivations across Pakistan.
        </p>
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-600/25 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Start Free MDCAT Practice</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="/pricing"
            onClick={(e) => {
              e.preventDefault();
              onNavigatePricing();
            }}
            className="w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-colors cursor-pointer text-center"
          >
            View Pro &amp; Premium Plans
          </a>
        </div>
      </header>

      {/* 2. Section: High-Yield MDCAT Question Bank & PMDC Syllabus Breakdown */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Comprehensive Curriculum
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#0A1330]">
            High-Yield MDCAT Question Bank &amp; PMDC Syllabus Breakdown
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Success in the National MDCAT requires mastering every sub-topic with high speed and zero guesswork. Boardly structures each subject into systematic chapter units with verified answer keys.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highYieldTopics.map((item, idx) => (
            <article
              key={idx}
              className="p-6 rounded-[24px] bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-slate-500">{item.weightage}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-poppins">{item.subject}</h3>
              <ul className="space-y-2 text-xs text-slate-600">
                {item.topics.map((t, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* 3. Section: Interactive Sample MDCAT Question & Step-by-Step Derivation */}
      <section className="p-8 sm:p-10 rounded-[28px] bg-gradient-to-br from-slate-900 via-[#0A1330] to-slate-950 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              Interactive Test Simulation
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-white">
              Sample MDCAT Question &amp; Step-by-Step Derivation
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{sampleQuestion.subject}</span>
        </div>

        <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
          {sampleQuestion.stem}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {sampleQuestion.options.map((opt, i) => {
            const isSelected = selectedOption === i;
            const isCorrect = i === sampleQuestion.correctIndex;
            return (
              <button
                key={i}
                onClick={() => {
                  setSelectedOption(i);
                  setShowExplanation(true);
                }}
                className={`p-4 rounded-2xl text-left text-sm font-medium transition-all border cursor-pointer ${
                  isSelected
                    ? isCorrect
                      ? 'bg-emerald-600/30 border-emerald-400 text-white'
                      : 'bg-rose-600/30 border-rose-400 text-white'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
                }`}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mt-4 p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-100 text-xs sm:text-sm leading-relaxed space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <Sparkles className="w-4 h-4" />
              <span>Boardy AI Verified Solution:</span>
            </div>
            <p>{sampleQuestion.explanation}</p>
          </div>
        )}
      </section>

      {/* 4. Section: Authentic PMDC Pattern Timed Mock Examinations */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
            National Benchmarking
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#0A1330]">
            Authentic PMDC Pattern Timed Mock Examinations
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Medical entrance testing is not just about raw memory; it is a test of speed, pacing, and emotional discipline. Boardly's exam engine faithfully recreates the actual PMDC 200-question distribution under a realistic 210-minute timer.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            After completing each full mock or chapter sprint, you receive an immediate diagnostic analysis showing your accuracy per subject, average response time per question, and high-frequency error patterns.
          </p>
          <div className="pt-2">
            <button
              onClick={onGetStarted}
              className="px-6 py-3 rounded-full text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <span>Take a Free Diagnostic Mock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-7 rounded-[26px] bg-white border border-slate-200/90 shadow-md space-y-5">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>MDCAT Mock Diagnostic Metrics</span>
          </h3>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Total Paper Duration</span>
              <span className="font-bold text-slate-900">210 Minutes (3.5 Hours)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Total Question Count</span>
              <span className="font-bold text-slate-900">200 High-Yield MCQs</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Recommended Time per Question</span>
              <span className="font-bold text-slate-900">55 Seconds</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Negative Marking Calibration</span>
              <span className="font-bold text-emerald-700">Standard PMDC Regulation</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-semibold text-slate-700">National Merit Ranking</span>
              <span className="font-bold text-indigo-700">Instant Percentile Curve</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section: Why 1,000+ Medical Aspirants Train with Boardly */}
      <section className="text-center max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Student Success Stories
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#0A1330]">
            Why 1,000+ Medical Aspirants Train with Boardly
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From King Edward and Dow to Rawalpindi Medical University, students who drill consistently with Boardly gain the conceptual clarity required to clear high provincial merit cutoffs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-[22px] bg-white border border-slate-200/90 shadow-sm space-y-2">
            <span className="text-2xl font-black text-emerald-600 font-poppins">10,000+</span>
            <h4 className="font-bold text-slate-900 text-sm">Targeted MDCAT MCQs</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Curated by senior medical educators with thorough answer keys and referenced derivations.
            </p>
          </div>
          <div className="p-6 rounded-[22px] bg-white border border-slate-200/90 shadow-sm space-y-2">
            <span className="text-2xl font-black text-indigo-600 font-poppins">98.4%</span>
            <h4 className="font-bold text-slate-900 text-sm">Concept Retention</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Active recall testing reinforces neuro-pathways faster than passive guidebook reading.
            </p>
          </div>
          <div className="p-6 rounded-[22px] bg-white border border-slate-200/90 shadow-sm space-y-2">
            <span className="text-2xl font-black text-teal-600 font-poppins">24/7</span>
            <h4 className="font-bold text-slate-900 text-sm">Boardy AI Mentorship</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Immediate explanations for difficult bioenergetics cycles, orbital configurations, and lens mechanics.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Section: Frequently Asked Questions */}
      <section className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#0A1330]">
            Frequently Asked Questions about MDCAT Prep
          </h2>
          <p className="text-sm text-slate-600">
            Everything you need to know about our question banks, mock exams, and scoring engine.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left font-bold text-sm text-slate-900 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Bottom CTA */}
      <div className="text-center p-8 sm:p-12 rounded-[28px] bg-emerald-50 border border-emerald-200/80 space-y-4">
        <h3 className="text-2xl font-bold font-poppins text-[#0A1330]">
          Ready to Secure Your Medical College Seat?
        </h3>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Join thousands of successful candidates practicing daily on Boardly. Start completely free today or unlock unlimited access with Boardly Pro.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Start Practicing Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="/pricing"
            onClick={(e) => {
              e.preventDefault();
              onNavigatePricing();
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full font-semibold text-sm text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition-colors cursor-pointer text-center"
          >
            Explore Plans (From Rs 199/mo)
          </a>
        </div>
      </div>
    </div>
  );
};
