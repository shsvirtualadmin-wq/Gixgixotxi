import React from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { BookOpen, ArrowRight, FolderOpen, MessageSquare, GraduationCap } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SYLLABUS_MAP, TOPIC_LISTS } from '@/constants/syllabusMap';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { UNIVERSITY_META } from '@/utils/routeSeoMeta';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const SUBJECT_META: Record<
  string,
  {
    name: string;
    syllabusKey: string;
    topicKey: string;
    canonicalSlug: string;
  }
> = {
  physics: {
    name: 'Physics',
    syllabusKey: 'physics',
    topicKey: 'physics',
    canonicalSlug: 'physics',
  },
  chemistry: {
    name: 'Chemistry',
    syllabusKey: 'chemistry',
    topicKey: 'chemistry',
    canonicalSlug: 'chemistry',
  },
  biology: {
    name: 'Biology',
    syllabusKey: 'biology',
    topicKey: 'biology',
    canonicalSlug: 'biology',
  },
  mathematics: {
    name: 'Mathematics',
    syllabusKey: 'mathematics',
    topicKey: 'mathematics',
    canonicalSlug: 'mathematics',
  },
  math: {
    name: 'Mathematics',
    syllabusKey: 'mathematics',
    topicKey: 'mathematics',
    canonicalSlug: 'mathematics',
  },
  'computer-science': {
    name: 'Computer Science',
    syllabusKey: 'computer-science',
    topicKey: 'computer',
    canonicalSlug: 'computer-science',
  },
  computer: {
    name: 'Computer Science',
    syllabusKey: 'computer-science',
    topicKey: 'computer',
    canonicalSlug: 'computer-science',
  },
  cs: {
    name: 'Computer Science',
    syllabusKey: 'computer-science',
    topicKey: 'computer',
    canonicalSlug: 'computer-science',
  },
  english: {
    name: 'English',
    syllabusKey: 'english',
    topicKey: 'english',
    canonicalSlug: 'english',
  },
};

const UNIVERSITY_SUBJECTS: Record<string, string[]> = {
  mdcat: ['biology', 'chemistry', 'physics', 'english'],
  nums: ['biology', 'chemistry', 'physics', 'english'],
  aku: ['biology', 'chemistry', 'physics', 'mathematics'],
  nust: ['mathematics', 'physics', 'chemistry', 'computer-science', 'english'],
  ecat: ['mathematics', 'physics', 'chemistry', 'computer-science', 'english'],
  fast: ['mathematics', 'physics', 'computer-science', 'english'],
  giki: ['mathematics', 'physics', 'english'],
  pieas: ['mathematics', 'physics', 'chemistry', 'english'],
};

export interface McqSubjectPageProps {
  universityOverride?: string;
  subjectOverride?: string;
}

export const McqSubjectPage: React.FC<McqSubjectPageProps> = ({
  universityOverride,
  subjectOverride,
}) => {
  const params = useParams<{
    subject?: string;
    subjectId?: string;
    university?: string;
  }>();
  const location = useLocation();
  const { requireAuth } = useAuthGate();

  const rawUniversity = (universityOverride || params.university || '').toLowerCase().trim();
  const rawSubject = (
    subjectOverride ||
    params.subject ||
    params.subjectId ||
    ''
  )
    .toLowerCase()
    .trim();

  // Case 1: /mcqs/:university (where rawSubject is a university slug like 'mdcat', 'nust', 'ecat', 'fast', 'giki', 'pieas', 'nums', 'aku' and no separate subjectOverride is set)
  if (!rawUniversity && UNIVERSITY_META[rawSubject]) {
    const uniKey = rawSubject;
    const uni = UNIVERSITY_META[uniKey];
    const uniSubjectKeys = UNIVERSITY_SUBJECTS[uniKey] || [
      'physics',
      'chemistry',
      'mathematics',
      'biology',
      'english',
    ];

    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
        <PageMeta
          title={`${uni.name} MCQs & Chapter-Wise Practice Bank — ${uni.fullName} | Boardly`}
          description={uni.description}
          canonicalPath={`/mcqs/${uniKey}`}
        />

        <div className="max-w-5xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Subject MCQs', href: '/mcqs' },
              { label: `${uni.name} Track` },
            ]}
          />

          <section className="glass-panel p-8 sm:p-10 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="section-chip-red mb-3">
                <GraduationCap size={13} />
                <span>{uni.fullName}</span>
              </div>
              <h1 className="font-dot text-3xl sm:text-5xl font-bold text-white mb-3">
                {uni.name} MCQs &amp; Subject Bank
              </h1>
              <p className="text-sm sm:text-base text-white/75 max-w-2xl leading-relaxed">
                {uni.description} Select any subject or chapter below to open its dedicated {uni.name} practice page.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to={`/practice?university=${uniKey.toUpperCase()}`}
                className="btn-primary px-5 py-3 text-xs font-semibold inline-flex items-center gap-2"
              >
                <span>Start Timed {uni.name} Drill</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {uniSubjectKeys.map((sKey) => {
              const sMeta = SUBJECT_META[sKey];
              if (!sMeta) return null;
              const syl = SYLLABUS_MAP[sMeta.syllabusKey];
              const chapters = [
                ...(syl?.chaptersClass11 || []).map((c) => c.name),
                ...(syl?.chaptersClass12 || []).map((c) => c.name),
                ...(sMeta.topicKey === 'english' ? TOPIC_LISTS.english || [] : []),
              ];

              return (
                <article
                  key={sKey}
                  className="glass-panel p-6 sm:p-8 flex flex-col justify-between gap-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h2 className="font-dot text-2xl font-bold text-white">
                        <Link
                          to={`/mcqs/${uniKey}/${sMeta.canonicalSlug}`}
                          className="hover:text-[#D71921] transition-colors"
                        >
                          {uni.name} {sMeta.name}
                        </Link>
                      </h2>
                      <span className="glass-pill px-3 py-1 text-xs font-semibold text-white/75">
                        {chapters.length} Chapters
                      </span>
                    </div>
                    <p className="text-xs text-white/65 mb-4">
                      High-yield {sMeta.name} chapters and past paper topics tested in {uni.name}.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {chapters.slice(0, 6).map((ch) => {
                        const chSlug = slugify(ch);
                        return (
                          <Link
                            key={chSlug}
                            to={`/mcqs/${uniKey}/${sMeta.canonicalSlug}/${chSlug}`}
                            className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-xs text-white/80 hover:text-white transition-colors"
                          >
                            {ch}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <Link
                      to={`/study-material/subject/${sMeta.canonicalSlug}`}
                      className="text-xs text-white/60 hover:text-white transition-colors"
                    >
                      {sMeta.name} Notes &amp; PDFs →
                    </Link>
                    <Link
                      to={`/mcqs/${uniKey}/${sMeta.canonicalSlug}`}
                      className="btn-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <span>All {sMeta.name} Chapters</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Standard Subject Page (/mcqs/:subject, /subjects/:subjectId, or /mcqs/:university/:subject)
  const meta = SUBJECT_META[rawSubject];
  const uniMeta = rawUniversity ? UNIVERSITY_META[rawUniversity] : undefined;

  if (!meta || (rawUniversity && !uniMeta)) {
    return <NotFoundPage />;
  }

  const { name: subjectName, syllabusKey, topicKey, canonicalSlug } = meta;
  const syllabus = SYLLABUS_MAP[syllabusKey];
  const class11Chapters = syllabus?.chaptersClass11.map((c) => c.name) || [];
  const class12Chapters = syllabus?.chaptersClass12.map((c) => c.name) || [];
  const generalTopics = (TOPIC_LISTS[topicKey] || []).map((t) => ({
    name: t,
    slug: slugify(t),
  }));

  const isSubjectsRoute = location.pathname.startsWith('/subjects');
  const chapterLinkPrefix = uniMeta
    ? `/mcqs/${rawUniversity}/${canonicalSlug}`
    : isSubjectsRoute
    ? `/subjects/${canonicalSlug}`
    : `/mcqs/${canonicalSlug}`;

  const canonicalPath = uniMeta
    ? `/mcqs/${rawUniversity}/${canonicalSlug}`
    : isSubjectsRoute
    ? `/subjects/${canonicalSlug}`
    : `/mcqs/${canonicalSlug}`;

  const pageTitle = uniMeta
    ? `${uniMeta.name} ${subjectName} MCQs — Chapter-Wise Practice & Solutions`
    : `${subjectName} MCQs — Class 11, Class 12 & Entrance Test Chapters`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: `Practice chapter-wise ${
      uniMeta ? `${uniMeta.name} ` : ''
    }${subjectName} MCQs with step-by-step explanations on Boardly.`,
    url: `https://boardly.cfd${canonicalPath}`,
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title={pageTitle}
        description={`Browse all ${
          uniMeta ? `${uniMeta.name} ` : 'Class 11 and Class 12 '
        }${subjectName} chapters on Boardly. Practice topic-wise MCQs for FBISE, Punjab Board, MDCAT, NUST NET, and ECAT with instant explanations.`}
        canonicalPath={canonicalPath}
        jsonLd={jsonLd}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          items={
            uniMeta
              ? [
                  { label: 'Subject MCQs', href: '/mcqs' },
                  { label: uniMeta.name, href: `/mcqs/${rawUniversity}` },
                  { label: subjectName },
                ]
              : [
                  {
                    label: isSubjectsRoute ? 'Subjects' : 'Subject MCQs',
                    href: isSubjectsRoute ? '/subjects' : '/mcqs',
                  },
                  { label: subjectName },
                ]
          }
        />

        {/* Subject Hero */}
        <section className="glass-panel p-8 sm:p-10 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="section-chip-red mb-3">
              <BookOpen size={13} />
              <span>
                {uniMeta
                  ? `${uniMeta.fullName} · ${subjectName}`
                  : 'Class 11 & 12 Syllabus + Entrance Prep'}
              </span>
            </div>
            <h1 className="font-dot text-3xl sm:text-5xl font-bold text-white mb-3">
              {uniMeta ? `${uniMeta.name} ${subjectName}` : subjectName} Chapters &amp; MCQs
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
                  `/practice?subject=${encodeURIComponent(canonicalSlug)}${
                    uniMeta ? `&university=${rawUniversity.toUpperCase()}` : ''
                  }`
                )
              }
              className="btn-primary px-5 py-3 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <span>
                Full Timed {uniMeta ? `${uniMeta.name} ` : ''}
                {subjectName} Test
              </span>
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
                      to={`${chapterLinkPrefix}/${chSlug}`}
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
                      to={`${chapterLinkPrefix}/${chSlug}`}
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
                  to={`${chapterLinkPrefix}/${topic.slug}`}
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
            to={`/study-material/subject/${canonicalSlug}`}
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
