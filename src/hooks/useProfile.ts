import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { UserProfile } from '@/types/index';

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: { code?: string; message: string; path: string } | null;
}

export function useProfile(uid: string | null): ProfileState {
  const [state, setState] = useState<ProfileState>(() => {
    let cached: UserProfile | null = null;
    if (uid) {
      try {
        const raw = localStorage.getItem(`cached_profile_${uid}`);
        if (raw) cached = JSON.parse(raw);
      } catch {
        // Ignore storage read errors
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

    let cancelled = false;
    const path = `/api/users/${uid}`;

    api
      .get<{ profile?: UserProfile | null }>(`/api/users/${encodeURIComponent(uid)}`, { silentToast: true })
      .then((res) => {
        if (cancelled) return;
        if (res?.profile) {
          const profileData = { ...res.profile, uid } as UserProfile;
          try {
            localStorage.setItem(`cached_profile_${uid}`, JSON.stringify(profileData));
          } catch {
            // Ignore storage write errors
          }
          setState({ profile: profileData, loading: false, error: null });
        } else {
          setState({ profile: null, loading: false, error: null });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        let fallback: UserProfile | null = null;
        try {
          const raw = localStorage.getItem(`cached_profile_${uid}`);
          if (raw) fallback = JSON.parse(raw);
        } catch {
          // Ignore storage read errors
        }

        setState({
          profile: fallback,
          loading: false,
          error: { code: err?.code, message: err?.message || 'Failed to load profile', path },
        });
      });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return state;
}

export { useUserProfile } from './useUserProfile';
