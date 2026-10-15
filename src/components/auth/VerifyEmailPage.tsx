import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, RotateCw, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { BrandLogo } from '../marketing/BrandLogo';

interface VerifyEmailPageProps {
  onNavigate: (route: string) => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ onNavigate }) => {
  const { user, profile, resendVerification, reloadUserStatus, logOut } = useAuth();

  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [resending, setResending] = useState<boolean>(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const userEmail = user?.email || profile?.email || 'your email';

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Polling verification status every 3.5 seconds
  useEffect(() => {
    let active = true;
    const interval = setInterval(async () => {
      if (!active) return;
      setIsChecking(true);
      const verified = await reloadUserStatus();
      setIsChecking(false);
      if (verified && active) {
        if (!profile?.onboardingCompleted) {
          onNavigate('/onboarding');
        } else {
          onNavigate('/app');
        }
      }
    }, 3500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [reloadUserStatus, profile, onNavigate]);

  const handleResend = async () => {
    if (cooldownSeconds > 0 || resending) return;
    setResending(true);
    setResendStatus(null);
    const res = await resendVerification();
    setResending(false);
    if (res.success) {
      setResendStatus('Verification link sent! Please check your inbox and spam folder.');
      setCooldownSeconds(60);
    } else {
      setResendStatus(res.error || 'Failed to resend. Please try again in a moment.');
    }
  };

  const handleChangeEmail = async () => {
    await logOut();
    onNavigate('/signup');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] bg-grid-48 text-[var(--text)] flex flex-col justify-between selection:bg-[var(--brand)] selection:text-white relative overflow-x-hidden font-sans">
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#2F6BFF]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] rounded-lg p-1"
        >
          <BrandLogo size="md" />
        </button>
      </header>

      {/* Main Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <Card variant="hero" className="w-full max-w-md p-6 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#2F6BFF] to-[#22D3EE] text-white flex items-center justify-center shadow-[0_0_24px_rgba(47,107,255,0.4)]">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-[var(--text)] tracking-tight font-display">
              Check your inbox
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              We sent a verification link to{' '}
              <span className="font-semibold text-white break-all">{userEmail}</span>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-[var(--brand-2)] flex items-center justify-center gap-2">
            <Loader2 className={`w-4 h-4 shrink-0 ${isChecking ? 'animate-spin' : 'opacity-40'}`} />
            <span>Checking automatically. Click the link in your email to continue.</span>
          </div>

          {resendStatus && (
            <div className="p-3 rounded-xl bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs">
              {resendStatus}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleResend}
              disabled={cooldownSeconds > 0 || resending}
              isLoading={resending}
              className="w-full justify-center cursor-pointer font-bold"
              leftIcon={<RotateCw className="w-4 h-4" />}
            >
              {cooldownSeconds > 0 ? `Resend email (${cooldownSeconds}s)` : 'Resend verification link'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleChangeEmail}
              className="w-full justify-center text-xs text-[var(--text-muted)] hover:text-white cursor-pointer"
            >
              Change email address
            </Button>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 text-center text-xs text-[var(--text-faint)]">
        Official authentication engine · Boardly 2026
      </footer>
    </div>
  );
};
