import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Sparkles, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchUserNotifications, markNotificationAsRead, UserNotification } from '../../lib/firebase';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const list = await fetchUserNotifications(user.uid);
      setNotifications(list);
    } catch (err) {
      console.warn('[NotificationBell] Fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadNotifications();
      // Optional polling every 60 seconds
      const interval = setInterval(loadNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user?.uid]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (notif: UserNotification) => {
    if (!notif.id || notif.read) return;
    setNotifications((prev) =>
      prev.map((item) => (item.id === notif.id ? { ...item, read: true } : item))
    );
    await markNotificationAsRead(notif.id);
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    for (const notif of unread) {
      if (notif.id) {
        await markNotificationAsRead(notif.id);
      }
    }
  };

  const handleItemClick = async (notif: UserNotification) => {
    await handleMarkAsRead(notif);
    if (notif.type === 'crew_approval') {
      setIsOpen(false);
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/crew-dashboard');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-200 cursor-pointer"
        aria-label="Notifications"
        title="View Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-xs animate-scale-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-scale-in text-left">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <Info className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <p className="text-xs font-semibold">No notifications right now</p>
                <p className="text-[11px]">Updates regarding your applications will appear here.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isApproval = n.type === 'crew_approval';
                const isRejection = n.type === 'crew_rejection';

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 sm:p-4 transition-colors cursor-pointer flex items-start gap-3 ${
                      !n.read
                        ? 'bg-indigo-50/40 dark:bg-slate-800/50'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      {isApproval ? (
                        <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      ) : isRejection ? (
                        <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                          <Info className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-xs font-black truncate ${
                            !n.read
                              ? 'text-slate-950 dark:text-white'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {n.title}
                        </h4>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                        {isApproval && (
                          <span className="text-indigo-600 font-extrabold flex items-center gap-0.5 hover:underline">
                            <span>Open Crew Dashboard</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 font-medium">
              Boardly Notifications Center
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
