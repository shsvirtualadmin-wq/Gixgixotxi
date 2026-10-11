import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, RotateCw, ArrowLeft, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../marketing/BrandLogo';
import { TrustFooter } from '../ui/TrustFooter';

interface VerifyEmailPageProps {
  onNavigate: (route: string) => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ onNavigate }) => {
  const { user, profile, resendVerification, reloadUserStatus, logOut } = useAuth();

  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [resending, setResending] = useState<boolean>(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showEmailPreview, setShowEmailPreview] = useState<boolean>(false);

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
    <div className="min-h-screen bg-[#F8F9FB] relative flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Background Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
        >
          <BrandLogo size="md" />
        </button>
      </header>

      {/* Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/80 shadow-2xl shadow-blue-500/5 rounded-3xl p-6 sm:p-10 text-center">
          {/* Email Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Mail className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Check your inbox
          </h1>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            We sent a verification link to{' '}
            <span className="font-semibold text-slate-900 break-all">{userEmail}</span>.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 flex items-center justify-center gap-2">
            <Loader2 className={`w-4 h-4 text-blue-600 ${isChecking ? 'animate-spin' : 'opacity-40'}`} />
            <span>Checking automatically. Click the link in your email to continue.</span>
          </div>

          {resendStatus && (
            <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              {resendStatus}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={cooldownSeconds > 0 || resending}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending email…</span>
                </>
              ) : cooldownSeconds > 0 ? (
                <>
                  <RotateCw className="w-4 h-4" />
                  <span>Resend email ({cooldownSeconds}s)</span>
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4" />
                  <span>Resend email</span>
                </>
              )}
            </button>

            <button
              onClick={handleChangeEmail}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Change email address
            </button>

            <button
              onClick={() => setShowEmailPreview(!showEmailPreview)}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 underline underline-offset-4 pt-2 cursor-pointer"
            >
              <span>{showEmailPreview ? 'Hide email template preview' : 'View email template layout'}</span>
            </button>
          </div>

          {/* Customized email template preview */}
          {showEmailPreview && (
            <div className="mt-6 text-left p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">Boardly Verification Email Preview</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">Branded Template</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-100 text-center space-y-3">
                <div className="flex justify-center">
                  <BrandLogo size="sm" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Verify your Boardly account</h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Hi there, welcome to Boardly! Tap the button below to verify your email and unlock entry test practice papers and Boardy AI.
                </p>
                <div className="pt-2">
                  <span className="inline-block py-2.5 px-6 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-sm">
                    Verify Email Address
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 pt-2">
                  Link expires in 24 hours. If you did not request this, you can safely ignore this email.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer with Trust Signals */}
      <TrustFooter onNavigate={onNavigate} />
    </div>
  );
};
