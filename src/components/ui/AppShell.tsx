import React, { useState } from 'react';
import { UserRole } from '../../lib/firebase';
import { Sidebar } from './Sidebar';
import { BottomTabBar, StudentTabId } from './BottomTabBar';
import { Menu } from 'lucide-react';

export interface AppShellProps {
  role: UserRole;
  title: string;
  subtitle?: string;
  activeNav: string;
  onSelectNav: (navId: string) => void;
  children: React.ReactNode;
  onNavigateUpgrade?: () => void;
  onNavigateProfile?: () => void;
  onNavigateBilling?: () => void;
  onLogout?: () => void;
  onOpenMore?: () => void;
  isInputFocused?: boolean;
  isInTestSession?: boolean;
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
  onNavigateBilling,
  onLogout,
  onOpenMore,
  isInputFocused = false,
  isInTestSession = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // For students, mobile navigation is 100% standardized on the bottom tab bar.
  // Hamburger drawer is only needed for admin/organizer/captain portals on small screens.
  const showMobileHamburger = role !== 'student';

  return (
    <div className="min-h-[100dvh] text-[#0d1b3e] flex flex-col relative overflow-x-hidden font-sans">
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
        {/* Mobile drawer toggle for organizer/captain portals on small screens */}
        {showMobileHamburger && (
          <div className="lg:hidden px-4 pt-3 pb-0 flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-white border border-slate-200/90 shadow-xs cursor-pointer flex items-center gap-2 text-xs font-bold"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4 text-slate-600" />
              <span>Menu</span>
            </button>
          </div>
        )}

        {/* Avoid bar covering page content (add bottom padding 110px + safe-area) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-[110px] lg:pb-12 safe-area-bottom">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (Student Role Only) */}
      {role === 'student' && (
        <BottomTabBar
          activeTab={activeNav}
          onSelectTab={(tabId) => onSelectNav(tabId)}
          onOpenMore={() => onOpenMore?.()}
          isInputFocused={isInputFocused}
          isInTestSession={isInTestSession}
        />
      )}
    </div>
  );
};
