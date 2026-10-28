import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import type { CommonsFileAttachment } from '@/types/commons';

/**
 * ============================================================================
 * CLOUDFLARE R2 UPLOAD SERVICE (ZERO FIREBASE STORAGE / ZERO FIRESTORE)
 * ============================================================================
 * All Boardly Commons images, PDFs, and study material files are uploaded
 * through the Cloudflare Worker API (`/api/posts/upload`) to Cloudflare R2
 * (`https://pub-51ccade1f191417389ac7df61830c670.r2.dev`).
 *
 * Firebase Auth is used strictly to attach the user's ID token in the
 * `Authorization: Bearer <token>` header.
 */

export const R2_PUBLIC_BUCKET_URL = 'https://pub-51ccade1f191417389ac7df61830c670.r2.dev';

export const MAX_COMMONS_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_COMMONS_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

export const ALLOWED_COMMONS_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.txt',
];

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
    super(params.technicalMessage || params.userMessage);
    this.name = 'CommonsUploadError';
    this.code = params.code;
    this.userMessage = params.userMessage;
    this.step = params.step;
  }
}

export function isExecutableCommonsFile(fileName: string): boolean {
  const lower = (fileName || '').toLowerCase().trim();
  return BLOCKED_EXECUTABLE_EXTENSIONS.some(
    (ext) => lower.endsWith(ext) || lower.includes(`${ext}.`)
  );
}

export function isAllowedCommonsFile(file: File): {
  valid: boolean;
  code?: CommonsUploadErrorCode;
  reason?: string;
} {
  if (!file) {
    return {
      valid: false,
      code: 'EMPTY_FILE',
      reason: 'No file selected.',
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      code: 'EMPTY_FILE',
      reason: `Cannot attach "${file.name}" because the file is empty (0 B).`,
    };
  }

  if (isExecutableCommonsFile(file.name)) {
    return {
      valid: false,
      code: 'UNSUPPORTED_TYPE',
      reason: `File type not allowed for "${file.name}". Executable and script files are blocked.`,
    };
  }

  const lowerName = file.name.toLowerCase().trim();
  const hasAllowedExt = ALLOWED_COMMONS_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const mime = (file.type || '').toLowerCase().trim();
  const hasAllowedMime =
    ALLOWED_COMMONS_MIME_TYPES.includes(mime) ||
    mime.startsWith('image/') ||
    mime === 'application/pdf';

  if (!hasAllowedExt && !hasAllowedMime) {
    return {
      valid: false,
      code: 'UNSUPPORTED_TYPE',
      reason: `File type not allowed for "${file.name}". Allowed: PDF, PNG, JPG, WEBP, GIF, DOC, DOCX, PPT, PPTX, TXT.`,
    };
  }

  if (file.size > MAX_COMMONS_FILE_BYTES) {
    return {
      valid: false,
      code: 'FILE_TOO_LARGE',
      reason: `File too large (max 25 MB): "${file.name}" is ${(
        file.size /
        (1024 * 1024)
      ).toFixed(1)} MB.`,
    };
  }

  return { valid: true };
}

export async function ensureAuthenticatedUser(): Promise<{
  user: User;
  token: string;
}> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new CommonsUploadError({
      code: 'NOT_AUTHENTICATED',
      userMessage: 'Please sign in to upload files.',
      technicalMessage: 'auth.currentUser is null before upload.',
      step: 'auth_check',
    });
  }

  const token = await currentUser.getIdToken(false);
  if (!token) {
    throw new CommonsUploadError({
      code: 'NOT_AUTHENTICATED',
      userMessage: 'Please sign in to upload files.',
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
 * Uploads a file to Cloudflare R2 via `/api/posts/upload`.
 * Zero Firebase Storage or Firestore calls are made.
 */
export async function uploadCommonsAttachment(params: {
  file: File;
  uid?: string;
  onProgress?: (percent: number) => void;
}): Promise<CommonsFileAttachment> {
  const { file, onProgress } = params;

  const check = isAllowedCommonsFile(file);
  if (!check.valid) {
    throw new CommonsUploadError({
      code: check.code || 'UNSUPPORTED_TYPE',
      userMessage: check.reason || 'Invalid file.',
      step: 'file_validation',
    });
  }

  const { token } = await ensureAuthenticatedUser();
  onProgress?.(10);

  const dataBase64 = await readFileAsBase64(file, onProgress);
  onProgress?.(55);

  const resp = await fetch('/api/posts/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      dataBase64,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data?.success) {
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

    throw new CommonsUploadError({
      code,
      userMessage: data?.error || 'Could not upload file to Cloudflare R2.',
      step: 'r2_worker_upload',
    });
  }

  onProgress?.(100);

  return {
    name: file.name,
    url: data.url || `${R2_PUBLIC_BUCKET_URL}/${data.key}`,
    type: file.type || 'application/octet-stream',
    size: file.size,
  };
}

export async function cleanupUploadedAttachment(_params: {
  uploadedUrl?: string;
  fallbackId?: string;
  totalChunks?: number;
}): Promise<void> {
  // No-op on client; R2 lifecycle rules clean up unreferenced objects
}

/**
 * Resolves any attachment URL to a direct HTTP/R2 URL.
 * Zero Firestore or Firebase Storage calls.
 */
export async function resolveCommonsAttachmentUrl(rawUrl: string): Promise<string> {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('/api/r2/')) {
    return trimmed;
  }
  if (trimmed.startsWith('commons/')) {
    return `${R2_PUBLIC_BUCKET_URL}/${trimmed}`;
  }
  return trimmed;
}
