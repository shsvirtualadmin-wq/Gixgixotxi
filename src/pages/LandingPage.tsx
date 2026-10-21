import { PageMeta } from '@/components/ui/PageMeta';
import { HeroSection } from '../components/landing/HeroSection';
import { MissionSection } from '../components/landing/MissionSection';
import { FeaturesGrid } from '../components/landing/FeaturesGrid';
import { ScrollDrivenPreview } from '../components/landing/ScrollDrivenPreview';
import { ArenaStrip } from '../components/landing/ArenaStrip';
import { HowItWorks } from '../components/landing/HowItWorks';
import { PricingSection } from '../components/landing/PricingSection';
import { FaqSection } from '../components/landing/FaqSection';

export function LandingPage() {
  return (
    <>
      <PageMeta
        title="Boardly — Education for everyone. Practice MCQs. Learn together."
        description="Boardly: making education accessible to everyone. Free to start, affordable to grow. A project of SHS Virtual Academy."
      />
      <main className="w-full">
        <HeroSection />
        <MissionSection />
        <FeaturesGrid />
        <ScrollDrivenPreview />
        <ArenaStrip />
        <HowItWorks />
        <PricingSection />
        <FaqSection />
      </main>
    </>
  );
}

export default LandingPage;
