import { useState } from 'react';
import { doc, setDoc, getDocFromServer, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { AlertCircle } from 'lucide-react';

interface SummaryData {
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

    const safePayload = {
      subjects: data.subjects || [],
      onboardingComplete: true,
      onboardingCompleted: true,
      profileCompleted: true,
      updatedAt: serverTimestamp(),
      profileCompletedAt: serverTimestamp(),
      onboardingCompletedAt: serverTimestamp(),
    };

    if (import.meta.env.DEV) {
      console.log(`[StepSummary] Starting server-confirmed save for ${path}:`, safePayload);
    }

    try {
      const docRef = doc(db, 'users', user.uid);

      const writeAndVerify = async () => {
        await setDoc(docRef, safePayload, { merge: true });
        const snap = await getDocFromServer(docRef);
        if (!snap.exists()) {
          throw new Error('Profile write could not be confirmed on the server.');
        }
        return snap.data();
      };

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          const tErr = new Error('Database write timed out after 15 seconds. Please verify your connection.');
          (tErr as { code?: string }).code = 'TIMEOUT_15S';
          reject(tErr);
        }, 15000);
      });

      await Promise.race([writeAndVerify(), timeoutPromise]);

      updateLocalProfile({
        subjects: data.subjects,
        onboardingComplete: true,
        onboardingCompleted: true,
        profileCompleted: true,
      });

      setSaving(false);
      onComplete();
    } catch (err: unknown) {
      setSaving(false);
      const fe = err as { code?: string; message?: string };
      console.error(`[StepSummary] Save failed at ${path}:`, err);
      setError({
        code: fe.code || 'SAVE_FAILED',
        message: fe.message || 'Permission denied or network connection failed.',
        path,
      });
    }
  };

  const rows: { label: string; value: string }[] = [
    {
      label: 'Study Subjects',
      value:
        data.subjects.length > 0
          ? data.subjects
              .map((s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
              .join(', ')
          : 'All core subjects',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>
          <span className="text-gradient">Almost there!</span> Review your setup
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>You can update your subjects anytime in Settings.</p>
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
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--text-faint)', flexShrink: 0 }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>{row.value}</span>
          </div>
        ))}
      </GlassCard>

      {error && (
        <div style={{ padding: '12px 14px', borderRadius: 'var(--r-card)', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertCircle size={16} color="var(--red)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.4 }}>{error.message}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <Button variant="secondary" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Finish Setup'}
        </Button>
      </div>
    </div>
  );
}
