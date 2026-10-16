import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Sparkles, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'crewApplications'), {
        program: 'crew',
        userId: user.uid,
        isGuest: false,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        institution: institution.trim(),
        city: city.trim(),
        academicLevel,
        promotionPlan: promotionPlan.trim(),
        answers: promotionPlan.trim(),
        status: 'pending',
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      console.error('[CrewApply] Submit error:', err);
      setError({
        code: e.code,
        message: e.message ?? 'Failed to submit application',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '2rem auto', padding: '1rem 1.25rem 5rem' }}>
      <Link
        to="/crew"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-muted)',
          fontSize: 13,
          textDecoration: 'none',
          marginBottom: 16,
        }}
      >
        <ArrowLeft size={15} />
        Back to Crew Portal
      </Link>

      {submitted ? (
        <div
          className="glass glass-animated-border"
          style={{
            borderRadius: 'var(--r-card)',
            padding: '3rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(52, 211, 153, 0.15)',
              border: '1px solid var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success)',
            }}
          >
            <CheckCircle size={32} />
          </div>

          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>
            Application Submitted!
          </h1>

          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 440, lineHeight: 1.6 }}>
            Thank you for applying to join the <strong>Boardly Crew</strong>. Our community team reviews ambassador applications within 24–48 hours. You will receive an email and in-app notification once approved.
          </p>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/dashboard')}
            style={{ marginTop: 12, background: 'linear-gradient(135deg, var(--crew-from), var(--crew-to))' }}
          >
            Return to Dashboard
          </Button>
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: 'var(--r-card)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--crew-from), var(--crew-to))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                Apply for Boardly Crew
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Represent Boardly at your academy or college
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
                placeholder="e.g. Bilal Ahmed"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  WhatsApp Phone
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300 1234567"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  College / Academy
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Punjab College, KIPS, Army Public"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lahore, Islamabad, Karachi"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Academic Track
              </label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value)}
                style={inputStyle}
              >
                <option value="FSc Pre-Engineering">FSc Pre-Engineering</option>
                <option value="FSc Pre-Medical">FSc Pre-Medical</option>
                <option value="ICS Computer Science">ICS Computer Science</option>
                <option value="A-Levels">A-Levels</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                How do you plan to promote Boardly to classmates?
              </label>
              <textarea
                required
                rows={4}
                value={promotionPlan}
                onChange={(e) => setPromotionPlan(e.target.value)}
                placeholder="Describe your student network, college WhatsApp groups, or study circles..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {error && (
              <ErrorState
                title="Submission error"
                error={error}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              style={{
                marginTop: 8,
                background: 'linear-gradient(135deg, var(--crew-from), var(--crew-to))',
              }}
            >
              Submit Ambassador Application
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-input)',
  color: 'var(--text)',
  fontSize: 14,
  padding: '12px 14px',
  outline: 'none',
  fontFamily: 'inherit',
};
