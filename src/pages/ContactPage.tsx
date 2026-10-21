import { useState, useEffect } from 'react';
import { Mail, MessageCircle, Phone, Send, CheckCircle2, AlertCircle, Clock, ArrowLeft } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';

export function ContactPage() {
  const navigate = useNavigate();
  const { user, profileLoading } = useAuth();
  const { profile } = useUserProfile();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    website: '', // honeypot
  });

  // Prefill name and email from profile/user when available (user can still freely edit)
  useEffect(() => {
    if (user || profile) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name ? prev.name : (profile?.displayName || user?.displayName || ''),
        email: prev.email ? prev.email : (profile?.email || user?.email || ''),
      }));
    }
  }, [user, profile]);

  // If a student's active session really expired, redirect to login and bring them back after signing in
  useEffect(() => {
    if (!profileLoading && !user) {
      try {
        const wasAuthenticated = localStorage.getItem('boardly_user_authenticated') === 'true';
        if (wasAuthenticated) {
          navigate('/login?redirect=/contact', { replace: true });
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, [user, profileLoading, navigate]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const [formLoadedAt] = useState<number>(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [ticketSavedOnly, setTicketSavedOnly] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = () => {
    const errors: Record<string, string> = {};
    const name = formData.name.trim();
    const email = formData.email.trim();
    const message = formData.message.trim();

    if (!name || name.length < 2) {
      errors.name = 'Please enter your name (at least 2 characters).';
    } else if (name.length > 80) {
      errors.name = 'Name cannot exceed 80 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!message || message.length < 10) {
      errors.message = 'Message must be at least 10 characters long.';
    } else if (message.length > 2000) {
      errors.message = 'Message cannot exceed 2,000 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSubmittedSuccess(false);
    setTicketSavedOnly(false);

    if (!validate() || submitting) return;

    setSubmitting(true);
    let firestoreTicketSaved = false;

    // Step 1: Save ticket to Firestore "supportTickets" collection first as guaranteed backup
    try {
      await addDoc(collection(db, 'supportTickets'), {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || '',
        message: formData.message.trim(),
        status: 'open',
        pageOrigin: window.location.href,
        createdAt: serverTimestamp(),
      });
      firestoreTicketSaved = true;
    } catch (dbErr) {
      console.warn('[ContactPage] Could not save support ticket to Firestore:', dbErr);
    }

    // Step 2: Trigger server-side Resend email notification via /api/contact
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          message: formData.message.trim(),
          pageUrl: window.location.href,
          honeypot: formData.website,
          formLoadedAt,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.success) {
        setSubmittedSuccess(true);
        setFormData({ name: '', email: '', phone: '', message: '', website: '' });
      } else {
        if (firestoreTicketSaved) {
          // Ticket saved, but email notification failed
          setTicketSavedOnly(true);
        } else {
          setServerError(
            data?.error ||
              'We were unable to deliver your message. Please reach out via WhatsApp at 0305 8969050.'
          );
        }
      }
    } catch {
      if (firestoreTicketSaved) {
        setTicketSavedOnly(true);
      } else {
        setServerError(
          'Network connection error. You can also reach our team on WhatsApp at 0305 8969050.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Contact Student Support — Boardly"
        description="Get in touch with Boardly Technologies support team in Pakistan. Reach us via WhatsApp at 0305 8969050 or email at support@boardly.cfd."
      />

      <div className="pt-4 sm:pt-6 pb-20 boardly-container page-enter space-y-8 sm:space-y-12">
        {/* In-app Back Navigation Link (visible when signed in) */}
        {user && (
          <div className="max-w-5xl mx-auto -mb-4 sm:-mb-6">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-1.5 px-3 -ml-3 rounded-xl hover:bg-[var(--surface-muted)] cursor-pointer"
              aria-label="Back to previous page"
            >
              <ArrowLeft size={18} className="shrink-0" />
              <span>Back</span>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="section-header max-w-3xl mx-auto text-center space-y-4">
          <Badge color="red">Student Helpdesk</Badge>
          <h1
            className="text-3xl sm:text-5xl font-extrabold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Contact Boardly Support
          </h1>
          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
            Need assistance with your plan activation, Study Squad, or reporting a question formula error? Our support desk responds directly to every student.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Phone & WhatsApp Card */}
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-[var(--red)] flex items-center justify-center">
                <MessageCircle size={20} />
              </div>
              <div>
                <h3
                  className="text-base font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  Phone &amp; WhatsApp Support
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Fastest response for urgent test session queries and payment confirmations.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <div className="text-base font-bold text-[var(--text)] font-mono">
                  0305 8969050
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="https://wa.me/923058969050"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white transition-colors"
                  >
                    <span>Open WhatsApp</span>
                  </a>
                  <a
                    href="tel:+923058969050"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--red)] transition-colors"
                  >
                    <Phone size={12} />
                    <span>Call Direct</span>
                  </a>
                </div>
              </div>
            </Card>

            {/* Email Card */}
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-[var(--text)] flex items-center justify-center">
                <Mail size={20} />
              </div>
              <div>
                <h3
                  className="text-base font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  Official Support Email
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Direct inbox for institutional partnerships, campus captain applications, and data requests.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href="mailto:support@boardly.cfd"
                  className="text-sm font-semibold text-[var(--red)] hover:underline break-all"
                >
                  support@boardly.cfd
                </a>
              </div>
            </Card>

            {/* Operating Hours Card */}
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-[var(--muted)] flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <h3
                  className="text-base font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  Desk Response Hours
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                  Monday &ndash; Saturday: 10:00 AM &ndash; 10:00 PM PKT (Asia/Karachi). Inquiries sent late at night are resolved the following morning.
                </p>
              </div>
            </Card>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-7">
            <Card className="p-6 sm:p-8 space-y-6">
              <div>
                <h2
                  className="text-xl font-bold text-[var(--text)]"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  Send an Inquiry
                </h2>
                <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                  Fill out the form below. We log every student ticket and reply within 24 hours.
                </p>
              </div>

              {submittedSuccess && (
                <div className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-center space-y-2">
                  <CheckCircle2 size={32} className="text-[#10b981] mx-auto" />
                  <h3 className="text-base font-bold text-[var(--text)]">Message Sent Successfully!</h3>
                  <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                    Thank you. We received your inquiry and our support team will reply to your email address shortly.
                  </p>
                  <button
                    onClick={() => setSubmittedSuccess(false)}
                    className="btn-outline text-xs mt-3"
                    style={{ height: '40px' }}
                  >
                    Send Another Message
                  </button>
                </div>
              )}

              {ticketSavedOnly && (
                <div className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 text-[var(--text)] font-semibold text-sm">
                    <CheckCircle2 size={18} className="text-[var(--red)]" />
                    <span>Inquiry Logged on Helpdesk</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                    We saved your inquiry but couldn&apos;t send the automated email notification. You can also reach us directly on WhatsApp at{' '}
                    <strong className="text-[var(--text)]">0305 8969050</strong> for instant assistance.
                  </p>
                  <div className="pt-2">
                    <a
                      href="https://wa.me/923058969050"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-[#10b981] text-white"
                    >
                      Chat on WhatsApp (0305 8969050)
                    </a>
                  </div>
                </div>
              )}

              {serverError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              {!submittedSuccess && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot field (hidden from real users) */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="contact-website">Website</label>
                    <input
                      id="contact-website"
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {/* Name field */}
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="text-xs font-semibold text-[var(--text)] block mb-1.5"
                    >
                      Your Full Name <span className="text-[var(--red)]">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ayesha Khan"
                      className={`w-full rounded-2xl px-4 py-3 bg-[var(--surface-2)] border text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] transition-colors ${
                        fieldErrors.name ? 'border-[var(--red)]' : 'border-[var(--border)]'
                      }`}
                      style={{ height: '52px' }}
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-[var(--red)] mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  {/* Email & Phone fields in grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="text-xs font-semibold text-[var(--text)] block mb-1.5"
                      >
                        Email Address <span className="text-[var(--red)]">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="student@example.com"
                        className={`w-full rounded-2xl px-4 py-3 bg-[var(--surface-2)] border text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] transition-colors ${
                          fieldErrors.email ? 'border-[var(--red)]' : 'border-[var(--border)]'
                        }`}
                        style={{ height: '52px' }}
                      />
                      {fieldErrors.email && (
                        <p className="text-xs text-[var(--red)] mt-1">{fieldErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contact-phone"
                        className="text-xs font-semibold text-[var(--text)] block mb-1.5"
                      >
                        Phone / WhatsApp (Optional)
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0300 1234567"
                        className="w-full rounded-2xl px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] transition-colors"
                        style={{ height: '52px' }}
                      />
                    </div>
                  </div>

                  {/* Message field */}
                  <div>
                    <label
                      htmlFor="contact-message"
                      className="text-xs font-semibold text-[var(--text)] block mb-1.5"
                    >
                      Message / Question <span className="text-[var(--red)]">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your inquiry, payment slip reference, or technical question..."
                      maxLength={2000}
                      className={`w-full rounded-2xl p-4 bg-[var(--surface-2)] border text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] transition-colors ${
                        fieldErrors.message ? 'border-[var(--red)]' : 'border-[var(--border)]'
                      }`}
                    />
                    <div className="flex justify-between items-center text-[11px] text-[var(--muted)] mt-1">
                      {fieldErrors.message ? (
                        <span className="text-[var(--red)]">{fieldErrors.message}</span>
                      ) : (
                        <span>Minimum 10 characters</span>
                      )}
                      <span>{formData.message.length} / 2,000</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    By submitting this inquiry, you agree to our{' '}
                    <Link to="/terms" className="underline hover:text-[var(--text)]">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="underline hover:text-[var(--text)]">
                      Privacy Policy
                    </Link>
                    .
                  </p>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-red w-full flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    style={{ height: '52px' }}
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send Inquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default ContactPage;
