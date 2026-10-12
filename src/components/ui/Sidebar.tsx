import React from 'react';
import { UserRole } from '../../lib/firebase';
import {
  LayoutDashboard,
  Target,
  Calendar,
  MessageSquare,
  Users,
  Award,
  Shield,
  BookOpen,
  DollarSign,
  Star,
  Settings,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  TrendingUp,
  User,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export interface SidebarProps {
  role: UserRole;
  activeNav: string;
  onSelectNav: (id: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  activeNav,
  onSelectNav,
  isOpenMobile = false,
  onCloseMobile,
  onLogout,
}) => {
  // Navigation structure tailored per role
  const getNavItems = (): { section?: string; items: NavItem[] }[] => {
    if (role === 'admin') {
      return [
        {
          items: [
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'students', label: 'Students', icon: <Users className="w-4 h-4" /> },
            { id: 'payments', label: 'Plans & Payments', icon: <DollarSign className="w-4 h-4" /> },
            { id: 'events', label: 'Events & Mocks', icon: <Calendar className="w-4 h-4" /> },
            { id: 'circles', label: 'Study Circles', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'captains', label: 'Campus Captains', icon: <Award className="w-4 h-4" /> },
            { id: 'reviews', label: 'Reviews Queue', icon: <Star className="w-4 h-4" /> },
            { id: 'content', label: 'Question Bank', icon: <FileText className="w-4 h-4" /> },
            { id: 'boardy', label: 'Boardy AI', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'support', label: 'Support & Tickets', icon: <HelpCircle className="w-4 h-4" /> },
            { id: 'audit', label: 'Audit Trail', icon: <Shield className="w-4 h-4" /> },
            { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
          ],
        },
      ];
    }

    if (role === 'organizer') {
      return [
        {
          items: [
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'sessions', label: 'My Sessions', icon: <Calendar className="w-4 h-4" /> },
            { id: 'create_session', label: 'Create Session', icon: <Target className="w-4 h-4" /> },
            { id: 'participants', label: 'Participants', icon: <Users className="w-4 h-4" /> },
            { id: 'results', label: 'Results & Ranks', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'announcements', label: 'Announcements', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'resources', label: 'Resources', icon: <FileText className="w-4 h-4" /> },
            { id: 'student_profile', label: 'Student View / Profile', icon: <User className="w-4 h-4" /> },
          ],
        },
      ];
    }

    if (role === 'captain') {
      return [
        {
          items: [
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'referrals', label: 'My Referrals', icon: <Users className="w-4 h-4" /> },
            { id: 'missions', label: 'Weekly Missions', icon: <Target className="w-4 h-4" /> },
            { id: 'rewards', label: 'Rewards Tier', icon: <Award className="w-4 h-4" /> },
            { id: 'leaderboard', label: 'Captains Board', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'resources', label: 'Promotional Kit', icon: <FileText className="w-4 h-4" /> },
            { id: 'student_profile', label: 'Student View / Profile', icon: <User className="w-4 h-4" /> },
          ],
        },
      ];
    }

    // Default: Student role
    return [
      {
        items: [
          { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'practice', label: 'Practice & Past Papers', icon: <Target className="w-4 h-4" /> },
          { id: 'events', label: 'Events (Blitz & Arena)', icon: <Calendar className="w-4 h-4" /> },
          { id: 'boardy', label: 'Boardy AI Tutor', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'history', label: 'Test History', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'merit', label: 'Merit Meter', icon: <Award className="w-4 h-4" /> },
          { id: 'study_circles', label: 'Study Circles', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'reviews', label: 'Reviews', icon: <Star className="w-4 h-4" /> },
          { id: 'billing', label: 'Plans & Usage', icon: <DollarSign className="w-4 h-4" /> },
          { id: 'profile', label: 'Profile & Settings', icon: <User className="w-4 h-4" /> },
        ],
      },
    ];
  };

  const roleTheme = {
    student: {
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      activeNav: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25',
      label: 'Student Portal',
      dot: 'bg-indigo-600',
    },
    organizer: {
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200/80',
      activeNav: 'bg-teal-600 text-white shadow-md shadow-teal-500/25',
      label: 'Study Circles Organizer',
      dot: 'bg-teal-600',
    },
    captain: {
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
      activeNav: 'bg-amber-600 text-white shadow-md shadow-amber-500/25',
      label: 'Campus Captain',
      dot: 'bg-amber-600',
    },
    admin: {
      badgeBg: 'bg-violet-50 text-violet-700 border-violet-200/80',
      activeNav: 'bg-violet-600 text-white shadow-md shadow-violet-500/25',
      label: 'Admin Portal',
      dot: 'bg-violet-600',
    },
  }[role];

  const content = (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-2xl border-r border-slate-200/80 w-64 select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <img
            src="https://pub-51ccade1f191417389ac7df61830c670.r2.dev/file_0000000028e88211b439a564acc83f64.png"
            alt="Boardly Logo"
            className="h-8 sm:h-9 w-auto object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/assets/boardly-logo-transparent.png';
            }}
          />
          <div className="flex items-center gap-1.5 pl-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${roleTheme.dot}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {roleTheme.label}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {getNavItems().map((group, gIdx) => (
          <div key={`group-${gIdx}`} className="space-y-1">
            {group.items.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectNav(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    isActive
                      ? roleTheme.activeNav
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Log out */}
      {onLogout && (
        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl font-bold text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Permanent Desktop Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-30">{content}</aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div className="fixed inset-y-0 left-0 z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
