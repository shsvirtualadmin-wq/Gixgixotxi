import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  runTransaction,
  serverTimestamp,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from './useUserProfile';

export interface CrewMember {
  uid: string;
  displayName: string;
  email: string;
  joinedAt: string;
  role: 'leader' | 'member';
  activeToday?: boolean;
  questionsSolved?: number;
  streak?: number;
  isPro?: boolean;
}

export interface CrewDoc {
  id: string;
  name: string;
  code: string;
  leaderId: string;
  leaderName: string;
  goalQuestions: number;
  currentQuestions: number;
  members: CrewMember[];
  memberUids: string[];
  maxMembers: number; // 30
  isLocked: boolean;
  streak: number;
  hasProMember?: boolean;
  weakChapters?: { chapter: string; errorCount: number }[];
  createdAt?: unknown;
}

export function generateCrewCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export function useStudyCrew() {
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [crew, setCrew] = useState<CrewDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to the crew document
  useEffect(() => {
    if (!user) {
      setCrew(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe: (() => void) | undefined;

    const attachListener = async () => {
      try {
        let crewId = profile?.crewId;

        // If no crewId on profile, try querying by memberUids or leaderId
        if (!crewId) {
          const qLeader = query(collection(db, 'crews'), where('leaderId', '==', user.uid));
          const snapLeader = await getDocs(qLeader);
          if (!snapLeader.empty) {
            crewId = snapLeader.docs[0].id;
          } else {
            const qMember = query(
              collection(db, 'crews'),
              where('memberUids', 'array-contains', user.uid)
            );
            const snapMember = await getDocs(qMember);
            if (!snapMember.empty) {
              crewId = snapMember.docs[0].id;
            }
          }
        }

        if (!crewId) {
          setCrew(null);
          setLoading(false);
          return;
        }

        const crewRef = doc(db, 'crews', crewId);
        unsubscribe = onSnapshot(
          crewRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setCrew({ id: snap.id, ...data } as CrewDoc);
            } else {
              setCrew(null);
            }
            setLoading(false);
          },
          (err) => {
            console.warn('[useStudyCrew] Snapshot error:', err);
            setError(err.message);
            setLoading(false);
          }
        );
      } catch (err: unknown) {
        console.warn('[useStudyCrew] Load error:', err);
        setLoading(false);
      }
    };

    attachListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, profile?.crewId]);

  // Create Crew with transaction / validation
  const createCrew = useCallback(
    async (name: string): Promise<CrewDoc> => {
      if (!user) throw new Error('You must be signed in to create a crew.');
      if (!name.trim()) throw new Error('Please provide a valid crew name.');
      if (crew || profile?.crewId) {
        throw new Error('You are already in a study crew. Leave your current crew first.');
      }

      setError(null);
      const code = generateCrewCode();
      const displayName = user.displayName || user.email?.split('@')[0] || 'Leader';
      const isPro = Boolean(profile?.plan === 'pro' || profile?.isPremium);

      const leaderMember: CrewMember = {
        uid: user.uid,
        displayName,
        email: user.email || '',
        joinedAt: new Date().toISOString(),
        role: 'leader',
        activeToday: true,
        questionsSolved: 20,
        streak: profile?.streak || 1,
        isPro,
      };

      // Create new crew document with unique ID
      const newCrewRef = doc(collection(db, 'crews'));
      const newCrewData = {
        id: newCrewRef.id,
        name: name.trim(),
        code,
        leaderId: user.uid,
        leaderName: displayName,
        goalQuestions: 500,
        currentQuestions: 20,
        members: [leaderMember],
        memberUids: [user.uid],
        maxMembers: 30, // Max 30 enforced
        isLocked: false,
        streak: 1,
        hasProMember: isPro,
        createdAt: serverTimestamp(),
        weakChapters: [
          { chapter: 'Calculus & Integration', errorCount: 14 },
          { chapter: 'Electromagnetism', errorCount: 9 },
        ],
      };

      await setDoc(newCrewRef, newCrewData);

      // Link to user profile
      await setDoc(
        doc(db, 'users', user.uid),
        {
          isCrewMember: true,
          crewId: newCrewRef.id,
          crewName: name.trim(),
          role: 'crew',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const created = { ...newCrewData, id: newCrewRef.id } as CrewDoc;
      setCrew(created);
      return created;
    },
    [user, crew, profile]
  );

  // Join Crew using runTransaction enforcing max 30 and single crew rule
  const joinCrewByCode = useCallback(
    async (code: string): Promise<CrewDoc> => {
      if (!user) throw new Error('You must be signed in to join a crew.');
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) throw new Error('Please enter a valid invite code.');

      setError(null);

      // 1. Find crew by code
      const q = query(collection(db, 'crews'), where('code', '==', cleanCode));
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error(`No crew found with code "${cleanCode}". Please verify the code.`);
      }

      const crewDocSnapshot = snap.docs[0];
      const crewRef = crewDocSnapshot.ref;

      // 2. Execute atomic transaction to prevent race conditions on the 30-member limit
      await runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await transaction.get(userDocRef);
        const userData = userSnap.data() || {};

        if (userData.crewId && userData.crewId !== crewDocSnapshot.id) {
          throw new Error('You are already a member of another crew. Please leave it before joining a new one.');
        }

        const freshCrewSnap = await transaction.get(crewRef);
        if (!freshCrewSnap.exists()) {
          throw new Error('This crew is no longer available.');
        }

        const freshData = freshCrewSnap.data() as CrewDoc;

        if (freshData.isLocked === true) {
          throw new Error('Invites are currently locked by the crew leader.');
        }

        const currentMembers: CrewMember[] = freshData.members || [];
        const memberUids: string[] = freshData.memberUids || [];

        // Already joined
        if (memberUids.includes(user.uid) || currentMembers.some((m) => m.uid === user.uid)) {
          return;
        }

        // Strict Max 30 enforcement
        if (currentMembers.length >= 30 || memberUids.length >= 30) {
          throw new Error('This crew has reached its maximum capacity of 30 members.');
        }

        const isUserPro = Boolean(userData.plan === 'pro' || userData.isPremium || profile?.plan === 'pro');
        const newMember: CrewMember = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Crew Member',
          email: user.email || '',
          joinedAt: new Date().toISOString(),
          role: 'member',
          activeToday: true,
          questionsSolved: 15,
          streak: userData.streak || 1,
          isPro: isUserPro,
        };

        const updatedMembers = [...currentMembers, newMember];
        const updatedUids = Array.from(new Set([...memberUids, user.uid]));
        const hasPro = freshData.hasProMember || isUserPro;

        transaction.update(crewRef, {
          members: updatedMembers,
          memberUids: updatedUids,
          hasProMember: hasPro,
          currentQuestions: (freshData.currentQuestions || 0) + 15,
          updatedAt: serverTimestamp(),
        });

        transaction.set(
          userDocRef,
          {
            isCrewMember: true,
            crewId: freshCrewSnap.id,
            crewName: freshData.name,
            role: 'crew',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      const updatedSnap = await getDoc(crewRef);
      const updatedCrew = { id: updatedSnap.id, ...updatedSnap.data() } as CrewDoc;
      setCrew(updatedCrew);
      return updatedCrew;
    },
    [user, profile]
  );

  // Leave Crew
  const leaveCrew = useCallback(async () => {
    if (!user || !crew) return;
    setError(null);

    const isLeader = crew.leaderId === user.uid;
    const remainingMembers = (crew.members || []).filter((m) => m.uid !== user.uid);

    if (isLeader && remainingMembers.length > 0) {
      throw new Error('Please transfer leadership to another member before leaving the crew.');
    }

    const crewRef = doc(db, 'crews', crew.id);

    if (remainingMembers.length === 0) {
      // Sole member leaving: disband crew
      await deleteDoc(crewRef);
    } else {
      // Remove from members
      const updatedUids = (crew.memberUids || []).filter((id) => id !== user.uid);
      const remainingHasPro = remainingMembers.some((m) => m.isPro === true);
      await setDoc(
        crewRef,
        {
          members: remainingMembers,
          memberUids: updatedUids,
          hasProMember: remainingHasPro,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    // Reset user doc
    await setDoc(
      doc(db, 'users', user.uid),
      {
        isCrewMember: false,
        crewId: null,
        crewName: null,
        role: 'student',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setCrew(null);
  }, [user, crew]);

  // Transfer Leadership
  const transferLeadership = useCallback(
    async (newLeaderUid: string) => {
      if (!user || !crew || crew.leaderId !== user.uid) {
        throw new Error('Only the current leader can transfer leadership.');
      }

      const targetMember = crew.members.find((m) => m.uid === newLeaderUid);
      if (!targetMember) throw new Error('Selected member is not in this crew.');

      const updatedMembers = crew.members.map((m) => ({
        ...m,
        role: (m.uid === newLeaderUid ? 'leader' : m.uid === user.uid ? 'member' : m.role) as 'leader' | 'member',
      }));

      const crewRef = doc(db, 'crews', crew.id);
      await setDoc(
        crewRef,
        {
          leaderId: newLeaderUid,
          leaderName: targetMember.displayName,
          members: updatedMembers,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [user, crew]
  );

  // Toggle Invite Lock
  const toggleLock = useCallback(async () => {
    if (!user || !crew || crew.leaderId !== user.uid) {
      throw new Error('Only the leader can change invite lock.');
    }
    const crewRef = doc(db, 'crews', crew.id);
    await setDoc(
      crewRef,
      {
        isLocked: !crew.isLocked,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }, [user, crew]);

  // Regenerate Invite Code
  const regenerateCode = useCallback(async () => {
    if (!user || !crew || crew.leaderId !== user.uid) {
      throw new Error('Only the leader can regenerate invite code.');
    }
    const newCode = generateCrewCode();
    const crewRef = doc(db, 'crews', crew.id);
    await setDoc(
      crewRef,
      {
        code: newCode,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return newCode;
  }, [user, crew]);

  // Kick member (leader only)
  const kickMember = useCallback(
    async (memberUid: string) => {
      if (!user || !crew || crew.leaderId !== user.uid) {
        throw new Error('Only the leader can remove members.');
      }
      if (memberUid === user.uid) return;

      const remainingMembers = crew.members.filter((m) => m.uid !== memberUid);
      const remainingUids = (crew.memberUids || []).filter((id) => id !== memberUid);
      const remainingHasPro = remainingMembers.some((m) => m.isPro === true);

      const crewRef = doc(db, 'crews', crew.id);
      await setDoc(
        crewRef,
        {
          members: remainingMembers,
          memberUids: remainingUids,
          hasProMember: remainingHasPro,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Reset kicked user's profile
      await setDoc(
        doc(db, 'users', memberUid),
        {
          isCrewMember: false,
          crewId: null,
          crewName: null,
          role: 'student',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [user, crew]
  );

  return {
    crew,
    loading,
    error,
    createCrew,
    joinCrewByCode,
    leaveCrew,
    transferLeadership,
    toggleLock,
    regenerateCode,
    kickMember,
  };
}

export default useStudyCrew;
