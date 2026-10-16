import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';

const UNIVERSITIES = [
  { id: 'FAST-NUCES', label: 'FAST-NUCES', sub: 'NAT Test' },
  { id: 'NUST-NET', label: 'NUST', sub: 'NET Test' },
  { id: 'GIKI', label: 'GIKI', sub: 'Entry Test' },
  { id: 'LUMS', label: 'LUMS', sub: 'LCAT Test' },
  { id: 'NED', label: 'NED', sub: 'NED Test' },
  { id: 'COMSATS', label: 'COMSATS', sub: 'Entry Test' },
  { id: 'PIEAS', label: 'PIEAS', sub: 'Entry Test' },
  { id: 'UET', label: 'UET', sub: 'ECAT' },
  { id: 'MDCAT', label: 'MDCAT', sub: 'Medical Test' },
  { id: 'ECAT', label: 'ECAT', sub: 'Engineering' },
];

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
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>We'll personalize your question bank and drills.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {UNIVERSITIES.map((u) => {
          const selected = value === u.id;
          return (
            <button
              key={u.id}
              onClick={() => onChange(u.id)}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--r-card)',
                border: `2px solid ${selected ? 'var(--brand)' : 'var(--border)'}`,
                background: selected ? 'rgba(47,107,255,0.12)' : 'var(--surface)',
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
                <p style={{ fontSize: 14, fontWeight: 700, color: selected ? 'var(--brand)' : 'var(--text)', marginBottom: 2 }}>{u.label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>{u.sub}</p>
              </div>
              {selected && <Check size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />}
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
