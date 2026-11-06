import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, MessageSquare, Check, XCircle, Inbox, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { RoleBadge } from '@/components/ui/RoleBadge';
import {
  getOrCreateConversation,
  sendMessage,
  subscribeMessages,
  checkChatPermission,
  sendChatRequest,
  respondToChatRequest,
  subscribeIncomingChatRequests,
  subscribeUserConversations,
  type ChatMessage,
  type ChatRequest,
  type Conversation,
  type ChatPermissionState,
} from '@/services/chatService';

export interface TargetUser {
  uid: string;
  displayName: string;
  avatar?: string | null;
  frame?: string | null;
  role?: string;
  photoURL?: string | null;
}

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: TargetUser | null;
  initialTab?: 'chat' | 'requests';
  onPermissionChange?: () => void;
}

export const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  initialTab = 'chat',
  onPermissionChange,
}) => {
  const { user: authUser } = useAuth();
  const { profile: ownProfile } = useUserProfile();

  const [activeTab, setActiveTab] = useState<'chat' | 'requests'>(initialTab);
  const [activeTarget, setActiveTarget] = useState<TargetUser | null>(targetUser);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ChatRequest[]>([]);
  const [permission, setPermission] = useState<ChatPermissionState | null>(null);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [requestWorking, setRequestWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentUid = authUser?.uid || null;
  const targetUid = activeTarget?.uid || null;

  useEffect(() => {
    if (isOpen) {
      setActiveTarget(targetUser);
      setActiveTab(initialTab);
      setError(null);
    }
  }, [isOpen, targetUser, initialTab]);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // Subscribe to incoming chat requests & existing conversations while modal is open
  useEffect(() => {
    if (!isOpen || !currentUid) {
      setIncomingRequests([]);
      setConversations([]);
      return;
    }

    const unsubReqs = subscribeIncomingChatRequests(currentUid, (reqs) => {
      setIncomingRequests(reqs);
    });

    const unsubConvs = subscribeUserConversations(currentUid, (convs) => {
      setConversations(convs);
    });

    return () => {
      unsubReqs();
      unsubConvs();
    };
  }, [isOpen, currentUid]);

  // Initialize conversation and subscribe to real-time messages when in chat tab with a target user
  useEffect(() => {
    if (!isOpen || !currentUid || !targetUid || currentUid === targetUid) {
      setMessages([]);
      setConversationId(null);
      setPermission(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    let unsub: (() => void) | null = null;

    async function initChat() {
      try {
        const perm = await checkChatPermission(currentUid!, targetUid!);
        if (!isMounted) return;
        setPermission(perm);

        if (!perm.canChat) {
          setConversationId(null);
          setMessages([]);
          setLoading(false);
          return;
        }

        const convId = await getOrCreateConversation(
          currentUid!,
          targetUid!,
          {
            displayName: ownProfile?.displayName || authUser?.displayName || 'Student',
            avatar: ownProfile?.equipped?.avatar || ownProfile?.avatar || null,
            frame: ownProfile?.equipped?.frame || ownProfile?.frame || null,
            photoURL: authUser?.photoURL || null,
          },
          {
            displayName: activeTarget?.displayName || 'Student',
            avatar: activeTarget?.avatar || null,
            frame: activeTarget?.frame || null,
            photoURL: activeTarget?.photoURL || null,
          }
        );

        if (!isMounted) return;
        setConversationId(convId);

        unsub = subscribeMessages(
          convId,
          (newMsgs) => {
            if (!isMounted) return;
            setMessages(newMsgs);
            setLoading(false);
            setTimeout(() => scrollToBottom(false), 50);
          },
          (err) => {
            if (!isMounted) return;
            setError(err?.message || 'Failed to load conversation.');
            setLoading(false);
          }
        );
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || 'Could not start conversation.');
        setLoading(false);
      }
    }

    void initChat();

    return () => {
      isMounted = false;
      if (unsub) unsub();
    };
  }, [isOpen, currentUid, targetUid, ownProfile, authUser, activeTarget, scrollToBottom]);

  // Focus input when opened and permitted to chat
  useEffect(() => {
    if (isOpen && !loading && activeTab === 'chat' && permission?.canChat) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, loading, activeTab, permission?.canChat]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !conversationId || !currentUid || !targetUid || sending || !permission?.canChat) return;

    setSending(true);
    setError(null);
    setInputText('');

    try {
      await sendMessage(
        conversationId,
        currentUid,
        text,
        {
          displayName: ownProfile?.displayName || authUser?.displayName || 'Student',
          avatar: ownProfile?.equipped?.avatar || ownProfile?.avatar || null,
          frame: ownProfile?.equipped?.frame || ownProfile?.frame || null,
          photoURL: authUser?.photoURL || null,
        },
        targetUid
      );
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err: any) {
      setError(err?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleSendRequestFromModal = async () => {
    if (!currentUid || !activeTarget || requestWorking) return;
    setRequestWorking(true);
    setError(null);
    try {
      await sendChatRequest(
        currentUid,
        activeTarget.uid,
        {
          displayName: ownProfile?.displayName || authUser?.displayName || 'Student',
          avatar: ownProfile?.equipped?.avatar || ownProfile?.avatar || null,
          frame: ownProfile?.equipped?.frame || ownProfile?.frame || null,
          photoURL: authUser?.photoURL || null,
          role: ownProfile?.role || 'student',
        },
        {
          displayName: activeTarget.displayName,
          avatar: activeTarget.avatar || null,
          frame: activeTarget.frame || null,
          photoURL: activeTarget.photoURL || null,
        }
      );
      const updatedPerm = await checkChatPermission(currentUid, activeTarget.uid);
      setPermission(updatedPerm);
      onPermissionChange?.();
    } catch (err: any) {
      setError(err?.message || 'Could not send chat request.');
    } finally {
      setRequestWorking(false);
    }
  };

  const handleRespondToRequest = async (req: ChatRequest, decision: 'accepted' | 'declined') => {
    if (!currentUid || respondingId) return;
    setRespondingId(req.id);
    setError(null);
    try {
      await respondToChatRequest(req.id, currentUid, decision, {
        displayName: ownProfile?.displayName || authUser?.displayName || 'Student',
        avatar: ownProfile?.equipped?.avatar || ownProfile?.avatar || null,
        frame: ownProfile?.equipped?.frame || ownProfile?.frame || null,
        photoURL: authUser?.photoURL || null,
      });

      onPermissionChange?.();

      if (decision === 'accepted') {
        const senderTarget: TargetUser = {
          uid: req.fromUid,
          displayName: req.fromName || 'Student',
          avatar: req.fromAvatar || null,
          frame: req.fromFrame || null,
          role: req.fromRole || 'student',
          photoURL: req.fromPhotoURL || null,
        };
        setActiveTarget(senderTarget);
        setActiveTab('chat');
        const updatedPerm = await checkChatPermission(currentUid, req.fromUid);
        setPermission(updatedPerm);
      } else {
        setIncomingRequests((prev) => prev.filter((item) => item.id !== req.id));
        if (activeTarget?.uid === req.fromUid) {
          const updatedPerm = await checkChatPermission(currentUid, req.fromUid);
          setPermission(updatedPerm);
        }
      }
    } catch (err: any) {
      setError(err?.message || `Failed to ${decision === 'accepted' ? 'accept' : 'decline'} request.`);
    } finally {
      setRespondingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[150] flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0" />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full h-full sm:h-[600px] sm:max-h-[85vh] sm:max-w-lg bg-[var(--surface)] border border-[var(--border)] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[var(--text)]"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Top Header */}
        <div className="flex flex-col border-b border-[var(--border)] bg-[var(--surface-raised)] shrink-0">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              {activeTab === 'chat' && activeTarget && !targetUser && (
                <button
                  type="button"
                  onClick={() => setActiveTarget(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer shrink-0"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={16} />
                </button>
              )}

              {activeTab === 'chat' && activeTarget ? (
                <>
                  <BoardlyAvatar
                    equippedAvatar={activeTarget.avatar}
                    avatarUrl={activeTarget.photoURL || undefined}
                    frame={activeTarget.frame || undefined}
                    name={activeTarget.displayName}
                    size={40}
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-heading font-bold text-sm sm:text-base text-[var(--text)] truncate">
                        {activeTarget.displayName}
                      </span>
                      {activeTarget.role && <RoleBadge role={activeTarget.role} size="sm" />}
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full inline-block ${
                          permission?.canChat ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      {permission?.isMutualFollow
                        ? 'Mutual Follow · Direct Chat'
                        : permission?.canChat
                        ? 'Request Accepted · Direct Chat'
                        : 'Chat Request Required'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#D71921]/10 text-[#D71921] flex items-center justify-center">
                    <MessageSquare size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-heading font-bold text-sm sm:text-base text-[var(--text)]">
                      Messages & Requests
                    </span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      Mutual followers & accepted requests
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages / Requests Tab Switcher */}
          <div className="flex items-center gap-4 px-4 sm:px-6 border-t border-[var(--border)]/60 bg-[var(--surface)]/50">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`py-2.5 text-xs font-heading font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'border-[#D71921] text-[var(--text)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <MessageSquare size={13} />
              <span>{activeTarget ? 'Conversation' : 'Messages'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`py-2.5 text-xs font-heading font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'requests'
                  ? 'border-[#D71921] text-[var(--text)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Inbox size={13} />
              <span>Requests</span>
              {incomingRequests.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#D71921] text-white text-[10px] font-mono font-bold leading-none">
                  {incomingRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Body Content */}
        {activeTab === 'requests' ? (
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 bg-[var(--bg)]/40 flex flex-col">
            {incomingRequests.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center mb-3">
                  <Inbox size={22} />
                </div>
                <h4 className="font-heading font-semibold text-sm text-[var(--text)] mb-1">
                  No Pending Chat Requests
                </h4>
                <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
                  When someone who doesn&apos;t mutually follow you sends a chat request, it will appear here for you to Accept or Decline.
                </p>
              </div>
            ) : (
              incomingRequests.map((req) => {
                const isBusy = respondingId === req.id;
                return (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <BoardlyAvatar
                        equippedAvatar={req.fromAvatar || undefined}
                        avatarUrl={req.fromPhotoURL || undefined}
                        frame={req.fromFrame || undefined}
                        name={req.fromName}
                        size={42}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-heading font-bold text-sm text-[var(--text)] truncate">
                          {req.fromName}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] truncate">
                          Wants to send you a message
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRespondToRequest(req, 'accepted')}
                        className="h-9 px-3.5 rounded-xl bg-[#D71921] hover:bg-[#b8141b] disabled:opacity-50 text-white text-xs font-heading font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check size={14} />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRespondToRequest(req, 'declined')}
                        className="h-9 px-3 rounded-xl border border-[var(--border)] hover:border-red-500/50 hover:text-red-500 disabled:opacity-50 text-[var(--text-muted)] text-xs font-heading font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <XCircle size={14} />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : !activeTarget ? (
          /* Conversations Inbox View (when opened without a specific targetUser) */
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-2.5 bg-[var(--bg)]/40 flex flex-col">
            {conversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-[#D71921]/10 text-[#D71921] flex items-center justify-center mb-3">
                  <MessageSquare size={22} />
                </div>
                <h4 className="font-heading font-semibold text-sm text-[var(--text)] mb-1">
                  No Conversations Yet
                </h4>
                <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
                  Follow each other or accept a chat request in the Requests tab to start chatting with fellow students.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const otherUid = conv.participants.find((id) => id !== currentUid) || '';
                const otherMeta = conv.participantDetails?.[otherUid] || {
                  displayName: 'Student',
                };
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() =>
                      setActiveTarget({
                        uid: otherUid,
                        displayName: otherMeta.displayName || 'Student',
                        avatar: otherMeta.avatar || null,
                        frame: otherMeta.frame || null,
                        photoURL: otherMeta.photoURL || null,
                      })
                    }
                    className="w-full p-3.5 rounded-2xl bg-[var(--surface-raised)] hover:bg-[var(--surface-muted)] border border-[var(--border)] flex items-center gap-3 text-left transition-colors cursor-pointer"
                  >
                    <BoardlyAvatar
                      equippedAvatar={otherMeta.avatar || undefined}
                      avatarUrl={otherMeta.photoURL || undefined}
                      frame={otherMeta.frame || undefined}
                      name={otherMeta.displayName || 'Student'}
                      size={42}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-bold text-sm text-[var(--text)] truncate">
                        {otherMeta.displayName || 'Student'}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        {conv.lastMessage || 'Tap to view conversation'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          /* 1-on-1 Message Thread View */
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 bg-[var(--bg)]/40 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
                <div className="w-6 h-6 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-heading">Checking chat permissions...</p>
              </div>
            ) : !permission?.canChat ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                  <Lock size={22} />
                </div>

                {permission?.incomingRequest?.status === 'pending' ? (
                  <>
                    <h4 className="font-heading font-semibold text-sm text-[var(--text)] mb-1">
                      {activeTarget.displayName} sent you a chat request
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed mb-4">
                      Accept this request to start chatting with {activeTarget.displayName}, or decline to remove it.
                    </p>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={Boolean(respondingId)}
                        onClick={() => handleRespondToRequest(permission.incomingRequest!, 'accepted')}
                        className="h-10 px-4 rounded-xl bg-[#D71921] hover:bg-[#b8141b] disabled:opacity-50 text-white text-xs font-heading font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={14} />
                        <span>Accept Request</span>
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(respondingId)}
                        onClick={() => handleRespondToRequest(permission.incomingRequest!, 'declined')}
                        className="h-10 px-4 rounded-xl border border-[var(--border)] hover:border-red-500/50 hover:text-red-500 disabled:opacity-50 text-[var(--text-muted)] text-xs font-heading font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle size={14} />
                        <span>Decline</span>
                      </button>
                    </div>
                  </>
                ) : permission?.outgoingRequest?.status === 'pending' ? (
                  <>
                    <h4 className="font-heading font-semibold text-sm text-[var(--text)] mb-1">
                      Chat Request Sent
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed mb-4">
                      Your chat request to {activeTarget.displayName} is pending. You can send messages once they accept your request or follow you back.
                    </p>
                    <button
                      type="button"
                      disabled
                      className="h-10 px-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-muted)] text-xs font-heading font-semibold opacity-70 cursor-not-allowed"
                    >
                      Request Sent
                    </button>
                  </>
                ) : permission?.isCooldownActive ? (
                  <>
                    <h4 className="font-heading font-semibold text-sm text-[var(--text)] mb-1">
                      Chat Request Declined
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
                      Your previous request was declined. You can send another request after 24 hours, or chat automatically if you both follow each other.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="font-heading font-semibold text-sm text-[var(--text)] mb-1">
                      Mutual Follow or Chat Request Required
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed mb-4">
                      Two students can chat freely when they follow each other. Otherwise, send a chat request to {activeTarget.displayName} first.
                    </p>
                    <button
                      type="button"
                      disabled={requestWorking}
                      onClick={handleSendRequestFromModal}
                      className="h-10 px-5 rounded-xl bg-[#D71921] hover:bg-[#b8141b] disabled:opacity-50 text-white text-xs font-heading font-semibold transition-colors cursor-pointer"
                    >
                      {requestWorking ? 'Sending Request...' : 'Send Chat Request'}
                    </button>
                  </>
                )}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--red)]/10 text-[var(--red)] flex items-center justify-center mb-3">
                  <MessageSquare size={22} />
                </div>
                <h4 className="font-heading font-semibold text-sm text-[var(--text)] mb-1">
                  Start a Conversation
                </h4>
                <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
                  Send a message to {activeTarget.displayName} to discuss board exams, solved past papers, or study tips.
                </p>
              </div>
            ) : (
              <>
                {messages.map((m) => {
                  const isMe = m.senderId === currentUid;
                  const formattedTime = m.createdAt?.toDate
                    ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <div
                      key={m.id}
                      className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && (
                        <div className="shrink-0 mb-1">
                          <BoardlyAvatar
                            equippedAvatar={m.senderAvatar || activeTarget.avatar}
                            frame={m.senderFrame || activeTarget.frame || undefined}
                            name={m.senderName}
                            size={28}
                          />
                        </div>
                      )}

                      <div className="flex flex-col max-w-[80%] sm:max-w-[70%]">
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed break-words shadow-xs ${
                            isMe
                              ? 'bg-[#D71921] text-white rounded-br-xs'
                              : 'bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text)] rounded-bl-xs'
                          }`}
                        >
                          {m.text}
                        </div>
                        {formattedTime && (
                          <span
                            className={`text-[10px] font-mono text-[var(--text-muted)] mt-1 px-1 ${
                              isMe ? 'text-right' : 'text-left'
                            }`}
                          >
                            {formattedTime}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-red-500/15 border-t border-red-500/30 text-red-500 text-xs text-center font-heading">
            {error}
          </div>
        )}

        {/* Footer / Input Form (only shown when in chat tab with a target user and permitted to chat) */}
        {activeTab === 'chat' && activeTarget && permission?.canChat && (
          <form
            onSubmit={handleSend}
            className="p-3 sm:p-4 border-t border-[var(--border)] bg-[var(--surface-raised)] flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeTarget.displayName}...`}
              maxLength={1000}
              disabled={loading || sending || !permission.canChat}
              className="flex-1 bg-[var(--input-bg)] text-[var(--text)] placeholder-[var(--text-muted)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--border)] focus:border-[#D71921] focus:outline-none transition-colors"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || sending || loading || !permission.canChat}
              aria-label="Send message"
              className="w-10 h-10 rounded-full bg-[#D71921] hover:bg-[#b8141b] disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm active:scale-95"
            >
              <Send size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
