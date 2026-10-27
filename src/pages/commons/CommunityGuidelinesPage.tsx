import { Shield, CheckCircle2, AlertTriangle, ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CommunityGuidelinesPage() {
  const sansStyle = { fontFamily: "var(--font-body, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)" };

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased p-4 sm:p-6 md:p-8 flex justify-center selection:bg-[#D71921] selection:text-white"
    >
      <div className="w-full max-w-3xl space-y-8 py-4 sm:py-6">
        {/* Header Back Link */}
        <div>
          <Link
            to="/dashboard/commons"
            className="glass-pill inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] hover:text-white px-3.5 py-2 transition-all active:scale-[0.98] cursor-pointer"
            title="Back to Commons"
          >
            <ArrowLeft size={14} className="text-current shrink-0" />
            <span>Back to Commons</span>
          </Link>
        </div>

        {/* Title Section */}
        <div className="space-y-4 border-b border-white/[0.08] pb-6">
          <div>
            <span className="section-chip-red">
              <Shield size={14} className="text-[#D71921] shrink-0" />
              <span>Academic Standards &amp; Safety</span>
            </span>
          </div>

          <h1
            className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--text)] leading-tight font-dot"
            style={{ fontFamily: 'var(--font-dot)' }}
          >
            Boardly Commons Guidelines
          </h1>

          <p
            className="text-sm sm:text-base text-[var(--muted)] leading-relaxed"
          >
            Boardly Commons is a place for students to share notes, formulas, solved problems and doubts, and to learn from each other. Please read these guidelines before you post.
          </p>
        </div>

        {/* Section 1: What We Encourage */}
        <div className="space-y-4">
          <h2
            className="text-lg sm:text-xl font-black text-[var(--text)] flex items-center gap-2.5 tracking-tight font-dot"
            style={{ fontFamily: 'var(--font-dot)' }}
          >
            <CheckCircle2 size={18} className="text-[#D71921] shrink-0" />
            <span>1. What We Encourage</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-5 sm:p-6 rounded-[22px]  space-y-2">
              <span
                className="text-[15px] sm:text-base font-bold text-[var(--text)] block"
              >
                Personal Handwritten Notes
              </span>
              <p
                className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed"
              >
                Summary cheat sheets, mnemonics, quick derivations, and organic chemistry reaction roadmaps.
              </p>
            </div>

            <div className="glass-card p-5 sm:p-6 rounded-[22px]  space-y-2">
              <span
                className="text-[15px] sm:text-base font-bold text-[var(--text)] block"
              >
                Worked Solutions &amp; Explanations
              </span>
              <p
                className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed"
              >
                Step-by-step calculus workings, tricky physics numerical solutions, and past paper dissections.
              </p>
            </div>

            <div className="glass-card p-5 sm:p-6 rounded-[22px]  space-y-2">
              <span
                className="text-[15px] sm:text-base font-bold text-[var(--text)] block"
              >
                Concept Doubts &amp; Clarifications
              </span>
              <p
                className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed"
              >
                Asking for alternative intuition on difficult problems without hesitation or fear of judgment.
              </p>
            </div>

            <div className="glass-card p-5 sm:p-6 rounded-[22px]  space-y-2">
              <span
                className="text-[15px] sm:text-base font-bold text-[var(--text)] block"
              >
                Preparation Roadmaps
              </span>
              <p
                className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed"
              >
                Sharing book recommendations, study plans, syllabus timelines and revision tips.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Strictly Prohibited */}
        <div className="space-y-4">
          <h2
            className="text-lg sm:text-xl font-black text-[var(--text)] flex items-center gap-2.5 tracking-tight font-dot"
            style={{ fontFamily: 'var(--font-dot)' }}
          >
            <AlertTriangle size={18} className="text-[#D71921] shrink-0" />
            <span>2. Strictly Prohibited</span>
          </h2>

          <div
            className="glass-card-highlight p-5 sm:p-6 rounded-[24px]  space-y-3.5 text-xs sm:text-sm text-[var(--muted)] leading-relaxed"
          >
            <p>
              • <strong className="text-[var(--text)] font-semibold">Malicious Files &amp; Scripts:</strong> Executable files (.exe, .bat, .sh, .apk, .js, .msi) are strictly blocked. Uploading malware or deceptive downloads results in an immediate permanent ban.
            </p>
            <p>
              • <strong className="text-[var(--text)] font-semibold">Live Exam Leaks &amp; Impersonation:</strong> Sharing questions from an exam that is currently in progress, or offering to take an exam for someone else, is not allowed. Such posts are removed and the account may be banned.
            </p>
            <p>
              • <strong className="text-[var(--text)] font-semibold">Abuse &amp; Harassment:</strong> Any derogatory remarks regarding background, origin, religion, gender or academic results will lead to posting revocation. Bullying is not allowed anywhere, including in anonymous posts and direct messages.
            </p>
            <p>
              • <strong className="text-[var(--text)] font-semibold">Personal Privacy:</strong> Sharing personal details such as phone numbers, addresses or private photos of yourself or others.
            </p>
            <p>
              • <strong className="text-[var(--text)] font-semibold">Copyrighted Content:</strong> Only share material you have the right to share. Don't upload copyrighted books or paid course material that you don't own.
            </p>
            <p>
              • <strong className="text-[var(--text)] font-semibold">Spam &amp; Self-Promotion:</strong> Repeated promotional links to third-party paid academies or WhatsApp marketing groups without authentic educational content are removed.
            </p>
          </div>
        </div>

        {/* Section 3: Anonymous Posting Standards */}
        <div className="space-y-4">
          <h2
            className="text-lg sm:text-xl font-black text-[var(--text)] flex items-center gap-2.5 tracking-tight font-dot"
            style={{ fontFamily: 'var(--font-dot)' }}
          >
            <Lock size={18} className="text-[#D71921] shrink-0" />
            <span>3. Anonymous Posting Standards</span>
          </h2>

          <div
            className="glass-card p-5 sm:p-6 rounded-[24px]  space-y-3 text-xs sm:text-sm text-[var(--muted)] leading-relaxed"
          >
            <p>
              Anonymous posting lets you ask questions and share doubts without worry. Your name is hidden from other students, but anonymous posts must follow the same rules. Boardly keeps a private record of the author that only the superadmin can see, and it is used only for moderation. If a post gets 3 or more community flags, it is hidden automatically until a moderator reviews it.
            </p>
          </div>
        </div>

        {/* Section 4: Daily Posting Limit */}
        <div
          className="glass-card-highlight p-5 rounded-2xl  space-y-1.5 "
        >
          <span
            className="text-sm sm:text-base font-bold block text-red-200 font-dot"
            style={{ fontFamily: 'var(--font-dot)' }}
          >
            Daily limit: 10 posts per day.
          </span>
          <p
            className="text-xs sm:text-sm leading-relaxed text-red-300/80"
          >
            To prevent spam, each student can publish up to 10 posts per calendar day (Pakistan Standard Time).
          </p>
        </div>

        {/* Footer Contact note */}
        <div
          className="pt-2 text-center text-xs sm:text-sm text-[var(--muted)] leading-relaxed"
        >
          <p>
            Boardly Commons is run by SHS Virtual Academy. Questions or reports: use the Report option on any post or contact us through the{' '}
            <Link
              to="/contact"
              className="text-[#D71921] hover:underline font-semibold"
            >
              Contact page
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default CommunityGuidelinesPage;
