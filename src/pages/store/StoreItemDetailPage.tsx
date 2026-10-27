import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Sparkles, Lock, Check, ArrowLeft } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { COSMETICS_CATALOG, getCosmeticById } from '@/data/cosmeticsCatalog';
import { KobanAmount } from '@/components/koban/KobanIcon';
import {
  AvatarPicture,
  AvatarFrame,
  Nameplate,
  ProfileEffectCardPreview,
} from '@/components/koban/CosmeticRenderers';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useAuthGate } from '@/contexts/AuthGateContext';

export const StoreItemDetailPage: React.FC = () => {
  const { item: itemParam = '' } = useParams<{ item: string }>();
  const { user } = useAuth();
  const { owned, equipped, purchaseCosmetic, equipCosmetic } = useWallet();
  const { requireAuth } = useAuthGate();

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const cosmetic =
    getCosmeticById(itemParam) ||
    COSMETICS_CATALOG.find(
      (c) =>
        c.id.toLowerCase() === itemParam.toLowerCase() ||
        c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === itemParam.toLowerCase()
    );

  if (!cosmetic) {
    return <NotFoundPage />;
  }

  const isOwned = Boolean(user && owned.includes(cosmetic.id));
  const isEquipped = Boolean(
    user &&
      ((cosmetic.type === 'avatar' && equipped.avatar === cosmetic.id) ||
        (cosmetic.type === 'frame' && equipped.frame === cosmetic.id) ||
        (cosmetic.type === 'banner' && equipped.banner === cosmetic.id) ||
        (cosmetic.type === 'nameplate' && equipped.nameplate === cosmetic.id) ||
        (cosmetic.type === 'effect' && equipped.effect === cosmetic.id))
  );

  const canonicalPath = `/store/${cosmetic.id}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${cosmetic.name} (${cosmetic.type.toUpperCase()}) — Boardly Cosmetic Store`,
    description: cosmetic.description,
    brand: {
      '@type': 'Brand',
      name: 'Boardly',
    },
    offers: {
      '@type': 'Offer',
      price: cosmetic.priceKobans,
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
      url: `https://boardly.cfd${canonicalPath}`,
    },
  };

  const handleAction = async () => {
    if (!user) {
      requireAuth(`unlock "${cosmetic.name}" in the Boardly Store`);
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      if (isOwned) {
        await equipCosmetic(cosmetic.type, isEquipped ? null : cosmetic.id);
        setFeedback(isEquipped ? 'Unequipped item.' : 'Equipped to your student profile!');
      } else {
        const res = await purchaseCosmetic(cosmetic.id);
        if (res.success) {
          setFeedback('Unlocked! You can now equip this item.');
        } else {
          setFeedback(res.error || 'Insufficient Kobans.');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const relatedItems = COSMETICS_CATALOG.filter(
    (c) => c.type === cosmetic.type && c.id !== cosmetic.id
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-28 pb-24 px-4 sm:px-6">
      <PageMeta
        title={`${cosmetic.name} — ${cosmetic.rarity.toUpperCase()} ${cosmetic.type} | Boardly Store`}
        description={`${cosmetic.description} Unlock ${cosmetic.name} for ${cosmetic.priceKobans} Kobans in the Boardly Store.`}
        canonicalPath={canonicalPath}
        jsonLd={jsonLd}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Store', href: '/store' },
            { label: cosmetic.name },
          ]}
        />

        <section className="glass-panel p-7 sm:p-10 mb-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Live Artwork Preview Box */}
          <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
            {cosmetic.type === 'avatar' && (
              <AvatarPicture avatarId={cosmetic.id} size={136} animated={cosmetic.animated} />
            )}
            {cosmetic.type === 'frame' && (
              <AvatarFrame frameId={cosmetic.id} size={136} animated={cosmetic.animated}>
                <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center font-dot text-2xl font-bold text-white">
                  B
                </div>
              </AvatarFrame>
            )}
            {cosmetic.type === 'banner' && (
              <div className="w-full h-36 rounded-2xl overflow-hidden border border-white/10">
                <BannerRenderer bannerId={cosmetic.id} animated={cosmetic.animated} />
              </div>
            )}
            {cosmetic.type === 'nameplate' && (
              <Nameplate
                nameplateId={cosmetic.id}
                displayName="Boardly Scholar"
                animated={cosmetic.animated}
              />
            )}
            {cosmetic.type === 'effect' && (
              <div className="w-full h-44 rounded-2xl overflow-hidden border border-white/10 relative">
                <ProfileEffectCardPreview effectId={cosmetic.id} animated={cosmetic.animated} />
              </div>
            )}
          </div>

          {/* Item Details & Unlock CTA */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="section-chip-red uppercase">{cosmetic.rarity}</span>
              <span className="glass-pill px-3 py-1 text-xs text-white/70 capitalize">
                {cosmetic.type}
              </span>
              {cosmetic.animated && (
                <span className="glass-pill px-3 py-1 text-xs text-[#E8A317] inline-flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>Animated</span>
                </span>
              )}
            </div>

            <h1 className="font-dot text-3xl sm:text-4xl font-bold text-white mb-3">
              {cosmetic.name}
            </h1>

            <p className="text-sm text-white/75 leading-relaxed mb-6">
              {cosmetic.description}
            </p>

            <div className="glass-card p-4 mb-6 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-white/50">
                Store Price
              </span>
              <KobanAmount amount={cosmetic.priceKobans} size="md" />
            </div>

            {feedback && (
              <div className="mb-4 p-3 rounded-xl bg-white/[0.06] border border-white/15 text-xs text-white">
                {feedback}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAction}
                disabled={busy}
                className="btn-primary flex-1 py-3 px-6 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {!user ? (
                  <>
                    <Lock size={15} />
                    <span>Sign in to Unlock ({cosmetic.priceKobans} Kobans)</span>
                  </>
                ) : isOwned ? (
                  <>
                    <Check size={15} />
                    <span>{isEquipped ? 'Equipped (Click to Unequip)' : 'Equip Now'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={15} />
                    <span>Unlock for {cosmetic.priceKobans} Kobans</span>
                  </>
                )}
              </button>

              <Link
                to="/store"
                className="btn-secondary py-3 px-4 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                <span>All Store Items</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Related Cosmetics */}
        {relatedItems.length > 0 && (
          <section className="glass-panel p-6 sm:p-8">
            <h2 className="font-dot text-xl font-bold text-white mb-4 capitalize">
              More {cosmetic.type}s in the Store
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {relatedItems.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/store/${rel.id}`}
                  className="glass-card-interactive p-4 block"
                >
                  <span className="text-[10px] uppercase tracking-wider text-[#E8A317] font-semibold">
                    {rel.rarity}
                  </span>
                  <h3 className="font-dot text-sm font-bold text-white mt-1 mb-2 truncate">
                    {rel.name}
                  </h3>
                  <KobanAmount amount={rel.priceKobans} size="sm" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default StoreItemDetailPage;
