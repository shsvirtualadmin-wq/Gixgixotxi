import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Crown,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  usePlansConfig,
  savePlansConfig,
} from '@/hooks/usePlansConfig';
import {
  DEFAULT_PLANS_CONFIG,
  computeAnnualPrice,
  computeProToPlusCreditDays,
  type PlansConfigDoc,
} from '@/lib/planTier';
import { logAdminAction } from '@/services/adminService';
import { KobanIcon } from '@/components/koban/KobanIcon';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import {
  GlassCard,
  DotHeading,
  Field,
  Pill,
  StickyActionBar,
  Skeleton,
} from '@/components/admin/AdminGlassPrimitives';
import { useAdminGlassFlag } from '@/utils/adminGlassFlag';
import { pluralize } from '@/utils/adminLabels';
import {
  fetchAishaAdminStats,
  type AishaAdminStats,
} from '@/services/aiMentorsService';

export function AdminPlansPage() {
  const { user } = useAuth();
  const { enabled: glassEnabled } = useAdminGlassFlag();
  const { config, loading } = usePlansConfig();

  const [freeCredits, setFreeCredits] = useState<string>(String(DEFAULT_PLANS_CONFIG.free.aiCreditsPerDay));
  const [proPricePkr, setProPricePkr] = useState<string>(String(DEFAULT_PLANS_CONFIG.pro.pricePkrMonthly));
  const [proPriceKobans, setProPriceKobans] = useState<string>(String(DEFAULT_PLANS_CONFIG.pro.priceKobansMonthly));
  const [proCredits, setProCredits] = useState<string>(String(DEFAULT_PLANS_CONFIG.pro.aiCreditsPerDay));

  const [plusPricePkr, setPlusPricePkr] = useState<string>(String(DEFAULT_PLANS_CONFIG.plus.pricePkrMonthly));
  const [plusPriceKobans, setPlusPriceKobans] = useState<string>(String(DEFAULT_PLANS_CONFIG.plus.priceKobansMonthly));
  const [plusCredits, setPlusCredits] = useState<string>(String(DEFAULT_PLANS_CONFIG.plus.aiCreditsPerDay));

  const [annualDiscountPct, setAnnualDiscountPct] = useState<string>(
    String(DEFAULT_PLANS_CONFIG.annualDiscountPercent)
  );

  const [aishaAnimationsEnabled, setAishaAnimationsEnabled] = useState<boolean>(
    DEFAULT_PLANS_CONFIG.aishaAnimationsEnabled ?? true
  );
  const [togglingAisha, setTogglingAisha] = useState(false);
  const [aishaStats, setAishaStats] = useState<AishaAdminStats | null>(null);
  const [loadingAishaStats, setLoadingAishaStats] = useState(false);

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    if (!dirty) {
      setFreeCredits(String(config.free.aiCreditsPerDay));
      setProPricePkr(String(config.pro.pricePkrMonthly));
      setProPriceKobans(String(config.pro.priceKobansMonthly));
      setProCredits(String(config.pro.aiCreditsPerDay));
      setPlusPricePkr(String(config.plus.pricePkrMonthly));
      setPlusPriceKobans(String(config.plus.priceKobansMonthly));
      setPlusCredits(String(config.plus.aiCreditsPerDay));
      setAnnualDiscountPct(String(config.annualDiscountPercent));
      setAishaAnimationsEnabled(config.aishaAnimationsEnabled !== false);
    }
  }, [config, dirty]);

  const refreshAishaStats = async () => {
    setLoadingAishaStats(true);
    try {
      const stats = await fetchAishaAdminStats();
      if (stats) setAishaStats(stats);
    } finally {
      setLoadingAishaStats(false);
    }
  };

  useEffect(() => {
    void refreshAishaStats();
  }, []);

  const handleToggleAishaAnimations = async () => {
    if (togglingAisha) return;
    const nextEnabled = !aishaAnimationsEnabled;
    setAishaAnimationsEnabled(nextEnabled);
    setTogglingAisha(true);
    setError(null);
    try {
      const nextConfig: PlansConfigDoc = {
        free: { aiCreditsPerDay: config.free.aiCreditsPerDay },
        pro: { ...config.pro },
        plus: { ...config.plus },
        annualDiscountPercent: config.annualDiscountPercent,
        kobansPerPkr: config.kobansPerPkr || DEFAULT_PLANS_CONFIG.kobansPerPkr,
        aishaAnimationsEnabled: nextEnabled,
        updatedBy: user?.email || 'superadmin',
      };
      await savePlansConfig(nextConfig, user?.email || 'superadmin');
      await logAdminAction(user?.email || 'superadmin', 'toggle_aisha_animations', {
        aishaAnimationsEnabled: nextEnabled,
      }).catch(() => {});
      setNotice(
        nextEnabled
          ? 'Aisha animations turned ON. Visual physics whiteboards are live.'
          : 'Aisha animations turned OFF instantly. Aisha will answer in text mode.'
      );
      void refreshAishaStats();
    } catch (err: unknown) {
      setAishaAnimationsEnabled(!nextEnabled);
      setError(err instanceof Error ? err.message : 'Failed to update Aisha animations switch.');
    } finally {
      setTogglingAisha(false);
    }
  };

  const parsed = useMemo(() => {
    const fCred = Math.max(0, Math.round(Number(freeCredits) || 0));
    const pPkr = Math.max(1, Math.round(Number(proPricePkr) || 0));
    const pKob = Math.max(1, Math.round(Number(proPriceKobans) || 0));
    const pCred = Math.max(1, Math.round(Number(proCredits) || 0));
    const plPkr = Math.max(1, Math.round(Number(plusPricePkr) || 0));
    const plKob = Math.max(1, Math.round(Number(plusPriceKobans) || 0));
    const plCred = Math.max(1, Math.round(Number(plusCredits) || 0));
    const disc = Math.max(0, Math.min(90, Math.round(Number(annualDiscountPct) || 0)));

    return {
      freeCredits: fCred,
      proPricePkr: pPkr,
      proPriceKobans: pKob,
      proCredits: pCred,
      proAnnualPkr: computeAnnualPrice(pPkr, disc),
      proAnnualKobans: computeAnnualPrice(pKob, disc),
      plusPricePkr: plPkr,
      plusPriceKobans: plKob,
      plusCredits: plCred,
      plusAnnualPkr: computeAnnualPrice(plPkr, disc),
      plusAnnualKobans: computeAnnualPrice(plKob, disc),
      annualDiscountPct: disc,
      sampleProToPlusDays: computeProToPlusCreditDays(15, pPkr, plPkr),
    };
  }, [
    freeCredits,
    proPricePkr,
    proPriceKobans,
    proCredits,
    plusPricePkr,
    plusPriceKobans,
    plusCredits,
    annualDiscountPct,
  ]);

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (parsed.plusPricePkr < parsed.proPricePkr) {
      list.push('Plus monthly PKR price is lower than Pro. Double-check before saving.');
    }
    if (parsed.plusCredits < parsed.proCredits) {
      list.push('Plus AI credits/day is lower than Pro. Plus should normally exceed Pro.');
    }
    if (parsed.proCredits < parsed.freeCredits) {
      list.push('Pro AI credits/day is lower than Free.');
    }
    return list;
  }, [parsed]);

  const submitSave = async () => {
    setError(null);
    setNotice(null);

    if (
      parsed.proPricePkr <= 0 ||
      parsed.plusPricePkr <= 0 ||
      parsed.proPriceKobans <= 0 ||
      parsed.plusPriceKobans <= 0
    ) {
      setError('All PKR and Koban prices must be positive whole numbers.');
      return;
    }

    const nextConfig: PlansConfigDoc = {
      free: {
        aiCreditsPerDay: parsed.freeCredits,
      },
      pro: {
        pricePkrMonthly: parsed.proPricePkr,
        priceKobansMonthly: parsed.proPriceKobans,
        aiCreditsPerDay: parsed.proCredits,
      },
      plus: {
        pricePkrMonthly: parsed.plusPricePkr,
        priceKobansMonthly: parsed.plusPriceKobans,
        aiCreditsPerDay: parsed.plusCredits,
      },
      annualDiscountPercent: parsed.annualDiscountPct,
      kobansPerPkr: config.kobansPerPkr || DEFAULT_PLANS_CONFIG.kobansPerPkr,
      aishaAnimationsEnabled,
      updatedBy: user?.email || 'superadmin',
    };

    setSaving(true);
    try {
      await savePlansConfig(nextConfig, user?.email || 'superadmin');
      await logAdminAction(
        user?.email || 'superadmin',
        'update_plans_config',
        { previous: config, next: nextConfig }
      ).catch(() => {});
      setDirty(false);
      setNotice('Plan settings saved. Billing, AI Mentor limits, and checkout are now live.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save plan settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitSave();
  };

  const handleDiscardChanges = () => {
    setFreeCredits(String(config.free.aiCreditsPerDay));
    setProPricePkr(String(config.pro.pricePkrMonthly));
    setProPriceKobans(String(config.pro.priceKobansMonthly));
    setProCredits(String(config.pro.aiCreditsPerDay));
    setPlusPricePkr(String(config.plus.pricePkrMonthly));
    setPlusPriceKobans(String(config.plus.priceKobansMonthly));
    setPlusCredits(String(config.plus.aiCreditsPerDay));
    setAnnualDiscountPct(String(config.annualDiscountPercent));
    setDirty(false);
    setError(null);
    setNotice(null);
  };

  const handleResetDefaults = () => {
    setFreeCredits(String(DEFAULT_PLANS_CONFIG.free.aiCreditsPerDay));
    setProPricePkr(String(DEFAULT_PLANS_CONFIG.pro.pricePkrMonthly));
    setProPriceKobans(String(DEFAULT_PLANS_CONFIG.pro.priceKobansMonthly));
    setProCredits(String(DEFAULT_PLANS_CONFIG.pro.aiCreditsPerDay));
    setPlusPricePkr(String(DEFAULT_PLANS_CONFIG.plus.pricePkrMonthly));
    setPlusPriceKobans(String(DEFAULT_PLANS_CONFIG.plus.priceKobansMonthly));
    setPlusCredits(String(DEFAULT_PLANS_CONFIG.plus.aiCreditsPerDay));
    setAnnualDiscountPct(String(DEFAULT_PLANS_CONFIG.annualDiscountPercent));
    setDirty(true);
    setConfirmResetOpen(false);
    setNotice(null);
    setError(null);
  };

  return (
    <div data-admin-page="plans" className="space-y-6 max-w-5xl pb-28 md:pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#E8353B]" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)]">
              Subscription &amp; Billing Controls
            </span>
          </div>
          <DotHeading as="h1" size="page">
            Plans &amp; Pricing
          </DotHeading>
          <p className="font-heading text-xs sm:text-sm text-[var(--muted)] mt-1">
            Single source of truth for Free, Boardly Pro, and Boardly Plus pricing, Koban costs, annual discount, and daily AI Mentor allowances.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmResetOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] text-xs font-heading font-semibold text-[var(--text)] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw size={14} />
          <span>Reset to defaults</span>
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 text-xs font-heading font-semibold flex items-center gap-2.5"
        >
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/35 text-red-700 dark:text-red-300 text-xs font-heading font-semibold flex items-center gap-2.5"
        >
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/35 text-amber-800 dark:text-amber-300 text-xs space-y-1">
          {warnings.map((w) => (
            <div key={w} className="flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0 text-amber-500" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* FREE CARD */}
          <GlassCard variant="glass" padding="md" className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[var(--card-2)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)]">
                  <Zap size={16} />
                </span>
                <div>
                  <h2 className="font-heading font-bold text-sm text-[var(--text)]">Free</h2>
                  <p className="text-[11px] font-mono text-[var(--muted)]">Quick &amp; Balanced only</p>
                </div>
              </div>
              <Pill tone="neutral">Tier 0</Pill>
            </div>

            <Field label="AI Mentor Credits / Day">
              {loading ? (
                <Skeleton className="h-10 w-full rounded-xl" />
              ) : (
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={freeCredits}
                  onChange={(e) => {
                    setFreeCredits(e.target.value);
                    setDirty(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--text)] focus:outline-none"
                />
              )}
            </Field>

            <div className="mt-auto pt-3 border-t border-[var(--border)] text-[11px] font-mono text-[var(--muted)] space-y-1">
              <div>PKR 0 / month &middot; Always free</div>
              <div>Deep &amp; Max thinking: Locked</div>
            </div>
          </GlassCard>

          {/* PRO CARD */}
          <GlassCard variant="glass" padding="md" className="border-[#E8353B]/40 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#E8353B]/15 border border-[#E8353B]/35 flex items-center justify-center text-[#E8353B]">
                  <Crown size={16} />
                </span>
                <div>
                  <h2 className="font-heading font-bold text-sm text-[var(--text)]">Boardly Pro</h2>
                  <p className="text-[11px] font-mono text-[var(--muted)]">Popular &middot; Deep &amp; Max</p>
                </div>
              </div>
              <Pill tone="accent">Tier 1</Pill>
            </div>

            <div className="space-y-3">
              <Field label="Monthly Price (PKR)">
                {loading ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={proPricePkr}
                    onChange={(e) => {
                      setProPricePkr(e.target.value);
                      setDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--text)] focus:outline-none"
                  />
                )}
              </Field>

              <Field label="Monthly Price (Kobans)">
                {loading ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={1000000}
                    value={proPriceKobans}
                    onChange={(e) => {
                      setProPriceKobans(e.target.value);
                      setDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--text)] focus:outline-none"
                  />
                )}
              </Field>

              <Field label="AI Mentor Credits / Day">
                {loading ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={proCredits}
                    onChange={(e) => {
                      setProCredits(e.target.value);
                      setDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--text)] focus:outline-none"
                  />
                )}
              </Field>
            </div>

            <div className="mt-auto pt-3 border-t border-[var(--border)] text-[11px] font-mono text-[var(--muted)] space-y-1">
              <div className="flex items-center justify-between">
                <span>Annual ({parsed.annualDiscountPct}% off):</span>
                <strong className="text-[var(--text)]">PKR {parsed.proAnnualPkr.toLocaleString()}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Annual Kobans:</span>
                <strong className="text-[var(--text)] inline-flex items-center gap-1">
                  <KobanIcon size={12} />
                  {parsed.proAnnualKobans.toLocaleString()}
                </strong>
              </div>
            </div>
          </GlassCard>

          {/* PLUS CARD */}
          <GlassCard variant="glass" padding="md" className="border-amber-500/45 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-500">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h2 className="font-heading font-bold text-sm text-[var(--text)]">Boardly Plus</h2>
                  <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">Best value &middot; 2&times; AI</p>
                </div>
              </div>
              <Pill tone="warning">Tier 2</Pill>
            </div>

            <div className="space-y-3">
              <Field label="Monthly Price (PKR)">
                {loading ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={plusPricePkr}
                    onChange={(e) => {
                      setPlusPricePkr(e.target.value);
                      setDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--text)] focus:outline-none focus:border-amber-500"
                  />
                )}
              </Field>

              <Field label="Monthly Price (Kobans)">
                {loading ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={1000000}
                    value={plusPriceKobans}
                    onChange={(e) => {
                      setPlusPriceKobans(e.target.value);
                      setDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--text)] focus:outline-none focus:border-amber-500"
                  />
                )}
              </Field>

              <Field label="AI Mentor Credits / Day">
                {loading ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={plusCredits}
                    onChange={(e) => {
                      setPlusCredits(e.target.value);
                      setDirty(true);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--text)] focus:outline-none focus:border-amber-500"
                  />
                )}
              </Field>
            </div>

            <div className="mt-auto pt-3 border-t border-[var(--border)] text-[11px] font-mono text-[var(--muted)] space-y-1">
              <div className="flex items-center justify-between">
                <span>Annual ({parsed.annualDiscountPct}% off):</span>
                <strong className="text-[var(--text)]">PKR {parsed.plusAnnualPkr.toLocaleString()}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Annual Kobans:</span>
                <strong className="text-[var(--text)] inline-flex items-center gap-1">
                  <KobanIcon size={12} />
                  {parsed.plusAnnualKobans.toLocaleString()}
                </strong>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Annual Discount & Pro->Plus Upgrade Credit Summary (Plain English with live prices) */}
        <GlassCard variant="glass" padding="md" className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          <div className="space-y-2">
            <Field label="Annual Billing Discount (%)">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={annualDiscountPct}
                  onChange={(e) => {
                    setAnnualDiscountPct(e.target.value);
                    setDirty(true);
                  }}
                  className="w-32 px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--text)] focus:outline-none"
                />
                <span className="text-xs font-heading text-[var(--muted)]">
                  Saves {parsed.annualDiscountPct}% off 12 monthly payments on Pro (PKR {parsed.proAnnualPkr.toLocaleString()}/yr) and Plus (PKR {parsed.plusAnnualPkr.toLocaleString()}/yr).
                </span>
              </div>
            </Field>
          </div>

          <div className="p-4 rounded-[16px] ag-flat-card text-xs font-heading text-[var(--muted)] space-y-1.5 leading-relaxed">
            <div className="text-[var(--text)] font-bold">Pro to Plus upgrade credit</div>
            <p>
              When a student upgrades from Pro (PKR {parsed.proPricePkr.toLocaleString()}/mo) to Plus (PKR{' '}
              {parsed.plusPricePkr.toLocaleString()}/mo), their unused Pro days convert automatically by price ratio.
              For example, 15 remaining Pro days add{' '}
              <strong className="text-amber-600 dark:text-amber-400">
                {pluralize(parsed.sampleProToPlusDays, 'bonus Plus day')}
              </strong>
              .
            </p>
          </div>
        </GlassCard>

        {/* Aisha Animations Instant Switch + Today's Usage & Cost Control */}
        <GlassCard variant="glass" padding="md" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-bold text-sm text-[var(--text)]">
                  Aisha animations
                </h2>
                <Pill tone={aishaAnimationsEnabled ? 'accent' : 'neutral'}>
                  {aishaAnimationsEnabled ? 'ON' : 'OFF'}
                </Pill>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Controls Aisha&apos;s animated physics whiteboard mode (2/4/8/12 cr · 1 cr cached · daily cap 5 Free / 50 Paid). Turning off switches Aisha to text mode instantly.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                role="switch"
                aria-checked={aishaAnimationsEnabled}
                aria-label="Aisha animations"
                disabled={togglingAisha}
                onClick={() => void handleToggleAishaAnimations()}
                className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: aishaAnimationsEnabled ? '#E8353B' : 'var(--card-2)',
                  borderColor: aishaAnimationsEnabled ? '#E8353B' : 'var(--border)',
                }}
              >
                <span
                  className="inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform"
                  style={{
                    transform: aishaAnimationsEnabled ? 'translateX(26px)' : 'translateX(3px)',
                  }}
                />
              </button>

              <button
                type="button"
                onClick={() => void refreshAishaStats()}
                disabled={loadingAishaStats}
                aria-label="Refresh today's Aisha stats"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-2)] hover:bg-[var(--surface-hover)] text-[var(--muted)] cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={loadingAishaStats ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[var(--border)]">
            <div className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
              <div className="text-[11px] font-mono text-[var(--muted)]">Today&apos;s Visuals</div>
              <div className="text-lg font-mono font-bold text-[var(--text)] tabular-nums">
                {aishaStats ? aishaStats.totalVisualAnswers : 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
              <div className="text-[11px] font-mono text-[var(--muted)]">Cache Hits</div>
              <div className="text-lg font-mono font-bold text-[var(--text)] tabular-nums">
                {aishaStats ? aishaStats.cacheHits : 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
              <div className="text-[11px] font-mono text-[var(--muted)]">Today&apos;s Tokens</div>
              <div className="text-lg font-mono font-bold text-[var(--text)] tabular-nums">
                {aishaStats ? aishaStats.totalTokens.toLocaleString() : '0'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--border)]">
              <div className="text-[11px] font-mono text-[var(--muted)]">Est. Cost (USD)</div>
              <div className="text-lg font-mono font-bold text-[var(--text)] tabular-nums">
                ${aishaStats ? aishaStats.estimatedCostUsd.toFixed(4) : '0.0000'}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Status Footer + Fallback Submit Button (when not using floating bar or for keyboard submit) */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <div className="text-xs font-mono text-[var(--muted)] flex items-center gap-2">
            {loading && <RefreshCw size={13} className="animate-spin text-[#E8353B]" />}
            <span>
              {config.updatedBy
                ? `Last updated by ${config.updatedBy}`
                : 'Using built-in defaults until saved'}
            </span>
          </div>

          {!glassEnabled && (
            <button
              type="submit"
              disabled={saving}
              className="relative overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#E8353B] hover:bg-[#D4292F] text-white text-xs font-heading font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer min-w-[180px]"
            >
              <Save size={15} />
              <span>{saving ? 'Saving plan settings...' : 'Save Plan Settings'}</span>
              {saving && <ButtonLineLoader />}
            </button>
          )}
        </div>
      </form>

      {/* Sticky Save Bar — appears ONLY when unsaved changes exist, visually separated from Reset */}
      <StickyActionBar
        visible={dirty}
        message="You have unsaved plan pricing changes"
        saving={saving}
        saveLabel="Save Plan Settings"
        onSave={() => void submitSave()}
        onDiscard={handleDiscardChanges}
        onResetDefaults={() => setConfirmResetOpen(true)}
      />

      {/* Confirm Reset to Defaults Modal */}
      {confirmResetOpen && (
        <div
          data-admin-glass-portal={glassEnabled ? '1' : '0'}
          className="fixed inset-0 z-[10030] flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setConfirmResetOpen(false)}
          />
          <div
            className={`relative w-full max-w-sm p-5 space-y-4 ${
              glassEnabled
                ? 'ag-sheet-panel rounded-[22px]'
                : 'rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl'
            }`}
          >
            <DotHeading as="h3" size="section">
              Reset plan settings to defaults?
            </DotHeading>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              This will load the built-in default PKR prices, Koban costs, annual discount, and daily AI credit allowances into the form. You can review them before clicking Save.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-[var(--border)] text-xs font-heading font-semibold text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2 rounded-xl bg-[#E8353B] hover:bg-[#D4292F] text-white text-xs font-heading font-semibold cursor-pointer"
              >
                Load defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPlansPage;
