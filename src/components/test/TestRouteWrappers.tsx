import React, { useEffect, useState } from 'react';
import { getAttemptSession, AttemptSession } from '../../services/testEngine';
import { TestRunnerScreen } from './TestRunnerScreen';
import { TestResultScreen } from './TestResultScreen';
import { Skeleton } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { AlertCircle } from 'lucide-react';

interface TestRouteWrapperProps {
  attemptId: string;
  onNavigate: (route: string) => void;
}

export const TestRunnerRouteWrapper: React.FC<TestRouteWrapperProps> = ({
  attemptId,
  onNavigate,
}) => {
  const [session, setSession] = useState<AttemptSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        let loadedSession: AttemptSession | null = null;
        if (attemptId) {
          loadedSession = await getAttemptSession(attemptId);
        }

        // Fallback: check stored active test session in localStorage
        if (!loadedSession && typeof window !== 'undefined') {
          const raw = localStorage.getItem('boardly_university_test_session');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
              const endsAtMs = parsed.endTime || (Date.now() + (parsed.durationMinutes || 20) * 60 * 1000);
              const initialAnsMap: Record<string, number | null> = {};
              parsed.questions.forEach((q: any, i: number) => {
                const qId = q.id || `q_${i}`;
                initialAnsMap[qId] = parsed.userAnswers ? parsed.userAnswers[i] : null;
              });

              loadedSession = {
                id: attemptId || `att_${Date.now()}`,
                userId: parsed.userId || 'student',
                title: parsed.title || 'Entrance Mock Test',
                mode: 'mock',
                subject: parsed.subject || 'All Subjects',
                durationMinutes: parsed.durationMinutes || 20,
                startedAt: new Date(parsed.startTime || Date.now()).toISOString(),
                endsAt: new Date(endsAtMs).toISOString(),
                serverTimeOffsetMs: 0,
                status: 'in_progress',
                questions: parsed.questions.map((q: any, i: number) => ({
                  id: q.id || `q_${i}`,
                  stem: q.q || q.question || '',
                  options: q.options || [],
                  correctOptionId: q.correct ?? 0,
                  subject: q.subject || parsed.subject || 'Test',
                  chapter: q.chapter || '',
                  explanation: q.explain || q.explanation || '',
                })),
                totalQuestions: parsed.questions.length,
                currentIndex: parsed.currentIndex || 0,
                answers: initialAnsMap,
                flaggedQuestions: [],
                negativeMarkingPercent: parsed.negativeMarkingPercent ?? 0,
                marksPerQuestion: parsed.marksPerQuestion ?? 1,
                totalMarks: parsed.totalMarks,
              };
            }
          }
        }

        if (isMounted) {
          if (loadedSession) {
            setSession(loadedSession);
          } else {
            setError('Test session not found or has expired.');
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Error loading test session');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 animate-pulse flex items-center justify-center text-[#22D3EE] font-bold font-mono">
          ...
        </div>
        <p className="text-xs text-[#A3B0CC] animate-pulse">Initializing distraction-free test cockpit...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-6 text-center space-y-4 text-white">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold">Session Unavailable</h2>
          <p className="text-xs text-[#A3B0CC] max-w-sm">{error || 'No active test found.'}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => onNavigate('/dashboard/practice')}>
          Return to Practice Vault
        </Button>
      </div>
    );
  }

  return (
    <TestRunnerScreen
      session={session}
      onCompleted={(completedSession) => {
        onNavigate(`/results/${completedSession.id}`);
      }}
      onExit={() => onNavigate('/dashboard/practice')}
    />
  );
};

export const TestResultRouteWrapper: React.FC<TestRouteWrapperProps> = ({
  attemptId,
  onNavigate,
}) => {
  const [session, setSession] = useState<AttemptSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        let loadedSession: AttemptSession | null = null;
        if (attemptId) {
          loadedSession = await getAttemptSession(attemptId);
        }

        if (isMounted) {
          if (loadedSession && loadedSession.results) {
            setSession(loadedSession);
          } else {
            setError('Test results not found.');
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err?.message || 'Error loading test results');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 animate-pulse flex items-center justify-center text-[#22D3EE] font-bold font-mono">
          ...
        </div>
        <p className="text-xs text-[#A3B0CC] animate-pulse">Calculating chapter breakdowns & ranks...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-6 text-center space-y-4 text-white">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold">Results Not Found</h2>
          <p className="text-xs text-[#A3B0CC] max-w-sm">{error || 'Could not locate test attempt.'}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => onNavigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <TestResultScreen
      session={session}
      onRetake={() => onNavigate('/dashboard/practice')}
      onGoHome={() => onNavigate('/dashboard')}
      onPracticeWeakChapter={() => onNavigate('/dashboard/practice')}
    />
  );
};
