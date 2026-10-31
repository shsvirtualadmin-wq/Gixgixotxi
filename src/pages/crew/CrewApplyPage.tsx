import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { NAKAMA_CAPTAIN_SINGULAR } from '@/constants/branding';

export function CrewApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [city, setCity] = useState('');
  const [academicLevel, setAcademicLevel] = useState('FSc Pre-Engineering');
  const [promotionPlan, setPromotionPlan] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      type: 'crew',
      program: 'crew',
      userId: user.uid,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      institution: institution.trim(),
      city: city.trim(),
      academicLevel,
      promotionPlan: promotionPlan.trim(),
      status: 'pending',
    };

    try {
      await api.post('/api/applications', payload);
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('[CrewApply] Submit error:', err);
      setError(e.message ?? 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[640px] mx-auto py-8 px-4 sm:px-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-6"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {submitted ? (
        <Card className="text-center items-center py-12 px-6">
          <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] mb-2">
            <CheckCircle2 size={28} />
          </div>

          <h2
            className="text-2xl font-bold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Application Submitted
          </h2>

          <p className="text-sm text-[var(--muted)] max-w-md mt-2 leading-relaxed">
            Thank you, <strong className="text-[var(--text)]">{fullName}</strong>. Our student ambassador team reviews applications within 24 hours. Once approved by the administrator, your Crew dashboard will unlock automatically.
          </p>

          <div className="pt-4 w-full max-w-xs">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-red w-full cursor-pointer"
              style={{ height: '52px' }}
            >
              Return to Student Dashboard
            </button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 sm:p-8">
          <div>
            <span className="badge-pill mb-3">Leadership Program</span>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Apply for {NAKAMA_CAPTAIN_SINGULAR}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
              Lead your crew, organize mock sessions, earn weekly Pro rewards for every student you bring, and climb the national leaderboard.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--accent)] text-xs text-[var(--text)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]"
                style={{ height: '52px' }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]"
                  style={{ height: '52px' }}
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  WhatsApp / Phone
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]"
                  style={{ height: '52px' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  College / Institution
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Punjab Group of Colleges"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]"
                  style={{ height: '52px' }}
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  City
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lahore / Islamabad"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]"
                  style={{ height: '52px' }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                Academic Level
              </label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value)}
                className="w-full rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] px-4 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--red)]"
                style={{ height: '52px' }}
              >
                <option value="FSc Pre-Engineering">FSc Pre-Engineering</option>
                <option value="ICS Computer Science">ICS Computer Science</option>
                <option value="FSc Pre-Medical">FSc Pre-Medical</option>
                <option value="A-Levels">A-Levels</option>
                <option value="University Undergraduate">University Undergraduate</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                How do you plan to introduce Boardly to fellow students?
              </label>
              <textarea
                required
                rows={3}
                placeholder="Share your outreach plan, student groups, or academy study circles..."
                value={promotionPlan}
                onChange={(e) => setPromotionPlan(e.target.value)}
                className="w-full rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-red w-full mt-2 cursor-pointer disabled:opacity-50"
              style={{ height: '52px' }}
            >
              {submitting ? 'Submitting Application...' : `Submit ${NAKAMA_CAPTAIN_SINGULAR} Application`}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}

export default CrewApplyPage;
