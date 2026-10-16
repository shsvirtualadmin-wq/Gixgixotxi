import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, FileText, Zap, Bot,
  BarChart3, Users, Star, CreditCard, ChevronLeft, ChevronRight, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/practice', label: 'Practice', icon: BookOpen },
  { to: '/dashboard/past-papers', label: 'Past Papers', icon: FileText },
  { to: '/dashboard/arena', label: 'Arena', icon: Zap },
  { to: '/dashboard/ai-tutor', label: 'AI Tutor', icon: Bot },
  { to: '/dashboard/merit-meter', label: 'Merit Meter', icon: BarChart3 },
  { to: '/dashboard/study-circles', label: 'Study Circles', icon: Users },
  { to: '/dashboard/reviews', label: 'Reviews', icon: Star },
  { to: '/dashboard/plans', label: 'Plans', icon: CreditCard },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  currentPath: string;
}

export function DashboardSidebar({ collapsed, onToggle }: Props) {
  const { isAdmin } = useAuth();

  return (
    <aside
      style={{
        width: collapsed ? 72 : 240,
        minWidth: collapsed ? 72 : 240,
        transition: 'width 300ms cubic-bezier(0.22,1,0.36,1), min-width 300ms cubic-bezier(0.22,1,0.36,1)',
        borderRight: '1px solid var(--border)',
        background: 'var(--surface)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
      }}
      // Hide on mobile
      className="hidden-mobile"
    >
      {/* Logo / brand */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid var(--border)',
          gap: 10,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <img src="/logo.svg" alt="Boardly" style={{ width: 32, height: 32, flexShrink: 0 }} />
        {!collapsed && (
          <span
            className="font-display"
            style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}
          >
            Boardly
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 'var(--r-input)',
              textDecoration: 'none',
              color: isActive ? 'var(--text)' : 'var(--text-muted)',
              background: isActive ? 'var(--surface-hover)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: 14,
              transition: 'all 160ms',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  style={{
                    flexShrink: 0,
                    color: isActive ? 'var(--brand)' : 'inherit',
                  }}
                />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 'var(--r-input)',
              textDecoration: 'none',
              color: '#34D399',
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.3)',
              fontWeight: 700,
              fontSize: 13,
              marginTop: 'auto',
              marginBottom: 4,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <ShieldCheck size={18} style={{ color: '#34D399', flexShrink: 0 }} />
            {!collapsed && <span>God Mode</span>}
          </NavLink>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '8px',
          padding: '10px',
          borderRadius: 'var(--r-input)',
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 160ms',
        }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        {!collapsed && <span style={{ marginLeft: 8, fontSize: 13 }}>Collapse</span>}
      </button>
    </aside>
  );
}
