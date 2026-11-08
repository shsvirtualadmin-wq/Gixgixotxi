import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { OtpVerificationCard } from '@/components/auth/OtpVerificationCard';
import { LineLoader } from '@/components/ui/LineLoader';

export function VerifyEmailPage() {
  const {
    user,
    profile,
    profileLoading,
    isSessionVerified,
    otpVerificationState,
    requestOtpCode,
    verifyOtpCode,
    verifyFallbackEmailLink,
    signOutUser,
    getRoleRedirectUrl,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const linkToken = searchParams.get('token');
  const linkUid = searchParams.get('uid') || undefined;

  const [linkStatus, setLinkStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>(
    linkToken ? 'verifying' : 'idle'
  );
  const [linkError, setLinkError] = useState('');

  // Handle fallback verification link click (?token=...&uid=...)
  useEffect(() => {
    if (!linkToken) return;
    let cancelled = false;
    setLinkStatus('verifying');
    verifyFallbackEmailLink(linkToken, linkUid)
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setLinkStatus('verified');
        } else {
          setLinkStatus('error');
          setLinkError(res.error || 'Invalid or expired verification link.');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLinkStatus('error');
          setLinkError('Invalid or expired verification link.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [linkToken, linkUid, verifyFallbackEmailLink]);

  // Redirect once verified
  useEffect(() => {
    if (user && !profileLoading && isSessionVerified) {
      if (profile && !profile.onboardingCompleted && profile.role === 'student') {
        navigate('/onboarding', { replace: true });
        return;
      }
      const dest = profile ? getRoleRedirectUrl(profile.role) : '/dashboard';
      navigate(dest, { replace: true });
    }
  }, [user, profile, profileLoading, isSessionVerified, navigate, getRoleRedirectUrl]);

  if (linkStatus === 'verifying' || otpVerificationState.status === 'checking') {
    return (
      <AuthLayout>
        <LineLoader context="verify-email" variant="section" />
      </AuthLayout>
    );
  }

  if (linkStatus === 'verified' && !user) {
    return (
      <AuthLayout>
        <div
          className="w-full rounded-[28px] border border-[var(--border)] p-7 sm:p-8 flex flex-col items-center text-center gap-5"
          style={{ backgroundColor: 'var(--card)' }}
        >
          <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[#3ddc84]">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold text-[var(--text)] tracking-tight"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Email Verified
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-2 leading-relaxed">
              Your Boardly email address has been verified. You can now sign in to your account.
            </p>
          </div>
          <Link
            to="/login"
            className="btn-red w-full flex items-center justify-center gap-2 cursor-pointer"
            style={{ height: '52px' }}
          >
            <span>Continue to Sign In</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (!user && !profileLoading) {
    return (
      <AuthLayout>
        <div
          className="w-full rounded-[28px] border border-[var(--border)] p-7 sm:p-8 flex flex-col items-center text-center gap-5"
          style={{ backgroundColor: 'var(--card)' }}
        >
          {linkError && (
            <div className="w-full p-3.5 rounded-2xl bg-[#260B0B] border border-[#EF4444] flex items-center gap-2.5 text-xs text-[#FEE2E2] text-left">
              <AlertCircle size={16} className="text-[#EF4444] shrink-0" />
              <span className="flex-1 font-medium">{linkError}</span>
            </div>
          )}
          <div>
            <h1
              className="text-2xl font-bold text-[var(--text)] tracking-tight"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Verify Your Email
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-2 leading-relaxed">
              Please sign in to enter your 6-digit verification code.
            </p>
          </div>
          <Link
            to="/login"
            className="btn-red w-full flex items-center justify-center gap-2 cursor-pointer"
            style={{ height: '52px' }}
          >
            <span>Go to Sign In</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const activePurpose = otpVerificationState.purpose || 'signup';

  return (
    <AuthLayout>
      <OtpVerificationCard
        purpose={activePurpose}
        maskedEmail={otpVerificationState.maskedEmail}
        initialCooldownSeconds={otpVerificationState.cooldownSeconds}
        initialError={linkError || otpVerificationState.error}
        twoFactorMethods={otpVerificationState.twoFactorMethods}
        recoveryDisableAt={otpVerificationState.recoveryDisableAt}
        onVerifyCode={verifyOtpCode}
        onResendCode={() =>
          requestOtpCode({
            purpose: activePurpose,
            forceResend: true,
          })
        }
        onUseDifferentAccount={async () => {
          await signOutUser();
          navigate('/login', { replace: true });
        }}
      />
    </AuthLayout>
  );
}

export default VerifyEmailPage;
