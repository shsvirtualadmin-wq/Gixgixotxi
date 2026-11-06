import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { GRAND_LINE_NAME } from '@/constants/branding';
import { useHomeUrl } from '@/utils/homeUrl';

export function Footer() {
  const homeUrl = useHomeUrl();
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
      className="boardly-red-footer relative w-full mt-auto bg-[#D71921] text-white rounded-t-[36px] sm:rounded-t-[48px] lg:rounded-t-[58px] pt-16 sm:pt-20 lg:pt-24 select-none border-t border-white/25 shadow-[0_-24px_50px_-10px_rgba(215,25,33,0.38),0_-8px_25px_rgba(0,0,0,0.6),inset_0_1.5px_1px_rgba(255,255,255,0.35)]"
      style={{
        backgroundColor: '#D71921',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'clip',
        boxSizing: 'border-box',
        containerType: 'inline-size',
      }}
    >
      {/* Soft specular sheen line on the top curved edge */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-[800px] h-[1.5px] bg-gradient-to-r from-transparent via-white/45 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="boardly-container w-full max-w-[1200px] mx-auto px-5 sm:px-6 md:px-8 box-border">
        {/* 4-column grid on desktop, 2 columns on mobile with brand on top */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 w-full [grid-template-columns:repeat(2,minmax(0,1fr))] lg:[grid-template-columns:1.25fr_repeat(3,minmax(0,1fr))] items-start">
          {/* Brand info (Full width on mobile, 1 col on desktop) */}
          <div className="col-span-2 lg:col-span-1 min-w-0">
            <Link to={homeUrl} className="inline-flex items-center mb-5 group text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg" aria-label="Boardly Home">
              <Logo
                size="footer"
                className="h-[52px] sm:h-[60px] w-auto max-w-none text-white transition-transform group-hover:scale-[1.02]"
                style={{ maxHeight: 'none' }}
                alt="Boardly"
              />
            </Link>
            <p className="text-sm text-white/90 leading-relaxed mb-3 max-w-xs break-words">
              Boardly: MCQ practice and learning for every student. A project of{' '}
              <a
                href="https://shsvirtualacademy.pro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline font-semibold hover:opacity-90 underline-offset-2 transition-opacity"
              >
                SHS Virtual Academy
              </a>
              .
            </p>
            <div className="text-xs text-white/80 break-words">
              Built with precision for learners across Pakistan.
            </div>
          </div>

          {/* Subjects & Practice -> real /mcqs subject & material hubs */}
          <div className="min-w-0">
            <h4
              className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white mb-4 sm:mb-5 font-heading drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
            >
              Subjects &amp; Practice
            </h4>
            <ul className="space-y-2.5 text-sm text-white/85">
              <li>
                <Link to="/mcqs/mathematics" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Mathematics
                </Link>
              </li>
              <li>
                <Link to="/mcqs/physics" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Physics
                </Link>
              </li>
              <li>
                <Link to="/mcqs/chemistry" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Chemistry &amp; Biology
                </Link>
              </li>
              <li>
                <Link to="/mcqs/computer-science" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Computer Science
                </Link>
              </li>
              <li>
                <Link to="/mcqs" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  All Subject MCQs
                </Link>
              </li>
              <li>
                <Link to="/material" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Study Material Library
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform -> /features, /commons, /commons/about, /crew, /store, /kobans, /pricing, /captains, /grand-line, /how-it-works, /contact */}
          <div className="min-w-0">
            <h4
              className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white mb-4 sm:mb-5 font-heading drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
            >
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-white/85">
              <li>
                <Link to="/features" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Platform features
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  How Boardly Works
                </Link>
              </li>
              <li>
                <Link to="/commons" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Boardly Commons
                </Link>
              </li>
              <li>
                <Link to="/crew" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Study Crew &amp; Squads
                </Link>
              </li>
              <li>
                <Link to="/store" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Boardly Store
                </Link>
              </li>
              <li>
                <Link to="/rewards" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words font-semibold">
                  Rewards
                </Link>
              </li>
              <li>
                <Link to="/kobans" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  About Kobans
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Pricing &amp; plans
                </Link>
              </li>
              <li>
                <Link to="/captains" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Nakama Captains
                </Link>
              </li>
              <li>
                <Link to="/grand-line" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  {GRAND_LINE_NAME} (Public Mocks)
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Contact support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & trust -> /about, /faq, /guidelines, /privacy, /terms */}
          <div className="min-w-0">
            <h4
              className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white mb-4 sm:mb-5 font-heading drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
            >
              Legal &amp; trust
            </h4>
            <ul className="space-y-2.5 text-sm text-white/85">
              <li>
                <Link to="/about" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  About Boardly
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/guidelines" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Community guidelines
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words">
                  Terms of service
                </Link>
              </li>
              <li>
                <a
                  href="https://shsvirtualacademy.pro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline hover:translate-x-0.5 transition-all duration-200 inline-block break-words"
                >
                  SHS Virtual Academy &rarr;
                </a>
              </li>
              <li>
                <span className="text-xs text-white/80 block break-words mt-1">
                  Not affiliated with any university official testing body.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Thin semi-transparent gradient line separating columns from bottom bar */}
        <div
          className="w-full my-8 sm:my-10 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent"
          aria-hidden="true"
        />

        {/* Copyright and contact info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-white/90 pb-4">
          <div className="break-words">
            &copy; {new Date().getFullYear()} Boardly Technologies. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 break-words">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>Phone / WhatsApp:</span>
              <a href="tel:+923058969050" className="hover:text-white hover:underline underline-offset-2">
                0305 8969050
              </a>
              <span className="opacity-75">(</span>
              <a
                href="https://wa.me/923058969050"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white underline underline-offset-2 font-medium"
              >
                WhatsApp
              </a>
              <span className="opacity-75">)</span>
            </div>
            <span className="opacity-60 hidden sm:inline">&bull;</span>
            <a href="mailto:support@boardly.cfd" className="hover:text-white hover:underline underline-offset-2">
              support@boardly.cfd
            </a>
            <span className="opacity-60 hidden sm:inline">&bull;</span>
            <span>Asia/Karachi (PKT)</span>
          </div>
        </div>
      </div>

      {/* Dot-matrix "Boardly" wordmark in Doto font with balanced spacing and clearance above floating bottom nav */}
      <div
        ref={wordmarkContainerRef}
        className="w-full flex items-center justify-center text-center px-4 pt-2 pb-[calc(88px+env(safe-area-inset-bottom,0px))] select-none pointer-events-none"
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
            lineHeight: 1.05,
            paddingBottom: '0.12em',
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
