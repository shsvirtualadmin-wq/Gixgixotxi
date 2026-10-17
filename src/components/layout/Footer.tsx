import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
  return (
    <footer
      className="w-full mt-auto"
      style={{
        backgroundColor: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        paddingTop: '48px',
        paddingBottom: '48px',
      }}
    >
      <div className="boardly-container">
        {/* 4-column grid on desktop, 2 columns on mobile with brand on top */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand info (Full width on mobile, 1 col on desktop) */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center mb-4 group" aria-label="Boardly Home">
              <Logo size="footer" />
            </Link>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4 max-w-sm">
              Pakistan&apos;s premier MCQ test-prep platform for FAST-NUCES, NUST NET, GIKI, LUMS, NED, MDCAT, ECAT, and intermediate boards.
            </p>
            <div className="text-xs text-[var(--muted)]">
              Built with precision for Pakistani aspirants.
            </div>
          </div>

          {/* Test prep */}
          <div>
            <h4
              className="text-sm font-semibold text-[var(--text)] mb-4"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Test prep
            </h4>
            <ul className="space-y-2.5 text-sm text-[var(--muted)]">
              <li>
                <Link to="/#features" className="hover:text-[var(--text)] transition-colors">
                  FAST-NUCES CS &amp; Eng
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-[var(--text)] transition-colors">
                  NUST NET Applied / Eng
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-[var(--text)] transition-colors">
                  GIKI Engineering Mock
                </Link>
              </li>
              <li>
                <Link to="/#features" className="hover:text-[var(--text)] transition-colors">
                  MDCAT &amp; ECAT Vaults
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4
              className="text-sm font-semibold text-[var(--text)] mb-4"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-[var(--muted)]">
              <li>
                <Link to="/#arena" className="hover:text-[var(--text)] transition-colors">
                  Live Arena
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-[var(--text)] transition-colors">
                  Pricing &amp; plans
                </Link>
              </li>
              <li>
                <Link to="/reviews" className="hover:text-[var(--text)] transition-colors">
                  Student reviews
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[var(--text)] transition-colors">
                  Contact support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & trust */}
          <div>
            <h4
              className="text-sm font-semibold text-[var(--text)] mb-4"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Legal &amp; trust
            </h4>
            <ul className="space-y-2.5 text-sm text-[var(--muted)]">
              <li>
                <Link to="/privacy" className="hover:text-[var(--text)] transition-colors">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[var(--text)] transition-colors">
                  Terms of service
                </Link>
              </li>
              <li>
                <span className="text-xs text-[var(--muted)]">
                  Not affiliated with any university official testing body.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Thin dotted divider separating sections */}
        <div className="divider-dotted mt-10 mb-8" />

        {/* Copyright and tagline */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--muted)]">
          <div>
            &copy; {new Date().getFullYear()} Boardly Technologies. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span>Designed for focused study. Asia/Karachi (PKT)</span>
          </div>
        </div>
      </div>

      {/* ─── RED FOOTER WITH GIANT DOTTED "BOARDLY" ────────────────────────── */}
      <div className="w-full bg-[#D71921] text-white mt-10 py-6 sm:py-10 px-4 overflow-hidden select-none">
        <div className="max-w-[1200px] mx-auto flex items-center justify-center text-center overflow-hidden">
          <span
            className="font-dot text-[13vw] sm:text-[12vw] lg:text-[140px] font-black tracking-tighter leading-none text-white uppercase inline-block max-w-full select-none pointer-events-none"
            style={{
              fontFamily: 'var(--font-dot)',
              letterSpacing: '-0.03em',
            }}
            aria-hidden="true"
          >
            BOARDLY
          </span>
        </div>
      </div>
    </footer>
  );
}
