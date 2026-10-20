import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
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
    title: 'Weak Chapter Diagnostics & Streaks',
    badge: 'Analytics',
    desc: 'Detailed chapter accuracy metrics tracking weak topics (such as Integration by Parts or Aldehydes & Ketones). Daily study streak counters reset precisely at 12:00 AM PKT (Asia/Karachi).',
    link: '/dashboard/weak-chapters',
    linkText: 'Track Weak Chapters',
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
        title="Features — Boardly Entrance Test Engine"
        description="Explore the authentic capabilities built into Boardly: timed entrance sprints, negative marking simulations, KaTeX derivations, weak chapter diagnostics, and Study Crews."
      />

      <div className="pt-6 sm:pt-10 pb-20 boardly-container page-enter space-y-12 sm:space-y-16">
        {/* Header */}
        <div className="section-header max-w-3xl mx-auto text-center space-y-4">
          <Badge color="red">Platform Capabilities</Badge>
          <h1
            className="text-3xl sm:text-5xl font-extrabold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Engineered for Entrance Excellence
          </h1>
          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
            Every feature in Boardly is built around real Pakistani entry test dynamics — negative marking, tight time budgets, and dense mathematical derivations.
          </p>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {REAL_FEATURES.map((f) => (
            <Card
              key={f.title}
              variant={f.highlight ? 'red' : 'default'}
              className="p-6 sm:p-7 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className="font-dot text-sm font-bold text-[var(--red)]"
                    style={{ fontFamily: 'var(--font-dot)' }}
                  >
                    {f.num}
                  </span>
                  <Badge color={f.highlight ? 'red' : 'muted'}>{f.badge}</Badge>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center shrink-0">
                  {f.icon}
                </div>

                <div>
                  <h2
                    className="text-xl font-bold text-[var(--text)] mb-2"
                    style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                  >
                    {f.title}
                  </h2>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{f.desc}</p>
                </div>

                {f.demoMath && (
                  <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm space-y-1">
                    <div className="text-xs text-[var(--muted)] font-mono">Sample LaTeX derivation:</div>
                    <div className="text-[var(--text)]">
                      <MathText block>{f.demoMath}</MathText>
                    </div>
                  </div>
                )}
              </div>

              {f.link && (
                <div className="pt-6 border-t border-[var(--border)] mt-4">
                  <Link
                    to={f.link}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--text)] hover:text-[var(--red)] transition-colors"
                  >
                    <span>{f.linkText}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* CTA Card */}
        <div className="p-8 sm:p-12 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center space-y-6 max-w-3xl mx-auto">
          <Badge color="muted">Test Cockpit</Badge>
          <h2
            className="text-2xl sm:text-3xl font-bold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Ready to test with authentic university patterns?
          </h2>
          <p className="text-sm text-[var(--muted)] max-w-xl mx-auto">
            Experience the distraction-free exam runner with live countdowns, question palette navigation, and instant mathematical feedback.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/signup" className="btn-red" style={{ height: '52px' }}>
              Start Practicing Free
            </Link>
            <Link to="/crew" className="btn-outline" style={{ height: '52px' }}>
              Explore Study Crew
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default FeaturesPage;
