import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Upload,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, logFirestoreError } from '../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { getKarachiTodayString, getTimeUntilKarachiMidnight, getPlanConfig } from '../../data/planLimits';

export const PlansUsageView: React.FC = () => {
  const { user, profile } = useAuth();

  const [dailyUsage, setDailyUsage] = useState<{
    testsTaken: number;
    boardyQuestionsAsked: number;
  }>({ testsTaken: 0, boardyQuestionsAsked: 0 });

  const [countdown, setCountdown] = useState<string>(() => getTimeUntilKarachiMidnight().formattedCountdown);

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'bank_transfer'>('easypaisa');
  const [transactionId, setTransactionId] = useState<string>('');
  const [isSubmittingSlip, setIsSubmittingSlip] = useState<boolean>(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState<boolean>(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const todayPkt = getKarachiTodayString();
  const planConfig = getPlanConfig(profile?.plan);
  const isPro = profile?.plan === 'pro' || profile?.plan === 'premium';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilKarachiMidnight().formattedCountdown);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const usageRef = doc(db, 'users', user.uid, 'usage', todayPkt);
    getDoc(usageRef).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setDailyUsage({
          testsTaken: d.testsTaken ?? d.testsUsed ?? 0,
          boardyQuestionsAsked: d.boardyQuestionsAsked ?? d.boardyUsed ?? 0,
        });
      } else {
        setDailyUsage({
          testsTaken: profile?.testsUsedToday ?? 0,
          boardyQuestionsAsked: profile?.boardyQuestionsUsedToday ?? 0,
        });
      }
    }).catch(console.warn);
  }, [user?.uid, todayPkt, profile]);

  const handleSubmitPaymentSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !transactionId.trim() || isSubmittingSlip) return;

    setIsSubmittingSlip(true);
    setUpgradeError(null);
    const reqPath = 'paymentRequests';

    try {
      const docData = {
        userId: user.uid,
        userEmail: user.email?.toLowerCase().trim() || '',
        userName: profile?.name || user.displayName || 'Student',
        planId: 'pro',
        durationMonths: 1,
        amountPkr: 199,
        paymentMethod,
        transactionId: transactionId.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'paymentRequests'), docData);
      setUpgradeSuccess(true);
      setTransactionId('');
    } catch (err: any) {
      logFirestoreError(reqPath, err, 'submit_payment_request');
      setUpgradeError(err?.message || 'Could not record payment receipt. Please check details.');
    } finally {
      setIsSubmittingSlip(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display flex items-center gap-2">
            <span>Plans & Daily Usage Limits</span>
            <CreditCard className="w-6 h-6 text-[var(--brand-2)]" />
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Track real usage allowances partitioned in Pakistan Standard Time (PKT, UTC+5).
          </p>
        </div>
        {!isPro && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowUpgradeModal(true)}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Upgrade to Pro (PKR 199/mo)
          </Button>
        )}
      </div>

      {/* Real PKT Usage Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card variant="glass" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Daily Practice Sprints
            </span>
            <span className="text-xs text-[var(--text-faint)] font-mono">
              Resets at midnight PKT ({countdown})
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">
              {dailyUsage.testsTaken} <span className="text-sm text-[var(--text-faint)] font-normal">/ {planConfig.testsPerDay >= 999 ? 'Unlimited' : planConfig.testsPerDay} Tests</span>
            </span>
            <Badge variant="student" size="sm">
              {planConfig.name} Plan
            </Badge>
          </div>

          <div className="w-full h-2.5 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2F6BFF] to-[#22D3EE] transition-all duration-300"
              style={{
                width: `${Math.min(100, (dailyUsage.testsTaken / planConfig.testsPerDay) * 100)}%`,
              }}
            />
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            Free tier includes 2 full practice sprint sessions daily. Pro tier unlocks unlimited sessions.
          </p>
        </Card>

        <Card variant="glass" className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Daily Boardy AI Queries
            </span>
            <span className="text-xs text-[var(--text-faint)] font-mono">
              Resets at midnight PKT ({countdown})
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">
              {dailyUsage.boardyQuestionsAsked} <span className="text-sm text-[var(--text-faint)] font-normal">/ {planConfig.boardyPerDay >= 999 ? 'Unlimited' : planConfig.boardyPerDay} Queries</span>
            </span>
            <Badge variant="student" size="sm">
              {planConfig.name} Plan
            </Badge>
          </div>

          <div className="w-full h-2.5 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-[#34D399] transition-all duration-300"
              style={{
                width: `${Math.min(100, (dailyUsage.boardyQuestionsAsked / planConfig.boardyPerDay) * 100)}%`,
              }}
            />
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            Free tier allows 3 step-by-step mathematical proofs daily. Pro allows 100 queries daily.
          </p>
        </Card>
      </div>

      {/* Plans Comparison Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Free Plan */}
        <Card variant="glass" className="p-6 space-y-5 border-white/10 text-left">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white font-display">Starter Free</h3>
            <p className="text-xs text-[var(--text-muted)]">Essential revision drills for Pakistani entrance tests</p>
            <div className="pt-2 text-2xl font-black text-white font-mono">PKR 0 <span className="text-xs font-normal text-[var(--text-faint)]">/ forever</span></div>
          </div>

          <ul className="space-y-2.5 text-xs text-[var(--text-muted)]">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>2 Practice sprints per day</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>3 Boardy AI step-by-step derivations daily</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Access to National Arena weekly mocks</span>
            </li>
          </ul>

          <div className="pt-3">
            <Button variant="secondary" size="md" disabled className="w-full justify-center">
              Current Active Plan
            </Button>
          </div>
        </Card>

        {/* Pro Plan */}
        <Card
          variant="glass"
          className="p-6 space-y-5 border-[#2F6BFF] shadow-[0_0_30px_-6px_rgba(47,107,255,0.3)] bg-gradient-to-tr from-blue-950/20 to-slate-900/40 text-left relative overflow-hidden"
        >
          <div className="absolute top-4 right-4">
            <Badge variant="student" size="sm">
              Most Popular
            </Badge>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white font-display">Boardly Pro</h3>
            <p className="text-xs text-[var(--text-muted)]">Complete question bank and full past paper vaults</p>
            <div className="pt-2 text-2xl font-black text-white font-mono">
              PKR 199 <span className="text-xs font-normal text-[var(--text-faint)]">/ month</span>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs text-white">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#22D3EE]" />
              <span className="font-bold">Unlimited practice test sessions</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#22D3EE]" />
              <span className="font-bold">100 Boardy AI derivations daily</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#22D3EE]" />
              <span>Full past paper simulators for FAST, NUST, GIKI & MDCAT</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#22D3EE]" />
              <span>Merit Meter detailed closing merit statistics</span>
            </li>
          </ul>

          <div className="pt-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowUpgradeModal(true)}
              className="w-full justify-center shadow-lg shadow-blue-600/30 font-bold"
            >
              {isPro ? 'Extend Pro Plan' : 'Upgrade to Pro'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Upgrade Modal with Manual Payment Slip Upload */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          setUpgradeSuccess(false);
          setUpgradeError(null);
        }}
        title="Upgrade to Boardly Pro (PKR 199/month)"
        maxWidth="max-w-md"
      >
        {upgradeSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Payment Request Submitted!</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Your transaction reference has been forwarded to our finance verification queue. Your account will automatically upgrade to Pro once verified (usually within 1-2 hours).
            </p>
            <Button variant="primary" size="md" onClick={() => setShowUpgradeModal(false)}>
              Back to Study Cockpit
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmitPaymentSlip} className="space-y-4 text-left">
            {upgradeError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {upgradeError}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-white/5 border border-white/8 space-y-2 text-xs">
              <span className="font-bold text-white block">Official Pakistani Payment Details:</span>
              <div className="space-y-1 font-mono text-[11px] text-[var(--text-muted)]">
                <p>EasyPaisa / JazzCash: <span className="text-white font-bold">0300-1234567</span> (SHS Virtual)</p>
                <p>Bank Transfer: <span className="text-white font-bold">Meezan Bank · 0102030405</span></p>
                <p>Amount: <span className="text-emerald-400 font-bold">PKR 199</span> (1 Month Pro)</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
              >
                <option value="easypaisa" className="bg-[#0E1626]">EasyPaisa</option>
                <option value="jazzcash" className="bg-[#0E1626]">JazzCash</option>
                <option value="bank_transfer" className="bg-[#0E1626]">Bank Transfer / Raast</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Transaction Reference / TID</label>
              <input
                type="text"
                required
                placeholder="e.g. EP-9042817291 or Meezan Ref ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
              />
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-white/8">
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowUpgradeModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit" isLoading={isSubmittingSlip}>
                Submit Payment Slip
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
