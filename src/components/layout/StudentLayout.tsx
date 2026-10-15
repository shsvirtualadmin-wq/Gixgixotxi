import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Target,
  BookOpen,
  History,
  Calculator,
  Compass,
  Trophy,
  Users,
  Sparkles,
  TrendingUp,
  CreditCard,
  Star,
  Settings,
  Flame,
  Bell,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../marketing/BrandLogo';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, logFirestoreError } from '../../lib/firebase';

export interface StudentLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority?: string;
  linkUrl?: string;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  const { user, profile, isAdmin, logOut, activeRole, switchRole, availableRoles } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('boardly_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const [showMobileMore, setShowMobileMore] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState<boolean>(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState<boolean>(false);

  // Fetch real announcements for students
  useEffect(() => {
    let isMounted = true;
    const fetchAnnouncements = async () => {
      setAnnouncementsLoading(true);
      try {
        const q = query(
          collection(db, 'announcements'),
          orderBy('publishedAt', 'desc'),
          limit(5)
        );
        const snap = await getDocs(q);
        if (isMounted) {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
          setAnnouncements(list);
        }
      } catch (err) {
        logFirestoreError('announcements', err, 'student_layout_announcements');
      } finally {
        if (isMounted) setAnnouncementsLoading(false);
      }
    };

    fetchAnnouncements();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('boardly_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const navItems = [
    { id: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: '/dashboard/practice', label: 'Practice Vault', icon: Target },
    { id: '/dashboard/chapter-map', label: 'Chapter Map', icon: Layers },
    { id: '/dashboard/formula-vault', label: 'Formula Vault', icon: BookOpen },
    { id: '/dashboard/history', label: 'Test History', icon: History },
    { id: '/dashboard/merit-meter', label: 'Merit Meter', icon: Calculator },
    { id: '/dashboard/universities', label: 'Universities', icon: Compass },
    { id: '/dashboard/events', label: 'Events & Arena', icon: Trophy },
    { id: '/dashboard/study-circles', label: 'Study Circles', icon: Users },
    { id: '/dashboard/ai-tutor', label: 'Boardy AI Tutor', icon: Sparkles },
    { id: '/dashboard/growth', label: 'Growth & Planner', icon: TrendingUp },
    { id: '/dashboard/plans', label: 'Plans & Limits', icon: CreditCard },
    { id: '/dashboard/reviews', label: 'Reviews', icon: Star },
    { id: '/dashboard/profile', label: 'Profile & Settings', icon: Settings },
  ];

  // Mobile bottom bar primary 5 items
  const mobileNavItems = [
    { id: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: '/dashboard/practice', label: 'Practice', icon: Target },
    { id: '/dashboard/events', label: 'Arena', icon: Trophy },
    { id: '/dashboard/ai-tutor', label: 'Boardy AI', icon: Sparkles },
  ];

  const streakCount = profile?.streak ?? profile?.streakDays ?? 0;
  const planLabel = profile?.plan === 'pro' || profile?.plan === 'premium' ? 'PRO' : 'FREE';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans selection:bg-[var(--brand)] selection:text-white">
      {/* Top Glass Sticky Header */}
      <header className="sticky top-0 z-40 h-16 w-full border-b border-white/8 bg-[#070B14]/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded-lg p-1"
          >
            <BrandLogo size="sm" />
          </button>

          {/* Desktop Sidebar Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer border border-white/8"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Right Header Stats & Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Announcements Bell / Ticker */}
          <button
            type="button"
            onClick={() => setShowAnnouncementsModal(true)}
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
            title="Announcements"
          >
            <Bell className="w-4 h-4" />
            {announcements.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#22D3EE] ring-2 ring-[#070B14]" />
            )}
          </button>

          {/* Study Streak Pill */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold"
            title={`${streakCount} day study streak`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{streakCount}d</span>
          </div>

          {/* Plan Badge */}
          <Badge
            variant={planLabel === 'PRO' ? 'student' : 'default'}
            size="sm"
            className="font-mono font-bold"
          >
            {planLabel}
          </Badge>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2F6BFF] to-[#22D3EE] text-white font-bold text-xs flex items-center justify-center border border-white/20 shadow-[0_0_12px_rgba(47,107,255,0.4)] cursor-pointer"
            >
              {(profile?.name || user?.email || 'S').charAt(0).toUpperCase()}
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0E1626] border border-white/12 shadow-2xl p-3 z-50 text-left space-y-2"
                >
                  <div className="px-3 py-2 border-b border-white/8">
                    <p className="text-xs font-bold text-white truncate">
                      {profile?.name || 'Verified Student'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {user?.email}
                    </p>
                    {profile?.targetUniversity && (
                      <p className="text-[10px] text-[var(--brand-2)] font-mono mt-0.5">
                        Target: {profile.targetUniversity}
                      </p>
                    )}
                  </div>

                  {/* Role Switcher if Multi-Role */}
                  {availableRoles && availableRoles.length > 1 && (
                    <div className="px-3 py-1 space-y-1">
                      <span className="text-[10px] font-semibold text-[var(--text-faint)] uppercase tracking-wider block">
                        Switch Workspace
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {availableRoles.map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              switchRole(r);
                              setShowProfileMenu(false);
                              if (r === 'admin') onNavigate('/admin');
                              else if (r === 'captain') onNavigate('/captain/dashboard');
                              else if (r === 'crew') onNavigate('/crew/dashboard');
                              else onNavigate('/dashboard');
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize border ${
                              activeRole === r
                                ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                                : 'bg-white/5 text-[var(--text-muted)] border-white/8 hover:border-white/15'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onNavigate('/dashboard/profile');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Profile & Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onNavigate('/dashboard/plans');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Upgrade / Plan Limits</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        logOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex w-full relative">
        {/* Desktop Sidebar (240px or Collapsed 72px) */}
        <aside
          className={`hidden md:flex flex-col border-r border-white/8 bg-[#070B14]/60 backdrop-blur-xl transition-all duration-200 shrink-0 select-none ${
            sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
          }`}
        >
          <div className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.id === '/dashboard'
                  ? currentPath === '/dashboard' || currentPath === '/app'
                  : currentPath === item.id || currentPath.startsWith(`${item.id}/`);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2F6BFF]/20 to-[#22D3EE]/10 text-white border border-[#2F6BFF]/40 shadow-[0_0_16px_-4px_rgba(47,107,255,0.4)]'
                      : 'text-[var(--text-muted)] hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#22D3EE]' : 'text-[var(--text-faint)]'
                    }`}
                  />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer Link */}
          {!sidebarCollapsed && (
            <div className="p-3 border-t border-white/8 text-[11px] text-[var(--text-faint)] flex items-center justify-between">
              <span>National Syllabus v2026</span>
              <a
                href="https://wa.me/923000000000"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[var(--brand-2)] transition-colors flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Help</span>
              </a>
            </div>
          )}
        </aside>

        {/* Main Content Area: 12-column Grid with max-w-[1280px] */}
        <main className="flex-1 w-full max-w-[1280px] mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (5 Items: 4 tabs + More) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#070B14]/90 backdrop-blur-2xl border-t border-white/10 px-2 flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.id === '/dashboard'
              ? currentPath === '/dashboard' || currentPath === '/app'
              : currentPath === item.id || currentPath.startsWith(`${item.id}/`);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
                isActive ? 'text-[#22D3EE]' : 'text-[var(--text-faint)] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* "More" Sheet Trigger */}
        <button
          type="button"
          onClick={() => setShowMobileMore(true)}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
            showMobileMore ? 'text-[#22D3EE]' : 'text-[var(--text-faint)] hover:text-white'
          }`}
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] font-bold tracking-tight">More</span>
        </button>
      </nav>

      {/* Mobile "More" Bottom Sheet */}
      <AnimatePresence>
        {showMobileMore && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMore(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full max-h-[85vh] bg-[#0E1626] border-t border-white/15 rounded-t-3xl p-6 overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div className="flex items-center gap-2">
                  <Menu className="w-5 h-5 text-[var(--brand-2)]" />
                  <h3 className="text-base font-bold text-white font-display">Study Cockpit Menu</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileMore(false)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[var(--text-muted)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Working grid items */}
              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { path: '/dashboard/events', label: 'Arena & Blitz', icon: Trophy },
                  { path: '/dashboard/chapter-map', label: 'Chapter Map', icon: Layers },
                  { path: '/dashboard/formula-vault', label: 'Formula Vault', icon: BookOpen },
                  { path: '/dashboard/practice', label: 'Paper Vault', icon: Target },
                  { path: '/dashboard/growth', label: 'Growth & Planner', icon: TrendingUp },
                  { path: '/dashboard/plans', label: 'Daily Limits', icon: CreditCard },
                  { path: '/dashboard/merit-meter', label: 'Merit Meter', icon: Calculator },
                  { path: '/dashboard/universities', label: 'Universities', icon: Compass },
                  { path: '/dashboard/study-circles', label: 'Study Circles', icon: Users },
                  { path: '/dashboard/reviews', label: 'Platform Reviews', icon: Star },
                  { path: '/dashboard/profile', label: 'Settings', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setShowMobileMore(false);
                        onNavigate(item.path);
                      }}
                      className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/8 flex items-center gap-3 text-left transition-colors cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-[var(--brand-2)] shrink-0" />
                      <span className="text-xs font-bold text-white truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Community & Ambassador Actions */}
              <div className="pt-2 border-t border-white/8 space-y-2">
                <a
                  href="/crew/apply"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowMobileMore(false);
                    onNavigate('/crew/apply');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#7C5CFF]/20 to-[#E879F9]/20 border border-[#7C5CFF]/40 text-[#E879F9] flex items-center justify-between text-xs font-bold"
                >
                  <span>Join Boardly Crew (Earn PKR 20k/mo)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href="https://whatsapp.com/channel/0029Vaexample"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between text-xs font-bold"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Join Official WhatsApp Channel
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Announcements Modal */}
      <AnimatePresence>
        {showAnnouncementsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAnnouncementsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-3xl bg-[#0E1626] border border-white/15 p-6 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-white/8 pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[var(--brand-2)]" />
                  <h3 className="text-base font-bold text-white font-display">Exam Bulletins</h3>
                </div>
                <button
                  onClick={() => setShowAnnouncementsModal(false)}
                  className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-[var(--text-muted)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {announcements.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] py-6 text-center">
                    No active bulletins. All entry test systems are nominal.
                  </p>
                ) : (
                  announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-2xl bg-white/5 border border-white/8 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">{ann.title}</h4>
                        {ann.priority === 'urgent' && (
                          <Badge variant="danger" size="sm">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {ann.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
