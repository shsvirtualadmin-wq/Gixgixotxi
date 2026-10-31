import { COSMETICS_CATALOG } from '../../../src/data/cosmeticsCatalog';
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
  const subPath = url.pathname.replace(/^\/api\/shop\/?/, '').replace(/\/+$/, '');
  const method = request.method.toUpperCase();
  const db = env.DB;

  try {
    await ensureD1Migration002(db);

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const ip = request.headers.get('CF-Connecting-IP') || 'anon';
      const allowed = await checkRateLimitD1(db, `shop_write:${ip}`, 40, 60000);
      if (!allowed) {
        return errorResponse(request, env, 'Rate limit exceeded. Please wait a moment.', 'RATE_LIMITED', 429);
      }
    }

    // 1. GET /api/shop/items — Authoritative store items list from D1 merged with COSMETICS_CATALOG
    if (subPath === 'items' && method === 'GET') {
      const { results } = await db
        .prepare('SELECT * FROM store_items ORDER BY category ASC, id ASC')
        .all();

      const dbMap = new Map<string, Record<string, any>>();
      for (const r of results || []) {
        dbMap.set(String(r.id), r);
      }

      const items = COSMETICS_CATALOG.map((catItem) => {
        const dbRow = dbMap.get(catItem.id);
        const category =
          catItem.type === 'frame'
            ? 'avatar_frame'
            : catItem.type === 'effect'
            ? 'profile_effect'
            : catItem.type === 'nameplate'
            ? 'nameplate'
            : catItem.type === 'banner'
            ? 'banner'
            : 'avatar';
        return {
          id: catItem.id,
          name: dbRow?.name ? String(dbRow.name) : catItem.name,
          category: dbRow?.category ? String(dbRow.category) : category,
          type: dbRow?.type ? String(dbRow.type) : catItem.animated ? 'animated' : 'static',
          priceKobans:
            dbRow?.price_kobans !== undefined && dbRow?.price_kobans !== null
              ? Math.max(0, Math.floor(Number(dbRow.price_kobans)))
              : Math.max(0, Math.floor(Number(catItem.priceKobans))),
          active: dbRow?.active !== undefined ? Boolean(dbRow.active) : true,
          rarity: dbRow?.rarity || catItem.rarity,
          description: dbRow?.description || catItem.description,
          previewColor: dbRow?.preview_color || catItem.previewColor,
          updatedBy: dbRow?.updated_by || undefined,
          updatedAt: dbRow?.updated_at ? Number(dbRow.updated_at) : undefined,
        };
      });

      // Also include any custom items added in store_items not in static catalog
      const catalogIds = new Set(COSMETICS_CATALOG.map((c) => c.id));
      for (const r of results || []) {
        if (!catalogIds.has(String(r.id))) {
          items.push({
            id: String(r.id),
            name: String(r.name || r.id),
            category: String(r.category || 'avatar'),
            type: String(r.type || 'static'),
            priceKobans: Math.max(0, Math.floor(Number(r.price_kobans ?? 0))),
            active: Boolean(r.active ?? 1),
            rarity: r.rarity || 'common',
            description: r.description || '',
            previewColor: r.preview_color || undefined,
            updatedBy: r.updated_by || undefined,
            updatedAt: r.updated_at ? Number(r.updated_at) : undefined,
          });
        }
      }

      const pricesMap: Record<string, number> = {};
      for (const item of items) {
        pricesMap[item.id] = item.priceKobans;
      }

      return jsonResponse(request, env, { ok: true, items, pricesMap });
    }

    // 2. POST /api/shop/purchase — 100% server-side atomic purchase in db.batch()
    if (subPath === 'purchase' && method === 'POST') {
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

      const body = (await request.json().catch(() => ({}))) as {
        itemId?: string;
        couponCode?: string;
      };
      const itemId = cleanStr(body.itemId, 128);
      const couponCode = cleanStr(body.couponCode, 64).toUpperCase();

      if (!itemId) {
        return errorResponse(request, env, 'Item ID is required.', 'INVALID_ITEM', 400);
      }

      // Look up real item price in D1 (never trust client price)
      const itemMeta = await lookupStoreItemAuthoritative(db, itemId);
      if (!itemMeta) {
        return errorResponse(request, env, 'Store item not found.', 'ITEM_NOT_FOUND', 404);
      }
      if (!itemMeta.active) {
        return errorResponse(request, env, 'This store item is currently unavailable.', 'ITEM_INACTIVE', 400);
      }

      // Check existing ownership and wallet balance
      const [walletRow, userRow, existingUnlock] = await Promise.all([
        db.prepare('SELECT * FROM wallets WHERE uid = ?1 LIMIT 1').bind(user.uid).first(),
        db.prepare('SELECT kobans, owned_json FROM users WHERE uid = ?1 LIMIT 1').bind(user.uid).first().catch(() =>
          db.prepare('SELECT kobans FROM users WHERE uid = ?1 LIMIT 1').bind(user.uid).first()
        ),
        db
          .prepare('SELECT id FROM user_unlocked_items WHERE uid = ?1 AND item_id = ?2 LIMIT 1')
          .bind(user.uid, itemId)
          .first(),
      ]);

      const ownedList = parseJsonSafe<string[]>(walletRow?.owned_json, []);
      if (existingUnlock || ownedList.includes(itemId)) {
        return errorResponse(
          request,
          env,
          `You already own "${itemMeta.name}".`,
          'ALREADY_OWNED',
          409
        );
      }

      let finalPrice = itemMeta.priceKobans;
      let appliedCoupon: Record<string, any> | null = null;

      if (couponCode) {
        const couponRow = await db
          .prepare('SELECT * FROM coupons WHERE code = ?1 LIMIT 1')
          .bind(couponCode)
          .first();

        if (!couponRow || !couponRow.active) {
          return errorResponse(request, env, 'Invalid or inactive coupon code.', 'INVALID_COUPON', 400);
        }
        if (couponRow.expires_at && Number(couponRow.expires_at) < Date.now()) {
          return errorResponse(request, env, 'This coupon has expired.', 'COUPON_EXPIRED', 400);
        }
        if (
          Number(couponRow.max_uses) > 0 &&
          Number(couponRow.used_count) >= Number(couponRow.max_uses)
        ) {
          return errorResponse(
            request,
            env,
            'This coupon has reached its maximum usage limit.',
            'COUPON_EXHAUSTED',
            409
          );
        }

        const priorRedemption = await db
          .prepare('SELECT id FROM coupon_redemptions WHERE code = ?1 AND uid = ?2 LIMIT 1')
          .bind(couponCode, user.uid)
          .first();
        if (priorRedemption) {
          return errorResponse(
            request,
            env,
            'You have already used this coupon code.',
            'COUPON_ALREADY_USED',
            409
          );
        }

        const discountPct = Math.max(0, Math.min(100, Number(couponRow.discount_percent || 0)));
        if (discountPct > 0) {
          finalPrice = Math.max(0, Math.floor(finalPrice * (1 - discountPct / 100)));
        } else if (couponRow.reward_type === 'discount_kobans' && Number(couponRow.reward_value) > 0) {
          finalPrice = Math.max(0, finalPrice - Math.floor(Number(couponRow.reward_value)));
        }
        appliedCoupon = couponRow;
      }

      const currentBalance = Math.max(0, Number(walletRow?.balance ?? userRow?.kobans ?? 0));
      if (currentBalance < finalPrice) {
        return errorResponse(
          request,
          env,
          `Insufficient Kobans. You need ${finalPrice} Kobans (current balance: ${currentBalance}).`,
          'INSUFFICIENT_KOBANS',
          400
        );
      }

      const newBalance = currentBalance - finalPrice;
      const updatedOwned = Array.from(new Set([...ownedList, itemId]));
      const now = Date.now();
      const unlockId = `unlock_${user.uid}_${itemId}`;
      const ledgerId = `pur_${now}_${crypto.randomUUID().slice(0, 8)}`;

      const batchStmts: any[] = [
        db
          .prepare(
            `INSERT INTO wallets (uid, balance, owned_json, equipped_json, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(uid) DO UPDATE SET
               balance = ?2,
               owned_json = ?3,
               updated_at = ?5`
          )
          .bind(
            user.uid,
            newBalance,
            JSON.stringify(updatedOwned),
            walletRow?.equipped_json || '{}',
            now
          ),
        db
          .prepare('UPDATE users SET kobans = ?1, updated_at = ?2 WHERE uid = ?3')
          .bind(newBalance, now, user.uid),
        db
          .prepare(
            `INSERT INTO user_unlocked_items (
              id, uid, item_id, item_name, price_paid, unlocked_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
          )
          .bind(unlockId, user.uid, itemId, itemMeta.name, finalPrice, now),
        db
          .prepare(
            `INSERT INTO wallet_ledger (
              id, uid, type, amount, balance_after, item_id, item_name, reason, created_at
            ) VALUES (?1, ?2, 'purchase', ?3, ?4, ?5, ?6, ?7, ?8)`
          )
          .bind(
            ledgerId,
            user.uid,
            -finalPrice,
            newBalance,
            itemId,
            itemMeta.name,
            `Unlocked ${itemMeta.name}${couponCode ? ` (Coupon: ${couponCode})` : ''}`,
            now
          ),
      ];

      if (appliedCoupon) {
        batchStmts.push(
          db
            .prepare(
              `INSERT INTO coupon_redemptions (
                id, code, uid, reward_type, reward_value, redeemed_at
              ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
            )
            .bind(
              `red_${couponCode}_${user.uid}`,
              couponCode,
              user.uid,
              String(appliedCoupon.reward_type || 'discount'),
              itemMeta.priceKobans - finalPrice,
              now
            ),
          db
            .prepare('UPDATE coupons SET used_count = used_count + 1, updated_at = ?1 WHERE code = ?2')
            .bind(now, couponCode)
        );
      }

      await db.batch(batchStmts);

      return jsonResponse(request, env, {
        ok: true,
        itemId,
        itemName: itemMeta.name,
        pricePaid: finalPrice,
        newBalance,
        owned: updatedOwned,
      });
    }

    // 3. POST /api/shop/coupons/validate
    if (subPath === 'coupons/validate' && method === 'POST') {
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

      const body = (await request.json().catch(() => ({}))) as { code?: string; itemId?: string };
      const code = cleanStr(body.code, 64).toUpperCase();
      if (!code) {
        return errorResponse(request, env, 'Coupon code is required.', 'INVALID_COUPON', 400);
      }

      const couponRow = await db
        .prepare('SELECT * FROM coupons WHERE code = ?1 LIMIT 1')
        .bind(code)
        .first();

      if (!couponRow || !couponRow.active) {
        return errorResponse(request, env, 'Invalid or inactive coupon code.', 'INVALID_COUPON', 404);
      }
      if (couponRow.expires_at && Number(couponRow.expires_at) < Date.now()) {
        return errorResponse(request, env, 'This coupon has expired.', 'COUPON_EXPIRED', 400);
      }
      if (Number(couponRow.max_uses) > 0 && Number(couponRow.used_count) >= Number(couponRow.max_uses)) {
        return errorResponse(request, env, 'Coupon usage limit reached.', 'COUPON_EXHAUSTED', 409);
      }

      const used = await db
        .prepare('SELECT id FROM coupon_redemptions WHERE code = ?1 AND uid = ?2 LIMIT 1')
        .bind(code, user.uid)
        .first();
      if (used) {
        return errorResponse(request, env, 'You have already redeemed this coupon.', 'COUPON_ALREADY_USED', 409);
      }

      return jsonResponse(request, env, {
        ok: true,
        coupon: {
          code: String(couponRow.code),
          description: String(couponRow.description || ''),
          rewardType: String(couponRow.reward_type || 'kobans'),
          rewardValue: Number(couponRow.reward_value || 0),
          discountPercent: Number(couponRow.discount_percent || 0),
        },
      });
    }

    // 4. POST /api/shop/coupons/redeem — Atomic Koban coupon redemption in db.batch()
    if (subPath === 'coupons/redeem' && method === 'POST') {
      const user = await authenticateD1Request(request, env, true);
      if (!user) return errorResponse(request, env, 'Authentication required.', 'UNAUTHENTICATED', 401);

      const body = (await request.json().catch(() => ({}))) as { code?: string };
      const code = cleanStr(body.code, 64).toUpperCase();
      if (!code) {
        return errorResponse(request, env, 'Coupon code is required.', 'INVALID_COUPON', 400);
      }

      const couponRow = await db
        .prepare('SELECT * FROM coupons WHERE code = ?1 LIMIT 1')
        .bind(code)
        .first();

      if (!couponRow || !couponRow.active) {
        return errorResponse(request, env, 'Invalid or inactive coupon code.', 'INVALID_COUPON', 404);
      }
      if (couponRow.expires_at && Number(couponRow.expires_at) < Date.now()) {
        return errorResponse(request, env, 'This coupon has expired.', 'COUPON_EXPIRED', 400);
      }
      if (Number(couponRow.max_uses) > 0 && Number(couponRow.used_count) >= Number(couponRow.max_uses)) {
        return errorResponse(request, env, 'This coupon has reached its maximum usage limit.', 'COUPON_EXHAUSTED', 409);
      }

      const priorRedemption = await db
        .prepare('SELECT id FROM coupon_redemptions WHERE code = ?1 AND uid = ?2 LIMIT 1')
        .bind(code, user.uid)
        .first();
      if (priorRedemption) {
        return errorResponse(request, env, 'You have already redeemed this coupon.', 'COUPON_ALREADY_USED', 409);
      }

      const rewardKobans = Math.max(0, Math.floor(Number(couponRow.reward_value || 0)));
      if (rewardKobans <= 0) {
        return errorResponse(
          request,
          env,
          'This coupon is a discount code to be used during item checkout.',
          'DISCOUNT_COUPON_ONLY',
          400
        );
      }

      const [walletRow, userRow] = await Promise.all([
        db.prepare('SELECT * FROM wallets WHERE uid = ?1 LIMIT 1').bind(user.uid).first(),
        db.prepare('SELECT kobans FROM users WHERE uid = ?1 LIMIT 1').bind(user.uid).first(),
      ]);

      const currentBalance = Math.max(0, Number(walletRow?.balance ?? userRow?.kobans ?? 0));
      const newBalance = currentBalance + rewardKobans;
      const now = Date.now();

      await db.batch([
        db
          .prepare(
            `INSERT INTO coupon_redemptions (
              id, code, uid, reward_type, reward_value, redeemed_at
            ) VALUES (?1, ?2, ?3, 'kobans', ?4, ?5)`
          )
          .bind(`red_${code}_${user.uid}`, code, user.uid, rewardKobans, now),
        db
          .prepare('UPDATE coupons SET used_count = used_count + 1, updated_at = ?1 WHERE code = ?2')
          .bind(now, code),
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
              id, uid, type, amount, balance_after, reason, created_at
            ) VALUES (?1, ?2, 'coupon_redeem', ?3, ?4, ?5, ?6)`
          )
          .bind(
            `led_cpn_${now}_${crypto.randomUUID().slice(0, 8)}`,
            user.uid,
            rewardKobans,
            newBalance,
            `Redeemed coupon ${code}`,
            now
          ),
      ]);

      return jsonResponse(request, env, {
        ok: true,
        code,
        rewardKobans,
        newBalance,
      });
    }

    return errorResponse(request, env, 'Shop endpoint not found.', 'NOT_FOUND', 404);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return errorResponse(request, env, err.message, err.code, err.status);
    }
    return errorResponse(request, env, err?.message || 'Internal server error', 'INTERNAL_ERROR', 500);
  }
}
