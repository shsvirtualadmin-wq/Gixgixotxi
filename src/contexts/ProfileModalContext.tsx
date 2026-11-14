import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, lazy } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { BoardlySuspenseBoundary } from '@/components/ui/BoardlyLoader';
import { useBodyScrollLock } from '@/utils/scrollLock';

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
  const location = useLocation();

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

  // Automatically close the full-screen profile modal when navigating to a new route
  useEffect(() => {
    setIsOpen(false);
    setActiveUid(null);
  }, [location.pathname]);

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
  useBodyScrollLock(isOpen, 'profile-modal');

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

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      data-fullscreen-modal="true"
      className="fixed inset-0 z-[140] flex items-center justify-center p-0 sm:p-4 animate-fade-in"
    >
      {/* Sibling dimmed/blurred backdrop */}
      <div
        onClick={() => closeProfile()}
        className="fixed inset-0 z-0 bg-black/30 backdrop-blur-sm glass-backdrop cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal Container: Full-screen on mobile, centered dialog max-w-560px on desktop */}
      <div
        className="relative z-10 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[560px] glass sm:rounded-3xl shadow-2xl overflow-y-auto scrollbar-none flex flex-col"
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

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
