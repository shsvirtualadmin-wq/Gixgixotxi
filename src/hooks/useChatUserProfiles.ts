import { useEffect, useState, useMemo } from 'react';
import {
  getCachedPublicProfile,
  getPublicProfiles,
  type PublicProfile,
} from '@/services/publicProfileService';
import { resolveCosmeticItemId } from '@/components/ui/BoardlyAvatar';
import { isAdminAccount } from '@/constants/superAdmin';

export interface ResolvedChatUser {
  uid: string;
  displayName: string;
  role: string;
  customRole?: string;
  isSuperAdmin: boolean;
  equippedAvatar?: string | null;
  avatarUrl?: string | null;
  photoURL?: string | null;
  avatar?: string | null;
  frame?: string | null;
  avatarKey?: string | null;
  avatarVariant?: string | null;
  proBadge?: string | null;
  isLoadingProfile: boolean;
}

export interface ChatUserSeed {
  uid: string;
  displayName?: string | null;
  avatar?: string | null;
  photoURL?: string | null;
  avatarUrl?: string | null;
  frame?: string | null;
  role?: string | null;
}

/**
 * Resolves real user profile pictures and metadata for chat participants and requests
 * using the same publicProfileService source used on profile pages, Commons, and leaderboards.
 */
export function useChatUserProfiles(seeds: ChatUserSeed[]): Record<string, ResolvedChatUser> {
  const [profilesByUid, setProfilesByUid] = useState<Record<string, PublicProfile>>(() => {
    const initial: Record<string, PublicProfile> = {};
    for (const s of seeds) {
      if (!s.uid) continue;
      const cached = getCachedPublicProfile(s.uid);
      if (cached) {
        initial[s.uid] = cached;
      }
    }
    return initial;
  });

  const [fetchedUids, setFetchedUids] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const s of seeds) {
      if (s.uid && getCachedPublicProfile(s.uid)) {
        initial.add(s.uid);
      }
    }
    return initial;
  });

  const uidKey = useMemo(
    () =>
      Array.from(new Set(seeds.map((s) => s.uid).filter(Boolean)))
        .sort()
        .join(','),
    [seeds]
  );

  useEffect(() => {
    if (!uidKey) return;
    const uniqueUids = uidKey.split(',').filter(Boolean);

    // Sync any newly cached profiles immediately
    const cachedUpdates: Record<string, PublicProfile> = {};
    const missingUids: string[] = [];

    for (const uid of uniqueUids) {
      const cached = getCachedPublicProfile(uid);
      if (cached) {
        cachedUpdates[uid] = cached;
      } else {
        missingUids.push(uid);
      }
    }

    if (Object.keys(cachedUpdates).length > 0) {
      setProfilesByUid((prev) => ({ ...prev, ...cachedUpdates }));
      setFetchedUids((prev) => {
        const next = new Set(prev);
        Object.keys(cachedUpdates).forEach((id) => next.add(id));
        return next;
      });
    }

    if (missingUids.length === 0) return;

    let cancelled = false;

    void getPublicProfiles(missingUids)
      .then((map) => {
        if (cancelled) return;
        const nextProfiles: Record<string, PublicProfile> = {};
        map.forEach((prof, id) => {
          nextProfiles[id] = prof;
        });

        setProfilesByUid((prev) => ({ ...prev, ...nextProfiles }));
        setFetchedUids((prev) => {
          const next = new Set(prev);
          missingUids.forEach((id) => next.add(id));
          return next;
        });
      })
      .catch(() => {
        if (cancelled) return;
        setFetchedUids((prev) => {
          const next = new Set(prev);
          missingUids.forEach((id) => next.add(id));
          return next;
        });
      });

    return () => {
      cancelled = true;
    };
  }, [uidKey, seeds]);

  return useMemo(() => {
    const resolved: Record<string, ResolvedChatUser> = {};

    for (const seed of seeds) {
      const uid = seed.uid;
      if (!uid) continue;

      const prof = profilesByUid[uid] || getCachedPublicProfile(uid) || null;
      const isLoadingProfile = !prof && !fetchedUids.has(uid);

      const displayName =
        prof?.displayName ||
        seed.displayName ||
        'Student';

      const role = prof?.role || 'student';

      const isSuperAdmin = Boolean(
        isAdminAccount(uid) ||
          prof?.role === 'admin' ||
          prof?.role === 'superadmin'
      );

      const equippedAvatar =
        resolveCosmeticItemId(prof?.equipped?.avatar, 'avatar') ||
        resolveCosmeticItemId(prof?.equippedAvatar, 'avatar') ||
        resolveCosmeticItemId(prof?.avatar, 'avatar') ||
        resolveCosmeticItemId(seed.avatar, 'avatar') ||
        resolveCosmeticItemId(seed.avatarUrl, 'avatar') ||
        null;

      const avatarUrl = equippedAvatar;
      const photoURL = null;

      const frame =
        resolveCosmeticItemId(prof?.equipped?.frame, 'frame') ||
        resolveCosmeticItemId(prof?.equippedFrame, 'frame') ||
        resolveCosmeticItemId(prof?.frame, 'frame') ||
        resolveCosmeticItemId(seed.frame, 'frame') ||
        null;

      resolved[uid] = {
        uid,
        displayName,
        role: isSuperAdmin ? 'admin' : role,
        customRole: prof?.customRole || undefined,
        isSuperAdmin,
        equippedAvatar,
        avatarUrl,
        photoURL,
        avatar: equippedAvatar,
        frame,
        avatarKey: prof?.avatarKey || null,
        avatarVariant: prof?.avatarVariant || null,
        proBadge: prof?.proBadge || null,
        isLoadingProfile,
      };
    }

    return resolved;
  }, [seeds, profilesByUid, fetchedUids]);
}
