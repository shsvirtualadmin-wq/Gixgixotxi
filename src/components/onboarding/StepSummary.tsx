import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { AlertCircle } from 'lucide-react';

interface SummaryData {
  targetUniversity: string;
  targetTestDate: string;
  academicTrack: string;
  subjects: string[];
}

interface StepSummaryProps {
  data: SummaryData;
  onBack: () => void;
  onComplete: () => void;
}

export function StepSummary({ data, onBack, onComplete }: StepSummaryProps) {
  const { user, updateLocalProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ code?: string; message: string; path?: string } | null>(null);

  const handleSave = async () => {
    if (!user) {
      onComplete();
      return;
    }
    const path = `users/${user.uid}`;
    setSaving(true);
    setError(null);

    // 1. Immediately update local state/context so the UI reflects completed onboarding
    updateLocalProfile({
      targetUniversity: data.targetUniversity,
      targetTestDate: data.targetTestDate,
      academicTrack: data.academicTrack,
      subjects: data.subjects,
      onboardingCompleted: true,
    });

    console.log(`[StepSummary] Issuing setDoc for ${path} with preferences:`, data);

    // 2. Issue setDoc (Firestore queues it locally immediately) and let it confirm in background
    setDoc(
      doc(db, 'users', user.uid),
      {
        targetUniversity: data.targetUniversity,
        targetTestDate: data.targetTestDate,
        academicTrack: data.academicTrack,
        subjects: data.subjects,
        onboardingCompleted: true,
        onboardingCompletedAt: serverTimestamp(),
      },
      { merge: true }
    )
      .then(() => {
        console.log(`[StepSummary] Background Firestore write confirmed for ${path}`);
      })
      .catch((err: unknown) => {
        const fe = err as { code?: string; message?: string };
        console.error(`[Boardly Firestore Underlying Error at ${path}]: Code: ${fe.code} | Message: ${fe.message}`, err);
        setError({
          code: fe.code,
          message: fe.message ?? 'Failed to save your preferences.',
          path,
        });
      });

    // 3. Navigate to dashboard right away (no 6-second timeout block)
    onComplete();
  };

  const rows: { label: string; value: string }[] = [
    { label: 'Target University', value: data.targetUniversity },
    { label: 'Test Date', value: data.targetTestDate ? new Date(data.targetTestDate + 'T00:00:00').toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
    { label: 'Academic Track', value: data.academicTrack.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) },
    { label: 'Subjects', value: data.subjects.length > 0 ? data.subjects.map((s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(', ') : 'None selected' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>
          <span className="text-gradient">Almost there!</span> Review your setup
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>You can update these from your dashboard settings anytime.</p>
      </div>

      <GlassCard style={{ padding: '1.25rem' }}>
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-faint)', flexShrink: 0 }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>{row.value}</span>
          </div>
        ))}
      </GlassCard>

      {/* Error state */}
      {error && (
        <div style={{
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: 12, padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)' }}>Save failed</span>
          </div>
          {error.code && <code style={{ fontSize: 11, color: 'var(--danger)', display: 'block', marginBottom: 4 }}>{error.code}</code>}
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{error.message}</p>
          {error.path && <p style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace' }}>Path: {error.path}</p>}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" size="lg" onClick={onBack} disabled={saving} style={{ flex: '0 0 auto' }}>Back</Button>
          <Button variant="primary" size="lg" fullWidth loading={saving} onClick={handleSave}>
            {error ? 'Retry Save' : 'Save & Go to Dashboard'}
          </Button>
        </div>
        {error && (
          <Button
            variant="ghost"
            size="md"
            onClick={onComplete}
            style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'underline' }}
          >
            Skip to Dashboard anyway →
          </Button>
        )}
      </div>
    </div>
  );
}
