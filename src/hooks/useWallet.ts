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
import { auth, db } from '@/lib/firebase';
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
import { isValidAvatar } from '@/lib/matrixAvatarsData';
import {
  getStarterAvatarForUser,
  mergeCanonicalInventory,
  normalizeInventoryItemId,
} from '@/lib/inventorySource';
import {
  getEquippedLoadout,
  getKobans,
  measureRequest,
  setCachedEquippedLoadout,
  setCachedKobans,
} from '@/utils/userStateSource';
import type { EquippedCosmetics } from '@/types';

export interface WalletDoc {
  balance: number;
  owned: string[];
  equipped: EquippedCosmetics;
  updatedAt?: unknown;
}

type CosmeticSlot = 'effect' | 'frame' | 'nameplate' | 'avatar' | 'banner';

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

// Module-level in-memory session cache & in-flight deduplication
const sessionWalletCache: { [uid: string]: WalletDoc | undefined } = {};
const sessionInventoryConfirmed: { [uid: string]: boolean | undefined } = {};
const inFlightWalletPromises: {
  [uid: string]: Promise<{ wallet: WalletDoc; confirmed: boolean; error: string | null }> | undefined;
} = {};
const inFlightSingleItemPurchases = new Set<string>();
const walletSubscribers = new Set<
  (uid: string, doc: WalletDoc, confirmed: boolean) => void
>();

function dispatchEquippedUpdatedEvent(uid: string, equipped: EquippedCosmetics): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent('boardly:equipped-updated', {
        detail: { uid, equipped },
      })
    );
  } catch {
    // Ignore event dispatch failures
  }
}

function notifyWalletSubscribers(uid: string, doc: WalletDoc, confirmed = true) {
  setCachedKobans(uid, doc.balance);
  setCachedEquippedLoadout(
    uid,
    {
      avatar: doc.equipped?.avatar ?? null,
      frame: doc.equipped?.frame ?? null,
      banner: doc.equipped?.banner ?? null,
      nameplate: doc.equipped?.nameplate ?? null,
      effect: doc.equipped?.effect ?? null,
    },
    { merge: false }
  );
  if (confirmed) {
    sessionInventoryConfirmed[uid] = true;
    writeOptimisticWalletSnapshot({
      uid,
      balance: doc.balance,
      owned: doc.owned,
      equipped: doc.equipped,
    });
  }
  walletSubscribers.forEach((cb) => {
    try {
      cb(uid, doc, confirmed);
    } catch {
      // Ignore subscriber error
    }
  });
}

function mirrorEquippedToLocalProfileCache(
  uid: string,
  updatedEquipped: EquippedCosmetics,
  topLevelFields: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  for (const lsKey of [`cached_profile_${uid}`, `boardly_user_profile_${uid}`]) {
    try {
      const raw = window.localStorage.getItem(lsKey);
      const parsed = raw ? JSON.parse(raw) : { uid };
      parsed.equipped = { ...(parsed.equipped || {}), ...updatedEquipped };
      Object.assign(parsed, topLevelFields);
      window.localStorage.setItem(lsKey, JSON.stringify(parsed));
    } catch {
      // Ignore storage errors
    }
  }
}

function broadcastEquippedEverywhere(uid: string, updatedEquipped: EquippedCosmetics): void {
  broadcastPublicProfileUpdate(uid, {
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
    equippedEffect: updatedEquipped.effect ?? null,
  });
  dispatchEquippedUpdatedEvent(uid, updatedEquipped);
}

async function getFirebaseAuthToken(): Promise<string | null> {
  try {
    const current = auth.currentUser;
    if (!current || typeof current.getIdToken !== 'function') return null;
    const token = await current.getIdToken();
    return token && token.trim().length > 0 ? token.trim() : null;
  } catch {
    return null;
  }
}

export function useWallet() {
  const { user, authStatus } = useAuth();
  const initialMeta = (() => {
    if (authStatus === 'loading' || !user?.uid) {
      return {
        wallet: DEFAULT_WALLET,
        hasBalanceCache: false,
        hasConfirmedInventory: false,
      };
    }
    if (sessionWalletCache[user.uid] && sessionInventoryConfirmed[user.uid]) {
      return {
        wallet: sessionWalletCache[user.uid]!,
        hasBalanceCache: true,
        hasConfirmedInventory: true,
      };
    }
    const optimistic = readOptimisticWalletSnapshot(user.uid);
    const cachedKobans = getKobans(user.uid);
    const cachedLoadout = getEquippedLoadout(user.uid);
    if (optimistic) {
      return {
        wallet: {
          balance:
            cachedKobans.loaded && cachedKobans.balance !== null
              ? cachedKobans.balance
              : optimistic.balance,
          owned: Array.isArray(optimistic.owned) ? optimistic.owned : [],
          equipped: {
            effect: cachedLoadout.effect ?? optimistic.equipped?.effect ?? null,
            frame: cachedLoadout.frame ?? optimistic.equipped?.frame ?? null,
            nameplate: cachedLoadout.nameplate ?? optimistic.equipped?.nameplate ?? null,
            avatar: cachedLoadout.avatar ?? optimistic.equipped?.avatar ?? null,
            banner: cachedLoadout.banner ?? optimistic.equipped?.banner ?? null,
          },
        },
        hasBalanceCache: true,
        hasConfirmedInventory: false,
      };
    }
    if (cachedKobans.loaded && cachedKobans.balance !== null) {
      return {
        wallet: {
          balance: cachedKobans.balance,
          owned: [],
          equipped: {
            effect: cachedLoadout.effect,
            frame: cachedLoadout.frame,
            nameplate: cachedLoadout.nameplate,
            avatar: cachedLoadout.avatar,
            banner: cachedLoadout.banner,
          },
        },
        hasBalanceCache: true,
        hasConfirmedInventory: false,
      };
    }
    return {
      wallet: {
        ...DEFAULT_WALLET,
        equipped: {
          effect: cachedLoadout.effect,
          frame: cachedLoadout.frame,
          nameplate: cachedLoadout.nameplate,
          avatar: cachedLoadout.avatar,
          banner: cachedLoadout.banner,
        },
      },
      hasBalanceCache: false,
      hasConfirmedInventory: false,
    };
  })();

  const [wallet, setWallet] = useState<WalletDoc>(initialMeta.wallet);
  const [balanceLoaded, setBalanceLoaded] = useState<boolean>(
    authStatus === 'unauthenticated' ? true : initialMeta.hasBalanceCache
  );
  const [inventoryLoaded, setInventoryLoaded] = useState<boolean>(
    initialMeta.hasConfirmedInventory
  );
  const [loading, setLoading] = useState<boolean>(
    authStatus === 'loading' || (Boolean(user?.uid) && !initialMeta.hasConfirmedInventory)
  );
  const [walletError, setWalletError] = useState<string | null>(null);
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
      setInventoryLoaded(false);
      setLoading(false);
      return DEFAULT_WALLET;
    }

    if (uid.startsWith('guest_')) {
      const existingCached = sessionWalletCache[uid];
      const optimistic = readOptimisticWalletSnapshot(uid);
      const cachedProfile = getSharedUserProfileSnapshot(uid) as Record<string, any> | null;
      const mergedGuest = mergeCanonicalInventory({
        uid,
        walletDoc: existingCached
          ? { owned: existingCached.owned, equipped: existingCached.equipped }
          : optimistic
          ? { owned: optimistic.owned, equipped: optimistic.equipped }
          : null,
        userDoc: cachedProfile,
        cachedOwned: [
          ...(existingCached?.owned || []),
          ...(optimistic?.owned || []),
        ],
        cachedEquipped: existingCached?.equipped || optimistic?.equipped || null,
      });
      const guestWallet: WalletDoc = {
        balance: existingCached?.balance ?? optimistic?.balance ?? 0,
        owned: mergedGuest.owned,
        equipped: mergedGuest.equipped,
      };
      walletRef.current = guestWallet;
      sessionWalletCache[uid] = guestWallet;
      setWallet(guestWallet);
      setWalletError(null);
      setBalanceLoaded(true);
      setInventoryLoaded(true);
      notifyWalletSubscribers(uid, guestWallet, true);
      setLoading(false);
      return guestWallet;
    }

    if (!forceRefresh && sessionWalletCache[uid] && sessionInventoryConfirmed[uid]) {
      const cached = sessionWalletCache[uid]!;
      walletRef.current = cached;
      setWallet(cached);
      setWalletError(null);
      setBalanceLoaded(true);
      setInventoryLoaded(true);
      setLoading(false);
      return cached;
    }

    if (!forceRefresh && inFlightWalletPromises[uid]) {
      setLoading(true);
      try {
        const sharedResult = await inFlightWalletPromises[uid]!;
        walletRef.current = sharedResult.wallet;
        setWallet(sharedResult.wallet);
        setWalletError(sharedResult.error);
        if (sharedResult.confirmed) {
          setInventoryLoaded(true);
          setBalanceLoaded(true);
        }
        return sharedResult.wallet;
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    setWalletError(null);

    const loadPromise = (async (): Promise<{
      wallet: WalletDoc;
      confirmed: boolean;
      error: string | null;
    }> => {
      let apiFailureMessage: string | null = null;
      try {
        // 1. Primary canonical source: GET /api/inventory (merges wallets, users, inventory, subcollections, publicProfiles, D1 & auto-backfills starter items)
        const token = await getFirebaseAuthToken();
        if (token) {
          const requestUrl = '/api/inventory';
          try {
            const resp = await measureRequest(
              'wallet:api-inventory',
              () =>
                fetch(requestUrl, {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                  },
                }),
              10000
            );
            const rawText = await resp.text();
            let body: any = null;
            try {
              body = rawText ? JSON.parse(rawText) : null;
            } catch {
              body = rawText;
            }
            console.info('[Locker/Inventory] GET /api/inventory', {
              url: requestUrl,
              status: resp.status,
              uid,
              ownedCount: Array.isArray(body?.owned) ? body.owned.length : null,
              equippedCount: typeof body?.equippedCount === 'number' ? body.equippedCount : null,
              body,
            });

            if (resp.ok && body && body.ok === true && Array.isArray(body.owned)) {
              const mergedFromApi = mergeCanonicalInventory({
                uid,
                walletDoc: {
                  owned: body.owned,
                  equipped: body.equipped,
                },
                cachedOwned: sessionWalletCache[uid]?.owned || [],
                cachedEquipped: body.equipped || null,
              });
              const resolvedBalance =
                typeof body.balance === 'number' && Number.isFinite(body.balance)
                  ? Math.max(0, Math.floor(body.balance))
                  : walletRef.current.balance;
              const cleanWallet: WalletDoc = {
                balance: resolvedBalance,
                owned: mergedFromApi.owned,
                equipped: mergedFromApi.equipped,
              };
              walletRef.current = cleanWallet;
              sessionWalletCache[uid] = cleanWallet;
              notifyWalletSubscribers(uid, cleanWallet, true);
              return { wallet: cleanWallet, confirmed: true, error: null };
            }

            apiFailureMessage =
              (body && typeof body === 'object' && (body.error || body.message)) ||
              `Inventory request failed (${resp.status}).`;
          } catch (apiErr: any) {
            apiFailureMessage = apiErr?.message || 'Inventory API request failed.';
            console.warn('[Locker/Inventory] GET /api/inventory failed, falling back to Firestore:', {
              url: requestUrl,
              uid,
              error: apiFailureMessage,
            });
          }
        }

        // 2. Fallback: read ALL Firestore inventory sources in parallel (never swallow every error into owned: [])
        const walletDocRef = doc(db, 'wallets', uid);
        const userDocRef = doc(db, 'users', uid);
        const inventoryDocRef = doc(db, 'inventory', uid);
        const publicProfileDocRef = doc(db, 'publicProfiles', uid);
        const inventorySubColRef = collection(db, 'users', uid, 'inventory');
        const unlockedSubColRef = collection(db, 'users', uid, 'unlocked');

        let authoritativeReadsSucceeded = 0;
        let lastFirestoreErr: any = null;

        const [
          walletSnap,
          userSnap,
          inventorySnap,
          publicProfileSnap,
          inventorySubSnap,
          unlockedSubSnap,
        ] = await measureRequest(
          'wallet:firestore-sync',
          () =>
            Promise.all([
              getDoc(walletDocRef)
                .then((s) => {
                  authoritativeReadsSucceeded += 1;
                  return s;
                })
                .catch((err) => {
                  lastFirestoreErr = err;
                  console.error(
                    '[useWallet] getDoc wallets error:',
                    err?.code || 'ERROR',
                    `wallets/${uid}`,
                    err
                  );
                  return null;
                }),
              getDoc(userDocRef)
                .then((s) => {
                  authoritativeReadsSucceeded += 1;
                  return s;
                })
                .catch((err) => {
                  lastFirestoreErr = err;
                  console.error(
                    '[useWallet] getDoc users error:',
                    err?.code || 'ERROR',
                    `users/${uid}`,
                    err
                  );
                  return null;
                }),
              getDoc(inventoryDocRef)
                .then((s) => {
                  authoritativeReadsSucceeded += 1;
                  return s;
                })
                .catch((err) => {
                  // inventory/{uid} may be missing or restricted; log softly
                  console.warn(
                    '[useWallet] getDoc inventory notice:',
                    err?.code || 'ERROR',
                    `inventory/${uid}`
                  );
                  return null;
                }),
              getDoc(publicProfileDocRef)
                .then((s) => {
                  authoritativeReadsSucceeded += 1;
                  return s;
                })
                .catch(() => null),
              getDocs(inventorySubColRef)
                .then((s) => {
                  authoritativeReadsSucceeded += 1;
                  return s;
                })
                .catch(() => null),
              getDocs(unlockedSubColRef)
                .then((s) => {
                  authoritativeReadsSucceeded += 1;
                  return s;
                })
                .catch((err) => {
                  lastFirestoreErr = err;
                  console.warn(
                    '[useWallet] getDocs unlocked notice:',
                    err?.code || 'ERROR',
                    `users/${uid}/unlocked`
                  );
                  return null;
                }),
            ]),
          9000
        );

        // If BOTH /api/inventory AND every Firestore read failed, surface an error instead of caching owned: []!
        if (authoritativeReadsSucceeded === 0) {
          const errMessage =
            apiFailureMessage ||
            lastFirestoreErr?.message ||
            'Could not load your Locker inventory. Please retry.';
          return {
            wallet: sessionWalletCache[uid] || walletRef.current || DEFAULT_WALLET,
            confirmed: Boolean(sessionInventoryConfirmed[uid]),
            error: errMessage,
          };
        }

        const walletData = walletSnap && walletSnap.exists() ? (walletSnap.data() as Record<string, any>) : null;
        const cachedUserProfile = getSharedUserProfileSnapshot(uid) as Record<string, any> | null;
        const userData =
          userSnap && userSnap.exists()
            ? (userSnap.data() as Record<string, any>)
            : cachedUserProfile;
        const inventoryData =
          inventorySnap && inventorySnap.exists()
            ? (inventorySnap.data() as Record<string, any>)
            : null;
        const publicProfileData =
          publicProfileSnap && publicProfileSnap.exists()
            ? (publicProfileSnap.data() as Record<string, any>)
            : null;
        const inventorySubDocs = inventorySubSnap
          ? inventorySubSnap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, any> }))
          : [];
        const unlockedSubDocs = unlockedSubSnap
          ? unlockedSubSnap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, any> }))
          : [];

        const userKobans =
          userData && typeof userData.kobans === 'number' && Number.isFinite(userData.kobans)
            ? Math.max(0, Math.floor(userData.kobans))
            : 0;
        const userKobanBalance =
          userData &&
          typeof userData.kobanBalance === 'number' &&
          Number.isFinite(userData.kobanBalance)
            ? Math.max(0, Math.floor(userData.kobanBalance))
            : 0;
        const userBalance = Math.max(userKobans, userKobanBalance);

        const walletBalance =
          walletData && typeof walletData.balance === 'number' && Number.isFinite(walletData.balance)
            ? Math.max(0, Math.floor(walletData.balance))
            : null;
        const resolvedBalance =
          walletBalance !== null && walletBalance > 0
            ? walletBalance
            : Math.max(walletBalance ?? 0, userBalance);

        const merged = mergeCanonicalInventory({
          uid,
          walletDoc: walletData,
          userDoc: userData,
          inventoryDoc: inventoryData,
          publicProfileDoc: publicProfileData,
          inventorySubcollectionDocs: inventorySubDocs,
          unlockedSubcollectionDocs: unlockedSubDocs,
          cachedOwned: sessionWalletCache[uid]?.owned || [],
          cachedEquipped: sessionWalletCache[uid]?.equipped || null,
        });

        const cleanWallet: WalletDoc = {
          balance: resolvedBalance,
          owned: merged.owned,
          equipped: merged.equipped,
          updatedAt: walletData?.updatedAt,
        };

        walletRef.current = cleanWallet;
        sessionWalletCache[uid] = cleanWallet;
        notifyWalletSubscribers(uid, cleanWallet, true);
        return { wallet: cleanWallet, confirmed: true, error: null };
      } catch (err: any) {
        const errMessage =
          apiFailureMessage || err?.message || 'Could not load your Locker inventory. Please retry.';
        console.error('[useWallet] Wallet read error:', err?.code || 'ERROR', `wallets/${uid}`, err);
        return {
          wallet: sessionWalletCache[uid] || walletRef.current || DEFAULT_WALLET,
          confirmed: Boolean(sessionInventoryConfirmed[uid]),
          error: errMessage,
        };
      } finally {
        delete inFlightWalletPromises[uid];
      }
    })();

    inFlightWalletPromises[uid] = loadPromise;
    try {
      const resolved = await loadPromise;
      walletRef.current = resolved.wallet;
      setWallet(resolved.wallet);
      setWalletError(resolved.error);
      if (resolved.confirmed) {
        setInventoryLoaded(true);
      }
      setBalanceLoaded(true);
      return resolved.wallet;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait strictly for auth resolution before touching inventory or showing empty state
    if (authStatus === 'loading') {
      setLoading(true);
      setInventoryLoaded(false);
      setWalletError(null);
      return;
    }

    if (authStatus !== 'authenticated' || !user?.uid) {
      setWallet(DEFAULT_WALLET);
      setBalanceLoaded(true);
      setInventoryLoaded(false);
      setWalletError(null);
      setLoading(false);
      return;
    }

    const cachedSnap = getKobans(user.uid);
    const cachedLoadout = getEquippedLoadout(user.uid);
    if (sessionWalletCache[user.uid] && sessionInventoryConfirmed[user.uid]) {
      setWallet(sessionWalletCache[user.uid]!);
      setBalanceLoaded(true);
      setInventoryLoaded(true);
      setWalletError(null);
      setLoading(false);
    } else if (cachedSnap.loaded && cachedSnap.balance !== null) {
      setWallet((prev) => ({
        ...prev,
        balance: cachedSnap.balance!,
        equipped: {
          effect: cachedLoadout.effect ?? prev.equipped.effect,
          frame: cachedLoadout.frame ?? prev.equipped.frame,
          nameplate: cachedLoadout.nameplate ?? prev.equipped.nameplate,
          avatar: cachedLoadout.avatar ?? prev.equipped.avatar,
          banner: cachedLoadout.banner ?? prev.equipped.banner,
        },
      }));
      setBalanceLoaded(true);
      setInventoryLoaded(false);
      setLoading(true);
    } else {
      setBalanceLoaded(false);
      setInventoryLoaded(false);
      setLoading(true);
    }

    const onSub = (updatedUid: string, updatedDoc: WalletDoc, confirmed: boolean) => {
      if (updatedUid === user.uid) {
        walletRef.current = updatedDoc;
        setWallet(updatedDoc);
        setBalanceLoaded(true);
        if (confirmed) {
          setInventoryLoaded(true);
          setWalletError(null);
          setLoading(false);
        }
      }
    };
    walletSubscribers.add(onSub);

    void fetchWallet(user.uid, false);

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
        notifyWalletSubscribers(user.uid, nextWallet, Boolean(sessionInventoryConfirmed[user.uid]));
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
  }, [authStatus, user?.uid, fetchWallet]);

  /**
   * Shared server-first equip/unequip helper for single or multi-slot updates.
   * Calls POST /api/inventory/equip (updating wallets, inventory, users, publicProfiles, D1)
   * and broadcasts immediately to Locker, Header, and Profile.
   */
  const persistEquipSlots = useCallback(
    async (slotUpdates: Partial<Record<CosmeticSlot, string | null>>) => {
      if (!user?.uid) throw new Error('Must be logged in to equip cosmetics');
      const uid = user.uid;
      const isGuestUid = uid.startsWith('guest_');
      const current = sessionWalletCache[uid] || walletRef.current;
      const starterAvatarKey = getStarterAvatarForUser(uid).key;
      const mergedCurrentOwned = Array.from(
        new Set([
          starterAvatarKey,
          ...(current.owned || []),
          ...(walletRef.current.owned || []),
        ])
      );

      const normalizedUpdates: Partial<Record<CosmeticSlot, string | null>> = {};
      const updatedEquipped: EquippedCosmetics = { ...current.equipped };

      for (const slot of ['avatar', 'frame', 'banner', 'nameplate', 'effect'] as CosmeticSlot[]) {
        if (!(slot in slotUpdates)) continue;
        const rawVal = slotUpdates[slot];
        if (rawVal === null || rawVal === undefined || rawVal === '' || rawVal === 'none') {
          const nextVal = slot === 'avatar' ? starterAvatarKey : null;
          normalizedUpdates[slot] = nextVal;
          updatedEquipped[slot] = nextVal;
        } else {
          const normalized = normalizeInventoryItemId(rawVal, slot);
          if (!normalized) {
            throw new Error(`Invalid ${slot} item selected.`);
          }
          const isFreeSystemAvatar = Boolean(slot === 'avatar' && isValidAvatar(normalized));
          if (
            !isSuperAdminUser &&
            !isGuestUid &&
            !isFreeSystemAvatar &&
            !mergedCurrentOwned.includes(normalized)
          ) {
            throw new Error(
              'You do not own this cosmetic item. Please unlock it from the Store first.'
            );
          }
          normalizedUpdates[slot] = normalized;
          updatedEquipped[slot] = normalized;
        }
      }

      const newlyAddedOwned = Object.values(normalizedUpdates).filter(
        (v): v is string => typeof v === 'string' && v.length > 0 && !mergedCurrentOwned.includes(v)
      );
      const nextOwned =
        newlyAddedOwned.length > 0
          ? [...mergedCurrentOwned, ...newlyAddedOwned]
          : mergedCurrentOwned;

      const optimisticWallet: WalletDoc = {
        ...current,
        owned: nextOwned,
        equipped: updatedEquipped,
      };

      const topLevelFields: Record<string, unknown> = {};
      if ('effect' in normalizedUpdates) {
        topLevelFields.effectId = updatedEquipped.effect ?? null;
        topLevelFields.equippedEffect = updatedEquipped.effect ?? null;
      }
      if ('frame' in normalizedUpdates) {
        topLevelFields.frame = updatedEquipped.frame ?? null;
        topLevelFields.equippedFrame = updatedEquipped.frame ?? null;
      }
      if ('avatar' in normalizedUpdates) {
        topLevelFields.avatar = updatedEquipped.avatar ?? null;
        topLevelFields.equippedAvatar = updatedEquipped.avatar ?? null;
      }
      if ('banner' in normalizedUpdates) {
        topLevelFields.banner = updatedEquipped.banner ?? null;
        topLevelFields.equippedBanner = updatedEquipped.banner ?? null;
      }
      if ('nameplate' in normalizedUpdates) {
        topLevelFields.nameplate = updatedEquipped.nameplate ?? null;
        topLevelFields.equippedNameplate = updatedEquipped.nameplate ?? null;
      }

      // 1. Immediate optimistic UI update across Locker, Header, and Profile
      walletRef.current = optimisticWallet;
      sessionWalletCache[uid] = optimisticWallet;
      setWallet(optimisticWallet);
      notifyWalletSubscribers(uid, optimisticWallet, true);
      mirrorEquippedToLocalProfileCache(uid, updatedEquipped, topLevelFields);
      broadcastEquippedEverywhere(uid, updatedEquipped);

      if (isGuestUid) {
        invalidateCommonsPostsCache();
        return;
      }

      // 2. Try canonical server endpoint POST /api/inventory/equip first
      let serverSucceeded = false;
      const token = await getFirebaseAuthToken();
      if (token) {
        try {
          const resp = await fetch('/api/inventory/equip', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ slots: normalizedUpdates }),
          });
          const body = await resp.json().catch(() => null);
          if (resp.ok && body?.ok) {
            serverSucceeded = true;
            const serverMerged = mergeCanonicalInventory({
              uid,
              walletDoc: {
                owned: Array.isArray(body.owned) ? body.owned : nextOwned,
                equipped: body.equipped || updatedEquipped,
              },
            });
            const confirmedWallet: WalletDoc = {
              ...optimisticWallet,
              owned: serverMerged.owned,
              equipped: serverMerged.equipped,
            };
            walletRef.current = confirmedWallet;
            sessionWalletCache[uid] = confirmedWallet;
            setWallet(confirmedWallet);
            notifyWalletSubscribers(uid, confirmedWallet, true);
            mirrorEquippedToLocalProfileCache(uid, confirmedWallet.equipped, {
              avatar: confirmedWallet.equipped.avatar ?? null,
              equippedAvatar: confirmedWallet.equipped.avatar ?? null,
              frame: confirmedWallet.equipped.frame ?? null,
              equippedFrame: confirmedWallet.equipped.frame ?? null,
              banner: confirmedWallet.equipped.banner ?? null,
              equippedBanner: confirmedWallet.equipped.banner ?? null,
              nameplate: confirmedWallet.equipped.nameplate ?? null,
              equippedNameplate: confirmedWallet.equipped.nameplate ?? null,
              effectId: confirmedWallet.equipped.effect ?? null,
              equippedEffect: confirmedWallet.equipped.effect ?? null,
            });
            broadcastEquippedEverywhere(uid, confirmedWallet.equipped);
            invalidateCommonsPostsCache();
            return;
          }
          if (resp.status === 403 || resp.status === 400) {
            // Rollback optimistic update on authoritative rejection
            walletRef.current = current;
            sessionWalletCache[uid] = current;
            setWallet(current);
            notifyWalletSubscribers(uid, current, Boolean(sessionInventoryConfirmed[uid]));
            broadcastEquippedEverywhere(uid, current.equipped);
            throw new Error(body?.error || 'Could not equip this item.');
          }
        } catch (err: any) {
          if (
            err?.message &&
            (err.message.includes('do not own') || err.message.includes('Invalid'))
          ) {
            throw err;
          }
          console.warn('[useWallet] POST /api/inventory/equip fallback to Firestore:', err?.message);
        }
      }

      if (!serverSucceeded) {
        // 3. Firestore fallback if server endpoint is unreachable
        const walletDocRef = doc(db, 'wallets', uid);
        try {
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(walletDocRef);
            if (snap.exists()) {
              tx.update(walletDocRef, {
                equipped: updatedEquipped,
                updatedAt: serverTimestamp(),
              });
            } else {
              tx.set(
                walletDocRef,
                {
                  balance: 0,
                  owned: [],
                  equipped: updatedEquipped,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );
            }
          });
        } catch {
          await setDoc(
            walletDocRef,
            {
              equipped: updatedEquipped,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
        }

        await setDoc(
          doc(db, 'users', uid),
          {
            equipped: updatedEquipped,
            ...topLevelFields,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch((err: any) => {
          console.error(
            '[useWallet] Failed to mirror equipped cosmetic to users doc:',
            err?.code || 'ERROR',
            `users/${uid}`,
            err
          );
        });

        await syncPublicProfile(uid, {
          equipped: updatedEquipped,
          ...topLevelFields,
        }).catch(() => {});

        await syncProfileToD1Backend(uid, {
          displayName: user.displayName || undefined,
          avatar: updatedEquipped.avatar ?? '',
          frame: updatedEquipped.frame ?? null,
          banner: updatedEquipped.banner ?? null,
          nameplate: updatedEquipped.nameplate ?? null,
          effect: updatedEquipped.effect ?? null,
        }).catch(() => {});

        broadcastEquippedEverywhere(uid, updatedEquipped);
        invalidateCommonsPostsCache();
      }
    },
    [user?.uid, user?.displayName, isSuperAdminUser]
  );

  const equipCosmetic = useCallback(
    async (type: CosmeticSlot, itemId: string | null) => {
      await persistEquipSlots({ [type]: itemId });
    },
    [persistEquipSlots]
  );

  const unequipCosmetic = useCallback(
    async (type: CosmeticSlot) => {
      await persistEquipSlots({ [type]: null });
    },
    [persistEquipSlots]
  );

  const equipMultipleCosmetics = useCallback(
    async (slotUpdates: Partial<Record<CosmeticSlot, string | null>>) => {
      await persistEquipSlots(slotUpdates);
    },
    [persistEquipSlots]
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
        const merged = mergeCanonicalInventory({
          uid: user.uid,
          walletDoc: {
            owned: [
              ...currentOwned,
              ...(Array.isArray(result.owned) ? result.owned : []),
              item.id,
            ],
            equipped: (sessionWalletCache[user.uid] || walletRef.current).equipped,
          },
        });
        const updated: WalletDoc = {
          ...(sessionWalletCache[user.uid] || walletRef.current),
          balance: result.newBalance,
          owned: merged.owned,
          equipped: merged.equipped,
        };
        walletRef.current = updated;
        sessionWalletCache[user.uid] = updated;
        setWallet(updated);
        setInventoryLoaded(true);
        setBalanceLoaded(true);
        setWalletError(null);
        notifyWalletSubscribers(user.uid, updated, true);
        return {
          ...result,
          owned: merged.owned,
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
      const baseWallet = sessionWalletCache[user.uid] || walletRef.current;
      const merged = mergeCanonicalInventory({
        uid: user.uid,
        walletDoc: {
          owned: [
            ...(baseWallet.owned || []),
            ...(result.owned || []),
            ...(result.flaggedItems.length === 0
              ? result.purchasedItems.map((i) => i.id)
              : []),
          ],
          equipped: baseWallet.equipped,
        },
      });
      const updated: WalletDoc = {
        ...baseWallet,
        balance: result.newBalance,
        owned: merged.owned,
        equipped: merged.equipped,
      };
      walletRef.current = updated;
      sessionWalletCache[user.uid] = updated;
      setWallet(updated);
      setInventoryLoaded(true);
      setBalanceLoaded(true);
      setWalletError(null);
      notifyWalletSubscribers(user.uid, updated, true);
      return result;
    },
    [user?.uid, isSuperAdminUser]
  );

  const refreshWallet = useCallback(async () => {
    if (authStatus === 'authenticated' && user?.uid) {
      await fetchWallet(user.uid, true);
    }
  }, [authStatus, user?.uid, fetchWallet]);

  const kobanSnapshot =
    authStatus === 'authenticated' && user?.uid
      ? getKobans(user.uid)
      : { balance: null, loaded: authStatus === 'unauthenticated', updatedAt: null };
  const resolvedBalanceLoaded =
    authStatus === 'unauthenticated' ? true : balanceLoaded || kobanSnapshot.loaded;
  const resolvedBalance =
    authStatus === 'authenticated' &&
    user?.uid &&
    kobanSnapshot.loaded &&
    kobanSnapshot.balance !== null
      ? kobanSnapshot.balance
      : wallet.balance;

  return {
    wallet,
    balance: resolvedBalance,
    kobanBalance: resolvedBalanceLoaded ? resolvedBalance : null,
    balanceLoaded: resolvedBalanceLoaded,
    inventoryLoaded,
    walletError,
    owned: wallet.owned,
    equipped: wallet.equipped,
    loading,
    isSuperAdmin: isSuperAdminUser,
    equipCosmetic,
    unequipCosmetic,
    equipMultipleCosmetics,
    purchaseCosmetic,
    purchaseCosmeticBatch,
    refreshWallet,
  };
}
