import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getNotificationStoreSnapshot,
  subscribeToUnreadNotifications,
} from '@/services/notificationService';

export function useUnreadNotificationsCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState<number>(() =>
    user?.uid ? getNotificationStoreSnapshot(user.uid).unreadCount : 0
  );

  useEffect(() => {
    if (!user?.uid) {
      setCount(0);
      return;
    }

    setCount(getNotificationStoreSnapshot(user.uid).unreadCount);
    const unsub = subscribeToUnreadNotifications(user.uid, (nextCount) => {
      setCount(nextCount);
    });

    return () => unsub();
  }, [user?.uid]);

  return count;
}
