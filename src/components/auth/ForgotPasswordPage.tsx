import React, { useState } from 'react';
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../marketing/BrandLogo';

interface ForgotPasswordPageProps {
  onNavigate: (route: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { sendResetEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [neutralMessage, setNeutralMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    const res = await sendResetEmail(email.trim());
    setIsLoading(false);
    setSubmitted(true);
    setNeutralMessage(res.message);
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
        <button
          onClick={() => onNavigate('/login')}
          className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          Back to <span className="text-blue-600 underline underline-offset-4">Log in</span>
        </button>
      </header>

      {/* Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/80 shadow-2xl shadow-blue-500/5 rounded-3xl p-6 sm:p-10 transition-all">
          <button
            onClick={() => onNavigate('/login')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to login</span>
          </button>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Enter the email associated with your Boardly account, and we'll send a secure password reset link.
          </p>

          {submitted ? (
            <div className="mt-6 p-5 rounded-2xl bg-blue-50/80 border border-blue-100 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto" />
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                {neutralMessage}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('/login')}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                >
                  Return to login
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/70 focus:bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.includes('@')}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending reset link…</span>
                  </>
                ) : (
                  <span>Send reset link</span>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center text-xs text-slate-400">
        <span>© 2026 Boardly</span>
      </footer>
    </div>
  );
};
