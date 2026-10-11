import React, { useState, useMemo } from 'react';
import { ArrowLeft, Check, Calendar, Sparkles, BookOpen, Clock, ArrowRight, Loader2, Target, HelpCircle, AlertCircle } from 'lucide-react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { BrandLogo } from '../marketing/BrandLogo';
import { UNIVERSITIES, University } from '../../data/universities';
import { UniversityLogoBadge } from '../UniversityLogoBadge';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../lib/firebase';

interface OnboardingFlowProps {
  onComplete: (startFirstTest: boolean, firstTestConfig?: any) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { user, profile, completeOnboarding } = useAuth();

  const [step, setStepState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('boardly_onboarding_step');
        if (saved) {
          const num = parseInt(saved, 10);
          if (num >= 1 && num <= 4) return num;
        }
      } catch {}
    }
    return 1;
  });

  const setStep = (newStep: number | ((prev: number) => number)) => {
    setStepState((prev) => {
      const next = typeof newStep === 'function' ? newStep(prev) : newStep;
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('boardly_onboarding_step', String(next));
        } catch {}
      }
      return next;
    });
  };

  const [selectedTrack, setSelectedTrack] = useState<'Engineering & CS' | 'Business & Finance' | ''>(
    profile?.testTrack === 'Engineering & CS' || profile?.testTrack === 'Business & Finance'
      ? profile.testTrack
      : 'Engineering & CS'
  );
  const [targetUniId, setTargetUniId] = useState<string>(profile?.targetUniversityId || 'fast');
  const [examDate, setExamDate] = useState<string>(() => {
    // Default ~21-30 days out for realistic Pakistan test season
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });
  const [isNotSureDate, setIsNotSureDate] = useState<boolean>(false);
  const [selectedWorries, setSelectedWorries] = useState<string[]>(['Advance Maths', 'IQ']);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter universities based on selected track
  const universitiesList = useMemo(() => {
    if (selectedTrack === 'Business & Finance') {
      return UNIVERSITIES.filter((u) => u.category === 'Business' || u.id === 'iba' || u.id === 'lums' || u.id === 'nust');
    }
    return UNIVERSITIES;
  }, [selectedTrack]);

  const targetUni: University = useMemo(() => {
    return UNIVERSITIES.find((u) => u.id === targetUniId) || {
      id: targetUniId,
      shortName: targetUniId === 'somewhere_else' ? 'Custom University' : 'Entry Test',
      fullName: targetUniId === 'somewhere_else' ? 'Other Institution' : 'Undergraduate Admission',
      logo: '/logos/nust.png',
      category: 'Engineering',
      testName: 'General Entrance Exam',
    };
  }, [targetUniId]);

  // Compute days until test
  const daysUntilTest = useMemo(() => {
    if (isNotSureDate || !examDate) return 21;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(examDate);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 21;
  }, [examDate, isNotSureDate]);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSaveAndGoToDashboard = async () => {
    if (isSaving) return;
    setErrorMessage(null);
    setIsSaving(true);

    const targetUid = user?.uid || auth.currentUser?.uid;
    if (!targetUid) {
      setIsSaving(false);
      setErrorMessage('User session not found. Please log in again.');
      return;
    }

    const onboardingPayload: Record<string, any> = {
      uid: targetUid,
      testTrack: selectedTrack || 'Engineering & CS',
      targetExam: selectedTrack || 'Engineering & CS',
      targetUniversityId: targetUniId,
      targetUniversity: targetUni.shortName,
      university: targetUni.shortName,
      dream_university: targetUni.shortName,
      target_university: targetUni.shortName,
      targetExamDate: isNotSureDate ? '' : examDate,
      examDate: isNotSureDate ? '' : examDate,
      targetExamDaysLeft: daysUntilTest,
      weakSubjects: selectedWorries,
      firstTest: '30-question diagnostic test',
      onboardingComplete: true,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Save onboarding data to user profile via completeOnboarding
      const res = await completeOnboarding(onboardingPayload);
      if (!res.success) {
        setIsSaving(false);
        setErrorMessage(res.error || 'Failed to save onboarding details. Please try again.');
        return;
      }

      // Also ensure direct write fallback to users/{uid} document has succeeded
      try {
        const userDocRef = doc(db, 'users', targetUid);
        await updateDoc(userDocRef, onboardingPayload);
      } catch (updateErr: any) {
        try {
          const userDocRef = doc(db, 'users', targetUid);
          await setDoc(userDocRef, onboardingPayload, { merge: true });
        } catch (setErr) {
          console.warn('[Onboarding] Direct write fallback note:', setErr);
        }
      }

      // 2. Clear onboarding session/storage flags
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('boardly_onboarding_step');
          localStorage.removeItem('boardly_start_diagnostic_on_load');
          localStorage.removeItem('boardly_active_test_session');
          sessionStorage.removeItem('boardly_auto_start_drill');
          sessionStorage.removeItem('boardly_start_test');
        } catch {}
      }

      setIsSaving(false);

      // 3. Save succeeded! Go to the dashboard once with replace: true
      onComplete(false, {
        universityId: targetUniId,
        track: selectedTrack,
        weakSubjects: selectedWorries,
      });
    } catch (err: any) {
      console.error('[Onboarding] Direct save failed:', err);
      setIsSaving(false);
      const errorText = err?.message || 'Failed to save your preferences. Please try again.';
      setErrorMessage(errorText);
    }
  };

  const toggleWorry = (subject: string) => {
    if (subject === 'Not sure, help me find out') {
      setSelectedWorries(['Not sure, help me find out']);
      return;
    }
    const filtered = selectedWorries.filter((s) => s !== 'Not sure, help me find out');
    if (filtered.includes(subject)) {
      setSelectedWorries(filtered.filter((s) => s !== subject));
    } else {
      setSelectedWorries([...filtered, subject]);
    }
  };

  // Stack logos for Step 1
  const engStack = ['fast', 'nust', 'giki', 'pieas', 'ned'];
  const bizStack = ['iba', 'lums', 'nust'];

  return (
    <div className="min-h-screen bg-[#F8F9FB] relative flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Background Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm font-semibold"
              aria-label="Previous step"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Back</span>
            </button>
          ) : (
            <div className="w-9" />
          )}
          <BrandLogo size="md" />
        </div>

        <div className="w-9" />
      </header>

      {/* Progress Segment Bar */}
      <div className="relative z-10 max-w-md mx-auto w-full px-4 mb-4">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
          <span>Step {step} of 4</span>
          <span>{Math.round((step / 4) * 100)}% Complete</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${step >= 1 ? 'bg-blue-600' : 'bg-transparent'}`} />
          <div className={`h-full rounded-full transition-all duration-300 ${step >= 2 ? 'bg-blue-600' : 'bg-transparent'}`} />
          <div className={`h-full rounded-full transition-all duration-300 ${step >= 3 ? 'bg-blue-600' : 'bg-transparent'}`} />
          <div className={`h-full rounded-full transition-all duration-300 ${step >= 4 ? 'bg-blue-600' : 'bg-transparent'}`} />
        </div>
      </div>

      {/* Main Flow Steps */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-4 sm:py-6">
        <div className="w-full max-w-xl bg-white/90 backdrop-blur-xl border border-white/80 shadow-2xl shadow-blue-500/5 rounded-3xl p-6 sm:p-9 transition-all">

          {/* STEP 1: Which test are you preparing for? */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Which test are you preparing for?
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                  You can change this later in your profile.
                </p>
              </div>

              <div className="space-y-3.5">
                {/* Engineering & CS */}
                <div
                  onClick={() => setSelectedTrack('Engineering & CS')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                    selectedTrack === 'Engineering & CS'
                      ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                      Engineering & Computer Science
                    </h3>
                    <p className="text-xs text-slate-500">
                      FAST, NUST NET, GIKI, PIEAS, UET ECAT, NED
                    </p>
                    {/* Stack of University Logos */}
                    <div className="flex items-center -space-x-2 pt-1">
                      {engStack.map((uniId) => (
                        <div key={uniId} className="ring-2 ring-white rounded-lg shadow-sm">
                          <UniversityLogoBadge university={uniId} size="xs" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      selectedTrack === 'Engineering & CS'
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Business & Finance */}
                <div
                  onClick={() => setSelectedTrack('Business & Finance')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                    selectedTrack === 'Business & Finance'
                      ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                      Business & Finance
                    </h3>
                    <p className="text-xs text-slate-500">
                      IBA Aptitude, LUMS LCAT, NBS NUST, USAT
                    </p>
                    {/* Stack of Business Logos */}
                    <div className="flex items-center -space-x-2 pt-1">
                      {bizStack.map((uniId) => (
                        <div key={uniId} className="ring-2 ring-white rounded-lg shadow-sm">
                          <UniversityLogoBadge university={uniId} size="xs" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      selectedTrack === 'Business & Finance'
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedTrack}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Where do you most want to get in? */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Where do you most want to get in?
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                  Select your primary target university to personalize your mock tests.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {universitiesList.map((uni) => {
                  const isSelected = targetUniId === uni.id;
                  return (
                    <button
                      type="button"
                      key={uni.id}
                      onClick={() => setTargetUniId(uni.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <UniversityLogoBadge university={uni} size="sm" />
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <span className="font-bold text-sm text-slate-900 block truncate">
                          {uni.shortName}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          120 MCQs · 120 min
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* Somewhere else tile */}
                <button
                  type="button"
                  onClick={() => setTargetUniId('somewhere_else')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    targetUniId === 'somewhere_else'
                      ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="mt-3">
                    <span className="font-bold text-sm text-slate-900 block">Somewhere else</span>
                    <span className="text-[11px] text-slate-500 block">General Entry Test</span>
                  </div>
                </button>

                {/* Not decided yet tile */}
                <button
                  type="button"
                  onClick={() => setTargetUniId('not_decided')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    targetUniId === 'not_decided'
                      ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div className="mt-3">
                    <span className="font-bold text-sm text-slate-900 block">Not decided yet</span>
                    <span className="text-[11px] text-slate-500 block">Help me explore</span>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={!targetUniId}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 3: When is your test? & Which subjects worry you? */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  When is your {targetUni.shortName} test?
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                  Your study plan paces itself to this date.
                </p>
              </div>

              {/* Date selection */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    disabled={isNotSureDate}
                    value={examDate}
                    onChange={(e) => {
                      setExamDate(e.target.value);
                      setIsNotSureDate(false);
                    }}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border ${
                      isNotSureDate ? 'opacity-40 bg-slate-100 border-slate-200' : 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20'
                    } text-slate-800 text-sm focus:outline-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setIsNotSureDate(!isNotSureDate)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isNotSureDate
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Not sure yet
                  </button>
                </div>
                {!isNotSureDate && examDate && (
                  <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{daysUntilTest} days from today · Customized pace</span>
                  </p>
                )}
              </div>

              {/* Subject worries */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Which subjects worry you most?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    'Advance Maths',
                    'Basic Maths',
                    'IQ',
                    'English',
                    'Not sure, help me find out',
                  ].map((sub) => {
                    const isChecked = selectedWorries.includes(sub);
                    return (
                      <div
                        key={sub}
                        onClick={() => toggleWorry(sub)}
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-600 text-blue-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{sub}</span>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                            isChecked ? 'bg-blue-600 text-white' : 'border border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={(!examDate && !isNotSureDate) || selectedWorries.length === 0}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                <span>Continue to Summary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 4: Summary Plan */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {daysUntilTest} days until the {targetUni.shortName} test.
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                  Here is how we will start. Change anything below.
                </p>
              </div>

              {/* 3-Row Overview Card */}
              <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl divide-y divide-slate-200 overflow-hidden">
                {/* Row 1: Target */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UniversityLogoBadge university={targetUni} size="md" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Target University
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{targetUni.fullName}</h4>
                      <p className="text-xs text-slate-500">120 questions · 120 minutes</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-4 cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Row 2: Test date */}
                <div className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Target Test Date
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">
                      {isNotSureDate ? 'Flexible schedule' : examDate} ({daysUntilTest} days)
                    </h4>
                    <p className="text-xs text-blue-700">
                      Intensive phase. Medium difficulty and more full-length tests.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-4 cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Row 3: First up */}
                <div className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      First Up
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">
                      30-question diagnostic test
                    </h4>
                    <p className="text-xs text-slate-500">
                      Targeting: {selectedWorries.slice(0, 2).join(', ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-4 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Error Alert Box */}
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-rose-900">Failed to save</p>
                    <p className="text-rose-700 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveAndGoToDashboard}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <span>Save &amp; Go to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-400">
        <span>© 2026 Boardly · Personalized entry test coaching</span>
      </footer>
    </div>
  );
};
