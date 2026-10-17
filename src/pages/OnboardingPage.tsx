import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { StepUniversity } from '@/components/onboarding/StepUniversity';
import { StepTestDate } from '@/components/onboarding/StepTestDate';
import { StepSubjects } from '@/components/onboarding/StepSubjects';
import { StepSummary } from '@/components/onboarding/StepSummary';

export function OnboardingPage() {
  const { user, profile, profileLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [targetUniversity, setTargetUniversity] = useState('');
  const [targetTestDate, setTargetTestDate] = useState('');
  const [academicTrack, setAcademicTrack] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);

  // If a user with onboardingCompleted true opens /onboarding, send them to the Cockpit
  useEffect(() => {
    if (!profileLoading && user && profile?.onboardingCompleted) {
      console.log('[OnboardingPage] User already completed onboarding, redirecting to Cockpit');
      navigate('/dashboard', { replace: true });
    }
  }, [user, profile, profileLoading, navigate]);

  const handleComplete = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="w-full flex flex-col items-center">
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
