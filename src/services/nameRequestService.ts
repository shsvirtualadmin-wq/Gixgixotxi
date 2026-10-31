import { api } from '@/lib/api';

export interface NameRequestDoc {
  id: string;
  uid: string;
  requestedName: string;
  currentDisplayName?: string;
  userEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
}

/**
 * Submits a new display name request to the admin for review via D1.
 */
export async function submitNameRequest(params: {
  uid: string;
  requestedName: string;
  userEmail?: string | null;
  currentDisplayName?: string | null;
}): Promise<{ success: boolean; id: string }> {
  if (!params.uid || !params.requestedName.trim()) {
    throw new Error('User ID and requested name are required.');
  }

  const res = await api.post<{ success: boolean; id: string }>('/api/name-requests', {
    requestedName: params.requestedName.trim(),
    currentDisplayName: params.currentDisplayName || undefined,
    userEmail: params.userEmail || undefined,
  });

  return { success: true, id: res.id || '' };
}

/**
 * Fetches all name requests for the admin panel from D1.
 */
export async function fetchNameRequests(
  filterStatus?: 'pending' | 'approved' | 'rejected' | 'all'
): Promise<NameRequestDoc[]> {
  try {
    const qs = filterStatus && filterStatus !== 'all' ? `?status=${encodeURIComponent(filterStatus)}` : '';
    const res = await api.get<{ requests: NameRequestDoc[] }>(`/api/name-requests${qs}`);
    return Array.isArray(res.requests) ? res.requests : [];
  } catch (err) {
    console.warn('[nameRequestService] error fetching name requests:', err);
    return [];
  }
}

/**
 * Approves a name request in D1:
 * 1. Sets status to 'approved' in name_requests
 * 2. Updates users/{uid} displayName
 * 3. Updates public_profiles/{uid} displayName
 */
export async function approveNameRequest(
  requestId: string,
  uid: string,
  approvedName: string,
  reviewerEmail?: string | null
): Promise<{ success: boolean }> {
  await api.post(`/api/admin/name-requests/${encodeURIComponent(requestId)}/review`, {
    status: 'approved',
    uid,
    approvedName,
    reviewedBy: reviewerEmail || 'admin',
  });
  return { success: true };
}

/**
 * Rejects a name request in D1.
 */
export async function rejectNameRequest(
  requestId: string,
  reviewerEmail?: string | null
): Promise<{ success: boolean }> {
  await api.post(`/api/admin/name-requests/${encodeURIComponent(requestId)}/review`, {
    status: 'rejected',
    reviewedBy: reviewerEmail || 'admin',
  });
  return { success: true };
}
