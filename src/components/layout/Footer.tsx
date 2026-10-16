import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--bg-2)]/80 backdrop-blur-xl mt-auto">
      <div className="site-container pb-12" style={{ paddingTop: '48px' }}>
        {/* 4-column grid (brand + 3 link columns) with gap: 32px */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
          style={{ gap: '32px' }}
        >
          {/* Brand info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/favicon.svg"
                alt="Boardly"
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 object-contain rounded-lg"
                style={{ width: 36, height: 36, maxWidth: 36, maxHeight: 36 }}
              />
              <span className="font-display text-xl font-bold text-[var(--text)]">Boardly</span>
            </Link>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Pakistan&apos;s premier MCQ test-prep platform for FAST-NUCES, NUST NET, GIKI, LUMS, NED, MDCAT, ECAT, and intermediate boards.
            </p>
            <div className="text-xs text-[var(--text-faint)]">
              Built with precision for Pakistani aspirants.
            </div>
          </div>

          {/* Prep Tracks */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wider mb-4">
              Test Prep
            </h4>
            <ul className="space-y-2.5 text-sm text-[var(--text-muted)]">
              <li><Link to="/#features" className="hover:text-[var(--text)] transition-colors">FAST-NUCES CS &amp; Eng</Link></li>
              <li><Link to="/#features" className="hover:text-[var(--text)] transition-colors">NUST NET Applied / Eng</Link></li>
              <li><Link to="/#features" className="hover:text-[var(--text)] transition-colors">GIKI Engineering Mock</Link></li>
              <li><Link to="/#features" className="hover:text-[var(--text)] transition-colors">MDCAT &amp; ECAT Vaults</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-[var(--text-muted)]">
              <li><Link to="/#arena" className="hover:text-[var(--text)] transition-colors">Live Arena</Link></li>
              <li><Link to="/pricing" className="hover:text-[var(--text)] transition-colors">Pricing &amp; Plans</Link></li>
              <li><Link to="/reviews" className="hover:text-[var(--text)] transition-colors">Student Reviews</Link></li>
              <li><Link to="/contact" className="hover:text-[var(--text)] transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wider mb-4">
              Legal &amp; Trust
            </h4>
            <ul className="space-y-2.5 text-sm text-[var(--text-muted)]">
              <li><Link to="/privacy" className="hover:text-[var(--text)] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-[var(--text)] transition-colors">Terms of Service</Link></li>
              <li><span className="text-xs text-[var(--text-faint)]">Not affiliated with any university official testing body.</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom row: copyright and dark-glass note on one row with justify-between and margin-top: 32px */}
        <div
          className="border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-faint)]"
          style={{ marginTop: '32px', paddingTop: '24px' }}
        >
          <div>
            &copy; {new Date().getFullYear()} Boardly Technologies. All rights reserved.
          </div>
          <div>
            Designed with dark-glass study ergonomics. Asia/Karachi (PKT).
          </div>
        </div>
      </div>
    </footer>
  );
}
