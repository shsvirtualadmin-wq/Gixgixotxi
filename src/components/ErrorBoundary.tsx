import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard, Sparkles } from 'lucide-react';
import { isChunkOrDynamicImportError } from '../lib/lazyWithRetry';

interface Props {
  children: ReactNode;
  fallbackScreen?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isChunkError: boolean;
  isAutoReloading: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isChunkError: false,
    isAutoReloading: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    const isChunk = isChunkOrDynamicImportError(error);
    return {
      hasError: true,
      error,
      errorInfo: null,
      isChunkError: isChunk,
      isAutoReloading: isChunk,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });

    const isChunk = isChunkOrDynamicImportError(error);
    if (isChunk) {
      const msg = error?.message || '';
      const now = Date.now();
      const lastReload = sessionStorage.getItem('global_error_boundary_chunk_reload');

      // Graceful automatic reload: attempt one hard reload before displaying the error screen
      if (!lastReload || now - Number(lastReload) > 20000) {
        sessionStorage.setItem('global_error_boundary_chunk_reload', String(now));
        if (msg.toLowerCase().includes('studybuddy') || msg.toLowerCase().includes('study_buddy')) {
          sessionStorage.setItem('boardly_reopen_study_buddy', 'true');
        }
        console.warn('[ErrorBoundary] Dynamic module load failure detected. Performing automatic reload to fetch fresh assets...');

        this.setState({ isAutoReloading: true });

        if (typeof caches !== 'undefined') {
          caches
            .keys()
            .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            .finally(() => {
              window.location.reload();
            });
          return;
        }

        window.location.reload();
      } else {
        this.setState({ isAutoReloading: false });
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, isChunkError: false, isAutoReloading: false });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = '/?screen=dashboard';
    }
  };

  private handleFullReset = () => {
    try {
      localStorage.removeItem('boardly_active_screen');
      localStorage.removeItem('boardly_active_test_session');
      sessionStorage.removeItem('global_error_boundary_chunk_reload');
    } catch {}
    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).finally(() => {
        window.location.href = '/?screen=dashboard';
      });
      return;
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // If a dynamic import or chunk error occurred
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F8F9FB] text-slate-900">
            <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-ios-spring">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#1E5AFF] mx-auto">
                <RefreshCw className="w-8 h-8 animate-spin text-[#1E5AFF]" style={{ animationDuration: '2.5s' }} />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {this.state.isAutoReloading ? 'Updating Application...' : 'New Update Available'}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {this.state.isAutoReloading
                    ? 'A new version of Boardly was deployed. Fetching the latest modules for you...'
                    : 'A recent update was deployed to Boardly. Please refresh to load the updated application.'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={this.handleFullReset}
                  className="w-full flex items-center justify-center gap-2 bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload & Update Application</span>
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F8F9FB] text-slate-900">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-ios-spring">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {this.state.error?.message || 'An unexpected error occurred while rendering this screen.'}
              </p>
            </div>

            {this.state.errorInfo && (
              <details className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] font-mono text-slate-600 overflow-auto max-h-32">
                <summary className="cursor-pointer text-[#1E5AFF] font-bold mb-1">Error details</summary>
                {this.state.error?.stack}
              </details>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>
              <button
                onClick={this.handleFullReset}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Session & Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

