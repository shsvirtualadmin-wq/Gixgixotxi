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

export function AdminPlansPage() {
  const { user } = useAuth();
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

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

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
    }
  }, [config, dirty]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setNotice('Saved config/plans. Billing, AI Mentor limits, and checkout are now live.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save plan settings.');
    } finally {
      setSaving(false);
    }
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
    setNotice(null);
    setError(null);
  };

  return (
    <div data-admin-page="plans" className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#D71921]" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)]">
              Firestore · config/plans
            </span>
          </div>
          <h1 className="font-dot text-[24px] sm:text-[28px] font-extrabold text-[var(--text)] tracking-tight">
            Plans &amp; Pricing
          </h1>
          <p className="font-heading text-xs sm:text-sm text-[var(--muted)] mt-1">
            Single source of truth for Free, Boardly Pro, and Boardly Plus pricing, Koban costs, annual discount, and daily AI Mentor allowances.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] text-xs font-heading font-semibold text-[var(--text)] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw size={14} />
          <span>Reset Defaults</span>
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
          <section className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4">
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
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--muted)]">
                Rank 0
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                AI Mentor Credits / Day
              </label>
              <input
                type="number"
                min={0}
                max={500}
                value={freeCredits}
                onChange={(e) => {
                  setFreeCredits(e.target.value);
                  setDirty(true);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="mt-auto pt-3 border-t border-[var(--border)] text-[11px] font-mono text-[var(--muted)] space-y-1">
              <div>PKR 0 / month · Always free</div>
              <div>Deep &amp; Max thinking: Locked</div>
            </div>
          </section>

          {/* PRO CARD */}
          <section className="p-5 rounded-[24px] bg-[var(--card)] border border-[#D71921]/40 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#D71921]/15 border border-[#D71921]/35 flex items-center justify-center text-[#D71921]">
                  <Crown size={16} />
                </span>
                <div>
                  <h2 className="font-heading font-bold text-sm text-[var(--text)]">Boardly Pro</h2>
                  <p className="text-[11px] font-mono text-[var(--muted)]">Popular · Deep &amp; Max</p>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#D71921]/15 text-[#D71921] font-bold">
                Rank 1
              </span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  Monthly Price (PKR)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={proPricePkr}
                  onChange={(e) => {
                    setProPricePkr(e.target.value);
                    setDirty(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  Monthly Price (Kobans)
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000000}
                  value={proPriceKobans}
                  onChange={(e) => {
                    setProPriceKobans(e.target.value);
                    setDirty(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  AI Mentor Credits / Day
                </label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={proCredits}
                  onChange={(e) => {
                    setProCredits(e.target.value);
                    setDirty(true);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--text)] focus:outline-none focus:border-[#D71921]"
                />
              </div>
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
          </section>

          {/* PLUS CARD */}
          <section className="p-5 rounded-[24px] bg-[var(--card)] border border-amber-500/45 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-500">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h2 className="font-heading font-bold text-sm text-[var(--text)]">Boardly Plus</h2>
                  <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">Best value · 2× AI</p>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                Rank 2
              </span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  Monthly Price (PKR)
                </label>
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
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  Monthly Price (Kobans)
                </label>
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
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                  AI Mentor Credits / Day
                </label>
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
              </div>
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
          </section>
        </div>

        {/* Annual Discount & Pro->Plus Credit Preview */}
        <section className="p-5 rounded-[24px] bg-[var(--card)] border border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
          <div className="space-y-2">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
              Annual Billing Discount (%)
            </label>
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
                className="w-32 px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--text)] focus:outline-none focus:border-[#D71921]"
              />
              <span className="text-xs font-heading text-[var(--muted)]">
                Applied to Monthly × 12 for both Pro and Plus (PKR &amp; Kobans).
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--card-2)] border border-[var(--border)] text-xs font-mono text-[var(--muted)] space-y-1">
            <div className="text-[var(--text)] font-bold">Pro → Plus Upgrade Credit Formula</div>
            <div>
              extraPlusDays = floor(remainingProDays × {parsed.proPricePkr} / {parsed.plusPricePkr})
            </div>
            <div className="text-[11px]">
              Example: 15 unused Pro days → <strong className="text-amber-600 dark:text-amber-400">+{parsed.sampleProToPlusDays} bonus Plus days</strong>
            </div>
          </div>
        </section>

        {/* Save Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <div className="text-xs font-mono text-[var(--muted)] flex items-center gap-2">
            {loading && <RefreshCw size={13} className="animate-spin" />}
            <span>
              {config.updatedBy
                ? `Last updated by ${config.updatedBy}`
                : 'Using built-in defaults until saved'}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="relative overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#D71921] hover:bg-[#b8141b] text-white text-xs font-heading font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer min-w-[180px]"
          >
            <Save size={15} />
            <span>{saving ? 'Saving config/plans...' : 'Save Plan Settings'}</span>
            {saving && <ButtonLineLoader />}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminPlansPage;
