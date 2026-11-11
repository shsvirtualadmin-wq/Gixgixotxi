import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Send,
  Check,
  X,
  ArrowLeft,
  Clock,
  Lock,
  Search,
  MessageCircle,
  Inbox,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWallet } from '@/hooks/useWallet';
import { BoardlyAvatar, resolveCosmeticItemId } from '@/components/ui/BoardlyAvatar';
import { ProBadge } from '@/components/ui/ProBadge';
import { ButtonLineLoader } from '@/components/ui/LineLoader';
import { useChatUserProfiles, type ChatUserSeed } from '@/hooks/useChatUserProfiles';
import { useUnreadMessagesState } from '@/hooks/useUnreadMessagesCount';
import {
  checkChatPermission,
  sendChatRequest,
  respondToChatRequest,
  subscribeIncomingChatRequests,
  subscribeUserConversations,
  getOrCreateConversation,
  sendMessage,
  subscribeMessages,
  type ChatRequest,
  type Conversation,
  type DirectMessage,
  type ChatPermissionState,
} from '@/services/chatService';

export interface TargetChatUser {
  uid: string;
  displayName: string;
  avatar?: string | null;
  frame?: string | null;
  role?: string;
  photoURL?: string | null;
}

export interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional target user if opened from a profile's Message button */
  targetUser?: TargetChatUser | null;
  /** Initial tab when opened ('chat' | 'requests') */
  initialTab?: 'chat' | 'requests';
  /** Callback when request status changes so parent ProfileView can refresh button state */
  onPermissionChange?: () => void;
}

export function formatRelativeTime(ms?: number, ts?: any): string {
  let timestamp = ms || 0;
  if (!timestamp && ts) {
    if (typeof ts === 'number') timestamp = ts;
    else if (typeof ts?.toMillis === 'function') timestamp = ts.toMillis();
    else if (typeof ts?.seconds === 'number') timestamp = ts.seconds * 1000;
  }
  if (!timestamp) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatBubbleTime(ms?: number, ts?: any): string {
  let timestamp = ms || 0;
  if (!timestamp && ts) {
    if (typeof ts === 'number') timestamp = ts;
    else if (typeof ts?.toMillis === 'function') timestamp = ts.toMillis();
    else if (typeof ts?.seconds === 'number') timestamp = ts.seconds * 1000;
  }
  if (!timestamp) return 'Just now';
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatDateDividerLabel(ms?: number, ts?: any): string {
  let timestamp = ms || 0;
  if (!timestamp && ts) {
    if (typeof ts === 'number') timestamp = ts;
    else if (typeof ts?.toMillis === 'function') timestamp = ts.toMillis();
    else if (typeof ts?.seconds === 'number') timestamp = ts.seconds * 1000;
  }
  if (!timestamp) return 'Today';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Today';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  if (timestamp >= startOfToday) return 'Today';
  if (timestamp >= startOfYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
}

export function formatRoleChipLabel(
  role?: string | null,
  customRole?: string | null,
  isSuperAdmin?: boolean
): string {
  if (isSuperAdmin) return 'Admin';
  if (!role) return 'Student';
  const lower = role.trim().toLowerCase();
  if (lower === 'superadmin' || lower === 'super admin' || lower === 'admin') return 'Admin';
  if (lower === 'captain' || lower === 'ambassador') return 'Captain';
  if (lower === 'bot') return 'Bot';
  if (lower === 'teacher') return 'Teacher';
  if (lower === 'parent') return 'Parent';
  if (lower === 'other' && customRole?.trim()) return customRole.trim();
  if (lower === 'student') return 'Student';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Subscribes to outgoing (sent) pending chat requests for the current user.
 */
export function useOutgoingChatRequests(uid?: string | null): ChatRequest[] {
  const [outgoing, setOutgoing] = useState<ChatRequest[]>([]);

  useEffect(() => {
    if (!uid || uid.startsWith('guest_')) {
      setOutgoing([]);
      return;
    }

    const q = query(
      collection(db, 'chatRequests'),
      where('fromUid', '==', uid),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: ChatRequest[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<ChatRequest, 'id'>) });
        });
        list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        setOutgoing(list);
      },
      () => {
        setOutgoing([]);
      }
    );

    return () => unsub();
  }, [uid]);

  return outgoing;
}

export interface FullScreenConversationViewProps {
  partner: TargetChatUser;
  onBack: () => void;
  onPermissionChange?: () => void;
  incomingRequests: ChatRequest[];
  respondingId: string | null;
  onRespondRequest: (req: ChatRequest, decision: 'accepted' | 'declined') => Promise<void>;
}

/**
 * Full-screen Conversation Screen (Section 4 of design specification):
 * - Slides up with a short spring animation; hides bottom dock while open.
 * - Floating glass header: round back button, 40px avatar, name with role chip,
 *   and existing status line ("Request accepted · Direct chat" / "Mutual Follow · Direct chat") with green dot.
 * - "Today" style date divider (muted pill), left card-colored bubbles with thin border,
 *   right red bubbles with white text (20px radius, 6px squared corner nearest sender, max-width 78%, time inside).
 * - Fixed bottom message bar with safe-area padding, pill input with 2px red focus ring,
 *   and 46px round red glass send button disabled when empty.
 */
export const FullScreenConversationView: React.FC<FullScreenConversationViewProps> = ({
  partner,
  onBack,
  onPermissionChange,
  incomingRequests,
  respondingId,
  onRespondRequest,
}) => {
  const { user: authUser, profile: authProfile, isAdmin } = useAuth();
  const { profile: ownProfile } = useUserProfile();
  const { equipped: ownEquipped } = useWallet();
  const { markConversationNotificationsRead } = useUnreadMessagesState();

  const currentUid = authUser?.uid || null;

  const [activePermission, setActivePermission] = useState<ChatPermissionState | null>(null);
  const [checkingPermission, setCheckingPermission] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [requestNote, setRequestNote] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);

  const messagesAreaRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const mySenderProfile = useMemo(() => {
    const op = (ownProfile || authProfile) as any;
    const displayName =
      op?.displayName || op?.username || authUser?.displayName || 'Student';
    const avatar =
      resolveCosmeticItemId(ownEquipped?.avatar, 'avatar') ||
      resolveCosmeticItemId(op?.equipped?.avatar, 'avatar') ||
      resolveCosmeticItemId(op?.avatar, 'avatar') ||
      null;
    const frame =
      (ownEquipped?.frame as string) ||
      (op?.equipped?.frame as string) ||
      op?.frame ||
      null;
    const photoURL = null;
    const role = isAdmin ? 'admin' : op?.role || 'student';
    return { displayName, avatar, frame, role, photoURL };
  }, [ownProfile, authProfile, ownEquipped, authUser, isAdmin]);

  // Enrich partner profile picture from publicProfileService
  const partnerSeeds = useMemo<ChatUserSeed[]>(
    () => [
      {
        uid: partner.uid,
        displayName: partner.displayName,
        avatar: partner.avatar,
        photoURL: partner.photoURL,
        frame: partner.frame,
        role: partner.role,
      },
    ],
    [partner]
  );
  const resolvedProfiles = useChatUserProfiles(partnerSeeds);
  const resolvedPartner = resolvedProfiles[partner.uid];

  const partnerName = resolvedPartner?.displayName || partner.displayName || 'Student';
  const partnerRoleLabel = formatRoleChipLabel(
    resolvedPartner?.role || partner.role,
    resolvedPartner?.customRole,
    resolvedPartner?.isSuperAdmin
  );
  const isPartnerAdmin = Boolean(
    resolvedPartner?.isSuperAdmin ||
      (resolvedPartner?.role || partner.role || '').toLowerCase() === 'admin' ||
      (resolvedPartner?.role || partner.role || '').toLowerCase() === 'superadmin'
  );

  // Hide the bottom dock while full-screen conversation is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.setAttribute('data-fullscreen-modal-open', 'true');
    window.dispatchEvent(new Event('boardly:modal-change'));
    return () => {
      document.body.removeAttribute('data-fullscreen-modal-open');
      window.dispatchEvent(new Event('boardly:modal-change'));
    };
  }, []);

  const scrollToNewest = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      } else if (messagesAreaRef.current) {
        messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
      }
    });
  }, []);

  // Keep message list scrolled when mobile keyboard resizes visualViewport
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleViewportResize = () => {
      scrollToNewest('auto');
    };
    vv.addEventListener('resize', handleViewportResize);
    return () => vv.removeEventListener('resize', handleViewportResize);
  }, [scrollToNewest]);

  // Check chat permission & initialize conversation
  useEffect(() => {
    if (!currentUid || !partner.uid || partner.uid === currentUid) {
      setActivePermission(null);
      setActiveConversationId(null);
      setMessages([]);
      return;
    }

    let isMounted = true;
    setCheckingPermission(true);
    setSendError(null);
    setRequestFeedback(null);

    checkChatPermission(currentUid, partner.uid)
      .then(async (perm) => {
        if (!isMounted) return;
        setActivePermission(perm);
        if (perm.canChat) {
          const convId = await getOrCreateConversation(currentUid, partner.uid, {
            [currentUid]: mySenderProfile,
            [partner.uid]: {
              displayName: partnerName,
              avatar: resolvedPartner?.equippedAvatar || resolvedPartner?.avatar || partner.avatar || null,
              frame: resolvedPartner?.frame || partner.frame || null,
              role: resolvedPartner?.role || partner.role || 'student',
              photoURL: null,
            },
          });
          if (isMounted) {
            setActiveConversationId(convId);
            void markConversationNotificationsRead(partner.uid, convId);
          }
        } else {
          setActiveConversationId(null);
        }
      })
      .catch((err) => {
        console.warn('[ConversationView] checkChatPermission error:', err);
      })
      .finally(() => {
        if (isMounted) setCheckingPermission(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    currentUid,
    partner.uid,
    partnerName,
    partner.avatar,
    partner.frame,
    partner.role,
    resolvedPartner?.equippedAvatar,
    resolvedPartner?.avatar,
    resolvedPartner?.frame,
    resolvedPartner?.role,
    mySenderProfile,
    markConversationNotificationsRead,
  ]);

  // Subscribe to messages for activeConversationId
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    return subscribeMessages(activeConversationId, (msgs) => {
      setMessages(msgs);
      void markConversationNotificationsRead(partner.uid, activeConversationId);
      setTimeout(() => {
        scrollToNewest('smooth');
      }, 40);
    });
  }, [activeConversationId, partner.uid, markConversationNotificationsRead, scrollToNewest]);

  // Scroll to newest on initial open
  useEffect(() => {
    if (messages.length > 0) {
      scrollToNewest('auto');
    }
  }, [messages.length, scrollToNewest]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUid || !partner.uid || !activeConversationId || !draft.trim() || sending) return;

    const textToSend = draft.trim();
    setDraft('');
    setSending(true);
    setSendError(null);

    try {
      await sendMessage(
        activeConversationId,
        currentUid,
        partner.uid,
        textToSend,
        mySenderProfile
      );
      scrollToNewest('smooth');
    } catch (err: any) {
      setDraft(textToSend);
      setSendError(err?.message || 'Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSendChatRequest = async () => {
    if (!currentUid || !partner.uid || sendingRequest) return;
    setSendingRequest(true);
    setSendError(null);
    setRequestFeedback(null);

    try {
      const result = await sendChatRequest(
        currentUid,
        partner.uid,
        mySenderProfile,
        {
          displayName: partnerName,
          avatar: resolvedPartner?.equippedAvatar || resolvedPartner?.avatar || partner.avatar || null,
          frame: resolvedPartner?.frame || partner.frame || null,
          photoURL: null,
        },
        requestNote
      );

      if (result.status === 'already_allowed' || result.status === 'auto_accepted') {
        const updatedPerm = await checkChatPermission(currentUid, partner.uid);
        setActivePermission(updatedPerm);
        if (updatedPerm.canChat) {
          const convId = await getOrCreateConversation(currentUid, partner.uid, {
            [currentUid]: mySenderProfile,
            [partner.uid]: {
              displayName: partnerName,
              avatar: resolvedPartner?.equippedAvatar || resolvedPartner?.avatar || partner.avatar || null,
              frame: resolvedPartner?.frame || partner.frame || null,
              role: resolvedPartner?.role || partner.role || 'student',
              photoURL: null,
            },
          });
          setActiveConversationId(convId);
        }
      } else {
        const updatedPerm = await checkChatPermission(currentUid, partner.uid);
        setActivePermission(updatedPerm);
        setRequestFeedback('Chat request sent! You can message once they accept.');
      }
      if (onPermissionChange) onPermissionChange();
    } catch (err: any) {
      setSendError(err?.message || 'Failed to send chat request.');
    } finally {
      setSendingRequest(false);
    }
  };

  // Group messages by date divider ("Today", "Yesterday", or short date)
  const groupedMessages = useMemo(() => {
    const groups: Array<{ dateLabel: string; items: DirectMessage[] }> = [];
    for (const msg of messages) {
      const label = formatDateDividerLabel(msg.createdAtMs, msg.createdAt);
      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.dateLabel !== label) {
        groups.push({ dateLabel: label, items: [msg] });
      } else {
        lastGroup.items.push(msg);
      }
    }
    return groups;
  }, [messages]);

  const statusLineText = activePermission?.isMutualFollow
    ? 'Mutual Follow · Direct chat'
    : activePermission?.hasAcceptedRequest
    ? 'Request accepted · Direct chat'
    : 'Request accepted · Direct chat';

  return (
    <div
      className="conv-screen"
      data-fullscreen-modal="true"
      role="dialog"
      aria-modal="true"
      aria-label={`Conversation with ${partnerName}`}
    >
      {/* ── FLOATING GLASS HEADER ── */}
      <div className="conv-header-wrap">
        <header className="conv-header-pill">
          <button
            type="button"
            onClick={onBack}
            className="conv-icon-btn"
            aria-label="Back to messages"
            title="Back"
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
          </button>

          <div className="shrink-0" style={{ width: 40, height: 40 }}>
            <BoardlyAvatar
              uid={partner.uid}
              equippedAvatar={resolvedPartner?.equippedAvatar || partner.avatar}
              frame={resolvedPartner?.frame}
              isSuperAdmin={resolvedPartner?.isSuperAdmin}
              loading={resolvedPartner?.isLoadingProfile}
              name={partnerName}
              size={40}
            />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="font-bold text-[15px] truncate leading-tight"
                style={{ color: 'var(--rs-text)' }}
              >
                {partnerName}
              </span>
              {resolvedPartner?.proBadge && (
                <ProBadge design={resolvedPartner.proBadge} size="sm" animated />
              )}
              <span
                className={`rs-chip ${isPartnerAdmin ? 'rs-chip--red' : ''} shrink-0`}
              >
                {partnerRoleLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              {activePermission?.canChat ? (
                <>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: 'var(--rs-green)' }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[11.5px] font-medium truncate"
                    style={{ color: 'var(--rs-muted)' }}
                  >
                    {statusLineText}
                  </span>
                </>
              ) : (
                <span
                  className="text-[11.5px] font-medium truncate"
                  style={{ color: 'var(--rs-muted)' }}
                >
                  {checkingPermission ? 'Checking chat status...' : 'Chat Request'}
                </span>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* ── CONVERSATION BODY ── */}
      {checkingPermission ? (
        <div className="conv-messages-area flex items-center justify-center">
          <ButtonLineLoader label="Loading conversation..." />
        </div>
      ) : activePermission?.canChat ? (
        <>
          <div ref={messagesAreaRef} className="conv-messages-area">
            <div className="conv-messages-inner">
              {messages.length === 0 ? (
                <div className="msg-empty-box my-8">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
                    style={{
                      backgroundColor: 'var(--rs-card2)',
                      boxShadow: 'inset 0 0 0 1px var(--rs-line)',
                      color: 'var(--rs-red-text)',
                    }}
                  >
                    <Sparkles size={20} />
                  </div>
                  <p
                    className="text-[15px] font-bold m-0"
                    style={{ color: 'var(--rs-text)' }}
                  >
                    Say Salam to {partnerName}!
                  </p>
                  <p
                    className="text-[13px] max-w-xs m-0 leading-relaxed"
                    style={{ color: 'var(--rs-muted)' }}
                  >
                    Discuss study topics, share exam tips, or ask questions directly.
                  </p>
                </div>
              ) : (
                groupedMessages.map((group) => (
                  <React.Fragment key={group.dateLabel}>
                    <div className="conv-date-divider">{group.dateLabel}</div>
                    {group.items.map((msg) => {
                      const isMe = msg.senderId === currentUid;
                      return (
                        <div
                          key={msg.id}
                          className={`conv-bubble ${
                            isMe ? 'conv-bubble--mine' : 'conv-bubble--theirs'
                          }`}
                        >
                          <span className="whitespace-pre-wrap break-words">
                            {msg.text}
                          </span>
                          <span className="conv-bubble-time">
                            {formatBubbleTime(msg.createdAtMs, msg.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {sendError && (
            <div
              className="px-4 py-2 text-xs text-center"
              style={{
                color: 'var(--rs-red-text)',
                backgroundColor: 'color-mix(in srgb, var(--rs-red) 12%, var(--rs-card))',
              }}
            >
              {sendError}
            </div>
          )}

          {/* ── FIXED BOTTOM MESSAGE BAR ── */}
          <form onSubmit={handleSendMessage} className="conv-composer-bar">
            <div className="conv-composer-inner">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
                placeholder={`Message ${partnerName}...`}
                maxLength={2000}
                className="conv-input"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="rs-glass-btn rs-glass-btn--red conv-send-btn"
                aria-label="Send message"
                title="Send"
              >
                <Send size={18} strokeWidth={2.2} />
              </button>
            </div>
          </form>
        </>
      ) : (
        /* ── PERMISSION / REQUEST GATE ── */
        <div className="conv-messages-area flex items-center justify-center p-5">
          <div className="msg-empty-box max-w-sm w-full">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
              style={{
                backgroundColor: 'var(--rs-card2)',
                boxShadow: 'inset 0 0 0 1px var(--rs-line)',
                color: 'var(--rs-muted)',
              }}
            >
              {activePermission?.outgoingRequest?.status === 'pending' ? (
                <Clock size={22} style={{ color: 'var(--rs-gold)' }} />
              ) : (
                <Lock size={22} />
              )}
            </div>

            {activePermission?.incomingRequest?.status === 'pending' ? (
              <>
                <h4
                  className="text-base font-bold m-0"
                  style={{ color: 'var(--rs-text)' }}
                >
                  {partnerName} wants to chat with you
                </h4>
                {activePermission.incomingRequest.message && (
                  <p
                    className="text-xs italic px-3.5 py-2.5 rounded-2xl m-0 w-full"
                    style={{
                      backgroundColor: 'var(--rs-card2)',
                      boxShadow: 'inset 0 0 0 1px var(--rs-line)',
                      color: 'var(--rs-muted)',
                    }}
                  >
                    &ldquo;{activePermission.incomingRequest.message}&rdquo;
                  </p>
                )}
                <p
                  className="text-xs m-0 leading-relaxed"
                  style={{ color: 'var(--rs-muted)' }}
                >
                  Accept their chat request to start a 1-on-1 conversation.
                </p>
                <div className="flex items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={respondingId === activePermission.incomingRequest.id}
                    onClick={() => {
                      const req =
                        incomingRequests.find(
                          (r) => r.id === activePermission.incomingRequest?.id
                        ) || activePermission.incomingRequest!;
                      void onRespondRequest(req, 'accepted').then(async () => {
                        if (currentUid) {
                          const perm = await checkChatPermission(currentUid, partner.uid);
                          setActivePermission(perm);
                          if (perm.canChat) {
                            const convId = await getOrCreateConversation(
                              currentUid,
                              partner.uid,
                              {
                                [currentUid]: mySenderProfile,
                                [partner.uid]: {
                                  displayName: partnerName,
                                  avatar: resolvedPartner?.equippedAvatar || resolvedPartner?.avatar || partner.avatar || null,
                                  frame: resolvedPartner?.frame || partner.frame || null,
                                  role: resolvedPartner?.role || partner.role || 'student',
                                  photoURL: null,
                                },
                              }
                            );
                            setActiveConversationId(convId);
                          }
                        }
                      });
                    }}
                    className="rs-glass-btn rs-glass-btn--red h-10 px-5 text-xs inline-flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>Accept</span>
                  </button>
                  <button
                    type="button"
                    disabled={respondingId === activePermission.incomingRequest.id}
                    onClick={() => {
                      const req =
                        incomingRequests.find(
                          (r) => r.id === activePermission.incomingRequest?.id
                        ) || activePermission.incomingRequest!;
                      void onRespondRequest(req, 'declined');
                    }}
                    className="msg-decline-btn"
                    aria-label="Decline request"
                    title="Decline"
                  >
                    <X size={16} />
                  </button>
                </div>
              </>
            ) : activePermission?.outgoingRequest?.status === 'pending' ? (
              <>
                <h4
                  className="text-base font-bold m-0"
                  style={{ color: 'var(--rs-text)' }}
                >
                  Chat Request Pending
                </h4>
                <p
                  className="text-xs m-0 leading-relaxed"
                  style={{ color: 'var(--rs-muted)' }}
                >
                  You&apos;ve sent a chat request to <strong>{partnerName}</strong>. You&apos;ll
                  be notified as soon as they accept, or if they follow you back.
                </p>
                <div className="pt-1">
                  <span className="rs-chip">Pending</span>
                </div>
              </>
            ) : (
              <>
                <h4
                  className="text-base font-bold m-0"
                  style={{ color: 'var(--rs-text)' }}
                >
                  Send a Chat Request
                </h4>
                <p
                  className="text-xs m-0 leading-relaxed"
                  style={{ color: 'var(--rs-muted)' }}
                >
                  Direct messaging is open between mutual followers. Since you and{' '}
                  <strong>{partnerName}</strong> don&apos;t follow each other yet, send a quick
                  chat request first.
                </p>

                <div className="w-full pt-2 space-y-2.5">
                  <input
                    type="text"
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    placeholder="Optional note (e.g., Let's study Physics together!)"
                    maxLength={160}
                    className="conv-input w-full text-xs"
                  />
                  {sendError && (
                    <p
                      className="text-xs m-0"
                      style={{ color: 'var(--rs-red-text)' }}
                    >
                      {sendError}
                    </p>
                  )}
                  {requestFeedback && (
                    <p
                      className="text-xs m-0"
                      style={{ color: 'var(--rs-green)' }}
                    >
                      {requestFeedback}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={sendingRequest}
                    onClick={handleSendChatRequest}
                    className="rs-glass-btn rs-glass-btn--red w-full h-11 px-5 text-xs inline-flex items-center justify-center gap-2"
                  >
                    <UserPlus size={15} />
                    <span>{sendingRequest ? 'Sending Request...' : 'Request to Chat'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export interface MessagesDashboardContentProps {
  initialTab?: 'chat' | 'requests';
  initialPartner?: TargetChatUser | null;
  onCloseModal?: () => void;
  onPermissionChange?: () => void;
  isModalWrapper?: boolean;
}

/**
 * Shared Messages & Requests Screen content used both on `/dashboard/messages` (`/messages`)
 * and when `DirectMessageModal` is opened without a specific conversation open.
 */
export const MessagesDashboardContent: React.FC<MessagesDashboardContentProps> = ({
  initialTab = 'chat',
  initialPartner = null,
  onCloseModal,
  onPermissionChange,
  isModalWrapper = false,
}) => {
  const { user: authUser, profile: authProfile, isAdmin, isGuest } = useAuth();
  const { profile: ownProfile } = useUserProfile();
  const { equipped: ownEquipped } = useWallet();
  const {
    unreadBySenderUid,
    unreadByConversationId,
    markConversationNotificationsRead,
  } = useUnreadMessagesState();

  const currentUid = authUser?.uid || null;

  const [activeTab, setActiveTab] = useState<'chat' | 'requests'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ChatRequest[]>([]);
  const outgoingRequests = useOutgoingChatRequests(currentUid);

  const [selectedPartner, setSelectedPartner] = useState<TargetChatUser | null>(
    initialPartner
  );
  const [respondingId, setRespondingId] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setSelectedPartner(initialPartner || null);
  }, [initialPartner]);

  const mySenderProfile = useMemo(() => {
    const op = (ownProfile || authProfile) as any;
    const displayName =
      op?.displayName || op?.username || authUser?.displayName || 'Student';
    const avatar =
      resolveCosmeticItemId(ownEquipped?.avatar, 'avatar') ||
      resolveCosmeticItemId(op?.equipped?.avatar, 'avatar') ||
      resolveCosmeticItemId(op?.avatar, 'avatar') ||
      null;
    const frame =
      (ownEquipped?.frame as string) ||
      (op?.equipped?.frame as string) ||
      op?.frame ||
      null;
    const photoURL = null;
    const role = isAdmin ? 'admin' : op?.role || 'student';
    return { displayName, avatar, frame, role, photoURL };
  }, [ownProfile, authProfile, ownEquipped, authUser, isAdmin]);

  // Subscribe to conversations & incoming requests
  useEffect(() => {
    if (!currentUid || isGuest || currentUid.startsWith('guest_')) return;

    const unsubConvs = subscribeUserConversations(currentUid, (convs) => {
      setConversations(convs);
    });
    const unsubReqs = subscribeIncomingChatRequests(currentUid, (reqs) => {
      setIncomingRequests(reqs);
    });

    return () => {
      unsubConvs();
      unsubReqs();
    };
  }, [currentUid, isGuest]);

  // Build seeds for all users across conversations, received requests, and sent requests
  const allUserSeeds = useMemo<ChatUserSeed[]>(() => {
    const seeds: ChatUserSeed[] = [];
    for (const conv of conversations) {
      const otherUid = conv.participants.find((p) => p !== currentUid) || '';
      if (!otherUid) continue;
      const details = conv.participantDetails?.[otherUid];
      seeds.push({
        uid: otherUid,
        displayName: details?.displayName,
        avatar: details?.avatar,
        photoURL: details?.photoURL,
        frame: details?.frame,
        role: details?.role,
      });
    }
    for (const req of incomingRequests) {
      if (!req.fromUid) continue;
      seeds.push({
        uid: req.fromUid,
        displayName: req.fromName,
        avatar: req.fromAvatar,
        photoURL: req.fromPhotoURL,
        frame: req.fromFrame,
        role: req.fromRole,
      });
    }
    for (const req of outgoingRequests) {
      if (!req.toUid) continue;
      seeds.push({
        uid: req.toUid,
        displayName: req.toName,
        avatar: req.toAvatar,
        photoURL: req.toPhotoURL,
        frame: req.toFrame,
      });
    }
    if (selectedPartner?.uid) {
      seeds.push({
        uid: selectedPartner.uid,
        displayName: selectedPartner.displayName,
        avatar: selectedPartner.avatar,
        photoURL: selectedPartner.photoURL,
        frame: selectedPartner.frame,
        role: selectedPartner.role,
      });
    }
    return seeds;
  }, [conversations, incomingRequests, outgoingRequests, currentUid, selectedPartner]);

  const resolvedUsers = useChatUserProfiles(allUserSeeds);

  const handleRespondRequest = useCallback(
    async (req: ChatRequest, decision: 'accepted' | 'declined') => {
      if (!currentUid || respondingId) return;
      setRespondingId(req.id);
      try {
        const result = await respondToChatRequest(req.id, currentUid, decision, {
          displayName: mySenderProfile.displayName,
          avatar: mySenderProfile.avatar,
          frame: mySenderProfile.frame,
          photoURL: mySenderProfile.photoURL,
        });

        if (decision === 'accepted' && result.conversationId) {
          const senderResolved = resolvedUsers[req.fromUid];
          setSelectedPartner({
            uid: req.fromUid,
            displayName: senderResolved?.displayName || req.fromName || 'Student',
            avatar: senderResolved?.equippedAvatar || senderResolved?.avatar || req.fromAvatar || null,
            frame: senderResolved?.frame || req.fromFrame || null,
            role: senderResolved?.role || req.fromRole || 'student',
            photoURL: null,
          });
          setActiveTab('chat');
        }
        if (onPermissionChange) onPermissionChange();
      } catch (err) {
        console.warn('[Messages] respondToChatRequest error:', err);
      } finally {
        setRespondingId(null);
      }
    },
    [currentUid, respondingId, mySenderProfile, resolvedUsers, onPermissionChange]
  );

  // Segmented tab slider geometry
  const tabButtonRefs = useRef<Record<'chat' | 'requests', HTMLButtonElement | null>>({
    chat: null,
    requests: null,
  });
  const [sliderRect, setSliderRect] = useState<{ left: number; width: number }>({
    left: 4,
    width: 0,
  });

  const totalRequestsCount = incomingRequests.length + outgoingRequests.length;

  useEffect(() => {
    const updateSlider = () => {
      const activeBtn = tabButtonRefs.current[activeTab];
      if (activeBtn) {
        setSliderRect({
          left: activeBtn.offsetLeft,
          width: activeBtn.offsetWidth,
        });
      }
    };
    updateSlider();
    window.addEventListener('resize', updateSlider);
    return () => window.removeEventListener('resize', updateSlider);
  }, [activeTab, conversations.length, totalRequestsCount]);

  // Filtered conversations by search query
  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) => {
      const otherUid = conv.participants.find((p) => p !== currentUid) || '';
      const resolved = resolvedUsers[otherUid];
      const fallbackName = conv.participantDetails?.[otherUid]?.displayName || 'Student';
      const name = (resolved?.displayName || fallbackName).toLowerCase();
      const preview = (conv.lastMessageText || '').toLowerCase();
      return name.includes(q) || preview.includes(q);
    });
  }, [conversations, searchQuery, currentUid, resolvedUsers]);

  // If a conversation is open, render the full-screen Conversation Screen
  if (selectedPartner) {
    return (
      <FullScreenConversationView
        partner={selectedPartner}
        onBack={() => {
          if (initialPartner && onCloseModal) {
            onCloseModal();
          } else {
            setSelectedPartner(null);
          }
        }}
        onPermissionChange={onPermissionChange}
        incomingRequests={incomingRequests}
        respondingId={respondingId}
        onRespondRequest={handleRespondRequest}
      />
    );
  }

  return (
    <div className="msg-page space-y-5">
      {/* Page Title & Description */}
      <header className="flex items-start justify-between gap-3 pt-1">
        <div>
          <h1 className="msg-title">Messages</h1>
          <p className="msg-desc">
            Direct conversations and chat requests with fellow students.
          </p>
        </div>
        {isModalWrapper && onCloseModal && (
          <button
            type="button"
            onClick={onCloseModal}
            className="conv-icon-btn"
            aria-label="Close messages"
          >
            <X size={18} />
          </button>
        )}
      </header>

      {/* Segmented Tab Bar with Sliding Red Glass Pill */}
      <div className="rs-seg-scroll">
        <div className="rs-seg-track" role="tablist" aria-label="Messages sections">
          <div
            className="rs-seg-slider"
            style={{
              width: sliderRect.width > 0 ? `${sliderRect.width}px` : '50%',
              transform: `translateX(${sliderRect.left - 4}px)`,
            }}
            aria-hidden="true"
          />
          <button
            ref={(el) => {
              tabButtonRefs.current.chat = el;
            }}
            type="button"
            role="tab"
            aria-selected={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
            className={`rs-seg-tab ${activeTab === 'chat' ? 'rs-seg-tab--active' : ''}`}
          >
            <span>Chats</span>
            <span className="rs-seg-badge">{conversations.length}</span>
          </button>
          <button
            ref={(el) => {
              tabButtonRefs.current.requests = el;
            }}
            type="button"
            role="tab"
            aria-selected={activeTab === 'requests'}
            onClick={() => setActiveTab('requests')}
            className={`rs-seg-tab ${activeTab === 'requests' ? 'rs-seg-tab--active' : ''}`}
          >
            <span>Requests</span>
            <span className="rs-seg-badge">{totalRequestsCount}</span>
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <div className="space-y-3.5">
          {/* Rounded search field ("Search chats") */}
          <div className="msg-search-wrap">
            <Search size={17} className="msg-search-icon" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats"
              aria-label="Search chats"
              className="msg-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 text-[var(--rs-muted)] hover:text-[var(--rs-text)] p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Conversation Rows */}
          {filteredConversations.length === 0 ? (
            <div className="msg-empty-box">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
                style={{
                  backgroundColor: 'var(--rs-card2)',
                  boxShadow: 'inset 0 0 0 1px var(--rs-line)',
                  color: 'var(--rs-muted)',
                }}
              >
                <MessageCircle size={20} />
              </div>
              <p
                className="text-[15px] font-bold m-0"
                style={{ color: 'var(--rs-text)' }}
              >
                {searchQuery.trim()
                  ? 'No matching conversations'
                  : 'No active conversations yet'}
              </p>
              <p
                className="text-[13px] max-w-xs m-0 leading-relaxed"
                style={{ color: 'var(--rs-muted)' }}
              >
                {searchQuery.trim()
                  ? 'Try searching for another student name or message keyword.'
                  : 'Follow students back or accept a chat request to start messaging.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredConversations.map((conv) => {
                const otherUid =
                  conv.participants.find((p) => p !== currentUid) || '';
                const otherDetails = conv.participantDetails?.[otherUid] || {
                  displayName: 'Student',
                };
                const resolved = resolvedUsers[otherUid];
                const displayName =
                  resolved?.displayName || otherDetails.displayName || 'Student';

                const unreadCountForRow =
                  (unreadByConversationId[conv.id] || 0) ||
                  (otherUid ? unreadBySenderUid[otherUid] || 0 : 0);
                const isUnread = unreadCountForRow > 0;

                const previewText = conv.lastMessageText
                  ? conv.lastMessageSenderId === currentUid
                    ? `You: ${conv.lastMessageText}`
                    : conv.lastMessageText
                  : 'Tap to start chatting';

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      void markConversationNotificationsRead(otherUid, conv.id);
                      setSelectedPartner({
                        uid: otherUid,
                        displayName,
                        avatar: resolved?.equippedAvatar || resolved?.avatar || otherDetails.avatar || null,
                        frame: resolved?.frame || otherDetails.frame || null,
                        role: resolved?.role || otherDetails.role || 'student',
                        photoURL: null,
                      });
                    }}
                    className={`msg-conv-card ${isUnread ? 'msg-conv-card--unread' : ''}`}
                  >
                    <div className="shrink-0" style={{ width: 48, height: 48 }}>
                      <BoardlyAvatar
                        uid={otherUid}
                        equippedAvatar={resolved?.equippedAvatar}
                        frame={resolved?.frame}
                        isSuperAdmin={resolved?.isSuperAdmin}
                        loading={resolved?.isLoadingProfile}
                        name={displayName}
                        size={48}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="msg-conv-name truncate">{displayName}</span>
                          {resolved?.proBadge && (
                            <ProBadge design={resolved.proBadge} size="sm" listMode />
                          )}
                        </div>
                        <span className="msg-conv-time">
                          {formatRelativeTime(conv.lastMessageAtMs, conv.updatedAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span
                          className={`msg-conv-preview ${
                            isUnread ? 'msg-conv-preview--unread' : ''
                          }`}
                        >
                          {previewText}
                        </span>
                        {isUnread && (
                          <span className="msg-unread-pill shrink-0">
                            {unreadCountForRow}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── REQUESTS TAB ("Received" and "Sent") ── */
        <div className="space-y-6">
          {/* RECEIVED GROUP */}
          <section>
            <h2 className="msg-group-heading">Received</h2>
            {incomingRequests.length === 0 ? (
              <div className="msg-empty-box py-7">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-0.5"
                  style={{
                    backgroundColor: 'var(--rs-card2)',
                    boxShadow: 'inset 0 0 0 1px var(--rs-line)',
                    color: 'var(--rs-muted)',
                  }}
                >
                  <Inbox size={18} />
                </div>
                <p
                  className="text-[14px] font-bold m-0"
                  style={{ color: 'var(--rs-text)' }}
                >
                  No received requests
                </p>
                <p
                  className="text-[12.5px] max-w-xs m-0"
                  style={{ color: 'var(--rs-muted)' }}
                >
                  When a student sends you a chat request, it will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {incomingRequests.map((req) => {
                  const resolved = resolvedUsers[req.fromUid];
                  const senderName =
                    resolved?.displayName || req.fromName || 'Student';

                  return (
                    <div key={req.id} className="msg-req-card">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="shrink-0" style={{ width: 48, height: 48 }}>
                            <BoardlyAvatar
                              uid={req.fromUid}
                              equippedAvatar={resolved?.equippedAvatar}
                              frame={resolved?.frame}
                              isSuperAdmin={resolved?.isSuperAdmin}
                              loading={resolved?.isLoadingProfile}
                              name={senderName}
                              size={48}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="msg-conv-name truncate">
                                  {senderName}
                                </span>
                                {resolved?.proBadge && (
                                  <ProBadge design={resolved.proBadge} size="sm" listMode />
                                )}
                              </div>
                              <span className="msg-conv-time">
                                {formatRelativeTime(req.createdAtMs, req.createdAt)}
                              </span>
                            </div>
                            <p
                              className="text-[13px] m-0 mt-0.5 truncate"
                              style={{ color: 'var(--rs-muted)' }}
                            >
                              wants to chat with you
                            </p>
                            {req.message && (
                              <p
                                className="text-[12px] italic m-0 mt-1.5 px-3 py-1.5 rounded-xl"
                                style={{
                                  backgroundColor: 'var(--rs-card2)',
                                  boxShadow: 'inset 0 0 0 1px var(--rs-line)',
                                  color: 'var(--rs-text)',
                                }}
                              >
                                &ldquo;{req.message}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={respondingId === req.id}
                            onClick={() => void handleRespondRequest(req, 'accepted')}
                            className="rs-glass-btn rs-glass-btn--red h-9 px-4 text-xs inline-flex items-center gap-1.5"
                          >
                            <span>
                              {respondingId === req.id ? 'Accepting...' : 'Accept'}
                            </span>
                          </button>
                          <button
                            type="button"
                            disabled={respondingId === req.id}
                            onClick={() => void handleRespondRequest(req, 'declined')}
                            className="msg-decline-btn"
                            aria-label="Decline request"
                            title="Decline"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* SENT GROUP */}
          <section>
            <h2 className="msg-group-heading">Sent</h2>
            {outgoingRequests.length === 0 ? (
              <div className="msg-empty-box py-7">
                <p
                  className="text-[14px] font-bold m-0"
                  style={{ color: 'var(--rs-text)' }}
                >
                  No sent requests
                </p>
                <p
                  className="text-[12.5px] max-w-xs m-0"
                  style={{ color: 'var(--rs-muted)' }}
                >
                  Requests you send from student profiles will show here while pending.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {outgoingRequests.map((req) => {
                  const resolved = resolvedUsers[req.toUid];
                  const recipientName =
                    resolved?.displayName || req.toName || 'Student';

                  return (
                    <div key={req.id} className="msg-req-card">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="shrink-0" style={{ width: 48, height: 48 }}>
                            <BoardlyAvatar
                              uid={req.toUid}
                              equippedAvatar={resolved?.equippedAvatar}
                              frame={resolved?.frame}
                              isSuperAdmin={resolved?.isSuperAdmin}
                              loading={resolved?.isLoadingProfile}
                              name={recipientName}
                              size={48}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="msg-conv-name truncate">
                                {recipientName}
                              </span>
                              {resolved?.proBadge && (
                                <ProBadge design={resolved.proBadge} size="sm" listMode />
                              )}
                            </div>
                            <span className="msg-conv-time block mt-0.5">
                              {formatRelativeTime(req.createdAtMs, req.createdAt) ||
                                'Sent recently'}
                            </span>
                          </div>
                        </div>

                        <span className="rs-chip shrink-0">Pending</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  initialTab = 'chat',
  onPermissionChange,
}) => {
  const { user: authUser, isGuest } = useAuth();
  const currentUid = authUser?.uid || null;
  const incomingRequests = useIncomingRequestsSnapshot(currentUid, isOpen && !isGuest);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const { profile: ownProfile } = useUserProfile();
  const { equipped: ownEquipped } = useWallet();

  // Hide the bottom dock while DirectMessageModal is open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    document.body.setAttribute('data-fullscreen-modal-open', 'true');
    window.dispatchEvent(new Event('boardly:modal-change'));
    return () => {
      document.body.removeAttribute('data-fullscreen-modal-open');
      window.dispatchEvent(new Event('boardly:modal-change'));
    };
  }, [isOpen]);

  const handleRespondFromGate = useCallback(
    async (req: ChatRequest, decision: 'accepted' | 'declined') => {
      if (!currentUid || respondingId) return;
      setRespondingId(req.id);
      try {
        const op = ownProfile as any;
        await respondToChatRequest(req.id, currentUid, decision, {
          displayName: op?.displayName || authUser?.displayName || 'Student',
          avatar:
            resolveCosmeticItemId(ownEquipped?.avatar, 'avatar') ||
            resolveCosmeticItemId(op?.equipped?.avatar, 'avatar') ||
            resolveCosmeticItemId(op?.avatar, 'avatar') ||
            null,
          frame: (ownEquipped?.frame as string) || op?.frame || null,
          photoURL: null,
        });
        if (onPermissionChange) onPermissionChange();
      } finally {
        setRespondingId(null);
      }
    },
    [currentUid, respondingId, ownProfile, authUser, ownEquipped, onPermissionChange]
  );

  if (!isOpen || !currentUid || isGuest) return null;

  // When opened for a specific targetUser (e.g. clicking Message on a profile or ?chat=open)
  if (targetUser && initialTab === 'chat') {
    return (
      <FullScreenConversationView
        partner={targetUser}
        onBack={onClose}
        onPermissionChange={onPermissionChange}
        incomingRequests={incomingRequests}
        respondingId={respondingId}
        onRespondRequest={handleRespondFromGate}
      />
    );
  }

  // When opened on own profile or with ?chat=requests, show full-screen restyled Messages view
  return (
    <div
      className="conv-screen overflow-y-auto"
      data-fullscreen-modal="true"
      role="dialog"
      aria-modal="true"
      aria-label="Messages"
    >
      <div className="max-w-3xl w-full mx-auto px-4 pt-[calc(16px+env(safe-area-inset-top,0px))] pb-12">
        <MessagesDashboardContent
          initialTab={initialTab}
          initialPartner={targetUser || null}
          onCloseModal={onClose}
          onPermissionChange={onPermissionChange}
          isModalWrapper={true}
        />
      </div>
    </div>
  );
};

function useIncomingRequestsSnapshot(uid: string | null, enabled: boolean): ChatRequest[] {
  const [reqs, setReqs] = useState<ChatRequest[]>([]);
  useEffect(() => {
    if (!uid || !enabled || uid.startsWith('guest_')) {
      setReqs([]);
      return;
    }
    return subscribeIncomingChatRequests(uid, (list) => {
      setReqs(list);
    });
  }, [uid, enabled]);
  return reqs;
}

export default DirectMessageModal;
