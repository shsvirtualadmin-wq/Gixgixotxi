import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string | number;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 0-indexed
  onStepClick?: (stepIndex: number) => void;
  accent?: 'indigo' | 'violet' | 'teal' | 'amber';
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  accent = 'indigo',
}) => {
  const accentColors = {
    indigo: 'bg-indigo-600 text-white',
    violet: 'bg-violet-600 text-white',
    teal: 'bg-teal-600 text-white',
    amber: 'bg-amber-600 text-white',
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -z-10" />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const canClick = onStepClick && idx <= currentStep;

          return (
            <div
              key={step.id}
              onClick={() => canClick && onStepClick(idx)}
              className={`flex flex-col items-center group ${
                canClick ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-50 dark:ring-emerald-950/40'
                    : isCurrent
                    ? `${accentColors[accent]} ring-4 ring-indigo-50 dark:ring-indigo-950/40 shadow-md`
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={`mt-2 text-xs font-bold whitespace-nowrap hidden sm:block ${
                  isCurrent
                    ? 'text-slate-900 dark:text-white'
                    : isCompleted
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400'
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
