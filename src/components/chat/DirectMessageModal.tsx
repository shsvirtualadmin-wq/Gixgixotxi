import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Send,
  Check,
  CheckCheck,
  X,
  ArrowLeft,
  Clock,
  Lock,
  Search,
  MessageCircle,
  Inbox,
  UserPlus,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  MoreHorizontal,
  Paperclip,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { showApiToast } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWallet } from '@/hooks/useWallet';
import { BoardlyAvatar, resolveCosmeticItemId } from '@/components/ui/BoardlyAvatar';
import { ProBadge } from '@/components/ui/ProBadge';
import { PlusBadge } from '@/components/ui/PlusBadge';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { resolveRoleBadgeDisplay } from '@/lib/profileRoles';
import { useChatUserProfiles, type ChatUserSeed } from '@/hooks/useChatUserProfiles';
import { useUnreadMessagesState } from '@/hooks/useUnreadMessagesCount';
import {
  checkChatPermission,
  sendChatRequest,
  respondToChatRequest,
  subscribeIncomingChatRequests,
  subscribeOutgoingChatRequests,
  subscribeUserConversations,
  getCachedUserConversations,
  getCachedIncomingChatRequests,
  getCachedConversationMessages,
  seedConversationMessagesCache,
  getCachedChatPermission,
  seedChatPermissionCache,
  getConversationId,
  getOrCreateConversation,
  clearConversationUnreadCount,
  sendMessage,
  subscribeMessages,
  loadOlderMessages,
  CHAT_MESSAGES_PAGE_SIZE,
  type ChatRequest,
  type Conversation,
  type DirectMessage,
  type ChatPermissionState,
} from '@/services/chatService';

export interface TargetChatUser {
  uid: string;
  displayName: string;
  username?: string | null;
  avatar?: string | null;
  equippedAvatar?: string | null;
  frame?: string | null;
  equippedFrame?: string | null;
  role?: string;
  customRole?: string | null;
  photoURL?: string | null;
  proBadge?: any;
  lastMessageText?: string;
  lastMessageSenderId?: string;
  lastMessageAtMs?: number;
}

export interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional target user if opened from a profile's Message button */
  targetUser?: TargetChatUser | null;
  /** Alias for targetUser used by ProfileView */
  partner?: TargetChatUser | null;
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
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d`;
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
  if (!timestamp) return 'TODAY';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'TODAY';

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  if (timestamp >= startOfToday) return 'TODAY';
  if (timestamp >= startOfYesterday) return 'YESTERDAY';

  return date
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
    })
    .toUpperCase();
}

export function formatRoleChipLabel(
  role?: string | null,
  customRole?: string | null,
  isSuperAdmin?: boolean
): string {
  return resolveRoleBadgeDisplay({ role, customRole, isSuperAdmin }).label;
}

function formatFirestoreError(collectionName: string, err: any): string {
  console.error(`[Boardly Chat] Firestore error on "${collectionName}":`, err);
  return 'Something went wrong. Please try again.';
}

export function useOutgoingChatRequests(
  uid?: string | null,
  retryNonce = 0,
  onError?: (err: any) => void
): ChatRequest[] {
  const [outgoing, setOutgoing] = useState<ChatRequest[]>([]);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!uid || uid.startsWith('guest_')) {
      setOutgoing([]);
      return;
    }

    return subscribeOutgoingChatRequests(
      uid,
      (list) => {
        setOutgoing(list);
      },
      (err) => {
        if (onErrorRef.current) onErrorRef.current(err);
      }
    );
  }, [uid, retryNonce]);

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
 * Full-screen iOS Messages + Glassmorphism + Nothing OS Conversation Screen:
 * - Zero waterfall: Deterministic convId is computed at 0ms; cached messages + header render in <100ms;
 *   Firestore message listener and permission check run in parallel.
 * - Floating glass header (56px pill): back button, avatar with frame, name + gold PRO pill + Student chip
 *   on one line, status line "Direct chat" with green dot below, more button on the right. No overflow at 360px.
 * - Sent bubbles solid red right-aligned, received bubbles glass left-aligned, radius 22 (6 on tail side),
 *   max width 78%, 15px/21px text, timestamps (11px) and delivered/read ticks under the last message of a group,
 *   dotted date separators ("TODAY" in Doto).
 * - Sticky glass pill composer above safe area following visualViewport: attach button, growing text field
 *   (max 5 lines), red circular send button that appears when there is text.
 * - Optimistic sending with clock -> delivered/read ticks -> red retry badge on failure.
 */
export const FullScreenConversationView: React.FC<FullScreenConversationViewProps> = ({
  partner,
  onBack,
  onPermissionChange,
  incomingRequests,
  respondingId,
  onRespondRequest,
}) => {
  const openPerfStartRef = useRef<number>(
    typeof performance !== 'undefined' ? performance.now() : Date.now()
  );
  const loggedCachedPaintRef = useRef(false);
  const loggedFreshSnapshotRef = useRef(false);

  const { user: authUser, profile: authProfile, isAdmin } = useAuth();
  const { profile: ownProfile } = useUserProfile();
  const { equipped: ownEquipped } = useWallet();
  const { markConversationNotificationsRead } = useUnreadMessagesState();

  const currentUid = authUser?.uid || null;

  // Deterministic conversationId computed at 0ms (never awaits network)
  const deterministicConvId = useMemo(() => {
    if (!currentUid || !partner.uid || partner.uid === currentUid) return null;
    return getConversationId(currentUid, partner.uid);
  }, [currentUid, partner.uid]);

  // Seed initial messages synchronously from memory/SWR cache or partner preview (< 10ms)
  const initialCachedMessages = useMemo<DirectMessage[]>(() => {
    if (!deterministicConvId) return [];
    const cached = getCachedConversationMessages(deterministicConvId);
    if (cached && cached.length > 0) return cached;
    if (partner.lastMessageText) {
      return [
        {
          id: `seed_${deterministicConvId}`,
          conversationId: deterministicConvId,
          senderId: partner.lastMessageSenderId || partner.uid,
          senderName: partner.displayName || 'Student',
          text: partner.lastMessageText,
          createdAt: partner.lastMessageAtMs || Date.now(),
          createdAtMs: partner.lastMessageAtMs || Date.now(),
          deliveryStatus: 'read',
        },
      ];
    }
    return [];
  }, [deterministicConvId, partner]);

  const [messages, setMessages] = useState<DirectMessage[]>(initialCachedMessages);
  const [optimisticMessages, setOptimisticMessages] = useState<DirectMessage[]>([]);
  const [hasFirstSnapshot, setHasFirstSnapshot] = useState<boolean>(
    initialCachedMessages.length > 0
  );
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);

  const [activePermission, setActivePermission] = useState<ChatPermissionState | null>(
    () => getCachedChatPermission(currentUid, partner.uid)
  );
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);

  const [requestNote, setRequestNote] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [keyboardOffsetBottom, setKeyboardOffsetBottom] = useState(0);

  const messagesAreaRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileAttachInputRef = useRef<HTMLInputElement | null>(null);

  // Log time to header + cached messages on first paint (< 100ms target)
  useEffect(() => {
    if (loggedCachedPaintRef.current) return;
    loggedCachedPaintRef.current = true;
    const elapsed = Math.round(
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
        openPerfStartRef.current
    );
    console.info(
      `[Boardly Chat Perf] Header + cached messages rendered in ${elapsed}ms (target < 100ms)`
    );
  }, []);

  // Hide the bottom nav while inside an active chat
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.setAttribute('data-chat-open', 'true');
    document.body.setAttribute('data-fullscreen-modal-open', 'true');
    window.dispatchEvent(new Event('boardly:modal-change'));
    return () => {
      document.body.removeAttribute('data-chat-open');
      document.body.removeAttribute('data-fullscreen-modal-open');
      window.dispatchEvent(new Event('boardly:modal-change'));
    };
  }, []);

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
    const role = isAdmin ? 'admin' : op?.role || 'student';
    return { displayName, avatar, frame, role, photoURL: null };
  }, [ownProfile, authProfile, ownEquipped, authUser, isAdmin]);

  // Enrich partner profile in background without blocking header or messages
  const partnerSeeds = useMemo<ChatUserSeed[]>(
    () => [
      {
        uid: partner.uid,
        displayName: partner.displayName,
        avatar: partner.equippedAvatar || partner.avatar,
        photoURL: partner.photoURL,
        frame: partner.equippedFrame || partner.frame,
        role: partner.role,
      },
    ],
    [partner]
  );
  const resolvedProfiles = useChatUserProfiles(partnerSeeds);
  const resolvedPartner = resolvedProfiles[partner.uid];

  const partnerName =
    resolvedPartner?.displayName || partner.displayName || 'Student';
  const partnerAvatar =
    resolvedPartner?.equippedAvatar ||
    partner.equippedAvatar ||
    partner.avatar ||
    'avatar-1';
  const partnerFrame =
    resolvedPartner?.frame || partner.equippedFrame || partner.frame || null;
  const partnerProBadge = resolvedPartner?.proBadge || partner.proBadge || null;
  const rawPartnerPlusBadge =
    (resolvedPartner as any)?.plusBadge !== undefined
      ? (resolvedPartner as any).plusBadge
      : (partner as any)?.plusBadge ?? null;
  const partnerPlusBadge: number | null =
    typeof rawPartnerPlusBadge === 'number' ? rawPartnerPlusBadge : null;
  const partnerIsPlus =
    partnerPlusBadge !== null ||
    String(partnerProBadge || '')
      .trim()
      .toLowerCase()
      .startsWith('plus') ||
    String((resolvedPartner as any)?.planTier || (partner as any)?.planTier || (partner as any)?.plan || '')
      .trim()
      .toLowerCase() === 'plus';

  const scrollToNewest = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      } else if (messagesAreaRef.current) {
        messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
      }
      setShowJumpToLatest(false);
    });
  }, []);

  // Follow mobile keyboard via visualViewport
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleViewportChange = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffsetBottom(offset);
    };
    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);
    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // 1. PARALLEL STREAM A: Start messages listener immediately using deterministicConvId (0ms waterfall!)
  useEffect(() => {
    if (!deterministicConvId) return;
    setMessagesError(null);

    const unsub = subscribeMessages(
      deterministicConvId,
      (liveMsgs) => {
        if (!loggedFreshSnapshotRef.current) {
          loggedFreshSnapshotRef.current = true;
          const elapsed = Math.round(
            (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
              openPerfStartRef.current
          );
          console.info(
            `[Boardly Chat Perf] Fresh Firestore messages snapshot in ${elapsed}ms (target < 500ms)`
          );
        }
        setHasFirstSnapshot(true);
        setMessagesError(null);
        setMessages(liveMsgs);
        // Remove any optimistic message whose text matches a newly arrived live message
        setOptimisticMessages((prev) =>
          prev.filter(
            (opt) =>
              opt.deliveryStatus === 'failed' ||
              !liveMsgs.some(
                (m) =>
                  m.senderId === opt.senderId &&
                  m.text === opt.text &&
                  Math.abs((m.createdAtMs || 0) - (opt.createdAtMs || 0)) < 15000
              )
          )
        );
      },
      (err) => {
        setHasFirstSnapshot(true);
        // If permission denied because conversation isn't created yet, don't show scary error
        const code = String(err?.code || '').toLowerCase();
        if (!code.includes('permission-denied')) {
          setMessagesError(
            formatFirestoreError(`conversations/${deterministicConvId}/messages`, err)
          );
        }
      }
    );

    return () => {
      unsub();
    };
  }, [deterministicConvId]);

  // 2. PARALLEL STREAM B: Check permission & ensure conversation doc in background
  useEffect(() => {
    if (!currentUid || !partner.uid || partner.uid === currentUid) return;
    let isMounted = true;

    checkChatPermission(currentUid, partner.uid)
      .then((perm) => {
        if (!isMounted) return;
        seedChatPermissionCache(currentUid, partner.uid, perm);
        setActivePermission(perm);

        if (perm.canChat && deterministicConvId) {
          // Ensure conversation doc exists in background without blocking UI
          void getOrCreateConversation(currentUid, partner.uid, {
            [currentUid]: mySenderProfile,
            [partner.uid]: {
              displayName: partnerName,
              avatar: partnerAvatar,
              frame: partnerFrame,
              role: resolvedPartner?.role || partner.role || 'student',
              photoURL: null,
            },
          }).catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [
    currentUid,
    partner.uid,
    deterministicConvId,
    mySenderProfile,
    partner.role,
    partnerAvatar,
    partnerFrame,
    partnerName,
    resolvedPartner?.role,
  ]);

  // 3. Fire-and-forget read receipts AFTER first paint (never awaited before showing messages)
  useEffect(() => {
    if (!currentUid || !partner.uid || !deterministicConvId) return;
    const rafId = requestAnimationFrame(() => {
      const timerId = window.setTimeout(() => {
        void markConversationNotificationsRead(partner.uid, deterministicConvId);
        void clearConversationUnreadCount(deterministicConvId, currentUid);
      }, 120);
      return () => clearTimeout(timerId);
    });
    return () => cancelAnimationFrame(rafId);
  }, [
    currentUid,
    partner.uid,
    deterministicConvId,
    messages.length,
    markConversationNotificationsRead,
  ]);

  // Auto-scroll on initial open
  useEffect(() => {
    if (messages.length > 0 && !showJumpToLatest) {
      scrollToNewest('auto');
    }
  }, [deterministicConvId, messages.length, scrollToNewest, showJumpToLatest]);

  // Handle scroll for "Jump to latest" button & scroll-up pagination for older messages
  const handleMessagesScroll = useCallback(async () => {
    const el = messagesAreaRef.current;
    if (!el || !deterministicConvId) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowJumpToLatest(distanceFromBottom > 220);

    // Load older 30 messages when scrolled near top
    if (
      el.scrollTop < 80 &&
      !loadingOlder &&
      hasMoreOlder &&
      messages.length >= CHAT_MESSAGES_PAGE_SIZE
    ) {
      const oldestMsg = messages[0];
      const oldestMs = oldestMsg?.createdAtMs || 0;
      if (!oldestMs) return;

      setLoadingOlder(true);
      const prevHeight = el.scrollHeight;
      try {
        const olderBatch = await loadOlderMessages(
          deterministicConvId,
          oldestMs,
          CHAT_MESSAGES_PAGE_SIZE
        );
        if (olderBatch.length < CHAT_MESSAGES_PAGE_SIZE) {
          setHasMoreOlder(false);
        }
        if (olderBatch.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const uniqueOlder = olderBatch.filter((m) => !existingIds.has(m.id));
            const merged = [...uniqueOlder, ...prev];
            seedConversationMessagesCache(deterministicConvId, merged);
            return merged;
          });
          requestAnimationFrame(() => {
            if (messagesAreaRef.current) {
              messagesAreaRef.current.scrollTop =
                messagesAreaRef.current.scrollHeight - prevHeight;
            }
          });
        }
      } finally {
        setLoadingOlder(false);
      }
    }
  }, [deterministicConvId, loadingOlder, hasMoreOlder, messages]);

  // Growing textarea (max 5 lines)
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 5 * 22; // 5 lines max
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [draft, adjustTextareaHeight]);

  // Optimistic message send (appears at 0ms with clock, then ticks, or red retry badge on failure)
  const executeSendMessage = async (textToSend: string, retryTempId?: string) => {
    if (!currentUid || !partner.uid || !deterministicConvId || !textToSend.trim())
      return;

    const cleanText = textToSend.trim();
    const nowMs = Date.now();
    const tempId = retryTempId || `opt_${nowMs}_${Math.random().toString(36).slice(2, 7)}`;

    const optimisticItem: DirectMessage = {
      id: tempId,
      conversationId: deterministicConvId,
      senderId: currentUid,
      recipientId: partner.uid,
      senderName: mySenderProfile.displayName,
      senderAvatar: mySenderProfile.avatar,
      senderFrame: mySenderProfile.frame,
      text: cleanText,
      createdAt: nowMs,
      createdAtMs: nowMs,
      deliveryStatus: 'sending',
    };

    setOptimisticMessages((prev) => {
      const withoutOld = prev.filter((m) => m.id !== tempId);
      return [...withoutOld, optimisticItem];
    });
    setSendError(null);
    scrollToNewest('smooth');

    try {
      await sendMessage(
        deterministicConvId,
        currentUid,
        partner.uid,
        cleanText,
        mySenderProfile
      );
      setOptimisticMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, deliveryStatus: 'delivered' } : m
        )
      );
    } catch (err: any) {
      setOptimisticMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, deliveryStatus: 'failed' } : m
        )
      );
      setSendError(err?.message || 'Message failed to send. Tap retry on the bubble.');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!draft.trim()) return;
    const textToSend = draft;
    setDraft('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await executeSendMessage(textToSend);
  };

  const handleAttachFileChoice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    setDraft((prev) =>
      prev ? `${prev} [Attachment: ${file.name} (${sizeKb} KB)]` : `📎 ${file.name} (${sizeKb} KB)`
    );
    e.target.value = '';
    textareaRef.current?.focus();
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
          avatar: partnerAvatar,
          frame: partnerFrame,
          photoURL: null,
        },
        requestNote
      );

      const updatedPerm = await checkChatPermission(currentUid, partner.uid);
      seedChatPermissionCache(currentUid, partner.uid, updatedPerm);
      setActivePermission(updatedPerm);

      if (result.status !== 'already_allowed' && result.status !== 'auto_accepted') {
        setRequestFeedback('Chat request sent! You can message once they accept.');
      }
      if (onPermissionChange) onPermissionChange();
    } catch (err: any) {
      setSendError(err?.message || 'Failed to send chat request.');
    } finally {
      setSendingRequest(false);
    }
  };

  // Combine live messages + pending/failed optimistic messages
  const combinedMessages = useMemo(() => {
    const realMessages = messages.filter((m) => !m.id.startsWith('seed_'));
    const baseList = realMessages.length > 0 ? realMessages : messages;
    if (optimisticMessages.length === 0) return baseList;
    return [...baseList, ...optimisticMessages];
  }, [messages, optimisticMessages]);

  // Group messages by date divider ("TODAY", "YESTERDAY", etc.)
  const groupedMessages = useMemo(() => {
    const groups: Array<{ dateLabel: string; items: DirectMessage[] }> = [];
    for (const msg of combinedMessages) {
      const label = formatDateDividerLabel(msg.createdAtMs, msg.createdAt);
      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.dateLabel !== label) {
        groups.push({ dateLabel: label, items: [msg] });
      } else {
        lastGroup.items.push(msg);
      }
    }
    return groups;
  }, [combinedMessages]);

  // Determine whether permission explicitly blocks chatting (only after permission check resolves false and no existing messages)
  const isExplicitlyBlockedByPermission =
    activePermission !== null &&
    !activePermission.canChat &&
    combinedMessages.length === 0;

  return (
    <div
      data-student-page="messages-chat"
      data-modal-layer="true"
      data-fullscreen-modal="true"
      role="dialog"
      aria-modal="true"
      aria-label={`Conversation with ${partnerName}`}
      className="fixed inset-0 z-[2000] bg-[var(--bg)] text-[var(--text)] flex flex-col overflow-hidden page-slide-right"
      style={{
        paddingBottom: keyboardOffsetBottom > 0 ? `${keyboardOffsetBottom}px` : undefined,
      }}
    >
      {/* Ambient blurred red (#D71921) and blue (#3a4cff) glows */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
        aria-hidden="true"
      >
        <div className="absolute -top-24 -left-24 w-[320px] h-[320px] rounded-full bg-[#D71921]/18 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-24 w-[300px] h-[300px] rounded-full bg-[#3a4cff]/15 blur-[130px]" />
      </div>

      {/* 1. FLOATING GLASS HEADER (56px pill): back button, avatar with frame, name + gold PRO pill + Student chip on one line, status line "Direct chat" with green dot below, more button on the right. No overflow at 360px. */}
      <div className="relative z-20 px-3 pt-[calc(10px+env(safe-area-inset-top,0px))] pb-2 shrink-0">
        <header className="boardly-glass-pill h-[56px] max-w-3xl mx-auto px-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to messages"
            className="press-scale w-11 h-11 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Lazy-loaded fixed-size 40px Avatar with Frame */}
          <div className="w-10 h-10 shrink-0 flex items-center justify-center">
            <BoardlyAvatar
              uid={partner.uid}
              equippedAvatar={partnerAvatar}
              equippedFrameId={partnerFrame}
              size={40}
              alt={partnerName}
            />
          </div>

          {/* Name + Gold PRO Pill + Student Chip on one line, Status line "Direct chat" with green dot below */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              <span className="text-[14px] sm:text-[15px] font-bold text-white truncate">
                {partnerName}
              </span>
              {partnerPlusBadge !== null ? (
                <PlusBadge id={partnerPlusBadge} size="sm" priority />
              ) : !partnerIsPlus && partnerProBadge ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 border bg-amber-500/25 text-amber-200 border-amber-400/60">
                  PRO
                </span>
              ) : null}
              <RoleBadge
                role={resolvedPartner?.role || partner.role}
                customRole={resolvedPartner?.customRole || partner.customRole}
                isSuperAdmin={resolvedPartner?.isSuperAdmin}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
                aria-hidden="true"
              />
              <span className="text-[11px] font-medium text-white/72 truncate">
                Direct chat
              </span>
            </div>
          </div>

          {/* More Button on the Right */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowMoreMenu((v) => !v)}
              aria-label="More chat options"
              className="press-scale w-11 h-11 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-44 boardly-glass-card rounded-2xl p-1.5 z-50 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    scrollToNewest('smooth');
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-white/90 hover:bg-white/10 cursor-pointer"
                >
                  Jump to latest
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onBack();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-white/90 hover:bg-white/10 cursor-pointer"
                >
                  Close conversation
                </button>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* 2. CONVERSATION BODY */}
      {isExplicitlyBlockedByPermission ? (
        <div className="relative z-10 flex-1 flex items-center justify-center p-5 overflow-y-auto">
          <div className="boardly-glass-card rounded-[32px] p-6 max-w-sm w-full text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/18 flex items-center justify-center mx-auto text-white/80">
              {activePermission?.outgoingRequest?.status === 'pending' ? (
                <Clock className="w-5 h-5 text-amber-300" />
              ) : (
                <Lock className="w-5 h-5 text-[#D71921]" />
              )}
            </div>

            {activePermission?.incomingRequest?.status === 'pending' ? (
              <>
                <h4 className="text-base font-bold text-white">
                  {partnerName} wants to chat with you
                </h4>
                {activePermission.incomingRequest.message && (
                  <p className="text-xs italic px-3.5 py-2.5 rounded-2xl bg-white/[0.05] border border-white/12 text-white/80">
                    &ldquo;{activePermission.incomingRequest.message}&rdquo;
                  </p>
                )}
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
                          seedChatPermissionCache(currentUid, partner.uid, perm);
                          setActivePermission(perm);
                        }
                      });
                    }}
                    className="boardly-red-pill press-scale min-h-[44px] px-5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
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
                    className="boardly-glass-pill press-scale w-11 h-11 rounded-full inline-flex items-center justify-center text-white/75 hover:text-white cursor-pointer"
                    aria-label="Decline request"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : activePermission?.outgoingRequest?.status === 'pending' ? (
              <>
                <h4 className="text-base font-bold text-white">Chat Request Pending</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  You&apos;ve sent a chat request to <strong>{partnerName}</strong>.
                  You&apos;ll be notified as soon as they accept.
                </p>
              </>
            ) : (
              <>
                <h4 className="text-base font-bold text-white">Send a Chat Request</h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  Direct messaging is open between mutual followers. Send a quick request
                  to start chatting with <strong>{partnerName}</strong>.
                </p>
                <div className="space-y-2.5 pt-2">
                  <div className="search-pill-wrapper boardly-glass-pill px-3.5 min-h-[44px] flex items-center">
                    <input
                      type="text"
                      value={requestNote}
                      onChange={(e) => setRequestNote(e.target.value)}
                      placeholder="Optional note (e.g., Let's study together!)"
                      maxLength={160}
                      className="w-full text-xs text-white placeholder:text-white/45"
                    />
                  </div>
                  {sendError && <p className="text-xs text-[#ff6b72]">{sendError}</p>}
                  {requestFeedback && (
                    <p className="text-xs text-emerald-400">{requestFeedback}</p>
                  )}
                  <button
                    type="button"
                    disabled={sendingRequest}
                    onClick={() => void handleSendChatRequest()}
                    className="boardly-red-pill press-scale w-full min-h-[48px] rounded-full text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {sendingRequest ? 'Sending Request...' : 'Request to Chat'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div
            ref={messagesAreaRef}
            onScroll={() => void handleMessagesScroll()}
            className="relative z-10 flex-1 overflow-y-auto px-3.5 sm:px-5 py-3 overscroll-contain"
          >
            <div className="max-w-3xl mx-auto flex flex-col gap-1.5">
              {loadingOlder && (
                <div className="py-2 flex items-center justify-center gap-2 text-xs text-white/60">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading older messages...</span>
                </div>
              )}

              {messagesError ? (
                <div className="boardly-glass-card rounded-[28px] p-6 my-8 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-[#D71921] mx-auto" />
                  <p className="text-sm font-bold text-white">Unable to load messages</p>
                  <p className="text-xs text-white/65 break-all">{messagesError}</p>
                </div>
              ) : !hasFirstSnapshot && combinedMessages.length === 0 ? (
                /* Skeleton bubbles ONLY on first fetch when nothing is cached */
                <div className="space-y-3 py-4 animate-pulse">
                  <div className="w-48 h-11 rounded-[22px] rounded-bl-[6px] bg-white/10 self-start" />
                  <div className="w-56 h-12 rounded-[22px] rounded-br-[6px] bg-[#D71921]/30 self-end ml-auto" />
                  <div className="w-40 h-10 rounded-[22px] rounded-bl-[6px] bg-white/10 self-start" />
                </div>
              ) : combinedMessages.length === 0 ? (
                /* Instant "Say hi to <name>" empty state */
                <div className="boardly-glass-card rounded-[28px] p-8 my-10 text-center max-w-sm mx-auto space-y-2.5">
                  <div className="w-12 h-12 rounded-full bg-[#D71921]/18 border border-[#D71921]/40 flex items-center justify-center mx-auto text-[#ff6b72]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-[16px] font-bold text-white">
                    Say hi to {partnerName}
                  </p>
                  <p className="text-[13px] text-white/70 leading-relaxed">
                    Send a message below to start your study conversation.
                  </p>
                </div>
              ) : (
                groupedMessages.map((group) => (
                  <React.Fragment key={group.dateLabel}>
                    {/* Dotted Date Separator ("TODAY" in Doto) */}
                    <div className="my-3 flex items-center gap-3">
                      <div className="flex-1 nothing-dotted-divider" />
                      <span className="font-doto-title text-[10px] tracking-[0.18em] text-white/65 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/12">
                        {group.dateLabel}
                      </span>
                      <div className="flex-1 nothing-dotted-divider" />
                    </div>

                    {group.items.map((msg, idx) => {
                      const isMe = msg.senderId === currentUid;
                      const nextMsg = group.items[idx + 1];
                      const isLastInSenderGroup =
                        !nextMsg || nextMsg.senderId !== msg.senderId;
                      const status = msg.deliveryStatus || 'read';

                      return (
                        <div
                          key={msg.id}
                          className={`msg-bubble-pop flex flex-col ${
                            isMe ? 'items-end' : 'items-start'
                          } ${isLastInSenderGroup ? 'mb-2' : 'mb-0.5'}`}
                        >
                          {/* Bubble: Sent solid red right-aligned, Received glass left-aligned, radius 22 (6 on tail side), max width 78%, 15px/21px text */}
                          <div
                            className={`max-w-[78%] px-4 py-2.5 text-[15px] leading-[21px] break-words whitespace-pre-wrap font-sans ${
                              isMe
                                ? 'bg-[#D71921] text-white rounded-[22px] rounded-br-[6px] shadow-[0_6px_20px_rgba(215,25,33,0.32)]'
                                : 'boardly-glass-card text-white rounded-[22px] rounded-bl-[6px]'
                            }`}
                          >
                            {msg.text}
                          </div>

                          {/* Timestamp (11px) and Delivered/Read Ticks under the last message of a group (or failed retry badge) */}
                          {(isLastInSenderGroup || status === 'failed') && (
                            <div className="mt-1 px-1 flex items-center gap-1.5 text-[11px] text-white/60 font-inter-num">
                              <span>
                                {formatBubbleTime(msg.createdAtMs, msg.createdAt)}
                              </span>
                              {isMe && (
                                <>
                                  {status === 'sending' && (
                                    <Clock
                                      className="w-3 h-3 text-white/60"
                                      aria-label="Sending"
                                    />
                                  )}
                                  {(status === 'sent' || status === 'delivered') && (
                                    <Check
                                      className="w-3.5 h-3.5 text-white/75"
                                      aria-label="Delivered"
                                    />
                                  )}
                                  {status === 'read' && (
                                    <CheckCheck
                                      className="w-3.5 h-3.5 text-[#ff6b72]"
                                      aria-label="Read"
                                    />
                                  )}
                                  {status === 'failed' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void executeSendMessage(msg.text, msg.id)
                                      }
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D71921] text-white text-[10px] font-bold cursor-pointer"
                                    >
                                      <RefreshCw className="w-2.5 h-2.5" />
                                      Retry
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Floating "Jump to latest" Glass Button when scrolled up */}
          {showJumpToLatest && (
            <div className="relative z-20 flex justify-center -mt-12 mb-2 pointer-events-none">
              <button
                type="button"
                onClick={() => scrollToNewest('smooth')}
                className="pointer-events-auto boardly-glass-pill press-scale min-h-[38px] px-4 rounded-full text-xs font-bold text-white inline-flex items-center gap-1.5 shadow-2xl cursor-pointer"
              >
                <ChevronDown className="w-4 h-4 text-[#D71921]" />
                <span>Jump to latest</span>
              </button>
            </div>
          )}

          {/* 3. STICKY GLASS PILL COMPOSER ABOVE SAFE AREA: attach button, growing text field (max 5 lines), red circular send button that appears when there is text */}
          <form
            onSubmit={handleSendMessage}
            className="relative z-20 px-3 pt-2 pb-[calc(12px+env(safe-area-inset-bottom,0px))] shrink-0"
          >
            <div className="search-pill-wrapper boardly-glass-pill max-w-3xl mx-auto min-h-[52px] px-2.5 py-1.5 flex items-end gap-2 transition-all">
              <input
                ref={fileAttachInputRef}
                type="file"
                onChange={handleAttachFileChoice}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileAttachInputRef.current?.click()}
                aria-label="Attach file"
                className="press-scale w-10 h-10 rounded-full flex items-center justify-center text-white/75 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
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
                className="flex-1 bg-transparent border-0 outline-none resize-none py-2 text-[15px] leading-[21px] text-white placeholder:text-white/50 max-h-[110px] font-sans"
              />

              {draft.trim().length > 0 && (
                <button
                  type="submit"
                  aria-label="Send message"
                  className="boardly-red-pill press-scale w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export interface MessagesDashboardContentProps {
  initialTab?: 'chat' | 'requests';
  initialPartner?: TargetChatUser | null;
  initialConversationId?: string | null;
  initialRequestId?: string | null;
  onCloseModal?: () => void;
  onPermissionChange?: () => void;
  isModalWrapper?: boolean;
}

export const MessagesDashboardContent: React.FC<MessagesDashboardContentProps> = ({
  initialTab = 'chat',
  initialPartner = null,
  initialConversationId = null,
  initialRequestId = null,
  onCloseModal,
  onPermissionChange,
  isModalWrapper = false,
}) => {
  const { user: authUser, profile: authProfile, isAdmin, isGuest } = useAuth();
  const { profile: ownProfile } = useUserProfile();
  const { equipped: ownEquipped } = useWallet();
  const {
    unreadChatNotificationsCount,
    unreadBySenderUid,
    unreadByConversationId,
    markConversationNotificationsRead,
  } = useUnreadMessagesState();

  const currentUid = authUser?.uid || null;

  const [activeTab, setActiveTab] = useState<'chat' | 'requests'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>(
    () => getCachedUserConversations(currentUid) || []
  );
  const [incomingRequests, setIncomingRequests] = useState<ChatRequest[]>(
    () => getCachedIncomingChatRequests(currentUid) || []
  );
  const [loadingConversations, setLoadingConversations] = useState<boolean>(() => {
    if (!currentUid || isGuest || currentUid.startsWith('guest_')) return false;
    return getCachedUserConversations(currentUid) === null;
  });
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState<number>(0);

  const outgoingRequests = useOutgoingChatRequests(currentUid, retryNonce, (err) => {
    const formatted = formatFirestoreError('chatRequests (outgoing)', err);
    setRequestsError(formatted);
    showApiToast(formatted, 'error');
  });

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

  // Resolve deep-linked ?conversationId=conv_... from loaded conversations
  useEffect(() => {
    if (selectedPartner || !initialConversationId || !currentUid) return;
    const match = conversations.find((c) => c.id === initialConversationId);
    if (match) {
      const otherUid = match.participants.find((p) => p !== currentUid) || '';
      if (otherUid) {
        const details = match.participantDetails?.[otherUid];
        setSelectedPartner({
          uid: otherUid,
          displayName: details?.displayName || 'Student',
          avatar: details?.avatar || null,
          frame: details?.frame || null,
          role: details?.role || 'student',
          photoURL: null,
          lastMessageText: match.lastMessageText,
          lastMessageSenderId: match.lastMessageSenderId,
          lastMessageAtMs: match.lastMessageAtMs,
        });
      }
    }
  }, [conversations, initialConversationId, selectedPartner, currentUid]);

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
    const role = isAdmin ? 'admin' : op?.role || 'student';
    return { displayName, avatar, frame, role, photoURL: null };
  }, [ownProfile, authProfile, ownEquipped, authUser, isAdmin]);

  // Subscribe to conversations & incoming requests
  useEffect(() => {
    if (!currentUid || isGuest || currentUid.startsWith('guest_')) {
      setLoadingConversations(false);
      setConversationsError(null);
      setRequestsError(null);
      return;
    }

    setConversationsError(null);
    setRequestsError(null);

    const cachedConvs = getCachedUserConversations(currentUid);
    if (cachedConvs) {
      setConversations(cachedConvs);
      setLoadingConversations(false);
    } else {
      setLoadingConversations(true);
    }

    const cachedReqs = getCachedIncomingChatRequests(currentUid);
    if (cachedReqs) {
      setIncomingRequests(cachedReqs);
    }

    const unsubConvs = subscribeUserConversations(
      currentUid,
      (convs) => {
        setConversationsError(null);
        setConversations(convs);
        setLoadingConversations(false);
      },
      (err) => {
        const formatted = formatFirestoreError('conversations', err);
        setConversationsError(formatted);
        setLoadingConversations(false);
        showApiToast(formatted, 'error');
      }
    );
    const unsubReqs = subscribeIncomingChatRequests(
      currentUid,
      (reqs) => {
        setRequestsError(null);
        setIncomingRequests(reqs);
      },
      (err) => {
        const formatted = formatFirestoreError('chatRequests (incoming)', err);
        setRequestsError(formatted);
        showApiToast(formatted, 'error');
      }
    );

    return () => {
      unsubConvs();
      unsubReqs();
    };
  }, [currentUid, isGuest, retryNonce]);

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
    return seeds;
  }, [conversations, incomingRequests, outgoingRequests, currentUid]);

  const resolvedUsers = useChatUserProfiles(allUserSeeds);

  // Preload chat messages in background on row hover / touchstart for <100ms instant open
  const handlePrefetchRow = useCallback(
    (conv: Conversation, otherUid: string, displayName: string) => {
      if (!currentUid || !otherUid) return;
      seedChatPermissionCache(currentUid, otherUid, {
        canChat: true,
        reason: 'request_accepted',
        isMutualFollow: false,
        hasAcceptedRequest: true,
        outgoingRequest: null,
        incomingRequest: null,
        cooldownEndsAtMs: null,
        isCooldownActive: false,
      });
      if (!getCachedConversationMessages(conv.id) && conv.lastMessageText) {
        seedConversationMessagesCache(conv.id, [
          {
            id: `seed_${conv.id}`,
            conversationId: conv.id,
            senderId: conv.lastMessageSenderId || otherUid,
            senderName: displayName,
            text: conv.lastMessageText,
            createdAt: conv.lastMessageAtMs || Date.now(),
            createdAtMs: conv.lastMessageAtMs || Date.now(),
            deliveryStatus: 'read',
          },
        ]);
      }
    },
    [currentUid]
  );

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
            avatar:
              senderResolved?.equippedAvatar ||
              senderResolved?.avatar ||
              req.fromAvatar ||
              null,
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

  const totalRequestsCount = incomingRequests.length + outgoingRequests.length;

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) => {
      const otherUid = conv.participants.find((p) => p !== currentUid) || '';
      const resolved = resolvedUsers[otherUid];
      const fallbackName =
        conv.participantDetails?.[otherUid]?.displayName || 'Student';
      const name = (resolved?.displayName || fallbackName).toLowerCase();
      const preview = (conv.lastMessageText || '').toLowerCase();
      return name.includes(q) || preview.includes(q);
    });
  }, [conversations, searchQuery, currentUid, resolvedUsers]);

  // If a conversation is selected, render FullScreenConversationView immediately
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
    <div data-student-page="messages" className="relative min-h-screen bg-[var(--bg)] text-[var(--text)] boardly-page-safe-bottom px-3.5 sm:px-5 pt-4 space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-doto-title text-[24px] sm:text-[26px] tracking-[0.08em] text-[var(--text)]">
            MESSAGES
          </h1>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            Direct conversations and chat requests with fellow students.
          </p>
        </div>
        {isModalWrapper && onCloseModal && (
          <button
            type="button"
            onClick={onCloseModal}
            aria-label="Close messages"
            className="press-scale w-11 h-11 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-white/85 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Segmented Control: Chats / Requests with Shared Sliding Red Pill */}
      <div
        role="tablist"
        aria-label="Messages sections"
        className="boardly-glass-pill relative p-1.5 grid grid-cols-2 items-center h-[50px]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1.5 bottom-1.5 rounded-full bg-[#D71921] shadow-[0_4px_16px_rgba(215,25,33,0.45)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            width: 'calc((100% - 12px) / 2)',
            left: '6px',
            transform: `translateX(${activeTab === 'chat' ? 0 : 100}%)`,
          }}
        />
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
          className="relative z-10 h-full rounded-full text-xs font-bold tracking-wide inline-flex items-center justify-center gap-2 text-white cursor-pointer"
        >
          <span>Chats</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-black/30 font-inter-num">
            {Math.max(conversations.length, unreadChatNotificationsCount)}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'requests'}
          onClick={() => setActiveTab('requests')}
          className="relative z-10 h-full rounded-full text-xs font-bold tracking-wide inline-flex items-center justify-center gap-2 text-white cursor-pointer"
        >
          <span>Requests</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-black/30 font-inter-num">
            {totalRequestsCount}
          </span>
        </button>
      </div>

      {activeTab === 'chat' ? (
        <div className="space-y-3">
          {/* Single-Ring Glass Search Pill (S1) */}
          <div className="search-pill-wrapper boardly-glass-pill min-h-[48px] px-4 flex items-center gap-2.5 transition-all">
            <Search className="w-4 h-4 text-white/60 shrink-0 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              aria-label="Search chats"
              className="flex-1 text-sm text-white placeholder:text-white/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/75 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Messages List Rows: Glass rows with avatar, name, one-line preview, time, and red unread count dot */}
          {conversationsError ? (
            <div className="boardly-glass-card rounded-[28px] p-8 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-[#D71921] mx-auto" />
              <p className="text-sm font-bold text-white">Failed to load conversations</p>
              <p className="text-xs text-white/65 break-all">{conversationsError}</p>
              <button
                type="button"
                onClick={() => setRetryNonce((n) => n + 1)}
                className="boardly-red-pill press-scale min-h-[44px] px-5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : loadingConversations && conversations.length === 0 ? (
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="boardly-glass-card rounded-[24px] p-3.5 flex items-center gap-3.5 animate-pulse"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-28 rounded bg-white/10" />
                    <div className="h-3 w-44 rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="boardly-glass-card rounded-[28px] p-10 text-center space-y-2">
              <MessageCircle className="w-8 h-8 text-white/45 mx-auto" />
              <p className="text-sm font-bold text-white">
                {searchQuery.trim()
                  ? 'No matching conversations'
                  : 'No active conversations yet'}
              </p>
              <p className="text-xs text-white/65 max-w-xs mx-auto">
                {searchQuery.trim()
                  ? 'Try searching for another student name.'
                  : 'Follow students back or accept a chat request to start messaging.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredConversations.map((conv, idx) => {
                const otherUid =
                  conv.participants.find((p) => p !== currentUid) || '';
                const otherDetails = conv.participantDetails?.[otherUid] || {
                  displayName: 'Student',
                };
                const resolved = resolvedUsers[otherUid];
                const displayName =
                  resolved?.displayName || otherDetails.displayName || 'Student';
                const avatarId =
                  resolved?.equippedAvatar ||
                  resolved?.avatar ||
                  otherDetails.avatar ||
                  'avatar-1';
                const frameId = resolved?.frame || otherDetails.frame || null;

                const unreadCountForRow =
                  (conv.unreadCounts && currentUid
                    ? Number(conv.unreadCounts[currentUid] || 0)
                    : 0) ||
                  (unreadByConversationId[conv.id] || 0) ||
                  (otherUid ? unreadBySenderUid[otherUid] || 0 : 0);
                const isUnread = unreadCountForRow > 0;

                const previewText = conv.lastMessageText
                  ? conv.lastMessageSenderId === currentUid
                    ? `You: ${conv.lastMessageText}`
                    : conv.lastMessageText
                  : `Say hi to ${displayName}`;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    style={{ animationDelay: `${Math.min(idx * 40, 240)}ms` }}
                    onMouseEnter={() =>
                      handlePrefetchRow(conv, otherUid, displayName)
                    }
                    onTouchStart={() =>
                      handlePrefetchRow(conv, otherUid, displayName)
                    }
                    onClick={() => {
                      handlePrefetchRow(conv, otherUid, displayName);
                      setSelectedPartner({
                        uid: otherUid,
                        displayName,
                        avatar: avatarId,
                        equippedAvatar: avatarId,
                        frame: frameId,
                        equippedFrame: frameId,
                        role: resolved?.role || otherDetails.role || 'student',
                        proBadge: resolved?.proBadge || null,
                        photoURL: null,
                        lastMessageText: conv.lastMessageText,
                        lastMessageSenderId: conv.lastMessageSenderId,
                        lastMessageAtMs: conv.lastMessageAtMs,
                      });
                    }}
                    className={`press-scale w-full text-left boardly-glass-card rounded-[24px] p-3.5 flex items-center gap-3.5 transition-all cursor-pointer ${
                      isUnread
                        ? 'border-[#D71921]/60 shadow-[0_0_20px_rgba(215,25,33,0.2)]'
                        : 'hover:border-white/30'
                    }`}
                  >
                    <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                      <BoardlyAvatar
                        uid={otherUid}
                        equippedAvatar={avatarId}
                        equippedFrameId={frameId}
                        size={48}
                        alt={displayName}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[15px] font-bold text-white truncate">
                            {displayName}
                          </span>
                          {typeof resolved?.plusBadge === 'number' ? (
                            <PlusBadge id={resolved.plusBadge} size="sm" listMode />
                          ) : resolved?.proBadge ? (
                            <ProBadge design={resolved.proBadge} size="sm" listMode />
                          ) : null}
                        </div>
                        <span className="text-[11px] font-medium text-white/60 font-inter-num shrink-0">
                          {formatRelativeTime(conv.lastMessageAtMs, conv.updatedAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span
                          className={`text-[13px] truncate ${
                            isUnread ? 'font-bold text-white' : 'text-white/70'
                          }`}
                        >
                          {previewText}
                        </span>
                        {isUnread && (
                          <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#D71921] text-white text-[11px] font-bold font-inter-num inline-flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(215,25,33,0.6)]">
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
        /* Requests Tab */
        <div className="space-y-5">
          <section className="space-y-2.5">
            <h2 className="font-doto-title text-xs tracking-[0.16em] text-white/75 uppercase px-1">
              RECEIVED REQUESTS
            </h2>
            {requestsError ? (
              <div className="boardly-glass-card rounded-[24px] p-6 text-center space-y-2">
                <p className="text-xs text-[#ff6b72]">{requestsError}</p>
              </div>
            ) : incomingRequests.length === 0 ? (
              <div className="boardly-glass-card rounded-[24px] p-8 text-center space-y-1.5">
                <Inbox className="w-7 h-7 text-white/45 mx-auto" />
                <p className="text-sm font-bold text-white">No received requests</p>
                <p className="text-xs text-white/65">
                  When a student sends you a chat request, it will appear here.
                </p>
              </div>
            ) : (
              incomingRequests.map((req) => {
                const resolved = resolvedUsers[req.fromUid];
                const senderName = resolved?.displayName || req.fromName || 'Student';
                const isHighlighted = Boolean(
                  initialRequestId && req.id === initialRequestId
                );

                return (
                  <div
                    key={req.id}
                    className={`boardly-glass-card rounded-[24px] p-4 flex items-center justify-between gap-3 ${
                      isHighlighted ? 'border-[#D71921]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <BoardlyAvatar
                        uid={req.fromUid}
                        equippedAvatar={resolved?.equippedAvatar || req.fromAvatar}
                        equippedFrameId={resolved?.frame || req.fromFrame}
                        size={46}
                        alt={senderName}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white truncate">
                          {senderName}
                        </div>
                        <div className="text-xs text-white/65 truncate">
                          {req.message || 'Wants to chat with you'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={respondingId === req.id}
                        onClick={() => void handleRespondRequest(req, 'accepted')}
                        className="boardly-red-pill press-scale min-h-[40px] px-4 rounded-full text-xs font-bold cursor-pointer"
                      >
                        {respondingId === req.id ? '...' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        disabled={respondingId === req.id}
                        onClick={() => void handleRespondRequest(req, 'declined')}
                        aria-label="Decline request"
                        className="boardly-glass-pill press-scale w-10 h-10 rounded-full flex items-center justify-center text-white/75 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          <section className="space-y-2.5">
            <h2 className="font-doto-title text-xs tracking-[0.16em] text-white/75 uppercase px-1">
              SENT REQUESTS
            </h2>
            {outgoingRequests.length === 0 ? (
              <div className="boardly-glass-card rounded-[24px] p-6 text-center text-xs text-white/60">
                No pending sent requests.
              </div>
            ) : (
              outgoingRequests.map((req) => {
                const resolved = resolvedUsers[req.toUid];
                const recipientName = resolved?.displayName || req.toName || 'Student';
                return (
                  <div
                    key={req.id}
                    className="boardly-glass-card rounded-[24px] p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <BoardlyAvatar
                        uid={req.toUid}
                        equippedAvatar={resolved?.equippedAvatar || req.toAvatar}
                        equippedFrameId={resolved?.frame || req.toFrame}
                        size={44}
                        alt={recipientName}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {recipientName}
                        </div>
                        <div className="text-xs text-white/60">Pending acceptance</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 border border-white/15 text-white/80">
                      Pending
                    </span>
                  </div>
                );
              })
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
  partner,
  initialTab = 'chat',
  onPermissionChange,
}) => {
  const resolvedTarget = targetUser || partner || null;
  const { user: authUser, isGuest } = useAuth();
  const currentUid = authUser?.uid || null;
  const incomingRequests = useIncomingRequestsSnapshot(currentUid, isOpen && !isGuest);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const { profile: ownProfile } = useUserProfile();
  const { equipped: ownEquipped } = useWallet();

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    document.body.setAttribute('data-chat-open', 'true');
    document.body.setAttribute('data-fullscreen-modal-open', 'true');
    window.dispatchEvent(new Event('boardly:modal-change'));
    return () => {
      document.body.removeAttribute('data-chat-open');
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

  if (resolvedTarget && initialTab === 'chat') {
    return (
      <FullScreenConversationView
        partner={resolvedTarget}
        onBack={onClose}
        onPermissionChange={onPermissionChange}
        incomingRequests={incomingRequests}
        respondingId={respondingId}
        onRespondRequest={handleRespondFromGate}
      />
    );
  }

  return (
    <div
      data-modal-layer="true"
      data-fullscreen-modal="true"
      role="dialog"
      aria-modal="true"
      aria-label="Messages"
      className="fixed inset-0 z-[2000] bg-[var(--bg)] text-[var(--text)] overflow-y-auto"
    >
      <MessagesDashboardContent
        initialTab={initialTab}
        initialPartner={resolvedTarget}
        onCloseModal={onClose}
        onPermissionChange={onPermissionChange}
        isModalWrapper={true}
      />
    </div>
  );
};

function useIncomingRequestsSnapshot(
  uid: string | null,
  enabled: boolean
): ChatRequest[] {
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
