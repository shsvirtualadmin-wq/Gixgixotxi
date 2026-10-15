import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  Sparkles,
  BookOpen,
  GraduationCap,
  Clock,
  Target,
  RefreshCw,
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db, logFirestoreError } from '../../lib/firebase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { ErrorState } from '../ui/ErrorState';
import { BrandLogo } from '../marketing/BrandLogo';
import { UNIVERSITIES, University } from '../../data/universities';

interface OnboardingFlowProps {
  onComplete: (startFirstTest: boolean, firstTestConfig?: any) => void;
}

const ACADEMIC_TRACKS = [
  { id: 'Pre-Engineering', label: 'Pre-Engineering', desc: 'Mathematics, Physics, Chemistry' },
  { id: 'ICS', label: 'ICS (Computer Science)', desc: 'Mathematics, Physics, Computer Science' },
  { id: 'Pre-Medical', label: 'Pre-Medical (MDCAT)', desc: 'Biology, Physics, Chemistry' },
  { id: 'Commerce', label: 'Commerce & Business', desc: 'Quantitative Maths, English, Analytical' },
];

const SUBJECT_OPTIONS: Record<string, string[]> = {
  'Pre-Engineering': ['Advance Mathematics', 'Physics', 'Chemistry', 'English', 'Intelligence & Analytical'],
  'ICS': ['Advance Mathematics', 'Physics', 'Computer Science', 'English', 'Intelligence & Analytical'],
  'Pre-Medical': ['Biology', 'Chemistry', 'Physics', 'English', 'Logical Reasoning'],
  'Commerce': ['Quantitative Math', 'Business Mathematics', 'English Comprehension', 'Analytical Reasoning'],
};

const TOPIC_OPTIONS: Record<string, string[]> = {
  'Advance Mathematics': ['Calculus & Derivatives', 'Integration & Limits', 'Matrices & Determinants', 'Conics & Circles', 'Trigonometric Identities'],
  'Physics': ['Vectors & Equilibrium', 'Electrostatics & Current', 'Circular Motion & Work', 'Electromagnetism', 'Nuclear Physics'],
  'Chemistry': ['Chemical Bonding & Hybridization', 'Reaction Kinetics', 'Organic Reaction Mechanisms', 'Equilibrium & Acids', 'Thermochemistry'],
  'Computer Science': ['Object Oriented Programming', 'Data Structures & Arrays', 'Logic Gates & Boolean', 'Database Systems', 'Algorithms'],
  'Biology': ['Biological Molecules & Enzymes', 'Cell Biology & Transport', 'Genetics & DNA Replication', 'Human Physiology', 'Bioenergetics'],
  'English': ['Sentence Correction', 'Vocabulary in Context', 'Critical Reading', 'Subject-Verb Agreement', 'Prepositions'],
  'Intelligence & Analytical': ['Analytical Puzzles', 'Number Series', 'Coding-Decoding', 'Logical Deductions', 'Spatial Pattern'],
  'Logical Reasoning': ['Critical Syllogisms', 'Deductive Logic', 'Fallacy Detection', 'Assertion-Reason', 'Analogies'],
  'Quantitative Math': ['Algebraic Simplification', 'Ratios & Percentages', 'Probability & Combinatorics', 'Functions & Graphs', 'Data Interpretation'],
  'Business Mathematics': ['Simple & Compound Interest', 'Annuities & Depreciation', 'Discount & Present Value', 'Matrix Applications', 'Linear Programming'],
  'English Comprehension': ['Passage Inference', 'Author Tone Analysis', 'Tone & Theme', 'Contextual Meaning', 'Paraphrasing'],
  'Analytical Reasoning': ['Constraint Matching', 'Directional Logic', 'Arrangement Problems', 'Grouping & Selection', 'Sequencing'],
};

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { user, profile, refreshProfile } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [targetUniId, setTargetUniId] = useState<string>('fast');
  const [selectedTrack, setSelectedTrack] = useState<string>('Pre-Engineering');
  const [examDate, setExamDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    return d.toISOString().slice(0, 10);
  });
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Advance Mathematics', 'Physics']);
  const [selectedWeakTopics, setSelectedWeakTopics] = useState<string[]>(['Integration & Limits', 'Vectors & Equilibrium']);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedUni: University = useMemo(() => {
    return UNIVERSITIES.find((u) => u.id === targetUniId) || UNIVERSITIES[0];
  }, [targetUniId]);

  // Available subjects for chosen track
  const availableSubjects = useMemo(() => {
    return SUBJECT_OPTIONS[selectedTrack] || SUBJECT_OPTIONS['Pre-Engineering'];
  }, [selectedTrack]);

  // Available weak topics based on chosen subjects
  const availableTopics = useMemo(() => {
    const list: string[] = [];
    selectedSubjects.forEach((sub) => {
      const topics = TOPIC_OPTIONS[sub] || [];
      topics.forEach((t) => {
        if (!list.includes(t)) list.push(t);
      });
    });
    return list;
  }, [selectedSubjects]);

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const toggleTopic = (topic: string) => {
    if (selectedWeakTopics.includes(topic)) {
      setSelectedWeakTopics(selectedWeakTopics.filter((t) => t !== topic));
    } else {
      setSelectedWeakTopics([...selectedWeakTopics, topic]);
    }
  };

  const handleSaveAndGoToDashboard = async () => {
    if (isSaving) return;
    setErrorMessage(null);
    setIsSaving(true);

    if (!user || !user.uid) {
      setIsSaving(false);
      setErrorMessage('User session not found. Please log in again to save your onboarding.');
      return;
    }

    const targetUid = user.uid;
    const userPath = `users/${targetUid}`;
    const emailNorm = (user.email || profile?.email || '').trim().toLowerCase();
    const displayName = user.displayName || profile?.displayName || profile?.name || (emailNorm ? emailNorm.split('@')[0] : 'Student');

    // ONLY safe, permitted student profile fields
    const allowedPayload: Record<string, any> = {
      uid: targetUid,
      email: emailNorm,
      displayName,
      name: displayName,
      targetUniversity: selectedUni.shortName,
      targetUniversityId: selectedUni.id,
      dream_university: selectedUni.shortName,
      testTrack: selectedTrack,
      stream: selectedTrack,
      class: selectedTrack,
      grade: selectedTrack,
      targetExam: `${selectedUni.shortName} Entrance Exam`,
      targetExamDate: examDate,
      examDate,
      weakSubjects: selectedSubjects,
      weakTopics: selectedWeakTopics,
      onboardingCompleted: true,
      onboardingComplete: true,
      registrationComplete: true,
      updatedAt: serverTimestamp(),
    };

    try {
      const userDocRef = doc(db, 'users', targetUid);
      await setDoc(userDocRef, allowedPayload, { merge: true });

      // Synchronize local cache
      try {
        const cached = localStorage.getItem(`boardly_cached_profile_${targetUid}`);
        const parsed = cached ? JSON.parse(cached) : {};
        localStorage.setItem(`boardly_cached_profile_${targetUid}`, JSON.stringify({ ...parsed, ...allowedPayload }));
      } catch {}

      await refreshProfile();
      setIsSaving(false);
      onComplete(true);
    } catch (err: any) {
      logFirestoreError(userPath, err, 'save_onboarding');
      setIsSaving(false);
      setErrorMessage(err?.message || 'Firestore write failed. Please check permissions and retry.');
    }
  };

  const progressPct = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100;

  return (
    <div className="min-h-screen bg-[var(--bg)] bg-grid-48 text-[var(--text)] flex flex-col justify-between selection:bg-[var(--brand)] selection:text-white relative overflow-x-hidden font-sans">
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#2F6BFF]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-[#7C5CFF]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Step Progress */}
      <header className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between">
        <BrandLogo size="md" />
        <div className="flex items-center gap-3">
          <Badge variant="student" size="md">
            Step {step} of 4
          </Badge>
        </div>
      </header>

      {/* Step Progress Bar */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 mb-4">
        <Progress value={progressPct} variant="student" size="sm" />
      </div>

      {/* Wizard Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <Card variant="hero" className="w-full max-w-3xl p-6 sm:p-10 space-y-8">
          {errorMessage && (
            <ErrorState
              title="Could not save onboarding profile"
              error={errorMessage}
              path={`users/${user?.uid || 'current'}`}
              onRetry={handleSaveAndGoToDashboard}
            />
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: Target University */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-left"
              >
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] font-display tracking-tight">
                    Select your primary target university
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5">
                    We tailor daily timed diagnostic drills and test simulators to your university's exact syllabus.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {UNIVERSITIES.map((uni) => {
                    const isSelected = targetUniId === uni.id;
                    return (
                      <div
                        key={uni.id}
                        onClick={() => setTargetUniId(uni.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'bg-[#2F6BFF]/15 border-[#2F6BFF] shadow-[0_0_24px_-4px_rgba(47,107,255,0.4)]'
                            : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 text-[var(--brand-2)]">
                            {uni.shortName}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#34D399]" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-snug">{uni.fullName}</h4>
                          <p className="text-[11px] text-[var(--text-muted)] mt-1">Test: {uni.testName || 'Entrance Exam'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => setStep(2)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue to Test Date & Track
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Test Date & Track */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-left"
              >
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] font-display tracking-tight">
                    Academic track & target exam date
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5">
                    Select your educational stream and the approximate date of your entry test.
                  </p>
                </div>

                {/* Track selection */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-[var(--text-muted)] tracking-wide">
                    Choose Your Academic Track
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ACADEMIC_TRACKS.map((t) => {
                      const isSelected = selectedTrack === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTrack(t.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                            isSelected
                              ? 'bg-[#2F6BFF]/15 border-[#2F6BFF] shadow-[0_0_20px_-4px_rgba(47,107,255,0.4)]'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">{t.label}</span>
                            {isSelected && <Check className="w-4 h-4 text-[#34D399]" />}
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">{t.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Exam Date Picker */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-semibold text-[var(--text-muted)] tracking-wide flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--brand-2)]" />
                    <span>Expected Entry Test Date</span>
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full sm:w-72 h-12 px-4 rounded-xl bg-white/5 border border-white/12 text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)] text-sm"
                  />
                  <p className="text-[11px] text-[var(--text-faint)]">
                    We'll display a countdown clock on your cockpit dashboard to keep your daily study pacing on track.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setStep(1)}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => setStep(3)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue to Subject Focus
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Subjects & Weak Areas */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-left"
              >
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] font-display tracking-tight">
                    Select subjects & weak areas
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5">
                    Tag the chapters and subjects where you lose marks. Boardly will prioritize these in daily revision drills.
                  </p>
                </div>

                {/* Subjects */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)] tracking-wide">
                    Subjects to Drill (Tap to select/deselect)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSubjects.map((sub) => {
                      const isSelected = selectedSubjects.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => toggleSubject(sub)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--brand)] text-white border-[var(--brand)] shadow-[0_0_16px_rgba(47,107,255,0.4)]'
                              : 'bg-white/5 text-[var(--text-muted)] border-white/10 hover:border-white/20'
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Weak topic tags */}
                <div className="space-y-2.5 pt-2">
                  <label className="text-xs font-semibold text-[var(--text-muted)] tracking-wide flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-[#F87171]" />
                    <span>Tag High-Priority Focus Topics</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTopics.map((topic) => {
                      const isTagged = selectedWeakTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggleTopic(topic)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                            isTagged
                              ? 'bg-red-500/20 text-[#F87171] border-red-500/40 shadow-[0_0_12px_rgba(248,113,113,0.3)]'
                              : 'bg-white/5 text-[var(--text-faint)] border-white/8 hover:border-white/15'
                          }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setStep(2)}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => setStep(4)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Review & Complete
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Summary & Confirmation */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-left"
              >
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] font-display tracking-tight">
                    Your customized study plan is ready
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5">
                    Confirm your diagnostic test configuration before launching your student cockpit.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                    <span className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider">
                      Target Institution
                    </span>
                    <h4 className="text-base font-bold text-white">{selectedUni.fullName}</h4>
                    <p className="text-xs text-[var(--brand-2)]">{selectedUni.testName || 'Entrance Exam'}</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                    <span className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider">
                      Academic Track & Date
                    </span>
                    <h4 className="text-base font-bold text-white">{selectedTrack}</h4>
                    <p className="text-xs text-[var(--text-muted)]">Target Date: {examDate}</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <span className="text-[11px] font-semibold text-[var(--text-faint)] uppercase tracking-wider block">
                    Priority Drill Topics
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedWeakTopics.map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1 rounded-full text-xs bg-red-500/15 border border-red-500/30 text-[#F87171] font-medium"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setStep(3)}
                    disabled={isSaving}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    isLoading={isSaving}
                    onClick={handleSaveAndGoToDashboard}
                    rightIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Save & Go to Dashboard
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 text-center text-xs text-[var(--text-faint)]">
        Preferences securely saved to your verified account profile
      </footer>
    </div>
  );
};
