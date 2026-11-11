import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  count?: number;
}

/**
 * Base Skeleton primitive (also preserved for GrandLinePage.tsx compatibility).
 * Uses theme-matched gray surface pulse without layout shift or text.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius,
  className = '',
  count = 1,
}: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={`skeleton rounded-xl ${className}`}
          style={{
            width,
            height,
            borderRadius,
            backgroundColor: 'var(--skeleton)',
            border: '1px solid var(--border)',
            marginBottom: count > 1 ? 8 : 0,
          }}
        />
      ))}
    </>
  );
}

/**
 * Single Commons Post Card Skeleton — exact geometry of <CommonsPostCard />
 * (40px avatar circle, 2 author lines, subject chip, title + 2 body lines, bottom action bar).
 */
export const FeedPostSkeletonCard: React.FC<{ withAttachment?: boolean }> = React.memo(
  ({ withAttachment = false }) => (
    <div
      aria-hidden="true"
      className="glass-card rounded-[28px] p-4 sm:p-5 space-y-3.5 w-full max-w-full min-w-0 box-border border border-[var(--border)] bg-[var(--surface)]"
    >
      {/* Author Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full skeleton shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="h-3.5 w-36 max-w-[60%] rounded-md skeleton" />
            <div className="h-2.5 w-24 max-w-[40%] rounded-md skeleton opacity-75" />
          </div>
        </div>
        <div className="h-6 w-20 rounded-full skeleton shrink-0 opacity-80" />
      </div>

      {/* Title & Body Lines */}
      <div className="space-y-2 pt-0.5">
        <div className="h-4 w-[82%] rounded-md skeleton" />
        <div className="h-3 w-full rounded-md skeleton opacity-80" />
        <div className="h-3 w-[68%] rounded-md skeleton opacity-70" />
      </div>

      {/* Optional Attachment Box */}
      {withAttachment && (
        <div className="h-32 sm:h-40 w-full rounded-2xl skeleton opacity-75" />
      )}

      {/* Tags Row */}
      <div className="flex items-center gap-2 pt-0.5">
        <div className="h-5 w-16 rounded-full skeleton opacity-70" />
        <div className="h-5 w-20 rounded-full skeleton opacity-70" />
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border)] gap-2">
        <div className="h-8 w-20 rounded-full skeleton opacity-75" />
        <div className="h-8 w-20 rounded-full skeleton opacity-75" />
        <div className="h-8 w-16 rounded-full skeleton opacity-75" />
      </div>
    </div>
  )
);

/**
 * List of Commons Post Skeletons for initial feed load.
 */
export const FeedPostSkeletonList: React.FC<{ count?: number }> = React.memo(({ count = 3 }) => (
  <div role="status" aria-busy="true" aria-label="Loading posts" className="space-y-3 w-full">
    {Array.from({ length: count }).map((_, idx) => (
      <FeedPostSkeletonCard key={idx} withAttachment={idx === 0} />
    ))}
  </div>
));

/**
 * 2-Column University Bubble Grid Skeleton for Dashboard Overview (`Choose your university`).
 * Matches the exact height (116px) and radius of `.cockpit-uni-bubble`.
 */
export const UniversityGridSkeleton: React.FC<{ count?: number }> = React.memo(({ count = 6 }) => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading universities"
    className="cockpit-uni-grid w-full"
  >
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        aria-hidden="true"
        className="cockpit-uni-bubble pointer-events-none flex flex-col justify-between min-h-[116px]"
      >
        <div className="flex items-start justify-between gap-2 w-full">
          <div className="w-10 h-10 rounded-full skeleton shrink-0" />
          <div className="h-6 w-20 rounded-full skeleton shrink-0" />
        </div>
        <div className="mt-3.5 space-y-2 w-full">
          <div className="h-4 w-32 max-w-[75%] rounded-md skeleton" />
          <div className="h-3 w-24 max-w-[55%] rounded-md skeleton opacity-75" />
        </div>
      </div>
    ))}
  </div>
));

/**
 * Full Dashboard Overview Skeleton.
 */
export const DashboardOverviewSkeleton: React.FC = React.memo(() => (
  <div role="status" aria-busy="true" className="w-full space-y-6 pb-8">
    <div className="pt-1 space-y-2">
      <div className="h-7 w-64 max-w-[80%] rounded-lg skeleton" />
    </div>
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1.5">
          <div className="h-5 w-44 rounded-md skeleton" />
          <div className="h-3 w-64 max-w-[80vw] rounded-md skeleton opacity-75" />
        </div>
        <div className="h-6 w-28 rounded-full skeleton" />
      </div>
      <UniversityGridSkeleton count={6} />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="cockpit-surface-card p-3.5 sm:p-4 flex flex-col justify-between gap-2 min-h-[104px]"
        >
          <div className="h-3 w-24 rounded skeleton opacity-75" />
          <div className="space-y-1.5">
            <div className="h-6 w-16 rounded-md skeleton" />
            <div className="h-2.5 w-20 rounded skeleton opacity-70" />
          </div>
        </div>
      ))}
    </div>
  </div>
));

/**
 * Notification List Skeleton — matches <NotificationsPage /> rows.
 */
export const NotificationListSkeleton: React.FC<{ count?: number }> = React.memo(
  ({ count = 6 }) => (
    <div role="status" aria-busy="true" className="w-full space-y-2.5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          aria-hidden="true"
          className="rounded-2xl p-3.5 sm:p-4 border border-[var(--border)] bg-[var(--surface)] flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-full skeleton shrink-0" />
          <div className="flex-1 min-w-0 space-y-2 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <div className="h-3.5 w-40 max-w-[65%] rounded-md skeleton" />
              <div className="h-3 w-12 rounded skeleton opacity-70 shrink-0" />
            </div>
            <div className="h-3 w-[88%] rounded-md skeleton opacity-75" />
          </div>
        </div>
      ))}
    </div>
  )
);

/**
 * Streaks Page Skeleton — matches <StreaksPage /> layout.
 */
export const StreaksPageSkeleton: React.FC = React.memo(() => (
  <div role="status" aria-busy="true" className="w-full max-w-xl mx-auto px-4 py-4 space-y-4 pb-32">
    {/* Hero Flame Card */}
    <div className="rounded-[28px] p-6 border border-[var(--border)] bg-[var(--surface)] flex flex-col items-center space-y-3">
      <div className="w-16 h-16 rounded-full skeleton" />
      <div className="h-8 w-28 rounded-lg skeleton" />
      <div className="h-3.5 w-48 rounded-md skeleton opacity-75" />
      {/* 7-day strip */}
      <div className="grid grid-cols-7 gap-2 w-full pt-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl skeleton" />
        ))}
      </div>
    </div>
    {/* 2x2 Stat Grid */}
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl p-4 border border-[var(--border)] bg-[var(--surface)] space-y-2 min-h-[88px]"
        >
          <div className="h-3 w-20 rounded skeleton opacity-75" />
          <div className="h-6 w-14 rounded-md skeleton" />
        </div>
      ))}
    </div>
    {/* Badges card */}
    <div className="rounded-[24px] p-5 border border-[var(--border)] bg-[var(--surface)] space-y-3">
      <div className="h-4 w-36 rounded-md skeleton" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl skeleton" />
        ))}
      </div>
    </div>
  </div>
));

/**
 * Messages / Conversations Skeleton — matches <MessagesPage /> layout.
 */
export const MessagesListSkeleton: React.FC<{ count?: number }> = React.memo(({ count = 5 }) => (
  <div role="status" aria-busy="true" className="w-full space-y-2.5">
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        aria-hidden="true"
        className="rounded-2xl p-3.5 border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3"
      >
        <div className="w-11 h-11 rounded-full skeleton shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="h-3.5 w-32 rounded-md skeleton" />
            <div className="h-2.5 w-10 rounded skeleton opacity-70" />
          </div>
          <div className="h-3 w-[72%] rounded-md skeleton opacity-75" />
        </div>
      </div>
    ))}
  </div>
));

/**
 * Crew / Study Squad Skeleton — matches <CrewDashboardPage /> layout.
 */
export const CrewDashboardSkeleton: React.FC = React.memo(() => (
  <div role="status" aria-busy="true" className="w-full max-w-3xl mx-auto space-y-4 pb-28">
    <div className="rounded-[28px] p-5 border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-4">
      <div className="space-y-2 flex-1">
        <div className="h-6 w-44 rounded-lg skeleton" />
        <div className="h-3.5 w-60 max-w-[80%] rounded-md skeleton opacity-75" />
      </div>
      <div className="w-20 h-20 rounded-full skeleton shrink-0" />
    </div>
    <div className="rounded-[24px] p-4 border border-[var(--border)] bg-[var(--surface)] space-y-3">
      <div className="h-4 w-36 rounded-md skeleton" />
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full skeleton shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 rounded skeleton" />
              <div className="h-2.5 w-16 rounded skeleton opacity-70" />
            </div>
          </div>
          <div className="h-5 w-14 rounded-full skeleton" />
        </div>
      ))}
    </div>
  </div>
));

/**
 * Certificates Section Skeleton — replaces "Loading your official Grand Line certificates..." text.
 */
export const CertificatesSectionSkeleton: React.FC = React.memo(() => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading certificates"
    className="cockpit-surface-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
  >
    <div className="space-y-2 flex-1 w-full">
      <div className="h-4 w-48 rounded-md skeleton" />
      <div className="h-3 w-full max-w-lg rounded-md skeleton opacity-75" />
      <div className="h-3 w-3/4 max-w-md rounded-md skeleton opacity-70" />
    </div>
    <div className="h-11 w-40 rounded-xl skeleton shrink-0" />
  </div>
));

/**
 * Route-aware Page Skeleton so any Suspense fallback or page loader shows the exact shape
 * of the target screen with zero text loaders.
 */
export const RoutePageSkeleton: React.FC<{ pathname?: string }> = React.memo(({ pathname }) => {
  const clean = (
    pathname || (typeof window !== 'undefined' ? window.location.pathname : '')
  ).toLowerCase();

  if (
    clean.startsWith('/commons') ||
    clean.startsWith('/dashboard/commons') ||
    clean === '/saved'
  ) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-3">
        <FeedPostSkeletonList count={3} />
      </div>
    );
  }
  if (clean.startsWith('/dashboard/notifications') || clean === '/notifications') {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-3 pt-2">
        <NotificationListSkeleton count={6} />
      </div>
    );
  }
  if (clean.startsWith('/dashboard/streaks')) {
    return <StreaksPageSkeleton />;
  }
  if (clean.startsWith('/dashboard/messages') || clean === '/messages') {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-3 pt-2">
        <MessagesListSkeleton count={6} />
      </div>
    );
  }
  if (clean.startsWith('/dashboard/crew') || clean.startsWith('/crew')) {
    return <CrewDashboardSkeleton />;
  }
  return <DashboardOverviewSkeleton />;
});
