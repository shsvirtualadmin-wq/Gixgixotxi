import { useState } from 'react';
import { Shield, CheckCircle2, AlertTriangle, ArrowLeft, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useHomeUrl } from '@/utils/homeUrl';
import { DashboardBottomNav } from '@/components/dashboard/DashboardBottomNav';
import { POST_LIMITS, POST_LIMIT_RESET_TIME_LABEL } from '@/config/postLimits';

export function CommunityGuidelinesPage() {
  const homeUrl = useHomeUrl();
  const navigate = useNavigate();
  const commonsUrl = homeUrl === '/dashboard/commons' ? '/dashboard/commons' : '/commons';
  const [backPulsing, setBackPulsing] = useState(false);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setBackPulsing(true);
    window.setTimeout(() => {
      navigate(commonsUrl);
    }, 140);
  };

  return (
    <div className="min-h-full bg-[var(--bg)] text-[var(--text)] antialiased px-4 sm:px-6 md:px-8 pt-3 pb-[var(--sdn-page-pb)] flex justify-center selection:bg-[#D71921] selection:text-white page-slide-right">
      <div className="w-full max-w-3xl space-y-6">
        {/* Floating Glass Top Bar (radius 30px) with Circular Glass Back Button & Red Badge */}
        <header className="sticky top-2 z-30 glass glass-panel rounded-[30px] px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={commonsUrl}
              onClick={handleBack}
              className={`ios-circle-btn text-[var(--text)] shrink-0 cursor-pointer ${
                backPulsing ? 'nav-back-pulse' : ''
              }`}
              title="Back to Commons"
              aria-label="Back to Commons"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <span
                className="text-sm sm:text-base text-[var(--text)] truncate block"
                style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
              >
                Guidelines
              </span>
              <span className="text-[11px] text-[var(--muted)] truncate block">
                Boardly Commons
              </span>
            </div>
          </div>

          {/* Red Badge */}
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D71921]/20 border border-[#D71921]/45 text-[#FF5A65] text-[10px] sm:text-[11px] uppercase tracking-[0.12em] shrink-0"
            style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
          >
            <Shield size={13} className="text-[#D71921] shrink-0" />
            <span>OFFICIAL RULES</span>
          </span>
        </header>

        {/* Hero Title Card */}
        <div className="glass glass-panel rounded-[32px] p-6 sm:p-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D71921]/15 border border-[#D71921]/40 text-[#FF5A65] text-[11px] uppercase tracking-[0.14em]">
            <span className="w-2 h-2 rounded-full bg-[#D71921] shadow-[0_0_10px_#D71921]" />
            <span style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}>
              ACADEMIC STANDARDS &amp; SAFETY
            </span>
          </div>

          <h1
            className="text-2xl sm:text-4xl tracking-tight text-[var(--text)] leading-tight"
            style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
          >
            Boardly Commons Guidelines
          </h1>

          <div className="dotted-divider" aria-hidden="true" />

          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
            Boardly Commons is a place for students to share notes, formulas, solved problems and doubts, and to learn from each other. Please read these guidelines before you post.
          </p>
        </div>

        {/* Section 01: What We Encourage (Grouped List Card with Hairline Separators) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <span
              className="inline-flex items-center justify-center min-w-[34px] h-7 px-2 rounded-full bg-[#D71921]/20 border border-[#D71921]/45 text-[#FF5A65] text-xs"
              style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
            >
              01
            </span>
            <h2
              className="text-lg sm:text-xl text-[var(--text)] flex items-center gap-2 tracking-tight"
              style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
            >
              <CheckCircle2 size={18} className="text-[#D71921] shrink-0" />
              <span>What We Encourage</span>
            </h2>
          </div>

          <div className="glass glass-panel rounded-[28px] overflow-hidden divide-y divide-white/[0.10] stagger-list">
            <div className="p-5 sm:p-6 space-y-1.5">
              <span className="text-sm sm:text-base font-bold text-[var(--text)] block">
                Personal Handwritten Notes
              </span>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                Summary cheat sheets, mnemonics, quick derivations, and organic chemistry reaction roadmaps.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-1.5">
              <span className="text-sm sm:text-base font-bold text-[var(--text)] block">
                Worked Solutions &amp; Explanations
              </span>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                Step-by-step calculus workings, tricky physics numerical solutions, and past paper dissections.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-1.5">
              <span className="text-sm sm:text-base font-bold text-[var(--text)] block">
                Concept Doubts &amp; Clarifications
              </span>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                Asking for alternative intuition on difficult problems without hesitation or fear of judgment.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-1.5">
              <span className="text-sm sm:text-base font-bold text-[var(--text)] block">
                Preparation Roadmaps
              </span>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                Sharing book recommendations, study plans, syllabus timelines and revision tips.
              </p>
            </div>
          </div>
        </section>

        {/* Section 02: Strictly Prohibited (Grouped List Card with Hairline Separators) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <span
              className="inline-flex items-center justify-center min-w-[34px] h-7 px-2 rounded-full bg-[#D71921]/20 border border-[#D71921]/45 text-[#FF5A65] text-xs"
              style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
            >
              02
            </span>
            <h2
              className="text-lg sm:text-xl text-[var(--text)] flex items-center gap-2 tracking-tight"
              style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
            >
              <AlertTriangle size={18} className="text-[#D71921] shrink-0" />
              <span>Strictly Prohibited</span>
            </h2>
          </div>

          <div className="glass glass-panel rounded-[28px] overflow-hidden divide-y divide-white/[0.10] text-xs sm:text-sm text-[var(--muted)] leading-relaxed stagger-list">
            <div className="p-4 sm:p-5">
              <strong className="text-[var(--text)] font-semibold block mb-0.5">
                Malicious Files &amp; Scripts
              </strong>
              Executable files (.exe, .bat, .sh, .apk, .js, .msi) are strictly blocked. Uploading malware or deceptive downloads results in an immediate permanent ban.
            </div>
            <div className="p-4 sm:p-5">
              <strong className="text-[var(--text)] font-semibold block mb-0.5">
                Live Exam Leaks &amp; Impersonation
              </strong>
              Sharing questions from an exam that is currently in progress, or offering to take an exam for someone else, is not allowed. Such posts are removed and the account may be banned.
            </div>
            <div className="p-4 sm:p-5">
              <strong className="text-[var(--text)] font-semibold block mb-0.5">
                Abuse &amp; Harassment
              </strong>
              Any derogatory remarks regarding background, origin, religion, gender or academic results will lead to posting revocation. Bullying is not allowed anywhere, including in anonymous posts and direct messages.
            </div>
            <div className="p-4 sm:p-5">
              <strong className="text-[var(--text)] font-semibold block mb-0.5">
                Personal Privacy
              </strong>
              Sharing personal details such as phone numbers, addresses or private photos of yourself or others.
            </div>
            <div className="p-4 sm:p-5">
              <strong className="text-[var(--text)] font-semibold block mb-0.5">
                Copyrighted Content
              </strong>
              Only share material you have the right to share. Don&apos;t upload copyrighted books or paid course material that you don&apos;t own.
            </div>
            <div className="p-4 sm:p-5">
              <strong className="text-[var(--text)] font-semibold block mb-0.5">
                Spam &amp; Self-Promotion
              </strong>
              Repeated promotional links to third-party paid academies or WhatsApp marketing groups without authentic educational content are removed.
            </div>
          </div>
        </section>

        {/* Section 03: Anonymous Posting Standards */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <span
              className="inline-flex items-center justify-center min-w-[34px] h-7 px-2 rounded-full bg-[#D71921]/20 border border-[#D71921]/45 text-[#FF5A65] text-xs"
              style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
            >
              03
            </span>
            <h2
              className="text-lg sm:text-xl text-[var(--text)] flex items-center gap-2 tracking-tight"
              style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
            >
              <Lock size={18} className="text-[#D71921] shrink-0" />
              <span>Anonymous Posting Standards</span>
            </h2>
          </div>

          <div className="glass glass-panel p-5 sm:p-6 rounded-[28px] space-y-3 text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
            <p>
              Anonymous posting lets you ask questions and share doubts without worry. Your name is hidden from other students, but anonymous posts must follow the same rules. Boardly keeps a private record of the author that only the superadmin can see, and it is used only for moderation. If a post gets 3 or more community flags, it is hidden automatically until a moderator reviews it.
            </p>
          </div>
        </section>

        {/* Section 04: Daily Posting Limit */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <span
              className="inline-flex items-center justify-center min-w-[34px] h-7 px-2 rounded-full bg-[#D71921]/20 border border-[#D71921]/45 text-[#FF5A65] text-xs"
              style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
            >
              04
            </span>
            <h2
              className="text-lg sm:text-xl text-[var(--text)] tracking-tight"
              style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
            >
              Daily Posting Limit
            </h2>
          </div>

          <div className="glass glass-panel p-5 sm:p-6 rounded-[28px] border border-[#D71921]/35 space-y-1.5">
            <span
              className="text-sm sm:text-base block text-[#FF5A65]"
              style={{ fontFamily: "'Doto', var(--font-dot), monospace", fontWeight: 800 }}
            >
              Free: {POST_LIMITS.free} posts/day · Pro: {POST_LIMITS.pro} posts/day · Plus: Unlimited
            </span>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--muted)]">
              To keep Commons spam-free, daily post quotas depend on your plan and reset every night at midnight ({POST_LIMIT_RESET_TIME_LABEL}, Pakistan Standard Time).
            </p>
          </div>
        </section>

        {/* Footer Contact note */}
        <div className="pt-2 text-center text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
          <p>
            Boardly Commons is run by SHS Virtual Academy. Questions or reports: use the Report option on any post or contact us through the{' '}
            <Link to="/contact" className="text-[#D71921] hover:underline font-semibold">
              Contact page
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Floating Glass Tab Bar */}
      <DashboardBottomNav />
    </div>
  );
}

export default CommunityGuidelinesPage;
