import React, { useState } from 'react';
import {
  Award,
  Clock,
  Target,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles,
  BarChart3,
  ListFilter,
  Check,
} from 'lucide-react';
import { MathText } from '../ui/MathText';
import { AttemptSession, AttemptResults, ChapterAccuracy } from '../../services/testEngine';

interface TestResultScreenProps {
  session: AttemptSession;
  onRetake: () => void;
  onGoHome: () => void;
  onPracticeWeakChapter?: (subject: string, chapter: string) => void;
  onAskBoardy?: (questionStem: string, explanation?: string) => void;
}

export const TestResultScreen: React.FC<TestResultScreenProps> = ({
  session,
  onRetake,
  onGoHome,
  onPracticeWeakChapter,
  onAskBoardy,
}) => {
  const results: AttemptResults = session.results || {
    score: 0,
    totalQuestions: session.questions.length,
    correctAnswers: 0,
    wrongAnswers: 0,
    skippedAnswers: session.questions.length,
    accuracy: 0,
    timeSpentSeconds: 0,
    chapterBreakdown: [],
  };

  const [activeTab, setActiveTab] = useState<'review' | 'chapters'>('review');
  const [filterType, setFilterType] = useState<'all' | 'wrong' | 'correct' | 'skipped'>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const toggleExpand = (qId: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Performance status banner
  const getPerformanceFeedback = (accuracy: number) => {
    if (accuracy >= 85) return { label: 'Outstanding Mastery!', text: 'Ranked in the top echelon of test-takers.', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (accuracy >= 70) return { label: 'Solid Performance!', text: 'Strong grasp across core test concepts.', color: 'text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/20' };
    if (accuracy >= 50) return { label: 'Good Effort!', text: 'Review weak chapters below to boost your speed and score.', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Needs Reinforcement', text: 'Targeted drills on these chapters will significantly elevate your rank.', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  };

  const feedback = getPerformanceFeedback(results.accuracy);

  // Filtered questions
  const filteredQuestions = session.questions.filter((q) => {
    const userChoice = session.answers[q.id];
    const isCorrect = userChoice !== null && (userChoice === q.correctOptionId || String(userChoice) === String(q.correctOptionId));
    const isSkipped = userChoice === null || userChoice === undefined;

    if (filterType === 'wrong') return !isCorrect && !isSkipped;
    if (filterType === 'correct') return isCorrect;
    if (filterType === 'skipped') return isSkipped;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070B14] text-[#EAF0FF] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#2F6BFF]/20 text-[#22D3EE] border border-[#2F6BFF]/30">
              {session.subject}
            </span>
            <h1 className="text-xl md:text-2xl font-black text-white mt-2">
              {session.title} · Results & Analysis
            </h1>
          </div>
          <button
            onClick={onGoHome}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 cursor-pointer"
          >
            Dashboard
          </button>
        </div>

        {/* Hero Performance Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#0F172A] to-[#0B1220] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#2F6BFF]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold ${feedback.color}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{feedback.label}</span>
              <span className="opacity-75 font-normal">• {feedback.text}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/8 text-center">
                <p className="text-2xl md:text-3xl font-black text-white">
                  {results.score}
                  <span className="text-xs text-[#A3B0CC] font-normal"> / {results.totalMarks || results.totalQuestions}</span>
                </p>
                <p className="text-xs text-[#A3B0CC] font-bold mt-1">Total Score</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/8 text-center">
                <p className="text-2xl md:text-3xl font-black text-[#22D3EE]">
                  {results.accuracy}%
                </p>
                <p className="text-xs text-[#A3B0CC] font-bold mt-1">Accuracy</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/8 text-center">
                <p className="text-2xl md:text-3xl font-black text-emerald-400">
                  {results.correctAnswers}
                  <span className="text-xs text-[#A3B0CC] font-normal"> / {results.totalQuestions}</span>
                </p>
                <p className="text-xs text-[#A3B0CC] font-bold mt-1">Correct MCQs</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/8 text-center">
                <p className="text-2xl md:text-3xl font-black text-amber-400">
                  {formatSeconds(results.timeSpentSeconds)}
                </p>
                <p className="text-xs text-[#A3B0CC] font-bold mt-1">Time Spent</p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6 mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onRetake}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Test</span>
            </button>

            <button
              onClick={onGoHome}
              className="px-5 py-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#2557D6] text-white font-bold text-xs shadow-lg shadow-blue-500/20 cursor-pointer flex items-center gap-2"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('review')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === 'review'
                ? 'bg-[#2F6BFF] text-white shadow-md shadow-blue-500/20'
                : 'text-[#A3B0CC] hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Question Review ({session.questions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chapters')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
              activeTab === 'chapters'
                ? 'bg-[#2F6BFF] text-white shadow-md shadow-blue-500/20'
                : 'text-[#A3B0CC] hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Chapter Mastery ({results.chapterBreakdown.length})</span>
          </button>
        </div>

        {/* Tab 1: Question Review */}
        {activeTab === 'review' && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-[#A3B0CC] hover:text-white'
                }`}
              >
                All ({session.questions.length})
              </button>
              <button
                onClick={() => setFilterType('wrong')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  filterType === 'wrong'
                    ? 'bg-rose-500 text-white'
                    : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                }`}
              >
                Incorrect ({results.wrongAnswers})
              </button>
              <button
                onClick={() => setFilterType('correct')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  filterType === 'correct'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                }`}
              >
                Correct ({results.correctAnswers})
              </button>
              <button
                onClick={() => setFilterType('skipped')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  filterType === 'skipped'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                }`}
              >
                Skipped ({results.skippedAnswers})
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => {
                const userChoice = session.answers[q.id];
                const isCorrect = userChoice !== null && (userChoice === q.correctOptionId || String(userChoice) === String(q.correctOptionId));
                const isSkipped = userChoice === null || userChoice === undefined;
                const isExpanded = expandedQuestions[q.id] ?? true;

                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-2xl bg-[#0B1220] border border-white/10 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#A3B0CC]">
                          Q{session.questions.findIndex((item) => item.id === q.id) + 1}
                        </span>
                        {isCorrect && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Correct
                          </span>
                        )}
                        {!isCorrect && !isSkipped && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3" /> Incorrect
                          </span>
                        )}
                        {isSkipped && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Skipped
                          </span>
                        )}
                        {q.chapter && (
                          <span className="text-[11px] text-[#A3B0CC] hidden sm:inline">
                            • {q.chapter}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => toggleExpand(q.id)}
                        className="p-1 rounded text-[#A3B0CC] hover:text-white cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Question Stem */}
                    <div className="text-sm md:text-base font-medium text-white leading-relaxed">
                      <MathText text={q.stem} />
                    </div>

                    {isExpanded && (
                      <div className="space-y-2 pt-2 border-t border-white/8">
                        {q.options.map((optText, optIdx) => {
                          const isStudentSelected = userChoice === optIdx;
                          const isTheCorrectOne =
                            optIdx === q.correctOptionId || String(optIdx) === String(q.correctOptionId);
                          const optLetter = String.fromCharCode(65 + optIdx);

                          let borderStyle = 'border-white/10 bg-white/5 text-[#A3B0CC]';
                          if (isTheCorrectOne) {
                            borderStyle = 'border-emerald-500 bg-emerald-500/15 text-white font-bold';
                          } else if (isStudentSelected && !isTheCorrectOne) {
                            borderStyle = 'border-rose-500 bg-rose-500/15 text-white';
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded-xl border text-xs md:text-sm flex items-center justify-between ${borderStyle}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-bold w-5">{optLetter})</span>
                                <MathText text={optText} />
                              </div>
                              <div className="shrink-0 text-xs">
                                {isTheCorrectOne && (
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Correct Answer
                                  </span>
                                )}
                                {isStudentSelected && !isTheCorrectOne && (
                                  <span className="text-rose-400 font-bold">Your Choice</span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Explanation Box */}
                        {q.explanation && (
                          <div className="mt-3 p-4 rounded-xl bg-[#0F172A] border border-white/10 text-xs md:text-sm text-[#EAF0FF] space-y-1">
                            <p className="font-bold text-[#22D3EE] flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5" /> Explanation:
                            </p>
                            <div className="text-[#A3B0CC] leading-relaxed pt-1">
                              <MathText text={q.explanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Chapter Breakdown */}
        {activeTab === 'chapters' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.chapterBreakdown.map((item, idx) => {
                const isWeak = item.accuracy < 60;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-[#0B1220] border border-white/10 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-[#A3B0CC]">{item.subject}</span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{item.chapter}</h4>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          isWeak
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.accuracy}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isWeak ? 'bg-rose-500' : 'bg-[#2F6BFF]'
                          }`}
                          style={{ width: `${item.accuracy}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-[#A3B0CC]">
                        {item.correct} of {item.total} correct
                      </p>
                    </div>

                    {isWeak && onPracticeWeakChapter && (
                      <button
                        onClick={() => onPracticeWeakChapter(item.subject, item.chapter)}
                        className="w-full mt-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#22D3EE]" />
                        <span>Practice This Chapter</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
