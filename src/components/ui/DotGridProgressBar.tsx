interface DotGridProgressBarProps {
  value: number;
  max: number;
  segments?: number;
  className?: string;
  showLabels?: boolean;
  label?: string;
}

export function DotGridProgressBar({
  value,
  max,
  segments = 10,
  className = '',
  showLabels = true,
  label,
}: DotGridProgressBarProps) {
  const percentage = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const activeCount = Math.round(percentage * segments);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {showLabels && (
        <div className="flex justify-between items-center text-xs">
          <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {label ?? 'USAGE'}
          </span>
          <span className="font-display tabular-nums font-bold" style={{ color: 'var(--text)' }}>
            {value} <span style={{ color: 'var(--text-faint)' }}>/ {max}</span>
          </span>
        </div>
      )}
      <div className="flex items-center gap-1 w-full">
        {Array.from({ length: segments }).map((_, i) => {
          const isFilled = i < activeCount;
          return (
            <div
              key={i}
              className={`h-2.5 flex-1 rounded-sm transition-colors duration-300 ${
                isFilled
                  ? 'bg-[#D71921]'
                  : 'bg-[var(--surface-hover)] border border-[var(--border)]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
