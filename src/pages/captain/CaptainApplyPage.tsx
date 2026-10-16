import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Compass, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function CaptainApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [grade, setGrade] = useState('HSSC-II (12th Class)');
  const [city, setCity] = useState('');
  const [statement, setStatement] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'captainApplications'), {
        studentName: studentName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        institution: institution.trim(),
        grade: grade.trim(),
        city: city.trim(),
        statement: statement.trim(),
        status: 'pending',
        appliedAt: serverTimestamp(),
        userId: user.uid,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      console.error('[CaptainApply] Submit error:', err);
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
        to="/captain"
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
        Back to Captain Cockpit
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
            Application Received!
          </h1>

          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 460, lineHeight: 1.6 }}>
            Your application for <strong>Campus Captain</strong> has been recorded. Our campus community leads review applications and interview candidates to allocate official university territories.
          </p>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/dashboard')}
            style={{ marginTop: 12, background: 'linear-gradient(135deg, var(--captain-from), var(--captain-to))' }}
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
                background: 'linear-gradient(135deg, var(--captain-from), var(--captain-to))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Compass size={18} />
            </div>
            <div>
              <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                Apply for Campus Captain
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Lead university entrance test preparation for your campus
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Student Name
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                style={inputStyle}
                placeholder="e.g. Hamza Tariq"
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
                  Phone / WhatsApp
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
                  Campus / University
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. NUST H-12, FAST Islamabad, GIKI, LUMS"
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
                  placeholder="e.g. Islamabad, Lahore, Karachi"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Academic Grade / Program
              </label>
              <input
                type="text"
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. HSSC-II Pre-Engineering, BS CS 1st Year"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Statement of Leadership & Promotion Strategy
              </label>
              <textarea
                required
                rows={4}
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Why do you want to lead Boardly at your campus? How will you organize peer mocks and test study circles?"
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
                background: 'linear-gradient(135deg, var(--captain-from), var(--captain-to))',
              }}
            >
              Submit Campus Captain Application
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
