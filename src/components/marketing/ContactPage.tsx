import React, { useState } from 'react';
import { Mail, Phone, MessageCircle, MapPin, Send, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { MarketingPage } from './Navbar';

interface ContactPageProps {
  onNavigate: (page: MarketingPage) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'academic',
    message: '',
  });

  const [renderTime] = useState<number>(() => Date.now());
  const [honeypot, setHoneypot] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{ text: string; showWhatsApp?: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          _hp: honeypot,
          renderedAt: renderTime,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Non-JSON response (e.g. HTML from SPA fallback or Cloudflare proxy)
        setErrorMessage({
          text: "Couldn't send right now. Please message us on WhatsApp",
          showWhatsApp: true,
        });
        return;
      }

      let data: any;
      try {
        data = await res.json();
      } catch {
        setErrorMessage({
          text: "Couldn't send right now. Please message us on WhatsApp",
          showWhatsApp: true,
        });
        return;
      }

      // Show success only when ok is true
      if (res.ok && data.ok) {
        setSubmitted(true);
      } else {
        setErrorMessage({
          text: data.error || "Couldn't send right now. Please message us on WhatsApp",
          showWhatsApp: true,
        });
      }
    } catch (err: any) {
      console.warn('[Contact dispatch error]:', err);
      setErrorMessage({
        text: "Couldn't send right now. Please message us on WhatsApp",
        showWhatsApp: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      category: 'academic',
      message: '',
    });
    setHoneypot('');
    setSubmitted(false);
    setErrorMessage(null);
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-14">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
          <MessageCircle className="w-3.5 h-3.5 text-indigo-600" />
          <span>We're Here to Help</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#0A1330] font-poppins tracking-tight">
          Get in Touch with Boardly
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Have an inquiry regarding syllabus questions, institutional group access, or payment confirmation? Send us a message or chat with our team directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Info Cards (Left Column) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Direct Support & Community WhatsApp Card */}
          <div className="p-6 sm:p-7 rounded-[26px] bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                Official WhatsApp
              </span>
              <MessageCircle className="w-6 h-6 text-[#25D366]" />
            </div>
            <h3 className="text-xl font-bold font-poppins">
              Direct Support & Community
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Message our academic team directly on WhatsApp for test support, or join our community of students preparing together.
            </p>
            <div className="space-y-2.5 pt-1">
              <a
                href="https://wa.me/923058969050"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-bold text-sm shadow-md transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950 stroke-none" />
                <span>Message SHS Virtual Academy on WhatsApp</span>
              </a>
              <a
                href="https://chat.whatsapp.com/FTXFo4P7kct0L047d5zRGy?s=cl&p=a&mlu=4&ilr=4"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Join the Student Corner Community</span>
              </a>
            </div>
          </div>

          {/* Email Support Card */}
          <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Email Inquiries</h4>
            <p className="text-xs text-slate-500">
              General Support & Academic Queries:
            </p>
            <a
              href="mailto:support@boardly.cfd"
              className="text-sm font-semibold text-indigo-600 hover:underline block"
            >
              support@boardly.cfd
            </a>
            <p className="text-xs text-slate-500 pt-1">
              Administrator Contact:
            </p>
            <a
              href="mailto:shsvirtualadmin@gmail.com"
              className="text-sm font-semibold text-slate-700 hover:underline block"
            >
              shsvirtualadmin@gmail.com
            </a>
          </div>

          {/* Operational Hours */}
          <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Support Availability</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Monday through Saturday: 9:00 AM – 10:00 PM PKT<br />
              Sunday (Boardly Blitz & Arena hours): 12:00 PM – 11:00 PM PKT
            </p>
          </div>
        </div>

        {/* Contact Form (Right Column) */}
        <div className="lg:col-span-7">
          <div className="p-8 sm:p-10 rounded-[28px] bg-white border border-slate-200/90 shadow-xl shadow-slate-900/5">
            {submitted ? (
              <div className="text-center py-12 space-y-5 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold font-poppins text-slate-900">
                  Message Sent Successfully!
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{formData.name}</strong>. An academic coordinator has received your inquiry and will respond to <strong>{formData.email}</strong> within 12 hours.
                </p>
                <div className="pt-4">
                  <button
                    onClick={handleReset}
                    className="px-6 py-2.5 rounded-full text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-poppins text-[#0A1330]">
                    Send Us a Message
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fill out the form below and we’ll get back to you promptly.
                  </p>
                </div>

                {/* Honeypot field for bot protection (hidden from users) */}
                <input
                  type="text"
                  name="_hp"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ display: 'none', position: 'absolute', left: '-9999px' }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {/* Error Banner with WhatsApp fallback link */}
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs sm:text-sm space-y-2 animate-in fade-in">
                    <p className="font-semibold">{errorMessage.text}</p>
                    {errorMessage.showWhatsApp && (
                      <div className="pt-1">
                        <a
                          href="https://wa.me/923058969050"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" />
                          <span>Message us on WhatsApp (+92 305 8969050)</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Fatima Ali"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@gmail.com"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      WhatsApp / Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0300-1234567"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Inquiry Topic
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="academic">Academic / Question Explanation Inquiry</option>
                    <option value="billing">Subscription & Payment Verification (JazzCash/Easypaisa)</option>
                    <option value="captains">Study Circles / Campus Captains Application</option>
                    <option value="technical">Technical Feedback or Feature Suggestion</option>
                  </select>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide details about your question, selected board, or transaction ID..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-y"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 glow-btn flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99] transition-transform disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Dispatching Message...' : 'Send Inquiry to Boardly'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
