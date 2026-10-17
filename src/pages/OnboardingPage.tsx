import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { StepUniversity } from '@/components/onboarding/StepUniversity';
import { StepTestDate } from '@/components/onboarding/StepTestDate';
import { StepSubjects } from '@/components/onboarding/StepSubjects';
import { StepSummary } from '@/components/onboarding/StepSummary';
import { logRedirect } from '@/utils/debugTracker';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

export function OnboardingPage() {
  const { user, profile, loading: profileLoading, error: profileError, retryFetch } = useUserProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [targetUniversity, setTargetUniversity] = useState('');
  const [targetTestDate, setTargetTestDate] = useState('');
  const [academicTrack, setAcademicTrack] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [timeoutExceeded, setTimeoutExceeded] = useState(false);

  // Pre-fill fields from user profile when available
  useEffect(() => {
    if (profile && !hasPrefilled) {
      const exam = profile.targetExam || profile.targetUniversity || '';
      if (exam) setTargetUniversity(exam);
      if (profile.targetTestDate) setTargetTestDate(profile.targetTestDate);
      if (profile.academicTrack) setAcademicTrack(profile.academicTrack);
      if (Array.isArray(profile.subjects) && profile.subjects.length > 0) {
        setSubjects(profile.subjects);
      }
      setHasPrefilled(true);
    }
  }, [profile, hasPrefilled]);

  // 8-second safety timeout: if profile takes >8s, allow editing anyway with clean notice
  useEffect(() => {
    if (!profileLoading) return;
    const timer = setTimeout(() => {
      setTimeoutExceeded(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [profileLoading]);

  // If unauthenticated, redirect to login only after auth has finished loading
  useEffect(() => {
    if (!profileLoading && !user) {
      logRedirect('/onboarding', '/login', 'OnboardingPage (unauthenticated user)');
      navigate('/login', { replace: true });
    }
  }, [user, profileLoading, navigate]);

  // Per specification: /onboarding must NEVER redirect to /dashboard on its own,
  // except once, right after the user taps Save and the Firestore write succeeded.
  const handleComplete = () => {
    logRedirect('/onboarding', '/dashboard', 'OnboardingPage (Save successful)');
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Return to Cockpit shortcut */}
      <div className="w-full max-w-lg pt-4 px-4 flex justify-between items-center text-xs text-[var(--muted)] font-heading">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Return to Cockpit</span>
        </Link>
        <span className="text-[11px] text-[var(--muted)]">Target Exam &amp; Profile Setup</span>
      </div>

      {/* Timeout notice if profile fetch is slow or failed */}
      {(timeoutExceeded || profileError) && !profile && (
        <div className="w-full max-w-lg mt-3 px-4">
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-400 shrink-0" />
              <span>Could not load your saved profile. You can proceed to set your targets below.</span>
            </div>
            <button
              type="button"
              onClick={retryFetch}
              className="text-[11px] px-2.5 py-1 rounded bg-amber-600/60 hover:bg-amber-600 text-white font-medium flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <RefreshCw size={11} />
              Retry
            </button>
          </div>
        </div>
      )}

      <OnboardingShell step={step}>
        {step === 1 && (
          <StepUniversity
            value={targetUniversity}
            onChange={setTargetUniversity}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepTestDate
            testDate={targetTestDate}
            academicTrack={academicTrack}
            onTestDateChange={setTargetTestDate}
            onTrackChange={setAcademicTrack}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepSubjects
            subjects={subjects}
            weakChapters={[]}
            onSubjectsChange={setSubjects}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <StepSummary
            data={{ targetUniversity, targetTestDate, academicTrack, subjects }}
            onBack={() => setStep(3)}
            onComplete={handleComplete}
          />
        )}
      </OnboardingShell>
    </div>
  );
}

export default OnboardingPage;
