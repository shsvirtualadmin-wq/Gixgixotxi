interface DotRowStreakProps {
  days?: number; // total days in row (default 7)
  activeDays?: number; // active streak days count
  todayActive?: boolean;
  className?: string;
  labels?: string[]; // e.g. ['M', 'T', 'W', 'T', 'F', 'S', 'S']
}

export function DotRowStreak({
  days = 7,
  activeDays = 0,
  todayActive = false,
  className = '',
  labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
}: DotRowStreakProps) {
  const items = Array.from({ length: days }).map((_, i) => {
    // Current day is last item (index days - 1)
    const isToday = i === days - 1;
    // Active if within activeDays
    const isActive = isToday ? todayActive : i >= days - 1 - (activeDays - (todayActive ? 1 : 0));
    return {
      index: i,
      label: labels[i % labels.length],
      isActive,
      isToday,
    };
  });

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {items.map((item) => (
        <div key={item.index} className="flex flex-col items-center gap-1.5">
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
              item.isActive
                ? 'bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.4)]'
                : 'border border-[var(--border)] bg-[var(--surface)]'
            } ${item.isToday && !item.isActive ? 'border-[#D71921] border-dashed animate-pulse' : ''}`}
            title={item.isActive ? 'Active practice day' : 'No practice'}
          >
            {item.isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-white block" />
            )}
          </div>
          <span
            className="text-[10px] font-mono tracking-tighter"
            style={{ color: item.isActive ? 'var(--text)' : 'var(--text-faint)' }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
