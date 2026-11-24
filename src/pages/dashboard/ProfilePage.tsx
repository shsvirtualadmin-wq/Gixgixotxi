import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { ProfileView } from '@/components/profile/ProfileView';
import { PageMeta } from '@/components/ui/PageMeta';
import { t as translate } from '@/i18n';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProfileErrorBoundaryProps {
  children: React.ReactNode;
}

interface ProfileErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ProfileErrorBoundary extends React.Component<
  ProfileErrorBoundaryProps,
  ProfileErrorBoundaryState
> {
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
        <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-[28px] bg-[var(--card)] border border-[var(--border)] shadow-[var(--settings-card-shadow)] text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center">
              <AlertCircle size={22} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-[16px] font-semibold text-[var(--text)]">
                {translate('profile.errorTitle')}
              </h3>
              <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                {this.state.error?.message || translate('profile.errorDesc')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
              className="min-h-[44px] px-5 rounded-full bg-[var(--accent)] text-white text-[14px] font-semibold inline-flex items-center gap-2 hover:opacity-95 transition-opacity cursor-pointer"
            >
              <RefreshCw size={15} />
              <span>{translate('common.retry')}</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ProfilePage() {
  const [searchParams] = useSearchParams();
  const targetUid = searchParams.get('uid');
  const { t } = useLanguage();

  return (
    <>
      <PageMeta
        title={`${t('profile.title')} | Boardly`}
        description={t('profile.metaDesc')}
      />
      <ProfileErrorBoundary>
        <ProfileView targetUid={targetUid} isFullPage={true} />
      </ProfileErrorBoundary>
    </>
  );
}

export default ProfilePage;
