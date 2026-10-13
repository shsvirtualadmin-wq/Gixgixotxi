import React from 'react';
import { MarketingPage } from './Navbar';

export interface FooterProps {
  accent?: 'default' | 'home' | 'captain' | 'crew';
  programName?: 'Captain' | 'Crew';
  onNavigate?: (page: MarketingPage) => void;
  onOpenEventModal?: (event: 'blitz' | 'arena') => void;
  onOpenProgramModal?: (program: 'circles' | 'captains') => void;
}

const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.95-4.49V8.52a8.27 8.27 0 0 0 4.82 1.55v-3.38z" />
  </svg>
);

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.12.17 1.77 2.7 4.29 3.78.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.31z" />
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const Footer: React.FC<FooterProps> = ({
  accent = 'default',
  programName,
  onNavigate,
}) => {
  const normalizedAccent = accent === 'default' ? 'home' : accent;

  const accentConfig = {
    home: {
      glowingBorder: '#1a6dff',
      headingColor: '#6ea8ff',
      wordmarkRgba: 'rgba(26, 109, 255, 0.35)',
      description:
        "Boardly is Pakistan's self-paced diagnostic testing and exam revision platform for Matric, FSC, and entrance test candidates. Practice verified MCQs, sit timed mocks, and let Study Buddy explain any doubt in seconds.",
    },
    crew: {
      glowingBorder: '#6366f1',
      headingColor: '#a5b4fc',
      wordmarkRgba: 'rgba(99, 102, 241, 0.35)',
      description:
        'Boardly Crew brings student-led diagnostic study groups, timed test sprints, and community competitions directly to campuses across Pakistan.',
    },
    captain: {
      glowingBorder: '#f5b942',
      headingColor: '#fcd34d',
      wordmarkRgba: 'rgba(245, 185, 66, 0.35)',
      description:
        'Boardly Captain is the official campus ambassador initiative empowering student leaders to represent Boardly, support peers, and earn verified credentials.',
    },
  }[normalizedAccent];

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }

    if (onNavigate) {
      const clean = href.replace('/', '') as MarketingPage;
      if (clean) onNavigate(clean);
      else onNavigate('home');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWhatsApp = () => {
    window.open(
      'https://chat.whatsapp.com/FTXFo4P7kct0L047d5zRGy?s=cl&p=a&mlu=4&ilr=4',
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-clip bg-[#f8f9ff] pt-12 sm:pt-16">
      {/* FOOTER CONTAINER:
          width 100%, max-width 100vw, box-sizing border-box, padding 40px 24px 32px, overflow-x clip.
          radius 32px on top corners, full width, no side margins. */}
      <footer
        className="relative w-full max-w-[100vw] bg-[#060a1a] text-white text-left box-border"
        style={{
          borderTopLeftRadius: '32px',
          borderTopRightRadius: '32px',
          padding: '40px 24px 32px',
          overflowX: 'clip',
          maxWidth: '100vw',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Glowing 1px line along the top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentConfig.glowingBorder} 50%, transparent 100%)`,
          }}
          aria-hidden="true"
        />

        <div className="max-w-4xl mx-auto w-full text-left min-w-0 max-w-full [overflow-wrap:anywhere]">
          {/* 1. Logo: Transparent logo icon at 40px height + "Boardly" (white, 24px, weight 700), 12px gap, one row */}
          <div className="flex items-center gap-[12px] min-w-0 max-w-full">
            <img
              src="/assets/boardly-logo-transparent.png"
              alt="Boardly"
              className="h-[40px] w-auto shrink-0 object-contain select-none"
              style={{
                filter: 'drop-shadow(0 0 12px rgba(26, 109, 255, 0.35))',
              }}
            />
            <span className="text-[24px] font-bold text-white tracking-tight leading-none select-none">
              Boardly
            </span>
          </div>

          {/* 2. Description: 16px, line-height 1.7, rgba(255,255,255,0.8) */}
          <p
            className="mt-6 text-[16px] leading-[1.7] max-w-2xl min-w-0 max-w-full [overflow-wrap:anywhere]"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            {accentConfig.description}
          </p>

          {/* 3. Link grid: two columns (Product | Events, then Company | Legal),
              column gap 24px, row gap 32px, both columns inside screen width */}
          <div className="mt-10 grid grid-cols-2 gap-x-[24px] gap-y-[32px] w-full min-w-0 max-w-full">
            {/* ROW 1: Column 1 - Product */}
            <div className="min-w-0 max-w-full">
              <h3
                className="text-[13px] font-bold uppercase tracking-[0.1em] mb-4 font-sans text-[#6ea8ff] block truncate"
              >
                Product
              </h3>
              <ul className="space-y-[14px] text-[16px] text-white">
                <li>
                  <a
                    href="/features"
                    onClick={(e) => handleLink(e, '/features')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="/boardly-ai"
                    onClick={(e) => handleLink(e, '/boardly-ai')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    Boardly AI
                  </a>
                </li>
                <li>
                  <a
                    href="/mdcat"
                    onClick={(e) => handleLink(e, '/mdcat')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    MDCAT Prep
                  </a>
                </li>
                <li>
                  <a
                    href="/fsc-matric"
                    onClick={(e) => handleLink(e, '/fsc-matric')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    FSC &amp; Matric
                  </a>
                </li>
                <li>
                  <a
                    href="/fast-nu"
                    onClick={(e) => handleLink(e, '/fast-nu')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    FAST-NU Prep
                  </a>
                </li>
                <li>
                  <a
                    href="/pricing"
                    onClick={(e) => handleLink(e, '/pricing')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            {/* ROW 1: Column 2 - Events */}
            <div className="min-w-0 max-w-full">
              <h3
                className="text-[13px] font-bold uppercase tracking-[0.1em] mb-4 font-sans text-[#6ea8ff] block truncate"
              >
                Events
              </h3>
              <ul className="space-y-[14px] text-[16px] text-white">
                <li>
                  <a
                    href="/events/blitz"
                    onClick={(e) => handleLink(e, '/events/blitz')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    Boardly Blitz
                  </a>
                </li>
                <li>
                  <a
                    href="/events/arena"
                    onClick={(e) => handleLink(e, '/events/arena')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    Boardly Arena
                  </a>
                </li>
                <li>
                  <a
                    href="/captain"
                    onClick={(e) => handleLink(e, '/captain')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    Boardly Captain
                  </a>
                </li>
                <li>
                  <a
                    href="/crew"
                    onClick={(e) => handleLink(e, '/crew')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    Boardly Crew
                  </a>
                </li>
                <li>
                  <a
                    href="/universities"
                    onClick={(e) => handleLink(e, '/universities')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    University Explorer
                  </a>
                </li>
              </ul>
            </div>

            {/* ROW 2: Column 1 - Company */}
            <div className="min-w-0 max-w-full">
              <h3
                className="text-[13px] font-bold uppercase tracking-[0.1em] mb-4 font-sans text-[#6ea8ff] block truncate"
              >
                Company
              </h3>
              <ul className="space-y-[14px] text-[16px] text-white">
                <li>
                  <a
                    href="/about"
                    onClick={(e) => handleLink(e, '/about')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    About Boardly
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    onClick={(e) => handleLink(e, '/contact')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    Contact Support
                  </a>
                </li>
                <li>
                  <a
                    href="/faqs"
                    onClick={(e) => handleLink(e, '/faqs')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    Help &amp; FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* ROW 2: Column 2 - Legal */}
            <div className="min-w-0 max-w-full">
              <h3
                className="text-[13px] font-bold uppercase tracking-[0.1em] mb-4 font-sans text-[#6ea8ff] block truncate"
              >
                Legal
              </h3>
              <ul className="space-y-[14px] text-[16px] text-white">
                <li>
                  <a
                    href="/privacy"
                    onClick={(e) => handleLink(e, '/privacy')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    onClick={(e) => handleLink(e, '/terms')}
                    className="hover:opacity-80 transition-opacity min-h-[40px] flex items-center cursor-pointer min-w-0 [overflow-wrap:anywhere]"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* 4. Community card: heading 22px, text 15px, WhatsApp button full-width pill, 52px tall, 16px text */}
          <div
            className="mt-12 w-full text-left min-w-0 max-w-full [overflow-wrap:anywhere]"
            style={{
              borderRadius: '24px',
              padding: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxSizing: 'border-box',
            }}
          >
            <h3 className="text-[22px] font-semibold text-white tracking-tight leading-snug">
              Join the Boardly community
            </h3>
            <p
              className="mt-2 text-[15px] leading-relaxed"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Hear about new events first and get study tips from the team on WhatsApp.
            </p>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="mt-5 w-full h-[52px] min-h-[52px] rounded-full bg-white text-[#060a1a] font-bold text-[16px] transition-transform active:scale-[0.98] cursor-pointer flex items-center justify-center shadow-md select-none"
            >
              Join on WhatsApp
            </button>
          </div>

          {/* 5. Social icons: 28px icons, 28px gap */}
          <div className="mt-10 flex items-center justify-center gap-[28px] text-white">
            <a
              href="https://chat.whatsapp.com/FTXFo4P7kct0L047d5zRGy?s=cl&p=a&mlu=4&ilr=4"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="text-white hover:opacity-80 transition-opacity inline-flex items-center justify-center"
            >
              <WhatsAppIcon className="w-[28px] h-[28px]" />
            </a>
            <a
              href="https://www.instagram.com/shsvirtualacademy?vrfl=MXR2c2NuZDFwd3RsMQ=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-white hover:opacity-80 transition-opacity inline-flex items-center justify-center"
            >
              <InstagramIcon className="w-[28px] h-[28px]" />
            </a>
            <a
              href="https://youtube.com/@shsvirtualacademy?si=BhCdzhaFyz4MNyJC"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="text-white hover:opacity-80 transition-opacity inline-flex items-center justify-center"
            >
              <YouTubeIcon className="w-[28px] h-[28px]" />
            </a>
            <a
              href="https://www.tiktok.com/@shsvirtualacademy?_r=1&_t=ZS-9ASYILp1Sq5"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="text-white hover:opacity-80 transition-opacity inline-flex items-center justify-center"
            >
              <TikTokIcon className="w-[28px] h-[28px]" />
            </a>
          </div>

          {/* 6. Copyright: 14px, disclaimer: 12px */}
          <p
            className="mt-5 text-center text-[14px] min-w-0 max-w-full [overflow-wrap:anywhere]"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            &copy; 2026 Boardly. Operated by SHS Virtual Academy.
          </p>

          <p
            className="mt-2 mx-auto text-center text-[12px] max-w-[320px] leading-relaxed min-w-0 max-w-full [overflow-wrap:anywhere]"
            style={{ color: 'rgba(255, 255, 255, 0.55)' }}
          >
            Independent online testing engine. All institute names and test marks belong to their respective authorities.
          </p>

          {/* 7. "Boardly" watermark at the bottom: max 22vw, cut off by bottom edge, never wider than screen */}
          <div
            className="w-full max-w-full overflow-hidden flex justify-center pointer-events-none select-none mt-8 -mb-8 leading-none"
            aria-hidden="true"
          >
            <span
              className="font-extrabold tracking-tighter text-transparent bg-clip-text text-center whitespace-nowrap"
              style={{
                fontSize: '22vw',
                lineHeight: 0.8,
                maxWidth: '100vw',
                backgroundImage: `linear-gradient(to bottom, ${accentConfig.wordmarkRgba} 0%, transparent 85%)`,
              }}
            >
              Boardly
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
