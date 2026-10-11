import React from 'react';

interface TrustFooterProps {
  onNavigate?: (route: string) => void;
  className?: string;
  light?: boolean;
}

export const TrustFooter: React.FC<TrustFooterProps> = ({
  onNavigate,
  className = '',
  light = false,
}) => {
  const handleNav = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const linkClass = light
    ? 'text-slate-400 hover:text-white transition-colors cursor-pointer text-xs'
    : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors cursor-pointer text-xs';

  return (
    <footer className={`py-6 text-center text-xs space-y-2 relative z-10 ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <button type="button" onClick={() => handleNav('/about')} className={linkClass}>
          About
        </button>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <button type="button" onClick={() => handleNav('/contact')} className={linkClass}>
          Contact
        </button>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <a href="mailto:support@boardly.cfd" className={linkClass}>
          support@boardly.cfd
        </a>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <button type="button" onClick={() => handleNav('/privacy')} className={linkClass}>
          Privacy Policy
        </button>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <button type="button" onClick={() => handleNav('/terms')} className={linkClass}>
          Terms of Service
        </button>
      </div>
      <div className={light ? 'text-slate-500 text-[11px]' : 'text-slate-400 dark:text-slate-500 text-[11px]'}>
        © {new Date().getFullYear()} Boardly · All rights reserved.
      </div>
    </footer>
  );
};
