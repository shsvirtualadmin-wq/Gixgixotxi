import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { isChunkOrDynamicImportError } from '../lib/lazyWithRetry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  errorMessage: string;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isChunkError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunk = isChunkOrDynamicImportError(error);
    return {
      hasError: true,
      isChunkError: isChunk,
      errorMessage: error?.message || '',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ChunkErrorBoundary caught error]:', error, errorInfo);

    const isChunk = isChunkOrDynamicImportError(error);
    const msg = error?.message || '';

    if (isChunk) {
      const lastReload = sessionStorage.getItem('global_chunk_error_reload');
      const now = Date.now();

      // Perform a one-time automated page reload if not performed in the last 20 seconds
      if (!lastReload || now - Number(lastReload) > 20000) {
        sessionStorage.setItem('global_chunk_error_reload', String(now));
        if (msg.toLowerCase().includes('studybuddy') || msg.toLowerCase().includes('study_buddy')) {
          sessionStorage.setItem('boardly_reopen_study_buddy', 'true');
        }
        console.log('[ChunkErrorBoundary] Stale chunk detected. Reloading application to pull updated deployment assets...');

        if (typeof caches !== 'undefined') {
          caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).finally(() => {
            window.location.reload();
          });
          return;
        }

        window.location.reload();
      }
    }
  }

  handleManualReload = () => {
    sessionStorage.removeItem('global_chunk_error_reload');
    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).finally(() => {
        window.location.reload();
      });
      return;
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1E5AFF] flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">
                {this.state.isChunkError ? 'New Version Available' : 'Something went wrong'}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {this.state.isChunkError
                  ? 'A new update was just deployed. Please refresh to load the latest version.'
                  : 'An error occurred while displaying this screen.'}
              </p>
            </div>

            <button
              onClick={this.handleManualReload}
              className="w-full py-3.5 px-6 bg-[#1E5AFF] hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
