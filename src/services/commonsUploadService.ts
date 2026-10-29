import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import type { CommonsFileAttachment } from '@/types/commons';
import {
  BOARDLY_CLOUDFLARE_CONFIG,
  buildR2PostFileKey,
  sanitizeUploadFileName,
} from '@/config/cloudflareConfig';

/**
 * ============================================================================
 * CLOUDFLARE R2 UPLOAD & AUTHENTICATED DOWNLOAD SERVICE
 * ============================================================================
 * - Uploads files to Cloudflare R2 via `/api/posts/upload` with Firebase ID token
 * - Uses canonical R2 object key format: `posts/{postId}/{random-id}-{safe-filename}`
 * - Supports atomic rollback (`DELETE /api/posts/upload`) if any upload or D1 insert fails
 * - Streams private R2 downloads for signed-in users via `/api/posts/download?key=...`
 */

export const R2_PUBLIC_BUCKET_URL = BOARDLY_CLOUDFLARE_CONFIG.r2PublicBaseUrl;
export const MAX_COMMONS_FILE_BYTES = BOARDLY_CLOUDFLARE_CONFIG.maxFileSizeBytes; // 25 MB
export const MAX_COMMONS_FILES_COUNT = BOARDLY_CLOUDFLARE_CONFIG.maxFilesPerPost; // 5
export const ALLOWED_COMMONS_MIME_TYPES: readonly string[] =
  BOARDLY_CLOUDFLARE_CONFIG.allowedMimeTypes;
export const ALLOWED_COMMONS_EXTENSIONS: readonly string[] =
  BOARDLY_CLOUDFLARE_CONFIG.allowedExtensions;

const BLOCKED_EXECUTABLE_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.apk',
  '.dmg',
  '.pkg',
  '.com',
  '.scr',
  '.vbs',
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.jar',
  '.py',
  '.php',
  '.rb',
  '.pl',
  '.ps1',
  '.elf',
  '.bin',
  '.dll',
  '.so',
  '.dylib',
  '.app',
];

export type CommonsUploadErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_TYPE'
  | 'TOO_MANY_FILES'
  | 'EMPTY_FILE'
  | 'PERMISSION_DENIED'
  | 'UPLOAD_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class CommonsUploadError extends Error {
  public readonly code: CommonsUploadErrorCode;
  public readonly userMessage: string;
  public readonly step: string;

  constructor(params: {
    code: CommonsUploadErrorCode;
    userMessage: string;
    technicalMessage?: string;
    step: string;
  }) {
    super(params.userMessage);
    this.name = 'CommonsUploadError';
    this.code = params.code;
    this.userMessage = params.userMessage;
    this.step = params.step;
  }
}

export function isExecutableCommonsFile(fileName: string): boolean {
  const lower = String(fileName || '').toLowerCase().trim();
  if (!lower) return false;
  return BLOCKED_EXECUTABLE_EXTENSIONS.some(
    (ext) => lower.endsWith(ext) || lower.includes(`${ext}.`)
  );
}

export function validateCommonsFile(
  fileOrName: File | string,
  mimeTypeArg?: string,
  sizeArg?: number
): {
  valid: boolean;
  code?: CommonsUploadErrorCode;
  reason?: string;
} {
  const isFileObj = typeof File !== 'undefined' && fileOrName instanceof File;
  const fileName = isFileObj
    ? fileOrName.name
    : typeof fileOrName === 'string'
    ? fileOrName
    : (fileOrName as any)?.name || '';
  const mimeType = isFileObj
    ? fileOrName.type
    : mimeTypeArg ?? (fileOrName as any)?.type ?? '';
  const fileSize = isFileObj
    ? fileOrName.size
    : typeof sizeArg === 'number'
    ? sizeArg
    : typeof (fileOrName as any)?.size === 'number'
    ? (fileOrName as any).size
    : undefined;

  if (!fileName) {
    return {
      valid: false,
      code: 'EMPTY_FILE',
      reason: 'No file selected.',
    };
  }

  if (typeof fileSize === 'number' && fileSize === 0) {
    return {
      valid: false,
      code: 'EMPTY_FILE',
      reason: `Cannot attach "${fileName}" because the file is empty (0 B).`,
    };
  }

  if (typeof fileSize === 'number' && fileSize > MAX_COMMONS_FILE_BYTES) {
    const sizeMb = (fileSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      code: 'FILE_TOO_LARGE',
      reason: `File too large: "${fileName}" is ${sizeMb} MB (maximum allowed size is 25 MB).`,
    };
  }

  if (isExecutableCommonsFile(fileName)) {
    return {
      valid: false,
      code: 'UNSUPPORTED_TYPE',
      reason: `Unsupported file type: "${fileName}". Executable and script files are not allowed.`,
    };
  }

  const lowerName = fileName.toLowerCase().trim();
  const hasAllowedExt = ALLOWED_COMMONS_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const mime = String(mimeType || '').toLowerCase().trim();
  const hasAllowedMime =
    ALLOWED_COMMONS_MIME_TYPES.includes(mime) ||
    mime === 'image/png' ||
    mime === 'image/jpeg' ||
    mime === 'image/webp' ||
    mime === 'image/gif' ||
    mime === 'application/pdf';

  if (!hasAllowedExt && !hasAllowedMime) {
    return {
      valid: false,
      code: 'UNSUPPORTED_TYPE',
      reason: `Unsupported file type for "${fileName}". Allowed formats: PNG, JPG, WEBP, GIF, PDF, DOCX.`,
    };
  }

  return { valid: true };
}

/**
 * Backwards-compatible helper: returns boolean when called with `(fileName, mimeType)`
 * and also works with `validateCommonsFile` for detailed validation.
 */
export function isAllowedCommonsFile(
  fileOrName: File | string,
  mimeType?: string,
  fileSize?: number
): boolean {
  return validateCommonsFile(fileOrName, mimeType, fileSize).valid;
}

export async function ensureAuthenticatedUser(
  _expectedUid?: string,
  forceRefresh = false
): Promise<{
  user: User;
  token: string;
}> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new CommonsUploadError({
      code: 'NOT_AUTHENTICATED',
      userMessage: 'Please sign in again',
      technicalMessage: 'auth.currentUser is null before upload.',
      step: 'auth_check',
    });
  }

  let token = '';
  try {
    token = await currentUser.getIdToken(forceRefresh);
  } catch (err: any) {
    console.error('[CommonsUpload] Failed to get Firebase ID token:', err);
    throw new CommonsUploadError({
      code: 'NOT_AUTHENTICATED',
      userMessage: 'Please sign in again',
      technicalMessage: err?.message || 'getIdToken failed.',
      step: 'token_refresh',
    });
  }

  if (!token) {
    throw new CommonsUploadError({
      code: 'NOT_AUTHENTICATED',
      userMessage: 'Please sign in again',
      technicalMessage: 'getIdToken returned empty token.',
      step: 'token_refresh',
    });
  }

  return { user: currentUser, token };
}

function readFileAsBase64(file: File, onProgress?: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) {
        onProgress(Math.min(45, Math.round((ev.loaded / ev.total) * 45)));
      }
    };
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.slice(result.indexOf(',') + 1) : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error(`Failed to read file "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a single file to Cloudflare R2 via `/api/posts/upload` using key format:
 * `posts/{postId}/{random-id}-{safe-filename}`
 */
export async function uploadCommonsAttachment(params: {
  file: File;
  postId: string;
  displayName?: string;
  userId?: string;
  uid?: string;
  isImage?: boolean;
  inactivityTimeoutMs?: number;
  maxAttempts?: number;
  onProgress?: (percent: number) => void;
  onRetry?: (attempt: number, maxAttempts: number) => void;
}): Promise<CommonsFileAttachment & { r2Key: string; fallbackId?: string; totalChunks?: number }> {
  const { file, postId, onProgress } = params;
  const fileName = params.displayName || file.name;

  const check = validateCommonsFile(file, file.type, file.size);
  if (!check.valid) {
    console.error('[CommonsUpload] Client file validation failed:', {
      fileName,
      fileSize: file.size,
      fileType: file.type,
      code: check.code,
      reason: check.reason,
    });
    throw new CommonsUploadError({
      code: check.code || 'UNSUPPORTED_TYPE',
      userMessage: check.reason || 'Unsupported file type',
      step: 'file_validation',
    });
  }

  const { token } = await ensureAuthenticatedUser(params.userId || params.uid, false);
  onProgress?.(10);

  // Send multipart/form-data first (native binary streaming to Cloudflare Worker R2),
  // with base64 fallback included in case local dev middleware parses JSON.
  const formData = new FormData();
  formData.append('file', file, sanitizeUploadFileName(fileName));
  formData.append('postId', postId);
  formData.append('fileName', fileName);
  formData.append('fileType', file.type || 'application/octet-stream');
  formData.append('fileSize', String(file.size));

  onProgress?.(35);

  let resp: Response;
  try {
    resp = await fetch(BOARDLY_CLOUDFLARE_CONFIG.uploadEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Post-Id': postId,
      },
      body: formData,
    });

    // If local Express middleware didn't parse multipart/form-data (e.g., 400 Missing file/dataBase64),
    // automatically send JSON base64 payload to the same endpoint.
    if (resp.status === 400) {
      const peek = await resp.clone().json().catch(() => ({}));
      if (peek?.code === 'MISSING_FILE_DATA' || String(peek?.error || '').includes('Missing file')) {
        const dataBase64 = await readFileAsBase64(file, onProgress);
        resp = await fetch(BOARDLY_CLOUDFLARE_CONFIG.uploadEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Post-Id': postId,
          },
          body: JSON.stringify({
            postId,
            fileName,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            dataBase64,
          }),
        });
      }
    }
  } catch (networkErr: any) {
    console.error('[CommonsUpload] Network error calling /api/posts/upload:', networkErr);
    throw new CommonsUploadError({
      code: 'NETWORK_ERROR',
      userMessage: 'Upload failed, try again',
      technicalMessage: networkErr?.message || 'Network error during upload',
      step: 'r2_worker_upload',
    });
  }

  onProgress?.(85);

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.success) {
    console.error('[CommonsUpload] Worker upload failed:', {
      status: resp.status,
      postId,
      fileName,
      fileSize: file.size,
      fileType: file.type,
      response: data,
    });

    const code: CommonsUploadErrorCode =
      resp.status === 401
        ? 'NOT_AUTHENTICATED'
        : resp.status === 403
        ? 'PERMISSION_DENIED'
        : resp.status === 413
        ? 'FILE_TOO_LARGE'
        : resp.status === 415
        ? 'UNSUPPORTED_TYPE'
        : 'UNKNOWN_ERROR';

    const userMessage =
      resp.status === 401
        ? 'Please sign in again'
        : resp.status === 413
        ? 'File too large (maximum 25 MB allowed).'
        : resp.status === 415
        ? 'Unsupported file type. Allowed formats: PNG, JPG, WEBP, GIF, PDF, DOCX.'
        : data?.error || 'Upload failed, try again';

    throw new CommonsUploadError({
      code,
      userMessage,
      technicalMessage: data?.details || data?.error || `HTTP ${resp.status}`,
      step: 'r2_worker_upload',
    });
  }

  onProgress?.(100);

  const r2Key = String(data.key || data.r2Key || buildR2PostFileKey(postId, fileName));
  const isImage =
    (file.type || '').startsWith('image/') ||
    /\.(png|jpe?g|webp|gif)$/i.test(fileName);

  // Images use inline Worker route so feed cards render them; documents use authenticated download route
  const fileUrl = isImage
    ? data.url || `${BOARDLY_CLOUDFLARE_CONFIG.inlineFileEndpoint}?key=${encodeURIComponent(r2Key)}`
    : `${BOARDLY_CLOUDFLARE_CONFIG.downloadEndpoint}?key=${encodeURIComponent(r2Key)}`;

  return {
    name: fileName,
    url: fileUrl,
    r2Key,
    downloadUrl: `${BOARDLY_CLOUDFLARE_CONFIG.downloadEndpoint}?key=${encodeURIComponent(r2Key)}`,
    type: file.type || data.type || 'application/octet-stream',
    size: file.size || Number(data.size || 0),
  };
}

/**
 * Rolls back (deletes) uploaded R2 keys if post creation or any multi-file upload fails.
 */
export async function rollbackUploadedPostFiles(keys: string[], postId?: string): Promise<void> {
  const cleanKeys = (keys || []).map((k) => String(k || '').trim()).filter(Boolean);
  if (cleanKeys.length === 0) return;

  try {
    const { token } = await ensureAuthenticatedUser(undefined, false);
    await fetch(BOARDLY_CLOUDFLARE_CONFIG.uploadEndpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        postId,
        keys: cleanKeys,
      }),
    });
  } catch (err) {
    console.warn('[CommonsUpload] Rollback cleanup warning:', err);
  }
}

export async function cleanupUploadedAttachment(
  params: {
    url?: string;
    uploadedUrl?: string;
    r2Key?: string;
    fallbackId?: string;
    totalChunks?: number;
  },
  _uid?: string
): Promise<void> {
  const key =
    params.r2Key ||
    extractR2KeyFromUrl(params.url || params.uploadedUrl || '');
  if (key) {
    await rollbackUploadedPostFiles([key]);
  }
}

export function extractR2KeyFromUrl(rawUrl: string): string {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('posts/') || trimmed.startsWith('commons/')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed, 'https://boardly.cfd');
    const keyParam = parsed.searchParams.get('key');
    if (keyParam) return keyParam;
    if (parsed.pathname.startsWith('/api/r2/')) {
      return decodeURIComponent(parsed.pathname.slice('/api/r2/'.length));
    }
    if (trimmed.startsWith(R2_PUBLIC_BUCKET_URL)) {
      return trimmed.slice(R2_PUBLIC_BUCKET_URL.length + 1);
    }
  } catch {
    // Ignore invalid URL format
  }
  return '';
}

/**
 * Authenticated download for signed-in users:
 * Sends Firebase ID token in Authorization header to `/api/posts/download?key=...`
 * and streams the private R2 file to the browser.
 */
export async function downloadCommonsAttachment(file: {
  name?: string;
  url?: string;
  r2Key?: string;
  downloadUrl?: string;
}): Promise<void> {
  const { token } = await ensureAuthenticatedUser(undefined, false);
  const r2Key =
    file.r2Key ||
    extractR2KeyFromUrl(file.downloadUrl || '') ||
    extractR2KeyFromUrl(file.url || '');

  const downloadEndpoint = r2Key
    ? `${BOARDLY_CLOUDFLARE_CONFIG.downloadEndpoint}?key=${encodeURIComponent(r2Key)}`
    : file.downloadUrl || file.url || '';

  if (!downloadEndpoint) {
    throw new Error('Download link is missing.');
  }

  const resp = await fetch(downloadEndpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    console.error('[CommonsDownload] Download failed:', {
      status: resp.status,
      r2Key,
      error: errData,
    });
    if (resp.status === 401) {
      throw new Error('Please sign in again');
    }
    throw new Error(errData?.error || 'Could not download file. Please try again.');
  }

  const blob = await resp.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = file.name || (r2Key ? r2Key.split('/').pop() || 'download' : 'download');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

/**
 * Resolves any attachment URL for inline display (e.g. images).
 */
export async function resolveCommonsAttachmentUrl(
  rawUrl: string,
  r2Key?: string
): Promise<string> {
  const key = r2Key || extractR2KeyFromUrl(rawUrl);
  if (key && key.startsWith('posts/')) {
    return `${BOARDLY_CLOUDFLARE_CONFIG.inlineFileEndpoint}?key=${encodeURIComponent(key)}`;
  }
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/api/')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('commons/')) {
    return `/api/r2/${trimmed}`;
  }
  return trimmed;
}
