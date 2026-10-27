import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
  name: string;
  size: number;
  type: string;
}

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
const DEFAULT_INACTIVITY_TIMEOUT_MS = 30000; // 30s without byte progress
const CHUNK_BYTE_SIZE = 540 * 1024; // ~540 KB raw -> ~720 KB base64 (safely under 1 MiB Firestore doc limit)

// Session flag if Firebase Storage bucket returns 404 Not Found
let firebaseStorageBucketUnavailable = false;

// In-memory cache for resolved firestore:// attachment blob URLs
const resolvedAttachmentBlobUrlCache = new Map<string, string>();

function inferMimeType(fileName: string, existingType?: string): string {
  if (existingType && existingType !== 'application/octet-stream') {
    return existingType;
  }
  const lower = fileName.toLowerCase();
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
  return existingType || 'application/octet-stream';
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
  onProgress?: (percent: number) => void
): Promise<string> {
  let idToken = '';
  try {
    if (auth.currentUser) {
      idToken = await auth.currentUser.getIdToken();
    }
  } catch {
    // Non-fatal
  }

  // 1a. Request signed upload URL
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

  // 1b. Stream the file via XMLHttpRequest to get real byte-level upload progress
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

      // If static host returned HTML or 404/405, mark as STORAGE_UNAVAILABLE so fallback runs immediately
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
 * Step 2: Direct Firebase Storage resumable upload with progress-based inactivity timeout.
 * Detects unprovisioned 404 buckets immediately instead of hanging for 20+ seconds.
 */
async function uploadViaFirebaseStorage(
  file: File,
  displayName: string,
  userId: string,
  isImage: boolean,
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

  const cleanFileName = displayName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = isImage
    ? `users/${userId}/posts/${Date.now()}_${cleanFileName}`
    : `commons/${userId}/${Date.now()}_${cleanFileName}`;

  const fileRef = ref(storage, storagePath);

  return new Promise<string>((resolve, reject) => {
    const uploadTask = uploadBytesResumable(fileRef, file, { contentType });
    let lastBytesTransferred = 0;
    let settled = false;

    // Use a shorter 7s initial handshake timeout in case the bucket returns 404 and the SDK retries internally
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
        const status = Number(err?.status_ || err?.customData?.serverResponse ? 404 : 0);

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
 * Step 3: Cloud Firestore Chunked Blob Storage (/posts/att_<fileId>_<chunkIndex>)
 * Ensures 100% upload reliability even on static hosts where /api/commons/upload is absent
 * and Firebase Cloud Storage bucket is unprovisioned (404).
 */
async function uploadViaFirestoreChunks(
  file: File,
  displayName: string,
  userId: string,
  contentType: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; fileId: string }> {
  const buffer = await file.arrayBuffer();
  const totalBytes = buffer.byteLength;
  const totalChunks = Math.max(1, Math.ceil(totalBytes / CHUNK_BYTE_SIZE));
  const fileId = `att_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // If single small image <= 180 KB, also prepare a direct data URL for instant rendering
  const isSmallSingleImage =
    totalChunks === 1 &&
    totalBytes <= 180 * 1024 &&
    contentType.startsWith('image/');

  let completedChunks = 0;
  onProgress?.(2);

  // Upload chunks in parallel batches of 4
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

        const chunkDocRef = doc(db, 'posts', `${fileId}_${chunkIndex}`);
        await setDoc(chunkDocRef, {
          uid: userId,
          isHidden: false,
          isAttachmentChunk: true,
          fileId,
          chunkIndex,
          totalChunks,
          fileName: displayName,
          mimeType: contentType,
          totalSize: totalBytes,
          data: base64Data,
          createdAt: new Date().toISOString(),
        });

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
    };
  }

  const virtualUrl = `firestore://${fileId}/${totalChunks}/${encodeURIComponent(contentType)}/${encodeURIComponent(displayName)}`;
  return {
    url: virtualUrl,
    fileId,
  };
}

/**
 * Resolves a `firestore://att_...` URL (or `/api/commons/files/...` with `?fid=att_...` fallback)
 * into a browser-renderable / downloadable URL.
 */
export async function resolveCommonsAttachmentUrl(rawUrl: string): Promise<string> {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  if (resolvedAttachmentBlobUrlCache.has(trimmed)) {
    return resolvedAttachmentBlobUrlCache.get(trimmed)!;
  }

  // Handle firestore://<fileId>/<totalChunks>/<mimeType>/<fileName>
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
          const snap = await getDoc(doc(db, 'posts', `${fileId}_${idx}`));
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
 * - Pre-upload validation (size <= 25 MB, non-empty, non-executable)
 * - Real byte progress callback (0 -> 100%)
 * - Progress-based inactivity timeout (resets whenever bytes move)
 * - Automatic retry (up to 3 attempts with exponential backoff)
 * - Detailed console error logging of status codes, response bodies, and failed step
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

  const displayName = options.displayName || file.name;
  const contentType = inferMimeType(displayName, file.type);
  const isImage =
    options.isImage ??
    (contentType.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(displayName));

  // 1. Validate before attempting upload
  if (!userId) {
    const authErr = new CommonsUploadError({
      message: `Authentication required to upload "${displayName}". Please sign in and try again.`,
      code: 'AUTH_ERROR',
      step: 'pre_upload_validation',
      retryable: false,
    });
    console.error('[CommonsUpload] Pre-upload validation error:', {
      step: authErr.step,
      code: authErr.code,
      fileName: displayName,
    });
    throw authErr;
  }

  if (isExecutableFile(displayName)) {
    const typeErr = new CommonsUploadError({
      message: `Unsupported file type for "${displayName}". Executable and script files are blocked for security.`,
      code: 'UNSUPPORTED_TYPE',
      step: 'pre_upload_validation',
      retryable: false,
    });
    console.error('[CommonsUpload] Pre-upload validation error:', {
      step: typeErr.step,
      code: typeErr.code,
      fileName: displayName,
    });
    throw typeErr;
  }

  if (file.size === 0) {
    const emptyErr = new CommonsUploadError({
      message: `File "${displayName}" is empty (0 bytes) and cannot be uploaded.`,
      code: 'EMPTY_FILE',
      step: 'pre_upload_validation',
      retryable: false,
    });
    console.error('[CommonsUpload] Pre-upload validation error:', {
      step: emptyErr.step,
      code: emptyErr.code,
      fileName: displayName,
    });
    throw emptyErr;
  }

  if (file.size > MAX_FILE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const sizeErr = new CommonsUploadError({
      message: `File "${displayName}" (${sizeMb} MB) exceeds the 25 MB maximum size limit.`,
      code: 'FILE_TOO_LARGE',
      step: 'pre_upload_validation',
      retryable: false,
    });
    console.error('[CommonsUpload] Pre-upload validation error:', {
      step: sizeErr.step,
      code: sizeErr.code,
      fileName: displayName,
      fileSize: file.size,
    });
    throw sizeErr;
  }

  let lastError: CommonsUploadError | Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      onProgress?.(1);

      // Tier 1: Direct stream upload via signed URL (/api/commons/upload-url -> PUT /api/commons/upload)
      try {
        const serverUrl = await uploadViaSignedServerUrl(
          file,
          displayName,
          userId,
          contentType,
          inactivityTimeoutMs,
          onProgress
        );

        // If it's a small image <= 450 KB, also mirror chunk 0 in Firestore in the background
        // so cross-domain viewers (e.g. boardly.cfd static vs preview server) can always load it
        if (isImage && file.size <= 450 * 1024) {
          void uploadViaFirestoreChunks(file, displayName, userId, contentType).catch(() => {});
        }

        return {
          url: serverUrl,
          name: displayName,
          size: file.size,
          type: contentType,
        };
      } catch (tier1Err: any) {
        // If non-retryable validation or auth error from server, rethrow immediately
        if (
          tier1Err instanceof CommonsUploadError &&
          (tier1Err.code === 'FILE_TOO_LARGE' ||
            tier1Err.code === 'UNSUPPORTED_TYPE' ||
            tier1Err.code === 'EMPTY_FILE' ||
            tier1Err.code === 'AUTH_ERROR')
        ) {
          throw tier1Err;
        }

        // If /api/commons/upload is unavailable on static hosting, try Tier 2 / Tier 3 without counting as a failed attempt
        if (
          tier1Err instanceof CommonsUploadError &&
          tier1Err.code === 'STORAGE_UNAVAILABLE'
        ) {
          console.info(
            `[CommonsUpload] Direct server endpoint unavailable (${tier1Err.statusCode || 'static'}), trying cloud storage for "${displayName}"...`
          );
        } else {
          throw tier1Err;
        }
      }

      // Tier 2: Direct Firebase Storage resumable upload (if bucket is provisioned)
      if (!firebaseStorageBucketUnavailable) {
        try {
          const fbUrl = await uploadViaFirebaseStorage(
            file,
            displayName,
            userId,
            isImage,
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
          if (
            tier2Err instanceof CommonsUploadError &&
            tier2Err.code === 'STORAGE_UNAVAILABLE'
          ) {
            console.warn(
              `[CommonsUpload] Firebase Storage bucket unavailable (HTTP ${tier2Err.statusCode || 404}), switching to Firestore chunked storage for "${displayName}".`
            );
          } else if (
            tier2Err instanceof CommonsUploadError &&
            tier2Err.code === 'AUTH_ERROR'
          ) {
            throw tier2Err;
          } else {
            console.warn('[CommonsUpload] Firebase Storage attempt warning:', tier2Err);
          }
        }
      }

      // Tier 3: Cloud Firestore chunked storage fallback
      const fsResult = await uploadViaFirestoreChunks(
        file,
        displayName,
        userId,
        contentType,
        onProgress
      );

      return {
        url: fsResult.url,
        fallbackId: fsResult.fileId,
        name: displayName,
        size: file.size,
        type: contentType,
      };
    } catch (err: any) {
      lastError = err;
      const isCommonsErr = err instanceof CommonsUploadError;
      const step = isCommonsErr ? err.step : 'upload_pipeline';
      const statusCode = isCommonsErr ? err.statusCode : err?.status;
      const responseBody = isCommonsErr ? err.responseBody : err?.serverResponse;
      const retryable = isCommonsErr ? err.retryable : true;

      console.error(`[CommonsUpload] Upload failed (attempt ${attempt}/${maxAttempts}):`, {
        fileName: displayName,
        fileSize: file.size,
        fileType: contentType,
        step,
        code: isCommonsErr ? err.code : err?.code || 'UNKNOWN',
        statusCode: statusCode ?? 'N/A',
        responseBody: responseBody ?? 'N/A',
        message: err?.message,
      });

      if (!retryable || attempt >= maxAttempts) {
        break;
      }

      // Exponential backoff before retrying: 1000ms, then 2500ms
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
