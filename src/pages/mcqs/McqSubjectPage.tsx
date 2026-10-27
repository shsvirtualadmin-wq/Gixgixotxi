import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, ArrowRight, FolderOpen, MessageSquare, CheckCircle2 } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SYLLABUS_MAP } from '@/constants/syllabusMap';
import { DEFAULT_TAXONOMY, slugify, formatSubjectName } from '@/constants/taxonomy';
import { useAuthGate } from '@/contexts/AuthGateContext';

function resolveSyllabusKey(slug: string): string | null {
  const s = slug.toLowerCase().trim();
  if (s === 'mathematics' || s === 'math' || s === 'maths') return 'mathematics';
  if (s === 'physics') return 'physics';
  if (s === 'chemistry') return 'chemistry';
  if (s === 'biology' || s === 'bio') return 'biology';
  if (s === 'computer-science' || s === 'computer' || s === 'cs') return 'computer-science';
  if (s === 'english') return 'english';
  return null;
}

export const McqSubjectPage: React.FC = () => {
  const { subject = '' } = useParams<{ subject: string }>();
  const { requireAuth } = useAuthGate();

  const syllabusKey = resolveSyllabusKey(subject);
  const taxonomySubject = DEFAULT_TAXONOMY.find(
    (t) =>
      t.slug === subject.toLowerCase() ||
      (subject.toLowerCase() === 'computer-science' && t.slug === 'computer')
  );

  if (!syllabusKey && !taxonomySubject) {
    return <NotFoundPage />;
  }

  const subjectName =
    (syllabusKey && SYLLABUS_MAP[syllabusKey]?.name) ||
    taxonomySubject?.name ||
    formatSubjectName(subject);

  const class11Chapters = syllabusKey
    ? (SYLLABUS_MAP[syllabusKey]?.chaptersClass11 || []).map((c) => c.name)
    : [];
  const class12Chapters = syllabusKey
    ? (SYLLABUS_MAP[syllabusKey]?.chaptersClass12 || []).map((c) => c.name)
    : [];
  const generalTopics = taxonomySubject?.chapters || [];

  const canonicalSlug = syllabusKey || taxonomySubject?.slug || subject.toLowerCase();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `${subjectName} Class 11 & 12 Board & Entrance Exam MCQs`,
    description: `Complete chapter-wise ${subjectName} MCQ bank with step-by-step KaTeX derivations for Class 11 (HSSC-I), Class 12 (HSSC-II), MDCAT, ECAT, and NUST NET.`,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Boardly',
      sameAs: 'https://boardly.cfd',
    },
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title={`${subjectName} MCQs — Class 11 & 12 Chapters, MDCAT & ECAT Practice`}
        description={`Practice ${subjectName} chapter-by-chapter MCQs for Class 11 (HSSC-I), Class 12 (HSSC-II), FBISE, Punjab Board, MDCAT, and ECAT with step-by-step KaTeX solutions.`}
        canonicalPath={`/mcqs/${canonicalSlug}`}
        jsonLd={jsonLd}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Subject MCQs', href: '/mcqs' },
            { label: subjectName },
          ]}
        />

        {/* Subject Hero */}
        <section className="glass-panel p-8 sm:p-10 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="section-chip-red mb-3">
              <BookOpen size={13} />
              <span>Class 11 &amp; 12 Syllabus + Entrance Prep</span>
            </div>
            <h1 className="font-dot text-3xl sm:text-5xl font-bold text-white mb-3">
              {subjectName} Chapters &amp; MCQs
            </h1>
            <p className="text-sm sm:text-base text-white/75 max-w-2xl leading-relaxed">
              Select any chapter below to read its syllabus overview and practice interactive sample MCQs with instant KaTeX solutions—no sign-in required for sample practice.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              type="button"
              onClick={() =>
                requireAuth(
                  `start a full timed ${subjectName} test and save your progress`,
                  undefined,
                  '/dashboard'
                )
              }
              className="btn-primary px-5 py-3 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Full Timed {subjectName} Test</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* Class 11 & Class 12 Chapter Columns */}
        {class11Chapters.length > 0 || class12Chapters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Class 11 */}
            <section className="glass-panel p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D71921]">
                    Part I · HSSC-I
                  </span>
                  <h2 className="font-dot text-2xl font-bold text-white">
                    Class 11 {subjectName}
                  </h2>
                </div>
                <span className="glass-pill px-3 py-1 text-xs text-white/70">
                  {class11Chapters.length} Chapters
                </span>
              </div>

              <div className="space-y-2.5">
                {class11Chapters.map((ch, idx) => {
                  const chSlug = slugify(ch);
                  return (
                    <Link
                      key={chSlug}
                      to={`/mcqs/${canonicalSlug}/${chSlug}`}
                      className="glass-row flex items-center justify-between gap-3 p-3.5 rounded-xl group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-dot text-xs font-bold text-[#D71921] w-6 shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-white group-hover:text-[#D71921] transition-colors truncate">
                          {ch}
                        </span>
                      </div>
                      <span className="text-[11px] text-white/50 group-hover:text-white inline-flex items-center gap-1 shrink-0">
                        <span>Practice</span>
                        <ArrowRight size={12} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Class 12 */}
            <section className="glass-panel p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D71921]">
                    Part II · HSSC-II
                  </span>
                  <h2 className="font-dot text-2xl font-bold text-white">
                    Class 12 {subjectName}
                  </h2>
                </div>
                <span className="glass-pill px-3 py-1 text-xs text-white/70">
                  {class12Chapters.length} Chapters
                </span>
              </div>

              <div className="space-y-2.5">
                {class12Chapters.map((ch, idx) => {
                  const chSlug = slugify(ch);
                  return (
                    <Link
                      key={chSlug}
                      to={`/mcqs/${canonicalSlug}/${chSlug}`}
                      className="glass-row flex items-center justify-between gap-3 p-3.5 rounded-xl group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-dot text-xs font-bold text-[#D71921] w-6 shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-white group-hover:text-[#D71921] transition-colors truncate">
                          {ch}
                        </span>
                      </div>
                      <span className="text-[11px] text-white/50 group-hover:text-white inline-flex items-center gap-1 shrink-0">
                        <span>Practice</span>
                        <ArrowRight size={12} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        ) : null}

        {/* Core Entrance Test Topic Clusters */}
        {generalTopics.length > 0 && (
          <section className="glass-panel p-6 sm:p-8 mb-10">
            <h2 className="font-dot text-xl font-bold text-white mb-4">
              Core Entrance Exam Topic Clusters ({subjectName})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {generalTopics.map((topic) => (
                <Link
                  key={topic.slug}
                  to={`/mcqs/${canonicalSlug}/${topic.slug}`}
                  className="glass-card-interactive p-4 flex items-center justify-between gap-2"
                >
                  <span className="text-xs sm:text-sm font-semibold text-white truncate">
                    {topic.name}
                  </span>
                  <ArrowRight size={14} className="text-[#D71921] shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Cross-links to Commons & Material */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to={`/material/subject/${canonicalSlug}`}
            className="glass-card-interactive p-6 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <FolderOpen size={20} className="text-[#D71921] shrink-0" />
              <div>
                <h3 className="font-dot text-base font-bold text-white">
                  {subjectName} Notes &amp; Past Papers
                </h3>
                <p className="text-xs text-white/60">
                  Browse student-shared PDFs and formula sheets
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-white/50" />
          </Link>

          <Link
            to={`/commons/subject/${canonicalSlug}`}
            className="glass-card-interactive p-6 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-[#D71921] shrink-0" />
              <div>
                <h3 className="font-dot text-base font-bold text-white">
                  {subjectName} Community Discussions
                </h3>
                <p className="text-xs text-white/60">
                  Ask doubts and view solved problems in Commons
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-white/50" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default McqSubjectPage;
