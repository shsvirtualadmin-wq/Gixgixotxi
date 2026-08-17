import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackScreen?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
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
    } catch {}
    window.location.href = '/?screen=dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F8F9FB]  text-slate-900 ">
          <div className="max-w-md w-full bg-white  border border-slate-200  rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-ios-spring">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 ">Something went wrong</h2>
              <p className="text-xs text-slate-600  leading-relaxed">
                {this.state.error?.message || 'An unexpected error occurred while rendering this screen.'}
              </p>
            </div>

            {this.state.errorInfo && (
              <details className="text-left bg-slate-50  p-3 rounded-xl border border-slate-200  text-[10px] font-mono text-slate-600  overflow-auto max-h-32">
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
                className="w-full flex items-center justify-center gap-2 bg-slate-100  hover:bg-slate-200  text-slate-800  font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
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
