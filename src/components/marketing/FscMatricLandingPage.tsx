import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Layers,
  Award,
  ChevronDown,
  Atom,
  Brain,
  Calculator,
  Compass,
} from 'lucide-react';

interface FscMatricLandingPageProps {
  onGetStarted: () => void;
  onNavigatePricing: () => void;
}

export const FscMatricLandingPage: React.FC<FscMatricLandingPageProps> = ({
  onGetStarted,
  onNavigatePricing,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const sampleQuestion = {
    subject: 'Physics (Class 11 - Work & Energy)',
    stem: 'A body of mass 2 kg is dropped from a height of 20 m. Neglecting air resistance and taking g = 10 m/s², what is its kinetic energy just before striking the ground?',
    options: ['200 J', '400 J', '100 J', '50 J'],
    correctIndex: 1,
    explanation:
      'According to the Law of Conservation of Energy, total Mechanical Energy remains constant: Loss in Potential Energy (PE) = Gain in Kinetic Energy (KE). PE = m * g * h = 2 kg * 10 m/s² * 20 m = 400 Joules. Therefore, the kinetic energy just before impact is 400 J.',
  };

  const gradeStreams = [
    {
      grade: 'Matric (Class 9 & 10)',
      icon: <GraduationCap className="w-5 h-5 text-indigo-600" />,
      focus: 'SSC Part 1 & 2 Board Examination',
      subjects: [
        'Physics (Motion, Dynamics, Gravitation, Thermal Properties)',
        'Chemistry (Structure of Atoms, Chemical Reactions, Acids & Bases)',
        'Biology / Computer Science (Cell Biology, Systems, Programming)',
        'Mathematics (Matrices, Algebraic Formulas, Geometry, Trigonometry)',
      ],
    },
    {
      grade: 'FSC Part 1 (Class 11)',
      icon: <Layers className="w-5 h-5 text-blue-600" />,
      focus: 'HSSC Part 1 Intermediate Foundation',
      subjects: [
        'Physics (Vectors, Circular Dynamics, Waves, Thermodynamics)',
        'Chemistry (Stoichiometry, Atomic Orbital Hybridization, Gases)',
        'Biology (Cell Ultra-structure, Bioenergetics, Enzymes)',
        'Mathematics (Matrices, Complex Numbers, Sequences, Trigonometry)',
      ],
    },
    {
      grade: 'FSC Part 2 (Class 12)',
      icon: <Award className="w-5 h-5 text-violet-600" />,
      focus: 'HSSC Part 2 & Merit Maximizer',
      subjects: [
        'Physics (Electrostatics, Electromagnetism, Nuclear Physics)',
        'Chemistry (Inorganic Periodicity, Organic Carbonyls, Macromolecules)',
        'Biology (Homeostasis, Chromosomes, Biotechnology)',
        'Mathematics (Calculus, Integration, Analytic Geometry, Conics)',
      ],
    },
  ];

  const faqs = [
    {
      q: 'Does Boardly cater to the new FBISE SLO (Student Learning Outcomes) pattern?',
      a: 'Yes! The Federal Board (FBISE) and provincial boards have transitioned towards conceptual, application-oriented SLO testing. Boardly question banks are completely audited to replace rote memorization with application, analysis, and reasoning questions identical to real board papers.',
    },
    {
      q: 'Which provincial boards are covered?',
      a: 'Boardly covers curricula aligned with FBISE (Federal Board Islamabad), BISE Lahore, BISE Rawalpindi, BISE Gujranwala, BISE Multan, BISE Karachi, BISE Peshawar, and all other major educational boards across Punjab, Sindh, KPK, and Balochistan.',
    },
    {
      q: 'Can I practice individual chapters before my school pre-board exams?',
      a: 'Yes. Every subject is partitioned chapter-by-chapter. You can select specific topics to take customized 10, 20, or 30-question diagnostic quizzes and immediately inspect your performance before school midterms or send-up examinations.',
    },
  ];

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-20">
      {/* 1. Header Hero */}
      <header className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
          <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
          <span>FBISE &amp; Provincial Boards Examination Hub</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#0A1330] font-poppins tracking-tight">
          FSC &amp; Matric MCQ Practice for FBISE &amp; Provincial Boards
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Elevate your board marks with conceptual SLO question drills, chapter-wise test series, and instant step-by-step derivations for Class 9, 10, 11, and 12 across Pakistan.
        </p>
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg shadow-indigo-600/25 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Start Free Board Practice</span>
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

      {/* 2. Section: Student Learning Outcomes (SLO) Conceptual Testing Engine */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block">
            The New Examination Paradigm
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#0A1330]">
            Student Learning Outcomes (SLO) Conceptual Testing Engine
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            The era of reproducing textbook paragraphs word-for-word is over. National and provincial education boards have modernized their assessment framework to evaluate actual comprehension, analytical reasoning, and scientific problem-solving.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Boardly equips students with tailored questions mapped to recall, understanding, and application cognitive domains. Our questions teach you how to analyze graph slopes, decode chemical mechanisms, and compute multi-step physics derivations with precision.
          </p>
          <ul className="space-y-2 text-xs text-slate-700 font-semibold pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>Full compliance with FBISE National Curriculum specifications</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>Covers Pre-Medical, Pre-Engineering, and ICS computer science streams</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>Instant step-by-step mathematical justifications for every option</span>
            </li>
          </ul>
        </div>

        <div className="p-7 rounded-[28px] bg-white border border-slate-200/90 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-indigo-600 uppercase">Boardly SLO Distribution</span>
            <span className="text-xs font-bold text-slate-500">2026 Academic Standard</span>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Knowledge &amp; Recall</span>
                <span>30%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full w-[30%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Conceptual Understanding</span>
                <span>50%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full w-[50%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-bold text-slate-700 mb-1">
                <span>Application &amp; Analysis (Numericals)</span>
                <span>20%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-[20%]" />
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic pt-2">
            Engineered to prepare students for both high board marks and high competitive entry test percentiles simultaneously.
          </p>
        </div>
      </section>

      {/* 3. Section: Sample SLO Concept Question & Explanatory Breakdown */}
      <section className="p-8 sm:p-10 rounded-[28px] bg-gradient-to-br from-slate-900 via-[#0A1330] to-slate-950 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
              Sample SLO Concept Demonstration
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-white">
              Sample SLO Physics Question &amp; Step-by-Step Derivation
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
                      ? 'bg-indigo-600/30 border-indigo-400 text-white'
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
          <div className="mt-4 p-5 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-100 text-xs sm:text-sm leading-relaxed space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-indigo-300">
              <Sparkles className="w-4 h-4" />
              <span>Verified Conceptual Derivation:</span>
            </div>
            <p>{sampleQuestion.explanation}</p>
          </div>
        )}
      </section>

      {/* 4. Section: Class 9, 10, 11 & 12 Question Banks Across All Streams */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Comprehensive Grade Coverage
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#0A1330]">
            Class 9, 10, 11 &amp; 12 Question Banks Across All Pre-Medical &amp; Pre-Engineering Subjects
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Whether preparing for Matric board send-ups or critical FSC Part 2 finals, Boardly organizes questions strictly according to textbook chapters and exam weightages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gradeStreams.map((item, idx) => (
            <article
              key={idx}
              className="p-6 sm:p-7 rounded-[26px] bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-poppins">{item.grade}</h3>
              <span className="text-xs font-semibold text-indigo-600 block">{item.focus}</span>
              <ul className="space-y-2.5 text-xs text-slate-600">
                {item.subjects.map((sub, sIdx) => (
                  <li key={sIdx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{sub}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* 5. Section: Targeted Practice to Secure Top Board Positions */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#0A1330]">
          Targeted Practice to Secure Top Board Positions
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Achieving position holder status in FBISE or provincial boards requires total accuracy in objective sections. With MCQs accounting for crucial marks, losing even 2 or 3 questions can drop your aggregate significantly. Boardly systematically reinforces weak topics with automated repetition.
        </p>
      </section>

      {/* 6. Section: FAQs on FBISE & Matric Board Examination Preparation */}
      <section className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-poppins text-[#0A1330]">
            Frequently Asked Questions about Board Exam Preparation
          </h2>
          <p className="text-sm text-slate-600">
            Answers to common questions regarding SLO coverage, syllabus revisions, and mock testing.
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
                      isOpen ? 'rotate-180 text-indigo-600' : ''
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
      <div className="text-center p-8 sm:p-12 rounded-[28px] bg-indigo-50 border border-indigo-200/80 space-y-4">
        <h3 className="text-2xl font-bold font-poppins text-[#0A1330]">
          Excel in Your SSC &amp; HSSC Examinations
        </h3>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Start practicing verified board questions for free today. Upgrade anytime to Boardly Pro for unlimited chapters and past paper access.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
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
