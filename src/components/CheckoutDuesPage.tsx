import React, { useState, useMemo } from 'react';
import {
  Menu,
  Bell,
  Check,
  CreditCard,
  Copy,
  CheckCheck,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Zap,
  Clock,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { RegistrationFormData } from './RegistrationPage';

export interface AuditRecord {
  id: string;
  status: string;
  timestamp: string;
  description: string;
}

interface CheckoutDuesPageProps {
  user: SupabaseUser | null;
  registrationData?: RegistrationFormData | null;
  onContinueFreeTier: () => void;
  onSubmitProof: (details: { cycle: string; amount: number; method: string; transactionId?: string }) => void;
  onBackToRegistration?: () => void;
  initialPath?: 'choose' | 'free' | 'pro';
  paymentStatus?: string; // 'Unpaid' | 'Pending Verification' | 'Verified & Paid' | 'Free Plan'
}

// Boardly Actual Pro Pricing by Track Category
export const TRACK_PRICING_CONFIG: Record<
  string,
  {
    monthly: { price: number; formatted: string; label: string };
    annual: { price: number; formatted: string; label: string; savings: string };
    lifetime: { price: number; formatted: string; label: string; savings: string };
  }
> = {
  board_ssc: {
    monthly: { price: 499, formatted: 'Rs. 499', label: '/ month' },
    annual: { price: 2999, formatted: 'Rs. 2,999', label: '/ year', savings: 'Save 50%' },
    lifetime: { price: 4999, formatted: 'Rs. 4,999', label: 'one-time', savings: 'Lifetime Access' },
  },
  board_hssc: {
    monthly: { price: 999, formatted: 'Rs. 999', label: '/ month' },
    annual: { price: 5999, formatted: 'Rs. 5,999', label: '/ year', savings: 'Save 50%' },
    lifetime: { price: 8999, formatted: 'Rs. 8,999', label: 'one-time', savings: 'Lifetime Access' },
  },
  engineering: {
    monthly: { price: 1499, formatted: 'Rs. 1,499', label: '/ month' },
    annual: { price: 8999, formatted: 'Rs. 8,999', label: '/ year', savings: 'Save 50%' },
    lifetime: { price: 11999, formatted: 'Rs. 11,999', label: 'one-time', savings: 'Lifetime Access' },
  },
  medical: {
    monthly: { price: 1499, formatted: 'Rs. 1,499', label: '/ month' },
    annual: { price: 8999, formatted: 'Rs. 8,999', label: '/ year', savings: 'Save 50%' },
    lifetime: { price: 11999, formatted: 'Rs. 11,999', label: 'one-time', savings: 'Lifetime Access' },
  },
  general: {
    monthly: { price: 1499, formatted: 'Rs. 1,499', label: '/ month' },
    annual: { price: 8999, formatted: 'Rs. 8,999', label: '/ year', savings: 'Save 50%' },
    lifetime: { price: 11999, formatted: 'Rs. 11,999', label: 'one-time', savings: 'Lifetime Access' },
  },
};

export const CheckoutDuesPage: React.FC<CheckoutDuesPageProps> = ({
  user,
  registrationData,
  onContinueFreeTier,
  onSubmitProof,
  onBackToRegistration,
  initialPath = 'choose',
  paymentStatus = 'Unpaid',
}) => {
  // Path Selection: 'choose' | 'pro'
  const [selectedPath, setSelectedPath] = useState<'choose' | 'pro'>(
    initialPath === 'pro' ? 'pro' : 'choose'
  );

  // Billing Cycle: 'monthly' | 'annual' | 'lifetime'
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | 'lifetime'>('monthly');

  // Copy details state
  const [copiedAccounts, setCopiedAccounts] = useState(false);

  // Proof status state
  const [proofSubmitted, setProofSubmitted] = useState(
    paymentStatus === 'Pending Verification'
  );

  // Status audit trail records
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(() => {
    const records: AuditRecord[] = [];
    const regDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    records.push({
      id: '1',
      status: 'Registered',
      timestamp: regDate,
      description: 'Account profile registered with curriculum preferences.',
    });
    if (paymentStatus === 'Pending Verification') {
      records.push({
        id: '2',
        status: 'Proof submitted',
        timestamp: regDate,
        description: 'Payment receipt submitted via WhatsApp verification desk.',
      });
    }
    return records;
  });

  // Calculate pricing based on registration track
  const pricingGroup = useMemo(() => {
    const cat = (registrationData?.category || '').toLowerCase();
    const grade = (registrationData?.grade || '').toLowerCase();

    if (cat.includes('fbise') || cat.includes('board')) {
      if (grade.includes('9') || grade.includes('10')) {
        return TRACK_PRICING_CONFIG.board_ssc;
      }
      return TRACK_PRICING_CONFIG.board_hssc;
    }
    if (cat.includes('mdcat') || cat.includes('nums') || cat.includes('aku')) {
      return TRACK_PRICING_CONFIG.medical;
    }
    return TRACK_PRICING_CONFIG.engineering;
  }, [registrationData]);

  const currentPrice = pricingGroup[billingCycle];

  // Dynamic Plan Subtitle from user's selection
  const planSubtitle = useMemo(() => {
    if (!registrationData) {
      return 'NUST (NET) Program • Pre-Engineering Stream • All Subjects Package';
    }
    const parts = [
      `${registrationData.category} Program`,
      registrationData.stream || 'Standard Stream',
      'All Subjects Package',
    ];
    return parts.join(' • ');
  }, [registrationData]);

  // Copy Account Details to Clipboard
  const handleCopyAccounts = () => {
    const textToCopy = `Boardly Official Fee Accounts:
• JazzCash: +92 305 8969050 (Title: Haseena Bibi)
• Easypaisa: +92 333 5292094 (Title: Sadia Fatima)
• SadaPay: +92 349 0744686 (Title: Raheela Ferdous)
WhatsApp Verification Desk: +92 322 2314436`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedAccounts(true);
    setTimeout(() => setCopiedAccounts(false), 2500);
  };

  // Open WhatsApp with prefilled message
  const handleOpenWhatsApp = () => {
    const studentName = registrationData?.fullName || user?.user_metadata?.full_name || 'Student';
    const email = user?.email || registrationData?.email || '';
    const track = registrationData?.category || 'Standard Track';
    const amountStr = currentPrice.formatted;

    const message = `Hello Boardly Admissions & Verification Desk,
I have transferred the tuition fee for my account.
• Full Name: ${studentName}
• Email: ${email}
• Selected Track: ${track} (${planSubtitle})
• Billing Cycle: ${billingCycle.toUpperCase()} (${amountStr})

Attached is my payment receipt / transaction screenshot. Please authorize my Pro access.`;

    const waUrl = `https://wa.me/923222314436?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle "I have sent my proof of payment" click
  const handleConfirmProofSent = () => {
    setProofSubmitted(true);
    const newRecord: AuditRecord = {
      id: String(Date.now()),
      status: 'Proof submitted',
      timestamp: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      description: 'Proof receipt flagged as dispatched to WhatsApp verification desk.',
    };

    setAuditRecords((prev) => [newRecord, ...prev]);

    onSubmitProof({
      cycle: billingCycle,
      amount: currentPrice.price,
      method: 'WhatsApp Transfer Submission',
    });
  };

  return (
    <div id="checkout-dues-container" className="min-h-screen w-full bg-[#F8F9FB] flex flex-col text-slate-900">
      {/* Top Nav Bar */}
      <header
        id="checkout-top-nav"
        className="w-full bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs"
      >
        <div className="flex items-center gap-3">
          {onBackToRegistration && (
            <button
              onClick={onBackToRegistration}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
              title="Back to Registration Form"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Edit Details</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center text-white font-black text-sm">
              B
            </div>
            <span className="font-black text-base sm:text-lg text-slate-950 tracking-tight">
              Boardly
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border border-slate-700 shadow-xs">
            {user?.email?.charAt(0).toUpperCase() || 'S'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Page Title & Subtitle */}
        <div id="checkout-title-area" className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Tuition Dues & Checkout
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-3xl leading-relaxed">
            View your active plan, transfer instructions, and authorization status. Access is gated until verification completes.
          </p>
        </div>

        {/* TWO-PATH SELECTION AT TOP OF PAGE */}
        <div id="checkout-two-path-selector" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option A: Continue with Free Tier */}
          <div
            id="path-free-tier-card"
            className="p-5 rounded-3xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Instant Access · No Payment
                </span>
                <span className="text-sm font-black text-slate-900">Rs. 0</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Continue with Free Tier
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Includes 2 full practice tests per month, official syllabus MCQs, and instant answer keys. No payment or verification needed.
              </p>
            </div>

            <button
              id="btn-choose-free-tier"
              type="button"
              onClick={onContinueFreeTier}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.99] border-2 border-slate-900 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Launch Free Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Option B: Upgrade to Pro */}
          <div
            id="path-pro-tier-card"
            className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
              selectedPath === 'pro'
                ? 'border-amber-400 bg-amber-50/30 ring-2 ring-amber-400/20 shadow-md'
                : 'border-slate-200 bg-white hover:border-amber-300 shadow-xs'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 shadow-xs">
                  Full Curriculum · Unlimited Mocks
                </span>
                <span className="text-sm font-black text-amber-950">
                  {pricingGroup.monthly.formatted}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Upgrade to Pro</span>
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unlock unlimited test building, 100 & 180 MCQ Grand Mock series with official timers, and priority AI performance diagnostics.
              </p>
            </div>

            <button
              id="btn-choose-pro-tier"
              type="button"
              onClick={() => setSelectedPath('pro')}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md ${
                selectedPath === 'pro'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-slate-950 hover:bg-slate-900 text-white'
              }`}
            >
              <span>{selectedPath === 'pro' ? 'Review Pro Plan Below ↓' : 'Select Pro Plan'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* IF "Upgrade to Pro" IS SELECTED: Show two-column layout */}
        {selectedPath === 'pro' && (
          <div
            id="checkout-pro-layout"
            className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2 animate-in fade-in slide-in-from-top-3 duration-300"
          >
            {/* LEFT COLUMN: Wider (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* CARD 1: Plan Package */}
              <div
                id="checkout-card-package"
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-950">
                      Plan Package
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {planSubtitle}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div
                    id="checkout-status-badge"
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 shrink-0 ${
                      proofSubmitted
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        proofSubmitted ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <span>
                      {proofSubmitted ? 'Pending Verification' : '🛡 Registered but Unauthorized'}
                    </span>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Billing Cycle Selector Tabs */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Billing Cycle
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'monthly', label: 'Monthly', price: pricingGroup.monthly.formatted },
                      { id: 'annual', label: 'Annual', price: pricingGroup.annual.formatted, tag: 'Save 50%' },
                      { id: 'lifetime', label: 'Lifetime', price: pricingGroup.lifetime.formatted, tag: 'Best' },
                    ].map((b) => {
                      const isSel = billingCycle === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBillingCycle(b.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSel
                              ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-[11px] font-black">{b.label}</div>
                          <div
                            className={`text-[10px] font-bold ${
                              isSel ? 'text-amber-300' : 'text-slate-500'
                            }`}
                          >
                            {b.price}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Total Fee Amount Row */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                      Total Fee Amount
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">Full Term Access Package</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-slate-950">
                      {currentPrice.formatted}
                    </span>
                    <span className="text-xs text-slate-500 font-bold ml-1">{currentPrice.label}</span>
                  </div>
                </div>

                {/* Highlighted Deny-by-Default Info Box */}
                <div
                  id="checkout-security-notice"
                  className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-medium text-amber-900 leading-relaxed">
                    <strong className="font-extrabold">Deny-by-Default Security:</strong> As per security guidelines, access to Pro features remains restricted until payment verification is marked authorized by an administrator.
                  </p>
                </div>
              </div>

              {/* CARD 2: Payment Accounts (Easypaisa & JazzCash) */}
              <div
                id="checkout-card-accounts"
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wider">
                      Payment Accounts (Easypaisa & JazzCash)
                    </h3>
                  </div>

                  <button
                    id="btn-copy-transfer-details"
                    type="button"
                    onClick={handleCopyAccounts}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[10px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    {copiedAccounts ? (
                      <>
                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">COPIED!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>📋 COPY TRANSFER DETAILS</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Monospace Code-style box showing actual payment accounts */}
                <div
                  id="checkout-accounts-codebox"
                  className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2.5 border border-slate-800"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <div>
                      <span className="text-[11px] text-amber-400 font-bold block">1. JazzCash</span>
                      <span className="text-xs text-white font-bold select-all">+92 305 8969050</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Title: Haseena Bibi</span>
                  </div>

                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                    <div>
                      <span className="text-[11px] text-emerald-400 font-bold block">2. Easypaisa</span>
                      <span className="text-xs text-white font-bold select-all">+92 333 5292094</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Title: Sadia Fatima</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-cyan-400 font-bold block">3. SadaPay</span>
                      <span className="text-xs text-white font-bold select-all">+92 349 0744686</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Title: Raheela Ferdous</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Narrower (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* CARD: Proof Verification (2-Step Process) */}
              <div
                id="checkout-card-proof"
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-950">
                    Proof Verification
                  </h3>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    2-STEP PROCESS
                  </span>
                </div>

                {/* Step 1 */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong className="font-extrabold text-slate-950">Step 1:</strong> Send your receipt or screenshot directly via WhatsApp to our verification desk.
                  </p>
                  <button
                    id="btn-open-whatsapp-proof"
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-black shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>🔗 Open WhatsApp & Send Proof</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <hr className="border-slate-100" />

                {/* Step 2 */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong className="font-extrabold text-slate-950">Step 2:</strong> Once sent, click below so our administration knows your proof is awaiting authorization.
                  </p>
                  <button
                    id="btn-confirm-proof-sent"
                    type="button"
                    onClick={handleConfirmProofSent}
                    className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>I have sent my proof of payment →</span>
                  </button>
                </div>
              </div>

              {/* CARD: STATUS AUDIT TRAIL */}
              <div
                id="checkout-card-audit"
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    STATUS AUDIT TRAIL
                  </span>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {auditRecords.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No history records found.
                  </p>
                ) : (
                  <div className="space-y-2.5 pt-1">
                    {auditRecords.map((record) => (
                      <div
                        key={record.id}
                        className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900">{record.status}</span>
                          <span className="text-[10px] font-bold text-slate-400">{record.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          {record.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
