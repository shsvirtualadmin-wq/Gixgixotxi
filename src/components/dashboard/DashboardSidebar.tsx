import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Zap } from 'lucide-react';

const STUDENT_NAV_ITEMS = [
  { to: '/dashboard', label: 'Cockpit', icon: LayoutDashboard, end: true },
  { to: '/dashboard/practice', label: 'Daily Practice', icon: BookOpen },
  { to: '/dashboard/arena', label: 'Arena', icon: Zap },
];

interface Props {
  collapsed?: boolean;
  onToggle?: () => void;
  currentPath?: string;
}

export function DashboardSidebar({ collapsed: _collapsed, onToggle: _onToggle }: Props) {
  return (
    <aside
      className="hidden md:flex flex-col border-r border-[var(--border)] shrink-0 select-none sticky top-0 h-screen"
      style={{
        width: 240,
        backgroundColor: 'var(--card)',
      }}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--border)] gap-3 shrink-0">
        <div
          className="w-8 h-8 rounded-lg bg-[#FFFFFF] flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <span
            className="font-bold text-base text-[#000000] leading-none"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            B
          </span>
        </div>
        <span
          className="text-xl font-bold tracking-tight text-[var(--text)]"
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Boardly
        </span>
      </div>

      {/* Exactly 3 Main Tabs: Cockpit, Daily Practice, Arena */}
      <nav className="flex-1 p-3 flex flex-col gap-1.5">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Study Portal
        </div>
        {STUDENT_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[#FFFFFF] text-[#000000]'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card-2)]'
              }`
            }
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom info footer */}
      <div className="p-4 border-t border-[var(--border)] text-xs text-[var(--muted)]">
        <div className="font-semibold text-[var(--text)] mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>
          2026 Entrance Cohort
        </div>
        <div>Asia/Karachi (PKT)</div>
      </div>
    </aside>
  );
}
