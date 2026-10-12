import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export interface FaqItem {
  question: string;
  answer: string | React.ReactNode;
}

export interface FaqAccordionProps {
  items: FaqItem[];
  accent?: 'default' | 'captain' | 'crew';
  className?: string;
  dark?: boolean;
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({
  items,
  accent = 'default',
  className = '',
  dark = false,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  const accentStyles = {
    default: {
      activeBorder: dark ? 'border-indigo-500/40' : 'border-indigo-500/30',
      activeText: dark ? 'text-teal-400' : 'text-indigo-600',
      iconBg: dark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600',
    },
    captain: {
      activeBorder: dark ? 'border-amber-500/40' : 'border-amber-500/30',
      activeText: dark ? 'text-amber-400' : 'text-amber-600',
      iconBg: dark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-600',
    },
    crew: {
      activeBorder: dark ? 'border-violet-500/40' : 'border-violet-500/30',
      activeText: dark ? 'text-violet-400' : 'text-violet-600',
      iconBg: dark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-50 text-violet-600',
    },
  }[accent];

  return (
    <div className={`max-w-3xl mx-auto divide-y divide-slate-200/80 dark:divide-slate-800 ${className}`}>
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;

        return (
          <div key={idx} className="py-4 sm:py-5 text-left">
            <button
              type="button"
              onClick={() => toggleItem(idx)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 py-2 text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg min-h-[44px]"
            >
              <span
                className={`text-base sm:text-lg font-bold font-display transition-colors duration-200 ${
                  isOpen
                    ? accentStyles.activeText
                    : dark
                    ? 'text-white group-hover:text-slate-200'
                    : 'text-slate-900 group-hover:text-slate-700'
                }`}
              >
                {item.question}
              </span>

              {/* Plus icon that rotates 45deg to an X */}
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${accentStyles.iconBg}`}
                style={{
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                }}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </span>
            </button>

            {/* Smooth height animation via grid-template-rows */}
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{
                gridTemplateRows: isOpen ? '1fr' : '0fr',
              }}
            >
              <div className="overflow-hidden min-h-0">
                <div
                  className={`pt-2 pb-1 text-sm sm:text-base leading-relaxed font-sans ${
                    dark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {typeof item.answer === 'string' ? <p>{item.answer}</p> : item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
