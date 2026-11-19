import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  BookOpen,
  Camera,
  Check,
  FileText,
  Gauge,
  Image as ImageIcon,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import {
  calculateMessageCreditCost,
  getDepthConfig,
  getMentorConfig,
  type AiDepthId,
  type AiMentorId,
} from '@/utils/aiMentorsLogic';
import {
  prepareImageAttachment,
  preparePdfAttachment,
  type PreparedAttachment,
} from '@/services/aiMentorsService';

interface AiComposerProps {
  mentorId: AiMentorId;
  depthId: AiDepthId;
  isTemporary: boolean;
  sending: boolean;
  historyMessageCount: number;
  creditsLeft: number;
  dailyLimit: number;
  isUnlimited: boolean;
  isPro: boolean;
  onSend: (text: string, attachments: PreparedAttachment[]) => void;
  onOpenMentorPicker: () => void;
  onOpenDepthGauge: () => void;
  onOpenPastPapers: () => void;
  onOpenUpgrade: (reason: string) => void;
}

export const AiComposer: React.FC<AiComposerProps> = ({
  mentorId,
  depthId,
  isTemporary,
  sending,
  historyMessageCount,
  creditsLeft,
  dailyLimit,
  isUnlimited,
  isPro,
  onSend,
  onOpenMentorPicker,
  onOpenDepthGauge,
  onOpenPastPapers,
  onOpenUpgrade,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<PreparedAttachment[]>([]);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const mentor = getMentorConfig(mentorId);
  const depthCfg = getDepthConfig(depthId);

  const photoCount = attachments.filter((a) => a.kind === 'photo').length;
  const pdfCount = attachments.filter((a) => a.kind === 'pdf').length;

  const costEstimate = calculateMessageCreditCost({
    depth: depthId,
    textLength: text.trim().length,
    photoCount,
    pdfCount,
    historyMessageCount,
  });

  // Auto-grow textarea up to ~140px
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(140, Math.max(40, el.scrollHeight))}px`;
  }, [text]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // Ignore
      }
    };
  }, []);

  const showTempNote = (msg: string) => {
    setAttachError(msg);
    window.setTimeout(() => setAttachError((prev) => (prev === msg ? null : prev)), 3500);
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, 3);
    for (const file of files) {
      try {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          const att = await preparePdfAttachment(file);
          setAttachments((prev) => [...prev.slice(0, 3), att]);
        } else if (file.type.startsWith('image/')) {
          const att = await prepareImageAttachment(file);
          setAttachments((prev) => [...prev.slice(0, 3), att]);
        } else {
          showTempNote('Only photos (JPG/PNG/WebP) and PDFs up to 4 MB are supported.');
        }
      } catch (err: any) {
        showTempNote(err?.message || 'Could not attach that file.');
      }
    }
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (sending || (!trimmed && attachments.length === 0)) return;
    if (!isUnlimited && creditsLeft < costEstimate.total) {
      onOpenUpgrade(
        creditsLeft === 0
          ? 'You have used all your AI Mentor credits for today.'
          : `This message needs ${costEstimate.total} credits, and you have ${creditsLeft} left today.`
      );
      return;
    }
    const payloadText = trimmed;
    const payloadAttachments = [...attachments];
    setText('');
    setAttachments([]);
    setPlusMenuOpen(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
    onSend(payloadText, payloadAttachments);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On laptop (>= 1024px): Enter sends, Shift+Enter adds newline.
    // On phones & tablets (< 1024px): Enter ALWAYS makes a newline; send button sends.
    const isLaptop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    if (isLaptop && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleToggleMic = () => {
    if (typeof window === 'undefined') return;
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setMicNote('Voice input is not supported in this browser.');
      window.setTimeout(() => setMicNote(null), 2800);
      return;
    }
    if (listening) {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // Ignore
      }
      setListening(false);
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (evt: any) => {
        const transcript = String(evt?.results?.[0]?.[0]?.transcript || '').trim();
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => {
        setListening(false);
        setMicNote('Could not capture voice. Check microphone permission.');
        window.setTimeout(() => setMicNote(null), 2800);
      };
      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
      setMicNote('Could not start voice input.');
      window.setTimeout(() => setMicNote(null), 2800);
    }
  };

  const isThinkHarderOn = depthId >= 2;
  const canSend = !sending && (text.trim().length > 0 || attachments.length > 0);

  return (
    <div
      className="shrink-0 px-3 sm:px-4 pt-2 pb-[calc(12px+env(safe-area-inset-bottom,0px))] lg:pb-4"
      style={{
        backgroundColor: 'var(--bg)',
      }}
    >
      <div className="mx-auto max-w-[740px] space-y-2">
        {/* Inline attachment/mic feedback */}
        {(attachError || micNote) && (
          <div
            className="rounded-2xl px-3.5 py-2 text-[12.5px] font-medium"
            style={{
              backgroundColor: 'var(--tag-danger-bg)',
              color: 'var(--danger)',
              border: '1px solid var(--danger-border)',
            }}
          >
            {attachError || micNote}
          </div>
        )}

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative flex items-center gap-2 rounded-2xl px-2.5 py-1.5 text-[12px]"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                {att.kind === 'photo' && att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="h-8 w-8 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <FileText className="h-4 w-4 shrink-0" style={{ color: mentor.accent }} />
                )}
                <span className="max-w-[130px] truncate font-medium">{att.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== att.id))}
                  aria-label={`Remove ${att.name}`}
                  className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-[var(--surface-hover)] cursor-pointer"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Single Rounded Composer Card (only visible container shape) */}
        <div
          className="relative rounded-[28px] p-2.5 pl-4 pr-2.5 transition-colors focus-within:border-[var(--border-strong)]"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Compact ChatGPT-style "+" Popup Menu */}
          {plusMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setPlusMenuOpen(false)}
                aria-hidden="true"
              />
              <div
                role="menu"
                aria-label="Add attachment or tool"
                className="absolute left-2 bottom-[calc(100%+10px)] z-30 w-[230px] rounded-[24px] p-1.5 shadow-2xl"
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPlusMenuOpen(false);
                    cameraInputRef.current?.click();
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[14px] font-medium transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                  style={{ color: 'var(--text)' }}
                >
                  <Camera className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPlusMenuOpen(false);
                    photoInputRef.current?.click();
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[14px] font-medium transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                  style={{ color: 'var(--text)' }}
                >
                  <ImageIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span>Photos</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPlusMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[14px] font-medium transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                  style={{ color: 'var(--text)' }}
                >
                  <Paperclip className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span>Files</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPlusMenuOpen(false);
                    onOpenPastPapers();
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[14px] font-medium transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                  style={{ color: 'var(--text)' }}
                >
                  <BookOpen className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span>Past papers</span>
                </button>
                <div className="my-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPlusMenuOpen(false);
                    onOpenDepthGauge();
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-left text-[14px] font-medium transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                  style={{ color: isThinkHarderOn ? mentor.accent : 'var(--text)' }}
                >
                  <span className="flex items-center gap-3">
                    <Gauge
                      className="h-4 w-4 shrink-0"
                      style={{ color: isThinkHarderOn ? mentor.accent : 'var(--text-muted)' }}
                    />
                    <span>Think harder</span>
                  </span>
                  {isThinkHarderOn && (
                    <Check className="h-4 w-4 shrink-0" style={{ color: mentor.accent }} />
                  )}
                </button>
              </div>
            </>
          )}

          {/* Borderless auto-growing textarea */}
          <div className="ai-composer-input-wrap w-full">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isTemporary ? 'Temporary chat' : `Ask ${mentor.name} anything...`}
              aria-label={isTemporary ? 'Temporary chat message' : `Message ${mentor.name}`}
              className="ai-composer-textarea w-full resize-none bg-transparent text-[15px] leading-snug border-0 outline-none shadow-none ring-0 focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none placeholder:text-[var(--placeholder)] overflow-y-auto"
              style={{
                color: 'var(--text)',
                maxHeight: '140px',
                minHeight: '36px',
                border: 0,
                outline: 'none',
                boxShadow: 'none',
                background: 'transparent',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            />
          </div>

          {/* Bottom Controls Row: +, Mentor+Depth chip, Mic, Send */}
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => setPlusMenuOpen((v) => !v)}
                aria-label="Add attachment or tools"
                aria-expanded={plusMenuOpen}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                <Plus className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onOpenMentorPicker}
                aria-label={`Mentor ${mentor.name}, depth ${depthCfg.label}. Tap to change.`}
                className="inline-flex h-9 max-w-[200px] items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold truncate cursor-pointer transition-colors hover:opacity-90"
                style={{
                  backgroundColor: `color-mix(in srgb, ${mentor.accent} 12%, var(--bg))`,
                  border: `1px solid color-mix(in srgb, ${mentor.accent} 34%, transparent)`,
                  color: mentor.accent,
                }}
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {mentor.name} · {depthCfg.label}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleToggleMic}
                aria-label={listening ? 'Stop voice input' : 'Voice input'}
                title={listening ? 'Stop listening' : 'Voice input'}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                style={{
                  backgroundColor: listening
                    ? `color-mix(in srgb, ${mentor.accent} 16%, var(--bg))`
                    : 'transparent',
                  color: listening ? mentor.accent : 'var(--text-muted)',
                }}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSend}
                aria-label="Send message"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: mentor.accent }}
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Single small muted credit line inside the composer (hidden completely for unlimited users) */}
          {!isUnlimited && (
            <div
              className="mt-2 flex items-center justify-between gap-2 pr-1 text-[11px] leading-tight"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="truncate tabular-nums">
                {creditsLeft}/{dailyLimit} credits left · This message ≈ {costEstimate.total} credit
                {costEstimate.total === 1 ? '' : 's'}
              </span>
              {!isPro && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenUpgrade(
                      'Upgrade to Boardly Pro for 100 AI Mentor credits/day and Deep & Max thinking.'
                    )
                  }
                  className="shrink-0 font-semibold cursor-pointer hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  Upgrade
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void handleFilesSelected(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFilesSelected(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          void handleFilesSelected(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
};
