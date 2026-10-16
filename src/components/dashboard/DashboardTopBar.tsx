import { LogOut, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';

interface Props {
  sidebarCollapsed: boolean;
}

export function DashboardTopBar({ sidebarCollapsed: _sidebarCollapsed }: Props) {
  const { user, signOutUser } = useAuth();
  const navigate = useNavigate();
  const { profile } = useProfile(user?.uid ?? null);

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/login');
  };

  const isPremium = profile?.isPremium || profile?.plan === 'pro';

  return (
    <header
      style={{
        height: 64,
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        background: 'var(--surface)',
        backdropFilter: 'blur(20px)',
        flexShrink: 0,
        gap: 12,
      }}
    >
      {/* Left side: hamburger on mobile is handled by BottomNav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* On mobile, show logo since sidebar is hidden */}
        <img
          src="/logo.svg"
          alt="Boardly"
          style={{ width: 28, height: 28, display: 'none' }}
          className="mobile-logo"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Upgrade pill for free users */}
        {!isPremium && (
          <button
            onClick={() => navigate('/dashboard/plans')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--r-pill)',
              background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
              border: 'none',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Zap size={13} />
            Upgrade to Pro
          </button>
        )}

        {/* User avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? 'User'}
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: 'white',
              }}
            >
              {(user?.displayName ?? user?.email ?? 'U')[0].toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'none' }} className="topbar-name">
            {user?.displayName ?? user?.email?.split('@')[0]}
          </span>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 'var(--r-input)',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 13,
            cursor: 'pointer',
          }}
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
