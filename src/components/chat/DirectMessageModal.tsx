import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { BoardlyAvatar } from '@/components/ui/BoardlyAvatar';
import { RoleBadge } from '@/components/ui/RoleBadge';
import {
  getOrCreateConversation,
  sendMessage,
  subscribeMessages,
  type ChatMessage,
} from '@/services/chatService';

interface TargetUser {
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
}

export const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
  isOpen,
  onClose,
  targetUser,
}) => {
  const { user: authUser } = useAuth();
  const { profile: ownProfile } = useUserProfile();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const currentUid = authUser?.uid || null;
  const targetUid = targetUser?.uid || null;

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // Initialize conversation and subscribe to real-time messages
  useEffect(() => {
    if (!isOpen || !currentUid || !targetUid || currentUid === targetUid) {
      setMessages([]);
      setConversationId(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    let unsub: (() => void) | null = null;

    async function initChat() {
      try {
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
            displayName: targetUser?.displayName || 'Student',
            avatar: targetUser?.avatar || null,
            frame: targetUser?.frame || null,
            photoURL: targetUser?.photoURL || null,
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
  }, [isOpen, currentUid, targetUid, ownProfile, authUser, targetUser, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !loading) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !conversationId || !currentUid || sending) return;

    setSending(true);
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
        targetUid || undefined
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

  if (!isOpen || !targetUser) return null;

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
        className="relative z-10 w-full h-full sm:h-[580px] sm:max-h-[85vh] sm:max-w-lg bg-[var(--surface)] border border-[var(--border)] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[var(--text)]"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-[var(--border)] bg-[var(--surface-raised)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <BoardlyAvatar
              equippedAvatar={targetUser.avatar}
              avatarUrl={targetUser.photoURL || undefined}
              frame={targetUser.frame || undefined}
              name={targetUser.displayName}
              size={40}
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-heading font-bold text-sm sm:text-base text-[var(--text)] truncate">
                  {targetUser.displayName}
                </span>
                {targetUser.role && <RoleBadge role={targetUser.role} size="sm" />}
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Direct Message
              </span>
            </div>
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

        {/* Message Thread */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 bg-[var(--bg)]/40 flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
              <div className="w-6 h-6 border-2 border-[var(--red)] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-heading">Opening conversation...</p>
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
                Send a message to {targetUser.displayName} to discuss board exams, solved past papers, or study tips.
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
                          equippedAvatar={m.senderAvatar || targetUser.avatar}
                          frame={m.senderFrame || targetUser.frame || undefined}
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

        {/* Error banner */}
        {error && (
          <div className="px-4 py-2 bg-red-500/15 border-t border-red-500/30 text-red-500 text-xs text-center font-heading">
            {error}
          </div>
        )}

        {/* Footer / Input Form */}
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
            placeholder={`Message ${targetUser.displayName}...`}
            maxLength={1000}
            disabled={loading || sending}
            className="flex-1 bg-[var(--input-bg)] text-[var(--text)] placeholder-[var(--text-muted)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--border)] focus:border-[#D71921] focus:outline-none transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || sending || loading}
            aria-label="Send message"
            className="w-10 h-10 rounded-full bg-[#D71921] hover:bg-[#b8141b] disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm active:scale-95"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
