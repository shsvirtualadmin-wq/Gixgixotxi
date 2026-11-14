import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { isFollowing } from '@/services/followService';
import { resolveCosmeticItemId } from '@/components/ui/BoardlyAvatar';
import {
  getPublicProfiles,
  getCachedPublicProfile,
  subscribeAllPublicProfiles,
} from '@/services/publicProfileService';
import { readSwrCache, writeSwrCache } from '@/lib/swrCache';

export const CHAT_REQUEST_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId?: string;
  senderName: string;
  senderAvatar?: string | null;
  senderFrame?: string | null;
  text: string;
  createdAt: any;
  createdAtMs?: number;
}

export type DirectMessage = ChatMessage;

export interface ConversationParticipant {
  displayName: string;
  avatar?: string | null;
  frame?: string | null;
  photoURL?: string | null;
  role?: string | null;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: Record<string, ConversationParticipant>;
  lastMessage?: string;
  lastMessageText?: string;
  lastMessageSenderId?: string;
  lastMessageAt?: any;
  lastMessageAtMs?: number;
  lastSenderId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type ChatRequestStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'already_allowed'
  | 'auto_accepted';

export interface ChatRequest {
  id: string;
  fromUid: string;
  toUid: string;
  fromName: string;
  fromAvatar?: string | null;
  fromFrame?: string | null;
  fromPhotoURL?: string | null;
  fromRole?: string | null;
  toName: string;
  toAvatar?: string | null;
  toFrame?: string | null;
  toPhotoURL?: string | null;
  message?: string;
  conversationId?: string;
  status: ChatRequestStatus;
  createdAt: any;
  createdAtMs?: number;
  updatedAt?: any;
  declinedAt?: any;
  declinedAtMs?: number | null;
}

export interface ChatPermissionState {
  canChat: boolean;
  reason: 'mutual_follow' | 'request_accepted' | 'none';
  isMutualFollow: boolean;
  hasAcceptedRequest?: boolean;
  outgoingRequest: ChatRequest | null;
  incomingRequest: ChatRequest | null;
  cooldownEndsAtMs: number | null;
  isCooldownActive: boolean;
}

/**
 * Deterministic ID for a one-to-one conversation between two users (e.g. conv_uidA_uidB).
 */
export function getConversationId(uidA: string, uidB: string): string {
  const sorted = [uidA, uidB].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
}

/**
 * Deterministic ID for a chat request from `fromUid` to `toUid`.
 */
export function getChatRequestId(fromUid: string, toUid: string): string {
  return `${fromUid}_${toUid}`;
}

function toTimestampMs(val: any, fallbackMs?: number | null): number {
  if (typeof fallbackMs === 'number' && fallbackMs > 0) return fallbackMs;
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.seconds === 'number') return val.seconds * 1000;
  return 0;
}

function parseChatRequestDoc(id: string, data: Record<string, any>): ChatRequest {
  return {
    id,
    fromUid: String(data.fromUid || ''),
    toUid: String(data.toUid || ''),
    fromName: String(data.fromName || 'Student'),
    fromAvatar: resolveCosmeticItemId(data.fromAvatar, 'avatar'),
    fromFrame: resolveCosmeticItemId(data.fromFrame, 'frame'),
    fromPhotoURL: null,
    fromRole: data.fromRole || null,
    toName: String(data.toName || 'Student'),
    toAvatar: resolveCosmeticItemId(data.toAvatar, 'avatar'),
    toFrame: resolveCosmeticItemId(data.toFrame, 'frame'),
    toPhotoURL: null,
    message: typeof data.message === 'string' ? data.message : '',
    conversationId: typeof data.conversationId === 'string' ? data.conversationId : '',
    status: (data.status as ChatRequestStatus) || 'pending',
    createdAt: data.createdAt || null,
    createdAtMs: typeof data.createdAtMs === 'number' ? data.createdAtMs : toTimestampMs(data.createdAt),
    updatedAt: data.updatedAt || null,
    declinedAt: data.declinedAt || null,
    declinedAtMs:
      typeof data.declinedAtMs === 'number'
        ? data.declinedAtMs
        : toTimestampMs(data.declinedAt) || null,
  };
}

/**
 * Checks whether two users can chat freely (mutual follow OR accepted chat request),
 * or if there is a pending/declined chat request between them.
 */
export async function checkChatPermission(
  currentUid: string,
  targetUid: string
): Promise<ChatPermissionState> {
  if (!currentUid || !targetUid || currentUid === targetUid) {
    return {
      canChat: false,
      reason: 'none',
      isMutualFollow: false,
      outgoingRequest: null,
      incomingRequest: null,
      cooldownEndsAtMs: null,
      isCooldownActive: false,
    };
  }

  const outReqId = getChatRequestId(currentUid, targetUid);
  const inReqId = getChatRequestId(targetUid, currentUid);

  const [iFollowThem, theyFollowMe, outSnap, inSnap] = await Promise.all([
    isFollowing(currentUid, targetUid).catch(() => false),
    isFollowing(targetUid, currentUid).catch(() => false),
    getDoc(doc(db, 'chatRequests', outReqId)).catch(() => null),
    getDoc(doc(db, 'chatRequests', inReqId)).catch(() => null),
  ]);

  const isMutualFollow = Boolean(iFollowThem && theyFollowMe);
  const outgoingRequest =
    outSnap && outSnap.exists() ? parseChatRequestDoc(outSnap.id, outSnap.data()) : null;
  const incomingRequest =
    inSnap && inSnap.exists() ? parseChatRequestDoc(inSnap.id, inSnap.data()) : null;

  const isRequestAccepted =
    outgoingRequest?.status === 'accepted' || incomingRequest?.status === 'accepted';

  let cooldownEndsAtMs: number | null = null;
  let isCooldownActive = false;
  if (outgoingRequest?.status === 'declined') {
    const declinedMs = toTimestampMs(outgoingRequest.declinedAt, outgoingRequest.declinedAtMs);
    if (declinedMs > 0) {
      const expiresAt = declinedMs + CHAT_REQUEST_COOLDOWN_MS;
      if (Date.now() < expiresAt) {
        cooldownEndsAtMs = expiresAt;
        isCooldownActive = true;
      }
    }
  }

  if (isMutualFollow) {
    return {
      canChat: true,
      reason: 'mutual_follow',
      isMutualFollow: true,
      hasAcceptedRequest: false,
      outgoingRequest,
      incomingRequest,
      cooldownEndsAtMs,
      isCooldownActive,
    };
  }

  if (isRequestAccepted) {
    return {
      canChat: true,
      reason: 'request_accepted',
      isMutualFollow: false,
      hasAcceptedRequest: true,
      outgoingRequest,
      incomingRequest,
      cooldownEndsAtMs,
      isCooldownActive,
    };
  }

  return {
    canChat: false,
    reason: 'none',
    isMutualFollow: false,
    hasAcceptedRequest: false,
    outgoingRequest,
    incomingRequest,
    cooldownEndsAtMs,
    isCooldownActive,
  };
}

/**
 * Sends a chat request from `fromUid` to `toUid`.
 * Enforces:
 * - No self-requests
 * - Max 1 pending request per pair
 * - 24-hour cooldown after a declined request
 * - Notification to receiver
 */
export async function sendChatRequest(
  fromUid: string,
  toUid: string,
  fromMeta?: ConversationParticipant,
  toMeta?: ConversationParticipant,
  message?: string
): Promise<ChatRequest> {
  if (!fromUid || !toUid) {
    throw new Error('Both sender and recipient IDs are required.');
  }
  if (fromUid === toUid) {
    throw new Error('You cannot send a chat request to yourself.');
  }

  const perm = await checkChatPermission(fromUid, toUid);
  if (perm.canChat) {
    const convId = getConversationId(fromUid, toUid);
    return {
      id: getChatRequestId(fromUid, toUid),
      fromUid,
      toUid,
      fromName: fromMeta?.displayName || 'Student',
      toName: toMeta?.displayName || 'Student',
      message: message || '',
      conversationId: convId,
      status: 'already_allowed',
      createdAt: null,
      createdAtMs: Date.now(),
    };
  }
  if (perm.outgoingRequest?.status === 'pending') {
    throw new Error('Chat request already sent.');
  }
  if (perm.isCooldownActive) {
    throw new Error('Your previous chat request was declined. You can send another request after 24 hours.');
  }

  // If the other user already sent a pending request to us, auto-accept it!
  if (perm.incomingRequest?.status === 'pending') {
    const accepted = await respondToChatRequest(perm.incomingRequest.id, fromUid, 'accepted', fromMeta);
    return {
      ...accepted,
      status: 'auto_accepted',
      conversationId: getConversationId(fromUid, toUid),
    };
  }

  const reqId = getChatRequestId(fromUid, toUid);
  const reqRef = doc(db, 'chatRequests', reqId);
  const nowMs = Date.now();
  const fromName = fromMeta?.displayName || auth.currentUser?.displayName || 'Student';
  const toName = toMeta?.displayName || 'Student';

  const payload = {
    fromUid,
    toUid,
    fromName,
    fromAvatar: resolveCosmeticItemId(fromMeta?.avatar, 'avatar'),
    fromFrame: resolveCosmeticItemId(fromMeta?.frame, 'frame'),
    fromPhotoURL: null,
    fromRole: fromMeta?.role || 'student',
    toName,
    toAvatar: resolveCosmeticItemId(toMeta?.avatar, 'avatar'),
    toFrame: resolveCosmeticItemId(toMeta?.frame, 'frame'),
    toPhotoURL: null,
    message: message || '',
    conversationId: getConversationId(fromUid, toUid),
    status: 'pending' as ChatRequestStatus,
    createdAt: serverTimestamp(),
    createdAtMs: nowMs,
    updatedAt: serverTimestamp(),
    declinedAt: null,
    declinedAtMs: null,
  };

  await setDoc(reqRef, payload);

  // Create notification for the receiver
  try {
    const notifRef = doc(collection(db, 'notifications'), `chat_req_${reqId}_${nowMs}`);
    await setDoc(notifRef, {
      userId: toUid,
      recipientUid: toUid,
      type: 'chat_request',
      title: `${fromName} sent you a message request`,
      message: `${fromName} wants to chat with you. Open Requests in Messages to accept or decline.`,
      authorId: fromUid,
      actorId: fromUid,
      senderId: fromUid,
      authorName: fromName,
      authorAvatar: fromMeta?.avatar || null,
      authorFrame: fromMeta?.frame || null,
      requestId: reqId,
      link: `/profile/${fromUid}?chat=requests`,
      read: false,
      isRead: false,
      createdAt: serverTimestamp(),
    }).catch(() => {});
  } catch {
    // Non-blocking notification error
  }

  return parseChatRequestDoc(reqId, payload);
}

/**
 * Receiver accepts or declines an incoming chat request.
 * - Accept: sets status = 'accepted', initializes the conversation, and notifies sender.
 * - Decline: sets status = 'declined' with declinedAt timestamp (enforces 24h cooldown).
 */
export async function respondToChatRequest(
  requestId: string,
  currentUid: string,
  decision: 'accepted' | 'declined',
  responderMeta?: ConversationParticipant
): Promise<ChatRequest> {
  if (!requestId || !currentUid) {
    throw new Error('Missing request ID or user ID.');
  }

  const reqRef = doc(db, 'chatRequests', requestId);
  const snap = await getDoc(reqRef);
  if (!snap.exists()) {
    throw new Error('Chat request not found.');
  }

  const existing = parseChatRequestDoc(snap.id, snap.data());
  if (existing.toUid !== currentUid) {
    throw new Error('Only the recipient can respond to this chat request.');
  }
  if (existing.status !== 'pending') {
    return existing;
  }

  const nowMs = Date.now();
  const convId = getConversationId(currentUid, existing.fromUid);

  if (decision === 'accepted') {
    await updateDoc(reqRef, {
      status: 'accepted',
      conversationId: convId,
      updatedAt: serverTimestamp(),
      declinedAt: null,
      declinedAtMs: null,
    });

    // Open / create the conversation for both participants now that request is accepted
    await getOrCreateConversation(
      currentUid,
      existing.fromUid,
      {
        displayName: responderMeta?.displayName || existing.toName || auth.currentUser?.displayName || 'Student',
        avatar: resolveCosmeticItemId(responderMeta?.avatar ?? existing.toAvatar, 'avatar'),
        frame: resolveCosmeticItemId(responderMeta?.frame ?? existing.toFrame, 'frame'),
        photoURL: null,
      },
      {
        displayName: existing.fromName,
        avatar: resolveCosmeticItemId(existing.fromAvatar, 'avatar'),
        frame: resolveCosmeticItemId(existing.fromFrame, 'frame'),
        photoURL: null,
      }
    ).catch(() => {});

    // Notify sender that their chat request was accepted
    try {
      const responderName =
        responderMeta?.displayName || existing.toName || auth.currentUser?.displayName || 'Student';
      const notifRef = doc(collection(db, 'notifications'), `chat_accept_${requestId}_${nowMs}`);
      await setDoc(notifRef, {
        userId: existing.fromUid,
        recipientUid: existing.fromUid,
        type: 'chat_request_accepted',
        title: `${responderName} accepted your message request`,
        message: `You can now chat directly with ${responderName}.`,
        authorId: currentUid,
        actorId: currentUid,
        senderId: currentUid,
        authorName: responderName,
        authorAvatar: responderMeta?.avatar ?? existing.toAvatar ?? null,
        authorFrame: responderMeta?.frame ?? existing.toFrame ?? null,
        requestId,
        link: `/profile/${currentUid}?chat=open`,
        read: false,
        isRead: false,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    } catch {
      // Non-blocking
    }

    return {
      ...existing,
      status: 'accepted',
      conversationId: convId,
      declinedAt: null,
      declinedAtMs: null,
    };
  } else {
    await updateDoc(reqRef, {
      status: 'declined',
      updatedAt: serverTimestamp(),
      declinedAt: serverTimestamp(),
      declinedAtMs: nowMs,
    });

    return {
      ...existing,
      status: 'declined',
      declinedAtMs: nowMs,
    };
  }
}

const CHAT_CONVS_CACHE_PREFIX = 'chat_convs_v1:';
const CHAT_REQS_CACHE_PREFIX = 'chat_reqs_v1:';

export function getCachedUserConversations(uid?: string | null): Conversation[] | null {
  if (!uid || uid.startsWith('guest_')) return null;
  const entry = readSwrCache<Conversation[]>(`${CHAT_CONVS_CACHE_PREFIX}${uid}`);
  return entry?.data || null;
}

export function getCachedIncomingChatRequests(uid?: string | null): ChatRequest[] | null {
  if (!uid || uid.startsWith('guest_')) return null;
  const entry = readSwrCache<ChatRequest[]>(`${CHAT_REQS_CACHE_PREFIX}${uid}`);
  return entry?.data || null;
}

/**
 * Preloads the user's top conversations and incoming requests in the background
 * on app start / nav load so tapping the Messages icon opens instantaneously.
 */
export async function prefetchUserChats(uid?: string | null): Promise<void> {
  if (!uid || uid.startsWith('guest_')) return;
  try {
    const convsQ = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid),
      limit(25)
    );
    const reqsQ = query(
      collection(db, 'chatRequests'),
      where('toUid', '==', uid),
      where('status', '==', 'pending'),
      limit(25)
    );
    const [convSnap, reqSnap] = await Promise.all([
      getDocs(convsQ).catch(() => null),
      getDocs(reqsQ).catch(() => null),
    ]);

    const uidsToPrefetch = new Set<string>();

    if (convSnap) {
      const convs: Conversation[] = [];
      convSnap.forEach((d) => {
        const data = d.data();
        const lastMsg = data.lastMessage || data.lastMessageText || '';
        const lastSender = data.lastSenderId || data.lastMessageSenderId || '';
        const lastMsgAt = data.lastMessageAt || data.updatedAt || null;
        const lastMsgAtMs =
          typeof data.lastMessageAtMs === 'number'
            ? data.lastMessageAtMs
            : toTimestampMs(lastMsgAt);
        const participants = Array.isArray(data.participants) ? data.participants : [];
        participants.forEach((p: string) => {
          if (p && !p.startsWith('anon_')) uidsToPrefetch.add(p);
        });
        convs.push({
          id: d.id,
          participants,
          participantDetails: data.participantDetails || {},
          lastMessage: lastMsg,
          lastMessageText: lastMsg,
          lastMessageSenderId: lastSender,
          lastMessageAt: lastMsgAt,
          lastMessageAtMs: lastMsgAtMs,
          lastSenderId: lastSender,
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
        });
      });
      convs.sort(
        (a, b) =>
          toTimestampMs(b.lastMessageAt || b.updatedAt, b.lastMessageAtMs) -
          toTimestampMs(a.lastMessageAt || a.updatedAt, a.lastMessageAtMs)
      );
      writeSwrCache(`${CHAT_CONVS_CACHE_PREFIX}${uid}`, convs, true);
    }

    if (reqSnap) {
      const reqs: ChatRequest[] = [];
      reqSnap.forEach((d) => {
        const parsed = parseChatRequestDoc(d.id, d.data());
        if (parsed.fromUid && !parsed.fromUid.startsWith('anon_')) {
          uidsToPrefetch.add(parsed.fromUid);
        }
        reqs.push(parsed);
      });
      reqs.sort(
        (a, b) =>
          toTimestampMs(b.createdAt, b.createdAtMs) -
          toTimestampMs(a.createdAt, a.createdAtMs)
      );
      writeSwrCache(`${CHAT_REQS_CACHE_PREFIX}${uid}`, reqs, true);
    }

    if (uidsToPrefetch.size > 0) {
      void getPublicProfiles(Array.from(uidsToPrefetch)).catch(() => {});
    }
  } catch {
    // Non-fatal background prefetch
  }
}

/**
 * Subscribes to incoming pending chat requests for `uid`.
 */
export function subscribeIncomingChatRequests(
  uid: string,
  onUpdate: (requests: ChatRequest[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!uid) {
    onUpdate([]);
    return () => {};
  }

  const cachedInitial = getCachedIncomingChatRequests(uid);
  if (cachedInitial) {
    onUpdate(cachedInitial);
  }

  const q = query(
    collection(db, 'chatRequests'),
    where('toUid', '==', uid),
    where('status', '==', 'pending'),
    limit(25)
  );

  let latestRequests: ChatRequest[] = cachedInitial || [];

  const applyProfileMapToReqs = (
    reqs: ChatRequest[],
    lookup: (id: string) => any
  ): ChatRequest[] =>
    reqs.map((r) => {
      const fromLive = lookup(r.fromUid);
      const toLive = lookup(r.toUid);
      return {
        ...r,
        fromName: fromLive?.displayName || r.fromName,
        fromAvatar:
          resolveCosmeticItemId(
            fromLive?.equippedAvatar || fromLive?.equipped?.avatar || fromLive?.avatar,
            'avatar'
          ) || r.fromAvatar,
        fromFrame:
          resolveCosmeticItemId(
            fromLive?.equippedFrame || fromLive?.equipped?.frame || fromLive?.frame,
            'frame'
          ) || r.fromFrame,
        toName: toLive?.displayName || r.toName,
        toAvatar:
          resolveCosmeticItemId(
            toLive?.equippedAvatar || toLive?.equipped?.avatar || toLive?.avatar,
            'avatar'
          ) || r.toAvatar,
        toFrame:
          resolveCosmeticItemId(
            toLive?.equippedFrame || toLive?.equipped?.frame || toLive?.frame,
            'frame'
          ) || r.toFrame,
      };
    });

  const emitWithLiveProfiles = (reqs: ChatRequest[]) => {
    // 1. Emit immediately using any synchronously cached profiles so UI never waits on network
    const immediate = applyProfileMapToReqs(reqs, (id) => getCachedPublicProfile(id));
    writeSwrCache(`${CHAT_REQS_CACHE_PREFIX}${uid}`, immediate, true);
    onUpdate(immediate);

    const uids = Array.from(
      new Set(
        reqs
          .flatMap((r) => [r.fromUid, r.toUid])
          .filter((id): id is string => Boolean(id && !id.startsWith('anon_')))
      )
    );
    if (uids.length === 0) return;

    // 2. Refresh profiles in background
    getPublicProfiles(uids)
      .then((liveMap) => {
        const enriched = applyProfileMapToReqs(reqs, (id) => liveMap.get(id));
        writeSwrCache(`${CHAT_REQS_CACHE_PREFIX}${uid}`, enriched, true);
        onUpdate(enriched);
      })
      .catch(() => {});
  };

  const unsubSnap = onSnapshot(
    q,
    (snap) => {
      const items: ChatRequest[] = [];
      snap.forEach((d) => {
        items.push(parseChatRequestDoc(d.id, d.data()));
      });
      items.sort(
        (a, b) => toTimestampMs(b.createdAt, b.createdAtMs) - toTimestampMs(a.createdAt, a.createdAtMs)
      );
      latestRequests = items;
      emitWithLiveProfiles(items);
    },
    (err) => {
      if (onError) onError(err);
    }
  );

  const unsubProfiles = subscribeAllPublicProfiles(() => {
    if (latestRequests.length > 0) {
      emitWithLiveProfiles(latestRequests);
    }
  });

  return () => {
    unsubSnap();
    unsubProfiles();
  };
}

/**
 * Subscribes to existing conversations where `uid` is a participant.
 */
export function subscribeUserConversations(
  uid: string,
  onUpdate: (conversations: Conversation[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!uid) {
    onUpdate([]);
    return () => {};
  }

  const cachedInitial = getCachedUserConversations(uid);
  if (cachedInitial) {
    onUpdate(cachedInitial);
  }

  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', uid),
    limit(25)
  );

  let latestConvs: Conversation[] = cachedInitial || [];

  const applyProfileMapToConvs = (
    convs: Conversation[],
    lookup: (id: string) => any
  ): Conversation[] =>
    convs.map((c) => {
      const nextDetails: Record<string, ConversationParticipant> = {
        ...(c.participantDetails || {}),
      };
      for (const pUid of c.participants || []) {
        const live = lookup(pUid);
        if (live) {
          const prev = nextDetails[pUid] || { displayName: 'Student' };
          nextDetails[pUid] = {
            ...prev,
            displayName: live.displayName || prev.displayName || 'Student',
            avatar:
              resolveCosmeticItemId(
                live.equippedAvatar || live.equipped?.avatar || live.avatar,
                'avatar'
              ) ||
              prev.avatar ||
              null,
            frame:
              resolveCosmeticItemId(
                live.equippedFrame || live.equipped?.frame || live.frame,
                'frame'
              ) ||
              prev.frame ||
              null,
          };
        }
      }
      return {
        ...c,
        participantDetails: nextDetails,
      };
    });

  const emitConvsWithLiveProfiles = (convs: Conversation[]) => {
    // 1. Emit immediately using cached profiles so chat list renders without waiting for network
    const immediate = applyProfileMapToConvs(convs, (id) => getCachedPublicProfile(id));
    writeSwrCache(`${CHAT_CONVS_CACHE_PREFIX}${uid}`, immediate, true);
    onUpdate(immediate);

    const allUids = Array.from(
      new Set(
        convs
          .flatMap((c) => c.participants || [])
          .filter((id): id is string => Boolean(id && !id.startsWith('anon_')))
      )
    );
    if (allUids.length === 0) return;

    // 2. Enrich profiles in the background
    getPublicProfiles(allUids)
      .then((liveMap) => {
        const enriched = applyProfileMapToConvs(convs, (id) => liveMap.get(id));
        writeSwrCache(`${CHAT_CONVS_CACHE_PREFIX}${uid}`, enriched, true);
        onUpdate(enriched);
      })
      .catch(() => {});
  };

  const unsubSnap = onSnapshot(
    q,
    (snap) => {
      const convs: Conversation[] = [];
      snap.forEach((d) => {
        const data = d.data();
        const lastMsg = data.lastMessage || data.lastMessageText || '';
        const lastSender = data.lastSenderId || data.lastMessageSenderId || '';
        const lastMsgAt = data.lastMessageAt || data.updatedAt || null;
        const lastMsgAtMs = typeof data.lastMessageAtMs === 'number' ? data.lastMessageAtMs : toTimestampMs(lastMsgAt);
        convs.push({
          id: d.id,
          participants: Array.isArray(data.participants) ? data.participants : [],
          participantDetails: data.participantDetails || {},
          lastMessage: lastMsg,
          lastMessageText: lastMsg,
          lastMessageSenderId: lastSender,
          lastMessageAt: lastMsgAt,
          lastMessageAtMs: lastMsgAtMs,
          lastSenderId: lastSender,
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
        });
      });
      convs.sort(
        (a, b) =>
          toTimestampMs(b.lastMessageAt || b.updatedAt, b.lastMessageAtMs) -
          toTimestampMs(a.lastMessageAt || a.updatedAt, a.lastMessageAtMs)
      );
      latestConvs = convs;
      emitConvsWithLiveProfiles(convs);
    },
    (err) => {
      if (onError) onError(err);
    }
  );

  const unsubProfiles = subscribeAllPublicProfiles(() => {
    if (latestConvs.length > 0) {
      emitConvsWithLiveProfiles(latestConvs);
    }
  });

  return () => {
    unsubSnap();
    unsubProfiles();
  };
}

/**
 * Gets or creates a one-to-one conversation between two users.
 * Requires mutual follow or an accepted chat request.
 */
export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string,
  currentMeta?: ConversationParticipant | Record<string, ConversationParticipant>,
  otherMeta?: ConversationParticipant
): Promise<string> {
  if (!currentUserId || !otherUserId) {
    throw new Error('Both user IDs are required to open a conversation.');
  }
  if (currentUserId === otherUserId) {
    throw new Error('Cannot create conversation with yourself.');
  }

  let cMeta: ConversationParticipant | undefined;
  let oMeta: ConversationParticipant | undefined = otherMeta;

  if (currentMeta && (currentUserId in currentMeta || otherUserId in currentMeta)) {
    const metaMap = currentMeta as Record<string, ConversationParticipant>;
    cMeta = metaMap[currentUserId];
    oMeta = metaMap[otherUserId];
  } else {
    cMeta = currentMeta as ConversationParticipant | undefined;
  }

  const perm = await checkChatPermission(currentUserId, otherUserId);
  if (!perm.canChat) {
    throw new Error(
      'You can only chat with users when you follow each other or after your chat request is accepted.'
    );
  }

  const sortedParticipants = [currentUserId, otherUserId].sort();
  const convId = getConversationId(currentUserId, otherUserId);
  const convRef = doc(db, 'conversations', convId);

  const snap = await getDoc(convRef);
  if (snap.exists()) {
    if (cMeta || oMeta) {
      const existingData = snap.data() as Conversation;
      const details = {
        ...(existingData.participantDetails || {}),
        ...(cMeta ? { [currentUserId]: cMeta } : {}),
        ...(oMeta ? { [otherUserId]: oMeta } : {}),
      };
      await updateDoc(convRef, {
        participantDetails: details,
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }
    return convId;
  }

  const newConv: Conversation = {
    id: convId,
    participants: sortedParticipants,
    participantDetails: {
      [currentUserId]: {
        displayName: cMeta?.displayName || auth.currentUser?.displayName || 'Student',
        avatar: resolveCosmeticItemId(cMeta?.avatar, 'avatar'),
        frame: resolveCosmeticItemId(cMeta?.frame, 'frame'),
        photoURL: null,
      },
      [otherUserId]: {
        displayName: oMeta?.displayName || 'Student',
        avatar: resolveCosmeticItemId(oMeta?.avatar, 'avatar'),
        frame: resolveCosmeticItemId(oMeta?.frame, 'frame'),
        photoURL: null,
      },
    },
    lastMessage: '',
    lastMessageText: '',
    lastMessageSenderId: currentUserId,
    lastSenderId: currentUserId,
    lastMessageAt: serverTimestamp(),
    lastMessageAtMs: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(convRef, newConv);
  return convId;
}

/**
 * Sends a message in a conversation and notifies recipient.
 * Enforces mutual follow or accepted chat request before writing.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  arg3: string,
  arg4?: string | ConversationParticipant,
  arg5?: ConversationParticipant | string
): Promise<string> {
  let recipientId: string | undefined;
  let text: string;
  let senderMeta: ConversationParticipant | undefined;

  if (typeof arg4 === 'string') {
    // Called as (conversationId, senderId, recipientId, text, senderMeta)
    recipientId = arg3;
    text = arg4;
    senderMeta = arg5 as ConversationParticipant | undefined;
  } else {
    // Called as (conversationId, senderId, text, senderMeta, recipientId)
    text = arg3;
    senderMeta = arg4 as ConversationParticipant | undefined;
    recipientId = typeof arg5 === 'string' ? arg5 : undefined;
  }

  // Fallback extraction of recipientId from conversationId (conv_uid1_uid2) if missing
  if (!recipientId && conversationId.startsWith('conv_')) {
    const parts = conversationId.replace(/^conv_/, '').split('_');
    recipientId = parts.find((p) => p !== senderId);
  }

  const trimmed = text.trim().slice(0, 1000);
  if (!trimmed) {
    throw new Error('Message cannot be empty.');
  }
  if (!conversationId || !senderId) {
    throw new Error('Missing conversation ID or sender ID.');
  }
  if (!recipientId || recipientId === senderId) {
    throw new Error('Valid recipient is required to send a message.');
  }

  const perm = await checkChatPermission(senderId, recipientId);
  if (!perm.canChat) {
    throw new Error(
      'Messaging requires mutual follow or an accepted chat request.'
    );
  }

  const senderName = senderMeta?.displayName || auth.currentUser?.displayName || 'Student';
  const senderAvatar = senderMeta?.avatar || null;
  const senderFrame = senderMeta?.frame || null;
  const nowMs = Date.now();

  const messagesColRef = collection(db, 'conversations', conversationId, 'messages');
  const convRef = doc(db, 'conversations', conversationId);
  const docRef = await addDoc(messagesColRef, {
    conversationId,
    senderId,
    recipientId,
    senderName,
    senderAvatar,
    senderFrame,
    text: trimmed,
    createdAtMs: nowMs,
    createdAt: serverTimestamp(),
  });

  await updateDoc(convRef, {
    lastMessage: trimmed,
    lastMessageText: trimmed,
    lastMessageSenderId: senderId,
    lastSenderId: senderId,
    lastMessageAt: serverTimestamp(),
    lastMessageAtMs: nowMs,
    updatedAt: serverTimestamp(),
  }).catch(() => {});

  // Send notification to recipient
  try {
    const notifRef = doc(collection(db, 'notifications'));
    await setDoc(notifRef, {
      userId: recipientId,
      recipientUid: recipientId,
      type: 'new_message',
      title: `New message from ${senderName}`,
      message: trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed,
      authorId: senderId,
      actorId: senderId,
      senderId,
      authorName: senderName,
      authorAvatar: senderAvatar,
      authorFrame: senderFrame,
      conversationId,
      link: `/profile/${senderId}?chat=open`,
      read: false,
      isRead: false,
      createdAt: serverTimestamp(),
    }).catch(() => {});
  } catch {
    // Non-blocking notification error
  }

  return docRef.id;
}

/**
 * Subscribes to real-time messages in a conversation.
 * Returns unsubscribe cleanup function.
 */
export function subscribeMessages(
  conversationId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!conversationId) return () => {};

  const messagesCol = collection(db, 'conversations', conversationId, 'messages');
  const qPrimary = query(messagesCol, orderBy('createdAt', 'asc'), limit(150));

  let latestMsgs: ChatMessage[] = [];

  const emitMsgsWithLiveProfiles = (msgs: ChatMessage[]) => {
    const senderUids = Array.from(
      new Set(
        msgs
          .map((m) => m.senderId)
          .filter((id): id is string => Boolean(id && !id.startsWith('anon_')))
      )
    );
    if (senderUids.length === 0) {
      onUpdate(msgs);
      return;
    }
    getPublicProfiles(senderUids)
      .then((liveMap) => {
        const enriched = msgs.map((m) => {
          const live = liveMap.get(m.senderId);
          if (!live) return m;
          return {
            ...m,
            senderName: live.displayName || m.senderName || 'Student',
            senderAvatar:
              resolveCosmeticItemId(
                live.equippedAvatar || live.equipped?.avatar || live.avatar,
                'avatar'
              ) || m.senderAvatar || null,
            senderFrame:
              resolveCosmeticItemId(
                live.equippedFrame || live.equipped?.frame || live.frame,
                'frame'
              ) || m.senderFrame || null,
          };
        });
        onUpdate(enriched);
      })
      .catch(() => {
        onUpdate(msgs);
      });
  };

  const unsubPrimary = onSnapshot(
    qPrimary,
    (snap) => {
      const msgs: ChatMessage[] = [];
      snap.forEach((d) => {
        const data = d.data();
        msgs.push({
          id: d.id,
          conversationId,
          senderId: data.senderId || data.senderUid,
          recipientId: data.recipientId || undefined,
          senderName: data.senderName || 'Student',
          senderAvatar: data.senderAvatar || null,
          senderFrame: data.senderFrame || null,
          text: data.text || '',
          createdAt: data.createdAt,
          createdAtMs: data.createdAtMs,
        });
      });
      msgs.sort(
        (a, b) =>
          toTimestampMs(a.createdAt, a.createdAtMs) -
          toTimestampMs(b.createdAt, b.createdAtMs)
      );
      latestMsgs = msgs;
      emitMsgsWithLiveProfiles(msgs);
    },
    (err) => {
      if (onError) {
        onError(err);
      }
    }
  );

  const unsubProfiles = subscribeAllPublicProfiles(() => {
    if (latestMsgs.length > 0) {
      emitMsgsWithLiveProfiles(latestMsgs);
    }
  });

  return () => {
    unsubPrimary();
    unsubProfiles();
  };
}
