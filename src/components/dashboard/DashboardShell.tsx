import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { VerificationBanner } from '@/components/auth/VerificationBanner';
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
      className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] antialiased overflow-x-hidden"
    >
      <VerificationBanner />

      {/* Main Content Container: max-w-5xl with responsive padding and pb-28 for bottom PillNav */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28">
        <DashboardErrorBoundary fallbackTitle="Cockpit Section Error">
          <Outlet />
        </DashboardErrorBoundary>
      </main>

      {/* Unified Student Pill Navigation (Only navigation on mobile and desktop) */}
      <DashboardBottomNav />
    </div>
  );
}

export default DashboardShell;
