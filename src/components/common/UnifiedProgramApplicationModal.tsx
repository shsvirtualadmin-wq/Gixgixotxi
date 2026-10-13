import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
  Building,
  Mail,
  Phone,
  User,
  Send,
  Award,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface UnifiedApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProgram?: 'captain' | 'crew';
  onSuccess?: () => void;
}

export const UnifiedProgramApplicationModal: React.FC<UnifiedApplicationModalProps> = ({
  isOpen,
  onClose,
  defaultProgram = 'crew',
  onSuccess,
}) => {
  const { user, profile, isAdmin } = useAuth();

  const [program, setProgram] = useState<'captain' | 'crew'>(defaultProgram);
  const [fullName, setFullName] = useState(profile?.name || user?.displayName || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [institution, setInstitution] = useState(profile?.targetUniversity || '');
  const [city, setCity] = useState('');
  const [academicLevel, setAcademicLevel] = useState('FSC Pre-Medical (MDCAT)');
  const [notes, setNotes] = useState('');

  // Honeypot spam trap
  const [honeypot, setHoneypot] = useState('');
  const [formLoadedAt] = useState(() => Date.now());

  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Focus tracking for glow effects
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    setProgram(defaultProgram);
  }, [defaultProgram]);

  useEffect(() => {
    if (user || profile) {
      if (!fullName) setFullName(profile?.name || user?.displayName || '');
      if (!email) setEmail(profile?.email || user?.email || '');
      if (!phone && profile?.phone) setPhone(profile.phone);
      if (!institution && profile?.targetUniversity) setInstitution(profile.targetUniversity);
    }
  }, [user, profile]);

  // Lock body scroll behind modal only while modal is open, restore on close
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanInst = institution.trim();
    const cleanNotes = notes.trim();

    if (cleanName.length < 2) {
      setErrorMessage('Please provide your full legal name.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (cleanPhone.length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8 digits).');
      return;
    }
    if (!cleanInst) {
      setErrorMessage('Institution or College name is required.');
      return;
    }
    if (cleanNotes.length < 15) {
      setErrorMessage('Please share a brief note (minimum 15 characters) on your event plan or outreach goals.');
      return;
    }

    if (isAdmin || cleanEmail === 'shsvirtualadmin@gmail.com') {
      setErrorMessage('Administrator accounts cannot apply as student organizers or ambassadors.');
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
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error occurred. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const getGlassInputStyle = (fieldName: string): React.CSSProperties => {
    const isFocused = focusedField === fieldName;
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: isFocused ? '1px solid #1a6dff' : '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '16px',
      color: '#ffffff',
      boxShadow: isFocused ? '0 0 14px rgba(26, 109, 255, 0.4)' : 'none',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    };
  };

  return (
    /* The overlay is the ONE scroll container:
       position fixed, inset 0, height 100dvh, overflow-y auto, overscroll-behavior contain,
       -webkit-overflow-scrolling touch, padding 16px, padding-bottom 96px (plus safe-area)
       Layout: display flex, align-items flex-start, justify-content center */
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain flex items-start justify-center p-4"
      style={{
        height: '100dvh',
        paddingTop: 'max(16px, env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
        WebkitOverflowScrolling: 'touch',
        backgroundColor: 'rgba(13, 27, 62, 0.85)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      {/* Blurred background gradient orbs (blue #1a6dff, purple, teal) so blur is visible */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div
          className="absolute -top-16 -left-16 w-80 h-80 rounded-full blur-[100px] opacity-70 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #1a6dff 0%, rgba(26,109,255,0) 70%)' }}
        />
        <div
          className="absolute top-1/2 -right-20 -translate-y-1/2 w-80 h-80 rounded-full blur-[90px] opacity-60 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, rgba(139,92,246,0) 70%)' }}
        />
        <div
          className="absolute -bottom-20 left-1/4 w-80 h-80 rounded-full blur-[90px] opacity-50 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #14b8a6 0%, rgba(20,184,166,0) 70%)' }}
        />
      </div>

      {/* Modal Card:
          margin: auto 0 (centers only when short, scrolls naturally when tall)
          NO fixed height, NO max-height, NO overflow-hidden.
          Height: auto, grows to fit content. */}
      <div
        className="relative w-full max-w-lg text-white shadow-2xl"
        style={{
          margin: 'auto 0',
          height: 'auto',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          borderRadius: '28px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top ambient accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#1a6dff] via-[#8b5cf6] to-[#14b8a6] rounded-t-[28px]" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-white/10 flex items-start justify-between">
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-white/10 text-white border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-[#14b8a6]" />
              <span>Official student programs</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              {program === 'crew' ? 'Apply for Boardly Crew' : 'Apply for Boardly Captain'}
            </h3>
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              {program === 'crew'
                ? 'Host official Blitz & Arena events for your campus. Approved organizers get the Crew role.'
                : 'Represent Boardly, share referral links, and compete on the national leaderboard.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0 ml-3"
            disabled={submitting}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xl font-bold text-white">Application Received!</h4>
              <p className="text-[13px] sm:text-sm max-w-sm mx-auto leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Thank you for applying for{' '}
                <strong className="text-white">
                  {program === 'crew' ? 'Boardly Crew (Event Organizer)' : 'Boardly Captain (Campus Ambassador)'}
                </strong>
                . Our leadership committee reviews applications on a rolling basis within 24-48 hours.
              </p>
            </div>

            <div
              className="p-4 rounded-[16px] text-left text-xs space-y-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div className="flex items-center gap-2 text-[#14b8a6] font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Next Steps:</span>
              </div>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                1. If you submitted as a guest, when you sign in later with{' '}
                <strong className="text-white">{email}</strong>, your application will link to your account automatically.
              </p>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                2. Once approved, your account unlocks the{' '}
                <strong className="text-white">
                  {program === 'crew' ? 'Crew Organizer Portal' : 'Captain Dashboard'}
                </strong>
                .
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[52px] h-[52px] py-3.5 rounded-full overflow-hidden bg-gradient-to-r from-[#1a6dff] via-[#2563eb] to-[#0d9488] hover:from-[#2563eb] hover:to-[#0f766e] text-white text-base font-bold transition-all shadow-[0_0_20px_rgba(26,109,255,0.4)] cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          /* Application Form */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-left">
            {/* Program Switcher - Glass Pills */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-white">Choose Program</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setProgram('crew')}
                  className="p-3.5 rounded-[16px] text-left transition-all cursor-pointer relative"
                  style={{
                    backgroundColor: program === 'crew' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                    border: program === 'crew' ? '1px solid #1a6dff' : '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: program === 'crew' ? '0 0 16px rgba(26, 109, 255, 0.4)' : 'none',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <Zap className="w-3.5 h-3.5 text-[#14b8a6]" />
                    <span>Boardly Crew</span>
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Event Organizer
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProgram('captain')}
                  className="p-3.5 rounded-[16px] text-left transition-all cursor-pointer relative"
                  style={{
                    backgroundColor: program === 'captain' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                    border: program === 'captain' ? '1px solid #f5b942' : '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: program === 'captain' ? '0 0 16px rgba(245, 185, 66, 0.4)' : 'none',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <Award className="w-3.5 h-3.5 text-[#f5b942]" />
                    <span>Boardly Captain</span>
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Campus Ambassador
                  </div>
                </button>
              </div>
            </div>

            {/* Honeypot hidden input for anti-bot spam protection */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-white mb-1">Full Legal Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. Daniyal Ahmed"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/40 outline-none"
                    style={getGlassInputStyle('fullName')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-white mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="student@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/40 outline-none"
                    style={getGlassInputStyle('email')}
                  />
                </div>
              </div>
            </div>

            {/* Phone & Institution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-white mb-1">WhatsApp / Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="03001234567"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/40 outline-none"
                    style={getGlassInputStyle('phone')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-white mb-1">College / Campus *</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    onFocus={() => setFocusedField('institution')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. GCU Lahore / Punjab College"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-white/40 outline-none"
                    style={getGlassInputStyle('institution')}
                  />
                </div>
              </div>
            </div>

            {/* City & Academic Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-white mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onFocus={() => setFocusedField('city')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="e.g. Islamabad, Lahore, Karachi"
                  className="w-full px-3.5 py-2.5 text-xs text-white placeholder-white/40 outline-none"
                  style={getGlassInputStyle('city')}
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-white mb-1">Academic Level</label>
                <select
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value)}
                  onFocus={() => setFocusedField('academicLevel')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer"
                  style={getGlassInputStyle('academicLevel')}
                >
                  <option value="FSC Pre-Medical (MDCAT)" style={{ backgroundColor: '#0d1b3e', color: '#ffffff' }}>
                    FSC Pre-Medical (MDCAT)
                  </option>
                  <option value="FSC Pre-Engineering (ECAT/NET)" style={{ backgroundColor: '#0d1b3e', color: '#ffffff' }}>
                    FSC Pre-Engineering (ECAT/NET)
                  </option>
                  <option value="ICS Computer Science (FAST/NUST)" style={{ backgroundColor: '#0d1b3e', color: '#ffffff' }}>
                    ICS Computer Science (FAST/NUST)
                  </option>
                  <option value="A-Levels / Cambridge" style={{ backgroundColor: '#0d1b3e', color: '#ffffff' }}>
                    A-Levels / Cambridge
                  </option>
                  <option value="University Undergraduate" style={{ backgroundColor: '#0d1b3e', color: '#ffffff' }}>
                    University Undergraduate
                  </option>
                </select>
              </div>
            </div>

            {/* Note / Plan */}
            <div>
              <label className="block text-[13px] font-semibold text-white mb-1">
                {program === 'crew'
                  ? 'How do you plan to organize events or mock drills? *'
                  : 'How do you plan to share Boardly with your peers? *'}
              </label>
              <textarea
                required
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onFocus={() => setFocusedField('notes')}
                onBlur={() => setFocusedField(null)}
                placeholder={
                  program === 'crew'
                    ? 'e.g. I run a study circle of 40 students and want to host weekly timed Blitz mocks before board exams...'
                    : 'e.g. I will share practice drills in our academy WhatsApp groups and host study sessions...'
                }
                className="w-full px-3.5 py-2.5 text-xs text-white placeholder-white/40 outline-none resize-none"
                style={getGlassInputStyle('notes')}
              />
              <span className="text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                At least 15 characters required.
              </span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-[14px] bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[52px] h-[52px] py-3.5 px-6 rounded-full overflow-hidden bg-gradient-to-r from-[#1a6dff] via-[#2563eb] to-[#0d9488] hover:from-[#2563eb] hover:to-[#0f766e] text-white font-bold text-base transition-all shadow-[0_0_20px_rgba(26,109,255,0.4)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Application (Free)</span>
                  </>
                )}
              </button>
              <p className="text-[12px] text-center mt-3" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                No sign-in required. Submissions are screened against spam.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default UnifiedProgramApplicationModal;
