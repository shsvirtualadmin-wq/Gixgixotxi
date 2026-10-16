import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthInput } from '@/components/auth/AuthInput';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      if (fe.code === 'auth/user-not-found') {
        // Don't reveal if email exists — show success regardless (security)
        setSent(true);
      } else {
        setError(fe.message ?? 'Failed to send reset email.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/assets/boardly-logo.svg"
            alt="Boardly"
            width={120}
            height={36}
            className="h-9 w-auto max-w-[140px] shrink-0 object-contain mx-auto"
            style={{ height: 36, width: 'auto', maxWidth: 140, margin: '0 auto 16px' }}
            onError={(e) => { (e.target as HTMLImageElement).src = '/boardly-logo.png'; }}
          />
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>Reset Password</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>We'll email you a reset link</p>
        </div>

        <GlassCard radius="hero">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <CheckCircle size={40} style={{ color: 'var(--success)', margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Check your inbox</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>If an account with that email exists, we've sent a reset link.</p>
              <Link to="/login"><Button variant="primary" size="md">Back to Login</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--danger)' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}
              <AuthInput label="Email address" icon={Mail} type="email" required
                placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>Send Reset Link</Button>
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                <Link to="/login" style={{ color: 'var(--brand)', textDecoration: 'none' }}>← Back to login</Link>
              </p>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
