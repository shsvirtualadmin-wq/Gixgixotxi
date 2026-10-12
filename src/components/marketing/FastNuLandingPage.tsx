import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Brain,
  Calculator,
  Zap,
  Target,
  BarChart3,
  ChevronDown,
  Cpu,
  Layers,
} from 'lucide-react';

interface FastNuLandingPageProps {
  onGetStarted: () => void;
  onNavigatePricing: () => void;
}

export const FastNuLandingPage: React.FC<FastNuLandingPageProps> = ({
  onGetStarted,
  onNavigatePricing,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const sampleQuestion = {
    subject: 'Advanced Mathematics (Calculus & Functions)',
    stem: 'Evaluate the limit: lim (x -> 0) [sin(5x) / tan(2x)].',
    options: ['5/2', '2/5', '1', '0'],
    correctIndex: 0,
    explanation:
      'Using the standard trigonometric limits lim (u -> 0) [sin(u) / u] = 1 and lim (u -> 0) [tan(u) / u] = 1: Rewrite [sin(5x) / tan(2x)] as [ (sin(5x) / (5x)) * 5x ] / [ (tan(2x) / (2x)) * 2x ]. As x approaches 0, the ratio simplifies to (1 * 5x) / (1 * 2x) = 5/2. Rapid shortcut: directly divide the coefficients of the trigonometric arguments: 5 / 2.',
  };

  const engineeringDomains = [
    {
      domain: 'Advanced Mathematics',
      weightage: '50% of Test Paper',
      icon: <Calculator className="w-5 h-5 text-indigo-600" />,
      topics: [
        'Limits, Continuity & Derivative Applications',
        'Integration Techniques, Definite Integrals & Area Under Curves',
        'Conic Sections (Parabola, Ellipse, Hyperbola)',
        'Vectors, Matrices, Determinants & Vector Spaces',
        'Permutations, Combinations & Binomial Expansion',
        'Trigonometric Identities & Inverse Functions',
      ],
    },
    {
      domain: 'Basic & Everyday Math',
      weightage: '20% of Test Paper',
      icon: <Target className="w-5 h-5 text-blue-600" />,
      topics: [
        'Percentages, Ratios, Proportions & Financial Arithmetic',
        'Linear Equations, Quadratic Roots & Simultaneous Systems',
        'Speed, Distance, Work Rates & Average Problems',
        'Basic Geometry, Perimeters, Areas & Volumes',
      ],
    },
    {
      domain: 'Analytical & IQ Reasoning',
      weightage: '20% of Test Paper',
      icon: <Brain className="w-5 h-5 text-amber-600" />,
      topics: [
        'Pattern Sequences, Number Series & Matrix Grids',
        'Direction Senses, Blood Relations & Logical Seating',
        'Syllogisms, Assumptions & Deduction Puzzles',
        'Coding-Decoding & Non-Verbal Analogies',
      ],
    },
    {
      domain: 'Physics & Technical Basics',
      weightage: '10% of Test Paper',
      icon: <Cpu className="w-5 h-5 text-teal-600" />,
      topics: [
        'Vectors & Equilibrium of Forces',
        'Kinematics, Projectile Motion & Momentum',
        'Electric Fields, Capacitance & Circuits',
        'Work, Power, Energy & Mechanical Efficiency',
      ],
    },
  ];

  const faqs = [
    {
      q: 'Does FAST-NU penalize wrong answers with negative marking?',
      a: 'Yes. FAST-NU entry tests implement negative marking (typically -0.25 marks deducted per incorrect MCQ). Guessing without elimination severely harms your merit aggregate. Boardly is the only test engine that calibrates test results to authentic negative marking penalties, teaching you when to attempt and when to skip safely.',
    },
    {
      q: 'How does Boardly help with speed training for the FAST entrance test?',
      a: 'The FAST-NU test requires solving challenging mathematical problems in less than 50 seconds per question. Boardly drills train you in rapid algebraic shortcuts, trigonometric coefficient rules, and visual logic decoding, cutting solving time by more than 40%.',
    },
    {
      q: 'Does this platform also prepare for NUST (NET) and UET (ECAT/TCAT)?',
      a: 'Yes. Boardly engineering modules include comprehensive question vaults for NUST (NET Engineering and Computing), UET Taxila (TCAT), UET Lahore (ECAT), GIKI, and PIEAS admissions.',
    },
  ];

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-20">
      {/* 1. Header Hero */}
      <header className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span>FAST-NU, NUST &amp; UET Entrance Suite</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#0A1330] font-poppins tracking-tight">
          FAST-NU Entrance Test MCQ Practice &amp; Engineering Mocks
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Crack high-stakes CS and Engineering entrance tests with negative-marking calibrated mock exams, rapid math shortcuts, and 24/7 AI derivations.
        </p>
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Start Free Engineering Practice</span>
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
            View Pricing Plans (From Rs 199/mo)
          </a>
        </div>
      </header>

      {/* 2. Section: Mastering FAST-NU Negative Marking & Speed Strategies */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
            Competitive Strategy
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#0A1330]">
            Mastering FAST-NU Negative Marking &amp; Speed Strategies
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            FAST-NU is renowned for having one of the toughest entrance exams in Pakistan. The combination of intense negative marking, multi-step calculus problems, and strict per-section countdown clocks eliminates unprepared applicants quickly.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Boardly teaches you tactical decision-making: recognizing questions with high-yield shortcut formulas, skipping traps that deplete time, and maintaining accurate strike rates under pressure.
          </p>
          <ul className="space-y-2 text-xs text-slate-700 font-semibold pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Authentic -0.25 negative marking penalty simulation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Calculus &amp; Analytic Geometry rapid shortcut vaults</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Analytical reasoning &amp; IQ series pattern training</span>
            </li>
          </ul>
        </div>

        <div className="p-7 rounded-[28px] bg-white border border-slate-200/90 shadow-md space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>FAST-NU Test Paper Structure</span>
          </h3>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Advanced Mathematics</span>
              <span className="font-bold text-slate-900">50 Questions (Highest Weightage)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Basic Mathematics</span>
              <span className="font-bold text-slate-900">20 Questions</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Analytical &amp; IQ Reasoning</span>
              <span className="font-bold text-slate-900">20 Questions</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Physics or English</span>
              <span className="font-bold text-slate-900">10 Questions</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-semibold text-slate-700">Negative Penalty</span>
              <span className="font-bold text-rose-600">-0.25 Marks per wrong choice</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: Sample FAST-NU Analytical Math Question & Rapid Solution */}
      <section className="p-8 sm:p-10 rounded-[28px] bg-gradient-to-br from-slate-900 via-[#0A1330] to-slate-950 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
              Shortcut Solution Demonstration
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-white">
              Sample FAST-NU Analytical Math Question &amp; Rapid Solution
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
                      ? 'bg-blue-600/30 border-blue-400 text-white'
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
          <div className="mt-4 p-5 rounded-2xl bg-blue-950/60 border border-blue-500/40 text-blue-100 text-xs sm:text-sm leading-relaxed space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-blue-300">
              <Sparkles className="w-4 h-4" />
              <span>Boardy AI Step-by-Step Breakdown:</span>
            </div>
            <p>{sampleQuestion.explanation}</p>
          </div>
        )}
      </section>

      {/* 4. Section: FAST University Entrance Syllabus Topics & High-Frequency Formulas */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Curriculum Domains
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#0A1330]">
            Advanced Mathematics, Physics, IQ &amp; Analytical Reasoning Breakdown
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every section tested in the FAST-NU examination is broken into dedicated drill modules. Master key formulas and shortcut patterns before sitting for the real test.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {engineeringDomains.map((item, idx) => (
            <article
              key={idx}
              className="p-6 rounded-[24px] bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  {item.icon}
                </div>
                <span className="text-[11px] font-bold text-slate-500">{item.weightage}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-poppins">{item.domain}</h3>
              <ul className="space-y-2 text-xs text-slate-600">
                {item.topics.map((t, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* 5. Section: Engineering Mock Tests with Percentile Benchmarking */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#0A1330]">
          Engineering Mock Tests with Percentile Benchmarking
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Over 1,000+ students across Pakistan have practiced on Boardly. When you submit a full engineering mock, our algorithm immediately computes your nationwide percentile, estimated composite score, and predicted merit chances for top Computer Science and Software Engineering departments.
        </p>
      </section>

      {/* 6. Section: FAQs Regarding FAST-NU Admission Testing */}
      <section className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#0A1330]">
            Frequently Asked Questions Regarding FAST-NU Admission Testing
          </h2>
          <p className="text-sm text-slate-600">
            Answers to frequent queries on calculators, syllabus differences, and score thresholds.
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
                      isOpen ? 'rotate-180 text-blue-600' : ''
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
      <div className="text-center p-8 sm:p-12 rounded-[28px] bg-blue-50 border border-blue-200/80 space-y-4">
        <h3 className="text-2xl font-bold font-poppins text-[#0A1330]">
          Aiming for FAST, NUST, or UET This Year?
        </h3>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Start drilling with real engineering entrance questions today. Experience the exact test pressure before walking into the examination center.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
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
