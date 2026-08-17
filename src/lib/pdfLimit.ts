import { supabase } from './supabase';

export interface PdfLimitCheckResult {
  allowed: boolean;
  reason?: 'FREE_USER' | 'RATE_LIMIT_EXCEEDED' | 'DAILY_LIMIT_REACHED' | 'ERROR' | string;
  isPro?: boolean;
  message?: string;
  lastPdfDownloadDate?: string;
  lastPdfDownloadAt?: string;
  nextAvailableAt?: string;
  remainingMs?: number;
  serverDate?: string;
}

export async function checkAndRecordPdfDownload(
  userId?: string,
  userEmail?: string,
  isPro?: boolean,
  packageName?: string,
  userProfile?: any
): Promise<PdfLimitCheckResult> {
  // If user is Pro according to parameters, immediately return allowed: true (unlimited downloads for Pro)
  if (isPro) {
    // Fire background request to server to record timestamp without waiting
    fetch('/api/check-pdf-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userEmail, isPro: true, packageName, userProfile }),
    }).catch(() => {});

    return {
      allowed: true,
      isPro: true,
      message: 'PDF download authorized',
      serverDate: new Date().toISOString(),
    };
  }

  try {
    let authHeader = '';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        authHeader = `Bearer ${session.access_token}`;
      }
    } catch (e) {}

    if (!authHeader) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth-token') || key.includes('supabase.auth'))) {
          try {
            const val = localStorage.getItem(key);
            if (val) {
              const parsed = JSON.parse(val);
              const token = parsed?.currentSession?.access_token || parsed?.access_token || parsed?.token;
              if (token) {
                authHeader = `Bearer ${token}`;
                break;
              }
            }
          } catch (e) {}
        }
      }
    }

    const res = await fetch('/api/check-pdf-download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        userId,
        userEmail,
        isPro,
        packageName,
        userProfile,
      }),
    });

    const data = await res.json().catch(() => ({}));

    // If response says isPro is true or allowed is true, allow download immediately (no cooldown for Pro users)
    if (data.isPro || data.allowed) {
      return {
        allowed: true,
        isPro: true,
        message: data.message || 'PDF download authorized',
        lastPdfDownloadDate: data.lastPdfDownloadDate,
        lastPdfDownloadAt: data.lastPdfDownloadAt,
        serverDate: data.serverDate,
      };
    }

    if (!res.ok || data.allowed === false) {
      return {
        allowed: false,
        reason: data.reason || 'FREE_USER',
        isPro: false,
        message:
          data.message || 'PDF downloads are a Pro feature — upgrade to unlock unlimited access',
        remainingMs: data.remainingMs,
        nextAvailableAt: data.nextAvailableAt,
        lastPdfDownloadAt: data.lastPdfDownloadAt,
        lastPdfDownloadDate: data.lastPdfDownloadDate,
        serverDate: data.serverDate,
      };
    }

    return {
      allowed: Boolean(data.allowed),
      reason: data.reason,
      isPro: data.isPro,
      message: data.message,
      lastPdfDownloadDate: data.lastPdfDownloadDate,
      lastPdfDownloadAt: data.lastPdfDownloadAt,
      nextAvailableAt: data.nextAvailableAt,
      remainingMs: data.remainingMs,
      serverDate: data.serverDate,
    };
  } catch (err: any) {
    console.error('[pdfLimit] Error contacting server check-pdf-download API:', err);
    return {
      allowed: false,
      reason: 'ERROR',
      message: 'Failed to verify download permissions with server. Please check your connection and try again.',
    };
  }
}
