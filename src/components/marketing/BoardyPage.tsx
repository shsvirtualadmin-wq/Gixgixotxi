import React, { useState } from 'react';
import { BoardyMascot } from '../BoardyMascot';
import { FrostedBackgroundDecor } from '../events/FrostedBackgroundDecor';
import { Sparkles, ArrowRight, MessageCircle, Send, CheckCircle2, BookOpen, Lightbulb, Zap, ShieldCheck } from 'lucide-react';

interface BoardyPageProps {
  onNavigate: (route: string) => void;
  onGetStarted: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'boardy' | 'user';
  text: string;
  hint?: string;
  formula?: string;
}

const PRESET_PROMPTS = [
  'Explain Lenz’s Law with formula',
  'Why is lim(x→0) sin(x)/x = 1?',
  'Derive kinetic energy formula',
  'Enzyme active site & competitive inhibition',
];

const PRESET_ANSWERS: Record<string, { text: string; hint?: string; formula?: string }> = {
  'Explain Lenz’s Law with formula': {
    text: `Great question! Lenz’s Law tells us the direction of induced electromotive force (EMF) and current.

Let’s look at the core physical principle:
Whenever magnetic flux through a conductor changes, an induced current is set up in such a direction that its magnetic effect OPPOSES the very change in magnetic flux that produced it.

Here is the Faraday-Lenz equation:`,
    formula: `\\varepsilon = -N \\frac{\\Delta \\Phi}{\\Delta t}`,
    hint: `💡 Guiding checkpoint: Why is there a minus sign in the equation? Because nature conserves energy! If the induced field supported the change instead of opposing it, we would get infinite free energy.`,
  },
  'Why is lim(x→0) sin(x)/x = 1?': {
    text: `Let’s walk through this classic calculus limit step by step using the geometric Squeeze (Sandwich) Theorem.

Consider a unit circle with an angle x in radians where 0 < x < π/2:
1. Area of inner triangle = (1/2) · sin(x)
2. Area of circular sector = (1/2) · x
3. Area of outer right triangle = (1/2) · tan(x)

Dividing through by (1/2) · sin(x) and taking reciprocals:`,
    formula: `\\cos(x) < \\frac{\\sin(x)}{x} < 1`,
    hint: `💡 Guiding step: As x approaches 0, what does cos(x) approach? Exactly 1! Since sin(x)/x is trapped between cos(x) and 1, by the Squeeze Theorem it must equal 1!`,
  },
  'Derive kinetic energy formula': {
    text: `Here is the clean, high-yield derivation from first principles using work-energy theorem and kinematics:

1. By definition, Work Done W = F · d
2. From Newton's Second Law: F = m · a, so W = m · a · d
3. From the third equation of motion: 2ad = v_f² - v_i²
   Assuming starting from rest (v_i = 0): a · d = (1/2) · v²
4. Substituting into the work equation gives:`,
    formula: `KE = W = \\frac{1}{2} m v^2`,
    hint: `💡 Board tip: In numericals, if mass is doubled and speed is doubled, KE increases by a factor of 2 · (2)² = 8 times!`,
  },
  'Enzyme active site & competitive inhibition': {
    text: `Let's break down active sites and competitive inhibitors for PMDC MDCAT & FSc Biology:

1. The Active Site: A 3D cleft made of specific catalytic and binding amino acid residues.
2. Competitive Inhibitors: Have a geometric shape closely resembling the genuine substrate. They bind directly to the active site and block substrate entry.
3. Overcoming Inhibition: Increasing substrate concentration outcompetes the inhibitor!`,
    formula: `V_{max} = \\text{unchanged}, \\quad K_m = \\text{increases}`,
    hint: `💡 High-yield exam question: Why does Vmax remain unchanged? Because at saturating substrate levels, every active site is filled by the real substrate anyway!`,
  },
};

export const BoardyPage: React.FC<BoardyPageProps> = ({ onNavigate, onGetStarted }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      sender: 'boardy',
      text: "Hey! I'm Boardy. Ask me any question and I'll walk you through it step by step.",
      hint: "Try asking a numerical, formula derivation, or syllabus definition below!",
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendPrompt = (promptText: string) => {
    if (!promptText.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: promptText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const answer =
        PRESET_ANSWERS[promptText] || {
          text: `Here is how we solve this step by step:

1. Identify the given parameters and core definition under your official board curriculum.
2. Formulate the relationship using standard textbook formulas.
3. Walk through each derivation step with dimensional units.

Would you like to drill 3 rapid practice MCQs on this topic right now?`,
          hint: "💡 Need extra detail? Launch an interactive quiz session to test your retention!",
        };

      const boardyMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'boardy',
        text: answer.text,
        formula: answer.formula,
        hint: answer.hint,
      };

      setMessages((prev) => [...prev, boardyMsg]);
    }, 600);
  };

  return (
    <div className="relative min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto selection:bg-indigo-600 selection:text-white">
      <FrostedBackgroundDecor />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        {/* Mascot Avatar with sparkle badge */}
        <div className="flex justify-center mb-5">
          <div className="p-3 rounded-3xl glass shadow-lg border border-white/80 relative">
            <BoardyMascot size={80} animated withSparkle />
          </div>
        </div>

        {/* Status Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass font-bold text-xs sm:text-sm text-indigo-900 border-indigo-200/80 mb-4 shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Boardy, your 24/7 study buddy.</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-[#0A1330] tracking-tight mb-4 font-poppins">
          Meet Boardy
        </h1>

        <p className="text-base sm:text-xl text-slate-700 leading-relaxed font-normal">
          Boardy, your 24/7 study buddy, is designed specifically for Pakistani Matric, FSc, and entrance test candidates.
          Short, encouraging step-by-step guidance without confusing jargon.
        </p>
      </div>

      {/* Interactive Live Chat Showcase Container */}
      <div className="max-w-3xl mx-auto mb-20">
        <div className="glass-card rounded-[32px] p-6 sm:p-8 border border-white/90 shadow-2xl overflow-hidden">
          {/* Chat Window Header */}
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-200/70">
            <div className="flex items-center gap-3">
              <BoardyMascot size={36} />
              <div>
                <div className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <span>Boardy</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-xs text-slate-500">Boardly, your 24/7 study buddy.</div>
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              Start Free Practice
            </button>
          </div>

          {/* Quick Preset Prompt Chips */}
          <div className="mb-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Popular Questions:
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendPrompt(prompt)}
                  className="text-xs font-semibold text-slate-700 bg-white/80 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/80 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs hover:border-indigo-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Feed */}
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 mb-5">
            {messages.map((m) => {
              const isBot = m.sender === 'boardy';
              return (
                <div key={m.id} className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
                  {isBot && (
                    <div className="shrink-0 mt-1">
                      <BoardyMascot size={30} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-xs ${
                      isBot
                        ? 'bg-white/90 text-slate-800 border border-slate-200/80'
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>

                    {m.formula && (
                      <div className="my-3 p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto border border-slate-800">
                        {m.formula}
                      </div>
                    )}

                    {m.hint && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-indigo-700 font-medium">
                        {m.hint}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-3 items-center text-slate-400 text-xs">
                <BoardyMascot size={26} />
                <div className="px-4 py-2.5 rounded-2xl bg-white/80 border border-slate-200/80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(inputQuery);
            }}
            className="flex items-center gap-2 pt-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask Boardy any syllabus topic or numerical..."
              className="flex-1 py-3 px-4 rounded-2xl glass-input text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="p-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors cursor-pointer shadow-sm"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Feature Value Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
        <div className="glass-card p-6 sm:p-7 rounded-[28px]">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#0A1330] mb-2 font-poppins">
            Step-by-Step Derivations
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Never get stuck on textbook numericals. Boardy lays out exact formulas, units, SI dimensions, and working steps.
          </p>
        </div>

        <div className="glass-card p-6 sm:p-7 rounded-[28px]">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
            <Lightbulb className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#0A1330] mb-2 font-poppins">
            Guiding Checkpoint Questions
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Instead of spoon-feeding answers, Boardy asks a quick guiding checkpoint first so you genuinely understand the physics or math principle.
          </p>
        </div>

        <div className="glass-card p-6 sm:p-7 rounded-[28px]">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#0A1330] mb-2 font-poppins">
            100% Board Curriculum Aligned
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Grounded in Federal (FBISE), Punjab, Sindh, KPK, Balochistan textbooks, PMDC MDCAT, and university entrance test formats.
          </p>
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="glass-card p-8 sm:p-12 rounded-[36px] max-w-4xl mx-auto text-center border border-white/90 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex justify-center mb-2">
            <BoardyMascot size={48} animated />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-[#0A1330] tracking-tight font-poppins">
            Ready to master your syllabus with Boardy?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Sign up for free and get instant access to 25,000+ diagnostic MCQs with step-by-step guidance.
          </p>
          <div className="pt-2">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 glow-btn hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <span>Start Free with Boardy</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
