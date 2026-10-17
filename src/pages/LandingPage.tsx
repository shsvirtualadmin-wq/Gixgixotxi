import { PageMeta } from '@/components/ui/PageMeta';
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
    <>
      <PageMeta
        title="Boardly — MCQ Practice for FSC & Matric"
        description="Boardly by SHS Virtual Academy provides MCQ practice and entrance test prep for FAST-NUCES, NUST NET, GIKI, LUMS, NED, and MDCAT students."
      />
      <main className="w-full">
        <HeroSection />
        <FeaturesGrid />
        <ScrollDrivenPreview />
        <ArenaStrip />
        <HowItWorks />
        <PricingSection />
        <ReviewsMarquee />
        <FaqSection />
      </main>
    </>
  );
}

export default LandingPage;
