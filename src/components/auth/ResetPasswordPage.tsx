import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { BrandLogo } from '../marketing/BrandLogo';
import { TrustFooter } from '../ui/TrustFooter';

interface ResetPasswordPageProps {
  onNavigate: (route: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate }) => {
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [verifyingCode, setVerifyingCode] = useState(true);
  const [codeValid, setCodeValid] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('oobCode');
    if (!code) {
      setVerifyingCode(false);
      setCodeValid(false);
      return;
    }
    setOobCode(code);

    verifyPasswordResetCode(auth, code)
      .then((email) => {
        setUserEmail(email);
        setCodeValid(true);
        setVerifyingCode(false);
      })
      .catch((err) => {
        console.warn('verifyPasswordResetCode error:', err);
        setCodeValid(false);
        setVerifyingCode(false);
      });
  }, []);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const allRulesMet = hasMinLength && hasUppercase && hasLowercase && hasNumber;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode || !allRulesMet || !passwordsMatch) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/expired-action-code') {
        setErrorMsg('This password reset link has expired. Please request a new one.');
        setCodeValid(false);
      } else if (code === 'auth/invalid-action-code') {
        setErrorMsg('This password reset link has already been used or is invalid. Please request a new one.');
        setCodeValid(false);
      } else {
        setErrorMsg(err?.message || 'Failed to update password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
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

      <header className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
        >
          <BrandLogo size="md" />
        </button>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/80 shadow-2xl shadow-blue-500/5 rounded-3xl p-6 sm:p-10">
          {verifyingCode ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm text-slate-600">Verifying your reset link…</p>
            </div>
          ) : !codeValid ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Link Expired or Invalid</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                This password reset link is no longer valid. Password links expire after a short time or once they have been used.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('/forgot-password')}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Request a new reset link
                </button>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Password Changed!</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your new password has been set. You can now log in to your Boardly account.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('/login')}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:opacity-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Log in</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Choose a new password
                </h1>
                {userEmail && (
                  <p className="mt-1 text-xs text-slate-500">
                    For account <span className="font-semibold text-slate-700">{userEmail}</span>
                  </p>
                )}
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white/70 focus:bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Rules Checklist */}
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs space-y-1.5">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                      {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-3.5 h-3.5 inline-block text-center text-slate-400">•</span>}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                      {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-3.5 h-3.5 inline-block text-center text-slate-400">•</span>}
                      <span>An uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                      {hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-3.5 h-3.5 inline-block text-center text-slate-400">•</span>}
                      <span>A lowercase letter (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                      {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-3.5 h-3.5 inline-block text-center text-slate-400">•</span>}
                      <span>A number (0-9)</span>
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white/70 focus:bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !allRulesMet || !passwordsMatch}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating password…</span>
                    </>
                  ) : (
                    <span>Update password</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer with Trust Signals */}
      <TrustFooter onNavigate={onNavigate} />
    </div>
  );
};
