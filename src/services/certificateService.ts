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
  r2Key: string;
  signatoryName: string;
  signatoryTitle: string;
  version: number;
  uploadedBy: string;
  createdAt: number;
  active: boolean;
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

/**
 * Admin only: Fetch active signature and version history (`GET /api/admin/signatures`).
 */
export async function fetchAdminSignatures(): Promise<{
  hasActiveSignature: boolean;
  activeSignature: AdminSignatureRecord | null;
  history: AdminSignatureRecord[];
}> {
  const endpoint = '/api/admin/signatures';
  try {
    return await apiFetch(endpoint, { requireAuth: true });
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
    return await apiFetch(endpoint, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(params),
    });
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
    return await apiFetch(endpoint, {
      method: 'PUT',
      requireAuth: true,
      body: JSON.stringify(params),
    });
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
    return await apiFetch(endpoint, {
      method: 'POST',
      requireAuth: true,
    });
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
    return await apiFetch(endpoint, { requireAuth: true });
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
 * Admin only: Regenerate all certificates (or all for a mock) with the current active signature.
 */
export async function regenerateAllCertificates(grandLineId?: string): Promise<{
  ok: boolean;
  regeneratedCount: number;
  signatureVersion: number;
}> {
  const endpoint = '/api/admin/certificates/regenerate-all';
  try {
    return await apiFetch(endpoint, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({ grandLineId }),
    });
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
