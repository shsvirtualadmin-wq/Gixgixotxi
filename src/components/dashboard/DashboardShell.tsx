import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { VerificationBanner } from '@/components/auth/VerificationBanner';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopBar } from './DashboardTopBar';
import { DashboardBottomNav } from './DashboardBottomNav';
import { useEffect, useState } from 'react';

export function DashboardShell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', flexDirection: 'column' }}>
      {/* Verification banner spans full width */}
      <VerificationBanner />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar — desktop only (hidden on mobile via CSS) */}
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
          currentPath={location.pathname}
        />

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'auto',
          }}
        >
          <DashboardTopBar sidebarCollapsed={sidebarCollapsed} />

          <main
            className="page-enter"
            style={{
              flex: 1,
              padding: '1.5rem',
              paddingBottom: '5rem', // space for mobile bottom nav
            }}
          >
            <Outlet />
          </main>
        </div>
      </div>

      {/* Bottom nav — mobile only */}
      <DashboardBottomNav currentPath={location.pathname} />
    </div>
  );
}
