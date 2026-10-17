interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

export function Skeleton({ width = '100%', height = 16, className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton animate-pulse rounded-xl ${className}`}
          style={{
            width,
            height,
            backgroundColor: 'var(--surface-2)',
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
