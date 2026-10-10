import React, { useState } from 'react';
import { Award, CheckCircle2, XCircle, Clock, ArrowRight, RotateCw, Sparkles, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Question } from '../../types';
import { MathText } from '../MathText';
import { BoardyMascot } from '../BoardyMascot';

interface StudentTestResultProps {
  title: string;
  questions: Question[];
  userAnswers: (number | null)[];
  timeSpentSeconds: number;
  negativeMarkingPercent: number;
  onRetake: () => void;
  onGoHome: () => void;
  onAskBoardyAboutQuestion: (question: Question, studentAnswerIndex: number | null) => void;
}

export const StudentTestResult: React.FC<StudentTestResultProps> = ({
  title,
  questions,
  userAnswers,
  timeSpentSeconds,
  negativeMarkingPercent,
  onRetake,
  onGoHome,
  onAskBoardyAboutQuestion,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'mistakes' | 'correct'>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Compute marks
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;

  questions.forEach((q, idx) => {
    const ans = userAnswers[idx];
    if (ans === null) {
      unattemptedCount++;
    } else if (ans === q.correct) {
      correctCount++;
    } else {
      wrongCount++;
    }
  });

  const rawScore = correctCount - wrongCount * negativeMarkingPercent;
  const finalScore = Math.max(0, Math.round(rawScore * 10) / 10);
  const percentage = Math.round((finalScore / questions.length) * 100);

  const minutesSpent = Math.max(1, Math.round(timeSpentSeconds / 60));

  const filteredIndices = questions
    .map((q, idx) => {
      const ans = userAnswers[idx];
      const isCorrect = ans === q.correct;
      const isWrong = ans !== null && !isCorrect;

      if (filterMode === 'mistakes' && !isWrong) return -1;
      if (filterMode === 'correct' && !isCorrect) return -1;
      return idx;
    })
    .filter((idx) => idx !== -1);

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-24 px-4 sm:px-6 pt-6 max-w-4xl mx-auto space-y-8 font-sans">
      {/* Top Banner */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Test Completed
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h1>
            <p className="text-xs text-slate-500">
              Completed in {minutesSpent} minutes · Detailed Boardy AI breakdown below
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center p-4 rounded-2xl bg-blue-50/70 border border-blue-100 min-w-[110px]">
              <span className="text-3xl font-black text-blue-900 block">{percentage}%</span>
              <span className="text-[11px] font-semibold text-blue-700">Accuracy</span>
            </div>
            <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-200 min-w-[110px]">
              <span className="text-3xl font-black text-slate-900 block">{finalScore}</span>
              <span className="text-[11px] font-semibold text-slate-500">Out of {questions.length}</span>
            </div>
          </div>
        </div>

        {/* 4 Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-bold mb-0.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Correct</span>
            </div>
            <span className="text-xl font-black text-emerald-950">{correctCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100">
            <div className="flex items-center justify-center gap-1.5 text-rose-700 font-bold mb-0.5">
              <XCircle className="w-4 h-4" />
              <span>Wrong</span>
            </div>
            <span className="text-xl font-black text-rose-950">{wrongCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-center gap-1.5 text-slate-500 font-bold mb-0.5">
              <span>Skipped</span>
            </div>
            <span className="text-xl font-black text-slate-700">{unattemptedCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center justify-center gap-1.5 text-indigo-700 font-bold mb-0.5">
              <Clock className="w-4 h-4" />
              <span>Time</span>
            </div>
            <span className="text-xl font-black text-indigo-950">{minutesSpent}m</span>
          </div>
        </div>

        {/* Boardy Feedback Strip */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border border-blue-100 flex items-center gap-4">
          <BoardyMascot size="sm" />
          <div className="flex-1">
            <span className="font-bold text-xs text-blue-900 block">Boardy's Assessment:</span>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {percentage >= 75
                ? 'Excellent mastery! Your speed and precision match the admission threshold. Keep reviewing edge cases.'
                : percentage >= 50
                ? 'Solid attempt! Focus on the questions you got wrong below to prevent similar point deductions on exam day.'
                : "Good effort for your diagnostic test! Expand the questions below and let's review step-by-step explanations together."}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onGoHome}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Back to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onRetake}
            className="py-3 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCw className="w-4 h-4" />
            <span>Retake sprint</span>
          </button>
        </div>
      </div>

      {/* Review Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Detailed Question Review
            </h2>
            <p className="text-xs text-slate-500">
              Step-by-step logic and verified reasoning for every question.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto text-xs font-semibold">
            {(['all', 'mistakes', 'correct'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer capitalize ${
                  filterMode === mode
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {mode === 'mistakes' ? `Mistakes (${wrongCount})` : mode}
              </button>
            ))}
          </div>
        </div>

        {/* List of Questions */}
        <div className="space-y-4">
          {filteredIndices.map((qIdx) => {
            const q = questions[qIdx];
            const studentAns = userAnswers[qIdx];
            const isCorrect = studentAns === q.correct;
            const isSkipped = studentAns === null;
            const isExpanded = expandedIndex === qIdx;

            return (
              <div
                key={q.id || qIdx}
                className={`bg-white/95 backdrop-blur-xl border rounded-2xl p-5 shadow-sm transition-all ${
                  isCorrect
                    ? 'border-emerald-200/70'
                    : isSkipped
                    ? 'border-slate-200'
                    : 'border-rose-200/80 bg-rose-50/20'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-400">
                        Q{qIdx + 1}
                      </span>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Correct (+1)
                        </span>
                      ) : isSkipped ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Skipped (0)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3 h-3" /> Incorrect ({negativeMarkingPercent > 0 ? `-${negativeMarkingPercent}` : '0'})
                        </span>
                      )}
                      {q.topic && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          · {q.topic}
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-semibold text-slate-900 pt-1">
                      <MathText text={q.q || q.question || ''} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isExpanded ? null : qIdx)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label="Toggle explanation"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Options display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs">
                  {q.options.map((opt, oIdx) => {
                    const isChosen = studentAns === oIdx;
                    const isTheCorrect = q.correct === oIdx;
                    const letter = String.fromCharCode(65 + oIdx);

                    let optStyle = 'border-slate-200 bg-slate-50/50 text-slate-700';
                    if (isTheCorrect) {
                      optStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold';
                    } else if (isChosen && !isTheCorrect) {
                      optStyle = 'border-rose-400 bg-rose-50 text-rose-950 font-bold line-through';
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 ${optStyle}`}
                      >
                        <span className="font-mono font-bold text-[10px] w-4">{letter}.</span>
                        <div className="flex-1">
                          <MathText text={opt} />
                        </div>
                        {isTheCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation strip & Ask Boardy */}
                {(isExpanded || !isCorrect) && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-blue-900 block">Explanation:</span>
                      <MathText text={q.explain || q.explanation || 'No step-by-step explanation available.'} />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onAskBoardyAboutQuestion(q, studentAns)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-blue-200 hover:border-blue-400 text-blue-700 font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Ask Boardy about this question</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
