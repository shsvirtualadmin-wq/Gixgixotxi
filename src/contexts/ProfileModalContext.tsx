import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface ProfileModalContextType {
  activeProfileUid: string | null;
  isOpen: boolean;
  openProfile: (uid: string) => void;
  closeProfile: () => void;
}

const ProfileModalContext = createContext<ProfileModalContextType>({
  activeProfileUid: null,
  isOpen: false,
  openProfile: () => {},
  closeProfile: () => {},
});

export const useProfileModal = () => useContext(ProfileModalContext);

export const ProfileModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProfileUid, setActiveProfileUid] = useState<string | null>(null);

  const openProfile = useCallback((uid: string) => {
    if (!uid) return;
    setActiveProfileUid(uid);
    // Push history state so back button/gesture on mobile closes the modal
    if (typeof window !== 'undefined') {
      window.history.pushState({ profileModal: true, uid }, '');
    }
  }, []);

  const closeProfile = useCallback(() => {
    setActiveProfileUid(null);
    if (typeof window !== 'undefined' && window.history.state?.profileModal) {
      window.history.back();
    }
  }, []);

  // Listen to popstate for back button/gesture
  useEffect(() => {
    const handlePopState = () => {
      if (activeProfileUid) {
        setActiveProfileUid(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeProfileUid]);

  return (
    <ProfileModalContext.Provider
      value={{
        activeProfileUid,
        isOpen: Boolean(activeProfileUid),
        openProfile,
        closeProfile,
      }}
    >
      {children}
    </ProfileModalContext.Provider>
  );
};

export const ProfileModalHost: React.FC = () => {
  const { activeProfileUid, closeProfile, openProfile } = useProfileModal();
  if (!activeProfileUid) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      {/* Dynamic import or direct ProfileView */}
      <ProfileViewModalContent
        uid={activeProfileUid}
        onClose={closeProfile}
        onOpenUserProfile={openProfile}
      />
    </div>
  );
};

// Lazy or direct component
import { ProfileView } from '@/components/profile/ProfileView';

function ProfileViewModalContent({
  uid,
  onClose,
  onOpenUserProfile,
}: {
  uid: string;
  onClose: () => void;
  onOpenUserProfile: (uid: string) => void;
}) {
  return (
    <ProfileView
      targetUid={uid}
      mode="auto"
      isEmbedded={false}
      onClose={onClose}
      onOpenUserProfile={onOpenUserProfile}
    />
  );
}

