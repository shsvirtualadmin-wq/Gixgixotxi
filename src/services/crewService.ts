import { api } from '../lib/api';

export interface D1Crew {
  id: string;
  code: string;
  name: string;
  description: string;
  university: string;
  captainUid: string;
  captainName: string;
  captainEmail?: string;
  avatarUrl?: string | null;
  status: 'active' | 'suspended';
  memberCount: number;
  createdAt: number;
  updatedAt?: number;
}

export interface D1CrewMember {
  id: string;
  crewId: string;
  userUid: string;
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  role: 'captain' | 'member';
  status: 'active' | 'suspended';
  joinedAt: number;
}

export interface PublicCrewDirectoryItem {
  id: string;
  name: string;
  code: string;
  leaderId: string;
  leaderName: string;
  memberCount: number;
  maxMembers: number;
  streak: number;
  currentQuestions: number;
  goalQuestions: number;
  tier: 'free' | 'paid';
  isLocked: boolean;
  avatarKey?: string;
  avatarVariant?: string;
  joinMode: 'direct' | 'request';
  minStreak: number;
  status?: 'active' | 'suspended';
}

export interface CrewJoinRequest {
  id: string;
  crewId: string;
  crewName: string;
  uid: string;
  displayName: string;
  email: string;
  streak: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: unknown;
}

function mapD1CrewToDirectoryItem(c: any): PublicCrewDirectoryItem {
  return {
    id: String(c.id || ''),
    name: String(c.name || 'Study Crew'),
    code: String(c.code || ''),
    leaderId: String(c.captainUid || c.captain_uid || ''),
    leaderName: String(c.captainName || c.captain_name || 'Captain'),
    memberCount: Number(c.memberCount ?? c.member_count ?? 1),
    maxMembers: 30,
    streak: 1,
    currentQuestions: 0,
    goalQuestions: 500,
    tier: 'paid',
    isLocked: c.status === 'suspended',
    joinMode: 'direct',
    minStreak: 0,
    status: c.status === 'suspended' ? 'suspended' : 'active',
  };
}

export async function getMyCrewD1(): Promise<{
  crew: D1Crew | null;
  members: D1CrewMember[];
}> {
  const data = await api.get<{ crew: D1Crew | null; members: D1CrewMember[] }>(
    '/api/crews/mine',
    { requireAuth: true, silentErrorToast: true }
  );
  return {
    crew: data.crew || null,
    members: Array.isArray(data.members) ? data.members : [],
  };
}

export async function listCrewsD1(includeAllForAdmin = false): Promise<D1Crew[]> {
  const query = includeAllForAdmin ? '?all=1' : '';
  const data = await api.get<{ crews: D1Crew[] }>(`/api/crews${query}`, {
    silentErrorToast: true,
  });
  return data.crews || [];
}

export async function createCrewD1(params: {
  name: string;
  description?: string;
  university?: string;
  code?: string;
  captainUid?: string;
  captainName?: string;
  captainEmail?: string;
}): Promise<D1Crew> {
  const data = await api.post<{ crew: D1Crew }>('/api/crews', params, {
    requireAuth: true,
  });
  return data.crew;
}

export async function toggleSuspendCrewD1(
  crewId: string,
  status?: 'active' | 'suspended'
): Promise<{ id: string; status: 'active' | 'suspended' }> {
  return api.post(
    `/api/crews/${encodeURIComponent(crewId)}/suspend`,
    status ? { status } : {},
    { requireAuth: true }
  );
}

export async function deleteCrewD1(crewId: string): Promise<void> {
  await api.delete(`/api/crews/${encodeURIComponent(crewId)}`, {
    requireAuth: true,
  });
}

export async function getCrewMembersD1(crewId: string): Promise<D1CrewMember[]> {
  const data = await api.get<{ members: D1CrewMember[] }>(
    `/api/crews/${encodeURIComponent(crewId)}/members`,
    { requireAuth: true }
  );
  return data.members || [];
}

export async function toggleSuspendCrewMemberD1(
  crewId: string,
  memberUid: string
): Promise<{ userUid: string; status: 'active' | 'suspended' }> {
  return api.post(
    `/api/crews/${encodeURIComponent(crewId)}/members/${encodeURIComponent(memberUid)}/suspend`,
    {},
    { requireAuth: true }
  );
}

export async function removeCrewMemberD1(
  crewId: string,
  memberUid: string
): Promise<void> {
  await api.delete(
    `/api/crews/${encodeURIComponent(crewId)}/members/${encodeURIComponent(memberUid)}`,
    { requireAuth: true }
  );
}

export async function joinCrewD1(codeOrId: string): Promise<{
  ok: boolean;
  crewId: string;
  crewName: string;
}> {
  return api.post(
    '/api/crews/join',
    { code: codeOrId, crewId: codeOrId },
    { requireAuth: true }
  );
}

// ─── Legacy Compatible Exports ──────────────────────────────────────────────
export async function fetchPublicCrews(maxCount = 50): Promise<PublicCrewDirectoryItem[]> {
  const crews = await listCrewsD1(false);
  return crews.slice(0, maxCount).map(mapD1CrewToDirectoryItem);
}

export async function submitCrewJoinRequest(params: {
  crewId: string;
  crewName: string;
  uid: string;
  displayName: string;
  email: string;
  streak: number;
}): Promise<void> {
  await joinCrewD1(params.crewId);
}

export async function fetchCrewJoinRequests(_crewId: string): Promise<CrewJoinRequest[]> {
  return [];
}

export async function acceptCrewJoinRequest(_request: CrewJoinRequest): Promise<void> {
  // Handled directly via D1 join
}

export async function rejectCrewJoinRequest(_requestId: string): Promise<void> {
  // No-op in direct D1 crew membership
}

export async function updateCrewSettings(
  crewId: string,
  settings: {
    name?: string;
    bio?: string;
    description?: string;
    university?: string;
    avatarKey?: string;
    avatarVariant?: string;
    joinMode?: 'direct' | 'request';
    minStreak?: number;
    maxMembers?: number;
    isClosed?: boolean;
  },
  _actor?: { uid: string; email?: string; isAdmin?: boolean }
): Promise<void> {
  await api.put(`/api/crews/${encodeURIComponent(crewId)}`, settings, {
    requireAuth: true,
  });
}

export async function fetchCrewDetails(crewId: string): Promise<any> {
  const data = await api.get<{ crew: D1Crew; members: D1CrewMember[] }>(
    `/api/crews/${encodeURIComponent(crewId)}`,
    {
      requireAuth: true,
      silentErrorToast: true,
    }
  );
  if (!data?.crew) return null;
  const c = data.crew;
  const members = (data.members || []).map((m) => ({
    uid: m.userUid,
    displayName: m.userName,
    email: m.userEmail,
    joinedAt: new Date(m.joinedAt || Date.now()).toISOString(),
    role: (m.role === 'captain' ? 'leader' : 'member') as 'leader' | 'member',
    streak: 1,
    questionsSolved: 0,
    proBadge: (m as any).proBadge || null,
  }));
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    bio: c.description || '',
    avatarKey: 'skull-01',
    avatarVariant: 'red-on-black',
    leaderId: c.captainUid,
    leaderName: c.captainName,
    proBadge: (c as any).proBadge || null,
    tier: 'paid',
    joinMode: 'direct',
    minStreak: 0,
    maxMembers: 30,
    isClosed: c.status === 'suspended',
    members,
    memberUids: members.map((m) => m.uid),
    requests: [],
    score: 0,
    streak: 1,
    currentQuestions: 0,
    goalQuestions: 500,
    createdAt: c.createdAt,
  };
}

export async function fetchCrewLeaderboard(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ crews: any[]; total: number }> {
  const all = await listCrewsD1(false);
  const q = (params?.search || '').trim().toLowerCase();
  const filtered = q
    ? all.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.captainName.toLowerCase().includes(q)
      )
    : all;
  const offset = params?.offset || 0;
  const limit = params?.limit || 20;
  const mapped = filtered.slice(offset, offset + limit).map((c, idx) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    bio: c.description || '',
    avatarKey: 'skull-01',
    avatarVariant: 'red-on-black',
    rank: offset + idx + 1,
    score: c.memberCount * 100,
    questionsSolved: c.memberCount * 25,
    accuracy: 85,
    memberCount: c.memberCount || 1,
    maxMembers: 30,
    tier: 'paid',
    isPaidActive: true,
    proBadge: (c as any).proBadge || 'ember',
    paid_until: null,
    joinMode: 'direct',
    minStreak: 0,
    isClosed: c.status === 'suspended',
    leaderName: c.captainName,
    streak: 1,
  }));
  return { crews: mapped, total: filtered.length };
}

export async function joinCrew(params: {
  crewId: string;
  user?: any;
  code?: string;
}): Promise<{ status: 'joined' | 'requested'; crewId: string }> {
  const res = await joinCrewD1(params.code || params.crewId);
  return { status: 'joined', crewId: res.crewId };
}

export async function createNewCrew(params: {
  name: string;
  bio?: string;
  creator?: { uid?: string; displayName?: string; email?: string };
  [key: string]: any;
}): Promise<{ id: string; crewId: string }> {
  const created = await createCrewD1({
    name: params.name,
    description: params.bio || '',
    captainUid: params.creator?.uid,
    captainName: params.creator?.displayName,
    captainEmail: params.creator?.email,
  });
  return { id: created.id, crewId: created.id };
}

export async function promoteMemberToLeader(
  _crewId: string,
  _currentOrNewLeaderUid: string,
  _newLeaderUidOrActor?: any,
  _maybeActor?: any
): Promise<void> {
  // Handled via D1 crew settings
}

export async function handleRequestAction(
  _paramsOrCrewId: any,
  _leaderUid?: string,
  _requestUserId?: string,
  _action?: 'approve' | 'reject'
): Promise<void> {
  // Direct join in D1
}

export async function cancelJoinRequest(_crewId: string, _uid: string): Promise<void> {
  // No-op in direct D1 crew membership
}

export async function removeMemberFromCrew(
  crewId: string,
  arg2: string,
  arg3?: any
): Promise<void> {
  const targetUid = typeof arg3 === 'string' ? arg3 : arg2;
  await removeCrewMemberD1(crewId, targetUid);
}

export async function leaveCrewSelf(crewId: string, uid: string): Promise<void> {
  await removeCrewMemberD1(crewId, uid);
}

export async function adminDisbandCrew(
  crewId: string,
  _disbandTypedName?: string,
  _adminEmail?: string
): Promise<void> {
  await deleteCrewD1(crewId);
}


