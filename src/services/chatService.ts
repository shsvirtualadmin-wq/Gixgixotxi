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
  increment,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { isFollowing } from '@/services/followService';
import { resolveCosmeticItemId } from '@/components/ui/BoardlyAvatar';
import {
  getPublicProfiles,
  getCachedPublicProfile,
  subscribeAllPublicProfiles,
} from '@/services/publicProfileService';
import {
  getNotificationStoreSnapshot,
  extractNotificationActorMeta,
  type AppNotification,
} from '@/services/notificationService';
import { SUPER_ADMIN_UID, SUPER_ADMIN_NAME } from '@/constants/superAdmin';
import { readSwrCache, writeSwrCache } from '@/lib/swrCache';

export const CHAT_REQUEST_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

let useFallbackChatStore = false;

function isPermissionDeniedError(err: any): boolean {
  const code = String(err?.code || '').toLowerCase();
  const msg = String(err?.message || '').toLowerCase();
  return (
    code === 'permission-denied' ||
    code === 'firestore/permission-denied' ||
    msg.includes('missing or insufficient permissions') ||
    msg.includes('permission-denied')
  );
}

function enableFallbackChatStore(): void {
  useFallbackChatStore = true;
}

function getConversationsCollection(useFallback = useFallbackChatStore) {
  return useFallback
    ? collection(db, 'crews', 'chat_hub', 'conversations')
    : collection(db, 'conversations');
}

function getConversationDocRef(convId: string, useFallback = useFallbackChatStore) {
  return useFallback
    ? doc(db, 'crews', 'chat_hub', 'conversations', convId)
    : doc(db, 'conversations', convId);
}

function getChatRequestsCollection(useFallback = useFallbackChatStore) {
  return useFallback
    ? collection(db, 'crews', 'chat_hub', 'chatRequests')
    : collection(db, 'chatRequests');
}

function getChatRequestDocRef(reqId: string, useFallback = useFallbackChatStore) {
  return useFallback
    ? doc(db, 'crews', 'chat_hub', 'chatRequests', reqId)
    : doc(db, 'chatRequests', reqId);
}

function getMessagesCollection(convId: string, useFallback = useFallbackChatStore) {
  return useFallback
    ? collection(db, 'crews', 'chat_hub', `messages_${convId}`)
    : collection(db, 'conversations', convId, 'messages');
}

function getMessageDocRef(
  convId: string,
  msgId: string,
  useFallback = useFallbackChatStore
) {
  return useFallback
    ? doc(db, 'crews', 'chat_hub', `messages_${convId}`, msgId)
    : doc(db, 'conversations', convId, 'messages', msgId);
}

async function withChatStoreFallback<T>(
  fn: (useFallback: boolean) => Promise<T>
): Promise<T> {
  if (useFallbackChatStore) {
    return fn(true);
  }
  try {
    return await fn(false);
  } catch (err) {
    if (isPermissionDeniedError(err)) {
      enableFallbackChatStore();
      return fn(true);
    }
    throw err;
  }
}

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
  status?: 'accepted' | 'pending';
  unreadCounts?: Record<string, number>;
  isOfficialChat?: boolean;
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
  participants?: string[];
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
  reason: 'mutual_follow' | 'request_accepted' | 'official_account' | 'none';
  isMutualFollow: boolean;
  hasAcceptedRequest?: boolean;
  isOfficialChat?: boolean;
  outgoingRequest: ChatRequest | null;
  incomingRequest: ChatRequest | null;
  cooldownEndsAtMs: number | null;
  isCooldownActive: boolean;
}

async function hasCallerAdminClaim(uid: string): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== uid) return false;
    const tokenResult = await currentUser.getIdTokenResult();
    return Boolean(
      tokenResult?.claims?.admin === true || tokenResult?.claims?.superAdmin === true
    );
  } catch {
    return false;
  }
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
  const convId = getConversationId(currentUid, targetUid);

  const [iFollowThem, theyFollowMe, outSnap, inSnap, convSnap, callerIsAdmin] =
    await Promise.all([
      isFollowing(currentUid, targetUid).catch(() => false),
      isFollowing(targetUid, currentUid).catch(() => false),
      withChatStoreFallback((fb) => getDoc(getChatRequestDocRef(outReqId, fb))).catch(
        () => null
      ),
      withChatStoreFallback((fb) => getDoc(getChatRequestDocRef(inReqId, fb))).catch(
        () => null
      ),
      withChatStoreFallback((fb) => getDoc(getConversationDocRef(convId, fb))).catch(
        () => null
      ),
      hasCallerAdminClaim(currentUid),
    ]);

  const isMutualFollow = Boolean(iFollowThem && theyFollowMe);
  const outgoingRequest =
    outSnap && outSnap.exists() ? parseChatRequestDoc(outSnap.id, outSnap.data()) : null;
  const incomingRequest =
    inSnap && inSnap.exists() ? parseChatRequestDoc(inSnap.id, inSnap.data()) : null;

  const isRequestAccepted =
    outgoingRequest?.status === 'accepted' ||
    outgoingRequest?.status === 'auto_accepted' ||
    outgoingRequest?.status === 'already_allowed' ||
    incomingRequest?.status === 'accepted' ||
    incomingRequest?.status === 'auto_accepted' ||
    incomingRequest?.status === 'already_allowed';

  const hasExistingConversation = Boolean(
    convSnap &&
      convSnap.exists() &&
      Array.isArray(convSnap.data()?.participants) &&
      convSnap.data()?.participants.includes(currentUid) &&
      convSnap.data()?.participants.includes(targetUid)
  );

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

  if (isRequestAccepted || hasExistingConversation || callerIsAdmin) {
    return {
      canChat: true,
      reason: callerIsAdmin ? 'official_account' : 'request_accepted',
      isMutualFollow: false,
      hasAcceptedRequest: true,
      isOfficialChat: Boolean(
        callerIsAdmin || currentUid === SUPER_ADMIN_UID || targetUid === SUPER_ADMIN_UID
      ),
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
  const nowMs = Date.now();
  const fromName = fromMeta?.displayName || auth.currentUser?.displayName || 'Student';
  const toName = toMeta?.displayName || 'Student';

  const sortedParticipants = [fromUid, toUid].sort();
  const payload = {
    fromUid,
    toUid,
    participants: sortedParticipants,
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

  await withChatStoreFallback((fb) =>
    setDoc(getChatRequestDocRef(reqId, fb), payload)
  );

  // Create notification for the receiver
  try {
    const notifRef = doc(collection(db, 'notifications'), `chat_req_${reqId}_${nowMs}`);
    await setDoc(notifRef, {
      userId: toUid,
      recipientUid: toUid,
      recipientId: toUid,
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
      conversationId: getConversationId(fromUid, toUid),
      link: `/dashboard/messages?tab=requests&uid=${encodeURIComponent(fromUid)}&requestId=${encodeURIComponent(reqId)}`,
      read: false,
      isRead: false,
      createdAt: serverTimestamp(),
    }).catch((err) => {
      console.warn('[chatService] Failed to create chat_request notification:', err);
    });
  } catch (err) {
    console.warn('[chatService] Non-blocking notification error:', err);
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

  const snap = await withChatStoreFallback((fb) =>
    getDoc(getChatRequestDocRef(requestId, fb))
  );
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
    await withChatStoreFallback((fb) =>
      updateDoc(getChatRequestDocRef(requestId, fb), {
        status: 'accepted',
        conversationId: convId,
        updatedAt: serverTimestamp(),
        declinedAt: null,
        declinedAtMs: null,
      })
    );

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
        recipientId: existing.fromUid,
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
        conversationId: convId,
        link: `/dashboard/messages?tab=chat&uid=${encodeURIComponent(currentUid)}&conversationId=${encodeURIComponent(convId)}`,
        read: false,
        isRead: false,
        createdAt: serverTimestamp(),
      }).catch((err) => {
        console.warn('[chatService] Failed to create chat_request_accepted notification:', err);
      });
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
    await withChatStoreFallback((fb) =>
      updateDoc(getChatRequestDocRef(requestId, fb), {
        status: 'declined',
        updatedAt: serverTimestamp(),
        declinedAt: serverTimestamp(),
        declinedAtMs: nowMs,
      })
    );

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
    const [convSnap, reqSnap] = await Promise.all([
      withChatStoreFallback((fb) =>
        getDocs(
          query(
            getConversationsCollection(fb),
            where('participants', 'array-contains', uid),
            limit(25)
          )
        )
      ).catch(() => null),
      withChatStoreFallback((fb) =>
        getDocs(
          query(
            getChatRequestsCollection(fb),
            where('toUid', '==', uid),
            where('status', '==', 'pending'),
            limit(25)
          )
        )
      ).catch(() => null),
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

  let unsubSnap: (() => void) | null = null;
  let isUnsubscribed = false;

  const startSubscription = (useFallback: boolean) => {
    if (isUnsubscribed) return;
    const q = query(
      getChatRequestsCollection(useFallback),
      where('toUid', '==', uid),
      where('status', '==', 'pending'),
      limit(25)
    );

    unsubSnap = onSnapshot(
      q,
      (snap) => {
        const items: ChatRequest[] = [];
        snap.forEach((d) => {
          items.push(parseChatRequestDoc(d.id, d.data()));
        });
        items.sort(
          (a, b) =>
            toTimestampMs(b.createdAt, b.createdAtMs) -
            toTimestampMs(a.createdAt, a.createdAtMs)
        );
        latestRequests = items;
        emitWithLiveProfiles(items);
      },
      (err) => {
        if (!useFallback && isPermissionDeniedError(err)) {
          enableFallbackChatStore();
          if (unsubSnap) {
            unsubSnap();
            unsubSnap = null;
          }
          startSubscription(true);
          return;
        }
        console.error(
          `[chatService] subscribeIncomingChatRequests failed for uid=${uid} (code=${err?.code || 'unknown'}):`,
          err
        );
        if (onError) onError(err);
      }
    );
  };

  startSubscription(useFallbackChatStore);

  const unsubProfiles = subscribeAllPublicProfiles(() => {
    if (latestRequests.length > 0) {
      emitWithLiveProfiles(latestRequests);
    }
  });

  return () => {
    isUnsubscribed = true;
    if (unsubSnap) unsubSnap();
    unsubProfiles();
  };
}

/**
 * Subscribes to outgoing (sent) pending chat requests for `uid`.
 */
export function subscribeOutgoingChatRequests(
  uid: string,
  onUpdate: (requests: ChatRequest[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!uid || uid.startsWith('guest_')) {
    onUpdate([]);
    return () => {};
  }

  let unsubSnap: (() => void) | null = null;
  let isUnsubscribed = false;

  const startSubscription = (useFallback: boolean) => {
    if (isUnsubscribed) return;
    const q = query(
      getChatRequestsCollection(useFallback),
      where('fromUid', '==', uid),
      where('status', '==', 'pending'),
      limit(25)
    );

    unsubSnap = onSnapshot(
      q,
      (snap) => {
        const list: ChatRequest[] = [];
        snap.forEach((docSnap) => {
          list.push(parseChatRequestDoc(docSnap.id, docSnap.data()));
        });
        list.sort(
          (a, b) =>
            toTimestampMs(b.createdAt, b.createdAtMs) -
            toTimestampMs(a.createdAt, a.createdAtMs)
        );
        onUpdate(list);
      },
      (err) => {
        if (!useFallback && isPermissionDeniedError(err)) {
          enableFallbackChatStore();
          if (unsubSnap) {
            unsubSnap();
            unsubSnap = null;
          }
          startSubscription(true);
          return;
        }
        console.error(
          `[chatService] subscribeOutgoingChatRequests failed for uid=${uid} (code=${err?.code || 'unknown'}):`,
          err
        );
        if (onError) onError(err);
      }
    );
  };

  startSubscription(useFallbackChatStore);

  return () => {
    isUnsubscribed = true;
    if (unsubSnap) unsubSnap();
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

  let unsubSnap: (() => void) | null = null;
  let isUnsubscribed = false;

  const startSubscription = (useFallback: boolean) => {
    if (isUnsubscribed) return;
    const q = query(
      getConversationsCollection(useFallback),
      where('participants', 'array-contains', uid),
      limit(25)
    );

    unsubSnap = onSnapshot(
      q,
      (snap) => {
        const convs: Conversation[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const lastMsg = data.lastMessage || data.lastMessageText || '';
          const lastSender = data.lastSenderId || data.lastMessageSenderId || '';
          const lastMsgAt = data.lastMessageAt || data.updatedAt || null;
          const lastMsgAtMs =
            typeof data.lastMessageAtMs === 'number'
              ? data.lastMessageAtMs
              : toTimestampMs(lastMsgAt);
          convs.push({
            id: d.id,
            participants: Array.isArray(data.participants) ? data.participants : [],
            participantDetails: data.participantDetails || {},
            status: data.status || 'accepted',
            unreadCounts:
              data.unreadCounts && typeof data.unreadCounts === 'object'
                ? data.unreadCounts
                : {},
            isOfficialChat: Boolean(data.isOfficialChat),
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

        // Reconcile any orphan message notifications (e.g. "New message from SHS Virtual Academy")
        // that lacked a parent conversation document so they appear immediately in Chats.
        void reconcileOrphanMessageNotificationsForUser(uid, convs);
      },
      (err) => {
        if (!useFallback && isPermissionDeniedError(err)) {
          enableFallbackChatStore();
          if (unsubSnap) {
            unsubSnap();
            unsubSnap = null;
          }
          startSubscription(true);
          return;
        }
        console.error(
          `[chatService] subscribeUserConversations failed for uid=${uid} (code=${err?.code || 'unknown'}):`,
          err
        );
        if (onError) onError(err);
      }
    );
  };

  startSubscription(useFallbackChatStore);

  const unsubProfiles = subscribeAllPublicProfiles(() => {
    if (latestConvs.length > 0) {
      emitConvsWithLiveProfiles(latestConvs);
    }
  });

  return () => {
    isUnsubscribed = true;
    if (unsubSnap) unsubSnap();
    unsubProfiles();
  };
}

const reconciledNotificationIdsByUser = new Map<string, Set<string>>();

/**
 * Finds message notifications for `uid` (e.g. "New message from SHS Virtual Academy", body "Hi")
 * that do not have a matching `conversations/{convId}` document and creates the missing
 * conversation and message document so the chat appears in `/dashboard/messages`.
 */
export async function reconcileOrphanMessageNotificationsForUser(
  uid: string,
  existingConvs?: Conversation[]
): Promise<number> {
  if (!uid || uid.startsWith('guest_')) return 0;

  let processedSet = reconciledNotificationIdsByUser.get(uid);
  if (!processedSet) {
    processedSet = new Set<string>();
    reconciledNotificationIdsByUser.set(uid, processedSet);
  }

  const existingConvIds = new Set<string>((existingConvs || []).map((c) => c.id));
  const candidateNotifs = new Map<string, Record<string, any>>();

  // 1. Collect from in-memory NotificationStore
  try {
    const storeSnap = getNotificationStoreSnapshot(uid);
    for (const n of storeSnap.userNotifications) {
      if (n.id && !processedSet.has(n.id)) {
        candidateNotifs.set(n.id, n as Record<string, any>);
      }
    }
  } catch {
    // Ignore store snapshot read error
  }

  // 2. Also query Firestore `notifications` directly in case NotificationStore hasn't synced yet
  try {
    const notifQ = query(
      collection(db, 'notifications'),
      where('userId', '==', uid),
      limit(50)
    );
    const notifSnap = await getDocs(notifQ);
    notifSnap.forEach((d) => {
      if (!processedSet!.has(d.id) && !candidateNotifs.has(d.id)) {
        candidateNotifs.set(d.id, { id: d.id, ...d.data() });
      }
    });
  } catch {
    // Ignore query error
  }

  let backfilledCount = 0;

  for (const [notifId, raw] of candidateNotifs.entries()) {
    processedSet.add(notifId);

    const rawType = String(raw.rawType || raw.type || '').trim().toLowerCase();
    const titleStr = String(raw.title || '').trim();
    const msgStr = String(raw.message || raw.body || '').trim();
    const isMsgNotif =
      rawType === 'new_message' ||
      rawType === 'message' ||
      /^New message from\s+(.+)$/i.test(titleStr);

    if (!isMsgNotif) continue;

    const meta = extractNotificationActorMeta(raw, notifId);
    let senderUid = String(
      raw.senderId || raw.senderUid || raw.authorId || raw.actorId || meta.authorId || ''
    ).trim();
    let senderName = String(
      raw.senderName || raw.authorName || meta.authorName || ''
    ).trim();

    if (!senderName) {
      const m = titleStr.match(/^New message from\s+(.+)$/i);
      if (m && m[1]) senderName = m[1].trim();
    }

    if (
      !senderUid &&
      senderName &&
      (senderName.toLowerCase() === 'shs virtual academy' ||
        senderName.toLowerCase() === SUPER_ADMIN_NAME.toLowerCase())
    ) {
      senderUid = SUPER_ADMIN_UID;
    }

    if (!senderUid || senderUid === uid) continue;

    const convId =
      typeof raw.conversationId === 'string' && raw.conversationId.startsWith('conv_')
        ? raw.conversationId
        : getConversationId(uid, senderUid);

    if (existingConvIds.has(convId)) continue;

    try {
      const convSnap = await withChatStoreFallback((fb) =>
        getDoc(getConversationDocRef(convId, fb))
      );
      if (
        convSnap.exists() &&
        Array.isArray(convSnap.data()?.participants) &&
        convSnap.data()?.participants.includes(uid)
      ) {
        existingConvIds.add(convId);
        continue;
      }

      const sortedParticipants = [uid, senderUid].sort();
      const createdAtMs =
        toTimestampMs(raw.createdAt, raw.createdAtMs) || Date.now();
      const resolvedSenderName =
        senderName ||
        (senderUid === SUPER_ADMIN_UID ? SUPER_ADMIN_NAME : 'Student');
      const isOfficial = senderUid === SUPER_ADMIN_UID;
      const myProfile = getCachedPublicProfile(uid);
      const senderProfile = getCachedPublicProfile(senderUid);
      const messageBody = msgStr || 'Hi';

      // Create the parent conversation document first so security rules see `uid` in `participants`
      await withChatStoreFallback((fb) =>
        setDoc(
          getConversationDocRef(convId, fb),
          {
            id: convId,
            participants: sortedParticipants,
            status: 'accepted',
            isOfficialChat: isOfficial,
            participantDetails: {
              [senderUid]: {
                displayName: senderProfile?.displayName || resolvedSenderName,
                avatar:
                  resolveCosmeticItemId(
                    senderProfile?.equippedAvatar || raw.authorAvatar,
                    'avatar'
                  ) || null,
                frame:
                  resolveCosmeticItemId(
                    senderProfile?.equippedFrame || raw.authorFrame,
                    'frame'
                  ) || null,
                role: isOfficial ? 'admin' : senderProfile?.role || 'student',
                photoURL: null,
              },
              [uid]: {
                displayName:
                  myProfile?.displayName || auth.currentUser?.displayName || 'Student',
                avatar: resolveCosmeticItemId(myProfile?.equippedAvatar, 'avatar') || null,
                frame: resolveCosmeticItemId(myProfile?.equippedFrame, 'frame') || null,
                role: myProfile?.role || 'student',
                photoURL: null,
              },
            },
            lastMessage: messageBody,
            lastMessageText: messageBody,
            lastMessageSenderId: senderUid,
            lastSenderId: senderUid,
            lastMessageAt: raw.createdAt || serverTimestamp(),
            lastMessageAtMs: createdAtMs,
            unreadCounts: {
              [uid]: raw.read ? 0 : 1,
            },
            createdAt: raw.createdAt || serverTimestamp(),
            updatedAt: raw.createdAt || serverTimestamp(),
          },
          { merge: true }
        )
      );

      // Check if messages subcollection already has at least one message; if not, backfill the message from the notification
      const existingMsgsSnap = await withChatStoreFallback((fb) =>
        getDocs(query(getMessagesCollection(convId, fb), limit(1)))
      ).catch(() => null);
      if (!existingMsgsSnap || existingMsgsSnap.empty) {
        await withChatStoreFallback((fb) =>
          setDoc(
            getMessageDocRef(convId, `backfill_${notifId}`, fb),
            {
              conversationId: convId,
              senderId: senderUid,
              recipientId: uid,
              senderName: resolvedSenderName,
              senderAvatar:
                resolveCosmeticItemId(
                  senderProfile?.equippedAvatar || raw.authorAvatar,
                  'avatar'
                ) || null,
              senderFrame:
                resolveCosmeticItemId(
                  senderProfile?.equippedFrame || raw.authorFrame,
                  'frame'
                ) || null,
              text: messageBody,
              createdAt: raw.createdAt || serverTimestamp(),
              createdAtMs,
            },
            { merge: true }
          )
        );
      }

      existingConvIds.add(convId);
      backfilledCount++;
    } catch (err) {
      console.warn(
        `[chatService] Failed to reconcile orphan notification ${notifId} into conversation ${convId}:`,
        err
      );
    }
  }

  return backfilledCount;
}

/**
 * Resets the unread counter on `conversations/{conversationId}` for `uid`.
 */
export async function clearConversationUnreadCount(
  conversationId: string,
  uid: string
): Promise<void> {
  if (!conversationId || !uid) return;
  try {
    await withChatStoreFallback((fb) =>
      updateDoc(getConversationDocRef(conversationId, fb), {
        [`unreadCounts.${uid}`]: 0,
      })
    );
  } catch {
    // Non-fatal if doc doesn't exist yet
  }
}

/**
 * Gets or creates a one-to-one conversation between two users.
 * Requires mutual follow, an accepted chat request, or an official/admin account.
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
  const isOfficial = Boolean(
    perm.isOfficialChat ||
      currentUserId === SUPER_ADMIN_UID ||
      otherUserId === SUPER_ADMIN_UID
  );

  const snap = await withChatStoreFallback((fb) =>
    getDoc(getConversationDocRef(convId, fb))
  ).catch(() => null);
  if (snap && snap.exists()) {
    const existingData = snap.data() as Conversation;
    const details = {
      ...(existingData.participantDetails || {}),
      ...(cMeta ? { [currentUserId]: cMeta } : {}),
      ...(oMeta ? { [otherUserId]: oMeta } : {}),
    };
    await withChatStoreFallback((fb) =>
      setDoc(
        getConversationDocRef(convId, fb),
        {
          id: convId,
          participants: sortedParticipants,
          status: 'accepted',
          isOfficialChat: isOfficial || Boolean(existingData.isOfficialChat),
          participantDetails: details,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    );
    return convId;
  }

  const cDisplayName =
    cMeta?.displayName ||
    (currentUserId === SUPER_ADMIN_UID
      ? SUPER_ADMIN_NAME
      : auth.currentUser?.displayName || 'Student');
  const oDisplayName =
    oMeta?.displayName ||
    (otherUserId === SUPER_ADMIN_UID ? SUPER_ADMIN_NAME : 'Student');

  const newConv: Record<string, any> = {
    id: convId,
    participants: sortedParticipants,
    status: 'accepted',
    isOfficialChat: isOfficial,
    participantDetails: {
      [currentUserId]: {
        displayName: cDisplayName,
        avatar: resolveCosmeticItemId(cMeta?.avatar, 'avatar'),
        frame: resolveCosmeticItemId(cMeta?.frame, 'frame'),
        role:
          cMeta?.role || (currentUserId === SUPER_ADMIN_UID ? 'admin' : 'student'),
        photoURL: null,
      },
      [otherUserId]: {
        displayName: oDisplayName,
        avatar: resolveCosmeticItemId(oMeta?.avatar, 'avatar'),
        frame: resolveCosmeticItemId(oMeta?.frame, 'frame'),
        role:
          oMeta?.role || (otherUserId === SUPER_ADMIN_UID ? 'admin' : 'student'),
        photoURL: null,
      },
    },
    lastMessage: '',
    lastMessageText: '',
    lastMessageSenderId: currentUserId,
    lastSenderId: currentUserId,
    lastMessageAt: serverTimestamp(),
    lastMessageAtMs: Date.now(),
    unreadCounts: {
      [currentUserId]: 0,
      [otherUserId]: 0,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await withChatStoreFallback((fb) =>
    setDoc(getConversationDocRef(convId, fb), newConv, { merge: true })
  );

  // When an official/admin account initiates a conversation with a student, also ensure an
  // accepted chatRequest record exists so both checkChatPermission and any request lookups succeed.
  if (perm.reason === 'official_account' || currentUserId === SUPER_ADMIN_UID) {
    const reqId = getChatRequestId(currentUserId, otherUserId);
    await withChatStoreFallback((fb) =>
      setDoc(
        getChatRequestDocRef(reqId, fb),
        {
          fromUid: currentUserId,
          toUid: otherUserId,
          participants: sortedParticipants,
          fromName: cDisplayName,
          fromAvatar: resolveCosmeticItemId(cMeta?.avatar, 'avatar'),
          fromFrame: resolveCosmeticItemId(cMeta?.frame, 'frame'),
          fromPhotoURL: null,
          fromRole: 'admin',
          toName: oDisplayName,
          toAvatar: resolveCosmeticItemId(oMeta?.avatar, 'avatar'),
          toFrame: resolveCosmeticItemId(oMeta?.frame, 'frame'),
          toPhotoURL: null,
          message: '',
          conversationId: convId,
          status: 'accepted',
          createdAt: serverTimestamp(),
          createdAtMs: Date.now(),
          updatedAt: serverTimestamp(),
          declinedAt: null,
          declinedAtMs: null,
        },
        { merge: true }
      )
    ).catch(() => {});
  }

  return convId;
}

/**
 * Sends a message in a conversation, guarantees the parent conversation document exists
 * with both `participants` and `participantDetails`, increments recipient unreadCounts,
 * and notifies the recipient.
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

  const senderName =
    senderMeta?.displayName ||
    (senderId === SUPER_ADMIN_UID
      ? SUPER_ADMIN_NAME
      : auth.currentUser?.displayName || 'Student');
  const senderAvatar = resolveCosmeticItemId(senderMeta?.avatar, 'avatar') || null;
  const senderFrame = resolveCosmeticItemId(senderMeta?.frame, 'frame') || null;
  const senderRole =
    senderMeta?.role || (senderId === SUPER_ADMIN_UID ? 'admin' : 'student');
  const nowMs = Date.now();
  const sortedParticipants = [senderId, recipientId].sort();
  const isOfficial = Boolean(
    perm.isOfficialChat ||
      senderId === SUPER_ADMIN_UID ||
      recipientId === SUPER_ADMIN_UID
  );

  const existingConvSnap = await withChatStoreFallback((fb) =>
    getDoc(getConversationDocRef(conversationId, fb))
  ).catch(() => null);
  const existingDetails =
    (existingConvSnap?.exists()
      ? existingConvSnap.data()?.participantDetails
      : null) || {};
  const cachedRecipientProf = getCachedPublicProfile(recipientId);
  const recipientPrev = existingDetails[recipientId] || {};
  const recipientDisplayName =
    cachedRecipientProf?.displayName ||
    recipientPrev.displayName ||
    (recipientId === SUPER_ADMIN_UID ? SUPER_ADMIN_NAME : 'Student');

  const mergedParticipantDetails: Record<string, ConversationParticipant> = {
    ...existingDetails,
    [senderId]: {
      displayName: senderName,
      avatar: senderAvatar || existingDetails[senderId]?.avatar || null,
      frame: senderFrame || existingDetails[senderId]?.frame || null,
      role: senderRole,
      photoURL: null,
    },
    [recipientId]: {
      displayName: recipientDisplayName,
      avatar:
        resolveCosmeticItemId(
          cachedRecipientProf?.equippedAvatar || recipientPrev.avatar,
          'avatar'
        ) || null,
      frame:
        resolveCosmeticItemId(
          cachedRecipientProf?.equippedFrame || recipientPrev.frame,
          'frame'
        ) || null,
      role:
        recipientPrev.role ||
        cachedRecipientProf?.role ||
        (recipientId === SUPER_ADMIN_UID ? 'admin' : 'student'),
      photoURL: null,
    },
  };

  // 1. Upsert parent conversation document FIRST (using setDoc with merge: true, never updateDoc.catch)
  // so `participants` array-contains queries and message subcollection rules always see a valid parent doc.
  await withChatStoreFallback((fb) =>
    setDoc(
      getConversationDocRef(conversationId, fb),
      {
        id: conversationId,
        participants: sortedParticipants,
        status: 'accepted',
        isOfficialChat: isOfficial,
        participantDetails: mergedParticipantDetails,
        lastMessage: trimmed,
        lastMessageText: trimmed,
        lastMessageSenderId: senderId,
        lastSenderId: senderId,
        lastMessageAt: serverTimestamp(),
        lastMessageAtMs: nowMs,
        updatedAt: serverTimestamp(),
        ...(existingConvSnap?.exists() ? {} : { createdAt: serverTimestamp() }),
        [`unreadCounts.${recipientId}`]: increment(1),
      },
      { merge: true }
    )
  );

  // 2. Write the message document to conversations/{conversationId}/messages (or fallback messages collection)
  const docRef = await withChatStoreFallback((fb) =>
    addDoc(getMessagesCollection(conversationId, fb), {
      conversationId,
      senderId,
      recipientId,
      senderName,
      senderAvatar,
      senderFrame,
      text: trimmed,
      createdAtMs: nowMs,
      createdAt: serverTimestamp(),
    })
  );

  // 3. If sender is an official/admin account, ensure an accepted chatRequest record exists
  if (perm.reason === 'official_account' || senderId === SUPER_ADMIN_UID) {
    const reqId = getChatRequestId(senderId, recipientId);
    await withChatStoreFallback((fb) =>
      setDoc(
        getChatRequestDocRef(reqId, fb),
        {
          fromUid: senderId,
          toUid: recipientId,
          participants: sortedParticipants,
          fromName: senderName,
          fromAvatar: senderAvatar,
          fromFrame: senderFrame,
          fromPhotoURL: null,
          fromRole: 'admin',
          toName: recipientDisplayName,
          toAvatar: mergedParticipantDetails[recipientId]?.avatar || null,
          toFrame: mergedParticipantDetails[recipientId]?.frame || null,
          toPhotoURL: null,
          message: trimmed,
          conversationId,
          status: 'accepted',
          createdAt: serverTimestamp(),
          createdAtMs: nowMs,
          updatedAt: serverTimestamp(),
          declinedAt: null,
          declinedAtMs: null,
        },
        { merge: true }
      )
    ).catch(() => {});
  }

  // 4. Send notification to recipient with direct link to the conversation in /dashboard/messages
  try {
    const notifRef = doc(collection(db, 'notifications'));
    await setDoc(notifRef, {
      userId: recipientId,
      recipientUid: recipientId,
      recipientId,
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
      link: `/dashboard/messages?tab=chat&uid=${encodeURIComponent(senderId)}&conversationId=${encodeURIComponent(conversationId)}`,
      read: false,
      isRead: false,
      createdAt: serverTimestamp(),
    }).catch((err) => {
      console.warn('[chatService] Failed to write message notification:', err);
    });
  } catch (err) {
    console.warn('[chatService] Non-blocking notification error:', err);
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

  let unsubSnap: (() => void) | null = null;
  let isUnsubscribed = false;

  const startSubscription = (useFallback: boolean) => {
    if (isUnsubscribed) return;
    const messagesCol = getMessagesCollection(conversationId, useFallback);
    const qPrimary = query(messagesCol, orderBy('createdAt', 'asc'), limit(150));

    unsubSnap = onSnapshot(
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
        if (!useFallback && isPermissionDeniedError(err)) {
          enableFallbackChatStore();
          if (unsubSnap) {
            unsubSnap();
            unsubSnap = null;
          }
          startSubscription(true);
          return;
        }
        console.error(
          `[chatService] subscribeMessages failed for conversationId=${conversationId} (code=${err?.code || 'unknown'}):`,
          err
        );
        if (onError) {
          onError(err);
        }
      }
    );
  };

  startSubscription(useFallbackChatStore);

  const unsubProfiles = subscribeAllPublicProfiles(() => {
    if (latestMsgs.length > 0) {
      emitMsgsWithLiveProfiles(latestMsgs);
    }
  });

  return () => {
    isUnsubscribed = true;
    if (unsubSnap) unsubSnap();
    unsubProfiles();
  };
}
