import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { VerificationBanner } from '@/components/auth/VerificationBanner';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export function DashboardPage() {
  const { user, profile, profileLoading, signOutUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profileLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, profileLoading, navigate]);

  if (profileLoading) {
    return (
      <div style={{ padding: '6rem 24px', maxWidth: 600, margin: '0 auto' }}>
        <Skeleton height={32} width="40%" />
        <div style={{ marginTop: 16 }}><Skeleton height={16} count={3} /></div>
      </div>
    );
  }

  return (
    <div
      className="page-enter"
      style={{ padding: '6rem 24px 4rem', maxWidth: 800, margin: '0 auto' }}
    >
      <VerificationBanner />
      <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 8 }}>
        Welcome, {profile?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Student'} 👋
      </h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 24 }}>
        Your student cockpit is being built in Phase 3. This is a placeholder.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={() => signOutUser()}>Sign Out</Button>
      </div>
    </div>
  );
}

export default DashboardPage;
