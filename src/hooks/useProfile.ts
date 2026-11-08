import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { isQuotaExhaustedError } from '@/utils/quota';
import type { UserProfile } from '@/types/index';

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: { code?: string; message: string; path: string } | null;
}

export function useProfile(uid: string | null): ProfileState {
  const { profile: authProfile, isGuest } = useAuth();
  const [state, setState] = useState<ProfileState>(() => {
    let cached: UserProfile | null = null;
    if (uid) {
      if (authProfile && authProfile.uid === uid) {
        cached = authProfile;
      } else {
        try {
          const raw = localStorage.getItem(`cached_profile_${uid}`);
          if (raw) cached = JSON.parse(raw);
        } catch {
          // Ignore storage read errors
        }
      }
    }
    return {
      profile: cached,
      loading: Boolean(uid && !cached),
      error: null,
    };
  });

  useEffect(() => {
    if (!uid) {
      setState({ profile: null, loading: false, error: null });
      return;
    }

    if (uid.startsWith('guest_') || (isGuest && authProfile?.uid === uid)) {
      let fallback = authProfile?.uid === uid ? authProfile : null;
      if (!fallback) {
        try {
          const raw = localStorage.getItem(`cached_profile_${uid}`);
          if (raw) fallback = JSON.parse(raw);
        } catch {
          // Ignore storage read errors
        }
      }
      setState({
        profile: fallback,
        loading: false,
        error: null,
      });
      return;
    }

    let cancelled = false;
    const path = `users/${uid}`;

    getDoc(doc(db, 'users', uid))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          const profileData = { uid, ...snap.data() } as UserProfile;
          try {
            localStorage.setItem(`cached_profile_${uid}`, JSON.stringify(profileData));
          } catch {
            // Ignore storage write errors
          }
          setState({ profile: profileData, loading: false, error: null });
        } else {
          setState({ profile: authProfile?.uid === uid ? authProfile : null, loading: false, error: null });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const isQuota = isQuotaExhaustedError(err);
        if (isQuota) {
          console.warn(`[useProfile] Daily quota limit reached on ${path}.`);
        } else {
          console.error(`[useProfile] Failed to read ${path}:`, err.code, err.message);
        }

        let fallback: UserProfile | null = authProfile?.uid === uid ? authProfile : null;
        if (!fallback) {
          try {
            const raw = localStorage.getItem(`cached_profile_${uid}`);
            if (raw) fallback = JSON.parse(raw);
          } catch {
            // Ignore storage read errors
          }
        }

        setState({
          profile: fallback,
          loading: false,
          error: isQuota ? null : { code: err.code, message: err.message, path },
        });
      });

    return () => {
      cancelled = true;
    };
  }, [uid, authProfile, isGuest]);

  return state;
}

export { useUserProfile } from './useUserProfile';
