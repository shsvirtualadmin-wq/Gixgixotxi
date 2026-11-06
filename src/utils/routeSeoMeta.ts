import {
  SHARE_DEFAULT_OG_IMAGE,
  SHARE_SITE_ORIGIN,
  buildDynamicOgImageUrl,
  buildPostSharePreview,
  buildProfileSharePreview,
  buildTestSharePreview,
  escapeHtmlMeta,
  humanizeSlugWithoutIds,
} from './sharePreviewHelper';

export interface ResolvedRouteMeta {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType: 'website' | 'article' | 'profile';
  ogImage: string;
  ogImageAlt?: string;
  noindex?: boolean;
  redirectUrl?: string;
}

const BASE_URL = SHARE_SITE_ORIGIN;
const DEFAULT_OG_IMAGE = SHARE_DEFAULT_OG_IMAGE;

function formatSlugLabel(slug: string): string {
  return humanizeSlugWithoutIds(slug);
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

export interface RouteDynamicDataInput {
  post?: {
    id?: string;
    title?: string;
    description?: string;
    body?: string;
    authorName?: string;
    subject?: string;
    boardTag?: string;
    classLevel?: string;
    slug?: string;
    imageUrl?: string | null;
    files?: Array<{ url?: string; type?: string; name?: string }>;
    filesJson?: unknown;
    updatedAt?: string;
    isPrivateOrMissing?: boolean;
  } | null;
  test?: {
    id?: string;
    title?: string;
    description?: string;
    subject?: string;
    slug?: string;
    questionCount?: number | null;
    durationMinutes?: number | null;
    creatorName?: string | null;
    updatedAt?: string;
    isPrivateOrMissing?: boolean;
  } | null;
  profile?: {
    uid?: string;
    displayName?: string;
    bio?: string;
    username?: string;
    avatarUrl?: string | null;
    role?: string | null;
    followersCount?: number | null;
    postsCount?: number | null;
    isPrivateOrMissing?: boolean;
  } | null;
}

export function resolveStaticOrPatternRouteMeta(
  pathname: string,
  search = '',
  dynamicData?: RouteDynamicDataInput
): ResolvedRouteMeta {
  const cleanPath = (pathname || '/').replace(/\/+$/, '') || '/';
  const canonicalUrl = `${BASE_URL}${cleanPath}`;

  // 1. Dynamic Commons Post Permalink: /commons/post/:idSlug
  if (cleanPath.startsWith('/commons/post/')) {
    const slugParam = decodeURIComponent(cleanPath.slice('/commons/post/'.length));
    const post = dynamicData?.post;
    if (post?.isPrivateOrMissing) {
      return {
        title: 'Boardly Commons | Boardly',
        description:
          'Explore student study resources, shared notes, and verified entrance exam discussions on Boardly Commons.',
        canonicalUrl: `${BASE_URL}/commons`,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        ogImageAlt: 'Boardly Commons',
        noindex: true,
      };
    }
    if (post && (post.title || post.body || post.description)) {
      const preview = buildPostSharePreview(
        {
          id: post.id || slugParam,
          title: post.title,
          body: post.body ?? post.description,
          authorName: post.authorName,
          subjectTag: post.subject,
          boardTag: post.boardTag,
          classLevel: post.classLevel,
          imageUrl: post.imageUrl,
          filesJson: post.filesJson ?? post.files,
          updatedAt: post.updatedAt,
        },
        BASE_URL
      );
      const canonicalSlug = post.slug || preview.canonicalSlug || slugParam;
      return {
        title: preview.title,
        description: preview.description,
        canonicalUrl: `${BASE_URL}/commons/post/${canonicalSlug}`,
        ogType: 'article',
        ogImage: preview.image,
        ogImageAlt: preview.imageAlt,
      };
    }
    const readable = formatSlugLabel(slugParam) || 'Student Study Post';
    const fallbackPreview = buildPostSharePreview(
      {
        id: slugParam,
        title: readable,
        body: `${readable} — Student notes and study discussion on Boardly Commons.`,
      },
      BASE_URL
    );
    return {
      title: fallbackPreview.title,
      description: fallbackPreview.description,
      canonicalUrl,
      ogType: 'article',
      ogImage: fallbackPreview.image,
      ogImageAlt: fallbackPreview.imageAlt,
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
    if (post?.isPrivateOrMissing) {
      return {
        title: 'Study Material | Boardly Commons',
        description:
          'Browse verified FSc Class 11 & 12 study notes, formula sheets, and past papers on Boardly Commons.',
        canonicalUrl: `${BASE_URL}/material`,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        ogImageAlt: 'Boardly Commons Study Material',
        noindex: true,
      };
    }
    if (post && (post.title || post.body || post.description)) {
      const preview = buildPostSharePreview(
        {
          id: post.id || slugParam,
          title: post.title,
          body: post.body ?? post.description,
          authorName: post.authorName,
          subjectTag: post.subject,
          boardTag: post.boardTag,
          classLevel: post.classLevel,
          imageUrl: post.imageUrl,
          filesJson: post.filesJson ?? post.files,
          updatedAt: post.updatedAt,
        },
        BASE_URL
      );
      const canonicalSlug = post.slug || preview.canonicalSlug || slugParam;
      return {
        title: preview.title,
        description: preview.description,
        canonicalUrl: `${BASE_URL}/material/${canonicalSlug}`,
        ogType: 'article',
        ogImage: preview.image,
        ogImageAlt: preview.imageAlt,
      };
    }
    const readable = formatSlugLabel(slugParam) || 'Study Material';
    const fallbackPreview = buildPostSharePreview(
      {
        id: slugParam,
        title: readable,
        body: `Verified ${readable} study notes, formula sheets, and practice resources on Boardly Commons.`,
      },
      BASE_URL
    );
    return {
      title: fallbackPreview.title,
      description: fallbackPreview.description,
      canonicalUrl,
      ogType: 'article',
      ogImage: fallbackPreview.image,
      ogImageAlt: fallbackPreview.imageAlt,
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

  // 8. Public User & Captain Profiles: /u/:username, /profile/:userId, /user/:userId, /users/:userId, /captains/:username
  const isCaptainProfileRoute =
    cleanPath.startsWith('/captains/') &&
    cleanPath !== '/captains/apply' &&
    cleanPath !== '/captains/leaderboard';
  if (
    cleanPath.startsWith('/u/') ||
    (cleanPath.startsWith('/profile/') && cleanPath !== '/profile/edit') ||
    cleanPath.startsWith('/user/') ||
    cleanPath.startsWith('/users/') ||
    isCaptainProfileRoute
  ) {
    const rawUser = decodeURIComponent(cleanPath.split('/').pop() || 'Student');
    const profile = dynamicData?.profile;
    if (profile?.isPrivateOrMissing) {
      return {
        title: 'Student Profile | Boardly',
        description:
          'Connect with students, explore shared study notes, and track national test rankings on Boardly.',
        canonicalUrl: `${BASE_URL}/commons`,
        ogType: 'profile',
        ogImage: DEFAULT_OG_IMAGE,
        ogImageAlt: 'Boardly Student Profile',
        noindex: true,
      };
    }
    const cleanHandle =
      profile?.username ||
      (cleanPath.startsWith('/u/') || isCaptainProfileRoute
        ? rawUser.replace(/^@+/, '')
        : /^[a-f0-9-]{20,}$/i.test(rawUser)
          ? ''
          : rawUser.replace(/^@+/, ''));
    const displayName = profile?.displayName || formatSlugLabel(rawUser) || 'Boardly Student';
    const preview = buildProfileSharePreview(
      {
        uid: profile?.uid || rawUser,
        username: cleanHandle || null,
        displayName,
        bio: profile?.bio,
        avatarUrl: profile?.avatarUrl,
        role: profile?.role || (isCaptainProfileRoute ? 'captain' : null),
        followersCount: profile?.followersCount,
        postsCount: profile?.postsCount,
      },
      BASE_URL
    );
    const canonicalProfileUrl = cleanHandle
      ? `${BASE_URL}/u/${encodeURIComponent(cleanHandle)}`
      : canonicalUrl;
    return {
      title: preview.title,
      description: preview.description,
      canonicalUrl: canonicalProfileUrl,
      ogType: 'profile',
      ogImage: preview.image,
      ogImageAlt: preview.imageAlt,
    };
  }

  // 9. Leaderboards & Grand Line: /leaderboard, /grand-line, /grand-line/leaderboard, /grand-line/test/:id, /tests/:id, /test/:id
  if (cleanPath === '/leaderboard' || cleanPath === '/grand-line/leaderboard') {
    return {
      title: 'Grand Line Leaderboard — Top Student Rankings | Boardly',
      description:
        'See the top-scoring students across Pakistan on the Boardly Grand Line leaderboard. Compete in verified timed drills and track your national rank.',
      canonicalUrl,
      ogType: 'website',
      ogImage: buildDynamicOgImageUrl(
        {
          type: 'test',
          title: 'Grand Line National Leaderboard',
          subtitle: 'See the top-scoring students across Pakistan in verified timed entrance tests.',
          badge: 'GRAND LINE LEADERBOARD',
          meta: 'Live National Rankings · Boardly',
        },
        BASE_URL
      ),
      ogImageAlt: 'Grand Line Leaderboard — Boardly',
    };
  }
  if (cleanPath === '/grand-line') {
    return {
      title: 'The Grand Line — National Scholarship & Merit Drills | Boardly',
      description:
        'Compete in official timed entrance exam drills on Boardly Grand Line. One verified attempt per drill, live rankings, and downloadable PDF solutions.',
      canonicalUrl,
      ogType: 'website',
      ogImage: buildDynamicOgImageUrl(
        {
          type: 'test',
          title: 'The Grand Line — National Ranked Tests',
          subtitle: 'One verified attempt per test, live rankings, and downloadable PDF solutions.',
          badge: 'THE GRAND LINE',
          meta: 'Official Timed Entrance Tests · Boardly',
        },
        BASE_URL
      ),
      ogImageAlt: 'The Grand Line — Boardly',
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
      ogImageAlt: 'About The Grand Line — Boardly',
    };
  }
  if (
    cleanPath.startsWith('/grand-line/test/') ||
    cleanPath.startsWith('/tests/') ||
    cleanPath.startsWith('/test/')
  ) {
    const rawSegment = cleanPath
      .replace(/^\/(?:grand-line\/test|tests|test)\//, '')
      .replace(/\/run$/, '');
    const slug = decodeURIComponent(rawSegment);
    const test = dynamicData?.test;
    if (test?.isPrivateOrMissing) {
      return {
        title: 'Grand Line Test | Boardly',
        description:
          'Compete in official timed entrance exam tests on Boardly Grand Line and see where you rank on the national leaderboard.',
        canonicalUrl: `${BASE_URL}/grand-line`,
        ogType: 'website',
        ogImage: DEFAULT_OG_IMAGE,
        ogImageAlt: 'Boardly Grand Line Test',
        noindex: true,
      };
    }
    const testTitle = test?.title || formatSlugLabel(slug) || 'Grand Line Test';
    const preview = buildTestSharePreview(
      {
        id: test?.id || slug,
        title: testTitle,
        description: test?.description,
        questionCount: test?.questionCount,
        durationMinutes: test?.durationMinutes,
        creatorName: test?.creatorName,
        subject: test?.subject,
        updatedAt: test?.updatedAt,
      },
      BASE_URL
    );
    const canonicalSlug = test?.slug || preview.canonicalSlug || slug;
    return {
      title: preview.title,
      description: preview.description,
      canonicalUrl: `${BASE_URL}/grand-line/test/${canonicalSlug}`,
      ogType: 'website',
      ogImage: preview.image,
      ogImageAlt: preview.imageAlt,
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
    '/rewards': {
      title: 'Boardly Rewards',
      description:
        'Earn up to 7,550 Kobans every 30 days with the Boardly daily check-in, unlock MCQ practice milestones, and invite classmates for +5,000 Kobans.',
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
      ogImageAlt: staticPages[cleanPath].title,
    };
  }

  // Fallback for any other route (e.g. /dashboard, /join/:code, etc.)
  const fallbackLabel = formatSlugLabel(cleanPath.split('/').filter(Boolean).join(' — ')) || 'Boardly';
  return {
    title: `${fallbackLabel} | Boardly`,
    description:
      'Boardly — Free adaptive MCQ practice, study notes, and entrance test preparation for Pakistani students.',
    canonicalUrl,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: `${fallbackLabel} | Boardly`,
  };
}

/**
 * Replaces the default hardcoded home-page `<title>`, `<meta name="description">`,
 * `<link rel="canonical">`, `og:*`, and `twitter:*` tags in `index.html` with
 * the exact route-specific values so WhatsApp, Facebook, Telegram, Twitter, and
 * search crawlers always show the exact page preview and URL (never the home page).
 */
export function injectMetaIntoIndexHtml(html: string, meta: ResolvedRouteMeta): string {
  const safeTitle = escapeHtmlMeta(meta.title);
  const safeDesc = escapeHtmlMeta(meta.description);
  const safeUrl = escapeHtmlMeta(meta.canonicalUrl);
  const safeImg = escapeHtmlMeta(meta.ogImage);
  const safeImgAlt = escapeHtmlMeta(meta.ogImageAlt || meta.title);
  const safeType = escapeHtmlMeta(meta.ogType);

  let out = html;

  // Remove any existing extra og:image:* or twitter:url / twitter:image:alt tags before injecting cleanly
  out = out
    .replace(/\s*<meta\s+property="og:image:(?:secure_url|type|width|height|alt)"\s+content="[^"]*"\s*\/?>/gi, '')
    .replace(/\s*<meta\s+name="twitter:(?:url|image:alt)"\s+content="[^"]*"\s*\/?>/gi, '');

  // Replace <title>...</title>
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);

  // Replace <meta name="description" ...>
  out = out.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${safeDesc}" />`
  );

  // Replace robots tag if noindex
  if (meta.noindex) {
    out = out.replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="robots" content="noindex, nofollow" />`
    );
  }

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
    `<meta property="og:image" content="${safeImg}" />\n    <meta property="og:image:secure_url" content="${safeImg}" />\n    <meta property="og:image:type" content="image/png" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:alt" content="${safeImgAlt}" />`
  );

  // Replace Twitter tags
  out = out.replace(
    /<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:card" content="summary_large_image" />\n    <meta name="twitter:url" content="${safeUrl}" />`
  );
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
    `<meta name="twitter:image" content="${safeImg}" />\n    <meta name="twitter:image:alt" content="${safeImgAlt}" />`
  );

  return out;
}

