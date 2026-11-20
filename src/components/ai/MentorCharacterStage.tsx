import React, { useEffect, useRef, useState } from 'react';
import type { AiMentorId } from '@/utils/aiMentorsLogic';
import {
  getMentorCharacterProfile,
  shouldUseStaticPortraitFallback,
  type MentorPoseState,
} from './mentorCharacterConfig';
import { getSharedMentorWebGLEngine } from './mentorWebglEngine';

export interface MentorCharacterStageProps {
  mentorId: AiMentorId;
  pose: MentorPoseState;
  /** Incremented whenever a fresh streamed text chunk arrives for lip-sync */
  speechSeq?: number;
  speechChunk?: string;
  /** Incremented on user send to trigger a crisp nod */
  nodSeq?: number;
  size?: 'hero' | 'compact';
  className?: string;
  stageRef?: React.Ref<HTMLDivElement>;
}

/**
 * Interactive bust-framed mentor character stage.
 * Uses one shared Three.js WebGL context (lazy-loaded) with smooth fallback to a static
 * studio portrait on low-end devices, prefers-reduced-motion, or when WebGL is unavailable.
 */
export const MentorCharacterStage: React.FC<MentorCharacterStageProps> = ({
  mentorId,
  pose,
  speechSeq = 0,
  speechChunk = '',
  nodSeq = 0,
  size = 'hero',
  className = '',
  stageRef,
}) => {
  const profile = getMentorCharacterProfile(mentorId);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [useStatic, setUseStatic] = useState<boolean>(() => shouldUseStaticPortraitFallback());
  const [webglReady, setWebglReady] = useState(false);

  // Mount shared WebGL renderer when interactive mode is allowed
  useEffect(() => {
    if (useStatic) return;
    const host = hostRef.current;
    if (!host) return;

    const engine = getSharedMentorWebGLEngine();
    const ok = engine.mount(
      host,
      mentorId,
      () => setWebglReady(true),
      () => setUseStatic(true)
    );
    if (!ok) {
      setUseStatic(true);
    }

    return () => {
      engine.unmount(host);
    };
    // Only remount if static fallback flips; mentor changes are handled dynamically without tearing down context
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useStatic]);

  // Swap mentor texture, landmarks & accent rim color on the single shared context
  useEffect(() => {
    if (useStatic) return;
    const engine = getSharedMentorWebGLEngine();
    engine.setMentor(
      mentorId,
      () => setWebglReady(true),
      () => setUseStatic(true)
    );
  }, [mentorId, useStatic]);

  // Update character pose (idle | nod | thinking | speaking)
  useEffect(() => {
    if (useStatic) return;
    getSharedMentorWebGLEngine().setPose(pose);
  }, [pose, useStatic]);

  // Trigger crisp nod on send
  useEffect(() => {
    if (useStatic || nodSeq <= 0) return;
    getSharedMentorWebGLEngine().triggerNod();
  }, [nodSeq, useStatic]);

  // Feed incoming streamed text chunks directly into the viseme lip-sync queue
  useEffect(() => {
    if (useStatic || !speechChunk) return;
    getSharedMentorWebGLEngine().pushSpeechText(speechChunk);
  }, [speechSeq, speechChunk, useStatic]);

  const dimsClass =
    size === 'hero'
      ? 'w-[138px] h-[184px] sm:w-[162px] sm:h-[216px]'
      : 'w-[104px] h-[138px] sm:w-[116px] sm:h-[154px]';

  return (
    <div
      ref={stageRef}
      className={`relative shrink-0 select-none ${dimsClass} ${className}`}
      aria-label={`${profile.name}, ${profile.role}`}
    >
      {/* Subtle mentor-accent studio halo behind transparent bust */}
      <div
        className="pointer-events-none absolute inset-x-2 bottom-2 top-5 rounded-full blur-2xl transition-all duration-500"
        style={{
          background: `radial-gradient(circle at 50% 45%, color-mix(in srgb, ${profile.accentHex} ${
            pose === 'thinking' ? '34%' : pose === 'speaking' ? '28%' : '20%'
          }, transparent), transparent 72%)`,
        }}
        aria-hidden="true"
      />

      {/* Static portrait shown immediately while WebGL texture warms up, or permanently on low-end / reduced-motion */}
      <img
        src={profile.bustWebp}
        alt={profile.name}
        loading="eager"
        decoding="async"
        draggable={false}
        referrerPolicy="no-referrer"
        className={`pointer-events-none absolute inset-0 h-full w-full object-contain object-bottom transition-opacity duration-200 ${
          !useStatic && webglReady ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          filter: `drop-shadow(0 6px 18px color-mix(in srgb, ${profile.accentHex} 24%, rgba(0,0,0,0.45)))`,
        }}
      />

      {/* Shared WebGL Canvas Host */}
      {!useStatic && (
        <div
          ref={hostRef}
          className={`absolute inset-0 h-full w-full transition-opacity duration-200 ${
            webglReady ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};

export default MentorCharacterStage;
