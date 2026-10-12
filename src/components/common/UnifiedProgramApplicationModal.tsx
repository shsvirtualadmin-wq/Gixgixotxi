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
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
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
  const [academicLevel, setAcademicLevel] = useState('FSC / Pre-Medical / Pre-Engineering');
  const [notes, setNotes] = useState('');

  // Honeypot spam trap
  const [honeypot, setHoneypot] = useState('');
  const [formLoadedAt] = useState(() => Date.now());

  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="relative w-full max-w-lg my-8 bg-[#0b0a2a] text-white rounded-3xl border border-violet-500/30 shadow-2xl shadow-violet-950/80 overflow-hidden">
        {/* Subtle top ambient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-indigo-500 to-teal-400" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-violet-500/20 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-violet-950/80 text-violet-300 border border-violet-500/30">
              <Sparkles className="w-3 h-3 text-teal-400" />
              <span>Official Student Programs</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
              {program === 'crew' ? 'Apply for Boardly Crew' : 'Apply for Boardly Captain'}
            </h3>
            <p className="text-xs text-slate-300">
              {program === 'crew'
                ? 'Host official Blitz & Arena events for your campus. Approved organizers get the Crew role.'
                : 'Represent Boardly, share referral links, and compete on the national leaderboard.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            disabled={submitting}
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
              <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                Thank you for applying for{' '}
                <strong className="text-white">
                  {program === 'crew' ? 'Boardly Crew (Event Organizer)' : 'Boardly Captain (Campus Ambassador)'}
                </strong>
                . Our leadership committee reviews applications on a rolling basis within 24-48 hours.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-teal-300 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Next Steps:</span>
              </div>
              <p className="text-slate-400">
                1. If you submitted as a guest, when you sign in later with{' '}
                <strong className="text-white">{email}</strong>, your application will link to your account automatically.
              </p>
              <p className="text-slate-400">
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30 cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          /* Application Form */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {/* Program Switcher */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Choose Program</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProgram('crew')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    program === 'crew'
                      ? 'bg-violet-600/20 border-violet-500 text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Zap className="w-3.5 h-3.5 text-teal-400" />
                    <span>Boardly Crew</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Event Organizer</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProgram('captain')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    program === 'captain'
                      ? 'bg-amber-600/20 border-amber-500 text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Boardly Captain</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Campus Ambassador</div>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Daniyal Ahmed"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-violet-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-violet-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-violet-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-violet-400"
                  />
                </div>
              </div>
            </div>

            {/* Phone & Institution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp / Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-violet-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-violet-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">College / Campus *</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. GCU Lahore / Punjab College"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-violet-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-violet-400"
                  />
                </div>
              </div>
            </div>

            {/* City & Academic Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Islamabad, Lahore, Karachi"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-violet-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Level</label>
                <select
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-violet-500/30 text-white text-xs focus:outline-none focus:border-violet-400 cursor-pointer"
                >
                  <option value="FSC Pre-Medical">FSC Pre-Medical (MDCAT)</option>
                  <option value="FSC Pre-Engineering">FSC Pre-Engineering (ECAT/NET)</option>
                  <option value="ICS Computer Science">ICS Computer Science (FAST/NUST)</option>
                  <option value="A-Levels">A-Levels / Cambridge</option>
                  <option value="University Undergraduate">University Undergraduate</option>
                </select>
              </div>
            </div>

            {/* Note / Plan */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {program === 'crew'
                  ? 'How do you plan to organize events or mock drills? *'
                  : 'How do you plan to share Boardly with your peers? *'}
              </label>
              <textarea
                required
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  program === 'crew'
                    ? 'e.g. I run a study circle of 40 students and want to host weekly timed Blitz mocks before board exams...'
                    : 'e.g. I will share practice drills in our academy WhatsApp groups and host study sessions...'
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-violet-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-violet-400 resize-none"
              />
              <span className="text-[10px] text-slate-400">At least 15 characters required.</span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-500 hover:from-violet-500 hover:to-teal-400 text-white font-bold text-xs transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Application (Free)</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                No sign-in required. Submissions are screened against spam.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
