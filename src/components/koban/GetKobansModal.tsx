import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { KobanIcon, KobanStack } from './KobanIcon';
import { PAYMENT_METHODS } from '@/constants/branding';
import { submitKobanRequest } from '@/services/kobanService';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';

interface GetKobansModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAmount?: number;
}

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

export const GetKobansModal: React.FC<GetKobansModalProps> = ({
  isOpen,
  onClose,
  initialAmount = 1000,
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [amount, setAmount] = useState<number>(initialAmount);
  const [selectedMethod, setSelectedMethod] = useState<'jazzcash' | 'easypaisa'>('jazzcash');
  const [transactionId, setTransactionId] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successRequestId, setSuccessRequestId] = useState<string | null>(null);

  if (!isOpen) return null;

  const pkrAmount = Math.max(50, Math.floor(amount / 10));
  const activeMethod = PAYMENT_METHODS[selectedMethod];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAmountChange = (val: number) => {
    setError(null);
    setAmount(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      setError('Please sign in to submit a Kobans request.');
      return;
    }

    if (amount < 500) {
      setError('Minimum purchase is 500 Kobans (PKR 50).');
      return;
    }

    if (amount % 10 !== 0) {
      setError('Amount must be a whole multiple of 10 Kobans.');
      return;
    }

    if (!transactionId.trim() || transactionId.trim().length < 4) {
      setError('Please enter a valid Transaction ID (TRX).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const docId = await submitKobanRequest({
        userId: user.uid,
        userEmail: user.email || '',
        userName: profile?.displayName || user.displayName || 'Student',
        amount,
        transactionId: transactionId.trim(),
        paymentMethod: selectedMethod,
      });

      setSuccessRequestId(docId);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 my-auto text-[var(--text)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E8A317]/10 border border-[#E8A317]/30 flex items-center justify-center">
              <KobanIcon size={24} />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[var(--text)]">
                Get Kobans
              </h2>
              <p className="text-xs text-[var(--muted)] font-mono">10 Kobans = PKR 1</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {successRequestId ? (
          /* SUCCESS STATE */
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto animate-in zoom-in-75">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-extrabold text-xl text-[var(--text)]">
                Request Submitted!
              </h3>
              <p className="text-xs text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
                Your request for{' '}
                <strong className="text-[#FFD66B] font-mono">{amount.toLocaleString()} Kobans</strong> (PKR {pkrAmount}) has been sent for admin verification.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-[var(--muted)]">
                <span>Transaction ID:</span>
                <span className="text-[var(--text)] font-bold">{transactionId}</span>
              </div>
              <div className="flex justify-between text-[var(--muted)]">
                <span>Status:</span>
                <span className="text-amber-400 font-bold">Pending Verification</span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--muted)]">
              Kobans are credited to your wallet balance as soon as the transaction is confirmed.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="btn-red w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer shadow-sm"
            >
              Back to Store
            </button>
          </div>
        ) : (
          /* FORM STATE */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount Selection */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-heading font-bold text-[var(--text)] uppercase tracking-wider">
                  Select or Enter Kobans Amount
                </label>
                <span className="text-xs font-mono text-[var(--muted)]">Min. 500 Kobans</span>
              </div>

              {/* Quick Select Chips */}
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => handleAmountChange(quick)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                      amount === quick
                        ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)] shadow-sm'
                        : 'bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text)] border-[var(--border)]'
                    }`}
                  >
                    {quick.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Custom Input & Live Calculation */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--surface-2)] border border-[rgba(232,163,23,0.35)]">
                <div className="shrink-0 flex items-center justify-center pl-1">
                  {amount >= 1000 ? <KobanStack size={28} /> : <KobanIcon size={28} />}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="block text-[10px] uppercase font-heading text-[var(--muted)] font-semibold">
                    Amount (Whole multiples of 10)
                  </span>
                  <input
                    type="number"
                    min="500"
                    step="10"
                    value={amount || ''}
                    onChange={(e) => handleAmountChange(Number(e.target.value))}
                    className="w-full bg-transparent font-mono font-bold text-lg text-[#FFD66B] focus:outline-none placeholder-neutral-600"
                    placeholder="500"
                  />
                </div>

                <div className="text-right pl-3 border-l border-[var(--border)] shrink-0">
                  <span className="block text-[10px] uppercase font-heading text-[var(--muted)] font-semibold">
                    Total in PKR
                  </span>
                  <span className="font-heading font-extrabold text-base text-[var(--text)]">
                    PKR {pkrAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-heading font-bold text-[var(--text)] uppercase tracking-wider block">
                Choose Payment Method
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {(['jazzcash', 'easypaisa'] as const).map((method) => {
                  const m = PAYMENT_METHODS[method];
                  const isSelected = selectedMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedMethod(method)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[var(--red)] bg-[rgba(215,25,33,0.08)] shadow-sm'
                          : 'border-[var(--border)] bg-[var(--surface-2)] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="font-heading font-bold text-xs text-[var(--text)]">{m.label}</div>
                      <div className="text-[11px] text-[var(--muted)] font-mono truncate mt-0.5">
                        {m.accountNumber}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Account Details Box */}
              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted)]">Send exactly:</span>
                  <span className="font-heading font-bold text-sm text-[var(--text)]">
                    PKR {pkrAmount.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
                  <div>
                    <span className="text-[10px] text-[var(--muted)] uppercase font-mono block">Account Number</span>
                    <span className="font-mono font-bold text-xs text-[var(--text)]">{activeMethod.accountNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeMethod.accountNumber, 'num')}
                    className="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-white transition-colors"
                    title="Copy number"
                  >
                    {copiedKey === 'num' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
                  <div>
                    <span className="text-[10px] text-[var(--muted)] uppercase font-mono block">Account Title</span>
                    <span className="font-heading font-semibold text-xs text-[var(--text)]">{activeMethod.accountTitle}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeMethod.accountTitle, 'title')}
                    className="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-white transition-colors"
                    title="Copy title"
                  >
                    {copiedKey === 'title' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction ID Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-bold text-[var(--text)] uppercase tracking-wider block">
                Transaction ID (TRX / TID)
              </label>
              <input
                type="text"
                required
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. 84920194821 or 2940284"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs sm:text-sm font-mono text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)]"
              />
              <p className="text-[11px] text-[var(--muted)]">
                Copy the TID from your JazzCash / Easypaisa confirmation SMS or receipt screen.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Non-refundable Disclaimer */}
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--muted)] leading-relaxed flex items-start gap-2">
              <ShieldCheck size={15} className="text-[#E8A317] shrink-0 mt-0.5" />
              <span>
                Kobans are for profile cosmetics and visual flair only and are non-refundable. Standard rate: 10 Kobans = PKR 1.
              </span>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-red w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Payment Verification</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
