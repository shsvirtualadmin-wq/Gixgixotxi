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
    <div className="w-full bg-[#f8f9ff] pt-20">
      {/* B) FOOTER CONTAINER
          Starts ~80px below CTA section (light background in between).
          Very dark navy #060a1a, LARGE rounded top: radius 48px, full screen width.
          Padding 56px 32px 40px.
          Thin 1px glowing line along the top edge: accent color fading to transparent. */}
      <footer
        className="relative w-full bg-[#060a1a] text-white overflow-hidden text-left"
        style={{
          borderTopLeftRadius: '48px',
          borderTopRightRadius: '48px',
          padding: '56px 32px 40px',
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

        <div className="max-w-4xl mx-auto w-full text-left">
          {/* C-1. Logo in a white circle (64px) + "Boardly" beside it (white, 24px, "Board" bold + "ly" lighter), 16px gap */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center p-2.5 shadow-md shrink-0">
              <img
                src="/assets/boardly-logo-solid.png"
                alt="Boardly"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/assets/boardly-logo-transparent.png';
                }}
              />
            </div>
            <div className="text-[24px] text-white">
              <span className="font-bold">Board</span>
              <span className="font-light">ly</span>
            </div>
          </div>

          {/* C-2. Description (18px, line-height 1.7, rgba(255,255,255,0.85)), 32px below the logo */}
          <p
            className="mt-8 text-[18px] leading-[1.7] max-w-2xl"
            style={{ color: 'rgba(255, 255, 255, 0.85)' }}
          >
            {accentConfig.description}
          </p>

          {/* C-3. TWO-COLUMN link grid, row gap 48px, column gap 32px, 64px below description:
              Row 1: Product | Events. Row 2: Company | Legal.
              Group heading: 15px, weight 700, uppercase, letter-spacing 0.15em, accent color, 24px above links.
              Links: 20px, weight 400, white, 24px between links, easy to tap. */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
            {/* ROW 1: Column 1 - Product */}
            <div>
              <h3
                className="text-[15px] font-bold uppercase tracking-[0.15em] mb-6 font-sans"
                style={{ color: accentConfig.headingColor }}
              >
                Product
              </h3>
              <ul className="space-y-6 text-[20px] font-normal text-white">
                <li>
                  <a
                    href="/features"
                    onClick={(e) => handleLink(e, '/features')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="/boardly-ai"
                    onClick={(e) => handleLink(e, '/boardly-ai')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    Boardly AI
                  </a>
                </li>
                <li>
                  <a
                    href="/mdcat"
                    onClick={(e) => handleLink(e, '/mdcat')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    MDCAT Prep
                  </a>
                </li>
                <li>
                  <a
                    href="/fsc-matric"
                    onClick={(e) => handleLink(e, '/fsc-matric')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    FSC &amp; Matric
                  </a>
                </li>
                <li>
                  <a
                    href="/fast-nu"
                    onClick={(e) => handleLink(e, '/fast-nu')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    FAST-NU Prep
                  </a>
                </li>
                <li>
                  <a
                    href="/pricing"
                    onClick={(e) => handleLink(e, '/pricing')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            {/* ROW 1: Column 2 - Events */}
            <div>
              <h3
                className="text-[15px] font-bold uppercase tracking-[0.15em] mb-6 font-sans"
                style={{ color: accentConfig.headingColor }}
              >
                Events
              </h3>
              <ul className="space-y-6 text-[20px] font-normal text-white">
                <li>
                  <a
                    href="/events/blitz"
                    onClick={(e) => handleLink(e, '/events/blitz')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    Boardly Blitz
                  </a>
                </li>
                <li>
                  <a
                    href="/events/arena"
                    onClick={(e) => handleLink(e, '/events/arena')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    Boardly Arena
                  </a>
                </li>
                <li>
                  <a
                    href="/captain"
                    onClick={(e) => handleLink(e, '/captain')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    Boardly Captain
                  </a>
                </li>
                <li>
                  <a
                    href="/crew"
                    onClick={(e) => handleLink(e, '/crew')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    Boardly Crew
                  </a>
                </li>
                <li>
                  <a
                    href="/universities"
                    onClick={(e) => handleLink(e, '/universities')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    University Explorer
                  </a>
                </li>
              </ul>
            </div>

            {/* ROW 2: Column 1 - Company */}
            <div>
              <h3
                className="text-[15px] font-bold uppercase tracking-[0.15em] mb-6 font-sans"
                style={{ color: accentConfig.headingColor }}
              >
                Company
              </h3>
              <ul className="space-y-6 text-[20px] font-normal text-white">
                <li>
                  <a
                    href="/about"
                    onClick={(e) => handleLink(e, '/about')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    About Boardly
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    onClick={(e) => handleLink(e, '/contact')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    Contact Support
                  </a>
                </li>
                <li>
                  <a
                    href="/faqs"
                    onClick={(e) => handleLink(e, '/faqs')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    Help &amp; FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* ROW 2: Column 2 - Legal */}
            <div>
              <h3
                className="text-[15px] font-bold uppercase tracking-[0.15em] mb-6 font-sans"
                style={{ color: accentConfig.headingColor }}
              >
                Legal
              </h3>
              <ul className="space-y-6 text-[20px] font-normal text-white">
                <li>
                  <a
                    href="/privacy"
                    onClick={(e) => handleLink(e, '/privacy')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    onClick={(e) => handleLink(e, '/terms')}
                    className="hover:opacity-80 transition-opacity inline-block cursor-pointer"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* C-4. Community card, 64px below the links: radius 32px, padding 32px, rgba(255,255,255,0.04) background, 1px border */}
          <div
            className="mt-16 w-full text-left"
            style={{
              borderRadius: '32px',
              padding: '32px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <h3 className="text-[28px] font-semibold text-white tracking-tight">
              Join the Boardly community
            </h3>
            <p
              className="mt-2 text-[18px] leading-relaxed"
              style={{ color: 'rgba(255, 255, 255, 0.65)' }}
            >
              Hear about new events first and get study tips from the team on WhatsApp.
            </p>
            {/* FULL-WIDTH WHITE pill button, 60px tall, dark text "Join on WhatsApp", no icon, no side-by-side */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="mt-6 w-full h-[60px] min-h-[60px] rounded-full bg-white text-[#060a1a] font-bold text-[18px] transition-transform active:scale-[0.98] cursor-pointer flex items-center justify-center shadow-md"
            >
              Join on WhatsApp
            </button>
          </div>

          {/* C-5. Social icons, centered, 64px below the card: WhatsApp, Instagram, YouTube, TikTok. 32px white icons, 36px gap, no circles or borders */}
          <div className="mt-16 flex items-center justify-center gap-9 text-white">
            <a
              href="https://chat.whatsapp.com/FTXFo4P7kct0L047d5zRGy?s=cl&p=a&mlu=4&ilr=4"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="text-white hover:opacity-80 transition-opacity"
            >
              <WhatsAppIcon className="w-8 h-8" />
            </a>
            <a
              href="https://www.instagram.com/shsvirtualacademy?vrfl=MXR2c2NuZDFwd3RsMQ=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-white hover:opacity-80 transition-opacity"
            >
              <InstagramIcon className="w-8 h-8" />
            </a>
            <a
              href="https://youtube.com/@shsvirtualacademy?si=BhCdzhaFyz4MNyJC"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="text-white hover:opacity-80 transition-opacity"
            >
              <YouTubeIcon className="w-8 h-8" />
            </a>
            <a
              href="https://www.tiktok.com/@shsvirtualacademy?_r=1&_t=ZS-9ASYILp1Sq5"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="text-white hover:opacity-80 transition-opacity"
            >
              <TikTokIcon className="w-8 h-8" />
            </a>
          </div>

          {/* C-6. Copyright, centered, 20px below the icons, 18px, rgba(255,255,255,0.8) */}
          <p
            className="mt-5 text-center text-[18px]"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            &copy; 2026 Boardly. Operated by SHS Virtual Academy.
          </p>

          {/* C-7. Disclaimer below it, centered, 13px, muted, max-width 320px */}
          <p
            className="mt-2 mx-auto text-center text-[13px] max-w-[320px] leading-relaxed"
            style={{ color: 'rgba(255, 255, 255, 0.55)' }}
          >
            Independent online testing engine. All institute names and test marks belong to their respective authorities.
          </p>

          {/* C-8. HUGE faded "Boardly" wordmark at the very bottom, full width (font-size about 28vw, weight 800),
              gradient from the accent color at 35% opacity at the top to transparent at the bottom, cut off by bottom edge, 40px of space above it */}
          <div
            className="w-full overflow-hidden flex justify-center pointer-events-none select-none mt-10 -mb-6 leading-none"
            aria-hidden="true"
          >
            <span
              className="font-extrabold tracking-tighter text-transparent bg-clip-text text-center whitespace-nowrap"
              style={{
                fontSize: '28vw',
                lineHeight: 0.8,
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
