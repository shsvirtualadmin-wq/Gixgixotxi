import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Check,
  Copy,
  Eye,
  Globe,
  LayoutGrid,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  X,
  AlertCircle,
  Lock,
} from 'lucide-react';
import {
  AD_SLOT_ORDER,
  createDefaultAdsConfig,
  isOfferActiveNow,
  type AdPromoPlanTier,
  type AdSlotConfig,
  type AdSlotId,
  type AdSlotMode,
  type AdsConfigDoc,
  type BoardlyOffer,
} from '@/config/ads';
import {
  fetchAdminAdsStats,
  resetAdminAdsConfig,
  saveAdminAdsConfig,
  type AdminAdsStatsResponse,
} from '@/services/adsConfigService';
import {
  getCachedAdminAds,
  fetchAdminAdsSWR,
  setCachedAdminAdsConfig,
} from '@/services/adminTabCache';
import { AdSlot } from '@/components/AdSlot';
import { sanitizeUserErrorMessage } from '@/utils/safeErrorMessage';
import {
  AdminButton,
  AdminConfirmDialog,
  AdminOverlay,
  AdminStatGrid,
  DotHeading,
  GlassCard,
  MonoLabel,
  Pill,
  Segmented,
  SkeletonListRows,
  SkeletonMetricCard,
  StickyActionBar,
} from '@/components/admin/AdminGlassPrimitives';
import { formatAdSlotLabel } from '@/utils/adminLabels';

type AdsTabId = 'global' | 'slots' | 'offers' | 'promo' | 'stats';

function formatCtr(impressions: number, clicks: number): string {
  if (!impressions || impressions <= 0) return '0.0%';
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

function getOfferStatus(offer: BoardlyOffer): { label: string; tone: 'active' | 'scheduled' | 'expired' | 'inactive' } {
  if (!offer.active) return { label: 'Inactive', tone: 'inactive' };
  const now = Date.now();
  if (offer.startDate) {
    const startMs = new Date(`${offer.startDate}T00:00:00.000Z`).getTime();
    if (!Number.isNaN(startMs) && now < startMs) {
      return { label: 'Scheduled', tone: 'scheduled' };
    }
  }
  if (offer.endDate) {
    const endMs = new Date(`${offer.endDate}T23:59:59.999Z`).getTime();
    if (!Number.isNaN(endMs) && now > endMs) {
      return { label: 'Expired', tone: 'expired' };
    }
  }
  return { label: 'Active', tone: 'active' };
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-[#E8353B]' : 'bg-[var(--border-strong)]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function AdminAdsPage() {
  const initialAdsCache = getCachedAdminAds();
  const [activeTab, setActiveTab] = useState<AdsTabId>('global');
  const [config, setConfig] = useState<AdsConfigDoc>(
    () => initialAdsCache?.config ?? createDefaultAdsConfig()
  );
  const [loading, setLoading] = useState<boolean>(() => !initialAdsCache);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(() => Boolean(initialAdsCache));
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Confirm reset & delete offer modals
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [deleteOfferTarget, setDeleteOfferTarget] = useState<BoardlyOffer | null>(null);

  // Phone-frame slot preview modal
  const [previewSlotId, setPreviewSlotId] = useState<AdSlotId | null>(null);
  const [previewViewer, setPreviewViewer] = useState<'guest' | 'free' | 'paid'>('guest');

  // Offer editor state
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  // Stats tab state
  const [statsDays, setStatsDays] = useState<7 | 30>(7);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsData, setStatsData] = useState<AdminAdsStatsResponse | null>(
    () => initialAdsCache?.stats ?? null
  );

  const loadConfig = useCallback(async (force = false) => {
    const cached = getCachedAdminAds();
    if (!cached) {
      setLoading(true);
    }
    setErrorMsg(null);
    try {
      const data = await fetchAdminAdsSWR({
        force,
        onUpdate: (fresh) => {
          setConfig(fresh.config);
          if (fresh.stats) setStatsData((prev) => prev || fresh.stats);
          setHasLoadedOnce(true);
        },
      });
      setConfig(data.config);
      if (data.stats) setStatsData((prev) => prev || data.stats);
      setHasLoadedOnce(true);
      setHasUnsavedChanges(false);
    } catch (err) {
      setErrorMsg(sanitizeUserErrorMessage(err, 'Something went wrong. Please try again.', 'AdminAdsPage.load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig(false);
  }, [loadConfig]);

  const loadStats = useCallback(async (days: 7 | 30) => {
    setStatsLoading(true);
    try {
      const res = await fetchAdminAdsStats(days);
      setStatsData(res);
    } catch (err) {
      console.error('[AdminAdsPage] Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'stats') {
      void loadStats(statsDays);
    }
  }, [activeTab, statsDays, loadStats]);

  const updateConfig = (updater: (prev: AdsConfigDoc) => AdsConfigDoc) => {
    setConfig((prev) => updater(prev));
    setHasUnsavedChanges(true);
    setSavedNotice(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSavedNotice(null);
    try {
      const saved = await saveAdminAdsConfig(config);
      setConfig(saved);
      setCachedAdminAdsConfig(saved);
      setHasUnsavedChanges(false);
      setSavedNotice('Saved');
      window.setTimeout(() => setSavedNotice(null), 4000);
    } catch (err) {
      setErrorMsg(sanitizeUserErrorMessage(err, 'Something went wrong. Please try again.', 'AdminAdsPage.save'));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    setResetting(true);
    setErrorMsg(null);
    setSavedNotice(null);
    try {
      const resetDoc = await resetAdminAdsConfig();
      setConfig(resetDoc);
      setCachedAdminAdsConfig(resetDoc);
      setHasUnsavedChanges(false);
      setConfirmResetOpen(false);
      setEditingOfferId(null);
      setSavedNotice('Reset to defaults and saved');
      window.setTimeout(() => setSavedNotice(null), 4000);
    } catch (err) {
      setErrorMsg(sanitizeUserErrorMessage(err, 'Something went wrong. Please try again.', 'AdminAdsPage.reset'));
    } finally {
      setResetting(false);
    }
  };

  const updateSlot = (slotId: AdSlotId, patch: Partial<AdSlotConfig>) => {
    updateConfig((prev) => {
      const current = prev.slots[slotId];
      const nextSlot: AdSlotConfig = {
        ...current,
        ...patch,
        mode: current.boardlyOnly ? 'boardly' : patch.mode ?? current.mode,
        googleSlotId: current.boardlyOnly ? '' : patch.googleSlotId ?? current.googleSlotId,
      };
      return {
        ...prev,
        slots: {
          ...prev.slots,
          [slotId]: nextSlot,
        },
      };
    });
  };

  const handleAddOffer = () => {
    const newId = `offer_${Date.now().toString(36).slice(-5)}`;
    const newOffer: BoardlyOffer = {
      id: newId,
      title: 'New Boardly offer',
      text: 'Short helpful description for students.',
      buttonLabel: 'Explore',
      link: '/pricing',
      active: true,
      startDate: null,
      endDate: null,
    };
    updateConfig((prev) => ({
      ...prev,
      offers: [newOffer, ...prev.offers],
    }));
    setEditingOfferId(newId);
  };

  const handleDuplicateOffer = (offer: BoardlyOffer) => {
    const copyId = `${offer.id}_copy_${Date.now().toString(36).slice(-3)}`;
    const copy: BoardlyOffer = {
      ...offer,
      id: copyId,
      title: `${offer.title} (Copy)`,
    };
    updateConfig((prev) => ({
      ...prev,
      offers: [copy, ...prev.offers],
    }));
    setEditingOfferId(copyId);
  };

  const handleDeleteOffer = (offerId: string) => {
    if (config.offers.length <= 1) return;
    updateConfig((prev) => {
      const remaining = prev.offers.filter((o) => o.id !== offerId);
      const fallbackId = remaining[0]?.id || 'early';
      const nextSlots = { ...prev.slots };
      for (const sid of AD_SLOT_ORDER) {
        const s = nextSlots[sid];
        if (s.primaryOfferId === offerId || s.fallbackOfferId === offerId) {
          nextSlots[sid] = {
            ...s,
            primaryOfferId: s.primaryOfferId === offerId ? fallbackId : s.primaryOfferId,
            fallbackOfferId: s.fallbackOfferId === offerId ? fallbackId : s.fallbackOfferId,
          };
        }
      }
      return {
        ...prev,
        offers: remaining,
        slots: nextSlots,
      };
    });
    if (editingOfferId === offerId) {
      setEditingOfferId(null);
    }
  };

  const updateOffer = (offerId: string, patch: Partial<BoardlyOffer>) => {
    updateConfig((prev) => ({
      ...prev,
      offers: prev.offers.map((o) => (o.id === offerId ? { ...o, ...patch } : o)),
    }));
  };

  const togglePromoPlan = (plan: AdPromoPlanTier) => {
    updateConfig((prev) => {
      const has = prev.promoCode.plans.includes(plan);
      const nextPlans = has
        ? prev.promoCode.plans.filter((p) => p !== plan)
        : [...prev.promoCode.plans, plan];
      return {
        ...prev,
        promoCode: {
          ...prev.promoCode,
          plans: nextPlans.length > 0 ? nextPlans : [plan],
        },
      };
    });
  };

  const offerTitleMap = useMemo(() => {
    const m = new Map<string, string>();
    config.offers.forEach((o) => m.set(o.id, o.title));
    return m;
  }, [config.offers]);

  const activeOfferCount = useMemo(
    () => config.offers.filter((o) => isOfferActiveNow(o)).length,
    [config.offers]
  );

  const enabledSlotsCount = useMemo(
    () => AD_SLOT_ORDER.filter((id) => config.slots[id]?.enabled).length,
    [config.slots]
  );

  const tabs: Array<{ id: AdsTabId; label: string; icon: typeof Globe }> = [
    { id: 'global', label: 'Global', icon: Globe },
    { id: 'slots', label: 'Slots', icon: LayoutGrid },
    { id: 'offers', label: 'Boardly offers', icon: Sparkles },
    { id: 'promo', label: 'Promo code', icon: Tag },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
  ];

  const previewSlotConfig = previewSlotId ? config.slots[previewSlotId] : null;

  return (
    <div data-admin-page="ads" className="space-y-5 pb-28 max-w-6xl mx-auto">
      {/* Question-Bank Hero Card */}
      <GlassCard variant="hero" padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <MonoLabel>Monetization &amp; Promotions</MonoLabel>
            <DotHeading as="h1" size="page">
              Ads &amp; Offers Control
            </DotHeading>
            <p className="text-[13px] text-[var(--text-muted)] max-w-xl">
              Control Google AdSense slots, Boardly offers, and promo codes live with no redeploy. Changes take effect within ~1 minute.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AdminButton
              variant="secondary"
              onClick={() => setConfirmResetOpen(true)}
              disabled={loading || saving || resetting}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to defaults</span>
            </AdminButton>

            <AdminButton
              variant="primary"
              onClick={handleSave}
              disabled={loading || saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : savedNotice ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? 'Saving…' : savedNotice ? 'Saved' : 'Save changes'}</span>
            </AdminButton>
          </div>
        </div>

        <AdminStatGrid
          columns={4}
          items={[
            {
              label: 'Master Switch',
              value: loading && !hasLoadedOnce ? '—' : config.adsEnabled ? 'Active' : 'Paused',
              tone: config.adsEnabled ? 'success' : 'warning',
              sublabel: 'Global delivery',
            },
            {
              label: 'Active Slots',
              value: loading && !hasLoadedOnce ? '—' : `${enabledSlotsCount} / ${AD_SLOT_ORDER.length}`,
              sublabel: 'Enabled placements',
            },
            {
              label: 'Active Offers',
              value: loading && !hasLoadedOnce ? '—' : `${activeOfferCount} / ${config.offers.length}`,
              tone: 'accent',
              sublabel: 'Live Boardly promos',
            },
            {
              label: 'Checkout Promo',
              value: config.promoCode.active ? config.promoCode.code || 'ON' : 'Off',
              sublabel: config.promoCode.active ? `${config.promoCode.percentOff}% off` : 'Disabled',
            },
          ]}
        />
      </GlassCard>

      {/* Feedback Banners */}
      {savedNotice && (
        <div className="rounded-[16px] border border-emerald-500/40 bg-emerald-500/12 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-300 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{savedNotice} — live settings will refresh for visitors within 60 seconds.</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-[16px] border border-red-500/40 bg-red-500/12 px-4 py-3 text-xs sm:text-sm font-medium text-red-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
          <AdminButton
            variant="pill"
            onClick={() => void loadConfig(true)}
            className="!min-h-[34px] !py-1 !px-3"
          >
            Retry
          </AdminButton>
        </div>
      )}

      {/* Question-Bank Pill Tab Bar */}
      <Segmented
        ariaLabel="Ads and offers sections"
        value={activeTab}
        onChange={setActiveTab}
        options={tabs.map((tab) => {
          const Icon = tab.icon;
          return {
            value: tab.id,
            label: tab.label,
            icon: <Icon className="h-3.5 w-3.5" />,
          };
        })}
      />

      {loading && !hasLoadedOnce ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <SkeletonMetricCard />
          </div>
          <SkeletonListRows rows={3} />
        </div>
      ) : (
        <>
          {/* ================= TAB 1: GLOBAL ================= */}
          {activeTab === 'global' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <GlassCard variant="glass" padding="sm">
                  <p className="text-xs text-[var(--text-muted)]">Master Status</p>
                  <p className="mt-1 text-lg font-bold text-[var(--text)]">
                    {config.adsEnabled ? 'Ads Active' : 'All Ads Paused'}
                  </p>
                </GlassCard>
                <GlassCard variant="glass" padding="sm">
                  <p className="text-xs text-[var(--text-muted)]">Active Slots</p>
                  <p className="mt-1 text-lg font-bold text-[var(--text)] ag-tabular">
                    {enabledSlotsCount} / {AD_SLOT_ORDER.length}
                  </p>
                </GlassCard>
                <GlassCard variant="glass" padding="sm">
                  <p className="text-xs text-[var(--text-muted)]">Active Boardly Offers</p>
                  <p className="mt-1 text-lg font-bold text-[var(--text)] ag-tabular">
                    {activeOfferCount} / {config.offers.length}
                  </p>
                </GlassCard>
              </div>

              <GlassCard variant="glass" padding="lg" className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-[var(--text)]">
                      Ads on / off (Master switch)
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Turn off to immediately hide all Google ads and Boardly offer banners across the entire site.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={config.adsEnabled}
                    onChange={(next) => updateConfig((p) => ({ ...p, adsEnabled: next }))}
                    label="Master ads on or off"
                  />
                </div>

                <div className="h-px bg-[var(--border)]" />

                <div className="space-y-2">
                  <label
                    htmlFor="ads-publisher-id"
                    className="block text-sm font-bold text-[var(--text)]"
                  >
                    Google AdSense Publisher ID
                  </label>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Format: <code className="font-mono">ca-pub-XXXXXXXXXXXXXXXX</code>. Loaded only for users without Pro/Plus ad-free enabled.
                  </p>
                  <input
                    id="ads-publisher-id"
                    type="text"
                    value={config.publisherId}
                    onChange={(e) =>
                      updateConfig((p) => ({ ...p, publisherId: e.target.value.trim() }))
                    }
                    placeholder="ca-pub-6994939022289204"
                    className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3.5 py-2.5 text-sm font-mono text-[var(--text)] focus:outline-none focus:border-[#E8353B]"
                  />
                </div>

                <div className="h-px bg-[var(--border)]" />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-[var(--text)]">
                      Show Boardly offers when Google has no ad
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      When a Google slot ID is blank or AdSense does not fill within 3 seconds, show that slot&apos;s fallback Boardly offer instead of collapsing.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={config.fallbackToBoardly}
                    onChange={(next) =>
                      updateConfig((p) => ({ ...p, fallbackToBoardly: next }))
                    }
                    label="Show Boardly offers when Google has no ad"
                  />
                </div>
              </GlassCard>
            </div>
          )}

          {/* ================= TAB 2: SLOTS (flat translucent rows — zero backdrop-filter inside list) ================= */}
          {activeTab === 'slots' && (
            <div className="space-y-3">
              {AD_SLOT_ORDER.map((slotId) => {
                const slot = config.slots[slotId];
                if (!slot) return null;
                const isBoardlyOnly = Boolean(slot.boardlyOnly);
                const readableSlotName = formatAdSlotLabel(slot.id, slot.name);

                return (
                  <GlassCard
                    key={slotId}
                    variant="flat"
                    padding="md"
                    className="space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[var(--text)]">
                            {readableSlotName}
                          </span>
                          <code className="text-[10px] font-mono text-[var(--text-muted)] opacity-80">
                            {slot.id}
                          </code>
                          {isBoardlyOnly && (
                            <Pill tone="warning">
                              <Lock className="h-3 w-3" />
                              Boardly only
                            </Pill>
                          )}
                          {slot.desktopOnly && (
                            <Pill tone="neutral">Desktop only</Pill>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{slot.location}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <AdminButton
                          variant="secondary"
                          onClick={() => setPreviewSlotId(slotId)}
                          className="!min-h-[38px] !py-1.5 !px-3 !text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Preview</span>
                        </AdminButton>
                        <ToggleSwitch
                          checked={slot.enabled}
                          onChange={(next) => updateSlot(slotId, { enabled: next })}
                          label={`Toggle ${slot.id}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                      {/* Mode */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                          Mode
                        </label>
                        <select
                          value={isBoardlyOnly ? 'boardly' : slot.mode}
                          disabled={isBoardlyOnly}
                          onChange={(e) =>
                            updateSlot(slotId, { mode: e.target.value as AdSlotMode })
                          }
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2 text-xs text-[var(--text)] disabled:opacity-60"
                        >
                          <option value="auto">Auto (Google → Boardly)</option>
                          <option value="google">Google only</option>
                          <option value="boardly">Boardly offer</option>
                        </select>
                      </div>

                      {/* Google Slot ID */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                          Google AdSense Slot ID
                        </label>
                        <input
                          type="text"
                          value={isBoardlyOnly ? '' : slot.googleSlotId}
                          disabled={isBoardlyOnly || slot.mode === 'boardly'}
                          onChange={(e) =>
                            updateSlot(slotId, {
                              googleSlotId: e.target.value.replace(/[^\d]/g, '').slice(0, 20),
                            })
                          }
                          placeholder={isBoardlyOnly ? 'Disabled on Store' : 'Paste numeric slot ID'}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2 text-xs font-mono text-[var(--text)] disabled:opacity-50"
                        />
                      </div>

                      {/* Primary / Fallback Offer */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                          {slot.mode === 'boardly' ? 'Boardly Offer' : 'Fallback Boardly Offer'}
                        </label>
                        <select
                          value={
                            slot.mode === 'boardly' ? slot.primaryOfferId : slot.fallbackOfferId
                          }
                          onChange={(e) =>
                            slot.mode === 'boardly'
                              ? updateSlot(slotId, { primaryOfferId: e.target.value })
                              : updateSlot(slotId, { fallbackOfferId: e.target.value })
                          }
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2 text-xs text-[var(--text)]"
                        >
                          {config.offers.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.title} ({o.id})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Feed frequency (only for feed slots) */}
                      {slot.isFeedSlot ? (
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                            {slotId === 'store_rows'
                              ? 'Show every N rows'
                              : 'Show every N items'}
                          </label>
                          <input
                            type="number"
                            min={2}
                            max={50}
                            value={slot.everyN || 5}
                            onChange={(e) => {
                              const n = Math.max(2, Math.min(50, Number(e.target.value) || 2));
                              updateSlot(slotId, { everyN: n });
                            }}
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2 text-xs font-mono text-[var(--text)]"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                            Primary Boardly Offer
                          </label>
                          <select
                            value={slot.primaryOfferId}
                            onChange={(e) =>
                              updateSlot(slotId, { primaryOfferId: e.target.value })
                            }
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2 text-xs text-[var(--text)]"
                          >
                            {config.offers.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.title} ({o.id})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {/* ================= TAB 3: BOARDLY OFFERS (flat translucent rows) ================= */}
          {activeTab === 'offers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  Expired or inactive offers are automatically skipped and never shown to visitors.
                </p>
                <AdminButton
                  variant="primary"
                  onClick={handleAddOffer}
                  className="!min-h-[40px] !py-2 !px-3.5 !text-xs shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add offer</span>
                </AdminButton>
              </div>

              <div className="space-y-3">
                {config.offers.map((offer) => {
                  const status = getOfferStatus(offer);
                  const isEditing = editingOfferId === offer.id;

                  return (
                    <GlassCard
                      key={offer.id}
                      variant="flat"
                      padding="md"
                      className="space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-[var(--text)]">
                              {offer.title}
                            </h3>
                            <Pill
                              tone={
                                status.tone === 'active'
                                  ? 'success'
                                  : status.tone === 'scheduled'
                                  ? 'info'
                                  : status.tone === 'expired'
                                  ? 'danger'
                                  : 'neutral'
                              }
                            >
                              {status.label}
                            </Pill>
                            <code className="text-[10px] font-mono text-[var(--text-muted)] opacity-80">
                              {offer.id}
                            </code>
                            {(offer.startDate || offer.endDate) && (
                              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                                {offer.startDate || 'Now'} → {offer.endDate || 'No end'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {offer.text} · <span className="font-semibold">{offer.buttonLabel}</span>{' '}
                            (<code className="font-mono">{offer.link}</code>)
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <ToggleSwitch
                            checked={offer.active}
                            onChange={(next) => updateOffer(offer.id, { active: next })}
                            label={`Toggle offer ${offer.id}`}
                          />
                          <AdminButton
                            variant="secondary"
                            onClick={() => setEditingOfferId(isEditing ? null : offer.id)}
                            className="!min-h-[38px] !py-1.5 !px-3 !text-xs"
                          >
                            {isEditing ? 'Done' : 'Edit'}
                          </AdminButton>
                          <AdminButton
                            variant="icon"
                            onClick={() => handleDuplicateOffer(offer)}
                            title="Duplicate offer"
                            aria-label={`Duplicate ${offer.title}`}
                            className="!w-10 !h-10 !min-w-[40px] !min-h-[40px]"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            disabled={config.offers.length <= 1}
                            onClick={() => setDeleteOfferTarget(offer)}
                            title="Delete offer"
                            aria-label={`Delete ${offer.title}`}
                            className="!min-h-[40px] !min-w-[40px] !px-2.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </AdminButton>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--border)]">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                              Title
                            </label>
                            <input
                              type="text"
                              value={offer.title}
                              onChange={(e) => updateOffer(offer.id, { title: e.target.value })}
                              maxLength={140}
                              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2 text-xs text-[var(--text)]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                              Button label
                            </label>
                            <input
                              type="text"
                              value={offer.buttonLabel}
                              onChange={(e) =>
                                updateOffer(offer.id, { buttonLabel: e.target.value })
                              }
                              maxLength={48}
                              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2 text-xs text-[var(--text)]"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                              Text
                            </label>
                            <input
                              type="text"
                              value={offer.text}
                              onChange={(e) => updateOffer(offer.id, { text: e.target.value })}
                              maxLength={260}
                              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2 text-xs text-[var(--text)]"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                              Link (internal path like /pricing or https:// URL)
                            </label>
                            <input
                              type="text"
                              value={offer.link}
                              onChange={(e) => updateOffer(offer.id, { link: e.target.value })}
                              placeholder="/pricing"
                              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2 text-xs font-mono text-[var(--text)]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                              Start date (optional)
                            </label>
                            <input
                              type="date"
                              value={offer.startDate || ''}
                              onChange={(e) =>
                                updateOffer(offer.id, { startDate: e.target.value || null })
                              }
                              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2 text-xs text-[var(--text)]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
                              End date (optional)
                            </label>
                            <input
                              type="date"
                              value={offer.endDate || ''}
                              onChange={(e) =>
                                updateOffer(offer.id, { endDate: e.target.value || null })
                              }
                              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2 text-xs text-[var(--text)]"
                            />
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 4: PROMO CODE ================= */}
          {activeTab === 'promo' && (
            <GlassCard variant="glass" padding="lg" className="space-y-6 max-w-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DotHeading as="h2" size="section">
                    Checkout Promo Code
                  </DotHeading>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Validated on the server during Pro &amp; Plus checkout. Editing here updates live checkout validation immediately after saving.
                  </p>
                </div>
                <ToggleSwitch
                  checked={config.promoCode.active}
                  onChange={(next) =>
                    updateConfig((p) => ({
                      ...p,
                      promoCode: { ...p.promoCode, active: next },
                    }))
                  }
                  label="Promo code active"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text)]">Promo code</label>
                  <input
                    type="text"
                    value={config.promoCode.code}
                    onChange={(e) =>
                      updateConfig((p) => ({
                        ...p,
                        promoCode: {
                          ...p.promoCode,
                          code: e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9_-]/g, '')
                            .slice(0, 32),
                        },
                      }))
                    }
                    placeholder="EARLY21"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3.5 py-2.5 text-sm font-mono font-bold text-[var(--text)] uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text)]">Percent off (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={config.promoCode.percentOff}
                    onChange={(e) => {
                      const pct = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                      updateConfig((p) => ({
                        ...p,
                        promoCode: { ...p.promoCode, percentOff: pct },
                      }));
                    }}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3.5 py-2.5 text-sm font-mono text-[var(--text)]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--text)]">
                  Plans it applies to
                </label>
                <div className="flex flex-wrap gap-3">
                  {(['pro', 'plus'] as const).map((tier) => {
                    const checked = config.promoCode.plans.includes(tier);
                    return (
                      <label
                        key={tier}
                        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${
                          checked
                            ? 'border-[#E8353B] bg-[#E8353B]/10 text-[var(--text)]'
                            : 'border-[var(--border)] bg-[var(--bg)]/70 text-[var(--text-secondary)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePromoPlan(tier)}
                          className="accent-[#E8353B]"
                        />
                        <span>{tier === 'pro' ? 'Boardly Pro' : 'Boardly Plus'}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 max-w-xs">
                <label className="block text-xs font-bold text-[var(--text)]">
                  End date (optional)
                </label>
                <input
                  type="date"
                  value={config.promoCode.endDate || ''}
                  onChange={(e) =>
                    updateConfig((p) => ({
                      ...p,
                      promoCode: { ...p.promoCode, endDate: e.target.value || null },
                    }))
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3.5 py-2.5 text-sm text-[var(--text)]"
                />
                <p className="text-[11px] text-[var(--text-muted)]">
                  Leave empty for no expiration date.
                </p>
              </div>
            </GlassCard>
          )}

          {/* ================= TAB 5: STATS ================= */}
          {activeTab === 'stats' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  Boardly offers only. Counts daily impressions and clicks with zero personal data stored.
                </p>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg)]/60 p-1">
                    {([7, 30] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setStatsDays(d)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                          statsDays === d
                            ? 'bg-[#E8353B] text-white'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                        }`}
                      >
                        Last {d} days
                      </button>
                    ))}
                  </div>
                  <AdminButton
                    variant="secondary"
                    onClick={() => void loadStats(statsDays)}
                    disabled={statsLoading}
                    className="!min-h-[38px] !py-1.5 !px-3 !text-xs"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </AdminButton>
                </div>
              </div>

              {statsLoading && !statsData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <SkeletonMetricCard />
                    <SkeletonMetricCard />
                    <SkeletonMetricCard />
                  </div>
                  <SkeletonListRows rows={3} />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <GlassCard variant="glass" padding="sm">
                      <p className="text-xs text-[var(--text-muted)]">Impressions ({statsDays}d)</p>
                      <DotHeading as="div" size="metric" className="mt-1">
                        {(statsData?.totals.impressions || 0).toLocaleString()}
                      </DotHeading>
                    </GlassCard>
                    <GlassCard variant="glass" padding="sm">
                      <p className="text-xs text-[var(--text-muted)]">Clicks ({statsDays}d)</p>
                      <DotHeading as="div" size="metric" className="mt-1">
                        {(statsData?.totals.clicks || 0).toLocaleString()}
                      </DotHeading>
                    </GlassCard>
                    <GlassCard variant="glass" padding="sm">
                      <p className="text-xs text-[var(--text-muted)]">Click Rate (CTR)</p>
                      <DotHeading as="div" size="metric" className="mt-1">
                        {formatCtr(
                          statsData?.totals.impressions || 0,
                          statsData?.totals.clicks || 0
                        )}
                      </DotHeading>
                    </GlassCard>
                  </div>

                  {/* By Offer Table (flat translucent surface — zero blur) */}
                  <GlassCard variant="flat" padding="none" className="overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <h3 className="text-sm font-bold text-[var(--text)]">By Offer</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-[var(--bg)]/50 text-[11px] uppercase text-[var(--text-muted)]">
                          <tr>
                            <th className="px-4 py-2.5">Offer</th>
                            <th className="px-4 py-2.5 text-right">Impressions</th>
                            <th className="px-4 py-2.5 text-right">Clicks</th>
                            <th className="px-4 py-2.5 text-right">CTR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {(statsData?.byOffer || []).length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-4 py-6 text-center text-xs text-[var(--text-muted)]"
                              >
                                No Boardly offer impressions recorded in the last {statsDays} days yet.
                              </td>
                            </tr>
                          ) : (
                            (statsData?.byOffer || []).map((row) => (
                              <tr key={row.offerId}>
                                <td className="px-4 py-2.5">
                                  {offerTitleMap.get(row.offerId) ? (
                                    <>
                                      <span className="font-semibold text-[var(--text)]">
                                        {offerTitleMap.get(row.offerId)}
                                      </span>
                                      <code className="ml-2 font-mono text-[10px] text-[var(--text-muted)]">
                                        {row.offerId}
                                      </code>
                                    </>
                                  ) : (
                                    <code className="font-mono text-xs font-bold text-[var(--text)]">
                                      {row.offerId}
                                    </code>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono ag-tabular">
                                  {row.impressions.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono ag-tabular">
                                  {row.clicks.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono ag-tabular text-[var(--text-secondary)]">
                                  {formatCtr(row.impressions, row.clicks)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>

                  {/* By Slot Table */}
                  <GlassCard variant="flat" padding="none" className="overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <h3 className="text-sm font-bold text-[var(--text)]">By Placement</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-[var(--bg)]/50 text-[11px] uppercase text-[var(--text-muted)]">
                          <tr>
                            <th className="px-4 py-2.5">Slot</th>
                            <th className="px-4 py-2.5 text-right">Impressions</th>
                            <th className="px-4 py-2.5 text-right">Clicks</th>
                            <th className="px-4 py-2.5 text-right">CTR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {(statsData?.bySlot || []).length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-4 py-6 text-center text-xs text-[var(--text-muted)]"
                              >
                                No slot data yet.
                              </td>
                            </tr>
                          ) : (
                            (statsData?.bySlot || []).map((row) => (
                              <tr key={row.slotId}>
                                <td className="px-4 py-2.5">
                                  <span className="font-semibold text-[var(--text)]">
                                    {formatAdSlotLabel(row.slotId)}
                                  </span>
                                  <code className="ml-2 font-mono text-[10px] text-[var(--text-muted)]">
                                    {row.slotId}
                                  </code>
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono ag-tabular">
                                  {row.impressions.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono ag-tabular">
                                  {row.clicks.toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-right font-mono ag-tabular text-[var(--text-secondary)]">
                                  {formatCtr(row.impressions, row.clicks)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>

                  {/* Daily Breakdown Table */}
                  {(statsData?.daily || []).length > 0 && (
                    <GlassCard variant="flat" padding="none" className="overflow-hidden">
                      <div className="px-4 py-3 border-b border-[var(--border)]">
                        <h3 className="text-sm font-bold text-[var(--text)]">Daily Log</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[var(--bg)]/50 text-[11px] uppercase text-[var(--text-muted)]">
                            <tr>
                              <th className="px-4 py-2">Date</th>
                              <th className="px-4 py-2">Slot</th>
                              <th className="px-4 py-2">Offer</th>
                              <th className="px-4 py-2 text-right">Impressions</th>
                              <th className="px-4 py-2 text-right">Clicks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {(statsData?.daily || []).slice(0, 60).map((row) => (
                              <tr key={`${row.date}-${row.slotId}-${row.offerId}`}>
                                <td className="px-4 py-2 font-mono">{row.date}</td>
                                <td className="px-4 py-2">
                                  <span className="font-medium text-[var(--text)]">
                                    {formatAdSlotLabel(row.slotId)}
                                  </span>
                                  <code className="ml-1.5 font-mono text-[10px] text-[var(--text-muted)]">
                                    {row.slotId}
                                  </code>
                                </td>
                                <td className="px-4 py-2 font-mono">{row.offerId}</td>
                                <td className="px-4 py-2 text-right font-mono ag-tabular">{row.impressions}</td>
                                <td className="px-4 py-2 text-right font-mono ag-tabular">{row.clicks}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </GlassCard>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Sticky Save Bar (appears ONLY when dirty, visually separating Save from Reset to defaults) */}
      <StickyActionBar
        visible={hasUnsavedChanges && !savedNotice && !loading}
        message="You have unsaved ad & offer changes"
        saving={saving}
        saveLabel="Save changes"
        onSave={handleSave}
        onResetDefaults={() => setConfirmResetOpen(true)}
        resetLabel="Reset to defaults"
        disabled={loading || saving}
      />

      {/* ================= PHONE-SIZE PREVIEW MODAL (SOLID OPAQUE) ================= */}
      <AdminOverlay
        open={Boolean(previewSlotConfig)}
        onClose={() => setPreviewSlotId(null)}
        mode="modal"
        title={previewSlotConfig ? formatAdSlotLabel(previewSlotConfig.id, previewSlotConfig.name) : 'Slot Preview'}
        subtitle={previewSlotConfig?.id}
        maxWidthClass="max-w-[430px]"
      >
        {previewSlotConfig && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#2c2c30]">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#d4d4dc]">
                <Smartphone className="h-4 w-4 text-[#E8353B]" />
                <span>View as</span>
              </span>
              <Segmented
                ariaLabel="Preview viewer type"
                value={previewViewer}
                onChange={setPreviewViewer}
                options={[
                  { value: 'guest', label: 'Guest' },
                  { value: 'free', label: 'Free' },
                  { value: 'paid', label: 'Pro/Plus' },
                ]}
              />
            </div>

            <div className="flex justify-center">
              <div className="w-[375px] max-w-full rounded-[28px] border-2 border-[#3a3a3a] bg-[#0e0e10] p-4 space-y-3 shadow-inner">
                <div className="h-1.5 w-16 rounded-full bg-[#3a3a3a] mx-auto mb-2" />
                <div className="rounded-xl bg-[#1c1c20] h-14 flex items-center justify-center text-[11px] text-[#9c9ca6]">
                  Content above slot
                </div>
                <AdSlot
                  slotId={previewSlotConfig.id}
                  previewConfig={config}
                  previewSlotOverride={previewSlotConfig}
                  isPreview
                  previewAs={previewViewer}
                  compact
                />
                <div className="rounded-xl bg-[#1c1c20] h-14 flex items-center justify-center text-[11px] text-[#9c9ca6]">
                  Content below slot
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminOverlay>

      {/* ================= DELETE OFFER CONFIRMATION (SOLID OPAQUE) ================= */}
      <AdminConfirmDialog
        open={Boolean(deleteOfferTarget)}
        onClose={() => setDeleteOfferTarget(null)}
        onConfirm={() => {
          if (!deleteOfferTarget) return;
          const id = deleteOfferTarget.id;
          setDeleteOfferTarget(null);
          handleDeleteOffer(id);
        }}
        title="Delete Boardly offer?"
        description={
          deleteOfferTarget
            ? `Remove "${deleteOfferTarget.title}" (${deleteOfferTarget.id})? Any slot pointing to it will fall back to your first active offer. Remember to Save changes afterwards.`
            : undefined
        }
        confirmLabel="Delete offer"
        danger
      />

      {/* ================= RESET CONFIRMATION MODAL (SOLID OPAQUE) ================= */}
      <AdminConfirmDialog
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={() => void handleConfirmReset()}
        title="Reset all ad settings to defaults?"
        description="This will restore all 14 slots, all 9 default Boardly offers, global toggles, and the default EARLY21 promo code. Any custom Google Slot IDs or edited offers will be overwritten."
        confirmLabel="Yes, reset to defaults"
        busy={resetting}
        danger
      />
    </div>
  );
}

export default AdminAdsPage;
