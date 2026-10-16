import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesGrid } from '../components/landing/FeaturesGrid';
import { ScrollDrivenPreview } from '../components/landing/ScrollDrivenPreview';
import { ArenaStrip } from '../components/landing/ArenaStrip';
import { HowItWorks } from '../components/landing/HowItWorks';
import { PricingSection } from '../components/landing/PricingSection';
import { ReviewsMarquee } from '../components/landing/ReviewsMarquee';
import { FaqSection } from '../components/landing/FaqSection';

export function LandingPage() {
  return (
    <div className="page-enter">
      <HeroSection />
      <FeaturesGrid />
      <ScrollDrivenPreview />
      <ArenaStrip />
      <HowItWorks />
      <PricingSection />
      <ReviewsMarquee />
      <FaqSection />
    </div>
  );
}

export default LandingPage;
