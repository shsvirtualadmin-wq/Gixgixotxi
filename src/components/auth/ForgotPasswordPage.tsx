import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { BrandLogo } from '../marketing/BrandLogo';

interface ForgotPasswordPageProps {
  onNavigate: (route: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { sendResetEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setErrorMessage(null);

    setIsLoading(true);
    const res = await sendResetEmail(email.trim());
    setIsLoading(false);

    if (res.success) {
      setSubmitted(true);
      setMessage(res.message);
    } else {
      setErrorMessage(res.message || 'Unable to send reset email. Please try again.');
    }
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
        <button
          onClick={() => onNavigate('/login')}
          className="text-xs sm:text-sm font-semibold text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
        >
          Back to <span className="text-[var(--brand-2)] underline underline-offset-4">Log in</span>
        </button>
      </header>

      {/* Main Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <Card variant="hero" className="w-full max-w-md p-6 sm:p-10 space-y-6">
          <button
            onClick={() => onNavigate('/login')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to login</span>
          </button>

          <div className="text-left space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display">
              Reset password
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Enter the email associated with your Boardly account, and we'll send a secure password reset link.
            </p>
          </div>

          {errorMessage && (
            <ErrorState
              title="Reset failed"
              error={errorMessage}
            />
          )}

          {submitted ? (
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#34D399]/20 text-[#34D399] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                {message || 'If an account exists with this email, you will receive a password reset link shortly.'}
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('/login')}
                className="w-full cursor-pointer"
              >
                Return to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                disabled={!email.includes('@')}
                className="w-full mt-2 cursor-pointer font-bold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Reset Link
              </Button>
            </form>
          )}
        </Card>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 text-center text-xs text-[var(--text-faint)]">
        Official authentication engine · Boardly 2026
      </footer>
    </div>
  );
};
