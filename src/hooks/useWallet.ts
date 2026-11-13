import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  syncPublicProfile,
  broadcastPublicProfileUpdate,
  syncProfileToD1Backend,
} from '@/services/publicProfileService';
import { getSharedUserProfileSnapshot } from '@/hooks/useUserProfile';
import { invalidateCommonsPostsCache } from '@/services/commonsService';
import {
  readOptimisticWalletSnapshot,
  writeOptimisticWalletSnapshot,
} from '@/lib/swrCache';
import type { EquippedCosmetics } from '@/types';

export interface WalletDoc {
  balance: number;
  owned: string[];
  equipped: EquippedCosmetics;
  updatedAt?: unknown;
}

const DEFAULT_WALLET: WalletDoc = {
  balance: 0,
  owned: [],
  equipped: {
    effect: null,
    frame: null,
    nameplate: null,
    avatar: null,
    banner: null,
  },
};

// Module-level in-memory session cache & in-flight deduplication: Read the wallet once per session per user
const sessionWalletCache: { [uid: string]: WalletDoc | undefined } = {};
const inFlightWalletPromises: { [uid: string]: Promise<WalletDoc> | undefined } = {};
const inFlightSingleItemPurchases = new Set<string>();
const walletSubscribers = new Set<(uid: string, doc: WalletDoc) => void>();

function notifyWalletSubscribers(uid: string, doc: WalletDoc) {
  writeOptimisticWalletSnapshot({
    uid,
    balance: doc.balance,
    owned: doc.owned,
    equipped: doc.equipped,
  });
  walletSubscribers.forEach((cb) => {
    try {
      cb(uid, doc);
    } catch {
      // Ignore subscriber error
    }
  });
}

export function useWallet() {
  const { user } = useAuth();
  const initialWallet: WalletDoc = (() => {
    if (user?.uid && sessionWalletCache[user.uid]) {
      return sessionWalletCache[user.uid]!;
    }
    const optimistic = readOptimisticWalletSnapshot(user?.uid);
    if (optimistic) {
      return {
        balance: optimistic.balance,
        owned: Array.isArray(optimistic.owned) ? optimistic.owned : [],
        equipped: optimistic.equipped || DEFAULT_WALLET.equipped,
      };
    }
    return DEFAULT_WALLET;
  })();

  const [wallet, setWallet] = useState<WalletDoc>(initialWallet);
  const [loading, setLoading] = useState<boolean>(
    Boolean(
      user?.uid &&
        !sessionWalletCache[user.uid] &&
        !readOptimisticWalletSnapshot(user.uid)
    )
  );
  const walletRef = useRef(wallet);
  walletRef.current = wallet;

  const emailLower = user?.email?.toLowerCase().trim() || '';
  const isSuperAdminUser = Boolean(
    emailLower === 'shsvirtualadmin@gmail.com' ||
      emailLower === 'support@boardly.cfd' ||
      emailLower === 'support@scholario.me' ||
      user?.uid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2' ||
      user?.uid === 'jJfb1nThG1X9phL8fFDZ0G0J7m33'
  );

  const fetchWallet = useCallback(async (uid: string, forceRefresh = false) => {
    if (!uid) {
      setWallet(DEFAULT_WALLET);
      setLoading(false);
      return DEFAULT_WALLET;
    }

    if (uid.startsWith('guest_')) {
      const existingCached = sessionWalletCache[uid];
      const optimistic = readOptimisticWalletSnapshot(uid);
      const cachedProfile = getSharedUserProfileSnapshot(uid) as Record<string, any> | null;
      const pEquipped = cachedProfile?.equipped || {};
      const guestWallet: WalletDoc = {
        balance: existingCached?.balance ?? optimistic?.balance ?? 0,
        owned: Array.from(
          new Set([
            ...(existingCached?.owned || []),
            ...(optimistic?.owned || []),
            ...(Array.isArray(cachedProfile?.ownedCosmetics) ? cachedProfile.ownedCosmetics : []),
          ])
        ),
        equipped: {
          effect:
            existingCached?.equipped?.effect ??
            optimistic?.equipped?.effect ??
            pEquipped.effect ??
            cachedProfile?.effectId ??
            null,
          frame:
            existingCached?.equipped?.frame ??
            optimistic?.equipped?.frame ??
            pEquipped.frame ??
            cachedProfile?.frame ??
            cachedProfile?.equippedFrame ??
            null,
          nameplate:
            existingCached?.equipped?.nameplate ??
            optimistic?.equipped?.nameplate ??
            pEquipped.nameplate ??
            cachedProfile?.nameplate ??
            cachedProfile?.equippedNameplate ??
            null,
          avatar:
            existingCached?.equipped?.avatar ??
            optimistic?.equipped?.avatar ??
            pEquipped.avatar ??
            cachedProfile?.avatar ??
            cachedProfile?.equippedAvatar ??
            null,
          banner:
            existingCached?.equipped?.banner ??
            optimistic?.equipped?.banner ??
            pEquipped.banner ??
            cachedProfile?.banner ??
            cachedProfile?.equippedBanner ??
            null,
        },
      };
      walletRef.current = guestWallet;
      sessionWalletCache[uid] = guestWallet;
      setWallet(guestWallet);
      notifyWalletSubscribers(uid, guestWallet);
      setLoading(false);
      return guestWallet;
    }

    if (!forceRefresh && sessionWalletCache[uid]) {
      walletRef.current = sessionWalletCache[uid]!;
      setWallet(sessionWalletCache[uid]!);
      setLoading(false);
      return sessionWalletCache[uid]!;
    }

    if (!forceRefresh && inFlightWalletPromises[uid]) {
      setLoading(true);
      try {
        const sharedResult = await inFlightWalletPromises[uid]!;
        walletRef.current = sharedResult;
        setWallet(sharedResult);
        return sharedResult;
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    const walletDocRef = doc(db, 'wallets', uid);
    const userDocRef = doc(db, 'users', uid);
    const unlockedColRef = collection(db, 'users', uid, 'unlocked');

    const loadPromise = (async (): Promise<WalletDoc> => {
      try {
        const cachedUserProfile = !forceRefresh ? getSharedUserProfileSnapshot(uid) : null;

        const [snap, userSnap, unlockedSnap] = await Promise.all([
          getDoc(walletDocRef).catch((err) => {
            console.error('[useWallet] getDoc wallets error:', err?.code || 'ERROR', `wallets/${uid}`, err);
            return null;
          }),
          cachedUserProfile
            ? Promise.resolve(null)
            : getDoc(userDocRef).catch((err) => {
                console.error('[useWallet] getDoc users error:', err?.code || 'ERROR', `users/${uid}`, err);
                return null;
              }),
          getDocs(unlockedColRef).catch((err) => {
            console.error(
              '[useWallet] getDocs unlocked error:',
              err?.code || 'ERROR',
              `users/${uid}/unlocked`,
              err
            );
            return null;
          }),
        ]);

        const uData: Record<string, any> | null =
          (cachedUserProfile as Record<string, any> | null) ||
          (userSnap && userSnap.exists() ? userSnap.data() : null);

        const userKobans =
          uData && typeof uData.kobans === 'number' && Number.isFinite(uData.kobans)
            ? Math.max(0, Math.floor(uData.kobans))
            : 0;
        const userKobanBalance =
          uData && typeof uData.kobanBalance === 'number' && Number.isFinite(uData.kobanBalance)
            ? Math.max(0, Math.floor(uData.kobanBalance))
            : 0;
        const userBalance = Math.max(userKobans, userKobanBalance);

        const userOwned: string[] = Array.isArray(uData?.ownedCosmetics)
          ? (uData.ownedCosmetics as string[])
          : [];
        const unlockedIds: string[] = unlockedSnap
          ? unlockedSnap.docs.map((d) => String(d.data()?.itemId || d.id))
          : [];
        const cachedOwned: string[] = sessionWalletCache[uid]?.owned || [];

        if (snap && snap.exists()) {
          const data = snap.data() as Partial<WalletDoc>;
          const walletBalance =
            typeof data.balance === 'number' && Number.isFinite(data.balance)
              ? Math.max(0, Math.floor(data.balance))
              : null;
          const resolvedBalance =
            walletBalance !== null && walletBalance > 0
              ? walletBalance
              : Math.max(walletBalance ?? 0, userBalance);

          const walletOwned = Array.isArray(data.owned) ? data.owned : [];
          const mergedOwned = Array.from(
            new Set([...walletOwned, ...userOwned, ...unlockedIds, ...cachedOwned])
          );

          const rawEquipped = {
            ...(uData?.equipped || {}),
            ...(data.equipped || {}),
          };

          const cleanWallet: WalletDoc = {
            balance: resolvedBalance,
            owned: mergedOwned,
            equipped: {
              effect: rawEquipped.effect || uData?.effectId || null,
              frame: rawEquipped.frame || uData?.frame || uData?.equippedFrame || null,
              nameplate:
                rawEquipped.nameplate || uData?.nameplate || uData?.equippedNameplate || null,
              avatar: rawEquipped.avatar || uData?.avatar || uData?.equippedAvatar || null,
              banner: rawEquipped.banner || uData?.banner || uData?.equippedBanner || null,
            },
            updatedAt: data.updatedAt,
          };
          walletRef.current = cleanWallet;
          sessionWalletCache[uid] = cleanWallet;
          notifyWalletSubscribers(uid, cleanWallet);
          return cleanWallet;
        } else {
          // Initialize wallet document using existing user balance & unlocked items so we never overwrite a non-zero user balance with 0
          const mergedOwned = Array.from(new Set([...userOwned, ...unlockedIds, ...cachedOwned]));
          const uEquipped = uData?.equipped || {};
          const initial: WalletDoc = {
            balance: userBalance,
            owned: mergedOwned,
            equipped: {
              effect: uEquipped.effect || uData?.effectId || null,
              frame: uEquipped.frame || uData?.frame || uData?.equippedFrame || null,
              nameplate:
                uEquipped.nameplate || uData?.nameplate || uData?.equippedNameplate || null,
              avatar: uEquipped.avatar || uData?.avatar || uData?.equippedAvatar || null,
              banner: uEquipped.banner || uData?.banner || uData?.equippedBanner || null,
            },
            updatedAt: serverTimestamp(),
          };
          await setDoc(walletDocRef, initial, { merge: true }).catch((err) => {
            console.error(
              '[useWallet] Initial wallet setDoc error:',
              err?.code || 'ERROR',
              `wallets/${uid}`,
              err
            );
          });
          walletRef.current = initial;
          sessionWalletCache[uid] = initial;
          notifyWalletSubscribers(uid, initial);
          return initial;
        }
      } catch (err: any) {
        console.error(
          '[useWallet] Wallet read error:',
          err?.code || 'ERROR',
          `wallets/${uid}`,
          err
        );
        return sessionWalletCache[uid] || DEFAULT_WALLET;
      } finally {
        delete inFlightWalletPromises[uid];
      }
    })();

    inFlightWalletPromises[uid] = loadPromise;
    try {
      const resolved = await loadPromise;
      walletRef.current = resolved;
      setWallet(resolved);
      return resolved;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setWallet(DEFAULT_WALLET);
      setLoading(false);
      return;
    }

    const onSub = (updatedUid: string, updatedDoc: WalletDoc) => {
      if (updatedUid === user.uid) {
        walletRef.current = updatedDoc;
        setWallet(updatedDoc);
        setLoading(false);
      }
    };
    walletSubscribers.add(onSub);

    fetchWallet(user.uid, false);

    const handleWalletRefresh = (ev: Event) => {
      const customEv = ev as CustomEvent<{ balanceAfter?: number }>;
      if (typeof customEv?.detail?.balanceAfter === 'number') {
        const nextBalance = Math.max(0, Math.floor(customEv.detail.balanceAfter));
        const nextWallet: WalletDoc = {
          ...(sessionWalletCache[user.uid] || walletRef.current),
          balance: nextBalance,
        };
        walletRef.current = nextWallet;
        sessionWalletCache[user.uid] = nextWallet;
        notifyWalletSubscribers(user.uid, nextWallet);
      }
      fetchWallet(user.uid, true).catch(() => {});
    };

    window.addEventListener('boardly:wallet-refresh', handleWalletRefresh);
    window.addEventListener('boardly:plan-refresh', handleWalletRefresh);
    return () => {
      walletSubscribers.delete(onSub);
      window.removeEventListener('boardly:wallet-refresh', handleWalletRefresh);
      window.removeEventListener('boardly:plan-refresh', handleWalletRefresh);
    };
  }, [user?.uid, fetchWallet]);

  /**
   * Equips or unequips a cosmetic item owned by the user.
   * Super Admin can equip any item freely without ownership restriction.
   * Mirrors immediately to users/{uid} and publicProfiles/{uid} for leaderboards and crew views.
   */
  const equipCosmetic = useCallback(
    async (
      type: 'effect' | 'frame' | 'nameplate' | 'avatar' | 'banner',
      itemId: string | null
    ) => {
      if (!user?.uid) throw new Error('Must be logged in to equip cosmetics');
      const current = sessionWalletCache[user.uid] || walletRef.current;
      const isGuestUid = user.uid.startsWith('guest_');
      const mergedCurrentOwned = Array.from(
        new Set([...(current.owned || []), ...(walletRef.current.owned || [])])
      );

      if (
        !isSuperAdminUser &&
        !isGuestUid &&
        itemId !== null &&
        !mergedCurrentOwned.includes(itemId)
      ) {
        throw new Error(
          'You do not own this cosmetic item. Please unlock it from the Store first.'
        );
      }

      const updatedEquipped: EquippedCosmetics = {
        ...current.equipped,
        [type]: itemId,
      };

      // Optimistically update in-memory ref and cache immediately so UI reflects equip right away
      const updated: WalletDoc = {
        ...current,
        owned:
          itemId && !mergedCurrentOwned.includes(itemId)
            ? [...mergedCurrentOwned, itemId]
            : mergedCurrentOwned,
        equipped: updatedEquipped,
      };
      walletRef.current = updated;
      sessionWalletCache[user.uid] = updated;
      setWallet(updated);
      notifyWalletSubscribers(user.uid, updated);

      if (!isGuestUid) {
        const walletDocRef = doc(db, 'wallets', user.uid);
        try {
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(walletDocRef);
            const curData = snap.exists() ? (snap.data() as WalletDoc) : current;
            const ownedList = Array.from(
              new Set([
                ...(Array.isArray(curData.owned) ? curData.owned : []),
                ...mergedCurrentOwned,
                ...(itemId ? [itemId] : []),
              ])
            );
            if (snap.exists()) {
              tx.update(walletDocRef, {
                owned: ownedList,
                equipped: updatedEquipped,
                updatedAt: serverTimestamp(),
              });
            } else {
              tx.set(
                walletDocRef,
                {
                  balance: typeof curData.balance === 'number' ? curData.balance : current.balance,
                  owned: ownedList,
                  equipped: updatedEquipped,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );
            }
          });
        } catch (err: any) {
          console.warn(
            '[useWallet] equipCosmetic transaction fallback:',
            err?.code || 'ERROR',
            `wallets/${user.uid}`
          );
          await setDoc(
            walletDocRef,
            {
              owned: updated.owned,
              equipped: updatedEquipped,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
        }
      }

      const topLevelSlotField: Record<string, unknown> =
        type === 'effect' ? { effectId: itemId } : { [type]: itemId };
      if (type === 'frame') topLevelSlotField.equippedFrame = itemId;
      if (type === 'avatar') topLevelSlotField.equippedAvatar = itemId;
      if (type === 'banner') topLevelSlotField.equippedBanner = itemId;
      if (type === 'nameplate') topLevelSlotField.equippedNameplate = itemId;

      if (!isGuestUid) {
        // Persist equipped cosmetics to users/{uid} so useUserProfile listener stays in sync
        await setDoc(
          doc(db, 'users', user.uid),
          {
            equipped: updatedEquipped,
            ...topLevelSlotField,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch((err: any) => {
          console.error(
            '[useWallet] Failed to mirror equipped cosmetic to users doc:',
            err?.code || 'ERROR',
            `users/${user.uid}`,
            err
          );
        });
      }

      // Update local cached user profile for both email and guest users
      if (typeof window !== 'undefined' && window.localStorage) {
        for (const lsKey of [`cached_profile_${user.uid}`, `boardly_user_profile_${user.uid}`]) {
          try {
            const raw = window.localStorage.getItem(lsKey);
            const parsed = raw ? JSON.parse(raw) : { uid: user.uid };
            parsed.equipped = { ...(parsed.equipped || {}), ...updatedEquipped };
            Object.assign(parsed, topLevelSlotField);
            window.localStorage.setItem(lsKey, JSON.stringify(parsed));
          } catch {
            // Ignore storage errors
          }
        }
      }

      // Synchronize to public profile so leaderboards, crew roster, and other viewers display it
      await syncPublicProfile(user.uid, {
        equipped: updatedEquipped,
        ...topLevelSlotField,
      }).catch(() => {});

      await syncProfileToD1Backend(user.uid, {
        displayName: user.displayName || undefined,
        avatar: updatedEquipped.avatar ?? '',
        frame: updatedEquipped.frame ?? null,
        banner: updatedEquipped.banner ?? null,
        nameplate: updatedEquipped.nameplate ?? null,
        effect: updatedEquipped.effect ?? null,
      }).catch(() => {});

      broadcastPublicProfileUpdate(user.uid, {
        equipped: updatedEquipped,
        avatar: updatedEquipped.avatar ?? null,
        equippedAvatar: updatedEquipped.avatar ?? null,
        frame: updatedEquipped.frame ?? null,
        equippedFrame: updatedEquipped.frame ?? null,
        banner: updatedEquipped.banner ?? null,
        equippedBanner: updatedEquipped.banner ?? null,
        nameplate: updatedEquipped.nameplate ?? null,
        equippedNameplate: updatedEquipped.nameplate ?? null,
        effectId: updatedEquipped.effect ?? null,
      });
      invalidateCommonsPostsCache();
    },
    [user?.uid, user?.displayName, isSuperAdminUser]
  );

  /**
   * Purchases a cosmetic item via transactional balance deduction and ledger writing.
   * Super Admin can unlock any item for 0 Kobans.
   */
  const purchaseCosmetic = useCallback(
    async (
      item: import('@/data/cosmeticsCatalog').CosmeticItem,
      idempotencyKey?: string
    ) => {
      if (!user?.uid) throw new Error('Must be logged in to purchase cosmetics');
      const currentOwned = Array.from(
        new Set([
          ...(walletRef.current.owned || []),
          ...(sessionWalletCache[user.uid]?.owned || []),
        ])
      );
      if (!isSuperAdminUser && currentOwned.includes(item.id)) {
        throw new Error('You already own this item.');
      }

      const lockKey = `${user.uid}:${item.id}`;
      if (inFlightSingleItemPurchases.has(lockKey)) {
        throw new Error('Purchase is already in progress. Please wait.');
      }
      inFlightSingleItemPurchases.add(lockKey);

      try {
        const { purchaseCosmeticItem } = await import('@/services/kobanService');
        const result = await purchaseCosmeticItem(
          user.uid,
          item,
          isSuperAdminUser,
          idempotencyKey
        );
        const updatedOwned = Array.from(
          new Set([
            ...currentOwned,
            ...(Array.isArray(result.owned) ? result.owned : []),
            item.id,
          ])
        );
        const updated: WalletDoc = {
          ...(sessionWalletCache[user.uid] || walletRef.current),
          balance: result.newBalance,
          owned: updatedOwned,
        };
        // Synchronously update walletRef and session cache BEFORE returning so immediate equipCosmetic succeeds
        walletRef.current = updated;
        sessionWalletCache[user.uid] = updated;
        setWallet(updated);
        notifyWalletSubscribers(user.uid, updated);
        return {
          ...result,
          owned: updatedOwned,
        };
      } finally {
        inFlightSingleItemPurchases.delete(lockKey);
      }
    },
    [user?.uid, isSuperAdminUser]
  );

  /**
   * Purchases a batch of cosmetic items atomically via checkoutStoreCart.
   */
  const purchaseCosmeticBatch = useCallback(
    async (
      items: import('@/data/cosmeticsCatalog').CosmeticItem[],
      idempotencyKey?: string
    ) => {
      if (!user?.uid) throw new Error('Must be logged in to purchase cosmetics');
      const { checkoutStoreCart } = await import('@/services/kobanService');
      const result = await checkoutStoreCart({
        userId: user.uid,
        items,
        idempotencyKey: idempotencyKey || `chk_${Date.now()}`,
        isSuperAdmin: isSuperAdminUser,
      });
      if (result.flaggedItems.length === 0 && result.purchasedItems.length > 0) {
        const mergedOwned = Array.from(
          new Set([
            ...(walletRef.current.owned || []),
            ...(result.owned || []),
            ...result.purchasedItems.map((i) => i.id),
          ])
        );
        const updated: WalletDoc = {
          ...walletRef.current,
          balance: result.newBalance,
          owned: mergedOwned,
        };
        walletRef.current = updated;
        sessionWalletCache[user.uid] = updated;
        setWallet(updated);
        notifyWalletSubscribers(user.uid, updated);
      } else if (result.flaggedItems.length > 0) {
        const updated: WalletDoc = {
          ...walletRef.current,
          balance: result.newBalance,
          owned: Array.from(
            new Set([...(walletRef.current.owned || []), ...(result.owned || [])])
          ),
        };
        walletRef.current = updated;
        sessionWalletCache[user.uid] = updated;
        setWallet(updated);
        notifyWalletSubscribers(user.uid, updated);
      }
      return result;
    },
    [user?.uid, isSuperAdminUser]
  );

  /**
   * Equips multiple cosmetic slots at once (e.g. "Equip now" after multi-buy checkout).
   * If multiple items shared a category, the caller passes the newest item per slot.
   */
  const equipMultipleCosmetics = useCallback(
    async (
      slotUpdates: Partial<
        Record<'effect' | 'frame' | 'nameplate' | 'avatar' | 'banner', string | null>
      >
    ) => {
      if (!user?.uid) throw new Error('Must be logged in to equip cosmetics');
      const current = sessionWalletCache[user.uid] || walletRef.current;
      const isGuestUid = user.uid.startsWith('guest_');

      const updatedEquipped: EquippedCosmetics = {
        ...current.equipped,
        ...slotUpdates,
      };

      const updated: WalletDoc = {
        ...current,
        equipped: updatedEquipped,
      };
      walletRef.current = updated;
      sessionWalletCache[user.uid] = updated;
      setWallet(updated);
      notifyWalletSubscribers(user.uid, updated);

      if (!isGuestUid) {
        const walletDocRef = doc(db, 'wallets', user.uid);
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(walletDocRef);
          const curData = snap.exists() ? (snap.data() as WalletDoc) : current;
          const ownedList = Array.from(
            new Set([
              ...(Array.isArray(curData.owned) ? curData.owned : []),
              ...(Array.isArray(current.owned) ? current.owned : []),
            ])
          );
          if (snap.exists()) {
            tx.update(walletDocRef, {
              owned: ownedList,
              equipped: updatedEquipped,
              updatedAt: serverTimestamp(),
            });
          } else {
            tx.set(
              walletDocRef,
              {
                balance: typeof curData.balance === 'number' ? curData.balance : current.balance,
                owned: ownedList,
                equipped: updatedEquipped,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
        }).catch(() => {});
      }

      const topLevelFields: Record<string, unknown> = {};
      if ('effect' in slotUpdates) topLevelFields.effectId = slotUpdates.effect ?? null;
      if ('frame' in slotUpdates) {
        topLevelFields.frame = slotUpdates.frame ?? null;
        topLevelFields.equippedFrame = slotUpdates.frame ?? null;
      }
      if ('avatar' in slotUpdates) {
        topLevelFields.avatar = slotUpdates.avatar ?? null;
        topLevelFields.equippedAvatar = slotUpdates.avatar ?? null;
      }
      if ('banner' in slotUpdates) {
        topLevelFields.banner = slotUpdates.banner ?? null;
        topLevelFields.equippedBanner = slotUpdates.banner ?? null;
      }
      if ('nameplate' in slotUpdates) {
        topLevelFields.nameplate = slotUpdates.nameplate ?? null;
        topLevelFields.equippedNameplate = slotUpdates.nameplate ?? null;
      }

      if (!isGuestUid) {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            equipped: updatedEquipped,
            ...topLevelFields,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch((err: any) => {
          console.error('[useWallet] Failed to mirror multi-equip to users doc:', err);
        });
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        for (const lsKey of [`cached_profile_${user.uid}`, `boardly_user_profile_${user.uid}`]) {
          try {
            const raw = window.localStorage.getItem(lsKey);
            const parsed = raw ? JSON.parse(raw) : { uid: user.uid };
            parsed.equipped = { ...(parsed.equipped || {}), ...updatedEquipped };
            Object.assign(parsed, topLevelFields);
            window.localStorage.setItem(lsKey, JSON.stringify(parsed));
          } catch {
            // Ignore
          }
        }
      }

      await syncPublicProfile(user.uid, {
        equipped: updatedEquipped,
        ...topLevelFields,
      }).catch(() => {});

      await syncProfileToD1Backend(user.uid, {
        displayName: user.displayName || undefined,
        avatar: updatedEquipped.avatar ?? '',
        frame: updatedEquipped.frame ?? null,
        banner: updatedEquipped.banner ?? null,
        nameplate: updatedEquipped.nameplate ?? null,
        effect: updatedEquipped.effect ?? null,
      }).catch(() => {});

      broadcastPublicProfileUpdate(user.uid, {
        equipped: updatedEquipped,
        avatar: updatedEquipped.avatar ?? null,
        equippedAvatar: updatedEquipped.avatar ?? null,
        frame: updatedEquipped.frame ?? null,
        equippedFrame: updatedEquipped.frame ?? null,
        banner: updatedEquipped.banner ?? null,
        equippedBanner: updatedEquipped.banner ?? null,
        nameplate: updatedEquipped.nameplate ?? null,
        equippedNameplate: updatedEquipped.nameplate ?? null,
        effectId: updatedEquipped.effect ?? null,
      });
      invalidateCommonsPostsCache();
    },
    [user?.uid, user?.displayName]
  );

  const refreshWallet = useCallback(async () => {
    if (user?.uid) {
      await fetchWallet(user.uid, true);
    }
  }, [user?.uid, fetchWallet]);

  return {
    wallet,
    balance: wallet.balance,
    owned: wallet.owned,
    equipped: wallet.equipped,
    loading,
    isSuperAdmin: isSuperAdminUser,
    equipCosmetic,
    equipMultipleCosmetics,
    purchaseCosmetic,
    purchaseCosmeticBatch,
    refreshWallet,
  };
}
