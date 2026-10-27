import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, CheckCircle2, ArrowRight, BookOpen, Users, Trophy } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const STEPS = [
  {
    num: '01',
    title: 'Select Your Board, Class & Target Exam',
    desc: 'Choose Class 11 (HSSC-I), Class 12 (HSSC-II), or your target university entrance exam (MDCAT, ECAT, NUST NET, FAST, GIKI). Boardly tailors your syllabus chapters and marking rules automatically.',
    link: '/mcqs',
    linkLabel: 'Browse Subject Chapters →',
  },
  {
    num: '02',
    title: 'Practice Topic MCQs with Step-by-Step KaTeX Derivations',
    desc: 'Try sample questions right away or sign in to unlock full timed mock sessions. Every question includes clear mathematical and conceptual explanations rendered with precision KaTeX.',
    link: '/mcqs/physics',
    linkLabel: 'Try Sample Physics MCQs →',
  },
  {
    num: '03',
    title: 'Learn Together in Boardly Commons & Study Crews',
    desc: 'Read peer-shared notes, solved past papers, and formula sheets in Boardly Commons, join a campus Study Crew to maintain your PKT midnight streak, and compete on Grand Line public tests.',
    link: '/commons',
    linkLabel: 'Explore Boardly Commons →',
  },
];

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title="How Boardly Works — Adaptive MCQ Practice, Commons & Grand Line"
        description="See how Boardly helps Pakistani FSc, ICS, MDCAT, and ECAT students master every chapter through interactive MCQs, KaTeX derivations, Boardly Commons notes, and Grand Line mock exams."
        canonicalPath="/how-it-works"
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs items={[{ label: 'How Boardly Works' }]} />

        <section className="glass-panel p-8 sm:p-12 mb-10">
          <div className="section-chip-red mb-4">
            <Compass size={13} />
            <span>Step-by-Step Workflow</span>
          </div>
          <h1 className="font-dot text-3xl sm:text-5xl font-bold text-white mb-4">
            How Boardly Works
          </h1>
          <p className="text-base sm:text-lg text-white/75 max-w-3xl leading-relaxed">
            From topic-wise Class 11 &amp; 12 board mastery to full-length university entrance exam simulations, Boardly connects practice, community notes, and live competition in one place.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {STEPS.map((step, i) => (
            <div key={step.num} className="glass-card p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-dot text-3xl font-bold text-[#D71921]">{step.num}</span>
                  <span className="glass-pill px-3 py-1 text-[11px] text-white/60">
                    Step {i + 1} of 3
                  </span>
                </div>
                <h2 className="font-dot text-xl font-bold text-white mb-3">{step.title}</h2>
                <p className="text-sm text-white/70 leading-relaxed mb-6">{step.desc}</p>
              </div>
              <Link
                to={step.link}
                className="text-xs font-semibold text-[#D71921] hover:underline inline-flex items-center gap-1"
              >
                <span>{step.linkLabel}</span>
              </Link>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          <Link to="/material" className="glass-card-interactive p-6 block">
            <BookOpen size={20} className="text-[#D71921] mb-3" />
            <h3 className="font-dot text-lg font-bold text-white mb-1.5">Study Material Library</h3>
            <p className="text-xs text-white/65 leading-relaxed">
              Browse PDFs, formula sheets, and solved past papers organized by subject and class.
            </p>
          </Link>

          <Link to="/crew" className="glass-card-interactive p-6 block">
            <Users size={20} className="text-[#D71921] mb-3" />
            <h3 className="font-dot text-lg font-bold text-white mb-1.5">Study Crews &amp; Squads</h3>
            <p className="text-xs text-white/65 leading-relaxed">
              Team up with classmates, track daily study streaks, and climb campus leaderboards.
            </p>
          </Link>

          <Link to="/grand-line" className="glass-card-interactive p-6 block">
            <Trophy size={20} className="text-[#D71921] mb-3" />
            <h3 className="font-dot text-lg font-bold text-white mb-1.5">Grand Line Public Tests</h3>
            <p className="text-xs text-white/65 leading-relaxed">
              Compete in public mock exams created by Nakama Captains and view real-time standings.
            </p>
          </Link>
        </section>

        <section className="glass-panel p-8 text-center">
          <CheckCircle2 size={24} className="text-[#D71921] mx-auto mb-3" />
          <h2 className="font-dot text-2xl font-bold text-white mb-2">
            Ready to Start Practicing?
          </h2>
          <p className="text-sm text-white/65 max-w-xl mx-auto mb-6">
            Explore public chapters and sample MCQs without signing in, or create a free account to save your progress and analytics.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/mcqs" className="btn-primary px-6 py-2.5 text-xs font-semibold inline-flex items-center gap-2">
              <span>Explore All Subjects</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/signup" className="btn-secondary px-6 py-2.5 text-xs font-semibold">
              Create Free Account
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HowItWorksPage;
