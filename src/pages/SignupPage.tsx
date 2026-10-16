import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthInput } from '@/components/auth/AuthInput';
import { SocialSignIn } from '@/components/auth/SocialSignIn';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';

export function SignupPage() {
  const { signUp, user, profile, profileLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect after auth
  useEffect(() => {
    if (!profileLoading && user && profile) {
      if (!profile.onboardingCompleted) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, profileLoading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await signUp(email.trim(), password, name.trim());
      navigate('/onboarding', { replace: true });
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      const code = fe.code ?? '';
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try logging in.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(fe.message ?? 'Sign up failed. Please try again.');
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
            Start for free
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Join 1,000+ students preparing for entrance tests</p>
        </div>

        <GlassCard radius="hero">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'var(--danger)',
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            <AuthInput label="Full Name" icon={User} type="text" required autoComplete="name"
              placeholder="Ahmed Khan" value={name} onChange={(e) => setName(e.target.value)} />
            <AuthInput label="Email address" icon={Mail} type="email" required autoComplete="email"
              placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <AuthInput label="Password" icon={Lock} type="password" required autoComplete="new-password"
              placeholder="Minimum 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
            <AuthInput label="Confirm Password" icon={Lock} type="password" required autoComplete="new-password"
              placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

            <p style={{ fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.5, marginTop: -4 }}>
              By signing up you agree to our{' '}
              <Link to="/terms" style={{ color: 'var(--brand)' }}>Terms</Link> and{' '}
              <Link to="/privacy" style={{ color: 'var(--brand)' }}>Privacy Policy</Link>.
            </p>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Create Account
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <SocialSignIn onError={(msg) => setError(msg)} />
          </form>
        </GlassCard>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;
