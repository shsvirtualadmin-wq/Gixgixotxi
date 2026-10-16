import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { VerificationBanner } from '@/components/auth/VerificationBanner';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardBottomNav } from './DashboardBottomNav';
import { DashboardErrorBoundary } from './DashboardErrorBoundary';
import { useEffect, useState } from 'react';

export function DashboardShell() {
  const { user, profileLoading } = useAuth();
  const navigate = useNavigate();
  const [authGraceFinished, setAuthGraceFinished] = useState(false);

  useEffect(() => {
    // 2.5s grace period so Firebase Auth restores without flashing empty/redirect
    const t = setTimeout(() => {
      setAuthGraceFinished(true);
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (authGraceFinished && !profileLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, profileLoading, authGraceFinished, navigate]);

  // NEVER return null or blank screen — always render shell and bottom nav immediately
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <VerificationBanner />

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar: exactly 240px width */}
        <DashboardSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-4 sm:p-6 pb-28 md:pb-12 overflow-y-auto">
            <div className="max-w-[1200px] w-full mx-auto">
              <DashboardErrorBoundary fallbackTitle="Cockpit Section Error">
                <Outlet />
              </DashboardErrorBoundary>
            </div>
          </main>
        </div>
      </div>

      {/* Consolidated Student Bottom Navigation Bar */}
      <DashboardBottomNav />
    </div>
  );
}

export default DashboardShell;
