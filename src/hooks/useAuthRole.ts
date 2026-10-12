import { useAuth } from '../context/AuthContext';
import { User } from 'firebase/auth';
import { StudentUserProfile } from '../lib/firebase';

export interface AuthRoleResult {
  user: User | null;
  profile: StudentUserProfile | null;
  isAdmin: boolean;
  loading: boolean;
}

export const MASTER_ADMIN_EMAIL = 'shsvirtualadmin@gmail.com';

/**
 * Checks if the given email is exactly the master admin email.
 * Comparison is strictly case-insensitive.
 */
export function isMasterAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === MASTER_ADMIN_EMAIL;
}

/**
 * Single source of truth for user authentication and admin privilege.
 * Admin privilege is granted ONLY when user.email is shsvirtualadmin@gmail.com.
 * Defaults to false and uses optional chaining so it never throws while user data is loading.
 */
export function useAuthRole(): AuthRoleResult {
  const auth = useAuth();
  const user = auth?.user || null;
  const profile = auth?.profile || null;
  const loading = Boolean(
    auth?.loading ||
    auth?.authLoading ||
    auth?.profileLoading ||
    !auth?.initialAuthChecked
  );

  const email = (user?.email || profile?.email || '').trim().toLowerCase();
  const isAdmin = email === MASTER_ADMIN_EMAIL;

  return {
    user,
    profile,
    isAdmin,
    loading,
  };
}

export default useAuthRole;
