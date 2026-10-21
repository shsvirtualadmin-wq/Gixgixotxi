import { Shield, CheckCircle2, AlertTriangle, ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CommunityGuidelinesPage() {
  const sansStyle = { fontFamily: "var(--font-body, 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)" };

  return (
    <div
      style={sansStyle}
      className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-sans antialiased p-4 sm:p-6 md:p-8 flex justify-center selection:bg-[var(--accent)] selection:text-white"
    >
      <div className="w-full max-w-3xl space-y-8 py-4 sm:py-6">
        {/* Header Back Link */}
        <div>
          <Link
            to="/dashboard/commons"
            style={sansStyle}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-1.5 px-2.5 -ml-2.5 rounded-lg hover:bg-[var(--surface-muted)] cursor-pointer"
            title="Back to Commons"
          >
            <ArrowLeft size={16} className="text-current shrink-0" />
            <span>Back to Commons</span>
          </Link>
        </div>

        {/* Title Section */}
        <div className="space-y-3 border-b border-[var(--border)] pb-6">
          <div
            style={sansStyle}
            className="flex items-center gap-2 text-[12px] font-semibold text-[var(--accent)] uppercase tracking-wider"
          >
            <Shield size={16} className="text-[var(--accent)] shrink-0" />
            <span>Academic Standards & Safety</span>
          </div>

          <h1
            style={sansStyle}
            className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] leading-tight"
          >
            Boardly Commons Guidelines
          </h1>

          <p
            style={sansStyle}
            className="text-[15px] text-[var(--text-secondary)] leading-relaxed"
          >
            Boardly Commons is a place for students to share notes, formulas, solved problems and doubts, and to learn from each other. Please read these guidelines before you post.
          </p>
        </div>

        {/* Section 1: What We Encourage */}
        <div className="space-y-4">
          <h2
            style={sansStyle}
            className="text-[20px] font-semibold text-[var(--text-primary)] flex items-center gap-2.5 tracking-normal"
          >
            <CheckCircle2 size={20} className="text-[var(--accent)] shrink-0" />
            <span>1. What We Encourage</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-2 shadow-xs transition-colors">
              <span
                style={sansStyle}
                className="text-[16px] font-semibold text-[var(--text-primary)] block"
              >
                Personal Handwritten Notes
              </span>
              <p
                style={sansStyle}
                className="text-[15px] text-[var(--text-secondary)] leading-relaxed"
              >
                Summary cheat sheets, mnemonics, quick derivations, and organic chemistry reaction roadmaps.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-2 shadow-xs transition-colors">
              <span
                style={sansStyle}
                className="text-[16px] font-semibold text-[var(--text-primary)] block"
              >
                Worked Solutions & Explanations
              </span>
              <p
                style={sansStyle}
                className="text-[15px] text-[var(--text-secondary)] leading-relaxed"
              >
                Step-by-step calculus workings, tricky physics numerical solutions, and past paper dissections.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-2 shadow-xs transition-colors">
              <span
                style={sansStyle}
                className="text-[16px] font-semibold text-[var(--text-primary)] block"
              >
                Concept Doubts & Clarifications
              </span>
              <p
                style={sansStyle}
                className="text-[15px] text-[var(--text-secondary)] leading-relaxed"
              >
                Asking for alternative intuition on difficult problems without hesitation or fear of judgment.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-2 shadow-xs transition-colors">
              <span
                style={sansStyle}
                className="text-[16px] font-semibold text-[var(--text-primary)] block"
              >
                Preparation Roadmaps
              </span>
              <p
                style={sansStyle}
                className="text-[15px] text-[var(--text-secondary)] leading-relaxed"
              >
                Sharing book recommendations, study plans, syllabus timelines and revision tips.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Strictly Prohibited */}
        <div className="space-y-4">
          <h2
            style={sansStyle}
            className="text-[20px] font-semibold text-[var(--text-primary)] flex items-center gap-2.5 tracking-normal"
          >
            <AlertTriangle size={20} className="text-[var(--accent)] shrink-0" />
            <span>2. Strictly Prohibited</span>
          </h2>

          <div
            style={sansStyle}
            className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3.5 text-[15px] text-[var(--text-secondary)] leading-relaxed shadow-xs"
          >
            <p>
              • <strong className="text-[var(--text-primary)] font-semibold">Malicious Files & Scripts:</strong> Executable files (.exe, .bat, .sh, .apk, .js, .msi) are strictly blocked. Uploading malware or deceptive downloads results in an immediate permanent ban.
            </p>
            <p>
              • <strong className="text-[var(--text-primary)] font-semibold">Live Exam Leaks & Impersonation:</strong> Sharing questions from an exam that is currently in progress, or offering to take an exam for someone else, is not allowed. Such posts are removed and the account may be banned.
            </p>
            <p>
              • <strong className="text-[var(--text-primary)] font-semibold">Abuse & Harassment:</strong> Any derogatory remarks regarding background, origin, religion, gender or academic results will lead to posting revocation. Bullying is not allowed anywhere, including in anonymous posts and direct messages.
            </p>
            <p>
              • <strong className="text-[var(--text-primary)] font-semibold">Personal Privacy:</strong> Sharing personal details such as phone numbers, addresses or private photos of yourself or others.
            </p>
            <p>
              • <strong className="text-[var(--text-primary)] font-semibold">Copyrighted Content:</strong> Only share material you have the right to share. Don't upload copyrighted books or paid course material that you don't own.
            </p>
            <p>
              • <strong className="text-[var(--text-primary)] font-semibold">Spam & Self-Promotion:</strong> Repeated promotional links to third-party paid academies or WhatsApp marketing groups without authentic educational content are removed.
            </p>
          </div>
        </div>

        {/* Section 3: Anonymous Posting Standards */}
        <div className="space-y-4">
          <h2
            style={sansStyle}
            className="text-[20px] font-semibold text-[var(--text-primary)] flex items-center gap-2.5 tracking-normal"
          >
            <Lock size={20} className="text-[var(--accent)] shrink-0" />
            <span>3. Anonymous Posting Standards</span>
          </h2>

          <div
            style={sansStyle}
            className="p-5 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3 text-[15px] text-[var(--text-secondary)] leading-relaxed shadow-xs"
          >
            <p>
              Anonymous posting lets you ask questions and share doubts without worry. Your name is hidden from other students, but anonymous posts must follow the same rules. Boardly keeps a private record of the author that only the superadmin can see, and it is used only for moderation. If a post gets 3 or more community flags, it is hidden automatically until a moderator reviews it.
            </p>
          </div>
        </div>

        {/* Section 4: Daily Posting Limit */}
        <div
          style={sansStyle}
          className="p-5 rounded-2xl border border-[var(--accent)]/20 dark:border-[var(--accent)]/30 bg-[var(--tag-danger-bg)] text-[var(--tag-danger-text)] space-y-1.5 shadow-xs"
        >
          <span
            style={sansStyle}
            className="text-[16px] font-semibold block text-[var(--tag-danger-text)]"
          >
            Daily limit: 10 posts per day.
          </span>
          <p
            style={sansStyle}
            className="text-[15px] leading-relaxed text-[var(--tag-danger-text)]"
          >
            To prevent spam, each student can publish up to 10 posts per calendar day (Pakistan Standard Time).
          </p>
        </div>

        {/* Footer Contact note */}
        <div
          style={sansStyle}
          className="pt-2 text-center text-[14px] text-[var(--text-muted)] leading-relaxed"
        >
          <p>
            Boardly Commons is run by SHS Virtual Academy. Questions or reports: use the Report option on any post or contact us through the{' '}
            <Link
              to="/contact"
              style={sansStyle}
              className="text-[var(--accent)] hover:underline font-semibold"
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
