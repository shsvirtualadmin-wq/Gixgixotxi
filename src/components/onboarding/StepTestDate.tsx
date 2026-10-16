import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';

const TRACKS = [
  { id: 'pre-engineering', label: 'Pre-Engineering', sub: 'Physics, Maths, Chemistry' },
  { id: 'ics', label: 'ICS', sub: 'CS, Maths, Physics/Stats' },
  { id: 'pre-medical', label: 'Pre-Medical', sub: 'Biology, Chemistry, Physics' },
  { id: 'commerce', label: 'Commerce', sub: 'Accounts, Economics, Business' },
];

interface StepTestDateProps {
  testDate: string;
  academicTrack: string;
  onTestDateChange: (v: string) => void;
  onTrackChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepTestDate({
  testDate,
  academicTrack,
  onTestDateChange,
  onTrackChange,
  onNext,
  onBack,
}: StepTestDateProps) {
  const canContinue = !!(testDate && academicTrack);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>
          When is your <span className="text-gradient">test date?</span>
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>We'll build your countdown timer and study schedule.</p>
      </div>

      {/* Test date */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Target Test Date</label>
        <input
          type="date"
          value={testDate}
          onChange={(e) => onTestDateChange(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          style={{
            width: '100%', height: 48, padding: '0 14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-input)',
            color: 'var(--text)', fontSize: 15,
            fontFamily: 'inherit', outline: 'none',
            colorScheme: 'dark',
          }}
        />
      </div>

      {/* Academic track */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>Academic Track</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TRACKS.map((t) => {
            const selected = academicTrack === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTrackChange(t.id)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--r-card)',
                  border: `2px solid ${selected ? 'var(--brand)' : 'var(--border)'}`,
                  background: selected ? 'rgba(47,107,255,0.1)' : 'var(--surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  transition: 'all 200ms var(--ease-out)',
                  backdropFilter: 'blur(20px)',
                  textAlign: 'left',
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: selected ? 'var(--brand)' : 'var(--text)', marginBottom: 2 }}>{t.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{t.sub}</p>
                </div>
                {selected && <Check size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" size="lg" onClick={onBack} style={{ flex: '0 0 auto' }}>Back</Button>
        <Button variant="primary" size="lg" fullWidth disabled={!canContinue} onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}
