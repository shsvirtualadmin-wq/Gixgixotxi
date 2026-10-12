import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { Question } from '../types';
import { prepareQuestionsWithProgress } from '../lib/katexCache';
import { loadKatexCss } from '../lib/katexLoader';

interface TestPreparationScreenProps {
  questions: Question[];
  testTitle?: string;
  onReady: () => void;
}

export const TestPreparationScreen: React.FC<TestPreparationScreenProps> = ({
  questions,
  testTitle = 'Authentic Practice Test',
  onReady,
}) => {
  const total = questions.length || 1;
  const [preparedCount, setPreparedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const onReadyCalledRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    // Load KaTeX stylesheet on-demand
    loadKatexCss().catch(console.warn);

    prepareQuestionsWithProgress(questions, (current, totalCount) => {
      if (!isCancelled) {
        setPreparedCount(current);
      }
    })
      .then(() => {
        if (!isCancelled) {
          setIsCompleted(true);
          // If already cached or finished, start immediately without adding artificial waiting delay
          if (!onReadyCalledRef.current) {
            onReadyCalledRef.current = true;
            setTimeout(() => {
              onReady();
            }, 250); // micro-tick for smooth progress bar transition
          }
        }
      })
      .catch((err) => {
        console.warn('[TestPreparationScreen] Error during batch preparation:', err);
        if (!isCancelled && !onReadyCalledRef.current) {
          onReadyCalledRef.current = true;
          onReady();
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [questions, onReady]);

  const progressPercent = Math.min(100, Math.round((preparedCount / total) * 100));

  return (
    <div className="min-h-screen bg-[#07061d] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background radial ambient lights */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-violet-600/20 via-indigo-600/20 to-teal-500/15 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/60 text-center space-y-6">
          {/* Animated Glowing Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-teal-500 p-[1.5px] shadow-lg shadow-violet-600/30 animate-pulse">
            <div className="w-full h-full bg-[#0b0a26] rounded-2xl flex items-center justify-center">
              {isCompleted ? (
                <CheckCircle2 className="w-8 h-8 text-teal-400 animate-in zoom-in-75 duration-300" />
              ) : (
                <Cpu className="w-8 h-8 text-violet-400" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-950/60 border border-teal-500/30 px-3 py-1 rounded-full inline-block">
              KaTeX Math & Formula Engine
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight pt-1">
              {isCompleted ? 'Starting Your Test...' : 'Preparing Questions'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium truncate max-w-xs mx-auto">
              {testTitle}
            </p>
          </div>

          {/* Progress Bar Container */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-300 px-1">
              <span>Formula Derivation</span>
              <span className="text-violet-300">
                {preparedCount} of {total} prepared ({progressPercent}%)
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-800/90 border border-slate-700/60 overflow-hidden p-0.5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-teal-400 shadow-md shadow-violet-500/50"
                style={{ width: `${progressPercent}%` }}
                initial={{ width: '0%' }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Trust chips */}
          <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Full MathJax / LaTeX</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Instant Local Cache</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
