import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BackgroundCanvas } from '../BackgroundCanvas';
import { Navbar } from './Navbar';
import { PublicPageHeader } from './PublicPageHeader';
import { Footer } from './Footer';
import { DashboardBottomNav } from '../dashboard/DashboardBottomNav';

/**
 * PublicLayout:
 * - Home page ('/'): Displays the floating pill top Navbar + Footer.
 * - Non-home public pages (Features, Store, Pricing, Nakama Captains, Grand Line, Contact, Kobans, Policies):
 *   Display full-page content with compact PublicPageHeader (Back arrow + page title) instead of the floating top Navbar.
 * - Logged-in students visiting /store or /kobans keep the dashboard layout with DashboardBottomNav.
 */
export function PublicLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const isStoreOrKobans =
    location.pathname.startsWith('/store') ||
    location.pathname === '/kobans' ||
    location.pathname === '/about-kobans';

  const isContact = location.pathname === '/contact';

  const isDashboardAppRoute = Boolean(user && (isStoreOrKobans || isContact));

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

  const isHomePage = location.pathname === '/';

  return (
    <div
      className="relative min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      <BackgroundCanvas />
      {isHomePage ? <Navbar /> : <PublicPageHeader />}
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default PublicLayout;
