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
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  CrewDoc,
  CrewMember,
  PublicCrewSummary,
  CrewTier,
  CrewJoinMode,
} from '../types/crew';
import {
  computeCrewScore,
  isCrewPaidActive,
  getRankedCrewsServer,
  evaluateUserEligibility,
  executeJoinCrewServer,
  handleRequestActionServer,
  recordCrewPaymentActionServer,
} from './crewBackend';
import { DEFAULT_CREW_PRICING } from '../config/crewPricing';
import { isValidAvatar } from '../lib/matrixAvatarsData';
import { sanitizeStudentDisplayName } from '../utils/privacy';

export {
  computeCrewScore,
  isCrewPaidActive,
  evaluateUserEligibility,
};

export interface FetchLeaderboardParams {
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetches the public or in-app ranked leaderboard from the single ranking source of truth.
 * Always returns identical ranks and scores.
 */
export async function fetchCrewLeaderboard(
  params?: FetchLeaderboardParams
): Promise<{ crews: PublicCrewSummary[]; totalCount: number }> {
  try {
    // Attempt backend API call first
    const searchParam = params?.search ? `&search=${encodeURIComponent(params.search)}` : '';
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const offset = (page - 1) * limit;

    const res = await fetch(`/api/crews/leaderboard?limit=${limit}&offset=${offset}${searchParam}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.crews)) {
        return { crews: data.crews, totalCount: data.totalCount || data.crews.length };
      }
    }
  } catch (err) {
    console.warn('[CrewService] API leaderboard error, executing server-equivalent query:', err);
  }

  // Fallback to direct client-side query matching exact server ranking algorithm
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const offset = (page - 1) * limit;

  return await getRankedCrewsServer({
    search: params?.search,
    limit,
    offset,
  });
}

/**
 * Fetches full details for a single crew.
 */
export async function fetchCrewDetails(crewId: string): Promise<CrewDoc | null> {
  try {
    const snap = await getDoc(doc(db, 'crews', crewId));
    if (!snap.exists()) return null;
    const data = snap.data() as CrewDoc;
    return {
      ...data,
      id: snap.id,
      score: computeCrewScore(data),
    };
  } catch (err) {
    console.error('[CrewService] fetchCrewDetails error:', err);
    return null;
  }
}

/**
 * Creates a brand new crew. Creator automatically becomes crew_admin (leader).
 */
export async function createNewCrew(params: {
  name: string;
  bio?: string;
  avatarKey: string;
  avatarVariant: string;
  joinMode: CrewJoinMode;
  minStreak: number;
  tier: CrewTier;
  creator: {
    uid: string;
    email: string;
    displayName: string;
    streak?: number;
  };
}): Promise<CrewDoc> {
  const { name, bio, avatarKey, avatarVariant, joinMode, minStreak, tier, creator } = params;

  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 50) {
    throw new Error('Crew name must be between 2 and 50 characters long.');
  }

  if (bio && bio.length > 160) {
    throw new Error('Crew bio cannot exceed 160 characters.');
  }

  if (!isValidAvatar(avatarKey, avatarVariant)) {
    throw new Error('Please pick a valid dot-matrix avatar from the library.');
  }

  // Check unique name across all existing crews
  const nameQuery = query(collection(db, 'crews'), where('name', '==', cleanName));
  const existingSnap = await getDocs(nameQuery);
  if (!existingSnap.empty) {
    throw new Error(`A crew named "${cleanName}" already exists. Please choose a unique name.`);
  }

  // Verify creator is not already in a crew
  const creatorDoc = await getDoc(doc(db, 'users', creator.uid));
  const creatorData = creatorDoc.data() || {};
  if (creatorData.crewId) {
    throw new Error('You are already in a study crew. Leave your current crew first.');
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const cleanCreatorName = sanitizeStudentDisplayName(creator.displayName, creator.uid);
  const leaderMember: CrewMember = {
    uid: creator.uid,
    displayName: cleanCreatorName,
    joinedAt: new Date().toISOString(),
    role: 'leader',
    activeToday: true,
    questionsSolved: 0,
    streak: creator.streak || 0,
    avatarKey,
    avatarVariant,
    isPro: tier === 'paid',
  };

  const newCrewRef = doc(collection(db, 'crews'));
  const newCrewData: CrewDoc = {
    id: newCrewRef.id,
    name: cleanName,
    code,
    bio: (bio || '').trim(),
    avatarKey,
    avatarVariant,
    leaderId: creator.uid,
    leaderName: cleanCreatorName,
    tier,
    paid_until: tier === 'paid' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    joinMode,
    minStreak: Math.max(0, Number(minStreak) || 0),
    maxMembers: tier === 'paid' ? 30 : DEFAULT_CREW_PRICING.freeMemberLimit,
    isClosed: false,
    members: [leaderMember],
    memberUids: [creator.uid],
    requests: [],
    score: (creator.streak || 0) * 15,
    streak: creator.streak || 1,
    currentQuestions: 0,
    goalQuestions: 500,
    createdAt: serverTimestamp(),
  };

  await setDoc(newCrewRef, newCrewData);

  // Update user profile document
  await setDoc(
    doc(db, 'users', creator.uid),
    {
      isCrewMember: true,
      crewId: newCrewRef.id,
      crewName: cleanName,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return newCrewData;
}

/**
 * Join or request to join a crew.
 */
export async function joinCrew(params: {
  crewId: string;
  user: {
    uid: string;
    email: string;
    displayName: string;
    streak: number;
    score?: number;
    avatarKey?: string;
    avatarVariant?: string;
  };
}) {
  return await executeJoinCrewServer(params);
}

/**
 * Approve or reject join request.
 */
export async function handleRequestAction(params: {
  crewId: string;
  requestId: string;
  action: 'approve' | 'reject';
  operator: { uid: string; email?: string; isAdmin?: boolean };
}) {
  return await handleRequestActionServer(params);
}

/**
 * User cancels their own pending join request.
 */
export async function cancelJoinRequest(crewId: string, userId: string): Promise<void> {
  const crewRef = doc(db, 'crews', crewId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(crewRef);
    if (!snap.exists()) return;
    const crew = snap.data() as CrewDoc;
    const updatedRequests = (crew.requests || []).filter((r) => r.userId !== userId);
    tx.update(crewRef, { requests: updatedRequests, updatedAt: serverTimestamp() });
  });
}

/**
 * Crew admin or superadmin updates settings.
 */
export async function updateCrewSettings(
  crewId: string,
  updates: {
    name?: string;
    bio?: string;
    avatarKey?: string;
    avatarVariant?: string;
    joinMode?: CrewJoinMode;
    minStreak?: number;
    maxMembers?: number;
    isClosed?: boolean;
  },
  operator: { uid: string; email?: string; isAdmin?: boolean }
): Promise<void> {
  const crewRef = doc(db, 'crews', crewId);
  const snap = await getDoc(crewRef);
  if (!snap.exists()) throw new Error('Crew not found.');
  const crew = snap.data() as CrewDoc;

  const isLeader = crew.leaderId === operator.uid;
  const isSuper = Boolean(operator.isAdmin || operator.email?.toLowerCase() === 'shsvirtualadmin@gmail.com');
  if (!isLeader && !isSuper) {
    throw new Error('Permission denied. Only crew admins or superadmins can update settings.');
  }

  const payload: Partial<CrewDoc> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.name && updates.name.trim() !== crew.name) {
    const cleanName = updates.name.trim();
    if (cleanName.length < 2 || cleanName.length > 50) {
      throw new Error('Name must be 2-50 characters.');
    }
    const q = query(collection(db, 'crews'), where('name', '==', cleanName));
    const existSnap = await getDocs(q);
    if (!existSnap.empty && existSnap.docs[0].id !== crewId) {
      throw new Error(`A crew named "${cleanName}" already exists.`);
    }
    payload.name = cleanName;
  }

  if (updates.bio !== undefined) {
    if (updates.bio.length > 160) throw new Error('Bio must be 160 chars or less.');
    payload.bio = updates.bio.trim();
  }

  if (updates.avatarKey) {
    if (!isValidAvatar(updates.avatarKey, updates.avatarVariant || crew.avatarVariant)) {
      throw new Error('Invalid avatar selection.');
    }
    payload.avatarKey = updates.avatarKey;
    if (updates.avatarVariant) payload.avatarVariant = updates.avatarVariant;
  }

  if (updates.joinMode) payload.joinMode = updates.joinMode;
  if (updates.minStreak !== undefined) payload.minStreak = Math.max(0, updates.minStreak);
  if (updates.isClosed !== undefined) payload.isClosed = updates.isClosed;

  if (updates.maxMembers !== undefined) {
    const isPaid = crew.tier === 'paid' && isCrewPaidActive(crew.paid_until);
    if (!isPaid && updates.maxMembers > DEFAULT_CREW_PRICING.freeMemberLimit) {
      throw new Error('Free crews are limited to 5 members. Upgrade to Large Crew to set a higher limit.');
    }
    payload.maxMembers = Math.max(DEFAULT_CREW_PRICING.freeMemberLimit, updates.maxMembers);
  }

  await updateDoc(crewRef, payload);
}

/**
 * Remove a member from the crew.
 */
export async function removeMemberFromCrew(
  crewId: string,
  targetUid: string,
  operator: { uid: string; email?: string; isAdmin?: boolean }
): Promise<void> {
  const crewRef = doc(db, 'crews', crewId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(crewRef);
    if (!snap.exists()) throw new Error('Crew not found.');
    const crew = snap.data() as CrewDoc;

    const isLeader = crew.leaderId === operator.uid;
    const isSuper = Boolean(operator.isAdmin || operator.email?.toLowerCase() === 'shsvirtualadmin@gmail.com');
    if (!isLeader && !isSuper) {
      throw new Error('Only the crew leader or superadmin can remove members.');
    }

    if (crew.leaderId === targetUid) {
      throw new Error('The crew leader cannot be removed. Transfer leadership first or disband the crew.');
    }

    const updatedMembers = (crew.members || []).filter((m) => m.uid !== targetUid);
    const updatedMemberUids = (crew.memberUids || []).filter((id) => id !== targetUid);

    tx.update(crewRef, {
      members: updatedMembers,
      memberUids: updatedMemberUids,
      updatedAt: serverTimestamp(),
    });

    const targetUserRef = doc(db, 'users', targetUid);
    tx.set(
      targetUserRef,
      {
        isCrewMember: false,
        crewId: null,
        crewName: null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

/**
 * Member leaves crew on their own.
 */
export async function leaveCrewSelf(crewId: string, userId: string): Promise<void> {
  const crewRef = doc(db, 'crews', crewId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(crewRef);
    if (!snap.exists()) return;
    const crew = snap.data() as CrewDoc;

    if (crew.leaderId === userId) {
      // If leader leaves and there are other members, assign next member as leader
      const otherMembers = (crew.members || []).filter((m) => m.uid !== userId);
      if (otherMembers.length > 0) {
        otherMembers[0].role = 'leader';
        const updatedMemberUids = otherMembers.map((m) => m.uid);
        tx.update(crewRef, {
          leaderId: otherMembers[0].uid,
          leaderName: otherMembers[0].displayName,
          members: otherMembers,
          memberUids: updatedMemberUids,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Disband empty crew
        tx.delete(crewRef);
      }
    } else {
      const updatedMembers = (crew.members || []).filter((m) => m.uid !== userId);
      const updatedMemberUids = (crew.memberUids || []).filter((id) => id !== userId);
      tx.update(crewRef, {
        members: updatedMembers,
        memberUids: updatedMemberUids,
        updatedAt: serverTimestamp(),
      });
    }

    const userRef = doc(db, 'users', userId);
    tx.set(
      userRef,
      {
        isCrewMember: false,
        crewId: null,
        crewName: null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

/**
 * Transfer leadership of a crew to another existing member.
 */
export async function promoteMemberToLeader(
  crewId: string,
  newLeaderUid: string,
  operator: { uid: string; email?: string; isAdmin?: boolean }
): Promise<void> {
  const crewRef = doc(db, 'crews', crewId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(crewRef);
    if (!snap.exists()) throw new Error('Crew not found.');
    const crew = snap.data() as CrewDoc;

    const isLeader = crew.leaderId === operator.uid;
    const isSuper = Boolean(operator.isAdmin || operator.email?.toLowerCase() === 'shsvirtualadmin@gmail.com');
    if (!isLeader && !isSuper) {
      throw new Error('Only the current crew leader or superadmin can transfer leadership.');
    }

    const members = crew.members || [];
    const newLeader = members.find((m) => m.uid === newLeaderUid);
    if (!newLeader) {
      throw new Error('Selected user is not a member of this crew.');
    }

    const updatedMembers = members.map((m) => {
      if (m.uid === newLeaderUid) {
        return { ...m, role: 'leader' as const };
      }
      if (m.uid === crew.leaderId) {
        return { ...m, role: 'member' as const };
      }
      return m;
    });

    tx.update(crewRef, {
      leaderId: newLeaderUid,
      leaderName: newLeader.displayName || 'Leader',
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });

    if (isSuper) {
      const auditRef = doc(collection(db, 'auditLogs'));
      tx.set(auditRef, {
        adminEmail: operator.email || 'admin',
        action: 'crew_transfer_leadership',
        targetUid: crewId,
        details: {
          crewName: crew.name,
          oldLeaderId: crew.leaderId,
          newLeaderUid,
          newLeaderName: newLeader.displayName,
        },
        timestamp: serverTimestamp(),
      });
    }
  });
}

/**
 * Superadmin payment management.
 */
export async function adminCrewPaymentControl(params: {
  crewId: string;
  action: 'mark_paid' | 'extend_month' | 'mark_unpaid';
  adminEmail: string;
  reason: string;
}) {
  return await recordCrewPaymentActionServer(params);
}

/**
 * Superadmin disbands a crew with typed name verification.
 */
export async function adminDisbandCrew(
  crewId: string,
  confirmName: string,
  adminEmail: string
): Promise<void> {
  const crewRef = doc(db, 'crews', crewId);
  const snap = await getDoc(crewRef);
  if (!snap.exists()) throw new Error('Crew not found.');
  const crew = snap.data() as CrewDoc;

  if (confirmName.trim().toLowerCase() !== crew.name.trim().toLowerCase()) {
    throw new Error(`Confirmation name "${confirmName}" does not match crew name "${crew.name}".`);
  }

  // Clear crewId for all members
  const memberUids = crew.memberUids || [];
  for (const uid of memberUids) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        isCrewMember: false,
        crewId: null,
        crewName: null,
      });
    } catch {
      // ignore
    }
  }

  await deleteDoc(crewRef);

  // Audit log
  await setDoc(doc(collection(db, 'auditLogs')), {
    adminEmail,
    action: 'crew_disband',
    targetUid: crewId,
    details: {
      crewName: crew.name,
      memberCount: memberUids.length,
    },
    timestamp: serverTimestamp(),
  });
}
