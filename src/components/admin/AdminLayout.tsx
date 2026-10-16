import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Database,
  FileCheck2,
  CreditCard,
  MessageSquare,
  LogOut,
  ExternalLink,
  Terminal,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BackgroundCanvas } from '@/components/BackgroundCanvas';

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users & Overrides', icon: Users },
  { to: '/admin/questions', label: 'Question Bank', icon: Database },
  { to: '/admin/applications', label: 'Applications', icon: FileCheck2 },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: Terminal },
];

export function AdminLayout() {
  const { user, signOutUser } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <BackgroundCanvas />

      {/* ── Top God-Mode System Banner ─────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(90deg, #064E3B 0%, #065F46 50%, #047857 100%)',
          borderBottom: '1px solid rgba(16,185,129,0.3)',
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          fontWeight: 600,
          color: '#A7F3D0',
          letterSpacing: '0.04em',
          flexWrap: 'wrap',
          gap: 8,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#34D399',
              boxShadow: '0 0 8px #34D399',
            }}
          />
          <span style={{ textTransform: 'uppercase', fontWeight: 800 }}>⚡ Super-Admin God Mode</span>
          <span style={{ opacity: 0.6 }}>|</span>
          <span>{user?.email}</span>
        </div>
        <div style={{ opacity: 0.85, fontFamily: 'monospace', fontSize: 10 }}>
          DB: ai-studio-gixgixotxi-25287ca6-33a1-49f8-8867-70061120a712
        </div>
      </div>

      {/* ── Main Admin Navigation Bar ──────────────────────────────────── */}
      <header
        className="glass"
        style={{
          height: 64,
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link
            to="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
            }}
          >
            <img src="/logo.svg" alt="Boardly" style={{ width: 28, height: 28 }} />
            <span
              className="font-display"
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              Boardly <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>Admin</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            className="hidden md:flex"
          >
            {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '7px 12px',
                  borderRadius: 'var(--r-input)',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  color: isActive ? '#34D399' : 'var(--text-muted)',
                  background: isActive ? 'rgba(16,185,129,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent',
                  transition: 'all 160ms',
                })}
              >
                <Icon size={15} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right side actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--r-input)',
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              color: 'var(--text-muted)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              transition: 'all 160ms',
            }}
            title="View student app"
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Student Cockpit</span>
          </Link>

          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 'var(--r-input)',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-faint)',
              fontSize: 13,
              cursor: 'pointer',
            }}
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Mobile Nav Strip */}
      <div
        className="flex md:hidden"
        style={{
          overflowX: 'auto',
          padding: '8px 16px',
          gap: 6,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(7,11,20,0.6)',
        }}
      >
        {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 'var(--r-pill)',
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              color: isActive ? '#34D399' : 'var(--text-muted)',
              background: isActive ? 'rgba(16,185,129,0.15)' : 'var(--surface)',
              border: isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)',
            })}
          >
            <Icon size={13} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* ── Content Area ──────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          maxWidth: 'var(--max-w)',
          width: '100%',
          margin: '0 auto',
          padding: '24px 20px 60px',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
