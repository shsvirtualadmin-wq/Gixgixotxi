import { Link } from 'react-router-dom';

export function TestCockpitCta() {
  return (
    <section className="relative isolate py-12 sm:py-16 lg:py-20 overflow-hidden cv-auto-section">
      <div className="boardly-container relative z-10">
        <div className="max-w-4xl mx-auto glass-panel p-8 sm:p-12 lg:p-14 text-center">
          {/* Test Cockpit chip */}
          <div className="flex justify-center mb-5">
            <span className="section-chip">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#D71921] shrink-0"
                aria-hidden="true"
              />
              Test Cockpit
            </span>
          </div>

          {/* Heading in pixel font */}
          <h2
            className="section-heading text-2xl sm:text-3xl md:text-4xl mb-4 max-w-2xl mx-auto text-[var(--text)]"
            style={{ fontFamily: 'var(--font-dot)', fontSize: 'clamp(24px, 3.2vw, 36px)' }}
          >
            Ready to test with authentic university patterns?
          </h2>

          {/* Subtext */}
          <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed max-w-xl mx-auto mb-8">
            Experience the distraction-free exam runner with live countdowns, question palette navigation, and instant mathematical feedback.
          </p>

          {/* Buttons: Primary red pill + Secondary glass outline pill */}
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link to="/signup" className="btn-primary">
              Start Practicing Free
            </Link>
            <Link to="/crew" className="btn-secondary">
              Explore Study Crew
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TestCockpitCta;
