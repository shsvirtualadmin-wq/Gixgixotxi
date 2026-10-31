import {
  D1Env,
  HttpError,
  authenticateD1Request,
  checkRateLimitD1,
  cleanStr,
  ensureD1Migration002,
  errorResponse,
  getCorsHeaders,
  jsonResponse,
  lookupStoreItemAuthoritative,
  parseJsonSafe,
} from '../_d1Core';

export async function onRequest(context: {
  request: Request;
  env: D1Env;
}): Promise<Response> {
  const { request, env } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
  }

  const url = new URL(request.url);
  const subPath = url.pathname.replace(/^\/api\/wallet\/?/, '').replace(/\/+$/, '');
  const method = request.method.toUpperCase();
  const db = env.DB;

  try {
    await ensureD1Migration002(db);

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const ip = request.headers.get('CF-Connecting-IP') || 'anon';
      const allowed = await checkRateLimitD1(db, `wallet_write:${ip}`, 60, 60000);
      if (!allowed) {
        return errorResponse(request, env, 'Rate limit exceeded. Please wait a moment.', 'RATE_LIMITED', 429);
      }
    }

    // 1. GET /api/wallet (Get wallet for current user or ?uid=...)
    if (subPath === '' && method === 'GET') {
      const caller = await authenticateD1Request(request, env, false);
      const requestedUid = cleanStr(url.searchParams.get('uid'), 128);
      const targetUid = requestedUid || caller?.uid || '';

      if (!targetUid) {
        return errorResponse(request, env, 'Authentication or uid parameter required.', 'UNAUTHENTICATED', 401);
      }

      const [walletRow, userRow, unlockedRows] = await Promise.all([
        db.prepare('SELECT * FROM wallets WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
        db.prepare('SELECT kobans, equipped_json, avatar, banner, frame, nameplate, effect_id FROM users WHERE uid = ?1 LIMIT 1').bind(targetUid).first(),
        db.prepare('SELECT item_id, item_name, price_paid, unlocked_at FROM user_unlocked_items WHERE uid = ?1 ORDER BY unlocked_at DESC').bind(targetUid).all(),
      ]);

      const ownedFromWallet = parseJsonSafe<string[]>(walletRow?.owned_json, []);
      const ownedFromUnlocked = (unlockedRows?.results || []).map((r: any) => String(r.item_id));
      const ownedSet = new Set<string>([...ownedFromWallet, ...ownedFromUnlocked]);
      const owned = Array.from(ownedSet);

      const equipped = parseJsonSafe<Record<string, any>>(
        walletRow?.equipped_json || userRow?.equipped_json,
        {}
      );
      if (!equipped.avatar && userRow?.avatar) equipped.avatar = userRow.avatar;
      if (!equipped.banner && userRow?.banner) equipped.banner = userRow.banner;
      if (!equipped.frame && userRow?.frame) equipped.frame = userRow.frame;
      if (!equipped.nameplate && userRow?.nameplate) equipped.nameplate = userRow.nameplate;
      if (!equipped.effectId && userRow?.effect_id) equipped.effectId = userRow.effect_id;

      const balance = Math.max(
        0,
        Number(walletRow?.balance ?? userRow?.kobans ?? 0)
      );

      // Only expose balance to the owner or an admin
      const canSeeBalance = Boolean(caller && (caller.uid === targetUid || caller.isAdminOrAbove));

      return jsonResponse(request, env, {
        ok: true,
        wallet: {
          uid: targetUid,
          balance: canSeeBalance ? balance : 0,
          owned,
          equipped,
          unlockedItems: canSeeBalance ? unlockedRows?.results || [] : [],
          updatedAt: Number(walletRow?.updated_at || Date.now()),
        },
      });
    }

    // 2. GET /api/wallet/ledger
    if (subPath === 'ledger' && method === 'GET') {
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

      const targetUid =
        user.isAdminOrAbove && url.searchParams.get('uid')
          ? cleanStr(url.searchParams.get('uid'), 128)
          : user.uid;

      const { results } = await db
        .prepare('SELECT * FROM wallet_ledger WHERE uid = ?1 ORDER BY created_at DESC LIMIT 100')
        .bind(targetUid)
        .all();

      const entries = (results || []).map((r: any) => ({
        id: String(r.id),
        uid: String(r.uid),
        type: String(r.type || 'purchase'),
        amount: Number(r.amount || 0),
        balanceAfter: Number(r.balance_after || 0),
        itemId: r.item_id || undefined,
        itemName: r.item_name || undefined,
        monthKey: r.month_key || undefined,
        reason: String(r.reason || ''),
        adminEmail: r.admin_email || undefined,
        createdAt: Number(r.created_at || Date.now()),
      }));

      return jsonResponse(request, env, { ok: true, ledger: entries });
    }

    // 3. POST /api/wallet/equip (Equip or unequip an unlocked cosmetic item)
    if (subPath === 'equip' && method === 'POST') {
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

      const body = (await request.json().catch(() => ({}))) as {
        slot?: string;
        type?: string;
        itemId?: string | null;
        equipped?: Record<string, any>;
      };

      const [walletRow, userRow, unlockedRows] = await Promise.all([
        db.prepare('SELECT * FROM wallets WHERE uid = ?1 LIMIT 1').bind(user.uid).first(),
        db.prepare('SELECT * FROM users WHERE uid = ?1 LIMIT 1').bind(user.uid).first(),
        db.prepare('SELECT item_id FROM user_unlocked_items WHERE uid = ?1').bind(user.uid).all(),
      ]);

      const ownedSet = new Set<string>([
        ...parseJsonSafe<string[]>(walletRow?.owned_json, []),
        ...(unlockedRows?.results || []).map((r: any) => String(r.item_id)),
      ]);

      const currentEquipped = parseJsonSafe<Record<string, any>>(
        walletRow?.equipped_json || userRow?.equipped_json,
        {}
      );

      if (body.equipped && typeof body.equipped === 'object') {
        Object.assign(currentEquipped, body.equipped);
      } else {
        const slot = cleanStr(body.slot || body.type, 40);
        const itemId = body.itemId ? cleanStr(body.itemId, 128) : null;
        if (!slot) {
          return errorResponse(request, env, 'Cosmetic slot is required.', 'INVALID_SLOT', 400);
        }

        if (itemId) {
          const itemMeta = await lookupStoreItemAuthoritative(db, itemId);
          const isFreeItem = itemMeta && itemMeta.priceKobans === 0;
          if (!ownedSet.has(itemId) && !isFreeItem && !user.isSuperAdmin) {
            return errorResponse(
              request,
              env,
              'You do not own this item yet. Unlock it in the Shop first.',
              'ITEM_NOT_OWNED',
              403
            );
          }
        }

        if (slot === 'frame' || slot === 'avatar_frame') currentEquipped.frame = itemId;
        else if (slot === 'effect' || slot === 'profile_effect' || slot === 'effectId') currentEquipped.effectId = itemId;
        else if (slot === 'banner') currentEquipped.banner = itemId;
        else if (slot === 'nameplate') currentEquipped.nameplate = itemId;
        else if (slot === 'avatar') currentEquipped.avatar = itemId;
        else currentEquipped[slot] = itemId;
      }

      const now = Date.now();
      const equippedJson = JSON.stringify(currentEquipped);
      const balance = Number(walletRow?.balance ?? userRow?.kobans ?? 0);
      const ownedJson = JSON.stringify(Array.from(ownedSet));

      await db.batch([
        db
          .prepare(
            `INSERT INTO wallets (uid, balance, owned_json, equipped_json, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(uid) DO UPDATE SET
               owned_json = excluded.owned_json,
               equipped_json = excluded.equipped_json,
               updated_at = excluded.updated_at`
          )
          .bind(user.uid, balance, ownedJson, equippedJson, now),
        db
          .prepare(
            `UPDATE users SET
              equipped_json = ?1,
              avatar = COALESCE(?2, avatar),
              banner = ?3,
              frame = ?4,
              nameplate = ?5,
              effect_id = ?6,
              updated_at = ?7
             WHERE uid = ?8`
          )
          .bind(
            equippedJson,
            currentEquipped.avatar ?? null,
            currentEquipped.banner ?? null,
            currentEquipped.frame ?? null,
            currentEquipped.nameplate ?? null,
            currentEquipped.effectId ?? null,
            now,
            user.uid
          ),
        db
          .prepare(
            `UPDATE public_profiles SET
              equipped_json = ?1,
              avatar = COALESCE(?2, avatar),
              banner = ?3,
              frame = ?4,
              nameplate = ?5,
              effect_id = ?6,
              updated_at = ?7
             WHERE uid = ?8`
          )
          .bind(
            equippedJson,
            currentEquipped.avatar ?? null,
            currentEquipped.banner ?? null,
            currentEquipped.frame ?? null,
            currentEquipped.nameplate ?? null,
            currentEquipped.effectId ?? null,
            now,
            user.uid
          ),
      ]);

      return jsonResponse(request, env, {
        ok: true,
        equipped: currentEquipped,
        owned: Array.from(ownedSet),
      });
    }

    // 4. POST /api/wallet/monthly-allowance (Claim monthly Kobans allowance once per month)
    if (subPath === 'monthly-allowance' && method === 'POST') {
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

      const now = Date.now();
      const d = new Date(now);
      const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const ledgerId = `monthly_grant_${user.uid}_${monthKey}`;

      const existingClaim = await db
        .prepare('SELECT id FROM wallet_ledger WHERE id = ?1 LIMIT 1')
        .bind(ledgerId)
        .first();

      const [walletRow, userRow] = await Promise.all([
        db.prepare('SELECT * FROM wallets WHERE uid = ?1 LIMIT 1').bind(user.uid).first(),
        db.prepare('SELECT plan, is_premium, kobans FROM users WHERE uid = ?1 LIMIT 1').bind(user.uid).first(),
      ]);

      const currentBalance = Math.max(0, Number(walletRow?.balance ?? userRow?.kobans ?? 0));
      if (existingClaim) {
        return jsonResponse(request, env, {
          ok: true,
          granted: false,
          amount: 0,
          newBalance: currentBalance,
          monthKey,
        });
      }

      const isPro =
        Boolean(userRow?.is_premium) ||
        userRow?.plan === 'pro' ||
        userRow?.plan === 'premium' ||
        user.isCaptainOrAbove;
      const allowance = isPro ? 500 : 150;
      const newBalance = currentBalance + allowance;

      await db.batch([
        db
          .prepare(
            `INSERT INTO wallets (uid, balance, owned_json, equipped_json, updated_at)
             VALUES (?1, ?2, '[]', '{}', ?3)
             ON CONFLICT(uid) DO UPDATE SET balance = ?2, updated_at = ?3`
          )
          .bind(user.uid, newBalance, now),
        db
          .prepare('UPDATE users SET kobans = ?1, updated_at = ?2 WHERE uid = ?3')
          .bind(newBalance, now, user.uid),
        db
          .prepare(
            `INSERT INTO wallet_ledger (
              id, uid, type, amount, balance_after, month_key, reason, created_at
            ) VALUES (?1, ?2, 'monthly_grant', ?3, ?4, ?5, ?6, ?7)`
          )
          .bind(
            ledgerId,
            user.uid,
            allowance,
            newBalance,
            monthKey,
            `Monthly Koban allowance (${monthKey})`,
            now
          ),
      ]);

      return jsonResponse(request, env, {
        ok: true,
        granted: true,
        amount: allowance,
        newBalance,
        monthKey,
      });
    }

    return errorResponse(request, env, 'Wallet endpoint not found.', 'NOT_FOUND', 404);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return errorResponse(request, env, err.message, err.code, err.status);
    }
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}
