import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { onRequest as postsApiOnRequest } from '../../functions/api/posts/[[path]]';
import { rowToCommonsPost } from '../../cloudflare/worker';

import { webcrypto } from 'node:crypto';
import { BOARDLY_CLOUDFLARE_CONFIG } from '../config/cloudflareConfig';

const ROOT = process.cwd();
const TEST_KID = 'test-rs256-kid-1';

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

let cachedTestKeyPair: { privateKey: CryptoKey; publicJwk: JsonWebKey } | null = null;
let originalFetch: typeof globalThis.fetch | null = null;

async function ensureTestJwksSetup() {
  if (cachedTestKeyPair) return cachedTestKeyPair;
  const kp = await webcrypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );
  const publicJwk = (await webcrypto.subtle.exportKey('jwk', kp.publicKey)) as JsonWebKey & {
    kid?: string;
    alg?: string;
    use?: string;
  };
  publicJwk.kid = TEST_KID;
  publicJwk.alg = 'RS256';
  publicJwk.use = 'sig';

  originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init?: any) => {
    const urlStr = typeof input === 'string' ? input : input?.url || '';
    if (urlStr === BOARDLY_CLOUDFLARE_CONFIG.googleJwksUrl || urlStr.includes('jwk')) {
      return new Response(JSON.stringify({ keys: [publicJwk] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (urlStr.includes('firestore.googleapis.com')) {
      return new Response(JSON.stringify({}), { status: 404 });
    }
    return originalFetch!(input, init);
  }) as typeof fetch;

  cachedTestKeyPair = { privateKey: kp.privateKey, publicJwk };
  return cachedTestKeyPair;
}

async function signTestFirebaseJwt(payload: Record<string, any>): Promise<string> {
  const { privateKey } = await ensureTestJwksSetup();
  const projectId = BOARDLY_CLOUDFLARE_CONFIG.firebaseProjectId;
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: TEST_KID })
  ).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      iss: `https://securetoken.google.com/${projectId}`,
      aud: projectId,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000) - 10,
      ...payload,
    })
  ).toString('base64url');
  const signingInput = `${header}.${body}`;
  const sigBuf = await webcrypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput)
  );
  const sig = Buffer.from(sigBuf).toString('base64url');
  return `${signingInput}.${sig}`;
}

async function callPostsApi(
  urlPath: string,
  options: { method?: string; token?: string; body?: Record<string, any> } = {}
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {};
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }
  const req = new Request(`https://boardly.cfd${urlPath}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const res = await postsApiOnRequest({
    request: req,
    env: {} as any,
    waitUntil: () => {},
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

describe('BUG 1 — Remove extra red borders/outlines on search bars and inputs', () => {
  it('global index.css excludes form controls from red :focus-visible outline and enforces outline:none + box-shadow:none', () => {
    const css = readSrc('src/index.css');
    assert.match(
      css,
      /:focus-visible:not\(input\):not\(textarea\):not\(select\)/,
      'Global :focus-visible red outline must exclude input, textarea, and select'
    );
    assert.match(
      css,
      /input:focus,\s*input:focus-visible,\s*input:active,[\s\S]*?outline:\s*none\s*!important;/,
      'Global rule must set outline: none !important on input/textarea/select focus/active states'
    );
    assert.match(
      css,
      /--tw-ring-shadow:\s*0 0 #0000 !important;/,
      'Global rule must neutralize Tailwind focus ring shadows on form controls'
    );
  });

  it('Settings search bar, Commons search bar, Chat inputs, and Liquid Glass have no red focus borders or rings', () => {
    const css = readSrc('src/index.css');
    const glassCss = readSrc('src/styles/glass.css');

    const settingsPillBlock = css.match(/\.settings-search-pill:focus-within\s*\{[^}]*\}/)?.[0] || '';
    assert.ok(settingsPillBlock.length > 0, '.settings-search-pill:focus-within rule should exist');
    assert.doesNotMatch(settingsPillBlock, /var\(--accent\)|var\(--red\)|#D71921|215,\s*25,\s*33/i);

    const fsmPillBlock =
      css.match(/\.fsm-search-pill:focus-within,[\s\S]*?\.fsm-search-pill\.is-focused\s*\{[^}]*\}/)?.[0] || '';
    assert.ok(fsmPillBlock.length > 0, '.fsm-search-pill:focus-within rule should exist');
    assert.doesNotMatch(fsmPillBlock, /var\(--nav-icon-active\)|var\(--red\)|#D71921/i);

    const searchWrapperBlock =
      css.match(/\.search-pill-wrapper:focus-within,[\s\S]*?\.boardly-search-wrapper:focus-within\s*\{[^}]*\}/)?.[0] || '';
    assert.ok(searchWrapperBlock.length > 0);
    assert.doesNotMatch(searchWrapperBlock, /215,\s*25,\s*33|#D71921|var\(--red\)/i);

    const chatInputBlock = css.match(/\.conv-input:focus\s*\{[^}]*\}/)?.[0] || '';
    assert.ok(chatInputBlock.length > 0);
    assert.doesNotMatch(chatInputBlock, /var\(--rs-red\)|#D71921/i);

    const msgSearchBlock = css.match(/\.msg-search-input:focus\s*\{[^}]*\}/)?.[0] || '';
    assert.ok(msgSearchBlock.length > 0);
    assert.doesNotMatch(msgSearchBlock, /var\(--rs-red\)|#D71921/i);

    const glassInputFocusBlock = glassCss.match(/html\.ui-glass \.lg-input:focus[\s\S]*?\{[^}]*\}/)?.[0] || '';
    assert.ok(glassInputFocusBlock.length > 0);
    assert.doesNotMatch(glassInputFocusBlock, /#D71921|215,\s*25,\s*33/i);

    const glassWrapFocusBlock =
      glassCss.match(/html\.ui-glass \.lg-input-wrap:focus-within[\s\S]*?\{[^}]*\}/)?.[0] || '';
    assert.ok(glassWrapFocusBlock.length > 0);
    assert.doesNotMatch(glassWrapFocusBlock, /#D71921|215,\s*25,\s*33/i);

    // TSX search bar checks (Commons, Global Search, Store, Admin, AI Sidebar)
    const commonsSearch = readSrc('src/components/commons/CommonsSearchModal.tsx');
    assert.doesNotMatch(commonsSearch, /focus-within:border-\[#D71921\]|focus-within:ring-\[#D71921\]/);

    const searchPage = readSrc('src/pages/SearchPage.tsx');
    assert.doesNotMatch(searchPage, /focus-within:border-\[#D71921\]|focus-within:ring-\[#D71921\]/);

    const storePage = readSrc('src/pages/store/StorePage.tsx');
    assert.doesNotMatch(storePage, /focus:border-\[#E11D2A\]/);

    const adminUsers = readSrc('src/pages/admin/AdminUsersPage.tsx');
    assert.doesNotMatch(adminUsers, /focus-within:border-\[#D71921\]/);

    const settingsPage = readSrc('src/components/settings/SettingsPage.tsx');
    assert.match(settingsPage, /background:\s*'transparent'/, 'Settings search input must remain transparent');
    assert.match(settingsPage, /border:\s*0/, 'Settings search input must have no inner border');
  });
});

describe('BUG 2 — Profile posts list and count match Commons', () => {
  const aminaUid = `uid_amina_test_${Date.now()}`;
  const adminUid = `uid_admin_test_${Date.now()}`;
  const otherUid = `uid_zain_test_${Date.now()}`;
  const zeroUid = `uid_zero_test_${Date.now()}`;

  let aminaToken = '';
  let adminToken = '';
  let otherToken = '';

  before(async () => {
    aminaToken = await signTestFirebaseJwt({ sub: aminaUid, user_id: aminaUid, name: 'Amina' });
    adminToken = await signTestFirebaseJwt({
      sub: adminUid,
      user_id: adminUid,
      name: 'Boardly Admin',
      role: 'superadmin',
    });
    otherToken = await signTestFirebaseJwt({ sub: otherUid, user_id: otherUid, name: 'Zain' });
  });

  after(() => {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    }
  });

  const createdIds: string[] = [];

  it('rowToCommonsPost returns both authorUid and authorId for normal posts and strictly hides both for anonymous posts', () => {
    const publicPost = rowToCommonsPost({
      id: 'p_pub_1',
      title: 'PRACTICE – Permutations vs Combinations',
      description: '20 solved practice problems for FSc Math.',
      type: 'discussion',
      is_anonymous: 0,
      author_uid: aminaUid,
      real_author_uid: aminaUid,
      author_name: 'Amina',
      created_at: Date.now(),
    });
    assert.equal(publicPost.authorUid, aminaUid);
    assert.equal(publicPost.authorId, aminaUid);
    assert.equal(publicPost.isAnonymous, false);

    const anonPost = rowToCommonsPost({
      id: 'p_anon_1',
      title: 'Anonymous doubt about organic reactions',
      description: 'Need help with SN1 vs SN2.',
      type: 'doubt',
      is_anonymous: 1,
      author_uid: null,
      real_author_uid: aminaUid,
      author_name: 'Anonymous Student',
      created_at: Date.now(),
    });
    assert.equal(anonPost.authorUid, null);
    assert.equal(anonPost.authorId, null);
    assert.equal(anonPost.authorName, 'Anonymous Student');
    assert.equal(anonPost.isAnonymous, true);
  });

  it('shows all normal Commons posts for student and admin accounts with exact matching count, and protects anonymous posts from other viewers', async () => {
    // 1. Seed diverse Commons posts for Amina: discussion, doubt, file, photo, plus 1 anonymous post
    const aminaSeedPayloads = [
      {
        title: 'PRACTICE – Permutations vs Combinations',
        description: 'Step-by-step practice sheet for Chapter 7.',
        type: 'discussion',
        subject: 'Mathematics',
        authorName: 'Amina',
        isAnonymous: false,
      },
      {
        title: 'Doubt: Projectile motion horizontal range',
        description: 'Why is maximum range achieved at 45 degrees?',
        type: 'doubt',
        subject: 'Physics',
        authorName: 'Amina',
        isAnonymous: false,
      },
      {
        title: 'Chemistry Ch 4 Past Paper PDF',
        description: 'Attached past paper file for revision.',
        type: 'file',
        subject: 'Chemistry',
        files: [{ url: '/api/posts/download?key=posts/test/chem.pdf', name: 'chem-ch4.pdf', type: 'application/pdf', size: 12000 }],
        authorName: 'Amina',
        isAnonymous: false,
      },
      {
        title: 'Diagram photo: Cell mitosis phases',
        description: 'Hand-drawn biology revision diagram.',
        type: 'photo',
        subject: 'Biology',
        files: [{ url: '/api/posts/file?key=posts/test/mitosis.png', name: 'mitosis.png', type: 'image/png', size: 8000 }],
        authorName: 'Amina',
        isAnonymous: false,
      },
      {
        title: 'Anonymous exam stress question',
        description: 'How do you manage anxiety before board exams?',
        type: 'doubt',
        subject: 'General',
        authorName: 'Anonymous Student',
        isAnonymous: true,
      },
    ];

    for (const payload of aminaSeedPayloads) {
      const res = await callPostsApi('/api/posts', {
        method: 'POST',
        token: aminaToken,
        body: payload,
      });
      assert.equal(res.status, 201, `Expected 201 creating post "${payload.title}"`);
      createdIds.push(res.data.postId);
    }

    // Seed 1 post for Admin account
    const adminPostRes = await callPostsApi('/api/posts', {
      method: 'POST',
      token: adminToken,
      body: {
        title: 'Official Boardly Exam Schedule Update',
        description: 'Federal Board HSSC dates announced.',
        type: 'public',
        subject: 'General',
        authorName: 'Boardly Admin',
        isAnonymous: false,
      },
    });
    assert.equal(adminPostRes.status, 201);
    createdIds.push(adminPostRes.data.postId);

    // 2. Public/Other user viewing Amina's profile (both ?authorUid= and legacy ?authorId= must work)
    const otherViewByUid = await callPostsApi(`/api/posts?authorUid=${encodeURIComponent(aminaUid)}&limit=100`, {
      token: otherToken,
    });
    assert.equal(otherViewByUid.status, 200);
    assert.equal(otherViewByUid.data.total, 4, 'Other user sees all 4 normal posts (discussion, doubt, file, photo)');
    assert.equal(otherViewByUid.data.posts.length, 4);
    assert.ok(
      otherViewByUid.data.posts.some((p: any) => p.title === 'PRACTICE – Permutations vs Combinations'),
      'Amina Commons post must appear on her profile'
    );
    assert.ok(
      otherViewByUid.data.posts.every((p: any) => p.isAnonymous === false && p.authorUid === aminaUid && p.authorId === aminaUid),
      'No anonymous posts may leak to another viewer'
    );

    const otherViewByLegacyAuthorId = await callPostsApi(
      `/api/posts?authorId=${encodeURIComponent(aminaUid)}&limit=100`
    );
    assert.equal(otherViewByLegacyAuthorId.status, 200);
    assert.equal(otherViewByLegacyAuthorId.data.total, 4);

    // 3. Spoof attempt: another user passes includeOwnAnonymous=true for Amina's profile -> MUST BE DENIED (still only 4 public posts)
    const spoofRes = await callPostsApi(
      `/api/posts?authorUid=${encodeURIComponent(aminaUid)}&includeOwnAnonymous=true&limit=100`,
      { token: otherToken }
    );
    assert.equal(spoofRes.status, 200);
    assert.equal(spoofRes.data.total, 4, 'Spoofed includeOwnAnonymous must NOT return anonymous posts');
    assert.ok(spoofRes.data.posts.every((p: any) => !p.isAnonymous));

    // 4. Amina viewing her OWN profile with includeOwnAnonymous=true -> sees all 4 normal posts + 1 own anonymous post (marked anonymous)
    const ownView = await callPostsApi(
      `/api/posts?authorUid=${encodeURIComponent(aminaUid)}&includeOwnAnonymous=true&limit=100`,
      { token: aminaToken }
    );
    assert.equal(ownView.status, 200);
    assert.equal(ownView.data.total, 5, 'Owner sees 4 public posts + 1 own anonymous post');
    assert.equal(ownView.data.posts.length, 5);
    const anonItem = ownView.data.posts.find((p: any) => p.isAnonymous);
    assert.ok(anonItem, 'Own anonymous post should be present on own profile');
    assert.equal(anonItem.authorUid, null, 'Anonymous post payload must still scrub authorUid');
    assert.equal(anonItem.authorId, null, 'Anonymous post payload must still scrub authorId');

    // 5. Admin profile shows admin's own post
    const adminView = await callPostsApi(`/api/posts?authorUid=${encodeURIComponent(adminUid)}&limit=100`);
    assert.equal(adminView.status, 200);
    assert.equal(adminView.data.total, 1);
    assert.equal(adminView.data.posts[0].title, 'Official Boardly Exam Schedule Update');

    // 6. Zero-post user still gets empty list and 0 count
    const zeroView = await callPostsApi(`/api/posts?authorUid=${encodeURIComponent(zeroUid)}&limit=100`);
    assert.equal(zeroView.status, 200);
    assert.equal(zeroView.data.total, 0);
    assert.equal(zeroView.data.posts.length, 0);
  });

  it('creating and deleting a post updates the returned profile count immediately', async () => {
    const before = await callPostsApi(
      `/api/posts?authorUid=${encodeURIComponent(aminaUid)}&includeOwnAnonymous=true&limit=100`,
      { token: aminaToken }
    );
    const beforeCount = before.data.total;

    // Create new post
    const created = await callPostsApi('/api/posts', {
      method: 'POST',
      token: aminaToken,
      body: {
        title: 'Fresh Integration Practice Note',
        description: 'Quick integration by parts formula.',
        type: 'discussion',
        subject: 'Mathematics',
        authorName: 'Amina',
        isAnonymous: false,
      },
    });
    assert.equal(created.status, 201);
    const newPostId = created.data.postId;

    const afterCreate = await callPostsApi(
      `/api/posts?authorUid=${encodeURIComponent(aminaUid)}&includeOwnAnonymous=true&limit=100`,
      { token: aminaToken }
    );
    assert.equal(afterCreate.data.total, beforeCount + 1, 'Count must increment immediately after create');
    assert.ok(afterCreate.data.posts.some((p: any) => p.id === newPostId));

    // Delete post
    const del = await callPostsApi(`/api/posts/${encodeURIComponent(newPostId)}`, {
      method: 'DELETE',
      token: aminaToken,
    });
    assert.equal(del.status, 200);

    const afterDelete = await callPostsApi(
      `/api/posts?authorUid=${encodeURIComponent(aminaUid)}&includeOwnAnonymous=true&limit=100`,
      { token: aminaToken }
    );
    assert.equal(afterDelete.data.total, beforeCount, 'Count must decrement immediately after delete');
    assert.ok(!afterDelete.data.posts.some((p: any) => p.id === newPostId));
  });

  it('ProfilePostsSection queries authorUid, reads authorUid/authorId, and syncs on boardly:posts-changed', () => {
    const profilePostsSrc = readSrc('src/components/profile/ProfilePostsSection.tsx');
    assert.match(profilePostsSrc, /authorUid:\s*targetUid/, 'ProfilePostsSection must query using authorUid');
    assert.match(
      profilePostsSrc,
      /raw\.authorUid\s*\|\|\s*raw\.authorId/,
      'normalizeServerPost must read authorUid before authorId'
    );
    assert.match(
      profilePostsSrc,
      /addEventListener\('boardly:posts-changed'/,
      'ProfilePostsSection must listen to boardly:posts-changed for immediate updates'
    );
    assert.match(
      profilePostsSrc,
      /totalPostsCount\.toLocaleString\(\)/,
      'Posts count badge must be computed from actual fetched posts'
    );
    assert.match(
      profilePostsSrc,
      /posts\.length === 0 \?/,
      'No posts yet state must only render when posts.length === 0'
    );
  });
});
