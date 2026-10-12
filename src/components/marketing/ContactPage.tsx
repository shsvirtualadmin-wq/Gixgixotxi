import React, { useState } from 'react';
import { Mail, Phone, MessageCircle, MapPin, Send, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { MarketingPage } from './Navbar';
import { Hero } from './design-system/Hero';
import { Section } from './design-system/Section';
import { SectionHeader } from './design-system/SectionHeader';
import { Button } from './design-system/Button';
import { WordReveal } from './design-system/WordReveal';
import { StepsList } from './design-system/StepsList';
import { FaqAccordion } from './design-system/FaqAccordion';
import { CtaSection } from './design-system/CtaSection';
import { FriendlyError } from './design-system/LoadingAndEmptyState';

interface ContactPageProps {
  onNavigate: (page: MarketingPage) => void;
}

const CONTACT_TYPEWRITER = [
  'Academic Support',
  'WhatsApp Helpdesk',
  'Curriculum Inquiries',
  'Student Assistance',
];

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

  const handleWhatsApp = () => {
    window.open('https://chat.whatsapp.com/FTXFo4P7kct0L047d5zRGy?s=cl&p=a&mlu=4&ilr=4', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full">
      {/* 1. Hero */}
      <Hero
        eyebrow="STUDENT SUPPORT & HELPDESK"
        staticHeadingPrefix="We Are Here to"
        typewriterPhrases={CONTACT_TYPEWRITER}
        staticHeadingSuffix="Every Day"
        description="Have questions about test subscriptions, curriculum coverage, or study circles? Our team is available 7 days a week."
        primaryCtaText="WhatsApp Helpdesk"
        secondaryCtaText="Send Message"
        onPrimaryCta={handleWhatsApp}
        onSecondaryCta={() => {
          const el = document.getElementById('contact-form');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 2. Contact Grid (Light) */}
      <Section variant="light" id="contact-form">
        <SectionHeader
          eyebrow="DIRECT CONTACT CHANNELS"
          title="Reach Out via Message or"
          highlight="Instant WhatsApp"
          description="Average response time within 2 hours during active exam seasons."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
          {/* Left Info Column */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <div className="p-6 rounded-[24px] bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-3 text-emerald-600 font-bold text-sm">
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp Student Desk</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect directly with our counseling &amp; academic support team for immediate questions regarding coupon redemption or test access.
              </p>
              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm min-h-[44px]"
              >
                <span>Open WhatsApp Desk</span>
              </button>
            </div>

            <div className="p-6 rounded-[24px] bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-3 text-indigo-600 font-bold text-sm">
                <Mail className="w-5 h-5" />
                <span>Email Support</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-mono">
                support@boardly.cfd
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Mon – Sun, 9:00 AM – 10:00 PM PKT</span>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-[24px] bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-md text-left">
              {submitted ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold font-display text-slate-900">Message Received</h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                    Thank you! Our student support team will review your inquiry and follow up via email or WhatsApp shortly.
                  </p>
                  <div className="pt-4">
                    <Button variant="secondary" size="sm" onClick={() => setSubmitted(false)}>
                      Send Another Message
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <FriendlyError
                      title="Dispatch Notice"
                      message={errorMessage.text}
                      onRetry={errorMessage.showWhatsApp ? handleWhatsApp : undefined}
                    />
                  )}

                  {/* Honeypot field for bot spam prevention */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      name="_hp"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Student A."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-sans min-h-[44px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-sans min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        WhatsApp (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="0300 1234567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-sans min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-sans bg-white min-h-[44px]"
                    >
                      <option value="academic">Academic &amp; Subject Question</option>
                      <option value="billing">Subscription or Pro Access</option>
                      <option value="ambassador">Captain / Crew Inquiry</option>
                      <option value="other">General Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="How can we assist your test prep?"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-sans"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={submitting}
                    icon={<Send className="w-4 h-4" />}
                  >
                    {submitting ? 'Sending Message...' : 'Send Inquiry'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Word Reveal & Support Commitment (Dark) */}
      <Section variant="dark">
        <WordReveal statement="Every question from a student matters. Our academic helpdesk is dedicated to your exam success." />
      </Section>

      {/* 4. Support Response Flow (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="FAST RESOLUTION"
          title="How Our Student"
          highlight="Helpdesk Works"
          description="A direct response pipeline ensuring no student is left stranded before an exam."
        />

        <StepsList
          steps={[
            {
              number: '1',
              title: 'Submit Ticket or WhatsApp Message',
              description:
                'Send your query via the contact form above or reach out directly to the official WhatsApp desk.',
              checklist: ['Instant Automated Confirmation', 'Categorized by Inquiry Type'],
            },
            {
              number: '2',
              title: 'Educator or Technical Review',
              description:
                'Inquiries are routed directly to subject authors or platform engineers depending on topic.',
              checklist: ['Subject-Matter Expert Review', 'Under 2-Hour Response During Mocks'],
            },
            {
              number: '3',
              title: 'Resolution & Account Support',
              description:
                'Receive direct assistance, coupon verification, or mathematical clarification.',
              checklist: ['Direct Answer Delivery', 'Dedicated Follow-Up'],
              linkText: 'WhatsApp Helpdesk →',
              onLinkClick: handleWhatsApp,
            },
          ]}
        />
      </Section>

      {/* 5. FAQs (Light) */}
      <Section variant="light">
        <SectionHeader
          eyebrow="SUPPORT FAQS"
          title="Frequently Asked"
          highlight="Helpdesk Questions"
        />
        <FaqAccordion
          items={[
            {
              question: 'How quickly does student support respond?',
              answer:
                'During active exam seasons and scheduled mock tournaments, our WhatsApp helpdesk responds in under 2 hours. Email inquiries are resolved within 12–24 hours.',
            },
            {
              question: 'I paid for a Pro upgrade, how do I activate my code?',
              answer:
                'If you received a coupon or promo link from a Campus Captain, navigate to your account settings to redeem it immediately. For bank transfer verifications, send the receipt slip to our WhatsApp desk for instant activation.',
            },
            {
              question: 'Can I request a correction for a specific MCQ or derivation?',
              answer:
                'Yes! Every practice question includes a flag button to submit notes directly to the editorial team. We review and update derivation steps within 48 hours.',
            },
          ]}
        />
      </Section>

      {/* 6. CTA (Dark) */}
      <Section variant="dark" className="border-b-0">
        <CtaSection
          watermarkText="SUPPORT"
          eyebrow="READY TO PRACTICE?"
          title="Questions Answered? Dive into"
          highlight="Practice Right Away"
          description="Start practicing chapter question vaults on any smartphone without waiting."
          primaryButtonText="Start Free Practice"
          secondaryButtonText="Explore Curriculum"
          onPrimaryClick={() => {
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/app');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }
          }}
          onSecondaryClick={() => onNavigate('features')}
        />
      </Section>
    </div>
  );
};

