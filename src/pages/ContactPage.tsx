import { useState } from 'react';
import { Mail, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <div className="pt-28 pb-20 max-w-5xl mx-auto px-6 page-enter space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <Badge color="brand">Helpdesk</Badge>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
          Contact Boardly
        </h1>
        <p className="text-base text-[var(--text-muted)] leading-relaxed">
          Need help with your plan activation, reporting a math formula error, or campus captain partnership? Reach out to our Karachi team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Contact Info Column */}
        <div className="md:col-span-5 space-y-4">
          <GlassCard className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Mail size={20} />
            </div>
            <h3 className="text-base font-bold text-white">Student Support Email</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Direct inbox for technical inquiries, account recovery, and payment slips.
            </p>
            <div className="text-sm font-semibold text-cyan-400">support@boardly.cfd</div>
          </GlassCard>

          <GlassCard className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageCircle size={20} />
            </div>
            <h3 className="text-base font-bold text-white">WhatsApp Ambassador Desk</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Available 10:00 AM – 8:00 PM PKT for campus ambassadors and test questions.
            </p>
            <div className="text-sm font-semibold text-emerald-400">+92 (300) BOARDLY</div>
          </GlassCard>
        </div>

        {/* Contact Form Column */}
        <div className="md:col-span-7">
          <GlassCard className="p-8">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
                <h3 className="text-xl font-bold text-white">Message Sent!</h3>
                <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
                  Thank you for reaching out. A team member will respond to your email within 24 hours.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', subject: '', message: '' });
                  }}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-2">Send a Message</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bilal Ahmed"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-[var(--border)] text-white text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="bilal@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-[var(--border)] text-white text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pro Plan Activation / Question Bug"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-[var(--border)] text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can we help you prepare?"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-[var(--border)] text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>

                <Button type="submit" variant="primary" size="lg" fullWidth>
                  <Send size={16} /> Submit Message
                </Button>
              </form>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
