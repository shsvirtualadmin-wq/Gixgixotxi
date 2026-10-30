interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  count?: number;
}

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

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`glass ${className}`}
      style={{ borderRadius: 'var(--r-card)', padding: '1.5rem' }}
    >
      <Skeleton height={20} width="60%" />
      <div style={{ marginTop: 12 }}>
        <Skeleton height={14} count={3} />
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder matching the Boardly Commons feed post card layout.
 */
export function CommonsPostCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">Loading posts</span>
      {Array.from({ length: count }).map((_, n) => (
        <div
          key={n}
          aria-hidden="true"
          className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3"
        >
          {/* Header: avatar + author/time + type badge */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full skeleton shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="w-32 h-3.5 skeleton rounded" />
                <div className="w-20 h-2.5 skeleton rounded" />
              </div>
            </div>
            <div className="w-20 h-5 skeleton rounded-full shrink-0" />
          </div>

          {/* Post title */}
          <div className="w-3/4 h-4 skeleton rounded mt-2" />

          {/* Post body preview */}
          <div className="space-y-2">
            <div className="w-full h-3 skeleton rounded" />
            <div className="w-5/6 h-3 skeleton rounded" />
          </div>

          {/* Footer actions */}
          <div className="pt-2.5 border-t border-border flex items-center justify-between">
            <div className="w-16 h-4 skeleton rounded" />
            <div className="w-16 h-4 skeleton rounded" />
            <div className="w-16 h-4 skeleton rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton placeholder matching the Study Material Library card layout.
 */
export function MaterialCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <span className="sr-only">Loading study materials</span>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="glass-card p-6 flex flex-col justify-between gap-4"
        >
          <div>
            {/* Subject / type label + file size pill */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="w-32 h-3 skeleton rounded" />
              <div className="w-14 h-4 skeleton rounded-full" />
            </div>

            {/* Material title */}
            <div className="w-4/5 h-5 skeleton rounded mb-2.5" />

            {/* Material description (2 lines) */}
            <div className="space-y-2">
              <div className="w-full h-3 skeleton rounded" />
              <div className="w-2/3 h-3 skeleton rounded" />
            </div>
          </div>

          {/* Footer: uploader name + Details & Download buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="w-24 h-3 skeleton rounded" />
            <div className="flex items-center gap-2">
              <div className="w-16 h-7 skeleton rounded-full" />
              <div className="w-20 h-7 skeleton rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
