export function buildEntitySlug(id: string, title?: string | null): string {
  const cleanId = String(id || '').trim();
  if (!title) return cleanId;
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug ? `${cleanId}-${slug}` : cleanId;
}

export function extractIdFromSlug(idSlug?: string | null): string {
  if (!idSlug) return '';
  const trimmed = decodeURIComponent(idSlug).trim();
  const dashIndex = trimmed.indexOf('-');
  if (dashIndex === -1) return trimmed;
  return trimmed.slice(0, dashIndex);
}

export const CANONICAL_SUBJECT_LABELS: Record<string, string> = {
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  mathematics: 'Mathematics',
  'computer-science': 'Computer Science',
  english: 'English',
};

export const SUBJECT_ALIAS_MAP: Record<string, string> = {
  physics: 'physics',
  phy: 'physics',
  chemistry: 'chemistry',
  chem: 'chemistry',
  biology: 'biology',
  bio: 'biology',
  mathematics: 'mathematics',
  math: 'mathematics',
  maths: 'mathematics',
  'computer-science': 'computer-science',
  'computer science': 'computer-science',
  computer: 'computer-science',
  cs: 'computer-science',
  ics: 'computer-science',
  english: 'english',
  eng: 'english',
};

export const UNIVERSITY_ALIAS_MAP: Record<string, { slug: string; label: string }> = {
  mdcat: { slug: 'mdcat', label: 'MDCAT' },
  nust: { slug: 'nust', label: 'NUST NET' },
  net: { slug: 'nust', label: 'NUST NET' },
  ecat: { slug: 'ecat', label: 'UET ECAT' },
  uet: { slug: 'ecat', label: 'UET ECAT' },
  fast: { slug: 'fast', label: 'FAST-NU' },
  giki: { slug: 'giki', label: 'GIKI' },
  nums: { slug: 'nums', label: 'NUMS' },
  pieas: { slug: 'pieas', label: 'PIEAS' },
  aku: { slug: 'aku', label: 'AKU' },
};

const KEYWORD_SUBJECT_RULES: Array<{ subject: string; regex: RegExp }> = [
  {
    subject: 'mathematics',
    regex:
      /\b(math|maths|calculus|differentiation|derivative|integration|integral|trig|trigonometry|quadratic|algebra|matrix|matrices|determinant|vector|conic|parabola|ellipse|hyperbola|binomial|sequence|series|complex number|function|limit|permutation|combination|probability|linear programming)\b/i,
  },
  {
    subject: 'chemistry',
    regex:
      /\b(chemistry|organic|inorganic|electrochemistry|thermochemistry|stoichiometry|mole|atomic structure|periodic|chemical bond|equilibrium|acid|base|buffer|kinetics|hydrocarbon|benzene|alkyl|alcohol|phenol|aldehyde|ketone|carboxylic|polymer|biochemistry|s-block|p-block|d-block)\b/i,
  },
  {
    subject: 'biology',
    regex:
      /\b(biology|cell|biodiversity|bioenergetics|biological|enzyme|photosynthesis|respiration|genetics|dna|rna|chromosome|evolution|prokaryote|protist|fungi|plantae|animalia|digestion|circulation|immunity|homeostasis|nervous|neuron|hormone|reproduction|skeleton|muscle|inheritance|biotechnology)\b/i,
  },
  {
    subject: 'physics',
    regex:
      /\b(physics|kinematics|force|motion|projectile|work|energy|power|circular motion|oscillation|shm|wave|doppler|optics|thermodynamics|electrostatics|capacitor|current electricity|ohm|kirchhoff|electromagnetism|magnetic|faraday|lenz|alternating current|electronics|transistor|dawn of modern physics|relativity|quantum|atomic spectra|nuclear|radioactivity)\b/i,
  },
  {
    subject: 'computer-science',
    regex:
      /\b(computer|programming|c\+\+|python|java|database|sql|normalization|erd|operating system|data structure|algorithm|network|osi|tcp|boolean|logic gate|software|oop|pointer|array|loop)\b/i,
  },
  {
    subject: 'english',
    regex:
      /\b(english|grammar|vocabulary|synonym|antonym|comprehension|sentence correction|tense|preposition|article|idiom|narration|voice)\b/i,
  },
];

export function slugifySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resolves any raw subject string (plus optional fallback text like post title/chapter/tags)
 * into a guaranteed-valid MCQ route and human-readable label.
 * Never returns `/mcqs/general` or `/mcqs/all`.
 */
export function resolveValidMcqSubject(
  rawSubject?: string | null,
  fallbackContext?: string | null
): {
  subjectSlug: string | null;
  universitySlug: string | null;
  label: string;
  href: string;
} {
  const cleaned = (rawSubject || '').trim().toLowerCase();
  const slugged = slugifySegment(cleaned);

  if (cleaned && cleaned !== 'general' && cleaned !== 'all') {
    const directSubject = SUBJECT_ALIAS_MAP[cleaned] || SUBJECT_ALIAS_MAP[slugged];
    if (directSubject) {
      return {
        subjectSlug: directSubject,
        universitySlug: null,
        label: CANONICAL_SUBJECT_LABELS[directSubject] || directSubject,
        href: `/mcqs/${directSubject}`,
      };
    }

    const directUni = UNIVERSITY_ALIAS_MAP[cleaned] || UNIVERSITY_ALIAS_MAP[slugged];
    if (directUni) {
      return {
        subjectSlug: null,
        universitySlug: directUni.slug,
        label: directUni.label,
        href: `/mcqs/${directUni.slug}`,
      };
    }
  }

  // Try inferring from rawSubject + fallbackContext (e.g., title, chapter, tags)
  const combined = `${rawSubject || ''} ${fallbackContext || ''}`.trim();
  if (combined) {
    for (const rule of KEYWORD_SUBJECT_RULES) {
      if (rule.regex.test(combined)) {
        const label = CANONICAL_SUBJECT_LABELS[rule.subject] || rule.subject;
        return {
          subjectSlug: rule.subject,
          universitySlug: null,
          label,
          href: `/mcqs/${rule.subject}`,
        };
      }
    }

    for (const [uniKey, uniVal] of Object.entries(UNIVERSITY_ALIAS_MAP)) {
      const uniRegex = new RegExp(`\\b${uniKey}\\b`, 'i');
      if (uniRegex.test(combined)) {
        return {
          subjectSlug: null,
          universitySlug: uniVal.slug,
          label: uniVal.label,
          href: `/mcqs/${uniVal.slug}`,
        };
      }
    }
  }

  return {
    subjectSlug: null,
    universitySlug: null,
    label: 'All Subjects',
    href: '/mcqs',
  };
}

/**
 * Central route-builder helper for Boardly so URLs are constructed in one place
 * and cannot drift or produce 404 paths.
 */
export const routes = {
  home: () => '/',

  mcqs: (
    subject?: string | null,
    chapter?: string | null,
    university?: string | null,
    fallbackContext?: string | null
  ): string => {
    const uniClean = university ? slugifySegment(university) : '';
    const validUni = uniClean && UNIVERSITY_ALIAS_MAP[uniClean] ? UNIVERSITY_ALIAS_MAP[uniClean].slug : '';

    const resolved = resolveValidMcqSubject(subject, fallbackContext);
    const subjSlug = resolved.subjectSlug;
    const chapSlug =
      chapter && !['general', 'all'].includes(chapter.trim().toLowerCase())
        ? slugifySegment(chapter)
        : '';

    if (validUni && subjSlug && chapSlug) {
      return `/mcqs/${validUni}/${subjSlug}/${chapSlug}`;
    }
    if (validUni && subjSlug) {
      return `/mcqs/${validUni}/${subjSlug}`;
    }
    if (validUni) {
      return `/mcqs/${validUni}`;
    }
    if (subjSlug && chapSlug) {
      return `/mcqs/${subjSlug}/${chapSlug}`;
    }
    return resolved.href;
  },

  subjects: (subject?: string | null, chapter?: string | null): string => {
    const resolved = resolveValidMcqSubject(subject);
    if (!resolved.subjectSlug) {
      return '/subjects';
    }
    const chapSlug =
      chapter && !['general', 'all'].includes(chapter.trim().toLowerCase())
        ? slugifySegment(chapter)
        : '';
    if (chapSlug) {
      return `/mcqs/${resolved.subjectSlug}/${chapSlug}`;
    }
    return `/subjects/${resolved.subjectSlug}`;
  },

  practiceFromMaterial: (material: {
    subject?: string | null;
    chapter?: string | null;
    title?: string | null;
    tags?: string[] | null;
  }): { href: string; label: string; subjectSlug: string | null } => {
    const fallbackText = [
      material.title || '',
      material.chapter || '',
      ...(Array.isArray(material.tags) ? material.tags : []),
    ].join(' ');
    const resolved = resolveValidMcqSubject(material.subject, fallbackText);
    return {
      href: resolved.href,
      label: resolved.label,
      subjectSlug: resolved.subjectSlug,
    };
  },

  practice: (params?: {
    subject?: string | null;
    chapter?: string | null;
    university?: string | null;
    mode?: string | null;
  }): string => {
    if (!params) return '/practice';
    const search = new URLSearchParams();
    if (params.university) search.set('university', params.university);
    if (params.subject && !['general', 'all'].includes(params.subject.trim().toLowerCase())) {
      search.set('subject', params.subject);
    }
    if (params.chapter && !['general', 'all'].includes(params.chapter.trim().toLowerCase())) {
      search.set('chapter', params.chapter);
    }
    if (params.mode) search.set('mode', params.mode);
    const qs = search.toString();
    return qs ? `/practice?${qs}` : '/practice';
  },

  dashboardPractice: (params?: {
    subject?: string | null;
    chapter?: string | null;
    university?: string | null;
    mode?: string | null;
  }): string => {
    if (!params) return '/dashboard/practice';
    const search = new URLSearchParams();
    if (params.university) search.set('university', params.university);
    if (params.subject && !['general', 'all'].includes(params.subject.trim().toLowerCase())) {
      search.set('subject', params.subject);
    }
    if (params.chapter && !['general', 'all'].includes(params.chapter.trim().toLowerCase())) {
      search.set('chapter', params.chapter);
    }
    if (params.mode) search.set('mode', params.mode);
    const qs = search.toString();
    return qs ? `/dashboard/practice?${qs}` : '/dashboard/practice';
  },

  test: (attemptId: string): string => {
    return `/test/${encodeURIComponent(attemptId.trim())}`;
  },

  testResult: (attemptId: string): string => {
    return `/test/${encodeURIComponent(attemptId.trim())}/result`;
  },

  studyMaterial: (
    subject?: string | null,
    basePrefix: '/material' | '/study-material' = '/material'
  ): string => {
    if (!subject) return basePrefix;
    const resolved = resolveValidMcqSubject(subject);
    if (!resolved.subjectSlug) {
      return basePrefix;
    }
    return `${basePrefix}/subject/${resolved.subjectSlug}`;
  },

  studyMaterialItem: (
    idOrSlug: string,
    title?: string,
    basePrefix: '/material' | '/study-material' = '/material'
  ): string => {
    const cleanId = extractIdFromSlug(idOrSlug);
    const slug = title ? buildEntitySlug(cleanId, title) : idOrSlug;
    return `${basePrefix}/${slug}`;
  },

  commons: (tab?: string | null): string => {
    if (!tab) return '/commons';
    return `/commons/${slugifySegment(tab)}`;
  },

  commonsSubject: (subject?: string | null, fallbackContext?: string | null): string => {
    const resolved = resolveValidMcqSubject(subject, fallbackContext);
    if (!resolved.subjectSlug) {
      return '/commons';
    }
    return `/commons/subject/${resolved.subjectSlug}`;
  },

  commonsPost: (idOrSlug: string, title?: string, commentId?: string): string => {
    const cleanId = extractIdFromSlug(idOrSlug);
    const slug = title ? buildEntitySlug(cleanId, title) : idOrSlug;
    const base = `/commons/post/${slug}`;
    return commentId ? `${base}#comment-${encodeURIComponent(commentId)}` : base;
  },

  grandLine: () => '/grand-line',
  grandLineLeaderboard: () => '/grand-line/leaderboard',
  grandLineAbout: () => '/grand-line/about',

  grandLineTest: (idOrSlug: string, title?: string): string => {
    const cleanId = extractIdFromSlug(idOrSlug);
    const slug = title ? buildEntitySlug(cleanId, title) : cleanId;
    return `/grand-line/test/${slug}`;
  },

  grandLineTestRun: (testIdOrSlug: string, mode?: 'result'): string => {
    const cleanId = extractIdFromSlug(testIdOrSlug);
    const base = `/grand-line/test/${encodeURIComponent(cleanId)}/run`;
    return mode === 'result' ? `${base}?mode=result` : base;
  },

  captainProfile: (uidOrUsername: string): string => {
    return `/captains/${encodeURIComponent(uidOrUsername.trim())}`;
  },

  userProfile: (uidOrUsername: string): string => {
    return `/u/${encodeURIComponent(uidOrUsername.trim())}`;
  },

  leaderboard: () => '/leaderboard',

  store: (subpath?: 'get-kobans'): string => {
    return subpath ? `/store/${subpath}` : '/store';
  },
};
