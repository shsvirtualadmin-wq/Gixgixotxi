/**
 * Detects whether an error is caused by Firebase / Firestore resource exhaustion (quota exceeded).
 */
export function isQuotaExhaustedError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as { code?: string; message?: string };
  const c = (anyErr.code || '').toLowerCase();
  const m = (anyErr.message || '').toLowerCase();
  return (
    c.includes('resource-exhausted') ||
    c.includes('quota') ||
    m.includes('resource-exhausted') ||
    m.includes('resource has been exhausted') ||
    m.includes('quota exceeded') ||
    m.includes('daily database limit')
  );
}
