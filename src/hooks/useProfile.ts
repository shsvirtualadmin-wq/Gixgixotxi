import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types/index';

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: { code?: string; message: string; path: string } | null;
}

export function useProfile(uid: string | null): ProfileState {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    loading: Boolean(uid),
    error: null,
  });

  useEffect(() => {
    if (!uid) {
      setState({ profile: null, loading: false, error: null });
      return;
    }

    const path = `users/${uid}`;
    setState(prev => ({ ...prev, loading: true, error: null }));

    const unsubscribe = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          setState({ profile: { uid, ...snap.data() } as UserProfile, loading: false, error: null });
        } else {
          setState({ profile: null, loading: false, error: null });
        }
      },
      (err) => {
        console.error(`[useProfile] Failed to read ${path}:`, err.code, err.message);
        setState({
          profile: null,
          loading: false,
          error: { code: err.code, message: err.message, path },
        });
      }
    );

    return unsubscribe;
  }, [uid]);

  return state;
}

export { useUserProfile } from './useUserProfile';
