import { useState, useRef, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getPKTDateKey } from '@/hooks/usePKTDate';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MathText } from '@/components/ui/MathText';
import { Button } from '@/components/ui/Button';
import { Bot, Send, Sparkles, Zap, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

const SUGGESTED_PROMPTS = [
  '⚡ FAST-NUCES Negative Marking Strategy',
  '🚀 Projectile Motion Maximum Range Derivation',
  '📐 Conic Sections: Eccentricity Shortcuts',
  '🧪 Chemical Equilibrium & Le Chatelier Principle',
];

const FREE_DAILY_TOKEN_LIMIT = 5;

export function AiTutorPage() {
  const { user, profile } = useUserProfile();
  const isPremium = profile?.isPremium || profile?.plan === 'pro';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Salam! I am **Boardy**, your entrance test AI tutor.\n\nAsk me any concept, past-paper question, or mathematical derivation for **FAST-NUCES, NUST NET, GIKI, LUMS, NED, MDCAT, or ECAT**.\n\nI'll explain each step with KaTeX formulas, shortcuts, and trap alerts. What are you studying right now?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const dateKey = getPKTDateKey();

  // Load today's token usage from Firestore
  useEffect(() => {
    if (!user) return;
    const usageRef = doc(db, 'users', user.uid, 'usage', dateKey);
    getDoc(usageRef)
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setTokensUsed(data.aiTutorTokens ?? 0);
        }
      })
      .catch((e) => console.warn('[AiTutor] Failed to fetch usage:', e));
  }, [user, dateKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const isOverLimit = !isPremium && tokensUsed >= FREE_DAILY_TOKEN_LIMIT;

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend ?? input).trim();
    if (!queryText || loading || isOverLimit) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: queryText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          history: messages.slice(-6).map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            content: m.content,
          })),
          uid: user?.uid,
        }),
      });

      let replyContent =
        "I'm currently unable to connect to the derivation server. Please check back shortly or select another concept.";

      if (response.ok) {
        const data = (await response.json()) as { reply?: string };
        if (data.reply) replyContent = data.reply;
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Update Firestore usage counter
      if (user) {
        const usageRef = doc(db, 'users', user.uid, 'usage', dateKey);
        await setDoc(usageRef, { aiTutorTokens: increment(1) }, { merge: true });
        setTokensUsed((c) => c + 1);
      }
    } catch (err) {
      console.error('[AiTutor] Send error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered a temporary connection issue. Please try asking again!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Conversation refreshed! What topic would you like to review next?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div
      style={{
        maxWidth: 880,
        margin: '0 auto',
        height: 'calc(100dvh - 140px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Top Header Bar */}
      <div
        className="glass"
        style={{
          borderRadius: 'var(--r-card)',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 0 16px rgba(47, 107, 255, 0.4)',
            }}
          >
            <Bot size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                Boardy AI Tutor
              </h2>
              <span style={{ fontSize: 11, background: 'rgba(52, 211, 153, 0.15)', color: 'var(--success)', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                ● Active
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              Step-by-step derivations & entrance test problem solver
            </p>
          </div>
        </div>

        {/* Quota & Reset Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isPremium ? (
            <span style={{ fontSize: 12, color: 'var(--success)', background: 'rgba(52, 211, 153, 0.1)', padding: '4px 10px', borderRadius: 'var(--r-pill)', fontWeight: 600 }}>
              ✦ Pro Unlimited Access
            </span>
          ) : (
            <span style={{ fontSize: 12, color: isOverLimit ? 'var(--danger)' : 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 'var(--r-pill)' }}>
              Daily Prompts: <strong style={{ color: isOverLimit ? 'var(--danger)' : 'var(--text)' }}>{tokensUsed}/{FREE_DAILY_TOKEN_LIMIT}</strong>
            </span>
          )}

          <button
            onClick={handleClearHistory}
            className="glass-hover"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-input)',
              padding: '6px 10px',
              color: 'var(--text-faint)',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Reset Chat"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Scroll View */}
      <div
        className="glass"
        style={{
          flex: 1,
          borderRadius: 'var(--r-card)',
          padding: '1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {messages.map((m) => {
          const isUser = m.role === 'user';

          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: 10,
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                >
                  <Bot size={16} />
                </div>
              )}

              <div
                style={{
                  maxWidth: '82%',
                  padding: '14px 18px',
                  borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isUser
                    ? 'linear-gradient(135deg, var(--brand), #2284FF)'
                    : 'var(--surface)',
                  border: isUser ? 'none' : '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 14,
                  lineHeight: 1.65,
                  boxShadow: isUser ? '0 8px 24px -8px rgba(47, 107, 255, 0.4)' : undefined,
                }}
              >
                {isUser ? (
                  <span>{m.content}</span>
                ) : (
                  <MathText block>{m.content}</MathText>
                )}
                <div
                  style={{
                    fontSize: 10,
                    color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--text-faint)',
                    marginTop: 6,
                    textAlign: 'right',
                  }}
                >
                  {m.time}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand), var(--brand-2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                animation: 'pulse-glow 1.5s infinite',
              }}
            >
              <Sparkles size={16} />
            </div>
            <div
              className="glass"
              style={{
                padding: '12px 18px',
                borderRadius: '18px 18px 18px 4px',
                color: 'var(--text-muted)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--brand-2)',
                  animation: 'pulse-glow 1s infinite',
                }}
              />
              Boardy is solving with step-by-step KaTeX derivations...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt.replace(/^[^\s]+\s/, ''))}
            disabled={loading || isOverLimit}
            className="glass-hover"
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: 12,
              whiteSpace: 'nowrap',
              cursor: isOverLimit ? 'not-allowed' : 'pointer',
              opacity: isOverLimit ? 0.5 : 1,
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar or Upgrade Warning */}
      {isOverLimit ? (
        <div
          className="glass"
          style={{
            borderRadius: 'var(--r-card)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            border: '1px solid var(--warning)',
          }}
        >
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)' }}>
              Daily Free Limit Reached (5 of 5 prompts used)
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
              Your quota resets at midnight PKT. Upgrade to Boardly Pro for unlimited derivations.
            </p>
          </div>
          <Link to="/dashboard/plans">
            <Button variant="primary" size="sm" style={{ gap: 6 }}>
              <Zap size={14} />
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{ display: 'flex', gap: 10 }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question, formula derivation, or past-paper trap..."
            disabled={loading}
            style={{
              flex: 1,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-input)',
              color: 'var(--text)',
              fontSize: 14,
              padding: '12px 18px',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!input.trim() || loading}
            loading={loading}
            style={{ padding: '0 20px', gap: 6 }}
          >
            <Send size={16} />
            <span className="hidden sm:inline">Ask Boardy</span>
          </Button>
        </form>
      )}
    </div>
  );
}
