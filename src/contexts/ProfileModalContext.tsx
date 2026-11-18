import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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

/**
 * ProfileModalProvider routes all profile opens directly to the dedicated
 * /profile page (or /profile?uid=<id> for other users) so profile never
 * opens as an overlay on top of Notifications or other tabs, and browser
 * back + page refresh always work reliably.
 */
export const ProfileModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const openProfile = useCallback(
    (uid?: string | null) => {
      const targetUid = typeof uid === 'string' && uid.trim() ? uid.trim() : null;
      if (!targetUid || (user?.uid && targetUid === user.uid)) {
        navigate('/profile');
      } else {
        navigate(`/profile?uid=${encodeURIComponent(targetUid)}`);
      }
    },
    [navigate, user?.uid]
  );

  const closeProfile = useCallback(
    (skipHistoryBack = false) => {
      if (!skipHistoryBack && location.pathname === '/profile') {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/dashboard');
        }
      }
    },
    [location.pathname, navigate]
  );

  const contextValue = useMemo(
    () => ({
      openProfile,
      closeProfile,
      isOpen: false,
      activeUid: null,
    }),
    [openProfile, closeProfile]
  );

  return (
    <ProfileModalContext.Provider value={contextValue}>
      {children}
    </ProfileModalContext.Provider>
  );
};

export const ProfileModalHost: React.FC = () => {
  return null;
};
