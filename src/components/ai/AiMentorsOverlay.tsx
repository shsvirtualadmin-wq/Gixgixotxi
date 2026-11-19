import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  MessageCircleDashed,
  PenSquare,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAiCredits } from '@/hooks/useAiCredits';
import { useBodyScrollLock } from '@/utils/scrollLock';
import { getDisplayName } from '@/utils/displayName';
import {
  buildMentorGreeting,
  getMentorConfig,
  prepareApiContents,
  type AiDepthId,
  type AiMentorId,
  type ApiContentPart,
} from '@/utils/aiMentorsLogic';
import {
  AiMentorApiError,
  deleteAiChatFromFirestore,
  getCachedAiChats,
  getSaveChatHistoryPref,
  loadAiChatsFromFirestore,
  saveAiChatToFirestore,
  sendAiMentorMessage,
  type PreparedAttachment,
  type SavedAiChat,
  type StoredAiMessage,
} from '@/services/aiMentorsService';
import { AiMessageRenderer } from './AiMessageRenderer';
import { AiComposer } from './AiComposer';
import { AiHistorySidebar } from './AiHistorySidebar';
import { AiMentorPickerModal } from './AiMentorPickerModal';
import { AiDepthGaugeModal } from './AiDepthGaugeModal';
import { AiUpgradeSheet } from './AiUpgradeSheet';

interface MentorThreadState {
  chatId: string;
  messages: StoredAiMessage[];
}

function createChatId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface AiMentorsOverlayProps {
  initialMentor?: AiMentorId;
  onClose: () => void;
}

export const AiMentorsOverlay: React.FC<AiMentorsOverlayProps> = ({
  initialMentor = 0,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const { profile } = useUserProfile();
  const { credits, applyServerUpdate } = useAiCredits();

  useBodyScrollLock(true, 'ai-mentors-overlay');

  const uid = user?.uid || null;
  const studentDisplayName = getDisplayName(
    {
      display_name: profile?.display_name ?? profile?.displayName,
      realName: profile?.realName ?? profile?.name ?? user?.displayName,
      username: profile?.username,
    },
    'friend'
  );

  // Respect "Save chat history" setting from Settings -> Boardly AI
  const [saveHistoryEnabled, setSaveHistoryEnabled] = useState<boolean>(() =>
    getSaveChatHistoryPref(uid)
  );
  const [temporaryToggle, setTemporaryToggle] = useState<boolean>(() => !getSaveChatHistoryPref(uid));
  const isTemporary = !saveHistoryEnabled || temporaryToggle;

  const [mentorId, setMentorId] = useState<AiMentorId>(initialMentor);
  const [depthId, setDepthId] = useState<AiDepthId>(1);

  const makeInitialThread = useCallback(
    (mId: AiMentorId): MentorThreadState => ({
      chatId: createChatId(),
      messages: [
        {
          id: `greet_${mId}_${Date.now()}`,
          role: 'model',
          text: buildMentorGreeting(mId, studentDisplayName),
          isGreeting: true,
        },
      ],
    }),
    [studentDisplayName]
  );

  // Each mentor keeps its own current chat thread
  const [threadsByMentor, setThreadsByMentor] = useState<Record<number, MentorThreadState>>(() => ({
    0: makeInitialThread(0),
    1: makeInitialThread(1),
    2: makeInitialThread(2),
    3: makeInitialThread(3),
    4: makeInitialThread(4),
  }));

  // Saved Firestore history list (latest 60)
  const [savedChats, setSavedChats] = useState<SavedAiChat[]>(() => getCachedAiChats(uid));
  const [sending, setSending] = useState(false);

  // Popups & Drawers
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [mentorPickerOpen, setMentorPickerOpen] = useState(false);
  const [depthGaugeOpen, setDepthGaugeOpen] = useState(false);
  const [upgradeSheetReason, setUpgradeSheetReason] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const activeSessionTokenRef = useRef<string>('');
  const currentThread = threadsByMentor[mentorId] || makeInitialThread(mentorId);
  const mentor = getMentorConfig(mentorId);

  // Keep greeting personalized if profile finishes loading and chat has no user messages yet
  useEffect(() => {
    setThreadsByMentor((prev) => {
      const next = { ...prev };
      let changed = false;
      for (let i = 0; i < 5; i++) {
        const t = next[i];
        if (t && t.messages.length === 1 && t.messages[0].isGreeting) {
          const fresh = buildMentorGreeting(i as AiMentorId, studentDisplayName);
          if (t.messages[0].text !== fresh) {
            next[i] = { ...t, messages: [{ ...t.messages[0], text: fresh }] };
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [studentDisplayName]);

  // Listen for Settings "Save chat history" toggle changes
  useEffect(() => {
    const onPrefChange = (e: Event) => {
      const val = (e as CustomEvent<{ saveHistory: boolean }>).detail?.saveHistory;
      if (typeof val === 'boolean') {
        setSaveHistoryEnabled(val);
        if (!val) setTemporaryToggle(true);
      }
    };
    window.addEventListener('boardly:ai-prefs-changed', onPrefChange);
    return () => window.removeEventListener('boardly:ai-prefs-changed', onPrefChange);
  }, []);

  // Load saved chats from Firestore on open
  useEffect(() => {
    if (!uid || isGuest || uid.startsWith('guest_')) return;
    let active = true;
    void loadAiChatsFromFirestore(uid)
      .then((list) => {
        if (active) setSavedChats(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [uid, isGuest]);

  // Clamp depth back to Balanced if user is on Free plan and somehow had Deep/Max selected
  useEffect(() => {
    if (!credits.deepMaxUnlocked && depthId >= 2) {
      setDepthId(1);
    }
  }, [credits.deepMaxUnlocked, depthId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [currentThread.messages.length, sending, mentorId]);

  // Esc closes main dialog when no sub-popup is open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        !mentorPickerOpen &&
        !depthGaugeOpen &&
        !upgradeSheetReason &&
        !mobileHistoryOpen
      ) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mentorPickerOpen, depthGaugeOpen, upgradeSheetReason, mobileHistoryOpen, onClose]);

  const startFreshChat = useCallback(
    (targetMentor: AiMentorId) => {
      const fresh = makeInitialThread(targetMentor);
      activeSessionTokenRef.current = fresh.chatId;
      setSending(false);
      setThreadsByMentor((prev) => ({
        ...prev,
        [targetMentor]: fresh,
      }));
    },
    [makeInitialThread]
  );

  const handleSelectMentor = (nextMentor: AiMentorId) => {
    setMentorId(nextMentor);
    if (isTemporary) {
      startFreshChat(nextMentor);
    } else {
      const existing = threadsByMentor[nextMentor];
      activeSessionTokenRef.current = existing?.chatId || '';
    }
  };

  const handleToggleTemporary = () => {
    if (!saveHistoryEnabled) {
      // History saving is disabled in Settings; start fresh temp chat anyway
      startFreshChat(mentorId);
      return;
    }
    const nextTemp = !temporaryToggle;
    setTemporaryToggle(nextTemp);
    if (nextTemp) {
      startFreshChat(mentorId);
    }
  };

  const handleSelectSavedChat = (chat: SavedAiChat) => {
    setTemporaryToggle(false);
    setMentorId(chat.mentor);
    activeSessionTokenRef.current = chat.id;
    setSending(false);
    setThreadsByMentor((prev) => ({
      ...prev,
      [chat.mentor]: {
        chatId: chat.id,
        messages: chat.messages.map((m, idx) => ({
          id: `${chat.id}_${idx}`,
          role: m.role,
          text: m.text,
        })),
      },
    }));
  };

  const handleDeleteSavedChat = (chatId: string) => {
    setSavedChats((prev) => prev.filter((c) => c.id !== chatId));
    if (uid) {
      void deleteAiChatFromFirestore(uid, chatId).catch(() => {});
    }
    if (currentThread.chatId === chatId) {
      startFreshChat(mentorId);
    }
  };

  const sendPayload = async (
    userText: string,
    attachments: PreparedAttachment[],
    baseMessages?: StoredAiMessage[]
  ) => {
    const thread = currentThread;
    const targetMentor = mentorId;
    const targetChatId = thread.chatId;
    const requestToken = `${targetChatId}:${Date.now()}`;
    activeSessionTokenRef.current = requestToken;

    const attachmentLabels = attachments.map((a) =>
      a.kind === 'photo' ? '📷 Photo' : `📄 PDF`
    );

    const userMsgParts: ApiContentPart[] = [];
    for (const att of attachments) {
      userMsgParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.base64Data,
        },
      });
    }
    if (userText.trim()) {
      userMsgParts.push({ text: userText.trim() });
    }

    const userBubble: StoredAiMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: userText.trim(),
      attachmentLabels,
      createdAt: Date.now(),
    };

    const existingList = baseMessages ?? thread.messages;
    const withUser = [...existingList, userBubble];

    setThreadsByMentor((prev) => ({
      ...prev,
      [targetMentor]: {
        chatId: targetChatId,
        messages: withUser,
      },
    }));
    setSending(true);

    // Prepare last 12 messages for API (attaching real inlineData on latest user turn)
    const apiContents = prepareApiContents([
      ...existingList.map((m) => ({
        role: m.role,
        text: m.text,
        isError: m.isError,
        isGreeting: m.isGreeting,
      })),
      {
        role: 'user',
        text: userText.trim(),
        parts: userMsgParts,
      },
    ]);

    try {
      const result = await sendAiMentorMessage({
        mentor: targetMentor,
        depth: depthId,
        contents: apiContents,
      });

      applyServerUpdate({
        creditsLeft: result.creditsLeft,
        creditsUsed: result.creditsUsed,
        dailyLimit: result.dailyLimit,
        isUnlimited: result.isUnlimited,
        resetAt: result.resetAt,
        dateKey: result.dateKey,
      });

      // Race-condition guard: ignore reply if user switched chats or started a new chat while waiting
      if (activeSessionTokenRef.current !== requestToken) {
        return;
      }

      const modelBubble: StoredAiMessage = {
        id: `m_${Date.now()}`,
        role: 'model',
        text: result.text,
        createdAt: Date.now(),
      };

      const updatedMessages = [...withUser, modelBubble];
      setThreadsByMentor((prev) => ({
        ...prev,
        [targetMentor]: {
          chatId: targetChatId,
          messages: updatedMessages,
        },
      }));

      // Save non-temporary chats to Firestore
      if (!isTemporary && uid && !isGuest && !uid.startsWith('guest_')) {
        void saveAiChatToFirestore({
          uid,
          chatId: targetChatId,
          mentor: targetMentor,
          messages: updatedMessages,
        })
          .then((saved) => {
            if (!saved) return;
            setSavedChats((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)].slice(0, 60));
          })
          .catch(() => {});
      }
    } catch (err: any) {
      if (activeSessionTokenRef.current !== requestToken) {
        return;
      }

      if (err instanceof AiMentorApiError) {
        if (typeof err.creditsLeft === 'number') {
          applyServerUpdate({
            creditsLeft: err.creditsLeft,
            dailyLimit: err.dailyLimit,
            resetAt: err.resetAt,
          });
        }
        if (err.code === 'PRO_DEPTH_REQUIRED' || err.code === 'INSUFFICIENT_CREDITS') {
          setUpgradeSheetReason(err.message);
        }
      }

      const errorBubble: StoredAiMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: err?.message || 'Could not get a response right now. Please try again.',
        isError: true,
        createdAt: Date.now(),
      };

      setThreadsByMentor((prev) => ({
        ...prev,
        [targetMentor]: {
          chatId: targetChatId,
          messages: [...withUser, errorBubble],
        },
      }));
    } finally {
      if (activeSessionTokenRef.current === requestToken) {
        setSending(false);
      }
    }
  };

  const handleRegenerate = (modelMsgIndex: number) => {
    if (sending) return;
    // Find the preceding user message
    const msgs = currentThread.messages;
    let lastUserIdx = -1;
    for (let i = modelMsgIndex - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx < 0) return;
    const promptText = msgs[lastUserIdx].text;
    const trimmedHistory = msgs.slice(0, lastUserIdx);
    void sendPayload(promptText, [], trimmedHistory);
  };

  const handleUpgradeNavigate = () => {
    setUpgradeSheetReason(null);
    onClose();
    navigate('/dashboard/plan#boardly-pro-card');
  };

  const handleOpenPastPapers = () => {
    onClose();
    navigate('/material');
  };

  const realHistoryCount = useMemo(
    () => currentThread.messages.filter((m) => !m.isGreeting && !m.isError).length,
    [currentThread.messages]
  );

  const overlayContent = (
    <div
      data-fullscreen-modal="true"
      data-ai-mentors-overlay="true"
      role="dialog"
      aria-modal="true"
      aria-label="Boardly AI Mentors"
      className="fixed inset-0 z-[9950] flex items-end lg:items-center justify-center lg:p-6"
    >
      {/* Dimmed backdrop (desktop click closes) */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Container: Full-screen 100dvh sheet on <1024px; Centered 1040px x 86vh dialog on >=1024px */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="ai-mentors-sheet relative z-10 flex w-full h-[100dvh] lg:h-[86vh] lg:max-w-[1040px] lg:rounded-[32px] overflow-hidden shadow-2xl"
        style={{
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      >
        {/* Permanent Left History Column on Laptop (>= 1024px) */}
        <aside
          className="hidden lg:flex w-[300px] shrink-0 flex-col min-h-0"
          style={{ borderRight: '1px solid var(--border)' }}
        >
          <AiHistorySidebar
            chats={savedChats}
            activeChatId={currentThread.chatId}
            activeMentor={mentorId}
            isPro={credits.isPro}
            isSuperAdmin={credits.isSuperAdmin}
            planSource={credits.source}
            onSelectMentor={handleSelectMentor}
            onSelectChat={handleSelectSavedChat}
            onDeleteChat={handleDeleteSavedChat}
            onNewChat={() => startFreshChat(mentorId)}
            onUpgradeClick={() =>
              setUpgradeSheetReason('Upgrade to Boardly Pro for 100 AI Mentor credits/day and Deep & Max thinking.')
            }
          />
        </aside>

        {/* Right Main Chat Column */}
        <div className="flex flex-1 min-w-0 flex-col min-h-0">
          {/* Header */}
          <header
            className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 pt-[calc(10px+env(safe-area-inset-top,0px))] lg:pt-3 pb-2.5"
            style={{
              backgroundColor: 'var(--bg)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {/* Left controls: Close (X) + History two-line icon (mobile/tablet only) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close AI Mentors"
                title="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                <X className="h-[18px] w-[18px]" />
              </button>

              <button
                type="button"
                onClick={() => setMobileHistoryOpen(true)}
                aria-label="Open chat history"
                title="Chat history"
                className="flex lg:hidden h-10 w-10 items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                <Menu className="h-[18px] w-[18px]" />
              </button>
            </div>

            {/* Centered Mentor Name + Role */}
            <button
              type="button"
              onClick={() => setMentorPickerOpen(true)}
              className="flex flex-col items-center justify-center min-w-0 px-2 py-0.5 rounded-2xl hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: mentor.accent }}
                />
                <span
                  className="text-[17px] font-bold leading-tight truncate"
                  style={{
                    fontFamily: "'Doto', var(--font-dot), sans-serif",
                    color: 'var(--text)',
                  }}
                >
                  {mentor.name}
                </span>
              </div>
              <span className="text-[12px] leading-tight truncate" style={{ color: 'var(--text-muted)' }}>
                {mentor.role}
              </span>
            </button>

            {/* Right controls: Temporary-chat toggle + New-chat pencil */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleToggleTemporary}
                aria-label={isTemporary ? 'Temporary chat is on' : 'Turn on temporary chat'}
                aria-pressed={isTemporary}
                title={isTemporary ? 'Temporary chat on' : 'Temporary chat'}
                className="flex h-10 w-10 items-center justify-center rounded-full cursor-pointer transition-colors"
                style={{
                  backgroundColor: isTemporary
                    ? `color-mix(in srgb, ${mentor.accent} 14%, var(--card))`
                    : 'var(--card)',
                  border: isTemporary
                    ? `1.5px solid ${mentor.accent}`
                    : '1px solid var(--border)',
                  color: isTemporary ? mentor.accent : 'var(--text)',
                }}
              >
                <MessageCircleDashed className="h-[18px] w-[18px]" />
              </button>

              <button
                type="button"
                onClick={() => startFreshChat(mentorId)}
                aria-label="Start new chat"
                title="New chat"
                className="flex h-10 w-10 items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                <PenSquare className="h-[18px] w-[18px]" />
              </button>
            </div>
          </header>

          {/* Messages Scroll Area */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 sm:px-6 py-4">
            <div className="mx-auto max-w-[740px] space-y-5">
              {isTemporary && (
                <div className="flex justify-center">
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px]"
                    style={{
                      backgroundColor: 'var(--card)',
                      border: '1px dashed var(--border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <MessageCircleDashed className="h-3.5 w-3.5 shrink-0" style={{ color: mentor.accent }} />
                    <span>Temporary chat. This chat won&apos;t appear in history.</span>
                  </div>
                </div>
              )}

              {currentThread.messages.map((msg, idx) => {
                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div
                        className="max-w-[85%] sm:max-w-[78%] rounded-[24px] rounded-br-[8px] px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm break-words"
                        style={{
                          backgroundColor: mentor.accent,
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                        }}
                      >
                        {Array.isArray(msg.attachmentLabels) && msg.attachmentLabels.length > 0 && (
                          <div className="mb-1.5 flex flex-wrap gap-1.5">
                            {msg.attachmentLabels.map((lbl, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[12px] font-medium"
                              >
                                {lbl}
                              </span>
                            ))}
                          </div>
                        )}
                        {msg.text && <div className="whitespace-pre-wrap">{msg.text}</div>}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                      style={{ backgroundColor: mentor.accent }}
                      aria-hidden="true"
                    >
                      {mentor.name[0]}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <AiMessageRenderer
                        text={msg.text}
                        accentColor={mentor.accent}
                        isGreeting={msg.isGreeting}
                        isError={msg.isError}
                        onRegenerate={
                          !msg.isGreeting && !msg.isError
                            ? () => handleRegenerate(idx)
                            : undefined
                        }
                      />
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {sending && (
                <div className="flex items-start gap-3" aria-live="polite">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                    style={{ backgroundColor: mentor.accent }}
                    aria-hidden="true"
                  >
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  </span>
                  <div
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13.5px]"
                    style={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span className="ai-typing-dot" style={{ backgroundColor: mentor.accent }} />
                    <span
                      className="ai-typing-dot"
                      style={{ backgroundColor: mentor.accent, animationDelay: '150ms' }}
                    />
                    <span
                      className="ai-typing-dot"
                      style={{ backgroundColor: mentor.accent, animationDelay: '300ms' }}
                    />
                    <span className="ml-1.5">{mentor.name} is thinking…</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Composer */}
          <AiComposer
            mentorId={mentorId}
            depthId={depthId}
            isTemporary={isTemporary}
            sending={sending}
            historyMessageCount={realHistoryCount}
            creditsLeft={credits.creditsLeft}
            dailyLimit={credits.dailyLimit}
            isUnlimited={credits.isUnlimited}
            isPro={credits.isPro}
            onSend={(text, atts) => void sendPayload(text, atts)}
            onOpenMentorPicker={() => setMentorPickerOpen(true)}
            onOpenDepthGauge={() => setDepthGaugeOpen(true)}
            onOpenPastPapers={handleOpenPastPapers}
            onOpenUpgrade={(reason) => setUpgradeSheetReason(reason)}
          />
        </div>
      </div>

      {/* Mobile/Tablet Slide-Over History Drawer */}
      {mobileHistoryOpen && (
        <div
          className="fixed inset-0 z-[10040] flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="AI Mentors chat history"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setMobileHistoryOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative z-10 flex h-[100dvh] w-[min(86vw,320px)] flex-col shadow-2xl pt-[env(safe-area-inset-top,0px)]"
            style={{
              backgroundColor: 'var(--bg)',
              borderRight: '1px solid var(--border)',
            }}
          >
            <AiHistorySidebar
              chats={savedChats}
              activeChatId={currentThread.chatId}
              activeMentor={mentorId}
              isPro={credits.isPro}
              isSuperAdmin={credits.isSuperAdmin}
              planSource={credits.source}
              onSelectMentor={handleSelectMentor}
              onSelectChat={handleSelectSavedChat}
              onDeleteChat={handleDeleteSavedChat}
              onNewChat={() => startFreshChat(mentorId)}
              onUpgradeClick={() => {
                setMobileHistoryOpen(false);
                setUpgradeSheetReason(
                  'Upgrade to Boardly Pro for 100 AI Mentor credits/day and Deep & Max thinking.'
                );
              }}
              onCloseMobileDrawer={() => setMobileHistoryOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Sub-Popups */}
      <AiMentorPickerModal
        open={mentorPickerOpen}
        selectedMentor={mentorId}
        selectedDepth={depthId}
        onSelectMentor={handleSelectMentor}
        onOpenDepthGauge={() => setDepthGaugeOpen(true)}
        onClose={() => setMentorPickerOpen(false)}
      />

      <AiDepthGaugeModal
        open={depthGaugeOpen}
        selectedDepth={depthId}
        deepMaxUnlocked={credits.deepMaxUnlocked}
        accentColor={mentor.accent}
        onSelectDepth={(d) => setDepthId(d)}
        onLockedDepthClick={(depthLabel) => {
          setDepthGaugeOpen(false);
          setUpgradeSheetReason(
            `${depthLabel} thinking is unlocked on Boardly Pro (100 credits/day).`
          );
        }}
        onClose={() => setDepthGaugeOpen(false)}
      />

      <AiUpgradeSheet
        open={Boolean(upgradeSheetReason)}
        reason={
          upgradeSheetReason ||
          'Upgrade to Boardly Pro for 100 AI Mentor credits/day and Deep & Max thinking.'
        }
        onClose={() => setUpgradeSheetReason(null)}
        onUpgrade={handleUpgradeNavigate}
      />
    </div>
  );

  if (typeof document === 'undefined') return overlayContent;
  return createPortal(overlayContent, document.body);
};
