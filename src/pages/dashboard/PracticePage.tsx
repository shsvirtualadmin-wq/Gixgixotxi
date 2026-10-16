import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Rocket } from 'lucide-react';

const UNIVERSITIES = ['Any', 'FAST-NUCES', 'NUST NET', 'GIKI', 'LUMS', 'NED', 'UET', 'COMSATS', 'PIEAS', 'MDCAT', 'ECAT'];
const SUBJECTS = ['Any', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English', 'Analytical/IQ'];
const DIFFICULTIES = ['Any', 'Easy', 'Medium', 'Hard'];
const Q_COUNTS = [10, 20, 30, 50];
const DURATIONS_MIN: Record<number, number> = { 10: 10, 20: 20, 30: 30, 50: 50 };

export function PracticePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [university, setUniversity] = useState('Any');
  const [subject, setSubject] = useState('Any');
  const [difficulty, setDifficulty] = useState('Any');
  const [qCount, setQCount] = useState(20);
  const [timed, setTimed] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<{ code?: string; message: string } | null>(null);

  const handleLaunch = async () => {
    if (!user) return;
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
        difficulty: difficulty === 'Any' ? null : difficulty,
        totalQuestions: qCount,
        timed,
        durationSeconds,
        endsAt,
        status: 'preparing',
        createdAt: serverTimestamp(),
      });
      navigate(`/test/${ref.id}`);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setLaunchError({ code: e.code, message: e.message ?? 'Failed to create attempt' });
      setLaunching(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1
        className="font-display"
        style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.03em' }}
      >
        Practice Vault
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
        Configure your drill and launch.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Configurator */}
        <div className="glass" style={{ borderRadius: 'var(--r-card)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Section label="University">
            <ChipGroup options={UNIVERSITIES} value={university} onChange={setUniversity} />
          </Section>
          <Section label="Subject">
            <ChipGroup options={SUBJECTS} value={subject} onChange={setSubject} />
          </Section>
          <Section label="Difficulty">
            <ChipGroup options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />
          </Section>
          <Section label="Questions">
            <ChipGroup options={Q_COUNTS.map(String)} value={String(qCount)} onChange={(v) => setQCount(Number(v))} />
          </Section>
          <Section label="Mode">
            <div style={{ display: 'flex', gap: 8 }}>
              {['Timed', 'Untimed'].map((m) => {
                const isTimed = m === 'Timed';
                const active = timed === isTimed;
                return (
                  <button
                    key={m}
                    onClick={() => setTimed(isTimed)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--r-pill)',
                      border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
                      background: active ? 'rgba(47,107,255,0.15)' : 'transparent',
                      color: active ? 'var(--brand)' : 'var(--text-muted)',
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 160ms',
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Briefing card */}
        <div
          className="glass glass-animated-border"
          style={{
            borderRadius: 'var(--r-card)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'sticky',
            top: '80px',
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Session Briefing
          </p>
          <BriefRow label="University" value={university} />
          <BriefRow label="Subject" value={subject} />
          <BriefRow label="Difficulty" value={difficulty} />
          <BriefRow label="Questions" value={String(qCount)} />
          <BriefRow label="Mode" value={timed ? `Timed · ${DURATIONS_MIN[qCount]} min` : 'Untimed'} />

          {launchError && (
            <ErrorState
              title="Launch failed"
              error={launchError}
              onRetry={handleLaunch}
            />
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={launching}
            onClick={handleLaunch}
            style={{ marginTop: 8, gap: 8 }}
          >
            <Rocket size={16} />
            Launch Drill Now
          </Button>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center' }}>
            /test/:id route — Phase 4
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p style={{
        fontSize: 12,
        color: 'var(--text-faint)',
        fontWeight: 600,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function ChipGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--r-pill)',
              border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
              background: active ? 'rgba(47,107,255,0.15)' : 'transparent',
              color: active ? 'var(--brand)' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 160ms',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function BriefRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{value}</span>
    </div>
  );
}
