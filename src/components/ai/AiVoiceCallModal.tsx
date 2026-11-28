import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';
import {
  AI_CALL_CONFIG,
  canContinueCallMinute,
  getCallRatePerMinute,
  getDepthConfig,
  getMentorConfig,
  prepareApiContents,
  stripLatexForSpeech,
  type AiDepthId,
  type AiMentorId,
  type LocalChatMessageInput,
} from '@/utils/aiMentorsLogic';
import {
  AiMentorApiError,
  chargeAiCallMinute,
  logAiCallEnd,
  refundAiCallFirstMinute,
  sendAiMentorMessage,
  type AiCallBillingResponse,
  type StoredAiMessage,
} from '@/services/aiMentorsService';
import {
  VOICE_ERROR_MESSAGES,
  getVoiceCapabilities,
  loadDeviceVoices,
  mapMicrophoneError,
  resolveVoiceLanguage,
  speakWithMentorVoice,
  stopMediaStreamTracks,
  stopMentorSpeech,
} from '@/utils/voiceInput';
import { MentorAvatar } from './MentorAvatar';

// Module-level lock: strictly one active voice call at a time
let activeGlobalCallId: string | null = null;

type CallPhase = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'muted' | 'ending' | 'error';

interface AiVoiceCallModalProps {
  open: boolean;
  mentorId: AiMentorId;
  depthId: AiDepthId;
  historyMessages: StoredAiMessage[];
  creditsLeft: number;
  isUnlimited: boolean;
  callMinutesLeft: number;
  onCreditsUpdated: (patch: {
    creditsLeft: number;
    creditsUsed?: number;
    dailyLimit?: number;
    callMinutesUsed?: number;
    callMinutesLimit?: number;
    callMinutesLeft?: number;
    isUnlimited?: boolean;
    resetAt?: string;
    dateKey?: string;
  }) => void;
  onAppendCallTurn: (userText: string, modelText: string) => void;
  onClose: () => void;
}

function formatTimer(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function splitReadySentences(buffer: string): { ready: string[]; rest: string } {
  const ready: string[] = [];
  let rest = buffer;
  // Split at sentence punctuation (. ! ? Urdu ۔ or newline) followed by space/end
  const regex = /^([\s\S]*?(?:[.!?؟۔](?=\s|$)|\n+))\s*/;
  let match = regex.exec(rest);
  while (match) {
    const chunk = match[1].trim();
    rest = rest.slice(match[0].length);
    if (chunk.length >= 2) ready.push(chunk);
    match = regex.exec(rest);
  }
  return { ready, rest };
}

export const AiVoiceCallModal: React.FC<AiVoiceCallModalProps> = ({
  open,
  mentorId,
  depthId,
  historyMessages,
  creditsLeft,
  isUnlimited,
  callMinutesLeft,
  onCreditsUpdated,
  onAppendCallTurn,
  onClose,
}) => {
  const mentor = getMentorConfig(mentorId);
  const depth = getDepthConfig(depthId);
  const ratePerMin = getCallRatePerMinute(depthId);

  const [phase, setPhase] = useState<CallPhase>('connecting');
  const [muted, setMuted] = useState(false);
  const [caption, setCaption] = useState('');
  const [aiCaption, setAiCaption] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [creditsUsedCall, setCreditsUsedCall] = useState(0);
  const [minutesLeftLive, setMinutesLeftLive] = useState(callMinutesLeft);

  // Mutable refs for safe async loops & cleanup
  const callIdRef = useRef<string>('');
  const closedRef = useRef(false);
  const mutedRef = useRef(false);
  const phaseRef = useRef<CallPhase>('connecting');
  const recRef = useRef<any>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const speechQueueRef = useRef<string[]>([]);
  const speakingActiveRef = useRef(false);
  const streamDoneRef = useRef(true);
  const pendingUtteranceRef = useRef('');
  const sendDebounceRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const elapsedRef = useRef(0);
  const minutesChargedRef = useRef(0);
  const creditsChargedRef = useRef(0);
  const billingInFlightRef = useRef(false);
  const answeredRef = useRef(false);
  const refundedRef = useRef(false);
  const loggedEndRef = useRef(false);
  const historyRef = useRef<LocalChatMessageInput[]>([]);
  const liveCreditsRef = useRef(creditsLeft);
  const liveMinLeftRef = useRef(callMinutesLeft);
  const isUnlimitedRef = useRef(isUnlimited);

  liveCreditsRef.current = creditsLeft;
  isUnlimitedRef.current = isUnlimited;

  const setPhaseSafe = useCallback((next: CallPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const stopRecognition = useCallback(() => {
    if (sendDebounceRef.current !== null) {
      window.clearTimeout(sendDebounceRef.current);
      sendDebounceRef.current = null;
    }
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.onstart = null;
        rec.abort();
      } catch {
        try {
          rec.stop();
        } catch {
          // ignore
        }
      }
    }
    stopMediaStreamTracks(activeStreamRef.current);
    activeStreamRef.current = null;
  }, []);

  const syncBilling = useCallback(
    (res: AiCallBillingResponse) => {
      liveCreditsRef.current = res.creditsLeft;
      liveMinLeftRef.current = res.callMinutesLeft;
      setMinutesLeftLive(res.callMinutesLeft);
      onCreditsUpdated({
        creditsLeft: res.creditsLeft,
        creditsUsed: res.creditsUsed,
        dailyLimit: res.dailyLimit,
        callMinutesUsed: res.callMinutesUsed,
        callMinutesLimit: res.callMinutesLimit,
        callMinutesLeft: res.callMinutesLeft,
        isUnlimited: res.isUnlimited,
        resetAt: res.resetAt,
        dateKey: res.dateKey,
      });
    },
    [onCreditsUpdated]
  );

  const finalizeCallResources = useCallback(() => {
    stopRecognition();
    stopMentorSpeech();
    speechQueueRef.current = [];
    speakingActiveRef.current = false;
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {
        // ignore
      }
      abortRef.current = null;
    }

    const callId = callIdRef.current;
    if (callId && activeGlobalCallId === callId) {
      activeGlobalCallId = null;
    }

    if (callId && minutesChargedRef.current > 0) {
      if (!answeredRef.current && !refundedRef.current) {
        refundedRef.current = true;
        void refundAiCallFirstMinute(callId)
          .then((res) => syncBilling(res))
          .catch(() => {});
      }
      if (!loggedEndRef.current) {
        loggedEndRef.current = true;
        void logAiCallEnd({
          callId,
          mentor: mentorId,
          depth: depthId,
          durationSec: elapsedRef.current,
          minutesBilled: answeredRef.current ? minutesChargedRef.current : 0,
          creditsCharged: answeredRef.current ? creditsChargedRef.current : 0,
          answered: answeredRef.current,
        });
      }
    }
  }, [depthId, mentorId, stopRecognition, syncBilling]);

  const speakNoticeAndEnd = useCallback(
    (spokenText: string, uiMessage?: string) => {
      if (closedRef.current) return;
      closedRef.current = true;
      setPhaseSafe('ending');
      if (uiMessage) setErrorMsg(uiMessage);
      stopRecognition();
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {
          // ignore
        }
        abortRef.current = null;
      }
      speechQueueRef.current = [];
      speakingActiveRef.current = false;

      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        finalizeCallResources();
        onClose();
      };

      const fallbackTimer = window.setTimeout(done, 4500);
      speakWithMentorVoice(
        {
          text: spokenText,
          mentorSlug: mentor.slug,
          gender: mentor.voice,
          lang: resolveVoiceLanguage(),
          onEnd: () => {
            window.clearTimeout(fallbackTimer);
            done();
          },
          onError: () => {
            window.clearTimeout(fallbackTimer);
            done();
          },
        },
        true
      );
    },
    [finalizeCallResources, mentor.slug, mentor.voice, onClose, setPhaseSafe, stopRecognition]
  );

  const startListeningRef = useRef<() => void>(() => {});

  const drainSpeechQueue = useCallback(() => {
    if (closedRef.current) return;
    if (speakingActiveRef.current) return;
    const nextSentence = speechQueueRef.current.shift();
    if (!nextSentence) {
      if (streamDoneRef.current && phaseRef.current === 'speaking') {
        lastActivityRef.current = Date.now();
        if (mutedRef.current) {
          setPhaseSafe('muted');
        } else {
          startListeningRef.current();
        }
      }
      return;
    }

    speakingActiveRef.current = true;
    setPhaseSafe('speaking');
    lastActivityRef.current = Date.now();

    const cleaned = stripLatexForSpeech(nextSentence);
    if (!cleaned) {
      speakingActiveRef.current = false;
      drainSpeechQueue();
      return;
    }

    speakWithMentorVoice(
      {
        text: cleaned,
        mentorSlug: mentor.slug,
        gender: mentor.voice,
        lang: resolveVoiceLanguage({ draftText: cleaned }),
        onEnd: () => {
          speakingActiveRef.current = false;
          if (!closedRef.current) drainSpeechQueue();
        },
        onError: () => {
          speakingActiveRef.current = false;
          if (!closedRef.current) drainSpeechQueue();
        },
      },
      false
    );
  }, [mentor.slug, mentor.voice, setPhaseSafe]);

  const sendTranscriptToMentor = useCallback(
    async (spokenTranscript: string) => {
      const clean = spokenTranscript.trim();
      if (!clean || closedRef.current) return;

      stopRecognition();
      setPhaseSafe('thinking');
      setCaption(clean);
      setAiCaption('');
      lastActivityRef.current = Date.now();

      const nextHistory: LocalChatMessageInput[] = [
        ...historyRef.current,
        { role: 'user' as const, text: clean },
      ].slice(-AI_CALL_CONFIG.maxHistoryMessages);
      historyRef.current = nextHistory;

      const apiContents = prepareApiContents(nextHistory, AI_CALL_CONFIG.maxHistoryMessages);
      const controller = new AbortController();
      abortRef.current = controller;
      streamDoneRef.current = false;
      speechQueueRef.current = [];
      let sentenceBuf = '';

      try {
        const result = await sendAiMentorMessage({
          mentor: mentorId,
          depth: depthId,
          contents: apiContents,
          signal: controller.signal,
          stream: true,
          visualEnabled: false,
          callMode: true,
          callId: callIdRef.current,
          onDelta: (delta, fullText) => {
            if (closedRef.current) return;
            answeredRef.current = true;
            lastActivityRef.current = Date.now();
            setAiCaption(fullText);
            sentenceBuf += delta;
            const { ready, rest } = splitReadySentences(sentenceBuf);
            sentenceBuf = rest;
            if (ready.length > 0) {
              speechQueueRef.current.push(...ready);
              drainSpeechQueue();
            }
          },
        });

        if (closedRef.current) return;
        answeredRef.current = true;
        streamDoneRef.current = true;

        const finalAnswer = result.text.trim();
        if (sentenceBuf.trim()) {
          speechQueueRef.current.push(sentenceBuf.trim());
          sentenceBuf = '';
        } else if (!speakingActiveRef.current && speechQueueRef.current.length === 0 && finalAnswer) {
          speechQueueRef.current.push(finalAnswer);
        }

        historyRef.current = [
          ...historyRef.current,
          { role: 'model' as const, text: finalAnswer },
        ].slice(-AI_CALL_CONFIG.maxHistoryMessages);
        onAppendCallTurn(clean, finalAnswer);
        setAiCaption(finalAnswer);
        drainSpeechQueue();
      } catch (err: any) {
        if (closedRef.current) return;
        streamDoneRef.current = true;
        if (err instanceof AiMentorApiError && err.code === 'ABORTED') {
          return;
        }
        if (err instanceof AiMentorApiError && err.code === 'INSUFFICIENT_CREDITS') {
          speakNoticeAndEnd('Your credits have ended', 'Your credits have ended.');
          return;
        }
        setErrorMsg(err?.message || 'Could not reach your AI mentor. Tap to speak again.');
        if (!mutedRef.current) {
          startListeningRef.current();
        } else {
          setPhaseSafe('muted');
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [
      depthId,
      drainSpeechQueue,
      mentorId,
      onAppendCallTurn,
      setPhaseSafe,
      speakNoticeAndEnd,
      stopRecognition,
    ]
  );

  const startListening = useCallback(
    (onConnected?: () => void) => {
      if (closedRef.current || mutedRef.current) return;
      stopRecognition();

      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) {
        setErrorMsg('Calls work in Chrome');
        setPhaseSafe('error');
        return;
      }

      try {
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        rec.lang = resolveVoiceLanguage();
        recRef.current = rec;
        pendingUtteranceRef.current = '';

        let didStart = false;
        rec.onstart = () => {
          if (closedRef.current) {
            stopRecognition();
            return;
          }
          didStart = true;
          setErrorMsg(null);
          setPhaseSafe('listening');
          lastActivityRef.current = Date.now();
          onConnected?.();
        };

        rec.onspeechstart = () => {
          lastActivityRef.current = Date.now();
        };

        rec.onresult = (ev: any) => {
          if (closedRef.current || mutedRef.current) return;
          lastActivityRef.current = Date.now();
          let finalChunk = '';
          let interimChunk = '';
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const res = ev.results[i];
            const txt = String(res?.[0]?.transcript || '');
            if (res.isFinal) finalChunk += ` ${txt}`;
            else interimChunk += ` ${txt}`;
          }
          if (finalChunk.trim()) {
            pendingUtteranceRef.current = `${pendingUtteranceRef.current} ${finalChunk}`.trim();
          }
          const combined = `${pendingUtteranceRef.current} ${interimChunk}`.trim();
          if (combined) setCaption(combined);

          if (pendingUtteranceRef.current) {
            if (sendDebounceRef.current !== null) window.clearTimeout(sendDebounceRef.current);
            sendDebounceRef.current = window.setTimeout(() => {
              const toSend = pendingUtteranceRef.current.trim();
              pendingUtteranceRef.current = '';
              if (toSend && !closedRef.current && phaseRef.current === 'listening') {
                void sendTranscriptToMentor(toSend);
              }
            }, 850);
          }
        };

        rec.onerror = (ev: any) => {
          if (closedRef.current) return;
          const mapped = mapMicrophoneError(ev, { logToConsole: true });
          if (mapped.code === 'no-speech' || mapped.code === 'aborted') {
            return;
          }
          if (!didStart) {
            setErrorMsg(mapped.message);
            setPhaseSafe('error');
            return;
          }
          setErrorMsg(mapped.message);
        };

        rec.onend = () => {
          if (closedRef.current || mutedRef.current) return;
          if (phaseRef.current !== 'listening') return;
          const pending = pendingUtteranceRef.current.trim();
          if (pending) {
            pendingUtteranceRef.current = '';
            void sendTranscriptToMentor(pending);
            return;
          }
          // Fresh instance per turn after silent browser end
          window.setTimeout(() => {
            if (!closedRef.current && !mutedRef.current && phaseRef.current === 'listening') {
              startListeningRef.current();
            }
          }, 250);
        };

        rec.start();
      } catch (err) {
        const mapped = mapMicrophoneError(err, { logToConsole: true });
        setErrorMsg(mapped.message);
        setPhaseSafe('error');
      }
    },
    [sendTranscriptToMentor, setPhaseSafe, stopRecognition]
  );

  startListeningRef.current = () => startListening();

  const chargeMinute = useCallback(
    async (minuteIndex: number) => {
      if (closedRef.current || billingInFlightRef.current) return;
      billingInFlightRef.current = true;
      try {
        const res = await chargeAiCallMinute({
          callId: callIdRef.current,
          mentor: mentorId,
          depth: depthId,
          minuteIndex,
        });
        if (closedRef.current) return;
        minutesChargedRef.current = Math.max(minutesChargedRef.current, minuteIndex);
        creditsChargedRef.current += Number(res.charged || 0);
        setCreditsUsedCall(creditsChargedRef.current);
        syncBilling(res);
      } catch (err: any) {
        if (closedRef.current) return;
        if (err instanceof AiMentorApiError) {
          if (err.code === 'INSUFFICIENT_CREDITS') {
            speakNoticeAndEnd('Your credits have ended', 'Your credits have ended.');
            return;
          }
          if (err.code === 'CALL_MINUTE_LIMIT_REACHED') {
            speakNoticeAndEnd('Your daily call minutes have ended', err.message);
            return;
          }
          if (err.code === 'CALLS_DISABLED' || err.code === 'PRO_DEPTH_REQUIRED') {
            speakNoticeAndEnd('Voice calls are unavailable right now', err.message);
            return;
          }
        }
        setErrorMsg(err?.message || 'Could not verify call credits.');
      } finally {
        billingInFlightRef.current = false;
      }
    },
    [depthId, mentorId, speakNoticeAndEnd, syncBilling]
  );

  // Initialize call when modal opens
  useEffect(() => {
    if (!open) return;

    const caps = getVoiceCapabilities();
    if (!caps.hasSpeechRecognition) {
      setErrorMsg('Calls work in Chrome');
      setPhaseSafe('error');
      return;
    }
    if (caps.isInApp) {
      setErrorMsg(VOICE_ERROR_MESSAGES.inAppBrowser);
      setPhaseSafe('error');
      return;
    }
    if (!caps.isSecure) {
      setErrorMsg(VOICE_ERROR_MESSAGES.insecureContext);
      setPhaseSafe('error');
      return;
    }
    if (activeGlobalCallId) {
      setErrorMsg('Another call is already active.');
      setPhaseSafe('error');
      return;
    }

    const precheck = canContinueCallMinute({
      creditsLeft: liveCreditsRef.current,
      isUnlimited: isUnlimitedRef.current,
      depthId,
      callMinutesLeft: liveMinLeftRef.current,
    });
    if (!precheck.ok) {
      setErrorMsg(
        precheck.reason === 'DAILY_LIMIT_REACHED'
          ? 'Daily call limit reached. Come back tomorrow!'
          : `You need at least ${precheck.needed} credits for 1 minute.`
      );
      setPhaseSafe('error');
      return;
    }

    const newCallId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    activeGlobalCallId = newCallId;
    callIdRef.current = newCallId;
    closedRef.current = false;
    mutedRef.current = false;
    elapsedRef.current = 0;
    minutesChargedRef.current = 0;
    creditsChargedRef.current = 0;
    answeredRef.current = false;
    refundedRef.current = false;
    loggedEndRef.current = false;
    lastActivityRef.current = Date.now();
    historyRef.current = historyMessages
      .filter((m) => !m.isGreeting && !m.isError)
      .slice(-AI_CALL_CONFIG.maxHistoryMessages)
      .map((m) => ({ role: m.role, text: m.text }));

    setMuted(false);
    setCaption('');
    setAiCaption('');
    setErrorMsg(null);
    setElapsedSec(0);
    setCreditsUsedCall(0);
    setMinutesLeftLive(callMinutesLeft);
    setPhaseSafe('connecting');

    // Parallel warm-up: preload voices while connecting SpeechRecognition
    void loadDeviceVoices();

    let timerId: number | null = null;
    startListening(() => {
      // Charge minute 1 ONLY after real connection succeeds
      void chargeMinute(1);
      timerId = window.setInterval(() => {
        if (closedRef.current) return;
        elapsedRef.current += 1;
        setElapsedSec(elapsedRef.current);

        // Max call duration guard (10 minutes)
        if (elapsedRef.current >= AI_CALL_CONFIG.maxCallSeconds) {
          speakNoticeAndEnd('Our ten minute call has ended', '10-minute call limit reached.');
          return;
        }

        // 30-second silence auto-end while waiting for student speech
        if (
          phaseRef.current === 'listening' &&
          Date.now() - lastActivityRef.current >= AI_CALL_CONFIG.silenceTimeoutSeconds * 1000
        ) {
          speakNoticeAndEnd('Ending call due to silence', 'Ended after 30s of silence.');
          return;
        }

        // Charge at the start of each new minute (60s -> min 2, 120s -> min 3, ...)
        const currentStartedMinute = Math.floor(elapsedRef.current / 60) + 1;
        if (currentStartedMinute > minutesChargedRef.current) {
          const check = canContinueCallMinute({
            creditsLeft: liveCreditsRef.current,
            isUnlimited: isUnlimitedRef.current,
            depthId,
            callMinutesLeft: liveMinLeftRef.current,
          });
          if (!check.ok) {
            if (check.reason === 'INSUFFICIENT_CREDITS') {
              speakNoticeAndEnd('Your credits have ended', 'Your credits have ended.');
            } else {
              speakNoticeAndEnd('Your daily call minutes have ended', 'Daily call limit reached.');
            }
            return;
          }
          void chargeMinute(currentStartedMinute);
        }
      }, 1000);
    });

    const onUnload = () => {
      closedRef.current = true;
      finalizeCallResources();
    };
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);

    return () => {
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onUnload);
      if (timerId !== null) window.clearInterval(timerId);
      closedRef.current = true;
      finalizeCallResources();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handleEndCall = () => {
    closedRef.current = true;
    finalizeCallResources();
    onClose();
  };

  const handleToggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) {
      stopRecognition();
      if (phaseRef.current === 'listening') setPhaseSafe('muted');
    } else if (phaseRef.current === 'muted') {
      startListening();
    }
  };

  const handleTapInterrupt = () => {
    if (phaseRef.current !== 'speaking' && phaseRef.current !== 'thinking') return;
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {
        // ignore
      }
      abortRef.current = null;
    }
    stopMentorSpeech();
    speechQueueRef.current = [];
    speakingActiveRef.current = false;
    streamDoneRef.current = true;
    lastActivityRef.current = Date.now();
    if (mutedRef.current) setPhaseSafe('muted');
    else startListening();
  };

  const statusText =
    phase === 'connecting'
      ? 'Connecting microphone…'
      : phase === 'listening'
      ? 'Listening… speak anytime'
      : phase === 'thinking'
      ? `${mentor.name} is thinking…`
      : phase === 'speaking'
      ? 'Speaking — tap anywhere to interrupt'
      : phase === 'muted'
      ? 'Microphone muted'
      : phase === 'ending'
      ? 'Ending call…'
      : 'Call unavailable';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Voice call with ${mentor.name}`}
      className="fixed inset-0 z-[10050] flex h-[100dvh] w-full flex-col justify-between overflow-hidden px-5"
      style={{
        background: `radial-gradient(circle at 50% 34%, color-mix(in srgb, ${mentor.accent} 22%, #07080C) 0%, #07080C 72%)`,
        color: '#F5F6F8',
        paddingTop: 'calc(18px + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Top status bar: timer, credits used, remaining daily minutes */}
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 text-xs">
        <div className="min-w-0">
          <div
            className="text-base font-bold leading-tight truncate"
            style={{ fontFamily: "'Doto', var(--font-dot), sans-serif" }}
          >
            {mentor.name}
          </div>
          <div className="text-[11px] text-white/60">
            {depth.label} · {ratePerMin} cr/min
          </div>
        </div>
        <div className="flex items-center gap-3 text-right font-mono">
          <div>
            <div className="text-sm font-semibold tabular-nums">{formatTimer(elapsedSec)}</div>
            <div className="text-[10.5px] text-white/60">
              {isUnlimited ? 'Unlimited' : `${creditsUsedCall} cr used · ${minutesLeftLive}m left`}
            </div>
          </div>
        </div>
      </div>

      {/* Center stage: avatar with pulsing ring while speaking + live captions */}
      <button
        type="button"
        onClick={handleTapInterrupt}
        aria-label={phase === 'speaking' ? 'Tap to interrupt AI' : `${mentor.name} voice call`}
        className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 bg-transparent border-0 text-center cursor-pointer focus:outline-none"
      >
        <div className="relative flex items-center justify-center">
          {phase === 'speaking' && (
            <>
              <span
                className="pointer-events-none absolute h-44 w-44 rounded-full animate-ping opacity-25"
                style={{ backgroundColor: mentor.accent }}
              />
              <span
                className="pointer-events-none absolute h-36 w-36 rounded-full animate-pulse opacity-40"
                style={{ border: `2px solid ${mentor.accent}` }}
              />
            </>
          )}
          {phase === 'listening' && (
            <span
              className="pointer-events-none absolute h-36 w-36 rounded-full opacity-30 transition-transform"
              style={{ border: '2px solid rgba(255,255,255,0.45)' }}
            />
          )}
          <div className="relative z-10 rounded-full p-1.5 bg-white/5 backdrop-blur-md border border-white/15">
            <MentorAvatar mentorId={mentorId} size={124} active={phase === 'speaking'} eager />
          </div>
        </div>

        <div className="space-y-1.5 px-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-white/75">
            {phase === 'speaking' && <Volume2 className="h-3.5 w-3.5" style={{ color: mentor.accent }} />}
            <span>{statusText}</span>
          </div>

          {errorMsg && (
            <p className="text-xs font-medium text-[#FCA5A5] max-w-sm mx-auto">{errorMsg}</p>
          )}
        </div>

        {/* Live caption of what was heard + spoken response */}
        <div className="w-full max-w-sm min-h-[84px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left backdrop-blur-md">
          {caption ? (
            <p className="text-xs text-white/70 line-clamp-2">
              <span className="font-semibold text-white/90">Heard: </span>
              {caption}
            </p>
          ) : (
            <p className="text-xs text-white/45">Live captions will appear here as you speak.</p>
          )}
          {aiCaption && (
            <p className="mt-1.5 text-sm leading-snug text-white line-clamp-3">
              {aiCaption}
            </p>
          )}
        </div>
      </button>

      {/* Bottom controls: Mute + Red End call */}
      <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-8">
        <button
          type="button"
          onClick={handleToggleMute}
          disabled={phase === 'error' || phase === 'ending'}
          aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
          aria-pressed={muted}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 transition-transform active:scale-95 disabled:opacity-40 cursor-pointer"
          style={{
            backgroundColor: muted ? '#FFFFFF' : 'rgba(255,255,255,0.12)',
            color: muted ? '#07080C' : '#FFFFFF',
          }}
        >
          {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>

        <button
          type="button"
          onClick={handleEndCall}
          aria-label="End call"
          className="flex h-16 w-16 items-center justify-center rounded-full border-0 text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
          style={{ backgroundColor: '#E8353B' }}
        >
          <PhoneOff className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
};
