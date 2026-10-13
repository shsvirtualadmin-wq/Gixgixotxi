import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Share2, Trophy, Home } from 'lucide-react';
import { BrandLogo } from '../marketing/BrandLogo';
import {
  getArenaConfig,
  submitArenaRegistration,
  ArenaSessionConfig,
  DEFAULT_ARENA_CONFIG,
} from '../../lib/arenaApi';
import { ARENA_URL } from '../../config/site';

interface ArenaRegisterPageProps {
  onNavigate: (route: string) => void;
}

const ACADEMIC_LEVELS = [
  'FSc Pre-Engineering',
  'MDCAT / Pre-Medical',
  'ICS / Computer Science',
  'Matric (Class 9-10)',
  'Engineering Entry Test (NET / FAST / ECAT / GIKI)',
  'Medical Entry Test (NUMS / MDCAT)',
  'University Undergraduate',
  'Other / General',
];

export const ArenaRegisterPage: React.FC<ArenaRegisterPageProps> = ({ onNavigate }) => {
  const [config, setConfig] = useState<ArenaSessionConfig>(DEFAULT_ARENA_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [campus, setCampus] = useState('');
  const [city, setCity] = useState('');
  const [academicLevel, setAcademicLevel] = useState(ACADEMIC_LEVELS[0]);
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [formLoadedAt] = useState<number>(Date.now());

  // Status & Validation
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Sync SEO metadata
    document.title = 'Register for Boardly Arena';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Free entry. Takes about a minute.');
    }

    getArenaConfig()
      .then((cfg) => {
        setConfig(cfg);
        setLoadingConfig(false);
      })
      .catch(() => {
        setLoadingConfig(false);
      });
  }, []);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    onNavigate(href);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Join me on Boardly Arena: ${ARENA_URL}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanCampus = campus.trim();

    if (!cleanName || cleanName.length < 2) {
      errors.fullName = 'Please enter your full legal name.';
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!cleanPhone || cleanPhone.length < 8) {
      errors.phone = 'Please enter a valid WhatsApp or phone number (at least 8 digits).';
    }

    if (!cleanCampus || cleanCampus.length < 2) {
      errors.campus = 'Please enter your college, school, or campus name.';
    }

    if (!consent) {
      errors.consent = 'You must agree to the Terms and Privacy Policy to register.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await submitArenaRegistration({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        campus: campus.trim(),
        city: city.trim(),
        academicLevel,
        consent,
        honeypot,
        formLoadedAt,
      });

      if (res.success) {
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setServerError(err?.message || 'Error completing registration. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // CLOSED STATE VIEW (when registrationOpen is false)
  // -------------------------------------------------------------
  if (!loadingConfig && !config.registrationOpen) {
    return (
      <div className="min-h-screen w-full bg-white text-[#0f172a] font-sans flex flex-col justify-between selection:bg-[#1a6dff] selection:text-white">
        <main className="w-full max-w-[440px] mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
          {/* Logo top-left */}
          <div className="mb-8">
            <a href="/" onClick={(e) => handleNav(e, '/')} aria-label="Boardly Home">
              <BrandLogo size="md" variant="light" />
            </a>
          </div>

          {/* Small blue label */}
          <div className="mb-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#f5f7ff] border border-[#dbe3f5] text-[#1a6dff] text-[13px] font-semibold">
              Boardly Arena
            </span>
          </div>

          {/* Heading: 32px bold */}
          <h1 className="text-[32px] font-extrabold text-[#0f172a] leading-tight font-display">
            Registration is closed for now
          </h1>

          {/* Text */}
          <p className="mt-3 text-[16px] text-[#475569] leading-relaxed">
            There's no Arena session open right now. The next one opens soon, so check back then.
          </p>

          {/* Two stacked pill buttons */}
          <div className="mt-8 space-y-3">
            <a
              href="/arena/leaderboard"
              onClick={(e) => handleNav(e, '/arena/leaderboard')}
              className="w-full h-[54px] rounded-full bg-[#1a6dff] hover:bg-blue-700 text-white font-bold text-[16px] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            >
              See the leaderboard
            </a>

            <a
              href="/arena"
              onClick={(e) => handleNav(e, '/arena')}
              className="w-full h-[54px] rounded-full bg-white hover:bg-slate-50 border border-[#dbe3f5] text-[#0f172a] font-bold text-[16px] flex items-center justify-center transition-colors cursor-pointer"
            >
              Back to Boardly Arena
            </a>
          </div>

          {/* Footer links */}
          <div className="mt-16 pt-6 border-t border-[#e2e8f0] text-center text-[13px] text-slate-500 space-x-4">
            <a
              href="/terms"
              onClick={(e) => handleNav(e, '/terms')}
              className="hover:text-slate-800 transition-colors"
            >
              Terms
            </a>
            <span>·</span>
            <a
              href="/privacy"
              onClick={(e) => handleNav(e, '/privacy')}
              className="hover:text-slate-800 transition-colors"
            >
              Privacy
            </a>
            <span>·</span>
            <span>&copy; 2026 Boardly</span>
          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // OPEN STATE: REGISTRATION FORM VIEW
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen w-full bg-white text-[#0f172a] font-sans flex flex-col justify-between selection:bg-[#1a6dff] selection:text-white">
      <main className="w-full max-w-[440px] mx-auto px-6 py-8 sm:py-12 flex-1">
        {/* Top: Back link to /arena + Boardly logo */}
        <div className="flex items-center justify-between mb-8">
          <a
            href="/arena"
            onClick={(e) => handleNav(e, '/arena')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back</span>
          </a>

          <a href="/" onClick={(e) => handleNav(e, '/')} aria-label="Boardly Home">
            <BrandLogo size="md" variant="light" />
          </a>
        </div>

        {isSuccess ? (
          /* SUCCESS STATE ON SAME PAGE (NO POPUP) */
          <div className="text-center py-6 space-y-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight font-display">
                Registration received
              </h1>
              <p className="text-[16px] text-[#475569] leading-relaxed">
                We'll email you as soon as it's approved.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full h-[52px] rounded-full bg-[#10b981] hover:bg-emerald-600 text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </button>

              <a
                href="/arena/leaderboard"
                onClick={(e) => handleNav(e, '/arena/leaderboard')}
                className="w-full h-[52px] rounded-full bg-white hover:bg-slate-50 border border-[#dbe3f5] text-[#0f172a] font-bold text-[15px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-[#1a6dff]" />
                <span>View leaderboard</span>
              </a>

              <a
                href="/"
                onClick={(e) => handleNav(e, '/')}
                className="w-full h-[52px] rounded-full bg-slate-100 hover:bg-slate-200 text-[#0f172a] font-bold text-[15px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4 text-slate-500" />
                <span>Back to Home</span>
              </a>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM */
          <div>
            {/* Small blue pill */}
            <div className="mb-3">
              <span className="inline-block px-3 py-1 rounded-full bg-[#f5f7ff] border border-[#dbe3f5] text-[#1a6dff] text-[13px] font-semibold">
                Boardly Arena
              </span>
            </div>

            {/* Heading: 28px bold */}
            <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight leading-tight font-display">
              Register for Boardly Arena
            </h1>

            {/* One line subtitle */}
            <p className="mt-1.5 text-[15px] text-[#64748b]">
              Free entry. Takes about a minute.
            </p>

            {/* Server Error Alert */}
            {serverError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed">
                {serverError}
              </div>
            )}

            {/* Form Fields: label above, 52px inputs, radius 14px */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {/* Honeypot field */}
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

              {/* 1. Full name * */}
              <div>
                <label className="block text-[14px] font-semibold text-[#0f172a] mb-1.5">
                  Full name <span className="text-rose-500">*</span>
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
                  className="w-full h-[52px] px-4 rounded-[14px] bg-white border border-[#e2e8f0] text-[16px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-colors focus:border-[#1a6dff]"
                  style={{
                    borderColor: fieldErrors.fullName ? '#f43f5e' : undefined,
                  }}
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 text-[13px] text-rose-600 font-medium">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* 2. Email * */}
              <div>
                <label className="block text-[14px] font-semibold text-[#0f172a] mb-1.5">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="e.g. student@example.com"
                  className="w-full h-[52px] px-4 rounded-[14px] bg-white border border-[#e2e8f0] text-[16px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-colors focus:border-[#1a6dff]"
                  style={{
                    borderColor: fieldErrors.email ? '#f43f5e' : undefined,
                  }}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-[13px] text-rose-600 font-medium">{fieldErrors.email}</p>
                )}
              </div>

              {/* 3. WhatsApp / Phone * */}
              <div>
                <label className="block text-[14px] font-semibold text-[#0f172a] mb-1.5">
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
                  placeholder="e.g. 0300 1234567"
                  className="w-full h-[52px] px-4 rounded-[14px] bg-white border border-[#e2e8f0] text-[16px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-colors focus:border-[#1a6dff]"
                  style={{
                    borderColor: fieldErrors.phone ? '#f43f5e' : undefined,
                  }}
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-[13px] text-rose-600 font-medium">{fieldErrors.phone}</p>
                )}
              </div>

              {/* 4. College / Campus * */}
              <div>
                <label className="block text-[14px] font-semibold text-[#0f172a] mb-1.5">
                  College / Campus <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={campus}
                  onChange={(e) => {
                    setCampus(e.target.value);
                    if (fieldErrors.campus) setFieldErrors((prev) => ({ ...prev, campus: '' }));
                  }}
                  placeholder="e.g. Punjab College, Lahore"
                  className="w-full h-[52px] px-4 rounded-[14px] bg-white border border-[#e2e8f0] text-[16px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-colors focus:border-[#1a6dff]"
                  style={{
                    borderColor: fieldErrors.campus ? '#f43f5e' : undefined,
                  }}
                />
                {fieldErrors.campus && (
                  <p className="mt-1 text-[13px] text-rose-600 font-medium">{fieldErrors.campus}</p>
                )}
              </div>

              {/* 5. City */}
              <div>
                <label className="block text-[14px] font-semibold text-[#0f172a] mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Islamabad"
                  className="w-full h-[52px] px-4 rounded-[14px] bg-white border border-[#e2e8f0] text-[16px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-colors focus:border-[#1a6dff]"
                />
              </div>

              {/* 6. Academic level (select) */}
              <div>
                <label className="block text-[14px] font-semibold text-[#0f172a] mb-1.5">
                  Academic level
                </label>
                <select
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value)}
                  className="w-full h-[52px] px-4 rounded-[14px] bg-white border border-[#e2e8f0] text-[16px] text-[#0f172a] outline-none transition-colors focus:border-[#1a6dff] cursor-pointer"
                >
                  {ACADEMIC_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* Consent Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (fieldErrors.consent) setFieldErrors((prev) => ({ ...prev, consent: '' }));
                    }}
                    className="mt-1 w-4 h-4 rounded text-[#1a6dff] focus:ring-[#1a6dff] cursor-pointer"
                  />
                  <span className="text-[14px] text-[#475569] leading-relaxed">
                    I agree to the{' '}
                    <a
                      href="/terms"
                      onClick={(e) => handleNav(e, '/terms')}
                      className="text-[#1a6dff] underline hover:text-blue-800"
                    >
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                      href="/privacy"
                      onClick={(e) => handleNav(e, '/privacy')}
                      className="text-[#1a6dff] underline hover:text-blue-800"
                    >
                      Privacy Policy
                    </a>
                    , and to receive Arena updates on WhatsApp or email.
                  </span>
                </label>
                {fieldErrors.consent && (
                  <p className="mt-1 text-[13px] text-rose-600 font-medium">{fieldErrors.consent}</p>
                )}
              </div>

              {/* Submit Pill Button: 56px, solid #1a6dff */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-[56px] rounded-full bg-[#1a6dff] hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-[16px] flex items-center justify-center shadow-md shadow-[#1a6dff]/25 transition-all cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Register for Arena'}
                </button>

                <p className="mt-2 text-center text-[13px] text-[#64748b]">
                  No payment needed. Your details are used only for Arena.
                </p>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
