import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Sparkles, LayoutDashboard } from 'lucide-react';

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
    const msg = error?.message || '';
    const isChunk =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('dynamically imported module') ||
      error?.name === 'ChunkLoadError';

    return {
      hasError: true,
      isChunkError: isChunk,
      errorMessage: msg,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ChunkErrorBoundary caught error]:', error, errorInfo);
  }

  handleGoToDashboard = () => {
    this.setState({ hasError: false, isChunkError: false, errorMessage: '' });
    window.location.href = '/?screen=dashboard';
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
                Ready to Continue
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                We encountered a brief transition issue. Let's return to your dashboard to continue practicing.
              </p>
            </div>

            <button
              onClick={this.handleGoToDashboard}
              className="w-full py-3.5 px-6 bg-[#1E5AFF] hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Continue to Dashboard</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

