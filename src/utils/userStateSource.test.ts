import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getEquippedLoadout,
  setCachedEquippedLoadout,
  subscribeEquippedLoadout,
  clearCachedEquippedLoadout,
  getKobans,
  setCachedKobans,
  subscribeKobans,
  clearCachedKobans,
  measureRequest,
  getSlowestRequests,
  resetRequestTimings,
  recordRequestTiming,
  readSwrCache,
  writeSwrCache,
  clearSwrCache,
} from './userStateSource.ts';

describe('userStateSource — getEquippedLoadout', () => {
  beforeEach(() => {
    clearCachedEquippedLoadout();
  });

  it('returns all-null loadout when user has nothing equipped (never defaults to first catalog item)', () => {
    const res = getEquippedLoadout({ uid: 'u-empty' });
    assert.deepEqual(res, {
      avatar: null,
      frame: null,
      banner: null,
      nameplate: null,
      effect: null,
      photoURL: null,
    });
  });

  it('prefers cached canonical loadout and keeps subscribers synchronized', () => {
    let notifiedAvatar: string | null = null;
    const unsub = subscribeEquippedLoadout('u-1', (next) => {
      notifiedAvatar = next.avatar;
    });

    setCachedEquippedLoadout('u-1', {
      avatar: 'av_crimson_oni',
      frame: 'fr_obsidian_edge',
      banner: 'bn_eclipse',
      nameplate: 'np_gold_line',
      effect: 'ef_starfall',
      photoURL: 'https://example.com/photo.png',
    });

    assert.equal(notifiedAvatar, 'av_crimson_oni');
    const resolved = getEquippedLoadout('u-1');
    assert.equal(resolved.avatar, 'av_crimson_oni');
    assert.equal(resolved.frame, 'fr_obsidian_edge');
    assert.equal(resolved.banner, 'bn_eclipse');
    assert.equal(resolved.nameplate, 'np_gold_line');
    assert.equal(resolved.effect, 'ef_starfall');

    // Explicitly unequipping a slot clears it instead of falling back
    setCachedEquippedLoadout('u-1', { frame: null });
    assert.equal(getEquippedLoadout('u-1').frame, null);
    assert.equal(getEquippedLoadout('u-1').avatar, 'av_crimson_oni');

    unsub();
  });
});

describe('userStateSource — getKobans', () => {
  beforeEach(() => {
    clearCachedKobans();
  });

  it('never returns 0 as a placeholder before balance is loaded', () => {
    const snap = getKobans({ uid: 'u-fresh', loaded: false });
    assert.equal(snap.loaded, false);
    assert.equal(snap.balance, null);

    const snapById = getKobans('u-fresh');
    assert.equal(snapById.loaded, false);
    assert.equal(snapById.balance, null);
  });

  it('returns exact cached balance (including legitimate 0) once loaded and notifies subscribers', () => {
    const updates: Array<number | null> = [];
    const unsub = subscribeKobans('u-wallet', (s) => updates.push(s.balance));

    setCachedKobans('u-wallet', 0);
    assert.equal(getKobans('u-wallet').loaded, true);
    assert.equal(getKobans('u-wallet').balance, 0);

    setCachedKobans('u-wallet', 2450);
    assert.equal(getKobans('u-wallet').balance, 2450);
    assert.deepEqual(updates, [0, 2450]);

    unsub();
  });
});

describe('userStateSource — measureRequest & SWR cache', () => {
  beforeEach(() => {
    resetRequestTimings();
    clearSwrCache();
  });

  it('ranks the slowest three requests descending by duration', () => {
    recordRequestTiming('security:passkeys', 120, 'ok');
    recordRequestTiming('wallet:sync', 980, 'ok');
    recordRequestTiming('plans:requests', 410, 'ok');
    recordRequestTiming('security:sessions', 1420, 'ok');
    recordRequestTiming('locker:catalog', 65, 'ok');

    const top3 = getSlowestRequests(3);
    assert.equal(top3.length, 3);
    assert.deepEqual(
      top3.map((e) => e.label),
      ['security:sessions', 'wallet:sync', 'plans:requests']
    );
  });

  it('rejects requests exceeding timeoutMs and records timeout status', async () => {
    await assert.rejects(
      () =>
        measureRequest(
          'slow:endpoint',
          () => new Promise((resolve) => setTimeout(resolve, 250)),
          30
        ),
      /timed out/i
    );
    const slowest = getSlowestRequests(1);
    assert.equal(slowest[0].label, 'slow:endpoint');
    assert.equal(slowest[0].status, 'timeout');
  });

  it('reads and writes SWR cache entries cleanly', () => {
    writeSwrCache('security:summary:u1', { passkeysCount: 2 });
    const cached = readSwrCache<{ passkeysCount: number }>('security:summary:u1');
    assert.deepEqual(cached, { passkeysCount: 2 });
  });
});
