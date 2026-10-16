import { useState } from 'react';
import { Mail, MessageCircle, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface ContactErrorState {
  url: string;
  status: number | string;
  code?: string;
  message: string;
  snippet?: string;
}

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorDetails, setErrorDetails] = useState<ContactErrorState | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetails(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorDetails({
        url: 'client/form-validation',
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Name, email, and message are required fields.',
        snippet: 'Validation check failed: please provide all fields.',
      });
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const responseText = await response.text();
      let responseData: { success?: boolean; error?: string; code?: string } = {};
      try {
        responseData = JSON.parse(responseText);
      } catch {
        // Raw text
      }

      if (response.status === 200 && (responseData.success || !responseData.error)) {
        setSubmitted(true);
      } else {
        const snippet = (responseText || response.statusText || 'No response body').slice(0, 200);
        setErrorDetails({
          url: '/api/contact',
          status: response.status,
          code: responseData.code || `HTTP_${response.status}`,
          message: responseData.error || `Server returned HTTP ${response.status}`,
          snippet,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorDetails({
        url: '/api/contact',
        status: 'NETWORK_ERROR',
        code: 'CLIENT_FETCH_FAILED',
        message: msg,
        snippet: msg.slice(0, 200),
      });
    } finally {
      setSending(false);
    }
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

                {errorDetails && (
                  <div
                    role="alert"
                    className="p-4 rounded-2xl bg-red-950/80 border-2 border-red-500 text-red-100 text-xs shadow-lg space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <AlertCircle size={16} className="text-red-400 shrink-0" />
                        <span>Failed to send message</span>
                      </div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-red-600/40 border border-red-500">
                        {errorDetails.code || `HTTP ${errorDetails.status}`}
                      </span>
                    </div>
                    <p className="text-red-200 font-medium">{errorDetails.message}</p>
                    <div className="pt-2 border-t border-red-500/30 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                      <div><strong className="text-red-300">Target URL:</strong> {errorDetails.url}</div>
                      <div><strong className="text-red-300">Status:</strong> {errorDetails.status}</div>
                    </div>
                    {errorDetails.snippet && (
                      <div className="pt-1.5 font-mono text-[10px] text-red-300 bg-black/40 p-2 rounded border border-red-500/30 break-all">
                        <strong>Response body:</strong> {errorDetails.snippet}
                      </div>
                    )}
                  </div>
                )}

                <Button type="submit" variant="primary" size="lg" fullWidth disabled={sending}>
                  <Send size={16} /> {sending ? 'Sending message...' : 'Submit Message'}
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
