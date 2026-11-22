import { fetchCommonsPosts } from '@/services/commonsService';
import { syncUserNotificationsStore } from '@/services/notificationService';
import { prefetchUserChats } from '@/services/chatService';
import { prefetchRewardsSummary } from '@/services/rewardsService';

// ─── Route Chunk & Data Prefetching for Instant Tab Switching ───────────────
const prefetchedTabs = new Set<string>();

export function prefetchTabRouteAndData(tabId: string, uid?: string | null): void {
  const key = `${tabId}:${uid || 'anon'}`;
  if (prefetchedTabs.has(key)) return;
  prefetchedTabs.add(key);

  switch (tabId) {
    case 'commons': {
      void import('@/pages/commons/CommonsFeedPage').catch(() => {});
      void fetchCommonsPosts({ feedTab: 'all', pageSize: 15, currentUid: uid }).catch(() => {});
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
        void Promise.resolve(syncUserNotificationsStore(uid)).catch(() => {});
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
        void Promise.resolve(prefetchUserChats(uid)).catch(() => {});
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
    case 'rewards': {
      void import('@/pages/RewardsPage').catch(() => {});
      void Promise.resolve(prefetchRewardsSummary(uid)).catch(() => {});
      break;
    }
    default:
      break;
  }
}

let idlePrefetchScheduled = false;

/**
 * Schedules background prefetching of core dock tabs and Rewards summary after initial paint + idle
 * so the first tap on any bottom-nav tab or the Rewards page is instant.
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

  const runPrefetch = () => {
    const tabs = ['commons', 'home', 'rewards', 'streaks', 'messages', 'crew'];
    tabs.forEach((tab, idx) => {
      setTimeout(() => {
        prefetchTabRouteAndData(tab, uid);
      }, idx * 160);
    });
  };

  if ('requestIdleCallback' in window) {
    (
      window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
      }
    ).requestIdleCallback(runPrefetch, { timeout: 2000 });
  } else {
    setTimeout(runPrefetch, 900);
  }
}
