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
  AISHA_MENTOR_ID,
  calculateMessageCreditCost,
  getDepthConfig,
  getMentorConfig,
  isPhysicsVisualQuery,
  type AiDepthId,
  type AiMentorId,
  type AiPlan,
} from '@/utils/aiMentorsLogic';
import {
  prepareImageAttachment,
  preparePdfAttachment,
  transcribeVoiceAudio,
  type PreparedAttachment,
} from '@/services/aiMentorsService';
import { isVoiceInputV2FlagEnabled } from '@/utils/aiFeatureFlags';
import {
  VOICE_ERROR_MESSAGES,
  getVoiceCapabilities,
  isInAppBrowser,
  isSecureVoiceContext,
  mapMicrophoneError,
  resolveVoiceLanguage,
  stopMediaStreamTracks,
  type VoiceLangCode,
} from '@/utils/voiceInput';

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
  plan?: AiPlan;
  resetCountdown?: string;
  proDailyLimit?: number;
  plusDailyLimit?: number;
  aishaVisualEnabled?: boolean;
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
  plan = 'free',
  resetCountdown,
  proDailyLimit = 50,
  plusDailyLimit = 100,
  aishaVisualEnabled = true,
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
  const [transcribing, setTranscribing] = useState(false);
  const [micNote, setMicNote] = useState<string | null>(null);
  const [voiceLang, setVoiceLang] = useState<VoiceLangCode>(() => resolveVoiceLanguage());

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const micNoteTimerRef = useRef<number | null>(null);

  const mentor = getMentorConfig(mentorId);
  const depthCfg = getDepthConfig(depthId);
  const voiceV2Enabled = isVoiceInputV2FlagEnabled();
  const voiceCaps = getVoiceCapabilities();

  const photoCount = attachments.filter((a) => a.kind === 'photo').length;
  const pdfCount = attachments.filter((a) => a.kind === 'pdf').length;

  const isAishaVisualEstimate =
    mentorId === AISHA_MENTOR_ID &&
    aishaVisualEnabled &&
    (text.trim().length === 0 || isPhysicsVisualQuery(text));

  const costEstimate = calculateMessageCreditCost({
    depth: depthId,
    textLength: text.trim().length,
    photoCount,
    pdfCount,
    historyMessageCount,
    mentorId,
    visualMode: isAishaVisualEstimate,
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
      if (micNoteTimerRef.current !== null) {
        window.clearTimeout(micNoteTimerRef.current);
      }
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // Ignore
      }
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // Ignore
      }
      stopMediaStreamTracks(mediaStreamRef.current);
      mediaStreamRef.current = null;
    };
  }, []);

  const showMicMessage = (msg: string, durationMs = 4500) => {
    setMicNote(msg);
    if (micNoteTimerRef.current !== null) {
      window.clearTimeout(micNoteTimerRef.current);
    }
    micNoteTimerRef.current = window.setTimeout(() => {
      setMicNote((prev) => (prev === msg ? null : prev));
    }, durationMs);
  };

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
      if (plan === 'plus') {
        showTempNote(
          creditsLeft === 0
            ? `You've used all ${dailyLimit} daily AI Mentor credits. Resets in ${resetCountdown || 'at midnight PKT'}.`
            : `This message needs ${costEstimate.total} credits, and you have ${creditsLeft} left today. Resets in ${resetCountdown || 'at midnight PKT'}.`
        );
        return;
      }
      if (plan === 'pro') {
        onOpenUpgrade(
          creditsLeft === 0
            ? `You have used all ${dailyLimit} Pro credits today. Upgrade to Plus for ${plusDailyLimit} credits/day.`
            : `This message needs ${costEstimate.total} credits, and you have ${creditsLeft} left today. Upgrade to Plus for ${plusDailyLimit} credits/day.`
        );
        return;
      }
      onOpenUpgrade(
        creditsLeft === 0
          ? `You have used all ${dailyLimit} Free credits today. Upgrade to Pro (${proDailyLimit}/day) or Plus (${plusDailyLimit}/day).`
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

  const stopActiveVoiceCapture = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // Ignore
    }
    recognitionRef.current = null;
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        return; // tracks stopped inside onstop after blob flush
      }
    } catch {
      // Ignore
    }
    stopMediaStreamTracks(mediaStreamRef.current);
    mediaStreamRef.current = null;
    setListening(false);
  };

  const startMediaRecorderFallback = (stream: MediaStream, lang: VoiceLangCode) => {
    try {
      const preferredMimes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const chosenMime =
        typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
          ? preferredMimes.find((m) => MediaRecorder.isTypeSupported(m)) || ''
          : '';
      const recorder = chosenMime
        ? new MediaRecorder(stream, { mimeType: chosenMime })
        : new MediaRecorder(stream);

      recordedChunksRef.current = [];
      mediaRecorderRef.current = recorder;
      mediaStreamRef.current = stream;

      recorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) {
          recordedChunksRef.current.push(evt.data);
        }
      };

      recorder.onerror = (evt) => {
        stopMediaStreamTracks(stream);
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setListening(false);
        const mapped = mapMicrophoneError((evt as any)?.error || evt);
        showMicMessage(mapped.message);
      };

      recorder.onstop = () => {
        stopMediaStreamTracks(stream);
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setListening(false);

        const chunks = recordedChunksRef.current;
        recordedChunksRef.current = [];
        if (chunks.length === 0) return;

        const mimeType = recorder.mimeType || chosenMime || 'audio/webm';
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size < 256) return;

        setTranscribing(true);
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const dataUrl = String(reader.result || '');
            const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
            if (!base64) return;
            const transcript = await transcribeVoiceAudio({
              audioBase64: base64,
              mimeType: mimeType.split(';')[0] || 'audio/webm',
              lang,
            });
            if (transcript) {
              setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
            } else {
              showMicMessage(VOICE_ERROR_MESSAGES.noSpeech, 3200);
            }
          } catch (err) {
            console.error('[Boardly Voice Input] server transcription failed:', err);
            showMicMessage('Could not transcribe voice right now. Please try typing or tap mic again.');
          } finally {
            setTranscribing(false);
          }
        };
        reader.onerror = () => {
          setTranscribing(false);
          showMicMessage(VOICE_ERROR_MESSAGES.generic);
        };
        reader.readAsDataURL(blob);
      };

      setListening(true);
      setMicNote(null);
      recorder.start();
    } catch (err) {
      stopMediaStreamTracks(stream);
      mediaStreamRef.current = null;
      setListening(false);
      const mapped = mapMicrophoneError(err);
      showMicMessage(mapped.message);
    }
  };

  const startSpeechRecognition = (langCode: VoiceLangCode, allowLangFallback: boolean) => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      showMicMessage(
        isInAppBrowser() ? VOICE_ERROR_MESSAGES.inAppBrowser : VOICE_ERROR_MESSAGES.unsupported
      );
      return;
    }

    // Never open two mic streams at once: ensure any prior stream/recognition is stopped first
    if (mediaStreamRef.current) {
      stopMediaStreamTracks(mediaStreamRef.current);
      mediaStreamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = langCode;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;

      rec.onresult = (evt: any) => {
        const transcript = String(evt?.results?.[0]?.[0]?.transcript || '').trim();
        if (transcript) {
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setMicNote(null);
        }
      };
      rec.onend = () => {
        if (recognitionRef.current === rec) {
          recognitionRef.current = null;
        }
        setListening(false);
      };
      rec.onerror = (evt: any) => {
        if (recognitionRef.current === rec) {
          recognitionRef.current = null;
        }
        setListening(false);
        const errCode = String(evt?.error || '');
        if (errCode === 'aborted') return;
        console.error('[Boardly Voice Input] SpeechRecognition error:', errCode, evt);
        if (errCode === 'language-not-supported' && allowLangFallback && langCode !== 'en-US') {
          setVoiceLang('en-US');
          startSpeechRecognition('en-US', false);
          return;
        }
        const mapped = mapMicrophoneError(errCode || evt, { logToConsole: false });
        if (mapped.message) showMicMessage(mapped.message);
      };
      recognitionRef.current = rec;
      setMicNote(null);
      setListening(true);
      rec.start();
    } catch (err) {
      recognitionRef.current = null;
      setListening(false);
      const mapped = mapMicrophoneError(err);
      if (mapped.message) showMicMessage(mapped.message);
    }
  };

  const handleToggleMic = () => {
    if (typeof window === 'undefined' || transcribing) return;

    if (listening) {
      stopActiveVoiceCapture();
      return;
    }

    if (isInAppBrowser()) {
      showMicMessage(VOICE_ERROR_MESSAGES.inAppBrowser);
      return;
    }

    if (!isSecureVoiceContext()) {
      showMicMessage(VOICE_ERROR_MESSAGES.insecureContext);
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const activeLang = resolveVoiceLanguage({
      preferredLang: voiceLang,
      draftText: text,
    });

    if (SpeechRec) {
      // Start fresh SpeechRecognition synchronously inside the click handler (no double mic stream)
      startSpeechRecognition(activeLang, true);
      return;
    }

    if (!voiceV2Enabled || !navigator?.mediaDevices?.getUserMedia || typeof (window as any).MediaRecorder === 'undefined') {
      showMicMessage(VOICE_ERROR_MESSAGES.unsupported);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        startMediaRecorderFallback(stream, activeLang);
      })
      .catch((err) => {
        console.error('[Boardly Voice Input] getUserMedia error:', err?.name || err);
        setListening(false);
        const mapped = mapMicrophoneError(err, { logToConsole: false });
        if (mapped.message) showMicMessage(mapped.message);
      });
  };

  const isThinkHarderOn = depthId >= 2;
  const canSend = !sending && (text.trim().length > 0 || attachments.length > 0);
  const showMicButton = voiceCaps.hasSpeechRecognition || voiceCaps.isInApp;

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
            role="status"
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
              {showMicButton && !voiceCaps.isInApp && voiceV2Enabled && (
                <button
                  type="button"
                  onClick={() =>
                    setVoiceLang((prev) => (prev === 'ur-PK' ? 'en-US' : 'ur-PK'))
                  }
                  disabled={listening || transcribing}
                  aria-label={`Voice language ${voiceLang === 'ur-PK' ? 'Urdu' : 'English'}. Tap to switch.`}
                  title={`Voice language: ${voiceLang === 'ur-PK' ? 'Urdu (ur-PK)' : 'English (en-US)'}`}
                  className="flex h-8 items-center justify-center rounded-full px-2 text-[11px] font-semibold transition-colors cursor-pointer hover:bg-[var(--surface-hover)] disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {voiceLang === 'ur-PK' ? 'اردو' : 'EN'}
                </button>
              )}

              {showMicButton ? (
                <button
                  type="button"
                  onClick={handleToggleMic}
                  disabled={transcribing}
                  aria-label={
                    transcribing
                      ? 'Transcribing voice input'
                      : listening
                        ? 'Stop voice input'
                        : 'Voice input'
                  }
                  title={
                    voiceCaps.isInApp
                      ? VOICE_ERROR_MESSAGES.inAppBrowser
                      : transcribing
                        ? 'Transcribing...'
                        : listening
                          ? 'Stop listening'
                          : 'Voice input'
                  }
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer hover:bg-[var(--surface-hover)] disabled:opacity-60 ${
                    listening || transcribing ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor:
                      listening || transcribing
                        ? `color-mix(in srgb, ${mentor.accent} 16%, var(--bg))`
                        : 'transparent',
                    color: listening || transcribing ? mentor.accent : 'var(--text-muted)',
                  }}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              ) : (
                <span
                  className="text-[11px] font-medium px-1.5 select-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {VOICE_ERROR_MESSAGES.unsupported}
                </span>
              )}

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
                {creditsLeft === 0 && plan === 'plus'
                  ? `0/${dailyLimit} credits left · Resets in ${resetCountdown || 'midnight PKT'}`
                  : `${creditsLeft}/${dailyLimit} credits left · This message ≈ ${costEstimate.total} credit${costEstimate.total === 1 ? '' : 's'}`}
              </span>
              {!isPro && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenUpgrade(
                      `Upgrade to Boardly Pro for ${proDailyLimit} AI Mentor credits/day and Deep & Max thinking.`
                    )
                  }
                  className="shrink-0 font-semibold cursor-pointer hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  Upgrade
                </button>
              )}
              {plan === 'pro' && creditsLeft <= 10 && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenUpgrade(
                      `Upgrade to Boardly Plus for ${plusDailyLimit} AI Mentor credits/day (2× Pro).`
                    )
                  }
                  className="shrink-0 font-semibold cursor-pointer hover:underline"
                  style={{ color: '#d97706' }}
                >
                  Get {plusDailyLimit}/day
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
