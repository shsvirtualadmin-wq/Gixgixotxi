/**
 * Shared text cleanup, human-readable slug, and Open Graph / social share card
 * metadata helpers used across client, Express/Vite server, and Cloudflare Workers/Pages.
 */

export const SHARE_SITE_ORIGIN = 'https://boardly.cfd';
export const SHARE_DEFAULT_OG_IMAGE = `${SHARE_SITE_ORIGIN}/api/og?type=default&v=2`;

const PRESERVED_ACRONYMS: Record<string, string> = {
  iba: 'IBA',
  mdcat: 'MDCAT',
  ecat: 'ECAT',
  nust: 'NUST',
  fast: 'FAST',
  giki: 'GIKI',
  pieas: 'PIEAS',
  nums: 'NUMS',
  aku: 'AKU',
  ned: 'NED',
  lums: 'LUMS',
  uet: 'UET',
  etea: 'ETEA',
  dow: 'DOW',
  kmu: 'KMU',
  uhs: 'UHS',
  szabmu: 'SZABMU',
  bumhs: 'BUMHS',
  nts: 'NTS',
  sat: 'SAT',
  mcq: 'MCQ',
  mcqs: 'MCQs',
  pdf: 'PDF',
  fsc: 'FSc',
  bsc: 'BSc',
  phd: 'PhD',
  shs: 'SHS',
  uk: 'UK',
  us: 'US',
  usa: 'USA',
  ii: 'II',
  iii: 'III',
  iv: 'IV',
  m1: 'M1',
  m2: 'M2',
  m3: 'M3',
  m4: 'M4',
  m5: 'M5',
  m6: 'M6',
  m7: 'M7',
  m8: 'M8',
  m9: 'M9',
};

const LOWERCASE_TITLE_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'from',
  'in',
  'into',
  'nor',
  'of',
  'on',
  'onto',
  'or',
  'per',
  'so',
  'the',
  'to',
  'up',
  'via',
  'vs',
  'with',
  'yet',
]);

/**
 * Escapes HTML special characters for safe insertion into meta tag attributes and text nodes.
 */
export function escapeHtmlMeta(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Truncates text at a clean word boundary with an ellipsis (`…`) if it exceeds `maxChars`.
 */
export function truncateAtWordBoundary(input: string, maxChars: number): string {
  const clean = String(input || '').trim();
  if (!clean || maxChars <= 0 || clean.length <= maxChars) {
    return clean;
  }
  const budget = Math.max(1, maxChars - 1);
  const sliced = clean.slice(0, budget);
  const lastSpace = sliced.lastIndexOf(' ');
  const cutoff = lastSpace >= Math.floor(budget * 0.55) ? sliced.slice(0, lastSpace) : sliced;
  return `${cutoff.replace(/[\s,.;:!?·\-–—]+$/g, '')}…`;
}

/**
 * Strips markdown, WhatsApp formatting, LaTeX wrappers, URLs, and extra whitespace
 * while preserving clean emojis and readable punctuation.
 */
export function cleanPreviewText(
  rawText: unknown,
  options?: {
    maxChars?: number;
    stripUrls?: boolean;
  }
): string {
  const stripUrls = options?.stripUrls !== false;
  let text = String(rawText ?? '');
  if (!text) return '';

  // Remove HTML tags if any
  text = text.replace(/<[^>]+>/g, ' ');

  // Convert markdown links [label](url) -> label
  text = text.replace(/\[([^\]]+)\]\((?:https?:\/\/|\/)[^)]+\)/gi, '$1');

  // Remove bare URLs if requested
  if (stripUrls) {
    text = text
      .replace(/\bhttps?:\/\/[^\s<>()]+/gi, ' ')
      .replace(/\bwww\.[^\s<>()]+/gi, ' ');
  }

  // Mask any email addresses or phone numbers for safety
  text = text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    .replace(/(?:\+92|0092|03)\d{2}[-\s]?\d{7}\b/g, '');

  // Clean common LaTeX expressions into readable plain text
  text = text
    .replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ')
    .replace(/\$([^$\n]+)\$/g, ' $1 ')
    .replace(/\\ce\{([^}]*)\}/g, '$1')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\mathrm\{([^}]*)\}/g, '$1')
    .replace(/\\mathbf\{([^}]*)\}/g, '$1')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1/$2)')
    .replace(/\\sqrt\{([^}]*)\}/g, '√($1)')
    .replace(/\\times\b/g, '×')
    .replace(/\\div\b/g, '÷')
    .replace(/\\pm\b/g, '±')
    .replace(/\\leq\b/g, '≤')
    .replace(/\\geq\b/g, '≥')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\rightarrow\b/g, '→')
    .replace(/\\leftarrow\b/g, '←')
    .replace(/\\leftrightarrow\b/g, '↔')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}]/g, '');

  // Strip Markdown & WhatsApp formatting characters (*, _, ~, `, #, >)
  text = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/(^|\s)[#>]+\s*/gm, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/([*_~])(.*?)\1/g, '$2')
    .replace(/[*_~`#>]+/g, '');

  // Remove replacement chars and non-printable ASCII codes
  text = Array.from(text)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if ((code >= 0 && code <= 31) || (code >= 127 && code <= 159) || code === 0xfffd) {
        return ' ';
      }
      return ch;
    })
    .join('');

  // Collapse line breaks, tabs, and repeated spaces
  text = text.replace(/\s+/g, ' ').trim();

  if (options?.maxChars && options.maxChars > 0) {
    return truncateAtWordBoundary(text, options.maxChars);
  }
  return text;
}

/**
 * Strips any leaked raw UUIDs or internal post/test ID prefixes from a title or slug string.
 */
export function stripLeakedIdsFromText(input: string): string {
  return String(input || '')
    // Full UUIDs (hyphenated or space-separated as when formatSlugLabel split a UUID)
    .replace(/\b[0-9a-f]{8}[-\s][0-9a-f]{4}[-\s][0-9a-f]{4}[-\s][0-9a-f]{4}[-\s][0-9a-f]{12}\b/gi, ' ')
    // Internal post prefixes
    .replace(/\bcommons[_-\s]anon[_-\s]topic[_-\s]\d+\b/gi, ' ')
    .replace(/\bpost[_-\s]gen[_-\s]\d+\b/gi, ' ')
    .replace(/\bpost[_-\s]\d+[_-\s][a-z0-9]+\b/gi, ' ')
    // Trailing short hex/topic IDs from human slugs (e.g. "-e7cb7f" or "-topic30")
    .replace(/(?:[-\s]+(?:topic\d+|[0-9a-f]{6,10}))$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts a string to Title Case ONLY if the string is all lowercase (or derived from a slug),
 * preserving known academic/university acronyms (IBA, MDCAT, ECAT, NUST, M4, etc.).
 */
export function toSmartTitleCaseIfNeeded(input: string, forceTitleCase = false): string {
  const trimmed = String(input || '').trim();
  if (!trimmed) return '';

  const hasLetters = /[a-zA-Z]/.test(trimmed);
  const isAllLower = hasLetters && trimmed === trimmed.toLowerCase();
  if (!isAllLower && !forceTitleCase) {
    // Still fix any lowercase known acronyms if the title was naively capitalized (e.g. "Iba" -> "IBA")
    return trimmed.replace(/\b([A-Za-z0-9]+)\b/g, (word) => {
      const lower = word.toLowerCase();
      if (PRESERVED_ACRONYMS[lower] && word === word[0].toUpperCase() + word.slice(1).toLowerCase()) {
        return PRESERVED_ACRONYMS[lower];
      }
      return word;
    });
  }

  const words = trimmed.split(/\s+/);
  return words
    .map((word, index) => {
      const cleanWord = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
      const lower = cleanWord.toLowerCase();
      if (PRESERVED_ACRONYMS[lower]) {
        return word.replace(cleanWord, PRESERVED_ACRONYMS[lower]);
      }
      if (index > 0 && index < words.length - 1 && LOWERCASE_TITLE_WORDS.has(lower)) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Normalizes a title for Open Graph / share previews:
 * - Cleans markdown/LaTeX/extra whitespace
 * - Removes any leaked UUIDs or internal ID prefixes
 * - Applies Title Case only if the input is all lowercase
 * - Truncates cleanly at a word boundary with an ellipsis
 */
export function normalizePreviewTitle(
  rawTitle: unknown,
  options?: {
    maxChars?: number;
    forceTitleCase?: boolean;
  }
): string {
  const cleaned = stripLeakedIdsFromText(cleanPreviewText(rawTitle, { stripUrls: true }));
  const titled = toSmartTitleCaseIfNeeded(cleaned, options?.forceTitleCase);
  if (options?.maxChars && options.maxChars > 0) {
    return truncateAtWordBoundary(titled, options.maxChars);
  }
  return titled;
}

/**
 * Converts a URL slug into a clean, human-readable title with all UUIDs and short IDs stripped.
 */
export function humanizeSlugWithoutIds(rawSlug: string): string {
  const decoded = (() => {
    try {
      return decodeURIComponent(String(rawSlug || ''));
    } catch {
      return String(rawSlug || '');
    }
  })();

  const withoutIds = stripLeakedIdsFromText(decoded.replace(/[-_]+/g, ' '));
  return normalizePreviewTitle(withoutIds, { forceTitleCase: true });
}

/**
 * Computes a deterministic short ID suffix (6-8 chars) from a full entity ID so URLs stay clean
 * and human-readable (e.g., `/grand-line/test/iba-karachi-m4-e7cb7f` or `...-topic30`).
 */
export function getShortEntityId(id: string): string {
  const cleanId = String(id || '').trim();
  if (!cleanId) return '';

  // commons_anon_topic_30 -> topic30
  const topicMatch = cleanId.match(/^commons_anon_topic_(\d+)$/i);
  if (topicMatch) {
    return `topic${topicMatch[1]}`;
  }

  // post_gen_12 -> gen12
  const genMatch = cleanId.match(/^post_gen_(\d+)$/i);
  if (genMatch) {
    return `gen${genMatch[1]}`;
  }

  // Standard UUID e7cb7f91-c8cb-4176-a176-7748aece1422 -> e7cb7f
  const uuidMatch = cleanId.match(/^([0-9a-f]{6,8})[0-9a-f]*-[0-9a-f]{4}-/i);
  if (uuidMatch) {
    return uuidMatch[1].toLowerCase().slice(0, 6);
  }

  // Fallback: first 6 alphanumeric chars
  const alphaNum = cleanId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return alphaNum.slice(0, 6) || cleanId.slice(0, 6).toLowerCase();
}

/**
 * Slugifies a title into lowercase kebab-case without leaked IDs.
 */
export function slugifyPreviewTitle(title: string, maxChars = 60): string {
  const cleaned = stripLeakedIdsFromText(cleanPreviewText(title, { stripUrls: true }))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  if (!cleaned) return '';
  if (cleaned.length <= maxChars) return cleaned;
  const sliced = cleaned.slice(0, maxChars).replace(/-+$/g, '');
  const lastDash = sliced.lastIndexOf('-');
  return lastDash >= Math.floor(maxChars * 0.5) ? sliced.slice(0, lastDash) : sliced;
}

/**
 * Builds a clean, human-readable slug from the real title plus a short ID suffix:
 * e.g. `iba-karachi-m4-e7cb7f` or `solutions-and-concentration-class-11-sindh-board-topic30`.
 */
export function buildHumanEntitySlug(id: string, title?: string): string {
  const cleanId = String(id || '').trim();
  if (!cleanId) return '';

  const titleSlug = title ? slugifyPreviewTitle(title, 64) : '';
  if (!titleSlug) return cleanId;

  const shortId = getShortEntityId(cleanId);
  if (!shortId) return titleSlug;

  // Avoid repeating shortId if the titleSlug already ends with it
  if (titleSlug === shortId || titleSlug.endsWith(`-${shortId}`)) {
    return titleSlug;
  }
  return `${titleSlug}-${shortId}`;
}

/**
 * Checks whether a URL parameter uses the legacy long-ID prefix format
 * (e.g., `e7cb7f91-c8cb-4176-a176-7748aece1422-iba-karachi-m4` or `commons_anon_topic_30-...`).
 */
export function isLegacyLongIdSlug(idSlug: string): boolean {
  const clean = String(idSlug || '').trim();
  if (!clean) return false;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:-.+)?$/i.test(clean)) {
    return true;
  }
  if (/^(?:commons_anon_topic_\d+|post_gen_\d+|post_\d+_[a-zA-Z0-9]+)-.+$/i.test(clean)) {
    return true;
  }
  return false;
}

/**
 * Extracts either a full legacy ID or a trailing short token from an `idSlug` parameter.
 */
export function extractEntityIdOrShortToken(idSlug: string): {
  raw: string;
  legacyFullId: string | null;
  shortToken: string | null;
  titleSlugPart: string;
} {
  const raw = String(idSlug || '').trim();
  if (!raw) {
    return { raw: '', legacyFullId: null, shortToken: null, titleSlugPart: '' };
  }

  // 1. Legacy full UUID prefix: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx(-slug)
  const uuidMatch = raw.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-(.+))?$/i);
  if (uuidMatch) {
    return {
      raw,
      legacyFullId: uuidMatch[1],
      shortToken: uuidMatch[1].slice(0, 6).toLowerCase(),
      titleSlugPart: (uuidMatch[2] || '').toLowerCase(),
    };
  }

  // 2. Legacy custom post ID prefix: commons_anon_topic_30-slug, post_gen_12-slug, post_123_abc-slug
  const customMatch = raw.match(/^(commons_anon_topic_\d+|post_gen_\d+|post_\d+_[a-zA-Z0-9]+)(?:-(.+))?$/i);
  if (customMatch) {
    return {
      raw,
      legacyFullId: customMatch[1],
      shortToken: getShortEntityId(customMatch[1]),
      titleSlugPart: (customMatch[2] || '').toLowerCase(),
    };
  }

  // 3. New human-readable slug ending in `-topic30`, `-gen12`, or `-[0-9a-f0-9]{6}`
  const trailingTopicMatch = raw.match(/^(.+)-topic(\d+)$/i);
  if (trailingTopicMatch) {
    return {
      raw,
      legacyFullId: `commons_anon_topic_${trailingTopicMatch[2]}`,
      shortToken: `topic${trailingTopicMatch[2]}`.toLowerCase(),
      titleSlugPart: trailingTopicMatch[1].toLowerCase(),
    };
  }

  const trailingGenMatch = raw.match(/^(.+)-gen(\d+)$/i);
  if (trailingGenMatch) {
    return {
      raw,
      legacyFullId: `post_gen_${trailingGenMatch[2]}`,
      shortToken: `gen${trailingGenMatch[2]}`.toLowerCase(),
      titleSlugPart: trailingGenMatch[1].toLowerCase(),
    };
  }

  const trailingShortMatch = raw.match(/^(.+)-([a-z0-9]{6,8})$/i);
  if (trailingShortMatch) {
    return {
      raw,
      legacyFullId: null,
      shortToken: trailingShortMatch[2].toLowerCase(),
      titleSlugPart: trailingShortMatch[1].toLowerCase(),
    };
  }

  return {
    raw,
    legacyFullId: null,
    shortToken: null,
    titleSlugPart: raw.toLowerCase(),
  };
}

/**
 * Checks if a candidate URL parameter (`candidateSlugOrId`) matches a database row's `id`, `title`, or `slug`.
 */
export function matchesEntitySlugOrId(
  row: { id?: string; title?: string; slug?: string },
  candidateSlugOrId: string
): boolean {
  const candidate = String(candidateSlugOrId || '').trim();
  if (!candidate) return false;
  const candidateLower = candidate.toLowerCase();

  const rowId = String(row.id || '').trim();
  const rowIdLower = rowId.toLowerCase();
  const rowTitle = String(row.title || '').trim();
  const rowSlug = String(row.slug || '').trim().toLowerCase();

  if (rowIdLower && rowIdLower === candidateLower) return true;
  if (rowSlug && rowSlug === candidateLower) return true;

  const humanSlug = buildHumanEntitySlug(rowId, rowTitle).toLowerCase();
  if (humanSlug && humanSlug === candidateLower) return true;

  const pureTitleSlug = slugifyPreviewTitle(rowTitle, 64).toLowerCase();
  if (pureTitleSlug && pureTitleSlug === candidateLower) return true;

  const parsed = extractEntityIdOrShortToken(candidate);
  if (parsed.legacyFullId && rowIdLower === parsed.legacyFullId.toLowerCase()) {
    return true;
  }

  if (parsed.shortToken) {
    const rowShort = getShortEntityId(rowId).toLowerCase();
    const cleanRowAlpha = rowIdLower.replace(/[^a-z0-9]/g, '');
    const shortMatches =
      rowShort === parsed.shortToken ||
      rowIdLower.startsWith(parsed.shortToken) ||
      cleanRowAlpha.startsWith(parsed.shortToken);
    if (shortMatches) {
      if (!parsed.titleSlugPart || !pureTitleSlug) return true;
      if (
        pureTitleSlug === parsed.titleSlugPart ||
        pureTitleSlug.startsWith(parsed.titleSlugPart) ||
        parsed.titleSlugPart.startsWith(pureTitleSlug)
      ) {
        return true;
      }
      return true;
    }
  }

  return false;
}

/**
 * Extracts the first publicly accessible image URL from a post's `files_json` or `files` array.
 * Ignores PDFs and non-image attachments.
 */
export function extractFirstPublicPostImage(
  filesOrJson: unknown,
  siteOrigin = SHARE_SITE_ORIGIN
): string | null {
  let files: any[] = [];
  if (Array.isArray(filesOrJson)) {
    files = filesOrJson;
  } else if (typeof filesOrJson === 'string' && filesOrJson.trim()) {
    try {
      const parsed = JSON.parse(filesOrJson);
      if (Array.isArray(parsed)) files = parsed;
    } catch {
      files = [];
    }
  }

  for (const file of files) {
    if (!file || typeof file !== 'object') continue;
    const rawUrl = String(file.url || file.downloadUrl || file.src || '').trim();
    if (!rawUrl) continue;

    const mime = String(file.type || file.mimeType || file.contentType || '').toLowerCase();
    const name = String(file.name || file.fileName || rawUrl).toLowerCase();

    const isPdf = mime.includes('pdf') || /\.pdf(?:$|\?)/i.test(name);
    if (isPdf) continue;

    const isImage =
      mime.startsWith('image/') ||
      /\.(?:png|jpe?g|webp|gif)(?:$|\?)/i.test(name) ||
      /\.(?:png|jpe?g|webp|gif)(?:$|\?)/i.test(rawUrl);

    if (!isImage) continue;

    if (/^https?:\/\//i.test(rawUrl)) {
      return rawUrl;
    }
    if (rawUrl.startsWith('/')) {
      return `${siteOrigin.replace(/\/$/, '')}${rawUrl}`;
    }
  }

  return null;
}

/**
 * Simple deterministic version hash so updated titles/counts bust WhatsApp/Telegram image caches.
 */
export function computeShareVersionHash(input: string): string {
  let hash = 2166136261;
  const str = String(input || 'boardly');
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Builds an absolute HTTPS URL to the dynamic 1200x630 PNG Open Graph share card endpoint (`/api/og`).
 */
export function buildDynamicOgImageUrl(
  params: {
    type: 'post' | 'test' | 'profile' | 'default';
    title: string;
    subtitle?: string;
    badge?: string;
    meta?: string;
    avatar?: string;
    versionSeed?: string;
  },
  siteOrigin = SHARE_SITE_ORIGIN
): string {
  const base = `${siteOrigin.replace(/\/$/, '')}/api/og`;
  const search = new URLSearchParams();
  search.set('type', params.type);
  search.set('title', truncateAtWordBoundary(cleanPreviewText(params.title, { stripUrls: true }), 90));
  if (params.subtitle) {
    search.set('subtitle', truncateAtWordBoundary(cleanPreviewText(params.subtitle, { stripUrls: true }), 110));
  }
  if (params.badge) {
    search.set('badge', truncateAtWordBoundary(cleanPreviewText(params.badge, { stripUrls: true }), 42));
  }
  if (params.meta) {
    search.set('meta', truncateAtWordBoundary(cleanPreviewText(params.meta, { stripUrls: true }), 72));
  }
  if (params.avatar && /^https?:\/\//i.test(params.avatar)) {
    search.set('avatar', params.avatar);
  }
  const seed =
    params.versionSeed ||
    `${params.type}|${params.title}|${params.subtitle || ''}|${params.badge || ''}|${params.meta || ''}`;
  search.set('v', computeShareVersionHash(seed));
  return `${base}?${search.toString()}`;
}

/**
 * Formats a post share preview (`og:title`, `og:description`, `og:image`, `og:image:alt`).
 */
export function buildPostSharePreview(
  post: {
    id: string;
    title?: string;
    body?: string;
    authorName?: string;
    subjectTag?: string;
    boardTag?: string;
    classLevel?: string;
    imageUrl?: string | null;
    filesJson?: unknown;
    updatedAt?: string;
  },
  siteOrigin = SHARE_SITE_ORIGIN
): {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  canonicalSlug: string;
} {
  const cleanTitle = normalizePreviewTitle(post.title || 'Student Study Post', { maxChars: 60 });
  const fullTitle = `${cleanTitle} | Boardly Commons`;

  const rawAuthor = cleanPreviewText(post.authorName || '', { stripUrls: true });
  const authorLabel =
    rawAuthor && rawAuthor.toLowerCase() !== 'anonymous' && rawAuthor.toLowerCase() !== 'anonymous student'
      ? `By ${rawAuthor}`
      : rawAuthor
        ? 'By Anonymous Student'
        : '';

  const cleanedBody = cleanPreviewText(post.body || '', { stripUrls: true });
  let description = '';

  if (cleanedBody) {
    const suffix = authorLabel ? ` · ${authorLabel}` : '';
    const bodyBudget = Math.max(80, 155 - suffix.length);
    const bodySnippet = truncateAtWordBoundary(cleanedBody, bodyBudget);
    description = `${bodySnippet}${suffix}`;
  } else {
    const tags = [post.subjectTag, post.classLevel, post.boardTag].filter(Boolean).join(' · ');
    description = truncateAtWordBoundary(
      [cleanTitle, tags, authorLabel].filter(Boolean).join(' · ') ||
        `${cleanTitle}${authorLabel ? ` · ${authorLabel}` : ''} on Boardly Commons.`,
      160
    );
  }

  const firstImage =
    (post.imageUrl && /^https?:\/\//i.test(post.imageUrl) ? post.imageUrl : null) ||
    extractFirstPublicPostImage(post.filesJson, siteOrigin);

  const metaLine = [authorLabel, post.subjectTag, post.boardTag].filter(Boolean).join(' · ') || 'Boardly Commons';
  const image =
    firstImage ||
    buildDynamicOgImageUrl(
      {
        type: 'post',
        title: cleanTitle,
        subtitle: truncateAtWordBoundary(cleanedBody || description, 95),
        badge: 'BOARDLY COMMONS',
        meta: metaLine,
        versionSeed: `${post.id}|${cleanTitle}|${post.updatedAt || ''}`,
      },
      siteOrigin
    );

  return {
    title: fullTitle,
    description,
    image,
    imageAlt: `${cleanTitle} — Boardly Commons`,
    canonicalSlug: buildHumanEntitySlug(post.id, post.title || cleanTitle),
  };
}

/**
 * Formats a Grand Line test share preview (`og:title`, `og:description`, `og:image`, `og:image:alt`).
 */
export function buildTestSharePreview(
  test: {
    id: string;
    title?: string;
    description?: string;
    questionCount?: number | null;
    durationMinutes?: number | null;
    creatorName?: string | null;
    subject?: string | null;
    updatedAt?: string;
  },
  siteOrigin = SHARE_SITE_ORIGIN
): {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  canonicalSlug: string;
} {
  const cleanTitle =
    normalizePreviewTitle(test.title || 'Grand Line Test', { maxChars: 58 }) || 'Grand Line Test';
  const fullTitle = `${cleanTitle} - Grand Line Test | Boardly`;

  const qCount = typeof test.questionCount === 'number' && test.questionCount > 0 ? test.questionCount : null;
  const creator = cleanPreviewText(test.creatorName || '', { stripUrls: true });
  const subject = cleanPreviewText(test.subject || '', { stripUrls: true });

  const leadParts: string[] = [];
  if (qCount) leadParts.push(`${qCount} questions`);
  if (creator) leadParts.push(`By ${creator}`);
  else if (subject) leadParts.push(subject);

  const prefix = leadParts.length > 0 ? `${leadParts.join(' · ')}. ` : '';
  const description = truncateAtWordBoundary(
    `${prefix}Take this verified test and see where you rank on the national leaderboard.`,
    160
  );

  const metaParts: string[] = [];
  if (qCount) metaParts.push(`${qCount} Questions`);
  if (test.durationMinutes && test.durationMinutes > 0) metaParts.push(`${test.durationMinutes} Mins`);
  if (creator) metaParts.push(`By ${creator}`);

  const image = buildDynamicOgImageUrl(
    {
      type: 'test',
      title: cleanTitle,
      subtitle: 'Take this verified test and see where you rank on the national leaderboard.',
      badge: 'GRAND LINE VERIFIED TEST',
      meta: metaParts.join(' · ') || 'National Ranked Drill · Boardly',
      versionSeed: `${test.id}|${cleanTitle}|${qCount || 0}|${creator}|${test.updatedAt || ''}`,
    },
    siteOrigin
  );

  return {
    title: fullTitle,
    description,
    image,
    imageAlt: `${cleanTitle} — Grand Line Test on Boardly`,
    canonicalSlug: buildHumanEntitySlug(test.id, cleanTitle),
  };
}

/**
 * Formats a public user / captain profile share preview (`og:title`, `og:description`, `og:image`, `og:image:alt`).
 */
export function buildProfileSharePreview(
  profile: {
    uid?: string;
    username?: string | null;
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
    followersCount?: number | null;
    postsCount?: number | null;
  },
  siteOrigin = SHARE_SITE_ORIGIN
): {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
} {
  const rawUsername = cleanPreviewText(profile.username || '', { stripUrls: true }).replace(/^@+/, '');
  const rawDisplay = cleanPreviewText(profile.displayName || '', { stripUrls: true });
  const displayName =
    normalizePreviewTitle(rawDisplay || rawUsername || 'Boardly Student', { maxChars: 42 }) || 'Boardly Student';

  const handleSuffix =
    rawUsername && rawUsername.toLowerCase() !== displayName.toLowerCase().replace(/\s+/g, '')
      ? ` (@${rawUsername})`
      : rawUsername
        ? ` (@${rawUsername})`
        : '';

  const fullTitle = `${displayName}${handleSuffix} | Boardly`;

  const cleanedBio = cleanPreviewText(profile.bio || '', { stripUrls: true, maxChars: 155 });
  let description = cleanedBio;
  if (!description) {
    const statParts: string[] = [];
    if (typeof profile.followersCount === 'number' && profile.followersCount >= 0) {
      statParts.push(`${profile.followersCount} ${profile.followersCount === 1 ? 'follower' : 'followers'}`);
    }
    if (typeof profile.postsCount === 'number' && profile.postsCount >= 0) {
      statParts.push(`${profile.postsCount} ${profile.postsCount === 1 ? 'post' : 'posts'}`);
    }
    if (statParts.length > 0) {
      description = `Follow ${displayName} on Boardly: ${statParts.join(', ')} and test results.`;
    } else {
      description = `Follow ${displayName} on Boardly: followers, posts and test results.`;
    }
  }

  const badgeLabel =
    profile.role && /captain|ambassador|admin|founder/i.test(profile.role)
      ? 'NAKAMA CAPTAIN PROFILE'
      : 'BOARDLY STUDENT PROFILE';

  const metaParts: string[] = [];
  if (rawUsername) metaParts.push(`@${rawUsername}`);
  if (typeof profile.followersCount === 'number' && profile.followersCount >= 0) {
    metaParts.push(`${profile.followersCount} Followers`);
  }
  if (typeof profile.postsCount === 'number' && profile.postsCount >= 0) {
    metaParts.push(`${profile.postsCount} Posts`);
  }

  const image = buildDynamicOgImageUrl(
    {
      type: 'profile',
      title: displayName,
      subtitle: truncateAtWordBoundary(description, 95),
      badge: badgeLabel,
      meta: metaParts.join(' · ') || 'Followers, Posts & Test Results',
      avatar: profile.avatarUrl && /^https?:\/\//i.test(profile.avatarUrl) ? profile.avatarUrl : undefined,
      versionSeed: `${profile.uid || rawUsername}|${displayName}|${description}`,
    },
    siteOrigin
  );

  return {
    title: fullTitle,
    description: truncateAtWordBoundary(description, 160),
    image,
    imageAlt: `${displayName}${handleSuffix} — Boardly Profile`,
  };
}
