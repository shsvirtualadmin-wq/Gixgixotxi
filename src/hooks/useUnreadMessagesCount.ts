import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getNotificationStoreSnapshot,
  subscribeToNotificationStore,
  markNotificationAsRead,
  type AppNotification,
} from '@/services/notificationService';
import {
  subscribeIncomingChatRequests,
  subscribeUserConversations,
  clearConversationUnreadCount,
  getConversationId,
  type Conversation,
} from '@/services/chatService';

export interface UnreadMessagesState {
  totalBadgeCount: number;
  unreadChatNotificationsCount: number;
  unreadConversationsCount: number;
  incomingRequestsCount: number;
  unreadBySenderUid: Record<string, number>;
  unreadByConversationId: Record<string, number>;
  markConversationNotificationsRead: (
    partnerUid?: string | null,
    conversationId?: string | null
  ) => Promise<void>;
}

function isDirectMessageNotification(n: AppNotification): boolean {
  if (n.read) return false;
  const rawType = String(n.rawType || n.type || '').toLowerCase();
  const titleLower = String(n.title || '').toLowerCase();
  const linkLower = String(n.link || '').toLowerCase();

  // Exclude chat_request notifications from message count since pending requests are counted via subscribeIncomingChatRequests
  if (
    rawType === 'chat_request' ||
    titleLower.includes('message request') ||
    linkLower.includes('chat=requests') ||
    linkLower.includes('tab=requests')
  ) {
    return false;
  }

  return (
    n.type === 'new_message' ||
    rawType === 'new_message' ||
    rawType === 'message' ||
    titleLower.includes('new message from') ||
    linkLower.includes('chat=open') ||
    linkLower.includes('/dashboard/messages')
  );
}

export function useUnreadMessagesState(): UnreadMessagesState {
  const { user, isGuest } = useAuth();
  const uid = user?.uid && !isGuest && !user.uid.startsWith('guest_') ? user.uid : null;

  const [incomingRequestsCount, setIncomingRequestsCount] = useState<number>(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userNotifications, setUserNotifications] = useState<AppNotification[]>(() =>
    uid ? getNotificationStoreSnapshot(uid).userNotifications : []
  );

  useEffect(() => {
    if (!uid) {
      setIncomingRequestsCount(0);
      setConversations([]);
      setUserNotifications([]);
      return;
    }

    setUserNotifications(getNotificationStoreSnapshot(uid).userNotifications);

    const unsubNotifs = subscribeToNotificationStore(uid, (snapshot) => {
      setUserNotifications(snapshot.userNotifications);
    });

    const unsubReqs = subscribeIncomingChatRequests(uid, (reqs) => {
      setIncomingRequestsCount(reqs.length);
    });

    const unsubConvs = subscribeUserConversations(uid, (convs) => {
      setConversations(convs);
    });

    return () => {
      unsubNotifs();
      unsubReqs();
      unsubConvs();
    };
  }, [uid]);

  const {
    unreadChatNotificationsCount,
    unreadConversationsCount,
    unreadBySenderUid,
    unreadByConversationId,
    unreadNotifs,
  } = useMemo(() => {
    const bySender: Record<string, number> = {};
    const byConv: Record<string, number> = {};
    const matched: AppNotification[] = [];

    for (const n of userNotifications) {
      if (!isDirectMessageNotification(n)) continue;
      matched.push(n);

      const senderUid = n.senderId || n.authorId || n.actorId || '';
      if (senderUid) {
        bySender[senderUid] = (bySender[senderUid] || 0) + 1;
      }
      const convId =
        n.conversationId ||
        (uid && senderUid ? getConversationId(uid, senderUid) : '');
      if (convId) {
        byConv[convId] = (byConv[convId] || 0) + 1;
      }
    }

    // Merge with per-conversation unreadCounts stored on `conversations/{id}`
    if (uid) {
      for (const conv of conversations) {
        const docUnread = Number(conv.unreadCounts?.[uid] || 0);
        if (docUnread > 0) {
          byConv[conv.id] = Math.max(byConv[conv.id] || 0, docUnread);
          const otherUid = conv.participants.find((p) => p !== uid) || '';
          if (otherUid) {
            bySender[otherUid] = Math.max(bySender[otherUid] || 0, docUnread);
          }
        }
      }
    }

    const totalUnreadMessages = Object.values(byConv).reduce((sum, v) => sum + v, 0);
    const unreadConvRows = Object.values(byConv).filter((v) => v > 0).length;

    return {
      unreadChatNotificationsCount: Math.max(matched.length, totalUnreadMessages),
      unreadConversationsCount: unreadConvRows,
      unreadBySenderUid: bySender,
      unreadByConversationId: byConv,
      unreadNotifs: matched,
    };
  }, [userNotifications, conversations, uid]);

  const markConversationNotificationsRead = useCallback(
    async (partnerUid?: string | null, conversationId?: string | null) => {
      if (!uid) return;
      const effectiveConvId =
        conversationId || (partnerUid ? getConversationId(uid, partnerUid) : null);

      const toMark = unreadNotifs.filter((n) => {
        const senderUid = n.senderId || n.authorId || n.actorId || '';
        const convId = n.conversationId || '';
        if (partnerUid && senderUid === partnerUid) return true;
        if (effectiveConvId && convId === effectiveConvId) return true;
        if (partnerUid && n.link && n.link.includes(partnerUid)) return true;
        return false;
      });

      await Promise.all([
        ...toMark.map((n) => markNotificationAsRead(n.id, uid).catch(() => {})),
        ...(effectiveConvId
          ? [clearConversationUnreadCount(effectiveConvId, uid)]
          : []),
      ]);
    },
    [uid, unreadNotifs]
  );

  return {
    totalBadgeCount: unreadChatNotificationsCount + incomingRequestsCount,
    unreadChatNotificationsCount,
    unreadConversationsCount,
    incomingRequestsCount,
    unreadBySenderUid,
    unreadByConversationId,
    markConversationNotificationsRead,
  };
}

export function useUnreadMessagesCount(): number {
  const { totalBadgeCount } = useUnreadMessagesState();
  return totalBadgeCount;
}

