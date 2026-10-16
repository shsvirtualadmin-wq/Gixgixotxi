import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Zap } from 'lucide-react';

const STUDENT_BOTTOM_ITEMS = [
  { to: '/dashboard', label: 'Cockpit', icon: LayoutDashboard, end: true },
  { to: '/dashboard/practice', label: 'Daily Practice', icon: BookOpen },
  { to: '/dashboard/arena', label: 'Arena', icon: Zap },
];

export function DashboardBottomNav({ currentPath: _currentPath }: { currentPath?: string }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[100] border-t border-[var(--border)] flex items-center justify-around"
      style={{
        backgroundColor: 'var(--card)',
        paddingTop: '8px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
        boxShadow: 'none',
      }}
      aria-label="Student Mobile Navigation"
    >
      {STUDENT_BOTTOM_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-4 text-xs font-semibold transition-colors ${
              isActive ? 'text-[#FFFFFF]' : 'text-[var(--muted)]'
            }`
          }
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {({ isActive }) => (
            <>
              <div
                className={`w-10 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? 'bg-[#FFFFFF] text-[#000000]' : 'text-[var(--muted)]'
                }`}
              >
                <Icon size={18} />
              </div>
              <span className="text-[11px] tracking-tight">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
