import React from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Users,
  Award,
  Flame,
  FileSpreadsheet,
  Trophy,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  ChevronDown,
} from 'lucide-react';
import { NAKAMA_CAPTAINS_NAME, NAKAMA_CAPTAIN_SINGULAR, GRAND_LINE_NAME } from '@/constants/branding';

const PERKS_AND_POWERS = [
  {
    icon: <Sparkles className="text-[#D71921]" size={24} />,
    title: 'All Pro Features Free',
    desc: 'Full, unrestricted Pro access free from 18 November through the program duration. Unlimited drills, AI tutor explanations, and past papers.',
    glow: 'rgba(215, 25, 33, 0.25)',
  },
  {
    icon: <Award className="text-amber-400" size={24} />,
    title: '+1 Week Pro Per Student',
    desc: '+1 week of extra Pro access added on top of your expiry date for every single student who joins through your referral link or short ID.',
    glow: 'rgba(251, 191, 36, 0.25)',
  },
  {
    icon: <Users className="text-cyan-400" size={24} />,
    title: 'Captain Command Dashboard',
    desc: 'Live referral link, personal short ID, instant WhatsApp sharing, list of enrolled students, real-time stats, and national captain rank.',
    glow: 'rgba(6, 182, 212, 0.25)',
  },
  {
    icon: <FileSpreadsheet className="text-emerald-400" size={24} />,
    title: 'Captain Test Creator',
    desc: `Build and author custom timed entrance mocks from CSV and publish them on ${GRAND_LINE_NAME} for students across Pakistan to take.`,
    glow: 'rgba(16, 185, 129, 0.25)',
  },
  {
    icon: <ShieldCheck className="text-blue-400" size={24} />,
    title: 'Crew Power (Up to 30)',
    desc: 'Create, lead, and command your own dedicated Study Crew of up to 30 students. Manage membership requests, track squad streaks, and conquer leaderboards.',
    glow: 'rgba(59, 130, 246, 0.25)',
  },
  {
    icon: <Flame className="text-orange-400" size={24} />,
    title: 'Anime Streak Badges',
    desc: 'Unlock exclusive anime-style streak emblems, custom matrix halos, and glowing profile titles as you build disciplined study habits.',
    glow: 'rgba(249, 115, 22, 0.25)',
  },
  {
    icon: <Trophy className="text-yellow-400" size={24} />,
    title: 'National Leaderboard Recognition',
    desc: 'Prominent featured standings across Pakistan on the official Captain and Crew Leaderboards, showcasing your squad reach and test records.',
    glow: 'rgba(234, 179, 8, 0.25)',
  },
  {
    icon: <Sparkles className="text-[#FFD66B]" size={24} />,
    title: '5,000 Monthly Kobans Allotment',
    desc: 'Discretionary leadership allowance of 5,000 Kobans credited every calendar month to unlock cosmetic avatar frames, nameplates, and aura effects in the Boardly Store (non-cash, requires active Captain status).',
    glow: 'rgba(232, 163, 23, 0.25)',
  },
];

const FOUR_STEPS = [
  {
    step: '01',
    title: 'Apply Online',
    desc: 'Fill out the short Nakama Captain application with your academic college/campus and why you want to lead.',
  },
  {
    step: '02',
    title: 'Get Approved',
    desc: 'SHS Virtual Academy reviews nominations within 24 hours. Your captain dashboard and perks unlock automatically.',
  },
  {
    step: '03',
    title: 'Recruit and Lead',
    desc: 'Share your personal referral link and assemble a Study Crew of up to 30 peers across college and coaching circles.',
  },
  {
    step: '04',
    title: 'Rise on Leaderboard',
    desc: 'Author custom Grand Line tests, earn weekly Pro extensions for recruits, and climb the national captain standings.',
  },
];

export function NakamaCaptainsPage() {
  const scrollToSteps = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('how-it-works-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <PageMeta
        title={`${NAKAMA_CAPTAINS_NAME} — Lead Your Crew, Rise Through the Ranks | Boardly`}
        description={`Become a ${NAKAMA_CAPTAIN_SINGULAR}. Lead your student squad, earn Pro rewards, author tests on ${GRAND_LINE_NAME}, and climb the Pakistan leaderboards.`}
      />

      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pt-6 sm:pt-10 pb-20 page-enter">
        <div className="boardly-container max-w-5xl mx-auto px-4 sm:px-6 space-y-16 sm:space-y-20">
          
          {/* ── Section A: Hero ── */}
          <section className="text-center space-y-6 pt-4 max-w-3xl mx-auto">
            <div className="section-chip section-chip-red">
              <Sparkles size={14} className="text-[#D71921]" />
              <span>Official Leadership Program</span>
            </div>

            <h1
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] font-dot"
              style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
            >
              Become a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D71921] via-red-500 to-amber-400">{NAKAMA_CAPTAIN_SINGULAR}</span>.
              <br />
              <span className="text-white/90">Lead your crew. Rise through the ranks.</span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed max-w-2xl mx-auto">
              Command your campus study circle, publish custom entrance tests, earn free Pro access, and gain prestigious leadership recognition from SHS Virtual Academy.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/captain/apply"
                className="btn-primary text-sm sm:text-base px-8 rounded-full font-bold flex items-center gap-2"
                style={{ height: '54px' }}
              >
                <span>Apply Now</span>
                <ArrowRight size={18} />
              </Link>
              <button
                type="button"
                onClick={scrollToSteps}
                className="btn-secondary text-sm sm:text-base px-6 rounded-full font-semibold flex items-center gap-2 cursor-pointer"
                style={{ height: '54px' }}
              >
                <span>How it works</span>
                <ChevronDown size={16} />
              </button>
            </div>
          </section>

          {/* ── Section B: Name Meaning Glass Card ── */}
          <section className="max-w-2xl mx-auto">
            <div className="glass-card relative p-7 sm:p-8 rounded-[28px] border-[#D71921]/40 shadow-[0_20px_50px_rgba(215,25,33,0.18)] overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                <div className="shrink-0 flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-black/70 border border-red-500/35 shadow-inner">
                  <span
                    className="text-3xl sm:text-4xl font-extrabold text-[#D71921] drop-shadow-[0_0_12px_rgba(215,25,33,0.8)]"
                    style={{ fontFamily: 'sans-serif' }}
                  >
                    仲間
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-white/60 mt-1">
                    NAKAMA
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold">
                    Japanese for companion, comrade, close teammate
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed">
                    A Nakama is someone you share a bond with and face challenges alongside, more than just a friend. A Nakama Captain is the captain of a crew: a leader who brings students together and helps them rise.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section C: Perks and Powers (Cards) ── */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <div className="section-chip section-chip-red">Captains Arsenal</div>
              <h2
                className="text-2xl sm:text-4xl font-bold text-white tracking-tight font-dot"
                style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
              >
                Perks &amp; Powers of a {NAKAMA_CAPTAIN_SINGULAR}
              </h2>
              <p className="text-sm text-[var(--muted)] max-w-xl mx-auto">
                Exclusive leadership privileges and preparation firepower reserved for approved captains.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {PERKS_AND_POWERS.map((perk) => (
                <div
                  key={perk.title}
                  className="glass-card glass-card-interactive p-6 flex flex-col justify-between rounded-[24px]"
                >
                  <div className="space-y-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-white/[0.05]"
                      style={{
                        boxShadow: `0 0 20px -3px ${perk.glow}`,
                      }}
                    >
                      {perk.icon}
                    </div>

                    <h3
                      className="text-base sm:text-lg font-bold text-white"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {perk.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                      {perk.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section D: How It Works in 4 Steps ── */}
          <section id="how-it-works-section" className="space-y-8 scroll-mt-32">
            <div className="text-center space-y-2">
              <div className="section-chip">Clear Pathway</div>
              <h2
                className="text-2xl sm:text-4xl font-bold text-white tracking-tight font-dot"
                style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
              >
                How It Works in 4 Steps
              </h2>
              <p className="text-sm text-[var(--muted)]">
                From application to leading your crew on the national stage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FOUR_STEPS.map((step) => (
                <div
                  key={step.step}
                  className="glass-card p-6 rounded-[24px] space-y-3 relative overflow-hidden"
                >
                  <span
                    className="font-dot text-3xl font-extrabold text-[#D71921] opacity-75 block"
                    style={{ fontFamily: 'var(--font-dot)' }}
                  >
                    {step.step}
                  </span>
                  <h3 className="text-base font-bold text-white font-heading">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section E: Your Journey (Certificate & Paid Internship) ── */}
          <section className="max-w-3xl mx-auto">
            <div className="glass-card p-8 sm:p-10 rounded-[30px] border-amber-500/35 shadow-[0_20px_50px_rgba(245,158,11,0.15)] relative overflow-hidden text-center sm:text-left space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <GraduationCap size={30} />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                    Official Recognition &amp; Growth
                  </span>
                  <h3
                    className="text-xl sm:text-2xl font-bold text-white font-dot"
                    style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
                  >
                    Your Journey as a {NAKAMA_CAPTAIN_SINGULAR}
                  </h3>
                  <p className="text-sm text-white/80 leading-relaxed">
                    After 1 year of active service, Nakama Captains receive an official certificate from SHS Virtual Academy. After the certificate, paid internship opportunities may be offered, depending on each captain&apos;s performance, activity and results.
                  </p>
                </div>
              </div>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl glass-row flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-amber-400 shrink-0" />
                  <span className="text-xs font-semibold text-white/90">
                    Official SHS Virtual Academy Certificate
                  </span>
                </div>
                <div className="p-4 rounded-2xl glass-row flex items-center gap-3">
                  <Briefcase size={18} className="text-amber-400 shrink-0" />
                  <span className="text-xs font-semibold text-white/90">
                    Merit-Based Paid Internship Opportunities
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section F: Bottom Apply Now CTA ── */}
          <section className="text-center p-8 sm:p-12 rounded-[32px] glass-panel space-y-6 max-w-3xl mx-auto">
            <h2
              className="text-2xl sm:text-4xl font-extrabold text-white font-dot"
              style={{ fontFamily: 'var(--font-dot)', letterSpacing: '0.01em' }}
            >
              Ready to Command Your Crew?
            </h2>
            <p className="text-sm text-[var(--muted)] max-w-lg mx-auto">
              Join the elite circle of student leaders across Pakistan. Submit your captain nomination today.
            </p>
            <div className="pt-2 flex justify-center">
              <Link
                to="/captain/apply"
                className="btn-primary text-sm sm:text-base px-8 rounded-full font-bold flex items-center gap-2"
                style={{ height: '54px' }}
              >
                <span>Apply for {NAKAMA_CAPTAIN_SINGULAR}</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}

export default NakamaCaptainsPage;
