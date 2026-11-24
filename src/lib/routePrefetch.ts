// ─── Route Chunk & Data Prefetching for Instant Tab Switching ───────────────
const prefetchedTabs = new Set<string>();

export function prefetchTabRouteAndData(tabId: string, uid?: string | null): void {
  const key = `${tabId}:${uid || 'anon'}`;
  if (prefetchedTabs.has(key)) return;
  prefetchedTabs.add(key);

  switch (tabId) {
    case 'commons': {
      void import('@/pages/commons/CommonsFeedPage').catch(() => {});
      void import('@/services/commonsService')
        .then((m) => m.fetchCommonsPosts({ feedTab: 'all', pageSize: 15, currentUid: uid }))
        .catch(() => {});
      break;
    }
    case 'home':
    case 'overview': {
      void import('@/pages/dashboard/OverviewPage').catch(() => {});
      void import('@/services/universityMcqService')
        .then((m) => m.fetchUniversities())
        .catch(() => {});
      break;
    }
    case 'practice': {
      void import('@/pages/dashboard/PracticePage').catch(() => {});
      void import('@/services/universityMcqService')
        .then((m) => m.fetchUniversities())
        .catch(() => {});
      break;
    }
    case 'notifications': {
      void import('@/pages/dashboard/NotificationsPage').catch(() => {});
      if (uid && !uid.startsWith('guest_')) {
        void import('@/services/notificationService')
          .then((m) => m.syncUserNotificationsStore(uid))
          .catch(() => {});
      }
      break;
    }
    case 'streaks': {
      void import('@/pages/dashboard/StreaksPage').catch(() => {});
      break;
    }
    case 'messages': {
      void import('@/pages/dashboard/MessagesPage').catch(() => {});
      if (uid && !uid.startsWith('guest_')) {
        void import('@/services/chatService')
          .then((m) => m.prefetchUserChats(uid))
          .catch(() => {});
      }
      break;
    }
    case 'crew': {
      void import('@/pages/crew/CrewDashboardPage').catch(() => {});
      break;
    }
    case 'profile': {
      void import('@/pages/dashboard/ProfilePage').catch(() => {});
      break;
    }
    case 'menu':
    case 'settings': {
      void import('@/pages/dashboard/SettingsPage').catch(() => {});
      void import('@/components/settings/BoardlySettingsFlow').catch(() => {});
      break;
    }
    case 'rewards': {
      void import('@/pages/RewardsPage').catch(() => {});
      void import('@/services/rewardsService')
        .then((m) => m.prefetchRewardsSummary(uid))
        .catch(() => {});
      break;
    }
    case 'store': {
      void import('@/pages/store/StorePage').catch(() => {});
      break;
    }
    case 'ai': {
      void import('@/pages/dashboard/AiMentorsPage').catch(() => {});
      break;
    }
    case 'admin': {
      void import('@/components/admin/AdminGuard').catch(() => {});
      void import('@/components/admin/AdminLayout').catch(() => {});
      void import('@/pages/admin/AdminOverviewPage').catch(() => {});
      break;
    }
    default:
      break;
  }
}

let idlePrefetchScheduled = false;

/**
 * Schedules background prefetching of all bottom-nav tabs (including Menu/Settings)
 * and heavy pages during idle time after initial paint so switching tabs feels instant.
 */
export function scheduleIdleTabPrefetch(uid?: string | null): void {
  if (typeof window === 'undefined' || idlePrefetchScheduled) return;
  // Respect Data Saver mode on mobile connections
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  if (nav.connection?.saveData || nav.connection?.effectiveType === '2g') {
    return;
  }
  idlePrefetchScheduled = true;

  const scheduleIdle = (cb: () => void, timeout: number) => {
    if ('requestIdleCallback' in window) {
      (
        window as Window & {
          requestIdleCallback: (fn: () => void, opts?: { timeout: number }) => number;
        }
      ).requestIdleCallback(cb, { timeout });
    } else {
      setTimeout(cb, Math.min(timeout, 600));
    }
  };

  // Phase 1: Core bottom-nav tabs & hamburger menu (high priority after first paint)
  scheduleIdle(() => {
    const coreTabs = ['menu', 'commons', 'messages', 'streaks', 'crew', 'home'];
    coreTabs.forEach((tab, idx) => {
      setTimeout(() => {
        prefetchTabRouteAndData(tab, uid);
      }, idx * 120);
    });
  }, 1200);

  // Phase 2: Heavy secondary pages preloaded gently in idle time
  scheduleIdle(() => {
    const secondary = ['profile', 'practice', 'store', 'rewards', 'ai'];
    secondary.forEach((tab, idx) => {
      setTimeout(() => {
        prefetchTabRouteAndData(tab, uid);
      }, idx * 260);
    });
  }, 3500);
}
