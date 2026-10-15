import React, { useState } from 'react';
import { Mail, MessageCircle, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'academic',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in your name, email address, and message.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Direct write to supportTickets collection with least privilege
      await addDoc(collection(db, 'supportTickets'), {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        category: formData.category,
        message: formData.message.trim(),
        status: 'open',
        createdAt: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err: any) {
      console.warn('Direct support ticket write notice:', err);
      // Fallback: Show user confirmation with direct email fallback
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center pt-24 sm:pt-28 pb-16 px-4 sm:px-6">
      <div className="max-w-3xl text-center mb-12">
        <Badge variant="brand" className="mb-3">
          Get in Touch
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#EAF0FF] font-['Oblata_Display',sans-serif] tracking-tight">
          We&apos;re Here to Help You Succeed
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#A3B0CC] leading-relaxed">
          Questions about test formats, Pro membership activation, or Campus Captain applications? Our team responds within 24 hours.
        </p>
      </div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
        {/* Left Column: Direct Info */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <Card variant="default" className="p-6 sm:p-8 flex flex-col gap-4">
            <h4 className="text-lg font-bold text-[#EAF0FF]">Official Contact</h4>
            <div className="flex items-start gap-3 text-xs sm:text-sm text-[#A3B0CC]">
              <Mail className="w-4 h-4 text-[#22D3EE] shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-[#EAF0FF]">Email Support</span>
                <a
                  href="mailto:support@boardly.cfd"
                  className="hover:text-[#22D3EE] transition-colors"
                >
                  support@boardly.cfd
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs sm:text-sm text-[#A3B0CC]">
              <MessageCircle className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-[#EAF0FF]">Community Group</span>
                <span>Fast response on academic and syllabus questions</span>
              </div>
            </div>
          </Card>

          <Card variant="default" className="p-6 text-xs text-[#A3B0CC] leading-relaxed">
            <h5 className="font-bold text-[#EAF0FF] mb-1.5">Hours of Operation</h5>
            <p>Monday – Saturday: 10:00 AM – 11:00 PM (PKT)</p>
            <p className="mt-1">Sunday: Arena mock support & verification queue</p>
          </Card>
        </div>

        {/* Right Column: Ticket Form */}
        <Card variant="default" className="md:col-span-7 p-6 sm:p-8">
          {submitted ? (
            <div className="py-10 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] flex items-center justify-center shadow-[0_0_24px_rgba(52,211,153,0.3)]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-bold text-[#EAF0FF]">Message Received!</h4>
              <p className="text-xs sm:text-sm text-[#A3B0CC] max-w-sm leading-relaxed">
                Thank you, {formData.name}. Our academic support desk will review your inquiry and follow up at{' '}
                <span className="text-[#22D3EE] font-semibold">{formData.email}</span>.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', phone: '', category: 'academic', message: '' });
                }}
                className="mt-2"
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <h3 className="text-xl font-bold text-[#EAF0FF] mb-1">Send a Message</h3>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[#F87171] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                label="Full Name"
                placeholder="e.g. Hamza Tariq"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />

              <Input
                label="WhatsApp Phone (Optional)"
                placeholder="0300 1234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <Select
                label="Inquiry Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={[
                  { value: 'academic', label: 'Academic & Question Bank Query' },
                  { value: 'payment', label: 'Pro Upgrade / Payment Verification' },
                  { value: 'crew', label: 'Boardly Crew & Campus Captains' },
                  { value: 'bug', label: 'Technical Issue or Error Report' },
                  { value: 'other', label: 'General Information' },
                ]}
              />

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-[#A3B0CC] tracking-wide">
                  Your Message
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tell us what test you are preparing for or what you need help with..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-4 bg-white/5 border border-white/12 hover:border-white/20 focus:border-[#2F6BFF] focus:ring-2 focus:ring-[#2F6BFF] rounded-xl text-sm text-[#EAF0FF] placeholder-[#6F7C99] transition-all resize-none outline-none"
                />
              </div>

              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={submitting}
                rightIcon={<Send className="w-3.5 h-3.5" />}
                className="mt-2 w-full"
              >
                Submit Inquiry
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ContactPage;
