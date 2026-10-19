import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWallet } from '@/hooks/useWallet';
import { PageMeta } from '@/components/ui/PageMeta';
import { KobanIcon, KobanAmount } from '@/components/koban/KobanIcon';
import { COSMETICS_CATALOG, type CosmeticItem } from '@/data/cosmeticsCatalog';
import { CosmeticFrame, CosmeticNameplate, CosmeticEffect } from '@/components/koban/CosmeticRenderers';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import { Plus, Check, ArrowRight, Zap, Info } from 'lucide-react';
import type { CosmeticType } from '@/types';
import { sanitizeStudentDisplayName } from '@/utils/privacy';

export function StorePage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const { balance, owned, equipped, equipCosmetic } = useWallet();

  const [activeTab, setActiveTab] = useState<'all' | CosmeticType>('all');
  const [equippingId, setEquippingId] = useState<string | null>(null);
  const [equipSuccess, setEquipSuccess] = useState<string | null>(null);

  const isLoggedIn = Boolean(user?.uid);
  const cleanDisplayName = sanitizeStudentDisplayName(
    profile?.displayName || user?.displayName,
    profile?.shortId || user?.uid
  );

  const filteredItems = COSMETICS_CATALOG.filter((item) => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  const handleEquip = async (item: CosmeticItem) => {
    if (!isLoggedIn) {
      navigate('/login?redirect=/store');
      return;
    }
    setEquippingId(item.id);
    try {
      const isCurrentlyEquipped = equipped[item.type] === item.id;
      await equipCosmetic(item.type, isCurrentlyEquipped ? null : item.id);
      setEquipSuccess(isCurrentlyEquipped ? `Unequipped ${item.name}` : `Equipped ${item.name}!`);
      setTimeout(() => setEquipSuccess(null), 2500);
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to equip cosmetic');
    } finally {
      setEquippingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <PageMeta
        title="Boardly Store & Kobans — Custom Cosmetics & Anime Aesthetics"
        description="Browse exclusive dot-matrix avatar frames, animated nameplates, and aura effects. Powered by the Kobans economy."
      />

      <div className="boardly-container max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
        {/* ─── STORE HEADER ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="badge-pill flex items-center gap-1.5 text-xs font-semibold text-[#E8A317] border border-[#E8A317]/40 bg-[#E8A317]/10">
                <KobanIcon size={14} /> Koban Economy
              </span>
              <span className="text-xs text-[var(--muted)] font-heading">10 Kobans = PKR 1</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-[var(--text)] tracking-tight">
              Boardly Store
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] max-w-xl">
              Equip distinctive dot-matrix frames, animated chat nameplates, and rising aura effects. Cosmetics are permanent and sync across squad rosters and leaderboards.
            </p>
          </div>

          {/* Balance & Get Kobans Action */}
          <div className="flex items-center gap-3 shrink-0">
            {isLoggedIn ? (
              <div className="flex items-center gap-2 p-1.5 px-3 rounded-2xl bg-[var(--card)] border border-[rgba(232,163,23,0.35)] shadow-sm">
                <div className="flex flex-col text-right pr-2 border-r border-[var(--border)]">
                  <span className="text-[10px] text-[var(--muted)] font-heading uppercase tracking-wider">Your Balance</span>
                  <KobanAmount value={balance} iconSize={18} className="text-sm sm:text-base text-[#FFD66B]" />
                </div>
                <Link
                  to="/store/get-kobans"
                  className="btn-red text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  <span>Get Kobans</span>
                </Link>
              </div>
            ) : (
              <Link
                to="/login?redirect=/store"
                className="btn-red text-xs sm:text-sm px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
              >
                <span>Sign In to Buy</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {/* ─── LIVE PREVIEW BANNER ─────────────────────────────────────────── */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[rgba(215,25,33,0.08)] via-[rgba(232,163,23,0.06)] to-transparent border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <CosmeticEffect itemId={equipped.effect || 'none'} size={68}>
                <CosmeticFrame itemId={equipped.frame || 'none'} size={68}>
                  <MatrixAvatar
                    avatarKey={profile?.avatarKey || 'skull-01'}
                    variant={profile?.avatarVariant || 'red-on-black'}
                    size={52}
                  />
                </CosmeticFrame>
              </CosmeticEffect>
            </div>
            <div className="min-w-0 space-y-1">
              <span className="text-[11px] text-[var(--muted)] uppercase font-heading font-semibold">Your Equipped Loadout</span>
              <CosmeticNameplate
                itemId={equipped.nameplate || 'none'}
                name={cleanDisplayName}
                shortId={profile?.shortId || (user?.uid ? user.uid.slice(0, 5) : '00000')}
                roleBadge={profile?.role === 'captain' ? 'CAPTAIN' : undefined}
              />
            </div>
          </div>

          <div className="text-xs text-[var(--muted)] text-center sm:text-right font-heading">
            <span className="block text-[var(--text)] font-semibold">Instant Leaderboard Sync</span>
            <span>Visible to all students in squads &amp; rankings</span>
          </div>
        </div>

        {equipSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500 text-emerald-400 text-xs font-heading flex items-center gap-2 animate-in fade-in">
            <Check size={16} />
            <span>{equipSuccess}</span>
          </div>
        )}

        {/* ─── CATEGORY FILTER TABS ────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All Items (18)' },
            { id: 'frame', label: 'Avatar Frames (6)' },
            { id: 'nameplate', label: 'Nameplates (6)' },
            { id: 'effect', label: 'Aura Effects (6)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`text-xs sm:text-sm font-heading font-semibold px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[var(--text)] text-[var(--bg)] shadow-sm'
                  : 'bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── COSMETICS CATALOG GRID ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isOwned = owned.includes(item.id);
            const isEquipped = equipped[item.type] === item.id;

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl bg-[var(--card)] border transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
                  isEquipped
                    ? 'border-[#D71920] shadow-[0_0_12px_rgba(215,25,33,0.2)]'
                    : isOwned
                    ? 'border-emerald-500/50 hover:border-emerald-500'
                    : 'border-[var(--border)] hover:border-[rgba(232,163,23,0.5)]'
                }`}
              >
                {/* Rarity and Animation Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${
                      item.rarity === 'legendary'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : item.rarity === 'epic'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                        : item.rarity === 'rare'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-neutral-500/40 bg-neutral-500/10 text-neutral-300'
                    }`}
                  >
                    {item.rarity}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {item.isAnimated && (
                      <span className="text-[10px] font-heading px-1.5 py-0.2 rounded bg-cyan-950/40 border border-cyan-500/40 text-cyan-400 flex items-center gap-1">
                        <Zap size={10} /> Animated
                      </span>
                    )}
                    {isEquipped && (
                      <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-full bg-[#D71921] text-white">
                        Equipped
                      </span>
                    )}
                    {isOwned && !isEquipped && (
                      <span className="text-[10px] font-heading px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-400">
                        Owned
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive Preview Canvas */}
                <div className="h-32 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center p-3 relative overflow-hidden">
                  {item.type === 'frame' && (
                    <CosmeticFrame itemId={item.id} size={76}>
                      <MatrixAvatar
                        avatarKey={profile?.avatarKey || 'skull-01'}
                        variant={profile?.avatarVariant || 'red-on-black'}
                        size={58}
                      />
                    </CosmeticFrame>
                  )}

                  {item.type === 'nameplate' && (
                    <div className="scale-110">
                      <CosmeticNameplate
                        itemId={item.id}
                        name={cleanDisplayName}
                        shortId={profile?.shortId || '12345'}
                        roleBadge="STUDENT"
                      />
                    </div>
                  )}

                  {item.type === 'effect' && (
                    <CosmeticEffect itemId={item.id} size={84}>
                      <MatrixAvatar
                        avatarKey={profile?.avatarKey || 'skull-01'}
                        variant={profile?.avatarVariant || 'red-on-black'}
                        size={56}
                      />
                    </CosmeticEffect>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-base text-[var(--text)]">{item.name}</h3>
                    <KobanAmount value={item.priceKobans} iconSize={16} className="text-[#FFD66B]" />
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">{item.description}</p>
                </div>

                {/* Action CTA */}
                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[var(--muted)] font-mono">
                    PKR {Math.round(item.priceKobans / 10)}
                  </span>

                  {!isLoggedIn ? (
                    <Link
                      to="/login?redirect=/store"
                      className="btn-outline text-xs px-3.5 py-1.5 rounded-xl font-bold cursor-pointer"
                    >
                      Sign in to Buy
                    </Link>
                  ) : isOwned ? (
                    <button
                      type="button"
                      disabled={equippingId === item.id}
                      onClick={() => handleEquip(item)}
                      className={`text-xs px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        isEquipped
                          ? 'border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--text)]'
                          : 'btn-red shadow-sm'
                      }`}
                    >
                      {equippingId === item.id ? 'Saving...' : isEquipped ? 'Unequip' : 'Equip'}
                    </button>
                  ) : (
                    <Link
                      to="/store/get-kobans"
                      className="btn-red text-xs px-4 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Buy Item</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── KOBAN NOTE ──────────────────────────────────────────────────── */}
        <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--muted)] flex items-center gap-2.5">
          <Info size={16} className="text-[#E8A317] shrink-0" />
          <span>
            Kobans are for cosmetic profile customization only and are non-refundable. Standard rate: 10 Kobans = PKR 1. Minimum purchase is 500 Kobans (PKR 50).
          </span>
        </div>
      </div>
    </div>
  );
}

export default StorePage;
