import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Zap, BookOpen, Target, Clock, ArrowRight } from 'lucide-react';
import { getPKTDateKey } from '@/hooks/usePKTDate';

const UNIVERSITIES = ['Any', 'FAST-NUCES', 'NUST NET', 'GIKI', 'LUMS', 'NED', 'MDCAT', 'ECAT'];

const CHAPTERS_LIST = [
  { subject: 'Mathematics', name: 'Integration by Parts', acc: 48, dots: 5 },
  { subject: 'Mathematics', name: 'Calculus & Derivatives', acc: 62, dots: 6 },
  { subject: 'Mathematics', name: 'Conic Sections & Hyperbola', acc: 42, dots: 4 },
  { subject: 'Physics', name: 'Electromagnetism & Induction', acc: 54, dots: 5 },
  { subject: 'Physics', name: 'Work, Energy & Power', acc: 70, dots: 7 },
  { subject: 'Physics', name: 'Nuclear Physics', acc: 50, dots: 5 },
  { subject: 'Chemistry', name: 'Aldehydes & Ketones', acc: 38, dots: 4 },
  { subject: 'Chemistry', name: 'Chemical Equilibrium', acc: 65, dots: 6 },
  { subject: 'Computer Science', name: 'Data Structures & Trees', acc: 58, dots: 6 },
  { subject: 'Computer Science', name: 'Digital Logic & Gates', acc: 72, dots: 7 },
  { subject: 'English', name: 'Sentence Correction & Idioms', acc: 68, dots: 7 },
  { subject: 'Analytical/IQ', name: 'Analytical Reasoning Scenarios', acc: 55, dots: 5 },
];

export function PracticePage() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.uid ?? null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedChapter, setSelectedChapter] = useState<string>(
    searchParams.get('chapter') || 'Integration by Parts'
  );
  const [selectedUniversity, setSelectedUniversity] = useState('FAST-NUCES');
  const [launching, setLaunching] = useState(false);
  const [todayAttempts, setTodayAttempts] = useState(0);

  const isPro = profile?.plan === 'pro' || profile?.isPremium;
  const freeDailyLimit = 10;
  const questionsLeft = isPro ? 'Unlimited' : Math.max(0, freeDailyLimit - todayAttempts);

  // PKT midnight reset timer countdown
  const [timeToMidnight, setTimeToMidnight] = useState('');

  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      // UTC + 5 hours for PKT
      const pktOffset = 5 * 60;
      const localOffset = now.getTimezoneOffset();
      const pktNow = new Date(now.getTime() + (pktOffset + localOffset) * 60 * 1000);

      const midnight = new Date(pktNow);
      midnight.setHours(24, 0, 0, 0);

      const diffMs = midnight.getTime() - pktNow.getTime();
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeToMidnight(
        `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
      );
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch today's usage from Firestore
  useEffect(() => {
    if (!user) return;
    const dateKey = getPKTDateKey();
    getDoc(doc(db, 'users', user.uid, 'usage', dateKey))
      .then((snap) => {
        if (snap.exists()) {
          setTodayAttempts(Number(snap.data()?.practiceAttempts ?? 0));
        }
      })
      .catch((err) => {
        console.warn('Practice usage fetch:', err);
      });
  }, [user]);

  const filteredChapters = useMemo(() => {
    if (selectedSubject === 'All') return CHAPTERS_LIST;
    return CHAPTERS_LIST.filter(c => c.subject === selectedSubject);
  }, [selectedSubject]);

  const launchTest = async (type: 'sprint' | 'full' | 'drill', customChapter?: string) => {
    if (!user || launching) return;
    setLaunching(true);

    let count = 10;
    let duration = 600; // 10 mins
    let title = '10-Minute Sprint';

    if (type === 'full') {
      count = 30;
      duration = 1800; // 30 mins
      title = `${selectedUniversity} Full Mock`;
    } else if (type === 'drill') {
      count = 20;
      duration = 1200; // 20 mins
      title = `${customChapter || selectedChapter} Drill`;
    }

    try {
      const attemptPayload = {
        userId: user.uid,
        uid: user.uid,
        status: 'preparing',
        mode: type,
        title,
        university: selectedUniversity === 'Any' ? 'FAST-NUCES' : selectedUniversity,
        subject: customChapter ? 'Mathematics' : 'General',
        chapter: customChapter || selectedChapter,
        totalQuestions: count,
        durationSeconds: duration,
        timed: true,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'attempts'), attemptPayload);
      navigate(`/test/${docRef.id}`);
    } catch (err) {
      console.error('Failed to launch test:', err);
      setLaunching(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] mx-auto">
      {/* ── Header: Questions left in Dot font & PKT Midnight reset countdown ── */}
      <Card className="p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge color="muted">Daily Practice Hub</Badge>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] mt-2"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Entrance Drill Engine
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
              Timed MCQs formatted with official university negative marking schemes.
            </p>
          </div>

          <div className="flex items-center gap-6 self-start sm:self-auto border-t sm:border-t-0 sm:border-l border-[var(--border)] pt-4 sm:pt-0 sm:pl-6 shrink-0">
            {/* Questions left today in Doto font */}
            <div>
              <div className="text-[10px] uppercase font-semibold text-[var(--muted)] tracking-wider">
                Questions Left
              </div>
              <div className="font-doto text-2xl sm:text-3xl font-bold text-[#FFFFFF] mt-0.5">
                {questionsLeft}
              </div>
            </div>

            {/* PKT Midnight Reset Countdown in Doto font */}
            <div>
              <div className="text-[10px] uppercase font-semibold text-[var(--muted)] tracking-wider flex items-center gap-1">
                <Clock size={12} className="text-[var(--red)]" />
                <span>PKT Midnight Reset</span>
              </div>
              <div className="font-doto text-sm sm:text-base font-bold text-[var(--text)] mt-1">
                {timeToMidnight || 'Calculating...'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Three Big Start Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: 10-Minute Sprint */}
        <Card className="justify-between p-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[var(--border)] text-[#FFFFFF] flex items-center justify-center shrink-0">
              <Zap size={22} className="text-[var(--red)]" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                10-Minute Sprint
              </h2>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                10 rapid-fire questions covering mixed subjects. Perfect for quick speed drills between classes.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-doto">
              <span>10 MCQs</span>
              <span>·</span>
              <span>10 Minutes</span>
              <span>·</span>
              <span>Negative 0.25</span>
            </div>
          </div>

          <button
            onClick={() => launchTest('sprint')}
            disabled={launching}
            className="btn-red w-full mt-4 cursor-pointer disabled:opacity-50"
            style={{ height: '48px' }}
          >
            <span>Start Sprint</span>
            <ArrowRight size={16} />
          </button>
        </Card>

        {/* Card 2: Full Past Paper */}
        <Card className="justify-between p-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[var(--border)] text-[#FFFFFF] flex items-center justify-center shrink-0">
              <BookOpen size={22} className="text-[#FFFFFF]" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Full Past Paper
              </h2>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                Authentic 30-question university format. Calibrated against actual exam timing and penalty patterns.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="w-full text-xs rounded-xl bg-[#0A0A0A] border border-[var(--border)] px-3 py-2 text-[var(--text)] focus:border-[var(--red)]"
              >
                {UNIVERSITIES.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => launchTest('full')}
            disabled={launching}
            className="btn-red w-full mt-4 cursor-pointer disabled:opacity-50"
            style={{ height: '48px' }}
          >
            <span>Start Past Paper</span>
            <ArrowRight size={16} />
          </button>
        </Card>

        {/* Card 3: Weak-Chapter Drill */}
        <Card className="justify-between p-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[var(--border)] text-[#FFFFFF] flex items-center justify-center shrink-0">
              <Target size={22} className="text-[var(--red)]" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-[var(--text)]"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                Weak-Chapter Drill
              </h2>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                20 questions focused directly on your lowest scoring chapters to turn weak areas into guarantees.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-doto">
              <span>20 MCQs</span>
              <span>·</span>
              <span>20 Minutes</span>
              <span>·</span>
              <span>Target Focus</span>
            </div>
          </div>

          <button
            onClick={() => launchTest('drill', selectedChapter)}
            disabled={launching}
            className="btn-red w-full mt-4 cursor-pointer disabled:opacity-50"
            style={{ height: '48px' }}
          >
            <span>Start Chapter Drill</span>
            <ArrowRight size={16} />
          </button>
        </Card>
      </div>

      {/* ── Below: Chapter Chips with Accuracy Dot Rows and Red Start Button ── */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div>
            <h2
              className="text-lg font-bold text-[var(--text)] tracking-tight"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Chapter Bank &amp; Accuracy Diagnostic
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Select a chapter chip to drill targeted past paper questions.
            </p>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['All', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science'].map(subj => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  selectedSubject === subj
                    ? 'bg-[#FFFFFF] text-[#000000]'
                    : 'bg-[#1A1A1A] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
                }`}
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Chapter Chips Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-4">
          {filteredChapters.map(c => {
            const isSelected = selectedChapter === c.name;
            return (
              <div
                key={c.name}
                onClick={() => setSelectedChapter(c.name)}
                className={`p-3.5 rounded-2xl border transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-[#1A1A1A] border-[var(--red)]'
                    : 'bg-[#0A0A0A] border-[var(--border)] hover:bg-[#141414]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--text)] truncate">
                    {c.name}
                  </span>
                  <span className="font-doto text-xs font-bold text-[var(--red)]">
                    {c.acc}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                  <span>{c.subject}</span>
                  {/* Accuracy dots */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          i < c.dots ? 'bg-[var(--red)]' : 'bg-[#2A2A2A]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Chapter Action Row with red Start button */}
        <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[var(--muted)]">
            Selected Chapter:{' '}
            <strong className="text-[var(--text)] font-semibold">{selectedChapter}</strong>
          </div>

          <button
            onClick={() => launchTest('drill', selectedChapter)}
            disabled={launching}
            className="btn-red w-full sm:w-auto px-6 cursor-pointer disabled:opacity-50"
            style={{ height: '48px' }}
          >
            <span>Start &ldquo;{selectedChapter}&rdquo; Drill</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </Card>
    </div>
  );
}

export default PracticePage;
