import type { IncomingMessage, ServerResponse } from 'http';
import {
  getRankedCrewsServer,
  executeJoinCrewServer,
  handleRequestActionServer,
  recordCrewPaymentActionServer,
} from '../services/crewBackend';
import { fetchCrewPricing, updateCrewPricing, DEFAULT_CREW_PRICING } from '../config/crewPricing';
import {
  fetchCrewDetails,
  cancelJoinRequest,
  updateCrewSettings,
  removeMemberFromCrew,
  leaveCrewSelf,
  adminDisbandCrew,
} from '../services/crewService';

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJsonBody(req: IncomingMessage): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

const SUPER_ADMIN_EMAILS = ['shsvirtualadmin@gmail.com', 'support@boardly.cfd'];
const SUPER_ADMIN_UID = 'A5YMRimdHRcmeDWutxtUGt2e4hf2';

function isSuperAdmin(email?: string, uid?: string, role?: string): boolean {
  if (uid && uid === SUPER_ADMIN_UID) return true;
  if (email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim())) return true;
  if (role === 'admin' || role === 'superadmin') return true;
  return false;
}

export async function handleCrewApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const url = new URL(req.url || '/', 'http://localhost');
  const pathname = url.pathname.replace(/^\/api\/crews/, '') || '/';

  try {
    // ── 1. GET /api/crews/leaderboard ──
    if (req.method === 'GET' && (pathname === '/leaderboard' || pathname === '/')) {
      const search = url.searchParams.get('search') || undefined;
      const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 100);
      const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);

      const result = await getRankedCrewsServer({ search, limit, offset });
      sendJson(res, 200, result);
      return;
    }

    // ── 2. GET /api/crews/config ──
    if (req.method === 'GET' && pathname === '/config') {
      const pricing = await fetchCrewPricing();
      sendJson(res, 200, pricing);
      return;
    }

    // ── 3. POST /api/crews/config (Superadmin only) ──
    if (req.method === 'POST' && pathname === '/config') {
      const body = await parseJsonBody(req);
      const { adminEmail, adminUid, adminRole, newPricing } = body;
      if (!isSuperAdmin(adminEmail, adminUid, adminRole)) {
        sendJson(res, 403, { error: 'Permission denied. Superadmin access required.' });
        return;
      }
      const updated = await updateCrewPricing(adminEmail || 'admin', newPricing || {});
      sendJson(res, 200, { success: true, pricing: updated });
      return;
    }

    // ── 4. GET /api/crews/admin/all (Superadmin only) ──
    if (req.method === 'GET' && pathname === '/admin/all') {
      const email = url.searchParams.get('email') || undefined;
      const uid = url.searchParams.get('uid') || undefined;
      const role = url.searchParams.get('role') || undefined;

      if (!isSuperAdmin(email, uid, role)) {
        sendJson(res, 403, { error: 'Permission denied. Superadmin access required.' });
        return;
      }

      const result = await getRankedCrewsServer({ limit: 200, offset: 0 });
      sendJson(res, 200, result);
      return;
    }

    // ── 5. POST /api/crews/admin/payment (Superadmin only) ──
    if (req.method === 'POST' && pathname === '/admin/payment') {
      const body = await parseJsonBody(req);
      const { crewId, action, adminEmail, adminUid, adminRole, reason, amount, transactionId } = body;

      if (!isSuperAdmin(adminEmail, adminUid, adminRole)) {
        sendJson(res, 403, { error: 'Permission denied. Superadmin access required.' });
        return;
      }

      if (!crewId || !action || !reason) {
        sendJson(res, 400, { error: 'crewId, action, and reason are required.' });
        return;
      }

      const result = await recordCrewPaymentActionServer({
        crewId,
        action,
        adminEmail: adminEmail || 'admin',
        reason,
        amount,
        transactionId,
      });

      sendJson(res, 200, result);
      return;
    }

    // ── 6. POST /api/crews/admin/disband (Superadmin only) ──
    if (req.method === 'POST' && pathname === '/admin/disband') {
      const body = await parseJsonBody(req);
      const { crewId, confirmName, adminEmail, adminUid, adminRole } = body;

      if (!isSuperAdmin(adminEmail, adminUid, adminRole)) {
        sendJson(res, 403, { error: 'Permission denied. Superadmin access required.' });
        return;
      }

      if (!crewId || !confirmName) {
        sendJson(res, 400, { error: 'crewId and confirmName are required.' });
        return;
      }

      await adminDisbandCrew(crewId);
      sendJson(res, 200, { success: true, message: 'Crew successfully disbanded.' });
      return;
    }

    // ── 7. POST /api/crews/join ──
    if (req.method === 'POST' && pathname === '/join') {
      const body = await parseJsonBody(req);
      const { crewId, user } = body;

      if (!crewId || !user?.uid) {
        sendJson(res, 400, { error: 'crewId and authenticated user are required.' });
        return;
      }

      const result = await executeJoinCrewServer({
        crewId,
        code: body.code,
      } as any);

      sendJson(res, 200, result);
      return;
    }

    // ── 8. POST /api/crews/request-action ──
    if (req.method === 'POST' && pathname === '/request-action') {
      const body = await parseJsonBody(req);
      const { crewId, requestId, action, operator } = body;

      if (!crewId || !requestId || !action || !operator?.uid) {
        sendJson(res, 400, { error: 'Missing required moderation parameters.' });
        return;
      }

      const result = await handleRequestActionServer({
        crewId,
        requestId,
        action,
        operator,
      });

      sendJson(res, 200, result);
      return;
    }

    // ── 9. POST /api/crews/cancel-request ──
    if (req.method === 'POST' && pathname === '/cancel-request') {
      const body = await parseJsonBody(req);
      const { crewId, userId } = body;

      if (!crewId || !userId) {
        sendJson(res, 400, { error: 'crewId and userId are required.' });
        return;
      }

      await cancelJoinRequest(crewId, userId);
      sendJson(res, 200, { success: true, message: 'Join request canceled.' });
      return;
    }

    // ── 10. POST /api/crews/update-settings ──
    if (req.method === 'POST' && pathname === '/update-settings') {
      const body = await parseJsonBody(req);
      const { crewId, updates, operator } = body;

      if (!crewId || !updates || !operator?.uid) {
        sendJson(res, 400, { error: 'crewId, updates, and operator are required.' });
        return;
      }

      await updateCrewSettings(crewId, updates);
      sendJson(res, 200, { success: true, message: 'Crew settings updated successfully.' });
      return;
    }

    // ── 11. POST /api/crews/remove-member ──
    if (req.method === 'POST' && pathname === '/remove-member') {
      const body = await parseJsonBody(req);
      const { crewId, targetUid, operator } = body;

      if (!crewId || !targetUid || !operator?.uid) {
        sendJson(res, 400, { error: 'crewId, targetUid, and operator are required.' });
        return;
      }

      await removeMemberFromCrew(crewId, targetUid, operator);
      sendJson(res, 200, { success: true, message: 'Member removed from crew.' });
      return;
    }

    // ── 12. POST /api/crews/leave ──
    if (req.method === 'POST' && pathname === '/leave') {
      const body = await parseJsonBody(req);
      const { crewId, userId } = body;

      if (!crewId || !userId) {
        sendJson(res, 400, { error: 'crewId and userId are required.' });
        return;
      }

      await leaveCrewSelf(crewId, userId);
      sendJson(res, 200, { success: true, message: 'Successfully departed from crew.' });
      return;
    }

    // ── 13. GET /api/crews/:id ──
    const matchId = pathname.match(/^\/([a-zA-Z0-9_-]+)$/);
    if (req.method === 'GET' && matchId) {
      const crewId = matchId[1];
      const crew = await fetchCrewDetails(crewId);
      if (!crew) {
        sendJson(res, 404, { error: 'Crew not found' });
        return;
      }

      // Sanitize member emails from public output
      const sanitizedMembers = (crew.members || []).map((m: any) => ({
        uid: m.uid,
        displayName: m.displayName,
        role: m.role,
        streak: m.streak || 0,
        questionsSolved: m.questionsSolved || 0,
        avatarKey: m.avatarKey || 'skull-01',
        avatarVariant: m.avatarVariant || 'red-on-black',
        joinedAt: m.joinedAt,
      }));

      const publicData = {
        id: crew.id,
        name: crew.name,
        code: crew.code,
        bio: crew.bio || '',
        avatarKey: crew.avatarKey || 'skull-01',
        avatarVariant: crew.avatarVariant || 'red-on-black',
        leaderName: crew.leaderName,
        leaderId: crew.leaderId,
        tier: crew.tier || 'free',
        isPaidActive: crew.tier === 'paid',
        paid_until: crew.paid_until,
        joinMode: crew.joinMode || 'direct',
        minStreak: crew.minStreak || 0,
        maxMembers: crew.maxMembers || DEFAULT_CREW_PRICING.freeMemberLimit,
        isClosed: crew.isClosed || false,
        memberCount: crew.members?.length || 0,
        score: crew.score,
        streak: crew.streak,
        currentQuestions: crew.currentQuestions,
        goalQuestions: crew.goalQuestions,
        members: sanitizedMembers,
      };

      sendJson(res, 200, publicData);
      return;
    }

    sendJson(res, 404, { error: 'Endpoint not found' });
  } catch (err: unknown) {
    console.error('[CrewApiHandler] Error handling request:', err);
    const message = err instanceof Error ? err.message : 'Server error processing crew action';
    sendJson(res, 400, { error: message });
  }
}
