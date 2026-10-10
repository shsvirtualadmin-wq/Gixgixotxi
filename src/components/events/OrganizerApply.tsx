import React, { useState } from 'react';
import { BrandLogo } from '../marketing/BrandLogo';
import { FrostedBackgroundDecor } from './FrostedBackgroundDecor';
import { ArrowLeft, CheckCircle2, ShieldCheck, Lock, Mail, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface OrganizerApplyProps {
  onNavigate?: (route: string) => void;
  onSignIn?: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
}

export const OrganizerApply: React.FC<OrganizerApplyProps> = ({ onNavigate, onSignIn, onBack, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Field touch states for friendly inline validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber;

  // Inline error computations
  const nameError = touched.fullName && fullName.trim().length < 2 ? 'Please enter your full name.' : '';
  const emailError =
    touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? 'Please provide a valid email address.'
      : '';
  const passwordError =
    touched.password && !isPasswordValid
      ? 'Password must have at least 8 characters with uppercase, lowercase, and a number.'
      : '';
  const confirmError =
    touched.confirmPassword && confirmPassword !== password
      ? 'Passwords do not match.'
      : '';
  const termsError = touched.terms && !agreeTerms ? 'You must accept the Terms of Service to continue.' : '';

  const isFormValid =
    fullName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    isPasswordValid &&
    confirmPassword === password &&
    agreeTerms;

  const goBack = () => {
    if (onBack) onBack();
    else if (onNavigate) onNavigate('/circles');
  };

  const handleSuccessfulApply = () => {
    if (onSuccess) onSuccess();
    else if (onNavigate) onNavigate('/organizer');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });

    if (!isFormValid) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 700);
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-8 px-4 sm:px-6 relative bg-[#FAF9F6] selection:bg-indigo-600 selection:text-white">
      <FrostedBackgroundDecor />

      {/* Top minimal bar */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6">
        <button
          onClick={goBack}
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-indigo-500 rounded p-1"
          aria-label="Back to Study Circles"
        >
          <BrandLogo size="md" />
        </button>

        <button
          onClick={goBack}
          className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </header>

      {/* Centered Glass Card */}
      <main className="flex-1 flex items-center justify-center max-w-lg mx-auto w-full py-4">
        {submitted ? (
          <div className="w-full glass-card p-8 sm:p-10 rounded-3xl text-center border border-white/80 shadow-2xl animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0A1330] mb-2 font-poppins">
              Application Submitted!
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Welcome, <span className="font-bold text-slate-900">{fullName}</span>. Your organizer profile has been registered. You can now host Boardly Blitz and Arena mock bouts for your batch.
            </p>
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/60 text-xs text-indigo-900 mb-6 text-left leading-relaxed">
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Next steps for Study Circles leaders:</span>
              </div>
              Our student community coordinators review submissions within 24 hours to issue your verification badge and custom session builder links.
            </div>
            <button
              onClick={handleSuccessfulApply}
              className="w-full py-3.5 rounded-full text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md cursor-pointer"
            >
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <div className="w-full glass-card p-7 sm:p-10 rounded-3xl border border-white/80 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-7">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0A1330] tracking-tight font-poppins mb-1.5">
                Create your account
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                Apply to organize Blitz & Arena sessions for your batch.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, fullName: true }))}
                    placeholder="e.g. Ayesha Khan"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-sm text-slate-900 outline-none transition-all ${
                      nameError ? 'border-red-400 focus:border-red-500' : ''
                    }`}
                  />
                </div>
                {nameError && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{nameError}</span>
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                    placeholder="name@example.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-sm text-slate-900 outline-none transition-all ${
                      emailError ? 'border-red-400 focus:border-red-500' : ''
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                    placeholder="Create a strong password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-2xl glass-input text-sm text-slate-900 outline-none transition-all ${
                      passwordError ? 'border-red-400 focus:border-red-500' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  At least 8 characters with uppercase, lowercase and a number.
                </p>
                {passwordError && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
                    placeholder="Repeat your password"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-sm text-slate-900 outline-none transition-all ${
                      confirmError ? 'border-red-400 focus:border-red-500' : ''
                    }`}
                  />
                </div>
                {confirmError && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{confirmError}</span>
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-600 leading-tight">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('/terms')}
                      className="text-indigo-600 underline font-medium hover:text-indigo-700"
                    >
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => onNavigate('/privacy')}
                      className="text-indigo-600 underline font-medium hover:text-indigo-700"
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </label>
                {termsError && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{termsError}</span>
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 glow-btn hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>
              </div>

              {/* OR Divider */}
              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80" />
                </div>
                <span className="relative px-3 bg-white/70 backdrop-blur-sm text-[11px] uppercase tracking-wider font-semibold text-slate-400 rounded-full">
                  or
                </span>
              </div>

              {/* Google Button: White glass button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full py-3 px-4 rounded-full text-sm font-semibold text-slate-700 glass hover:bg-white/95 border border-slate-200/90 transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer hover:shadow"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Already have an account? Sign in */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (onSignIn) onSignIn();
                      else onNavigate('/auth');
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer links */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-500 pt-4">
        <span>© {new Date().getFullYear()} Boardly · Study Circles Organizer Portal</span>
      </footer>
    </div>
  );
};
