import { Link } from 'react-router-dom';
import { FeaturesGrid } from '../components/landing/FeaturesGrid';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function FeaturesPage() {
  return (
    <div className="pt-28 pb-20 max-w-6xl mx-auto px-6 page-enter space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge color="brand">Deep Dive</Badge>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white">
          The Boardly Test-Prep Engine
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed">
          Engineered from scratch to replace chaotic WhatsApp groups and poorly formatted PDFs with a clean, high-performance study workflow.
        </p>
      </div>

      <FeaturesGrid />
      <HowItWorks />

      <div className="glass p-8 sm:p-12 rounded-3xl text-center space-y-6 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Ready to experience the study cockpit?
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          Join thousands of students across Pakistan preparing with authentic test patterns.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/signup">
            <Button variant="primary" size="lg">
              Start Free Today
            </Button>
          </Link>
          <Link to="/pricing">
            <Button variant="secondary" size="lg">
              View Pricing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FeaturesPage;
