import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDocs,
  getDocFromServer,
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
import { isSuperAdminEmailOrRole, clearPlanCache } from './useEffectivePlan';
import { debugTracker } from '@/utils/debugTracker';
import { MAX_CREW_MEMBERS } from '@/constants/limits';

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
  tier?: 'free' | 'paid';
  paid_until?: string | null;
  avatarKey?: string;
  avatarVariant?: string;
  joinMode?: 'direct' | 'request';
  minStreak?: number;
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
  const { user, updateLocalProfile } = useAuth();
  const { profile } = useUserProfile();

  const [crew, setCrew] = useState<CrewDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryCount((c) => c + 1);
  }, []);

  // Subscribe to the crew document with strict 8s timeout and safe-save error handling
  useEffect(() => {
    if (!user) {
      setCrew(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    debugTracker.recordCrewStep({
      action: 'crew_init_load',
      status: 'loading',
      details: `Resolving crew for uid ${user.uid.slice(0, 8)}...`,
    });

    let unsubscribe: (() => void) | undefined;

    // 8-second timeout guard to prevent infinite loading spinners
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[useStudyCrew] 8-second timeout reached while loading crew');
        debugTracker.recordCrewStep({
          action: 'crew_timeout',
          status: 'error',
          errorCode: 'TIMEOUT_8S',
          details: 'Firestore connection slow or query timed out after 8s',
        });
        setError('Crew loading took longer than expected. Click retry.');
        setLoading(false);
      }
    }, 8000);

    const attachListener = async () => {
      try {
        let crewId = profile?.crewId;

        // If no crewId directly on profile, query by leaderId or memberUids with fast timeout
        if (!crewId) {
          try {
            const qLeader = query(collection(db, 'crews'), where('leaderId', '==', user.uid));
            const snapLeader = await Promise.race([
              getDocs(qLeader),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
            ]);

            if (snapLeader && !snapLeader.empty) {
              crewId = snapLeader.docs[0].id;
            } else {
              const qMember = query(
                collection(db, 'crews'),
                where('memberUids', 'array-contains', user.uid)
              );
              const snapMember = await Promise.race([
                getDocs(qMember),
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
              ]);
              if (snapMember && !snapMember.empty) {
                crewId = snapMember.docs[0].id;
              }
            }
          } catch (lookupErr: unknown) {
            console.warn('[useStudyCrew] Secondary lookup error:', lookupErr);
          }
        }

        if (!isMounted) return;

        if (!crewId) {
          clearTimeout(timeoutId);
          setCrew(null);
          setLoading(false);
          debugTracker.recordCrewStep({
            action: 'crew_resolved',
            status: 'success',
            details: 'User is not currently in any crew',
          });
          return;
        }

        const crewRef = doc(db, 'crews', crewId);
        unsubscribe = onSnapshot(
          crewRef,
          (snap) => {
            if (!isMounted) return;
            clearTimeout(timeoutId);
            if (snap.exists()) {
              const data = snap.data();
              setCrew({ id: snap.id, ...data } as CrewDoc);
              debugTracker.recordCrewStep({
                action: 'crew_snapshot',
                status: 'success',
                details: `Crew "${data.name}" active (${data.members?.length || 1}/30 members)`,
              });
            } else {
              setCrew(null);
            }
            setLoading(false);
          },
          (err) => {
            if (!isMounted) return;
            clearTimeout(timeoutId);
            console.warn('[useStudyCrew] Snapshot error:', err);
            setError(err.message);
            setLoading(false);
            debugTracker.recordCrewStep({
              action: 'crew_snapshot_error',
              status: 'error',
              errorCode: err.code,
              details: err.message,
            });
          }
        );
      } catch (err: unknown) {
        if (!isMounted) return;
        clearTimeout(timeoutId);
        const msg = err instanceof Error ? err.message : 'Failed to connect to study crew.';
        console.warn('[useStudyCrew] Load error:', err);
        setError(msg);
        setLoading(false);
        debugTracker.recordCrewStep({
          action: 'crew_load_failed',
          status: 'error',
          details: msg,
        });
      }
    };

    attachListener();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };
  }, [user, profile?.crewId, retryCount]);

  // Create Crew with Safe-Save pattern & immediate UI optimistic feedback
  const createCrew = useCallback(
    async (name: string): Promise<CrewDoc> => {
      if (!user) throw new Error('You must be signed in to create a crew.');
      if (!name.trim()) throw new Error('Please provide a valid crew name.');
      if (crew || profile?.crewId) {
        throw new Error('You are already in a study crew. Leave your current crew first.');
      }

      setError(null);
      debugTracker.recordCrewStep({
        action: 'create_crew_start',
        status: 'loading',
        details: `Creating "${name.trim()}"...`,
      });

      const code = generateCrewCode();
      const displayName = user.displayName || user.email?.split('@')[0] || 'Leader';
      const isPro = Boolean(isSuperAdminEmailOrRole(user.email, profile?.role, user.uid) || profile?.plan === 'pro' || profile?.isPremium);

      const leaderMember: CrewMember = {
        uid: user.uid,
        displayName,
        email: user.email || '',
        joinedAt: new Date().toISOString(),
        role: 'leader',
        activeToday: true,
        questionsSolved: 0,
        streak: profile?.streak || 0,
        isPro,
      };

      const newCrewRef = doc(collection(db, 'crews'));
      const newCrewData: CrewDoc = {
        id: newCrewRef.id,
        name: name.trim(),
        code,
        leaderId: user.uid,
        leaderName: displayName,
        goalQuestions: 500,
        currentQuestions: 0,
        members: [leaderMember],
        memberUids: [user.uid],
        maxMembers: MAX_CREW_MEMBERS, // 30
        isLocked: false,
        streak: profile?.streak || 1,
        hasProMember: isPro,
        weakChapters: [],
      };

      // 1. Safe-save step: write to Firestore
      try {
        await setDoc(newCrewRef, { ...newCrewData, createdAt: serverTimestamp() });

        // Update user doc with TARGETED fields only (never overwrite plan or role)
        await setDoc(
          doc(db, 'users', user.uid),
          {
            isCrewMember: true,
            crewId: newCrewRef.id,
            crewName: name.trim(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // 2. Safe-save pattern: show the crew dashboard immediately from the data just written
        setCrew(newCrewData);

        // 3. Verify from the server
        getDocFromServer(newCrewRef).catch((e) => {
          console.warn('[useStudyCrew] Server verification notice:', e);
        });

        debugTracker.recordCrewStep({
          action: 'create_crew_success',
          status: 'success',
          details: `Created "${newCrewData.name}" with code ${code}`,
        });

        return newCrewData;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create crew.';
        debugTracker.recordCrewStep({
          action: 'create_crew_failed',
          status: 'error',
          details: msg,
        });
        throw err;
      }
    },
    [user, crew, profile]
  );

  // Join Crew using atomic runTransaction enforcing 30-member cap
  const joinCrewByCode = useCallback(
    async (code: string): Promise<CrewDoc> => {
      if (!user) throw new Error('You must be signed in to join a crew.');
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) throw new Error('Please enter a valid invite code.');

      setError(null);
      debugTracker.recordCrewStep({
        action: 'join_crew_start',
        status: 'loading',
        details: `Finding crew by code ${cleanCode}...`,
      });

      // 1. Find crew by code
      const q = query(collection(db, 'crews'), where('code', '==', cleanCode));
      const snap = await getDocs(q);
      if (snap.empty) {
        debugTracker.recordCrewStep({
          action: 'join_crew_not_found',
          status: 'error',
          errorCode: 'CODE_NOT_FOUND',
          details: `No crew found with code "${cleanCode}"`,
        });
        throw new Error(`No crew found with code "${cleanCode}". Please verify the code.`);
      }

      const crewDocSnapshot = snap.docs[0];
      const crewRef = crewDocSnapshot.ref;
      let resultingCrew: CrewDoc | null = null;

      // 2. Execute atomic transaction enforcing max 30
      try {
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
            resultingCrew = { ...freshData, id: freshCrewSnap.id };
            return;
          }

          // Strict Max 30 enforcement
          if (currentMembers.length >= MAX_CREW_MEMBERS || memberUids.length >= MAX_CREW_MEMBERS) {
            throw new Error(`This crew has reached its maximum capacity of ${MAX_CREW_MEMBERS} members.`);
          }

          const isUserPro = Boolean(isSuperAdminEmailOrRole(user.email, userData.role, user.uid) || userData.plan === 'pro' || userData.isPremium || profile?.plan === 'pro');
          const newMember: CrewMember = {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'Crew Member',
            email: user.email || '',
            joinedAt: new Date().toISOString(),
            role: 'member',
            activeToday: true,
            questionsSolved: 0,
            streak: userData.streak || 0,
            isPro: isUserPro,
          };

          const updatedMembers = [...currentMembers, newMember];
          const updatedUids = Array.from(new Set([...memberUids, user.uid]));
          const hasPro = freshData.hasProMember || isUserPro;

          transaction.update(crewRef, {
            members: updatedMembers,
            memberUids: updatedUids,
            hasProMember: hasPro,
            currentQuestions: Number(freshData.currentQuestions) || 0,
            updatedAt: serverTimestamp(),
          });

          // Update user doc targeted fields ONLY (NEVER touch role or plan!)
          transaction.set(
            userDocRef,
            {
              isCrewMember: true,
              crewId: freshCrewSnap.id,
              crewName: freshData.name,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          resultingCrew = {
            ...freshData,
            id: freshCrewSnap.id,
            members: updatedMembers,
            memberUids: updatedUids,
            hasProMember: hasPro,
          };
        });

        // 3. Safe-save pattern: show dashboard immediately, clear cached plan & reflect Pro without refresh
        if (resultingCrew) {
          setCrew(resultingCrew);
          if (user?.uid) {
            clearPlanCache(user.uid);
          }
          if (updateLocalProfile) {
            updateLocalProfile({
              isCrewMember: true,
              crewId: (resultingCrew as CrewDoc).id,
              crewName: (resultingCrew as CrewDoc).name,
            });
          }
        }

        getDocFromServer(crewRef).catch(() => {});

        const finalCrew = resultingCrew as CrewDoc | null;
        debugTracker.recordCrewStep({
          action: 'join_crew_success',
          status: 'success',
          details: `Joined crew "${finalCrew?.name || cleanCode}"`,
        });

        return resultingCrew!;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to join crew.';
        debugTracker.recordCrewStep({
          action: 'join_crew_error',
          status: 'error',
          details: msg,
        });
        throw err;
      }
    },
    [user, profile, updateLocalProfile]
  );

  // Leave Crew
  const leaveCrew = useCallback(async () => {
    if (!user || !crew) return;
    setError(null);
    debugTracker.recordCrewStep({
      action: 'leave_crew_start',
      status: 'loading',
      details: `Leaving crew "${crew.name}"...`,
    });

    const isLeader = crew.leaderId === user.uid;
    const remainingMembers = (crew.members || []).filter((m) => m.uid !== user.uid);

    if (isLeader && remainingMembers.length > 0) {
      throw new Error('Please transfer leadership to another member before leaving the crew.');
    }

    const crewRef = doc(db, 'crews', crew.id);

    try {
      if (remainingMembers.length === 0) {
        await deleteDoc(crewRef);
      } else {
        const updatedUids = (crew.memberUids || []).filter((id) => id !== user.uid);
        const remainingHasPro = remainingMembers.some((m) => m.isPro === true || isSuperAdminEmailOrRole(m.email, undefined, m.uid));
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

      // Reset user doc targeted fields ONLY (NEVER touch role or plan!)
      await setDoc(
        doc(db, 'users', user.uid),
        {
          isCrewMember: false,
          crewId: null,
          crewName: null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Safe-save pattern: update local state immediately
      setCrew(null);

      debugTracker.recordCrewStep({
        action: 'leave_crew_success',
        status: 'success',
        details: `Left crew "${crew.name}" successfully`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to leave crew.';
      debugTracker.recordCrewStep({
        action: 'leave_crew_failed',
        status: 'error',
        details: msg,
      });
      throw err;
    }
  }, [user, crew]);

  // Transfer Leadership
  const transferLeadership = useCallback(
    async (newLeaderUid: string) => {
      if (!user || !crew || crew.leaderId !== user.uid) {
        throw new Error('Only the current leader can transfer leadership.');
      }

      const targetMember = crew.members.find((m) => m.uid === newLeaderUid);
      if (!targetMember) throw new Error('Selected member is not in this crew.');

      debugTracker.recordCrewStep({
        action: 'transfer_leadership_start',
        status: 'loading',
        details: `Transferring to ${targetMember.displayName}...`,
      });

      const updatedMembers = crew.members.map((m) => ({
        ...m,
        role: (m.uid === newLeaderUid ? 'leader' : m.uid === user.uid ? 'member' : m.role) as 'leader' | 'member',
      }));

      const crewRef = doc(db, 'crews', crew.id);

      try {
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

        // Safe-save pattern: update state immediately, then verify from server
        setCrew((prev) =>
          prev
            ? {
                ...prev,
                leaderId: newLeaderUid,
                leaderName: targetMember.displayName,
                members: updatedMembers,
              }
            : null
        );

        getDocFromServer(crewRef).catch(() => {});

        debugTracker.recordCrewStep({
          action: 'transfer_leadership_success',
          status: 'success',
          details: `Leadership transferred to ${targetMember.displayName}`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to transfer leadership.';
        debugTracker.recordCrewStep({
          action: 'transfer_leadership_failed',
          status: 'error',
          details: msg,
        });
        throw err;
      }
    },
    [user, crew]
  );

  // Toggle Invite Lock
  const toggleLock = useCallback(async () => {
    if (!user || !crew || crew.leaderId !== user.uid) {
      throw new Error('Only the leader can change invite lock.');
    }
    const crewRef = doc(db, 'crews', crew.id);
    const nextLocked = !crew.isLocked;
    await setDoc(
      crewRef,
      {
        isLocked: nextLocked,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    setCrew((prev) => (prev ? { ...prev, isLocked: nextLocked } : null));
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
    setCrew((prev) => (prev ? { ...prev, code: newCode } : null));
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

      // Reset kicked user's profile targeted fields ONLY
      await setDoc(
        doc(db, 'users', memberUid),
        {
          isCrewMember: false,
          crewId: null,
          crewName: null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setCrew((prev) =>
        prev
          ? {
              ...prev,
              members: remainingMembers,
              memberUids: remainingUids,
              hasProMember: remainingHasPro,
            }
          : null
      );
    },
    [user, crew]
  );

  return {
    crew,
    loading,
    error,
    retry,
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
