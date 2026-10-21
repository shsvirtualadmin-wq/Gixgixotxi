/**
 * Returns the current date in PKT (Asia/Karachi, UTC+5) as a 'YYYY-MM-DD' string.
 * Used for daily usage document keys in Firestore: users/{uid}/usage/{YYYY-MM-DD}
 */
export function getPKTDateKey(): string {
  try {
    const s = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
  } catch {
    // ignore
  }
  const pktMs = Date.now() + 5 * 3600 * 1000;
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

