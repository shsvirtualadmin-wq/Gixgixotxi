import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  supabase,
  fetchStudentProfileFromSupabase,
  syncUserProfile,
  isAdminEmail,
  isStudentRegistrationCompleted,
  User,
  StudentProfile,
} from '../lib/supabase';
import { LmsAuthScreen } from './LmsAuthScreen';
import { LmsDashboard } from './LmsDashboard';
import { X } from 'lucide-react';

interface LmsPortalModalProps {
  onClose: () => void;
  onStartPractice: () => void;
  onOpenAdminDashboard?: () => void;
  onRefreshProfile?: () => void;
  selectedGradeContext?: string;
  theme?: 'light';
  onToggleTheme?: (newTheme: 'light') => void;
  currentUser?: User | null;
  userProfile?: StudentProfile | null;
  isTestLimitReached?: boolean;
}

export const LmsPortalModal: React.FC<LmsPortalModalProps> = ({
  onClose,
  onStartPractice,
  onOpenAdminDashboard,
  onRefreshProfile,
  selectedGradeContext,
  theme,
  onToggleTheme,
  currentUser: initialUser,
  userProfile: initialProfile,
  isTestLimitReached = false,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser ?? null);
  const [userProfile, setUserProfile] = useState<StudentProfile | null>(initialProfile ?? null);
  // If we already have a user and profile passed in from parent, loading can start as false immediately
  const [loading, setLoading] = useState<boolean>(() => {
    if (initialUser) return !initialProfile;
    return initialUser === undefined;
  });

  // Sync state if parent props update
  useEffect(() => {
    if (initialUser !== undefined) {
      setCurrentUser(initialUser);
    }
    if (initialProfile !== undefined) {
      setUserProfile(initialProfile);
      setLoading(false);
    }
  }, [initialUser, initialProfile]);

  const fetchProfile = async (user: User) => {
    try {
      let p = await fetchStudentProfileFromSupabase(user.id, false, user.email);
      if (!p) {
        p = await syncUserProfile(user);
      }
      setUserProfile(p);
      return p;
    } catch (err) {
      console.error('Failed to sync profile:', err);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Check current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      const user = session?.user ?? initialUser ?? null;
      setCurrentUser(user);
      if (user) {
        // Only fetch if initialProfile wasn't provided or matches current user
        if (initialProfile && initialUser?.id === user.id) {
          setUserProfile(initialProfile);
          setLoading(false);
        } else {
          await fetchProfile(user);
          if (isMounted) setLoading(false);
        }
      } else {
        setUserProfile(null);
        if (isMounted) setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) {
        setLoading(true);
        await fetchProfile(user);
        if (isMounted) setLoading(false);
      } else {
        setUserProfile(null);
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const isAdmin = Boolean(currentUser?.email && isAdminEmail(currentUser.email));
  const isRegisteredStudent = isStudentRegistrationCompleted(userProfile, isAdmin);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className={`rounded-t-[32px] sm:rounded-[32px] p-6 w-full shadow-2xl relative animate-ios-spring max-h-[90vh] overflow-y-auto transition-colors duration-200 ${!currentUser ? 'bg-white  border border-slate-200/80  text-slate-900  max-w-md' : 'bg-white  border border-slate-200/80  text-slate-900  max-w-xl'}`}>
        <div className="w-9 h-1 bg-black/10  rounded-full mx-auto mb-3" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5  hover:bg-black/10  border border-black/10  flex items-center justify-center text-slate-700  hover:text-black  transition-all cursor-pointer active:scale-95 z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {loading ? null : currentUser ? (
          <LmsDashboard
            user={currentUser}
            profile={userProfile}
            isTestLimitReached={isTestLimitReached}
            onStartPractice={() => {
              onClose();
              onStartPractice();
            }}
            onOpenAdminDashboard={
              onOpenAdminDashboard
                ? () => {
                    onClose();
                    onOpenAdminDashboard();
                  }
                : undefined
            }
            onRefreshProfile={() => fetchProfile(currentUser)}
            onLogout={handleSignOut}
          />
        ) : (
          <LmsAuthScreen onSuccess={() => {}} selectedGradeContext={selectedGradeContext} />
        )}
      </div>
    </div>
  );
};

