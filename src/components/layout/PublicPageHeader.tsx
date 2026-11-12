import React from 'react';
import { createPortal } from 'react-dom';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { GRAND_LINE_NAME, NAKAMA_CAPTAINS_NAME } from '@/constants/branding';
import { useHomeUrl, useSmartBack } from '@/utils/homeUrl';

interface PublicPageHeaderProps {
  title?: string;
}

const ROUTE_TITLE_MAP: Record<string, string> = {
  '/about': 'About Boardly',
  '/features': 'Features',
  '/how-it-works': 'How Boardly Works',
  '/faq': 'FAQ',
  '/mcqs': 'Subject MCQs',
  '/commons': 'Boardly Commons',
  '/commons/about': 'Boardly Commons',
  '/guidelines': 'Community Guidelines',
  '/commons/guidelines': 'Community Guidelines',
  '/material': 'Study Material Library',
  '/crew': 'Study Crew',
  '/rewards': 'Rewards',
  '/store': 'Boardly Store',
  '/store/get-kobans': 'Get Kobans',
  '/captains': NAKAMA_CAPTAINS_NAME,
  '/nakama-captains': NAKAMA_CAPTAINS_NAME,
  '/captains/leaderboard': 'Captain Standings',
  '/pricing': 'Pricing Plans',
  '/grand-line': GRAND_LINE_NAME,
  '/grand-line/about': `About ${GRAND_LINE_NAME}`,
  '/grand-line/leaderboard': `${GRAND_LINE_NAME} Leaderboard`,
  '/leaderboard': `${GRAND_LINE_NAME} Leaderboard`,
  '/contact': 'Contact Support',
  '/kobans': 'About Kobans',
  '/about-kobans': 'About Kobans',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
  '/arena': 'Live Arena',
  '/search': 'Search Boardly',
};

export const PublicPageHeader: React.FC<PublicPageHeaderProps> = ({ title }) => {
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const homeUrl = useHomeUrl();
  const handleBack = useSmartBack();

  // Resolve display title from prop or route path
  const displayTitle =
    title ||
    ROUTE_TITLE_MAP[location.pathname] ||
    (location.pathname.startsWith('/mcqs/')
      ? 'Subject MCQs'
      : location.pathname.startsWith('/commons/')
      ? 'Boardly Commons'
      : location.pathname.startsWith('/material/')
      ? 'Study Material'
      : location.pathname.startsWith('/grand-line/test')
      ? 'Grand Line Challenge'
      : location.pathname.startsWith('/captains/')
      ? NAKAMA_CAPTAINS_NAME
      : location.pathname.startsWith('/crew/')
      ? 'Study Crew'
      : location.pathname.startsWith('/store/')
      ? 'Boardly Store'
      : 'Boardly');

  const isDark = theme === 'dark';

  const pillElement = (
    <header
      role="banner"
      aria-label="Page Header Navigation"
      className="boardly-top-nav-pill public-header-glass-bar dark-surface-preserve"
    >
      {/* Left: Back Arrow Button + Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back to previous page"
          title="Go back"
          className="boardly-top-nav-circle-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Page Title (span so the page body retains the single semantic h1) */}
        <span
          className="font-heading font-extrabold text-sm sm:text-base text-white tracking-tight truncate min-w-0"
          style={{ color: '#FFFFFF' }}
        >
          {displayTitle}
        </span>
      </div>

      {/* Right: Theme Toggle & Home Shortcut */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={toggle}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="boardly-top-nav-circle-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <Link
          to={homeUrl}
          className="inline-flex items-center justify-center min-h-[44px] h-[44px] px-4 rounded-full border border-white/22 bg-white/[0.14] hover:bg-white/[0.22] active:scale-95 text-xs font-heading font-semibold text-white transition-colors"
          style={{ color: '#FFFFFF' }}
        >
          Home
        </Link>
      </div>
    </header>
  );

  return typeof document !== 'undefined'
    ? createPortal(pillElement, document.body)
    : pillElement;
};

export default PublicPageHeader;
