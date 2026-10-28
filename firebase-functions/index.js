/**
 * Boardly Firebase Cloud Functions
 * Production callable endpoints for safe store unlocking and peer follow graph operations.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Baseline store item prices fallback map
const CATALOG_BASE_PRICES = {
  // Avatars
  pfp_crimson_ronin: { name: 'Crimson Ronin', priceKobans: 500 },
  pfp_sakura_kitsune: { name: 'Sakura Kitsune', priceKobans: 490 },
  pfp_waterfall_dragon: { name: 'Waterfall Dragon', priceKobans: 480 },
  pfp_torii_mist: { name: 'Mist Torii Gate', priceKobans: 380 },
  // Frames
  'frame-bronze-ronin': { name: 'Bronze Ronin', priceKobans: 90 },
  'frame-carved-obsidian': { name: 'Carved Obsidian', priceKobans: 100 },
  'frame-neon-cyber': { name: 'Neon Cyber', priceKobans: 120 },
  'frame-crimson-samurai': { name: 'Crimson Samurai', priceKobans: 110 },
  'frame-imperial-gold': { name: 'Imperial Gold', priceKobans: 150 },
  'frame-slate-scholar': { name: 'Slate Scholar', priceKobans: 80 },
  // Nameplates
  'plate-galaxy-pioneer': { name: 'Galaxy Pioneer', priceKobans: 90 },
  'plate-crimson-blade': { name: 'Crimson Blade', priceKobans: 90 },
  'plate-cyber-matrix': { name: 'Cyber Matrix', priceKobans: 85 },
  // Effects
  'effect-cherry-storm': { name: 'Cherry Blossom Storm', priceKobans: 110 },
  'effect-rising-embers': { name: 'Rising Embers', priceKobans: 100 },
  'effect-electric-arc': { name: 'Electric Arc', priceKobans: 120 },
};

/**
 * Super Admin check helper
 */
function isSuperAdminUser(auth) {
  if (!auth) return false;
  const email = (auth.token && auth.token.email ? auth.token.email : '').toLowerCase().trim();
  const uid = auth.uid || '';
  return (
    email === 'shsvirtualadmin@gmail.com' ||
    email === 'support@boardly.cfd' ||
    uid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2' ||
    Boolean(auth.token && (auth.token.admin === true || auth.token.role === 'admin' || auth.token.role === 'superadmin'))
  );
}

/**
 * CALLABLE CLOUD FUNCTION: unlockItem
 * Purchases & unlocks a cosmetic item safely using a Firestore transaction:
 * - Checks price server-side
 * - Checks balance
 * - Prevents double unlock
 * - Deducts Kobans
 * - Writes users/{uid}/unlocked/{itemId}
 * - Updates wallets/{uid}.owned and balance
 * - Appends immutable ledger entry
 */
exports.unlockItem = functions.https.onCall(async (data, context) => {
  // 1. Authenticate caller strictly via verified Firebase auth context
  const callerUid = context.auth ? context.auth.uid : null;
  if (!callerUid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to unlock items from the Boardly Store.'
    );
  }

  const itemId = data?.itemId;
  if (!itemId || typeof itemId !== 'string' || !itemId.trim()) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'A valid cosmetic itemId is required.'
    );
  }

  const cleanItemId = itemId.trim();
  const isSuperAdmin = isSuperAdminUser(context.auth);

  // References
  const userRef = db.collection('users').doc(callerUid);
  const walletRef = db.collection('wallets').doc(callerUid);
  const unlockedRef = userRef.collection('unlocked').doc(cleanItemId);
  const storeItemRef = db.collection('store_items').doc(cleanItemId);

  return await db.runTransaction(async (tx) => {
    // Check if already unlocked in users/{uid}/unlocked/{itemId}
    const unlockedSnap = await tx.get(unlockedRef);
    if (unlockedSnap.exists) {
      throw new functions.https.HttpsError(
        'already-exists',
        'You have already unlocked this cosmetic item.'
      );
    }

    // Read wallet, user profile, and live store item pricing
    const [walletSnap, userSnap, storeItemSnap] = await Promise.all([
      tx.get(walletRef),
      tx.get(userRef),
      tx.get(storeItemRef),
    ]);

    let currentBalance = 0;
    let currentOwned = [];

    if (walletSnap.exists) {
      const wData = walletSnap.data() || {};
      currentBalance = typeof wData.balance === 'number' ? Math.max(0, wData.balance) : 0;
      currentOwned = Array.isArray(wData.owned) ? wData.owned : [];
    } else if (userSnap.exists) {
      const uData = userSnap.data() || {};
      currentBalance = typeof uData.kobans === 'number'
        ? uData.kobans
        : (typeof uData.kobanBalance === 'number' ? uData.kobanBalance : 0);
    }

    // Check if already in wallet owned list
    if (currentOwned.includes(cleanItemId)) {
      throw new functions.https.HttpsError(
        'already-exists',
        'You already own this cosmetic item.'
      );
    }

    // Determine authoritative server price
    let priceKobans = 90;
    let itemName = cleanItemId;
    let active = true;

    if (storeItemSnap.exists) {
      const sData = storeItemSnap.data() || {};
      if (typeof sData.priceKobans === 'number') {
        priceKobans = Math.max(0, sData.priceKobans);
      }
      if (sData.name) itemName = sData.name;
      if (sData.active === false) active = false;
    } else if (CATALOG_BASE_PRICES[cleanItemId]) {
      priceKobans = CATALOG_BASE_PRICES[cleanItemId].priceKobans;
      itemName = CATALOG_BASE_PRICES[cleanItemId].name;
    }

    if (!active && !isSuperAdmin) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `"${itemName}" is currently inactive in the store.`
      );
    }

    const effectivePrice = isSuperAdmin ? 0 : priceKobans;

    // Verify sufficient balance
    if (currentBalance < effectivePrice) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Insufficient Kobans balance. You have ${currentBalance.toLocaleString()} Kobans, but ${itemName} costs ${effectivePrice.toLocaleString()} Kobans.`
      );
    }

    const newBalance = Math.max(0, currentBalance - effectivePrice);
    const updatedOwned = currentOwned.includes(cleanItemId)
      ? currentOwned
      : [...currentOwned, cleanItemId];

    const now = admin.firestore.FieldValue.serverTimestamp();

    // 1. Write users/{uid}/unlocked/{itemId}
    tx.set(unlockedRef, {
      itemId: cleanItemId,
      itemName,
      pricePaid: effectivePrice,
      unlockedAt: now,
    });

    // 2. Update wallets/{uid}
    if (walletSnap.exists) {
      tx.update(walletRef, {
        balance: newBalance,
        owned: updatedOwned,
        updatedAt: now,
      });
    } else {
      tx.set(walletRef, {
        balance: newBalance,
        owned: updatedOwned,
        equipped: { effect: null, frame: null, nameplate: null, avatar: null, banner: null },
        updatedAt: now,
      }, { merge: true });
    }

    // 3. Keep user doc kobans in sync
    if (userSnap.exists) {
      tx.update(userRef, {
        kobans: newBalance,
        kobanBalance: newBalance,
        updatedAt: now,
      });
    }

    // 4. Append immutable ledger history entry
    const ledgerRef = walletRef.collection('ledger').doc(`unlock_${cleanItemId}_${Date.now()}`);
    tx.set(ledgerRef, {
      id: ledgerRef.id,
      type: 'purchase',
      amount: -effectivePrice,
      balanceAfter: newBalance,
      itemId: cleanItemId,
      itemName,
      reason: isSuperAdmin ? `Super Admin unlock: ${itemName}` : `Store unlock: ${itemName}`,
      timestamp: now,
    });

    return {
      success: true,
      itemId: cleanItemId,
      itemName,
      pricePaid: effectivePrice,
      newBalance,
      owned: updatedOwned,
    };
  });
});

/**
 * CALLABLE CLOUD FUNCTION: toggleFollow
 * Atomic follow / unfollow operation:
 * - Checks auth
 * - Disallows self-following
 * - Creates/deletes users/{callerUid}/following/{targetUid}
 * - Creates/deletes users/{targetUid}/followers/{callerUid}
 * - Atomically increments/decrements followingCount and followersCount
 * - Updates both users and publicProfiles collections
 */
exports.toggleFollow = functions.https.onCall(async (data, context) => {
  // 1. Authenticate caller strictly via verified Firebase auth context
  const callerUid = context.auth ? context.auth.uid : null;
  if (!callerUid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to follow students.'
    );
  }

  const targetUid = data?.targetUid;
  if (!targetUid || typeof targetUid !== 'string' || !targetUid.trim()) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Target student UID is required.'
    );
  }

  const cleanTargetUid = targetUid.trim();

  // Disallow following yourself
  if (callerUid === cleanTargetUid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Students cannot follow themselves.'
    );
  }

  // Document references
  const callerUserRef = db.collection('users').doc(callerUid);
  const targetUserRef = db.collection('users').doc(cleanTargetUid);
  const callerPublicRef = db.collection('publicProfiles').doc(callerUid);
  const targetPublicRef = db.collection('publicProfiles').doc(cleanTargetUid);

  // Subcollection references
  const callerFollowingDoc = callerUserRef.collection('following').doc(cleanTargetUid);
  const targetFollowersDoc = targetUserRef.collection('followers').doc(callerUid);
  const legacyFollowDoc = db.collection('follows').doc(`${callerUid}_${cleanTargetUid}`);

  return await db.runTransaction(async (tx) => {
    // Read all relevant documents in the transaction
    const [followingSnap, callerUserSnap, targetUserSnap, callerPubSnap, targetPubSnap] = await Promise.all([
      tx.get(callerFollowingDoc),
      tx.get(callerUserRef),
      tx.get(targetUserRef),
      tx.get(callerPublicRef),
      tx.get(targetPublicRef),
    ]);

    const isCurrentlyFollowing = followingSnap.exists;

    // Determine current counter values
    let curCallerFollowing = 0;
    if (callerPubSnap.exists && typeof callerPubSnap.data()?.followingCount === 'number') {
      curCallerFollowing = callerPubSnap.data().followingCount;
    } else if (callerUserSnap.exists && typeof callerUserSnap.data()?.followingCount === 'number') {
      curCallerFollowing = callerUserSnap.data().followingCount;
    }

    let curTargetFollowers = 0;
    if (targetPubSnap.exists && typeof targetPubSnap.data()?.followersCount === 'number') {
      curTargetFollowers = targetPubSnap.data().followersCount;
    } else if (targetUserSnap.exists && typeof targetUserSnap.data()?.followersCount === 'number') {
      curTargetFollowers = targetUserSnap.data().followersCount;
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    if (isCurrentlyFollowing) {
      // ─── UNFOLLOW ACTION ───
      const newCallerFollowing = Math.max(0, curCallerFollowing - 1);
      const newTargetFollowers = Math.max(0, curTargetFollowers - 1);

      // Remove follow subcollection documents
      tx.delete(callerFollowingDoc);
      tx.delete(targetFollowersDoc);
      tx.delete(legacyFollowDoc);

      // Decrement following count on caller
      if (callerUserSnap.exists) {
        tx.update(callerUserRef, { followingCount: newCallerFollowing, updatedAt: now });
      }
      if (callerPubSnap.exists) {
        tx.update(callerPublicRef, { followingCount: newCallerFollowing, updatedAt: now });
      }

      // Decrement followers count on target
      if (targetUserSnap.exists) {
        tx.update(targetUserRef, { followersCount: newTargetFollowers, updatedAt: now });
      }
      if (targetPubSnap.exists) {
        tx.update(targetPublicRef, { followersCount: newTargetFollowers, updatedAt: now });
      }

      return {
        success: true,
        following: false,
        followingCount: newCallerFollowing,
        followersCount: newTargetFollowers,
      };
    } else {
      // ─── FOLLOW ACTION ───
      const newCallerFollowing = Math.max(0, curCallerFollowing + 1);
      const newTargetFollowers = Math.max(0, curTargetFollowers + 1);

      // Create follow subcollection documents
      tx.set(callerFollowingDoc, {
        targetUid: cleanTargetUid,
        createdAt: now,
      });
      tx.set(targetFollowersDoc, {
        followerUid: callerUid,
        createdAt: now,
      });
      tx.set(legacyFollowDoc, {
        followerId: callerUid,
        targetId: cleanTargetUid,
        createdAt: now,
      });

      // Increment following count on caller
      if (callerUserSnap.exists) {
        tx.update(callerUserRef, { followingCount: newCallerFollowing, updatedAt: now });
      }
      if (callerPubSnap.exists) {
        tx.update(callerPublicRef, { followingCount: newCallerFollowing, updatedAt: now });
      } else {
        tx.set(callerPublicRef, {
          uid: callerUid,
          followingCount: newCallerFollowing,
          followersCount: 0,
          updatedAt: now,
        }, { merge: true });
      }

      // Increment followers count on target
      if (targetUserSnap.exists) {
        tx.update(targetUserRef, { followersCount: newTargetFollowers, updatedAt: now });
      }
      if (targetPubSnap.exists) {
        tx.update(targetPublicRef, { followersCount: newTargetFollowers, updatedAt: now });
      } else {
        tx.set(targetPublicRef, {
          uid: cleanTargetUid,
          followersCount: newTargetFollowers,
          followingCount: 0,
          updatedAt: now,
        }, { merge: true });
      }

      return {
        success: true,
        following: true,
        followingCount: newCallerFollowing,
        followersCount: newTargetFollowers,
      };
    }
  });
});

/**
 * CALLABLE CLOUD FUNCTION: adminDeleteUserAccount
 * Permanently deletes a user from Firebase Authentication AND all Firestore collections.
 */
exports.adminDeleteUserAccount = functions.https.onCall(async (data, context) => {
  const callerUid = context.auth ? context.auth.uid : null;
  const callerEmail = context.auth && context.auth.token && context.auth.token.email
    ? String(context.auth.token.email).toLowerCase()
    : '';

  if (!callerUid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  let isAdmin =
    callerUid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2' ||
    callerEmail === 'shsvirtualadmin@gmail.com' ||
    callerEmail === 'support@boardly.cfd' ||
    Boolean(context.auth.token && (context.auth.token.admin || context.auth.token.role === 'superadmin'));

  if (!isAdmin) {
    const adminDoc = await db.collection('admins').doc(callerUid).get();
    if (adminDoc.exists) isAdmin = true;
  }

  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Superadmin access required.');
  }

  const targetUid = String(data?.targetUid || '').trim();
  const targetEmail = String(data?.targetEmail || '').trim().toLowerCase();

  if (!targetUid && !targetEmail) {
    throw new functions.https.HttpsError('invalid-argument', 'targetUid or targetEmail is required.');
  }

  let resolvedUid = targetUid;
  if (!resolvedUid && targetEmail) {
    try {
      const userRecord = await admin.auth().getUserByEmail(targetEmail);
      resolvedUid = userRecord.uid;
    } catch {}
  }

  if (resolvedUid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2') {
    throw new functions.https.HttpsError('permission-denied', 'Cannot delete protected superadmin.');
  }

  // 1. Delete from Firebase Authentication
  let authDeleted = false;
  if (resolvedUid) {
    try {
      await admin.auth().deleteUser(resolvedUid);
      authDeleted = true;
    } catch (authErr) {
      if (authErr && authErr.code === 'auth/user-not-found') {
        authDeleted = true;
      } else {
        throw new functions.https.HttpsError(
          'internal',
          `Failed to delete user from Firebase Authentication: ${authErr.message || authErr.code}`
        );
      }
    }
  }

  // 2. Delete direct UID documents in Firestore
  if (resolvedUid) {
    const directCollections = [
      'users',
      'publicProfiles',
      'admins',
      'streaks',
      'referrals',
      'leaderboard',
      'wallets',
      'captainApplications',
      'crewApplications',
      'captains',
    ];
    await Promise.all(
      directCollections.map((coll) =>
        db.collection(coll).doc(resolvedUid).delete().catch(() => {})
      )
    );
  }

  return {
    success: true,
    uid: resolvedUid,
    email: targetEmail,
    firebaseAuthDeleted: authDeleted,
  };
});

/**
 * CALLABLE CLOUD FUNCTION: cleanupOrphanProfiles
 * Finds any users/{uid} or publicProfiles/{uid} record with no matching Firebase Auth user
 * and deletes the orphan records.
 */
exports.cleanupOrphanProfiles = functions.https.onCall(async (_data, context) => {
  const callerUid = context.auth ? context.auth.uid : null;
  const callerEmail = context.auth && context.auth.token && context.auth.token.email
    ? String(context.auth.token.email).toLowerCase()
    : '';

  if (
    !callerUid ||
    (callerUid !== 'A5YMRimdHRcmeDWutxtUGt2e4hf2' &&
      callerEmail !== 'shsvirtualadmin@gmail.com' &&
      callerEmail !== 'support@boardly.cfd')
  ) {
    throw new functions.https.HttpsError('permission-denied', 'Superadmin access required.');
  }

  const [usersSnap, pubSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('publicProfiles').get(),
  ]);

  const allUids = new Set([
    ...usersSnap.docs.map((d) => d.id),
    ...pubSnap.docs.map((d) => d.id),
  ]);

  const removedUids = [];
  for (const uid of allUids) {
    if (uid === 'A5YMRimdHRcmeDWutxtUGt2e4hf2') continue;
    try {
      await admin.auth().getUser(uid);
    } catch (err) {
      if (err && err.code === 'auth/user-not-found') {
        await Promise.all([
          db.collection('users').doc(uid).delete().catch(() => {}),
          db.collection('publicProfiles').doc(uid).delete().catch(() => {}),
          db.collection('streaks').doc(uid).delete().catch(() => {}),
          db.collection('referrals').doc(uid).delete().catch(() => {}),
          db.collection('leaderboard').doc(uid).delete().catch(() => {}),
          db.collection('wallets').doc(uid).delete().catch(() => {}),
        ]);
        removedUids.push(uid);
      }
    }
  }

  return {
    success: true,
    scannedCount: allUids.size,
    removedCount: removedUids.length,
    removedUids,
  };
});

