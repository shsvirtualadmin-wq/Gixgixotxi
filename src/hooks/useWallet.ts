import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
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
  },
};

export function useWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletDoc>(DEFAULT_WALLET);
  const [loading, setLoading] = useState<boolean>(Boolean(user?.uid));
  const walletRef = useRef(wallet);
  walletRef.current = wallet;

  useEffect(() => {
    if (!user?.uid) {
      setWallet(DEFAULT_WALLET);
      setLoading(false);
      return;
    }

    setLoading(true);
    const walletDocRef = doc(db, 'wallets', user.uid);

    const unsubscribe = onSnapshot(
      walletDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<WalletDoc>;
          const cleanWallet: WalletDoc = {
            balance: typeof data.balance === 'number' ? Math.max(0, Math.floor(data.balance)) : 0,
            owned: Array.isArray(data.owned) ? data.owned : [],
            equipped: {
              effect: data.equipped?.effect ?? null,
              frame: data.equipped?.frame ?? null,
              nameplate: data.equipped?.nameplate ?? null,
            },
            updatedAt: data.updatedAt,
          };
          setWallet(cleanWallet);
        } else {
          // Initialize empty wallet document for new user
          const initial: WalletDoc = {
            balance: 0,
            owned: [],
            equipped: { effect: null, frame: null, nameplate: null },
            updatedAt: serverTimestamp(),
          };
          setDoc(walletDocRef, initial, { merge: true }).catch((err) => {
            console.warn('[useWallet] Could not init wallet doc:', err);
          });
          setWallet(initial);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[useWallet] Snapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  /**
   * Equips or unequips a cosmetic item owned by the user.
   * Mirrors immediately to publicProfiles/{uid} for leaderboards and crew views.
   */
  const equipCosmetic = useCallback(
    async (type: 'effect' | 'frame' | 'nameplate', itemId: string | null) => {
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

      setWallet((prev) => ({
        ...prev,
        equipped: updatedEquipped,
      }));
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
      setWallet((prev) => ({
        ...prev,
        balance: result.newBalance,
        owned: prev.owned.includes(item.id) ? prev.owned : [...prev.owned, item.id],
      }));
      return result;
    },
    [user?.uid]
  );

  return {
    wallet,
    balance: wallet.balance,
    owned: wallet.owned,
    equipped: wallet.equipped,
    loading,
    equipCosmetic,
    purchaseCosmetic,
  };
}
