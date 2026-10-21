import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToUnreadNotifications } from '@/services/notificationService';

interface SharedNotifSubscription {
  count: number;
  subscribers: Set<(count: number) => void>;
  unsubscribe: (() => void) | null;
}

const notifSubscriptions = new Map<string, SharedNotifSubscription>();

export function useUnreadNotificationsCount(): number {
  const { user } = useAuth();
  const uid = user?.uid;
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    return uid && notifSubscriptions.has(uid) ? notifSubscriptions.get(uid)!.count : 0;
  });

  useEffect(() => {
    if (!uid) {
      setUnreadCount(0);
      return;
    }

    let entry = notifSubscriptions.get(uid);
    if (!entry) {
      entry = {
        count: 0,
        subscribers: new Set(),
        unsubscribe: null,
      };
      notifSubscriptions.set(uid, entry);
    }

    const handler = (newCount: number) => {
      setUnreadCount(newCount);
    };

    entry.subscribers.add(handler);
    handler(entry.count);

    if (!entry.unsubscribe) {
      entry.unsubscribe = subscribeToUnreadNotifications(uid, (count) => {
        const currentEntry = notifSubscriptions.get(uid);
        if (currentEntry) {
          currentEntry.count = count;
          currentEntry.subscribers.forEach((sub) => sub(count));
        }
      });
    }

    return () => {
      const activeEntry = notifSubscriptions.get(uid);
      if (activeEntry) {
        activeEntry.subscribers.delete(handler);
        if (activeEntry.subscribers.size === 0) {
          if (activeEntry.unsubscribe) {
            activeEntry.unsubscribe();
          }
          notifSubscriptions.delete(uid);
        }
      }
    };
  }, [uid]);

  return unreadCount;
}

