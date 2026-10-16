import { Link } from 'react-router-dom';
import { FeaturesGrid } from '../components/landing/FeaturesGrid';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Badge } from '../components/ui/Badge';

export function FeaturesPage() {
  return (
    <div className="pt-28 pb-20 boardly-container page-enter space-y-16">
      <div className="section-header">
        <Badge color="muted">Deep Dive</Badge>
        <h2>The Boardly Test-Prep Engine</h2>
        <p>
          Engineered from scratch to replace chaotic WhatsApp groups and poorly formatted PDFs with a clean, high-performance study workflow.
        </p>
      </div>

      <FeaturesGrid />
      <HowItWorks />

      <div className="p-8 sm:p-12 rounded-[24px] bg-[var(--card)] border border-[var(--border)] text-center space-y-6 max-w-3xl mx-auto">
        <h2
          className="text-2xl sm:text-3xl font-bold text-[var(--text)]"
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
        >
          Ready to experience the study cockpit?
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Join thousands of students across Pakistan preparing with authentic test patterns.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/signup" className="btn-red">
            Start Free Today
          </Link>
          <Link to="/pricing" className="btn-outline">
            View Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FeaturesPage;
