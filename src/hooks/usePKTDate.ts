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
