/**
 * BOARDLY — CERTIFICATE & ADMIN SIGNATURE CLIENT SERVICE
 *
 * All operations go through authenticated Cloudflare Worker / API endpoints.
 * Every call includes structured error handling that logs and surfaces the
 * error code and failing endpoint path.
 */

import { apiRequest as apiFetch, getBearerToken as getIdToken } from '../lib/api';
import type { CertificateTheme } from '../config/certificateThemes';

export interface StudentCertificateRecord {
  id: string;
  serial: string;
  studentUid: string;
  studentName: string;
  studentEmail?: string;
  grandLineId: string;
  grandLineTitle: string;
  editionLabel: string;
  rank: number;
  score: number;
  totalQuestions: number;
  percentage: number;
  participantsCount: number;
  themeId: string;
  theme?: CertificateTheme;
  signatureVersion: number;
  issuedAt: number;
  status: 'active' | 'revoked';
  verifyUrl: string;
  previewPngUrl: string;
  downloadPngUrl: string;
  downloadPdfUrl: string;
}

export interface AdminSignatureRecord {
  id: string;
  r2Key?: string;
  signatoryName: string;
  signatoryTitle: string;
  signatory_name?: string;
  signatory_title?: string;
  version: number;
  uploadedBy?: string;
  createdAt: number;
  created_at?: number;
  active: boolean;
  imageUrl?: string;
  previewDataUrl?: string | null;
}

export interface PublicCertificateVerification {
  valid: boolean;
  status: 'active' | 'revoked' | 'not_found' | 'invalid';
  serial: string;
  studentName?: string;
  mockTitle?: string;
  editionLabel?: string;
  rank?: number;
  score?: number;
  totalQuestions?: number;
  percentage?: number;
  participantsCount?: number;
  issuedAt?: number;
  error?: string;
}

export interface AdminMockSummary {
  id: string;
  title: string;
  subject: string;
  status: string;
  visibility: string;
  attemptsCount: number;
  certificateThemeId: string | null;
  resultsFinalised: boolean;
  finalisedAt: number | null;
  mockNumber: number;
}

/**
 * Fetch the logged-in student's active certificates (`GET /api/certificates/mine`).
 */
export async function fetchMyCertificates(): Promise<StudentCertificateRecord[]> {
  const endpoint = '/api/certificates/mine';
  try {
    const data = await apiFetch<{ certificates: StudentCertificateRecord[] }>(endpoint, {
      requireAuth: true,
    });
    return Array.isArray(data?.certificates) ? data.certificates : [];
  } catch (err: any) {
    console.error(`[CertificateService] Error (${err?.code || 'API_ERROR'}) at ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Download a certificate PDF or PNG through the authenticated Worker endpoint
 * (`GET /api/certificates/:id/download?format=pdf|png`).
 */
export async function downloadCertificateFile(params: {
  certificateId: string;
  serial: string;
  format: 'pdf' | 'png';
  signedUrl?: string;
}): Promise<void> {
  const endpoint =
    params.signedUrl ||
    `/api/certificates/${encodeURIComponent(params.certificateId)}/download?format=${params.format}`;
  try {
    const token = await getIdToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, { headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const code = errBody?.code || `HTTP_${res.status}`;
      const msg = errBody?.error || `Failed to download certificate (${code}) at ${endpoint}`;
      console.error(`[CertificateService] Download failed [${code}] at ${endpoint}:`, msg);
      throw new Error(`${msg} [${code}]`);
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${params.serial}.${params.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } catch (err: any) {
    console.error(
      `[CertificateService] Error (${err?.code || 'DOWNLOAD_ERROR'}) at ${endpoint}:`,
      err
    );
    throw err;
  }
}

/**
 * Generate a short-lived signed share link & public verification URL for a certificate.
 */
export async function createCertificateShareLink(certificateId: string): Promise<{
  serial: string;
  verifyUrl: string;
  signedPngUrl: string;
  signedPdfUrl: string;
  expiresAt: number;
}> {
  const endpoint = `/api/certificates/${encodeURIComponent(certificateId)}/share-link`;
  try {
    return await apiFetch(endpoint, {
      method: 'POST',
      requireAuth: true,
    });
  } catch (err: any) {
    console.error(`[CertificateService] Error (${err?.code || 'SHARE_ERROR'}) at ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Public certificate verification lookup (`GET /api/verify/:serial`).
 */
export async function verifyCertificateBySerial(
  serial: string
): Promise<PublicCertificateVerification> {
  const cleanSerial = encodeURIComponent(String(serial || '').trim().toUpperCase());
  const endpoint = `/api/verify/${cleanSerial}`;
  try {
    const res = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        valid: false,
        status: data?.status || 'not_found',
        serial: String(serial || '').trim().toUpperCase(),
        error: data?.error || `Verification lookup returned HTTP ${res.status}`,
      };
    }
    return data as PublicCertificateVerification;
  } catch (err: any) {
    console.error(`[CertificateService] Verify error at ${endpoint}:`, err);
    return {
      valid: false,
      status: 'not_found',
      serial: String(serial || '').trim().toUpperCase(),
      error: err?.message || 'Unable to verify certificate right now.',
    };
  }
}

function normalizeSignatureRecord(raw: any): AdminSignatureRecord {
  const id = String(raw.id || '');
  const imageUrl = raw.imageUrl || (id ? `/api/admin/signatures/${encodeURIComponent(id)}/image` : undefined);
  return {
    id,
    r2Key: raw.r2Key || raw.r2_key,
    signatoryName: raw.signatoryName ?? raw.signatory_name ?? '',
    signatoryTitle: raw.signatoryTitle ?? raw.signatory_title ?? '',
    signatory_name: raw.signatory_name ?? raw.signatoryName ?? '',
    signatory_title: raw.signatory_title ?? raw.signatoryTitle ?? '',
    version: Number(raw.version || 1),
    uploadedBy: raw.uploadedBy ?? raw.uploaded_by ?? '',
    createdAt: Number(raw.createdAt ?? raw.created_at ?? Date.now()),
    created_at: Number(raw.created_at ?? raw.createdAt ?? Date.now()),
    active: Boolean(raw.active ?? true),
    imageUrl,
    previewDataUrl: raw.previewDataUrl || imageUrl || null,
  };
}

const PREVIEW_REQUEST_TIMEOUT_MS = 10_000;

/**
 * Fetches an authenticated signature PNG from `/api/admin/signatures/:id/image`
 * with a 10-second `AbortController` timeout and converts it into a
 * `data:image/png;base64,...` data URI so inline `<svg><image>` previews and
 * `<img>` thumbnails never fail due to missing Bearer headers.
 */
export async function fetchSignatureImageAsDataUrl(
  signatureIdOrUrl: string,
  timeoutMs = PREVIEW_REQUEST_TIMEOUT_MS
): Promise<string | null> {
  if (!signatureIdOrUrl) return null;
  if (signatureIdOrUrl.startsWith('data:image/')) {
    return signatureIdOrUrl;
  }
  const endpoint = signatureIdOrUrl.startsWith('/')
    ? signatureIdOrUrl
    : `/api/admin/signatures/${encodeURIComponent(signatureIdOrUrl)}/image`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Signature image request timed out after ${Math.round(timeoutMs / 1000)}s`));
  }, timeoutMs);

  try {
    const token = await getIdToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(endpoint, { headers, signal: controller.signal });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json().catch(() => null);
      if (json?.previewDataUrl && String(json.previewDataUrl).startsWith('data:image/')) {
        return String(json.previewDataUrl);
      }
      return null;
    }
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`[CertificateService] Could not fetch signature image at ${endpoint}:`, err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Admin only: Fetch active signature and version history (`GET /api/admin/signatures`)
 * with a 10-second `AbortController` timeout.
 */
export async function fetchAdminSignatures(): Promise<{
  hasActiveSignature: boolean;
  activeSignature: AdminSignatureRecord | null;
  history: AdminSignatureRecord[];
}> {
  const endpoint = '/api/admin/signatures';
  try {
    const res = await apiFetch<any>(endpoint, {
      requireAuth: true,
      timeoutMs: PREVIEW_REQUEST_TIMEOUT_MS,
    });
    const history: AdminSignatureRecord[] = Array.isArray(res?.history)
      ? res.history.map(normalizeSignatureRecord)
      : [];
    let activeSignature: AdminSignatureRecord | null = res?.activeSignature
      ? normalizeSignatureRecord(res.activeSignature)
      : history.find((h: AdminSignatureRecord) => h.active) || null;

    // Ensure activeSignature has a resolved data:image/... URI so SVG <image> tags render without needing auth headers
    if (
      activeSignature &&
      (!activeSignature.previewDataUrl ||
        !activeSignature.previewDataUrl.startsWith('data:image/'))
    ) {
      const dataUrl = await fetchSignatureImageAsDataUrl(
        activeSignature.imageUrl || activeSignature.id,
        PREVIEW_REQUEST_TIMEOUT_MS
      );
      if (dataUrl) {
        activeSignature = { ...activeSignature, previewDataUrl: dataUrl };
      }
    }

    const hydratedHistory = await Promise.all(
      history.map(async (item) => {
        if (item.previewDataUrl && item.previewDataUrl.startsWith('data:image/')) {
          return item;
        }
        if (activeSignature && item.id === activeSignature.id && activeSignature.previewDataUrl) {
          return { ...item, previewDataUrl: activeSignature.previewDataUrl };
        }
        const dataUrl = await fetchSignatureImageAsDataUrl(
          item.imageUrl || item.id,
          PREVIEW_REQUEST_TIMEOUT_MS
        );
        return dataUrl ? { ...item, previewDataUrl: dataUrl } : item;
      })
    );

    return {
      hasActiveSignature: Boolean(activeSignature),
      activeSignature,
      history: hydratedHistory,
    };
  } catch (err: any) {
    console.error(`[CertificateService] Error (${err?.code || 'ADMIN_SIG_READ'}) at ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Admin only: Upload or save a drawn signature (`POST /api/admin/signatures`).
 */
export async function uploadAdminSignature(params: {
  imageBase64: string;
  signatoryName: string;
  signatoryTitle: string;
}): Promise<{ ok: boolean; signature: AdminSignatureRecord }> {
  const endpoint = '/api/admin/signatures';
  try {
    const res = await apiFetch<any>(endpoint, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({
        imageBase64: params.imageBase64,
        image: params.imageBase64,
        signatoryName: params.signatoryName,
        signatory_name: params.signatoryName,
        signatoryTitle: params.signatoryTitle,
        signatory_title: params.signatoryTitle,
      }),
    });
    return {
      ok: Boolean(res?.ok),
      signature: normalizeSignatureRecord(res?.signature || {}),
    };
  } catch (err: any) {
    console.error(`[CertificateService] Error (${err?.code || 'ADMIN_SIG_UPLOAD'}) at ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Admin only: Update signatory name & title on the active signature (`PUT /api/admin/signatures/active`).
 */
export async function updateActiveSignatureMeta(params: {
  signatoryName: string;
  signatoryTitle: string;
}): Promise<{ ok: boolean; signature: AdminSignatureRecord }> {
  const endpoint = '/api/admin/signatures/active';
  try {
    const res = await apiFetch<any>(endpoint, {
      method: 'PUT',
      requireAuth: true,
      body: JSON.stringify({
        signatoryName: params.signatoryName,
        signatory_name: params.signatoryName,
        signatoryTitle: params.signatoryTitle,
        signatory_title: params.signatoryTitle,
      }),
    });
    return {
      ok: Boolean(res?.ok),
      signature: normalizeSignatureRecord(res?.signature || {}),
    };
  } catch (err: any) {
    console.error(`[CertificateService] Error (${err?.code || 'ADMIN_SIG_META'}) at ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Admin only: Restore a previous signature version (`POST /api/admin/signatures/:version/restore`).
 */
export async function restoreAdminSignatureVersion(version: number): Promise<{
  ok: boolean;
  activeSignature: AdminSignatureRecord;
}> {
  const endpoint = `/api/admin/signatures/${encodeURIComponent(String(version))}/restore`;
  try {
    const res = await apiFetch<any>(endpoint, {
      method: 'POST',
      requireAuth: true,
    });
    return {
      ok: Boolean(res?.ok),
      activeSignature: normalizeSignatureRecord(res?.activeSignature || {}),
    };
  } catch (err: any) {
    console.error(`[CertificateService] Error (${err?.code || 'ADMIN_SIG_RESTORE'}) at ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Admin only: Remove/deactivate current active signature (`DELETE /api/admin/signatures/active`).
 */
export async function removeActiveAdminSignature(): Promise<{
  ok: boolean;
  hasActiveSignature: boolean;
}> {
  const endpoint = '/api/admin/signatures/active';
  try {
    return await apiFetch(endpoint, {
      method: 'DELETE',
      requireAuth: true,
    });
  } catch (err: any) {
    console.error(`[CertificateService] Error (${err?.code || 'ADMIN_SIG_REMOVE'}) at ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Admin only: Delete/deactivate a specific signature by ID (`DELETE /api/admin/signatures/:id`).
 */
export async function deleteAdminSignature(id: string): Promise<{
  ok: boolean;
  deactivatedId: string;
  deactivatedVersion: number;
  activeSignature: AdminSignatureRecord | null;
  hasActiveSignature: boolean;
}> {
  const endpoint = `/api/admin/signatures/${encodeURIComponent(id)}`;
  try {
    return await apiFetch(endpoint, {
      method: 'DELETE',
      requireAuth: true,
    });
  } catch (err: any) {
    console.error(`[CertificateService] Error (${err?.code || 'ADMIN_SIG_DELETE'}) at ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Admin only: List all certificates, active signature status, and Grand Line mocks (`GET /api/admin/certificates`).
 */
export async function fetchAdminCertificates(params?: {
  search?: string;
  status?: string;
  grandLineId?: string;
}): Promise<{
  hasActiveSignature: boolean;
  activeSignature: AdminSignatureRecord | null;
  certificates: StudentCertificateRecord[];
  mocks: AdminMockSummary[];
}> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.status) qs.set('status', params.status);
  if (params?.grandLineId) qs.set('grandLineId', params.grandLineId);
  const queryStr = qs.toString();
  const endpoint = `/api/admin/certificates${queryStr ? `?${queryStr}` : ''}`;
  try {
    const res = await apiFetch<any>(endpoint, {
      requireAuth: true,
      timeoutMs: PREVIEW_REQUEST_TIMEOUT_MS,
    });
    let activeSignature: AdminSignatureRecord | null = res?.activeSignature
      ? normalizeSignatureRecord(res.activeSignature)
      : null;
    if (
      activeSignature &&
      (!activeSignature.previewDataUrl ||
        !activeSignature.previewDataUrl.startsWith('data:image/'))
    ) {
      const dataUrl = await fetchSignatureImageAsDataUrl(
        activeSignature.imageUrl || activeSignature.id,
        PREVIEW_REQUEST_TIMEOUT_MS
      );
      if (dataUrl) {
        activeSignature = { ...activeSignature, previewDataUrl: dataUrl };
      }
    }
    return {
      hasActiveSignature: Boolean(res?.hasActiveSignature ?? activeSignature),
      activeSignature,
      certificates: Array.isArray(res?.certificates) ? res.certificates : [],
      mocks: Array.isArray(res?.mocks) ? res.mocks : [],
    };
  } catch (err: any) {
    console.error(`[CertificateService] Error (${err?.code || 'ADMIN_CERTS_LIST'}) at ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Admin only: Regenerate a single certificate with the current active signature & mock theme.
 */
export async function regenerateCertificateById(
  certificateId: string,
  themeId?: string | null
): Promise<{
  ok: boolean;
  certificate: { id: string; serial: string; signatureVersion: number; themeId: string };
}> {
  const endpoint = `/api/admin/certificates/${encodeURIComponent(certificateId)}/regenerate`;
  try {
    return await apiFetch(endpoint, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({ themeId }),
    });
  } catch (err: any) {
    console.error(`[CertificateService] Error (${err?.code || 'ADMIN_CERT_REGEN'}) at ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Admin only: Regenerate all active certificates needing the current active signature (`POST /api/admin/certificates/regenerate-all`).
 * Automatically iterates through batches (10 at a time) if `hasMore` is returned.
 */
export async function regenerateAllCertificates(grandLineId?: string): Promise<{
  ok: boolean;
  total: number;
  regenerated: number;
  regeneratedCount: number;
  failed: number;
  errors: Array<{ id: string; serial: string; error: string }>;
  signatureVersion: number;
}> {
  const endpoint = '/api/admin/certificates/regenerate-all';
  try {
    let cursor: string | null = null;
    let total = 0;
    let regenerated = 0;
    let failed = 0;
    let signatureVersion = 1;
    const errors: Array<{ id: string; serial: string; error: string }> = [];
    let safetyBatches = 0;

    while (safetyBatches < 50) {
      safetyBatches += 1;
      const batchRes: any = await apiFetch(endpoint, {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify({
          ...(grandLineId ? { grandLineId } : {}),
          ...(cursor ? { cursor } : {}),
          limit: 10,
        }),
      });

      if (safetyBatches === 1) {
        total = Number(batchRes?.total ?? batchRes?.regenerated ?? batchRes?.regeneratedCount ?? 0);
      }
      const batchRegen = Number(batchRes?.regenerated ?? batchRes?.regeneratedCount ?? 0);
      const batchFailed = Number(batchRes?.failed ?? 0);
      regenerated += batchRegen;
      failed += batchFailed;
      if (batchRes?.signatureVersion !== undefined) {
        signatureVersion = Number(batchRes.signatureVersion);
      }
      if (Array.isArray(batchRes?.errors)) {
        errors.push(...batchRes.errors);
      }

      if (!batchRes?.hasMore || !batchRes?.nextCursor || batchRegen + batchFailed === 0) {
        break;
      }
      cursor = String(batchRes.nextCursor);
    }

    return {
      ok: true,
      total: Math.max(total, regenerated + failed),
      regenerated,
      regeneratedCount: regenerated,
      failed,
      errors,
      signatureVersion,
    };
  } catch (err: any) {
    console.error(`[CertificateService] Error (${err?.code || 'ADMIN_CERT_REGEN_ALL'}) at ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Admin only: Revoke or restore a certificate (`POST /api/admin/certificates/:id/revoke`).
 */
export async function toggleRevokeCertificate(
  certificateId: string,
  status?: 'active' | 'revoked'
): Promise<{
  ok: boolean;
  id: string;
  serial: string;
  status: 'active' | 'revoked';
}> {
  const endpoint = `/api/admin/certificates/${encodeURIComponent(certificateId)}/revoke`;
  try {
    return await apiFetch(endpoint, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(status ? { status } : {}),
    });
  } catch (err: any) {
    console.error(`[CertificateService] Error (${err?.code || 'ADMIN_CERT_REVOKE'}) at ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Admin or Mock Captain: Finalise Grand Line mock results and issue 1st-position certificates
 * (`POST /api/tests/:id/finalise`).
 */
export async function finaliseGrandLineMockResults(
  testId: string,
  certificateThemeId?: string | null
): Promise<{
  ok: boolean;
  testId: string;
  resultsFinalised: boolean;
  alreadyFinalised: boolean;
  participantsCount: number;
  issuedCount: number;
  existingCount: number;
  certificates: any[];
}> {
  const endpoint = `/api/tests/${encodeURIComponent(testId)}/finalise`;
  try {
    return await apiFetch(endpoint, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(
        certificateThemeId !== undefined ? { certificateThemeId } : {}
      ),
    });
  } catch (err: any) {
    console.error(`[CertificateService] Error (${err?.code || 'MOCK_FINALISE'}) at ${endpoint}:`, err);
    throw err;
  }
}

export const finaliseGrandLineTest = finaliseGrandLineMockResults;

/**
 * Admin or Mock Captain: Save `certificate_theme_id` on a Grand Line mock (`PUT /api/tests/:id`).
 */
export async function updateGrandLineCertificateTheme(
  testId: string,
  certificateThemeId: string | null
): Promise<{ ok: boolean; id: string; certificateThemeId: string | null }> {
  const endpoint = `/api/tests/${encodeURIComponent(testId)}`;
  try {
    return await apiFetch(endpoint, {
      method: 'PUT',
      requireAuth: true,
      body: JSON.stringify({
        certificateThemeId:
          !certificateThemeId || certificateThemeId === 'auto' ? null : certificateThemeId,
      }),
    });
  } catch (err: any) {
    console.error(`[CertificateService] Error (${err?.code || 'MOCK_THEME_SAVE'}) at ${endpoint}:`, err);
    throw err;
  }
}
