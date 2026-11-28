import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface AiErrorBoundaryProps {
  children: ReactNode;
  scope?: 'chat' | 'picker' | 'depth';
  onRetry?: () => void;
  onClose?: () => void;
  compact?: boolean;
}

interface AiErrorBoundaryState {
  hasError: boolean;
  retryCount: number;
}

/**
 * Dedicated Error Boundary for Boardly AI Mentors (picker, depth modal, and chat).
 * Always renders a calm, user-friendly recovery UI with Retry (never raw error code/stacks)
 * while logging full diagnostic details to console/monitoring.
 */
export class AiErrorBoundary extends Component<AiErrorBoundaryProps, AiErrorBoundaryState> {
  constructor(props: AiErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(): Partial<AiErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const scope = this.props.scope || 'chat';
    console.error(`[Boardly AI ErrorBoundary:${scope}]`, {
      message: error?.message || String(error),
      name: error?.name,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('boardly:ai-error', {
            detail: {
              scope,
              message: error?.message || 'Unknown AI UI error',
              timestamp: Date.now(),
            },
          })
        );
      } catch {
        // Ignore telemetry dispatch errors
      }
    }
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      retryCount: prev.retryCount + 1,
    }));
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      const scope = this.props.scope || 'chat';
      const title =
        scope === 'picker'
          ? 'Could not open Mentor Picker'
          : scope === 'depth'
          ? 'Could not open Answer Depth'
          : 'AI Mentors hit a quick snag';
      const description =
        scope === 'picker' || scope === 'depth'
          ? 'Something unexpected happened while loading this menu. Tap Retry to open it again.'
          : 'Your chat session ran into an unexpected display issue. Tap Retry to reload your mentor.';

      if (this.props.compact) {
        return (
          <div
            role="alert"
            className="fixed inset-0 z-[10060] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
          >
            <div
              className="w-full max-w-[380px] rounded-[28px] p-5 text-center space-y-3 shadow-2xl"
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              <div
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent) 14%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3
                className="text-[16px] font-bold"
                style={{ fontFamily: "'Doto', var(--font-dot), sans-serif" }}
              >
                {title}
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {description}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-[13px] font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry</span>
                </button>
                {this.props.onClose && (
                  <button
                    type="button"
                    onClick={this.props.onClose}
                    className="inline-flex h-10 items-center gap-1 rounded-full px-4 text-[13px] font-semibold cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                    style={{
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Close</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div
          role="alert"
          className="fixed inset-0 z-[9950] flex items-center justify-center p-4 bg-black/55 backdrop-blur-[3px]"
        >
          <div
            className="w-full max-w-[440px] rounded-[32px] p-6 text-center space-y-4 shadow-2xl"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent) 14%, transparent)',
                color: 'var(--accent)',
              }}
            >
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h2
                className="text-[19px] font-bold"
                style={{ fontFamily: "'Doto', var(--font-dot), sans-serif" }}
              >
                {title}
              </h2>
              <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {description}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-[13.5px] font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry</span>
              </button>
              {this.props.onClose && (
                <button
                  type="button"
                  onClick={this.props.onClose}
                  className="inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-[13.5px] font-semibold cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  <span>Back</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return <React.Fragment key={this.state.retryCount}>{this.props.children}</React.Fragment>;
  }
}

export default AiErrorBoundary;
