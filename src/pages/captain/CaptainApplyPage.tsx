import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      type: 'captain',
      program: 'captain',
      userId: user.uid,
      studentName: studentName.trim(),
      fullName: studentName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      institution: institution.trim(),
      university: institution.trim(),
      grade: grade.trim(),
      city: city.trim(),
      statement: statement.trim(),
      status: 'pending',
      createdAt: serverTimestamp(),
      appliedAt: serverTimestamp(),
    };

    try {
      await Promise.all([
        addDoc(collection(db, 'applications'), payload),
        addDoc(collection(db, 'captainApplications'), payload),
      ]);
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('[CaptainApply] Submit error:', err);
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
          <div className="w-14 h-14 rounded-full bg-[#1A1A1A] border border-[var(--border)] flex items-center justify-center text-[var(--red)] mb-2">
            <CheckCircle2 size={28} />
          </div>

          <h2
            className="text-2xl font-bold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Application Submitted
          </h2>

          <p className="text-sm text-[var(--muted)] max-w-md mt-2 leading-relaxed">
            Thank you, <strong className="text-[var(--text)]">{studentName}</strong>. Your Campus Captain nomination for <strong className="text-[var(--text)]">{institution}</strong> has been received. Our leadership panel will review your statement and contact you via WhatsApp/Email.
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
            <span className="badge-pill mb-3">Campus Leadership</span>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Apply as Campus Captain
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
              Lead your college wing, organize mock sessions, distribute mock passes, and earn leadership recognition.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#1A1A1A] border border-[var(--red)] text-xs text-[#FFFFFF]">
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
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full rounded-2xl bg-[#0A0A0A] border border-[var(--border)] px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]"
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
                  className="w-full rounded-2xl bg-[#0A0A0A] border border-[var(--border)] px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]"
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
                  className="w-full rounded-2xl bg-[#0A0A0A] border border-[var(--border)] px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]"
                  style={{ height: '52px' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  College / University
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Government College University"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full rounded-2xl bg-[#0A0A0A] border border-[var(--border)] px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]"
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
                  placeholder="e.g. Lahore / Rawalpindi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-2xl bg-[#0A0A0A] border border-[var(--border)] px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]"
                  style={{ height: '52px' }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                Current Class / Year
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full rounded-2xl bg-[#0A0A0A] border border-[var(--border)] px-4 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--red)]"
                style={{ height: '52px' }}
              >
                <option value="HSSC-I (11th Class)">HSSC-I (11th Class)</option>
                <option value="HSSC-II (12th Class)">HSSC-II (12th Class)</option>
                <option value="A-Levels (Year 2)">A-Levels (Year 2)</option>
                <option value="Repeater / Improver">Repeater / Improver</option>
                <option value="University Undergraduate">University Undergraduate</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                Why do you want to represent your campus as Captain?
              </label>
              <textarea
                required
                rows={3}
                placeholder="Share your extracurricular experience, student reach, or vision for your college..."
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                className="w-full rounded-2xl bg-[#0A0A0A] border border-[var(--border)] p-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--red)] focus:ring-1 focus:ring-[var(--red)]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-red w-full mt-2 cursor-pointer disabled:opacity-50"
              style={{ height: '52px' }}
            >
              {submitting ? 'Submitting Application...' : 'Submit Captain Application'}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}

export default CaptainApplyPage;
