import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircle2, ArrowLeft, AlertCircle, LogIn, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { NAKAMA_CAPTAIN_SINGULAR } from '@/constants/branding';

interface FieldErrors {
  studentName?: string;
  email?: string;
  phone?: string;
  institution?: string;
  city?: string;
  statement?: string;
}

export function CaptainApplyPage() {
  const { user, profileLoading } = useAuth();
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [existingApp, setExistingApp] = useState<{ status: string; appliedAt?: string } | null>(null);

  // Sync state if user loads asynchronously
  useEffect(() => {
    if (user) {
      setStudentName((prev) => (prev ? prev : user.displayName ?? ''));
      setEmail((prev) => (prev ? prev : user.email ?? ''));
    }
  }, [user]);

  // Check if this logged-in user already has an application submitted
  useEffect(() => {
    let isMounted = true;
    async function checkExisting() {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'captainApplications', user.uid));
        if (!isMounted) return;
        if (snap.exists()) {
          const data = snap.data();
          setExistingApp({
            status: data.status || 'Pending',
            appliedAt: data.appliedAt?.toDate ? data.appliedAt.toDate().toLocaleDateString() : undefined,
          });
          setSubmitted(true);
        }
      } catch (err) {
        console.warn('[CaptainApply] Error checking existing application:', err);
      }
    }
    checkExisting();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const validate = (): boolean => {
    const errs: FieldErrors = {};

    if (!studentName.trim() || studentName.trim().length < 2) {
      errs.studentName = 'Please enter your full name (at least 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Please enter a valid phone number (at least 10 digits).';
    }

    if (!institution.trim() || institution.trim().length < 2) {
      errs.institution = 'Please enter your college or university name.';
    }

    if (!city.trim() || city.trim().length < 2) {
      errs.city = 'Please enter your current city.';
    }

    if (!statement.trim() || statement.trim().length < 15) {
      errs.statement = 'Please provide a short statement explaining your motivation (at least 15 characters).';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CaptainApply] handleSubmit fired', {
      userUid: user?.uid,
      studentName,
      email,
      phone,
      institution,
      grade,
      city,
      statement,
      submitting,
    });

    // Requirement e: If not logged in, inform the user and redirect to login
    if (!user) {
      console.warn('[CaptainApply] Submit blocked: user is not logged in.');
      setError('You must be signed in to submit an application. Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login?redirect=/captain/apply');
      }, 1200);
      return;
    }

    if (submitting) {
      console.log('[CaptainApply] Submit ignored: already submitting.');
      return;
    }

    // Requirement c: Client-side validation with explicit errors under invalid fields
    if (!validate()) {
      console.warn('[CaptainApply] Validation failed with field errors:', fieldErrors);
      setError('Please resolve the highlighted errors below before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    const payload = {
      id: user.uid,
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
      status: 'Pending', // Security rules require status 'Pending'
      createdAt: serverTimestamp(),
      appliedAt: serverTimestamp(),
    };

    console.log('[CaptainApply] Writing application payload to Firestore:', payload);

    try {
      // Key application by user.uid so each logged-in student has exactly one application document
      await setDoc(doc(db, 'captainApplications', user.uid), payload);
      console.log('[CaptainApply] Successfully written to captainApplications/' + user.uid);

      // Best effort mirror to applications collection
      try {
        await setDoc(doc(db, 'applications', user.uid), payload);
        console.log('[CaptainApply] Successfully mirrored to applications/' + user.uid);
      } catch (mirrorErr) {
        console.warn('[CaptainApply] Mirror to applications collection warning:', mirrorErr);
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string; name?: string };
      // Requirement d: Log the full error to console
      console.error('[CaptainApply] Database write error full details:', err);
      // Requirement: Show the actual error message on screen (not just "failed")
      const detailedMessage = e.code
        ? `[${e.code}] ${e.message || 'Database rejected the application submission.'}`
        : e.message || String(err);
      setError(detailedMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[640px] mx-auto py-8 px-4 sm:px-6 pb-36 sm:pb-44">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-6"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* ── NOT LOGGED IN WARNING / REDIRECT CARD ──────────────────────────── */}
      {!profileLoading && !user && (
        <Card className="p-6 mb-6 border border-amber-500/40 bg-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-sm sm:text-base text-[var(--text)]">
                Sign In Required to Apply
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 leading-relaxed">
                You must be signed in with your student account to apply for {NAKAMA_CAPTAIN_SINGULAR}. This links your nomination to your campus crew and national leaderboard profile.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login?redirect=/captain/apply')}
                  className="btn-red inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold cursor-pointer"
                >
                  <LogIn size={14} />
                  <span>Sign In to Continue</span>
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── CONFIRMATION SCREEN ────────────────────────────────────────────── */}
      {submitted ? (
        <Card className="text-center items-center py-12 px-6">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] mb-3">
            <CheckCircle2 size={32} />
          </div>

          {/* Exact required text on confirmation screen */}
          <h2
            className="text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
          >
            Application received. We&apos;ll email you after review.
          </h2>

          <div className="inline-flex items-center gap-2 mt-3 mb-2">
            <Badge color="red-outline" dot>
              Status: {existingApp?.status || 'Pending'}
            </Badge>
          </div>

          <p className="text-sm text-[var(--muted)] max-w-md mt-2 leading-relaxed">
            Thank you, <strong className="text-[var(--text)]">{studentName || user?.displayName || 'Captain Candidate'}</strong>. Your application for <strong className="text-[var(--text)]">{institution || 'your campus'}</strong> is securely registered. Our review board reviews nominations weekly and will reach out to you directly.
          </p>

          <div className="pt-6 w-full max-w-xs flex flex-col gap-2">
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
        <Card className="p-6 sm:p-8 relative">
          <div>
            <span className="badge-pill mb-3">Leadership Program</span>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Apply for {NAKAMA_CAPTAIN_SINGULAR}
            </h1>
            {/* Form intro updated to lead crew & publish tests on Grand Line (removed "organize mock sessions") */}
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
              Lead your student crew, publish entrance tests on Grand Line, earn rewards for every aspirant you mentor, and represent your campus on the national leaderboard.
            </p>
          </div>

          {/* Actual error message on screen */}
          {error && (
            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--red)] text-xs text-[var(--text)] flex items-start gap-2.5 my-3">
              <AlertCircle size={16} className="text-[var(--red)] shrink-0 mt-0.5" />
              <div className="flex-1 break-words">
                <span className="font-bold text-[var(--red)]">Error: </span>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4" noValidate>
            {/* Full Name */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                Full Name <span className="text-[var(--red)]">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  if (fieldErrors.studentName) setFieldErrors((prev) => ({ ...prev, studentName: undefined }));
                }}
                placeholder="e.g. Ali Ahmed"
                className={`w-full rounded-2xl bg-[var(--surface-2)] border px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 ${
                  fieldErrors.studentName
                    ? 'border-[var(--red)] focus:ring-[var(--red)]'
                    : 'border-[var(--border)] focus:border-[var(--red)] focus:ring-[var(--red)]'
                }`}
                style={{ height: '52px' }}
              />
              {fieldErrors.studentName && (
                <p className="text-[11px] text-[var(--red)] font-medium mt-0.5">{fieldErrors.studentName}</p>
              )}
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Email Address <span className="text-[var(--red)]">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="student@example.com"
                  className={`w-full rounded-2xl bg-[var(--surface-2)] border px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 ${
                    fieldErrors.email
                      ? 'border-[var(--red)] focus:ring-[var(--red)]'
                      : 'border-[var(--border)] focus:border-[var(--red)] focus:ring-[var(--red)]'
                  }`}
                  style={{ height: '52px' }}
                />
                {fieldErrors.email && (
                  <p className="text-[11px] text-[var(--red)] font-medium mt-0.5">{fieldErrors.email}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  WhatsApp / Phone <span className="text-[var(--red)]">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="0300 1234567"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  className={`w-full rounded-2xl bg-[var(--surface-2)] border px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 ${
                    fieldErrors.phone
                      ? 'border-[var(--red)] focus:ring-[var(--red)]'
                      : 'border-[var(--border)] focus:border-[var(--red)] focus:ring-[var(--red)]'
                  }`}
                  style={{ height: '52px' }}
                />
                {fieldErrors.phone && (
                  <p className="text-[11px] text-[var(--red)] font-medium mt-0.5">{fieldErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Institution and City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  College / University <span className="text-[var(--red)]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Government College University / FAST"
                  value={institution}
                  onChange={(e) => {
                    setInstitution(e.target.value);
                    if (fieldErrors.institution) setFieldErrors((prev) => ({ ...prev, institution: undefined }));
                  }}
                  className={`w-full rounded-2xl bg-[var(--surface-2)] border px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 ${
                    fieldErrors.institution
                      ? 'border-[var(--red)] focus:ring-[var(--red)]'
                      : 'border-[var(--border)] focus:border-[var(--red)] focus:ring-[var(--red)]'
                  }`}
                  style={{ height: '52px' }}
                />
                {fieldErrors.institution && (
                  <p className="text-[11px] text-[var(--red)] font-medium mt-0.5">{fieldErrors.institution}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  City <span className="text-[var(--red)]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lahore / Rawalpindi"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: undefined }));
                  }}
                  className={`w-full rounded-2xl bg-[var(--surface-2)] border px-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 ${
                    fieldErrors.city
                      ? 'border-[var(--red)] focus:ring-[var(--red)]'
                      : 'border-[var(--border)] focus:border-[var(--red)] focus:ring-[var(--red)]'
                  }`}
                  style={{ height: '52px' }}
                />
                {fieldErrors.city && (
                  <p className="text-[11px] text-[var(--red)] font-medium mt-0.5">{fieldErrors.city}</p>
                )}
              </div>
            </div>

            {/* Current Class */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                Current Class / Year
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] px-4 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--red)]"
                style={{ height: '52px' }}
              >
                <option value="HSSC-I (11th Class)">HSSC-I (11th Class)</option>
                <option value="HSSC-II (12th Class)">HSSC-II (12th Class)</option>
                <option value="A-Levels (Year 2)">A-Levels (Year 2)</option>
                <option value="Repeater / Improver">Repeater / Improver</option>
                <option value="University Undergraduate">University Undergraduate</option>
              </select>
            </div>

            {/* Statement */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                Why do you want to represent your campus as Captain? <span className="text-[var(--red)]">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Share your student reach, motivation to lead a Study Crew, and plans for publishing tests on Grand Line..."
                value={statement}
                onChange={(e) => {
                  setStatement(e.target.value);
                  if (fieldErrors.statement) setFieldErrors((prev) => ({ ...prev, statement: undefined }));
                }}
                className={`w-full rounded-2xl bg-[var(--surface-2)] border p-4 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 ${
                  fieldErrors.statement
                    ? 'border-[var(--red)] focus:ring-[var(--red)]'
                    : 'border-[var(--border)] focus:border-[var(--red)] focus:ring-[var(--red)]'
                }`}
              />
              {fieldErrors.statement && (
                <p className="text-[11px] text-[var(--red)] font-medium mt-0.5">{fieldErrors.statement}</p>
              )}
            </div>

            {/* Submit Button: Given relative position and z-20 so it cannot be overlapped by floating widgets */}
            <div className="relative z-20 pt-2">
              <button
                type="submit"
                onClick={() => {
                  console.log('[CaptainApply] Submit button clicked');
                }}
                disabled={submitting}
                className="btn-red w-full cursor-pointer disabled:opacity-50 relative z-20 shadow-lg"
                style={{ height: '52px' }}
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Clock size={16} className="animate-spin" />
                    <span>Submitting Application...</span>
                  </span>
                ) : (
                  <span>Submit {NAKAMA_CAPTAIN_SINGULAR} Application</span>
                )}
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

export default CaptainApplyPage;
