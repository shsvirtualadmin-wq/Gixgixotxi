import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  FlaskConical,
  Lock,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Tag,
  Ticket,
} from 'lucide-react';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { usePlansConfig } from '@/hooks/usePlansConfig';
import {
  createCouponAdmin,
  dryRunCouponCheckout,
  fetchCouponsPaginatedAdmin,
  setCouponActiveAdmin,
  type CouponDoc,
} from '@/services/couponService';
import {
  COUPON_APPLIES_OPTIONS,
  COUPON_CODE_REGEX,
  computeCouponDiscount,
  formatCouponBenefitLabel,
  formatCouponScopeLabel,
  getCouponStatusLabel,
  normalizeCouponCode,
  resolveCheckoutItemPricing,
  type CouponDiscountBreakdown,
  type CouponType,
  type CheckoutItemPricing,
} from '@/utils/couponEngine';
import {
  GlassCard,
  DotHeading,
  Pill,
  SkeletonListRows,
} from '@/components/admin/AdminGlassPrimitives';
import { useAdminGlassFlag } from '@/utils/adminGlassFlag';

type StudioTab = 'create' | 'coupons' | 'test';

const PAGE_SIZE = 20;

const TEST_CHECKOUT_ITEMS: Array<{ value: string; label: string }> = [
  { value: 'pro_monthly', label: 'Boardly Pro — Monthly' },
  { value: 'pro_annual', label: 'Boardly Pro — Annual' },
  { value: 'plus_monthly', label: 'Boardly Plus — Monthly' },
  { value: 'plus_annual', label: 'Boardly Plus — Annual' },
  { value: 'kobans_500', label: '500 Kobans pack' },
  { value: 'kobans_1000', label: '1,000 Kobans pack' },
  { value: 'kobans_2500', label: '2,500 Kobans pack' },
  { value: 'kobans_5000', label: '5,000 Kobans pack' },
];

const PKT_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Karachi',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function formatExpiryPkt(ms: number | null): string {
  if (!ms) return 'No expiry';
  try {
    return PKT_FORMATTER.format(new Date(ms));
  } catch {
    return new Date(ms).toLocaleDateString();
  }
}

function getStatusBadgeStyle(status: ReturnType<typeof getCouponStatusLabel>): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (status) {
    case 'Active':
      return {
        bg: 'rgba(16, 185, 129, 0.14)',
        text: '#34d399',
        dot: '#10b981',
      };
    case 'Paused':
      return {
        bg: 'rgba(245, 158, 11, 0.14)',
        text: '#fbbf24',
        dot: '#f59e0b',
      };
    case 'Expired':
      return {
        bg: 'rgba(239, 68, 68, 0.14)',
        text: '#f87171',
        dot: '#ef4444',
      };
    case 'Fully claimed':
      return {
        bg: 'rgba(148, 163, 184, 0.16)',
        text: '#cbd5e1',
        dot: '#94a3b8',
      };
  }
}

export function AdminCouponStudioPage() {
  const { user } = useAuth();
  const { enabled: glassEnabled } = useAdminGlassFlag();
  const { config: plansConfig } = usePlansConfig();

  const [activeTab, setActiveTab] = useState<StudioTab>('create');

  // ---------------------------------------------------------------------------
  // TAB 1: CREATE FORM STATE
  // ---------------------------------------------------------------------------
  const [codeInput, setCodeInput] = useState('');
  const [couponType, setCouponType] = useState<CouponType>('pct');
  const [valueInput, setValueInput] = useState('11');
  const [appliesTo, setAppliesTo] = useState('any');
  const [maxRedemptionsInput, setMaxRedemptionsInput] = useState('');
  const [expiryInput, setExpiryInput] = useState('');
  const [activeOnCreate, setActiveOnCreate] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdBanner, setCreatedBanner] = useState<CouponDoc | null>(null);

  const normalizedDraftCode = normalizeCouponCode(codeInput);
  const isCodeFormatValid =
    normalizedDraftCode.length === 0 || COUPON_CODE_REGEX.test(normalizedDraftCode);

  const parsedValueNum = Number(valueInput);
  const safePreviewValue =
    Number.isFinite(parsedValueNum) && parsedValueNum > 0
      ? couponType === 'pct'
        ? Math.min(100, parsedValueNum)
        : Math.round(parsedValueNum)
      : 0;

  const sampleMonthlyPricing = useMemo(
    () => resolveCheckoutItemPricing('pro_monthly', plansConfig),
    [plansConfig]
  );
  const sampleAnnualPricing = useMemo(
    () => resolveCheckoutItemPricing('pro_annual', plansConfig),
    [plansConfig]
  );

  const previewMonthlyBreakdown = useMemo(
    () =>
      computeCouponDiscount({
        coupon: { type: couponType, value: safePreviewValue },
        itemKey: sampleMonthlyPricing.itemKey,
        basePkr: sampleMonthlyPricing.basePkr,
        baseKobans: sampleMonthlyPricing.baseKobans,
        kobansPerPkr: sampleMonthlyPricing.kobansPerPkr,
      }),
    [couponType, safePreviewValue, sampleMonthlyPricing]
  );

  const previewAnnualBreakdown = useMemo(
    () =>
      computeCouponDiscount({
        coupon: { type: couponType, value: safePreviewValue },
        itemKey: sampleAnnualPricing.itemKey,
        basePkr: sampleAnnualPricing.basePkr,
        baseKobans: sampleAnnualPricing.baseKobans,
        kobansPerPkr: sampleAnnualPricing.kobansPerPkr,
      }),
    [couponType, safePreviewValue, sampleAnnualPricing]
  );

  // ---------------------------------------------------------------------------
  // TAB 2: COUPONS LIST STATE (Paginated 20/page)
  // ---------------------------------------------------------------------------
  const [coupons, setCoupons] = useState<CouponDoc[]>([]);
  const [couponsCursor, setCouponsCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(
    null
  );
  const [hasMoreCoupons, setHasMoreCoupons] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listLoadedOnce, setListLoadedOnce] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [togglingCode, setTogglingCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadCouponsFirstPage = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetchCouponsPaginatedAdmin({ pageSize: PAGE_SIZE, cursor: null });
      setCoupons(res.items);
      setCouponsCursor(res.lastDoc);
      setHasMoreCoupons(res.hasMore);
      setListLoadedOnce(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not load coupons.';
      setListError(msg);
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadMoreCoupons = useCallback(async () => {
    if (!hasMoreCoupons || !couponsCursor || loadingMore) return;
    setLoadingMore(true);
    setListError(null);
    try {
      const res = await fetchCouponsPaginatedAdmin({
        pageSize: PAGE_SIZE,
        cursor: couponsCursor,
      });
      setCoupons((prev) => {
        const seen = new Set(prev.map((c) => c.code));
        const next = [...prev];
        for (const item of res.items) {
          if (!seen.has(item.code)) {
            seen.add(item.code);
            next.push(item);
          }
        }
        return next;
      });
      setCouponsCursor(res.lastDoc);
      setHasMoreCoupons(res.hasMore);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not load more coupons.';
      setListError(msg);
    } finally {
      setLoadingMore(false);
    }
  }, [couponsCursor, hasMoreCoupons, loadingMore]);

  useEffect(() => {
    if (activeTab === 'coupons' && !listLoadedOnce && !listLoading) {
      void loadCouponsFirstPage();
    }
  }, [activeTab, listLoadedOnce, listLoading, loadCouponsFirstPage]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreatedBanner(null);

    const trimmedMax = maxRedemptionsInput.trim();
    const parsedMax = trimmedMax ? Number(trimmedMax) : null;
    const parsedExpiry = expiryInput.trim() ? Date.parse(expiryInput) : null;

    if (expiryInput.trim() && (parsedExpiry === null || Number.isNaN(parsedExpiry))) {
      setCreateError('Please enter a valid expiry date and time.');
      return;
    }

    setCreating(true);
    try {
      const created = await createCouponAdmin(
        {
          code: codeInput,
          type: couponType,
          value: Number(valueInput),
          appliesTo,
          maxRedemptions: parsedMax,
          expiresAtMs: parsedExpiry,
          active: activeOnCreate,
        },
        user?.uid || ''
      );
      setCreatedBanner(created);
      setCodeInput('');
      setMaxRedemptionsInput('');
      setExpiryInput('');
      setActiveOnCreate(true);
      setCoupons((prev) => [created, ...prev.filter((c) => c.code !== created.code)]);
      setListLoadedOnce(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create coupon.';
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (coupon: CouponDoc) => {
    if (togglingCode) return;
    setTogglingCode(coupon.code);
    setListError(null);
    const nextActive = !coupon.active;
    try {
      await setCouponActiveAdmin(coupon.code, nextActive);
      setCoupons((prev) =>
        prev.map((c) => (c.code === coupon.code ? { ...c, active: nextActive } : c))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update coupon status.';
      setListError(msg);
    } finally {
      setTogglingCode(null);
    }
  };

  const handleCopyCode = (code: string) => {
    void navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => {
      setCopiedCode((curr) => (curr === code ? null : curr));
    }, 1600);
  };

  // ---------------------------------------------------------------------------
  // TAB 3: TEST CHECKOUT (Strictly dry-run, writes nothing)
  // ---------------------------------------------------------------------------
  const [testCodeInput, setTestCodeInput] = useState('EARLY11');
  const [testItemKey, setTestItemKey] = useState('pro_monthly');
  const [testUidInput, setTestUidInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<
    | {
        ok: true;
        coupon: CouponDoc;
        itemPricing: CheckoutItemPricing;
        breakdown: CouponDiscountBreakdown;
        testedUid: string | null;
      }
    | {
        ok: false;
        error: string;
        itemPricing: CheckoutItemPricing;
        testedUid: string | null;
      }
    | null
  >(null);

  useEffect(() => {
    if (user?.uid && !testUidInput) {
      setTestUidInput(user.uid);
    }
  }, [user?.uid, testUidInput]);

  const handleRunDryTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestLoading(true);
    const effectiveUid = testUidInput.trim() || null;
    try {
      const res = await dryRunCouponCheckout({
        code: testCodeInput,
        uid: effectiveUid,
        itemKey: testItemKey,
        plansConfig,
      });
      setTestResult({ ...res, testedUid: effectiveUid });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div data-admin-page="coupons" className="mx-auto w-full max-w-[1120px] space-y-5 pb-24 md:pb-12">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E8353B]">
            Admin &middot; Billing Controls
          </p>
          <DotHeading as="h1" size="page" className="mt-1">
            Coupon Studio
          </DotHeading>
          <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Create single-use promo codes, manage redemptions, and dry-run checkout pricing.
          </p>
        </div>

        <Pill tone="accent" className="self-start py-1.5 px-3.5 text-[12px]">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>1 use per account enforced</span>
        </Pill>
      </header>

      {/* Sticky 3-Tab Bar */}
      <div className="sticky top-[62px] z-20 -mx-1 px-1 py-1">
        <div
          role="tablist"
          aria-label="Coupon Studio tabs"
          className={`grid grid-cols-3 gap-1.5 rounded-full p-1.5 ${
            glassEnabled ? 'ag-sticky-bar' : 'cs-sticky-tabs'
          }`}
        >
          {(
            [
              { id: 'create', label: 'Create', icon: Plus },
              { id: 'coupons', label: 'Coupons', icon: Ticket },
              { id: 'test', label: 'Test checkout', icon: FlaskConical },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className="cs-press flex min-h-[42px] items-center justify-center gap-2 rounded-full px-3 text-[13px] font-semibold cursor-pointer"
                style={
                  active
                    ? {
                        backgroundColor: '#E8353B',
                        color: '#ffffff',
                      }
                    : {
                        backgroundColor: 'transparent',
                        color: 'var(--text-muted)',
                      }
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          TAB 1: CREATE COUPON
          ===================================================================== */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.28fr)_minmax(0,0.82fr)]">
          <form
            onSubmit={(e) => void handleCreateSubmit(e)}
            className={`${glassEnabled ? 'ag-glass-card rounded-[22px]' : 'cs-surface rounded-[24px]'} p-5 sm:p-6 space-y-5`}
          >
            <div className="flex items-center justify-between gap-2">
              <DotHeading as="h2" size="section">
                New Coupon
              </DotHeading>
              <span className="text-[12px] font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {normalizedDraftCode || 'CODE'}
              </span>
            </div>

            {/* Code */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="cs-code-input"
                  className="text-[13px] font-semibold"
                  style={{ color: 'var(--text)' }}
                >
                  Coupon code
                </label>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  3–20 chars · A–Z, 0–9, - or _
                </span>
              </div>
              <input
                id="cs-code-input"
                type="text"
                required
                maxLength={20}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                placeholder="e.g. EARLY11"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value);
                  if (createError) setCreateError(null);
                }}
                className="h-[46px] w-full rounded-[14px] px-3.5 font-mono text-[14px] font-semibold uppercase tracking-[0.06em] outline-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: `1px solid ${!isCodeFormatValid ? '#ef4444' : 'var(--border)'}`,
                  color: 'var(--text)',
                }}
              />
              {!isCodeFormatValid && (
                <p className="text-[12px] text-red-400">
                  Use 3–20 characters: letters, numbers, hyphen (-), or underscore (_).
                </p>
              )}
            </div>

            {/* Type segmented selector */}
            <div className="space-y-1.5">
              <span className="block text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                Discount type
              </span>
              <div
                className="grid grid-cols-3 gap-1.5 rounded-[16px] p-1"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                }}
              >
                {(
                  [
                    { id: 'pct', label: 'Percent (%)' },
                    { id: 'flat', label: 'Flat PKR' },
                    { id: 'kob', label: 'Kobans bonus' },
                  ] as const
                ).map((opt) => {
                  const selected = couponType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setCouponType(opt.id);
                        if (opt.id === 'pct' && Number(valueInput) > 100) {
                          setValueInput('100');
                        }
                      }}
                      className="cs-press min-h-[40px] rounded-[12px] px-2.5 text-[12px] sm:text-[13px] font-semibold cursor-pointer"
                      style={
                        selected
                          ? { backgroundColor: '#D71921', color: '#ffffff' }
                          : { backgroundColor: 'transparent', color: 'var(--text-muted)' }
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Value + Applies To */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="cs-value-input"
                  className="block text-[13px] font-semibold"
                  style={{ color: 'var(--text)' }}
                >
                  {couponType === 'pct'
                    ? 'Percent off (1–100)'
                    : couponType === 'flat'
                      ? 'PKR amount off'
                      : 'Bonus Kobans'}
                </label>
                <div className="relative">
                  <input
                    id="cs-value-input"
                    type="number"
                    required
                    min={1}
                    max={couponType === 'pct' ? 100 : undefined}
                    step={couponType === 'pct' ? 'any' : 1}
                    value={valueInput}
                    onChange={(e) => {
                      setValueInput(e.target.value);
                      if (createError) setCreateError(null);
                    }}
                    placeholder={couponType === 'pct' ? '11' : couponType === 'flat' ? '50' : '500'}
                    className="h-[46px] w-full rounded-[14px] px-3.5 pr-14 text-[14px] font-semibold tabular-nums outline-none"
                    style={{
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                  />
                  <span
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-semibold"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {couponType === 'pct' ? '%' : couponType === 'flat' ? 'PKR' : 'KOB'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="cs-applies-select"
                  className="block text-[13px] font-semibold"
                  style={{ color: 'var(--text)' }}
                >
                  Applies to
                </label>
                <select
                  id="cs-applies-select"
                  value={appliesTo}
                  onChange={(e) => setAppliesTo(e.target.value)}
                  className="h-[46px] w-full rounded-[14px] px-3.5 text-[14px] outline-none"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  {COUPON_APPLIES_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Max redemptions + Expiry date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="cs-max-input"
                  className="block text-[13px] font-semibold"
                  style={{ color: 'var(--text)' }}
                >
                  Max redemptions
                </label>
                <input
                  id="cs-max-input"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Unlimited"
                  value={maxRedemptionsInput}
                  onChange={(e) => setMaxRedemptionsInput(e.target.value)}
                  className="h-[46px] w-full rounded-[14px] px-3.5 text-[14px] tabular-nums outline-none"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="cs-expiry-input"
                  className="block text-[13px] font-semibold"
                  style={{ color: 'var(--text)' }}
                >
                  Expiry date (optional)
                </label>
                <input
                  id="cs-expiry-input"
                  type="datetime-local"
                  value={expiryInput}
                  onChange={(e) => setExpiryInput(e.target.value)}
                  className="h-[46px] w-full rounded-[14px] px-3.5 text-[14px] outline-none"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
            </div>

            {/* Switches: Active + Locked One use per account */}
            <div
              className="rounded-[18px] overflow-hidden"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                    Active immediately
                  </div>
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    Turn off to save paused and activate later.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={activeOnCreate}
                  aria-label="Active immediately"
                  onClick={() => setActiveOnCreate((v) => !v)}
                  className="cs-switch cs-press relative inline-flex h-[28px] w-[48px] shrink-0 items-center rounded-full p-0.5 cursor-pointer"
                  style={{
                    backgroundColor: activeOnCreate ? '#10b981' : 'rgba(148, 163, 184, 0.32)',
                  }}
                >
                  <span
                    className="block h-[24px] w-[24px] rounded-full bg-white transition-transform duration-150"
                    style={{
                      transform: activeOnCreate ? 'translateX(20px)' : 'translateX(0px)',
                    }}
                  />
                </button>
              </div>

              <div
                className="flex items-center justify-between gap-3 px-4 py-3.5"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                    <Lock className="h-3.5 w-3.5 shrink-0 text-[#E8353B]" />
                    <span>One use per account</span>
                  </div>
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    Locked on &middot; each student account can redeem a given code once.
                  </p>
                </div>
                <div
                  role="switch"
                  aria-checked="true"
                  aria-disabled="true"
                  title="One use per account is permanently enforced"
                  className="cs-switch relative inline-flex h-[28px] w-[48px] shrink-0 items-center rounded-full p-0.5 opacity-80 cursor-not-allowed"
                  style={{ backgroundColor: '#E8353B' }}
                >
                  <span
                    className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-white"
                    style={{ transform: 'translateX(20px)' }}
                  >
                    <Lock className="h-3 w-3 text-[#111216]" />
                  </span>
                </div>
              </div>
            </div>

            {createError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-[16px] px-4 py-3 text-[13px]"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.32)',
                  color: '#fca5a5',
                }}
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {createdBanner && (
              <div
                role="status"
                className="flex flex-col gap-3 rounded-[16px] px-4 py-3.5 text-[13px] sm:flex-row sm:items-center sm:justify-between"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6ee7b7',
                }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    Created <strong className="font-mono">{createdBanner.code}</strong> (
                    {formatCouponBenefitLabel(createdBanner)})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTestCodeInput(createdBanner.code);
                      setActiveTab('test');
                    }}
                    className="cs-press rounded-full px-3 py-1 text-[12px] font-semibold text-white cursor-pointer"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.25)' }}
                  >
                    Test checkout
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('coupons')}
                    className="cs-press rounded-full px-3 py-1 text-[12px] font-semibold text-white cursor-pointer"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                  >
                    View list
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={creating || !normalizedDraftCode || !isCodeFormatValid}
              className="cs-press flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold text-white disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: '#E8353B' }}
            >
              <Plus className="h-4 w-4" />
              <span>{creating ? 'Creating coupon…' : 'Create coupon'}</span>
            </button>
          </form>

          {/* Live Preview Ticket */}
          <aside className={`${glassEnabled ? 'ag-glass-card rounded-[22px]' : 'cs-surface rounded-[24px]'} p-5 sm:p-6 flex flex-col justify-between gap-5`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                  Live Ticket Preview
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: activeOnCreate
                      ? 'rgba(16, 185, 129, 0.14)'
                      : 'rgba(245, 158, 11, 0.14)',
                    color: activeOnCreate ? '#34d399' : '#fbbf24',
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: activeOnCreate ? '#10b981' : '#f59e0b' }}
                  />
                  {activeOnCreate ? 'Active' : 'Paused'}
                </span>
              </div>

              <div
                className="rounded-[20px] p-4 space-y-3"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px dashed rgba(215, 25, 33, 0.45)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-dot text-[26px] leading-none tracking-[0.06em]" style={{ color: 'var(--text)' }}>
                    {normalizedDraftCode || 'EARLY11'}
                  </div>
                  <Tag className="h-5 w-5 text-[#D71921] shrink-0" />
                </div>
                <div className="text-[15px] font-semibold text-[#D71921] tabular-nums">
                  {safePreviewValue > 0
                    ? formatCouponBenefitLabel({ type: couponType, value: safePreviewValue })
                    : 'Enter value'}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 text-[12px]" style={{ borderTop: '1px solid var(--border)' }}>
                  <div>
                    <span className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Applies to
                    </span>
                    <span className="font-medium" style={{ color: 'var(--text)' }}>
                      {formatCouponScopeLabel(appliesTo)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Cap / Expiry
                    </span>
                    <span className="font-medium tabular-nums" style={{ color: 'var(--text)' }}>
                      {maxRedemptionsInput.trim() ? `${maxRedemptionsInput.trim()} max` : 'Unlimited'} ·{' '}
                      {expiryInput.trim() ? 'Timed' : 'No expiry'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample checkout price calculation */}
              <div className="space-y-2.5">
                <div className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
                  Sample Checkout Math
                </div>

                {[
                  { title: 'Pro Monthly', base: sampleMonthlyPricing, bd: previewMonthlyBreakdown },
                  { title: 'Pro Annual', base: sampleAnnualPricing, bd: previewAnnualBreakdown },
                ].map((sample) => (
                  <div
                    key={sample.title}
                    className="flex items-center justify-between gap-3 rounded-[14px] px-3.5 py-2.5 text-[13px]"
                    style={{
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>{sample.title}</span>
                    <div className="text-right tabular-nums">
                      {sample.bd.discountPkr > 0 ? (
                        <>
                          <span className="mr-1.5 text-[11px] line-through" style={{ color: 'var(--text-muted)' }}>
                            PKR {sample.base.basePkr.toLocaleString()}
                          </span>
                          <span className="font-semibold" style={{ color: 'var(--text)' }}>
                            PKR {sample.bd.finalPkr.toLocaleString()}
                          </span>
                          <span className="block text-[11px] text-amber-400">
                            {sample.bd.finalKobans.toLocaleString()} Kobans
                          </span>
                        </>
                      ) : sample.bd.bonusKobans > 0 ? (
                        <>
                          <span className="font-semibold" style={{ color: 'var(--text)' }}>
                            PKR {sample.base.basePkr.toLocaleString()}
                          </span>
                          <span className="block text-[11px] text-emerald-400">
                            +{sample.bd.bonusKobans.toLocaleString()} bonus Kobans
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold" style={{ color: 'var(--text)' }}>
                          PKR {sample.base.basePkr.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Codes are stored uppercase and checked case-insensitively. Percentages round to whole PKR; flat discounts floor at PKR 0.
            </p>
          </aside>
        </div>
      )}

      {/* =====================================================================
          TAB 2: COUPONS LIST (Paginated 20 per page, flat surface, no list blur)
          ===================================================================== */}
      {activeTab === 'coupons' && (
        <GlassCard variant="flat" padding="none" className="overflow-hidden">
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div>
              <DotHeading as="h2" size="section">
                All Coupons
              </DotHeading>
              <p className="text-[12px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {listLoading
                  ? 'Loading page…'
                  : `Showing ${coupons.length}${hasMoreCoupons ? '+' : ''} coupons · ${PAGE_SIZE} per page`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadCouponsFirstPage()}
              disabled={listLoading}
              className="cs-press inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${listLoading ? 'animate-spin text-[#E8353B]' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {listError && (
            <div
              role="alert"
              className="mx-5 mt-4 flex items-start gap-2.5 rounded-[14px] px-4 py-3 text-[13px]"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
              }}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{listError}</span>
            </div>
          )}

          {listLoading ? (
            <div className="p-5">
              <SkeletonListRows rows={5} />
            </div>
          ) : coupons.length === 0 ? (
            <div className="px-6 py-14 text-center space-y-3">
              <Ticket className="mx-auto h-9 w-9 opacity-45" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
                No coupons created yet
              </h3>
              <p className="mx-auto max-w-sm text-[13px]" style={{ color: 'var(--text-muted)' }}>
                Create your first code (for example EARLY11) from the Create tab.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="cs-press inline-flex min-h-[42px] items-center gap-2 rounded-full px-5 text-[13px] font-semibold text-white cursor-pointer"
                style={{ backgroundColor: '#D71921' }}
              >
                <Plus className="h-4 w-4" />
                <span>Create coupon</span>
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr
                      className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <th className="px-5 py-3">Code</th>
                      <th className="px-4 py-3">Type & Value</th>
                      <th className="px-4 py-3">Applies to</th>
                      <th className="px-4 py-3">Used / Max</th>
                      <th className="px-4 py-3">Expiry (PKT)</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {coupons.map((c) => {
                      const statusLabel = getCouponStatusLabel(c);
                      const badge = getStatusBadgeStyle(statusLabel);
                      const busy = togglingCode === c.code;
                      return (
                        <tr
                          key={c.code}
                          className="cs-row"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <td className="px-5 py-3.5 font-mono text-[14px] font-bold tracking-[0.04em]" style={{ color: 'var(--text)' }}>
                            {c.code}
                          </td>
                          <td className="px-4 py-3.5 font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                            {formatCouponBenefitLabel(c)}
                          </td>
                          <td className="px-4 py-3.5" style={{ color: 'var(--text-muted)' }}>
                            {formatCouponScopeLabel(c.appliesTo)}
                          </td>
                          <td className="px-4 py-3.5 font-mono tabular-nums" style={{ color: 'var(--text)' }}>
                            {c.redeemedCount.toLocaleString()} /{' '}
                            {c.maxRedemptions !== null ? c.maxRedemptions.toLocaleString() : '∞'}
                          </td>
                          <td className="px-4 py-3.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            {formatExpiryPkt(c.expiresAt)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap"
                              style={{ backgroundColor: badge.bg, color: badge.text }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: badge.dot }}
                              />
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyCode(c.code)}
                                className="cs-press inline-flex h-[32px] items-center gap-1 rounded-full px-3 text-[12px] font-semibold cursor-pointer"
                                style={{
                                  backgroundColor: 'var(--bg)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--text)',
                                }}
                              >
                                {copiedCode === c.code ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleToggleActive(c)}
                                className="cs-press inline-flex h-[32px] items-center gap-1 rounded-full px-3 text-[12px] font-semibold cursor-pointer disabled:opacity-50"
                                style={
                                  c.active
                                    ? {
                                        backgroundColor: 'rgba(245, 158, 11, 0.14)',
                                        color: '#fbbf24',
                                      }
                                    : {
                                        backgroundColor: 'rgba(16, 185, 129, 0.14)',
                                        color: '#34d399',
                                      }
                                }
                              >
                                {c.active ? (
                                  <>
                                    <Pause className="h-3.5 w-3.5" />
                                    <span>{busy ? '…' : 'Pause'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3.5 w-3.5" />
                                    <span>{busy ? '…' : 'Activate'}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Compact Cards */}
              <div className="md:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
                {coupons.map((c) => {
                  const statusLabel = getCouponStatusLabel(c);
                  const badge = getStatusBadgeStyle(statusLabel);
                  const busy = togglingCode === c.code;
                  return (
                    <div key={c.code} className="cs-row p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono text-[16px] font-bold tracking-[0.04em]" style={{ color: 'var(--text)' }}>
                            {c.code}
                          </div>
                          <div className="text-[13px] font-semibold text-[#D71921] tabular-nums">
                            {formatCouponBenefitLabel(c)}
                          </div>
                        </div>
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                          style={{ backgroundColor: badge.bg, color: badge.text }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: badge.dot }}
                          />
                          {statusLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[12px]">
                        <div>
                          <span className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            Used / Max
                          </span>
                          <span className="font-mono font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                            {c.redeemedCount.toLocaleString()} /{' '}
                            {c.maxRedemptions !== null ? c.maxRedemptions.toLocaleString() : '∞'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            Expiry
                          </span>
                          <span className="font-medium tabular-nums" style={{ color: 'var(--text)' }}>
                            {formatExpiryPkt(c.expiresAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(c.code)}
                          className="cs-press flex-1 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-full text-[12px] font-semibold cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                          }}
                        >
                          {copiedCode === c.code ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy code</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleToggleActive(c)}
                          className="cs-press flex-1 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-full text-[12px] font-semibold cursor-pointer disabled:opacity-50"
                          style={
                            c.active
                              ? {
                                  backgroundColor: 'rgba(245, 158, 11, 0.14)',
                                  color: '#fbbf24',
                                }
                              : {
                                  backgroundColor: 'rgba(16, 185, 129, 0.14)',
                                  color: '#34d399',
                                }
                          }
                        >
                          {c.active ? (
                            <>
                              <Pause className="h-3.5 w-3.5" />
                              <span>{busy ? 'Saving…' : 'Pause'}</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5" />
                              <span>{busy ? 'Saving…' : 'Activate'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMoreCoupons && (
                <div
                  className="flex justify-center px-5 py-4"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => void loadMoreCoupons()}
                    className="cs-press inline-flex min-h-[42px] items-center justify-center rounded-full px-6 text-[13px] font-semibold cursor-pointer disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                  >
                    {loadingMore ? 'Loading more…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </GlassCard>
      )}

      {/* =====================================================================
          TAB 3: TEST CHECKOUT (Dry-run only — writes nothing)
          ===================================================================== */}
      {activeTab === 'test' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <form
            onSubmit={(e) => void handleRunDryTest(e)}
            className={`${glassEnabled ? 'ag-glass-card rounded-[22px]' : 'cs-surface rounded-[24px]'} p-5 sm:p-6 space-y-4`}
          >
            <div className="flex items-center justify-between gap-2">
              <DotHeading as="h2" size="section">
                Dry-Run Checkout
              </DotHeading>
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.14)',
                  color: '#34d399',
                }}
              >
                Read-only · writes nothing
              </span>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="cs-test-item"
                className="block text-[13px] font-semibold"
                style={{ color: 'var(--text)' }}
              >
                Purchase item
              </label>
              <select
                id="cs-test-item"
                value={testItemKey}
                onChange={(e) => setTestItemKey(e.target.value)}
                className="h-[46px] w-full rounded-[14px] px-3.5 text-[14px] outline-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                {TEST_CHECKOUT_ITEMS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="cs-test-code"
                className="block text-[13px] font-semibold"
                style={{ color: 'var(--text)' }}
              >
                Coupon code (case-insensitive)
              </label>
              <input
                id="cs-test-code"
                type="text"
                value={testCodeInput}
                onChange={(e) => setTestCodeInput(e.target.value)}
                placeholder="e.g. early11"
                className="h-[46px] w-full rounded-[14px] px-3.5 font-mono text-[14px] outline-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="cs-test-uid"
                className="block text-[13px] font-semibold"
                style={{ color: 'var(--text)' }}
              >
                Account ID (checks prior redemption)
              </label>
              <input
                id="cs-test-uid"
                type="text"
                value={testUidInput}
                onChange={(e) => setTestUidInput(e.target.value)}
                placeholder="Student account ID or leave blank"
                className="h-[46px] w-full rounded-[14px] px-3.5 font-mono text-[13px] outline-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={testLoading}
              className="cs-press flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-5 text-[14px] font-semibold text-white cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: '#E8353B' }}
            >
              <FlaskConical className="h-4 w-4" />
              <span>{testLoading ? 'Checking eligibility…' : 'Simulate checkout'}</span>
            </button>
          </form>

          {/* Dry-run Output */}
          <GlassCard variant="glass" padding="lg" className="flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                Simulation Result
              </div>

              {!testResult ? (
                <div
                  className="rounded-[18px] p-6 text-center text-[13px]"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Pick an item, enter a coupon code (try lowercase with spaces), and click{' '}
                  <strong style={{ color: 'var(--text)' }}>Simulate checkout</strong> to preview the exact student experience.
                </div>
              ) : testResult.ok ? (
                <div className="space-y-3">
                  <div
                    className="flex items-center justify-between gap-2 rounded-[16px] px-4 py-3 text-[13px] font-semibold"
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.14)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                    }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Valid coupon · {testResult.coupon.code}
                    </span>
                    <span className="tabular-nums">{formatCouponBenefitLabel(testResult.coupon)}</span>
                  </div>

                  <div
                    className="rounded-[18px] overflow-hidden text-[13px]"
                    style={{
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <span style={{ color: 'var(--text-muted)' }}>Item</span>
                      <span className="font-semibold" style={{ color: 'var(--text)' }}>
                        {testResult.itemPricing.label}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between px-4 py-3 tabular-nums"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>PKR total</span>
                      <span className="font-semibold" style={{ color: 'var(--text)' }}>
                        {testResult.breakdown.discountPkr > 0 && (
                          <span className="mr-1.5 text-[12px] font-normal line-through" style={{ color: 'var(--text-muted)' }}>
                            PKR {testResult.breakdown.originalPkr.toLocaleString()}
                          </span>
                        )}
                        PKR {testResult.breakdown.finalPkr.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between px-4 py-3 tabular-nums"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>Kobans equivalent</span>
                      <span className="font-semibold text-amber-400">
                        {testResult.breakdown.discountKobans > 0 && (
                          <span className="mr-1.5 text-[12px] font-normal line-through" style={{ color: 'var(--text-muted)' }}>
                            {testResult.breakdown.originalKobans.toLocaleString()}
                          </span>
                        )}
                        {testResult.breakdown.finalKobans.toLocaleString()} Kobans
                      </span>
                    </div>
                    {testResult.breakdown.bonusKobans > 0 && (
                      <div
                        className="flex items-center justify-between px-4 py-3 tabular-nums"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>Bonus Kobans</span>
                        <span className="font-semibold text-emerald-400">
                          +{testResult.breakdown.bonusKobans.toLocaleString()} Kobans
                        </span>
                      </div>
                    )}
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>Submit button preview</span>
                      <span className="font-semibold text-[#D71921] tabular-nums">
                        {testResult.breakdown.isFreeActivation
                          ? `Activate Free (${testResult.coupon.code})`
                          : `Submit payment · PKR ${testResult.breakdown.finalPkr.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  role="alert"
                  className="rounded-[16px] p-4 space-y-2"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.32)',
                  }}
                >
                  <div className="flex items-center gap-2 text-[14px] font-semibold text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{testResult.error}</span>
                  </div>
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    Exact student-facing message returned for {testResult.itemPricing.label}. Base price remains PKR{' '}
                    {testResult.itemPricing.basePkr.toLocaleString()}.
                  </p>
                </div>
              )}
            </div>

            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Zero records modified. Uses the exact same read-only validator that powers the student Apply button.
            </p>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

export default AdminCouponStudioPage;
