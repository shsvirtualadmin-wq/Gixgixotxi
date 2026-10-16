import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Target,
  BookOpen,
  Filter,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
  ChevronRight,
  RefreshCw,
  Check,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, logFirestoreError } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  limit,
  startAfter,
  getDocs,
  DocumentSnapshot,
  DocumentData,
  orderBy,
} from 'firebase/firestore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Modal } from '../ui/Modal';
import { UNIVERSITIES } from '../../data/universities';

interface QuestionDoc {
  id: string;
  q: string;
  options: string[];
  correct: number;
  explain?: string;
  subject: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
}

interface SheetDoc {
  id: string;
  title: string;
  subject: string;
  chapter?: string;
  topic?: string;
  questionCount: number;
  durationMinutes: number;
  difficulty?: string;
  tags?: string[];
}

interface PracticeVaultViewProps {
  onStartDrillSession: (config: {
    subject: string;
    chapter?: string;
    topic?: string;
    questionCount: number;
    durationMinutes: number;
    difficulty?: string;
    isPastPaper?: boolean;
    universityId?: string;
  }) => void;
}

const SUBJECT_LIST = [
  'All Subjects',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Computer Science',
  'Biology',
  'English',
  'Analytical',
];

const CHAPTERS_BY_SUBJECT: Record<string, string[]> = {
  Mathematics: [
    'Trigonometry',
    'Matrices & Determinants',
    'Conic Sections',
    'Differentiation',
    'Integration',
    'Vectors',
    'Functions & Limits',
    'Permutations & Combinations',
    'Probability',
    'Sequences & Series',
  ],
  Physics: [
    'Vectors & Equilibrium',
    'Motion & Force',
    'Work & Energy',
    'Circular Motion',
    'Fluid Dynamics',
    'Oscillations',
    'Waves',
    'Physical Optics',
    'Thermodynamics',
    'Electrostatics',
    'Current Electricity',
    'Electromagnetism',
    'Electronics',
    'Nuclear Physics',
  ],
  Chemistry: [
    'Stoichiometry',
    'Atomic Structure',
    'Chemical Bonding',
    'States of Matter',
    'Chemical Equilibrium',
    'Reaction Kinetics',
    'Thermochemistry',
    'Electrochemistry',
    'Organic Hydrocarbons',
    'Alkyl Halides',
    'Alcohols & Phenols',
    'Aldehydes & Ketones',
  ],
  Biology: [
    'Cell Structure',
    'Biological Molecules',
    'Enzymes',
    'Bioenergetics',
    'Kingdom Animalia',
    'Kingdom Plantae',
    'Human Physiology',
    'Genetics',
    'Evolution',
    'Ecology',
  ],
  'Computer Science': [
    'Programming Fundamentals',
    'OOP Concepts',
    'Data Structures',
    'Database Systems',
    'Computer Networks',
    'Boolean Algebra',
    'OS Concepts',
  ],
  English: [
    'Vocabulary',
    'Sentence Completion',
    'Grammar & Structure',
    'Reading Comprehension',
    'Analogy',
  ],
  Analytical: [
    'Number Series',
    'Coding-Decoding',
    'Critical Reasoning',
    'Direction Sense',
    'Analytical Puzzles',
  ],
};

const DIFFICULTY_LIST = ['All Difficulties', 'Easy', 'Medium', 'Hard', 'Exam Standard'];

export const PracticeVaultView: React.FC<PracticeVaultViewProps> = ({
  onStartDrillSession,
}) => {
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'configurator' | 'questions' | 'pastPapers'>('configurator');
  const [selectedSubject, setSelectedSubject] = useState<string>('All Subjects');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All Difficulties');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Questions pagination state
  const [questions, setQuestions] = useState<QuestionDoc[]>([]);
  const [lastQuestionDoc, setLastQuestionDoc] = useState<DocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreQuestions, setHasMoreQuestions] = useState<boolean>(true);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState<boolean>(true);
  const [questionsError, setQuestionsError] = useState<{ message: string; path?: string } | null>(null);

  // Sheets (Past Paper Vaults) state
  const [sheets, setSheets] = useState<SheetDoc[]>([]);
  const [isSheetsLoading, setIsSheetsLoading] = useState<boolean>(false);
  const [sheetsError, setSheetsError] = useState<{ message: string; path?: string } | null>(null);

  // Configurator state
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [drillSubject, setDrillSubject] = useState<string>('Mathematics');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [drillTopic, setDrillTopic] = useState<string>('');
  const [drillCount, setDrillCount] = useState<number>(20);
  const [drillDuration, setDrillDuration] = useState<number>(20);
  const [drillDifficulty, setDrillDifficulty] = useState<string>('Exam Standard');
  const [drillIsPastPaper, setDrillIsPastPaper] = useState<boolean>(false);
  const [drillUniversityId, setDrillUniversityId] = useState<string>('fast');

  // Chapter Accuracy Map from User's real test history
  const chapterAccuracyMap = useMemo(() => {
    const map: Record<string, { total: number; correct: number }> = {};
    const history = Array.isArray(profile?.testHistory) ? profile.testHistory : [];
    history.forEach((attempt: any) => {
      if (Array.isArray(attempt.chapterBreakdown)) {
        attempt.chapterBreakdown.forEach((cb: any) => {
          if (cb.chapter) {
            const key = cb.chapter.toLowerCase().trim();
            if (!map[key]) map[key] = { total: 0, correct: 0 };
            map[key].total += cb.total || 0;
            map[key].correct += cb.correct || 0;
          }
        });
      }
    });
    return map;
  }, [profile?.testHistory]);

  const getChapterAccuracy = (chName: string): number | null => {
    const stat = chapterAccuracyMap[chName.toLowerCase().trim()];
    if (!stat || stat.total === 0) return null;
    return Math.round((stat.correct / stat.total) * 100);
  };

  // Load Questions with Cursor Pagination
  const fetchQuestions = useCallback(async (isLoadMore = false) => {
    setIsQuestionsLoading(true);
    setQuestionsError(null);
    const questionsPath = 'questions';

    try {
      let qConstraint: any[] = [collection(db, 'questions')];

      if (selectedSubject !== 'All Subjects') {
        qConstraint.push(where('subject', '==', selectedSubject));
      }

      if (selectedDifficulty !== 'All Difficulties') {
        qConstraint.push(where('difficulty', '==', selectedDifficulty));
      }

      if (isLoadMore && lastQuestionDoc) {
        qConstraint.push(startAfter(lastQuestionDoc));
      }

      qConstraint.push(limit(25));

      const finalQuery = query(qConstraint[0], ...qConstraint.slice(1));
      const snap = await getDocs(finalQuery);

      const items: QuestionDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      if (isLoadMore) {
        setQuestions((prev) => [...prev, ...items]);
      } else {
        setQuestions(items);
      }

      setLastQuestionDoc(snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null);
      setHasMoreQuestions(snap.docs.length === 25);
    } catch (err: any) {
      logFirestoreError(questionsPath, err, 'practice_fetch_questions');
      setQuestionsError({
        message: err?.message || 'Unable to fetch practice questions from Firestore.',
        path: questionsPath,
      });
    } finally {
      setIsQuestionsLoading(false);
    }
  }, [selectedSubject, selectedDifficulty, lastQuestionDoc]);

  // Load Sheets (Past Papers Vaults)
  const fetchSheets = useCallback(async () => {
    setIsSheetsLoading(true);
    setSheetsError(null);
    const sheetsPath = 'sheets';

    try {
      const q = query(collection(db, 'sheets'), limit(30));
      const snap = await getDocs(q);
      const items: SheetDoc[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setSheets(items);
    } catch (err: any) {
      logFirestoreError(sheetsPath, err, 'practice_fetch_sheets');
      setSheetsError({
        message: err?.message || 'Unable to fetch past paper sheets from Firestore.',
        path: sheetsPath,
      });
    } finally {
      setIsSheetsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestions(false);
    } else {
      fetchSheets();
    }
  }, [activeTab, selectedSubject, selectedDifficulty]);

  const handleOpenConfigurator = (subject = 'Mathematics', topic = '') => {
    setDrillSubject(subject);
    setDrillTopic(topic);
    setDrillCount(20);
    setDrillDuration(20);
    setShowConfigModal(true);
  };

  const handleLaunchSession = () => {
    setShowConfigModal(false);
    onStartDrillSession({
      subject: drillSubject,
      topic: drillTopic || undefined,
      questionCount: drillCount,
      durationMinutes: drillDuration,
      difficulty: drillDifficulty,
      isPastPaper: drillIsPastPaper,
      universityId: drillIsPastPaper ? drillUniversityId : undefined,
    });
  };

  const filteredQuestions = questions.filter((q) => {
    if (!searchQuery.trim()) return true;
    const queryLower = searchQuery.toLowerCase();
    return (
      q.q.toLowerCase().includes(queryLower) ||
      (q.topic && q.topic.toLowerCase().includes(queryLower)) ||
      (q.chapter && q.chapter.toLowerCase().includes(queryLower))
    );
  });

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header with Title, Subtitle, and Primary Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display">
            Practice & Past Paper Vaults
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Over 17,000 national curriculum MCQs with verified step-by-step mathematical derivations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => handleOpenConfigurator('Mathematics')}
            leftIcon={<Zap className="w-4 h-4" />}
            className="shadow-lg shadow-blue-600/25"
          >
            Configure Custom Drill
          </Button>
        </div>
      </div>

      {/* Vault Tabs */}
      <div className="flex items-center gap-2 border-b border-white/8 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('configurator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'configurator'
              ? 'bg-[var(--brand)] text-white shadow-md shadow-blue-600/20'
              : 'bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Timed Drill Configurator</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'questions'
              ? 'bg-[var(--brand)] text-white shadow-md shadow-blue-600/20'
              : 'bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
          }`}
        >
          Chapter Question Banks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pastPapers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pastPapers'
              ? 'bg-[var(--brand)] text-white shadow-md shadow-blue-600/20'
              : 'bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
          }`}
        >
          University Past Paper Vaults
        </button>
      </div>

      {/* TAB 0: Timed Drill Configurator (8-col + 4-col layout) */}
      {activeTab === 'configurator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Columns: Interactive Configurator */}
          <div className="lg:col-span-8 space-y-5">
            {/* Subject Selector */}
            <Card variant="glass" className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/8 pb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  1. Select Target Subject
                </label>
                <span className="text-xs text-[var(--brand-2)] font-mono">{drillSubject}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.keys(CHAPTERS_BY_SUBJECT).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setDrillSubject(s);
                      setSelectedChapter('');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left cursor-pointer ${
                      drillSubject === s
                        ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-md shadow-blue-600/30'
                        : 'bg-white/5 text-[var(--text-muted)] border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Card>

            {/* Chapter Pills Tinted by Past Accuracy */}
            <Card variant="glass" className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/8 pb-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    2. Choose Chapter Focus
                  </label>
                  <p className="text-[11px] text-[var(--text-faint)]">Pills are tinted by your past accuracy</p>
                </div>
                {selectedChapter && (
                  <button
                    onClick={() => setSelectedChapter('')}
                    className="text-[11px] text-[var(--text-muted)] hover:text-white underline cursor-pointer"
                  >
                    Clear selection (All chapters)
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {(CHAPTERS_BY_SUBJECT[drillSubject] || []).map((ch) => {
                  const acc = getChapterAccuracy(ch);
                  const isSelected = selectedChapter === ch;

                  let tintClass = 'bg-white/5 text-[#A3B0CC] border-white/10 hover:border-white/20';
                  if (acc !== null) {
                    if (acc >= 75) tintClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                    else if (acc >= 50) tintClass = 'bg-[#2F6BFF]/10 text-[#22D3EE] border-[#2F6BFF]/30';
                    else tintClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                  }

                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setSelectedChapter(isSelected ? '' : ch)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected ? 'ring-2 ring-white border-white bg-white/20 text-white font-bold' : tintClass
                      }`}
                    >
                      <span>{ch}</span>
                      {acc !== null && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 font-bold">
                          {acc}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Questions & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card variant="glass" className="p-5 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  3. Question Count
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 30, 50].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setDrillCount(c);
                        setDrillDuration(c);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        drillCount === c
                          ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-md'
                          : 'bg-white/5 text-[var(--text-muted)] border-white/10 hover:border-white/20'
                      }`}
                    >
                      {c} MCQs
                    </button>
                  ))}
                </div>
              </Card>

              <Card variant="glass" className="p-5 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  4. Time Allowance (Minutes)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDrillDuration(mins)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        drillDuration === mins
                          ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-md'
                          : 'bg-white/5 text-[var(--text-muted)] border-white/10 hover:border-white/20'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Right 4 Columns: Sticky Briefing Card */}
          <div className="lg:col-span-4 sticky top-24">
            <Card variant="glass" className="p-6 space-y-5 border border-white/12 shadow-xl bg-gradient-to-b from-[#0F172A] to-[#0B1220]">
              <div className="flex items-center gap-2 border-b border-white/8 pb-3">
                <Target className="w-5 h-5 text-[#22D3EE]" />
                <h3 className="font-bold text-sm text-white">Drill Session Briefing</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-[var(--text-muted)]">Subject:</span>
                  <span className="font-bold text-white">{drillSubject}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-[var(--text-muted)]">Chapter:</span>
                  <span className="font-bold text-white truncate max-w-[150px]">
                    {selectedChapter || 'Full Syllabus'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-[var(--text-muted)]">Length:</span>
                  <span className="font-bold text-white">{drillCount} Questions</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-[var(--text-muted)]">Timer:</span>
                  <span className="font-bold text-amber-400">{drillDuration} Minutes (Wall-Clock)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-[var(--text-muted)]">Difficulty:</span>
                  <span className="font-bold text-[#22D3EE]">{drillDifficulty}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-[#A3B0CC] space-y-1">
                <p className="font-bold text-white flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" /> Test Constraints Active
                </p>
                <p>Distraction-free environment. Autosaved progress every 5 seconds. Detailed step-by-step math derivations on submission.</p>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  onStartDrillSession({
                    subject: drillSubject,
                    chapter: selectedChapter || undefined,
                    questionCount: drillCount,
                    durationMinutes: drillDuration,
                    difficulty: drillDifficulty,
                  });
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full shadow-lg shadow-blue-500/25 py-3 text-sm font-bold"
              >
                Start Timed Drill
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Filter Toolbar (For questions and past papers) */}
      {activeTab !== 'configurator' && (
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)] cursor-pointer"
          >
            {SUBJECT_LIST.map((s) => (
              <option key={s} value={s} className="bg-[#0E1626] text-white">
                {s}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)] cursor-pointer"
          >
            {DIFFICULTY_LIST.map((d) => (
              <option key={d} value={d} className="bg-[#0E1626] text-white">
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-faint)]" />
          <input
            type="text"
            placeholder="Search question stem or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
      </div>
      )}

      {/* TAB 1: Chapter Questions View */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {questionsError && (
            <ErrorState
              title="Could not load question bank"
              error={questionsError.message}
              path={questionsError.path}
              onRetry={() => fetchQuestions(false)}
            />
          )}

          {isQuestionsLoading && questions.length === 0 && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} variant="rectangular" height={90} className="rounded-2xl" />
              ))}
            </div>
          )}

          {!isQuestionsLoading && filteredQuestions.length === 0 && !questionsError && (
            <EmptyState
              title="No questions match this filter"
              description="Try adjusting your subject or difficulty filters to view more practice questions."
              action={{
                label: 'Reset Filters',
                onClick: () => {
                  setSelectedSubject('All Subjects');
                  setSelectedDifficulty('All Difficulties');
                  setSearchQuery('');
                },
              }}
            />
          )}

          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => (
              <Card key={q.id || idx} variant="glass" className="p-4 sm:p-5 space-y-3 text-left">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="student" size="sm" className="font-mono text-[10px]">
                      {q.subject}
                    </Badge>
                    {q.topic && (
                      <span className="text-[11px] text-[var(--text-muted)] font-mono">
                        {q.topic}
                      </span>
                    )}
                  </div>
                  {q.difficulty && (
                    <span className="text-[10px] uppercase font-bold text-[var(--text-faint)] font-mono">
                      {q.difficulty}
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-white leading-relaxed">
                  {q.q}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-xs text-[var(--text-muted)] flex items-center gap-2"
                    >
                      <span className="w-5 h-5 rounded-md bg-white/10 font-bold font-mono text-[11px] text-white flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="truncate">{opt}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Load More */}
          {hasMoreQuestions && !isQuestionsLoading && (
            <div className="pt-4 text-center">
              <Button
                variant="secondary"
                size="md"
                onClick={() => fetchQuestions(true)}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="text-xs"
              >
                Load Next 25 Questions
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: University Past Paper Vaults (Sheets) */}
      {activeTab === 'pastPapers' && (
        <div className="space-y-4">
          {sheetsError && (
            <ErrorState
              title="Could not load past paper vaults"
              error={sheetsError.message}
              path={sheetsError.path}
              onRetry={fetchSheets}
            />
          )}

          {isSheetsLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} variant="rectangular" height={160} className="rounded-3xl" />
              ))}
            </div>
          )}

          {!isSheetsLoading && sheets.length === 0 && !sheetsError && (
            <EmptyState
              title="No past paper sheets in database"
              description="University papers can also be launched directly using the custom drill configurator."
              action={{
                label: 'Launch University Drill',
                onClick: () => handleOpenConfigurator('Mathematics'),
              }}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sheets.map((sheet) => (
              <Card
                key={sheet.id}
                variant="glass"
                className="p-5 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all cursor-pointer group"
                onClick={() => {
                  setDrillSubject(sheet.subject);
                  setDrillCount(sheet.questionCount || 25);
                  setDrillDuration(sheet.durationMinutes || 30);
                  setShowConfigModal(true);
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="student" size="sm">
                      {sheet.subject}
                    </Badge>
                    <span className="text-xs text-[var(--text-faint)] font-mono">
                      {sheet.questionCount} MCQs
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[var(--brand-2)] transition-colors leading-snug">
                    {sheet.title}
                  </h4>
                  {sheet.chapter && (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                      {sheet.chapter}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-white/8 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[var(--text-faint)]">
                    <Clock className="w-3.5 h-3.5" />
                    {sheet.durationMinutes} min
                  </span>
                  <span className="font-bold text-[var(--brand-2)] flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    <span>Start Test</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Drill Configurator Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Configure Timed Drill Session"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-left">
          {/* Subject Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)]">Subject</label>
            <select
              value={drillSubject}
              onChange={(e) => setDrillSubject(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            >
              {SUBJECT_LIST.filter((s) => s !== 'All Subjects').map((s) => (
                <option key={s} value={s} className="bg-[#0E1626] text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Question Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)]">Number of Questions</label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 30, 50].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    setDrillCount(count);
                    setDrillDuration(count);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    drillCount === count
                      ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-md shadow-blue-600/30'
                      : 'bg-white/5 text-[var(--text-muted)] border-white/10 hover:border-white/20'
                  }`}
                >
                  {count} MCQs
                </button>
              ))}
            </div>
          </div>

          {/* Duration in Minutes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)]">Time Allowance (Minutes)</label>
            <input
              type="number"
              min={5}
              max={120}
              value={drillDuration}
              onChange={(e) => setDrillDuration(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)]">Difficulty Level</label>
            <select
              value={drillDifficulty}
              onChange={(e) => setDrillDifficulty(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            >
              {DIFFICULTY_LIST.filter((d) => d !== 'All Difficulties').map((d) => (
                <option key={d} value={d} className="bg-[#0E1626] text-white">
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-white/8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfigModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleLaunchSession}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start Drill Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
