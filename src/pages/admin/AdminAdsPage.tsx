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
  fetchAdminAdsConfig,
  fetchAdminAdsStats,
  resetAdminAdsConfig,
  saveAdminAdsConfig,
  type AdminAdsStatsResponse,
} from '@/services/adsConfigService';
import { AdSlot } from '@/components/AdSlot';
import { sanitizeUserErrorMessage } from '@/utils/safeErrorMessage';
import {
  DotHeading,
  GlassCard,
  Pill,
  Segmented,
  SkeletonListRows,
  SkeletonMetricCard,
  StickyActionBar,
} from '@/components/admin/AdminGlassPrimitives';
import { useAdminGlassFlag } from '@/utils/adminGlassFlag';
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
  const { enabled: glassEnabled } = useAdminGlassFlag();
  const [activeTab, setActiveTab] = useState<AdsTabId>('global');
  const [config, setConfig] = useState<AdsConfigDoc>(() => createDefaultAdsConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Confirm reset modal
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Phone-frame slot preview modal
  const [previewSlotId, setPreviewSlotId] = useState<AdSlotId | null>(null);
  const [previewViewer, setPreviewViewer] = useState<'guest' | 'free' | 'paid'>('guest');

  // Offer editor state
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  // Stats tab state
  const [statsDays, setStatsDays] = useState<7 | 30>(7);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsData, setStatsData] = useState<AdminAdsStatsResponse | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchAdminAdsConfig();
      setConfig(data);
      setHasUnsavedChanges(false);
    } catch (err) {
      setErrorMsg(sanitizeUserErrorMessage(err, 'Something went wrong. Please try again.', 'AdminAdsPage.load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
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
      loadStats(statsDays);
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
    <div data-admin-page="ads" className="space-y-6 pb-28 max-w-6xl mx-auto">
      {/* Header + Save / Reset Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#E8353B] font-semibold">
            Monetization &amp; Promotions
          </div>
          <DotHeading as="h1" size="page" className="mt-0.5">
            Ads &amp; Offers Control
          </DotHeading>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Control Google AdSense slots, Boardly offers, and promo codes live with no redeploy. Changes take effect within ~1 minute.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            disabled={loading || saving || resetting}
            className="inline-flex items-center gap-1.5 rounded-xl ag-flat-card px-3.5 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8353B] hover:bg-[#D4292F] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : savedNotice ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? 'Saving...' : savedNotice ? 'Saved' : 'Save changes'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banners */}
      {savedNotice && (
        <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{savedNotice} — live settings will refresh for visitors within 60 seconds.</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-2.5 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={loadConfig}
            className="underline text-xs font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Responsive Glass Segmented Tab Bar */}
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

      {loading ? (
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
                        <button
                          type="button"
                          onClick={() => setPreviewSlotId(slotId)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[#E8353B] transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Preview</span>
                        </button>
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
                <button
                  type="button"
                  onClick={handleAddOffer}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8353B] hover:bg-[#D4292F] px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add offer</span>
                </button>
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
                          <button
                            type="button"
                            onClick={() => setEditingOfferId(isEditing ? null : offer.id)}
                            className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[#E8353B] cursor-pointer transition-colors"
                          >
                            {isEditing ? 'Done' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateOffer(offer)}
                            title="Duplicate offer"
                            className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 p-2 text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={config.offers.length <= 1}
                            onClick={() => handleDeleteOffer(offer.id)}
                            title="Delete offer"
                            className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 p-2 text-red-500 hover:bg-red-500/10 cursor-pointer disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
                  <button
                    type="button"
                    onClick={() => loadStats(statsDays)}
                    disabled={statsLoading}
                    className="inline-flex items-center gap-1 rounded-xl ag-flat-card px-3 py-1.5 text-xs font-semibold text-[var(--text)] cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
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

      {/* ================= PHONE-SIZE PREVIEW MODAL ================= */}
      {previewSlotConfig && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${previewSlotConfig.id}`}
          data-admin-glass-portal={glassEnabled ? '1' : '0'}
          onClick={() => setPreviewSlotId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`${
              glassEnabled
                ? 'ag-sheet-panel rounded-[28px]'
                : 'rounded-3xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl'
            } w-full max-w-[410px] overflow-hidden`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]/50">
              <div className="flex items-center gap-2 min-w-0">
                <Smartphone className="h-4 w-4 text-[#E8353B] shrink-0" />
                <span className="text-xs font-bold text-[var(--text)] truncate">
                  {formatAdSlotLabel(previewSlotConfig.id, previewSlotConfig.name)}{' '}
                  <code className="font-mono text-[10px] text-[var(--text-muted)] font-normal">
                    {previewSlotConfig.id}
                  </code>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSlotId(null)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg)]/40 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-[var(--text-secondary)]">View as</span>
              <div
                role="radiogroup"
                aria-label="Preview viewer type"
                className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg)] p-0.5 gap-0.5"
              >
                {(
                  [
                    { id: 'guest', label: 'Guest' },
                    { id: 'free', label: 'Free' },
                    { id: 'paid', label: 'Pro/Plus' },
                  ] as const
                ).map((opt) => {
                  const active = previewViewer === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPreviewViewer(opt.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#E8353B] text-white shadow-sm'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 flex justify-center">
              <div className="w-[375px] max-w-full rounded-[28px] border-2 border-[var(--border-strong)] bg-[var(--bg)] p-4 space-y-3 shadow-inner">
                <div className="h-2 w-16 rounded-full bg-[var(--border-strong)] mx-auto mb-2" />
                <div className="rounded-xl bg-[var(--surface-muted)]/60 h-14 flex items-center justify-center text-[11px] text-[var(--text-muted)]">
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
                <div className="rounded-xl bg-[var(--surface-muted)]/60 h-14 flex items-center justify-center text-[11px] text-[var(--text-muted)]">
                  Content below slot
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= RESET CONFIRMATION MODAL ================= */}
      {confirmResetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reset ad settings to defaults"
          data-admin-glass-portal={glassEnabled ? '1' : '0'}
          onClick={() => !resetting && setConfirmResetOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`${
              glassEnabled
                ? 'ag-sheet-panel rounded-[22px]'
                : 'rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl'
            } w-full max-w-md p-6 space-y-4`}
          >
            <DotHeading as="h3" size="section">
              Reset all ad settings to defaults?
            </DotHeading>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              This will restore all 14 slots, all 9 default Boardly offers, global toggles, and the default <code className="font-mono font-bold">EARLY21</code> promo code. Any custom Google Slot IDs or edited offers will be overwritten.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setConfirmResetOpen(false)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleConfirmReset}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#E8353B] hover:bg-[#D4292F] px-4 py-2 text-xs font-semibold text-white cursor-pointer disabled:opacity-60 transition-colors"
              >
                {resetting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Yes, reset to defaults</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAdsPage;
