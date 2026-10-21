import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToUnreadNotifications } from '@/services/notificationService';

export function useUnreadNotificationsCount(): number {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = subscribeToUnreadNotifications(user.uid, (count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  return unreadCount;
}
