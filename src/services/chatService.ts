import {
  collection,
  doc,
  getDoc,
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
  lastMessageAt?: any;
  lastSenderId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type ChatRequestStatus = 'pending' | 'accepted' | 'declined';

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
    fromAvatar: data.fromAvatar || null,
    fromFrame: data.fromFrame || null,
    fromPhotoURL: data.fromPhotoURL || null,
    fromRole: data.fromRole || null,
    toName: String(data.toName || 'Student'),
    toAvatar: data.toAvatar || null,
    toFrame: data.toFrame || null,
    toPhotoURL: data.toPhotoURL || null,
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
  toMeta?: ConversationParticipant
): Promise<ChatRequest> {
  if (!fromUid || !toUid) {
    throw new Error('Both sender and recipient IDs are required.');
  }
  if (fromUid === toUid) {
    throw new Error('You cannot send a chat request to yourself.');
  }

  const perm = await checkChatPermission(fromUid, toUid);
  if (perm.canChat) {
    throw new Error('You can already chat with this user.');
  }
  if (perm.outgoingRequest?.status === 'pending') {
    throw new Error('Chat request already sent.');
  }
  if (perm.isCooldownActive) {
    throw new Error('Your previous chat request was declined. You can send another request after 24 hours.');
  }

  // If the other user already sent a pending request to us, auto-accept it!
  if (perm.incomingRequest?.status === 'pending') {
    return respondToChatRequest(perm.incomingRequest.id, fromUid, 'accepted', fromMeta);
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
    fromAvatar: fromMeta?.avatar || null,
    fromFrame: fromMeta?.frame || null,
    fromPhotoURL: fromMeta?.photoURL || auth.currentUser?.photoURL || null,
    fromRole: fromMeta?.role || 'student',
    toName,
    toAvatar: toMeta?.avatar || null,
    toFrame: toMeta?.frame || null,
    toPhotoURL: toMeta?.photoURL || null,
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

  if (decision === 'accepted') {
    await updateDoc(reqRef, {
      status: 'accepted',
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
        avatar: responderMeta?.avatar ?? existing.toAvatar ?? null,
        frame: responderMeta?.frame ?? existing.toFrame ?? null,
        photoURL: responderMeta?.photoURL ?? existing.toPhotoURL ?? auth.currentUser?.photoURL ?? null,
      },
      {
        displayName: existing.fromName,
        avatar: existing.fromAvatar || null,
        frame: existing.fromFrame || null,
        photoURL: existing.fromPhotoURL || null,
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

  const q = query(
    collection(db, 'chatRequests'),
    where('toUid', '==', uid),
    where('status', '==', 'pending'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snap) => {
      const items: ChatRequest[] = [];
      snap.forEach((d) => {
        items.push(parseChatRequestDoc(d.id, d.data()));
      });
      items.sort(
        (a, b) => toTimestampMs(b.createdAt, b.createdAtMs) - toTimestampMs(a.createdAt, a.createdAtMs)
      );
      onUpdate(items);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
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

  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', uid),
    limit(50)
  );

  return onSnapshot(
    q,
    (snap) => {
      const convs: Conversation[] = [];
      snap.forEach((d) => {
        const data = d.data();
        convs.push({
          id: d.id,
          participants: Array.isArray(data.participants) ? data.participants : [],
          participantDetails: data.participantDetails || {},
          lastMessage: data.lastMessage || '',
          lastMessageAt: data.lastMessageAt || data.updatedAt || null,
          lastSenderId: data.lastSenderId || '',
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
        });
      });
      convs.sort(
        (a, b) => toTimestampMs(b.lastMessageAt || b.updatedAt) - toTimestampMs(a.lastMessageAt || a.updatedAt)
      );
      onUpdate(convs);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Gets or creates a one-to-one conversation between two users.
 * Requires mutual follow or an accepted chat request.
 */
export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string,
  currentMeta?: ConversationParticipant,
  otherMeta?: ConversationParticipant
): Promise<string> {
  if (!currentUserId || !otherUserId) {
    throw new Error('Both user IDs are required to open a conversation.');
  }
  if (currentUserId === otherUserId) {
    throw new Error('Cannot create conversation with yourself.');
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
    if (currentMeta || otherMeta) {
      const existingData = snap.data() as Conversation;
      const details = {
        ...(existingData.participantDetails || {}),
        ...(currentMeta ? { [currentUserId]: currentMeta } : {}),
        ...(otherMeta ? { [otherUserId]: otherMeta } : {}),
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
        displayName: currentMeta?.displayName || auth.currentUser?.displayName || 'Student',
        avatar: currentMeta?.avatar || null,
        frame: currentMeta?.frame || null,
        photoURL: currentMeta?.photoURL || auth.currentUser?.photoURL || null,
      },
      [otherUserId]: {
        displayName: otherMeta?.displayName || 'Student',
        avatar: otherMeta?.avatar || null,
        frame: otherMeta?.frame || null,
        photoURL: otherMeta?.photoURL || null,
      },
    },
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    lastSenderId: currentUserId,
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
  text: string,
  senderMeta?: ConversationParticipant,
  recipientId?: string
): Promise<string> {
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
    lastMessageAt: serverTimestamp(),
    lastSenderId: senderId,
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
      onUpdate(msgs);
    },
    (err) => {
      if (onError) {
        onError(err);
      }
    }
  );

  return () => {
    unsubPrimary();
  };
}
