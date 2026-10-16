import { useState } from 'react';
import { Chrome } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SocialSignInProps {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export function SocialSignIn({ onSuccess, onError }: SocialSignInProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      if (
        fe.code === 'auth/popup-closed-by-user' ||
        fe.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      const msg = fe.message
        ? `${fe.code ? `[${fe.code}] ` : ''}${fe.message}`
        : (err instanceof Error ? err.message : 'Google sign-in failed');
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      style={{
        width: '100%',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-input)',
        color: 'var(--text)',
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'all 160ms var(--ease-out)',
      }}
      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
    >
      {loading ? (
        <span style={{
          width: 18, height: 18,
          border: '2px solid var(--text-muted)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
          display: 'inline-block',
        }} />
      ) : (
        <Chrome size={18} />
      )}
      {loading ? 'Connecting...' : 'Continue with Google'}
    </button>
  );
}
