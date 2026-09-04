import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  supabase,
  isSupabaseConfigured,
  formatSupabaseAuthError,
  User,
} from '../lib/supabase';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  Lock,
  UserPlus,
  LogIn,
  Send,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { SegmentedControl } from './SegmentedControl';

interface LmsAuthScreenProps {
  onSuccess?: (user?: User) => void;
  selectedGradeContext?: string;
  onBack?: () => void;
  initialMode?: 'signin' | 'signup';
}

export const LmsAuthScreen: React.FC<LmsAuthScreenProps> = React.memo(({
  onSuccess,
  onBack,
  initialMode = 'signin',
}) => {
  const { logoUrl } = useSiteSettings();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [direction, setDirection] = useState<number>(initialMode === 'signup' ? 1 : -1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [emailSentMessage, setEmailSentMessage] = useState<string | null>(null);
  const [emailVerifiedMessage, setEmailVerifiedMessage] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Detect email verification callback or auth error parameters from URL on load
  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';

    // Check for OAuth / Auth error parameters (e.g. ?error=access_denied&error_description=...)
    const searchParams = new URLSearchParams(search);
    const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);

    const errorParam = searchParams.get('error') || hashParams.get('error');
    const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');

    if (errorParam) {
      const decodedDesc = errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : null;
      let friendlyError = 'Authentication was cancelled or failed. Please try signing in again.';
      if (errorParam === 'access_denied') {
        friendlyError = decodedDesc || 'Access denied. The sign-in request was rejected or cancelled.';
      } else if (decodedDesc) {
        friendlyError = decodedDesc;
      }
      setError(friendlyError);
      localStorage.removeItem('shs_oauth_redirect');
      sessionStorage.removeItem('shs_oauth_redirect');
      setLoading(false);
      setGoogleLoading(false);

      // Clean error params from address bar without reloading
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return;
    }

    if (
      hash.includes('type=signup') ||
      hash.includes('type=email_verification') ||
      hash.includes('type=recovery') ||
      search.includes('type=signup') ||
      search.includes('type=email')
    ) {
      setEmailVerifiedMessage('Your email address has been verified successfully! You are now signed in.');
    }
  }, []);

  const validateEmail = (str: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
  };

  const handleModeSwitch = (newMode: 'signin' | 'signup') => {
    if (newMode === mode) return;
    setDirection(newMode === 'signup' ? 1 : -1);
    setMode(newMode);
    setError(null);
    setInfoMsg(null);
    setEmailSentMessage(null);
  };

  // Sign In Flow
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setEmailSentMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Authentication service is not configured. Please check connection settings.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authErr) {
        throw authErr;
      }

      if (data?.session || data?.user) {
        setInfoMsg('Successfully signed in! Redirecting...');
        if (onSuccess) {
          onSuccess(data.user || data.session?.user);
        }
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(formatSupabaseAuthError(err, 'signin'));
    } finally {
      setLoading(false);
    }
  };

  // Sign Up Flow
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setEmailSentMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address (e.g. student@example.com).');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your confirm password.');
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Authentication service is not configured. Please check connection settings.');
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      const { data, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authErr) {
        throw authErr;
      }

      if (data?.session) {
        // Direct session created (email confirmation disabled in Supabase)
        setInfoMsg('Account created and signed in successfully!');
        if (onSuccess) {
          onSuccess(data.user || data.session?.user);
        }
      } else if (data?.user) {
        // Confirmation required by default in Supabase
        setEmailSentMessage(
          `A verification email has been sent to ${cleanEmail}. Please check your inbox (and spam folder) and click the verification link to activate your account.`
        );
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error('Sign-up error:', err);
      setError(formatSupabaseAuthError(err, 'signup'));
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Flow
  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured) {
      setError('Authentication service is not configured yet. Please check connection settings.');
      return;
    }

    setGoogleLoading(true);
    setError(null);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setGoogleLoading(false);
      setError('Google sign-in is taking longer than expected. Please check your network connection or pop-up blocker and try again.');
    }, 5000);

    try {
      localStorage.setItem('shs_oauth_redirect', 'true');
      sessionStorage.setItem('shs_oauth_redirect', 'true');
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;

      const { error: authErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (authErr) throw authErr;
    } catch (err: any) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      console.error('Google sign in error:', err);
      setError(formatSupabaseAuthError(err));
      localStorage.removeItem('shs_oauth_redirect');
      sessionStorage.removeItem('shs_oauth_redirect');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-6 px-2 text-white animate-fadeIn">
      {/* Header Branding */}
      <div className="flex flex-col items-center text-center space-y-2 mb-6">
        <div className="w-14 h-14 bg-[#0A0A0A] border-2 border-[#1E5AFF] rounded-2xl flex items-center justify-center shadow-lg mb-1 overflow-hidden p-1">
          <img
            src={logoUrl || "https://i.ibb.co/ymPFp2Wb/Chat-Box-1256234838.jpg"}
            alt="Boardly Logo"
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/logo.png';
            }}
          />
        </div>

        <h1 className="font-['Space_Grotesk'] font-black text-xl sm:text-2xl tracking-tight text-[#1E5AFF] leading-tight">
          Boardly Student Portal — <span>SHS Virtual Academy</span>
        </h1>

        <p className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.2em] text-[#1E5AFF]/90 uppercase">
          LEARN &middot; GROW &middot; ACHIEVE
        </p>
      </div>

      {/* Verified Notice Banner */}
      {emailVerifiedMessage && (
        <div className="mb-4 p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-start gap-3 text-xs text-emerald-200 font-semibold animate-ios-spring shadow-lg">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
          <span className="leading-snug">{emailVerifiedMessage}</span>
        </div>
      )}

      {/* Error Alert Box */}
      {error && (
        <div className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300 font-medium animate-ios-spring">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span className="leading-snug">{typeof error === 'string' ? error : formatSupabaseAuthError(error)}</span>
        </div>
      )}

      {/* Info Alert Box */}
      {infoMsg && (
        <div className="mb-4 p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-300 font-medium animate-ios-spring">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <span className="leading-snug">{infoMsg}</span>
        </div>
      )}

      {/* Main Authentication Card */}
      <div className="bg-[#1C1C1E] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Navigation Tabs: Sign In / Sign Up */}
        <SegmentedControl<'signin' | 'signup'>
          id="auth-mode-segmented-control"
          options={[
            { value: 'signin', label: 'Sign In', icon: LogIn },
            { value: 'signup', label: 'Sign Up', icon: UserPlus },
          ]}
          value={mode}
          onChange={(m) => handleModeSwitch(m)}
          theme="dark"
          size="md"
          className="w-full"
        />

        {/* Verification Sent Success Screen */}
        {emailSentMessage ? (
          <div className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl space-y-4 text-center animate-ios-spring">
            <div className="w-12 h-12 bg-[#1E5AFF]/20 rounded-full flex items-center justify-center mx-auto text-[#1E5AFF]">
              <Send className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-white">Check Your Email</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{emailSentMessage}</p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmailSentMessage(null);
                  handleModeSwitch('signin');
                }}
                className="w-full bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-md"
              >
                Proceed to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* Authentication Forms */
          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4 overflow-hidden">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  required
                  disabled={loading}
                  className="w-full bg-black/40 border border-white/15 focus:border-[#1E5AFF] focus:ring-1 focus:ring-[#1E5AFF] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 font-medium transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>
                  Password <span className="text-rose-400">*</span>
                </span>
                <AnimatePresence>
                  {mode === 'signup' && (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.15 }}
                      className="text-[11px] font-normal text-slate-400"
                    >
                      (Min 8 characters)
                    </motion.span>
                  )}
                </AnimatePresence>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={mode === 'signup' ? 8 : 1}
                  disabled={loading}
                  className="w-full bg-black/40 border border-white/15 focus:border-[#1E5AFF] focus:ring-1 focus:ring-[#1E5AFF] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 font-medium transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            <AnimatePresence initial={false}>
              {mode === 'signup' && (
                <motion.div
                  key="confirm-password-field"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                  className="overflow-hidden space-y-1.5"
                >
                  <label className="block text-xs font-bold text-slate-300">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      disabled={loading}
                      className="w-full bg-black/40 border border-white/15 focus:border-[#1E5AFF] focus:ring-1 focus:ring-[#1E5AFF] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 font-medium transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E5AFF] hover:bg-[#1546CC] text-white font-extrabold py-3.5 px-6 rounded-xl border border-blue-400/20 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer shadow-lg text-sm disabled:opacity-75 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span>{mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2.5"
                  >
                    {mode === 'signin' ? (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Sign Up & Create Account</span>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#1C1C1E] px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            or continue with
          </span>
        </div>

        {/* Continue with Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full bg-white hover:bg-slate-100 text-[#0A0A0A] font-extrabold py-3 px-6 rounded-xl border border-white/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all cursor-pointer shadow-md text-sm disabled:opacity-80 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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

          {googleLoading ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-900 font-bold text-xs">Connecting to Google...</span>
            </div>
          ) : (
            <span>Continue with Google</span>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Your information is kept private and secure</span>
        </div>
      </div>

      {/* Optional Go Back Button */}
      {onBack && (
        <div className="mt-5 pt-3 text-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      )}
    </div>
  );
});

