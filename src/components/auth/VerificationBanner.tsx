import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function VerificationBanner() {
  const { user, profile, isSessionVerified, sendVerificationEmail } = useAuth();
  const [sent, setSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (
    !user ||
    user.emailVerified ||
    isSessionVerified ||
    (profile as any)?.emailVerified ||
    dismissed
  ) {
    return null;
  }

  const handleResend = async () => {
    try {
      await sendVerificationEmail();
      setSent(true);
    } catch {
      // silently fail
    }
  };

  return (
    <div
      style={{
        background: 'rgba(251,191,36,0.12)',
        border: '1px solid rgba(251,191,36,0.3)',
        borderRadius: 'var(--r-card)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}
    >
      <Mail size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
      <p style={{ fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0 }}>
        {sent
          ? 'Verification email sent! Check your inbox (and spam folder).'
          : `Please verify your email address (${user.email}) to unlock all features.`}
      </p>
      {!sent && (
        <button
          onClick={handleResend}
          style={{
            fontSize: 12, fontWeight: 700, color: 'var(--warning)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
          }}
        >
          Resend
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 0 }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
