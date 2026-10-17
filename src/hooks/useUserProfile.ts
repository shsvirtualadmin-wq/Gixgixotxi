import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { UserProfile } from '@/types/index';

export interface UserProfileHookResult {
  user: ReturnType<typeof useAuth>['user'];
  profile: UserProfile | null;
  loading: boolean;
  error: { code?: string; message: string; path?: string } | null;
  university: string;
  testDate: string;
  track: string;
  subjects: string[];
  daysLeft: number | null;
  updateProfileData: (updates: {
    displayName?: string;
    photoURL?: string | null;
    targetUniversity?: string;
    targetTestDate?: string;
    academicTrack?: string;
    subjects?: string[];
  }) => Promise<void>;
}

/**
 * Single shared hook for accessing and updating the active student's profile.
 * Reads directly from `users/{uid}` with a real-time `onSnapshot` listener.
 * Prevents writing protected fields (`role`, `plan`, `isPremium`, `premium`, `admin`, `suspended`).
 */
export function useUserProfile(): UserProfileHookResult {
  const { user, profile: authProfile, updateLocalProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(authProfile ?? null);
  const [loading, setLoading] = useState<boolean>(!authProfile && Boolean(user?.uid));
  const [error, setError] = useState<{ code?: string; message: string; path?: string } | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    const path = `users/${user.uid}`;
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setProfile({ uid: user.uid, ...data });
          // Synchronize AuthContext in-memory state
          updateLocalProfile(data);
        } else {
          // If Firestore doc is pending or not created yet, fallback to in-memory profile
          if (authProfile) {
            setProfile(authProfile);
          }
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`[useUserProfile] Snapshot error on ${path}:`, err);
        setError({
          code: err.code,
          message: err.message,
          path,
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, updateLocalProfile, authProfile]);

  // Derived unified fields
  const university = profile?.targetUniversity || 'FAST-NUCES';
  const testDate = profile?.targetTestDate || '';
  const track = profile?.academicTrack || 'Pre-Engineering';
  const subjects = useMemo(() => {
    if (profile?.subjects && Array.isArray(profile.subjects) && profile.subjects.length > 0) {
      return profile.subjects;
    }
    return ['Mathematics', 'Physics', 'English'];
  }, [profile?.subjects]);

  const daysLeft = useMemo(() => {
    if (!testDate) return null;
    try {
      const target = new Date(`${testDate}T00:00:00`);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffMs = target.getTime() - now.getTime();
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  }, [testDate]);

  const updateProfileData = useCallback(
    async (updates: {
      displayName?: string;
      photoURL?: string | null;
      targetUniversity?: string;
      targetTestDate?: string;
      academicTrack?: string;
      subjects?: string[];
    }) => {
      if (!user?.uid) throw new Error('Cannot update profile: Unauthenticated user');
      const path = `users/${user.uid}`;

      // STRICT PROTECTION: Strip any forbidden / protected fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safePayload: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };

      if (updates.displayName !== undefined) {
        safePayload.displayName = updates.displayName.trim();
        safePayload.name = updates.displayName.trim();
      }
      if (updates.photoURL !== undefined) {
        safePayload.photoURL = updates.photoURL;
      }
      if (updates.targetUniversity !== undefined) {
        safePayload.targetUniversity = updates.targetUniversity.trim();
      }
      if (updates.targetTestDate !== undefined) {
        safePayload.targetTestDate = updates.targetTestDate.trim();
      }
      if (updates.academicTrack !== undefined) {
        safePayload.academicTrack = updates.academicTrack.trim();
      }
      if (updates.subjects !== undefined) {
        safePayload.subjects = updates.subjects;
      }

      // 1. Immediately update in-memory state
      updateLocalProfile(safePayload);
      setProfile((prev) => (prev ? { ...prev, ...safePayload } : null));

      // 2. Perform merge write to Firestore
      await setDoc(doc(db, 'users', user.uid), safePayload, { merge: true });
      console.log(`[useUserProfile] Successfully wrote safe profile updates to ${path}:`, safePayload);
    },
    [user?.uid, updateLocalProfile]
  );

  return {
    user,
    profile,
    loading,
    error,
    university,
    testDate,
    track,
    subjects,
    daysLeft,
    updateProfileData,
  };
}

export default useUserProfile;
