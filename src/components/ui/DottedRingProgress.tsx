interface DottedRingProgressProps {
  value: number; // current value
  max: number; // max value
  size?: number; // diameter in px
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function DottedRingProgress({
  value,
  max,
  size = 140,
  strokeWidth = 8,
  label,
  sublabel,
  className = '',
}: DottedRingProgressProps) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background dotted ring track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
        {/* Foreground active ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#D71921"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
        <span
          className="font-display tabular-nums tracking-tight"
          style={{
            fontSize: size >= 140 ? '1.875rem' : '1.25rem',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--text)',
          }}
        >
          {label ?? `${Math.round(percentage)}%`}
        </span>
        {sublabel && (
          <span
            className="text-[10px] uppercase tracking-wider font-mono mt-1"
            style={{ color: 'var(--text-faint)' }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
