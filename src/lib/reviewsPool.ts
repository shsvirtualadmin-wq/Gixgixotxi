import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { PLACEHOLDER_REVIEWS, PlaceholderReview } from '../data/placeholderReviews';

export const PLACEHOLDER_TARGET_TOTAL = 500;
export const SHOW_PLACEHOLDER_REVIEWS_DEFAULT = true;

export interface UnifiedReview {
  id: string;
  uid?: string;
  name: string;
  role: string;
  city?: string;
  rating: number;
  title?: string;
  text: string;
  date: string;
  isPlaceholder: boolean;
  isVerifiedStudent?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  tags?: string[];
  helpfulCount?: number;
}

// Deterministic Pseudo-Random Seeded Shuffle (LCG)
// Guarantees stable ordering across reloads so placeholders always disappear in fixed sequence
function getSeededOrder<T>(items: T[], seed = 42): T[] {
  const result = [...items];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const STABLE_SEEDED_PLACEHOLDERS: UnifiedReview[] = getSeededOrder(
  PLACEHOLDER_REVIEWS.map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    city: p.city,
    rating: p.rating,
    text: p.text,
    date: p.date,
    isPlaceholder: true as const,
    isVerifiedStudent: false,
    status: 'approved' as const,
  }))
);

/**
 * Pure Replacement Engine:
 * - Real approved reviews are placed first (newest first).
 * - Exactly (500 - realCount) placeholders are taken from the stable pool.
 * - Total displayed list is capped at 500 while placeholders exist.
 * - Once realCount >= 500, 0 placeholders are displayed.
 */
export function computeReviewsDisplayList(
  realReviews: UnifiedReview[],
  showPlaceholders = true,
  targetTotal = PLACEHOLDER_TARGET_TOTAL
): UnifiedReview[] {
  if (!showPlaceholders) {
    return realReviews;
  }

  const approvedReal = realReviews.filter((r) => r.status === 'approved' || !r.status);
  const placeholdersToShow = Math.max(0, targetTotal - approvedReal.length);
  const selectedPlaceholders = STABLE_SEEDED_PLACEHOLDERS.slice(0, placeholdersToShow);

  return [...approvedReal, ...selectedPlaceholders];
}

/**
 * Computes official aggregate statistics strictly from REAL approved reviews.
 * Placeholders NEVER affect average ratings, counts, or headlines!
 */
export function computeRealReviewsStats(realApprovedReviews: UnifiedReview[]) {
  const count = realApprovedReviews.length;
  if (count === 0) {
    return {
      averageRating: 0,
      totalCount: 0,
      starsCount: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      hasRealData: false,
    };
  }

  const sum = realApprovedReviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = Math.round((sum / count) * 10) / 10;

  const starsCount = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  realApprovedReviews.forEach((r) => {
    const starKey = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    starsCount[starKey] = (starsCount[starKey] || 0) + 1;
  });

  return {
    averageRating: avg,
    totalCount: count,
    starsCount,
    hasRealData: true,
  };
}

// ----------------------------------------------------
// Firestore Operations
// ----------------------------------------------------

export async function fetchApprovedReviewsFromFirestore(): Promise<UnifiedReview[]> {
  try {
    const coll = collection(db, 'reviews');
    const q = query(coll, where('status', '==', 'approved'), orderBy('createdAt', 'desc'), limit(500));
    const snap = await getDocs(q);

    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        uid: data.uid,
        name: data.name || 'Student',
        role: data.exam || 'Student',
        city: data.city || '',
        rating: data.rating || 5,
        title: data.title || '',
        text: data.text || '',
        date: data.createdAt ? data.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        isPlaceholder: false,
        isVerifiedStudent: Boolean(data.isVerifiedStudent),
        status: data.status || 'approved',
        tags: data.tags || [],
        helpfulCount: data.helpfulCount || 0,
      };
    });
  } catch (err) {
    console.warn('[reviewsPool] fetchApprovedReviews notice:', err);
    return [];
  }
}

export async function fetchUserReview(uid: string): Promise<UnifiedReview | null> {
  try {
    const userRef = doc(db, 'reviews', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      uid: data.uid,
      name: data.name || 'Student',
      role: data.exam || 'Student',
      city: data.city || '',
      rating: data.rating || 5,
      title: data.title || '',
      text: data.text || '',
      date: data.createdAt ? data.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      isPlaceholder: false,
      isVerifiedStudent: Boolean(data.isVerifiedStudent),
      status: data.status || 'pending',
      rejectionReason: data.rejectionReason || '',
      tags: data.tags || [],
    };
  } catch (err) {
    console.warn('[reviewsPool] fetchUserReview error:', err);
    return null;
  }
}

export async function submitStudentReview(reviewPayload: {
  uid: string;
  name: string;
  nameDisplayChoice: 'first_initial' | 'first_only' | 'anonymous';
  rating: number;
  title?: string;
  text: string;
  exam: string;
  city?: string;
  tags?: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const reviewRef = doc(db, 'reviews', reviewPayload.uid);
    await setDoc(reviewRef, {
      ...reviewPayload,
      status: 'pending',
      isVerifiedStudent: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (err: any) {
    console.error('[reviewsPool] submitStudentReview error:', err);
    return { success: false, error: err?.message || 'Failed to submit review' };
  }
}

export async function deleteStudentReview(uid: string): Promise<boolean> {
  try {
    const reviewRef = doc(db, 'reviews', uid);
    await deleteDoc(reviewRef);
    return true;
  } catch (err) {
    console.error('[reviewsPool] deleteStudentReview error:', err);
    return false;
  }
}

export async function fetchAllReviewsForAdmin(): Promise<UnifiedReview[]> {
  try {
    const coll = collection(db, 'reviews');
    const snap = await getDocs(coll);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        uid: data.uid,
        name: data.name || 'Student',
        role: data.exam || 'Student',
        city: data.city || '',
        rating: data.rating || 5,
        title: data.title || '',
        text: data.text || '',
        date: data.createdAt ? data.createdAt.slice(0, 10) : '',
        isPlaceholder: false,
        isVerifiedStudent: Boolean(data.isVerifiedStudent),
        status: data.status || 'pending',
        rejectionReason: data.rejectionReason || '',
        tags: data.tags || [],
      };
    });
  } catch (err) {
    console.warn('[reviewsPool] fetchAllReviewsForAdmin error:', err);
    return [];
  }
}

export async function moderateReviewInFirestore(
  reviewId: string,
  action: 'approve' | 'reject' | 'delete',
  adminUid: string,
  reviewAuthorUid: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  // CRITICAL MANDATE: Trying to approve your own review MUST fail
  if (action === 'approve' && adminUid === reviewAuthorUid) {
    return { success: false, error: 'Self-approval blocked: You cannot approve your own review.' };
  }

  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    if (action === 'delete') {
      await deleteDoc(reviewRef);
      return { success: true };
    }

    await updateDoc(reviewRef, {
      status: action === 'approve' ? 'approved' : 'rejected',
      rejectionReason: reason || '',
      moderatedBy: adminUid,
      moderatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Moderation action failed' };
  }
}

export async function fetchReviewConfig(): Promise<{ showPlaceholders: boolean }> {
  try {
    const cfgRef = doc(db, 'config', 'reviews');
    const snap = await getDoc(cfgRef);
    if (snap.exists()) {
      return { showPlaceholders: snap.data().showPlaceholders ?? true };
    }
    return { showPlaceholders: true };
  } catch {
    return { showPlaceholders: true };
  }
}

export async function updateReviewConfig(showPlaceholders: boolean): Promise<void> {
  try {
    const cfgRef = doc(db, 'config', 'reviews');
    await setDoc(cfgRef, { showPlaceholders, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('[reviewsPool] updateReviewConfig error:', err);
  }
}
