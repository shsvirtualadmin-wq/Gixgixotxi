import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGate } from '@/contexts/AuthGateContext';
import { PageMeta } from '@/components/ui/PageMeta';
import { KobanIcon, KobanAmount } from '@/components/koban/KobanIcon';
import { COSMETICS_CATALOG } from '@/data/cosmeticsCatalog';
import { CosmeticFrame, CosmeticNameplate, CosmeticEffect } from '@/components/koban/CosmeticRenderers';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import {
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  Award,
  Lock,
  Mail,
  Phone,
} from 'lucide-react';

const KOBANS_FAQS = [
  {
    q: 'Are Kobans refundable or exchangeable for cash?',
    a: 'No. Kobans are non-refundable virtual in-app credits exclusively created for cosmetic profile personalization (such as avatar frames, animated nameplates, and aura effects). They hold no real-world monetary or fiat cash value, cannot be redeemed for legal currency, and cannot be withdrawn. In the event of a documented duplicate or erroneous payment, contact support@boardly.cfd within 48 hours for review.',
  },
  {
    q: 'Do Kobans ever expire?',
    a: 'No. Unused Koban balances remain securely stored in your personal student wallet indefinitely. You may save them across months and spend them whenever new cosmetic drops arrive in the Boardly Store.',
  },
  {
    q: 'Can I transfer Kobans or cosmetics to a friend or squad member?',
    a: 'No. Kobans and purchased cosmetics are non-transferable and remain permanently bound to the student account that purchased them. Account sharing, selling, or pooling is strictly prohibited under our Terms of Service.',
  },
  {
    q: 'Do cosmetics or Kobans provide an academic advantage in tests?',
    a: 'Absolutely not. Boardly maintains strict academic integrity. Kobans and cosmetics are 100% aesthetic. They have zero impact on mock exam scores, algorithm question generation, merit calculations, or university entrance rankings.',
  },
  {
    q: 'What are the rules for students under 18 years old?',
    a: 'Students under the age of 18 must obtain the express authorization and consent of a parent or legal guardian before initiating any mobile banking payment (JazzCash or EasyPaisa) to purchase Kobans.',
  },
  {
    q: 'How long does payment verification take?',
    a: 'Once you submit your Transaction ID (TRX) in the Get Kobans sheet, our superadmin team verifies the receipt against official mobile banking records. Verified requests are typically credited to your wallet within a few minutes to a few hours.',
  },
  {
    q: 'How do I contact support if my payment is delayed?',
    a: 'You can reach out directly via email to support@boardly.cfd or message our official WhatsApp helpline at 0305 8969050 with your registered email and TRX ID.',
  },
];

export function KobansPage() {
  const { user } = useAuth();
  const { requireAuth } = useAuthGate();
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const sampleFrame = COSMETICS_CATALOG.find((c) => c.id === 'frame-neon-cyber') || COSMETICS_CATALOG[1];
  const sampleNameplate = COSMETICS_CATALOG.find((c) => c.id === 'plate-galaxy-pioneer') || COSMETICS_CATALOG[11];
  const sampleEffect = COSMETICS_CATALOG.find((c) => c.id === 'black-sun-ember-storm') || COSMETICS_CATALOG[15];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24 overflow-x-hidden">
      <PageMeta
        title="About Kobans — The Boardly Economy & Virtual Credits"
        description="Learn everything about Kobans: Pakistan's student economy for anime avatar frames, nameplates, and aura effects. 10 Kobans = PKR 1."
      />

      {/* ─── HERO SECTION ──────────────────────────────────────────────────── */}
      <section className="relative pt-6 sm:pt-12 pb-12 sm:pb-16 overflow-hidden">
        {/* Subtle radial background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-gradient-to-tr from-[#D71920]/10 via-[#E8A317]/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="boardly-container max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
          {/* Animated Hero Coin in Glass Container */}
          <div className="inline-flex items-center justify-center mb-2">
            <div className="glass-card relative p-4 rounded-[28px] border-[#E8A317]/40 shadow-[0_0_35px_rgba(232,163,23,0.25)]">
              <KobanIcon size={80} animated={true} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="section-chip border-[#E8A317]/40 bg-[#E8A317]/15 text-[#FFD66B]">
              <span>🪙 Official In-App Credit</span>
              <span>•</span>
              <span>10 Kobans = PKR 1</span>
            </div>

            <h1
              className="text-3xl sm:text-5xl font-extrabold text-[var(--text)] tracking-tight font-dot"
              style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
            >
              About Kobans
            </h1>

            <p className="text-sm sm:text-base text-[var(--muted)] max-w-2xl mx-auto leading-relaxed">
              Kobans are Boardly&apos;s virtual in-app credit designed exclusively for student aesthetic personalization. Unlock handcrafted dot-matrix avatar frames, animated nameplates, and rising aura effects to showcase your study rank.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/store"
              className="btn-primary text-xs sm:text-sm px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg"
              style={{ height: '50px' }}
            >
              <span>Explore Boardly Store</span>
              <ArrowRight size={16} />
            </Link>
            {user ? (
              <Link
                to="/store/get-kobans"
                className="btn-secondary text-xs sm:text-sm px-6 py-3 rounded-full font-bold flex items-center gap-2"
                style={{ height: '50px' }}
              >
                <Plus size={16} />
                <span>Get Kobans (from PKR 50)</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() =>
                  requireAuth(
                    'purchase Kobans for your student wallet',
                    () => navigate('/store/get-kobans'),
                    '/store/get-kobans'
                  )
                }
                className="btn-secondary text-xs sm:text-sm px-6 py-3 rounded-full font-bold flex items-center gap-2 cursor-pointer"
                style={{ height: '50px' }}
              >
                <Plus size={16} />
                <span>Get Kobans (from PKR 50)</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── KEY PILLARS / ECONOMY RULES ────────────────────────────────────── */}
      <section className="py-12 sm:py-16">
        <div className="boardly-container max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="section-chip">Core Economics</div>
            <h2
              className="text-xl sm:text-3xl font-extrabold text-[var(--text)] font-dot"
              style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
            >
              The Principles of the Kobans Economy
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              Fair, transparent, and strictly cosmetic. Built to celebrate daily study commitment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-6 rounded-[24px] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E8A317]/15 border border-[#E8A317]/40 flex items-center justify-center text-[#FFD66B]">
                <KobanIcon size={22} />
              </div>
              <h3 className="font-heading font-bold text-base text-[var(--text)]">Fixed 10:1 Ratio</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Simple math with zero hidden fees: <strong className="text-[var(--text)]">10 Kobans = PKR 1</strong>. The minimum purchase is 500 Kobans (PKR 50), and amounts are requested in whole multiples of 10.
              </p>
            </div>

            <div className="glass-card p-6 rounded-[24px] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <ShieldCheck size={22} />
              </div>
              <h3 className="font-heading font-bold text-base text-[var(--text)]">Strictly Non-Pay-To-Win</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Kobans cannot buy test answers, streak freezes, or merit advantages. All mock exams, answer keys, and syllabus notes remain 100% merit-based and accessible.
              </p>
            </div>

            <div className="glass-card p-6 rounded-[24px] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Lock size={22} />
              </div>
              <h3 className="font-heading font-bold text-base text-[var(--text)]">No Expiry &amp; Secure Ledger</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Every purchase, grant, and deduction is permanently timestamped in your immutable personal wallet ledger. Your Kobans never expire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW TO GET KOBANS (3-STEP PROCESS) ─────────────────────────────── */}
      <section className="py-12 sm:py-16">
        <div className="boardly-container max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-2">
            <div className="section-chip">Verification Workflow</div>
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] font-dot"
              style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
            >
              How to Get Kobans in 3 Steps
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] max-w-md mx-auto">
              Payments are verified directly by Boardly superadmins via Pakistan&apos;s trusted mobile banking systems.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-[24px] space-y-3 relative">
              <span className="w-7 h-7 rounded-full bg-[#D71920] text-white font-dot text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="font-heading font-bold text-base text-[var(--text)]">Choose Your Amount</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Open the <strong className="text-[var(--text)]">Get Kobans</strong> sheet in the Store or navigation menu. Pick a quick bundle (500, 1,000, 2,500, or 5,000 Kobans) or enter any multiple of 10.
              </p>
            </div>

            <div className="glass-card p-6 rounded-[24px] space-y-3 relative">
              <span className="w-7 h-7 rounded-full bg-[#D71920] text-white font-dot text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="font-heading font-bold text-base text-[var(--text)]">Transfer via Mobile Bank</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Send the exact PKR amount to Boardly&apos;s verified <strong className="text-[var(--text)]">JazzCash</strong> or <strong className="text-[var(--text)]">EasyPaisa</strong> account displayed in the modal.
              </p>
            </div>

            <div className="glass-card p-6 rounded-[24px] space-y-3 relative">
              <span className="w-7 h-7 rounded-full bg-[#D71920] text-white font-dot text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="font-heading font-bold text-base text-[var(--text)]">Submit TRX ID</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Paste your payment Transaction ID (TRX). Our superadmin verifies the transaction against banking logs and credits your wallet within minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHAT YOU CAN UNLOCK (STORE PREVIEW) ────────────────────────────── */}
      <section className="py-12 sm:py-16">
        <div className="boardly-container max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="section-chip">Aesthetics &amp; Loadouts</div>
              <h2
                className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] font-dot"
                style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
              >
                What You Can Buy With Kobans
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)]">
                Each cosmetic is permanently unlocked and syncs across all study squads and leaderboards.
              </p>
            </div>
            <Link
              to="/store"
              className="btn-primary text-xs px-5 py-2.5 rounded-full font-bold inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm"
            >
              <span>View Full 18-Item Store</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Sample Frame */}
            <div className="glass-card glass-card-interactive p-5 rounded-[24px] flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-cyan-400">
                  Avatar Frame
                </span>
                <KobanAmount value={sampleFrame.priceKobans} iconSize={14} className="text-xs text-[#FFD66B]" />
              </div>
              <div className="h-32 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                <CosmeticFrame itemId={sampleFrame.id} size={76}>
                  <MatrixAvatar avatarKey="skull-01" variant="red-on-black" size={58} />
                </CosmeticFrame>
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-[var(--text)]">{sampleFrame.name}</h4>
                <p className="text-xs text-[var(--muted)] line-clamp-2 mt-0.5">{sampleFrame.description}</p>
              </div>
            </div>

            {/* Sample Nameplate */}
            <div className="glass-card glass-card-interactive p-5 rounded-[24px] flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border border-purple-500/40 bg-purple-950/40 text-purple-400">
                  Nameplate
                </span>
                <KobanAmount value={sampleNameplate.priceKobans} iconSize={14} className="text-xs text-[#FFD66B]" />
              </div>
              <div className="h-32 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center p-2 overflow-hidden">
                <div className="w-full flex items-center justify-center overflow-hidden px-1">
                  <CosmeticNameplate
                    itemId={sampleNameplate.id}
                    name="Hamza Ahmed"
                    shortId="98402"
                    roleBadge="STUDENT"
                    className="max-w-full"
                  />
                </div>
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-[var(--text)]">{sampleNameplate.name}</h4>
                <p className="text-xs text-[var(--muted)] line-clamp-2 mt-0.5">{sampleNameplate.description}</p>
              </div>
            </div>

            {/* Sample Effect */}
            <div className="glass-card glass-card-interactive p-5 rounded-[24px] flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border border-pink-500/40 bg-pink-950/40 text-pink-400">
                  Aura Effect
                </span>
                <KobanAmount value={sampleEffect.priceKobans} iconSize={14} className="text-xs text-[#FFD66B]" />
              </div>
              <div className="h-32 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                <CosmeticEffect itemId={sampleEffect.id} size={82}>
                  <MatrixAvatar avatarKey="skull-01" variant="red-on-black" size={54} />
                </CosmeticEffect>
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-[var(--text)]">{sampleEffect.name}</h4>
                <p className="text-xs text-[var(--muted)] line-clamp-2 mt-0.5">{sampleEffect.description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NAKAMA CAPTAIN MONTHLY ALLOTMENT NOTE ─────────────────────────── */}
      <section className="py-10">
        <div className="boardly-container max-w-4xl mx-auto px-4 sm:px-6">
          <div className="glass-card p-6 sm:p-8 rounded-[28px] border-[#E8A317]/35 shadow-[0_20px_50px_rgba(232,163,23,0.12)] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E8A317]/15 border border-[#E8A317]/35 flex items-center justify-center text-[#FFD66B] shrink-0">
                <Award size={26} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3
                    className="font-extrabold text-base sm:text-lg text-[var(--text)] font-dot"
                    style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
                  >
                    Nakama Captain Monthly Allotment
                  </h3>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#E8A317]/15 border border-[#E8A317]/40 text-[#FFD66B]">
                    5,000 Kobans / mo
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed max-w-xl">
                  Approved student leaders who serve as verified Nakama Captains receive a discretionary monthly allowance of 5,000 Kobans (PKR 500 equivalent) to celebrate squad leadership and test authoring on Grand Line. Discretionary, non-cash, and requires active Captain status.
                </p>
              </div>
            </div>

            <Link
              to="/nakama-captains"
              className="btn-secondary text-xs px-4 py-2.5 rounded-full font-bold whitespace-nowrap shrink-0 self-stretch sm:self-auto text-center"
            >
              Captain Program Info &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ─── COMPREHENSIVE FAQ SECTION ──────────────────────────────────────── */}
      <section className="py-12 sm:py-16">
        <div className="boardly-container max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <div className="section-chip">
              <HelpCircle size={14} /> <span>Frequently Asked Questions</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] font-dot"
              style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
            >
              Got Questions About Kobans?
            </h2>
          </div>

          <div className="space-y-3">
            {KOBANS_FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="glass-row rounded-[22px] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="font-heading font-bold text-sm sm:text-base text-[var(--text)]">
                      {faq.q}
                    </span>
                    <span className="text-[var(--muted)] shrink-0">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--muted)] leading-relaxed border-t border-white/10 animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Support Helpline Note */}
          <div className="glass-card p-4 rounded-2xl text-xs text-[var(--muted)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-[#D71920] shrink-0" />
              <span>Need help with a payment? Contact <a href="mailto:support@boardly.cfd" className="text-[var(--text)] font-bold hover:underline">support@boardly.cfd</a></span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-emerald-400 shrink-0" />
              <span>WhatsApp: <a href="https://wa.me/923058969050" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold hover:underline">0305 8969050</a></span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default KobansPage;
