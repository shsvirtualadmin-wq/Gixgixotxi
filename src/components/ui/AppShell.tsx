import React, { useState } from 'react';
import { UserRole } from '../../lib/firebase';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomTabBar, StudentTabId } from './BottomTabBar';

export interface AppShellProps {
  role: UserRole;
  title: string;
  subtitle?: string;
  activeNav: string;
  onSelectNav: (navId: string) => void;
  children: React.ReactNode;
  onNavigateUpgrade?: () => void;
  onNavigateProfile?: () => void;
  onLogout?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  role,
  title,
  subtitle,
  activeNav,
  onSelectNav,
  children,
  onNavigateUpgrade,
  onNavigateProfile,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // For students, mobile navigation is 100% standardized on the bottom tab bar.
  // Hamburger drawer is only needed for admin/organizer/captain portals on small screens.
  const showMobileHamburger = role !== 'student';

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col relative overflow-x-hidden font-sans">
      {/* Background ambient frosted glow elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-10 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Sidebar for Desktop (and non-student mobile drawer) */}
      <Sidebar
        role={role}
        activeNav={activeNav}
        onSelectNav={onSelectNav}
        isOpenMobile={showMobileHamburger && mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onLogout={onLogout}
      />

      {/* Main Column */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopBar
          title={title}
          subtitle={subtitle}
          onOpenMobileMenu={showMobileHamburger ? () => setMobileMenuOpen(true) : undefined}
          onNavigateUpgrade={onNavigateUpgrade}
          onNavigateProfile={onNavigateProfile}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (Student Role Only) */}
      {role === 'student' && (
        <BottomTabBar
          activeTab={activeNav as StudentTabId}
          onSelectTab={(tabId) => onSelectNav(tabId)}
          onOpenProfile={onNavigateProfile}
        />
      )}
    </div>
  );
};
