import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BackgroundCanvas } from '../BackgroundCanvas';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { DashboardBottomNav } from '../dashboard/DashboardBottomNav';

/**
 * PublicLayout:
 * Used for public landing and marketing routes.
 * For logged-in students, /store and /kobans open seamlessly inside the dashboard shell:
 * - Public top navbar and public footer are hidden
 * - Dashboard bottom nav is visible (with Menu icon highlighted for /store)
 * - Deep links (e.g. boardly.cfd/store) work identically
 * For logged-out visitors:
 * - Keeps standard public Navbar + Footer, browsing allowed, buying requires login
 */
export function PublicLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const isStoreOrKobans =
    location.pathname.startsWith('/store') ||
    location.pathname === '/kobans' ||
    location.pathname === '/about-kobans';

  const isDashboardAppRoute = Boolean(user && isStoreOrKobans);

  if (isDashboardAppRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] antialiased overflow-x-hidden">
        <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 pt-2 pb-28">
          <Outlet />
        </main>
        {/* Floating bottom nav with Menu icon highlighted inside /store */}
        <DashboardBottomNav />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <BackgroundCanvas />
      <Navbar />
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default PublicLayout;
