import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  MessageCircleDashed,
  PenSquare,
  Phone,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAiCredits } from '@/hooks/useAiCredits';
import { usePlansConfig } from '@/hooks/usePlansConfig';
import { useBodyScrollLock } from '@/utils/scrollLock';
import { getDisplayName } from '@/utils/displayName';
import {
  AI_MENTORS,
  buildMentorGreeting,
  getCallRatePerMinute,
  getMentorConfig,
  prepareApiContentsWithSummary,
  resolveAiDepthExecution,
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
import { AiDepthThinkingIndicator } from './AiDepthMotion';
import { AiErrorBoundary } from './AiErrorBoundary';
import { MentorAvatar } from './MentorAvatar';
import { AiVoiceCallModal } from './AiVoiceCallModal';
import { isAiCallsFlagEnabled, isAishaVisualPhysicsFlagEnabled } from '@/utils/aiFeatureFlags';
import { getVoiceCapabilities } from '@/utils/voiceInput';

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
  const { credits, resetCountdown, applyServerUpdate } = useAiCredits();
  const { config: plansConfig } = usePlansConfig();

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

  // Each registered mentor keeps its own active chat thread (built dynamically from AI_MENTORS)
  const [threadsByMentor, setThreadsByMentor] = useState<Record<number, MentorThreadState>>(() => {
    const initial: Record<number, MentorThreadState> = {};
    for (const m of AI_MENTORS) {
      initial[m.id] = makeInitialThread(m.id);
    }
    return initial;
  });

  // Saved Firestore history list (latest 60)
  const [savedChats, setSavedChats] = useState<SavedAiChat[]>(() => getCachedAiChats(uid));
  const [sending, setSending] = useState(false);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);

  // Popups & Drawers
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [mentorPickerOpen, setMentorPickerOpen] = useState(false);
  const [depthGaugeOpen, setDepthGaugeOpen] = useState(false);
  const [upgradeSheetReason, setUpgradeSheetReason] = useState<string | null>(null);
  const [voiceCallOpen, setVoiceCallOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const activeSessionTokenRef = useRef<string>('');
  const inFlightAbortRef = useRef<AbortController | null>(null);
  const safetyTimerRef = useRef<number | null>(null);

  const currentThread = threadsByMentor[mentorId] || makeInitialThread(mentorId);
  const mentor = getMentorConfig(mentorId);
  const aishaVisualEnabled = isAishaVisualPhysicsFlagEnabled(
    plansConfig.aishaAnimationsEnabled
  );
  const aiCallsEnabled = isAiCallsFlagEnabled(
    plansConfig.aiCallsEnabled && credits.aiCallsEnabled
  );
  const voiceCaps = useMemo(() => getVoiceCapabilities(), []);

  const cancelInFlightRequest = useCallback(() => {
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    if (inFlightAbortRef.current) {
      try {
        inFlightAbortRef.current.abort();
      } catch {
        // Ignore abort errors
      }
      inFlightAbortRef.current = null;
    }
    setStreamingMsgId(null);
  }, []);

  useEffect(() => {
    return () => {
      cancelInFlightRequest();
    };
  }, [cancelInFlightRequest]);

  // Keep greeting personalized if profile finishes loading and chat has no user messages yet
  useEffect(() => {
    setThreadsByMentor((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const m of AI_MENTORS) {
        const t = next[m.id];
        if (t && t.messages.length === 1 && t.messages[0].isGreeting) {
          const fresh = buildMentorGreeting(m.id, studentDisplayName);
          if (t.messages[0].text !== fresh) {
            next[m.id] = { ...t, messages: [{ ...t.messages[0], text: fresh }] };
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

  // Scroll smoothly to bottom as messages arrive or stream
  const lastMsgLength = currentThread.messages[currentThread.messages.length - 1]?.text.length || 0;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: streamingMsgId ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [currentThread.messages.length, lastMsgLength, sending, streamingMsgId, mentorId]);

  // Esc closes main dialog when no sub-popup is open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        !mentorPickerOpen &&
        !depthGaugeOpen &&
        !upgradeSheetReason &&
        !mobileHistoryOpen &&
        !voiceCallOpen
      ) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mentorPickerOpen, depthGaugeOpen, upgradeSheetReason, mobileHistoryOpen, voiceCallOpen, onClose]);

  const startFreshChat = useCallback(
    (targetMentor: AiMentorId) => {
      cancelInFlightRequest();
      const fresh = makeInitialThread(targetMentor);
      activeSessionTokenRef.current = fresh.chatId;
      setSending(false);
      setThreadsByMentor((prev) => ({
        ...prev,
        [targetMentor]: fresh,
      }));
    },
    [cancelInFlightRequest, makeInitialThread]
  );

  const handleSelectMentor = (nextMentor: AiMentorId) => {
    cancelInFlightRequest();
    setSending(false);
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
    cancelInFlightRequest();
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
    cancelInFlightRequest();

    const thread = currentThread;
    const targetMentor = mentorId;
    const targetDepth = depthId;
    const targetChatId = thread.chatId;
    const requestToken = `${targetChatId}:${Date.now()}`;
    activeSessionTokenRef.current = requestToken;

    // Resolve shared depth execution plan (same function used by server & all 6 AIs)
    const executionPlan = resolveAiDepthExecution({
      mentorId: targetMentor,
      depthId: targetDepth,
    });

    const controller = new AbortController();
    inFlightAbortRef.current = controller;

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
    const replyMsgId = `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    setThreadsByMentor((prev) => ({
      ...prev,
      [targetMentor]: {
        chatId: targetChatId,
        messages: withUser,
      },
    }));

    let safetyTriggered = false;
    let firstTokenReceived = false;

    try {
      // Immediately enter thinking state (0ms delay — no artificial wait)
      setSending(true);
      setStreamingMsgId(null);

      // Belt-and-suspenders safety timer: guarantee thinking state never exceeds 48s
      safetyTimerRef.current = window.setTimeout(() => {
        safetyTriggered = true;
        console.error(
          `[AI Mentor UI] safety timeout fired after 48s mentor=${targetMentor} depth=${targetDepth}`
        );
        try {
          controller.abort();
        } catch {
          // Ignore
        }
      }, 48_000);

      // Trim history per depth (Quick=4, Balanced=6, Deep=10, Max=12) for minimal TTFT
      const apiContents = prepareApiContentsWithSummary(
        [
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
        ],
        executionPlan.maxHistoryMessages
      );

      const result = await sendAiMentorMessage({
        mentor: targetMentor,
        depth: targetDepth,
        contents: apiContents,
        signal: controller.signal,
        stream: true,
        visualEnabled: aishaVisualEnabled,
        onDelta: (_delta, fullText) => {
          if (activeSessionTokenRef.current !== requestToken) return;

          if (!firstTokenReceived) {
            firstTokenReceived = true;
            setStreamingMsgId(replyMsgId);
          }

          // Render tokens immediately as they arrive (zero artificial typing delay)
          const streamingBubble: StoredAiMessage = {
            id: replyMsgId,
            role: 'model',
            text: fullText,
            isStreaming: true,
            createdAt: Date.now(),
          };
          setThreadsByMentor((prev) => ({
            ...prev,
            [targetMentor]: {
              chatId: targetChatId,
              messages: [...withUser, streamingBubble],
            },
          }));
        },
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
        id: replyMsgId,
        role: 'model',
        text: result.text,
        isStreaming: false,
        isVisualScene: Boolean(result.isVisualScene),
        sceneCacheHit: Boolean(result.cacheHit),
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
      setStreamingMsgId(null);

      // Save non-temporary chats to Firestore asynchronously after reply finishes
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
      if (!safetyTriggered && err instanceof AiMentorApiError && err.code === 'ABORTED') {
        return;
      }

      console.error(
        `[AI Mentor UI] sendPayload failed mentor=${targetMentor} depth=${targetDepth} safetyTriggered=${safetyTriggered}:`,
        err
      );

      if (err instanceof AiMentorApiError) {
        if (typeof err.creditsLeft === 'number') {
          applyServerUpdate({
            creditsLeft: err.creditsLeft,
            dailyLimit: err.dailyLimit,
            resetAt: err.resetAt,
          });
        }
        if (
          (err.code === 'PRO_DEPTH_REQUIRED' || err.code === 'INSUFFICIENT_CREDITS') &&
          credits.plan !== 'plus'
        ) {
          setUpgradeSheetReason(err.message);
        }
      }

      const errorText = safetyTriggered
        ? 'Request timed out while waiting for your AI Mentor. Please tap Retry.'
        : err?.message || 'Could not get a response right now. Please tap Retry.';

      const errorBubble: StoredAiMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: errorText,
        isError: true,
        retryPayload: {
          text: userText.trim(),
          attachments,
        },
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
      if (safetyTimerRef.current !== null) {
        window.clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
      if (inFlightAbortRef.current === controller) {
        inFlightAbortRef.current = null;
      }
      if (activeSessionTokenRef.current === requestToken) {
        setSending(false);
        setStreamingMsgId(null);
      }
    }
  };

  const handleRegenerate = (modelMsgIndex: number) => {
    if (sending) return;
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

  const handleRetryError = (errorMsgIndex: number) => {
    if (sending) return;
    const msgs = currentThread.messages;
    const errMsg = msgs[errorMsgIndex];
    let lastUserIdx = -1;
    for (let i = errorMsgIndex - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    const retryText = errMsg?.retryPayload?.text ?? (lastUserIdx >= 0 ? msgs[lastUserIdx].text : '');
    const retryAttachments = errMsg?.retryPayload?.attachments ?? [];
    if (!retryText && retryAttachments.length === 0) return;
    const trimmedHistory = lastUserIdx >= 0 ? msgs.slice(0, lastUserIdx) : msgs.slice(0, errorMsgIndex);
    void sendPayload(retryText, retryAttachments, trimmedHistory);
  };

  const handleUpgradeNavigate = (targetTier: 'pro' | 'plus' = 'pro') => {
    setUpgradeSheetReason(null);
    onClose();
    navigate(
      targetTier === 'plus'
        ? '/dashboard/plan#boardly-plus-card'
        : '/dashboard/plan#boardly-pro-card'
    );
  };

  const handleOpenPastPapers = () => {
    onClose();
    navigate('/material');
  };

  const handleAppendCallTurn = useCallback(
    (userText: string, modelText: string) => {
      const targetMentor = mentorId;
      const now = Date.now();
      const userMsg: StoredAiMessage = {
        id: `call_u_${now}`,
        role: 'user',
        text: userText,
        createdAt: now,
      };
      const modelMsg: StoredAiMessage = {
        id: `call_m_${now + 1}`,
        role: 'model',
        text: modelText,
        createdAt: now + 1,
      };
      let nextChatId = currentThread.chatId;
      let nextMessages: StoredAiMessage[] = [];
      setThreadsByMentor((prev) => {
        const existing = prev[targetMentor] || makeInitialThread(targetMentor);
        nextChatId = existing.chatId;
        nextMessages = [...existing.messages, userMsg, modelMsg];
        return {
          ...prev,
          [targetMentor]: { chatId: existing.chatId, messages: nextMessages },
        };
      });
      if (!isTemporary && uid && !isGuest && !uid.startsWith('guest_')) {
        window.setTimeout(() => {
          if (nextMessages.length === 0) return;
          void saveAiChatToFirestore({
            uid,
            chatId: nextChatId,
            mentor: targetMentor,
            messages: nextMessages,
          })
            .then((saved) => {
              if (!saved) return;
              setSavedChats((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)].slice(0, 60));
            })
            .catch(() => {});
        }, 0);
      }
    },
    [currentThread.chatId, isGuest, isTemporary, makeInitialThread, mentorId, uid]
  );

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
      className="ai-mentors-sheet fixed inset-0 z-[9950] flex h-[100dvh] w-full overflow-hidden m-0 p-0"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Permanent Left History Column on Laptop (>= 1024px) */}
      <aside
        className="hidden lg:flex w-[300px] shrink-0 flex-col min-h-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
        style={{ borderRight: '1px solid var(--border)' }}
      >
        <AiHistorySidebar
          chats={savedChats}
          activeChatId={currentThread.chatId}
          activeMentor={mentorId}
          plan={credits.plan}
          isPro={credits.isPro}
          isPlus={credits.isPlus}
          dailyLimit={credits.dailyLimit}
          isSuperAdmin={credits.isSuperAdmin}
          planSource={credits.source}
          onSelectMentor={handleSelectMentor}
          onSelectChat={handleSelectSavedChat}
          onDeleteChat={handleDeleteSavedChat}
          onNewChat={() => startFreshChat(mentorId)}
          onUpgradeClick={() =>
            setUpgradeSheetReason(
              credits.plan === 'pro'
                ? `Upgrade to Boardly Plus for ${plansConfig.plus.aiCreditsPerDay} AI Mentor credits/day (2× Pro).`
                : `Upgrade to Boardly Pro for ${plansConfig.pro.aiCreditsPerDay} AI Mentor credits/day and Deep & Max thinking.`
            )
          }
        />
      </aside>

      {/* Right Main Chat Column */}
      <div className="flex flex-1 min-w-0 flex-col min-h-0 h-full">
        {/* Header */}
        <header
          className="relative z-40 shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 pt-[calc(10px+env(safe-area-inset-top,0px))] pb-2.5"
          style={{
            backgroundColor: 'var(--bg)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* Left controls: Close (X) >=44px + History menu (mobile/tablet only) */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              data-ai-close-button="true"
              onClick={onClose}
              aria-label="Close AI Mentors"
              title="Close"
              className="relative z-50 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-0 bg-transparent cursor-pointer transition-all hover:bg-[var(--surface-hover)] active:scale-95 active:bg-[var(--surface-hover)]"
              style={{ color: 'var(--text)' }}
            >
              <X className="h-[22px] w-[22px]" />
            </button>

              <button
                type="button"
                onClick={() => setMobileHistoryOpen(true)}
                aria-label="Open chat history"
                title="Chat history"
                className="flex lg:hidden h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent cursor-pointer transition-all hover:bg-[var(--surface-hover)] active:scale-95 active:bg-[var(--surface-hover)]"
                style={{ color: 'var(--text)' }}
              >
                <Menu className="h-[20px] w-[20px]" />
              </button>
            </div>

            {/* Centered Mentor Name + Role + Avatar */}
            <button
              type="button"
              onClick={() => setMentorPickerOpen(true)}
              className="flex items-center gap-2 min-w-0 px-2.5 py-1 rounded-2xl hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            >
              <MentorAvatar mentorId={mentorId} size={30} active eager />
              <div className="flex flex-col items-start justify-center min-w-0 text-left">
                <span
                  className="text-[16px] font-bold leading-tight truncate"
                  style={{
                    fontFamily: "'Doto', var(--font-dot), sans-serif",
                    color: 'var(--text)',
                  }}
                >
                  {mentor.name}
                </span>
                <span className="text-[11.5px] leading-tight truncate" style={{ color: 'var(--text-muted)' }}>
                  {mentor.role}
                </span>
              </div>
            </button>

            {/* Right controls: Voice Call + Temporary-chat toggle + New-chat pencil */}
            <div className="flex items-center gap-0.5 shrink-0">
              {aiCallsEnabled &&
                (voiceCaps.hasSpeechRecognition ? (
                  <button
                    type="button"
                    data-ai-call-button="true"
                    onClick={() => {
                      cancelInFlightRequest();
                      setVoiceCallOpen(true);
                    }}
                    aria-label={`Voice call ${mentor.name} (${credits.isUnlimited ? 'unlimited' : `${credits.callMinutesLeft} min left today`})`}
                    title={`Call ${mentor.name} · ${credits.isUnlimited ? 'Unlimited' : `${credits.callMinutesLeft} min left today`} (${getCallRatePerMinute(depthId)} cr/min)`}
                    className="flex h-10 items-center gap-1 rounded-full border-0 px-2.5 cursor-pointer transition-all hover:bg-[var(--surface-hover)] active:scale-95"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${mentor.accent} 12%, transparent)`,
                      color: mentor.accent,
                    }}
                  >
                    <Phone className="h-[17px] w-[17px]" />
                    {!credits.isUnlimited && (
                      <span className="text-[11px] font-semibold tabular-nums">
                        {credits.callMinutesLeft}m
                      </span>
                    )}
                  </button>
                ) : (
                  <span
                    className="hidden sm:inline-block px-2 text-[10.5px] font-medium"
                    style={{ color: 'var(--text-muted)' }}
                    title="Voice calls require Chrome speech recognition"
                  >
                    Calls work in Chrome
                  </span>
                ))}

              <button
                type="button"
                onClick={handleToggleTemporary}
                aria-label={isTemporary ? 'Temporary chat is on' : 'Turn on temporary chat'}
                aria-pressed={isTemporary}
                title={isTemporary ? 'Temporary chat on' : 'Temporary chat'}
                className="flex h-10 w-10 items-center justify-center rounded-full border-0 cursor-pointer transition-all hover:bg-[var(--surface-hover)] active:scale-95"
                style={{
                  backgroundColor: isTemporary
                    ? `color-mix(in srgb, ${mentor.accent} 14%, transparent)`
                    : 'transparent',
                  color: isTemporary ? mentor.accent : 'var(--text)',
                }}
              >
                <MessageCircleDashed className="h-[20px] w-[20px]" />
              </button>

              <button
                type="button"
                onClick={() => startFreshChat(mentorId)}
                aria-label="Start new chat"
                title="New chat"
                className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent cursor-pointer transition-all hover:bg-[var(--surface-hover)] active:scale-95 active:bg-[var(--surface-hover)]"
                style={{ color: 'var(--text)' }}
              >
                <PenSquare className="h-[19px] w-[19px]" />
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

              {/* Static Hero Portrait on fresh thread (zero 3D/WebGL, instant load + fallback) */}
              {realHistoryCount === 0 && !sending && (
                <div className="flex flex-col items-center pt-2 pb-1">
                  <div
                    className="relative flex items-center justify-center rounded-full p-1"
                    style={{
                      background: `radial-gradient(circle, color-mix(in srgb, ${mentor.accent} 22%, transparent) 0%, transparent 72%)`,
                    }}
                  >
                    <MentorAvatar mentorId={mentorId} size={116} active eager />
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
                    <span className="mt-0.5 inline-flex shrink-0">
                      <MentorAvatar
                        mentorId={mentorId}
                        size={32}
                        active={Boolean(msg.isStreaming && streamingMsgId === msg.id)}
                        eager={idx >= currentThread.messages.length - 3}
                      />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <AiMessageRenderer
                        text={msg.text}
                        accentColor={mentor.accent}
                        mentorId={mentorId}
                        aishaVisualEnabled={aishaVisualEnabled}
                        isGreeting={msg.isGreeting}
                        isError={msg.isError}
                        isStreaming={msg.isStreaming}
                        sceneCacheHit={msg.sceneCacheHit}
                        onRegenerate={
                          !msg.isGreeting && !msg.isError && !msg.isStreaming
                            ? () => handleRegenerate(idx)
                            : undefined
                        }
                        onRetry={msg.isError ? () => handleRetryError(idx) : undefined}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Immediate depth-matched thinking indicator while waiting for first streamed token */}
              {sending && !streamingMsgId && (
                <div className="flex items-center gap-3" aria-live="polite">
                  <MentorAvatar mentorId={mentorId} size={32} active eager />
                  <AiDepthThinkingIndicator
                    depthId={depthId}
                    mentorName={mentor.name}
                    accentColor={mentor.accent}
                  />
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
            plan={credits.plan}
            resetCountdown={resetCountdown}
            proDailyLimit={plansConfig.pro.aiCreditsPerDay}
            plusDailyLimit={plansConfig.plus.aiCreditsPerDay}
            aishaVisualEnabled={aishaVisualEnabled}
            onSend={(text, atts) => void sendPayload(text, atts)}
            onOpenMentorPicker={() => setMentorPickerOpen(true)}
            onOpenDepthGauge={() => setDepthGaugeOpen(true)}
            onOpenPastPapers={handleOpenPastPapers}
            onOpenUpgrade={(reason) => {
              if (credits.plan !== 'plus') setUpgradeSheetReason(reason);
            }}
          />
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
              plan={credits.plan}
              isPro={credits.isPro}
              isPlus={credits.isPlus}
              dailyLimit={credits.dailyLimit}
              isSuperAdmin={credits.isSuperAdmin}
              planSource={credits.source}
              onSelectMentor={handleSelectMentor}
              onSelectChat={handleSelectSavedChat}
              onDeleteChat={handleDeleteSavedChat}
              onNewChat={() => startFreshChat(mentorId)}
              onUpgradeClick={() => {
                setMobileHistoryOpen(false);
                setUpgradeSheetReason(
                  credits.plan === 'pro'
                    ? `Upgrade to Boardly Plus for ${plansConfig.plus.aiCreditsPerDay} AI Mentor credits/day (2× Pro).`
                    : `Upgrade to Boardly Pro for ${plansConfig.pro.aiCreditsPerDay} AI Mentor credits/day and Deep & Max thinking.`
                );
              }}
              onCloseMobileDrawer={() => setMobileHistoryOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Sub-Popups wrapped in dedicated Error Boundaries */}
      <AiErrorBoundary
        scope="picker"
        compact
        onClose={() => setMentorPickerOpen(false)}
      >
        <AiMentorPickerModal
          open={mentorPickerOpen}
          selectedMentor={mentorId}
          selectedDepth={depthId}
          onSelectMentor={handleSelectMentor}
          onOpenDepthGauge={() => setDepthGaugeOpen(true)}
          onClose={() => setMentorPickerOpen(false)}
        />
      </AiErrorBoundary>

      <AiErrorBoundary
        scope="depth"
        compact
        onClose={() => setDepthGaugeOpen(false)}
      >
        <AiDepthGaugeModal
          open={depthGaugeOpen}
          selectedDepth={depthId}
          mentorId={mentorId}
          aishaVisualEnabled={aishaVisualEnabled}
          deepMaxUnlocked={credits.deepMaxUnlocked}
          accentColor={mentor.accent}
          onSelectDepth={(d) => setDepthId(d)}
          onLockedDepthClick={(depthLabel) => {
            setDepthGaugeOpen(false);
            setUpgradeSheetReason(
              `${depthLabel} thinking is unlocked on Boardly Pro (${plansConfig.pro.aiCreditsPerDay}/day) and Boardly Plus (${plansConfig.plus.aiCreditsPerDay}/day).`
            );
          }}
          onClose={() => setDepthGaugeOpen(false)}
        />
      </AiErrorBoundary>

      <AiUpgradeSheet
        open={Boolean(upgradeSheetReason) && credits.plan !== 'plus'}
        currentPlan={credits.plan}
        reason={
          upgradeSheetReason ||
          (credits.plan === 'pro'
            ? `Upgrade to Boardly Plus for ${plansConfig.plus.aiCreditsPerDay} AI Mentor credits/day (2× Pro).`
            : `Upgrade to Boardly Pro for ${plansConfig.pro.aiCreditsPerDay} AI Mentor credits/day and Deep & Max thinking.`)
        }
        onClose={() => setUpgradeSheetReason(null)}
        onUpgrade={handleUpgradeNavigate}
      />

      {aiCallsEnabled && (
        <AiErrorBoundary
          scope="chat"
          compact
          onClose={() => setVoiceCallOpen(false)}
        >
          <AiVoiceCallModal
            open={voiceCallOpen}
            mentorId={mentorId}
            depthId={depthId}
            historyMessages={currentThread.messages}
            creditsLeft={credits.creditsLeft}
            isUnlimited={credits.isUnlimited}
            callMinutesLeft={credits.callMinutesLeft}
            onCreditsUpdated={applyServerUpdate}
            onAppendCallTurn={handleAppendCallTurn}
            onClose={() => setVoiceCallOpen(false)}
          />
        </AiErrorBoundary>
      )}
    </div>
  );

  if (typeof document === 'undefined') return overlayContent;
  return createPortal(overlayContent, document.body);
};
