import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { StepUniversity } from '@/components/onboarding/StepUniversity';
import { StepTestDate } from '@/components/onboarding/StepTestDate';
import { StepSubjects } from '@/components/onboarding/StepSubjects';
import { StepSummary } from '@/components/onboarding/StepSummary';
import { ArrowLeft } from 'lucide-react';

export function OnboardingPage() {
  const { user, profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [targetUniversity, setTargetUniversity] = useState('');
  const [targetTestDate, setTargetTestDate] = useState('');
  const [academicTrack, setAcademicTrack] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [hasPrefilled, setHasPrefilled] = useState(false);

  // Pre-fill fields from the user's saved profile if already present
  useEffect(() => {
    if (profile && !hasPrefilled) {
      if (profile.targetUniversity) setTargetUniversity(profile.targetUniversity);
      if (profile.targetTestDate) setTargetTestDate(profile.targetTestDate);
      if (profile.academicTrack) setAcademicTrack(profile.academicTrack);
      if (Array.isArray(profile.subjects) && profile.subjects.length > 0) {
        setSubjects(profile.subjects);
      }
      setHasPrefilled(true);
    }
  }, [profile, hasPrefilled]);

  // If unauthenticated, redirect to login only after auth has finished loading
  useEffect(() => {
    if (!profileLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, profileLoading, navigate]);

  // NEVER redirect away just because profile is complete or incomplete.
  // The user must be able to open this setup page at any time to edit their target exam.

  const handleComplete = () => {
    navigate('/dashboard', { replace: true });
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--red)] border-t-transparent animate-spin" />
          <p className="text-xs text-[var(--muted)] font-heading">
            Loading Target Exam &amp; Profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Return to Cockpit shortcut for already onboarded students */}
      {profile?.onboardingCompleted && (
        <div className="w-full max-w-lg pt-4 px-4 flex justify-between items-center text-xs text-[var(--muted)] font-heading">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Cockpit</span>
          </Link>
          <span className="text-[11px] text-[var(--muted)]">Setup &amp; Preferences</span>
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
