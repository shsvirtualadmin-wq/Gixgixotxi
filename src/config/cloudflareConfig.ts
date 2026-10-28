/**
 * ============================================================================
 * BOARDLY COMMONS — SINGLE CANONICAL CLOUDFLARE + FIREBASE CONFIGURATION
 * ============================================================================
 * All Cloudflare Worker / Pages Functions endpoints, R2 & D1 binding names,
 * CORS origins, file upload limits, and Firebase Auth verification constants
 * are defined in this single file.
 */

export const BOARDLY_CLOUDFLARE_CONFIG = {
  // Firebase project used strictly for Auth (ID token verification) and MCQ bank
  firebaseProjectId: 'gen-lang-client-0365509316',
  googleJwksUrl:
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',

  // Cloudflare bindings (must match Cloudflare Dashboard -> Pages / Workers -> Settings -> Bindings)
  d1BindingName: 'DB',
  d1DatabaseName: 'boardly-posts-db',
  r2BindingName: 'R2_BUCKET',
  r2BucketName: 'boardly-commons-media',

  // Public R2 domain (used only when public URL fallback is needed; downloads go through authenticated Worker route)
  r2PublicBaseUrl: 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev',

  // API endpoints (same-origin on https://boardly.cfd and AI Studio preview)
  apiBasePath: '/api/posts',
  uploadEndpoint: '/api/posts/upload',
  downloadEndpoint: '/api/posts/download',
  inlineFileEndpoint: '/api/posts/file',
  healthEndpoint: '/api/health',

  // Upload constraints
  maxFileSizeBytes: 25 * 1024 * 1024, // 25 MB
  maxFilesPerPost: 5,
  dailyPostLimit: 10,

  // Allowed MIME types (PNG, JPG, WEBP, GIF, PDF, DOCX + DOC/PPT/TXT)
  allowedMimeTypes: [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'text/plain',
  ] as const,

  // Allowed file extensions
  allowedExtensions: [
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.gif',
    '.pdf',
    '.docx',
    '.doc',
    '.pptx',
    '.ppt',
    '.txt',
  ] as const,

  // Strict CORS origin allowlist (production + AI Studio preview)
  allowedOrigins: [
    'https://boardly.cfd',
    'https://www.boardly.cfd',
    'https://ais-dev-pmdyu455ef2d4yt6aqhchy-727913807144.asia-southeast1.run.app',
    'https://ais-pre-pmdyu455ef2d4yt6aqhchy-727913807144.asia-southeast1.run.app',
  ] as const,

  // Superadmin identifiers
  superadminUids: ['A5YMRimdHRcmeDWutxtUGt2e4hf2'] as const,
  superadminEmails: ['shsvirtualadmin@gmail.com', 'support@boardly.cfd'] as const,
} as const;

export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  const normalized = origin.trim().replace(/\/+$/, '');
  if ((BOARDLY_CLOUDFLARE_CONFIG.allowedOrigins as readonly string[]).includes(normalized)) {
    return true;
  }
  // Allow AI Studio preview and localhost dev origins
  if (
    /^https:\/\/ais-(dev|pre)-[a-z0-9-]+-\d+\.[a-z0-9-]+\.run\.app$/i.test(normalized) ||
    /^https?:\/\/localhost(:\d+)?$/i.test(normalized) ||
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/i.test(normalized)
  ) {
    return true;
  }
  return false;
}

export function buildCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const originToAllow =
    requestOrigin && isAllowedOrigin(requestOrigin)
      ? requestOrigin.trim().replace(/\/+$/, '')
      : BOARDLY_CLOUDFLARE_CONFIG.allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': originToAllow,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Post-Id',
    'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length, X-Backend-Mode',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function sanitizeUploadFileName(fileName: string): string {
  const cleaned = String(fileName || 'file')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
  return cleaned || 'file';
}

/**
 * Generates the canonical R2 object key:
 * posts/{postId}/{random-id}-{safe-filename}
 */
export function buildR2PostFileKey(postId: string, fileName: string, randomId?: string): string {
  const safePostId = String(postId || `post_${Date.now()}`)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const rand =
    randomId ||
    (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14));
  const safeName = sanitizeUploadFileName(fileName);
  return `posts/${safePostId}/${rand}-${safeName}`;
}
