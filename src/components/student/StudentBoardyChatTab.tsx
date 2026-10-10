import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Plus, Menu, X, Bot, User as UserIcon, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BoardyMascot } from '../BoardyMascot';
import { MathText } from '../MathText';
import { PLAN_LIMITS, PlanType } from '../../data/planLimits';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface StudentBoardyChatTabProps {
  initialPrompt?: string;
  onOpenUsage?: () => void;
  onUpgrade?: () => void;
}

export const StudentBoardyChatTab: React.FC<StudentBoardyChatTabProps> = ({
  initialPrompt,
  onOpenUsage,
  onUpgrade,
}) => {
  const { profile, updateProfileData } = useAuth();
  const firstName = profile?.name?.trim().split(' ')[0] || 'Student';

  const userPlan: PlanType = (profile?.plan as PlanType) || 'starter';
  const planConfig = PLAN_LIMITS[userPlan] || PLAN_LIMITS.starter;
  const boardyUsedToday = profile?.boardyQuestionsUsedToday || 0;
  const boardyRemaining = Math.max(0, planConfig.boardyPerDay - boardyUsedToday);
  const isBoardyExhausted = boardyRemaining <= 0;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('boardly_boardy_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('boardly_boardy_chat_messages', JSON.stringify(messages));
    } catch {}
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Initial prompt trigger (e.g., from question review)
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const promptChips = [
    'Explain NUST Advance Maths question',
    'FAST negative marking strategy',
    'Solve an Integration MCQ step-by-step',
    'Review my last test mistakes',
  ];

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isTyping) return;

    if (isBoardyExhausted) {
      onUpgrade?.();
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Increment usage in profile
    const newUsed = boardyUsedToday + 1;
    updateProfileData({ boardyQuestionsUsedToday: newUsed }).catch(console.warn);

    try {
      // Call backend study-buddy or Boardy endpoint
      const res = await fetch('/api/study-buddy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userQuestion: text,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      let replyText = '';
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply || data.explanation || data.answer || '';
      }

      if (!replyText) {
        // Fallback intelligent step-by-step response if backend is offline
        replyText = generateLocalBoardyReply(text, firstName);
      }

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        role: 'assistant',
        content: generateLocalBoardyReply(text, firstName),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    localStorage.removeItem('boardly_boardy_chat_messages');
  };

  // Greeting
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-xl rounded-3xl overflow-hidden font-sans">
      {/* Top Bar */}
      <header className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Chat history"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <BoardyMascot size="sm" />
            <h1 className="font-extrabold text-base text-slate-900 tracking-tight">
              Boardy AI
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Daily questions allowance indicator */}
          <button
            type="button"
            onClick={onOpenUsage}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>
              {boardyRemaining} of {planConfig.boardyPerDay} questions left today
            </span>
          </button>

          <button
            type="button"
            onClick={handleNewChat}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="New chat"
            aria-label="New chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
            <BoardyMascot size="lg" withSparkle={true} />

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {greeting}, {firstName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                What are we studying today? Ask any MCQ, formula proof, or test-taking strategy.
              </p>
            </div>

            {/* Prompt Chips */}
            <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {promptChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 text-left text-xs font-semibold text-slate-700 hover:text-blue-900 shadow-sm transition-all cursor-pointer flex items-center justify-between group"
                >
                  <span className="line-clamp-2">{chip}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {!isUser ? (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <BoardyMascot size="sm" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {firstName[0]}
                  </div>
                )}

                <div
                  className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  <MathText text={m.content} />
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex gap-3 mr-auto max-w-md">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <BoardyMascot size="sm" />
            </div>
            <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/80 rounded-tl-none flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Boardy is writing out the step-by-step logic…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-3 sm:p-4 border-t border-slate-100 bg-white/90">
        {isBoardyExhausted ? (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span>You've used all {planConfig.boardyPerDay} Boardy questions for today.</span>
            <button
              type="button"
              onClick={onUpgrade}
              className="font-bold underline text-blue-700 hover:text-blue-900 cursor-pointer"
            >
              Upgrade to Steady Climb &rarr;
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Boardy anything (e.g. 'How do I solve Integration by parts?')"
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* History Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setShowDrawer(false)}
          />
          <div className="relative w-72 bg-white h-full shadow-2xl p-5 flex flex-col justify-between z-10 animate-slideRight">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-extrabold text-sm text-slate-900">Chat History</span>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleNewChat();
                  setShowDrawer(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-100"
              >
                <Plus className="w-4 h-4" />
                <span>Start New Topic</span>
              </button>

              <div className="space-y-1 text-xs text-slate-500 pt-2">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400 block pb-1">
                  Recent Topics
                </span>
                <div className="p-2 rounded-xl bg-slate-50 text-slate-700 font-medium">
                  Current Session ({messages.length} messages)
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
              Boardy AI is tuned for FSC & Pakistan entry exams. Step-by-step logic guaranteed.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helpful local generator for Boardy responses
function generateLocalBoardyReply(query: string, studentName: string): string {
  const q = query.toLowerCase();

  if (q.includes('fast') && q.includes('negative')) {
    return `Hey ${studentName}! Here is the exact negative marking strategy for **FAST-NU**:\n\n1. **Marking Rule**: Each correct MCQ is awarded **+1 mark**, while an incorrect answer loses **-0.25 marks** (25% penalty).\n2. **Threshold Rule**: Only guess if you can eliminate at least **2 out of 4 options**. If you can eliminate two choices, your statistical expected value is positive ($+0.375$).\n3. **Basic Math & Analytical**: Speed is crucial—do NOT get stuck on tricky analytical puzzles for more than 75 seconds. Skip and return at the end!`;
  }

  if (q.includes('integration') || q.includes('calculus') || q.includes('math')) {
    return `Let's break down this concept step-by-step, ${studentName}! 🚀\n\n### Step 1: Identify the standard form\nLook for the derivative of the inner function. Remember:\n$$\\int [f(x)]^n f'(x) dx = \\frac{[f(x)]^{n+1}}{n+1} + C$$\n\n### Step 2: Integration by parts rule (ILATE)\nIf you have a product of two functions:\n$$\\int u \\cdot v dx = u \\int v dx - \\int \\left( u' \\int v dx \\right) dx$$\nChoose $u$ in order of: **I**nverse, **L**ogarithmic, **A**lgebraic, **T**rigonometric, **E**xponential.\n\nWould you like me to work through a specific question with you? Send the question options!`;
  }

  if (q.includes('nust') || q.includes('net')) {
    return `For **NUST NET**, speed is king! 👑\n\n- **NET Structure**: 200 MCQs in 180 minutes (80 Advance Maths, 60 Physics, 30 Chemistry/CS, 20 English, 10 Intelligence).\n- **Key Advantage**: **NO negative marking!** You must mark an answer for every single question before time runs out.\n- Focus heavily on Conic Sections, Vectors, Trigonometry, and Differentiation in Advance Maths—they make up over 55% of the math section.`;
  }

  return `Great question, ${studentName}! Here is the concept broken down step-by-step:\n\n1. **Core Concept**: First isolate the given variables and identify which formula connects them.\n2. **Shortcut Technique**: For entry tests, look at the units in the options and test extreme values ($x=0$ or $x=1$) to eliminate distractors instantly.\n3. **Exam Tip**: Double check the sign ($+$ vs $-$) since examiners often place common calculation mistakes in Option B.\n\nTell me which specific problem or question statement you'd like to solve next!`;
}
