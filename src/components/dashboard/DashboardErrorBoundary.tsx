import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { isSuperAdminEmailOrRole } from '@/hooks/useEffectivePlan';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DashboardErrorBoundary] Caught render error:', error);
    console.error('[DashboardErrorBoundary] Error message:', error?.message);
    console.error('[DashboardErrorBoundary] Error stack:', error?.stack);
    console.error('[DashboardErrorBoundary] Component stack:', errorInfo?.componentStack);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isDebug =
        typeof window !== 'undefined' &&
        (new URLSearchParams(window.location.search).get('debug') === '1' ||
          sessionStorage.getItem('boardly_debug') === '1');
      const currentEmail = auth.currentUser?.email;
      const currentUid = auth.currentUser?.uid;
      const isSuper =
        isSuperAdminEmailOrRole(currentEmail, null, currentUid) ||
        (currentEmail && currentEmail.toLowerCase() === 'support@scholario.me') ||
        (currentEmail && currentEmail.toLowerCase() === 'support@boardly.cfd') ||
        (currentEmail && currentEmail.toLowerCase() === 'shsvirtualadmin@gmail.com') ||
        currentUid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2';
      const showTechDetails = isDebug || Boolean(isSuper);

      if (!showTechDetails) {
        return (
          <div className="min-h-[40vh] p-4 sm:p-6 flex items-center justify-center">
            <div className="w-full max-w-[500px] p-6 rounded-[24px] bg-[#0D0D0D] border border-[#222222] text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#D71921] text-[#D71921] flex items-center justify-center mx-auto">
                <AlertCircle size={22} />
              </div>
              <h2 className="text-lg font-bold text-white font-heading">
                {this.props.fallbackTitle || 'Something went wrong'}
              </h2>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                An unexpected issue occurred while rendering this section. Please try again or refresh the page.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="px-5 py-2.5 rounded-full bg-[#D71921] hover:bg-[#b0141a] text-white text-xs font-heading font-semibold transition-colors cursor-pointer"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 rounded-full bg-[#1A1A1A] hover:bg-[#252525] border border-[#333333] text-white text-xs font-heading transition-colors cursor-pointer"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        );
      }

      const stack = this.state.error?.stack || '';
      const componentStack = this.state.errorInfo?.componentStack || '';

      // Extract component name from componentStack (e.g., "in PracticePage (at ...)" or "at PracticePage")
      const compMatch =
        componentStack.match(/(?:at|in)\s+([A-Z][A-Za-z0-9_]+)/) ||
        stack.match(/(?:at|in)\s+([A-Z][A-Za-z0-9_]+)/);
      const componentName = compMatch ? compMatch[1] : 'UnknownComponent';

      // Extract source file from stack (e.g., "PracticePage.tsx", "assets/PracticePage-DzQrIYCg.js")
      const fileMatch =
        stack.match(/([a-zA-Z0-9_-]+\.(?:tsx|ts|jsx|js)(?::\d+:\d+)?)/) ||
        componentStack.match(/([a-zA-Z0-9_-]+\.(?:tsx|ts|jsx|js)(?::\d+:\d+)?)/);
      const fileName = fileMatch ? fileMatch[1] : 'Unknown File';

      return (
        <div className="min-h-[50vh] p-4 sm:p-6 flex items-center justify-center">
          <div className="w-full max-w-[620px] p-6 rounded-[24px] bg-[var(--card)] border border-[var(--red)]/40 shadow-none space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[rgba(239,68,68,0.12)] border border-[var(--red)]/40 flex items-center justify-center text-[var(--red)] shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-[var(--text)]">
                  {this.props.fallbackTitle || 'Unable to display view'}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[rgba(239,68,68,0.15)] text-[var(--red)] font-semibold">
                    Component: {componentName}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--card-2)] text-[var(--muted)] border border-[var(--border)]">
                    File: {fileName}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] overflow-x-auto">
              <p className="text-xs font-mono text-[var(--red)] font-semibold break-words">
                {this.state.error?.message || 'Unknown runtime error'}
              </p>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[10px] font-mono text-[var(--muted)] mt-2 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-[var(--card-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-heading text-[var(--text)]"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--text)] text-[var(--bg)] text-xs font-heading font-semibold hover:opacity-90"
              >
                <RefreshCw size={13} />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
