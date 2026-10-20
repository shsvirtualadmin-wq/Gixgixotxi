import React, { useMemo } from 'react';

interface StudyHeatmapProps {
  // Map of YYYY-MM-DD to count of questions solved, or array of active dates
  activityMap?: Record<string, number>;
  accentColor?: string;
}

/**
 * 12-Week Study Activity Heatmap
 * Displays 84 days (12 weeks x 7 days) in a GitHub contribution-style grid.
 * Squares are shaded based on MCQs solved per day.
 */
export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({
  activityMap = {},
  accentColor = '#E11D48',
}) => {
  const days = useMemo(() => {
    const list: { dateStr: string; dayOfWeek: number; count: number }[] = [];
    const now = new Date();
    // 84 days ago up to today
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const count = activityMap[dateStr] || 0;
      list.push({
        dateStr,
        dayOfWeek: d.getDay(), // 0 = Sun, 1 = Mon ...
        count,
      });
    }
    return list;
  }, [activityMap]);

  // Arrange into 12 columns of 7 days
  const weeks = useMemo(() => {
    const res: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      res.push(days.slice(i, i + 7));
    }
    return res;
  }, [days]);

  const totalActiveDays = useMemo(() => {
    return days.filter((d) => d.count > 0).length;
  }, [days]);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span className="font-heading font-semibold text-[var(--text)]">12-Week Study Heatmap</span>
        <span className="font-mono text-[11px]">{totalActiveDays} active study days</span>
      </div>

      <div className="w-full overflow-x-auto pb-1 scrollbar-none">
        <div className="inline-flex gap-1.5 p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] min-w-[280px]">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((day) => {
                let opacity = '0.08';
                if (day.count > 0) opacity = '0.35';
                if (day.count >= 10) opacity = '0.65';
                if (day.count >= 25) opacity = '0.9';

                return (
                  <div
                    key={day.dateStr}
                    title={`${day.dateStr}: ${day.count} MCQs solved`}
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm transition-all duration-200 hover:scale-125"
                    style={{
                      backgroundColor: day.count > 0 ? accentColor : 'var(--text)',
                      opacity,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-[var(--muted)] font-mono px-1">
        <span>12 weeks ago</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-[var(--text)] opacity-10" />
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accentColor, opacity: 0.35 }} />
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accentColor, opacity: 0.65 }} />
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accentColor, opacity: 0.95 }} />
          <span>More</span>
        </div>
        <span>Today</span>
      </div>
    </div>
  );
};
