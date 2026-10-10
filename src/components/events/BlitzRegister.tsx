import React, { useState } from 'react';
import { BrandLogo } from '../marketing/BrandLogo';
import { FrostedBackgroundDecor } from './FrostedBackgroundDecor';
import { INITIAL_SESSIONS } from '../../data/eventsStore';
import { ArrowLeft, CheckCircle2, Trophy, Clock, AlertCircle } from 'lucide-react';

interface BlitzRegisterProps {
  onNavigate: (route: string) => void;
}

export const BlitzRegister: React.FC<BlitzRegisterProps> = ({ onNavigate }) => {
  // Check if any blitz session is currently open (status === 'live' or status === 'upcoming')
  const openSession = INITIAL_SESSIONS.find(s => s.type === 'blitz' && (s.status === 'live' || s.status === 'upcoming'));

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Please provide your name and email address.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-8 px-4 sm:px-6 relative">
      <FrostedBackgroundDecor />

      {/* Minimal Top Bar with Brand Logo */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6">
        <button
          onClick={() => onNavigate('/blitz')}
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
          aria-label="Back to Blitz"
        >
          <BrandLogo size="md" />
        </button>

        <button
          onClick={() => onNavigate('/blitz')}
          className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Blitz</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center max-w-lg mx-auto w-full py-6">
        {!openSession ? (
          /* When Registration is closed */
          <div className="w-full glass-card p-8 sm:p-10 rounded-[32px] text-center border border-white/80 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A1330] mb-3">
              Registration is closed for now
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8">
              There are no open Blitz registration slots active at this exact moment. Please check back before the next weekly scheduled drill or explore past session standings.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('/blitz/leaderboard')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-slate-800 glass hover:bg-white/90 border border-slate-300 transition-all cursor-pointer shadow-sm"
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>See the leaderboard</span>
              </button>
              <button
                onClick={() => onNavigate('/blitz')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-indigo-600 bg-white/90 hover:bg-white border border-indigo-200 transition-all cursor-pointer shadow-sm"
              >
                <span>Back to Blitz</span>
              </button>
            </div>
          </div>
        ) : submitted ? (
          /* Confirmation Success Screen */
          <div className="w-full glass-card p-8 sm:p-10 rounded-[32px] text-center border border-white/80 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-[#0A1330] mb-2">You are Registered!</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              We’ve reserved your seat for <span className="font-semibold text-slate-900">{openSession.title}</span>.
              A drill reminder has been sent to <span className="font-medium text-slate-900">{email}</span>.
            </p>
            <button
              onClick={() => onNavigate('/blitz/leaderboard')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <span>View Leaderboard</span>
            </button>
          </div>
        ) : (
          /* Open Registration Form */
          <div className="w-full glass-card p-8 sm:p-10 rounded-[32px] border border-white/80 shadow-xl">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 mb-3">
                OPEN DRILL SESSION
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A1330] mb-2">
                Register for Blitz
              </h1>
              <p className="text-sm text-slate-600">
                {openSession.title} ({openSession.subject})
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ayesha Khan"
                  className="w-full px-4 py-3 rounded-2xl glass-input text-sm text-slate-900 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ayesha@example.com"
                  className="w-full px-4 py-3 rounded-2xl glass-input text-sm text-slate-900 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  WhatsApp / Phone (Optional for SMS reminders)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300 1234567"
                  className="w-full px-4 py-3 rounded-2xl glass-input text-sm text-slate-900 outline-none transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-full text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 glow-btn transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Minimal Footer with Terms and Privacy Links */}
      <footer className="max-w-4xl mx-auto w-full pt-6 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/60">
        <div>© 2026 Boardly. All rights reserved.</div>
        <div className="flex items-center gap-4 font-medium">
          <button
            onClick={() => onNavigate('/terms')}
            className="hover:text-slate-900 transition-colors"
          >
            Terms of Service
          </button>
          <span className="text-slate-300">·</span>
          <button
            onClick={() => onNavigate('/privacy')}
            className="hover:text-slate-900 transition-colors"
          >
            Privacy Policy
          </button>
        </div>
      </footer>
    </div>
  );
};
