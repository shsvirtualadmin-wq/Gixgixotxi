import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, X, ArrowRight, Gift } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ErrorState } from '../ui/ErrorState';
import { BrandLogo } from '../marketing/BrandLogo';
import { getStoredReferralCode, initReferralTracker } from '../../lib/referralTracker';

interface SignUpPageProps {
  onNavigate: (route: string) => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate }) => {
  const { signUpEmail, signInGoogle, friendlyErrorMessage } = useAuth();

  const [referralCode, setReferralCode] = useState<string>(() => {
    return getStoredReferralCode() || '';
  });

  useEffect(() => {
    const code = initReferralTracker();
    if (code) {
      setReferralCode(code);
    }
  }, []);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{ message: string; code?: string } | null>(null);

  // Password validation rules
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const allPasswordRulesMet = hasMinLength && hasUppercase && hasLowercase && hasNumber;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);

    if (!agreedToTerms) {
      setErrorDetails({ message: 'Please accept the Terms of Service and Privacy Policy to continue.' });
      return;
    }
    if (!allPasswordRulesMet) {
      setErrorDetails({ message: 'Please ensure all password requirements are satisfied.' });
      return;
    }
    if (!passwordsMatch) {
      setErrorDetails({ message: 'Passwords do not match. Please re-enter confirm password.' });
      return;
    }

    setIsLoading(true);
    const res = await signUpEmail({
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      referralCode: referralCode || undefined,
      termsAccepted: agreedToTerms,
    });
    setIsLoading(false);

    if (res.success) {
      onNavigate('/onboarding');
    } else {
      setErrorDetails({
        message: res.error || 'Failed to create your account. Please try again.',
        code: (res as any).code || 'auth/signup-failed',
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorDetails(null);
    setGoogleLoading(true);

    try {
      const res = await signInGoogle();
      if (res.success) {
        onNavigate('/onboarding');
      } else {
        setGoogleLoading(false);
        setErrorDetails({
          message: res.error || 'Google sign-in was cancelled or encountered an issue.',
          code: (res as any).code || 'auth/popup-closed-by-user',
        });
      }
    } catch (err: any) {
      setGoogleLoading(false);
      setErrorDetails({
        message: friendlyErrorMessage(err),
        code: err?.code || 'auth/google-sign-in-failed',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] bg-grid-48 text-[var(--text)] flex flex-col justify-between selection:bg-[var(--brand)] selection:text-white relative overflow-x-hidden font-sans">
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#2F6BFF]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-[#7C5CFF]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded-lg p-1"
        >
          <BrandLogo size="md" />
        </button>
        <button
          onClick={() => onNavigate('/login')}
          className="text-xs sm:text-sm font-semibold text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
        >
          Already have an account? <span className="text-[var(--brand-2)] underline underline-offset-4">Log in</span>
        </button>
      </header>

      {/* Main SignUp Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <Card variant="hero" className="w-full max-w-lg p-6 sm:p-10 space-y-6">
          <div className="text-left space-y-2">
            {referralCode && (
              <Badge variant="crew" size="md" className="gap-1.5 font-mono mb-2">
                <Gift className="w-3.5 h-3.5" />
                <span>Referral Active: {referralCode}</span>
              </Badge>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display">
              Create student account
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Start practicing past entrance papers for FAST-NUCES, NUST NET, GIKI, and MDCAT with verified step derivations.
            </p>
          </div>

          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleGoogleSignIn}
            isLoading={googleLoading}
            className="w-full justify-center gap-3 cursor-pointer text-sm font-semibold"
            leftIcon={
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            }
          >
            Sign up with Google
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[var(--border)] w-full" />
            <span className="bg-[#0E1626] px-3 text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider absolute">
              or fill details manually
            </span>
          </div>

          {errorDetails && (
            <ErrorState
              title="Registration failed"
              error={errorDetails.message}
              path={errorDetails.code ? `Code: ${errorDetails.code}` : undefined}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <Input
              label="Full Name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ayesha Khan"
            />

            <Input
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />

            <Input
              label="WhatsApp / Phone (optional)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="cursor-pointer text-[var(--text-faint)] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              <div>
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="cursor-pointer text-[var(--text-faint)] hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>
            </div>

            {/* Password Requirement Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
              <span className={`inline-flex items-center gap-1 ${hasMinLength ? 'text-[#34D399]' : 'text-[var(--text-faint)]'}`}>
                {hasMinLength ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
                8+ chars
              </span>
              <span className={`inline-flex items-center gap-1 ${hasUppercase ? 'text-[#34D399]' : 'text-[var(--text-faint)]'}`}>
                {hasUppercase ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
                Uppercase
              </span>
              <span className={`inline-flex items-center gap-1 ${hasLowercase ? 'text-[#34D399]' : 'text-[var(--text-faint)]'}`}>
                {hasLowercase ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
                Lowercase
              </span>
              <span className={`inline-flex items-center gap-1 ${hasNumber ? 'text-[#34D399]' : 'text-[var(--text-faint)]'}`}>
                {hasNumber ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
                Number
              </span>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer pt-2 select-none">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 rounded bg-[#0E1626] border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]"
              />
              <span className="text-xs text-[var(--text-muted)] leading-relaxed">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('/terms')}
                  className="text-[var(--brand-2)] underline"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('/privacy')}
                  className="text-[var(--brand-2)] underline"
                >
                  Privacy Policy
                </button>
                .
              </span>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full mt-2 cursor-pointer font-bold"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration
            </Button>
          </form>
        </Card>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 text-center text-xs text-[var(--text-faint)]">
        Encrypted credentials stored in Firebase Auth · Boardly 2026
      </footer>
    </div>
  );
};
