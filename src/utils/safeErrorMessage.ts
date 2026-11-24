export const FRIENDLY_ERROR_MESSAGE = 'Something went wrong. Please try again.';

const TECHNICAL_ERROR_PATTERNS: RegExp[] = [
  /firestore/i,
  /firebase/i,
  /cloudflare/i,
  /\bd1\b/i,
  /\br2\b/i,
  /supabase/i,
  /sqlite/i,
  /postgres/i,
  /\bsql\b/i,
  /quota/i,
  /resource[-_\s]?exhausted/i,
  /read\s+limit/i,
  /write\s+limit/i,
  /row\s+reads?/i,
  /free\s+tier/i,
  /spark\s+plan/i,
  /blaze\s+plan/i,
  /daily\s+limit\s+exceeded/i,
  /rate\s+limit\s+exceeded/i,
  /too\s+many\s+requests/i,
  /permission[-_\s]?denied/i,
  /missing\s+or\s+insufficient\s+permissions/i,
  /failed[-_\s]?precondition/i,
  /unauthenticated/i,
  /internal\s+server\s+error/i,
  /internal_error/i,
  /bad\s+gateway/i,
  /service\s+unavailable/i,
  /gateway\s+timeout/i,
  /\bhttp\s*5\d\d\b/i,
  /\bstatus\s*5\d\d\b/i,
  /\berror\s*5\d\d\b/i,
  /\b50[0234]\b/,
  /econnrefused|econnreset|etimedout|enotfound/i,
  /failed\s+to\s+fetch/i,
  /networkerror|network\s+error|load\s+failed/i,
  /typeerror|referenceerror|syntaxerror|rangeerror/i,
  /unexpected\s+token/i,
  /json\.parse/i,
  /cannot\s+read\s+propert/i,
  /undefined\s+is\s+not/i,
  /d1_error|worker\s+threw\s+exception/i,
  /no\s+such\s+table|no\s+such\s+column/i,
  /constraint\s+failed/i,
  /stack\s*trace|\bat\s+\S+\s+\(/i,
  /projects\/[a-z0-9-]+\/databases/i,
  /googleapis\.com/i,
];

/**
 * Returns true if the message contains raw infrastructure, database, quota, or stack trace details
 * that should never be displayed to visitors.
 */
export function isTechnicalErrorMessage(message: unknown): boolean {
  const str = String(message || '').trim();
  if (!str) return true;
  if (str.length > 260) return true;
  if (str.includes('\n')) return true;
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(str));
}

/**
 * Sanitizes any error for safe display to visitors.
 * Logs the real error details to console.error for debugging / admin logs,
 * and returns "Something went wrong. Please try again." whenever the error
 * looks like a provider, database, quota, network, or internal error.
 */
export function sanitizeUserErrorMessage(
  err: unknown,
  fallback: string = FRIENDLY_ERROR_MESSAGE,
  context?: string
): string {
  let raw = '';
  let status: number | undefined;
  let code: string | undefined;
  let url: string | undefined;

  if (typeof err === 'string') {
    raw = err.trim();
  } else if (err && typeof err === 'object') {
    const e = err as Record<string, any>;
    const parsedStatus = Number(e.status || e.statusCode || 0);
    if (Number.isFinite(parsedStatus) && parsedStatus > 0) {
      status = parsedStatus;
    }
    if (typeof e.code === 'string' && e.code.trim()) {
      code = e.code.trim();
    }
    if (typeof e.url === 'string' && e.url.trim()) {
      url = e.url.trim();
    }
    raw = String(e.rawMessage || e.message || e.error || '').trim();
  }

  if (err !== undefined && err !== null) {
    console.error(`[Boardly] ${context || 'sanitizeUserErrorMessage'}:`, {
      fn: context || 'sanitizeUserErrorMessage',
      message: raw || String(err),
      status: status ?? null,
      code: code ?? null,
      url: url ?? null,
      error: err,
    });
  }

  if (status && status >= 500) {
    return fallback;
  }

  if (!raw || isTechnicalErrorMessage(raw)) {
    return fallback;
  }

  return raw;
}
