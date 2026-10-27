import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Sparkles, CheckCircle2, Layers } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SYLLABUS_MAP } from '@/constants/syllabusMap';
import { DEFAULT_TAXONOMY, slugify } from '@/constants/taxonomy';

const SUBJECT_CARDS = [
  {
    slug: 'mathematics',
    syllabusKey: 'mathematics' as const,
    name: 'Mathematics',
    tagline: 'Algebra, Trigonometry, Calculus, Vectors & Conic Sections',
    boards: ['FBISE', 'Punjab', 'Sindh', 'KPK', 'ECAT', 'NUST NET', 'FAST'],
  },
  {
    slug: 'physics',
    syllabusKey: 'physics' as const,
    name: 'Physics',
    tagline: 'Mechanics, Thermodynamics, Electromagnetism, Optics & Modern Physics',
    boards: ['FBISE', 'Punjab', 'Sindh', 'KPK', 'MDCAT', 'ECAT', 'NUST NET'],
  },
  {
    slug: 'chemistry',
    syllabusKey: 'chemistry' as const,
    name: 'Chemistry',
    tagline: 'Stoichiometry, Chemical Equilibrium, Organic & Inorganic Chemistry',
    boards: ['FBISE', 'Punjab', 'Sindh', 'KPK', 'MDCAT', 'ECAT'],
  },
  {
    slug: 'biology',
    syllabusKey: 'biology' as const,
    name: 'Biology',
    tagline: 'Cell Biology, Enzymes, Bioenergetics, Genetics & Human Physiology',
    boards: ['FBISE', 'Punjab', 'Sindh', 'KPK', 'MDCAT', 'NUMS'],
  },
  {
    slug: 'computer-science',
    syllabusKey: 'computer-science' as const,
    name: 'Computer Science',
    tagline: 'C/C++ Programming, Data Structures, Databases, Networks & OS',
    boards: ['FBISE', 'Punjab', 'ICS', 'FAST', 'NUST NET', 'COMSATS'],
  },
  {
    slug: 'english',
    syllabusKey: 'english' as const,
    name: 'English',
    tagline: 'Grammar, Vocabulary, Reading Comprehension & Sentence Correction',
    boards: ['FBISE', 'Punjab', 'MDCAT', 'ECAT', 'NUST NET'],
  },
];

export const McqsHubPage: React.FC = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Boardly Class 11, Class 12 & Entrance Exam MCQ Subjects',
    itemListElement: SUBJECT_CARDS.map((s, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: `${s.name} MCQs (Class 11 & 12 / MDCAT / ECAT)`,
      url: `https://boardly.cfd/mcqs/${s.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title="Class 11 & 12 Subject MCQs with KaTeX Solutions — MDCAT, ECAT, FBISE & Punjab"
        description="Practice chapter-by-chapter Class 11 & 12 MCQs for Mathematics, Physics, Chemistry, Biology, Computer Science, and English with instant KaTeX step-by-step solutions."
        canonicalPath="/mcqs"
        jsonLd={jsonLd}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs items={[{ label: 'Subject MCQs' }]} />

        {/* Hero */}
        <section className="glass-panel p-8 sm:p-10 mb-10">
          <div className="section-chip-red mb-4">
            <Sparkles size={13} />
            <span>Interactive Curriculum Index</span>
          </div>
          <h1 className="font-dot text-3xl sm:text-5xl font-bold text-white mb-3">
            Subject &amp; Chapter MCQ Bank
          </h1>
          <p className="text-sm sm:text-base text-white/75 max-w-3xl leading-relaxed">
            Explore every Class 11 (HSSC-I) and Class 12 (HSSC-II) chapter across Mathematics, Physics, Chemistry, Biology, Computer Science, and English. Try interactive sample MCQs with step-by-step KaTeX derivations on every chapter page without signing in.
          </p>
        </section>

        {/* Subject Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {SUBJECT_CARDS.map((sub) => {
            const syllabus = SYLLABUS_MAP[sub.syllabusKey];
            const class11Chapters = syllabus?.chaptersClass11 || [];
            const class12Chapters = syllabus?.chaptersClass12 || [];
            const taxonomySub = DEFAULT_TAXONOMY.find(
              (t) => t.slug === sub.slug || (sub.slug === 'computer-science' && t.slug === 'computer')
            );
            const totalChapters =
              class11Chapters.length + class12Chapters.length ||
              taxonomySub?.chapters.length ||
              0;

            const previewChapters = [
              ...class11Chapters.slice(0, 2).map((c) => c.name),
              ...class12Chapters.slice(0, 2).map((c) => c.name),
            ];

            return (
              <div key={sub.slug} className="glass-card p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="section-chip">
                      <Layers size={12} />
                      <span>{totalChapters} Chapters</span>
                    </span>
                    <span className="text-xs text-[#D71921] font-semibold">
                      Class 11 &amp; 12
                    </span>
                  </div>

                  <Link
                    to={`/mcqs/${sub.slug}`}
                    className="font-dot text-2xl font-bold text-white hover:text-[#D71921] transition-colors block mb-2"
                  >
                    {sub.name}
                  </Link>

                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-4">
                    {sub.tagline}
                  </p>

                  {/* Board Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {sub.boards.map((b) => (
                      <span
                        key={b}
                        className="glass-pill px-2.5 py-0.5 text-[10px] text-white/65"
                      >
                        {b}
                      </span>
                    ))}
                  </div>

                  {/* Quick Chapter Links */}
                  {previewChapters.length > 0 && (
                    <div className="space-y-1.5 mb-6 pt-4 border-t border-white/[0.08]">
                      <span className="text-[10px] uppercase tracking-wider text-white/45 block mb-2">
                        Popular Chapters
                      </span>
                      {previewChapters.map((ch) => (
                        <Link
                          key={ch}
                          to={`/mcqs/${sub.slug}/${slugify(ch)}`}
                          className="flex items-center justify-between text-xs text-white/75 hover:text-[#D71921] py-1 transition-colors"
                        >
                          <span className="truncate">{ch}</span>
                          <ArrowRight size={12} className="shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-white/[0.08]">
                  <Link
                    to={`/mcqs/${sub.slug}`}
                    className="btn-primary flex-1 py-2.5 px-4 text-xs font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <BookOpen size={14} />
                    <span>Open {sub.name} Chapters</span>
                  </Link>
                  <Link
                    to={`/material/subject/${sub.slug}`}
                    className="btn-secondary py-2.5 px-4 text-xs font-semibold"
                  >
                    Notes
                  </Link>
                </div>
              </div>
            );
          })}
        </section>

        {/* Bottom CTA */}
        <section className="glass-panel p-8 text-center">
          <CheckCircle2 size={22} className="text-[#D71921] mx-auto mb-3" />
          <h2 className="font-dot text-2xl font-bold text-white mb-2">
            Want Full Timed Mock Exams &amp; Saved Analytics?
          </h2>
          <p className="text-xs sm:text-sm text-white/65 max-w-xl mx-auto mb-6">
            Sign in for free to unlock custom timed tests, negative marking simulations, weak-chapter tracking, and daily PKT study streaks.
          </p>
          <Link to="/signup" className="btn-primary px-6 py-3 text-xs font-semibold inline-flex items-center gap-2">
            <span>Start Practicing Free</span>
            <ArrowRight size={14} />
          </Link>
        </section>
      </div>
    </div>
  );
};

export default McqsHubPage;
