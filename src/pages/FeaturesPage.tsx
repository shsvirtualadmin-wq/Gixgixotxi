import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { MathText } from '@/components/ui/MathText';
import {
  Calculator,
  Target,
  Cpu,
  Flame,
  Users,
  Trophy,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { MAX_CREW_MEMBERS, FREE_DAILY_TESTS } from '@/constants/limits';

const REAL_FEATURES = [
  {
    num: '01',
    icon: <Target size={22} />,
    title: 'Entrance Drill Engine & Mocks',
    badge: 'Core Practice',
    desc: 'Take timed 10-minute sprints, 20-minute chapter drills, and full-length university entrance mocks (FAST-NUCES, NUST NET, GIKI, ECAT, MDCAT). Includes real time constraints and customizable subject filters.',
    link: '/dashboard/practice',
    linkText: 'Practice in Cockpit',
  },
  {
    num: '02',
    icon: <Calculator size={22} />,
    title: 'Authentic Negative Marking Simulator',
    badge: 'Exam Precision',
    desc: 'Practices negative marking deduction heuristics (such as FAST-NUCES -0.25 penalty per wrong answer). Your test results display net score calculations and statistical advice on when guessing yields positive expected value.',
    link: '/pricing',
    linkText: 'View Scoring Rules',
  },
  {
    num: '03',
    icon: <Calculator size={22} />,
    title: 'KaTeX-Rendered Formula Derivations',
    badge: 'Math Engine',
    desc: 'Pure LaTeX rendering powered by KaTeX. Every calculus, physics derivation, and chemistry equilibrium question displays clear mathematical steps, eliminating blurry scanned textbook images.',
    demoMath: '$$\\int x e^{2x} \\, dx = \\frac{1}{2} x e^{2x} - \\frac{1}{4} e^{2x} + C$$',
  },
  {
    num: '04',
    icon: <Flame size={22} />,
    title: 'Study Streaks & Practice Tracking',
    badge: 'Consistency',
    desc: 'Maintain your daily study routine with streak counters that reset precisely at 12:00 AM PKT (Asia/Karachi), along with complete attempt history logs.',
    link: '/dashboard/streaks',
    linkText: 'Track Daily Streaks',
  },
  {
    num: '05',
    icon: <Users size={22} />,
    title: 'Study Crew & Campus Squads',
    badge: 'Collaborative Prep',
    desc: `Form collaborative study squads of up to ${MAX_CREW_MEMBERS} classmates with private 6-character invite codes. Compare test solve times, maintain squad leaderboards, and coordinate practice routines.`,
    link: '/crew',
    linkText: 'Explore Study Crew',
    highlight: true,
  },
  {
    num: '06',
    icon: <Trophy size={22} />,
    title: 'Boardly Arena & Grand Line',
    badge: 'National Testing',
    desc: 'Competitive mock sessions and Grand Line public tests where students across Pakistan solve test papers created by Nakama Captains, generating nationwide percentile rankings.',
    link: '/grand-line',
    linkText: 'Explore Grand Line',
  },
  {
    num: '07',
    icon: <Cpu size={22} />,
    title: 'Boardy 24/7 AI Tutor',
    badge: 'Edge Intelligence',
    desc: 'Dedicated conversational entrance exam tutor. Explains tricky physics concept derivations, calculation shortcuts, and trap options with numbered guidance without spoiling the solution immediately.',
    link: '/dashboard/ai-tutor',
    linkText: 'Meet Boardy',
  },
  {
    num: '08',
    icon: <Clock size={22} />,
    title: 'Midnight PKT Daily Allowances',
    badge: 'Predictable Access',
    desc: `Generous free allowances (${FREE_DAILY_TESTS} tests/day, 3 Arena mocks, 5 AI derivations) refreshing daily at midnight Pakistan Standard Time (UTC+5). Unlimited access available on the Pro plan for PKR 199/month.`,
    link: '/pricing',
    linkText: 'See Plan Limits',
  },
];

export function FeaturesPage() {
  return (
    <>
      <PageMeta
        title="Features — Boardly Practice & Learning Engine"
        description="Explore the authentic capabilities built into Boardly: timed practice sprints, negative marking simulations, KaTeX derivations, in-app notifications, and Study Crews."
      />

      <div className="pt-4 sm:pt-6 pb-20 boardly-container page-enter space-y-16 sm:space-y-24">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="flex justify-center">
            <span className="section-chip-red">
              Platform Capabilities
            </span>
          </div>
          <h1
            className="section-heading text-3xl sm:text-5xl font-extrabold text-[var(--text)] tracking-tight leading-tight"
            style={{ fontFamily: 'var(--font-dot)', fontSize: 'clamp(28px, 4.2vw, 48px)' }}
          >
            Engineered for Entrance Excellence
          </h1>
          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed max-w-2xl mx-auto">
            Every feature in Boardly is built around real Pakistani entry test dynamics — negative marking, tight time budgets, and dense mathematical derivations.
          </p>
        </div>

        {/* Features List (8 Equal-Height Glass Cards in 2-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {REAL_FEATURES.map((f) => (
            <div
              key={f.title}
              className={`glass-card glass-card-interactive rounded-[28px] p-6 sm:p-8 h-full flex flex-col justify-between ${
                f.highlight
                  ? 'glass-card-highlight'
                  : ''
              }`}
            >
              {/* Card Top & Body */}
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Number & Badge Row */}
                <div className="flex items-center justify-between">
                  <span
                    className="font-dot text-base font-bold text-[#D71921]"
                    style={{ fontFamily: 'var(--font-dot)' }}
                  >
                    {f.num}
                  </span>
                  {f.highlight ? (
                    <span className="section-chip-red text-xs py-1 px-3">
                      {f.badge}
                    </span>
                  ) : (
                    <span className="section-chip text-xs py-1 px-3">
                      {f.badge}
                    </span>
                  )}
                </div>

                {/* Icon Tile */}
                <div className="w-12 h-12 rounded-2xl icon-tile text-white flex items-center justify-center shrink-0">
                  {f.icon}
                </div>

                {/* Title & Description */}
                <div>
                  <h2
                    className="text-xl font-bold text-[var(--text)] mb-2"
                    style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                  >
                    {f.title}
                  </h2>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{f.desc}</p>
                </div>

                {/* Inner Content (Sample LaTeX Derivation box in card 03) */}
                {f.demoMath && (
                  <div className="glass-row rounded-[20px] p-4 text-sm space-y-1 mt-2 overflow-x-auto">
                    <div className="text-xs text-[var(--muted)] font-mono">Sample LaTeX derivation:</div>
                    <div className="text-[var(--text)] text-center py-1">
                      <MathText block>{f.demoMath}</MathText>
                    </div>
                  </div>
                )}
              </div>

              {/* Pinned Bottom Area with Baseline-Aligned Link */}
              <div className="mt-auto pt-6 flex flex-col justify-end">
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/12 to-transparent mb-4" />
                {f.link ? (
                  <Link
                    to={f.link}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text)] hover:text-[#D71921] transition-colors group"
                  >
                    <span>{f.linkText}</span>
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1.5" />
                  </Link>
                ) : (
                  <div className="min-h-[20px] select-none opacity-0" aria-hidden="true">
                    &nbsp;
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Card (Matching Unified Floating Glass Panel A) */}
        <div className="relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] pointer-events-none -z-10 blur-3xl opacity-75">
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(215,25,33,0.18)_0%,rgba(215,25,33,0.04)_50%,transparent_75%)]" />
          </div>

          <div className="glass-panel p-8 sm:p-12 lg:p-14 text-center space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-center">
              <span className="section-chip">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.85)] shrink-0" aria-hidden="true" />
                Test Cockpit
              </span>
            </div>

            <h2
              className="section-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--text)]"
              style={{ fontFamily: 'var(--font-dot)', fontSize: 'clamp(24px, 3.2vw, 36px)' }}
            >
              Ready to test with authentic university patterns?
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted)] max-w-xl mx-auto">
              Experience the distraction-free exam runner with live countdowns, question palette navigation, and instant mathematical feedback.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3.5">
              <Link to="/signup" className="btn-primary">
                Start Practicing Free
              </Link>
              <Link to="/crew" className="btn-secondary">
                Explore Study Crew
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FeaturesPage;
