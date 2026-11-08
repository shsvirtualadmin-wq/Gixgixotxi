import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getNotificationStoreSnapshot,
  subscribeToNotificationStore,
  markNotificationAsRead,
  type AppNotification,
} from '@/services/notificationService';
import { subscribeIncomingChatRequests } from '@/services/chatService';

export interface UnreadMessagesState {
  totalBadgeCount: number;
  unreadChatNotificationsCount: number;
  incomingRequestsCount: number;
  unreadBySenderUid: Record<string, number>;
  unreadByConversationId: Record<string, number>;
  markConversationNotificationsRead: (partnerUid?: string | null, conversationId?: string | null) => Promise<void>;
}

function isDirectMessageNotification(n: AppNotification): boolean {
  if (n.read) return false;
  const rawType = String((n as any).rawType || n.type || '').toLowerCase();
  const titleLower = String(n.title || '').toLowerCase();
  const linkLower = String(n.link || '').toLowerCase();

  // Exclude chat_request notifications from message count since pending requests are counted via subscribeIncomingChatRequests
  if (
    rawType === 'chat_request' ||
    titleLower.includes('message request') ||
    linkLower.includes('chat=requests')
  ) {
    return false;
  }

  return (
    n.type === 'new_message' ||
    rawType === 'new_message' ||
    rawType === 'message' ||
    titleLower.includes('new message from') ||
    linkLower.includes('chat=open')
  );
}

export function useUnreadMessagesState(): UnreadMessagesState {
  const { user, isGuest } = useAuth();
  const uid = user?.uid && !isGuest && !user.uid.startsWith('guest_') ? user.uid : null;

  const [incomingRequestsCount, setIncomingRequestsCount] = useState<number>(0);
  const [userNotifications, setUserNotifications] = useState<AppNotification[]>(() =>
    uid ? getNotificationStoreSnapshot(uid).userNotifications : []
  );

  useEffect(() => {
    if (!uid) {
      setIncomingRequestsCount(0);
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

    return () => {
      unsubNotifs();
      unsubReqs();
    };
  }, [uid]);

  const { unreadChatNotificationsCount, unreadBySenderUid, unreadByConversationId, unreadNotifs } =
    useMemo(() => {
      const bySender: Record<string, number> = {};
      const byConv: Record<string, number> = {};
      const matched: AppNotification[] = [];

      for (const n of userNotifications) {
        if (!isDirectMessageNotification(n)) continue;
        matched.push(n);

        const senderUid = n.authorId || n.actorId || '';
        if (senderUid) {
          bySender[senderUid] = (bySender[senderUid] || 0) + 1;
        }
        const convId = (n as any).conversationId || '';
        if (convId) {
          byConv[convId] = (byConv[convId] || 0) + 1;
        }
      }

      return {
        unreadChatNotificationsCount: matched.length,
        unreadBySenderUid: bySender,
        unreadByConversationId: byConv,
        unreadNotifs: matched,
      };
    }, [userNotifications]);

  const markConversationNotificationsRead = useCallback(
    async (partnerUid?: string | null, conversationId?: string | null) => {
      if (!uid) return;
      const toMark = unreadNotifs.filter((n) => {
        const senderUid = n.authorId || n.actorId || '';
        const convId = (n as any).conversationId || '';
        if (partnerUid && senderUid === partnerUid) return true;
        if (conversationId && convId === conversationId) return true;
        if (partnerUid && n.link && n.link.includes(partnerUid)) return true;
        return false;
      });

      if (toMark.length === 0) return;

      await Promise.all(
        toMark.map((n) => markNotificationAsRead(n.id, uid).catch(() => {}))
      );
    },
    [uid, unreadNotifs]
  );

  return {
    totalBadgeCount: unreadChatNotificationsCount + incomingRequestsCount,
    unreadChatNotificationsCount,
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
