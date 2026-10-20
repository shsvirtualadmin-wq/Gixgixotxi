import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { syncPublicProfile } from '@/services/publicProfileService';
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
  },
};

// Module-level in-memory session cache: Read the wallet once per session per user
const sessionWalletCache: { [uid: string]: WalletDoc } = {};

export function useWallet() {
  const { user } = useAuth();
  const initialWallet = user?.uid && sessionWalletCache[user.uid]
    ? sessionWalletCache[user.uid]
    : DEFAULT_WALLET;

  const [wallet, setWallet] = useState<WalletDoc>(initialWallet);
  const [loading, setLoading] = useState<boolean>(Boolean(user?.uid && !sessionWalletCache[user.uid]));
  const walletRef = useRef(wallet);
  walletRef.current = wallet;

  const fetchWallet = useCallback(async (uid: string, forceRefresh = false) => {
    // If already read once this session and not forced, reuse session cache
    if (!forceRefresh && sessionWalletCache[uid]) {
      setWallet(sessionWalletCache[uid]);
      setLoading(false);
      return sessionWalletCache[uid];
    }

    setLoading(true);
    const walletDocRef = doc(db, 'wallets', uid);

    try {
      const snap = await getDoc(walletDocRef);
      if (snap.exists()) {
        const data = snap.data() as Partial<WalletDoc>;
        const cleanWallet: WalletDoc = {
          balance: typeof data.balance === 'number' ? Math.max(0, Math.floor(data.balance)) : 0,
          owned: Array.isArray(data.owned) ? data.owned : [],
          equipped: {
            effect: data.equipped?.effect ?? null,
            frame: data.equipped?.frame ?? null,
            nameplate: data.equipped?.nameplate ?? null,
            avatar: data.equipped?.avatar ?? null,
          },
          updatedAt: data.updatedAt,
        };
        sessionWalletCache[uid] = cleanWallet;
        setWallet(cleanWallet);
        return cleanWallet;
      } else {
        // Initialize empty wallet document for new user
        const initial: WalletDoc = {
          balance: 0,
          owned: [],
          equipped: { effect: null, frame: null, nameplate: null, avatar: null },
          updatedAt: serverTimestamp(),
        };
        await setDoc(walletDocRef, initial, { merge: true });
        sessionWalletCache[uid] = initial;
        setWallet(initial);
        return initial;
      }
    } catch (err) {
      console.warn('[useWallet] Once-per-session wallet read error:', err);
      return sessionWalletCache[uid] || DEFAULT_WALLET;
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

    // Read wallet once per session
    fetchWallet(user.uid, false);
  }, [user?.uid, fetchWallet]);

  /**
   * Equips or unequips a cosmetic item owned by the user.
   * Mirrors immediately to publicProfiles/{uid} for leaderboards and crew views.
   */
  const equipCosmetic = useCallback(
    async (type: 'effect' | 'frame' | 'nameplate' | 'avatar', itemId: string | null) => {
      if (!user?.uid) throw new Error('Must be logged in to equip cosmetics');
      const current = walletRef.current;

      // Validation: item must be owned if not un-equipping
      if (itemId !== null && !current.owned.includes(itemId)) {
        throw new Error('You do not own this cosmetic item');
      }

      const updatedEquipped: EquippedCosmetics = {
        ...current.equipped,
        [type]: itemId,
      };

      const walletDocRef = doc(db, 'wallets', user.uid);

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(walletDocRef);
        const curData = snap.exists() ? (snap.data() as WalletDoc) : current;
        if (itemId !== null && !curData.owned.includes(itemId)) {
          throw new Error('Item not owned');
        }
        tx.update(walletDocRef, {
          equipped: updatedEquipped,
          updatedAt: serverTimestamp(),
        });
      });

      // Synchronize to public profile so leaderboards and crew roster display it
      await syncPublicProfile(user.uid, {
        equipped: updatedEquipped,
      });

      const updated: WalletDoc = {
        ...current,
        equipped: updatedEquipped,
      };
      sessionWalletCache[user.uid] = updated;
      setWallet(updated);
    },
    [user?.uid]
  );

  /**
   * Purchases a cosmetic item via transactional balance deduction and ledger writing.
   */
  const purchaseCosmetic = useCallback(
    async (item: import('@/data/cosmeticsCatalog').CosmeticItem) => {
      if (!user?.uid) throw new Error('Must be logged in to purchase cosmetics');
      const { purchaseCosmeticItem } = await import('@/services/kobanService');
      const result = await purchaseCosmeticItem(user.uid, item);
      const updated: WalletDoc = {
        ...walletRef.current,
        balance: result.newBalance,
        owned: walletRef.current.owned.includes(item.id)
          ? walletRef.current.owned
          : [...walletRef.current.owned, item.id],
      };
      sessionWalletCache[user.uid] = updated;
      setWallet(updated);
      return result;
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
    equipCosmetic,
    purchaseCosmetic,
    refreshWallet,
  };
}
