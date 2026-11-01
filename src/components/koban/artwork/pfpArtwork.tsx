import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StoreFxCanvas } from '../fx/StoreFxCanvas';
import { StoreLoopVideo, storeVideoGovernor } from '../fx/StoreLoopVideo';
import {
  COLOR_RAMPS,
  ParticleShape,
  drawSwayingTailMesh,
  storeFxScheduler,
  type EmitterConfig,
  type LightningConfig,
} from '../fx/storeFxEngine';

interface PfpSvgProps {
  canAnimate?: boolean;
  className?: string;
}

/**
 * 25 FULL-ART PROFILE PICTURES (13 Static, 12 Animated)
 * Each PFP is a complete, multi-layered (6-10 layers) 256x256 illustration.
 * Features gradients, soft glows, shadows, highlights, and foreground/midground/background depth.
 * Animated items move only transform and opacity, looping 4-8s.
 * Static items have ZERO motion.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 12 ANIMATED PROFILE PICTURES
// ─────────────────────────────────────────────────────────────────────────────

// 1. Crimson Ronin (Legendary) - Animated
export const PfpCrimsonRonin: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="cr-bg" cx="50%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#2A080C" />
        <stop offset="65%" stopColor="#120406" />
        <stop offset="100%" stopColor="#050102" />
      </radialGradient>
      <radialGradient id="cr-moon" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FFA4A4" />
        <stop offset="35%" stopColor="#EF4444" />
        <stop offset="75%" stopColor="#B91C1C" />
        <stop offset="100%" stopColor="#450A0A" />
      </radialGradient>
      <linearGradient id="cr-mist" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7F1D1D" stopOpacity="0" />
        <stop offset="100%" stopColor="#DC2626" stopOpacity="0.45" />
      </linearGradient>
    </defs>
    {/* Layer 1: Dark Crimson Night Sky */}
    <rect width="256" height="256" fill="url(#cr-bg)" />
    {/* Layer 2: Giant Crimson Blood Moon with breathing pulse */}
    <circle
      cx="128"
      cy="105"
      r="68"
      fill="url(#cr-moon)"
      style={canAnimate ? { animation: 'koban-pulse-glow 5s ease-in-out infinite' } : undefined}
    />
    <circle cx="128" cy="105" r="76" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.3" />
    {/* Layer 3: Distant Mountain Jagged Silhouettes */}
    <path d="M-10 195L45 145L105 180L165 135L266 205V256H-10Z" fill="#0D0304" opacity="0.9" />
    <path d="M35 210L90 168L145 200L205 158L270 210V256H35Z" fill="#1A0609" opacity="0.75" />
    {/* Layer 4: Lone Ronin Silhouette */}
    <g transform="translate(100, 110)">
      {/* Straw Jingasa Kasa Hat */}
      <path d="M6 44C18 36 38 36 50 44L28 26L6 44Z" fill="#050102" />
      {/* Head & Neck */}
      <circle cx="28" cy="48" r="6" fill="#050102" />
      {/* Kimono & Haori */}
      <path d="M14 54C20 50 36 50 42 54L48 95H8L14 54Z" fill="#050102" />
      {/* Scarf / Cloth flutter with sway */}
      <g style={canAnimate ? { animation: 'koban-lantern-sway 2.5s ease-in-out infinite', transformOrigin: '20px 56px' } : undefined}>
        <path d="M20 56C8 60 4 72 -2 80C8 74 14 65 18 58Z" fill="#DC2626" />
      </g>
      {/* Sheathed Katana Slanted */}
      <line x1="38" y1="60" x2="64" y2="92" stroke="#2B070B" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="34" y1="54" x2="40" y2="62" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" />
    </g>
    {/* Layer 5: Atmospheric Mist Gradient */}
    <rect y="175" width="256" height="81" fill="url(#cr-mist)" />
    {/* Layer 6: Drifting Red Embers Rising Looping */}
    <g style={canAnimate ? { animation: 'koban-ember-rise 2.8s ease-out infinite' } : undefined}>
      <circle cx="45" cy="80" r="2.5" fill="#FCA5A5" opacity="0.9" />
      <circle cx="85" cy="50" r="1.8" fill="#EF4444" opacity="0.95" />
      <circle cx="210" cy="95" r="3" fill="#F87171" opacity="0.85" />
      <circle cx="175" cy="65" r="2" fill="#FCA5A5" opacity="0.9" />
      <circle cx="60" cy="140" r="2.2" fill="#DC2626" opacity="0.8" />
    </g>
  </svg>
);

// 2. Sakura Kitsune (Legendary) - Animated
export const PfpSakuraKitsune: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="sk-bg" cx="50%" cy="45%" r="75%">
        <stop offset="0%" stopColor="#3B0764" />
        <stop offset="60%" stopColor="#1E1B4B" />
        <stop offset="100%" stopColor="#090514" />
      </radialGradient>
      <linearGradient id="sk-mask" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#FCE7F3" />
      </linearGradient>
    </defs>
    <rect width="256" height="256" fill="url(#sk-bg)" />
    {/* Soft Moon Halo */}
    <circle cx="128" cy="115" r="80" fill="#701A75" opacity="0.35" />
    {/* Cherry Branches Silhouette */}
    <path d="M0 35Q60 25 110 65T220 45" stroke="#2E1065" strokeWidth="4" strokeLinecap="round" />
    {/* Kitsune Mask (Central Emblem) */}
    <g transform="translate(68, 44)">
      {/* Ears */}
      <polygon points="15,40 35,0 55,35" fill="#FDF2F8" stroke="#E11D48" strokeWidth="2.5" />
      <polygon points="25,35 35,10 47,32" fill="#E11D48" />
      <polygon points="65,35 85,0 105,40" fill="#FDF2F8" stroke="#E11D48" strokeWidth="2.5" />
      <polygon points="73,32 85,10 95,35" fill="#E11D48" />
      {/* Face Base */}
      <path d="M15 45C10 85 35 130 60 148C85 130 110 85 105 45C90 40 30 40 15 45Z" fill="url(#sk-mask)" stroke="#E11D48" strokeWidth="2.5" />
      {/* Eye Slits with Glowing violet pulse */}
      <path d="M30 78C38 74 46 80 50 85C42 85 34 83 30 78Z" fill="#701A75" />
      <path d="M90 78C82 74 74 80 70 85C78 85 86 83 90 78Z" fill="#701A75" />
      <circle cx="40" cy="81" r="3" fill="#C084FC" style={canAnimate ? { animation: 'koban-pulse-glow 2.2s ease-in-out infinite' } : undefined} />
      <circle cx="80" cy="81" r="3" fill="#C084FC" style={canAnimate ? { animation: 'koban-pulse-glow 2.2s ease-in-out infinite' } : undefined} />
      {/* Vermilion Facial Markings */}
      <path d="M60 92L60 112" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 65C30 62 40 66 45 70" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M98 65C90 62 80 66 75 70" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 95C32 98 42 96 46 90" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M96 95C88 98 78 96 74 90" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="60" cy="120" r="3" fill="#BE123C" />
      {/* Red Cord and Tassels */}
      <path d="M12 90C-5 110 5 140 10 160" stroke="#BE123C" strokeWidth="2" />
      <circle cx="10" cy="162" r="3.5" fill="#F59E0B" />
      <path d="M108 90C125 110 115 140 110 160" stroke="#BE123C" strokeWidth="2" />
      <circle cx="110" cy="162" r="3.5" fill="#F59E0B" />
    </g>
    {/* Swirling Sakura Petals (animated drift) */}
    <g style={canAnimate ? { animation: 'koban-petal-fall 4s ease-in-out infinite' } : undefined}>
      <path d="M40 70C46 64 54 68 52 74C46 80 38 76 40 70Z" fill="#F472B6" opacity="0.95" />
      <path d="M210 110C216 104 224 108 222 114C216 120 208 116 210 110Z" fill="#FB7185" opacity="0.9" />
      <path d="M70 170C76 164 84 168 82 174C76 180 68 176 70 170Z" fill="#F472B6" opacity="0.95" />
      <path d="M180 150C186 144 194 148 192 154C186 160 178 156 180 150Z" fill="#FDA4AF" opacity="0.85" />
    </g>
  </svg>
);

// 3. Waterfall Dragon (Legendary) - Animated
export const PfpWaterfallDragon: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wd-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#082F49" />
        <stop offset="60%" stopColor="#0C4A6E" />
        <stop offset="100%" stopColor="#031E2E" />
      </linearGradient>
      <linearGradient id="wd-flow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.95" />
      </linearGradient>
      <linearGradient id="wd-dragon" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="50%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#E0F2FE" />
      </linearGradient>
    </defs>
    <rect width="256" height="256" fill="url(#wd-bg)" />
    {/* Craggy Cliffs */}
    <path d="M0 0H60L45 120L75 256H0Z" fill="#031E2E" />
    <path d="M256 0H196L211 110L181 256H256Z" fill="#031E2E" />
    {/* Cascading Waterfall */}
    <rect x="75" y="0" width="106" height="256" fill="url(#wd-flow)" opacity="0.65" />
    {/* Waterfall Rapids motion */}
    <g
      stroke="#FFFFFF"
      strokeWidth="1.5"
      opacity="0.75"
      style={canAnimate ? { animation: 'koban-grid-scroll 1.8s linear infinite' } : undefined}
    >
      <line x1="90" y1="0" x2="90" y2="256" strokeDasharray="12 18" />
      <line x1="110" y1="0" x2="110" y2="256" strokeDasharray="16 22" />
      <line x1="128" y1="0" x2="128" y2="256" strokeDasharray="20 15" />
      <line x1="148" y1="0" x2="148" y2="256" strokeDasharray="14 20" />
      <line x1="168" y1="0" x2="168" y2="256" strokeDasharray="18 16" />
    </g>
    {/* Serpentine Dragon Coiling Upward */}
    <path
      d="M135 240C90 210 80 160 120 130C160 100 170 50 125 35C100 25 80 40 85 60"
      stroke="url(#wd-dragon)"
      strokeWidth="20"
      strokeLinecap="round"
      style={canAnimate ? { animation: 'koban-pulse-glow 4s ease-in-out infinite' } : undefined}
    />
    {/* Dragon Spines & Whiskers with sway */}
    <g
      stroke="#F0F9FF"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={canAnimate ? { animation: 'koban-lantern-sway 3s ease-in-out infinite', transformOrigin: '125px 35px' } : undefined}
    >
      <path d="M125 35L145 15M125 35L150 28" />
      <path d="M115 30C100 15 85 20 80 30" />
      <circle cx="120" cy="32" r="3" fill="#FBBF24" />
    </g>
    {/* Mist and foam splash with ripple */}
    <ellipse
      cx="128"
      cy="245"
      rx="70"
      ry="16"
      fill="#BAE6FD"
      opacity="0.8"
      style={canAnimate ? { animation: 'koban-water-ripple 2.8s ease-in-out infinite' } : undefined}
    />
  </svg>
);

// 4. Mist Torii Gate (Epic) - Animated
export const PfpMistToriiGate: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mt-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="60%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
    </defs>
    <rect width="256" height="256" fill="url(#mt-sky)" />
    {/* Night Stars */}
    <circle cx="50" cy="40" r="1.5" fill="#FFFFFF" style={canAnimate ? { animation: 'koban-star-twinkle 2.5s ease-in-out infinite' } : undefined} />
    <circle cx="190" cy="35" r="1.8" fill="#FFFFFF" style={canAnimate ? { animation: 'koban-star-twinkle 3.2s ease-in-out infinite 0.8s' } : undefined} />
    <circle cx="128" cy="25" r="1.5" fill="#FFFFFF" opacity="0.7" />
    {/* Stone Steps */}
    <path d="M30 256L60 210H196L226 256H30Z" fill="#0F172A" />
    <path d="M50 220H206V226H50Z" fill="#1E293B" />
    <path d="M60 232H196V238H60Z" fill="#1E293B" />
    {/* Grand Scarlet Torii Gate */}
    <g fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1">
      <path d="M28 75C70 68 186 68 228 75L232 88C184 81 72 81 24 88L28 75Z" />
      <rect x="42" y="94" width="172" height="12" />
      <rect x="120" y="84" width="16" height="24" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.5" />
      <rect x="62" y="94" width="18" height="120" rx="3" />
      <rect x="176" y="94" width="18" height="120" rx="3" />
      <rect x="58" y="196" width="26" height="18" fill="#1E293B" rx="2" />
      <rect x="172" y="196" width="26" height="18" fill="#1E293B" rx="2" />
    </g>
    {/* Hanging Paper Lanterns with Flickering Warm Glow & Sway */}
    <g transform="translate(71, 110)" style={canAnimate ? { animation: 'koban-lantern-sway 3.2s ease-in-out infinite', transformOrigin: '0px 0px' } : undefined}>
      <rect x="-1" y="0" width="2" height="10" fill="#78350F" />
      <ellipse cx="0" cy="22" rx="9" ry="13" fill="#EA580C" />
      <ellipse
        cx="0"
        cy="22"
        rx="6"
        ry="9"
        fill="#FDE047"
        style={canAnimate ? { animation: 'koban-flame-flicker 1.8s ease-in-out infinite' } : undefined}
      />
    </g>
    <g transform="translate(185, 110)" style={canAnimate ? { animation: 'koban-lantern-sway 3.2s ease-in-out infinite 0.6s', transformOrigin: '0px 0px' } : undefined}>
      <rect x="-1" y="0" width="2" height="10" fill="#78350F" />
      <ellipse cx="0" cy="22" rx="9" ry="13" fill="#EA580C" />
      <ellipse
        cx="0"
        cy="22"
        rx="6"
        ry="9"
        fill="#FDE047"
        style={canAnimate ? { animation: 'koban-flame-flicker 1.8s ease-in-out infinite 0.6s' } : undefined}
      />
    </g>
    {/* Rolling Night Fog Over Steps */}
    <path
      d="M0 220C60 215 120 230 180 220C210 215 240 225 256 220V256H0Z"
      fill="#E2E8F0"
      opacity="0.3"
      style={canAnimate ? { animation: 'koban-aurora-wave 4s ease-in-out infinite' } : undefined}
    />
  </svg>
);

// 5. Thunder Kami (Epic) - Animated
export const PfpThunderKami: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#0C0A1D" />
    {/* Rolling Dark Stormclouds with Pulse */}
    <g style={canAnimate ? { animation: 'koban-pulse-glow 3.5s ease-in-out infinite' } : undefined}>
      <circle cx="70" cy="190" r="60" fill="#1E1B4B" opacity="0.95" />
      <circle cx="150" cy="205" r="70" fill="#2E1065" opacity="0.9" />
      <circle cx="210" cy="180" r="55" fill="#1E1B4B" opacity="0.95" />
    </g>
    {/* Thunder Halo / Taiko Drums Ring */}
    <g transform="translate(128, 120)">
      <circle cx="0" cy="0" r="85" stroke="#F59E0B" strokeWidth="2" strokeDasharray="10 18" opacity="0.6" />
      {[-120, -60, 0, 60, 120, 180].map((deg) => (
        <circle
          key={deg}
          cx={Math.cos((deg * Math.PI) / 180) * 85}
          cy={Math.sin((deg * Math.PI) / 180) * 85}
          r="10"
          fill="#1E1B4B"
          stroke="#F59E0B"
          strokeWidth="2"
        />
      ))}
    </g>
    {/* Golden Lightning Bolts (Flashing Lightning) */}
    <path
      d="M130 10L100 85H140L95 180L170 95H125L150 10Z"
      fill="#FDE047"
      stroke="#F59E0B"
      strokeWidth="2"
      style={canAnimate ? { animation: 'koban-lightning-flicker 1.4s steps(2, start) infinite' } : undefined}
    />
    {/* Silhouette of Kami Demon Horns */}
    <path d="M100 130L90 100L105 115" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
    <path d="M156 130L166 100L151 115" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
    <circle cx="128" cy="150" r="28" fill="#1E1B4B" stroke="#7C3AED" strokeWidth="3" />
    {/* Fierce Glowing Eyes */}
    <circle cx="118" cy="148" r="4" fill="#FDE047" style={canAnimate ? { animation: 'koban-pulse-glow 1.5s ease-in-out infinite' } : undefined} />
    <circle cx="138" cy="148" r="4" fill="#FDE047" style={canAnimate ? { animation: 'koban-pulse-glow 1.5s ease-in-out infinite' } : undefined} />
  </svg>
);

// 6. Aurora Wolf (Epic) - Animated
export const PfpAuroraWolf: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="aw-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#022C22" />
        <stop offset="50%" stopColor="#064E3B" />
        <stop offset="100%" stopColor="#021C16" />
      </linearGradient>
    </defs>
    <rect width="256" height="256" fill="url(#aw-sky)" />
    {/* Aurora Curtains (Waving) */}
    <path
      d="M0 60C50 20 100 80 150 40C200 0 230 60 256 30V120C220 90 180 140 120 100C60 60 30 110 0 80Z"
      fill="#34D399"
      opacity="0.5"
      style={canAnimate ? { animation: 'koban-aurora-wave 4.5s ease-in-out infinite', transformOrigin: 'center top' } : undefined}
    />
    <path
      d="M0 40C60 80 120 20 180 60C220 30 240 70 256 50V100C220 120 160 80 100 110C50 80 20 120 0 90Z"
      fill="#06B6D4"
      opacity="0.4"
      style={canAnimate ? { animation: 'koban-aurora-wave 6s ease-in-out infinite 1.5s', transformOrigin: 'center top' } : undefined}
    />
    {/* Stars */}
    <circle cx="60" cy="30" r="1.5" fill="#E6FFFA" style={canAnimate ? { animation: 'koban-star-twinkle 2.8s ease-in-out infinite' } : undefined} />
    <circle cx="210" cy="40" r="1.8" fill="#E6FFFA" style={canAnimate ? { animation: 'koban-star-twinkle 3.2s ease-in-out infinite 1s' } : undefined} />
    {/* Snow Rocky Cliff */}
    <path d="M0 256L40 170L110 180L170 256H0Z" fill="#042F2E" />
    <path d="M35 173L70 165L110 182" stroke="#E6FFFA" strokeWidth="3" fill="none" />
    {/* Howling Snow Wolf Silhouette */}
    <g transform="translate(60, 100)">
      <polygon points="28,25 36,10 42,28" fill="#F0FDFA" />
      <polygon points="20,28 26,14 32,30" fill="#CCFBF1" />
      <path d="M32 30C38 20 54 10 65 5C58 15 48 24 45 34Z" fill="#F0FDFA" />
      <path d="M22 35C28 45 35 70 25 80H5L12 45Z" fill="#CCFBF1" />
      <path d="M35 55C40 65 48 78 45 80H25Z" fill="#99F6E4" />
    </g>
    {/* Distant Snow Pines */}
    <path d="M180 256L195 200L210 256" fill="#021C16" />
    <path d="M215 256L228 215L240 256" fill="#021C16" />
  </svg>
);

// 7. Neon Rain Skyline (Epic) - Animated
export const PfpNeonSkyline: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#090514" />
    {/* Cyberpunk Skyscrapers */}
    <rect x="20" y="100" width="45" height="156" fill="#130D24" stroke="#701A75" strokeWidth="1" />
    <rect x="75" y="60" width="55" height="196" fill="#1A1033" stroke="#00F0FF" strokeWidth="1" />
    <rect x="140" y="85" width="48" height="171" fill="#150C28" stroke="#F43F5E" strokeWidth="1" />
    <rect x="195" y="120" width="50" height="136" fill="#110920" stroke="#A855F7" strokeWidth="1" />
    {/* Neon Billboard Signs (Pulsing) */}
    <rect
      x="85"
      y="80"
      width="35"
      height="18"
      rx="3"
      fill="#00F0FF"
      opacity="0.9"
      style={canAnimate ? { animation: 'koban-lightning-flicker 2s steps(2, start) infinite' } : undefined}
    />
    <rect
      x="148"
      y="110"
      width="32"
      height="14"
      rx="2"
      fill="#F43F5E"
      opacity="0.9"
      style={canAnimate ? { animation: 'koban-lightning-flicker 2.5s steps(2, start) infinite 0.7s' } : undefined}
    />
    {/* Diagonal Rain Streaks with motion */}
    <g
      stroke="#38BDF8"
      strokeWidth="1.5"
      opacity="0.6"
      style={canAnimate ? { animation: 'koban-grid-scroll 1.4s linear infinite' } : undefined}
    >
      <line x1="30" y1="20" x2="10" y2="70" />
      <line x1="90" y1="40" x2="70" y2="90" />
      <line x1="150" y1="10" x2="130" y2="60" />
      <line x1="210" y1="30" x2="190" y2="80" />
      <line x1="60" y1="110" x2="40" y2="160" />
      <line x1="120" y1="120" x2="100" y2="170" />
      <line x1="180" y1="90" x2="160" y2="140" />
    </g>
    {/* Wet Rooftop Shimmer */}
    <rect
      y="235"
      width="256"
      height="21"
      fill="#FF007A"
      opacity="0.35"
      style={canAnimate ? { animation: 'koban-pulse-glow 2.5s ease-in-out infinite' } : undefined}
    />
  </svg>
);

// 8. Crescent Rooftop Cat (Rare) - Animated
export const PfpCrescentCat: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#0B0F19" />
    {/* Giant Golden Crescent Moon */}
    <path
      d="M175 40C125 40 85 80 85 130C85 180 125 220 175 220C155 200 145 168 145 130C145 92 155 60 175 40Z"
      fill="#FDE047"
      style={canAnimate ? { animation: 'koban-pulse-glow 4s ease-in-out infinite' } : undefined}
    />
    {/* Starfield with twinkling stars */}
    <circle cx="50" cy="50" r="1.5" fill="#FFFFFF" style={canAnimate ? { animation: 'koban-star-twinkle 2.2s ease-in-out infinite' } : undefined} />
    <circle cx="75" cy="90" r="2.5" fill="#FDE047" style={canAnimate ? { animation: 'koban-star-twinkle 3s ease-in-out infinite 0.7s' } : undefined} />
    <circle cx="40" cy="130" r="1.5" fill="#FFFFFF" opacity="0.7" />
    {/* Pagoda Tiled Curved Rooftop */}
    <path d="M-10 230C60 210 180 210 266 230V256H-10Z" fill="#1E293B" />
    <path d="M-10 235C60 215 180 215 266 235" stroke="#334155" strokeWidth="4" />
    {/* Sitting Cat Silhouette with Swaying Tail */}
    <g transform="translate(95, 160)">
      <ellipse cx="28" cy="40" rx="14" ry="18" fill="#020617" />
      {/* Swaying tail */}
      <g style={canAnimate ? { animation: 'koban-lantern-sway 3.2s ease-in-out infinite', transformOrigin: '15px 45px' } : undefined}>
        <path d="M15 45C5 45 0 32 -3 20" stroke="#020617" strokeWidth="4.5" strokeLinecap="round" />
      </g>
      {/* Head & Ears */}
      <circle cx="28" cy="18" r="11" fill="#020617" />
      <polygon points="19,14 22,4 27,12" fill="#020617" />
      <polygon points="29,12 34,4 37,14" fill="#020617" />
      {/* Whiskers & eye shine */}
      <circle cx="25" cy="17" r="1.5" fill="#FDE047" />
      <circle cx="31" cy="17" r="1.5" fill="#FDE047" />
    </g>
  </svg>
);

// 9. Ember Phoenix (Legendary) - Animated
export const PfpEmberPhoenix: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#180404" />
    {/* Glowing Sunburst Circle */}
    <circle
      cx="128"
      cy="128"
      r="75"
      fill="#7C2D12"
      opacity="0.5"
      style={canAnimate ? { animation: 'koban-pulse-glow 3.8s ease-in-out infinite' } : undefined}
    />
    <circle cx="128" cy="128" r="55" fill="#C2410C" opacity="0.4" />
    {/* Phoenix Head and Crown Feathers */}
    <path d="M128 65L122 85H134L128 65Z" fill="#FDE047" />
    <circle cx="128" cy="92" r="10" fill="#EA580C" />
    <path d="M128 92L145 96L128 102Z" fill="#FDE047" />
    {/* Mighty Curved Flame Wings (Left & Right) with Flame Flicker */}
    <g style={canAnimate ? { animation: 'koban-flame-flicker 2.4s ease-in-out infinite' } : undefined}>
      <path d="M128 115C85 95 35 110 20 145C45 140 75 145 105 160L128 135Z" fill="#F97316" />
      <path d="M128 115C171 95 221 110 236 145C211 140 181 145 151 160L128 135Z" fill="#F97316" />
      {/* Inner Molten Feathers */}
      <path d="M128 120C100 110 65 125 50 145C70 140 95 145 120 155Z" fill="#FDE047" />
      <path d="M128 120C156 110 191 125 206 145C186 140 161 145 136 155Z" fill="#FDE047" />
    </g>
    {/* Cascading Tail Feathers */}
    <path d="M128 160C110 190 100 230 115 256C122 230 134 230 141 256C156 230 146 190 128 160Z" fill="#EF4444" />
    {/* Rising Sparks with Ember Rise */}
    <g style={canAnimate ? { animation: 'koban-ember-rise 2.6s ease-out infinite' } : undefined}>
      <circle cx="55" cy="110" r="2.5" fill="#FDE047" opacity="0.9" />
      <circle cx="205" cy="105" r="2.5" fill="#F97316" opacity="0.9" />
      <circle cx="128" cy="80" r="2" fill="#FEF08A" opacity="0.95" />
    </g>
  </svg>
);

// 10. Lantern Koi Abyss (Epic) - Animated
export const PfpLanternAbyss: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#02131F" />
    {/* Deep ocean caustic rays */}
    <path d="M50 0L70 256M130 0L150 256M200 0L220 256" stroke="#0284C7" strokeWidth="18" opacity="0.15" />
    {/* Circling Golden Koi (Yin Yang Curve) */}
    <g
      transform="translate(128, 128)"
      style={canAnimate ? { animation: 'koban-orbit-cw 12s linear infinite', transformOrigin: '128px 128px' } : undefined}
    >
      <path d="M-10 -70C30 -70 50 -40 45 0C40 30 15 45 0 70C-10 40 5 20 5 -10C5 -40 -30 -50 -10 -70Z" fill="#F59E0B" />
      <path d="M0 -60C18 -55 25 -30 20 0C15 15 5 20 0 -60Z" fill="#EF4444" />
      <circle cx="-5" cy="-55" r="2.5" fill="#FFFFFF" />
      <path d="M25 -35C45 -40 55 -25 35 -15Z" fill="#FBBF24" />
      <path d="M-15 -35C-35 -40 -45 -25 -25 -15Z" fill="#FBBF24" />
    </g>
    {/* Glowing Bioluminescent Water Bubbles */}
    <circle
      cx="60"
      cy="180"
      r="4"
      fill="#38BDF8"
      opacity="0.8"
      style={canAnimate ? { animation: 'koban-pulse-glow 2.8s ease-in-out infinite' } : undefined}
    />
    <circle
      cx="195"
      cy="80"
      r="5"
      fill="#38BDF8"
      opacity="0.75"
      style={canAnimate ? { animation: 'koban-pulse-glow 3.4s ease-in-out infinite 0.9s' } : undefined}
    />
  </svg>
);

// 11. Solar Corona Crow (Legendary) - Animated
export const PfpSolarCoronaCrow: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#0A0602" />
    {/* Pulsing Solar Eclipse Corona */}
    <circle
      cx="128"
      cy="128"
      r="84"
      fill="#F59E0B"
      opacity="0.35"
      style={canAnimate ? { animation: 'koban-pulse-glow 3.6s ease-in-out infinite' } : undefined}
    />
    <circle
      cx="128"
      cy="128"
      r="72"
      fill="#D97706"
      opacity="0.45"
      style={canAnimate ? { animation: 'koban-pulse-glow 2.4s ease-in-out infinite' } : undefined}
    />
    {/* Dark Eclipse Disc */}
    <circle cx="128" cy="128" r="62" fill="#0A0602" stroke="#FDE047" strokeWidth="2" />
    {/* Three-Legged Yatagarasu Raven Silhouette */}
    <g transform="translate(88, 88)">
      <polygon points="40,25 22,28 35,36" fill="#FDE047" />
      <circle cx="38" cy="32" r="12" fill="#0A0602" stroke="#FDE047" strokeWidth="1" />
      <path d="M38 38C15 25 -10 40 -20 65C5 60 25 58 40 50Z" fill="#FDE047" />
      <path d="M42 38C65 25 90 40 100 65C75 60 55 58 40 50Z" fill="#FDE047" />
      <line x1="30" y1="58" x2="26" y2="76" stroke="#FDE047" strokeWidth="2.5" />
      <line x1="40" y1="60" x2="40" y2="78" stroke="#FDE047" strokeWidth="2.5" />
      <line x1="50" y1="58" x2="54" y2="76" stroke="#FDE047" strokeWidth="2.5" />
    </g>
  </svg>
);

// 12. Cyber Katana Phantom (Epic) - Animated
export const PfpCyberKatana: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#050814" />
    {/* Cyber Hex Grid */}
    <path d="M0 64H256M0 128H256M0 192H256" stroke="#1E1B4B" strokeWidth="1" strokeDasharray="6 6" />
    <path d="M64 0V256M128 0V256M192 0V256" stroke="#1E1B4B" strokeWidth="1" strokeDasharray="6 6" />
    {/* Glowing Katana Slash Line (Diagonal) with lightning flicker */}
    <line
      x1="30"
      y1="226"
      x2="226"
      y2="30"
      stroke="#00F0FF"
      strokeWidth="4"
      strokeLinecap="round"
      style={canAnimate ? { animation: 'koban-lightning-flicker 1.8s steps(2, start) infinite' } : undefined}
    />
    <line x1="30" y1="226" x2="226" y2="30" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    {/* Warrior Silhouette with Glowing Visor */}
    <g transform="translate(70, 75)">
      <path d="M25 40C30 15 85 15 90 40L98 100H18L25 40Z" fill="#0A0F24" />
      <rect
        x="40"
        y="42"
        width="38"
        height="8"
        rx="4"
        fill="#FF007A"
        style={canAnimate ? { animation: 'koban-pulse-glow 1.8s ease-in-out infinite' } : undefined}
      />
    </g>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// 13 STATIC PROFILE PICTURES (Zero Animation Anywhere)
// ─────────────────────────────────────────────────────────────────────────────

// 13. Ink Brush Tiger (Rare) - Static
export const PfpInkTiger: React.FC<PfpSvgProps> = ({ className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#F8FAFC" />
    {/* Charcoal Wash Background */}
    <ellipse cx="128" cy="128" rx="90" ry="70" fill="#E2E8F0" />
    {/* Sumi-e Bamboo Stalks */}
    <path d="M40 0V256M46 70H34M46 150H34M46 220H34" stroke="#475569" strokeWidth="5" />
    {/* Ink Brush Tiger Head */}
    <g transform="translate(68, 60)">
      {/* Ears */}
      <circle cx="28" cy="30" r="14" fill="#0F172A" />
      <circle cx="92" cy="30" r="14" fill="#0F172A" />
      {/* Head Base */}
      <ellipse cx="60" cy="70" rx="46" ry="40" fill="#0F172A" />
      {/* White Calligraphic Stripes */}
      <path d="M60 40V60M45 48L55 58M75 48L65 58" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
      <path d="M25 70C35 72 45 74 48 80" stroke="#F8FAFC" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M95 70C85 72 75 74 72 80" stroke="#F8FAFC" strokeWidth="3.5" strokeLinecap="round" />
      {/* Golden Ferocious Eyes */}
      <ellipse cx="44" cy="68" rx="6" ry="4" fill="#EAB308" />
      <ellipse cx="76" cy="68" rx="6" ry="4" fill="#EAB308" />
      <circle cx="44" cy="68" r="2" fill="#000000" />
      <circle cx="76" cy="68" r="2" fill="#000000" />
      {/* Snout and Fangs */}
      <polygon points="60,82 54,76 66,76" fill="#CBD5E1" />
      <path d="M50 86C55 92 65 92 70 86" stroke="#F8FAFC" strokeWidth="2.5" />
    </g>
    {/* Red Artist Hanko Stamp */}
    <rect x="200" y="200" width="28" height="28" fill="#DC2626" rx="3" />
    <text x="214" y="219" fill="#FFFFFF" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="serif">寅</text>
  </svg>
);

// 14. Starfield Shrine Maiden (Rare) - Static
export const PfpShrineMaiden: React.FC<PfpSvgProps> = ({ className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#08071A" />
    {/* Dense Milky Way Arc */}
    <ellipse cx="128" cy="80" rx="110" ry="45" fill="#312E81" opacity="0.5" transform="rotate(-15 128 80)" />
    {/* Stars */}
    {[
      [30, 40], [60, 25], [100, 50], [140, 20], [180, 45], [220, 30],
      [45, 90], [80, 75], [120, 95], [165, 70], [205, 85], [235, 60]
    ].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r={i % 2 === 0 ? 1.5 : 1} fill="#FFFFFF" opacity="0.85" />
    ))}
    {/* Maiden Silhouette */}
    <g transform="translate(88, 90)">
      {/* Hair Ribbons */}
      <path d="M40 35C20 45 10 70 5 110" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M40 35C60 45 70 70 75 110" stroke="#FFFFFF" strokeWidth="3" />
      {/* White Kosode & Red Hakama */}
      <path d="M25 50L40 35L55 50L68 120H12L25 50Z" fill="#F8FAFC" />
      <path d="M12 95H68V125H12V95Z" fill="#DC2626" />
      {/* Head */}
      <circle cx="40" cy="30" r="14" fill="#08071A" />
      {/* Sacred Shiden Paper Streamer */}
      <path d="M30 65L35 72L30 80L35 88" stroke="#DC2626" strokeWidth="2.5" fill="none" />
    </g>
  </svg>
);

// 15. Imperial Kabuto (Rare) - Static
export const PfpSamuraiKabuto: React.FC<PfpSvgProps> = ({ className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#1C1917" />
    {/* Gilded Background Sun Disc */}
    <circle cx="128" cy="128" r="85" fill="#78350F" opacity="0.35" />
    {/* Warlord Kabuto */}
    <g transform="translate(64, 45)">
      {/* Giant Crescent Kuwagata Crest */}
      <path
        d="M64 45C30 5 0 25 -10 40C15 25 45 25 64 50C83 25 113 25 138 40C128 25 98 5 64 45Z"
        fill="#F59E0B"
      />
      {/* Helmet Bowl (Hachi) */}
      <path d="M18 65C18 35 110 35 110 65L118 100H10L18 65Z" fill="#0C0A09" stroke="#D97706" strokeWidth="2" />
      {/* Neck Guard (Shikoro) */}
      <path d="M6 100H122L128 125H2L6 100Z" fill="#991B1B" />
      <path d="M2 125H128L134 148H-4L2 125Z" fill="#0C0A09" />
      {/* Menpo Face Mask */}
      <path d="M30 100C30 145 98 145 98 100Z" fill="#0C0A09" stroke="#991B1B" strokeWidth="2" />
      {/* White Fierce Bristle Mustache */}
      <path d="M38 122C50 120 60 125 64 130C68 125 78 120 90 122" stroke="#F5F5F4" strokeWidth="3" strokeLinecap="round" />
    </g>
  </svg>
);

// 16. Flock of Thousand Cranes (Rare) - Static
export const PfpOrigamiCranes: React.FC<PfpSvgProps> = ({ className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#881337" />
    {/* Golden Cloud Ripples */}
    <path d="M0 160C40 140 80 170 120 150C160 130 200 160 256 140V256H0Z" fill="#4C0519" />
    {/* Giant Geometric Origami Crane (Center) */}
    <g transform="translate(78, 65)">
      {/* Wing Left */}
      <polygon points="50,60 0,20 30,70" fill="#FEE2E2" />
      {/* Wing Right */}
      <polygon points="50,60 100,20 70,70" fill="#FECDD3" />
      {/* Body & Tail */}
      <polygon points="50,60 50,110 40,75" fill="#E11D48" />
      {/* Neck & Head */}
      <polygon points="50,60 30,10 20,18" fill="#BE123C" />
      {/* Gold Accents */}
      <polygon points="50,60 30,70 50,85 70,70" fill="#F59E0B" />
    </g>
    {/* Smaller Distant Origami Cranes */}
    <g transform="translate(30, 40) scale(0.45)">
      <polygon points="50,60 0,20 30,70" fill="#FEE2E2" />
      <polygon points="50,60 100,20 70,70" fill="#FECDD3" />
      <polygon points="50,60 50,110 40,75" fill="#BE123C" />
    </g>
    <g transform="translate(180, 140) scale(0.35)">
      <polygon points="50,60 0,20 30,70" fill="#FEE2E2" />
      <polygon points="50,60 100,20 70,70" fill="#FECDD3" />
      <polygon points="50,60 50,110 40,75" fill="#BE123C" />
    </g>
  </svg>
);

// 17. Frozen Lantern Lake (Rare) - Static
export const PfpFrozenLake: React.FC<PfpSvgProps> = ({ className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#082F49" />
    {/* Snowy Mountain Jagged Peaks */}
    <polygon points="0,110 45,60 90,110" fill="#0C4A6E" />
    <polygon points="45,60 35,80 55,80" fill="#F0F9FF" />
    <polygon points="70,120 135,40 200,120" fill="#0369A1" />
    <polygon points="135,40 120,70 150,70" fill="#F0F9FF" />
    <polygon points="170,120 220,70 256,120" fill="#0C4A6E" />
    {/* Frozen Ice Surface */}
    <rect y="120" width="256" height="136" fill="#0284C7" opacity="0.65" />
    {/* Ice Fissure Cracks */}
    <path d="M40 140L85 180L130 170L175 220" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
    <path d="M85 180L70 220" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round" />
    {/* Floating Candlelit Wooden Lantern */}
    <g transform="translate(110, 160)">
      <rect x="0" y="0" width="36" height="36" rx="4" fill="#78350F" />
      <rect x="4" y="4" width="28" height="28" rx="2" fill="#FDE047" />
      <circle cx="18" cy="18" r="5" fill="#EA580C" />
      {/* Reflection */}
      <rect x="4" y="38" width="28" height="14" fill="#FDE047" opacity="0.3" />
    </g>
  </svg>
);

// 18. Mount Fuji Sunrise (Rare) - Static
export const PfpFujiDawn: React.FC<PfpSvgProps> = ({ className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#FFE4E6" />
    {/* Radiant Morning Sun */}
    <circle cx="128" cy="130" r="70" fill="#E11D48" />
    {/* Mount Fuji Symmetrical Cone */}
    <path d="M0 256L96 110C110 95 146 95 160 110L256 256H0Z" fill="#1E293B" />
    {/* Snow Cap Crown */}
    <path d="M96 110C110 95 146 95 160 110L175 145L150 135L135 150L121 135L107 150L81 145L96 110Z" fill="#FFFFFF" />
    {/* Sea of Clouds at Mountain Base */}
    <ellipse cx="60" cy="225" rx="70" ry="25" fill="#FFFFFF" opacity="0.9" />
    <ellipse cx="196" cy="225" rx="70" ry="25" fill="#FFFFFF" opacity="0.9" />
    <ellipse cx="128" cy="240" rx="90" ry="30" fill="#FFFFFF" />
  </svg>
);

// 19. Sacred Spirit Deer (Rare) - Static
export const PfpSpiritDeer: React.FC<PfpSvgProps> = ({ className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#064E3B" />
    {/* Moonlight Halo */}
    <circle cx="128" cy="100" r="75" fill="#10B981" opacity="0.25" />
    {/* Magnificent Moss & Blossom Antlers */}
    <g stroke="#34D399" strokeWidth="3" strokeLinecap="round" fill="none">
      <path d="M115 110C100 80 80 60 50 40M75 65C60 60 45 68 35 60M95 90C75 85 65 95 55 90" />
      <path d="M141 110C156 80 176 60 206 40M181 65C196 60 211 68 221 60M161 90C181 85 191 95 201 90" />
    </g>
    {/* Antler Blossoms */}
    <circle cx="48" cy="38" r="3" fill="#F472B6" />
    <circle cx="208" cy="38" r="3" fill="#F472B6" />
    <circle cx="34" cy="60" r="2.5" fill="#FDE047" />
    <circle cx="222" cy="60" r="2.5" fill="#FDE047" />
    {/* Deer Head & Ears */}
    <g transform="translate(100, 100)">
      {/* Ears */}
      <ellipse cx="6" cy="18" rx="14" ry="6" fill="#022C22" transform="rotate(-30 6 18)" />
      <ellipse cx="50" cy="18" rx="14" ry="6" fill="#022C22" transform="rotate(30 50 18)" />
      {/* Head */}
      <polygon points="28,20 15,65 41,65" fill="#042F2E" />
      {/* Gentle Eyes */}
      <circle cx="20" cy="40" r="2.5" fill="#FDE047" />
      <circle cx="36" cy="40" r="2.5" fill="#FDE047" />
    </g>
  </svg>
);

// 20. Twilight Bamboo Grove (Rare) - Static
export const PfpBambooTwilight: React.FC<PfpSvgProps> = ({ className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#022C22" />
    {/* Full Moon */}
    <circle cx="128" cy="110" r="60" fill="#E2E8F0" />
    {/* Bamboo Stalks Overlapping */}
    <g stroke="#064E3B" strokeWidth="14" strokeLinecap="round">
      <line x1="45" y1="-10" x2="45" y2="266" />
      <line x1="90" y1="-10" x2="90" y2="266" />
      <line x1="170" y1="-10" x2="170" y2="266" />
      <line x1="215" y1="-10" x2="215" y2="266" />
    </g>
    {/* Node rings */}
    <g stroke="#042F2E" strokeWidth="3">
      <line x1="36" y1="80" x2="54" y2="80" />
      <line x1="36" y1="170" x2="54" y2="170" />
      <line x1="81" y1="60" x2="99" y2="60" />
      <line x1="81" y1="150" x2="99" y2="150" />
      <line x1="161" y1="90" x2="179" y2="90" />
      <line x1="161" y1="180" x2="179" y2="180" />
      <line x1="206" y1="70" x2="224" y2="70" />
      <line x1="206" y1="160" x2="224" y2="160" />
    </g>
    {/* Bamboo Leaves */}
    <path d="M90 60C110 50 130 65 140 70C120 75 105 70 90 60Z" fill="#10B981" />
    <path d="M170 90C150 80 130 95 120 100C140 105 155 100 170 90Z" fill="#10B981" />
  </svg>
);

// 21. Kintsugi Great Wave (Rare) - Static
export const PfpKintsugiWave: React.FC<PfpSvgProps> = ({ className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#0F172A" />
    {/* Background Fuji and Sun */}
    <circle cx="170" cy="100" r="40" fill="#991B1B" opacity="0.6" />
    <polygon points="150,140 170,110 190,140" fill="#E2E8F0" />
    {/* The Great Rolling Wave */}
    <path
      d="M-10 256C40 240 80 200 100 160C120 120 160 80 210 110C190 120 160 140 150 170C180 150 220 150 256 180V256H-10Z"
      fill="#1E3A8A"
    />
    <path
      d="M-10 256C30 220 70 180 90 140C110 100 140 80 180 90C150 105 130 130 120 160V256H-10Z"
      fill="#0284C7"
    />
    {/* Golden Kintsugi Veins Repairing the Surf */}
    <path
      d="M30 256L70 190L100 160L135 185L170 150L210 110"
      stroke="#F59E0B"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M100 160L120 130L150 125" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    {/* White Foam Claws */}
    <circle cx="180" cy="90" r="5" fill="#FFFFFF" />
    <circle cx="195" cy="96" r="4" fill="#FFFFFF" />
    <circle cx="210" cy="110" r="4.5" fill="#FFFFFF" />
  </svg>
);

// 22. Midnight Black Lotus (Common) - Static
export const PfpMidnightLotus: React.FC<PfpSvgProps> = ({ className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#090514" />
    {/* Dark Rippling Pond */}
    <ellipse cx="128" cy="170" rx="95" ry="35" fill="#1E1B4B" opacity="0.6" />
    {/* Giant Lotus Blossom */}
    <g transform="translate(68, 80)">
      {/* Outer Petals */}
      <path d="M60 10C20 40 10 90 60 110C110 90 100 40 60 10Z" fill="#18181B" stroke="#A855F7" strokeWidth="1.5" />
      <path d="M20 50C-5 70 10 100 50 110C40 90 30 70 20 50Z" fill="#27272A" />
      <path d="M100 50C125 70 110 100 70 110C80 90 90 70 100 50Z" fill="#27272A" />
      {/* Center Core Petals */}
      <path d="M60 30C40 50 35 85 60 100C85 85 80 50 60 30Z" fill="#3F3F46" stroke="#C084FC" strokeWidth="1" />
      {/* Gold Dew Drop Gem in Center */}
      <circle cx="60" cy="85" r="5" fill="#FDE047" />
    </g>
  </svg>
);

// 23. Gion Alley Lanterns (Common) - Static
export const PfpAlleyLanterns: React.FC<PfpSvgProps> = ({ className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#1C1917" />
    {/* Narrow Traditional Timber Street with Vanishing Point */}
    <polygon points="0,0 60,0 85,256 0,256" fill="#292524" />
    <polygon points="256,0 196,0 171,256 256,256" fill="#292524" />
    {/* Stone Cobblestone Path */}
    <polygon points="60,0 196,0 171,256 85,256" fill="#0C0A09" />
    {/* Wooden Lattice Windows */}
    <rect x="10" y="40" width="40" height="70" fill="#44403C" stroke="#78350F" strokeWidth="2" />
    <rect x="206" y="40" width="40" height="70" fill="#44403C" stroke="#78350F" strokeWidth="2" />
    {/* Glowing Red Paper Lanterns Framing Street */}
    <g transform="translate(62, 70)">
      <ellipse cx="0" cy="0" rx="10" ry="14" fill="#DC2626" />
      <rect x="-6" y="-17" width="12" height="4" fill="#000000" />
      <rect x="-6" y="13" width="12" height="4" fill="#000000" />
      <ellipse cx="0" cy="0" rx="5" ry="7" fill="#FEF08A" opacity="0.8" />
    </g>
    <g transform="translate(194, 70)">
      <ellipse cx="0" cy="0" rx="10" ry="14" fill="#DC2626" />
      <rect x="-6" y="-17" width="12" height="4" fill="#000000" />
      <rect x="-6" y="13" width="12" height="4" fill="#000000" />
      <ellipse cx="0" cy="0" rx="5" ry="7" fill="#FEF08A" opacity="0.8" />
    </g>
  </svg>
);

// 24. Celestial Astrolabe (Common) - Static
export const PfpCelestialCompass: React.FC<PfpSvgProps> = ({ className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#0B132B" />
    {/* Astrolabe Brass Rings */}
    <circle cx="128" cy="128" r="95" stroke="#D97706" strokeWidth="4" />
    <circle cx="128" cy="128" r="82" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 8" />
    <circle cx="128" cy="128" r="60" stroke="#D97706" strokeWidth="2" />
    <circle cx="128" cy="128" r="30" stroke="#FBBF24" strokeWidth="1" />
    {/* Compass Coordinate Axes */}
    <line x1="128" y1="20" x2="128" y2="236" stroke="#F59E0B" strokeWidth="2" />
    <line x1="20" y1="128" x2="236" y2="128" stroke="#F59E0B" strokeWidth="2" />
    {/* 4-Point Star Pointer */}
    <polygon points="128,68 135,128 128,140 121,128" fill="#FDE047" />
    <polygon points="128,188 135,128 128,116 121,128" fill="#B45309" />
    <polygon points="68,128 128,135 140,128 128,121" fill="#B45309" />
    <polygon points="188,128 128,135 116,128 128,121" fill="#FDE047" />
    <circle cx="128" cy="128" r="6" fill="#0B132B" stroke="#FDE047" strokeWidth="2" />
  </svg>
);

// 25. Ancient Pine Bonsai (Common) - Static
export const PfpZenBonsai: React.FC<PfpSvgProps> = ({ className = '' }) => (
  <svg viewBox="0 0 256 256" className={`w-full h-full block ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" fill="#141E18" />
    {/* Dawn Mist Circle */}
    <circle cx="128" cy="115" r="75" fill="#2D4A3E" opacity="0.5" />
    {/* Ceramic Bonsai Pot */}
    <polygon points="68,200 188,200 180,225 76,225" fill="#44403C" stroke="#78716C" strokeWidth="2" />
    <rect x="85" y="225" width="16" height="6" fill="#292524" />
    <rect x="155" y="225" width="16" height="6" fill="#292524" />
    {/* Gnarled Twisted Pine Trunk */}
    <path
      d="M128 200C125 170 145 150 135 130C125 110 95 115 85 90"
      stroke="#78350F"
      strokeWidth="14"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M135 130C155 120 175 125 185 105" stroke="#78350F" strokeWidth="8" strokeLinecap="round" fill="none" />
    {/* Cloud Pine Needle Pads */}
    <ellipse cx="80" cy="85" rx="30" ry="14" fill="#15803D" />
    <ellipse cx="80" cy="80" rx="24" ry="10" fill="#22C55E" opacity="0.75" />
    <ellipse cx="130" cy="100" rx="26" ry="12" fill="#15803D" />
    <ellipse cx="185" cy="100" rx="28" ry="12" fill="#15803D" />
    <ellipse cx="185" cy="95" rx="22" ry="9" fill="#22C55E" opacity="0.75" />
  </svg>
);

// ─── 5 NEW PREMIUM PROFILE PICTURES (512x512 Multi-Layer WebP + Shared FX Engine) ───

interface LayeredAvatarConfig {
  avatarId: string;
  placeholderBg: string;
  emitters: EmitterConfig[];
  lightning?: LightningConfig;
  seed: number;
  onBackgroundMeshDraw?: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    elapsed: number
  ) => void;
  onForegroundDraw?: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    elapsed: number
  ) => void;
}

const LayeredPremiumAvatar: React.FC<LayeredAvatarConfig & PfpSvgProps> = ({
  avatarId,
  placeholderBg,
  emitters,
  lightning,
  seed,
  onBackgroundMeshDraw,
  onForegroundDraw,
  canAnimate = true,
  className = '',
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLImageElement>(null);
  const haloRef = useRef<HTMLImageElement>(null);
  const portraitRef = useRef<HTMLImageElement>(null);
  const eyesRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const applyFrame = (elapsed: number) => {
      // Smooth breathing scale (1.00 to 1.02) and depth parallax between layers
      const breathe = 1.01 + Math.sin(elapsed * 1.9) * 0.01;
      const px = Math.sin(elapsed * 0.95) * 2.2;
      const py = Math.cos(elapsed * 1.15) * 1.8;

      if (bgRef.current) {
        bgRef.current.style.transform = `scale(1.04) translate3d(${(-px * 0.5).toFixed(2)}px, ${(-py * 0.5).toFixed(2)}px, 0)`;
      }
      if (haloRef.current) {
        const rot = (elapsed * 14) % 360;
        const haloScale = 1.0 + Math.sin(elapsed * 2.4) * 0.025;
        haloRef.current.style.transform = `scale(${haloScale.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`;
      }
      if (portraitRef.current) {
        portraitRef.current.style.transform = `scale(${breathe.toFixed(4)}) translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0)`;
      }
      if (eyesRef.current) {
        const eyePulse = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(elapsed * 3.4));
        eyesRef.current.style.transform = `scale(${breathe.toFixed(4)}) translate3d(${(px * 1.15).toFixed(2)}px, ${(py * 1.15).toFixed(2)}px, 0)`;
        eyesRef.current.style.opacity = eyePulse.toFixed(3);
      }
    };

    const unregister = storeFxScheduler.register({
      element: stage,
      canAnimate,
      onFrame: (_dt, elapsed) => {
        applyFrame(elapsed);
      },
      onStaticFrame: () => {
        applyFrame(1.4);
      },
    });

    return unregister;
  }, [canAnimate]);

  const basePath = `/assets/store/avatars/${avatarId}`;

  return (
    <div
      ref={stageRef}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={{
        background: placeholderBg,
        contain: 'paint',
      }}
    >
      {/* Layer 0: Painted Atmospheric Backdrop */}
      <img
        ref={bgRef}
        src={`${basePath}/bg.webp`}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none will-change-transform"
      />

      {/* Layer 1: Rotating & Pulsing Halo Glow */}
      <img
        ref={haloRef}
        src={`${basePath}/halo.webp`}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none will-change-transform z-[1]"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Layer 2: Background Mesh Warp Canvas (Sine-Driven Swaying Tails / Wings) */}
      {onBackgroundMeshDraw && (
        <StoreFxCanvas
          seed={seed + 10}
          canAnimate={canAnimate}
          onCustomDraw={onBackgroundMeshDraw}
          className="absolute inset-0 w-full h-full z-[2]"
        />
      )}

      {/* Layer 3: Painted Portrait Subject with Smooth Breathing Scale (1.00..1.02) */}
      <img
        ref={portraitRef}
        src={`${basePath}/portrait.webp`}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none will-change-transform z-[3]"
      />

      {/* Layer 4: Pulsing Glowing Eyes Overlay */}
      <img
        ref={eyesRef}
        src={`${basePath}/eyes.webp`}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none will-change-transform z-[4]"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Layer 5: Foreground Breath/Smoke Particles & Lightning from FX Engine */}
      <StoreFxCanvas
        emitters={emitters}
        lightning={lightning}
        maxParticles={55}
        seed={seed}
        canAnimate={canAnimate}
        onForegroundDraw={onForegroundDraw}
        className="absolute inset-0 w-full h-full z-[5]"
      />
    </div>
  );
};

// 26. Zenryu Awakened (Mythic)
export const PfpZenryuAwakened: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      // Dragon-breath plasma & smoke billowing from the jaws
      {
        rate: 22,
        shape: ParticleShape.SoftGlow,
        additive: true,
        ramp: COLOR_RAMPS.dragonFire,
        xMin: 0.38,
        xMax: 0.62,
        yMin: 0.68,
        yMax: 0.78,
        vxMin: -0.14,
        vxMax: 0.14,
        vyMin: -0.36,
        vyMax: -0.12,
        turbulence: 0.42,
        turbulenceFreq: 2.8,
        lifeMin: 1.0,
        lifeMax: 1.9,
        sizeStartMin: 4.0,
        sizeStartMax: 7.5,
        sizeEndMin: 1.5,
        sizeEndMax: 3.5,
        alphaPeak: 0.88,
      },
      {
        rate: 16,
        shape: ParticleShape.Spark,
        additive: true,
        ramp: COLOR_RAMPS.dragonFire,
        xMin: 0.25,
        xMax: 0.75,
        yMin: 0.65,
        yMax: 0.92,
        vxMin: -0.18,
        vxMax: 0.18,
        vyMin: -0.52,
        vyMax: -0.22,
        turbulence: 0.35,
        lifeMin: 0.9,
        lifeMax: 1.7,
        sizeStartMin: 2.0,
        sizeStartMax: 3.8,
        sizeEndMin: 0.6,
        sizeEndMax: 1.4,
        alphaPeak: 0.95,
      },
    ],
    []
  );

  return (
    <LayeredPremiumAvatar
      avatarId="pfp_zenryu_awakened"
      placeholderBg="radial-gradient(circle, #690B17 0%, #070102 100%)"
      emitters={emitters}
      seed={601}
      canAnimate={canAnimate}
      className={className}
    />
  );
};

// 27. Oni Warlord (Legendary)
export const PfpOniWarlord: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      // Pressurized crimson steam/smoke from the Oni mask fangs
      {
        rate: 20,
        shape: ParticleShape.Smoke,
        additive: true,
        ramp: COLOR_RAMPS.bloodMoonAsh,
        xMin: 0.32,
        xMax: 0.68,
        yMin: 0.68,
        yMax: 0.78,
        vxMin: -0.18,
        vxMax: 0.18,
        vyMin: -0.34,
        vyMax: -0.12,
        turbulence: 0.38,
        lifeMin: 1.1,
        lifeMax: 2.1,
        sizeStartMin: 3.8,
        sizeStartMax: 7.2,
        sizeEndMin: 6.0,
        sizeEndMax: 10.5,
        alphaPeak: 0.72,
      },
      {
        rate: 14,
        shape: ParticleShape.Spark,
        additive: true,
        ramp: COLOR_RAMPS.dragonFire,
        xMin: 0.2,
        xMax: 0.8,
        yMin: 0.68,
        yMax: 0.95,
        vxMin: -0.12,
        vxMax: 0.12,
        vyMin: -0.45,
        vyMax: -0.18,
        turbulence: 0.3,
        lifeMin: 1.0,
        lifeMax: 1.9,
        sizeStartMin: 1.8,
        sizeStartMax: 3.4,
        sizeEndMin: 0.6,
        sizeEndMax: 1.2,
        alphaPeak: 0.92,
      },
    ],
    []
  );

  return (
    <LayeredPremiumAvatar
      avatarId="pfp_oni_warlord"
      placeholderBg="radial-gradient(circle, #580813 0%, #060102 100%)"
      emitters={emitters}
      seed={602}
      canAnimate={canAnimate}
      className={className}
    />
  );
};

// 28. Kitsune Moonlight (Legendary) - Sine-Driven 9-Tail Mesh Spine Warp + Spirit Breath
export const PfpKitsuneMoonlight: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 16,
        shape: ParticleShape.Wisp,
        additive: true,
        ramp: COLOR_RAMPS.spiritFox,
        xMin: 0.38,
        xMax: 0.62,
        yMin: 0.68,
        yMax: 0.78,
        vxMin: -0.14,
        vxMax: 0.14,
        vyMin: -0.32,
        vyMax: -0.12,
        turbulence: 0.36,
        lifeMin: 1.2,
        lifeMax: 2.3,
        sizeStartMin: 2.5,
        sizeStartMax: 4.8,
        sizeEndMin: 0.8,
        sizeEndMax: 1.8,
        alphaPeak: 0.88,
      },
    ],
    []
  );

  // Continuous sine-driven 9-tail mesh warp behind the Kitsune portrait
  const drawKitsuneTails = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    elapsed: number
  ) => {
    const baseX = width * 0.5;
    const baseY = height * 0.78;
    const tailLen = Math.min(width, height) * 0.56;
    const maxW = Math.min(width, height) * 0.055;
    const angles = [-2.45, -2.15, -1.88, -1.68, -1.57, -1.46, -1.26, -0.99, -0.69];

    for (let i = 0; i < angles.length; i++) {
      const fill = i % 2 === 0 ? 'rgba(56, 189, 248, 0.72)' : 'rgba(192, 132, 252, 0.68)';
      const tip = i % 2 === 0 ? 'rgba(224, 242, 254, 0.85)' : 'rgba(243, 232, 255, 0.85)';
      drawSwayingTailMesh(
        ctx,
        baseX,
        baseY,
        tailLen,
        angles[i],
        maxW,
        elapsed,
        i * 0.75,
        fill,
        tip
      );
    }
  };

  return (
    <LayeredPremiumAvatar
      avatarId="pfp_kitsune_moonlight"
      placeholderBg="radial-gradient(circle, #1E293B 0%, #030712 100%)"
      emitters={emitters}
      seed={603}
      canAnimate={canAnimate}
      onBackgroundMeshDraw={drawKitsuneTails}
      className={className}
    />
  );
};

// 29. Cyber Samurai Visor (Epic)
export const PfpCyberSamuraiVisor: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      // Cryo-breath vapor venting from the tactical respirator mask
      {
        rate: 18,
        shape: ParticleShape.SoftGlow,
        additive: true,
        ramp: COLOR_RAMPS.neonKyoto,
        xMin: 0.36,
        xMax: 0.64,
        yMin: 0.68,
        yMax: 0.78,
        vxMin: -0.16,
        vxMax: 0.16,
        vyMin: -0.28,
        vyMax: -0.08,
        turbulence: 0.3,
        lifeMin: 1.1,
        lifeMax: 2.1,
        sizeStartMin: 3.2,
        sizeStartMax: 6.2,
        sizeEndMin: 1.2,
        sizeEndMax: 2.8,
        alphaPeak: 0.78,
      },
      {
        rate: 12,
        shape: ParticleShape.Spark,
        additive: true,
        ramp: COLOR_RAMPS.neonKyoto,
        xMin: 0.2,
        xMax: 0.8,
        yMin: 0.45,
        yMax: 0.88,
        vxMin: -0.1,
        vxMax: 0.1,
        vyMin: -0.42,
        vyMax: -0.16,
        turbulence: 0.25,
        lifeMin: 0.9,
        lifeMax: 1.7,
        sizeStartMin: 1.6,
        sizeStartMax: 3.0,
        sizeEndMin: 0.5,
        sizeEndMax: 1.2,
        alphaPeak: 0.9,
      },
    ],
    []
  );

  // Continuous HUD visor energy sweep across the tactical visor
  const drawVisorSweep = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    elapsed: number
  ) => {
    const u = (Math.sin(elapsed * 2.6) + 1) * 0.5;
    const sx = width * (0.26 + u * 0.48);
    const sy = height * 0.51;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(2.5, width * 0.035), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  return (
    <LayeredPremiumAvatar
      avatarId="pfp_cyber_samurai_visor"
      placeholderBg="radial-gradient(circle, #0E223D 0%, #02040A 100%)"
      emitters={emitters}
      seed={604}
      canAnimate={canAnimate}
      onForegroundDraw={drawVisorSweep}
      className={className}
    />
  );
};

// 30. Tengu Storm Priest (Epic)
export const PfpTenguStormPriest: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 18,
        shape: ParticleShape.SoftGlow,
        additive: true,
        ramp: COLOR_RAMPS.emeraldTempest,
        xMin: 0.34,
        xMax: 0.66,
        yMin: 0.62,
        yMax: 0.76,
        vxMin: -0.18,
        vxMax: 0.18,
        vyMin: -0.34,
        vyMax: -0.12,
        turbulence: 0.38,
        lifeMin: 1.1,
        lifeMax: 2.1,
        sizeStartMin: 3.5,
        sizeStartMax: 6.5,
        sizeEndMin: 1.2,
        sizeEndMax: 2.8,
        alphaPeak: 0.82,
      },
      {
        rate: 12,
        shape: ParticleShape.Petal,
        additive: true,
        ramp: COLOR_RAMPS.emeraldTempest,
        xMin: 0.12,
        xMax: 0.88,
        yMin: 0.25,
        yMax: 0.85,
        vxMin: -0.22,
        vxMax: 0.22,
        vyMin: -0.32,
        vyMax: -0.08,
        turbulence: 0.4,
        lifeMin: 1.2,
        lifeMax: 2.2,
        sizeStartMin: 2.2,
        sizeStartMax: 4.2,
        sizeEndMin: 0.8,
        sizeEndMax: 1.8,
        alphaPeak: 0.88,
      },
    ],
    []
  );

  const lightning = useMemo<LightningConfig>(
    () => ({
      intervalMin: 1.1,
      intervalMax: 2.2,
      decayRate: 5.0,
      glowColor: '#10B981',
      coreColor: '#FEF08A',
      ringMode: true,
      ringRadius: 0.4,
    }),
    []
  );

  // Swaying Tengu wing feather primaries behind portrait
  const drawTenguFeathers = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    elapsed: number
  ) => {
    const cx = width * 0.5;
    const cy = height * 0.58;
    const len = Math.min(width, height) * 0.48;
    const maxW = Math.min(width, height) * 0.045;
    const wingAngles = [-2.55, -2.3, -2.05, -1.09, -0.84, -0.59];
    for (let i = 0; i < wingAngles.length; i++) {
      drawSwayingTailMesh(
        ctx,
        cx,
        cy,
        len,
        wingAngles[i],
        maxW,
        elapsed,
        i * 0.9,
        'rgba(16, 185, 129, 0.55)',
        'rgba(254, 240, 138, 0.78)'
      );
    }
  };

  return (
    <LayeredPremiumAvatar
      avatarId="pfp_tengu_storm_priest"
      placeholderBg="radial-gradient(circle, #064E3B 0%, #020B08 100%)"
      emitters={emitters}
      lightning={lightning}
      seed={605}
      canAnimate={canAnimate}
      onBackgroundMeshDraw={drawTenguFeathers}
      className={className}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 5 NEW 3D-RENDERED LOOP AVATARS (Wave 2: Items 131–135)
// ─────────────────────────────────────────────────────────────────────────────

// 31. Phoenix Ascendant (Mythic)
export const PfpPhoenixAscendant: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 22,
        shape: ParticleShape.Spark,
        additive: true,
        ramp: COLOR_RAMPS.dragonFire,
        xMin: 0.18,
        xMax: 0.82,
        yMin: 0.55,
        yMax: 0.95,
        vxMin: -0.14,
        vxMax: 0.14,
        vyMin: -0.48,
        vyMax: -0.2,
        turbulence: 0.35,
        lifeMin: 0.9,
        lifeMax: 1.8,
        sizeStartMin: 2.0,
        sizeStartMax: 3.8,
        sizeEndMin: 0.6,
        sizeEndMax: 1.4,
        alphaPeak: 0.95,
      },
    ],
    []
  );

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={{ background: 'radial-gradient(circle, #7C2D12 0%, #080102 100%)', contain: 'paint' }}
    >
      <StoreLoopVideo
        itemId="pfp_phoenix_ascendant"
        animated={true}
        canAnimate={canAnimate}
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
      />
      <StoreFxCanvas
        emitters={emitters}
        maxParticles={48}
        seed={631}
        canAnimate={canAnimate}
        className="absolute inset-0 w-full h-full z-[3]"
      />
    </div>
  );
};

// 32. Ryujin Sea Dragon (Legendary)
export const PfpRyujinSeaDragon: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 18,
        shape: ParticleShape.Wisp,
        additive: true,
        ramp: COLOR_RAMPS.spiritFox,
        xMin: 0.15,
        xMax: 0.85,
        yMin: 0.5,
        yMax: 0.95,
        vxMin: -0.12,
        vxMax: 0.12,
        vyMin: -0.34,
        vyMax: -0.12,
        turbulence: 0.32,
        lifeMin: 1.1,
        lifeMax: 2.2,
        sizeStartMin: 2.2,
        sizeStartMax: 4.4,
        sizeEndMin: 0.8,
        sizeEndMax: 1.8,
        alphaPeak: 0.88,
      },
    ],
    []
  );

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={{ background: 'radial-gradient(circle, #0E7490 0%, #020C14 100%)', contain: 'paint' }}
    >
      <StoreLoopVideo
        itemId="pfp_ryujin_sea_dragon"
        animated={true}
        canAnimate={canAnimate}
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
      />
      <StoreFxCanvas
        emitters={emitters}
        maxParticles={44}
        seed={632}
        canAnimate={canAnimate}
        className="absolute inset-0 w-full h-full z-[3]"
      />
    </div>
  );
};

// 33. Shadow Ninja Mask (Legendary)
export const PfpShadowNinjaMask: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 18,
        shape: ParticleShape.Smoke,
        additive: true,
        ramp: COLOR_RAMPS.bloodMoonAsh,
        xMin: 0.2,
        xMax: 0.8,
        yMin: 0.55,
        yMax: 0.92,
        vxMin: -0.16,
        vxMax: 0.16,
        vyMin: -0.32,
        vyMax: -0.1,
        turbulence: 0.36,
        lifeMin: 1.2,
        lifeMax: 2.2,
        sizeStartMin: 3.4,
        sizeStartMax: 6.8,
        sizeEndMin: 5.0,
        sizeEndMax: 9.5,
        alphaPeak: 0.72,
      },
    ],
    []
  );

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={{ background: 'radial-gradient(circle, #3F0D16 0%, #050507 100%)', contain: 'paint' }}
    >
      <StoreLoopVideo
        itemId="pfp_shadow_ninja_mask"
        animated={true}
        canAnimate={canAnimate}
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
      />
      <StoreFxCanvas
        emitters={emitters}
        maxParticles={44}
        seed={633}
        canAnimate={canAnimate}
        className="absolute inset-0 w-full h-full z-[3]"
      />
    </div>
  );
};

// 34. Raijin Thunder God (Epic)
export const PfpRaijinThunderGod: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 16,
        shape: ParticleShape.Spark,
        additive: true,
        ramp: COLOR_RAMPS.thunderGold,
        xMin: 0.15,
        xMax: 0.85,
        yMin: 0.25,
        yMax: 0.88,
        vxMin: -0.18,
        vxMax: 0.18,
        vyMin: -0.38,
        vyMax: -0.12,
        turbulence: 0.4,
        lifeMin: 0.7,
        lifeMax: 1.5,
        sizeStartMin: 1.8,
        sizeStartMax: 3.4,
        sizeEndMin: 0.5,
        sizeEndMax: 1.2,
        alphaPeak: 0.92,
      },
    ],
    []
  );

  const lightning = useMemo<LightningConfig>(
    () => ({
      intervalMin: 0.8,
      intervalMax: 1.8,
      decayRate: 5.5,
      glowColor: '#38BDF8',
      coreColor: '#FEF08A',
      ringMode: true,
      ringRadius: 0.38,
    }),
    []
  );

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={{ background: 'radial-gradient(circle, #1E3A8A 0%, #030712 100%)', contain: 'paint' }}
    >
      <StoreLoopVideo
        itemId="pfp_raijin_thunder_god"
        animated={true}
        canAnimate={canAnimate}
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
      />
      <StoreFxCanvas
        emitters={emitters}
        lightning={lightning}
        maxParticles={45}
        seed={634}
        canAnimate={canAnimate}
        className="absolute inset-0 w-full h-full z-[3]"
      />
    </div>
  );
};

// 35. Yokai Lantern Ghost (Epic)
export const PfpYokaiLanternGhost: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => {
  const emitters = useMemo<EmitterConfig[]>(
    () => [
      {
        rate: 18,
        shape: ParticleShape.SoftGlow,
        additive: true,
        ramp: COLOR_RAMPS.dragonFire,
        xMin: 0.28,
        xMax: 0.72,
        yMin: 0.42,
        yMax: 0.85,
        vxMin: -0.1,
        vxMax: 0.1,
        vyMin: -0.32,
        vyMax: -0.1,
        turbulence: 0.3,
        lifeMin: 1.0,
        lifeMax: 2.0,
        sizeStartMin: 2.8,
        sizeStartMax: 5.5,
        sizeEndMin: 1.0,
        sizeEndMax: 2.2,
        alphaPeak: 0.88,
      },
    ],
    []
  );

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      style={{ background: 'radial-gradient(circle, #581C87 0%, #070208 100%)', contain: 'paint' }}
    >
      <StoreLoopVideo
        itemId="pfp_yokai_lantern_ghost"
        animated={true}
        canAnimate={canAnimate}
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
      />
      <StoreFxCanvas
        emitters={emitters}
        maxParticles={44}
        seed={635}
        canAnimate={canAnimate}
        className="absolute inset-0 w-full h-full z-[3]"
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FLAGSHIP 3D MYTHIC AVATAR: ECLIPSE WYRM (id: eclipse-wyrm)
// ─────────────────────────────────────────────────────────────────────────────
export const PfpEclipseWyrm: React.FC<PfpSvgProps> = ({ canAnimate = true, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const instanceIdRef = useRef<string>(`pfp-eclipse-wyrm-${Math.random().toString(36).slice(2, 9)}`);
  const [isVisible, setIsVisible] = useState(true);
  const [isGovernorActive, setIsGovernorActive] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => storeVideoGovernor.isReducedMotion());

  const posterUrl = '/assets/store/eclipse-wyrm/poster.webp';
  const webmUrl = '/assets/store/eclipse-wyrm/avatar.webm';
  const mp4Url = '/assets/store/eclipse-wyrm/avatar.mp4';

  const effectiveAnimate = Boolean(canAnimate && !reducedMotion && !videoFailed);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mql.matches);
      const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.05, rootMargin: '80px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!effectiveAnimate) {
      setIsGovernorActive(false);
      return;
    }
    const id = instanceIdRef.current;
    return storeVideoGovernor.register({
      id,
      videoEl: videoRef.current,
      isVisible,
      canAnimate: effectiveAnimate,
      priority: 8,
      setActiveState: setIsGovernorActive,
    });
  }, [effectiveAnimate, isVisible]);

  useEffect(() => {
    storeVideoGovernor.update(instanceIdRef.current, {
      isVisible,
      canAnimate: effectiveAnimate,
      priority: 8,
    });
  }, [isVisible, effectiveAnimate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (effectiveAnimate && isVisible && isGovernorActive) {
      video.play().catch(() => {});
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
  }, [effectiveAnimate, isVisible, isGovernorActive]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none aspect-square rounded-full ${className}`}
      style={{
        background: 'radial-gradient(circle, #2A080C 0%, #030104 100%)',
        contain: 'paint',
      }}
      data-avatar-id="eclipse-wyrm"
    >
      <img
        src={posterUrl}
        alt="Eclipse Wyrm Avatar"
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 w-full h-full object-cover rounded-full pointer-events-none transition-opacity duration-300 ${
          effectiveAnimate && isGovernorActive ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {effectiveAnimate && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={posterUrl}
          onError={() => setVideoFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover rounded-full pointer-events-none transition-opacity duration-300 ${
            isGovernorActive ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={webmUrl} type="video/webm" />
          <source src={mp4Url} type="video/mp4" />
        </video>
      )}
    </div>
  );
};

/**
 * Registry mapping ID to Component
 */
// eslint-disable-next-line react-refresh/only-export-components
export const PFP_ARTWORK_MAP: Record<string, React.FC<PfpSvgProps>> = {
  // Flagship Mythic 3D Avatar (Blender 4.2.3 LTS render)
  'eclipse-wyrm': PfpEclipseWyrm,
  pfp_eclipse_wyrm: PfpEclipseWyrm,
  // 5 New Premium Profile Pictures (Wave 2)
  pfp_phoenix_ascendant: PfpPhoenixAscendant,
  pfp_ryujin_sea_dragon: PfpRyujinSeaDragon,
  pfp_shadow_ninja_mask: PfpShadowNinjaMask,
  pfp_raijin_thunder_god: PfpRaijinThunderGod,
  pfp_yokai_lantern_ghost: PfpYokaiLanternGhost,
  // 5 New Premium Profile Pictures (Wave 1)
  pfp_zenryu_awakened: PfpZenryuAwakened,
  pfp_oni_warlord: PfpOniWarlord,
  pfp_kitsune_moonlight: PfpKitsuneMoonlight,
  pfp_cyber_samurai_visor: PfpCyberSamuraiVisor,
  pfp_tengu_storm_priest: PfpTenguStormPriest,
  // 12 Animated
  pfp_crimson_ronin: PfpCrimsonRonin,
  pfp_sakura_kitsune: PfpSakuraKitsune,
  pfp_waterfall_dragon: PfpWaterfallDragon,
  pfp_torii_mist: PfpMistToriiGate,
  pfp_thunder_kami: PfpThunderKami,
  pfp_aurora_wolf: PfpAuroraWolf,
  pfp_neon_karachi: PfpNeonSkyline,
  pfp_crescent_cat: PfpCrescentCat,
  pfp_ember_phoenix: PfpEmberPhoenix,
  pfp_lantern_abyss: PfpLanternAbyss,
  pfp_solar_eclipse: PfpSolarCoronaCrow,
  pfp_cyber_samurai_pfp: PfpCyberKatana,
  // 13 Static
  pfp_ink_tiger: PfpInkTiger,
  pfp_shrine_maiden: PfpShrineMaiden,
  pfp_samurai_kabuto: PfpSamuraiKabuto,
  pfp_origami_cranes: PfpOrigamiCranes,
  pfp_frozen_lake: PfpFrozenLake,
  pfp_fuji_dawn: PfpFujiDawn,
  pfp_spirit_deer: PfpSpiritDeer,
  pfp_bamboo_twilight: PfpBambooTwilight,
  pfp_kintsugi_wave: PfpKintsugiWave,
  pfp_midnight_lotus: PfpMidnightLotus,
  pfp_alley_lanterns: PfpAlleyLanterns,
  pfp_celestial_compass: PfpCelestialCompass,
  pfp_zen_bonsai: PfpZenBonsai,
};

