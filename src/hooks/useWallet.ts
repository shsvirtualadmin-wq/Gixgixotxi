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
const sessionWalletCache: { [uid: string]: WalletDoc } = {};
const inFlightWalletPromises: { [uid: string]: Promise<WalletDoc> } = {};
const walletSubscribers = new Set<(uid: string, doc: WalletDoc) => void>();

function notifyWalletSubscribers(uid: string, doc: WalletDoc) {
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
  const initialWallet =
    user?.uid && sessionWalletCache[user.uid]
      ? sessionWalletCache[user.uid]
      : DEFAULT_WALLET;

  const [wallet, setWallet] = useState<WalletDoc>(initialWallet);
  const [loading, setLoading] = useState<boolean>(
    Boolean(user?.uid && !sessionWalletCache[user.uid])
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
    if (!uid || uid.startsWith('guest_')) {
      sessionWalletCache[uid] = DEFAULT_WALLET;
      setWallet(DEFAULT_WALLET);
      setLoading(false);
      return DEFAULT_WALLET;
    }

    if (!forceRefresh && sessionWalletCache[uid]) {
      setWallet(sessionWalletCache[uid]);
      setLoading(false);
      return sessionWalletCache[uid];
    }

    if (!forceRefresh && inFlightWalletPromises[uid]) {
      setLoading(true);
      try {
        const sharedResult = await inFlightWalletPromises[uid];
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
            new Set([...walletOwned, ...userOwned, ...unlockedIds])
          );

          const rawEquipped = {
            ...(uData?.equipped || {}),
            ...(data.equipped || {}),
          };

          const cleanWallet: WalletDoc = {
            balance: resolvedBalance,
            owned: mergedOwned,
            equipped: {
              effect: rawEquipped.effect ?? uData?.effectId ?? null,
              frame: rawEquipped.frame ?? uData?.frame ?? uData?.equippedFrame ?? null,
              nameplate:
                rawEquipped.nameplate ?? uData?.nameplate ?? uData?.equippedNameplate ?? null,
              avatar: rawEquipped.avatar ?? uData?.avatar ?? uData?.equippedAvatar ?? null,
              banner: rawEquipped.banner ?? uData?.banner ?? uData?.equippedBanner ?? null,
            },
            updatedAt: data.updatedAt,
          };
          sessionWalletCache[uid] = cleanWallet;
          notifyWalletSubscribers(uid, cleanWallet);
          return cleanWallet;
        } else {
          // Initialize wallet document using existing user balance & unlocked items so we never overwrite a non-zero user balance with 0
          const mergedOwned = Array.from(new Set([...userOwned, ...unlockedIds]));
          const uEquipped = uData?.equipped || {};
          const initial: WalletDoc = {
            balance: userBalance,
            owned: mergedOwned,
            equipped: {
              effect: uEquipped.effect ?? uData?.effectId ?? null,
              frame: uEquipped.frame ?? uData?.frame ?? uData?.equippedFrame ?? null,
              nameplate:
                uEquipped.nameplate ?? uData?.nameplate ?? uData?.equippedNameplate ?? null,
              avatar: uEquipped.avatar ?? uData?.avatar ?? uData?.equippedAvatar ?? null,
              banner: uEquipped.banner ?? uData?.banner ?? uData?.equippedBanner ?? null,
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
      const current = walletRef.current;

      if (!isSuperAdminUser && itemId !== null && !current.owned.includes(itemId)) {
        throw new Error(
          'You do not own this cosmetic item. Please unlock it from the Store first.'
        );
      }

      const updatedEquipped: EquippedCosmetics = {
        ...current.equipped,
        [type]: itemId,
      };

      const walletDocRef = doc(db, 'wallets', user.uid);

      try {
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(walletDocRef);
          const curData = snap.exists() ? (snap.data() as WalletDoc) : current;
          const ownedList = Array.from(
            new Set([
              ...(Array.isArray(curData.owned) ? curData.owned : []),
              ...(Array.isArray(current.owned) ? current.owned : []),
            ])
          );
          if (!isSuperAdminUser && itemId !== null && !ownedList.includes(itemId)) {
            throw new Error('Item not owned');
          }
          if (snap.exists()) {
            tx.update(walletDocRef, {
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
        console.error(
          '[useWallet] equipCosmetic transaction error:',
          err?.code || 'ERROR',
          `wallets/${user.uid}`,
          err
        );
        throw err;
      }

      const topLevelSlotField: Record<string, unknown> =
        type === 'effect' ? { effectId: itemId } : { [type]: itemId };
      if (type === 'frame') topLevelSlotField.equippedFrame = itemId;
      if (type === 'avatar') topLevelSlotField.equippedAvatar = itemId;
      if (type === 'banner') topLevelSlotField.equippedBanner = itemId;
      if (type === 'nameplate') topLevelSlotField.equippedNameplate = itemId;

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

      // Synchronize to public profile so leaderboards, crew roster, and other viewers display it
      await syncPublicProfile(user.uid, {
        equipped: updatedEquipped,
        ...topLevelSlotField,
      });

      syncProfileToD1Backend(user.uid, {
        avatar: updatedEquipped.avatar ?? undefined,
        frame: updatedEquipped.frame ?? undefined,
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

      const updated: WalletDoc = {
        ...current,
        equipped: updatedEquipped,
      };
      sessionWalletCache[user.uid] = updated;
      setWallet(updated);
      notifyWalletSubscribers(user.uid, updated);
    },
    [user?.uid, isSuperAdminUser]
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
      const { purchaseCosmeticItem } = await import('@/services/kobanService');
      const result = await purchaseCosmeticItem(
        user.uid,
        item,
        isSuperAdminUser,
        idempotencyKey
      );
      const updatedOwned = result.owned
        ? result.owned
        : walletRef.current.owned.includes(item.id)
        ? walletRef.current.owned
        : [...walletRef.current.owned, item.id];
      const updated: WalletDoc = {
        ...walletRef.current,
        balance: result.newBalance,
        owned: updatedOwned,
      };
      sessionWalletCache[user.uid] = updated;
      setWallet(updated);
      notifyWalletSubscribers(user.uid, updated);
      return result;
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
        const updated: WalletDoc = {
          ...walletRef.current,
          balance: result.newBalance,
          owned: result.owned,
        };
        sessionWalletCache[user.uid] = updated;
        setWallet(updated);
        notifyWalletSubscribers(user.uid, updated);
      } else if (result.flaggedItems.length > 0) {
        const updated: WalletDoc = {
          ...walletRef.current,
          balance: result.newBalance,
          owned: result.owned,
        };
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
      const current = walletRef.current;

      const updatedEquipped: EquippedCosmetics = {
        ...current.equipped,
        ...slotUpdates,
      };

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

      await syncPublicProfile(user.uid, {
        equipped: updatedEquipped,
        ...topLevelFields,
      });

      syncProfileToD1Backend(user.uid, {
        avatar: updatedEquipped.avatar ?? undefined,
        frame: updatedEquipped.frame ?? undefined,
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

      const updated: WalletDoc = {
        ...walletRef.current,
        equipped: updatedEquipped,
      };
      sessionWalletCache[user.uid] = updated;
      setWallet(updated);
      notifyWalletSubscribers(user.uid, updated);
    },
    [user?.uid]
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
