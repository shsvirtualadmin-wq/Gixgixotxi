import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  Sparkles,
  Building,
  Mail,
  Phone,
  User,
  Send,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { submitCrewApplication, fetchUserCrewApplication, CrewApplication } from '../../lib/firebase';
import { SeoHead } from '../common/SeoHead';
import { Navbar } from '../marketing/Navbar';
import { Footer } from '../marketing/Footer';
import { BrandLogo } from '../marketing/BrandLogo';

interface CrewApplicationPageProps {
  onNavigate: (route: string) => void;
}

export const CrewApplicationPage: React.FC<CrewApplicationPageProps> = ({ onNavigate }) => {
  const { user, profile, isAdmin, signInGoogle } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [promotionPlan, setPromotionPlan] = useState('');

  const [existingApp, setExistingApp] = useState<CrewApplication | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Preserve return path in sessionStorage whenever user is on /crew
  useEffect(() => {
    try {
      sessionStorage.setItem('postLoginPath', '/crew');
    } catch {}
  }, []);

  // Fetch existing application if user is signed in
  useEffect(() => {
    if (user?.uid) {
      setLoadingExisting(true);
      fetchUserCrewApplication(user.uid)
        .then((app) => setExistingApp(app))
        .catch(console.warn)
        .finally(() => setLoadingExisting(false));
    }
  }, [user?.uid]);

  // Sync profile details into form
  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(profile?.name || user.displayName || '');
      setEmail(profile?.email || user.email || '');
      if (!phone && profile?.phone) setPhone(profile.phone);
      if (!institution && profile?.targetUniversity) setInstitution(profile.targetUniversity);
    }
  }, [user, profile]);

  const handleGoogleQuickSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      sessionStorage.setItem('postLoginPath', '/crew');
      const res = await signInGoogle();
      if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user?.uid) {
      sessionStorage.setItem('postLoginPath', '/crew');
      onNavigate('/login');
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8 digits).');
      return;
    }
    if (!institution.trim()) {
      setErrorMessage('Please enter your Institution / College / University name.');
      return;
    }
    if (!promotionPlan.trim() || promotionPlan.trim().length < 15) {
      setErrorMessage('Please share a brief note (at least 15 characters) on how you plan to promote Boardly.');
      return;
    }

    // Role checks
    if (isAdmin || user.email?.toLowerCase() === 'shsvirtualadmin@gmail.com') {
      setErrorMessage('Administrator accounts cannot submit student ambassador applications.');
      return;
    }

    if (profile?.crewStatus === 'revoked' || existingApp?.status === 'revoked') {
      setErrorMessage('Your Crew access was revoked. Contact administrator for re-approval.');
      return;
    }

    if (existingApp?.status === 'pending') {
      setErrorMessage('You already have a pending application under review.');
      return;
    }

    if (profile?.isCrewMember) {
      setErrorMessage('You are already an active Boardly Crew member!');
      return;
    }

    setSubmitting(true);
    try {
      await submitCrewApplication({
        userId: user.uid,
        fullName: fullName.trim(),
        email: (user.email || email).trim().toLowerCase(),
        phone: phone.trim(),
        institution: institution.trim(),
        promotionPlan: promotionPlan.trim(),
      });

      setSubmittedSuccess(true);
      // Reload app status
      fetchUserCrewApplication(user.uid).then(setExistingApp).catch(console.warn);
    } catch (err: any) {
      console.error('[Crew:Application] Submit error:', err);
      setErrorMessage(err?.message || 'Failed to submit application. Please check your network.');
    } finally {
      setSubmitting(false);
    }
  };

  const isApprovedCrew = Boolean(
    (profile?.isCrewMember && profile?.crewStatus === 'approved') ||
    existingApp?.status === 'approved'
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-left font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <SeoHead
        pathname="/crew"
        override={{
          title: "Join Boardly Crew — Student Campus Ambassador Program",
          description: "Apply to become a Boardly Crew Campus Ambassador. Unlock 30 days of free Premium access, earn peer referral rewards, and qualify for paid internships."
        }}
      />

      <Navbar
        currentPage="home"
        onNavigate={(p) => onNavigate(`/${p}`)}
        onGetStarted={() => {
          if (!user) {
            sessionStorage.setItem('postLoginPath', '/crew');
            onNavigate('/signup');
          } else {
            onNavigate('/app');
          }
        }}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
        {/* State 1: User NOT logged in */}
        {!user ? (
          <div className="max-w-xl mx-auto space-y-8 animate-fade-in text-center sm:text-left">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold font-display">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Student Ambassador Program</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
                Join the Boardly Crew
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
                Represent Boardly &amp; SHS Virtual Academy at your college. Unlock <strong className="text-slate-900">30 days of free Premium access</strong> upon approval, earn peer referral milestone rewards, and become eligible for paid internships.
              </p>
            </div>

            {/* Program Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 font-display">30-Day Premium</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Full access to 15,000+ past paper MCQs, analytics, and formula vault.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 font-display">Campus Leader</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Your custom referral link and official ambassador certificate.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 font-display">Paid Internship</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Top performing ambassadors qualify for paid remote positions.
                </p>
              </div>
            </div>

            {/* Auth Gate Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-indigo-100 shadow-xl shadow-indigo-500/5 space-y-5 text-center">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  Sign in to continue your Crew application
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  You will be returned straight to the application form after login.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold text-left">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-3 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={handleGoogleQuickSignIn}
                  disabled={googleLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200 shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-98 disabled:opacity-60"
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span>or</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('postLoginPath', '/crew');
                      onNavigate('/signup');
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                  >
                    Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('postLoginPath', '/crew');
                      onNavigate('/login');
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : loadingExisting ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Checking your ambassador status...</p>
          </div>
        ) : isApprovedCrew ? (
          /* State 2: User is ALREADY APPROVED */
          <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
            <div className="p-8 rounded-3xl bg-white border border-emerald-200 shadow-xl shadow-emerald-500/5 text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <ShieldCheck className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                  Approved Ambassador
                </span>
                <h2 className="text-2xl font-black text-slate-900 font-display mt-2">
                  You are a Boardly Crew Member!
                </h2>
                <p className="text-sm text-slate-600 font-sans max-w-md mx-auto">
                  Your ambassadorship is active for{' '}
                  <strong>{profile?.crewInstitution || existingApp?.institution || 'your campus'}</strong>.
                </p>
              </div>

              {(profile?.crewReferralCode || existingApp?.referralCode) && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-sm mx-auto space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Your Referral Code
                  </span>
                  <p className="text-xl font-black text-indigo-600 font-mono tracking-wider">
                    {profile?.crewReferralCode || existingApp?.referralCode}
                  </p>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('/crew-dashboard')}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Open Crew Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/app')}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer"
                >
                  Back to Student App
                </button>
              </div>
            </div>
          </div>
        ) : existingApp?.status === 'pending' || submittedSuccess ? (
          /* State 3: User ALREADY APPLIED (PENDING) */
          <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
            <div className="p-8 rounded-3xl bg-white border border-amber-200 shadow-xl shadow-amber-500/5 text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
                <Clock className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider">
                  Application Under Review
                </span>
                <h2 className="text-2xl font-black text-slate-900 font-display mt-2">
                  We're Reviewing Your Application
                </h2>
                <p className="text-sm text-slate-600 font-sans max-w-md mx-auto leading-relaxed">
                  Thank you for applying to the Boardly Crew! Our team reviews applications within 24–48 hours. Upon approval, you will automatically receive 30 days of Premium access.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="font-bold text-slate-900">{fullName || existingApp?.fullName || user.displayName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Campus:</span>
                  <span className="font-bold text-slate-900">{institution || existingApp?.institution}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-amber-700">Pending Admin Approval</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/app')}
                className="w-full py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all cursor-pointer shadow-xs active:scale-98"
              >
                Explore Student Practice in the Meantime
              </button>
            </div>
          </div>
        ) : (
          /* State 4: Signed-in User can SUBMIT FORM DIRECTLY */
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold font-display">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Boardly Crew Application</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                Apply for Boardly Crew
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
                Fill in your details below. Once approved by the administrator, you will automatically be granted <strong className="text-indigo-600 font-bold">30 days of full Premium access</strong> and your custom ambassador referral link.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Hamza Tariq"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Email (Readonly) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account Email</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email || email}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* WhatsApp Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>WhatsApp / Phone *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Institution */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Institution / College / University *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Punjab College, FAST-NUCES, AKU"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Promotion Plan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                  <span>How will you promote Boardly on your campus? *</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={promotionPlan}
                  onChange={(e) => setPromotionPlan(e.target.value)}
                  placeholder="e.g. I will share my ambassador link with classmates in our pre-medical WhatsApp group and organize diagnostic mocks during midterm preparation..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
                />
                <p className="text-[11px] text-slate-400">
                  Minimum 15 characters. Tell us about your batch, study groups, or clubs.
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Crew Application</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer onNavigate={(p) => onNavigate(`/${p}`)} />
    </div>
  );
};
