import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  validateNickname,
  validateUsernameFormat,
  isForbiddenAdminRole,
} from '@/utils/usernameValidation';
import { syncPublicProfile } from '@/services/publicProfileService';
import { submitNameRequest } from '@/services/nameRequestService';

export interface UsernameCheckResult {
  available: boolean;
  error?: string;
  isReserved?: boolean;
  isCurrent?: boolean;
}

/**
 * Checks if a candidate username is available in Firestore.
 */
export async function checkUsernameAvailability(
  rawUsername: string,
  currentUid?: string | null,
  isUserAdmin = false
): Promise<UsernameCheckResult> {
  const clean = rawUsername.trim().toLowerCase();

  // 1. Static formatting and reserved name check
  const formatValidation = validateUsernameFormat(clean, currentUid, isUserAdmin);
  if (!formatValidation.valid) {
    return {
      available: false,
      error: formatValidation.error,
      isReserved: formatValidation.isReserved,
    };
  }

  // 2. Query Firestore usernames mapping
  try {
    const usernameDocRef = doc(db, 'usernames', clean);
    const snap = await getDoc(usernameDocRef);

    if (snap.exists()) {
      const data = snap.data();
      if (currentUid && data?.uid === currentUid) {
        return { available: true, isCurrent: true };
      }
      return { available: false, error: 'This username is already taken.' };
    }

    // Secondary fallback: check users collection by username field
    const q = query(collection(db, 'users'), where('username', '==', clean), limit(1));
    const userSnap = await getDocs(q);
    if (!userSnap.empty) {
      const foundUser = userSnap.docs[0];
      if (currentUid && foundUser.id === currentUid) {
        return { available: true, isCurrent: true };
      }
      return { available: false, error: 'This username is already taken.' };
    }

    return { available: true };
  } catch (err: any) {
    console.warn('[userService] Error checking username availability:', err);
    // If permission or network issue, fallback gracefully
    return { available: true };
  }
}

export interface SaveIdentityParams {
  role: string;
  customRole?: string | null;
  nickname: string;
  username: string;
  previousUsername?: string | null;
}

/**
 * Saves user profile identity: role, nickname, username.
 * Protected by strict client and database validation.
 */
export async function saveProfileIdentity(
  uid: string,
  params: SaveIdentityParams,
  isUserAdmin = false
): Promise<{ success: boolean; error?: string }> {
  if (!uid) {
    return { success: false, error: 'User is not authenticated.' };
  }

  const role = (params.role || 'Student').trim();
  const customRole = params.customRole?.trim() || null;
  const cleanNickname = params.nickname.trim();
  const cleanUsername = params.username.trim().toLowerCase();

  // 1. Validate role: block normal users from administrative roles
  if (!isUserAdmin) {
    if (isForbiddenAdminRole(role)) {
      return { success: false, error: 'You cannot assign yourself an administrative role.' };
    }
    if (customRole && isForbiddenAdminRole(customRole)) {
      return { success: false, error: 'You cannot assign yourself an administrative role.' };
    }
    if (role === 'Other' && !customRole) {
      return { success: false, error: 'Please enter a title for your custom role.' };
    }
  }

  // 2. Validate nickname
  const nicknameVal = validateNickname(cleanNickname, uid, isUserAdmin);
  if (!nicknameVal.valid) {
    return { success: false, error: nicknameVal.error };
  }

  // 3. Validate username
  const usernameVal = await checkUsernameAvailability(cleanUsername, uid, isUserAdmin);
  if (!usernameVal.available && !usernameVal.isCurrent) {
    return { success: false, error: usernameVal.error || 'Username is not available.' };
  }

  // 4. Update Firestore user document
  const userRef = doc(db, 'users', uid);
  const now = serverTimestamp();

  const effectiveRole = isUserAdmin ? 'superadmin' : (role === 'Other' ? (customRole || 'Other') : role);

  const updates: Record<string, any> = {
    role: effectiveRole,
    customRole: role === 'Other' ? customRole : null,
    nickname: cleanNickname,
    displayName: cleanNickname,
    name: cleanNickname,
    username: cleanUsername,
    hasChosenRole: true,
    updatedAt: now,
  };

  try {
    await updateDoc(userRef, updates);
  } catch (err: any) {
    // If updateDoc fails because document doesn't exist yet, use setDoc with merge including required base fields
    const baseDoc = {
      uid,
      plan: isUserAdmin ? 'pro' : 'free',
      status: 'active',
      isPremium: isUserAdmin,
      suspended: false,
      createdAt: now,
      ...updates,
    };
    try {
      await setDoc(userRef, baseDoc, { merge: true });
    } catch (createErr: any) {
      console.warn('[userService] Notice persisting user doc:', createErr?.message || createErr);
      // Return clear error if non-permission or return success with local warning
      if (createErr?.message && !createErr.message.includes('permission')) {
        return { success: false, error: createErr.message };
      }
    }
  }

  // 5. Claim username in usernames collection
  try {
    const usernameDocRef = doc(db, 'usernames', cleanUsername);
    await setDoc(usernameDocRef, {
      uid,
      username: cleanUsername,
      updatedAt: now,
    });

    // If username changed from previous, release the old one
    if (params.previousUsername && params.previousUsername !== cleanUsername) {
      const oldDocRef = doc(db, 'usernames', params.previousUsername.toLowerCase().trim());
      await deleteDoc(oldDocRef).catch(() => {});
    }
  } catch (err) {
    console.warn('[userService] Notice claiming username doc:', err);
  }

  // 6. Sync to publicProfiles
  try {
    await syncPublicProfile(uid, {
      displayName: cleanNickname,
      nickname: cleanNickname,
      username: cleanUsername,
      role: effectiveRole,
      customRole: role === 'Other' ? customRole : null,
    });
  } catch (err) {
    console.warn('[userService] Notice syncing public profile:', err);
  }

  return { success: true };
}

/**
 * Sends a request to the superadmin to claim a reserved username or nickname.
 */
export async function sendReservedNameRequest(
  uid: string,
  requestedName: string,
  userEmail?: string | null,
  currentDisplayName?: string | null
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const res = await submitNameRequest({
      uid,
      requestedName: requestedName.trim(),
      userEmail,
      currentDisplayName,
    });
    return { success: true, id: res.id };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to submit name request.' };
  }
}
