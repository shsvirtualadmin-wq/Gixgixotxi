import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Target,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, logFirestoreError, StoredTestAttempt } from '../../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';

interface ChapterMapViewProps {
  onStartChapterDrill: (subject: string, chapter: string) => void;
}

interface ChapterData {
  title: string;
  topicCount: number;
  weightPct: number;
  highYield?: boolean;
}

const SYLLABUS_MAP: Record<string, ChapterData[]> = {
  Mathematics: [
    { title: 'Complex Numbers & Number Systems', topicCount: 14, weightPct: 8 },
    { title: 'Matrices and Determinants', topicCount: 18, weightPct: 10, highYield: true },
    { title: 'Quadratic Equations & Polynomials', topicCount: 16, weightPct: 8 },
    { title: 'Sequences, Series & Mathematical Induction', topicCount: 20, weightPct: 10 },
    { title: 'Trigonometric Identities & Functions', topicCount: 24, weightPct: 12, highYield: true },
    { title: 'Limits, Continuity & Differentiation', topicCount: 28, weightPct: 16, highYield: true },
    { title: 'Integration & Area Under Curves', topicCount: 26, weightPct: 16, highYield: true },
    { title: 'Conics (Circles, Parabola, Ellipse, Hyperbola)', topicCount: 22, weightPct: 12, highYield: true },
    { title: 'Vectors & 3D Analytical Geometry', topicCount: 18, weightPct: 8 },
  ],
  Physics: [
    { title: 'Vectors & Equilibrium', topicCount: 16, weightPct: 10, highYield: true },
    { title: 'Motion and Force (Newtonian Mechanics)', topicCount: 22, weightPct: 14, highYield: true },
    { title: 'Work, Energy and Power', topicCount: 14, weightPct: 8 },
    { title: 'Circular Motion & Rotational Dynamics', topicCount: 18, weightPct: 10, highYield: true },
    { title: 'Fluids & Wave Motion', topicCount: 20, weightPct: 10 },
    { title: 'Thermodynamics & Heat Engines', topicCount: 16, weightPct: 8 },
    { title: 'Electrostatics & Coulomb Law', topicCount: 24, weightPct: 14, highYield: true },
    { title: 'Current Electricity & DC Circuits', topicCount: 20, weightPct: 12, highYield: true },
    { title: 'Electromagnetism & Induction', topicCount: 22, weightPct: 14, highYield: true },
  ],
  Chemistry: [
    { title: 'Stoichiometry & Atomic Structure', topicCount: 18, weightPct: 10 },
    { title: 'Chemical Bonding & Hybridization', topicCount: 22, weightPct: 14, highYield: true },
    { title: 'Chemical Equilibrium & Le Chatelier', topicCount: 16, weightPct: 10, highYield: true },
    { title: 'Reaction Kinetics & Catalysis', topicCount: 14, weightPct: 8 },
    { title: 'Electrochemistry & Redox Reactions', topicCount: 18, weightPct: 12 },
    { title: 'Hydrocarbons (Alkanes, Alkenes, Alkynes)', topicCount: 24, weightPct: 16, highYield: true },
    { title: 'Alkyl Halides, Alcohols & Phenols', topicCount: 20, weightPct: 14, highYield: true },
    { title: 'Aldehydes, Ketones & Carboxylic Acids', topicCount: 22, weightPct: 16, highYield: true },
  ],
  'Computer Science': [
    { title: 'Number Systems & Boolean Logic', topicCount: 16, weightPct: 12 },
    { title: 'Data Structures & Dynamic Arrays', topicCount: 22, weightPct: 20, highYield: true },
    { title: 'Object Oriented Programming (OOP)', topicCount: 24, weightPct: 22, highYield: true },
    { title: 'Algorithms, Searching & Sorting', topicCount: 20, weightPct: 18, highYield: true },
    { title: 'Database Systems & SQL Normalization', topicCount: 18, weightPct: 14 },
    { title: 'Computer Networks & TCP/IP Model', topicCount: 16, weightPct: 14 },
  ],
  Biology: [
    { title: 'Biological Molecules & Enzymes', topicCount: 24, weightPct: 14, highYield: true },
    { title: 'Cell Structure and Function', topicCount: 22, weightPct: 12 },
    { title: 'Bioenergetics & Photosynthesis', topicCount: 26, weightPct: 16, highYield: true },
    { title: 'Human Physiology & Circulation', topicCount: 30, weightPct: 20, highYield: true },
    { title: 'Nervous & Chemical Coordination', topicCount: 24, weightPct: 14, highYield: true },
    { title: 'Genetics, DNA & Molecular Biology', topicCount: 28, weightPct: 24, highYield: true },
  ],
};

export const ChapterMapView: React.FC<ChapterMapViewProps> = ({
  onStartChapterDrill,
}) => {
  const { user, profile } = useAuth();

  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [attempts, setAttempts] = useState<StoredTestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorInfo, setErrorInfo] = useState<{ message: string; path?: string } | null>(null);

  const fetchAttempts = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    setErrorInfo(null);
    const path = `users/${user.uid}/testAttempts`;

    try {
      const q = query(
        collection(db, 'users', user.uid, 'testAttempts'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const list: StoredTestAttempt[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setAttempts(list);
    } catch (err: any) {
      logFirestoreError(path, err, 'chapter_map_fetch_attempts');
      setErrorInfo({
        message: err?.message || 'Unable to compute chapter mastery from your test attempts.',
        path,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, [user?.uid]);

  // Compute chapter mastery % from student's real attempts
  const chapterMastery = useMemo(() => {
    const map: Record<string, { total: number; correct: number; percent: number }> = {};

    attempts.forEach((att) => {
      if (att.topicBreakdown) {
        Object.entries(att.topicBreakdown).forEach(([topicName, stats]) => {
          if (!map[topicName]) {
            map[topicName] = { total: 0, correct: 0, percent: 0 };
          }
          map[topicName].total += stats.total;
          map[topicName].correct += stats.correct;
        });
      }
    });

    Object.keys(map).forEach((k) => {
      if (map[k].total > 0) {
        map[k].percent = Math.round((map[k].correct / map[k].total) * 100);
      }
    });

    return map;
  }, [attempts]);

  const currentChapters = SYLLABUS_MAP[selectedSubject] || SYLLABUS_MAP.Mathematics;

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display">
            Syllabus Chapter Map
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Real syllabus blueprint with chapter weighting and real mastery tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => onStartChapterDrill(selectedSubject, currentChapters[0].title)}
            leftIcon={<Target className="w-4 h-4" />}
          >
            Start Subject Sprint
          </Button>
        </div>
      </div>

      {errorInfo && (
        <ErrorState
          title="Could not load chapter mastery"
          error={errorInfo.message}
          path={errorInfo.path}
          onRetry={fetchAttempts}
        />
      )}

      {/* Subject Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/8 pb-3">
        {Object.keys(SYLLABUS_MAP).map((sub) => (
          <button
            key={sub}
            type="button"
            onClick={() => setSelectedSubject(sub)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedSubject === sub
                ? 'bg-[var(--brand)] text-white shadow-md shadow-blue-600/30'
                : 'bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} variant="rectangular" height={140} className="rounded-3xl" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentChapters.map((ch, idx) => {
            const mastery = chapterMastery[ch.title];
            const hasData = Boolean(mastery && mastery.total > 0);
            const scorePct = hasData ? mastery.percent : 0;

            return (
              <Card
                key={ch.title}
                variant="glass"
                className="p-5 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all text-left"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[var(--text-faint)] font-bold">
                      Chapter {idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {ch.highYield && (
                        <Badge variant="student" size="sm" className="font-mono text-[10px]">
                          High Yield ({ch.weightPct}%)
                        </Badge>
                      )}
                      <span className="text-[11px] text-[var(--text-faint)] font-mono">
                        {ch.topicCount} SLO Topics
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">
                    {ch.title}
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Mastery Level</span>
                    <span className="font-mono font-bold text-white">
                      {hasData ? `${scorePct}%` : 'Not yet attempted'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/8 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        hasData
                          ? scorePct >= 70
                            ? 'bg-[#34D399]'
                            : scorePct >= 40
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                          : 'bg-white/10'
                      }`}
                      style={{ width: `${hasData ? scorePct : 0}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/8 flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-faint)]">
                    Exam Weight: ~{ch.weightPct}% of paper
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onStartChapterDrill(selectedSubject, ch.title)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Drill Chapter
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
