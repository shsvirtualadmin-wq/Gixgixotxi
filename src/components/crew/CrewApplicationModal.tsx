import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, Sparkles, Building, Mail, Phone, User, Send, Award, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { submitCrewApplication, CrewApplication } from '../../lib/firebase';

interface CrewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CrewApplicationModal: React.FC<CrewApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, profile } = useAuth();

  const [fullName, setFullName] = useState(profile?.name || user?.displayName || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [institution, setInstitution] = useState(profile?.targetUniversity || '');
  const [promotionPlan, setPromotionPlan] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync profile details if loaded
  useEffect(() => {
    if (profile) {
      if (!fullName) setFullName(profile.name || user?.displayName || '');
      if (!email) setEmail(profile.email || user?.email || '');
      if (!phone && profile.phone) setPhone(profile.phone);
      if (!institution && profile.targetUniversity) setInstitution(profile.targetUniversity);
    }
  }, [profile, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8 digits).');
      return;
    }
    if (!institution.trim()) {
      setErrorMessage('Institution Name is mandatory for ambassador tracking.');
      return;
    }
    if (!promotionPlan.trim() || promotionPlan.trim().length < 15) {
      setErrorMessage('Please share a brief note (at least 15 characters) on how you plan to promote Boardly.');
      return;
    }

    setSubmitting(true);
    try {
      const userId = user?.uid || `guest_${Date.now()}`;
      await submitCrewApplication({
        userId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        institution: institution.trim(),
        promotionPlan: promotionPlan.trim(),
      });

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Crew application error:', err);
      setErrorMessage(err?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 overflow-hidden animate-scale-in text-left my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          /* SUCCESS STATE */
          <div className="text-center py-6 space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-xl sm:text-2xl font-black text-[#0d1b3e] tracking-tight">
                Application Submitted!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your application for <span className="font-bold text-indigo-600">Boardly Crew</span> is now under review by our student ambassadorship team.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 text-left text-xs text-slate-700 space-y-2 mt-4">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Next steps:</strong> Once approved by the admin panel, your account will be upgraded to <strong className="text-indigo-700">30 Days of Free Premium Access</strong>, and you will unlock your personal referral dashboard.
                </p>
              </div>
              <div className="flex items-center gap-2 text-slate-500 pt-1 border-t border-indigo-100 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Typical review time: within 24-48 hours</span>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Back to Portal
              </button>
            </div>
          </div>
        ) : (
          /* FORM STATE */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Student Ambassador &amp; Internship</span>
              </div>
              <h2 className="text-2xl font-black text-[#0d1b3e] tracking-tight">
                Apply for Boardly Crew
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Represent Boardly and SHS Virtual Academy at your campus. Get 30 days of Premium access upon approval!
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-fade-in">
                {errorMessage}
              </div>
            )}

            <div className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ahmed Raza"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number (WhatsApp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Institution Name (MANDATORY) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institution / College / University Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Punjab Group of Colleges / Army Public / NUST"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Ambassadors represent Boardly specifically at their educational campus.
                </p>
              </div>

              {/* Promotion Plan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  How do you plan to promote Boardly? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={promotionPlan}
                  onChange={(e) => setPromotionPlan(e.target.value)}
                  placeholder="e.g. I will share my referral link in our batch WhatsApp study groups, host weekend mock test sprints with classmates, and introduce MDCAT/ECAT aspirants to Boardy AI..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none resize-none transition-all"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Application…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Ambassador Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
