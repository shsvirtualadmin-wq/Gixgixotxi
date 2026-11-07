/**
 * Returns the date in PKT (Asia/Karachi, UTC+5) as a 'YYYY-MM-DD' string.
 * Pakistan Standard Time (Asia/Karachi) is fixed at UTC+05:00 year-round (no DST).
 * Used consistently across client and server for daily usage keys (`users/{uid}/usage/{YYYY-MM-DD}`).
 */
export function getPKTDateKey(nowMs: number = Date.now()): string {
  const pktMs = Number(nowMs) + 5 * 3600 * 1000;
  const d = new Date(pktMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function usePKTDate(): string {
  return getPKTDateKey();
}

/**
 * Returns the last 7 dates in PKT (Asia/Karachi, UTC+5) as 'YYYY-MM-DD' strings.
 */
export function getPast7PKTDateKeys(): string[] {
  const keys: string[] = [];
  const todayKey = getPKTDateKey();
  const parts = todayKey.split('-').map(Number);
  const y = parts[0] || 2026;
  const m = parts[1] || 1;
  const d = parts[2] || 1;
  for (let i = 0; i < 7; i++) {
    const utcDate = new Date(Date.UTC(y, m - 1, d - i));
    keys.push(utcDate.toISOString().slice(0, 10));
  }
  return keys;
}

