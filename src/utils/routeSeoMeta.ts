export interface ResolvedRouteMeta {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType: 'website' | 'article' | 'profile';
  ogImage: string;
  noindex?: boolean;
}

const BASE_URL = 'https://boardly.cfd';
const DEFAULT_OG_IMAGE = `${BASE_URL}/assets/og-image.png`;

function formatSlugLabel(slug: string): string {
  return decodeURIComponent(slug || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export const UNIVERSITY_META: Record<
  string,
  { name: string; fullName: string; description: string }
> = {
  mdcat: {
    name: 'MDCAT',
    fullName: 'PMDC National MDCAT Medical Entrance Test',
    description:
      'Practice 10,000+ chapter-wise PMDC MDCAT Biology, Chemistry, Physics, English & Logical Reasoning MCQs with instant explanations on Boardly.',
  },
  nust: {
    name: 'NUST NET',
    fullName: 'NUST Entrance Test (NET) Engineering & CS',
    description:
      'Master NUST NET Mathematics, Physics, Chemistry, Computer Science & English MCQs with timed topic drills and explanations on Boardly.',
  },
  fast: {
    name: 'FAST NU',
    fullName: 'FAST-NUCES Admission Test (CS & Engineering)',
    description:
      'Prepare for FAST-NUCES admission tests with Advanced Math, Basic Math, Analytical Reasoning, IQ & English MCQs on Boardly.',
  },
  ecat: {
    name: 'UET ECAT',
    fullName: 'UET Combined Engineering Entrance Test (ECAT)',
    description:
      'Practice UET ECAT Physics, Mathematics, Chemistry & Computer Science chapter-wise MCQs with step-by-step solutions on Boardly.',
  },
  giki: {
    name: 'GIKI',
    fullName: 'GIKI Undergraduate Admission Test',
    description:
      'Crack the GIKI entrance exam with high-difficulty Physics, Mathematics & English MCQs and timed mock drills on Boardly.',
  },
  pieas: {
    name: 'PIEAS',
    fullName: 'PIEAS Undergraduate Admission Test',
    description:
      'Practice PIEAS admission test MCQs across Physics, Mathematics, Chemistry & English with full conceptual explanations on Boardly.',
  },
  nums: {
    name: 'NUMS',
    fullName: 'NUMS Entry Test for Armed Forces Medical Colleges',
    description:
      'Prepare for NUMS MDCAT with chapter-wise Biology, Chemistry, Physics & English MCQs and verified past paper drills on Boardly.',
  },
  aku: {
    name: 'AKU',
    fullName: 'Aga Khan University (AKU) MBBS Entrance Test',
    description:
      'Practice AKU medical entrance test Biology, Chemistry, Physics, Science Reasoning & Math MCQs on Boardly.',
  },
};

export function resolveStaticOrPatternRouteMeta(
  pathname: string,
  search = '',
  dynamicData?: {
    post?: {
      title?: string;
      description?: string;
      subject?: string;
      slug?: string;
      id?: string;
      files?: Array<{ url?: string; type?: string; name?: string }>;
    } | null;
    test?: {
      title?: string;
      description?: string;
      subject?: string;
      slug?: string;
      id?: string;
    } | null;
    profile?: {
      displayName?: string;
      bio?: string;
      username?: string;
    } | null;
  }
): ResolvedRouteMeta {
  const cleanPath = (pathname || '/').replace(/\/+$/, '') || '/';
  const canonicalUrl = `${BASE_URL}${cleanPath}`;

  // 1. Dynamic Commons Post Permalink: /commons/post/:idSlug
  if (cleanPath.startsWith('/commons/post/')) {
    const slugParam = decodeURIComponent(cleanPath.slice('/commons/post/'.length));
    const post = dynamicData?.post;
    if (post && post.title) {
      const title = `${post.title} — ${post.subject || 'Commons'} | Boardly`;
      const desc =
        String(post.description || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 200) ||
        `View "${post.title}" and join the student discussion on Boardly Commons.`;
      const firstImage = (post.files || []).find(
        (f) =>
          f?.url &&
          (String(f.type || '').startsWith('image/') ||
            /\.(png|jpe?g|webp|gif)$/i.test(String(f.name || f.url || '')))
      );
      const ogImage = firstImage?.url
        ? firstImage.url.startsWith('http')
          ? firstImage.url
          : `${BASE_URL}${firstImage.url}`
        : DEFAULT_OG_IMAGE;
      const canonicalSlug = post.slug || post.id || slugParam;
      return {
        title,
        description: desc,
        canonicalUrl: `${BASE_URL}/commons/post/${canonicalSlug}`,
        ogType: 'article',
        ogImage,
      };
    }
    const readable = formatSlugLabel(slugParam.replace(/^post_[a-zA-Z0-9_]+-?/, '')) || 'Student Post';
    return {
      title: `${readable} — Boardly Commons`,
      description: `Read this student post, view comments, and download shared study resources on Boardly Commons.`,
      canonicalUrl,
      ogType: 'article',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }

  // 2. Dynamic Study Material Detail: /material/:idSlug or /study-material/:idSlug
  if (
    (cleanPath.startsWith('/material/') && !cleanPath.startsWith('/material/subject/')) ||
    (cleanPath.startsWith('/study-material/') && !cleanPath.startsWith('/study-material/subject/'))
  ) {
    const slugParam = decodeURIComponent(
      cleanPath.replace(/^\/(study-)?material\//, '')
    );
    const post = dynamicData?.post;
    if (post && post.title) {
      const title = `${post.title} — ${post.subject || 'Study Material'} PDF & Notes | Boardly`;
      const desc =
        String(post.description || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 200) ||
        `Read and download "${post.title}" (${post.subject || 'Study Notes'}) for Class 11, Class 12 & Entrance Test prep on Boardly.`;
      return {
        title,
        description: desc,
        canonicalUrl,
        ogType: 'article',
        ogImage: DEFAULT_OG_IMAGE,
      };
    }
    const readable = formatSlugLabel(slugParam.replace(/^post_[a-zA-Z0-9_]+-?/, '')) || 'Study Material';
    return {
      title: `${readable} — Study Material & Notes | Boardly`,
      description: `Download verified ${readable} PDF notes, formula sheets, and past papers on Boardly.`,
      canonicalUrl,
      ogType: 'article',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }

  // 3. Study Material Subject Filter: /material/subject/:subject or /study-material/subject/:subject
  if (
    cleanPath.startsWith('/material/subject/') ||
    cleanPath.startsWith('/study-material/subject/')
  ) {
    const subj = formatSlugLabel(cleanPath.split('/').pop() || 'Science');
    return {
      title: `${subj} Notes, Formula Sheets & Past Papers — Boardly Study Material`,
      description: `Browse and download free ${subj} notes, solved past papers, and formula sheets for Class 11, Class 12, MDCAT & ECAT on Boardly.`,
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }

  // 4. Study Material Hub: /material or /study-material
  if (cleanPath === '/material' || cleanPath === '/study-material') {
    return {
      title: 'Free Study Material, Notes, Past Papers & Formula Sheets — Boardly',
      description:
        'Download free FSc Class 11 & 12 notes, formula sheets, and solved past papers for Physics, Chemistry, Biology, Mathematics, MDCAT, NET & ECAT on Boardly.',
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }

  // 5. MCQs Routes: /mcqs, /mcqs/:p1, /mcqs/:p1/:p2, /mcqs/:p1/:p2/:p3
  if (cleanPath === '/mcqs') {
    return {
      title: 'Free Topic-Wise MCQs Bank — Physics, Chemistry, Biology, Math & CS | Boardly',
      description:
        'Practice 20,000+ free chapter-wise MCQs for FSc Class 11 & 12, MDCAT, NUST NET, FAST, UET ECAT & GIKI with instant explanations.',
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }

  if (cleanPath.startsWith('/mcqs/')) {
    const parts = cleanPath.slice('/mcqs/'.length).split('/').filter(Boolean);
    const firstKey = parts[0]?.toLowerCase() || '';
    const uniMeta = UNIVERSITY_META[firstKey];

    if (parts.length === 1) {
      if (uniMeta) {
        return {
          title: `${uniMeta.name} MCQs & Practice Test Bank — ${uniMeta.fullName} | Boardly`,
          description: uniMeta.description,
          canonicalUrl,
          ogType: 'website',
          ogImage: DEFAULT_OG_IMAGE,
        };
      }
      const subjectLabel = formatSlugLabel(parts[0]);
      return {
        title: `${subjectLabel} MCQs — Chapter-Wise Practice for Class 11, 12, MDCAT & ECAT | Boardly`,
        description: `Practice free chapter-wise ${subjectLabel} MCQs with instant answers and step-by-step explanations for Board exams, MDCAT, NUST NET & ECAT on Boardly.`,
        canonicalUrl,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
      };
    }

    if (parts.length === 2) {
      if (uniMeta) {
        const subjectLabel = formatSlugLabel(parts[1]);
        return {
          title: `${uniMeta.name} ${subjectLabel} MCQs — Chapter-Wise Practice & Past Papers | Boardly`,
          description: `Practice ${uniMeta.name} ${subjectLabel} chapter-wise MCQs with detailed explanations and timed drills for ${uniMeta.fullName} on Boardly.`,
          canonicalUrl,
          ogType: 'website',
          ogImage: DEFAULT_OG_IMAGE,
        };
      }
      const subjectLabel = formatSlugLabel(parts[0]);
      const chapterLabel = formatSlugLabel(parts[1]);
      return {
        title: `${chapterLabel} MCQs (${subjectLabel}) — Solved Questions & Explanations | Boardly`,
        description: `Practice ${chapterLabel} MCQs in ${subjectLabel} with instant answer verification and detailed explanations for FSc, MDCAT, NET & ECAT on Boardly.`,
        canonicalUrl,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
      };
    }

    if (parts.length >= 3) {
      const uniLabel = uniMeta ? uniMeta.name : formatSlugLabel(parts[0]);
      const subjectLabel = formatSlugLabel(parts[1]);
      const chapterLabel = formatSlugLabel(parts[2]);
      return {
        title: `${uniLabel} ${chapterLabel} MCQs (${subjectLabel}) — Practice Drill | Boardly`,
        description: `Solve ${uniLabel} ${subjectLabel} MCQs on ${chapterLabel} with instant grading and full conceptual explanations on Boardly.`,
        canonicalUrl,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
      };
    }
  }

  // 6. Subjects Hub & Subject Detail: /subjects, /subjects/:subjectId, /subjects/:subjectId/:chapter
  if (cleanPath === '/subjects') {
    return {
      title: 'All Subjects — Physics, Chemistry, Biology, Math, English & CS | Boardly',
      description:
        'Explore all FSc Class 11 & 12 and university entrance test subjects on Boardly. Access chapter-wise MCQs, notes, and practice drills.',
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }
  if (cleanPath.startsWith('/subjects/')) {
    const parts = cleanPath.slice('/subjects/'.length).split('/').filter(Boolean);
    const subjLabel = formatSlugLabel(parts[0] || 'Subject');
    if (parts.length >= 2) {
      const chapLabel = formatSlugLabel(parts[1]);
      return {
        title: `${chapLabel} — ${subjLabel} MCQs & Study Guide | Boardly`,
        description: `Study ${chapLabel} in ${subjLabel} with interactive MCQs, explanations, and revision notes on Boardly.`,
        canonicalUrl,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
      };
    }
    return {
      title: `${subjLabel} — Chapters, MCQs & Study Material | Boardly`,
      description: `Master ${subjLabel} with chapter-wise MCQs, solved past papers, and revision notes for Class 11, 12, MDCAT & ECAT on Boardly.`,
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }

  // 7. Commons Feed & Sub-routes: /commons, /commons/trending, /commons/following, /commons/subject/:subject
  if (cleanPath === '/commons' || cleanPath === '/commons/trending' || cleanPath === '/commons/following') {
    const isTrending = cleanPath === '/commons/trending' || search.includes('tab=trending');
    const isFollowing = cleanPath === '/commons/following' || search.includes('tab=following');
    const prefix = isTrending ? 'Trending in ' : isFollowing ? 'Following Feed — ' : '';
    return {
      title: `${prefix}Boardly Commons — Student Study Community, Notes & Doubts`,
      description:
        'Join Pakistani Class 11, Class 12, MDCAT, NET & ECAT students on Boardly Commons. Share notes, ask doubts, and discuss entrance test questions.',
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }
  if (cleanPath.startsWith('/commons/subject/')) {
    const subj = formatSlugLabel(cleanPath.slice('/commons/subject/'.length));
    return {
      title: `${subj} Community Posts, Notes & Doubts — Boardly Commons`,
      description: `Browse student-shared ${subj} notes, past papers, formula sheets, and Q&A discussions on Boardly Commons.`,
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }

  // 8. Public User Profiles: /u/:username and /profile/:userId
  if (cleanPath.startsWith('/u/') || (cleanPath.startsWith('/profile/') && cleanPath !== '/profile/edit')) {
    const rawUser = decodeURIComponent(cleanPath.split('/').pop() || 'Student');
    const displayName = dynamicData?.profile?.displayName || formatSlugLabel(rawUser);
    return {
      title: `${displayName} — Student Profile on Boardly`,
      description:
        dynamicData?.profile?.bio ||
        `View ${displayName}'s public study notes, shared resources, and community contributions on Boardly.`,
      canonicalUrl,
      ogType: 'profile',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }

  // 9. Leaderboards & Grand Line: /leaderboard, /grand-line, /grand-line/leaderboard, /grand-line/test/:id
  if (cleanPath === '/leaderboard' || cleanPath === '/grand-line/leaderboard') {
    return {
      title: 'Grand Line Leaderboard — Top Student Rankings | Boardly',
      description:
        'See the top-scoring students across Pakistan on the Boardly Grand Line leaderboard. Compete in verified timed drills and track your national rank.',
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }
  if (cleanPath === '/grand-line') {
    return {
      title: 'The Grand Line — National Scholarship & Merit Drills | Boardly',
      description:
        'Compete in official timed entrance exam drills on Boardly Grand Line. One verified attempt per drill, live rankings, and downloadable PDF solutions.',
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }
  if (cleanPath === '/grand-line/about') {
    return {
      title: 'About The Grand Line — Rules & Rankings | Boardly',
      description:
        'Learn how Boardly Grand Line national scholarship drills work, including verification rules, scoring, and leaderboards.',
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }
  if (cleanPath.startsWith('/grand-line/test/')) {
    const slug = decodeURIComponent(cleanPath.slice('/grand-line/test/'.length).replace(/\/run$/, ''));
    const testTitle = dynamicData?.test?.title || formatSlugLabel(slug);
    return {
      title: `${testTitle} — Grand Line Verified Drill | Boardly`,
      description:
        dynamicData?.test?.description ||
        `Take the "${testTitle}" verified drill on Boardly Grand Line and benchmark your score on the national leaderboard.`,
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }

  // 10. Static Marketing & Info Pages
  const staticPages: Record<string, { title: string; description: string }> = {
    '/': {
      title: 'Boardly — Free MDCAT, ECAT, NET & FSc MCQ Practice for Pakistani Students',
      description:
        'Free adaptive MCQ practice for Pakistani Class 11 & 12 board exams and MDCAT, NUST NET, FAST, UET ECAT & GIKI entrance tests.',
    },
    '/features': {
      title: 'Platform Features — Adaptive MCQs, Timed Drills, Crew & Commons | Boardly',
      description:
        'Explore Boardly features: 20,000+ chapter-wise MCQs, university entrance exam simulations, study crews, Koban rewards, and Boardly Commons.',
    },
    '/how-it-works': {
      title: 'How Boardly Works — Study Smarter for FSc, MDCAT, NET & ECAT',
      description:
        'See how Boardly helps Pakistani students master board exams and university admission tests in 3 simple steps.',
    },
    '/pricing': {
      title: '100% Free Education for Every Student — Boardly Pricing',
      description:
        'Boardly is free for students across Pakistan. Practice unlimited MCQs, download notes, and compete in national drills at zero cost.',
    },
    '/faq': {
      title: 'Frequently Asked Questions (FAQ) — Boardly',
      description:
        'Answers to common questions about Boardly MCQ banks, MDCAT/NET/ECAT preparation, study crews, Kobans, and account privacy.',
    },
    '/about': {
      title: 'About Boardly — Mission & Story',
      description:
        'Boardly is built to give every Pakistani student free, world-class preparation for Class 11, Class 12, MDCAT, NET, FAST, and ECAT exams.',
    },
    '/contact': {
      title: 'Contact Us & Support — Boardly',
      description:
        'Get in touch with the Boardly team for support, feedback, campus captain inquiries, or content suggestions.',
    },
    '/privacy': {
      title: 'Privacy Policy — Boardly',
      description: 'Read how Boardly protects student data, privacy, and account security.',
    },
    '/terms': {
      title: 'Terms of Service — Boardly',
      description: 'Terms and conditions for using the Boardly educational platform.',
    },
    '/guidelines': {
      title: 'Community Guidelines — Boardly Commons',
      description:
        'Rules and community guidelines for sharing study materials, asking doubts, and helping fellow students on Boardly Commons.',
    },
    '/search': {
      title: 'Search MCQs, Study Notes, Posts & Students — Boardly',
      description:
        'Search across thousands of chapter-wise MCQs, PDF study notes, past papers, and student discussions on Boardly.',
    },
    '/arena': {
      title: 'Boardly Arena — Live Competitive MCQ Battles',
      description:
        'Challenge fellow students in real-time MCQ battles and timed subject arenas on Boardly.',
    },
    '/kobans': {
      title: 'Kobans & Student Rewards — Boardly Store',
      description:
        'Earn Kobans by practicing MCQs, maintaining study streaks, and contributing notes on Boardly.',
    },
    '/captains': {
      title: 'Nakama Captains Program — Lead Your Campus Crew | Boardly',
      description:
        'Apply to become a verified Boardly Campus Captain, create drills for your college, and lead your study crew.',
    },
    '/captains/apply': {
      title: 'Apply to Become a Campus Captain — Boardly',
      description:
        'Submit your application to become a verified Boardly Captain at your college or academy.',
    },
    '/captains/leaderboard': {
      title: 'Campus Captains Leaderboard — Boardly',
      description:
        'View the top-performing Boardly Campus Captains and study crews across Pakistan.',
    },
    '/crew': {
      title: 'Study Crews — Learn & Compete Together | Boardly',
      description:
        'Join or create a Campus Study Crew on Boardly to practice together, share resources, and climb the crew rankings.',
    },
    '/login': {
      title: 'Sign In to Your Account — Boardly',
      description:
        'Sign in to Boardly to track your MCQ accuracy, save study materials, and join your campus crew.',
    },
    '/signup': {
      title: 'Create Free Student Account — Boardly',
      description:
        'Join Boardly for free to practice Class 11 & 12 board and university entrance exam MCQs, download notes, and study with your crew.',
    },
    '/forgot-password': {
      title: 'Reset Your Password — Boardly',
      description: 'Reset your Boardly student account password.',
    },
    '/practice': {
      title: 'MCQ Practice Hub — University & Chapter Drills | Boardly',
      description:
        'Start a customized MCQ practice drill by university track (MDCAT, NUST NET, FAST, UET ECAT, GIKI) or FSc subject and chapter.',
    },
    '/results': {
      title: 'My Test Results & Performance Analytics — Boardly',
      description:
        'Review your completed MCQ drills, accuracy breakdown, and downloadable PDF answer keys on Boardly.',
    },
    '/store': {
      title: 'Koban Store — Avatars, Frames & Profile Banners | Boardly',
      description:
        'Redeem your earned Kobans for custom student avatars, frames, and profile banners in the Boardly Store.',
    },
  };

  if (staticPages[cleanPath]) {
    return {
      title: staticPages[cleanPath].title,
      description: staticPages[cleanPath].description,
      canonicalUrl,
      ogType: 'website',
      ogImage: DEFAULT_OG_IMAGE,
    };
  }

  // Fallback for any other route (e.g. /dashboard, /join/:code, etc.)
  const fallbackLabel = formatSlugLabel(cleanPath.split('/').filter(Boolean).join(' — ')) || 'Boardly';
  return {
    title: `${fallbackLabel} — Boardly`,
    description:
      'Boardly — Free adaptive MCQ practice, study notes, and entrance test preparation for Pakistani students.',
    canonicalUrl,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
  };
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Replaces the default hardcoded home-page `<title>`, `<meta name="description">`,
 * `<link rel="canonical">`, `og:*`, and `twitter:*` tags in `index.html` with
 * the exact route-specific values so WhatsApp, Facebook, Telegram, Twitter, and
 * search crawlers always show the exact page preview and URL (never the home page).
 */
export function injectMetaIntoIndexHtml(html: string, meta: ResolvedRouteMeta): string {
  const safeTitle = escapeHtml(meta.title);
  const safeDesc = escapeHtml(meta.description);
  const safeUrl = escapeHtml(meta.canonicalUrl);
  const safeImg = escapeHtml(meta.ogImage);
  const safeType = escapeHtml(meta.ogType);

  let out = html;

  // Replace <title>...</title>
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);

  // Replace <meta name="description" ...>
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${safeDesc}" />`
  );

  // Replace <link rel="canonical" ...>
  out = out.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${safeUrl}" />`
  );

  // Replace OpenGraph tags
  out = out.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${safeType}" />`
  );
  out = out.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${safeUrl}" />`
  );
  out = out.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${safeTitle}" />`
  );
  out = out.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${safeDesc}" />`
  );
  out = out.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${safeImg}" />`
  );

  // Replace Twitter tags
  out = out.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${safeTitle}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${safeDesc}" />`
  );
  out = out.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${safeImg}" />`
  );

  return out;
}
