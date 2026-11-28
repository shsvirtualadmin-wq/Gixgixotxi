import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Sparkles, Lock, Check, ArrowLeft, Share2 } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { COSMETICS_CATALOG, getCosmeticById, kobansToPkr } from '@/data/cosmeticsCatalog';
import { KobanAmount } from '@/components/koban/KobanIcon';
import {
  AvatarPicture,
  AvatarFrame,
  Nameplate,
  ProfileEffectCardPreview,
} from '@/components/koban/CosmeticRenderers';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { useStoreCart } from '@/hooks/useStoreCart';
import { Plus } from 'lucide-react';
import { getDisplayName } from '@/utils/displayName';
import { RARITY_ACCENT } from '@/components/store/StoreCard';
import { useLanguage } from '@/contexts/LanguageContext';

export const StoreItemDetailPage: React.FC = () => {
  const { t, formatNumber } = useLanguage();
  const { item: rawItem, slug: rawSlug } = useParams<{ item?: string; slug?: string }>();
  const itemParam = rawItem || rawSlug || '';
  const { user, profile, isGuest } = useAuth();
  const displayName = getDisplayName(
    {
      display_name: profile?.display_name ?? profile?.displayName,
      realName: profile?.realName ?? profile?.name ?? user?.displayName,
      username: profile?.username,
    },
    'Boardly Scholar'
  );
  const { owned, equipped, purchaseCosmetic, equipCosmetic } = useWallet();
  const { requireAuth } = useAuthGate();
  const { isInCart, toggleCartItem } = useStoreCart({
    uid: user?.uid,
    owned,
  });

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const busyLockRef = React.useRef(false);
  const idempotencyKeyRef = React.useRef<string>('');

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
  const inCart = isInCart(cosmetic.id);
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
    if (busyLockRef.current || busy) return;
    if (!user || isGuest || user.uid.startsWith('guest_')) {
      setFeedback(t('store.guestCannotPurchase'));
      requireAuth(t('store.unlockItemAuthReason', { name: cosmetic.name }));
      return;
    }
    busyLockRef.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      if (isOwned) {
        await equipCosmetic(cosmetic.type, isEquipped ? null : cosmetic.id);
        setFeedback(
          isEquipped
            ? t('store.unequippedItem', { name: cosmetic.name })
            : t('store.equippedItem', { name: cosmetic.name })
        );
      } else {
        if (!idempotencyKeyRef.current) {
          idempotencyKeyRef.current = `detail_${cosmetic.id}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;
        }
        const res = await purchaseCosmetic(cosmetic, idempotencyKeyRef.current);
        if (res.success) {
          setFeedback(t('store.unlockedNowEquip'));
        }
      }
    } catch (err: unknown) {
      setFeedback(
        err instanceof Error
          ? err.message
          : t('store.purchaseFailed')
      );
    } finally {
      busyLockRef.current = false;
      setBusy(false);
    }
  };

  const relatedItems = COSMETICS_CATALOG.filter(
    (c) => c.type === cosmetic.type && c.id !== cosmetic.id
  ).slice(0, 4);

  const rarityStyle = RARITY_ACCENT[cosmetic.rarity] || RARITY_ACCENT.common;

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] pt-28 pb-32 px-4 sm:px-6 overflow-x-clip">
      <PageMeta
        title={`${cosmetic.name} — ${cosmetic.rarity.toUpperCase()} ${cosmetic.type} | Boardly Store`}
        description={`${cosmetic.description} Unlock ${cosmetic.name} for ${cosmetic.priceKobans} Kobans in the Boardly Store.`}
        canonicalPath={canonicalPath}
        jsonLd={jsonLd}
      />

      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: t('nav.store'), href: '/store' },
            { label: cosmetic.name },
          ]}
        />

        <section className="glass-panel p-7 sm:p-10 mb-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Live Artwork Preview Box */}
          <div className="rounded-2xl bg-[#121216] dark-surface-preserve border border-white/10 p-6 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
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
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10">
                <BannerRenderer bannerId={cosmetic.id} animated={cosmetic.animated} />
              </div>
            )}
            {cosmetic.type === 'nameplate' && (
              <div className="w-full px-2">
                <Nameplate
                  nameplateId={cosmetic.id}
                  displayName={displayName}
                  animated={cosmetic.animated}
                  allowWrap="full"
                />
              </div>
            )}
            {cosmetic.type === 'effect' && (
              <div className="w-full h-44 rounded-xl overflow-hidden relative">
                <ProfileEffectCardPreview
                  effectId={cosmetic.id}
                  animated={cosmetic.animated}
                  displayName={displayName}
                />
              </div>
            )}
          </div>

          {/* Item Details & Unlock CTA */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${rarityStyle.badgeBg} ${rarityStyle.badgeText} ${rarityStyle.badgeBorder}`}
              >
                {t(`store.rarity_${cosmetic.rarity}`)}
              </span>
              <span className="glass-pill px-3 py-1 text-xs font-medium text-[var(--text-muted)]">
                {t(`store.cat_${cosmetic.type}`)}
              </span>
              {cosmetic.animated && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--koban-bg)] text-[var(--koban)] border border-[var(--koban-border)]">
                  <Sparkles size={11} />
                  <span>{t('store.animated')}</span>
                </span>
              )}
            </div>

            <h1 className="font-dot text-3xl sm:text-4xl font-bold text-[var(--text)] mb-3">
              {cosmetic.name}
            </h1>

            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
              {cosmetic.description}
            </p>

            <div className="glass-card p-4 mb-6 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                {t('store.storePrice')}
              </span>
              <div className="text-end">
                <KobanAmount amount={cosmetic.priceKobans} size="md" />
                <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5 ltr-nums">
                  ≈ PKR {formatNumber(kobansToPkr(cosmetic.priceKobans))}
                </div>
              </div>
            </div>

            {feedback && (
              <div className="mb-4 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--text)]">
                {feedback}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {!isOwned && (
                <button
                  type="button"
                  onClick={() => {
                    const action = toggleCartItem(cosmetic.id);
                    setFeedback(
                      action === 'added'
                        ? t('store.addedToCartToast', { name: cosmetic.name })
                        : t('store.removedFromCartToast', { name: cosmetic.name })
                    );
                  }}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    inCart
                      ? 'bg-[#E11D2A]/15 text-[#E11D2A] border-[#E11D2A]/50'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)] hover:border-[#E11D2A]/50'
                  }`}
                >
                  {inCart ? <Check size={15} /> : <Plus size={15} />}
                  <span>{inCart ? t('store.inCart') : t('store.addToCart')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleAction}
                disabled={busy}
                className="btn-primary flex-1 py-3 px-6 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {busy ? (
                  <ButtonLineLoader label={isOwned ? t('common.saving') : t('store.unlockingShort')} />
                ) : !user ? (
                  <>
                    <Lock size={15} />
                    <span>{t('store.signInToUnlock', { price: formatNumber(cosmetic.priceKobans) })}</span>
                  </>
                ) : isOwned ? (
                  <>
                    <Check size={15} />
                    <span>{isEquipped ? t('store.unequipItem') : t('store.equipNow')}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={15} />
                    <span className="ltr-nums">{t('store.buyForPrice', { price: formatNumber(cosmetic.priceKobans) })}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const fullUrl = `${window.location.origin}${canonicalPath}`;
                  navigator.clipboard?.writeText(fullUrl).then(() => {
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  });
                }}
                className="btn-secondary py-3 px-4 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                <span>{copiedLink ? t('store.linkCopiedShort') : t('common.share')}</span>
              </button>

              <Link
                to="/store"
                replace
                className="btn-secondary py-3 px-4 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={14} className="rtl-mirror" />
                <span>{t('store.allStoreItems')}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Related Cosmetics */}
        {relatedItems.length > 0 && (
          <section className="glass-panel p-6 sm:p-8">
            <h2 className="font-dot text-xl font-bold text-[var(--text)] mb-4">
              {t('store.moreInStore', { category: t(`store.cat_${cosmetic.type}`) })}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {relatedItems.map((rel) => {
                const relRarity = RARITY_ACCENT[rel.rarity] || RARITY_ACCENT.common;
                return (
                  <Link
                    key={rel.id}
                    to={`/store/${rel.id}`}
                    className="glass-card-interactive p-4 block"
                  >
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${relRarity.badgeBg} ${relRarity.badgeText} ${relRarity.badgeBorder}`}
                    >
                      {t(`store.rarity_${rel.rarity}`)}
                    </span>
                    <h3 className="font-dot text-sm font-bold text-[var(--text)] mt-1.5 mb-2 truncate">
                      {rel.name}
                    </h3>
                    <KobanAmount amount={rel.priceKobans} size="sm" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default StoreItemDetailPage;
