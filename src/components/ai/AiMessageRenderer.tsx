import React, { useMemo, useState, useEffect } from 'react';
import katex from 'katex';
import { ensureKatexLoaded } from '@/components/ui/MathText';
import {
  Check,
  Copy,
  MoreHorizontal,
  RefreshCw,
  Share2,
  Square,
  Volume2,
  Code2,
} from 'lucide-react';
import {
  renderAiMarkdownWithKatex,
  stripLatexForSpeech,
} from '@/utils/aiMentorsLogic';

interface AiMessageRendererProps {
  text: string;
  accentColor: string;
  isGreeting?: boolean;
  isError?: boolean;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onRetry?: () => void;
}

export const AiMessageRenderer: React.FC<AiMessageRendererProps> = ({
  text,
  accentColor,
  isGreeting = false,
  isError = false,
  isStreaming = false,
  onRegenerate,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [shared, setShared] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [cdnKatexReady, setCdnKatexReady] = useState<boolean>(() =>
    typeof window !== 'undefined' && Boolean((window as any).katex?.renderToString)
  );

  // Load lazy KaTeX CSS + mhchem once cleanly (no background polling interval)
  useEffect(() => {
    let active = true;
    void ensureKatexLoaded().then(() => {
      if (active && typeof window !== 'undefined' && Boolean((window as any).katex?.renderToString)) {
        setCdnKatexReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Cancel active speech if component unmounts
  useEffect(() => {
    return () => {
      if (speaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore
        }
      }
    };
  }, [speaking]);

  const renderedHtml = useMemo(() => {
    const runtimeKatex =
      cdnKatexReady && typeof window !== 'undefined' && (window as any).katex?.renderToString
        ? (window as any).katex
        : katex;
    return renderAiMarkdownWithKatex(text, runtimeKatex);
  }, [text, cdnKatexReady]);

  const handleCopy = async (raw = false) => {
    try {
      const value = raw ? text : stripLatexForSpeech(text);
      await navigator.clipboard.writeText(value);
      if (raw) {
        setCopiedRaw(true);
        window.setTimeout(() => setCopiedRaw(false), 1800);
      } else {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // Ignore clipboard failure
    }
    setMoreOpen(false);
  };

  const handleListen = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }
      window.speechSynthesis.cancel();
      const plain = stripLatexForSpeech(text);
      if (!plain) return;
      const utter = new SpeechSynthesisUtterance(plain);
      utter.rate = 1.0;
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utter);
    } catch {
      setSpeaking(false);
    }
  };

  const handleShare = async () => {
    const shareText = text;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: 'Boardly AI Mentor Answer',
          text: shareText,
        });
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
        return;
      }
      await navigator.clipboard.writeText(shareText);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      // User cancelled share sheet
    }
  };

  return (
    <div className="min-w-0 max-w-full">
      {/* Answer Prose: strictly normal readable UI font (Inter), NEVER dot-matrix font */}
      <div
        className={`ai-answer-prose text-[15px] leading-[1.65] break-words ${
          isError ? 'text-[var(--danger)]' : 'text-[var(--text)]'
        }`}
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />

      {/* Retry action shown on error bubbles */}
      {isError && onRetry && (
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            aria-label="Retry sending message"
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold transition-colors cursor-pointer active:scale-95 hover:opacity-90"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {isStreaming && (
        <span
          className="ai-stream-cursor inline-block align-middle ml-1"
          style={{ backgroundColor: accentColor }}
          aria-hidden="true"
        />
      )}

      {/* Message Action Bar (shown under completed real AI answers, not greeting, error, or active stream) */}
      {!isGreeting && !isError && !isStreaming && (
        <div className="relative mt-2.5 flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => void handleCopy(false)}
            aria-label="Copy answer"
            title="Copy"
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
            style={{ color: copied ? accentColor : 'var(--text-muted)' }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {typeof window !== 'undefined' && 'speechSynthesis' in window && (
            <button
              type="button"
              onClick={handleListen}
              aria-label={speaking ? 'Stop listening' : 'Listen to answer'}
              title={speaking ? 'Stop' : 'Listen'}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
              style={{ color: speaking ? accentColor : 'var(--text-muted)' }}
            >
              {speaking ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              <span>{speaking ? 'Stop' : 'Listen'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleShare()}
            aria-label="Share answer"
            title="Share"
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
            style={{ color: shared ? accentColor : 'var(--text-muted)' }}
          >
            {shared ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{shared ? 'Shared' : 'Share'}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-label="More options"
              aria-expanded={moreOpen}
              title="More"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {moreOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMoreOpen(false)}
                  aria-hidden="true"
                />
                <div
                  className="absolute left-0 bottom-9 z-20 min-w-[175px] rounded-[20px] p-1.5 shadow-xl"
                  style={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => void handleCopy(true)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                    style={{ color: 'var(--text)' }}
                  >
                    <Code2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <span>{copiedRaw ? 'Copied LaTeX' : 'Copy raw markdown'}</span>
                  </button>
                  {onRegenerate && (
                    <button
                      type="button"
                      onClick={() => {
                        setMoreOpen(false);
                        onRegenerate();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                      style={{ color: 'var(--text)' }}
                    >
                      <RefreshCw className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <span>Regenerate</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
