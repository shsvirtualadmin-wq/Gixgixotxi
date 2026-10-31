import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { deleteUser as deleteAuthUser, signOut } from 'firebase/auth';

/**
 * Completely wipes a student's personal data across all Firestore collections,
 * disbands or cleans up their crew membership, and deletes their auth account.
 */
export async function wipeStudentAccount(uid: string): Promise<void> {
  // 1. Fetch user profile to check crew and role status
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() : null;

  const crewId = userData?.crewId;

  // 2. Handle Crew Leadership / Membership
  if (crewId) {
    try {
      const crewRef = doc(db, 'crews', crewId);
      const crewSnap = await getDoc(crewRef);

      if (crewSnap.exists()) {
        const crewData = crewSnap.data();
        const isLeader = crewData.leaderId === uid;

        if (isLeader) {
          // Disband the crew: clear crewId for all remaining members and delete crew doc
          const memberUids: string[] = crewData.memberUids || [];
          for (const mUid of memberUids) {
            if (mUid !== uid) {
              try {
                await updateDoc(doc(db, 'users', mUid), {
                  crewId: null,
                  isCrewMember: false,
                  crewName: null,
                });
              } catch {
                // Ignore per-user failures
              }
            }
          }
          await deleteDoc(crewRef);
        } else {
          // Remove student from crew members list
          const remainingMembers = (crewData.members || []).filter((m: { uid: string }) => m.uid !== uid);
          const remainingUids = (crewData.memberUids || []).filter((id: string) => id !== uid);
          await updateDoc(crewRef, {
            members: remainingMembers,
            memberUids: remainingUids,
          });
        }
      }
    } catch (err) {
      console.warn('[wipeStudentAccount] Crew cleanup warning:', err);
    }
  }

  // 3. Delete personal attempts & test results
  try {
    const attemptsSnap = await getDocs(
      query(collection(db, 'attempts'), where('userId', '==', uid))
    );
    for (const d of attemptsSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.warn('[wipeStudentAccount] Attempts cleanup warning:', err);
  }

  // 4. Delete applications (crew and captain)
  try {
    const appsSnap = await getDocs(
      query(collection(db, 'applications'), where('userId', '==', uid))
    );
    for (const d of appsSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.warn('[wipeStudentAccount] Applications cleanup warning:', err);
  }

  // 5. Delete referral document if student was referred
  try {
    await deleteDoc(doc(db, 'referrals', uid));
  } catch {
    // Ignore if not present
  }

  // 6. Delete join requests submitted by user
  try {
    const reqSnap = await getDocs(
      query(collection(db, 'crew_requests'), where('studentUid', '==', uid))
    );
    for (const d of reqSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch {
    // Ignore
  }

  // 7. Delete user profile document
  await deleteDoc(userRef);

  // 8. Delete Firebase Auth user if current user matches
  const currentUser = auth.currentUser;
  if (currentUser && currentUser.uid === uid) {
    try {
      await deleteAuthUser(currentUser);
    } catch {
      // If requires recent login, sign out as fallback
      await signOut(auth);
    }
  }
}
