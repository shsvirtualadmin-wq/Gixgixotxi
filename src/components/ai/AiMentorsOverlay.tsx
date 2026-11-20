import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  MessageCircleDashed,
  PenSquare,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAiCredits } from '@/hooks/useAiCredits';
import { usePlansConfig } from '@/hooks/usePlansConfig';
import { useBodyScrollLock } from '@/utils/scrollLock';
import { getDisplayName } from '@/utils/displayName';
import {
  buildMentorGreeting,
  getMentorConfig,
  prepareApiContentsWithSummary,
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
import { MentorAvatar } from './MentorAvatar';
import {
  getMentorCharacterProfile,
  shouldUseStaticPortraitFallback,
  type MentorPoseState,
} from './mentorCharacterConfig';

const LazyMentorCharacterStage = lazy(() => import('./MentorCharacterStage'));

interface FlipFlightState {
  id: string;
  mentorId: AiMentorId;
  targetMsgId: string;
  fromRect: { left: number; top: number; width: number; height: number };
  toRect: { left: number; top: number; width: number; height: number };
}

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

  // Realistic Hero Mentor Character state (poses, lip-sync, FLIP fly-and-dock)
  const [characterPose, setCharacterPose] = useState<MentorPoseState>('idle');
  const [nodSeq, setNodSeq] = useState(0);
  const [speechState, setSpeechState] = useState<{ seq: number; chunk: string }>({ seq: 0, chunk: '' });
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [flipFlight, setFlipFlight] = useState<FlipFlightState | null>(null);
  const [dockedMsgId, setDockedMsgId] = useState<string | null>(null);

  // Popups & Drawers
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [mentorPickerOpen, setMentorPickerOpen] = useState(false);
  const [depthGaugeOpen, setDepthGaugeOpen] = useState(false);
  const [upgradeSheetReason, setUpgradeSheetReason] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const heroStageRef = useRef<HTMLDivElement | null>(null);
  const avatarSlotRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const flipCloneRef = useRef<HTMLDivElement | null>(null);
  const nodTimerRef = useRef<number | null>(null);
  const dockTimerRef = useRef<number | null>(null);
  const activeSessionTokenRef = useRef<string>('');
  const inFlightAbortRef = useRef<AbortController | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const currentThread = threadsByMentor[mentorId] || makeInitialThread(mentorId);
  const mentor = getMentorConfig(mentorId);
  const mentorProfile = useMemo(() => getMentorCharacterProfile(mentorId), [mentorId]);

  const cancelInFlightRequest = useCallback(() => {
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    if (nodTimerRef.current !== null) {
      window.clearTimeout(nodTimerRef.current);
      nodTimerRef.current = null;
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
    setCharacterPose('idle');
  }, []);

  useEffect(() => {
    return () => {
      cancelInFlightRequest();
      if (dockTimerRef.current !== null) {
        window.clearTimeout(dockTimerRef.current);
      }
    };
  }, [cancelInFlightRequest]);

  // Execute FLIP fly-and-dock animation whenever a flight state is queued
  useEffect(() => {
    if (!flipFlight) return;
    const el = flipCloneRef.current;
    if (!el) {
      setFlipFlight(null);
      return;
    }

    const { fromRect, toRect, targetMsgId } = flipFlight;
    const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
    const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);
    const sx = Math.max(0.15, toRect.width / Math.max(1, fromRect.width));
    const sy = Math.max(0.15, toRect.height / Math.max(1, fromRect.height));

    const finishDock = () => {
      setFlipFlight(null);
      setDockedMsgId(targetMsgId);
      if (dockTimerRef.current !== null) {
        window.clearTimeout(dockTimerRef.current);
      }
      dockTimerRef.current = window.setTimeout(() => {
        setDockedMsgId((cur) => (cur === targetMsgId ? null : cur));
      }, 480);
    };

    if (typeof el.animate === 'function') {
      const anim = el.animate(
        [
          {
            transform: 'translate3d(0px, 0px, 0px) scale(1, 1)',
            borderRadius: '18px',
            opacity: 1,
          },
          {
            transform: `translate3d(${dx * 0.55}px, ${dy * 0.55 - 14}px, 0px) scale(${(1 + sx) * 0.48}, ${(1 + sy) * 0.48})`,
            borderRadius: '9999px',
            opacity: 0.98,
            offset: 0.55,
          },
          {
            transform: `translate3d(${dx}px, ${dy}px, 0px) scale(${sx}, ${sy})`,
            borderRadius: '9999px',
            opacity: 1,
          },
        ],
        {
          duration: 460,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards',
        }
      );
      anim.onfinish = finishDock;
      anim.oncancel = finishDock;
      return () => {
        try {
          anim.cancel();
        } catch {
          // Ignore
        }
      };
    }

    const fallbackTimer = window.setTimeout(finishDock, 120);
    return () => window.clearTimeout(fallbackTimer);
  }, [flipFlight]);

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
    const targetChatId = thread.chatId;
    const requestToken = `${targetChatId}:${Date.now()}`;
    activeSessionTokenRef.current = requestToken;

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
      setSending(true);
      setStreamingMsgId(null);

      // Character behavior: small nod on send, then transition into "thinking" pose while waiting
      setNodSeq((n) => n + 1);
      setCharacterPose('nod');
      nodTimerRef.current = window.setTimeout(() => {
        setCharacterPose((cur) => (cur === 'nod' ? 'thinking' : cur));
        nodTimerRef.current = null;
      }, 360);

      // Belt-and-suspenders safety timer: guarantee thinking state never exceeds 48s
      safetyTimerRef.current = window.setTimeout(() => {
        safetyTriggered = true;
        console.error(
          `[AI Mentor UI] safety timeout fired after 48s mentor=${targetMentor} depth=${depthId}`
        );
        try {
          controller.abort();
        } catch {
          // Ignore
        }
      }, 48_000);

      // Send only the last ~10 messages plus a short summary of earlier turns
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
        10
      );

      const result = await sendAiMentorMessage({
        mentor: targetMentor,
        depth: depthId,
        contents: apiContents,
        signal: controller.signal,
        stream: true,
        onDelta: (delta, fullText) => {
          if (activeSessionTokenRef.current !== requestToken) return;

          if (!firstTokenReceived) {
            firstTokenReceived = true;
            if (nodTimerRef.current !== null) {
              window.clearTimeout(nodTimerRef.current);
              nodTimerRef.current = null;
            }
            setStreamingMsgId(replyMsgId);
            setCharacterPose('speaking');
          }

          // Drive real-time viseme lip-sync from incoming streamed text
          setSpeechState((prev) => ({ seq: prev.seq + 1, chunk: delta }));

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

      // Capture FLIP "First" rect from the big hero character stage BEFORE it docks
      const heroRect = heroStageRef.current?.getBoundingClientRect() || null;

      const modelBubble: StoredAiMessage = {
        id: replyMsgId,
        role: 'model',
        text: result.text,
        isStreaming: false,
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
      setCharacterPose('idle');

      // Trigger FLIP fly-and-dock from Hero Stage -> small avatar slot beside this reply
      if (heroRect && heroRect.width > 20 && !shouldUseStaticPortraitFallback()) {
        const fromRect = {
          left: heroRect.left,
          top: heroRect.top,
          width: heroRect.width,
          height: heroRect.height,
        };
        requestAnimationFrame(() => {
          const targetSlot = avatarSlotRefs.current[replyMsgId];
          const toDomRect = targetSlot?.getBoundingClientRect();
          if (toDomRect && toDomRect.width > 0 && toDomRect.height > 0) {
            setFlipFlight({
              id: `flip_${replyMsgId}`,
              mentorId: targetMentor,
              targetMsgId: replyMsgId,
              fromRect,
              toRect: {
                left: toDomRect.left,
                top: toDomRect.top,
                width: toDomRect.width,
                height: toDomRect.height,
              },
            });
          }
        });
      }

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
        `[AI Mentor UI] sendPayload failed mentor=${targetMentor} depth=${depthId} safetyTriggered=${safetyTriggered}:`,
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
      if (nodTimerRef.current !== null) {
        window.clearTimeout(nodTimerRef.current);
        nodTimerRef.current = null;
      }
      if (inFlightAbortRef.current === controller) {
        inFlightAbortRef.current = null;
      }
      if (activeSessionTokenRef.current === requestToken) {
        setSending(false);
        setStreamingMsgId(null);
        setCharacterPose('idle');
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
        <div className="flex flex-1 min-w-0 flex-col min-h-0">
          {/* Header */}
          <header
            className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 pt-[calc(10px+env(safe-area-inset-top,0px))] lg:pt-3 pb-2.5"
            style={{
              backgroundColor: 'var(--bg)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {/* Left controls: Close (X) + History menu (mobile/tablet only) — borderless icon buttons */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close AI Mentors"
                title="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent cursor-pointer transition-all hover:bg-[var(--surface-hover)] active:scale-95 active:bg-[var(--surface-hover)]"
                style={{
                  color: 'var(--text)',
                }}
              >
                <X className="h-[20px] w-[20px]" />
              </button>

              <button
                type="button"
                onClick={() => setMobileHistoryOpen(true)}
                aria-label="Open chat history"
                title="Chat history"
                className="flex lg:hidden h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent cursor-pointer transition-all hover:bg-[var(--surface-hover)] active:scale-95 active:bg-[var(--surface-hover)]"
                style={{
                  color: 'var(--text)',
                }}
              >
                <Menu className="h-[20px] w-[20px]" />
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

            {/* Right controls: Temporary-chat toggle + New-chat pencil — borderless icon buttons */}
            <div className="flex items-center gap-0.5 shrink-0">
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
                style={{
                  color: 'var(--text)',
                }}
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

              {/* Hero Mentor Character Stage on fresh thread (tracks mouse/finger, breathes, blinks) */}
              {realHistoryCount === 0 && !sending && (
                <div className="flex flex-col items-center pt-1 pb-1">
                  <Suspense
                    fallback={
                      <div className="w-[138px] h-[184px] sm:w-[162px] sm:h-[216px] flex items-end justify-center">
                        <img
                          src={mentorProfile.bustWebp}
                          alt={mentor.name}
                          className="h-full w-full object-contain object-bottom"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    }
                  >
                    <LazyMentorCharacterStage
                      stageRef={heroStageRef}
                      mentorId={mentorId}
                      pose={characterPose}
                      nodSeq={nodSeq}
                      speechSeq={speechState.seq}
                      speechChunk={speechState.chunk}
                      size="hero"
                    />
                  </Suspense>
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

                const isActivelyStreamingMsg = Boolean(msg.isStreaming && streamingMsgId === msg.id);
                const isTargetOfFlight = flipFlight?.targetMsgId === msg.id;
                const isJustDocked = dockedMsgId === msg.id;

                return (
                  <div key={msg.id} className="space-y-2">
                    {/* Active Hero Character Stage while streaming this reply (lip-syncs, then FLIP-docks into the small avatar slot) */}
                    {isActivelyStreamingMsg && (
                      <div className="flex items-end gap-3 pl-1">
                        <Suspense
                          fallback={
                            <div className="w-[104px] h-[138px] sm:w-[116px] sm:h-[154px]">
                              <img
                                src={mentorProfile.bustWebp}
                                alt={mentor.name}
                                className="h-full w-full object-contain object-bottom"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          }
                        >
                          <LazyMentorCharacterStage
                            stageRef={heroStageRef}
                            mentorId={mentorId}
                            pose={characterPose}
                            nodSeq={nodSeq}
                            speechSeq={speechState.seq}
                            speechChunk={speechState.chunk}
                            size="compact"
                          />
                        </Suspense>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <span
                        ref={(el) => {
                          if (el) avatarSlotRefs.current[msg.id] = el;
                          else delete avatarSlotRefs.current[msg.id];
                        }}
                        className="mt-0.5 inline-flex shrink-0"
                      >
                        <MentorAvatar
                          mentorId={mentorId}
                          size={32}
                          hiddenForFlight={isTargetOfFlight || isActivelyStreamingMsg}
                          justDocked={isJustDocked}
                          eager={idx >= currentThread.messages.length - 3}
                        />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <AiMessageRenderer
                          text={msg.text}
                          accentColor={mentor.accent}
                          isGreeting={msg.isGreeting}
                          isError={msg.isError}
                          isStreaming={msg.isStreaming}
                          onRegenerate={
                            !msg.isGreeting && !msg.isError && !msg.isStreaming
                              ? () => handleRegenerate(idx)
                              : undefined
                          }
                          onRetry={msg.isError ? () => handleRetryError(idx) : undefined}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Nod -> Thinking Stage while waiting for first streamed token */}
              {sending && !streamingMsgId && (
                <div className="space-y-2" aria-live="polite">
                  <div className="flex items-end gap-3 pl-1">
                    <Suspense
                      fallback={
                        <div className="w-[104px] h-[138px] sm:w-[116px] sm:h-[154px]">
                          <img
                            src={mentorProfile.bustWebp}
                            alt={mentor.name}
                            className="h-full w-full object-contain object-bottom"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      }
                    >
                      <LazyMentorCharacterStage
                        stageRef={heroStageRef}
                        mentorId={mentorId}
                        pose={characterPose}
                        nodSeq={nodSeq}
                        speechSeq={speechState.seq}
                        speechChunk={speechState.chunk}
                        size="compact"
                      />
                    </Suspense>
                  </div>

                  <div className="flex items-center gap-3">
                    <MentorAvatar mentorId={mentorId} size={32} active eager />
                    <div
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px]"
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
            onSend={(text, atts) => void sendPayload(text, atts)}
            onOpenMentorPicker={() => setMentorPickerOpen(true)}
            onOpenDepthGauge={() => setDepthGaugeOpen(true)}
            onOpenPastPapers={handleOpenPastPapers}
            onOpenUpgrade={(reason) => {
              if (credits.plan !== 'plus') setUpgradeSheetReason(reason);
            }}
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
            `${depthLabel} thinking is unlocked on Boardly Pro (${plansConfig.pro.aiCreditsPerDay}/day) and Boardly Plus (${plansConfig.plus.aiCreditsPerDay}/day).`
          );
        }}
        onClose={() => setDepthGaugeOpen(false)}
      />

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

      {/* FLIP Fly-and-Dock Overlay Clone: flies Hero Character smoothly into the reply's small avatar slot */}
      {flipFlight && (() => {
        const flightProfile = getMentorCharacterProfile(flipFlight.mentorId);
        return (
          <div
            ref={flipCloneRef}
            key={flipFlight.id}
            aria-hidden="true"
            className="pointer-events-none fixed z-[10090] overflow-hidden will-change-transform"
            style={{
              left: flipFlight.fromRect.left,
              top: flipFlight.fromRect.top,
              width: flipFlight.fromRect.width,
              height: flipFlight.fromRect.height,
              borderRadius: '18px',
              boxShadow: `0 0 0 2px ${flightProfile.accentHex}, 0 10px 28px color-mix(in srgb, ${flightProfile.accentHex} 45%, rgba(0,0,0,0.6))`,
              backgroundColor: 'rgba(16, 16, 20, 0.72)',
            }}
          >
            <img
              src={flightProfile.avatarWebp}
              alt=""
              className="h-full w-full object-cover object-top"
              referrerPolicy="no-referrer"
            />
          </div>
        );
      })()}
    </div>
  );

  if (typeof document === 'undefined') return overlayContent;
  return createPortal(overlayContent, document.body);
};
