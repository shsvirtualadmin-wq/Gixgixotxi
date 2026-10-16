import { Button } from '@/components/ui/Button';

const ALL_SUBJECTS = [
  { id: 'mathematics', label: 'Mathematics', color: '#2F6BFF' },
  { id: 'physics', label: 'Physics', color: '#22D3EE' },
  { id: 'chemistry', label: 'Chemistry', color: '#34D399' },
  { id: 'english', label: 'English', color: '#FBBF24' },
  { id: 'computer-science', label: 'Computer Science', color: '#7C5CFF' },
  { id: 'biology', label: 'Biology', color: '#FB923C' },
  { id: 'analytical', label: 'Analytical / IQ', color: '#E879F9' },
  { id: 'statistics', label: 'Statistics', color: '#F87171' },
];

interface StepSubjectsProps {
  subjects: string[];
  weakChapters?: string[];
  onSubjectsChange: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepSubjects({ subjects, onSubjectsChange, onNext, onBack }: StepSubjectsProps) {
  const toggle = (id: string) => {
    onSubjectsChange(
      subjects.includes(id) ? subjects.filter((s) => s !== id) : [...subjects, id]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Which <span className="text-gradient">subjects</span> will you practice?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Select all that apply. You can change this later.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {ALL_SUBJECTS.map((s) => {
          const selected = subjects.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--r-card)',
                border: `2px solid ${selected ? s.color : 'var(--border)'}`,
                background: selected ? `${s.color}18` : 'var(--surface)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 200ms var(--ease-out)',
                backdropFilter: 'blur(20px)',
                textAlign: 'left',
              }}
            >
              {/* Color dot */}
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: selected ? s.color : 'var(--border)', flexShrink: 0, transition: 'background 200ms' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: selected ? s.color : 'var(--text-muted)' }}>{s.label}</p>
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center' }}>
        {subjects.length} subject{subjects.length !== 1 ? 's' : ''} selected
      </p>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" size="lg" onClick={onBack} style={{ flex: '0 0 auto' }}>Back</Button>
        <Button variant="primary" size="lg" fullWidth disabled={subjects.length === 0} onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}
