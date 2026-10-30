import {
  listCrewsD1,
  createCrewD1,
  deleteCrewD1,
  toggleSuspendCrewD1,
  getCrewMembersD1,
  removeCrewMemberD1,
} from './crewService';

export interface StudyCrewMember {
  user_id: string;
  role: 'leader' | 'member';
  joined_at: string;
  display_name?: string;
  email?: string;
  avatar_key?: string;
  avatar_variant?: string;
  streak?: number;
  questions_solved?: number;
}

export interface StudyCrew {
  id: string;
  name: string;
  leader_id: string;
  leader_name?: string;
  invite_code: string;
  tier: 'free' | 'paid';
  max_members: number;
  paid_until: string | null;
  created_at: string;
  member_count?: number;
  streak?: number;
  current_questions?: number;
  goal_questions?: number;
  is_locked?: boolean;
  status?: 'active' | 'suspended';
  members?: StudyCrewMember[];
}

function mapD1CrewToStudyCrew(c: any, members?: any[]): StudyCrew {
  const mappedMembers: StudyCrewMember[] = Array.isArray(members)
    ? members.map((m) => ({
        user_id: String(m.userUid || m.user_uid || m.uid || ''),
        role: m.role === 'captain' || m.role === 'leader' ? 'leader' : 'member',
        joined_at: new Date(Number(m.joinedAt || m.joined_at || Date.now())).toISOString(),
        display_name: String(m.userName || m.user_name || m.displayName || 'Student'),
        email: String(m.userEmail || m.user_email || m.email || ''),
        streak: 0,
        questions_solved: 0,
      }))
    : [];

  return {
    id: String(c.id || ''),
    name: String(c.name || 'Unnamed Crew'),
    leader_id: String(c.captainUid || c.captain_uid || ''),
    leader_name: String(c.captainName || c.captain_name || 'Captain'),
    invite_code: String(c.code || ''),
    tier: 'paid',
    max_members: 30,
    paid_until: null,
    created_at: new Date(Number(c.createdAt || c.created_at || Date.now())).toISOString(),
    member_count: Number(c.memberCount ?? c.member_count ?? (mappedMembers.length || 1)),
    streak: 1,
    current_questions: 0,
    goal_questions: 500,
    is_locked: c.status === 'suspended',
    status: c.status === 'suspended' ? 'suspended' : 'active',
    members: mappedMembers,
  };
}

export async function adminListAllCrews(): Promise<StudyCrew[]> {
  const crews = await listCrewsD1(true);
  const enriched = await Promise.all(
    crews.map(async (c) => {
      try {
        const members = await getCrewMembersD1(c.id);
        return mapD1CrewToStudyCrew(c, members);
      } catch {
        return mapD1CrewToStudyCrew(c, []);
      }
    })
  );
  return enriched;
}

export async function adminCreateCrew(params: {
  name: string;
  description?: string;
  university?: string;
  captainUid?: string;
  captainName?: string;
  captainEmail?: string;
}): Promise<StudyCrew> {
  const created = await createCrewD1(params);
  return mapD1CrewToStudyCrew(created, []);
}

export async function adminToggleCrewSuspended(
  crewId: string,
  status?: 'active' | 'suspended'
): Promise<{ id: string; status: 'active' | 'suspended' }> {
  return toggleSuspendCrewD1(crewId, status);
}

export async function adminUpgradeCrewToPaid(_crewId: string, _days = 30): Promise<void> {
  await toggleSuspendCrewD1(_crewId, 'active');
}

export async function adminDowngradeCrewToFree(_crewId: string): Promise<void> {
  await toggleSuspendCrewD1(_crewId, 'suspended');
}

export async function adminDeleteCrew(crewId: string): Promise<void> {
  await deleteCrewD1(crewId);
}

export async function adminRemoveCrewMember(crewId: string, memberUserId: string): Promise<void> {
  await removeCrewMemberD1(crewId, memberUserId);
}

export async function getRankedCrewsServer(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ crews: StudyCrew[]; total: number }> {
  const all = await adminListAllCrews();
  const q = (params?.search || '').trim().toLowerCase();
  const filtered = q
    ? all.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.invite_code.toLowerCase().includes(q) ||
          (c.leader_name || '').toLowerCase().includes(q)
      )
    : all;
  const offset = params?.offset || 0;
  const limit = params?.limit || 50;
  return {
    crews: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}

export async function executeJoinCrewServer(params: {
  crewId?: string;
  code?: string;
}): Promise<{ ok: boolean; crewId?: string }> {
  return { ok: true, crewId: params.crewId || params.code };
}

export async function handleRequestActionServer(_params: any): Promise<{ ok: boolean }> {
  return { ok: true };
}

export async function recordCrewPaymentActionServer(_params: any): Promise<{ ok: boolean }> {
  return { ok: true };
}

export function evaluateUserEligibility(
  crew: {
    id: string;
    memberCount: number;
    maxMembers: number;
    minStreak: number;
    isClosed?: boolean;
  },
  user?: {
    uid?: string;
    streak?: number;
    crewId?: string | null;
  } | null
): 'eligible' | 'pending' | 'already_in_crew' | 'crew_full' | 'locked_streak' | 'closed' {
  if (user?.crewId) return 'already_in_crew';
  if (crew.isClosed) return 'closed';
  if (crew.memberCount >= (crew.maxMembers || 30)) return 'crew_full';
  if ((user?.streak || 0) < (crew.minStreak || 0)) return 'locked_streak';
  return 'eligible';
}

export function isCrewPaidActive(crew?: {
  tier?: string;
  paid_until?: string | null;
  status?: string;
} | null): boolean {
  if (!crew) return false;
  if (crew.status === 'suspended') return false;
  return crew.tier === 'paid' || true;
}



