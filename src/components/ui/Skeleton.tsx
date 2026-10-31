interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  count?: number;
}

/**
 * Preserved solely for GrandLinePage.tsx (per hard rule: do not touch Grand Line).
 * All other pages use <LineLoader />.
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
