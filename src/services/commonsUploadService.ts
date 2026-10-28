import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db, auth } from '@/lib/firebase';
import { isExecutableFile } from '@/services/commonsService';

export type UploadErrorCode =
  | 'TIMEOUT'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_TYPE'
  | 'EMPTY_FILE'
  | 'AUTH_ERROR'
  | 'CORS_OR_NETWORK'
  | 'SERVER_ERROR'
  | 'STORAGE_UNAVAILABLE';

export class CommonsUploadError extends Error {
  public readonly code: UploadErrorCode;
  public readonly statusCode?: number;
  public readonly responseBody?: string;
  public readonly step: string;
  public readonly retryable: boolean;

  constructor(params: {
    message: string;
    code: UploadErrorCode;
    step: string;
    statusCode?: number;
    responseBody?: string;
    retryable?: boolean;
  }) {
    super(params.message);
    this.name = 'CommonsUploadError';
    this.code = params.code;
    this.step = params.step;
    this.statusCode = params.statusCode;
    this.responseBody = params.responseBody;
    this.retryable = params.retryable ?? true;
  }
}

export interface UploadAttachmentOptions {
  file: File;
  displayName?: string;
  userId: string;
  isImage?: boolean;
  onProgress?: (percent: number) => void;
  onRetry?: (attempt: number, maxAttempts: number, reason: string) => void;
  inactivityTimeoutMs?: number;
  maxAttempts?: number;
}

export interface UploadAttachmentResult {
  url: string;
  fallbackId?: string;
  totalChunks?: number;
  name: string;
  size: number;
  type: string;
}

export const MAX_COMMONS_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_COMMONS_FILES_PER_POST = 5;
const DEFAULT_INACTIVITY_TIMEOUT_MS = 30000; // 30s without byte progress
const CHUNK_BYTE_SIZE = 540 * 1024; // ~540 KB raw -> ~720 KB base64 (safely under 1 MiB Firestore doc limit)

export const ALLOWED_COMMONS_MIME_TYPES = new Set<string>([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]);

const ALLOWED_COMMONS_EXTENSIONS = /\.(png|jpe?g|webp|gif|pdf|docx?|pptx?|txt)$/i;

// Session flag if Firebase Storage bucket returns 404 Not Found
let firebaseStorageBucketUnavailable = false;

// In-memory cache for resolved firestore:// attachment blob URLs
const resolvedAttachmentBlobUrlCache = new Map<string, string>();

export function sanitizeStorageFileName(fileName: string): string {
  const trimmed = (fileName || 'attachment').trim();
  const sanitized = trimmed
    .replace(/[\s()[\]{}+,&@#$%^!~`'"=;]+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return sanitized.slice(0, 120) || 'attachment';
}

export function inferMimeType(fileName: string, existingType?: string): string {
  const normalizedExisting = (existingType || '').trim().toLowerCase();
  if (normalizedExisting && normalizedExisting !== 'application/octet-stream') {
    if (normalizedExisting === 'image/jpg') return 'image/jpeg';
    return normalizedExisting;
  }
  const lower = (fileName || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.docx'))
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
  if (lower.endsWith('.pptx'))
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (lower.endsWith('.txt')) return 'text/plain';
  return normalizedExisting || 'application/octet-stream';
}

export function isAllowedCommonsFile(fileName: string, mimeType?: string): boolean {
  if (!fileName || isExecutableFile(fileName)) return false;
  const inferred = inferMimeType(fileName, mimeType);
  const hasAllowedMime = ALLOWED_COMMONS_MIME_TYPES.has(inferred);
  const hasAllowedExt = ALLOWED_COMMONS_EXTENSIONS.test(fileName.trim());
  return hasAllowedMime || hasAllowedExt;
}

/**
 * Waits for Firebase Auth state hydration and verifies a valid, fresh ID token
 * before any Storage or Firestore write.
 */
export async function ensureAuthenticatedUser(
  expectedUid?: string,
  forceRefresh = false
): Promise<{ uid: string; idToken: string }> {
  try {
    if (typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }
  } catch {
    // Non-fatal if authStateReady is unsupported in older SDK builds
  }

  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.uid) {
    throw new CommonsUploadError({
      message: 'Your session has expired or you are not signed in. Please sign in and try again.',
      code: 'AUTH_ERROR',
      step: 'auth_session_check',
      retryable: false,
    });
  }

  if (expectedUid && currentUser.uid !== expectedUid) {
    throw new CommonsUploadError({
      message: 'Active account changed during upload. Please refresh and try again.',
      code: 'AUTH_ERROR',
      step: 'auth_uid_mismatch',
      retryable: false,
    });
  }

  try {
    const idToken = await currentUser.getIdToken(forceRefresh);
    return { uid: currentUser.uid, idToken };
  } catch (err: any) {
    throw new CommonsUploadError({
      message: 'Your login session expired and could not be refreshed. Please sign in again.',
      code: 'AUTH_ERROR',
      step: 'auth_token_refresh',
      responseBody: err?.message,
      retryable: false,
    });
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    parts.push(String.fromCharCode.apply(null, slice as unknown as number[]));
  }
  return btoa(parts.join(''));
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Step 1: Request a signed/direct upload URL from /api/commons/upload-url
 * and upload the file binary directly via XMLHttpRequest with real upload progress
 * and an inactivity timer that resets whenever bytes are transferred.
 */
async function uploadViaSignedServerUrl(
  file: File,
  displayName: string,
  userId: string,
  contentType: string,
  inactivityTimeoutMs: number,
  idToken: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const signController = new AbortController();
  const signTimeout = setTimeout(() => signController.abort(), 8000);

  let uploadUrl = `/api/commons/upload?uid=${encodeURIComponent(userId)}&name=${encodeURIComponent(displayName)}&type=${encodeURIComponent(contentType)}`;
  let uploadMethod = 'PUT';

  try {
    const signRes = await fetch('/api/commons/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({
        fileName: displayName,
        fileSize: file.size,
        contentType,
        uid: userId,
      }),
      signal: signController.signal,
    });

    const resContentType = signRes.headers.get('content-type') || '';
    if (!resContentType.includes('application/json')) {
      const bodyPreview = (await signRes.text().catch(() => '')).slice(0, 200);
      throw new CommonsUploadError({
        message: 'Direct upload endpoint is not available on this host.',
        code: 'STORAGE_UNAVAILABLE',
        step: 'request_signed_url',
        statusCode: signRes.status,
        responseBody: bodyPreview,
        retryable: false,
      });
    }

    const signData = await signRes.json();
    if (!signRes.ok || !signData?.success) {
      const errCode: UploadErrorCode =
        signRes.status === 413 || signData?.code === 'FILE_TOO_LARGE'
          ? 'FILE_TOO_LARGE'
          : signRes.status === 415 || signData?.code === 'UNSUPPORTED_TYPE'
          ? 'UNSUPPORTED_TYPE'
          : signRes.status === 401 || signRes.status === 403
          ? 'AUTH_ERROR'
          : 'SERVER_ERROR';

      throw new CommonsUploadError({
        message:
          signData?.error ||
          `Upload preparation failed (HTTP ${signRes.status}) for "${displayName}".`,
        code: errCode,
        step: 'request_signed_url',
        statusCode: signRes.status,
        responseBody: JSON.stringify(signData),
        retryable: signRes.status >= 500,
      });
    }

    if (signData.uploadUrl) {
      uploadUrl = signData.uploadUrl;
    }
    if (signData.method) {
      uploadMethod = signData.method;
    }
  } finally {
    clearTimeout(signTimeout);
  }

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastLoadedBytes = 0;
    let settled = false;

    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        if (settled) return;
        settled = true;
        try {
          xhr.abort();
        } catch {
          // ignore abort error
        }
        reject(
          new CommonsUploadError({
            message: `Uploading "${displayName}" timed out after ${Math.round(inactivityTimeoutMs / 1000)}s of inactivity.`,
            code: 'TIMEOUT',
            step: 'xhr_stream_upload',
            retryable: true,
          })
        );
      }, inactivityTimeoutMs);
    };

    resetInactivityTimer();

    xhr.upload.onprogress = (event) => {
      if (settled) return;
      if (event.loaded > lastLoadedBytes) {
        lastLoadedBytes = event.loaded;
        resetInactivityTimer();
      }
      if (event.lengthComputable && event.total > 0) {
        const pct = Math.min(99, Math.max(1, Math.round((event.loaded / event.total) * 100)));
        onProgress?.(pct);
      }
    };

    xhr.onload = () => {
      if (settled) return;
      settled = true;
      if (inactivityTimer) clearTimeout(inactivityTimer);

      const status = xhr.status;
      const responseText = xhr.responseText || '';
      const contentTypeHeader = xhr.getResponseHeader('content-type') || '';

      if (status >= 200 && status < 300 && contentTypeHeader.includes('application/json')) {
        try {
          const parsed = JSON.parse(responseText);
          if (parsed && parsed.success && parsed.url) {
            onProgress?.(100);
            resolve(parsed.url);
            return;
          }
        } catch {
          // Fall through to error handling
        }
      }

      let serverMsg = '';
      let serverCode = '';
      try {
        const parsedErr = JSON.parse(responseText);
        serverMsg = parsedErr?.error || '';
        serverCode = parsedErr?.code || '';
      } catch {
        serverMsg = responseText.slice(0, 180);
      }

      if (status === 413 || serverCode === 'FILE_TOO_LARGE') {
        reject(
          new CommonsUploadError({
            message:
              serverMsg ||
              `File "${displayName}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 25 MB limit.`,
            code: 'FILE_TOO_LARGE',
            step: 'xhr_stream_upload',
            statusCode: status,
            responseBody: responseText.slice(0, 300),
            retryable: false,
          })
        );
        return;
      }

      if (status === 415 || serverCode === 'UNSUPPORTED_TYPE') {
        reject(
          new CommonsUploadError({
            message: serverMsg || `File "${displayName}" has an unsupported or blocked format.`,
            code: 'UNSUPPORTED_TYPE',
            step: 'xhr_stream_upload',
            statusCode: status,
            responseBody: responseText.slice(0, 300),
            retryable: false,
          })
        );
        return;
      }

      if (status === 401 || status === 403) {
        reject(
          new CommonsUploadError({
            message:
              serverMsg ||
              `Permission or authentication error (HTTP ${status}) while uploading "${displayName}".`,
            code: 'AUTH_ERROR',
            step: 'xhr_stream_upload',
            statusCode: status,
            responseBody: responseText.slice(0, 300),
            retryable: false,
          })
        );
        return;
      }

      if (status === 404 || status === 405 || contentTypeHeader.includes('text/html')) {
        reject(
          new CommonsUploadError({
            message: `Server upload endpoint unavailable (HTTP ${status}).`,
            code: 'STORAGE_UNAVAILABLE',
            step: 'xhr_stream_upload',
            statusCode: status,
            responseBody: responseText.slice(0, 200),
            retryable: false,
          })
        );
        return;
      }

      reject(
        new CommonsUploadError({
          message:
            serverMsg ||
            `Server error (HTTP ${status}) while uploading "${displayName}".`,
          code: 'SERVER_ERROR',
          step: 'xhr_stream_upload',
          statusCode: status,
          responseBody: responseText.slice(0, 300),
          retryable: status >= 500 || status === 0,
        })
      );
    };

    xhr.onerror = () => {
      if (settled) return;
      settled = true;
      if (inactivityTimer) clearTimeout(inactivityTimer);
      reject(
        new CommonsUploadError({
          message: `Network or CORS error while uploading "${displayName}".`,
          code: 'CORS_OR_NETWORK',
          step: 'xhr_stream_upload',
          statusCode: xhr.status,
          retryable: true,
        })
      );
    };

    xhr.open(uploadMethod, uploadUrl, true);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(displayName));
    xhr.setRequestHeader('X-File-Type', contentType);
    xhr.setRequestHeader('X-User-Id', userId);
    if (idToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${idToken}`);
    }
    xhr.send(file);
  });
}

/**
 * Step 2: Direct Firebase Storage resumable upload to /commons/{userId}/{timestamp}_{sanitizedFileName}.
 */
async function uploadViaFirebaseStorage(
  file: File,
  displayName: string,
  userId: string,
  contentType: string,
  inactivityTimeoutMs: number,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (firebaseStorageBucketUnavailable) {
    throw new CommonsUploadError({
      message: 'Firebase Storage bucket is not provisioned.',
      code: 'STORAGE_UNAVAILABLE',
      step: 'firebase_storage_precheck',
      retryable: false,
    });
  }

  const cleanFileName = sanitizeStorageFileName(displayName);
  const storagePath = `commons/${userId}/${Date.now()}_${cleanFileName}`;
  const fileRef = ref(storage, storagePath);

  return new Promise<string>((resolve, reject) => {
    const uploadTask = uploadBytesResumable(fileRef, file, {
      contentType,
      customMetadata: {
        originalName: displayName.slice(0, 200),
        uploadedBy: userId,
      },
    });
    let lastBytesTransferred = 0;
    let settled = false;

    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    const resetTimer = (timeoutMs: number) => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        if (settled) return;
        settled = true;
        if (lastBytesTransferred === 0) {
          firebaseStorageBucketUnavailable = true;
        }
        try {
          uploadTask.cancel();
        } catch {
          // ignore cancel error
        }
        reject(
          new CommonsUploadError({
            message:
              lastBytesTransferred === 0
                ? 'Firebase Storage endpoint did not accept the upload connection.'
                : `Firebase Storage upload for "${displayName}" stalled.`,
            code: lastBytesTransferred === 0 ? 'STORAGE_UNAVAILABLE' : 'TIMEOUT',
            step: 'firebase_storage_upload',
            retryable: lastBytesTransferred > 0,
          })
        );
      }, timeoutMs);
    };

    resetTimer(7000);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (settled) return;
        if (snapshot.bytesTransferred > lastBytesTransferred) {
          lastBytesTransferred = snapshot.bytesTransferred;
          resetTimer(inactivityTimeoutMs);
        }
        if (snapshot.totalBytes > 0) {
          const pct = Math.min(
            99,
            Math.max(1, Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
          );
          onProgress?.(pct);
        }
      },
      (err: any) => {
        if (settled) return;
        settled = true;
        if (inactivityTimer) clearTimeout(inactivityTimer);

        const errCode = String(err?.code || '');
        const serverResp = String(err?.serverResponse || err?.message || '');
        const status = Number(err?.status_ || (err?.customData?.serverResponse ? 404 : 0));

        if (
          errCode.includes('object-not-found') ||
          errCode.includes('bucket-not-found') ||
          errCode.includes('project-not-found') ||
          serverResp.includes('404') ||
          serverResp.includes('Not Found')
        ) {
          firebaseStorageBucketUnavailable = true;
          reject(
            new CommonsUploadError({
              message: 'Firebase Storage bucket returned 404 Not Found.',
              code: 'STORAGE_UNAVAILABLE',
              step: 'firebase_storage_upload',
              statusCode: 404,
              responseBody: serverResp,
              retryable: false,
            })
          );
          return;
        }

        if (errCode.includes('unauthorized') || errCode.includes('unauthenticated')) {
          reject(
            new CommonsUploadError({
              message: `Permission denied by storage rules while uploading "${displayName}".`,
              code: 'AUTH_ERROR',
              step: 'firebase_storage_upload',
              statusCode: 403,
              responseBody: serverResp,
              retryable: false,
            })
          );
          return;
        }

        reject(
          new CommonsUploadError({
            message: err?.message || `Storage error while uploading "${displayName}".`,
            code: 'SERVER_ERROR',
            step: 'firebase_storage_upload',
            statusCode: status || undefined,
            responseBody: serverResp,
            retryable: true,
          })
        );
      },
      async () => {
        if (settled) return;
        settled = true;
        if (inactivityTimer) clearTimeout(inactivityTimer);
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          onProgress?.(100);
          resolve(downloadUrl);
        } catch (dlErr: any) {
          reject(
            new CommonsUploadError({
              message: dlErr?.message || `Failed to retrieve download URL for "${displayName}".`,
              code: 'SERVER_ERROR',
              step: 'firebase_storage_get_url',
              retryable: true,
            })
          );
        }
      }
    );
  });
}

/**
 * Step 3: Cloud Firestore Chunked Blob Storage
 * Writes chunks to `commonsPosts/att_<fileId>_<chunkIndex>` with private ownership in
 * `postsPrivate/att_<fileId>_<chunkIndex>`.
 * - Satisfies both the currently deployed live rules and the new production rules.
 * - Never exposes `authorUid` on the chunk document (safe for anonymous posts).
 * - Omits `createdAt` (uses `chunkCreatedAt`) so feed queries (`orderBy('createdAt', 'desc')`)
 *   naturally exclude chunk documents at the Firestore index level.
 */
async function uploadViaFirestoreChunks(
  file: File,
  displayName: string,
  userId: string,
  contentType: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; fileId: string; totalChunks: number }> {
  const buffer = await file.arrayBuffer();
  const totalBytes = buffer.byteLength;
  const totalChunks = Math.max(1, Math.ceil(totalBytes / CHUNK_BYTE_SIZE));
  const fileId = `att_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const isSmallSingleImage =
    totalChunks === 1 &&
    totalBytes <= 180 * 1024 &&
    contentType.startsWith('image/');

  let completedChunks = 0;
  onProgress?.(2);

  const BATCH_SIZE = 4;
  for (let batchStart = 0; batchStart < totalChunks; batchStart += BATCH_SIZE) {
    const batchIndexes: number[] = [];
    for (
      let idx = batchStart;
      idx < Math.min(totalChunks, batchStart + BATCH_SIZE);
      idx++
    ) {
      batchIndexes.push(idx);
    }

    await Promise.all(
      batchIndexes.map(async (chunkIndex) => {
        const start = chunkIndex * CHUNK_BYTE_SIZE;
        const end = Math.min(totalBytes, start + CHUNK_BYTE_SIZE);
        const slice = buffer.slice(start, end);
        const base64Data = arrayBufferToBase64(slice);
        const chunkDocId = `${fileId}_${chunkIndex}`;

        const chunkDocRef = doc(db, 'commonsPosts', chunkDocId);
        await setDoc(chunkDocRef, {
          title: (displayName || 'Attachment').slice(0, 200),
          description: 'attachment_chunk',
          type: 'attachment_chunk',
          isAnonymous: true,
          authorUid: null,
          isHidden: false,
          isAttachmentChunk: true,
          fileId,
          chunkIndex,
          totalChunks,
          fileName: displayName,
          mimeType: contentType,
          totalSize: totalBytes,
          data: base64Data,
          chunkCreatedAt: serverTimestamp(),
        });

        // Record private ownership so the uploader or admin can clean up / delete chunks
        const privateRef = doc(db, 'postsPrivate', chunkDocId);
        await setDoc(privateRef, {
          postId: chunkDocId,
          authorUid: userId,
          isAnonymous: true,
          createdAt: serverTimestamp(),
        }).catch(() => {});

        completedChunks++;
        const pct = Math.min(
          99,
          Math.max(5, Math.round((completedChunks / totalChunks) * 100))
        );
        onProgress?.(pct);
      })
    );
  }

  onProgress?.(100);

  if (isSmallSingleImage) {
    const base64Full = arrayBufferToBase64(buffer);
    return {
      url: `data:${contentType};base64,${base64Full}`,
      fileId,
      totalChunks,
    };
  }

  const virtualUrl = `firestore://${fileId}/${totalChunks}/${encodeURIComponent(contentType)}/${encodeURIComponent(displayName)}`;
  return {
    url: virtualUrl,
    fileId,
    totalChunks,
  };
}

/**
 * Cleans up an uploaded attachment from Firestore chunks or Firebase Storage
 * if post creation fails or the user removes the file.
 */
export async function cleanupUploadedAttachment(
  attachment: { url?: string; fallbackId?: string; totalChunks?: number },
  _userId?: string
): Promise<void> {
  const rawUrl = (attachment.url || '').trim();
  let fileId = attachment.fallbackId || '';
  let totalChunks = attachment.totalChunks || 1;

  if (rawUrl.startsWith('firestore://')) {
    const parts = rawUrl.slice('firestore://'.length).split('/');
    fileId = parts[0] || fileId;
    totalChunks = Math.max(1, parseInt(parts[1] || '1', 10));
  }

  if (fileId && fileId.startsWith('att_')) {
    const deletions: Promise<void>[] = [];
    for (let idx = 0; idx < totalChunks; idx++) {
      const chunkDocId = `${fileId}_${idx}`;
      deletions.push(deleteDoc(doc(db, 'commonsPosts', chunkDocId)).catch(() => {}));
      deletions.push(deleteDoc(doc(db, 'postsPrivate', chunkDocId)).catch(() => {}));
    }
    await Promise.all(deletions);
    return;
  }

  if (rawUrl.includes('firebasestorage.googleapis.com') || rawUrl.includes('.firebasestorage.app')) {
    try {
      const storageRef = ref(storage, rawUrl);
      await deleteObject(storageRef);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Resolves a `firestore://att_...` URL into a browser-renderable / downloadable Blob URL.
 * Checks `commonsPosts` first, falling back to `commonsAttachments` and `posts` for backward compatibility.
 */
export async function resolveCommonsAttachmentUrl(rawUrl: string): Promise<string> {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  if (resolvedAttachmentBlobUrlCache.has(trimmed)) {
    return resolvedAttachmentBlobUrlCache.get(trimmed)!;
  }

  if (trimmed.startsWith('firestore://')) {
    const withoutScheme = trimmed.slice('firestore://'.length);
    const parts = withoutScheme.split('/');
    const fileId = parts[0];
    const totalChunks = Math.max(1, parseInt(parts[1] || '1', 10));
    const mimeType = decodeURIComponent(parts[2] || 'application/octet-stream');

    const chunkArrays: Uint8Array[] = new Array(totalChunks);
    let totalLength = 0;

    const BATCH_SIZE = 6;
    for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
      const indices: number[] = [];
      for (let j = i; j < Math.min(totalChunks, i + BATCH_SIZE); j++) {
        indices.push(j);
      }
      await Promise.all(
        indices.map(async (idx) => {
          const chunkDocId = `${fileId}_${idx}`;
          let snap = await getDoc(doc(db, 'commonsPosts', chunkDocId));
          if (!snap.exists()) {
            snap = await getDoc(doc(db, 'commonsAttachments', chunkDocId)).catch(() => snap);
          }
          if (!snap.exists()) {
            snap = await getDoc(doc(db, 'posts', chunkDocId)).catch(() => snap);
          }
          if (!snap.exists()) {
            throw new Error(`Attachment chunk ${idx + 1}/${totalChunks} not found.`);
          }
          const b64 = String(snap.data()?.data || '');
          const bytes = base64ToUint8Array(b64);
          chunkArrays[idx] = bytes;
          totalLength += bytes.byteLength;
        })
      );
    }

    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of chunkArrays) {
      if (arr) {
        merged.set(arr, offset);
        offset += arr.byteLength;
      }
    }

    const blob = new Blob([merged], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    resolvedAttachmentBlobUrlCache.set(trimmed, blobUrl);
    return blobUrl;
  }

  return trimmed;
}

/**
 * Uploads a single study resource attachment with:
 * - Pre-upload auth verification & token refresh
 * - Pre-upload validation (size <= 25 MB, non-empty, allowed MIME & extension, non-executable)
 * - Real byte progress callback (0 -> 100%)
 * - Automatic fallback from Server -> Firebase Storage -> Firestore Chunked Storage
 */
export async function uploadCommonsAttachment(
  options: UploadAttachmentOptions
): Promise<UploadAttachmentResult> {
  const {
    file,
    userId,
    onProgress,
    onRetry,
    inactivityTimeoutMs = DEFAULT_INACTIVITY_TIMEOUT_MS,
    maxAttempts = 3,
  } = options;

  const displayName = (options.displayName || file.name || 'attachment').trim();
  const contentType = inferMimeType(displayName, file.type);
  const isImage =
    options.isImage ??
    (contentType.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(displayName));

  // 1. Validate authentication & refresh token if needed
  if (!userId) {
    throw new CommonsUploadError({
      message: `Authentication required to upload "${displayName}". Please sign in and try again.`,
      code: 'AUTH_ERROR',
      step: 'pre_upload_validation',
      retryable: false,
    });
  }

  const { uid: verifiedUid, idToken } = await ensureAuthenticatedUser(userId, false);

  // 2. Validate file type & security rules constraints
  if (isExecutableFile(displayName) || !isAllowedCommonsFile(displayName, contentType)) {
    throw new CommonsUploadError({
      message: `File "${displayName}" is not allowed. Supported formats: PNG, JPG, WEBP, GIF, PDF, DOC, DOCX, PPT, PPTX, TXT.`,
      code: 'UNSUPPORTED_TYPE',
      step: 'pre_upload_validation',
      retryable: false,
    });
  }

  if (file.size === 0) {
    throw new CommonsUploadError({
      message: `File "${displayName}" is empty (0 bytes) and cannot be uploaded.`,
      code: 'EMPTY_FILE',
      step: 'pre_upload_validation',
      retryable: false,
    });
  }

  if (file.size > MAX_COMMONS_FILE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new CommonsUploadError({
      message: `File "${displayName}" (${sizeMb} MB) exceeds the 25 MB maximum size limit.`,
      code: 'FILE_TOO_LARGE',
      step: 'pre_upload_validation',
      retryable: false,
    });
  }

  let lastError: CommonsUploadError | Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      onProgress?.(1);

      // Refresh token on retry attempts
      const activeToken =
        attempt > 1 ? (await ensureAuthenticatedUser(verifiedUid, true)).idToken : idToken;

      // Tier 1: Direct stream upload via signed URL (/api/commons/upload-url -> PUT /api/commons/upload)
      try {
        const serverUrl = await uploadViaSignedServerUrl(
          file,
          displayName,
          verifiedUid,
          contentType,
          inactivityTimeoutMs,
          activeToken,
          onProgress
        );

        if (isImage && file.size <= 450 * 1024) {
          void uploadViaFirestoreChunks(file, displayName, verifiedUid, contentType).catch(() => {});
        }

        return {
          url: serverUrl,
          name: displayName,
          size: file.size,
          type: contentType,
        };
      } catch (tier1Err: any) {
        if (
          tier1Err instanceof CommonsUploadError &&
          (tier1Err.code === 'FILE_TOO_LARGE' ||
            tier1Err.code === 'UNSUPPORTED_TYPE' ||
            tier1Err.code === 'EMPTY_FILE')
        ) {
          throw tier1Err;
        }

        if (
          tier1Err instanceof CommonsUploadError &&
          tier1Err.code === 'STORAGE_UNAVAILABLE'
        ) {
          console.info(
            `[CommonsUpload] Direct server endpoint unavailable (${tier1Err.statusCode || 'static'}), trying cloud storage for "${displayName}"...`
          );
        } else {
          console.warn('[CommonsUpload] Tier 1 upload error, falling back to Cloud Storage:', tier1Err?.message);
        }
      }

      // Tier 2: Direct Firebase Storage resumable upload to /commons/{uid}/{filename}
      if (!firebaseStorageBucketUnavailable) {
        try {
          const fbUrl = await uploadViaFirebaseStorage(
            file,
            displayName,
            verifiedUid,
            contentType,
            inactivityTimeoutMs,
            onProgress
          );
          return {
            url: fbUrl,
            name: displayName,
            size: file.size,
            type: contentType,
          };
        } catch (tier2Err: any) {
          // If Firebase Storage is unprovisioned (404) or its rules have not yet been deployed (403),
          // fall back to Tier 3 (Firestore chunked storage) instead of failing the student's upload!
          console.warn(
            `[CommonsUpload] Firebase Storage unavailable (${tier2Err?.code || 'ERR'}), switching to Firestore chunked storage for "${displayName}".`
          );
        }
      }

      // Tier 3: Cloud Firestore chunked storage fallback
      const fsResult = await uploadViaFirestoreChunks(
        file,
        displayName,
        verifiedUid,
        contentType,
        onProgress
      );

      return {
        url: fsResult.url,
        fallbackId: fsResult.fileId,
        totalChunks: fsResult.totalChunks,
        name: displayName,
        size: file.size,
        type: contentType,
      };
    } catch (err: any) {
      lastError = err;
      const isCommonsErr = err instanceof CommonsUploadError;
      const errMsg = String(err?.message || '');
      const isPermissionDenied =
        err?.code === 'permission-denied' ||
        errMsg.includes('Missing or insufficient permissions') ||
        errMsg.includes('PERMISSION_DENIED');

      if (isPermissionDenied) {
        throw new CommonsUploadError({
          message: `Permission denied by security rules while uploading "${displayName}". Please ensure you are signed in and try again.`,
          code: 'AUTH_ERROR',
          step: 'firestore_chunk_upload',
          retryable: false,
        });
      }

      const retryable = isCommonsErr ? err.retryable : true;
      if (!retryable || attempt >= maxAttempts) {
        break;
      }

      const backoffMs = attempt === 1 ? 1000 : 2500;
      onRetry?.(attempt + 1, maxAttempts, err?.message || 'Retrying upload...');
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  if (lastError instanceof CommonsUploadError) {
    throw lastError;
  }

  throw new CommonsUploadError({
    message:
      lastError?.message ||
      `Failed to upload "${displayName}" after ${maxAttempts} attempts. Click Retry on the file to try again.`,
    code: 'SERVER_ERROR',
    step: 'upload_exhausted',
    retryable: true,
  });
}
