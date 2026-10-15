import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Zap,
  Target,
  RefreshCw,
  BookOpen,
  MessageSquare,
  Clock,
  ShieldAlert,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db, logFirestoreError } from '../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MathText } from '../ui/MathText';
import { ErrorState } from '../ui/ErrorState';
import { getKarachiTodayString, getPlanConfig } from '../../data/planLimits';

interface ChatMessage {
  id: string;
  sender: 'user' | 'boardy';
  text: string;
  timestamp: string;
  mode?: string;
}

export const BoardyAiTutorView: React.FC = () => {
  const { user, profile } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-welcome',
        sender: 'boardy',
        text: `Salam ${profile?.name?.split(' ')[0] || 'there'}! 🎓 I am **Boardy**, your 24/7 AI tutor for Pakistani university entrance tests.\n\nAsk me any concept, past paper numerical, or formula derivation from **Mathematics**, **Physics**, or **Chemistry**. I'll break it down step-by-step with full KaTeX derivations!`,
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [inputText, setInputText] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<'deep-dive' | 'quick-take' | 'study-pal' | 'game-plan'>('deep-dive');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Daily AI limit tracking in PKT timezone
  const todayPkt = getKarachiTodayString();
  const planConfig = getPlanConfig(profile?.plan);
  const [aiPromptsUsed, setAiPromptsUsed] = useState<number>(() => {
    return profile?.boardyQuestionsUsedToday || 0;
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load real daily AI usage from users/{uid}/usage/{todayPkt}
  useEffect(() => {
    if (!user?.uid) return;
    const usageDocRef = doc(db, 'users', user.uid, 'usage', todayPkt);
    getDoc(usageDocRef)
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setAiPromptsUsed(data.boardyQuestionsAsked ?? data.boardyUsed ?? 0);
        }
      })
      .catch((err) => {
        logFirestoreError(`users/${user.uid}/usage/${todayPkt}`, err, 'fetch_ai_usage');
      });
  }, [user?.uid, todayPkt]);

  const isLimitReached = aiPromptsUsed >= planConfig.boardyPerDay && planConfig.boardyPerDay < 999;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    if (isLimitReached) {
      setErrorMessage(`Daily limit reached (${planConfig.boardyPerDay} questions for ${planConfig.name} plan). Quota resets at midnight PKT.`);
      return;
    }

    const userText = inputText.trim();
    const userMsgId = `user_${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString(),
      mode: selectedMode,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Get Firebase ID token
      const idToken = await user?.getIdToken(true);
      if (!idToken) {
        throw new Error('Authentication required. Please re-login.');
      }

      // 2. Call Cloudflare Pages Function /api/ai-tutor
      const res = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          prompt: userText,
          mode: selectedMode,
          targetExam: profile?.targetUniversity ? `${profile.targetUniversity} Entrance Exam` : 'FAST / NUST / MDCAT',
          studentName: profile?.name || 'Student',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      const botReply = data.reply || 'Could not parse response. Please retry.';

      const botMsgId = `boardy_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: 'boardy',
          text: botReply,
          timestamp: new Date().toISOString(),
          mode: selectedMode,
        },
      ]);

      // 3. Increment daily usage in users/{uid}/usage/{todayPkt}
      if (user?.uid) {
        const usageRef = doc(db, 'users', user.uid, 'usage', todayPkt);
        await runTransaction(db, async (txn) => {
          const snap = await txn.get(usageRef);
          if (snap.exists()) {
            const cur = snap.data().boardyQuestionsAsked ?? snap.data().boardyUsed ?? 0;
            txn.update(usageRef, {
              boardyQuestionsAsked: cur + 1,
              lastUpdated: new Date().toISOString(),
            });
          } else {
            txn.set(usageRef, {
              testsTaken: 0,
              boardyQuestionsAsked: 1,
              questionsAnswered: 0,
              dateStr: todayPkt,
              createdAt: serverTimestamp(),
            });
          }
        }).catch(console.warn);

        setAiPromptsUsed((prev) => prev + 1);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error communicating with Boardy AI service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] tracking-tight font-display flex items-center gap-2">
            <span>Boardy AI Step-by-Step Tutor</span>
            <Sparkles className="w-6 h-6 text-[var(--brand-2)]" />
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Trained on Pakistani entry test curricula with complete mathematical derivation proofs.
          </p>
        </div>

        {/* Quota Badge */}
        <div className="flex items-center gap-2">
          <Badge variant={isLimitReached ? 'danger' : 'student'} size="sm" className="font-mono">
            {planConfig.boardyPerDay >= 999
              ? 'Unlimited AI Queries'
              : `${aiPromptsUsed} / ${planConfig.boardyPerDay} Prompts Today`}
          </Badge>
        </div>
      </div>

      {errorMessage && (
        <ErrorState
          title="Boardy AI Notice"
          error={errorMessage}
          onRetry={() => handleSendMessage()}
        />
      )}

      {/* Mode Selector Strip */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/8 pb-3">
        {[
          { id: 'deep-dive', label: 'Deep Dive Derivations', desc: 'Step-by-step proofs' },
          { id: 'quick-take', label: 'Quick Take', desc: 'Short takeaway & answer' },
          { id: 'study-pal', label: 'Study Pal', desc: 'Encouraging peer support' },
          { id: 'game-plan', label: 'Game Plan', desc: 'Pacing & test tricks' },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedMode(m.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedMode === m.id
                ? 'bg-[var(--brand)] text-white shadow-md shadow-blue-600/30'
                : 'bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Card */}
      <Card variant="glass" className="p-4 sm:p-6 flex flex-col h-[65vh] justify-between overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-faint)] font-mono">
                  <span>{isUser ? 'You' : 'Boardy 🎓'}</span>
                  {msg.mode && !isUser && (
                    <span className="text-[var(--brand-2)] uppercase">({msg.mode})</span>
                  )}
                </div>

                <div
                  className={`p-4 rounded-2xl max-w-2xl text-xs sm:text-sm leading-relaxed text-left ${
                    isUser
                      ? 'bg-[var(--brand)] text-white rounded-tr-none shadow-md shadow-blue-600/20'
                      : 'bg-white/6 border border-white/10 text-white rounded-tl-none space-y-2'
                  }`}
                >
                  <MathText text={msg.text} />
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex flex-col items-start space-y-1">
              <span className="text-[10px] text-[var(--text-faint)] font-mono">Boardy is deriving...</span>
              <div className="p-4 rounded-2xl bg-white/6 border border-white/10 text-white rounded-tl-none flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#22D3EE] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[#22D3EE] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[#22D3EE] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="pt-4 border-t border-white/8 flex items-center gap-2">
          <input
            type="text"
            disabled={isLimitReached || isLoading}
            placeholder={
              isLimitReached
                ? 'Daily quota reached for today. Resets at midnight PKT.'
                : 'Ask Boardy a question, formula proof, or numerical...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 h-12 px-4 rounded-xl bg-white/5 border border-white/12 text-sm text-white placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] disabled:opacity-50"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!inputText.trim() || isLimitReached || isLoading}
            isLoading={isLoading}
            className="h-12 px-5"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
};
