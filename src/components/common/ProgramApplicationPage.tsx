import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../marketing/BrandLogo';

export interface ProgramApplicationPageProps {
  program: 'crew' | 'captain';
  onNavigate?: (route: string) => void;
}

export const ProgramApplicationPage: React.FC<ProgramApplicationPageProps> = ({
  program,
  onNavigate,
}) => {
  const { user, profile, isAdmin } = useAuth();

  const isCrew = program === 'crew';
  const pageTitle = isCrew ? 'Apply for Boardly Crew' : 'Apply for Boardly Captain';
  const accentColor = isCrew ? '#6366f1' : '#f5b942';
  const otherRoute = isCrew ? '/captain/apply' : '/crew/apply';
  const otherLabel = isCrew ? 'Applying for Captain instead?' : 'Applying for Crew instead?';
  const backRoute = isCrew ? '/crew' : '/captain';

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [city, setCity] = useState('Islamabad');
  const [academicLevel, setAcademicLevel] = useState('FSC Pre-Medical (MDCAT)');
  const [notes, setNotes] = useState('');

  // Spam prevention
  const [honeypot, setHoneypot] = useState('');
  const [formLoadedAt] = useState<number>(() => Date.now());

  // Status & Validation
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Set document title
  useEffect(() => {
    document.title = `${pageTitle} | Boardly`;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pageTitle]);

  // Autofill if user profile is available
  useEffect(() => {
    if (user || profile) {
      if (!fullName) setFullName(profile?.name || user?.displayName || '');
      if (!email) setEmail(profile?.email || user?.email || '');
      if (!phone && profile?.phone) setPhone(profile.phone);
      if (!institution && profile?.targetUniversity) setInstitution(profile.targetUniversity);
    }
  }, [user, profile]);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (onNavigate) {
      onNavigate(href);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : `https://boardly.cfd/${program}/apply`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }).catch(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    });
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanInst = institution.trim();
    const cleanCity = city.trim();
    const cleanNotes = notes.trim();

    if (cleanName.length < 2) {
      errors.fullName = 'Please provide your full legal name.';
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      errors.email = 'Please enter a valid email address.';
    }
    if (cleanPhone.length < 8) {
      errors.phone = 'Please enter a valid phone number (at least 8 digits).';
    }
    if (!cleanInst) {
      errors.institution = 'Institution or College name is required.';
    }
    if (!cleanCity) {
      errors.city = 'City name is required.';
    }
    if (cleanNotes.length < 15) {
      errors.notes = 'Please provide at least 15 characters describing your plan.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanInst = institution.trim();
    const cleanNotes = notes.trim();

    if (isAdmin || cleanEmail === 'shsvirtualadmin@gmail.com') {
      setServerError('Administrator accounts cannot apply as student organizers or ambassadors.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          program,
          fullName: cleanName,
          email: cleanEmail,
          phone,
          institution: cleanInst,
          city,
          academicLevel,
          answers: cleanNotes,
          promotionPlan: cleanNotes,
          honeypot,
          formLoadedAt,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit application. Please try again.');
      }

      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setServerError(err?.message || 'Network error occurred. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#0b1020] text-[#0f172a] dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Centered Main Form Column: max-width 440px, padding 24px */}
      <main className="w-full max-w-[440px] mx-auto px-6 py-6 sm:py-10 flex-1">
        {/* Top: Back link + Boardly Logo */}
        <div className="flex items-center justify-between mb-8">
          <a
            href={backRoute}
            onClick={(e) => handleNav(e, backRoute)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back</span>
          </a>

          <a
            href="/"
            onClick={(e) => handleNav(e, '/')}
            className="cursor-pointer"
            aria-label="Boardly Home"
          >
            <BrandLogo size="md" variant="light" />
          </a>
        </div>

        {isSuccess ? (
          /* Confirmation Screen on Same Page (No Popup) */
          <div className="text-center py-8 space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-[26px] sm:text-[28px] font-bold text-[#0f172a] dark:text-white tracking-tight">
                Application received
              </h1>
              <p className="text-[15px] sm:text-[16px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Your application for Boardly {isCrew ? 'Crew' : 'Captain'} is under review. Our team will contact you within 24–48 hours via WhatsApp or email.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <a
                href="/"
                onClick={(e) => handleNav(e, '/')}
                className="w-full h-[52px] min-h-[52px] rounded-full font-bold text-base transition-all flex items-center justify-center shadow-xs cursor-pointer"
                style={{
                  backgroundColor: accentColor,
                  color: isCrew ? '#ffffff' : '#0f172a',
                }}
              >
                Back to Home
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer pt-2"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link copied!' : 'Copy application link'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Minimalist Application Form (Stacked) */
          <div>
            {/* Small Program Pill */}
            <div className="mb-3">
              <span
                className="inline-block text-[13px] font-semibold px-3 py-1 rounded-full border"
                style={{
                  backgroundColor: isCrew ? 'rgba(99, 102, 241, 0.08)' : 'rgba(245, 185, 66, 0.12)',
                  borderColor: isCrew ? 'rgba(99, 102, 241, 0.2)' : 'rgba(245, 185, 66, 0.3)',
                  color: isCrew ? '#4f46e5' : '#b45309',
                }}
              >
                {isCrew ? 'Boardly Crew' : 'Boardly Captain'}
              </span>
            </div>

            {/* Heading: 28px, weight 700 */}
            <h1 className="text-[28px] font-bold text-[#0f172a] dark:text-white tracking-tight leading-tight">
              {pageTitle}
            </h1>

            {/* Subtext: 16px, muted #64748b */}
            <p className="mt-2 text-[16px] text-[#64748b] dark:text-slate-400 leading-relaxed">
              {isCrew
                ? 'Help organize study events on your campus.'
                : 'Represent Boardly and lead your campus.'}
            </p>

            {/* Alternative Route Link */}
            <div className="mt-2.5 mb-8">
              <a
                href={otherRoute}
                onClick={(e) => handleNav(e, otherRoute)}
                className="text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white underline underline-offset-4 cursor-pointer transition-colors"
              >
                {otherLabel}
              </a>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {serverError}
              </div>
            )}

            {/* Form Fields: 20px between fields */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Honeypot field (hidden from view) */}
              <input
                type="text"
                name="website_verify"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              {/* 1. Full legal name */}
              <div>
                <label className="block text-[14px] font-semibold text-[#0f172a] dark:text-slate-200 mb-1.5">
                  Full legal name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                  }}
                  placeholder="e.g. Ayesha Khan"
                  className="w-full h-[52px] px-4 rounded-[14px] bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 text-[16px] text-[#0f172a] dark:text-white placeholder-[#94a3b8] outline-none transition-colors"
                  style={{
                    borderColor: fieldErrors.fullName ? '#f43f5e' : undefined,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = fieldErrors.fullName ? '#f43f5e' : '')}
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 text-[13px] text-rose-600 dark:text-rose-400 font-medium">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* 2. Email address */}
              <div>
                <label className="block text-[14px] font-semibold text-[#0f172a] dark:text-slate-200 mb-1.5">
                  Email address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="ayesha@example.com"
                  className="w-full h-[52px] px-4 rounded-[14px] bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 text-[16px] text-[#0f172a] dark:text-white placeholder-[#94a3b8] outline-none transition-colors"
                  style={{
                    borderColor: fieldErrors.email ? '#f43f5e' : undefined,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = fieldErrors.email ? '#f43f5e' : '')}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-[13px] text-rose-600 dark:text-rose-400 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              {/* 3. WhatsApp / Phone */}
              <div>
                <label className="block text-[14px] font-semibold text-[#0f172a] dark:text-slate-200 mb-1.5">
                  WhatsApp / Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  placeholder="0300 1234567"
                  className="w-full h-[52px] px-4 rounded-[14px] bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 text-[16px] text-[#0f172a] dark:text-white placeholder-[#94a3b8] outline-none transition-colors"
                  style={{
                    borderColor: fieldErrors.phone ? '#f43f5e' : undefined,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = fieldErrors.phone ? '#f43f5e' : '')}
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-[13px] text-rose-600 dark:text-rose-400 font-medium">{fieldErrors.phone}</p>
                )}
              </div>

              {/* 4. College / Campus */}
              <div>
                <label className="block text-[14px] font-semibold text-[#0f172a] dark:text-slate-200 mb-1.5">
                  College / Campus <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => {
                    setInstitution(e.target.value);
                    if (fieldErrors.institution) setFieldErrors((prev) => ({ ...prev, institution: '' }));
                  }}
                  placeholder="e.g. Punjab College, FAST-NU, GCU"
                  className="w-full h-[52px] px-4 rounded-[14px] bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 text-[16px] text-[#0f172a] dark:text-white placeholder-[#94a3b8] outline-none transition-colors"
                  style={{
                    borderColor: fieldErrors.institution ? '#f43f5e' : undefined,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = fieldErrors.institution ? '#f43f5e' : '')}
                />
                {fieldErrors.institution && (
                  <p className="mt-1 text-[13px] text-rose-600 dark:text-rose-400 font-medium">{fieldErrors.institution}</p>
                )}
              </div>

              {/* 5. City */}
              <div>
                <label className="block text-[14px] font-semibold text-[#0f172a] dark:text-slate-200 mb-1.5">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: '' }));
                  }}
                  placeholder="e.g. Lahore, Islamabad, Karachi"
                  className="w-full h-[52px] px-4 rounded-[14px] bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 text-[16px] text-[#0f172a] dark:text-white placeholder-[#94a3b8] outline-none transition-colors"
                  style={{
                    borderColor: fieldErrors.city ? '#f43f5e' : undefined,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = fieldErrors.city ? '#f43f5e' : '')}
                />
                {fieldErrors.city && (
                  <p className="mt-1 text-[13px] text-rose-600 dark:text-rose-400 font-medium">{fieldErrors.city}</p>
                )}
              </div>

              {/* 6. Academic level (select) */}
              <div>
                <label className="block text-[14px] font-semibold text-[#0f172a] dark:text-slate-200 mb-1.5">
                  Academic level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value)}
                  className="w-full h-[52px] px-4 rounded-[14px] bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 text-[16px] text-[#0f172a] dark:text-white outline-none cursor-pointer transition-colors"
                  onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '')}
                >
                  <option value="FSC Pre-Medical (MDCAT)">FSC Pre-Medical (MDCAT)</option>
                  <option value="FSC Pre-Engineering (ECAT/NET)">FSC Pre-Engineering (ECAT/NET)</option>
                  <option value="ICS Computer Science (FAST/NUST)">ICS Computer Science (FAST/NUST)</option>
                  <option value="A-Levels / Cambridge">A-Levels / Cambridge</option>
                  <option value="University Undergraduate">University Undergraduate</option>
                  <option value="Matric / Other">Matric / Other</option>
                </select>
              </div>

              {/* 7. How do you plan to share Boardly with your peers? (textarea, min 15 chars) */}
              <div>
                <label className="block text-[14px] font-semibold text-[#0f172a] dark:text-slate-200 mb-1.5">
                  How do you plan to share Boardly with your peers? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    if (fieldErrors.notes) setFieldErrors((prev) => ({ ...prev, notes: '' }));
                  }}
                  placeholder={
                    isCrew
                      ? 'e.g. I run a campus study group of 40 students and plan to host weekly timed Blitz mocks before board exams...'
                      : 'e.g. I will share practice drills in our academy WhatsApp groups and host study sessions...'
                  }
                  className="w-full p-4 rounded-[14px] bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 text-[16px] text-[#0f172a] dark:text-white placeholder-[#94a3b8] outline-none resize-none transition-colors leading-relaxed"
                  style={{
                    borderColor: fieldErrors.notes ? '#f43f5e' : undefined,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = fieldErrors.notes ? '#f43f5e' : '')}
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[12px] text-slate-500 dark:text-slate-400">
                    At least 15 characters required.
                  </span>
                  <span className="text-[12px] text-slate-400">
                    {notes.trim().length}/15
                  </span>
                </div>
                {fieldErrors.notes && (
                  <p className="mt-1 text-[13px] text-rose-600 dark:text-rose-400 font-medium">{fieldErrors.notes}</p>
                )}
              </div>

              {/* Submit button: full width, pill (radius 9999px), 56px tall, solid accent color, 16px bold */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-[56px] min-h-[56px] rounded-full font-bold text-[16px] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-[0.99] shadow-xs"
                  style={{
                    backgroundColor: accentColor,
                    color: isCrew ? '#ffffff' : '#0f172a',
                  }}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting application...</span>
                    </div>
                  ) : (
                    <span>Submit application</span>
                  )}
                </button>

                <p className="mt-3 text-center text-[13px] text-slate-500 dark:text-slate-400">
                  No sign-in required. Submissions are screened against spam.
                </p>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Small muted line at bottom: 48px bottom padding */}
      <footer className="w-full py-8 pb-12 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link copied!' : 'Copy application link'}</span>
          </button>
          <span>&copy; 2026 Boardly</span>
        </div>
      </footer>
    </div>
  );
};
export default ProgramApplicationPage;
