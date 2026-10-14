import React, { useState } from 'react';
import { IPhoneAppPreview, PreviewTab } from '../marketing/IPhoneAppPreview';
import { Smartphone, X, ChevronRight, Sparkles } from 'lucide-react';

interface PhoneMockupProps {
  screen?: PreviewTab;
  className?: string;
  showTabs?: boolean;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  screen = 'student',
  className = '',
  showTabs = true,
}) => {
  return (
    <div className={`relative transition-all ${className}`}>
      <IPhoneAppPreview initialTab={screen} showTabs={showTabs} />
    </div>
  );
};

export const DashboardPhoneCard: React.FC<{
  title?: string;
  subtitle?: string;
  initialScreen?: PreviewTab;
  onDismiss?: () => void;
}> = ({
  title = 'Mobile App Experience',
  subtitle = 'Experience Boardly optimized for iPhone and mobile web',
  initialScreen = 'student',
  onDismiss,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative rounded-3xl p-5 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 border border-blue-200/60 dark:border-blue-900/40 shadow-sm transition-all overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold uppercase tracking-wider">
                Live Preview
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
          >
            {expanded ? 'Hide Phone' : 'View Phone'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 cursor-pointer"
            title="Dismiss preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 animate-in fade-in">
          <PhoneMockup screen={initialScreen} showTabs={true} />
        </div>
      )}
    </div>
  );
};

export default PhoneMockup;
