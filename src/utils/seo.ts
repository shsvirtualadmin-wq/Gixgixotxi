/**
 * SEO, Open Graph & Canonical Management Utility for Boardly by SHS Virtual Academy (shsvirtualacademy.pro)
 */

export interface PageMetaConfig {
  title?: string;
  description: string;
}

export const CANONICAL_BASE_ORIGIN = 'https://boardly.cfd';
export const OG_IMAGE_URL = 'https://boardly.cfd/logo.png';

export const DEFAULT_PAGE_META: Record<string, PageMetaConfig> = {
  intro: {
    title: 'Boardly — MCQ Practice for FSC & Matric',
    description:
      'Boardly by SHS Virtual Academy provides MCQ practice and test prep for FSC Matric and Post FSC students. Visit shsvirtualacademy.pro to learn more.',
  },
  pricing: {
    title: 'Plans & Pricing — Boardly by SHS Virtual Academy',
    description:
      'Explore affordable MCQ practice & board exam test prep plans on Boardly by SHS Virtual Academy. Visit shsvirtualacademy.pro.',
  },
  plan_selection: {
    title: 'Select Your Plan — Boardly by SHS Virtual Academy',
    description:
      'Choose your MCQ practice subscription on Boardly by SHS Virtual Academy. Unlock full FSC & Matric question banks and mock tests.',
  },
  grades_flow: {
    title: 'Select Your Class — Boardly by SHS Virtual Academy',
    description:
      'Choose your FBISE class level (Class 9–12) for chapter-wise MCQ practice and board exam test prep on Boardly.',
  },
  group: {
    title: 'Subject Groups — Boardly by SHS Virtual Academy',
    description:
      'Select Pre-Medical, Pre-Engineering, Computer Science (ICS), or General Science study groups for targeted MCQ practice on Boardly.',
  },
  dashboard: {
    title: 'Student Dashboard — Boardly by SHS Virtual Academy',
    description:
      'Track your board exam practice performance, review chapter accuracy, and practice targeted MCQs on Boardly by SHS Virtual Academy.',
  },
  subjects: {
    title: 'Choose Your Subject — Boardly by SHS Virtual Academy',
    description:
      'Select Physics, Chemistry, Biology, Mathematics, or English for chapter-by-chapter MCQ practice and mock exams on Boardly.',
  },
  subject: {
    title: 'Chapter MCQ Practice — Boardly by SHS Virtual Academy',
    description:
      'Practice chapter-wise SLO MCQs with instant step-by-step AI explanations on Boardly by SHS Virtual Academy.',
  },
  test: {
    title: 'MCQ Test Simulation — Boardly by SHS Virtual Academy',
    description:
      'Take timed FSC, Matric, MDCAT & TCAT MCQ practice tests on Boardly with instant scoring and detailed answer explanations.',
  },
  results: {
    title: 'Test Score & Analytics — Boardly',
    description:
      'Review your test analytics, chapter breakdown, accuracy rates, and AI step-by-step explanations on Boardly by SHS Virtual Academy.',
  },
  auth: {
    title: 'Student Portal Login — Boardly by SHS Virtual Academy',
    description:
      'Access the Boardly student portal by SHS Virtual Academy to resume MCQ practice tests and track your academic progress.',
  },
  guided_wizard: {
    title: 'Configure Practice Test — Boardly',
    description:
      'Customize test parameters, chapter selection, question count, and time limits for targeted board exam prep on Boardly.',
  },
  payment_required: {
    title: 'Membership Activation — Boardly',
    description:
      'Activate your Boardly Pro membership by SHS Virtual Academy for unlimited MCQ practice tests, past papers, and AI assistance.',
  },
  admin: {
    title: 'Admin Portal — Boardly by SHS Virtual Academy',
    description:
      'Boardly administrative portal by SHS Virtual Academy for managing question banks, exam categories, and student analytics.',
  },
};

/**
 * Helper to update or create an HTML meta tag in <head> by property or name attribute.
 */
function setMetaTag(attrName: 'property' | 'name', attrValue: string, content: string): void {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Updates or creates a complete suite of SEO and Open Graph meta tags in <head>, along with Twitter and canonical tags.
 */
export function setPageMeta(description: string, title?: string, canonicalHref?: string): void {
  if (typeof document === 'undefined') return;

  const effectiveTitle = title || DEFAULT_PAGE_META.intro.title || 'Boardly — MCQ Practice for FSC & Matric';

  // Standard document title
  document.title = effectiveTitle;

  // Standard meta description
  setMetaTag('name', 'description', description);

  // Open Graph meta tags (replacing existing or creating fresh)
  setMetaTag('property', 'og:title', effectiveTitle);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:type', 'website');
  setMetaTag('property', 'og:site_name', 'Boardly');
  setMetaTag('property', 'og:image', OG_IMAGE_URL);

  // Twitter card meta tags
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', effectiveTitle);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', OG_IMAGE_URL);

  // Ensure and update canonical link tag and sync og:url
  setCanonicalUrl(canonicalHref);

  // Ensure and maintain EducationalOrganization & FAQPage JSON-LD structured data (no duplicates)
  ensureEducationalOrgJsonLd();
  ensureFaqPageJsonLd();
}

/**
 * Computes and ensures exactly ONE <link rel="canonical"> tag exists in <head>,
 * dynamically matching the exact URL of each page and syncing og:url.
 */
export function setCanonicalUrl(canonicalHref?: string): void {
  if (typeof document === 'undefined') return;

  let finalHref = canonicalHref;

  if (!finalHref) {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const search = window.location.search;
      if ((!pathname || pathname === '/') && !search) {
        finalHref = `${CANONICAL_BASE_ORIGIN}/`;
      } else {
        const cleanPath = pathname && pathname !== '/' ? (pathname.startsWith('/') ? pathname : `/${pathname}`) : '';
        finalHref = `${CANONICAL_BASE_ORIGIN}${cleanPath}${search}` || `${CANONICAL_BASE_ORIGIN}/`;
      }
    } else {
      finalHref = `${CANONICAL_BASE_ORIGIN}/`;
    }
  }

  let canonicalTag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonicalTag) {
    canonicalTag = document.createElement('link');
    canonicalTag.setAttribute('rel', 'canonical');
    canonicalTag.setAttribute('id', 'canonical-link');
    document.head.appendChild(canonicalTag);
  } else {
    canonicalTag.setAttribute('id', 'canonical-link');
  }

  canonicalTag.setAttribute('href', finalHref);

  // Sync Open Graph URL tag
  setMetaTag('property', 'og:url', finalHref);
}

export const EDUCATIONAL_ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Boardly",
  "url": "https://boardly.cfd",
  "sameAs": ["https://shsvirtualacademy.pro"],
  "description": "Boardly by SHS Virtual Academy offers online secondary education for FSC Matric and Post FSC students through a virtual learning platform.",
  "parentOrganization": {
    "@type": "Organization",
    "name": "SHS Virtual Academy",
    "url": "https://shsvirtualacademy.pro"
  }
};

export const FAQ_PAGE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Boardly?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Boardly is a dedicated online MCQ practice and examination preparation platform engineered specifically for Matric, FSC, and post-FSC entry test students in Pakistan. It combines chapter-wise question banks, timed mock exam simulations, step-by-step solution derivations, and 24/7 AI tutoring to help students master their syllabus through active recall and continuous diagnostic assessment."
      }
    },
    {
      "@type": "Question",
      "name": "Which subjects and exams does Boardly cover?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Boardly provides comprehensive coverage for FBISE SSC (Classes 9 & 10) and HSSC (Classes 11 & 12) across Physics, Chemistry, Biology, Mathematics, Computer Science, English, Urdu, and Islamiat. Additionally, it offers dedicated competitive entrance test modules for PMDC MDCAT (Medical) and UET Taxila TCAT (Engineering), complete with syllabus-specific question weightings."
      }
    },
    {
      "@type": "Question",
      "name": "Is Boardly free to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, students can practice core chapter-wise question banks, attempt mock exams, and view AI-powered answer explanations for free. Optional Pro memberships provide extended question sets, in-depth performance analytics, and priority Study Buddy AI access. (Note that all Pro upgrades are digital purchases subject to a strict no-refunds policy.)"
      }
    },
    {
      "@type": "Question",
      "name": "How is Boardly different from live classes on schaorlio.me?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Boardly focuses strictly on self-paced MCQ testing, active question drills, instant step-by-step formula derivations, and diagnostic score tracking. Live interactive classes, scheduled video lectures, and instructor-led mentoring sessions are hosted separately through schaorlio.me."
      }
    },
    {
      "@type": "Question",
      "name": "Does Boardly provide explanations for MCQ answers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, every single question features detailed step-by-step explanations, formula breakdowns, and reasoning for why the correct option applies. Students can also chat directly with the 24/7 AI Study Buddy tutor to ask follow-up questions on complex numericals or tricky definitions."
      }
    },
    {
      "@type": "Question",
      "name": "Is Boardly part of SHS Virtual Academy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, Boardly is an educational initiative developed and operated under SHS Virtual Academy (shsvirtualacademy.pro). While SHS Virtual Academy provides overarching curriculum guidance, academic direction, and mentorship, Boardly serves as the specialized digital testing and practice portal."
      }
    }
  ]
};

/**
 * Ensures exactly one EducationalOrganization JSON-LD script exists in <head>, replacing or inserting cleanly.
 */
export function ensureEducationalOrgJsonLd(schemaData: object = EDUCATIONAL_ORG_SCHEMA): void {
  if (typeof document === 'undefined') return;

  let script = document.querySelector<HTMLScriptElement>('script#schema-educational-org');

  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'schema-educational-org';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(schemaData, null, 2);
}

/**
 * Ensures exactly one FAQPage JSON-LD script exists in <head>, replacing or inserting cleanly.
 */
export function ensureFaqPageJsonLd(schemaData: object = FAQ_PAGE_SCHEMA): void {
  if (typeof document === 'undefined') return;

  let script = document.querySelector<HTMLScriptElement>('script#schema-faq');

  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'schema-faq';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(schemaData, null, 2);
}
