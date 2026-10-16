import { NavLink } from 'react-router-dom';
import { X, FileText, BarChart3, Users, Star, CreditCard, Zap } from 'lucide-react';
import { useEffect } from 'react';

const MORE_ITEMS = [
  { to: '/dashboard/past-papers', label: 'Past Papers', icon: FileText },
  { to: '/dashboard/merit-meter', label: 'Merit Meter', icon: BarChart3 },
  { to: '/dashboard/study-circles', label: 'Study Circles', icon: Users },
  { to: '/dashboard/reviews', label: 'Reviews', icon: Star },
  { to: '/dashboard/plans', label: 'Plans', icon: CreditCard },
];

interface Props {
  open: boolean;
  onClose: () => void;
  currentPath: string;
}

export function DashboardMoreSheet({ open, onClose, currentPath: _currentPath }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div
        className="glass"
        style={{
          position: 'relative',
          borderRadius: '28px 28px 0 0',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>More</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {MORE_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 'var(--r-input)',
              textDecoration: 'none',
              color: isActive ? 'var(--brand)' : 'var(--text-muted)',
              background: isActive ? 'var(--surface-hover)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: 15,
            })}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Upgrade nudge */}
        <div
          style={{
            marginTop: 8,
            padding: '12px 16px',
            borderRadius: 'var(--r-input)',
            background: 'linear-gradient(135deg, rgba(47,107,255,0.15), rgba(34,211,238,0.15))',
            border: '1px solid rgba(47,107,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Zap size={18} style={{ color: 'var(--brand)' }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Upgrade to Pro</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unlimited practice + AI Tutor</p>
          </div>
        </div>
      </div>
    </div>
  );
}
