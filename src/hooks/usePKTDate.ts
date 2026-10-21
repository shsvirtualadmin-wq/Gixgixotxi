/**
 * Returns the current date in PKT (Asia/Karachi, UTC+5) as a 'YYYY-MM-DD' string.
 * Used for daily usage document keys in Firestore: users/{uid}/usage/{YYYY-MM-DD}
 */
export function getPKTDateKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
}

export function usePKTDate(): string {
  return getPKTDateKey();
}

/**
 * Returns the last 7 dates in PKT (Asia/Karachi, UTC+5) as 'YYYY-MM-DD' strings.
 */
export function getPast7PKTDateKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    keys.push(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }));
  }
  return keys;
}

