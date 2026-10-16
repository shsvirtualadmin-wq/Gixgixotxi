import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { usePKTDate } from '@/hooks/usePKTDate';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Zap, Rocket, AlertCircle } from 'lucide-react';

const UNIVERSITIES = ['Any', 'FAST-NUCES', 'NUST NET', 'GIKI', 'LUMS', 'NED', 'UET', 'MDCAT', 'ECAT'];

const CHAPTERS_BY_SUBJECT: Record<string, string[]> = {
  Mathematics: [
    'All Chapters',
    'Calculus & Differentiation',
    'Integration & Applications',
    'Vectors & 3D Geometry',
    'Conic Sections (Parabola, Ellipse, Hyperbola)',
    'Matrices & Determinants',
    'Trigonometry & Inverse Functions',
  ],
  Physics: [
    'All Chapters',
    'Mechanics & Kinematics',
    'Work, Energy & Power',
    'Electromagnetism & Induction',
    'Alternating Current (AC)',
    'Oscillations & Waves',
    'Atomic & Nuclear Physics',
  ],
  Chemistry: [
    'All Chapters',
    'Chemical Equilibrium & Le Chatelier',
    'Organic Chemistry (Aldehydes, Ketones, Carboxyls)',
    'Electrochemistry & Galvanic Cells',
    'Atomic Structure & Periodicity',
    'Thermochemistry & Hess Law',
  ],
  'Computer Science': [
    'All Chapters',
    'Data Structures & Algorithms',
    'Object-Oriented Programming (OOP)',
    'Digital Logic & Number Systems',
    'Operating Systems & Memory',
  ],
  English: [
    'All Chapters',
    'Sentence Completion & Context Clues',
    'Analogy & Relationships',
    'Reading Comprehension & Critical Reasoning',
  ],
  'Analytical/IQ': [
    'All Chapters',
    'Analytical Reasoning & Scenarios',
    'Pattern Recognition & Number Series',
    'Logical Deductions & Syllogisms',
  ],
};

const SUBJECTS = Object.keys(CHAPTERS_BY_SUBJECT);
const Q_COUNTS = [10, 20, 30, 50];
const DURATIONS_MIN: Record<number, number> = { 10: 10, 20: 20, 30: 30, 50: 50 };
const FREE_DAILY_LIMIT = 10;

export function PracticePage() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.uid ?? null);
  const pktDate = usePKTDate();
  const navigate = useNavigate();

  const [university, setUniversity] = useState('Any');
  const [subject, setSubject] = useState('Mathematics');
  const [chapter, setChapter] = useState('All Chapters');
  const [difficulty] = useState('Medium');
  const [qCount, setQCount] = useState(20);
  const [timed, setTimed] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const [todayAttempts, setTodayAttempts] = useState(0);

  const isPro = profile?.plan === 'pro' || profile?.isPremium;
  const isCrew = profile?.role === 'crew' || profile?.isCrewMember;

  // Load today's usage from users/{uid}/usage/{pktDate}
  useEffect(() => {
    if (!user) return;
    async function checkUsage() {
      try {
        const snap = await getDoc(doc(db, 'users', user!.uid, 'usage', pktDate));
        if (snap.exists()) {
          setTodayAttempts(Number(snap.data()?.practiceAttempts ?? 0));
        }
      } catch (err) {
        console.warn('[PracticePage] Usage read warning:', err);
      }
    }
    checkUsage();
  }, [user, pktDate]);

  const hasExceededDailyLimit = !isPro && !isCrew && todayAttempts >= FREE_DAILY_LIMIT;

  const handleLaunch = async () => {
    if (!user) return;
    if (hasExceededDailyLimit) {
      navigate('/dashboard/plans');
      return;
    }

    setLaunching(true);
    setLaunchError(null);
    try {
      const durationSeconds = timed ? DURATIONS_MIN[qCount] * 60 : 0;
      const now = new Date();
      const endsAt = timed ? new Date(now.getTime() + durationSeconds * 1000) : null;

      const ref = await addDoc(collection(db, 'attempts'), {
        userId: user.uid,
        uid: user.uid,
        university: university === 'Any' ? null : university,
        subject: subject === 'Any' ? null : subject,
        chapter: chapter === 'All Chapters' ? null : chapter,
        difficulty,
        totalQuestions: qCount,
        timed,
        durationSeconds,
        endsAt,
        status: 'preparing',
        createdAt: serverTimestamp(),
      });
      navigate(`/test/${ref.id}`);
    } catch (err: unknown) {
      console.error('[PracticePage] Launch error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to start test session';
      setLaunchError(msg);
      setLaunching(false);
    }
  };

  const availableChapters = CHAPTERS_BY_SUBJECT[subject] || ['All Chapters'];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Practice Vault & Custom Drills
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Configure university syllabus target, specific chapters, and timed conditions.
        </p>
      </div>

      {/* Daily Limit Warning if reached */}
      {hasExceededDailyLimit && (
        <div
          style={{
            padding: '18px 24px',
            borderRadius: 'var(--r-card)',
            background: 'var(--surface)',
            border: '1px solid #D71921',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={24} className="text-[#D71921] flex-shrink-0" />
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                Daily Free Limit Reached ({FREE_DAILY_LIMIT}/{FREE_DAILY_LIMIT} Tests)
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Free tier resets tomorrow at 00:00 PKT. Upgrade to Boardly Pro for unlimited MCQs.
              </p>
            </div>
          </div>
          <Button variant="primary" size="md" onClick={() => navigate('/dashboard/plans')}>
            <Zap size={14} /> Upgrade to Pro — PKR 199/mo
          </Button>
        </div>
      )}

      {/* Configurator Card */}
      <GlassCard style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* University Selector */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', display: 'block', marginBottom: 10 }}>
            Target Syllabus Pattern
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {UNIVERSITIES.map((uni) => (
              <button
                key={uni}
                type="button"
                onClick={() => setUniversity(uni)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 13,
                  fontWeight: university === uni ? 700 : 500,
                  cursor: 'pointer',
                  border: university === uni ? '1px solid #D71921' : '1px solid var(--border)',
                  background: university === uni ? 'rgba(215, 25, 33, 0.12)' : 'var(--surface)',
                  color: university === uni ? '#D71921' : 'var(--text)',
                  transition: 'all 160ms',
                }}
              >
                {uni}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Selector */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', display: 'block', marginBottom: 10 }}>
            Subject
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUBJECTS.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  setSubject(sub);
                  setChapter('All Chapters');
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 13,
                  fontWeight: subject === sub ? 700 : 500,
                  cursor: 'pointer',
                  border: subject === sub ? '1px solid #D71921' : '1px solid var(--border)',
                  background: subject === sub ? 'rgba(215, 25, 33, 0.12)' : 'var(--surface)',
                  color: subject === sub ? '#D71921' : 'var(--text)',
                  transition: 'all 160ms',
                }}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Chapter Selector */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', display: 'block', marginBottom: 10 }}>
            Specific Chapter Drill
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {availableChapters.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChapter(ch)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--r-input)',
                  fontSize: 12,
                  fontWeight: chapter === ch ? 700 : 500,
                  cursor: 'pointer',
                  border: chapter === ch ? '1px solid #D71921' : '1px solid var(--border)',
                  background: chapter === ch ? 'rgba(215, 25, 33, 0.12)' : 'var(--surface)',
                  color: chapter === ch ? '#D71921' : 'var(--text)',
                  transition: 'all 160ms',
                }}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Question Count & Difficulty Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {/* Question Count */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', display: 'block', marginBottom: 10 }}>
              Question Count
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {Q_COUNTS.map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQCount(cnt)}
                  className="font-display tabular-nums"
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 'var(--r-input)',
                    fontSize: 14,
                    fontWeight: qCount === cnt ? 800 : 600,
                    cursor: 'pointer',
                    border: qCount === cnt ? '1px solid #D71921' : '1px solid var(--border)',
                    background: qCount === cnt ? '#D71921' : 'var(--surface)',
                    color: qCount === cnt ? '#FFFFFF' : 'var(--text)',
                    transition: 'all 160ms',
                  }}
                >
                  {cnt} Qs
                </button>
              ))}
            </div>
          </div>

          {/* Timed vs Untimed */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)', display: 'block', marginBottom: 10 }}>
              Exam Timer Mode
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: true, label: `Timed (${DURATIONS_MIN[qCount]}m)` },
                { id: false, label: 'Untimed' },
              ].map((m) => (
                <button
                  key={String(m.id)}
                  type="button"
                  onClick={() => setTimed(m.id)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 'var(--r-input)',
                    fontSize: 13,
                    fontWeight: timed === m.id ? 700 : 500,
                    cursor: 'pointer',
                    border: timed === m.id ? '1px solid #D71921' : '1px solid var(--border)',
                    background: timed === m.id ? 'rgba(215, 25, 33, 0.12)' : 'var(--surface)',
                    color: timed === m.id ? '#D71921' : 'var(--text)',
                    transition: 'all 160ms',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {launchError && (
          <p style={{ color: '#D71921', fontSize: 13 }}>
            {launchError}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            {!isPro && !isCrew ? `Today's Usage: ${todayAttempts} / ${FREE_DAILY_LIMIT} free tests` : 'Unlimited Pro Tests'}
          </span>

          <Button
            variant="primary"
            size="lg"
            onClick={handleLaunch}
            loading={launching}
            disabled={hasExceededDailyLimit}
          >
            <Rocket size={16} /> Launch Drill
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

export default PracticePage;
