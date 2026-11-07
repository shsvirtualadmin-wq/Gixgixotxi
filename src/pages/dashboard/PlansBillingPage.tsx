import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';
import { useStudyCrew } from '@/hooks/useStudyCrew';
import { DEFAULT_CREW_PRICING } from '@/config/crewPricing';
import { isCrewPaidActive } from '@/services/crewBackend';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LineLoader } from '@/components/ui/LineLoader';
import { Check, Zap, Users, Clock, Sparkles } from 'lucide-react';
import { notifyKobanPurchaseRequestSubmitted } from '@/services/emailNotificationService';
import {
  PAYMENT_METHODS,
  PAYMENT_METHODS_LIST,
  formatPaymentMethodLabel,
  type SupportedPaymentMethod,
} from '@/constants/branding';

interface PaymentRequestItem {
  id: string;
  status?: string;
  planRequested?: string;
  plan?: string;
  amount?: number;
  method?: string;
  transactionId?: string;
  createdAt?: { seconds: number; nanoseconds?: number } | null;
}

export function PlansBillingPage() {
  const navigate = useNavigate();
  const { user, profile, loading: profileLoading } = useUserProfile();
  const { crew } = useStudyCrew();

  const [modalOpen, setModalOpen] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState<'pro' | 'crew'>('pro');
  const [method, setMethod] = useState<SupportedPaymentMethod>('jazzcash');
  const [transactionId, setTransactionId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PaymentRequestItem[]>([]);

  useEffect(() => {
    if (!user) return;
    async function loadPaymentRequests() {
      try {
        const q = query(
          collection(db, 'paymentRequests'),
          where('userId', '==', user!.uid)
        );
        const snap = await getDocs(q);
        setPendingRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.warn('[PlansBillingPage] Error loading requests:', err);
      }
    }
    loadPaymentRequests();
  }, [user, submittedSuccess]);

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transactionId.trim()) return;

    setSubmitting(true);
    try {
      const isCrewUpgrade = upgradeTarget === 'crew';
      const amount = isCrewUpgrade ? DEFAULT_CREW_PRICING.largeCrewPricePKR : 199;
      const planName = isCrewUpgrade ? 'large_crew' : 'pro';

      const activeMethodConfig = PAYMENT_METHODS[method];
      const docRef = await addDoc(collection(db, 'paymentRequests'), {
        userId: user.uid,
        userEmail: user.email?.toLowerCase(),
        displayName: senderName.trim() || user.displayName || user.email?.split('@')[0],
        amount,
        plan: planName,
        crewId: isCrewUpgrade ? (crew?.id || null) : null,
        crewName: isCrewUpgrade ? (crew?.name || null) : null,
        durationMonths: 1,
        method: activeMethodConfig.displayName,
        transactionId: transactionId.trim().toUpperCase(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      notifyKobanPurchaseRequestSubmitted({
        requestId: docRef.id,
        studentUid: user.uid,
        studentName: senderName.trim() || user.displayName || undefined,
        studentEmail: user.email || undefined,
        kobansAmount: amount * 10,
        pkrAmount: amount,
        paymentMethod: activeMethodConfig.displayName,
        transactionId: transactionId.trim().toUpperCase(),
        packageName: isCrewUpgrade ? 'Large Crew Pass (30 Days)' : 'Boardly Pro Pass (30 Days)',
      });

      setSubmittedSuccess(true);
      setModalOpen(false);
      setTransactionId('');
      setSenderName('');
    } catch (err) {
      console.error('[PlansBillingPage] Submit payment request error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const effectivePlan = useEffectivePlan();
  const isUnlimited = effectivePlan.isUnlimited;
  const isSuperAdmin = effectivePlan.isSuperAdmin;
  const isPro = isUnlimited;
  const isCrew = profile?.role === 'crew' || profile?.isCrewMember;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Plans & Subscriptions
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Transparent pricing for Pakistani entrance test preparation. 100% money-back guarantee.
        </p>
      </div>

      {/* Current Plan Banner */}
      {profileLoading ? (
        <LineLoader context="dashboard" variant="inline" />
      ) : (
        <GlassCard
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            borderLeft: `4px solid ${isPro ? '#D71921' : 'var(--border)'}`,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
                Active Plan
              </span>
              <Badge color={isSuperAdmin || isPro ? 'brand' : 'default'}>
                {isSuperAdmin
                  ? 'SUPERADMIN · UNLIMITED'
                  : effectivePlan.source === 'crew'
                  ? `PRO VIA CREW (${effectivePlan.crewName || 'CREW'})`
                  : isPro
                  ? 'PRO ACCESS'
                  : isCrew
                  ? 'CREW PASS'
                  : 'FREE TIER'}
              </Badge>
              {effectivePlan.source === 'crew' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D71921]/20 text-[#D71921] border border-[#D71921]/40 flex items-center gap-1">
                  <Sparkles size={11} /> Pro via Crew
                </span>
              )}
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {isSuperAdmin
                ? 'Superadmin Access: All Tests, Papers & Tools Unlimited'
                : effectivePlan.source === 'crew'
                ? `Unlimited Pro access shared from your squad (${effectivePlan.crewName || 'Study Crew'})`
                : isPro
                ? 'Unlimited Tests & Boardy AI Tutor Unlocked'
                : '10 tests per day and 5 AI Tokens per Day'}
            </p>
          </div>

          {isSuperAdmin ? (
            <div className="px-4 py-2 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[#D71921] text-[#D71921] font-semibold text-xs font-heading">
              Superadmin · Unlimited
            </div>
          ) : !isPro ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setUpgradeTarget('pro');
                setModalOpen(true);
              }}
            >
              <Zap size={15} /> Upgrade to Pro — PKR 199/mo
            </Button>
          ) : null}
        </GlassCard>
      )}

      {/* Pending verification alert & student payment request history */}
      {pendingRequests.length > 0 && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--r-card)',
            background: 'var(--surface)',
            border: pendingRequests.some((r) => r.status === 'pending')
              ? '1px solid #D71921'
              : '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {pendingRequests.some((r) => r.status === 'pending') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Clock size={20} className="text-[#D71921] flex-shrink-0" />
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  Payment Verification In Progress
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Your transaction is being verified by admin. Pro access will activate automatically within 15–30 minutes.
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-faint)' }}>
              Your Payment History
            </span>
            {pendingRequests.slice(0, 5).map((r) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  fontSize: 12,
                  paddingTop: 6,
                  borderTop: '1px solid var(--border)',
                }}
              >
                <span style={{ color: 'var(--text)', fontFamily: 'monospace' }}>
                  {r.amount ? `PKR ${r.amount} · ` : ''}via {formatPaymentMethodLabel(r.method)} (TRX: {r.transactionId})
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color:
                      r.status === 'approved'
                        ? '#10b981'
                        : r.status === 'rejected'
                        ? '#ef4444'
                        : '#f59e0b',
                  }}
                >
                  {r.status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3 Tier Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {/* Tier 1: Free */}
        <GlassCard
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            borderRadius: 'var(--r-card)',
          }}
        >
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase' }}>
              Essential
            </span>
            <h3 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
              Free
            </h3>
            <div style={{ marginTop: 8 }}>
              <span className="font-display tabular-nums" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>
                PKR 0
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-faint)' }}> / forever</span>
            </div>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} className="text-[#D71921]" /> 10 tests per day
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} className="text-[#D71921]" /> 3 Arena Grand Mocks / Day
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} className="text-[#D71921]" /> 5 Boardy AI Tutor Tokens / Day
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} className="text-[#D71921]" /> Basic Weak Chapter Tracking
            </li>
          </ul>

          <div style={{ marginTop: 'auto' }}>
            <Button variant="secondary" size="md" className="w-full" disabled={!isPro}>
              {!isPro ? 'Current Plan' : 'Free Tier'}
            </Button>
          </div>
        </GlassCard>

        {/* Tier 2: Pro */}
        <GlassCard
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            borderRadius: 'var(--r-card)',
            border: '1px solid #D71921',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -10,
              right: 20,
              background: '#D71921',
              color: 'white',
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '2px 10px',
              borderRadius: 999,
            }}
          >
            POPULAR
          </div>

          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#D71921', textTransform: 'uppercase' }}>
              Full Entrance Mastery
            </span>
            <h3 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
              Pro
            </h3>
            <div style={{ marginTop: 8 }}>
              <span className="font-display tabular-nums" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>
                PKR 199
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-faint)' }}> / month</span>
            </div>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} className="text-[#D71921]" /> Unlimited Practice Tests &amp; Sprints
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} className="text-[#D71921]" /> Unlimited Arena Grand National Mocks
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} className="text-[#D71921]" /> Unlimited Boardy AI Derivations
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} className="text-[#D71921]" /> FAST-NUCES Negative Marking Optimizer
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} className="text-[#D71921]" /> Comprehensive Mistakes Breakdown
            </li>
          </ul>

          <div style={{ marginTop: 'auto' }}>
            {isSuperAdmin ? (
              <div className="text-center py-2.5 px-3 rounded-xl border border-[#D71921] bg-[rgba(239,68,68,0.1)] text-[#D71921] font-semibold text-xs font-heading">
                Superadmin · Unlimited
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => {
                  setUpgradeTarget('pro');
                  setModalOpen(true);
                }}
                disabled={isPro}
              >
                {isPro ? (effectivePlan.source === 'crew' ? 'Pro Unlocked via Crew' : 'Active Pro Member') : 'Upgrade to Pro'}
              </Button>
            )}
          </div>
        </GlassCard>

        {/* Tier 3: Crew Pass (Free up to 5 / Large Crew PKR 499) */}
        {(() => {
          const isLeader = Boolean(crew && user && crew.leaderId === user.uid);
          const isPaidCrew = Boolean(crew?.tier === 'paid' && isCrewPaidActive(crew?.paid_until));
          const isExpiredCrew = Boolean(crew?.tier === 'paid' && !isCrewPaidActive(crew?.paid_until));

          return (
            <GlassCard
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                borderRadius: 'var(--r-card)',
                border: isPaidCrew ? '1px solid #D71921' : '1px solid var(--border)',
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 12, fontWeight: 700, color: isPaidCrew ? '#D71921' : 'var(--text-faint)', textTransform: 'uppercase' }}>
                    Study Group Pass
                  </span>
                  {isPaidCrew && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#D71921]/20 border border-[#D71921]/40 text-[#D71921] flex items-center gap-1">
                      <Sparkles size={10} /> Active Large Crew
                    </span>
                  )}
                </div>
                <h3 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
                  Crew Pass
                </h3>
                <div style={{ marginTop: 8 }}>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display tabular-nums" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>
                      PKR {DEFAULT_CREW_PRICING.largeCrewPricePKR}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-faint)' }}> / month</span>
                  </div>
                  <span className="text-xs text-[var(--muted)] block mt-0.5">
                    Free up to 5 members · Large Crew (up to 30)
                  </span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} className="text-[#D71921]" /> Free Crew: up to 5 members forever
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} className="text-[#D71921]" /> Large Crew: up to 30 members
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} className="text-[#D71921]" /> <strong>Pro sharing:</strong> Unlimited MCQs &amp; AI for all members
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} className="text-[#D71921]" /> Shared Crew Goal Ring &amp; National Leaderboards
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} className="text-[#D71921]" /> Aggregated Crew Weak Chapter Stats
                </li>
              </ul>

              <div style={{ marginTop: 'auto' }}>
                {!crew ? (
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full"
                    onClick={() => navigate('/crew/my')}
                  >
                    <Users size={14} /> Join or Create Crew
                  </Button>
                ) : isPaidCrew ? (
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full"
                    onClick={() => navigate('/crew/my')}
                  >
                    <Check size={14} className="text-emerald-400" /> Active Large Crew ({crew.name})
                  </Button>
                ) : isExpiredCrew && isLeader ? (
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => {
                      setUpgradeTarget('crew');
                      setModalOpen(true);
                    }}
                  >
                    <Sparkles size={14} /> Renew Crew — PKR {DEFAULT_CREW_PRICING.largeCrewPricePKR}/mo
                  </Button>
                ) : isLeader ? (
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={() => {
                      setUpgradeTarget('crew');
                      setModalOpen(true);
                    }}
                  >
                    <Sparkles size={14} /> Upgrade Crew — PKR {DEFAULT_CREW_PRICING.largeCrewPricePKR}/mo
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full"
                    onClick={() => navigate('/crew/my')}
                  >
                    <Users size={14} /> Member of {crew.name}
                  </Button>
                )}
              </div>
            </GlassCard>
          );
        })()}
      </div>

      {/* Payment Modal */}
      {modalOpen && (
        <div
          className="overlay-blur bg-black/60 backdrop-blur-md"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              padding: '24px',
              borderRadius: 'var(--r-card)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 className="font-display" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                  {upgradeTarget === 'crew' ? 'Upgrade Squad to Large Crew' : 'Upgrade to Boardly Pro'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {upgradeTarget === 'crew'
                    ? `PKR ${DEFAULT_CREW_PRICING.largeCrewPricePKR} for 30 days · Unlocks 30 member limit & Pro for all squad members`
                    : 'PKR 199 for 30 days full unlimited access'}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ fontSize: 18, color: 'var(--text-faint)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                Select Payment Account
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {PAYMENT_METHODS_LIST.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--r-input)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: method === m.id ? '1px solid #D71921' : '1px solid var(--border)',
                      background: method === m.id ? 'rgba(215, 25, 33, 0.1)' : 'var(--surface)',
                      color: method === m.id ? '#D71921' : 'var(--text)',
                    }}
                  >
                    {m.displayName} ({m.number})
                  </button>
                ))}
              </div>
            </div>

            {/* Account Details (reads from shared PAYMENT_METHODS config) */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--r-input)',
                background: 'var(--surface-hover)',
                fontSize: 12,
                color: 'var(--text)',
                lineHeight: 1.6,
              }}
            >
              <p><strong>Account Title:</strong> {PAYMENT_METHODS[method].accountTitle}</p>
              <p><strong>Account Number:</strong> {PAYMENT_METHODS[method].number}</p>
              <p><strong>Amount:</strong> PKR {upgradeTarget === 'crew' ? DEFAULT_CREW_PRICING.largeCrewPricePKR : 199}</p>
            </div>

            <form onSubmit={handleUpgradeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Transaction ID / TRX # *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8472910385"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--r-input)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Sender Account Holder Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Ali"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--r-input)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: 13,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={submitting}>
                  Submit Payment Verification
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlansBillingPage;
