export interface PageSeoConfig {
  path: string;
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  robots: string;
  schema?: Record<string, any>;
}

export const SITE_NAME = 'Boardly';
export const SITE_URL = 'https://boardly.cfd';
export const DEFAULT_OG_IMAGE = 'https://boardly.cfd/assets/og-image.png';
export const CREW_OG_IMAGE = 'https://boardly.cfd/assets/boardly-crew-og.png';

export const PUBLIC_PAGES_SEO: Record<string, PageSeoConfig> = {
  '/': {
    path: '/',
    title: 'Boardly | Online MCQ Practice for MDCAT, FSC & Matric',
    description: 'Master MDCAT, FSC & Matric exams with Boardly. Practice 25,000+ board-aligned MCQs, timed mock tests, step-by-step derivations & 24/7 Boardy AI tutor.',
    canonical: 'https://boardly.cfd/',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://boardly.cfd/#organization',
          name: 'Boardly',
          url: 'https://boardly.cfd',
          logo: {
            '@type': 'ImageObject',
            url: 'https://boardly.cfd/logo.png',
            width: 512,
            height: 512,
            caption: 'Boardly Logo',
          },
          sameAs: [
            'https://www.facebook.com/share/19a8tbUjKN/',
            'https://www.instagram.com/shsvirtualacademy?vrfl=MXR2c2NuZDFwd3RsMQ==',
            'https://youtube.com/@shsvirtualacademy?si=BhCdzhaFyz4MNyJC',
            'https://www.tiktok.com/@shsvirtualacademy?_r=1&_t=ZS-9ASYILp1Sq5',
          ],
          parentOrganization: {
            '@type': 'EducationalOrganization',
            name: 'SHS Virtual Academy',
            url: 'https://shsvirtualacademy.pro',
          },
        },
        {
          '@type': 'WebSite',
          '@id': 'https://boardly.cfd/#website',
          name: 'Boardly',
          alternateName: ['Boardly CFD', 'Boardly Pakistan'],
          url: 'https://boardly.cfd',
          publisher: {
            '@id': 'https://boardly.cfd/#organization',
          },
        },
        {
          '@type': 'ItemList',
          name: 'Boardly Primary Navigation',
          itemListElement: [
            {
              '@type': 'SiteNavigationElement',
              position: 1,
              name: 'Home',
              url: 'https://boardly.cfd/',
            },
            {
              '@type': 'SiteNavigationElement',
              position: 2,
              name: 'Features',
              url: 'https://boardly.cfd/features',
            },
            {
              '@type': 'SiteNavigationElement',
              position: 3,
              name: 'Pricing',
              url: 'https://boardly.cfd/pricing',
            },
            {
              '@type': 'SiteNavigationElement',
              position: 4,
              name: 'Boardly AI',
              url: 'https://boardly.cfd/boardly-ai',
            },
            {
              '@type': 'SiteNavigationElement',
              position: 5,
              name: 'MDCAT',
              url: 'https://boardly.cfd/mdcat',
            },
            {
              '@type': 'SiteNavigationElement',
              position: 6,
              name: 'FSC & Matric',
              url: 'https://boardly.cfd/fsc-matric',
            },
            {
              '@type': 'SiteNavigationElement',
              position: 7,
              name: 'FAST-NU',
              url: 'https://boardly.cfd/fast-nu',
            },
            {
              '@type': 'SiteNavigationElement',
              position: 8,
              name: 'About',
              url: 'https://boardly.cfd/about',
            },
            {
              '@type': 'SiteNavigationElement',
              position: 9,
              name: 'Contact',
              url: 'https://boardly.cfd/contact',
            },
          ],
        },
      ],
    },
  },

  '/features': {
    path: '/features',
    title: 'Features | Boardly MCQ Practice, Mock Tests & AI Tutor',
    description: 'Explore Boardly\'s chapter-wise MCQ question banks, authentic board-pattern timed mocks, weak-topic analytics, step-by-step derivations & 24/7 AI assistance.',
    canonical: 'https://boardly.cfd/features',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Boardly Exam Features',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All',
      url: 'https://boardly.cfd/features',
      description: 'Adaptive diagnostic MCQ test engine with full board and entrance exam coverage in Pakistan.',
    },
  },

  '/pricing': {
    path: '/pricing',
    title: 'Pricing Plans | Affordable Boardly Pro & Premium Prep',
    description: 'Explore flexible Boardly plans starting at Rs 0. Upgrade to Pro (Rs 199/mo) or Premium (Rs 399/mo) for unlimited chapter vaults and full-length mocks.',
    canonical: 'https://boardly.cfd/pricing',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Boardly Pro & Premium Exam Preparation Membership',
      description: 'Comprehensive online MCQ test preparation and AI study partner for Matric, FSC, MDCAT and engineering entrance exams.',
      brand: {
        '@type': 'Brand',
        name: 'Boardly',
      },
      offers: [
        {
          '@type': 'Offer',
          name: 'Pro Plan Monthly',
          price: '199',
          priceCurrency: 'PKR',
          availability: 'https://schema.org/InStock',
          url: 'https://boardly.cfd/pricing',
        },
        {
          '@type': 'Offer',
          name: 'Premium Plan Monthly',
          price: '399',
          priceCurrency: 'PKR',
          availability: 'https://schema.org/InStock',
          url: 'https://boardly.cfd/pricing',
        },
      ],
    },
  },

  '/boardly-ai': {
    path: '/boardly-ai',
    title: 'Boardy AI | 24/7 Intelligent Tutor & Solution Solver',
    description: 'Meet Boardy, your 24/7 AI study partner. Get immediate step-by-step derivations, tricky numerical breakdowns, and conceptual exam hints for Matric & FSC.',
    canonical: 'https://boardly.cfd/boardly-ai',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Boardy AI Study Assistant',
      applicationCategory: 'EducationalApplication',
      url: 'https://boardly.cfd/boardly-ai',
      description: '24/7 intelligent academic AI tutor for Pakistani students facing difficult numericals and conceptual doubts.',
    },
  },

  '/mdcat': {
    path: '/mdcat',
    title: 'MDCAT MCQ Practice & Mock Exams 2026 | Boardly Pakistan',
    description: 'Ace the PMDC MDCAT with chapter-wise Biology, Chemistry, Physics, English & Logic MCQs. Practice authentic timed mock tests with detailed derivations.',
    canonical: 'https://boardly.cfd/mdcat',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'PMDC MDCAT Medical Entrance Examination Prep',
      description: 'Complete syllabus question banks for Biology, Chemistry, Physics, English, and Logical Reasoning with national percentile rankings.',
      provider: {
        '@type': 'Organization',
        name: 'Boardly',
        sameAs: 'https://boardly.cfd',
      },
    },
  },

  '/fsc-matric': {
    path: '/fsc-matric',
    title: 'FSC & Matric MCQ Practice | FBISE & Provincial Boards',
    description: 'Prepare for FBISE, Punjab, Sindh & KPK board exams. Practice SLO-aligned MCQs for Class 9, 10, 11 & 12 with full derivations and instant AI doubt clearing.',
    canonical: 'https://boardly.cfd/fsc-matric',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'FSC & Matric Board Examination MCQ Practice',
      description: 'SLO-aligned diagnostic practice papers for Class 9, 10, 11, and 12 across all science and computer streams.',
      provider: {
        '@type': 'Organization',
        name: 'Boardly',
        sameAs: 'https://boardly.cfd',
      },
    },
  },

  '/fast-nu': {
    path: '/fast-nu',
    title: 'FAST-NU Entrance Test MCQ Practice & Engineering Mocks',
    description: 'Conquer the FAST-NU, UET & NUST entrance exams with Advanced Math, Physics & Analytical MCQs. Train under authentic negative marking time constraints.',
    canonical: 'https://boardly.cfd/fast-nu',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'FAST-NU & Engineering University Entrance Test Preparation',
      description: 'Timed engineering exam simulations with negative marking calibration for FAST-NU, UET ECAT, and NUST NET candidates.',
      provider: {
        '@type': 'Organization',
        name: 'Boardly',
        sameAs: 'https://boardly.cfd',
      },
    },
  },

  '/about': {
    path: '/about',
    title: 'About Boardly | Built by SHS Virtual Academy Pakistan',
    description: 'Learn how Boardly, developed by SHS Virtual Academy, democratizes high-yield diagnostic exam practice and conceptual learning for Pakistani students.',
    canonical: 'https://boardly.cfd/about',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Boardly and SHS Virtual Academy',
      url: 'https://boardly.cfd/about',
      description: 'The educational mission, curriculum committee, and foundation behind Boardly testing portal.',
    },
  },

  '/contact': {
    path: '/contact',
    title: 'Contact Boardly | Student Support, WhatsApp & Email',
    description: 'Have questions about syllabus materials, plans, or payments? Contact the Boardly student support team via WhatsApp hotline or email for rapid guidance.',
    canonical: 'https://boardly.cfd/contact',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Boardly Support',
      url: 'https://boardly.cfd/contact',
      mainEntity: {
        '@type': 'Organization',
        name: 'Boardly',
        email: 'support@boardly.cfd',
        telephone: '+923058969050',
      },
    },
  },

  '/privacy': {
    path: '/privacy',
    title: 'Privacy Policy | Boardly Student Data Protection Notice',
    description: 'Read Boardly\'s privacy policy to understand how student data, test analytics, and account records are protected under modern security and encryption standards.',
    canonical: 'https://boardly.cfd/privacy',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
  },

  '/terms': {
    path: '/terms',
    title: 'Terms of Service | Boardly Online Educational Portal',
    description: 'Review Boardly\'s terms of service, subscription guidelines, fair use policy, and academic code of conduct for Matric, FSC, and entrance test candidates.',
    canonical: 'https://boardly.cfd/terms',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
  },

  '/events/blitz': {
    path: '/events/blitz',
    title: 'Boardly Blitz | High-Stakes Speed MCQ Competition',
    description: 'Compete in Boardly Blitz, Pakistan’s premier timed speed quiz event for Matric, FSC and MDCAT aspirants. Solve fast-paced numericals and top national leaderboards.',
    canonical: 'https://boardly.cfd/events/blitz',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
  },

  '/events/arena': {
    path: '/events/arena',
    title: 'Boardly Arena | Head-to-Head Entrance Test Showdowns',
    description: 'Enter Boardly Arena for real-time multiplayer MCQ battles. Test your conceptual speed in physics, math, and chemistry against peers across Pakistan.',
    canonical: 'https://boardly.cfd/events/arena',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
  },

  '/crew': {
    path: '/crew',
    title: 'Boardly Crew: Lead your campus',
    description: 'Represent Boardly at your college or university as an official student ambassador. Unlock 30 days of free Premium, peer referral rewards, and paid internship opportunities.',
    canonical: 'https://boardly.cfd/crew',
    ogImage: CREW_OG_IMAGE,
    robots: 'index,follow',
  },

  '/crew/how-it-works': {
    path: '/crew/how-it-works',
    title: 'How Boardly Crew Works | Campus Ambassador Program',
    description: 'Discover the 4 steps to becoming a verified Boardly Crew Ambassador: Apply, get verified, unlock Premium & dashboard, and earn rewards.',
    canonical: 'https://boardly.cfd/crew/how-it-works',
    ogImage: CREW_OG_IMAGE,
    robots: 'index,follow',
  },

  '/crew/perks': {
    path: '/crew/perks',
    title: 'Boardly Crew Perks & Benefits | Lead Your Campus',
    description: 'Explore ambassador perks: 30 days free Premium, 1-year tenure, live referral dashboard, verifiable CV credentials, and paid internship tracks.',
    canonical: 'https://boardly.cfd/crew/perks',
    ogImage: CREW_OG_IMAGE,
    robots: 'index,follow',
  },

  '/crew/faq': {
    path: '/crew/faq',
    title: 'Boardly Crew FAQ | Ambassador Program Questions Answered',
    description: 'Got questions about Boardly Crew? Learn who can join, how to apply, eligibility, reward counting, and ambassador responsibilities.',
    canonical: 'https://boardly.cfd/crew/faq',
    ogImage: CREW_OG_IMAGE,
    robots: 'index,follow',
  },

  '/crew/apply': {
    path: '/crew/apply',
    title: 'Apply to Boardly Crew | Student Campus Ambassador Program',
    description: 'Submit your student ambassador application for Boardly Crew. Lead your batch, share test prep resources, and unlock student leader perks.',
    canonical: 'https://boardly.cfd/crew/apply',
    ogImage: CREW_OG_IMAGE,
    robots: 'index,follow',
  },

  '/programs/crew': {
    path: '/programs/crew',
    title: 'Boardly Crew: Lead your campus',
    description: 'Become a Boardly Crew member and represent Boardly and SHS Virtual Academy at your institution. Unlock 30 days of Premium access and qualify for paid internships.',
    canonical: 'https://boardly.cfd/crew',
    ogImage: CREW_OG_IMAGE,
    robots: 'index,follow',
  },

  '/programs/captains': {
    path: '/programs/captains',
    title: 'Campus Captains Program | Lead Boardly at Your College',
    description: 'Become a Boardly Campus Captain at your high school or college. Organize local mock tests, represent Boardly, and unlock leadership perks and certificates.',
    canonical: 'https://boardly.cfd/programs/captains',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
  },

  '/universities': {
    path: '/universities',
    title: 'University Explorer & Aggregate Calculator | Boardly',
    description: 'Explore top Pakistani universities including NUST, FAST, GIKI, UET, NED, and IBA. Compare admission test weights, eligibility criteria, and calculate your aggregate.',
    canonical: 'https://boardly.cfd/universities',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
  },

  '/merit-meter': {
    path: '/merit-meter',
    title: 'Merit Meter | University Aggregate & Closing Merit Calculator',
    description: 'Calculate your exact admission aggregate for Pakistani engineering and medical universities. Compare your score with past closing merits and official prospectuses.',
    canonical: 'https://boardly.cfd/merit-meter',
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
  },
};

export function getPageSeo(pathname: string): PageSeoConfig {
  const clean = pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (PUBLIC_PAGES_SEO[clean]) {
    return PUBLIC_PAGES_SEO[clean];
  }
  if (clean === '/boardy' || clean === '/study-buddy' || clean === '/ai') {
    return PUBLIC_PAGES_SEO['/boardly-ai'];
  }
  // Default fallback for public pages
  return {
    path: clean,
    title: 'Boardly | Online MCQ Practice for MDCAT, FSC & Matric',
    description: 'Master MDCAT, FSC & Matric exams with Boardly. Practice 25,000+ board-aligned MCQs, timed mock tests, step-by-step derivations & 24/7 Boardy AI tutor.',
    canonical: `https://boardly.cfd${clean}`,
    ogImage: DEFAULT_OG_IMAGE,
    robots: 'index,follow',
  };
}
