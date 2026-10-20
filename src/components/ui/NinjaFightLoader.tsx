import React from 'react';

/**
 * Matrix-Style Dot-Matrix Ninja Fight Loader
 * - Replaces generic grey skeletons with an inline SVG dot-matrix fight scene.
 * - Same dark background (#050508), dark red radial glow, and floating red particles across light & dark themes.
 * - 4 distinct ninjas (light-colored white/soft-light dots with red sword & scarf accents).
 * - Dashing, jumping, slashing, clashing with sword spark bursts.
 * - Animated with transform and opacity only.
 * - Full prefers-reduced-motion fallback.
 */
export const NinjaFightLoader: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className="relative w-full min-h-[65vh] sm:min-h-[75vh] flex items-center justify-center overflow-hidden select-none rounded-2xl"
      style={{
        backgroundColor: '#050508',
        color: '#FFFFFF',
      }}
    >
      {/* ─── Ambient Dark Red Radial Glow (Identical across themes) ─── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(215, 25, 33, 0.32) 0%, rgba(140, 15, 20, 0.14) 42%, transparent 72%), radial-gradient(circle at 80% 20%, rgba(180, 20, 25, 0.12) 0%, transparent 50%)',
        }}
      />

      {/* ─── Floating Red Particles Background ─── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="particle-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF4D55" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D71921" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Small floating ambient red particles */}
        <circle cx="120" cy="80" r="1.8" fill="#FF4D55" className="animate-particle-1" />
        <circle cx="280" cy="380" r="2.2" fill="#D71921" className="animate-particle-2" />
        <circle cx="680" cy="140" r="1.6" fill="#FF4D55" className="animate-particle-3" />
        <circle cx="720" cy="420" r="2.4" fill="#D71921" className="animate-particle-1" />
        <circle cx="450" cy="90" r="1.5" fill="#FF4D55" className="animate-particle-2" />
        <circle cx="190" cy="440" r="2.0" fill="#D71921" className="animate-particle-3" />
        <circle cx="580" cy="360" r="1.8" fill="#FF4D55" className="animate-particle-1" />
        <circle cx="340" cy="190" r="2.5" fill="url(#particle-glow)" className="animate-particle-2" />
        <circle cx="510" cy="440" r="2.0" fill="#FF4D55" className="animate-particle-3" />
      </svg>

      {/* ─── 4 Dot-Matrix Ninjas Fight Arena (Inline SVG Dots) ─── */}
      <div className="relative w-full max-w-[720px] aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center">
        <svg
          viewBox="0 0 720 420"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Spark Glow Gradient */}
            <radialGradient id="clash-spark-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF" stopOpacity="1" />
              <stop offset="40%" stopColor="#FFD700" stopOpacity="0.8" />
              <stop offset="80%" stopColor="#D71921" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#D71921" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ════════════ NINJA 1 (Left Attacker - Dual Katana Dasher) ════════════ */}
          <g className="ninja-1-group">
            {/* Scarf / Headband trailing ribbon dots (Red) */}
            <circle cx="-16" cy="10" r="2" fill="#D71921" />
            <circle cx="-12" cy="9" r="2.2" fill="#FF333D" />
            <circle cx="-8" cy="8" r="2.2" fill="#FF4D55" />
            {/* Head dots (White) */}
            <circle cx="0" cy="6" r="2.5" fill="#FFFFFF" />
            <circle cx="4" cy="6" r="2.5" fill="#FFFFFF" />
            <circle cx="0" cy="10" r="2.5" fill="#E2E8F0" />
            <circle cx="4" cy="10" r="2.5" fill="#E2E8F0" />
            {/* Torso dots */}
            <circle cx="2" cy="16" r="2.6" fill="#F8FAFC" />
            <circle cx="2" cy="22" r="2.6" fill="#E2E8F0" />
            <circle cx="2" cy="28" r="2.5" fill="#CBD5E1" />
            {/* Forward striking arm & Katana dots (White + Red tip) */}
            <circle cx="8" cy="16" r="2.2" fill="#E2E8F0" />
            <circle cx="14" cy="14" r="2" fill="#F8FAFC" />
            <circle cx="20" cy="11" r="2" fill="#FFFFFF" />
            <circle cx="26" cy="8" r="1.9" fill="#FFFFFF" />
            <circle cx="32" cy="5" r="1.9" fill="#FFFFFF" />
            <circle cx="38" cy="2" r="1.8" fill="#FF333D" />
            {/* Back guard arm */}
            <circle cx="-4" cy="18" r="2" fill="#CBD5E1" />
            <circle cx="-10" cy="22" r="1.8" fill="#94A3B8" />
            {/* Legs (Dynamic lunging pose) */}
            <circle cx="8" cy="34" r="2.4" fill="#E2E8F0" />
            <circle cx="12" cy="40" r="2.2" fill="#CBD5E1" />
            <circle cx="-4" cy="34" r="2.4" fill="#E2E8F0" />
            <circle cx="-10" cy="38" r="2.2" fill="#94A3B8" />
          </g>

          {/* ════════════ NINJA 2 (Right Defender - Vault & Cross Slash) ════════════ */}
          <g className="ninja-2-group">
            {/* Trailing sash (Red) */}
            <circle cx="16" cy="8" r="2" fill="#D71921" />
            <circle cx="12" cy="9" r="2.2" fill="#FF333D" />
            <circle cx="8" cy="9" r="2.2" fill="#FF4D55" />
            {/* Head dots */}
            <circle cx="0" cy="6" r="2.5" fill="#FFFFFF" />
            <circle cx="-4" cy="6" r="2.5" fill="#FFFFFF" />
            <circle cx="0" cy="10" r="2.5" fill="#E2E8F0" />
            <circle cx="-4" cy="10" r="2.5" fill="#E2E8F0" />
            {/* Torso dots */}
            <circle cx="-2" cy="16" r="2.6" fill="#F8FAFC" />
            <circle cx="-2" cy="22" r="2.6" fill="#E2E8F0" />
            <circle cx="-2" cy="28" r="2.5" fill="#CBD5E1" />
            {/* Parry Katana (Arcing downward) */}
            <circle cx="-8" cy="15" r="2.2" fill="#E2E8F0" />
            <circle cx="-14" cy="12" r="2" fill="#FFFFFF" />
            <circle cx="-20" cy="10" r="2" fill="#FFFFFF" />
            <circle cx="-26" cy="8" r="1.9" fill="#FFFFFF" />
            <circle cx="-32" cy="6" r="1.9" fill="#FFFFFF" />
            <circle cx="-38" cy="4" r="1.8" fill="#FF333D" />
            {/* Legs (Spring leap stance) */}
            <circle cx="-8" cy="34" r="2.4" fill="#E2E8F0" />
            <circle cx="-12" cy="40" r="2.2" fill="#CBD5E1" />
            <circle cx="4" cy="33" r="2.4" fill="#E2E8F0" />
            <circle cx="8" cy="37" r="2.2" fill="#94A3B8" />
          </g>

          {/* ════════════ NINJA 3 (Top Infiltrator - Downward Dive Strike) ════════════ */}
          <g className="ninja-3-group">
            {/* Trailing head ribbon */}
            <circle cx="0" cy="-14" r="2" fill="#D71921" />
            <circle cx="2" cy="-9" r="2.2" fill="#FF333D" />
            {/* Head */}
            <circle cx="0" cy="0" r="2.6" fill="#FFFFFF" />
            <circle cx="0" cy="5" r="2.6" fill="#FFFFFF" />
            {/* Torso */}
            <circle cx="0" cy="11" r="2.5" fill="#F8FAFC" />
            <circle cx="0" cy="17" r="2.5" fill="#E2E8F0" />
            {/* Diving downward blade */}
            <circle cx="0" cy="23" r="2.2" fill="#FFFFFF" />
            <circle cx="0" cy="29" r="2" fill="#FFFFFF" />
            <circle cx="0" cy="35" r="2" fill="#FFFFFF" />
            <circle cx="0" cy="41" r="1.9" fill="#FF333D" />
            {/* Tucked legs */}
            <circle cx="-6" cy="8" r="2.2" fill="#CBD5E1" />
            <circle cx="6" cy="8" r="2.2" fill="#CBD5E1" />
          </g>

          {/* ════════════ NINJA 4 (Bottom Ambusher - Rising Uppercut Slash) ════════════ */}
          <g className="ninja-4-group">
            {/* Rising blade */}
            <circle cx="0" cy="-28" r="1.8" fill="#FF333D" />
            <circle cx="0" cy="-22" r="2" fill="#FFFFFF" />
            <circle cx="0" cy="-16" r="2" fill="#FFFFFF" />
            <circle cx="0" cy="-10" r="2.2" fill="#F8FAFC" />
            {/* Head */}
            <circle cx="0" cy="-4" r="2.6" fill="#FFFFFF" />
            {/* Ribbon */}
            <circle cx="-6" cy="-2" r="2" fill="#D71921" />
            {/* Torso */}
            <circle cx="0" cy="4" r="2.5" fill="#E2E8F0" />
            <circle cx="0" cy="10" r="2.5" fill="#CBD5E1" />
            {/* Sliding stance legs */}
            <circle cx="-8" cy="15" r="2.2" fill="#E2E8F0" />
            <circle cx="-16" cy="18" r="2" fill="#94A3B8" />
            <circle cx="8" cy="14" r="2.2" fill="#E2E8F0" />
          </g>

          {/* ════════════ SWORD CLASH SPARKS BURSTS (Animated via Scale & Opacity) ════════════ */}
          {/* Main Center Clash */}
          <g className="clash-burst-1">
            <circle cx="360" cy="210" r="12" fill="url(#clash-spark-glow)" />
            <circle cx="350" cy="202" r="2" fill="#FFF" />
            <circle cx="370" cy="200" r="2.2" fill="#FFD700" />
            <circle cx="365" cy="222" r="1.8" fill="#FF333D" />
            <circle cx="348" cy="216" r="1.6" fill="#FFF" />
            <circle cx="374" cy="215" r="1.6" fill="#FF4D55" />
            <line x1="344" y1="210" x2="376" y2="210" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="360" y1="194" x2="360" y2="226" stroke="#FFD700" strokeWidth="1.2" strokeLinecap="round" />
          </g>

          {/* Secondary Left Clash */}
          <g className="clash-burst-2">
            <circle cx="280" cy="190" r="9" fill="url(#clash-spark-glow)" />
            <circle cx="274" cy="184" r="1.8" fill="#FFF" />
            <circle cx="286" cy="186" r="1.6" fill="#FFD700" />
            <circle cx="280" cy="196" r="1.6" fill="#FF333D" />
          </g>

          {/* Secondary Right Clash */}
          <g className="clash-burst-3">
            <circle cx="440" cy="220" r="9" fill="url(#clash-spark-glow)" />
            <circle cx="434" cy="216" r="1.8" fill="#FFF" />
            <circle cx="446" cy="218" r="1.6" fill="#FFD700" />
            <circle cx="440" cy="226" r="1.6" fill="#FF333D" />
          </g>
        </svg>

        {/* Ambient Loading Label underneath */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] animate-pulse" />
          <span
            className="text-xs font-mono font-bold tracking-widest uppercase"
            style={{ color: '#E2E8F0' }}
          >
            Boardly Drill Arena Loading
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D71921] animate-pulse" />
        </div>
      </div>

      {/* ─── INLINE CSS KEYFRAMES (Transform & Opacity Only, with Reduced Motion Fallback) ─── */}
      <style>{`
        /* ── Ninja 1 (Left Attacker): dashes in, strikes center, leaps back ── */
        @keyframes ninja1Move {
          0% {
            transform: translate(60px, 210px);
            opacity: 0;
          }
          10% {
            transform: translate(140px, 210px);
            opacity: 1;
          }
          30% {
            transform: translate(320px, 205px);
            opacity: 1;
          }
          45% {
            transform: translate(340px, 200px);
            opacity: 1;
          }
          65% {
            transform: translate(220px, 160px);
            opacity: 0.95;
          }
          85% {
            transform: translate(100px, 220px);
            opacity: 0.8;
          }
          100% {
            transform: translate(60px, 210px);
            opacity: 0;
          }
        }

        /* ── Ninja 2 (Right Defender): vaults in, spins, parries, flips back ── */
        @keyframes ninja2Move {
          0% {
            transform: translate(660px, 210px);
            opacity: 0;
          }
          12% {
            transform: translate(580px, 205px);
            opacity: 1;
          }
          32% {
            transform: translate(400px, 205px);
            opacity: 1;
          }
          48% {
            transform: translate(380px, 210px);
            opacity: 1;
          }
          68% {
            transform: translate(500px, 240px);
            opacity: 0.95;
          }
          88% {
            transform: translate(620px, 200px);
            opacity: 0.8;
          }
          100% {
            transform: translate(660px, 210px);
            opacity: 0;
          }
        }

        /* ── Ninja 3 (Top Diver): dives down, clashes, rolls upward ── */
        @keyframes ninja3Move {
          0% {
            transform: translate(360px, 30px);
            opacity: 0;
          }
          15% {
            transform: translate(360px, 70px);
            opacity: 0.7;
          }
          38% {
            transform: translate(360px, 175px);
            opacity: 1;
          }
          52% {
            transform: translate(360px, 185px);
            opacity: 1;
          }
          70% {
            transform: translate(330px, 90px);
            opacity: 0.85;
          }
          90% {
            transform: translate(360px, 40px);
            opacity: 0.4;
          }
          100% {
            transform: translate(360px, 30px);
            opacity: 0;
          }
        }

        /* ── Ninja 4 (Bottom Ambusher): slides in, uppercuts, backflips ── */
        @keyframes ninja4Move {
          0% {
            transform: translate(360px, 390px);
            opacity: 0;
          }
          18% {
            transform: translate(360px, 330px);
            opacity: 0.8;
          }
          42% {
            transform: translate(360px, 245px);
            opacity: 1;
          }
          56% {
            transform: translate(360px, 235px);
            opacity: 1;
          }
          74% {
            transform: translate(390px, 310px);
            opacity: 0.85;
          }
          92% {
            transform: translate(360px, 370px);
            opacity: 0.4;
          }
          100% {
            transform: translate(360px, 390px);
            opacity: 0;
          }
        }

        /* ── Sword Clash Bursts: scale & opacity spikes on contact ── */
        @keyframes clashFlash1 {
          0%, 28% {
            transform: scale(0.2);
            opacity: 0;
          }
          33%, 38% {
            transform: scale(1.3);
            opacity: 1;
          }
          44% {
            transform: scale(1.6);
            opacity: 0;
          }
          100% {
            transform: scale(0.2);
            opacity: 0;
          }
        }

        @keyframes clashFlash2 {
          0%, 60% {
            transform: scale(0.2);
            opacity: 0;
          }
          64%, 69% {
            transform: scale(1.2);
            opacity: 1;
          }
          74% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            transform: scale(0.2);
            opacity: 0;
          }
        }

        @keyframes clashFlash3 {
          0%, 46% {
            transform: scale(0.2);
            opacity: 0;
          }
          50%, 54% {
            transform: scale(1.2);
            opacity: 1;
          }
          59% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            transform: scale(0.2);
            opacity: 0;
          }
        }

        /* ── Ambient Floating Particles Drift ── */
        @keyframes particleDrift1 {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.4;
          }
          50% {
            transform: translate(8px, -14px);
            opacity: 0.85;
          }
        }

        @keyframes particleDrift2 {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.3;
          }
          50% {
            transform: translate(-10px, -18px);
            opacity: 0.9;
          }
        }

        @keyframes particleDrift3 {
          0%, 100% {
            transform: translate(0, 0);
            opacity: 0.5;
          }
          50% {
            transform: translate(12px, -8px);
            opacity: 0.8;
          }
        }

        /* Attach animations with smooth easing */
        .ninja-1-group {
          animation: ninja1Move 2.6s cubic-bezier(0.25, 1, 0.5, 1) infinite;
          will-change: transform, opacity;
        }
        .ninja-2-group {
          animation: ninja2Move 2.6s cubic-bezier(0.25, 1, 0.5, 1) infinite;
          will-change: transform, opacity;
        }
        .ninja-3-group {
          animation: ninja3Move 2.6s cubic-bezier(0.25, 1, 0.5, 1) infinite;
          will-change: transform, opacity;
        }
        .ninja-4-group {
          animation: ninja4Move 2.6s cubic-bezier(0.25, 1, 0.5, 1) infinite;
          will-change: transform, opacity;
        }
        .clash-burst-1 {
          transform-origin: 360px 210px;
          animation: clashFlash1 2.6s ease-out infinite;
          will-change: transform, opacity;
        }
        .clash-burst-2 {
          transform-origin: 280px 190px;
          animation: clashFlash2 2.6s ease-out infinite;
          will-change: transform, opacity;
        }
        .clash-burst-3 {
          transform-origin: 440px 220px;
          animation: clashFlash3 2.6s ease-out infinite;
          will-change: transform, opacity;
        }
        .animate-particle-1 {
          animation: particleDrift1 4s ease-in-out infinite;
        }
        .animate-particle-2 {
          animation: particleDrift2 5s ease-in-out infinite;
        }
        .animate-particle-3 {
          animation: particleDrift3 4.5s ease-in-out infinite;
        }

        /* ── Prefers Reduced Motion Fallback: elegant static action stances ── */
        @media (prefers-reduced-motion: reduce) {
          .ninja-1-group {
            animation: none !important;
            transform: translate(290px, 205px) !important;
            opacity: 1 !important;
          }
          .ninja-2-group {
            animation: none !important;
            transform: translate(430px, 205px) !important;
            opacity: 1 !important;
          }
          .ninja-3-group {
            animation: none !important;
            transform: translate(360px, 140px) !important;
            opacity: 1 !important;
          }
          .ninja-4-group {
            animation: none !important;
            transform: translate(360px, 270px) !important;
            opacity: 1 !important;
          }
          .clash-burst-1 {
            animation: none !important;
            transform: scale(1) !important;
            opacity: 0.8 !important;
          }
          .clash-burst-2, .clash-burst-3 {
            display: none !important;
          }
          .animate-particle-1, .animate-particle-2, .animate-particle-3 {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default NinjaFightLoader;
