import { type ReactNode } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, profileLoading, isAdmin } = useAuth();

  if (profileLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          padding: 24,
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          <Skeleton height={28} width="60%" />
          <div style={{ marginTop: 16 }}>
            <Skeleton height={14} count={4} />
          </div>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login with return parameter
  if (!user) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  // Logged in but not super-admin -> display forbidden error
  if (!isAdmin) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          padding: 24,
        }}
      >
        <div
          className="glass"
          style={{
            maxWidth: 520,
            width: '100%',
            padding: '2.5rem',
            borderRadius: 'var(--r-card)',
            textAlign: 'center',
            border: '1px solid rgba(248,113,113,0.3)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(248,113,113,0.12)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <ShieldAlert size={28} />
          </div>

          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text)',
              marginBottom: 10,
              letterSpacing: '-0.02em',
            }}
          >
            Super-Admin Access Restricted
          </h1>

          <p
            style={{
              fontSize: 14,
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            This portal is strictly reserved for the Boardly platform super-administrator.
            Your account (<strong style={{ color: 'var(--text)' }}>{user.email}</strong>) does not have god-mode authority.
          </p>

          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '10px 14px',
              borderRadius: 'var(--r-input)',
              fontSize: 12,
              fontFamily: 'monospace',
              color: 'var(--text-faint)',
              marginBottom: 24,
            }}
          >
            Authorized: shsvirtualadmin@gmail.com
          </div>

          <Link to="/dashboard">
            <Button variant="secondary" size="md">
              <ArrowLeft size={16} /> Return to Student Cockpit
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
