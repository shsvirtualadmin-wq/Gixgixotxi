import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { StepUniversity } from '@/components/onboarding/StepUniversity';
import { StepTestDate } from '@/components/onboarding/StepTestDate';
import { StepSubjects } from '@/components/onboarding/StepSubjects';
import { StepSummary } from '@/components/onboarding/StepSummary';
import { FirestoreDebugPanel } from '@/components/debug/FirestoreDebugPanel';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [targetUniversity, setTargetUniversity] = useState('');
  const [targetTestDate, setTargetTestDate] = useState('');
  const [academicTrack, setAcademicTrack] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);

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
    <div className="w-full max-w-4xl px-4 pb-12">
      <FirestoreDebugPanel />
    </div>
  </div>
  );
}

export default OnboardingPage;
