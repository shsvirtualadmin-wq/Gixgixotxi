import { api } from '@/lib/api';
import type { Certificate, CertificateSignatureRecord, VerifyCertificateResult } from '@/types/certificate';

export interface AdminCertificatesResponse {
  certificates: Certificate[];
  activeSignature: CertificateSignatureRecord | null;
  hasActiveSignature: boolean;
  totalCount: number;
}

export interface AdminSignatureResponse {
  activeSignature: CertificateSignatureRecord | null;
  history: CertificateSignatureRecord[];
}

/**
 * Fetch current student's certificates (1st position Grand Line awards)
 */
export async function getMyCertificates(): Promise<Certificate[]> {
  try {
    const data = await api.get<{ certificates: Certificate[] }>('/api/certificates/mine', {
      requireAuth: true,
      silentErrorToast: true,
    });
    return data.certificates || [];
  } catch (err) {
    console.warn('Failed to load certificates:', err);
    return [];
  }
}

/**
 * Fetch certificate public verification details by serial
 */
export async function verifyCertificatePublic(serial: string): Promise<VerifyCertificateResult | null> {
  try {
    const data = await api.get<{ certificate: VerifyCertificateResult }>(
      `/api/certificates/public/${encodeURIComponent(serial)}`,
      {
        requireAuth: false,
        silentErrorToast: true,
      }
    );
    return data.certificate || null;
  } catch (err) {
    console.warn('Verification lookup failed:', err);
    return null;
  }
}

/**
 * Admin: Get all issued certificates and active signature status
 */
export async function getAdminCertificates(): Promise<AdminCertificatesResponse> {
  const data = await api.get<AdminCertificatesResponse>('/api/admin/certificates', {
    requireAuth: true,
  });
  return {
    certificates: data.certificates || [],
    activeSignature: data.activeSignature || null,
    hasActiveSignature: Boolean(data.hasActiveSignature || data.activeSignature),
    totalCount: Number(data.totalCount || (data.certificates || []).length),
  };
}

/**
 * Admin: Regenerate a certificate with latest mock name and/or signature
 */
export async function regenerateCertificateAdmin(
  certificateId: string,
  options?: { useCurrentSignature?: boolean }
): Promise<Certificate> {
  const data = await api.post<{ certificate: Certificate }>(
    `/api/admin/certificates/${encodeURIComponent(certificateId)}/regenerate`,
    options || {},
    { requireAuth: true }
  );
  return data.certificate;
}

/**
 * Admin: Revoke or restore certificate
 */
export async function toggleRevokeCertificateAdmin(
  certificateId: string,
  revoke: boolean
): Promise<Certificate> {
  const data = await api.post<{ certificate: Certificate }>(
    `/api/admin/certificates/${encodeURIComponent(certificateId)}/revoke`,
    { revoke },
    { requireAuth: true }
  );
  return data.certificate;
}

/**
 * Admin: Regenerate all issued certificates with the current active signature
 */
export async function regenerateAllCertificatesAdmin(): Promise<{ updatedCount: number }> {
  const data = await api.post<{ updatedCount: number }>(
    '/api/admin/certificates/regenerate-all',
    {},
    { requireAuth: true }
  );
  return { updatedCount: data.updatedCount || 0 };
}

/**
 * Admin: Fetch active signature and version history
 */
export async function getAdminSignature(): Promise<AdminSignatureResponse> {
  const data = await api.get<AdminSignatureResponse>('/api/admin/signature', {
    requireAuth: true,
  });
  return {
    activeSignature: data.activeSignature || null,
    history: data.history || [],
  };
}

/**
 * Admin: Save new signature version
 */
export async function saveAdminSignature(payload: {
  signatoryName: string;
  signatoryTitle: string;
  signatureDataUrl: string;
}): Promise<CertificateSignatureRecord> {
  const data = await api.post<{ signature: CertificateSignatureRecord }>(
    '/api/admin/signature',
    payload,
    { requireAuth: true }
  );
  return data.signature;
}

/**
 * Admin: Remove active signature
 */
export async function removeAdminSignature(): Promise<void> {
  await api.delete('/api/admin/signature', { requireAuth: true });
}

/**
 * Admin / System: Finalize mock results and automatically issue 1st position certificates
 */
export async function finalizeMockCertificates(
  testId: string
): Promise<{ certificates: Certificate[]; count: number }> {
  const data = await api.post<{ certificates: Certificate[]; count: number }>(
    `/api/tests/${encodeURIComponent(testId)}/finalize-certificates`,
    {},
    { requireAuth: true }
  );
  return {
    certificates: data.certificates || [],
    count: data.count || 0,
  };
}
