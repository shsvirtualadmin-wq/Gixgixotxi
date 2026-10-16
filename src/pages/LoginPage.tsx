import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthInput } from '@/components/auth/AuthInput';
import { SocialSignIn } from '@/components/auth/SocialSignIn';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';

export function LoginPage() {
  const { signIn, user, profile, profileLoading, profileError, retryProfile } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authed
  useEffect(() => {
    if (!profileLoading && user && profile) {
      if (!profile.onboardingCompleted) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, profileLoading, navigate]);

  // Show profile error (e.g. suspension)
  if (profileError) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 24,
      }}>
        <GlassCard style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <AlertCircle size={36} style={{ color: 'var(--danger)', margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Access Denied</p>
          {profileError.code && (
            <code style={{
              fontSize: 12, color: 'var(--danger)',
              background: 'rgba(248,113,113,0.1)',
              padding: '3px 8px', borderRadius: 6, display: 'inline-block', marginBottom: 8,
            }}>{profileError.code}</code>
          )}
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>{profileError.message}</p>
          {profileError.path && (
            <p style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'monospace', marginBottom: 16 }}>Path: {profileError.path}</p>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <Button variant="primary" size="sm" onClick={retryProfile}>Retry</Button>
            <Link to="/"><Button variant="secondary" size="sm">Back to Home</Button></Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Navigation handled by useEffect above
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      const code = fe.code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (code === 'auth/user-disabled') {
        setError('This account has been disabled.');
      } else {
        setError(fe.message ?? 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-enter"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
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
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Log in to continue your prep</p>
        </div>

        <GlassCard radius="hero">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Error banner */}
            {error && (
              <div style={{
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'var(--danger)',
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <AuthInput
              label="Email address"
              icon={Mail}
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div>
              <AuthInput
                label="Password"
                icon={Lock}
                type="password"
                required
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div style={{ marginTop: 6, textAlign: 'right' }}>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: 12, color: 'var(--brand)', textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Log In
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <SocialSignIn
              onError={(msg) => setError(msg)}
            />
          </form>
        </GlassCard>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
