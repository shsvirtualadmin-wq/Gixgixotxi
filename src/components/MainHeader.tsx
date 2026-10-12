import React, { useState } from 'react';
import { triggerHaptic, HAPTIC_PATTERNS } from '../lib/haptics';
import { UserAvatar } from './UserAvatar';
import {
  Menu,
  X,
  ArrowLeft,
  Home,
  GraduationCap,
  History,
  ArrowRight,
  BarChart3,
  Target,
  Bot,
  Star,
  Globe,
  HelpCircle,
  BookOpen,
  LayoutDashboard,
  Sparkles,
  FileText,
  TrendingUp,
  CreditCard,
  User,
  LogOut,
  ShieldCheck,
  Users,
  Clock,
  Activity,
  Crown,
} from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useTheme } from '../context/ThemeContext';
import { StudentProfile, isAdminEmail } from '../lib/supabase';
import { BoardClass } from '../types';

interface MainHeaderProps {
  onMenuClick?: () => void;
  currentUser?: any;
  userProfile?: StudentProfile | null;
  selectedClass?: BoardClass | string;
  selectedGroup?: string;
  currentScreen?: string;
  theme?: 'light';
  onToggleTheme?: (theme: 'light') => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  onTrackClick?: () => void;
  canGoBack?: boolean;
  isIntroScreen?: boolean;
  historyCount?: number;
  onOpenHistory?: () => void;
  onOpenLmsPortal?: () => void;
  onNavigateProfile?: () => void;
  onStartFree?: () => void;
  onSignOut?: () => void;
  onNavigateDashboard?: () => void;
  onNavigateSubjects?: () => void;
  onNavigateStats?: () => void;
  onNavigatePractice?: () => void;
  onOpenStudyBuddy?: () => void;
  onNavigateSubscription?: () => void;
  onNavigateAdmin?: (tab?: 'students' | 'payment_requests' | 'activity_logs' | 'tests' | 'progress') => void;
}

export function getCategoryDisplayLabel(
  userProfile?: StudentProfile | null,
  selectedClass?: BoardClass | string,
  selectedGroup?: string
): { shortLabel: string; fullLabel: string; trackType: 'mdcat' | 'tcat' | 'fbise' | 'net' | 'fast' | 'ecat' | 'etea' | 'nums' | 'giki' | 'usat' } | null {
  const gradeStr = String(selectedClass || userProfile?.grade || '').trim();
  const streamStr = String(selectedGroup || userProfile?.stream || '').trim();

  if (!gradeStr && !streamStr) {
    return null;
  }

  const upperGrade = gradeStr.toUpperCase();
  const upperStream = streamStr.toUpperCase();

  if (upperGrade === 'MDCAT' || upperStream === 'MDCAT' || upperGrade.includes('MDCAT')) {
    return {
      shortLabel: 'MDCAT',
      fullLabel: 'MDCAT Medical Entrance',
      trackType: 'mdcat',
    };
  }

  if (upperGrade === 'TCAT' || upperStream === 'TCAT' || upperGrade.includes('TCAT')) {
    return {
      shortLabel: 'TCAT',
      fullLabel: 'TCAT Engineering Entrance',
      trackType: 'tcat',
    };
  }

  if (upperGrade === 'NET' || upperStream === 'NET' || upperGrade.includes('NET') || upperStream.includes('NET')) {
    return {
      shortLabel: 'NUST NET',
      fullLabel: 'NUST Entry Test (NET)',
      trackType: 'net',
    };
  }

  if (upperGrade === 'FAST' || upperStream === 'FAST' || upperGrade.includes('FAST') || upperStream.includes('NAT')) {
    return {
      shortLabel: 'FAST NAT',
      fullLabel: 'FAST-NU Admission Test',
      trackType: 'fast',
    };
  }

  if (upperGrade === 'ECAT' || upperStream === 'ECAT' || upperGrade.includes('ECAT')) {
    return {
      shortLabel: 'UET ECAT',
      fullLabel: 'UET Lahore ECAT',
      trackType: 'ecat',
    };
  }

  if (upperGrade === 'ETEA' || upperStream === 'ETEA' || upperGrade.includes('ETEA')) {
    return {
      shortLabel: 'ETEA',
      fullLabel: 'UET Peshawar ETEA Engineering',
      trackType: 'etea',
    };
  }

  if (upperGrade === 'NUMS' || upperStream === 'NUMS' || upperGrade.includes('NUMS')) {
    return {
      shortLabel: 'NUMS',
      fullLabel: 'NUMS Medical Entry Test',
      trackType: 'nums',
    };
  }

  if (upperGrade === 'GIKI' || upperStream === 'GIKI' || upperGrade.includes('GIKI')) {
    return {
      shortLabel: 'GIKI',
      fullLabel: 'GIKI Admission Test',
      trackType: 'giki',
    };
  }

  if (upperGrade === 'USAT' || upperStream === 'USAT' || upperGrade.includes('USAT')) {
    return {
      shortLabel: 'HEC USAT',
      fullLabel: 'HEC Undergraduate Studies Admission Test',
      trackType: 'usat',
    };
  }

  const cleanGradeNum = gradeStr.replace(/grade/i, '').replace(/th/i, '').trim();

  if (cleanGradeNum && ['9', '10', '11', '12'].includes(cleanGradeNum)) {
    let streamLabel = '';
    if (streamStr && !streamStr.toLowerCase().includes('general')) {
      if (
        streamStr.toLowerCase().includes('comp') ||
        streamStr.toLowerCase().includes('cs') ||
        streamStr.toLowerCase().includes('ics')
      ) {
        streamLabel = 'CS';
      } else if (
        streamStr.toLowerCase().includes('pre-med') ||
        streamStr.toLowerCase().includes('med')
      ) {
        streamLabel = 'Medical';
      } else if (streamStr.toLowerCase().includes('eng')) {
        streamLabel = 'Pre-Eng';
      } else {
        streamLabel = streamStr;
      }
    }

    const shortLabel = `FBISE - Grade ${cleanGradeNum}`;
    const fullLabel = streamLabel
      ? `FBISE - Grade ${cleanGradeNum} (${streamLabel})`
      : `FBISE - Grade ${cleanGradeNum}`;

    return {
      shortLabel,
      fullLabel,
      trackType: 'fbise',
    };
  }

  if (gradeStr && gradeStr !== 'undefined' && gradeStr !== 'null') {
    return {
      shortLabel: gradeStr,
      fullLabel: `Track: ${gradeStr}`,
      trackType: 'fbise',
    };
  }

  return null;
}

export const MainHeader: React.FC<MainHeaderProps> = React.memo(({
  onMenuClick,
  currentUser,
  userProfile,
  selectedClass,
  selectedGroup,
  currentScreen,
  theme: propsTheme,
  onToggleTheme: propsOnToggleTheme,
  onGoBack,
  onGoHome,
  onTrackClick,
  canGoBack = false,
  isIntroScreen = false,
  historyCount = 0,
  onOpenHistory,
  onOpenLmsPortal,
  onNavigateProfile,
  onStartFree,
  onSignOut,
  onNavigateDashboard,
  onNavigateSubjects,
  onNavigateStats,
  onNavigatePractice,
  onOpenStudyBuddy,
  onNavigateSubscription,
  onNavigateAdmin,
}) => {
  const { logoUrl } = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isUserAdmin = Boolean(currentUser?.email && isAdminEmail(currentUser.email));
  const isStudent = Boolean(currentUser && !isUserAdmin);
  const isLoggedOut = !currentUser;

  const handleLogoClick = () => {
    triggerHaptic(HAPTIC_PATTERNS.light);
    setMobileMenuOpen(false);
    if (!isLoggedOut) {
      if (onNavigateDashboard) {
        onNavigateDashboard();
      } else {
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', '/app');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
    } else if (onGoHome) {
      onGoHome();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (isIntroScreen) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (onGoHome) {
      onGoHome();
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const trackInfo = getCategoryDisplayLabel(userProfile, selectedClass, selectedGroup);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F8F9FB]/95  backdrop-blur-md border-b border-slate-200/80  px-3 sm:px-6 py-2.5 sm:py-3 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Side: Back button + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {canGoBack && onGoBack && (
            <button
              onClick={onGoBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100  hover:bg-[#1E5AFF] hover:text-white text-slate-800  font-bold text-xs transition-all active:scale-95 cursor-pointer border border-slate-200 "
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">Back</span>
            </button>
          )}

          {/* Single Brand Logo */}
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-2 relative group cursor-pointer select-none"
            title="Go to Home"
          >
            <img
              src="https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_0000000028e88211b439a564acc83f64.png"
              alt="Boardly Logo"
              className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/assets/boardly-logo-transparent.png';
              }}
            />
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Board<span className="text-indigo-600 dark:text-indigo-400">ly</span>
            </span>
          </div>
        </div>

        {/* Center: Desktop Section Links (Role Aware) */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-bold text-slate-600 ">
          {isLoggedOut && (
            <>
              <button
                onClick={() => scrollToSection('tracks')}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
              >
                Test Tracks
              </button>
              <button
                onClick={() => scrollToSection('why-boardly')}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
              >
                Why Boardly
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('study-buddy')}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
              >
                Boardy
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
              >
                Testimonials
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
              >
                About Us
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer"
              >
                FAQ
              </button>
            </>
          )}

          {isStudent && (
            <>
              <button
                onClick={() => (onNavigateSubjects ? onNavigateSubjects() : onNavigatePractice ? onNavigatePractice() : onNavigateDashboard?.())}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer flex items-center gap-1.5"
                title="Go to Subjects Dashboard (Class 11 Pre-Medical / MDCAT)"
              >
                <span>Subjects Dashboard</span>
              </button>
              {currentScreen !== 'dashboard' && (
                <button
                  onClick={() => (onNavigateDashboard ? onNavigateDashboard() : onNavigateStats ? onNavigateStats() : onGoHome?.())}
                  className="hover:text-[#1E5AFF] transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Go to Student Main Dashboard"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#1E5AFF]" />
                  <span>Main Dashboard</span>
                </button>
              )}
              <button
                onClick={() => (onTrackClick ? onTrackClick() : onOpenLmsPortal?.())}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>My Track</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.medium);
                  if (onNavigatePractice) onNavigatePractice();
                  else if (onStartFree) onStartFree?.();
                }}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Practice Tests</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.medium);
                  onOpenStudyBuddy?.();
                }}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Boardy</span>
              </button>
              <button
                onClick={() => onOpenHistory?.()}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Progress / Analytics</span>
              </button>
              <button
                onClick={() => (onNavigateProfile ? onNavigateProfile() : onOpenLmsPortal?.())}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer flex items-center gap-1.5"
                title="View Student Profile"
              >
                <User className="w-3.5 h-3.5 text-[#1E5AFF]" />
                <span>Profile</span>
              </button>
            </>
          )}

          {isUserAdmin && (
            <>
              <button
                onClick={() => onNavigateAdmin?.('students')}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Admin Dashboard</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic(HAPTIC_PATTERNS.medium);
                  onOpenStudyBuddy?.();
                }}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Boardy</span>
              </button>
              <button
                onClick={() => onNavigateAdmin?.('students')}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Manage Users</span>
              </button>
              <button
                onClick={() => onNavigateAdmin?.('payment_requests')}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Pending Verifications</span>
              </button>
              <button
                onClick={() => onNavigateAdmin?.('students')}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Subscription Plans</span>
              </button>
              <button
                onClick={() => onNavigateAdmin?.('activity_logs')}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Activity Log</span>
              </button>
              <button
                onClick={() => {
                  if (onNavigateProfile) onNavigateProfile();
                  else if (onOpenLmsPortal) onOpenLmsPortal();
                  else if (onNavigateAdmin) onNavigateAdmin('students');
                }}
                className="hover:text-[#1E5AFF] transition-colors cursor-pointer flex items-center gap-1.5"
                title="Admin Profile & Settings"
              >
                <User className="w-3.5 h-3.5 text-[#1E5AFF]" />
                <span>Profile</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Option B: Muted User Account Badge in Utility Bar */}
          {!isLoggedOut && currentUser?.email && (
            <div
              onClick={() => (onNavigateProfile ? onNavigateProfile() : onOpenLmsPortal?.())}
              className="hidden lg:flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-200/80  border border-slate-300  text-slate-700  text-xs font-medium shadow-xs cursor-pointer hover:border-[#1E5AFF] transition-all"
              title={`Logged in as ${currentUser.email} - Click to view profile`}
            >
              <UserAvatar user={currentUser} profile={userProfile} size="xs" />
              <span className="max-w-[120px] truncate text-slate-800  font-semibold">{userProfile?.name || currentUser.email}</span>
            </div>
          )}

          {/* Registered Track Indicator */}
          {trackInfo && (
            <div
              onClick={onTrackClick || onOpenLmsPortal || onMenuClick}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-95 select-none ${
                trackInfo.trackType === 'mdcat'
                  ? 'bg-emerald-500/10 text-emerald-900 border-emerald-500/30'
                  : trackInfo.trackType === 'tcat'
                  ? 'bg-cyan-500/10 text-cyan-900 border-cyan-500/30'
                  : trackInfo.trackType === 'net'
                  ? 'bg-blue-500/10 text-blue-900 border-blue-500/30'
                  : trackInfo.trackType === 'fast'
                  ? 'bg-sky-500/10 text-sky-900 border-sky-500/30'
                  : trackInfo.trackType === 'ecat'
                  ? 'bg-indigo-500/10 text-indigo-900 border-indigo-500/30'
                  : trackInfo.trackType === 'etea'
                  ? 'bg-teal-500/10 text-teal-900 border-teal-500/30'
                  : trackInfo.trackType === 'nums'
                  ? 'bg-green-500/10 text-green-900 border-green-500/30'
                  : trackInfo.trackType === 'giki'
                  ? 'bg-blue-600/10 text-blue-950 border-blue-600/30'
                  : trackInfo.trackType === 'usat'
                  ? 'bg-violet-500/10 text-violet-900 border-violet-500/30'
                  : 'bg-blue-500/10 text-blue-900 border-blue-500/30'
              }`}
              title={`Active Registered Track: ${trackInfo.fullLabel}`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{trackInfo.shortLabel}</span>
            </div>
          )}

          {/* Attempt History Button */}
          {historyCount > 0 && onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-800  bg-slate-200/70  border border-slate-300  px-3 py-1.5 rounded-full hover:bg-slate-300  active:scale-95 transition-all cursor-pointer font-bold"
            >
              <History className="w-3.5 h-3.5 text-blue-700 " />
              <span>History ({historyCount})</span>
            </button>
          )}

          {/* Primary CTA / LMS Portal Trigger */}
          {onOpenLmsPortal && isLoggedOut && (
            <button
              onClick={onOpenLmsPortal}
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-900  bg-slate-200/80  hover:bg-slate-300  px-3.5 py-1.5 rounded-full font-bold transition-all active:scale-95 cursor-pointer border border-slate-300/80 "
            >
              <BookOpen className="w-3.5 h-3.5 text-[#1E5AFF]" />
              <span>Sign In / Sign Up</span>
            </button>
          )}

          {/* Desktop Log Out Button for Logged-In Users */}
          {!isLoggedOut && onSignOut && (
            <button
              onClick={onSignOut}
              className="hidden sm:flex items-center gap-1.5 text-xs text-rose-700  bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3.5 py-1.5 rounded-full font-bold transition-all active:scale-95 cursor-pointer"
              title="Log Out of Account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}

          {onGoHome && canGoBack && (
            <button
              onClick={() => {
                if (!isLoggedOut && onNavigateDashboard) {
                  onNavigateDashboard();
                } else if (onGoHome) {
                  onGoHome();
                }
              }}
              className="p-2 rounded-full bg-black/5 hover:bg-[#1E5AFF] hover:text-white text-[#0A1330] transition-all active:scale-95 cursor-pointer"
              title="Go to Dashboard"
            >
              <Home className="w-4 h-4" />
            </button>
          )}

          {/* Single Hamburger / Menu Icon: Only show for unauthenticated guests per Requirement 6 */}
          {isLoggedOut && (
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="p-2 rounded-full hover:bg-black/5 transition-colors active:scale-95 cursor-pointer text-[#0A0A0A]"
              aria-label="Toggle navigation menu"
              title="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Mega-Menu Drawer: Only show for unauthenticated guests per Requirement 6 */}
      {isLoggedOut && mobileMenuOpen && (
        <div className="max-w-7xl mx-auto w-full pt-3 pb-2 border-t border-slate-200/80  mt-3 space-y-3 animate-ios-spring">
          {/* Mobile Menu Logo Header */}
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-2 px-3 py-1.5 mb-1 border-b border-slate-200/60 cursor-pointer group"
          >
            <img
              src="https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_0000000028e88211b439a564acc83f64.png"
              alt="Boardly Logo"
              className="h-8 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/assets/boardly-logo-transparent.png';
              }}
            />
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Board<span className="text-indigo-600 dark:text-indigo-400">ly</span>
            </span>
          </div>
          <div className="flex flex-col gap-1.5 text-xs font-bold text-slate-800 ">
            {/* 1. LOGGED-OUT VISITOR LINKS */}
            {isLoggedOut && (
              <>
                <button
                  onClick={() => scrollToSection('tracks')}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>Test Tracks</span>
                  <GraduationCap className="w-4 h-4 text-[#1E5AFF]" />
                </button>
                <button
                  onClick={() => scrollToSection('why-boardly')}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>Why Boardly</span>
                  <BarChart3 className="w-4 h-4 text-[#1E5AFF]" />
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>How It Works</span>
                  <Target className="w-4 h-4 text-[#1E5AFF]" />
                </button>
                <button
                  onClick={() => scrollToSection('study-buddy')}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>Boardy</span>
                  <Bot className="w-4 h-4 text-[#1E5AFF]" />
                </button>
                <button
                  onClick={() => scrollToSection('testimonials')}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>Student Stories</span>
                  <Star className="w-4 h-4 text-[#1E5AFF]" />
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>About Us</span>
                  <Globe className="w-4 h-4 text-[#1E5AFF]" />
                </button>
                <button
                  onClick={() => scrollToSection('faq')}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>FAQ</span>
                  <HelpCircle className="w-4 h-4 text-[#1E5AFF]" />
                </button>
              </>
            )}

            {/* 2. LOGGED-IN STUDENT LINKS */}
            {isStudent && (
              <>
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-800  border-b border-slate-200/60  mb-1 pb-1 flex items-center justify-between">
                  <span>Student Portal Navigation</span>
                  <span className="truncate max-w-[150px] font-mono normal-case text-slate-500  font-normal">{currentUser.email}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateSubjects) onNavigateSubjects();
                    else if (onNavigatePractice) onNavigatePractice();
                    else if (onNavigateDashboard) onNavigateDashboard();
                  }}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-[#1E5AFF]" />
                    <span>Subjects Dashboard</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-700  font-bold px-2 py-0.5 rounded-full">Subjects Grid</span>
                </button>
                {currentScreen !== 'dashboard' && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onNavigateDashboard) onNavigateDashboard();
                      else if (onNavigateStats) onNavigateStats();
                      else if (onGoHome) onGoHome();
                    }}
                    className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#1E5AFF]" />
                      <span>Main Dashboard</span>
                    </div>
                  </button>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onTrackClick) onTrackClick();
                    else if (onOpenLmsPortal) onOpenLmsPortal();
                  }}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-4 h-4 text-[#1E5AFF]" />
                    <span>My Track</span>
                  </div>
                  {trackInfo && (
                    <span className="text-[10px] bg-blue-500/15 text-blue-900  font-bold px-2 py-0.5 rounded-full truncate max-w-[140px]">
                      {trackInfo.shortLabel}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(HAPTIC_PATTERNS.medium);
                    setMobileMenuOpen(false);
                    if (onNavigatePractice) onNavigatePractice();
                    else if (onStartFree) onStartFree();
                  }}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#1E5AFF]" />
                    <span>Practice Tests</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(HAPTIC_PATTERNS.medium);
                    setMobileMenuOpen(false);
                    if (onOpenStudyBuddy) onOpenStudyBuddy();
                  }}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Bot className="w-4 h-4 text-[#1E5AFF]" />
                    <span>Boardy</span>
                  </div>
                  <span className="text-[10px] bg-purple-500/15 text-purple-700  font-bold px-2 py-0.5 rounded-full">Boardy</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenHistory) onOpenHistory();
                  }}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-[#1E5AFF]" />
                    <span>Progress / Analytics</span>
                  </div>
                  {historyCount > 0 && (
                    <span className="text-[10px] bg-blue-500/15 text-blue-700  font-bold px-2 py-0.5 rounded-full">
                      {historyCount} Tests
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateProfile) onNavigateProfile();
                    else if (onOpenLmsPortal) onOpenLmsPortal();
                  }}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#1E5AFF]" />
                    <span>Profile</span>
                  </div>
                </button>
              </>
            )}

            {/* 3. LOGGED-IN ADMIN LINKS */}
            {isUserAdmin && (
              <>
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-rose-700  border-b border-slate-200/60  mb-1 pb-1 flex items-center justify-between">
                  <span>Admin Control Panel</span>
                  <span className="text-[10px] bg-rose-500/15 text-rose-700  font-bold px-2 py-0.5 rounded-full">Administrator</span>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateAdmin) onNavigateAdmin('students');
                  }}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#1E5AFF]" />
                    <span>Admin Dashboard</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(HAPTIC_PATTERNS.medium);
                    setMobileMenuOpen(false);
                    if (onOpenStudyBuddy) onOpenStudyBuddy();
                  }}
                  className="text-left py-2.5 px-3 hover:bg-slate-100 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Bot className="w-4 h-4 text-[#1E5AFF]" />
                    <span>Boardy</span>
                  </div>
                  <span className="text-[10px] bg-purple-500/15 text-purple-700 font-bold px-2 py-0.5 rounded-full">Boardy</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateAdmin) onNavigateAdmin('students');
                  }}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-[#1E5AFF]" />
                    <span>Manage Users</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateAdmin) onNavigateAdmin('payment_requests');
                  }}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#1E5AFF]" />
                    <span>Pending Verifications / Payment Proofs</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateAdmin) onNavigateAdmin('students');
                  }}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Crown className="w-4 h-4 text-[#1E5AFF]" />
                    <span>Manage Subscription Plans</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateAdmin) onNavigateAdmin('activity_logs');
                  }}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-[#1E5AFF]" />
                    <span>Activity Log</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateProfile) onNavigateProfile();
                    else if (onOpenLmsPortal) onOpenLmsPortal();
                    else if (onNavigateAdmin) onNavigateAdmin('students');
                  }}
                  className="text-left py-2.5 px-3 hover:bg-slate-100  rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-[#1E5AFF]" />
                    <span>Profile</span>
                  </div>
                </button>
              </>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200/60  flex flex-col gap-2">
            {isLoggedOut && (
              <>
                {onOpenLmsPortal && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenLmsPortal();
                    }}
                    className="w-full bg-[#0A1330] text-white   font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <BookOpen className="w-4 h-4 text-[#1E5AFF]" />
                    <span>Student LMS Portal (Sign In / Sign Up)</span>
                  </button>
                )}

                {onStartFree && isIntroScreen && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onStartFree();
                    }}
                    className="w-full bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Start Free Practice</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                )}
              </>
            )}

            {!isLoggedOut && onSignOut && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignOut();
                }}
                className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-700  font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer border border-rose-500/20 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
});
