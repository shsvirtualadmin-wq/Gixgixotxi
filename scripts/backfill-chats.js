#!/usr/bin/env node
/**
 * scripts/backfill-chats.js
 *
 * One-time idempotent migration script using `firebase-admin` that finds:
 * 1. Existing message documents in `conversations/{convId}/messages` (including phantom
 *    parent `conversations/{convId}` docs that have subcollections but no parent doc or
 *    missing `participants` array).
 * 2. Existing notifications of type `"message"` / `"new_message"` (or title `"New message from ..."`,
 *    such as `"New message from SHS Virtual Academy"` with body `"Hi"`) or `"chat_request"`
 *    that have no matching `conversations/{convId}` or `chatRequests/{reqId}` document.
 * 3. Existing accepted `chatRequests` that have no matching `conversations/{convId}` document.
 *
 * For each missing or incomplete record, it creates/repairs the parent `conversations/{convId}`
 * document (with `participants: [uidA, uidB].sort()`, `participantDetails`, `lastMessage`,
 * `lastMessageText`, `lastMessageAt`, `lastMessageAtMs`, `unreadCounts`), creates the
 * `conversations/{convId}/messages/backfill_${notifId}` document if only a notification existed,
 * and creates the accepted `chatRequests` document for official/admin chats — without
 * duplicating or deleting anything.
 *
 * Usage:
 *   # Dry run first (prints all planned writes, modifies nothing):
 *   GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json" \
 *   node scripts/backfill-chats.js --dry-run
 *
 *   # Live execution:
 *   GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json" \
 *   node scripts/backfill-chats.js
 */

import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-n');
const SUPER_ADMIN_UID = process.env.SUPER_ADMIN_UID || 'A5YMRimdHRcmeDWutxtUGt2e4hf2';
const SUPER_ADMIN_NAME = 'SHS Virtual Academy';

function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const rawJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    '';

  if (rawJson.trim()) {
    const cert = JSON.parse(rawJson);
    return admin.initializeApp({
      credential: admin.credential.cert(cert),
      projectId: cert.project_id || process.env.FIREBASE_PROJECT_ID,
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const cert = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
    return admin.initializeApp({
      credential: admin.credential.cert(cert),
      projectId: cert.project_id || process.env.FIREBASE_PROJECT_ID,
    });
  }

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0365509316',
  });
}

function getConversationId(uidA, uidB) {
  const sorted = [String(uidA).trim(), String(uidB).trim()].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
}

function getChatRequestId(fromUid, toUid) {
  return `${String(fromUid).trim()}_${String(toUid).trim()}`;
}

function toMillis(val, fallbackMs = 0) {
  if (typeof fallbackMs === 'number' && fallbackMs > 0) return fallbackMs;
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.seconds === 'number') return val.seconds * 1000;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function parseParticipantsFromConvId(convId) {
  if (!convId || typeof convId !== 'string' || !convId.startsWith('conv_')) return [];
  const rest = convId.slice('conv_'.length);
  const parts = rest.split('_').filter(Boolean);
  if (parts.length === 2) return parts;
  return [];
}

async function runBackfill() {
  initFirebaseAdmin();
  const db = admin.firestore();

  console.log(
    `\n================================================================================\n` +
      `[backfill-chats] Starting chat & message backfill (${DRY_RUN ? 'DRY RUN — no writes will be made' : 'LIVE MODE'})\n` +
      `================================================================================\n`
  );

  // Cache user profiles for participantDetails enrichment
  const profileCache = new Map();
  const nameToUidMap = new Map();
  nameToUidMap.set(SUPER_ADMIN_NAME.toLowerCase(), SUPER_ADMIN_UID);
  nameToUidMap.set('shs virtual academy', SUPER_ADMIN_UID);

  async function getParticipantMeta(uid, fallbackName = '') {
    if (!uid) {
      return {
        displayName: fallbackName || 'Student',
        avatar: null,
        frame: null,
        role: 'student',
        photoURL: null,
      };
    }
    if (profileCache.has(uid)) {
      return profileCache.get(uid);
    }

    const isOfficial = uid === SUPER_ADMIN_UID;
    let displayName = fallbackName || (isOfficial ? SUPER_ADMIN_NAME : 'Student');
    let avatar = null;
    let frame = null;
    let role = isOfficial ? 'admin' : 'student';

    try {
      const [pubSnap, userSnap] = await Promise.all([
        db.collection('publicProfiles').doc(uid).get().catch(() => null),
        db.collection('users').doc(uid).get().catch(() => null),
      ]);
      const p = (pubSnap && pubSnap.exists ? pubSnap.data() : null) || {};
      const u = (userSnap && userSnap.exists ? userSnap.data() : null) || {};

      displayName =
        u.displayName ||
        p.displayName ||
        u.name ||
        p.name ||
        u.username ||
        p.username ||
        fallbackName ||
        (isOfficial ? SUPER_ADMIN_NAME : 'Student');
      avatar =
        u.equipped?.avatar ||
        u.equippedAvatar ||
        p.equippedAvatar ||
        p.equipped?.avatar ||
        u.avatar ||
        p.avatar ||
        null;
      frame =
        u.equipped?.frame ||
        u.equippedFrame ||
        p.equippedFrame ||
        p.equipped?.frame ||
        u.frame ||
        p.frame ||
        null;
      if (isOfficial) {
        role = 'admin';
      } else if (typeof p.role === 'string' && p.role) {
        role = p.role;
      }
    } catch {
      // Use fallback
    }

    const meta = { displayName, avatar, frame, role, photoURL: null };
    profileCache.set(uid, meta);
    if (displayName) {
      nameToUidMap.set(String(displayName).trim().toLowerCase(), uid);
    }
    return meta;
  }

  // Preload publicProfiles to resolve sender names if a legacy notification only stored displayName
  try {
    const pubProfilesSnap = await db.collection('publicProfiles').limit(1000).get();
    pubProfilesSnap.forEach((docSnap) => {
      const d = docSnap.data() || {};
      const name = String(d.displayName || d.name || d.username || '').trim();
      if (name && !nameToUidMap.has(name.toLowerCase())) {
        nameToUidMap.set(name.toLowerCase(), docSnap.id);
      }
    });
  } catch (err) {
    console.warn('[backfill-chats] Could not preload publicProfiles:', err.message);
  }

  // Track existing conversations
  const existingConvDocs = new Map();
  const convRefList = await db.collection('conversations').listDocuments();
  console.log(
    `[backfill-chats] Found ${convRefList.length} document reference(s) in "conversations" (including any phantom refs).`
  );

  for (const convRef of convRefList) {
    const snap = await convRef.get();
    if (snap.exists) {
      existingConvDocs.set(convRef.id, snap.data() || {});
    } else {
      existingConvDocs.set(convRef.id, null); // Phantom document (has subcollection, no parent doc!)
    }
  }

  // Group all messages by conversationId
  const messagesByConvId = new Map();

  // 1. Inspect subcollections of all listed conversation doc refs
  for (const convRef of convRefList) {
    const msgsSnap = await convRef.collection('messages').get().catch(() => null);
    if (msgsSnap && !msgsSnap.empty) {
      const list = messagesByConvId.get(convRef.id) || [];
      msgsSnap.forEach((mDoc) => {
        list.push({ id: mDoc.id, ...mDoc.data() });
      });
      messagesByConvId.set(convRef.id, list);
    }
  }

  // 2. Also scan legacy `chats` collection if any documents exist there
  const legacyChatsRefs = await db.collection('chats').listDocuments().catch(() => []);
  if (legacyChatsRefs.length > 0) {
    console.log(`[backfill-chats] Found ${legacyChatsRefs.length} legacy "chats" document reference(s).`);
    for (const chatRef of legacyChatsRefs) {
      const chatSnap = await chatRef.get();
      const chatData = chatSnap.exists ? chatSnap.data() || {} : {};
      const msgsSnap = await chatRef.collection('messages').get().catch(() => null);
      const msgs = [];
      if (msgsSnap && !msgsSnap.empty) {
        msgsSnap.forEach((mDoc) => msgs.push({ id: mDoc.id, ...mDoc.data() }));
      }
      const pList = Array.isArray(chatData.participants)
        ? chatData.participants
        : parseParticipantsFromConvId(chatRef.id);
      if (pList.length === 2) {
        const canonicalConvId = getConversationId(pList[0], pList[1]);
        const existingList = messagesByConvId.get(canonicalConvId) || [];
        const seenIds = new Set(existingList.map((m) => m.id));
        for (const m of msgs) {
          if (!seenIds.has(m.id)) {
            existingList.push(m);
          }
        }
        messagesByConvId.set(canonicalConvId, existingList);
      }
    }
  }

  let createdConvsCount = 0;
  let repairedConvsCount = 0;
  let createdMessagesCount = 0;
  let createdRequestsCount = 0;

  // 3. Reconcile all conversations that have messages in `conversations/{convId}/messages`
  //    but are missing the parent `conversations/{convId}` doc or missing `participants`
  for (const [convId, msgs] of messagesByConvId.entries()) {
    if (!msgs || msgs.length === 0) continue;

    msgs.sort(
      (a, b) =>
        toMillis(a.createdAt, a.createdAtMs) - toMillis(b.createdAt, b.createdAtMs)
    );
    const latestMsg = msgs[msgs.length - 1];
    const firstMsg = msgs[0];

    const existingData = existingConvDocs.get(convId);
    let participants = Array.isArray(existingData?.participants)
      ? existingData.participants.filter(Boolean)
      : [];

    if (participants.length < 2) {
      const uidSet = new Set(parseParticipantsFromConvId(convId));
      for (const m of msgs) {
        if (m.senderId) uidSet.add(String(m.senderId));
        if (m.senderUid) uidSet.add(String(m.senderUid));
        if (m.recipientId) uidSet.add(String(m.recipientId));
        if (m.recipientUid) uidSet.add(String(m.recipientUid));
      }
      participants = Array.from(uidSet).filter(Boolean).sort();
    }

    if (participants.length < 2) {
      console.warn(
        `[backfill-chats] Skipping conversation ${convId}: could not determine 2 participant UIDs.`
      );
      continue;
    }

    const needsCreate = !existingData;
    const needsRepair =
      existingData &&
      (!Array.isArray(existingData.participants) ||
        existingData.participants.length < 2 ||
        !existingData.lastMessageText);

    if (!needsCreate && !needsRepair) continue;

    const [uidA, uidB] = participants;
    const metaA = await getParticipantMeta(uidA);
    const metaB = await getParticipantMeta(uidB);

    const lastText = String(latestMsg.text || latestMsg.message || '').trim();
    const lastSender = String(latestMsg.senderId || latestMsg.senderUid || uidA);
    const lastAtMs = toMillis(latestMsg.createdAt, latestMsg.createdAtMs) || Date.now();
    const firstAtMs = toMillis(firstMsg.createdAt, firstMsg.createdAtMs) || lastAtMs;
    const isOfficial = participants.includes(SUPER_ADMIN_UID);

    const convPayload = {
      id: convId,
      participants: [uidA, uidB].sort(),
      status: 'accepted',
      isOfficialChat: isOfficial,
      participantDetails: {
        ...(existingData?.participantDetails || {}),
        [uidA]: metaA,
        [uidB]: metaB,
      },
      lastMessage: lastText,
      lastMessageText: lastText,
      lastMessageSenderId: lastSender,
      lastSenderId: lastSender,
      lastMessageAt:
        latestMsg.createdAt || admin.firestore.Timestamp.fromMillis(lastAtMs),
      lastMessageAtMs: lastAtMs,
      createdAt:
        existingData?.createdAt ||
        firstMsg.createdAt ||
        admin.firestore.Timestamp.fromMillis(firstAtMs),
      updatedAt:
        latestMsg.createdAt || admin.firestore.Timestamp.fromMillis(lastAtMs),
    };

    if (DRY_RUN) {
      console.log(
        `[DRY RUN] Would ${needsCreate ? 'CREATE' : 'REPAIR'} conversations/${convId} for participants=${JSON.stringify(
          convPayload.participants
        )} lastMessage=${JSON.stringify(lastText)}`
      );
    } else {
      await db.collection('conversations').doc(convId).set(convPayload, { merge: true });
      console.log(
        `[LIVE] ${needsCreate ? 'Created' : 'Repaired'} conversations/${convId} for participants=${JSON.stringify(
          convPayload.participants
        )}`
      );
    }

    existingConvDocs.set(convId, convPayload);
    if (needsCreate) createdConvsCount++;
    else repairedConvsCount++;
  }

  // 4. Scan `notifications` for orphan message or chat_request notifications
  const notifSnap = await db.collection('notifications').get();
  console.log(`[backfill-chats] Scanning ${notifSnap.size} notification document(s)...`);

  for (const nDoc of notifSnap.docs) {
    const raw = nDoc.data() || {};
    const notifId = nDoc.id;
    const rawType = String(raw.type || '').trim().toLowerCase();
    const titleStr = String(raw.title || '').trim();
    const msgStr = String(raw.message || raw.body || '').trim();

    const isNewMessageNotif =
      rawType === 'new_message' ||
      rawType === 'message' ||
      /^New message from\s+(.+)$/i.test(titleStr);

    const isChatReqNotif =
      rawType === 'chat_request' ||
      /^(.+?)\s+sent you a message request/i.test(titleStr);

    if (!isNewMessageNotif && !isChatReqNotif) continue;

    const recipientUid = String(
      raw.userId || raw.recipientUid || raw.recipientId || ''
    ).trim();
    if (!recipientUid) continue;

    let senderName = String(
      raw.senderName || raw.authorName || raw.actorName || ''
    ).trim();
    if (!senderName) {
      const m1 = titleStr.match(/^New message from\s+(.+)$/i);
      const m2 = titleStr.match(/^(.+?)\s+sent you a message request/i);
      if (m1 && m1[1]) senderName = m1[1].trim();
      else if (m2 && m2[1]) senderName = m2[1].trim();
    }

    let senderUid = String(
      raw.senderId || raw.senderUid || raw.authorId || raw.actorId || raw.fromUid || ''
    ).trim();

    if (!senderUid && typeof raw.conversationId === 'string' && raw.conversationId.startsWith('conv_')) {
      const parts = parseParticipantsFromConvId(raw.conversationId);
      senderUid = parts.find((p) => p !== recipientUid) || '';
    }

    if (!senderUid && senderName) {
      const resolvedByName = nameToUidMap.get(senderName.toLowerCase());
      if (resolvedByName) {
        senderUid = resolvedByName;
      }
    }

    if (!senderUid || senderUid === recipientUid) {
      console.warn(
        `[backfill-chats] Notification ${notifId} ("${titleStr}") for recipient=${recipientUid} has no resolvable senderUid; skipping.`
      );
      continue;
    }

    const sortedParticipants = [recipientUid, senderUid].sort();
    const convId =
      typeof raw.conversationId === 'string' && raw.conversationId.startsWith('conv_')
        ? raw.conversationId
        : getConversationId(recipientUid, senderUid);
    const createdAtMs = toMillis(raw.createdAt, raw.createdAtMs) || Date.now();
    const createdAtTs =
      raw.createdAt || admin.firestore.Timestamp.fromMillis(createdAtMs);

    const senderMeta = await getParticipantMeta(senderUid, senderName);
    const recipientMeta = await getParticipantMeta(recipientUid);
    const isOfficial = senderUid === SUPER_ADMIN_UID || recipientUid === SUPER_ADMIN_UID;

    if (isChatReqNotif && !isOfficial) {
      // Ensure chatRequests doc exists for non-official chat request notification
      const reqId = raw.requestId || getChatRequestId(senderUid, recipientUid);
      const reqRef = db.collection('chatRequests').doc(reqId);
      const reqSnap = await reqRef.get();
      if (!reqSnap.exists) {
        const reqPayload = {
          fromUid: senderUid,
          toUid: recipientUid,
          participants: sortedParticipants,
          fromName: senderMeta.displayName,
          fromAvatar: senderMeta.avatar,
          fromFrame: senderMeta.frame,
          fromPhotoURL: null,
          fromRole: senderMeta.role,
          toName: recipientMeta.displayName,
          toAvatar: recipientMeta.avatar,
          toFrame: recipientMeta.frame,
          toPhotoURL: null,
          message: '',
          conversationId: convId,
          status: 'pending',
          createdAt: createdAtTs,
          createdAtMs,
          updatedAt: createdAtTs,
          declinedAt: null,
          declinedAtMs: null,
        };
        if (DRY_RUN) {
          console.log(
            `[DRY RUN] Would CREATE chatRequests/${reqId} from=${senderUid} (${senderMeta.displayName}) to=${recipientUid} from notification ${notifId}`
          );
        } else {
          await reqRef.set(reqPayload, { merge: true });
          console.log(`[LIVE] Created chatRequests/${reqId} from notification ${notifId}`);
        }
        createdRequestsCount++;
      }
      continue;
    }

    // Direct message notification (or official account message): ensure conversation + message doc exist
    const existingConv = existingConvDocs.get(convId);
    const hasValidConv =
      existingConv &&
      Array.isArray(existingConv.participants) &&
      existingConv.participants.includes(recipientUid) &&
      existingConv.participants.includes(senderUid);

    const messageText = msgStr || 'Hi';

    if (!hasValidConv) {
      const convPayload = {
        id: convId,
        participants: sortedParticipants,
        status: 'accepted',
        isOfficialChat: isOfficial,
        participantDetails: {
          [senderUid]: senderMeta,
          [recipientUid]: recipientMeta,
        },
        lastMessage: messageText,
        lastMessageText: messageText,
        lastMessageSenderId: senderUid,
        lastSenderId: senderUid,
        lastMessageAt: createdAtTs,
        lastMessageAtMs: createdAtMs,
        unreadCounts: {
          [recipientUid]: raw.read ? 0 : 1,
          [senderUid]: 0,
        },
        createdAt: createdAtTs,
        updatedAt: createdAtTs,
      };

      if (DRY_RUN) {
        console.log(
          `[DRY RUN] Would CREATE conversations/${convId} from notification ${notifId} ("${titleStr}", body=${JSON.stringify(
            messageText
          )}) for participants=${JSON.stringify(sortedParticipants)}`
        );
      } else {
        await db.collection('conversations').doc(convId).set(convPayload, { merge: true });
        console.log(
          `[LIVE] Created conversations/${convId} from notification ${notifId} ("${titleStr}")`
        );
      }
      existingConvDocs.set(convId, convPayload);
      createdConvsCount++;
    }

    // Ensure at least one message doc exists inside `conversations/{convId}/messages`
    const knownMsgs = messagesByConvId.get(convId) || [];
    if (knownMsgs.length === 0) {
      const backfillMsgId = `backfill_${notifId}`;
      const msgPayload = {
        conversationId: convId,
        senderId: senderUid,
        recipientId: recipientUid,
        senderName: senderMeta.displayName,
        senderAvatar: senderMeta.avatar,
        senderFrame: senderMeta.frame,
        text: messageText,
        createdAt: createdAtTs,
        createdAtMs,
      };

      if (DRY_RUN) {
        console.log(
          `[DRY RUN] Would CREATE conversations/${convId}/messages/${backfillMsgId} text=${JSON.stringify(
            messageText
          )} sender=${senderUid} (${senderMeta.displayName})`
        );
      } else {
        await db
          .collection('conversations')
          .doc(convId)
          .collection('messages')
          .doc(backfillMsgId)
          .set(msgPayload, { merge: true });
        console.log(
          `[LIVE] Created conversations/${convId}/messages/${backfillMsgId} for notification ${notifId}`
        );
      }
      knownMsgs.push({ id: backfillMsgId, ...msgPayload });
      messagesByConvId.set(convId, knownMsgs);
      createdMessagesCount++;
    }

    // If official account, also ensure accepted chatRequest exists so student can reply freely
    if (isOfficial) {
      const reqId = getChatRequestId(senderUid, recipientUid);
      const reqRef = db.collection('chatRequests').doc(reqId);
      const reqSnap = await reqRef.get();
      if (!reqSnap.exists) {
        const reqPayload = {
          fromUid: senderUid,
          toUid: recipientUid,
          participants: sortedParticipants,
          fromName: senderMeta.displayName,
          fromAvatar: senderMeta.avatar,
          fromFrame: senderMeta.frame,
          fromPhotoURL: null,
          fromRole: 'admin',
          toName: recipientMeta.displayName,
          toAvatar: recipientMeta.avatar,
          toFrame: recipientMeta.frame,
          toPhotoURL: null,
          message: messageText,
          conversationId: convId,
          status: 'accepted',
          createdAt: createdAtTs,
          createdAtMs,
          updatedAt: createdAtTs,
          declinedAt: null,
          declinedAtMs: null,
        };
        if (DRY_RUN) {
          console.log(
            `[DRY RUN] Would CREATE accepted chatRequests/${reqId} for official chat ${convId}`
          );
        } else {
          await reqRef.set(reqPayload, { merge: true });
          console.log(`[LIVE] Created accepted chatRequests/${reqId}`);
        }
        createdRequestsCount++;
      }
    }
  }

  // 5. Scan `chatRequests` where status == 'accepted' and ensure `conversations/{convId}` exists
  const acceptedReqsSnap = await db
    .collection('chatRequests')
    .where('status', '==', 'accepted')
    .get()
    .catch(() => null);

  if (acceptedReqsSnap && !acceptedReqsSnap.empty) {
    for (const rDoc of acceptedReqsSnap.docs) {
      const rData = rDoc.data() || {};
      const fromUid = String(rData.fromUid || '').trim();
      const toUid = String(rData.toUid || '').trim();
      if (!fromUid || !toUid) continue;

      const convId = rData.conversationId || getConversationId(fromUid, toUid);
      const existingConv = existingConvDocs.get(convId);
      if (
        existingConv &&
        Array.isArray(existingConv.participants) &&
        existingConv.participants.includes(fromUid) &&
        existingConv.participants.includes(toUid)
      ) {
        continue;
      }

      const sortedParticipants = [fromUid, toUid].sort();
      const fromMeta = await getParticipantMeta(fromUid, rData.fromName);
      const toMeta = await getParticipantMeta(toUid, rData.toName);
      const createdAtMs = toMillis(rData.updatedAt || rData.createdAt, rData.createdAtMs) || Date.now();
      const createdAtTs =
        rData.updatedAt || rData.createdAt || admin.firestore.Timestamp.fromMillis(createdAtMs);

      const convPayload = {
        id: convId,
        participants: sortedParticipants,
        status: 'accepted',
        participantDetails: {
          [fromUid]: fromMeta,
          [toUid]: toMeta,
        },
        lastMessage: rData.message || '',
        lastMessageText: rData.message || '',
        lastMessageSenderId: fromUid,
        lastSenderId: fromUid,
        lastMessageAt: createdAtTs,
        lastMessageAtMs: createdAtMs,
        createdAt: createdAtTs,
        updatedAt: createdAtTs,
      };

      if (DRY_RUN) {
        console.log(
          `[DRY RUN] Would CREATE conversations/${convId} from accepted chatRequests/${rDoc.id}`
        );
      } else {
        await db.collection('conversations').doc(convId).set(convPayload, { merge: true });
        console.log(
          `[LIVE] Created conversations/${convId} from accepted chatRequests/${rDoc.id}`
        );
      }
      existingConvDocs.set(convId, convPayload);
      createdConvsCount++;
    }
  }

  console.log(
    `\n================================================================================\n` +
      `[backfill-chats] Summary (${DRY_RUN ? 'DRY RUN' : 'LIVE'}):\n` +
      `  - Conversations created:  ${createdConvsCount}\n` +
      `  - Conversations repaired: ${repairedConvsCount}\n` +
      `  - Messages backfilled:    ${createdMessagesCount}\n` +
      `  - ChatRequests created:   ${createdRequestsCount}\n` +
      `================================================================================\n`
  );
}

runBackfill().catch((err) => {
  console.error('[backfill-chats] Fatal error:', err);
  process.exit(1);
});
