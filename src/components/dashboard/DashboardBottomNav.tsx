import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Zap, Bot, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { DashboardMoreSheet } from './DashboardMoreSheet';

const BOTTOM_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/practice', label: 'Practice', icon: BookOpen },
  { to: '/dashboard/arena', label: 'Arena', icon: Zap },
  { to: '/dashboard/ai-tutor', label: 'AI', icon: Bot },
];

export function DashboardBottomNav({ currentPath }: { currentPath: string }) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'var(--surface)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: 'calc(8px + env(safe-area-inset-bottom, 0px)) 0 calc(8px + env(safe-area-inset-bottom, 0px))',
        }}
        // Show only on mobile
        className="bottom-nav"
      >
        {BOTTOM_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '4px 16px',
              textDecoration: 'none',
              color: isActive ? 'var(--brand)' : 'var(--text-faint)',
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              transition: 'color 160ms',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={20} style={{ color: isActive ? 'var(--brand)' : 'var(--text-faint)' }} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* More */}
        <button
          onClick={() => setMoreOpen(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '4px 16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-faint)',
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>

      <DashboardMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} currentPath={currentPath} />
    </>
  );
}
