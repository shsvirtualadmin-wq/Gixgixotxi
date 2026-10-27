import { Link } from 'react-router-dom';

export function TestCockpitCta() {
  return (
    <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden cv-auto-section">
      {/* Ambient soft red radial glow behind the glass panel */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] pointer-events-none -z-10 opacity-75"
        aria-hidden="true"
      >
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(215,25,33,0.18)_0%,rgba(215,25,33,0.04)_50%,transparent_75%)]" />
      </div>

      <div className="boardly-container relative z-10">
        <div className="max-w-4xl mx-auto glass-panel p-8 sm:p-12 lg:p-14 text-center">
          {/* Test Cockpit chip */}
          <div className="flex justify-center mb-5">
            <span className="section-chip">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#D71921] shadow-[0_0_8px_rgba(215,25,33,0.85)] shrink-0"
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
