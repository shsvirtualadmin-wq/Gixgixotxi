import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Check, Zap, Users, Clock } from 'lucide-react';

interface PaymentRequestItem {
  id: string;
  status?: string;
  planRequested?: string;
  method?: string;
  transactionId?: string;
  createdAt?: { seconds: number; nanoseconds?: number } | null;
}

export function PlansBillingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.uid ?? null);

  const [modalOpen, setModalOpen] = useState(false);
  const [method, setMethod] = useState<'easypaisa' | 'jazzcash' | 'sadapay' | 'nayapay' | 'bank'>('easypaisa');
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
      await addDoc(collection(db, 'paymentRequests'), {
        userId: user.uid,
        userEmail: user.email?.toLowerCase(),
        displayName: senderName.trim() || user.displayName || user.email?.split('@')[0],
        amount: 199,
        plan: 'pro',
        durationMonths: 1,
        method,
        transactionId: transactionId.trim().toUpperCase(),
        status: 'pending',
        createdAt: serverTimestamp(),
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

  const isPro = profile?.plan === 'pro' || profile?.isPremium;
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
        <Skeleton height={80} />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)' }}>
                Active Plan
              </span>
              <Badge color={isPro ? 'brand' : 'default'}>
                {isPro ? 'PRO ACCESS' : isCrew ? 'CREW PASS' : 'FREE TIER'}
              </Badge>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {isPro
                ? 'Unlimited MCQs & Boardy AI Tutor Unlocked'
                : '10 Practice MCQs and 5 AI Tokens per Day'}
            </p>
          </div>

          {!isPro && (
            <Button variant="primary" size="md" onClick={() => setModalOpen(true)}>
              <Zap size={15} /> Upgrade to Pro — PKR 199/mo
            </Button>
          )}
        </GlassCard>
      )}

      {/* Pending verification alert if submitted */}
      {pendingRequests.filter((r) => r.status === 'pending').length > 0 && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--r-card)',
            background: 'var(--surface)',
            border: '1px solid #D71921',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
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
              <Check size={14} className="text-[#D71921]" /> 10 Practice MCQs / Day
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
              <Check size={14} className="text-[#D71921]" /> Unlimited Practice MCQs
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
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setModalOpen(true)}
              disabled={isPro}
            >
              {isPro ? 'Active Pro Member' : 'Upgrade to Pro'}
            </Button>
          </div>
        </GlassCard>

        {/* Tier 3: Crew */}
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
              Study Group Pass
            </span>
            <h3 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
              Crew Pass
            </h3>
            <div style={{ marginTop: 8 }}>
              <span className="font-display tabular-nums" style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>
                Included
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-faint)' }}> with active Crew</span>
            </div>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} className="text-[#D71921]" /> Shared Crew Goal Progress Ring
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} className="text-[#D71921]" /> Crew Team Leaderboards & Streaks
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} className="text-[#D71921]" /> Aggregated Crew Weak Chapter Stats
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Check size={14} className="text-[#D71921]" /> Competitive Daily Group Drills
            </li>
          </ul>

          <div style={{ marginTop: 'auto' }}>
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => navigate('/crew')}
            >
              <Users size={14} /> Open Crew Hub
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* Payment Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0,0,0,0.8)',
          }}
        >
          <div
            className="glass"
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
                  Upgrade to Boardly Pro
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  PKR 199 for 30 days full unlimited access
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
                {(['easypaisa', 'jazzcash', 'sadapay', 'nayapay', 'bank'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--r-input)',
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      border: method === m ? '1px solid #D71921' : '1px solid var(--border)',
                      background: method === m ? 'rgba(215, 25, 33, 0.1)' : 'var(--surface)',
                      color: method === m ? '#D71921' : 'var(--text)',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Details */}
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
              <p><strong>Account Name:</strong> SHS Virtual Academy / Boardly</p>
              <p><strong>Account / IBAN:</strong> 0300-1234567</p>
              <p><strong>Amount:</strong> PKR 199</p>
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
