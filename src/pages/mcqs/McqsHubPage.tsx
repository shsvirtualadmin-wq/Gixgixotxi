import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  Cpu,
  Languages,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SYLLABUS_MAP, TOPIC_LISTS } from '@/constants/syllabusMap';

interface SubjectCardDef {
  slug: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  boards: string;
  chapterCount: number;
  sampleChapters: { title: string; slug: string }[];
}

interface UniversityTrackDef {
  slug: string;
  name: string;
  fullName: string;
  subjects: { name: string; slug: string }[];
  badge: string;
}

const UNIVERSITY_TRACKS: UniversityTrackDef[] = [
  {
    slug: 'mdcat',
    name: 'PMDC MDCAT',
    fullName: 'National Medical & Dental College Admission Test',
    badge: '200 MCQs · Medical',
    subjects: [
      { name: 'Biology', slug: 'biology' },
      { name: 'Chemistry', slug: 'chemistry' },
      { name: 'Physics', slug: 'physics' },
      { name: 'English', slug: 'english' },
    ],
  },
  {
    slug: 'nust',
    name: 'NUST NET',
    fullName: 'NUST Entrance Test (Engineering & Computing)',
    badge: '200 MCQs · Engineering/CS',
    subjects: [
      { name: 'Mathematics', slug: 'mathematics' },
      { name: 'Physics', slug: 'physics' },
      { name: 'Chemistry', slug: 'chemistry' },
      { name: 'Computer Science', slug: 'computer-science' },
      { name: 'English', slug: 'english' },
    ],
  },
  {
    slug: 'ecat',
    name: 'UET ECAT',
    fullName: 'Combined Engineering Entrance Test',
    badge: '100 MCQs · Engineering',
    subjects: [
      { name: 'Mathematics', slug: 'mathematics' },
      { name: 'Physics', slug: 'physics' },
      { name: 'Chemistry', slug: 'chemistry' },
      { name: 'Computer Science', slug: 'computer-science' },
      { name: 'English', slug: 'english' },
    ],
  },
  {
    slug: 'fast',
    name: 'FAST-NUCES',
    fullName: 'FAST National University CS & Engineering Test',
    badge: '120 MCQs · CS & AI',
    subjects: [
      { name: 'Mathematics', slug: 'mathematics' },
      { name: 'Physics', slug: 'physics' },
      { name: 'Computer Science', slug: 'computer-science' },
      { name: 'English', slug: 'english' },
    ],
  },
  {
    slug: 'giki',
    name: 'GIKI',
    fullName: 'GIKI Undergraduate Admission Test',
    badge: '80 MCQs · Engineering',
    subjects: [
      { name: 'Mathematics', slug: 'mathematics' },
      { name: 'Physics', slug: 'physics' },
      { name: 'English', slug: 'english' },
    ],
  },
  {
    slug: 'nums',
    name: 'NUMS MDCAT',
    fullName: 'National University of Medical Sciences Test',
    badge: '150 MCQs · Medical',
    subjects: [
      { name: 'Biology', slug: 'biology' },
      { name: 'Chemistry', slug: 'chemistry' },
      { name: 'Physics', slug: 'physics' },
      { name: 'English', slug: 'english' },
    ],
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const SUBJECT_DEFS: SubjectCardDef[] = [
  {
    slug: 'physics',
    name: 'Physics',
    icon: <Atom size={20} className="text-[#D71921]" />,
    description:
      'Mechanics, Waves, Thermodynamics, Electromagnetism, Modern Physics & Nuclear Physics for Class 11–12, ECAT, NET & MDCAT.',
    boards: 'FBISE · Punjab · Sindh · KPK · MDCAT · NET · ECAT',
    chapterCount:
      (SYLLABUS_MAP.physics?.chaptersClass11.length || 0) +
      (SYLLABUS_MAP.physics?.chaptersClass12.length || 0),
    sampleChapters: (SYLLABUS_MAP.physics?.chaptersClass11 || [])
      .slice(0, 4)
      .map((c) => ({ title: c.name, slug: slugify(c.name) })),
  },
  {
    slug: 'chemistry',
    name: 'Chemistry',
    icon: <FlaskConical size={20} className="text-[#D71921]" />,
    description:
      'Stoichiometry, Atomic Structure, Chemical Bonding, Thermochemistry, Electrochemistry, Organic & Inorganic Chemistry MCQs.',
    boards: 'FBISE · Punjab · Sindh · KPK · MDCAT · ECAT',
    chapterCount:
      (SYLLABUS_MAP.chemistry?.chaptersClass11.length || 0) +
      (SYLLABUS_MAP.chemistry?.chaptersClass12.length || 0),
    sampleChapters: (SYLLABUS_MAP.chemistry?.chaptersClass11 || [])
      .slice(0, 4)
      .map((c) => ({ title: c.name, slug: slugify(c.name) })),
  },
  {
    slug: 'biology',
    name: 'Biology',
    icon: <Dna size={20} className="text-[#D71921]" />,
    description:
      'Cell Biology, Biological Molecules, Enzymes, Bioenergetics, Human Physiology, Genetics, Evolution & Biotechnology for PMDC MDCAT.',
    boards: 'PMDC MDCAT · NUMS · AKU · FBISE · Punjab · Sindh · KPK',
    chapterCount:
      (SYLLABUS_MAP.biology?.chaptersClass11.length || 0) +
      (SYLLABUS_MAP.biology?.chaptersClass12.length || 0),
    sampleChapters: (SYLLABUS_MAP.biology?.chaptersClass11 || [])
      .slice(0, 4)
      .map((c) => ({ title: c.name, slug: slugify(c.name) })),
  },
  {
    slug: 'mathematics',
    name: 'Mathematics',
    icon: <Calculator size={20} className="text-[#D71921]" />,
    description:
      'Algebra, Trigonometry, Vectors, Matrices, Conic Sections, Differential & Integral Calculus for NUST NET, FAST, GIKI & ECAT.',
    boards: 'NUST NET · FAST · GIKI · UET ECAT · FBISE · Punjab',
    chapterCount:
      (SYLLABUS_MAP.mathematics?.chaptersClass11.length || 0) +
      (SYLLABUS_MAP.mathematics?.chaptersClass12.length || 0),
    sampleChapters: (SYLLABUS_MAP.mathematics?.chaptersClass11 || [])
      .slice(0, 4)
      .map((c) => ({ title: c.name, slug: slugify(c.name) })),
  },
  {
    slug: 'computer-science',
    name: 'Computer Science',
    icon: <Cpu size={20} className="text-[#D71921]" />,
    description:
      'Programming Fundamentals, C/C++, Data Structures, Databases, Operating Systems & Computer Networks for ICS and Computing Entry Tests.',
    boards: 'ICS Part I & II · NUST NET CS · FAST · ITU',
    chapterCount:
      (SYLLABUS_MAP['computer-science']?.chaptersClass11.length || 0) +
      (SYLLABUS_MAP['computer-science']?.chaptersClass12.length || 0),
    sampleChapters: (SYLLABUS_MAP['computer-science']?.chaptersClass11 || [])
      .slice(0, 4)
      .map((c) => ({ title: c.name, slug: slugify(c.name) })),
  },
  {
    slug: 'english',
    name: 'English',
    icon: <Languages size={20} className="text-[#D71921]" />,
    description:
      'Vocabulary, Synonyms & Antonyms, Sentence Completion, Error Spotting, Grammar Rules & Reading Comprehension for all admission tests.',
    boards: 'MDCAT · NUST NET · FAST · GIKI · NTS NAT · HSSC',
    chapterCount: TOPIC_LISTS.english?.length || 5,
    sampleChapters: (TOPIC_LISTS.english || []).map((t) => ({
      title: t,
      slug: slugify(t),
    })),
  },
];

export const McqsHubPage: React.FC = () => {
  const location = useLocation();
  const isSubjectsRoute = location.pathname.startsWith('/subjects');
  const baseSubjectPrefix = isSubjectsRoute ? '/subjects' : '/mcqs';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: isSubjectsRoute
      ? 'All Subjects — Class 11, Class 12 & Entrance Test Syllabus | Boardly'
      : 'Class 11, Class 12 & University Entrance Exam MCQs by Subject — Boardly',
    description:
      'Free topic-wise and chapter-wise MCQs with step-by-step explanations for Physics, Chemistry, Biology, Mathematics, Computer Science, and English in Pakistan.',
    url: `https://boardly.cfd${isSubjectsRoute ? '/subjects' : '/mcqs'}`,
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title={
          isSubjectsRoute
            ? 'All Subjects — Physics, Chemistry, Biology, Math, CS & English | Boardly'
            : 'Subject-Wise MCQs — Physics, Chemistry, Biology, Math & English'
        }
        description="Practice chapter-wise Class 11 & 12 board exam and MDCAT, NUST NET, UET ECAT, FAST & GIKI entrance test MCQs with instant step-by-step explanations."
        canonicalPath={isSubjectsRoute ? '/subjects' : '/mcqs'}
        jsonLd={jsonLd}
      />

      <div className="max-w-5xl mx-auto">
        <Breadcrumbs items={[{ label: isSubjectsRoute ? 'Subjects' : 'Subject MCQs' }]} />

        {/* Header */}
        <section className="glass-panel p-8 sm:p-10 mb-10">
          <div className="section-chip-red mb-4">
            <BookOpen size={13} />
            <span>Public Question Bank · Chapter-Wise Practice</span>
          </div>
          <h1 className="font-dot text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            {isSubjectsRoute
              ? 'Explore All Subjects & Chapters'
              : 'Practice MCQs by Subject, University & Chapter'}
          </h1>
          <p className="text-sm sm:text-base text-white/75 max-w-3xl leading-relaxed">
            Explore Boardly’s structured question bank for Pakistani Class 11 (HSSC-I) and Class 12 (HSSC-II) board exams alongside MDCAT, NUST NET, FAST, UET ECAT, and GIKI admission tests. Every chapter includes sample questions with full KaTeX mathematical and scientific explanations.
          </p>
        </section>

        {/* University Entrance Exam Tracks */}
        <section className="mb-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap size={20} className="text-[#D71921]" />
              <h2 className="font-dot text-xl sm:text-2xl font-bold text-white">
                University Entrance Test Tracks
              </h2>
            </div>
            <span className="text-xs text-white/55">Direct university syllabus links</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {UNIVERSITY_TRACKS.map((uni) => (
              <div
                key={uni.slug}
                className="glass-panel p-5 flex flex-col justify-between gap-4 border border-white/10 hover:border-white/20 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Link
                      to={`/mcqs/${uni.slug}`}
                      className="font-dot text-lg font-bold text-white hover:text-[#D71921] transition-colors"
                    >
                      {uni.name}
                    </Link>
                    <span className="glass-pill px-2.5 py-0.5 text-[10px] font-semibold text-[#D71921]">
                      {uni.badge}
                    </span>
                  </div>
                  <p className="text-xs text-white/65 mb-3">{uni.fullName}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {uni.subjects.map((s) => (
                      <Link
                        key={s.slug}
                        to={`/mcqs/${uni.slug}/${s.slug}`}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-[11px] text-white/80 hover:text-white transition-colors"
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <Link
                  to={`/mcqs/${uni.slug}`}
                  className="text-xs font-semibold text-[#D71921] hover:underline inline-flex items-center gap-1"
                >
                  <span>Open {uni.name} Question Bank</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Subject Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SUBJECT_DEFS.map((subj) => (
            <article
              key={subj.slug}
              className="glass-panel p-6 sm:p-8 flex flex-col justify-between gap-6 transition-all hover:border-white/25"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D71921]/10 border border-[#D71921]/30 flex items-center justify-center">
                      {subj.icon}
                    </div>
                    <div>
                      <h2 className="font-dot text-2xl font-bold text-white">
                        <Link
                          to={`${baseSubjectPrefix}/${subj.slug}`}
                          className="hover:text-[#D71921] transition-colors"
                        >
                          {subj.name} MCQs
                        </Link>
                      </h2>
                      <p className="text-[11px] font-mono text-white/50">{subj.boards}</p>
                    </div>
                  </div>
                  <span className="glass-pill px-3 py-1 text-xs font-semibold text-white/80">
                    {subj.chapterCount} Chapters
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-5">
                  {subj.description}
                </p>

                {/* Sample Chapter Quick Links */}
                <div className="space-y-2 mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
                    Popular Chapters
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {subj.sampleChapters.map((ch) => (
                      <Link
                        key={ch.slug}
                        to={`/mcqs/${subj.slug}/${ch.slug}`}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-xs text-white/80 hover:text-white transition-colors"
                      >
                        {ch.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <Link
                  to={`/study-material/subject/${subj.slug}`}
                  className="text-xs text-white/60 hover:text-white transition-colors"
                >
                  View {subj.name} Notes &amp; PDFs →
                </Link>
                <Link
                  to={`${baseSubjectPrefix}/${subj.slug}`}
                  className="btn-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <span>Browse All Chapters</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default McqsHubPage;
