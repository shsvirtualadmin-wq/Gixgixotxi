import { Shield, CheckCircle2, AlertTriangle, ArrowLeft, BookOpen, Lock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CommunityGuidelinesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-neutral-100 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-3xl space-y-8 py-6">
        {/* Header Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>BACK TO COMMONS</span>
        </button>

        {/* Title */}
        <div className="space-y-2 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-2 text-red-500 font-mono text-xs uppercase tracking-wider">
            <Shield size={16} />
            <span>Academic Standards & Safety</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-50 font-mono">
            BOARDLY COMMONS GUIDELINES
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Boardly Commons is built for Pakistani students preparing for FAST, NUST, GIKI, MDCAT, ECAT, and FBISE exams to exchange high-yield notes, formula sheets, solved problems, and study strategies.
          </p>
        </div>

        {/* Section 1: Core Values */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-red-500" />
            <span>1. What We Encourage</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed text-neutral-300">
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-1.5">
              <span className="font-bold text-neutral-100 block">Personal Handwritten Notes</span>
              <p className="text-neutral-400">
                Summary cheat sheets, mnemonics, quick derivations, and organic chemistry reaction roadmaps.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-1.5">
              <span className="font-bold text-neutral-100 block">Worked Solutions & Explanations</span>
              <p className="text-neutral-400">
                Step-by-step calculus workings, tricky physics physics numerical solutions, and past paper dissections.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-1.5">
              <span className="font-bold text-neutral-100 block">Concept Doubts & Clarifications</span>
              <p className="text-neutral-400">
                Asking for alternative intuition on difficult problems without hesitation or fear of judgment.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-1.5">
              <span className="font-bold text-neutral-100 block">Preparation Roadmaps</span>
              <p className="text-neutral-400">
                Sharing book recommendations, syllabus completion timelines, and mock exam pacing advice.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Prohibited Conduct */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <span>2. Strictly Prohibited</span>
          </h2>
          <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-3 text-xs text-neutral-300 leading-relaxed">
            <p>
              • <strong>Malicious Files & Scripts:</strong> Executable files (.exe, .bat, .sh, .apk, .js, .msi) are strictly blocked. Uploading malware or deceptive downloads results in an immediate permanent ban.
            </p>
            <p>
              • <strong>Live Exam Leaks & Impersonation:</strong> Sharing live test questions during active examination windows or soliciting exam substitution is prohibited and reported to university authorities.
            </p>
            <p>
              • <strong>Abuse & Harassment:</strong> Any derogatory remarks regarding school board, provincial origin, religion, gender, or academic rank will lead to posting revocation.
            </p>
            <p>
              • <strong>Spam & Self-Promotion:</strong> Repeated promotional links to third-party paid academies or whatsapp marketing groups without authentic educational content are removed.
            </p>
          </div>
        </div>

        {/* Section 3: Anonymous Posting Rules */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <Lock size={18} className="text-red-400" />
            <span>3. Anonymous Posting Standards</span>
          </h2>
          <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-2 text-xs text-neutral-400 leading-relaxed">
            <p>
              Anonymity gives every student the psychological safety to ask basic questions, share doubts, or post preliminary notes without social anxiety.
            </p>
            <p>
              However, anonymity does not shield policy violations. A secure, immutable author record is stored in private superadmin moderation logs (<code className="text-neutral-300 font-mono">postPrivate</code>). If a post receives 3+ community flags, it is automatically hidden pending human review.
            </p>
          </div>
        </div>

        {/* Section 4: Daily Posting Limit */}
        <div className="p-4 rounded-xl border border-neutral-800 bg-red-950/20 text-xs text-neutral-300 space-y-1">
          <span className="font-bold text-red-400 font-mono">DAILY RATE LIMIT: 10 POSTS / DAY</span>
          <p className="text-neutral-400">
            To prevent spam and automated scrapers, each student is allowed up to 10 published posts per Pakistan Standard Time (PKT) calendar day.
          </p>
        </div>
      </div>
    </div>
  );
}
