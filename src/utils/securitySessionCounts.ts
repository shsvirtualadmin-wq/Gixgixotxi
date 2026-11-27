import type {
  ActiveSessionItem,
  SecurityRecommendation,
  SecuritySummary,
} from '@/services/securityCenterService';

export interface ConsistentSessionCounts {
  totalActiveSessions: number;
  currentSessionsCount: number;
  otherActiveSessions: number;
}

/**
 * Computes consistent active session counts where:
 *   otherActiveSessions = totalActiveSessions - currentSessionsCount
 *
 * When the full sessions list is loaded, it is the single source of truth so
 * the overview badge, the recommendation banner, and the sessions list can
 * never disagree (including immediately after revoking a session or when SWR
 * cache entries refresh at different times).
 */
export function computeConsistentSessionCounts(
  sessions: readonly Pick<ActiveSessionItem, 'id' | 'isCurrent'>[],
  sessionsLoaded: boolean,
  summaryActiveSessionsCount?: number | null
): ConsistentSessionCounts {
  if (sessionsLoaded) {
    const totalActiveSessions = sessions.length;
    if (totalActiveSessions === 0) {
      return {
        totalActiveSessions: 0,
        currentSessionsCount: 0,
        otherActiveSessions: 0,
      };
    }
    const currentSessionsCount = 1;
    const otherActiveSessions = Math.max(0, totalActiveSessions - currentSessionsCount);
    return {
      totalActiveSessions,
      currentSessionsCount,
      otherActiveSessions,
    };
  }

  const rawTotal =
    typeof summaryActiveSessionsCount === 'number' &&
    Number.isFinite(summaryActiveSessionsCount)
      ? Math.max(0, Math.floor(summaryActiveSessionsCount))
      : 0;
  const currentSessionsCount = rawTotal > 0 ? 1 : 0;
  const otherActiveSessions = Math.max(0, rawTotal - currentSessionsCount);

  return {
    totalActiveSessions: rawTotal,
    currentSessionsCount,
    otherActiveSessions,
  };
}

export function formatOtherSessionsRecommendationTitle(otherSessionsCount: number): string {
  return `Review ${otherSessionsCount} other active ${
    otherSessionsCount === 1 ? 'session' : 'sessions'
  }`;
}

/**
 * Reconciles a SecuritySummary with the live sessions list so that:
 * - activeSessionsCount matches the sessions list length once loaded
 * - otherActiveSessionsCount / unknownSessionsCount === total - current session
 * - the "Review N other active sessions" recommendation always uses that exact N
 *   (and is removed when N === 0).
 */
export function reconcileSecuritySummaryWithSessions(
  summary: SecuritySummary | null,
  sessions: readonly Pick<ActiveSessionItem, 'id' | 'isCurrent'>[],
  sessionsLoaded: boolean
): SecuritySummary | null {
  if (!summary) return null;

  const counts = computeConsistentSessionCounts(
    sessions,
    sessionsLoaded,
    summary.activeSessionsCount
  );

  const nonSessionRecs: SecurityRecommendation[] = (summary.recommendations || []).filter(
    (rec) => rec.id !== 'unknown_session'
  );

  const recommendations: SecurityRecommendation[] = [...nonSessionRecs];
  if (counts.otherActiveSessions > 0) {
    recommendations.push({
      id: 'unknown_session',
      title: formatOtherSessionsRecommendationTitle(counts.otherActiveSessions),
      subtitle: 'Sign out devices you do not recognize.',
      actionLabel: 'Review',
      targetSection: 'sessions',
    });
  }

  return {
    ...summary,
    activeSessionsCount: counts.totalActiveSessions,
    otherActiveSessionsCount: counts.otherActiveSessions,
    unknownSessionsCount: counts.otherActiveSessions,
    recommendations,
    hasRecommendations: recommendations.length > 0,
  };
}
