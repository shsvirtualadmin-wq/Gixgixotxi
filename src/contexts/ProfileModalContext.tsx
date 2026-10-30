import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, lazy } from 'react';
import { BoardlySuspenseBoundary } from '@/components/ui/BoardlyLoader';

const LazyProfileView = lazy(() =>
  import('@/components/profile/ProfileView').then((m) => ({ default: m.ProfileView }))
);

interface ProfileModalContextType {
  openProfile: (uid?: string | null) => void;
  closeProfile: (skipHistoryBack?: boolean) => void;
  isOpen: boolean;
  activeUid: string | null;
}

const ProfileModalContext = createContext<ProfileModalContextType>({
  openProfile: () => {},
  closeProfile: () => {},
  isOpen: false,
  activeUid: null,
});

export const useProfileModal = () => useContext(ProfileModalContext);

export const ProfileModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeUid, setActiveUid] = useState<string | null>(null);

  const openProfile = useCallback((uid?: string | null) => {
    setActiveUid(uid || null);
    setIsOpen((prevOpen) => {
      if (!prevOpen) {
        window.history.pushState({ profileModal: true }, '');
      }
      return true;
    });
  }, []);

  const closeProfile = useCallback((skipHistoryBack = false) => {
    setIsOpen(false);
    setActiveUid(null);
    if (!skipHistoryBack && window.history.state?.profileModal) {
      window.history.back();
    }
  }, []);

  // Listen for browser / mobile back gesture (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) {
        setIsOpen(false);
        setActiveUid(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const contextValue = useMemo(
    () => ({ openProfile, closeProfile, isOpen, activeUid }),
    [openProfile, closeProfile, isOpen, activeUid]
  );

  return (
    <ProfileModalContext.Provider value={contextValue}>
      {children}
    </ProfileModalContext.Provider>
  );
};

export const ProfileModalHost: React.FC = () => {
  const { isOpen, closeProfile, activeUid } = useProfileModal();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in overflow-hidden">
      {/* Backdrop on desktop */}
      <div
        onClick={() => closeProfile()}
        className="absolute inset-0 hidden sm:block bg-black/40 backdrop-blur-xs"
      />

      {/* Modal Container: Full-screen on mobile, centered dialog max-w-560px on desktop */}
      <div
        className="relative z-10 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[560px] bg-[var(--background)] sm:rounded-3xl shadow-2xl overflow-y-auto scrollbar-none flex flex-col"
      >
        <BoardlySuspenseBoundary
          variant="inline"
          messages={['Loading profile...', 'Syncing your subjects...']}
        >
          <LazyProfileView
            key={activeUid || 'self'}
            targetUid={activeUid}
            isFullPage={false}
            onClose={closeProfile}
          />
        </BoardlySuspenseBoundary>
      </div>
    </div>
  );
};
