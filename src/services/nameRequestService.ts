import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { syncPublicProfile } from '@/services/publicProfileService';
import {
  notifyApplicationSubmitted,
  notifyApplicationDecision,
} from '@/services/emailNotificationService';

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
 * Submits a new display name request to the admin for review.
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

  const cleanRequested = params.requestedName.trim();
  const requestRef = doc(collection(db, 'nameRequests'));

  const data: Omit<NameRequestDoc, 'id'> = {
    uid: params.uid,
    requestedName: cleanRequested,
    currentDisplayName: params.currentDisplayName || undefined,
    userEmail: params.userEmail || undefined,
    status: 'pending',
    createdAt: serverTimestamp(),
  };

  await setDoc(requestRef, data);

  notifyApplicationSubmitted({
    applicationId: requestRef.id,
    programName: `Reserved Display Name ("${cleanRequested}")`,
    applicantName: params.currentDisplayName || cleanRequested,
    applicantEmail: params.userEmail || undefined,
    statement: `Requested official display name: ${cleanRequested}`,
    reviewPath: '/admin/users',
  });

  return { success: true, id: requestRef.id };
}

/**
 * Fetches all name requests for the admin panel.
 */
export async function fetchNameRequests(filterStatus?: 'pending' | 'approved' | 'rejected' | 'all'): Promise<NameRequestDoc[]> {
  try {
    const colRef = collection(db, 'nameRequests');
    let q;

    if (filterStatus && filterStatus !== 'all') {
      q = query(colRef, where('status', '==', filterStatus), orderBy('createdAt', 'desc'));
    } else {
      q = query(colRef, orderBy('createdAt', 'desc'));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<NameRequestDoc, 'id'>),
    }));
  } catch (err) {
    console.warn('[nameRequestService] error fetching name requests:', err);
    // Fallback without orderBy if index is still building
    try {
      const snap = await getDocs(collection(db, 'nameRequests'));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<NameRequestDoc, 'id'>),
      }));
      if (filterStatus && filterStatus !== 'all') {
        return list.filter((r) => r.status === filterStatus);
      }
      return list;
    } catch {
      return [];
    }
  }
}

/**
 * Approves a name request:
 * 1. Sets status to 'approved' in nameRequests/{requestId}
 * 2. Updates users/{uid} displayName
 * 3. Updates publicProfiles/{uid} displayName
 */
export async function approveNameRequest(
  requestId: string,
  uid: string,
  approvedName: string,
  reviewerEmail?: string | null
): Promise<{ success: boolean }> {
  const requestRef = doc(db, 'nameRequests', requestId);
  const userRef = doc(db, 'users', uid);
  const now = serverTimestamp();

  // 1. Update request status
  await updateDoc(requestRef, {
    status: 'approved',
    reviewedAt: now,
    reviewedBy: reviewerEmail || 'admin',
  });

  // 2. Update student account
  try {
    await updateDoc(userRef, {
      displayName: approvedName,
      updatedAt: now,
    });
  } catch (err) {
    console.warn('[nameRequestService] update user displayName error:', err);
  }

  // 3. Sync to publicProfiles
  try {
    await syncPublicProfile(uid, {
      displayName: approvedName,
    });
  } catch (err) {
    console.warn('[nameRequestService] sync public profile error:', err);
  }

  notifyApplicationDecision({
    applicationId: requestId,
    studentUid: uid,
    applicantName: approvedName,
    programName: `Display Name Request ("${approvedName}")`,
    decision: 'approved',
    codeOrBadge: approvedName,
    ctaPath: '/dashboard/settings',
  });

  return { success: true };
}

/**
 * Rejects a name request.
 */
export async function rejectNameRequest(
  requestId: string,
  reviewerEmail?: string | null
): Promise<{ success: boolean }> {
  const requestRef = doc(db, 'nameRequests', requestId);
  await updateDoc(requestRef, {
    status: 'rejected',
    reviewedAt: serverTimestamp(),
    reviewedBy: reviewerEmail || 'admin',
  });

  return { success: true };
}
