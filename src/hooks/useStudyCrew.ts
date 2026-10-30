import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from './useUserProfile';
import { MAX_CREW_MEMBERS } from '@/constants/limits';
import {
  getMyCrewD1,
  createCrewD1,
  joinCrewD1,
  deleteCrewD1,
  removeCrewMemberD1,
  updateCrewSettings,
  type D1Crew,
  type D1CrewMember,
} from '@/services/crewService';

export interface CrewMember {
  uid: string;
  displayName: string;
  email: string;
  joinedAt: string;
  role: 'leader' | 'member';
  status?: 'active' | 'suspended';
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
  maxMembers: number;
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

function mapD1ToCrewDoc(crew: D1Crew, members: D1CrewMember[]): CrewDoc {
  const mappedMembers: CrewMember[] = members.map((m) => ({
    uid: m.userUid,
    displayName: m.userName || 'Student',
    email: m.userEmail || '',
    joinedAt: new Date(m.joinedAt || Date.now()).toISOString(),
    role: m.role === 'captain' ? 'leader' : 'member',
    status: m.status,
    activeToday: true,
    questionsSolved: 0,
    streak: 1,
    isPro: true,
  }));

  if (mappedMembers.length === 0) {
    mappedMembers.push({
      uid: crew.captainUid,
      displayName: crew.captainName || 'Captain',
      email: crew.captainEmail || '',
      joinedAt: new Date(crew.createdAt || Date.now()).toISOString(),
      role: 'leader',
      status: 'active',
      activeToday: true,
      questionsSolved: 0,
      streak: 1,
      isPro: true,
    });
  }

  return {
    id: crew.id,
    name: crew.name,
    code: crew.code,
    leaderId: crew.captainUid,
    leaderName: crew.captainName,
    goalQuestions: 500,
    currentQuestions: 0,
    members: mappedMembers,
    memberUids: mappedMembers.map((m) => m.uid),
    maxMembers: MAX_CREW_MEMBERS,
    isLocked: crew.status === 'suspended',
    streak: 1,
    hasProMember: true,
    weakChapters: [],
    tier: 'paid',
    createdAt: crew.createdAt,
  };
}

export function useStudyCrew() {
  const { user } = useAuth();
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

    getMyCrewD1()
      .then(({ crew: d1Crew, members }) => {
        if (!isMounted) return;
        if (!d1Crew) {
          setCrew(null);
        } else {
          setCrew(mapD1ToCrewDoc(d1Crew, members));
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setError(err?.message || 'Could not load study crew.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, retryCount]);

  const createCrew = useCallback(
    async (name: string): Promise<CrewDoc> => {
      if (!user) throw new Error('You must be signed in to create a crew.');
      if (!name.trim()) throw new Error('Please provide a valid crew name.');

      const created = await createCrewD1({
        name: name.trim(),
        captainName: profile?.displayName || user.displayName || 'Captain',
        captainEmail: user.email || '',
      });
      const docObj = mapD1ToCrewDoc(created, []);
      setCrew(docObj);
      return docObj;
    },
    [user, profile]
  );

  const joinCrewByCode = useCallback(
    async (code: string): Promise<CrewDoc> => {
      if (!user) throw new Error('You must be signed in to join a crew.');
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) throw new Error('Please enter a valid invite code.');

      await joinCrewD1(cleanCode);
      const { crew: d1Crew, members } = await getMyCrewD1();
      if (!d1Crew) throw new Error('Crew joined, but could not load crew details.');
      const docObj = mapD1ToCrewDoc(d1Crew, members);
      setCrew(docObj);
      return docObj;
    },
    [user]
  );

  const leaveCrew = useCallback(async () => {
    if (!user || !crew) return;
    if (crew.leaderId === user.uid) {
      await deleteCrewD1(crew.id);
    } else {
      await removeCrewMemberD1(crew.id, user.uid);
    }
    setCrew(null);
  }, [user, crew]);

  const transferLeadership = useCallback(
    async (newLeaderUid: string) => {
      if (!user || !crew) return;
      const target = crew.members.find((m) => m.uid === newLeaderUid);
      if (!target) throw new Error('Member not found.');
      await updateCrewSettings(crew.id, { name: crew.name });
      retry();
    },
    [user, crew, retry]
  );

  const toggleLock = useCallback(async () => {
    if (!user || !crew) return;
    setCrew((prev) => (prev ? { ...prev, isLocked: !prev.isLocked } : null));
  }, [user, crew]);

  const regenerateCode = useCallback(async () => {
    const newCode = generateCrewCode();
    setCrew((prev) => (prev ? { ...prev, code: newCode } : null));
    return newCode;
  }, []);

  const kickMember = useCallback(
    async (memberUid: string) => {
      if (!user || !crew) return;
      await removeCrewMemberD1(crew.id, memberUid);
      setCrew((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.filter((m) => m.uid !== memberUid),
              memberUids: prev.memberUids.filter((id) => id !== memberUid),
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
