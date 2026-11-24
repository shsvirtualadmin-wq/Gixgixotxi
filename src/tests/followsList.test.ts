import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../cloudflare/worker';

interface MockFollowRow {
  follower_uid: string;
  following_uid: string;
  created_at: number;
}

interface MockDbState {
  follows: MockFollowRow[];
  user_usernames: Map<string, Record<string, any>>;
  guest_accounts: Map<string, Record<string, any>>;
  user_roles: Map<string, Record<string, any>>;
  user_pro_badge: Map<string, Record<string, any>>;
  user_plus_badge: Map<string, Record<string, any>>;
  user_subscriptions: Map<string, Record<string, any>>;
  user_wallets: Map<string, Record<string, any>>;
}

function createMockD1(state: MockDbState) {
  return {
    async batch(stmts: any[]) {
      const out = [];
      for (const s of stmts) {
        out.push(await s.run());
      }
      return out;
    },
    prepare(sql: string) {
      let bindings: any[] = [];
      const stmt = {
        bind(...args: any[]) {
          bindings = args;
          return stmt;
        },
        async first<T = any>(): Promise<T | null> {
          const res = await stmt.all<T>();
          return res.results[0] ?? null;
        },
        async run() {
          return { success: true, meta: { changes: 0 } };
        },
        async all<T = any>(): Promise<{ results: T[] }> {
          const normalized = sql.replace(/\s+/g, ' ').trim();

          // COUNT(*) FROM follows
          if (/SELECT COUNT\(\*\) AS cnt FROM follows WHERE following_uid = \?1/i.test(normalized)) {
            const targetUid = String(bindings[0] || '');
            const cnt = state.follows.filter((f) => f.following_uid === targetUid).length;
            return { results: [{ cnt } as T] };
          }
          if (/SELECT COUNT\(\*\) AS cnt FROM follows WHERE follower_uid = \?1/i.test(normalized)) {
            const targetUid = String(bindings[0] || '');
            const cnt = state.follows.filter((f) => f.follower_uid === targetUid).length;
            return { results: [{ cnt } as T] };
          }

          // Paginated LEFT JOIN query on follows
          if (/FROM follows f LEFT JOIN user_usernames/i.test(normalized)) {
            const isFollowers = /WHERE f\.following_uid = \?1/i.test(normalized);
            const targetUid = String(bindings[0] || '');
            const limit = Number(bindings[1] ?? 50);
            const offset = Number(bindings[2] ?? 0);

            const matching = state.follows
              .filter((f) => (isFollowers ? f.following_uid === targetUid : f.follower_uid === targetUid))
              .sort((a, b) => b.created_at - a.created_at)
              .slice(offset, offset + limit);

            const rows = matching.map((f) => {
              const uid = isFollowers ? f.follower_uid : f.following_uid;
              const uu = state.user_usernames.get(uid) || {};
              const ga = state.guest_accounts.get(uid) || {};
              const ur = state.user_roles.get(uid) || {};
              const pb = state.user_pro_badge.get(uid) || {};
              const plb = state.user_plus_badge.get(uid) || {};
              return {
                uid,
                followed_at: f.created_at,
                uu_username_display: uu.username_display ?? null,
                uu_username_lower: uu.username_lower ?? null,
                uu_display_name: uu.display_name ?? null,
                uu_avatar: uu.avatar ?? null,
                uu_frame: uu.frame ?? null,
                uu_role: uu.role ?? null,
                uu_custom_role: uu.custom_role ?? null,
                ga_username: ga.username ?? null,
                ga_display_name: ga.display_name ?? null,
                ga_role: ga.role ?? null,
                ga_tests_completed: ga.tests_completed ?? null,
                ga_questions_solved: ga.total_questions_solved ?? null,
                ga_streak: ga.streak ?? null,
                ga_stats_json: ga.stats_json ?? null,
                ur_role: ur.role ?? null,
                ur_custom_role: ur.custom_role ?? null,
                pro_badge_design: pb.design ?? null,
                pro_badge_visible: pb.visible ?? null,
                plus_badge_design: plb.plus_badge_design ?? null,
                plus_badge_visible: plb.plus_badge_visible ?? null,
              } as T;
            });

            return { results: rows };
          }

          // Badge batch resolver queries
          if (/FROM user_plus_badge WHERE user_id IN/i.test(normalized)) {
            const results = bindings
              .map((uid) => state.user_plus_badge.get(String(uid)))
              .filter(Boolean) as T[];
            return { results };
          }
          if (/FROM user_pro_badge WHERE user_id IN/i.test(normalized)) {
            const results = bindings
              .map((uid) => state.user_pro_badge.get(String(uid)))
              .filter(Boolean) as T[];
            return { results };
          }
          if (/FROM user_usernames WHERE uid IN/i.test(normalized)) {
            const results = bindings
              .map((uid) => state.user_usernames.get(String(uid)))
              .filter(Boolean) as T[];
            return { results };
          }
          if (/FROM user_subscriptions WHERE/i.test(normalized)) {
            const results = bindings
              .map((uid) => state.user_subscriptions.get(String(uid)))
              .filter(Boolean) as T[];
            return { results };
          }
          if (/FROM user_wallets WHERE/i.test(normalized)) {
            const results = bindings
              .map((uid) => state.user_wallets.get(String(uid)))
              .filter(Boolean) as T[];
            return { results };
          }
          if (/FROM user_roles WHERE/i.test(normalized)) {
            const results = bindings
              .map((uid) => state.user_roles.get(String(uid)))
              .filter(Boolean) as T[];
            return { results };
          }

          return { results: [] };
        },
      };
      return stmt;
    },
  };
}

function buildSeededEnv() {
  const futureIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const state: MockDbState = {
    follows: [
      // 5 followers for user_target
      { follower_uid: 'f1_plus', following_uid: 'user_target', created_at: 1700000005000 },
      { follower_uid: 'f2_pro', following_uid: 'user_target', created_at: 1700000004000 },
      { follower_uid: 'f3_missing_profile', following_uid: 'user_target', created_at: 1700000003000 },
      { follower_uid: 'f4_student', following_uid: 'user_target', created_at: 1700000002000 },
      { follower_uid: 'f5_hidden_plus', following_uid: 'user_target', created_at: 1700000001000 },
      // 1 following for user_target
      { follower_uid: 'user_target', following_uid: 'mentor_1', created_at: 1700000006000 },
    ],
    user_usernames: new Map([
      [
        'f1_plus',
        {
          uid: 'f1_plus',
          username_display: 'AishaPlus',
          username_lower: 'aishaplus',
          display_name: 'Aisha Khan',
          avatar: 'pfp_topper',
          frame: 'frame-gold',
          role: 'student',
        },
      ],
      [
        'f2_pro',
        {
          uid: 'f2_pro',
          username_display: 'BilalPro',
          username_lower: 'bilalpro',
          display_name: 'Bilal Ahmed',
          avatar: 'pfp_scholar',
          frame: 'none',
          role: 'student',
        },
      ],
      // f3_missing_profile intentionally omitted from ALL joined tables
      [
        'f4_student',
        {
          uid: 'f4_student',
          username_display: 'ZaraStudy',
          username_lower: 'zarastudy',
          display_name: 'Zara Ali',
          avatar: null,
          frame: null,
          role: 'student',
        },
      ],
      [
        'f5_hidden_plus',
        {
          uid: 'f5_hidden_plus',
          username_display: 'OmarHidden',
          username_lower: 'omarhidden',
          display_name: 'Omar Farooq',
          avatar: null,
          frame: null,
          role: 'student',
        },
      ],
      [
        'mentor_1',
        {
          uid: 'mentor_1',
          username_display: 'ProfTariq',
          username_lower: 'proftariq',
          display_name: 'Tariq Mahmood',
          avatar: 'pfp_mentor',
          frame: null,
          role: 'student',
        },
      ],
    ]),
    guest_accounts: new Map([
      [
        'f4_student',
        {
          uid: 'f4_student',
          tests_completed: 10,
          total_questions_solved: 100,
          streak: 5,
        },
      ],
    ]),
    user_roles: new Map([['f1_plus', { uid: 'f1_plus', role: 'superadmin' }]]),
    user_pro_badge: new Map([
      ['f2_pro', { user_id: 'f2_pro', design: 'obsidian', visible: 1 }],
    ]),
    user_plus_badge: new Map([
      ['f1_plus', { user_id: 'f1_plus', plus_badge_design: 7, plus_badge_visible: 1 }],
      ['f5_hidden_plus', { user_id: 'f5_hidden_plus', plus_badge_design: 12, plus_badge_visible: 0 }],
    ]),
    user_subscriptions: new Map([
      ['f1_plus', { uid: 'f1_plus', user_id: 'f1_plus', plan: 'plus', status: 'active', expires_at: futureIso }],
      ['f2_pro', { uid: 'f2_pro', user_id: 'f2_pro', plan: 'pro', status: 'active', expires_at: futureIso }],
      ['f5_hidden_plus', { uid: 'f5_hidden_plus', user_id: 'f5_hidden_plus', plan: 'plus', status: 'active', expires_at: futureIso }],
    ]),
    user_wallets: new Map([
      ['f1_plus', { uid: 'f1_plus', plan: 'plus', plan_expires_at: futureIso }],
      ['f2_pro', { uid: 'f2_pro', plan: 'pro', plan_expires_at: futureIso }],
      ['f5_hidden_plus', { uid: 'f5_hidden_plus', plan: 'plus', plan_expires_at: futureIso }],
    ]),
  };

  return { DB: createMockD1(state) } as any;
}

test('GET /api/followers returns all 5 followers with LEFT JOIN resilience and saved PLUS/PRO badges', async () => {
  const env = buildSeededEnv();
  const req = new Request('https://boardly.cfd/api/followers?uid=user_target&limit=50&offset=0');
  const res = await worker.fetch(req, env, {} as any);

  assert.equal(res.status, 200);
  const data: any = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.total, 5);
  assert.equal(data.followersCount, 5);
  assert.equal(data.hasMore, false);
  assert.equal(data.followers.length, 5);

  const byUid = new Map<string, any>(data.followers.map((u: any) => [u.uid, u]));

  // Follower 1: active Plus badge visible = 7, staff role preserved for RoleBadge display
  const f1 = byUid.get('f1_plus');
  assert.equal(f1.displayName, 'Aisha Khan');
  assert.equal(f1.username, 'AishaPlus');
  assert.equal(f1.plusBadge, 7);
  assert.equal(f1.plus_badge_design, 7);
  assert.equal(f1.plus_badge_visible, true);
  assert.equal(f1.role, 'superadmin');

  // Follower 2: active Pro badge
  const f2 = byUid.get('f2_pro');
  assert.equal(f2.displayName, 'Bilal Ahmed');
  assert.equal(f2.proBadgeDesign, 'obsidian');
  assert.equal(f2.proBadgeVisible, true);

  // Follower 3: missing from all joined tables -> still returned cleanly via LEFT JOIN
  const f3 = byUid.get('f3_missing_profile');
  assert.ok(f3);
  assert.equal(f3.displayName, 'Student');
  assert.equal(f3.username, null);
  assert.equal(f3.level, 1);
  assert.equal(f3.plusBadge, null);
  assert.equal(f3.proBadge, null);

  // Follower 4: level computed from guest_accounts stats (10*120 + 100*8 + 5*50 = 2250 => lv 5)
  const f4 = byUid.get('f4_student');
  assert.equal(f4.level, 5);

  // Follower 5: hidden PLUS badge resolves to plusBadge: null
  const f5 = byUid.get('f5_hidden_plus');
  assert.equal(f5.plusBadge, null);
  assert.equal(f5.plus_badge_visible, false);
});

test('GET /api/following returns the 1 followed user with matching total', async () => {
  const env = buildSeededEnv();
  const req = new Request('https://boardly.cfd/api/following?uid=user_target&limit=50&offset=0');
  const res = await worker.fetch(req, env, {} as any);

  assert.equal(res.status, 200);
  const data: any = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.total, 1);
  assert.equal(data.followingCount, 1);
  assert.equal(data.hasMore, false);
  assert.equal(data.following.length, 1);
  assert.equal(data.following[0].uid, 'mentor_1');
  assert.equal(data.following[0].displayName, 'Tariq Mahmood');
  assert.equal(data.following[0].username, 'ProfTariq');
});

test('GET /api/followers returns empty array and total 0 for user with 0 followers', async () => {
  const env = buildSeededEnv();
  const req = new Request('https://boardly.cfd/api/followers?uid=user_zero&limit=50&offset=0');
  const res = await worker.fetch(req, env, {} as any);

  assert.equal(res.status, 200);
  const data: any = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.total, 0);
  assert.equal(data.followersCount, 0);
  assert.equal(data.hasMore, false);
  assert.deepEqual(data.followers, []);
});

test('GET /api/followers paginates properly with limit and offset', async () => {
  const env = buildSeededEnv();

  const p1Res = await worker.fetch(
    new Request('https://boardly.cfd/api/followers?uid=user_target&limit=2&offset=0'),
    env,
    {} as any
  );
  const p1: any = await p1Res.json();
  assert.equal(p1.total, 5);
  assert.equal(p1.followers.length, 2);
  assert.equal(p1.hasMore, true);

  const p2Res = await worker.fetch(
    new Request('https://boardly.cfd/api/followers?uid=user_target&limit=2&offset=2'),
    env,
    {} as any
  );
  const p2: any = await p2Res.json();
  assert.equal(p2.followers.length, 2);
  assert.equal(p2.hasMore, true);

  const p3Res = await worker.fetch(
    new Request('https://boardly.cfd/api/followers?uid=user_target&limit=2&offset=4'),
    env,
    {} as any
  );
  const p3: any = await p3Res.json();
  assert.equal(p3.followers.length, 1);
  assert.equal(p3.hasMore, false);

  const allUids = [...p1.followers, ...p2.followers, ...p3.followers].map((u: any) => u.uid);
  assert.equal(new Set(allUids).size, 5);
});

test('GET /api/followers and /api/following reject missing uid with 400', async () => {
  const env = buildSeededEnv();
  const r1 = await worker.fetch(new Request('https://boardly.cfd/api/followers'), env, {} as any);
  assert.equal(r1.status, 400);

  const r2 = await worker.fetch(new Request('https://boardly.cfd/api/following'), env, {} as any);
  assert.equal(r2.status, 400);
});
