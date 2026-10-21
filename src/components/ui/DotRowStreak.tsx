import { getCurrentPKTDate, shiftPKTDate, getPKTWeekday, type SevenDayItem } from '@/services/streakEngine';

interface DotRowStreakProps {
  days?: number;
  activeDays?: number;
  todayActive?: boolean;
  className?: string;
  items?: SevenDayItem[];
}

export function DotRowStreak({
  days = 7,
  activeDays = 0,
  todayActive = false,
  className = '',
  items: directItems,
}: DotRowStreakProps) {
  // If direct items computed from streakEngine are provided, use them directly
  const renderItems = directItems && directItems.length > 0
    ? directItems
    : (() => {
        try {
          const today = getCurrentPKTDate();
          const list: SevenDayItem[] = [];
          for (let offset = days - 1; offset >= 0; offset--) {
            const dStr = shiftPKTDate(today, -offset);
            const { narrow } = getPKTWeekday(dStr);
            const isToday = offset === 0;
            // If activeDays count is given as a fallback
            const isActive = isToday ? todayActive : offset < activeDays;
            list.push({
              date: dStr,
              label: narrow || '•',
              isActive,
              isToday,
              sessionCount: isActive ? 1 : 0,
            });
          }
          return list;
        } catch {
          const fallbackDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
          return fallbackDays.slice(0, days).map((lbl, idx) => ({
            date: `day-${idx}`,
            label: lbl,
            isActive: idx < activeDays,
            isToday: idx === days - 1,
            sessionCount: idx < activeDays ? 1 : 0,
          }));
        }
      })();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {renderItems.map((item, idx) => (
        <div key={item.date || idx} className="flex flex-col items-center gap-1.5">
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
              item.isActive
                ? 'bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.4)]'
                : 'border border-[var(--border)] bg-[var(--surface)]'
            } ${item.isToday && !item.isActive ? 'border-[#D71921] border-dashed animate-pulse ring-1 ring-[#D71921]/30' : ''} ${
              item.isToday ? 'scale-105' : ''
            }`}
            title={`${item.date}: ${item.isActive ? 'Completed sessions' : item.isToday ? 'Today (pending completion)' : 'No activity'}`}
          >
            {item.isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-white block" />
            )}
          </div>
          <span
            className={`text-[10px] font-mono tracking-tighter ${
              item.isToday ? 'font-bold text-[var(--red)] underline decoration-[var(--red)]' : ''
            }`}
            style={{ color: item.isToday ? 'var(--red)' : item.isActive ? 'var(--text)' : 'var(--text-faint)' }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
