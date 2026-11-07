import { PageMeta } from '@/components/ui/PageMeta';
import { HeroSection } from '../components/landing/HeroSection';
import { MissionSection } from '../components/landing/MissionSection';
import { FeaturesGrid } from '../components/landing/FeaturesGrid';
import { ScrollDrivenPreview } from '../components/landing/ScrollDrivenPreview';
import { ArenaStrip } from '../components/landing/ArenaStrip';
import { HowItWorks } from '../components/landing/HowItWorks';
import { PricingSection } from '../components/landing/PricingSection';
import { FaqSection } from '../components/landing/FaqSection';
import { TestCockpitCta } from '../components/landing/TestCockpitCta';

export function LandingPage() {
  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOrganization',
        '@id': 'https://boardly.cfd/#organization',
        name: 'Boardly',
        url: 'https://boardly.cfd',
        logo: 'https://boardly.cfd/favicon.svg',
        founder: {
          '@type': 'Person',
          name: 'Muhammad Hashir',
          jobTitle: 'Founder',
        },
        parentOrganization: {
          '@type': 'EducationalOrganization',
          name: 'SHS Virtual Academy',
          url: 'https://shsvirtualacademy.pro',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'support@boardly.cfd',
          telephone: '+92-305-8969050',
          contactType: 'student support',
          areaServed: 'PK',
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://boardly.cfd/#website',
        name: 'Boardly',
        url: 'https://boardly.cfd',
        publisher: { '@id': 'https://boardly.cfd/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://boardly.cfd/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://boardly.cfd/#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Can I practice with timed conditions and penalty marking?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Boardly supports both untimed topic practice and full timed mock tests with configurable negative marking matching MDCAT, ECAT, NUST NET, FAST, and GIKI patterns.',
            },
          },
          {
            '@type': 'Question',
            name: 'When do daily practice limits refresh?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Daily practice counters and study streaks reset automatically every night at 12:00 AM Pakistan Standard Time (PKT, UTC+5).',
            },
          },
          {
            '@type': 'Question',
            name: 'Which subjects and levels are covered?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Boardly covers Class 11 (HSSC-I) and Class 12 (HSSC-II) Mathematics, Physics, Chemistry, Biology, Computer Science, and English across FBISE, Punjab, Sindh, KPK, and Balochistan boards, plus MDCAT and ECAT/NET entrance tracks.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is Boardly Commons?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Boardly Commons is our open student academic network where students share handwritten notes, solved past papers, formula sheets, and ask subject doubts.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do I pay if I do not have an international credit card?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Boardly supports 100% local Pakistani payment methods including JazzCash, Opay, SadaPay, NayaPay, and direct Bank Transfer.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I study effectively on my smartphone?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Every test runner, KaTeX formula derivation, Commons feed, and Study Crew dashboard is engineered for smooth mobile and desktop performance.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <PageMeta
        title="Boardly — Education for everyone. Practice MCQs. Learn together."
        description="Boardly: making education accessible to everyone. Free to start, affordable to grow. A project of SHS Virtual Academy."
        canonicalPath="/"
        jsonLd={homeJsonLd}
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
        <TestCockpitCta />
      </main>
    </>
  );
}

export default LandingPage;
