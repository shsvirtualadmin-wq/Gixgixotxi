import { api } from '@/lib/api';
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
 * Checks if a candidate username is available in D1 (`usernames` + `users`).
 */
export async function checkUsernameAvailability(
  rawUsername: string,
  currentUid?: string | null,
  isUserAdmin = false
): Promise<UsernameCheckResult> {
  const clean = rawUsername.trim().toLowerCase();

  const formatValidation = validateUsernameFormat(clean, currentUid, isUserAdmin);
  if (!formatValidation.valid) {
    return {
      available: false,
      error: formatValidation.error,
      isReserved: formatValidation.isReserved,
    };
  }

  try {
    const params = new URLSearchParams({ username: clean });
    if (currentUid) params.set('uid', currentUid);

    const res = await api.get<{
      available: boolean;
      isCurrent?: boolean;
      error?: string;
    }>(`/api/usernames/check?${params.toString()}`, { silentToast: true });

    if (res && typeof res.available === 'boolean') {
      if (res.isCurrent) {
        return { available: true, isCurrent: true };
      }
      if (!res.available) {
        return { available: false, error: res.error || 'This username is already taken.' };
      }
      return { available: true };
    }
    return { available: true };
  } catch (err) {
    console.warn('[userService] Error checking username availability in D1:', err);
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
 * Saves user profile identity: role, nickname, username in D1 (`users`, `usernames`, `public_profiles`).
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

  const nicknameVal = validateNickname(cleanNickname, uid, isUserAdmin);
  if (!nicknameVal.valid) {
    return { success: false, error: nicknameVal.error };
  }

  const usernameVal = await checkUsernameAvailability(cleanUsername, uid, isUserAdmin);
  if (!usernameVal.available && !usernameVal.isCurrent) {
    return { success: false, error: usernameVal.error || 'Username is not available.' };
  }

  const effectiveRole = isUserAdmin
    ? 'superadmin'
    : role === 'Other'
    ? customRole || 'Other'
    : role;

  try {
    await api.post('/api/users/identity', {
      role: effectiveRole,
      customRole: role === 'Other' ? customRole : null,
      nickname: cleanNickname,
      username: cleanUsername,
      previousUsername: params.previousUsername || null,
    });
  } catch (err: unknown) {
    const msg = (err as Error)?.message || 'Failed to save identity.';
    return { success: false, error: msg };
  }

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
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to submit name request.' };
  }
}
