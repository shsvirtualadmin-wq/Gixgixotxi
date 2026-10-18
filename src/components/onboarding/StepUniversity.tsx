import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';
import { TARGET_UNIVERSITY_CRITERIA } from '@/constants/universityCriteria';

interface StepUniversityProps {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}

export function StepUniversity({ value, onChange, onNext }: StepUniversityProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>
          What's your <span className="text-gradient">target university?</span>
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>We'll calibrate your questions, pacing, and negative marking rules.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 10, maxHeight: '52vh', overflowY: 'auto', paddingRight: 4 }}>
        {TARGET_UNIVERSITY_CRITERIA.map((u) => {
          const selected = value === u.id || value === u.name;
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => onChange(u.name)}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--r-card)',
                border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                background: selected ? 'var(--surface-2)' : 'var(--surface)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 200ms var(--ease-out)',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: selected ? 'var(--accent)' : 'var(--text)' }}>{u.name}</p>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                    {u.badge}
                  </span>
                </div>
                {selected && <Check size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                  {u.totalQuestions} MCQs · {u.durationMinutes}m
                </span>
                <span style={{ fontWeight: 600, color: u.hasNegativeMarking ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {u.negativeMarking}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <Button variant="primary" size="lg" fullWidth disabled={!value} onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}

export default StepUniversity;
