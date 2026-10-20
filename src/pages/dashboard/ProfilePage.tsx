import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProfileView } from '@/components/profile/ProfileView';

interface ProfileErrorBoundaryProps {
  children: React.ReactNode;
}

interface ProfileErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ProfileErrorBoundary extends React.Component<ProfileErrorBoundaryProps, ProfileErrorBoundaryState> {
  constructor(props: ProfileErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ProfileErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ProfilePage ErrorBoundary caught]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-xl mx-auto p-6 my-8 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-center flex flex-col items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center font-bold">
            !
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-heading font-bold text-base text-[var(--text)]">
              Could not display student profile
            </h3>
            <p className="text-xs text-[var(--muted)]">
              {this.state.error?.message || 'An unexpected error occurred while loading this profile view.'}
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="h-9 px-4 rounded-xl bg-[var(--red)] text-white text-xs font-heading font-semibold hover:bg-[var(--red-dark)] transition-colors cursor-pointer"
          >
            Reload Profile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ProfilePage() {
  const [searchParams] = useSearchParams();
  const targetUid = searchParams.get('uid');

  return (
    <div className="w-full flex justify-center py-2 sm:py-6">
      <ProfileErrorBoundary>
        <ProfileView
          targetUid={targetUid}
          isFullPage={true}
        />
      </ProfileErrorBoundary>
    </div>
  );
}

export default ProfilePage;
