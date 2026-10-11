import React from 'react';
import { Sparkles, Users, Award, ArrowRight, ShieldCheck, BookOpen } from 'lucide-react';
import { SeoHead } from '../common/SeoHead';

interface ProgramPageProps {
  type: 'crew' | 'captains';
  onNavigateHome?: () => void;
  onApplyOrStart?: () => void;
}

export const PublicProgramPage: React.FC<ProgramPageProps> = ({
  type,
  onNavigateHome,
  onApplyOrStart,
}) => {
  const isCrew = type === 'crew';
  const pathname = isCrew ? '/programs/crew' : '/programs/captains';
  const title = isCrew ? 'Boardly Crew' : 'Campus Captains Program';
  const subtitle = isCrew
    ? 'Collaborative Peer Study Circles & Distributed Learning Squads'
    : 'Student Leadership, Campus Ambassadorship & Educational Outreach';

  return (
    <div className="min-h-[100dvh] pt-28 pb-20 px-4 sm:px-6 max-w-4xl mx-auto">
      <SeoHead pathname={pathname} />

      {/* Header Container */}
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Coming Soon</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0d1b3e] tracking-tight">
          {title}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          {subtitle}
        </p>
      </div>

      {/* Main Content Card (150+ words of real informative content) */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-white shadow-xl shadow-indigo-950/5 space-y-6 text-slate-700 leading-relaxed text-sm sm:text-base">
        {isCrew ? (
          <>
            <p>
              The Boardly Crew initiative empowers students to break out of isolated exam preparation and form high-performance peer study circles across Pakistan. Preparing for board exams like FBISE, BISE Lahore, and competitive entrance tests like MDCAT and ECAT requires consistent pacing and deep conceptual debate. With Boardly Crew, candidates can form small teams of 3 to 6 learners to share curated question sets, compare test completion times, and resolve tricky derivations collectively.
            </p>
            <p>
              Squad members unlock synchronized group mock exams, where everyone takes the same diagnostic paper simultaneously and compares error patterns on an internal squad leaderboard. Crew leaders can schedule weekly chapter challenges, track member consistency streaks, and share AI-generated solution notes directly within their private circle.
            </p>
            <p>
              We are finalizing squad invitation link management and private group derivation boards. In the meantime, you can explore hundreds of chapter-wise practice sets and build your baseline subject percentiles in the Boardly diagnostic portal.
            </p>
          </>
        ) : (
          <>
            <p>
              The Boardly Campus Captains program is a nationwide student leadership community designed for proactive secondary and higher secondary learners. As an official Campus Captain representing Boardly at your high school, cadet college, or pre-university academy, you will serve as the academic beacon for peer test preparation. Captains organize localized quiz bouts, introduce students to diagnostic MCQ revision, and collect authentic syllabus feedback from fellow exam candidates.
            </p>
            <p>
              Selected captains receive verified leadership certificates, exclusive early access to upcoming features like Boardly Arena, official Boardly merchandise, and direct mentorship from our academic content team. You will build invaluable organizational, public speaking, and community-building skills that significantly bolster your university admission applications and future scholarship portfolios.
            </p>
            <p>
              Our formal captain application cohort for the 2026 academic term will open shortly. Ambitious students are encouraged to begin building their test mastery records on the platform to demonstrate active engagement during application review.
            </p>
          </>
        )}

        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Applications &amp; Squad Access Opening Soon</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateHome) onNavigateHome();
                else window.location.href = '/';
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Back to Home
            </a>
            <a
              href="/app"
              onClick={(e) => {
                e.preventDefault();
                if (onApplyOrStart) onApplyOrStart();
                else window.location.href = '/app';
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <span>Explore Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
