import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Menu,
  X,
  Send,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  ArrowDown,
  ChevronDown,
  Search,
  Plus,
  ArrowLeft,
  Trash2,
  Edit2,
  BookOpen,
  Zap,
  HeartHandshake,
  Compass,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUsage } from '../../context/UsageContext';
import { BoardyMascot } from '../BoardyMascot';
import { StudyBuddyFormattedMessage } from '../StudyBuddyFormattedMessage';
import { MathText } from '../MathText';
import {
  BOARDY_MODES,
  BoardyMode,
  buildBoardySystemPrompt,
  getBoardyModel
} from '../../config/boardyConfig';
import { db } from '../../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  limit
} from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: BoardyMode;
  createdAt: string;
  failed?: boolean;
  feedback?: 'up' | 'down' | null;
}

export interface ChatSession {
  id: string;
  title: string;
  mode: BoardyMode;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface StudentBoardyChatTabProps {
  initialPrompt?: string;
  onOpenUsage?: () => void;
  onUpgrade?: () => void;
  onBackToDashboard?: () => void;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
  isFullScreen?: boolean;
}

export const StudentBoardyChatTab: React.FC<StudentBoardyChatTabProps> = ({
  initialPrompt,
  onOpenUsage,
  onUpgrade,
  onBackToDashboard,
  onInputFocus,
  onInputBlur,
  isFullScreen = true,
}) => {
  const { user, profile, isAdmin, updateProfileData } = useAuth();
  const {
    loading: usageLoading,
    isUnlimited,
    aiChatsLimit,
    aiChatsUsed,
    aiChatsLeft,
    canSendAiMessage,
    consumeAiChatReply,
  } = useUsage();

  // Bug 5 fix: Always greet the user using their profile first name, not generic "Admin"
  const firstName =
    profile?.name?.trim().split(' ')[0] ||
    user?.displayName?.trim().split(' ')[0] ||
    (isAdmin ? 'Admin' : 'Student');

  const targetTest = profile?.targetUniversity || profile?.testTrack || '';

  // Mode Selection
  const [activeMode, setActiveMode] = useState<BoardyMode>(() => {
    if (profile?.lastBoardyMode) return profile.lastBoardyMode as BoardyMode;
    try {
      const saved = localStorage.getItem('boardly_last_boardy_mode') as BoardyMode;
      if (saved && ['deep-dive', 'quick-take', 'study-pal', 'game-plan'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'deep-dive';
  });

  const [isModePickerOpen, setIsModePickerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionMenuId, setSessionMenuId] = useState<string | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('boardly_boardy_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const lastId = localStorage.getItem('boardly_active_boardy_session_id');
      if (lastId) return lastId;
    } catch {}
    return `session-${Date.now()}`;
  });

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  const messages = useMemo(() => {
    return activeSession?.messages || [];
  }, [activeSession]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modePickerRef = useRef<HTMLDivElement>(null);

  // Load chat sessions from Firestore on mount
  useEffect(() => {
    if (!user?.uid) return;
    const loadFromDb = async () => {
      try {
        const chatsRef = collection(db, 'users', user.uid, 'boardyChats');
        const q = query(chatsRef, orderBy('updatedAt', 'desc'), limit(30));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const loaded: ChatSession[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
          setSessions(loaded);
          localStorage.setItem('boardly_boardy_sessions', JSON.stringify(loaded));
          // Restore last active session if valid
          if (loaded.length > 0 && !loaded.some((s) => s.id === activeSessionId)) {
            setActiveSessionId(loaded[0].id);
          }
        }
      } catch (err) {
        console.warn('[Boardy] Firestore chats load notice:', err);
      }
    };
    loadFromDb();
  }, [user?.uid]);

  // Save active session ID to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('boardly_active_boardy_session_id', activeSessionId);
    } catch {}
  }, [activeSessionId]);

  // Persist sessions to localStorage and Firestore
  const saveSessionState = useCallback((updatedSessions: ChatSession[], targetSession?: ChatSession) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem('boardly_boardy_sessions', JSON.stringify(updatedSessions));
    } catch {}

    if (user?.uid && targetSession) {
      const docRef = doc(db, 'users', user.uid, 'boardyChats', targetSession.id);
      setDoc(docRef, targetSession, { merge: true }).catch((e) => {
        console.warn('[Boardy] Sync session doc notice:', e);
      });
    }
  }, [user?.uid]);

  // Close mode picker on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (modePickerRef.current && !modePickerRef.current.contains(e.target as Node)) {
        setIsModePickerOpen(false);
      }
    };
    if (isModePickerOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isModePickerOpen]);

  // Auto-scroll logic with scroll detection
  // Auto-scroll logic with scroll position saving and restoration
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    // Only auto-scroll to bottom if user is already near bottom or receiving new messages
    const el = chatScrollContainerRef.current;
    if (el) {
      const isUp = el.scrollHeight - el.scrollTop - el.clientHeight > 160;
      if (!isUp) {
        scrollToBottom(true);
      }
    } else {
      scrollToBottom(true);
    }
  }, [messages.length, isTyping, scrollToBottom]);

  // Restore scroll position on active session switch
  useEffect(() => {
    const el = chatScrollContainerRef.current;
    if (!el) return;
    try {
      const saved = sessionStorage.getItem(`boardly_scroll_${activeSessionId}`);
      if (saved !== null) {
        const top = Number(saved);
        if (!isNaN(top) && top > 0) {
          el.scrollTop = top;
          return;
        }
      }
    } catch {}
    scrollToBottom(false);
  }, [activeSessionId, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = chatScrollContainerRef.current;
    if (!el) return;
    const isUp = el.scrollHeight - el.scrollTop - el.clientHeight > 140;
    setShowScrollBottom(isUp);
    try {
      sessionStorage.setItem(`boardly_scroll_${activeSessionId}`, String(el.scrollTop));
    } catch {}
  }, [activeSessionId]);

  // Update mode selection and save to profile & localStorage
  const handleSelectMode = (mode: BoardyMode) => {
    setActiveMode(mode);
    setIsModePickerOpen(false);
    try {
      localStorage.setItem('boardly_last_boardy_mode', mode);
    } catch {}
    updateProfileData({ lastBoardyMode: mode }).catch(() => {});
  };

  // Create a brand new chat
  const handleStartNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'New Study Chat',
      mode: activeMode,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newSession, ...sessions];
    saveSessionState(updated, newSession);
    setActiveSessionId(newId);
    setInputValue('');
    setIsSidebarOpen(false);
  };

  // Rename a chat
  const handleSaveRename = (sessionId: string) => {
    if (!renameTitleInput.trim()) return;
    const updated = sessions.map((s) => {
      if (s.id === sessionId) {
        const mod = { ...s, title: renameTitleInput.trim(), updatedAt: new Date().toISOString() };
        if (user?.uid) {
          setDoc(doc(db, 'users', user.uid, 'boardyChats', sessionId), { title: mod.title }, { merge: true }).catch(() => {});
        }
        return mod;
      }
      return s;
    });
    setSessions(updated);
    try {
      localStorage.setItem('boardly_boardy_sessions', JSON.stringify(updated));
    } catch {}
    setRenamingSessionId(null);
    setSessionMenuId(null);
  };

  // Delete a chat with confirmation
  const handleDeleteSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    try {
      localStorage.setItem('boardly_boardy_sessions', JSON.stringify(updated));
    } catch {}

    if (user?.uid) {
      deleteDoc(doc(db, 'users', user.uid, 'boardyChats', sessionId)).catch(() => {});
    }

    if (activeSessionId === sessionId) {
      const nextId = updated[0]?.id || `session-${Date.now()}`;
      setActiveSessionId(nextId);
    }
    setDeleteConfirmId(null);
    setSessionMenuId(null);
  };

  // Generate an auto title from the first message
  const generateAutoTitle = (text: string): string => {
    const cleaned = text.replace(/[$*#_]/g, '').trim();
    if (cleaned.length <= 36) return cleaned;
    return cleaned.slice(0, 36).trim() + '…';
  };

  // Send message execution
  const executeSendMessage = async (textToSend: string, isRetry = false) => {
    const text = textToSend.trim();
    if (!text || isTyping) return;

    // Check usage blocking via shared usage store
    if (!canSendAiMessage()) {
      if (onUpgrade) onUpgrade();
      return;
    }

    const currentSession = sessions.find((s) => s.id === activeSessionId) || {
      id: activeSessionId,
      title: generateAutoTitle(text),
      mode: activeMode,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let sessionMessages = [...currentSession.messages];

    // If retrying, remove failed assistant message
    if (isRetry) {
      sessionMessages = sessionMessages.filter((m) => !m.failed);
    } else {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      };
      sessionMessages.push(userMsg);
    }

    // Auto title if first message
    const hasPreviousUserMessages = currentSession.messages.some((m) => m.role === 'user');
    const autoTitle = hasPreviousUserMessages ? currentSession.title : generateAutoTitle(text);

    const updatedSession: ChatSession = {
      ...currentSession,
      title: autoTitle,
      mode: activeMode,
      messages: sessionMessages,
      updatedAt: new Date().toISOString(),
    };

    const nextSessions = [
      updatedSession,
      ...sessions.filter((s) => s.id !== activeSessionId),
    ];
    saveSessionState(nextSessions, updatedSession);

    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsTyping(true);

    // Development mode logging: mode & first 80 chars of system prompt per request
    const sysPrompt = buildBoardySystemPrompt(activeMode, targetTest, firstName);
    if (import.meta.env.DEV) {
      console.log(`[Boardy Dev Request] Mode: ${activeMode} | Prompt prefix: "${sysPrompt.slice(0, 80)}..."`);
    }

    try {
      // Build conversation history payload
      const historyPayload = sessionMessages
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch('/api/boardy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          mode: activeMode,
          history: historyPayload,
          targetExam: targetTest,
          studentName: firstName,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.reply) {
        throw new Error(data?.error || 'Empty response received');
      }

      // Successfully produced answer: atomically consume AI chat quota
      await consumeAiChatReply();

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        mode: (data.mode as BoardyMode) || activeMode,
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...sessionMessages, aiMsg];
      const finalSession: ChatSession = {
        ...updatedSession,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      };

      const finalSessionsList = [
        finalSession,
        ...sessions.filter((s) => s.id !== activeSessionId),
      ];
      saveSessionState(finalSessionsList, finalSession);
    } catch (err) {
      console.error('[Boardy Chat error]:', err);
      // Failed request: Show error message. A failed request does NOT consume a chat quota.
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Something went wrong. Tap to retry.',
        mode: activeMode,
        failed: true,
        createdAt: new Date().toISOString(),
      };

      const errorMessages = [...sessionMessages, errorMsg];
      const errorSession: ChatSession = {
        ...updatedSession,
        messages: errorMessages,
        updatedAt: new Date().toISOString(),
      };

      const errorSessionsList = [
        errorSession,
        ...sessions.filter((s) => s.id !== activeSessionId),
      ];
      saveSessionState(errorSessionsList, errorSession);
    } finally {
      setIsTyping(false);
    }
  };

  // Initial prompt trigger (e.g. from reviewing test question)
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      executeSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  // Copy message text
  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {}
  };

  // Feedback thumb click
  const handleFeedback = (msgId: string, feedback: 'up' | 'down') => {
    if (!activeSession) return;
    const updatedMessages = activeSession.messages.map((m) => {
      if (m.id === msgId) {
        return { ...m, feedback: m.feedback === feedback ? null : feedback };
      }
      return m;
    });
    const updated = { ...activeSession, messages: updatedMessages };
    saveSessionState(
      sessions.map((s) => (s.id === activeSession.id ? updated : s)),
      updated
    );
  };

  // Regenerate last user response
  const handleRegenerate = (aiMsgIndex: number) => {
    if (!activeSession) return;
    const previousUserMsg = [...activeSession.messages.slice(0, aiMsgIndex)]
      .reverse()
      .find((m) => m.role === 'user');
    if (previousUserMsg) {
      executeSendMessage(previousUserMsg.content, true);
    }
  };

  // Four Suggestions tailored to student target test
  const suggestions = useMemo(() => {
    return [
      {
        subject: 'Physics',
        color: 'bg-sky-100 text-sky-800 border-sky-200',
        prompt: 'Why does a heavier object not fall faster?',
      },
      {
        subject: 'Math',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        prompt: 'Solve $\\int x e^x dx$ step-by-step using integration by parts',
      },
      {
        subject: 'Chemistry',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        prompt: 'How do conjugate acid-base pairs work with examples?',
      },
      {
        subject: 'Strategy',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        prompt: targetTest
          ? `Best time management strategy for ${targetTest} MCQs?`
          : 'How to manage time and negative marking in university entrance tests?',
      },
    ];
  }, [targetTest]);

  // Greeting time-of-day
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Filtered session list for sidebar
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [sessions, searchQuery]);

  // Grouped sessions by Today, Yesterday, Previous 7 days, Older
  const groupedSessions = useMemo(() => {
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const prev7Days: ChatSession[] = [];
    const older: ChatSession[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOf7Days = startOfToday - 7 * 86400000;

    filteredSessions.forEach((s) => {
      const time = new Date(s.updatedAt || s.createdAt).getTime();
      if (time >= startOfToday) {
        today.push(s);
      } else if (time >= startOfYesterday) {
        yesterday.push(s);
      } else if (time >= startOf7Days) {
        prev7Days.push(s);
      } else {
        older.push(s);
      }
    });

    return { today, yesterday, prev7Days, older };
  }, [filteredSessions]);

  const activeModeInfo = BOARDY_MODES.find((m) => m.id === activeMode) || BOARDY_MODES[0];

  const getModeIcon = (modeId: BoardyMode) => {
    switch (modeId) {
      case 'quick-take':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'study-pal':
        return <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />;
      case 'game-plan':
        return <Compass className="w-3.5 h-3.5 text-teal-500" />;
      case 'deep-dive':
      default:
        return <BookOpen className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  const hasMessages = messages.length > 0;

  // Remaining AI chat count line wording from shared usage store
  const aiChatsLineText = useMemo(() => {
    if (usageLoading) return 'Checking today\'s limit…';
    if (isUnlimited) return 'Unlimited AI chats';
    if (typeof aiChatsLeft === 'number') {
      if (aiChatsLeft === 0) {
        return `0 of ${aiChatsLimit} AI chats left today · Resets at midnight (PKT)`;
      }
      return `${aiChatsLeft} of ${aiChatsLimit} AI chats left today`;
    }
    return 'Unlimited AI chats';
  }, [usageLoading, isUnlimited, aiChatsLeft, aiChatsLimit]);

  return (
    <div className="fixed inset-0 z-50 bg-[#FAFAFC] text-[#0d1b3e] flex flex-col overflow-hidden font-sans select-text">
      {/* ========================================================================= */}
      {/* 1. TOP CONTROL: ONLY a hamburger button at top-right with soft background */}
      {/* ========================================================================= */}
      <div className="fixed top-3 right-3 z-30 pt-safe">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="p-2.5 rounded-2xl bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 shadow-sm backdrop-blur-md cursor-pointer transition-all active:scale-95 flex items-center justify-center"
          aria-label="Open chats sidebar"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. CHAT CONTENT OR EMPTY STATE                                            */}
      {/* ========================================================================= */}
      {!hasMessages ? (
        /* ------------------ EMPTY STATE (VERTICALLY CENTERED, CARD-LESS) ------------------ */
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4 text-center my-auto py-8 overflow-y-auto">
          {/* Centered Boardy Mascot */}
          <BoardyMascot size={78} animated />

          {/* Large bold greeting */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0d1b3e] tracking-tight mt-4">
            {timeGreeting}, {firstName}
          </h1>
          <p className="text-sm sm:text-base font-semibold text-slate-500 mt-1">
            What are we studying today?
          </p>

          {/* Large heavily rounded "pill" shaped input box with soft light shadow and purple focus ring */}
          <div className="w-full max-w-xl mt-7 rounded-[28px] bg-white border border-slate-200/90 shadow-sm hover:shadow-md focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all p-4 flex flex-col gap-2 relative text-left">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  executeSendMessage(inputValue);
                }
              }}
              placeholder={
                targetTest
                  ? `Ask Boardy anything about your ${targetTest} prep…`
                  : 'Ask Boardy anything about your test prep…'
              }
              className="w-full bg-transparent border-0 outline-none resize-none text-sm text-[#0d1b3e] placeholder:text-slate-400 min-h-[50px]"
            />

            {/* Bottom row inside input box: Mode chip (bottom-left), Send button (bottom-right) */}
            <div className="flex items-center justify-between pt-1 relative">
              {/* Mode chip */}
              <div className="relative" ref={modePickerRef}>
                <button
                  type="button"
                  onClick={() => setIsModePickerOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-xs font-semibold text-slate-700 transition-all duration-200 cursor-pointer select-none"
                >
                  {getModeIcon(activeMode)}
                  <span>{activeModeInfo.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Mode Selector Dropdown: icon left, bold title, smaller lighter grey description strictly on line below, checkmark on right */}
                {isModePickerOpen && (
                  <div className="absolute bottom-full left-0 mb-2.5 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 origin-bottom-left animate-scale-in">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">
                      Choose Teaching Mode
                    </p>
                    <div className="space-y-1">
                      {BOARDY_MODES.map((m) => {
                        const isSelected = activeMode === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSelectMode(m.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                              isSelected ? 'bg-indigo-50/80 text-indigo-950 font-medium' : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0 pr-2">
                              <div className="mt-0.5 shrink-0">{getModeIcon(m.id)}</div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold leading-snug">{m.name}</p>
                                <p className="text-[11px] text-slate-400 leading-normal mt-0.5">{m.description || m.tagline}</p>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Round Send Button: arrow icon in circular background */}
              <button
                type="button"
                disabled={!inputValue.trim() || isTyping}
                onClick={() => executeSendMessage(inputValue)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  inputValue.trim() && !isTyping
                    ? 'bg-indigo-600 hover:bg-indigo-700 hover:brightness-105 active:scale-95 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
                }`}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Small grey line with remaining AI chats (from shared usage store) */}
          <p className="text-[11px] text-slate-400 font-medium mt-3">
            {aiChatsLineText}
          </p>

          {/* Four Suggestion Rows: flat list, colored subject label on left, prompt on right, very thin subtle dividers */}
          <div className="w-full max-w-xl mt-6 divide-y divide-slate-100 text-left border-t border-b border-slate-100">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => executeSendMessage(s.prompt)}
                className="w-full py-3.5 px-1 flex items-center gap-3.5 hover:bg-slate-100/50 transition-colors text-left cursor-pointer group"
              >
                <span className="text-[11px] font-bold text-indigo-600 shrink-0 tracking-wide">
                  {s.subject}
                </span>
                <span className="text-xs sm:text-sm text-slate-700 group-hover:text-slate-900 font-normal line-clamp-1 flex-1">
                  <MathText text={s.prompt} />
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ------------------ ACTIVE CHAT INTERFACE ------------------ */
        <div
          ref={chatScrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-6 pt-16 pb-36 max-w-3xl mx-auto w-full space-y-6"
        >
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                {isUser ? (
                  /* User message: soft light purple/grey background with dark text, rounded corners with bottom-right corner sharper */
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-xs px-4 py-3 bg-[#EEF2F6] text-[#0d1b3e] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words border border-slate-200/40">
                    {msg.content}
                  </div>
                ) : (
                  /* AI reply: plain text with small mascot, full width */
                  <div className="w-full max-w-full space-y-2">
                    <div className="flex items-center gap-2">
                      <BoardyMascot size="sm" />
                      <span className="text-xs font-bold text-slate-800">Boardy</span>
                      {msg.mode && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/60">
                          {getModeIcon(msg.mode)}
                          <span>{BOARDY_MODES.find((m) => m.id === msg.mode)?.name || 'Deep Dive'}</span>
                        </span>
                      )}
                    </div>

                    {msg.failed ? (
                      /* Failed request state with retry button: does NOT consume chat */
                      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-rose-800 text-xs">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Something went wrong. Tap to retry.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRegenerate(index)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs shrink-0"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      /* Successful AI formatted message with KaTeX */
                      <div className="text-slate-800 text-xs sm:text-sm leading-relaxed pl-1">
                        <StudyBuddyFormattedMessage content={msg.content} />
                      </div>
                    )}

                    {/* Actions under each AI reply: Copy, Regenerate, Thumbs up/down, Mode label */}
                    {!msg.failed && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pl-1">
                        <div className="flex items-center gap-1 text-slate-400">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                            title="Copy reply"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRegenerate(index)}
                            className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                            title="Regenerate answer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.id, 'up')}
                            className={`p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer transition-colors ${
                              msg.feedback === 'up' ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleFeedback(msg.id, 'down')}
                            className={`p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer transition-colors ${
                              msg.feedback === 'down' ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {msg.mode && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500 border border-slate-200/60 select-none">
                            {getModeIcon(msg.mode)}
                            <span>{BOARDY_MODES.find((m) => m.id === msg.mode)?.name || 'Deep Dive'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 pl-1 text-slate-500 animate-fade-in">
              <BoardyMascot size="sm" />
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-dot-pulse-1" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-dot-pulse-2" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-dot-pulse-3" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && hasMessages && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-24 right-5 p-2 rounded-full bg-white shadow-lg border border-slate-200 text-slate-700 hover:text-slate-900 cursor-pointer z-30 transition-transform active:scale-95"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* ========================================================================= */}
      {/* 3. PINNED BOTTOM INPUT BAR (WHEN IN ACTIVE CHAT)                          */}
      {/* ========================================================================= */}
      {hasMessages && (
        <div className="fixed bottom-0 left-0 right-0 px-3 sm:px-4 pt-3 pb-safe bg-[#FAFAFC]/95 backdrop-blur-md border-t border-slate-200/60 z-30" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 16px))' }}>
          <div className="max-w-3xl mx-auto w-full">
            <div className="rounded-[24px] bg-white border border-slate-200 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 p-2.5 flex flex-col gap-1.5 relative transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    executeSendMessage(inputValue);
                  }
                }}
                placeholder="Message Boardy…"
                className="w-full bg-transparent border-0 outline-none resize-none text-xs sm:text-sm text-[#0d1b3e] placeholder:text-slate-400 px-2 py-1 max-h-32"
              />

              <div className="flex items-center justify-between px-1 relative">
                {/* Mode Selector chip */}
                <div className="relative" ref={modePickerRef}>
                  <button
                    type="button"
                    onClick={() => setIsModePickerOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-[11px] font-bold text-slate-700 cursor-pointer transition-all duration-200"
                  >
                    {getModeIcon(activeMode)}
                    <span>{activeModeInfo.name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* Mode Picker Popup - floats completely above input box with 10px offset & high z-index */}
                  {isModePickerOpen && (
                    <div className="absolute bottom-full left-0 mb-2.5 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 z-50 origin-bottom-left animate-scale-in">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">
                        Choose Teaching Mode
                      </p>
                      <div className="space-y-1">
                        {BOARDY_MODES.map((m) => {
                          const isSelected = activeMode === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSelectMode(m.id)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                                isSelected ? 'bg-indigo-50/80 text-indigo-950 font-medium' : 'hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0 pr-2">
                                <div className="mt-0.5 shrink-0">{getModeIcon(m.id)}</div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold leading-snug">{m.name}</p>
                                  <p className="text-[11px] text-slate-400 leading-normal mt-0.5">{m.description || m.tagline}</p>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Round Send Button */}
                <button
                  type="button"
                  disabled={!inputValue.trim() || isTyping}
                  onClick={() => executeSendMessage(inputValue)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    inputValue.trim() && !isTyping
                      ? 'bg-indigo-600 hover:bg-indigo-700 hover:brightness-105 text-white shadow-xs active:scale-95'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
                  }`}
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Small usage line under pinned input with proper spacing */}
            <p className="text-[10px] text-slate-400 font-medium text-center mt-2 mb-0.5 select-none">
              {aiChatsLineText}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SLIDE-IN SIDEBAR OVER DIMMED BACKGROUND                                 */}
      {/* ========================================================================= */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-start animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            className="w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between p-4 animate-slide-in-left duration-250 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top section: Logo, Boardy AI, Close, New Chat, Search */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BoardyMascot size="sm" />
                  <span className="font-extrabold text-base text-[#0d1b3e] tracking-tight">Boardy AI</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* New chat button */}
              <button
                type="button"
                onClick={handleStartNewChat}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>New chat</span>
              </button>

              {/* Search chats input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats…"
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Middle section: Past chats grouped Today, Yesterday, Previous 7 days, Older */}
            <div className="flex-1 overflow-y-auto py-3 space-y-4 my-2 pr-1">
              {filteredSessions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Your chats will show up here.
                </div>
              ) : (
                <>
                  {/* Today */}
                  {groupedSessions.today.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2">
                        Today
                      </p>
                      {groupedSessions.today.map((s) => renderSessionItem(s))}
                    </div>
                  )}

                  {/* Yesterday */}
                  {groupedSessions.yesterday.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2">
                        Yesterday
                      </p>
                      {groupedSessions.yesterday.map((s) => renderSessionItem(s))}
                    </div>
                  )}

                  {/* Previous 7 Days */}
                  {groupedSessions.prev7Days.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2">
                        Previous 7 days
                      </p>
                      {groupedSessions.prev7Days.map((s) => renderSessionItem(s))}
                    </div>
                  )}

                  {/* Older */}
                  {groupedSessions.older.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2">
                        Older
                      </p>
                      {groupedSessions.older.map((s) => renderSessionItem(s))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom section: Back to dashboard, avatar, name, and usage progress line */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              {/* Back to dashboard button (Main way back to the rest of the app) */}
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  if (onBackToDashboard) {
                    onBackToDashboard();
                  } else if (typeof window !== 'undefined') {
                    window.history.back();
                  }
                }}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span>Back to dashboard</span>
              </button>

              {/* User Avatar + Name */}
              <div className="flex items-center gap-2.5 px-1">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{profile?.name || firstName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || 'Student Account'}</p>
                </div>
              </div>

              {/* Usage line with thin progress bar from shared usage store */}
              <div className="pt-2 pb-1 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>
                    {isUnlimited
                      ? 'Unlimited AI chats'
                      : typeof aiChatsLeft === 'number'
                      ? `${aiChatsLeft} of ${aiChatsLimit} AI chats left today`
                      : 'Checking limits…'}
                  </span>
                </div>
                {!isUnlimited && (
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          typeof aiChatsLimit === 'number' && aiChatsLimit > 0
                            ? Math.min(100, Math.round(((aiChatsLimit - (Number(aiChatsLeft) || 0)) / aiChatsLimit) * 100))
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                )}
                <p className="text-[10px] text-slate-400">
                  {isUnlimited ? 'Premium plan' : 'Resets at midnight (PKT)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render an individual session item in the sidebar
  function renderSessionItem(s: ChatSession) {
    const isActive = s.id === activeSessionId;
    const isMenuOpen = sessionMenuId === s.id;
    const isRenaming = renamingSessionId === s.id;
    const isConfirmingDelete = deleteConfirmId === s.id;

    if (isRenaming) {
      return (
        <div key={s.id} className="p-1.5 rounded-xl bg-slate-100 flex items-center gap-1.5">
          <input
            type="text"
            value={renameTitleInput}
            onChange={(e) => setRenameTitleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRename(s.id);
              if (e.key === 'Escape') setRenamingSessionId(null);
            }}
            autoFocus
            className="w-full bg-white px-2 py-1 rounded-lg text-xs border border-indigo-300 outline-none"
          />
          <button
            type="button"
            onClick={() => handleSaveRename(s.id)}
            className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setRenamingSessionId(null)}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    if (isConfirmingDelete) {
      return (
        <div key={s.id} className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1.5">
          <p className="text-rose-800 font-semibold text-[11px]">Delete this chat?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDeleteSession(s.id)}
              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirmId(null)}
              className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={s.id}
        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl transition-colors cursor-pointer ${
          isActive ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
        }`}
        onClick={() => {
          setActiveSessionId(s.id);
          setIsSidebarOpen(false);
        }}
      >
        <span className="text-xs truncate flex-1 pr-2">{s.title}</span>

        {/* Action Menu (Rename / Delete) */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSessionMenuId(isMenuOpen ? null : s.id);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 opacity-80 group-hover:opacity-100 cursor-pointer"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-50 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setRenamingSessionId(s.id);
                  setRenameTitleInput(s.title);
                  setSessionMenuId(null);
                }}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-slate-500" />
                <span>Rename</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId(s.id);
                  setSessionMenuId(null);
                }}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
};
