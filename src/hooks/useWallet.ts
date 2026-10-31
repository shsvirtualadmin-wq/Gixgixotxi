import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
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
    banner: null,
  },
};

const sessionWalletCache: { [uid: string]: WalletDoc } = {};

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

  const fetchWallet = useCallback(async (uid: string, forceRefresh = false) => {
    if (!forceRefresh && sessionWalletCache[uid]) {
      setWallet(sessionWalletCache[uid]);
      setLoading(false);
      return sessionWalletCache[uid];
    }

    setLoading(true);
    try {
      const res = await api.get<{ wallet?: Partial<WalletDoc> }>('/api/wallet', { silentToast: true });
      const data = res?.wallet || {};
      const cleanWallet: WalletDoc = {
        balance: typeof data.balance === 'number' ? Math.max(0, Math.floor(data.balance)) : 0,
        owned: Array.isArray(data.owned) ? data.owned : [],
        equipped: {
          effect: data.equipped?.effect ?? null,
          frame: data.equipped?.frame ?? null,
          nameplate: data.equipped?.nameplate ?? null,
          avatar: data.equipped?.avatar ?? null,
          banner: data.equipped?.banner ?? null,
        },
        updatedAt: data.updatedAt,
      };
      sessionWalletCache[uid] = cleanWallet;
      setWallet(cleanWallet);
      return cleanWallet;
    } catch (err) {
      console.warn('[useWallet] D1 wallet read notice:', err);
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
    fetchWallet(user.uid, false);
  }, [user?.uid, fetchWallet]);

  const emailLower = user?.email?.toLowerCase().trim() || '';
  const isSuperAdminUser = Boolean(
    emailLower === 'shsvirtualadmin@gmail.com' ||
      emailLower === 'support@boardly.cfd' ||
      user?.uid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2'
  );

  const equipCosmetic = useCallback(
    async (type: 'effect' | 'frame' | 'nameplate' | 'avatar' | 'banner', itemId: string | null) => {
      if (!user?.uid) throw new Error('Must be logged in to equip cosmetics');
      const current = walletRef.current;

      if (!isSuperAdminUser && itemId !== null && !current.owned.includes(itemId)) {
        throw new Error('You do not own this cosmetic item. Please unlock it from the Store first.');
      }

      const res = await api.post<{ equipped?: EquippedCosmetics }>('/api/wallet/equip', {
        type,
        itemId,
      });

      const updatedEquipped: EquippedCosmetics = res?.equipped || {
        ...current.equipped,
        [type]: itemId,
      };

      const topLevelSlotField =
        type === 'effect' ? { effectId: itemId } : { [type]: itemId };

      await syncPublicProfile(user.uid, {
        equipped: updatedEquipped,
        ...topLevelSlotField,
      }).catch(() => {});

      const updated: WalletDoc = {
        ...current,
        equipped: updatedEquipped,
      };
      sessionWalletCache[user.uid] = updated;
      setWallet(updated);
    },
    [user?.uid, isSuperAdminUser]
  );

  const purchaseCosmetic = useCallback(
    async (item: import('@/data/cosmeticsCatalog').CosmeticItem) => {
      if (!user?.uid) throw new Error('Must be logged in to purchase cosmetics');
      const { purchaseCosmeticItem } = await import('@/services/kobanService');
      const result = await purchaseCosmeticItem(user.uid, item, isSuperAdminUser);
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
    [user?.uid, isSuperAdminUser]
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
    purchaseCosmetic,
    refreshWallet,
  };
}
