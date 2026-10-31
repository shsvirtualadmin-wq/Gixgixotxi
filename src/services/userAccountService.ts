import { auth } from '@/lib/firebase';
import { deleteUser as deleteAuthUser, signOut } from 'firebase/auth';
import { api } from '@/lib/api';

/**
 * Completely wipes a student's personal data in Cloudflare D1,
 * disbands or cleans up their crew membership, and deletes their Firebase Auth account.
 */
export async function wipeStudentAccount(uid: string): Promise<void> {
  await api.post('/api/users/me/wipe', { uid });

  const currentUser = auth.currentUser;
  if (currentUser && currentUser.uid === uid) {
    try {
      await deleteAuthUser(currentUser);
    } catch {
      await signOut(auth);
    }
  }
}
