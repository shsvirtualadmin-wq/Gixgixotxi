/**
 * Live debug logger and redirect tracker for Boardly.
 * Activated when ?debug=1 is in the URL.
 */

export interface RedirectEvent {
  id: string;
  from: string;
  to: string;
  trigger: string;
  timestamp: number;
  timeStr: string;
}

export interface UserDocFetchStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  code?: string;
  message?: string;
  durationMs?: number;
  docExists?: boolean;
  updatedAt: number;
}

class DebugTracker {
  private redirects: RedirectEvent[] = [];
  private listeners: Set<() => void> = new Set();
  private userFetchStatus: UserDocFetchStatus = {
    status: 'idle',
    updatedAt: Date.now(),
  };

  public isDebugMode(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('debug') === '1' || localStorage.getItem('boardly_debug') === '1';
    } catch {
      return false;
    }
  }

  public enableDebugMode(enable = true): void {
    if (typeof window === 'undefined') return;
    if (enable) {
      localStorage.setItem('boardly_debug', '1');
    } else {
      localStorage.removeItem('boardly_debug');
    }
    this.notify();
  }

  public recordRedirect(from: string, to: string, trigger: string): void {
    const event: RedirectEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      from,
      to,
      trigger,
      timestamp: Date.now(),
      timeStr: new Date().toLocaleTimeString(),
    };

    this.redirects.unshift(event);
    if (this.redirects.length > 5) {
      this.redirects = this.redirects.slice(0, 5);
    }

    console.log(
      `%c[Boardly Redirect] ${event.timeStr} | ${from} -> ${to} | Trigger: ${trigger}`,
      'background: #450a0a; color: #f87171; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
    );

    this.notify();
  }

  public recordUserFetch(status: UserDocFetchStatus): void {
    this.userFetchStatus = status;
    const dur = status.durationMs !== undefined ? ` (${status.durationMs}ms)` : '';
    const err = status.message ? ` - ${status.message}` : '';
    console.log(
      `%c[Boardly Firestore] users/{uid} fetch: ${status.status}${dur}${err} | exists: ${status.docExists ?? 'unknown'}`,
      status.status === 'error'
        ? 'background: #450a0a; color: #f87171; font-weight: bold; padding: 2px 6px;'
        : 'background: #064e3b; color: #34d399; font-weight: bold; padding: 2px 6px;'
    );
    this.notify();
  }

  public getUserFetchStatus(): UserDocFetchStatus {
    return this.userFetchStatus;
  }

  public getRedirects(): RedirectEvent[] {
    return this.redirects;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

export const debugTracker = new DebugTracker();

export function logRedirect(from: string, to: string, trigger: string): void {
  debugTracker.recordRedirect(from, to, trigger);
}
