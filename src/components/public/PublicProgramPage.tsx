import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users,
  Award,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  DollarSign,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Gift,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { SeoHead } from '../common/SeoHead';
import { useAuth } from '../../context/AuthContext';
import { CrewApplicationModal } from '../crew/CrewApplicationModal';
import { fetchUserCrewApplication } from '../../lib/firebase';
import { ErrorBoundary } from '../ErrorBoundary';

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
  const { user, profile, isAdmin } = useAuth();
  const isCrew = type === 'crew';
  const pathname = isCrew ? '/programs/crew' : '/programs/captains';
  const title = isCrew
    ? 'Boardly Crew: Student Ambassador Program'
    : 'Campus Captains Program';
  const subtitle = isCrew
    ? 'Represent Boardly and SHS Virtual Academy at your institution. Top performers unlock paid internships.'
    : 'Student Leadership, Campus Ambassadorship & Educational Outreach';

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [userCrewApp, setUserCrewApp] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    if (isCrew && user?.uid) {
      try {
        fetchUserCrewApplication(user.uid)
          .then((app) => {
            if (isMounted) setUserCrewApp(app);
          })
          .catch((err) => {
            console.warn('[PublicProgramPage] fetchUserCrewApplication caught notice:', err);
          });
      } catch (err) {
        console.warn('[PublicProgramPage] fetchUserCrewApplication exception:', err);
      }
    }
    return () => {
      isMounted = false;
    };
  }, [isCrew, user?.uid]);

  const handleApplyClick = () => {
    setIsApplyModalOpen(true);
  };

  const handleNavigateCrewDashboard = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/crew-dashboard');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const isPendingReview = isCrew && userCrewApp?.status === 'pending';
  const isApprovedMember = isCrew && (profile?.isCrewMember || userCrewApp?.status === 'approved');

  return (
    <div className="min-h-[100dvh] pt-28 pb-20 px-4 sm:px-6 max-w-4xl mx-auto">
      <SeoHead pathname={pathname} />

      {/* Header Container */}
      <div className="text-center space-y-4 mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>{isCrew ? 'Official Ambassador & Internship Cohort' : 'Coming Soon'}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0d1b3e] tracking-tight">
          {title}
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          {subtitle}
        </p>
      </div>

      {/* Main Content Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-white shadow-xl shadow-indigo-950/5 space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base animate-fade-in-up">
        {isCrew ? (
          <>
            {/* Primary Narrative Copy (Exact brief requirement) */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-white border border-indigo-100/90 text-slate-800 space-y-3">
              <p className="text-base sm:text-lg font-bold text-[#0d1b3e] leading-snug">
                Become a Boardly Crew member and represent Boardly and SHS Virtual Academy at your institution. As a student ambassador, you will share Boardly with your peers. Top performers unlock paid internship opportunities. Your tenure lasts for 1 year, and you get full Premium Access for your first 30 days just for joining. Bring in traction to maintain your spot and grow with us!
              </p>
            </div>

            {/* Key Benefits Grid with Tailwind animations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-[#0d1b3e]">30 Days Free Premium Access</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Get full unrestricted access to Boardy AI, all university papers, formula vault, and full analytics the moment your application is approved.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-[#0d1b3e]">Paid Internship Unlocks</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Drive student traction and unlock paid internship contracts with SHS Virtual Academy with verifiable credentials for your CV.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-[#0d1b3e]">1-Year Ambassador Tenure</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Formalize your role as the recognized academic representative at your college or university, leading mock drills and study sprints.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-[#0d1b3e]">Live Referral Dashboard</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Track signups, active study hours brought in, and countdown meters right inside your personalized Crew Member portal.
                </p>
              </div>
            </div>

            {/* Application Guidelines */}
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-extrabold text-[#0d1b3e]">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-black text-indigo-600 text-sm">Step 1</span>
                  <p className="font-bold text-slate-800">Submit Details</p>
                  <p className="text-slate-500">Provide your institution name and a short plan for promoting Boardly.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-black text-indigo-600 text-sm">Step 2</span>
                  <p className="font-bold text-slate-800">Admin Review</p>
                  <p className="text-slate-500">Our team evaluates your submission and enables your 30-day Premium trial.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-black text-indigo-600 text-sm">Step 3</span>
                  <p className="font-bold text-slate-800">Drive Traction &amp; Earn</p>
                  <p className="text-slate-500">Share your referral link, confirm your 1-year tenure, and qualify for paid internships.</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <p>
              The Boardly Campus Captains program is a nationwide student leadership community designed for proactive secondary and higher secondary learners. As an official Campus Captain representing Boardly at your high school, cadet college, or pre-university academy, you will serve as the academic beacon for peer test preparation.
            </p>
            <p>
              Selected captains receive verified leadership certificates, exclusive early access to upcoming features like Boardly Arena, official Boardly merchandise, and direct mentorship from our academic content team.
            </p>
          </>
        )}

        {/* Footer Actions Row */}
        <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>
              {isCrew ? 'Applications actively being accepted for 2026' : 'Applications Opening Soon'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateHome) onNavigateHome();
                else window.location.href = '/';
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
            >
              Back to Home
            </a>

            {isCrew ? (
              isAdmin ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNavigateCrewDashboard}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Crew Dashboard</span>
                  </button>
                  <a
                    href="/admin"
                    className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-[#0d1b3e] hover:bg-[#152a5c] active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-slate-900/20"
                  >
                    <span>Admin Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : isApprovedMember ? (
                <button
                  type="button"
                  onClick={handleNavigateCrewDashboard}
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/25 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Crew Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : isPendingReview ? (
                <button
                  type="button"
                  onClick={handleApplyClick}
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                  <span>Application Under Review</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyClick}
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/25 cursor-pointer"
                >
                  <span>Apply for Boardly Crew</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )
            ) : (
              <a
                href="/app"
                onClick={(e) => {
                  e.preventDefault();
                  if (onApplyOrStart) onApplyOrStart();
                  else window.location.href = '/app';
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <span>Explore Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Application Modal */}
      <ErrorBoundary fallback={null}>
        <CrewApplicationModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
        />
      </ErrorBoundary>
    </div>
  );
};

export default PublicProgramPage;
