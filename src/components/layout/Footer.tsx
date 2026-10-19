import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { GRAND_LINE_NAME } from '@/constants/branding';

export function Footer() {
  const wordmarkContainerRef = useRef<HTMLDivElement>(null);
  const wordmarkTextRef = useRef<HTMLSpanElement>(null);
  const [fittedFontSize, setFittedFontSize] = useState<string>('clamp(56px, 24cqw, 320px)');

  // Measure and fit "Boardly" wordmark to fit footer width at 360px, 390px, 430px and desktop
  useEffect(() => {
    const adjustWordmark = () => {
      const container = wordmarkContainerRef.current;
      const text = wordmarkTextRef.current;
      if (!container || !text) return;

      const availWidth = container.clientWidth - 32;
      if (availWidth <= 0) return;

      const currentWidth = text.scrollWidth;
      const currentFontSize = parseFloat(window.getComputedStyle(text).fontSize) || 64;

      if (currentWidth > 0 && currentFontSize > 0) {
        const targetSize = Math.floor(((availWidth * 0.96) / currentWidth) * currentFontSize);
        const clampedSize = Math.min(320, Math.max(50, targetSize));
        setFittedFontSize(`${clampedSize}px`);
      }
    };

    adjustWordmark();

    const ro = new ResizeObserver(adjustWordmark);
    if (wordmarkContainerRef.current) {
      ro.observe(wordmarkContainerRef.current);
    }
    window.addEventListener('resize', adjustWordmark);

    if (document.fonts?.ready) {
      document.fonts.ready.then(adjustWordmark);
    }

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', adjustWordmark);
    };
  }, []);

  return (
    <footer
      className="w-full mt-auto bg-[#D71921] text-white rounded-t-[48px] md:rounded-t-[64px] pt-14 sm:pt-16 md:pt-20 select-none"
      style={{
        backgroundColor: '#D71921',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'clip',
        boxSizing: 'border-box',
        containerType: 'inline-size',
      }}
    >
      <div className="boardly-container w-full max-w-[1200px] mx-auto px-5 sm:px-6 md:px-8 box-border">
        {/* 4-column grid on desktop, 2 columns on mobile with brand on top */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 w-full [grid-template-columns:repeat(2,minmax(0,1fr))] lg:[grid-template-columns:repeat(4,minmax(0,1fr))]">
          {/* Brand info (Full width on mobile, 1 col on desktop) */}
          <div className="col-span-2 lg:col-span-1 min-w-0">
            <Link to="/" className="inline-flex items-center mb-6 group" aria-label="Boardly Home">
              <Logo
                size="footer"
                className="h-[72px] sm:h-[88px] w-auto max-w-none brightness-0 invert"
                style={{ maxHeight: 'none' }}
                alt="Boardly"
              />
            </Link>
            <p className="text-sm text-white/80 leading-relaxed mb-4 max-w-sm break-words">
              Pakistan&apos;s premier MCQ test-prep platform for FAST-NUCES, NUST NET, GIKI, LUMS, NED, MDCAT, ECAT, and intermediate boards.
            </p>
            <div className="text-xs text-white/80 break-words">
              Built with precision for Pakistani aspirants.
            </div>
          </div>

          {/* Test prep -> all point to real /features page */}
          <div className="min-w-0">
            <h4
              className="text-sm font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Test prep
            </h4>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <Link to="/features" className="hover:text-white hover:underline transition-colors block break-words">
                  FAST-NUCES CS &amp; Eng
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-white hover:underline transition-colors block break-words">
                  NUST NET Applied / Eng
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-white hover:underline transition-colors block break-words">
                  GIKI Engineering Mock
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-white hover:underline transition-colors block break-words">
                  MDCAT &amp; ECAT Vaults
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform -> /features, /crew, /pricing, /nakama-captains, /grand-line/about, /contact */}
          <div className="min-w-0">
            <h4
              className="text-sm font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <Link to="/features" className="hover:text-white hover:underline transition-colors block break-words">
                  Platform features
                </Link>
              </li>
              <li>
                <Link to="/crew" className="hover:text-white hover:underline transition-colors block break-words">
                  Study Crew &amp; Squads
                </Link>
              </li>
              <li>
                <Link to="/store" className="hover:text-white hover:underline transition-colors block break-words">
                  Boardly Store
                </Link>
              </li>
              <li>
                <Link to="/kobans" className="hover:text-white hover:underline transition-colors block break-words">
                  About Kobans
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white hover:underline transition-colors block break-words">
                  Pricing &amp; plans
                </Link>
              </li>
              <li>
                <Link to="/nakama-captains" className="hover:text-white hover:underline transition-colors block break-words">
                  Nakama Captains
                </Link>
              </li>
              <li>
                <Link to="/grand-line/about" className="hover:text-white hover:underline transition-colors block break-words">
                  {GRAND_LINE_NAME} (Public Mocks)
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white hover:underline transition-colors block break-words">
                  Contact support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & trust -> /privacy, /terms */}
          <div className="min-w-0">
            <h4
              className="text-sm font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Legal &amp; trust
            </h4>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <Link to="/privacy" className="hover:text-white hover:underline transition-colors block break-words">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white hover:underline transition-colors block break-words">
                  Terms of service
                </Link>
              </li>
              <li>
                <span className="text-xs text-white/80 block break-words">
                  Not affiliated with any university official testing body.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 1px divider */}
        <div
          className="w-full mt-12 mb-8"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.25)' }}
        />

        {/* Copyright and contact info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-white/80 pb-6">
          <div className="break-words">
            &copy; {new Date().getFullYear()} Boardly Technologies. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-4 break-words">
            <div className="flex items-center gap-2">
              <span>Phone / WhatsApp:</span>
              <a href="tel:+923058969050" className="hover:text-white hover:underline">
                0305 8969050
              </a>
              <span>(</span>
              <a
                href="https://wa.me/923058969050"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white hover:underline underline font-medium"
              >
                WhatsApp
              </a>
              <span>)</span>
            </div>
            <span>&bull;</span>
            <a href="mailto:support@boardly.cfd" className="hover:text-white hover:underline">
              support@boardly.cfd
            </a>
            <span>&bull;</span>
            <span>Asia/Karachi (PKT)</span>
          </div>
        </div>
      </div>

      {/* Huge dot-matrix "Boardly" wordmark in Doto font */}
      <div
        ref={wordmarkContainerRef}
        className="w-full flex items-center justify-center text-center px-4 pt-2 pb-6 sm:pb-8 select-none pointer-events-none"
        style={{
          boxSizing: 'border-box',
        }}
      >
        <span
          ref={wordmarkTextRef}
          className="font-dot text-white inline-block select-none pointer-events-none text-center whitespace-nowrap"
          style={{
            fontFamily: 'var(--font-dot)',
            fontSize: fittedFontSize,
            lineHeight: 1.15,
            paddingBottom: '0.25em',
            letterSpacing: '-0.02em',
          }}
          aria-hidden="true"
        >
          Boardly
        </span>
      </div>
    </footer>
  );
}

export default Footer;
