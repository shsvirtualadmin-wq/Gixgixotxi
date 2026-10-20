import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { GRAND_LINE_NAME, NAKAMA_CAPTAINS_NAME } from '@/constants/branding';

interface PublicPageHeaderProps {
  title?: string;
}

const ROUTE_TITLE_MAP: Record<string, string> = {
  '/features': 'Features',
  '/crew': 'Study Crew',
  '/store': 'Boardly Store',
  '/store/get-kobans': 'Get Kobans',
  '/nakama-captains': NAKAMA_CAPTAINS_NAME,
  '/pricing': 'Pricing Plans',
  '/grand-line': GRAND_LINE_NAME,
  '/grand-line/about': `About ${GRAND_LINE_NAME}`,
  '/contact': 'Contact Support',
  '/kobans': 'About Kobans',
  '/about-kobans': 'About Kobans',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
  '/arena': 'Live Arena',
};

export const PublicPageHeader: React.FC<PublicPageHeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();

  // Resolve display title from prop or route path
  const displayTitle =
    title ||
    ROUTE_TITLE_MAP[location.pathname] ||
    (location.pathname.startsWith('/grand-line/test') ? 'Grand Line Challenge' : 'Boardly');

  const handleBack = () => {
    // Real browser history navigation: returns to previous page, or falls back to home on direct deep links
    if (typeof window !== 'undefined' && window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header
      className="sticky top-0 z-40 w-full transition-colors border-b border-[var(--border)]"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(10, 10, 10, 0.88)' : 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Left: Real Browser History Back Button */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back to previous page"
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-hover)] active:scale-95 text-[var(--text)] transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Page Title */}
          <h1 className="font-heading font-extrabold text-sm sm:text-base text-[var(--text)] tracking-tight truncate min-w-0">
            {displayTitle}
          </h1>
        </div>

        {/* Right: Theme Toggle & Home Shortcut */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text)] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <Link
            to="/"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-full border border-[var(--border)] text-xs font-heading font-semibold text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </header>
  );
};

export default PublicPageHeader;
