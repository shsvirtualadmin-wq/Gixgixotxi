import React from 'react';
import { Facebook, Instagram, Youtube } from 'lucide-react';

interface TrustFooterProps {
  onNavigate?: (route: string) => void;
  className?: string;
  light?: boolean;
}

const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.95-4.49V8.52a8.27 8.27 0 0 0 4.82 1.55v-3.38z" />
  </svg>
);

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    href: 'Https://www.facebook.com/share/19a8tbUjKN/',
    icon: Facebook,
    isCustom: false,
    hoverStyle: 'hover:text-[#1877F2] hover:bg-blue-50/80 hover:border-blue-200',
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/shsvirtualacademy?vrfl=MXR2c2NuZDFwd3RsMQ==',
    icon: Instagram,
    isCustom: false,
    hoverStyle: 'hover:text-[#E4405F] hover:bg-rose-50/80 hover:border-rose-200',
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com/@shsvirtualacademy?si=BhCdzhaFyz4MNyJC',
    icon: Youtube,
    isCustom: false,
    hoverStyle: 'hover:text-[#FF0000] hover:bg-red-50/80 hover:border-red-200',
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@shsvirtualacademy?_r=1&_t=ZS-9ASYILp1Sq5',
    icon: TikTokIcon,
    isCustom: true,
    hoverStyle: 'hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300',
  },
];

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
    <footer className={`py-6 text-center text-xs space-y-3.5 relative z-10 ${className}`}>
      {/* Social Media Links Row */}
      <div className="flex items-center justify-center gap-3">
        {SOCIAL_LINKS.map((item) => {
          const IconComponent = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`SHS Virtual Academy on ${item.name}`}
              className={
                light
                  ? 'w-8 h-8 rounded-full bg-slate-800/80 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 border border-slate-700/60 shadow-sm hover:scale-105 active:scale-95'
                  : `w-8 h-8 rounded-full bg-white text-slate-600 flex items-center justify-center transition-all duration-200 border border-slate-200/90 shadow-xs hover:scale-105 active:scale-95 ${item.hoverStyle}`
              }
            >
              <IconComponent className="w-4 h-4" />
            </a>
          );
        })}
      </div>

      {/* Text Navigation Links */}
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

      {/* Copyright */}
      <div className={light ? 'text-slate-500 text-[11px]' : 'text-slate-400 dark:text-slate-500 text-[11px]'}>
        © {new Date().getFullYear()} Boardly · All rights reserved.
      </div>
    </footer>
  );
};
