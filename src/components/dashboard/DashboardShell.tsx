import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { VerificationBanner } from '@/components/auth/VerificationBanner';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopBar } from './DashboardTopBar';
import { DashboardBottomNav } from './DashboardBottomNav';
import { useEffect } from 'react';

export function DashboardShell() {
  const { user, profileLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profileLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, profileLoading, navigate]);

  if (!user) return null;

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
          <DashboardTopBar />

          <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-12 overflow-y-auto">
            <div className="max-w-[1200px] w-full mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <DashboardBottomNav />
    </div>
  );
}

export default DashboardShell;
