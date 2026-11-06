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

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
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

/**
 * Returns deterministic conversation ID for two users (e.g. conv_uidA_uidB).
 */
export function getConversationId(uidA: string, uidB: string): string {
  const sorted = [uidA, uidB].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
}

function getMessageTimeMs(val: any, fallbackMs?: number): number {
  if (typeof fallbackMs === 'number' && fallbackMs > 0) return fallbackMs;
  if (!val) return Date.now();
  if (typeof val === 'number') return val;
  if (typeof val?.toMillis === 'function') return val.toMillis();
  if (typeof val?.seconds === 'number') return val.seconds * 1000;
  return Date.now();
}

/**
 * Gets or creates a one-to-one conversation between two users.
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

  const convId = getConversationId(currentUserId, otherUserId);
  const convRef = doc(db, 'conversations', convId);

  try {
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
      participants: [currentUserId, otherUserId],
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
  } catch {
    // Even if conversations collection rule is not yet deployed on remote,
    // deterministic convId works immediately with study_buddy_messages fallback
    return convId;
  }
}

/**
 * Sends a message in a conversation and notifies recipient.
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

  const senderName = senderMeta?.displayName || auth.currentUser?.displayName || 'Student';
  const senderAvatar = senderMeta?.avatar || null;
  const senderFrame = senderMeta?.frame || null;
  const nowMs = Date.now();

  let messageId = '';

  // 1. Primary: conversations/{conversationId}/messages
  try {
    const messagesColRef = collection(db, 'conversations', conversationId, 'messages');
    const convRef = doc(db, 'conversations', conversationId);
    const docRef = await addDoc(messagesColRef, {
      conversationId,
      senderId,
      senderName,
      senderAvatar,
      senderFrame,
      text: trimmed,
      createdAtMs: nowMs,
      createdAt: serverTimestamp(),
    });
    messageId = docRef.id;

    await updateDoc(convRef, {
      lastMessage: trimmed,
      lastMessageAt: serverTimestamp(),
      lastSenderId: senderId,
      updatedAt: serverTimestamp(),
    }).catch(() => {});
  } catch {
    // Fallback handled below
  }

  // 2. Mirror/Fallback: study_buddy_messages with crewId = `dm_${conversationId}`
  // Guaranteed allowed by existing live Firestore rules (senderUid == auth.uid, text 1..1000)
  try {
    const fallbackRef = await addDoc(collection(db, 'study_buddy_messages'), {
      crewId: `dm_${conversationId}`,
      conversationId,
      senderUid: senderId,
      senderId,
      senderName,
      senderAvatar,
      senderFrame,
      recipientUid: recipientId || null,
      text: trimmed,
      createdAtMs: nowMs,
      createdAt: serverTimestamp(),
    });
    if (!messageId) {
      messageId = fallbackRef.id;
    }
  } catch (err) {
    if (!messageId) {
      throw err;
    }
  }

  // 3. Send notification to recipient if present
  if (recipientId && recipientId !== senderId) {
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
        link: `/profile/${senderId}`,
        read: false,
        isRead: false,
        createdAt: serverTimestamp(),
      }).catch(() => {});
    } catch {
      // Non-blocking notification error
    }
  }

  return messageId;
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

  let primaryMsgs: ChatMessage[] = [];
  let fallbackMsgs: ChatMessage[] = [];
  let primaryFailed = false;
  let fallbackFailed = false;

  const emitMerged = () => {
    const byKey = new Map<string, ChatMessage>();
    for (const m of [...fallbackMsgs, ...primaryMsgs]) {
      // Deduplicate if written to both collections within same second by same sender + text
      const approxSec = Math.floor(getMessageTimeMs(m.createdAt, m.createdAtMs) / 2000);
      const dedupKey = `${m.senderId}_${approxSec}_${m.text}`;
      if (!byKey.has(dedupKey)) {
        byKey.set(dedupKey, m);
      }
    }
    const sorted = Array.from(byKey.values()).sort(
      (a, b) =>
        getMessageTimeMs(a.createdAt, a.createdAtMs) -
        getMessageTimeMs(b.createdAt, b.createdAtMs)
    );
    onUpdate(sorted);
  };

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
          senderName: data.senderName || 'Student',
          senderAvatar: data.senderAvatar || null,
          senderFrame: data.senderFrame || null,
          text: data.text || '',
          createdAt: data.createdAt,
          createdAtMs: data.createdAtMs,
        });
      });
      primaryMsgs = msgs;
      emitMerged();
    },
    (err) => {
      primaryFailed = true;
      if (fallbackFailed && onError) {
        onError(err);
      }
    }
  );

  const qFallback = query(
    collection(db, 'study_buddy_messages'),
    where('crewId', '==', `dm_${conversationId}`),
    limit(150)
  );

  const unsubFallback = onSnapshot(
    qFallback,
    (snap) => {
      const msgs: ChatMessage[] = [];
      snap.forEach((d) => {
        const data = d.data();
        msgs.push({
          id: d.id,
          conversationId,
          senderId: data.senderId || data.senderUid,
          senderName: data.senderName || 'Student',
          senderAvatar: data.senderAvatar || null,
          senderFrame: data.senderFrame || null,
          text: data.text || '',
          createdAt: data.createdAt,
          createdAtMs: data.createdAtMs,
        });
      });
      fallbackMsgs = msgs;
      emitMerged();
    },
    (err) => {
      fallbackFailed = true;
      if (primaryFailed && onError) {
        onError(err);
      }
    }
  );

  return () => {
    unsubPrimary();
    unsubFallback();
  };
}
