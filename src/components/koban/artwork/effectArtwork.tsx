import React, { useEffect, useState } from 'react';

interface EffectProps {
  itemId: string;
  size?: number;
  canAnimate?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * 25 BESPOKE AVATAR-SIZED EFFECT WRAPPERS (<EffectAvatarRenderer />)
 * Renders atmospheric vector auras around the student's avatar/frame.
 * Static items (animated: false) have ZERO motion anywhere.
 * Animated items (animated: true) animate using transform & opacity only.
 */
export const EffectAvatarRenderer: React.FC<EffectProps> = ({
  itemId,
  size = 64,
  canAnimate = true,
  children,
  className = '',
}) => {
  switch (itemId) {
    // ─── 13 STATIC AVATAR EFFECTS ──────────────────────────────────────────
    case 'effect-whispering-mist':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-0 overflow-visible" viewBox="0 0 100 100" fill="none">
            <path d="M10 80C25 65 45 75 60 70C75 65 85 75 95 80" stroke="#94A3B8" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
            <path d="M5 88C20 78 40 85 65 82C80 80 90 85 98 88" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-golden-leaf-frost':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" fill="none">
            <path d="M18 18C14 26 22 34 30 30C28 22 24 16 18 18Z" fill="#FBBF24" stroke="#B45309" strokeWidth="0.8" opacity="0.9" />
            <path d="M82 82C86 74 78 66 70 70C72 78 76 84 82 82Z" fill="#FBBF24" stroke="#B45309" strokeWidth="0.8" opacity="0.9" />
            <polygon points="12,12 14,16 18,18 14,20 12,24 10,20 6,18 10,16" fill="#FDE68A" />
            <polygon points="88,88 86,84 82,82 86,80 88,76 90,80 94,82 90,84" fill="#FDE68A" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-crimson-vignette':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute -inset-3 rounded-full bg-radial from-transparent via-[#DC2626]/20 to-[#7F1D1D]/45 pointer-events-none z-0" />
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-ink-brush-splash':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-0 overflow-visible" viewBox="0 0 100 100" fill="none">
            <path d="M10 25C25 15 45 10 70 18C85 24 95 40 92 65C88 85 70 95 45 92C25 90 10 75 12 50" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" opacity="0.75" />
            <circle cx="88" cy="22" r="3" fill="#0F172A" opacity="0.8" />
            <circle cx="94" cy="32" r="2" fill="#0F172A" opacity="0.8" />
            <circle cx="14" cy="78" r="2.5" fill="#0F172A" opacity="0.8" />
            <rect x="76" y="74" width="8" height="8" fill="#DC2626" opacity="0.9" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-star-chart':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-0 overflow-visible" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="#818CF8" strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
            <line x1="50" y1="2" x2="50" y2="10" stroke="#818CF8" strokeWidth="1.5" />
            <line x1="50" y1="90" x2="50" y2="98" stroke="#818CF8" strokeWidth="1.5" />
            <line x1="2" y1="50" x2="10" y2="50" stroke="#818CF8" strokeWidth="1.5" />
            <line x1="90" y1="50" x2="98" y2="50" stroke="#818CF8" strokeWidth="1.5" />
            <circle cx="24" cy="24" r="2" fill="#FDE047" />
            <circle cx="76" cy="24" r="2" fill="#FDE047" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-frosted-crystal':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" fill="none">
            <polygon points="50,4 53,14 63,14 55,20 58,30 50,24 42,30 45,20 37,14 47,14" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="0.8" opacity="0.85" />
            <polygon points="50,96 52,88 60,88 54,84 56,76 50,80 44,76 46,84 40,88 48,88" fill="#E0F2FE" stroke="#38BDF8" strokeWidth="0.8" opacity="0.85" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-paper-lantern-glow':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute -inset-3 rounded-full bg-radial from-[#F59E0B]/25 via-[#D97706]/10 to-transparent pointer-events-none z-0" />
          <svg className="absolute -top-3 -right-2 w-8 h-8 pointer-events-none z-20 overflow-visible" viewBox="0 0 32 32" fill="none">
            <line x1="16" y1="0" x2="16" y2="8" stroke="#78350F" strokeWidth="1.5" />
            <rect x="10" y="8" width="12" height="16" rx="3" fill="#DC2626" stroke="#FEF08A" strokeWidth="1" />
            <line x1="10" y1="16" x2="22" y2="16" stroke="#FEF08A" strokeWidth="1" />
            <circle cx="16" cy="16" r="3" fill="#FDE047" opacity="0.8" />
            <line x1="16" y1="24" x2="16" y2="30" stroke="#B45309" strokeWidth="1.5" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-sacred-geometry':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-0 overflow-visible" viewBox="0 0 100 100" fill="none">
            <polygon points="50,4 90,82 10,82" stroke="#F59E0B" strokeWidth="1" opacity="0.5" />
            <polygon points="50,96 90,18 10,18" stroke="#F59E0B" strokeWidth="1" opacity="0.5" />
            <circle cx="50" cy="50" r="46" stroke="#D97706" strokeWidth="0.8" strokeDasharray="4 4" opacity="0.5" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-bamboo-screen':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" fill="none">
            <rect x="6" y="20" width="4" height="60" rx="1" fill="#15803D" stroke="#86EFAC" strokeWidth="0.8" />
            <rect x="90" y="20" width="4" height="60" rx="1" fill="#15803D" stroke="#86EFAC" strokeWidth="0.8" />
            <path d="M4 30C12 24 20 28 24 32C16 34 10 32 4 30Z" fill="#22C55E" />
            <path d="M96 65C88 60 80 64 76 68C84 70 90 68 96 65Z" fill="#22C55E" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-cherry-carpet':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" fill="none">
            <path d="M26 84C32 78 40 82 38 88C32 94 24 90 26 84Z" fill="#F472B6" opacity="0.9" />
            <path d="M46 88C52 82 60 86 58 92C52 98 44 94 46 88Z" fill="#FB7185" opacity="0.85" />
            <path d="M68 84C74 78 82 82 80 88C74 94 66 90 68 84Z" fill="#F472B6" opacity="0.9" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-dawn-horizon':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-0 overflow-visible" viewBox="0 0 100 100" fill="none">
            <path d="M50 50L20 10M50 50L50 2M50 50L80 10M50 50L98 30M50 50L2 30" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="6 4" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-dusk-smoke':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div className="absolute -inset-3 rounded-full bg-radial from-transparent via-[#581C87]/25 to-[#3B0764]/40 pointer-events-none z-0" />
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-ancient-runes':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 5 8 5" opacity="0.75" />
            <text x="50" y="10" fill="#FEF08A" fontSize="7" textAnchor="middle" fontFamily="sans-serif">封</text>
            <text x="50" y="98" fill="#FEF08A" fontSize="7" textAnchor="middle" fontFamily="sans-serif">印</text>
            <text x="8" y="52" fill="#FEF08A" fontSize="7" textAnchor="middle" fontFamily="sans-serif">滅</text>
            <text x="92" y="52" fill="#FEF08A" fontSize="7" textAnchor="middle" fontFamily="sans-serif">破</text>
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    // ─── 12 ANIMATED AVATAR EFFECTS ─────────────────────────────────────────
    case 'effect-faint-sparkles':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <span
            className="absolute -top-1 -left-1 text-[#FFD66B] text-xs pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-star-twinkle 2s ease-in-out infinite' } : undefined}
          >
            ✦
          </span>
          <span
            className="absolute -top-1 -right-1 text-[#FFD66B] text-[10px] pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-star-twinkle 2.5s ease-in-out infinite 0.6s' } : undefined}
          >
            ✦
          </span>
          <span
            className="absolute -bottom-1 right-0 text-[#FFD66B] text-xs pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-star-twinkle 1.8s ease-in-out infinite 1.2s' } : undefined}
          >
            ✧
          </span>
          <span
            className="absolute bottom-0 -left-1 text-[#FFD66B] text-[9px] pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-star-twinkle 2.2s ease-in-out infinite 0.3s' } : undefined}
          >
            ✦
          </span>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-ember-drift':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <span
            className="absolute bottom-1 left-2 w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_6px_#EF4444] z-20 pointer-events-none"
            style={canAnimate ? { animation: 'koban-ember-rise 2s ease-out infinite' } : undefined}
          />
          <span
            className="absolute bottom-3 right-1 w-2.5 h-2.5 rounded-full bg-[#F97316] shadow-[0_0_6px_#F97316] z-20 pointer-events-none"
            style={canAnimate ? { animation: 'koban-ember-rise 2.6s ease-out infinite 0.8s' } : undefined}
          />
          <span
            className="absolute bottom-6 left-1/2 w-1.5 h-1.5 rounded-full bg-[#FDE047] shadow-[0_0_4px_#FDE047] z-20 pointer-events-none"
            style={canAnimate ? { animation: 'koban-ember-rise 2.2s ease-out infinite 1.4s' } : undefined}
          />
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-electric-aura':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg
            className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible"
            viewBox="0 0 100 100"
            fill="none"
            style={canAnimate ? { animation: 'koban-lightning-flicker 1.8s steps(2, start) infinite' } : undefined}
          >
            <path d="M16 28L26 36L20 46L32 58" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" />
            <path d="M84 24L74 34L80 44L70 56" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round" />
            <path d="M36 86L46 80L42 72L54 68" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-cherry-storm':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 z-20 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            style={canAnimate ? { animation: 'koban-petal-fall 2.8s ease-in-out infinite' } : undefined}
          >
            <path d="M12 2C8 6 4 10 7 16C10 22 17 20 18 14C19 8 16 4 12 2Z" fill="#F472B6" />
            <path d="M12 6C10 9 8 11 9 14" stroke="#BE185D" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <svg
            className="absolute bottom-0 -left-2 w-3.5 h-3.5 z-20 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            style={canAnimate ? { animation: 'koban-petal-fall 3.6s ease-in-out infinite 1s' } : undefined}
          >
            <path d="M12 2C8 6 4 10 7 16C10 22 17 20 18 14C19 8 16 4 12 2Z" fill="#FB7185" />
          </svg>
          <svg
            className="absolute top-1/3 -right-2 w-3 h-3 z-20 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            style={canAnimate ? { animation: 'koban-petal-fall 3.2s ease-in-out infinite 1.8s' } : undefined}
          >
            <path d="M12 2C8 6 4 10 7 16C10 22 17 20 18 14C19 8 16 4 12 2Z" fill="#FDA4AF" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-shadow-haze':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div
            className="absolute -inset-3 rounded-full bg-radial from-transparent via-[#581C87]/35 to-[#3B0764]/70 blur-xs z-0 pointer-events-none"
            style={canAnimate ? { animation: 'koban-pulse-glow 2.8s ease-in-out infinite' } : undefined}
          />
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-divine-radiance':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg
            className="absolute -inset-3.5 w-[calc(100%+28px)] h-[calc(100%+28px)] pointer-events-none z-0 overflow-visible"
            viewBox="0 0 100 100"
            fill="none"
            style={canAnimate ? { transformOrigin: '50px 50px', animation: 'koban-orbit-cw 12s linear infinite' } : undefined}
          >
            <g stroke="#FBBF24" strokeWidth="1.8" strokeOpacity="0.65" strokeDasharray="4 6">
              <line x1="50" y1="2" x2="50" y2="22" />
              <line x1="50" y1="78" x2="50" y2="98" />
              <line x1="2" y1="50" x2="22" y2="50" />
              <line x1="78" y1="50" x2="98" y2="50" />
              <line x1="16" y1="16" x2="30" y2="30" />
              <line x1="70" y1="70" x2="84" y2="84" />
              <line x1="84" y1="16" x2="70" y2="30" />
              <line x1="30" y1="70" x2="16" y2="84" />
            </g>
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-thunder-storm':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg
            className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible"
            viewBox="0 0 100 100"
            fill="none"
            style={canAnimate ? { animation: 'koban-lightning-flicker 1.6s steps(2, start) infinite' } : undefined}
          >
            <polygon points="50,2 54,20 46,20 52,36 42,22 48,22" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />
            <polygon points="18,50 34,54 24,56 40,62 26,60 32,58" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />
            <polygon points="82,48 66,52 76,54 60,60 74,58 68,56" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.8" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-celestial-star-drift':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={canAnimate ? { transformOrigin: 'center', animation: 'koban-orbit-cw 8s linear infinite' } : undefined}
          >
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#FDE047] shadow-[0_0_6px_#FDE047]" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E0E7FF] shadow-[0_0_4px_#818CF8]" />
          </div>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-spirit-wisps':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <span
            className="absolute bottom-2 -left-2 w-3.5 h-3.5 rounded-full bg-[#38BDF8]/80 blur-[2px] pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-pulse-glow 2.4s ease-in-out infinite' } : undefined}
          />
          <span
            className="absolute -top-1 right-1 w-3 h-3 rounded-full bg-[#818CF8]/80 blur-[2px] pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-pulse-glow 3s ease-in-out infinite 0.8s' } : undefined}
          />
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-neon-rain':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg
            className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none z-20 overflow-visible"
            viewBox="0 0 100 100"
            fill="none"
          >
            <line x1="20" y1="0" x2="16" y2="28" stroke="#00F0FF" strokeWidth="1.5" strokeLinecap="round" style={canAnimate ? { animation: 'koban-sweep-light 1.8s linear infinite' } : undefined} />
            <line x1="80" y1="10" x2="76" y2="38" stroke="#FF007A" strokeWidth="1.5" strokeLinecap="round" style={canAnimate ? { animation: 'koban-sweep-light 2.2s linear infinite 0.6s' } : undefined} />
            <line x1="50" y1="60" x2="46" y2="88" stroke="#00F0FF" strokeWidth="1.5" strokeLinecap="round" style={canAnimate ? { animation: 'koban-sweep-light 2s linear infinite 1.2s' } : undefined} />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-blazing-inferno':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div
            className="absolute -inset-3 rounded-full bg-radial from-transparent via-[#DC2626]/30 to-[#EA580C]/50 pointer-events-none z-0"
            style={canAnimate ? { animation: 'koban-flame-flicker 1.8s ease-in-out infinite' } : undefined}
          />
          <span
            className="absolute bottom-0 left-1 w-2 h-2 rounded-full bg-[#FDE047] shadow-[0_0_6px_#FDE047] pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-ember-rise 1.8s ease-out infinite' } : undefined}
          />
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-abyssal-ripples':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div
            className="absolute -inset-3 rounded-full border-2 border-[#00F0FF]/60 shadow-[0_0_10px_rgba(0,240,255,0.4)] pointer-events-none z-20"
            style={canAnimate ? { animation: 'koban-water-ripple 2.8s ease-in-out infinite' } : undefined}
          />
          <div className="relative z-10">{children}</div>
        </div>
      );

    // ─── 5 NEW PREMIUM AVATAR EFFECTS ───────────────────────────────────────
    case 'effect-dragon-fire-aura':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div
            className="absolute -inset-2.5 rounded-full bg-radial from-[#FEF08A]/25 via-[#DC2626]/40 to-transparent pointer-events-none z-0"
            style={canAnimate ? { animation: 'koban-flame-flicker 1.8s ease-in-out infinite' } : undefined}
          />
          <svg
            className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] pointer-events-none z-20"
            viewBox="0 0 100 100"
            fill="none"
            style={canAnimate ? { transformOrigin: '50px 50px', animation: 'koban-orbit-cw 8s linear infinite' } : undefined}
          >
            <path d="M50 4 C74 4 94 24 94 48" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M50 96 C26 96 6 76 6 52" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="4" r="3" fill="#FEF08A" />
            <circle cx="50" cy="96" r="3" fill="#F97316" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-thunder-kami-storm':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg
            className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] pointer-events-none z-20"
            viewBox="0 0 100 100"
            fill="none"
            style={canAnimate ? { animation: 'koban-lightning-flicker 1.5s steps(2, start) infinite' } : undefined}
          >
            <polyline points="50,2 44,16 54,18 46,32" stroke="#FEF08A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="94,46 80,52 84,60 70,66" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="8,54 22,48 18,40 32,34" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-spirit-fox-fire':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <div
            className="absolute -inset-2 pointer-events-none z-20"
            style={canAnimate ? { transformOrigin: 'center', animation: 'koban-orbit-cw 9s linear infinite' } : undefined}
          >
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#00F0FF]" />
            <span className="absolute bottom-1 left-1 w-2.5 h-2.5 rounded-full bg-[#A855F7] shadow-[0_0_8px_#A855F7]" />
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#00F0FF]" />
          </div>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-cherry-blossom-gale':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg
            className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] pointer-events-none z-20"
            viewBox="0 0 100 100"
            fill="none"
            style={canAnimate ? { animation: 'koban-petal-fall 3s ease-in-out infinite' } : undefined}
          >
            <path d="M18 32 C38 14 68 18 86 38" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
            <ellipse cx="26" cy="24" rx="5" ry="2.5" transform="rotate(-25 26 24)" fill="#FBCFE8" />
            <ellipse cx="78" cy="30" rx="4.5" ry="2.2" transform="rotate(20 78 30)" fill="#F472B6" />
            <ellipse cx="64" cy="82" rx="5" ry="2.5" transform="rotate(-15 64 82)" fill="#FB7185" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    case 'effect-falling-stars':
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          <svg
            className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] pointer-events-none z-20"
            viewBox="0 0 100 100"
            fill="none"
          >
            <line x1="82" y1="12" x2="58" y2="36" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />
            <circle cx="58" cy="36" r="2.5" fill="#FEF08A" />
            <line x1="38" y1="62" x2="16" y2="84" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="16" cy="84" r="2" fill="#E0E7FF" />
          </svg>
          <div className="relative z-10">{children}</div>
        </div>
      );

    default:
      return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
          {children}
        </div>
      );
  }
};

/**
 * 25 FULL-CARD PROFILE OVERLAY EFFECTS (<ProfileCardEffect />)
 * In real profile view: displays for 3-4s, then smoothly fades away.
 * In store card / detail preview (`previewMode={true}`): loops continuously!
 */
export interface ProfileCardEffectProps {
  itemId?: string | null;
  className?: string;
  previewMode?: boolean;
  size?: number;
}

export const ProfileCardEffect: React.FC<ProfileCardEffectProps> = ({ itemId, className = '', previewMode = false }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!itemId || itemId === 'none') {
      setVisible(false);
      return;
    }
    setVisible(true);
    if (!previewMode) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3600); // 3.6s duration
      return () => clearTimeout(timer);
    }
  }, [itemId, previewMode]);

  if (!itemId || itemId === 'none') return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20 transition-opacity duration-1000 ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      aria-hidden="true"
    >
      {/* ─── 13 STATIC FULL-CARD EFFECTS (Zero Motion) ───────────────────────── */}
      {itemId === 'effect-whispering-mist' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="none" fill="none">
          <path d="M0 140C60 120 120 160 180 130C240 100 280 150 300 130V200H0Z" fill="#94A3B8" opacity="0.25" />
          <path d="M0 160C80 140 160 180 220 150C270 130 290 170 300 160V200H0Z" fill="#CBD5E1" opacity="0.3" />
          <circle cx="260" cy="40" r="22" fill="#E2E8F0" opacity="0.2" />
        </svg>
      )}

      {itemId === 'effect-golden-leaf-frost' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <rect x="6" y="6" width="288" height="188" rx="12" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="8 6" />
          {/* Top-left Ginkgo leaves */}
          <path d="M12 12C24 16 32 30 24 40C16 42 12 28 12 12Z" fill="#FBBF24" opacity="0.4" />
          {/* Bottom-right Momiji leaf */}
          <path d="M280 180L272 165L260 172L266 160L250 155L265 148L262 135L274 144L285 135L282 148L295 155L280 160Z" fill="#D97706" opacity="0.35" />
        </svg>
      )}

      {itemId === 'effect-crimson-vignette' && (
        <div className="absolute inset-0 bg-radial from-transparent via-[#DC2626]/15 to-[#450A0A]/55" />
      )}

      {itemId === 'effect-ink-brush-splash' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <path d="M-20 60C50 30 120 80 200 40C250 20 280 60 320 40" stroke="#0F172A" strokeWidth="18" strokeLinecap="round" opacity="0.35" />
          <circle cx="240" cy="80" r="6" fill="#0F172A" opacity="0.4" />
          <circle cx="255" cy="95" r="4" fill="#0F172A" opacity="0.4" />
          <circle cx="60" cy="120" r="5" fill="#0F172A" opacity="0.4" />
          <rect x="250" y="20" width="16" height="16" fill="#DC2626" opacity="0.8" />
        </svg>
      )}

      {itemId === 'effect-star-chart' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <circle cx="150" cy="100" r="80" stroke="#818CF8" strokeWidth="1" strokeDasharray="4 6" opacity="0.3" />
          <circle cx="150" cy="100" r="120" stroke="#818CF8" strokeWidth="0.8" opacity="0.2" />
          <line x1="30" y1="100" x2="270" y2="100" stroke="#818CF8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
          <line x1="150" y1="10" x2="150" y2="190" stroke="#818CF8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
          <circle cx="80" cy="50" r="2.5" fill="#FDE047" opacity="0.7" />
          <circle cx="220" cy="60" r="2.5" fill="#FDE047" opacity="0.7" />
          <circle cx="190" cy="150" r="2" fill="#FDE047" opacity="0.7" />
          <line x1="80" y1="50" x2="110" y2="70" stroke="#FDE047" strokeWidth="0.8" opacity="0.5" />
        </svg>
      )}

      {itemId === 'effect-frosted-crystal' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <path d="M0 0L30 30M300 0L270 30M0 200L30 170M300 200L270 170" stroke="#38BDF8" strokeWidth="2" opacity="0.6" />
          <polygon points="150,0 156,20 166,24 156,28 150,48 144,28 134,24 144,20" fill="#E0F2FE" opacity="0.35" />
          <rect x="4" y="4" width="292" height="192" rx="12" stroke="#38BDF8" strokeWidth="1" opacity="0.3" />
        </svg>
      )}

      {itemId === 'effect-paper-lantern-glow' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          {/* Top Hanging Festival String */}
          <path d="M0 20Q150 60 300 20" stroke="#78350F" strokeWidth="1.5" opacity="0.6" />
          {/* Lantern 1 */}
          <g transform="translate(60, 32)">
            <rect width="20" height="28" rx="4" fill="#DC2626" stroke="#FEF08A" strokeWidth="1" opacity="0.85" />
            <circle cx="10" cy="14" r="5" fill="#FDE047" opacity="0.7" />
          </g>
          {/* Lantern 2 */}
          <g transform="translate(220, 32)">
            <rect width="20" height="28" rx="4" fill="#DC2626" stroke="#FEF08A" strokeWidth="1" opacity="0.85" />
            <circle cx="10" cy="14" r="5" fill="#FDE047" opacity="0.7" />
          </g>
        </svg>
      )}

      {itemId === 'effect-sacred-geometry' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <g transform="translate(150, 100)" stroke="#F59E0B" strokeWidth="1" opacity="0.25">
            <polygon points="0,-70 60,35 -60,35" />
            <polygon points="0,70 60,-35 -60,-35" />
            <circle r="72" />
            <circle r="45" strokeDasharray="4 4" />
          </g>
        </svg>
      )}

      {itemId === 'effect-bamboo-screen' && (
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_90%,rgba(34,197,94,0.18)_90%)] [background-size:20px_100%]" />
      )}

      {itemId === 'effect-cherry-carpet' && (
        <svg className="absolute inset-x-0 bottom-0 w-full h-16" viewBox="0 0 300 64" fill="none">
          <path d="M20 50C26 44 34 48 32 54C26 60 18 56 20 50Z" fill="#F472B6" opacity="0.7" />
          <path d="M80 44C86 38 94 42 92 48C86 54 78 50 80 44Z" fill="#FB7185" opacity="0.6" />
          <path d="M150 52C156 46 164 50 162 56C156 62 148 58 150 52Z" fill="#F472B6" opacity="0.7" />
          <path d="M220 46C226 40 234 44 232 50C226 56 218 52 220 46Z" fill="#FB7185" opacity="0.6" />
          <path d="M270 54C276 48 284 52 282 58C276 64 268 60 270 54Z" fill="#F472B6" opacity="0.7" />
        </svg>
      )}

      {itemId === 'effect-dawn-horizon' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <g stroke="#F59E0B" strokeWidth="2" opacity="0.3" strokeDasharray="8 6">
            <line x1="150" y1="200" x2="30" y2="0" />
            <line x1="150" y1="200" x2="90" y2="0" />
            <line x1="150" y1="200" x2="150" y2="0" />
            <line x1="150" y1="200" x2="210" y2="0" />
            <line x1="150" y1="200" x2="270" y2="0" />
          </g>
        </svg>
      )}

      {itemId === 'effect-dusk-smoke' && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#3B0764]/40 via-[#1E1B4B]/20 to-transparent" />
      )}

      {itemId === 'effect-ancient-runes' && (
        <div className="absolute inset-0 border-2 border-[#D97706]/40 rounded-2xl flex items-center justify-between p-2 pointer-events-none">
          <span className="text-xs text-[#FEF08A] opacity-60">封</span>
          <span className="text-xs text-[#FEF08A] opacity-60">印</span>
          <span className="text-xs text-[#FEF08A] opacity-60">界</span>
          <span className="text-xs text-[#FEF08A] opacity-60">陣</span>
        </div>
      )}

      {/* ─── 12 ANIMATED FULL-CARD EFFECTS (Visible Looping Motion) ───────────── */}
      {itemId === 'effect-faint-sparkles' && (
        <div className="absolute inset-0">
          <span className="absolute top-6 left-12 text-[#FDE047] text-xl" style={{ animation: 'koban-star-twinkle 2.2s ease-in-out infinite' }}>✦</span>
          <span className="absolute top-16 right-16 text-[#FDE047] text-sm" style={{ animation: 'koban-star-twinkle 2.8s ease-in-out infinite 0.7s' }}>✦</span>
          <span className="absolute bottom-10 left-1/4 text-[#FEF08A] text-lg" style={{ animation: 'koban-star-twinkle 1.9s ease-in-out infinite 1.3s' }}>✧</span>
          <span className="absolute bottom-16 right-1/3 text-[#FDE047] text-base" style={{ animation: 'koban-star-twinkle 2.4s ease-in-out infinite 0.4s' }}>✦</span>
        </div>
      )}

      {itemId === 'effect-ember-drift' && (
        <div className="absolute inset-0">
          <span className="absolute bottom-4 left-10 w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" style={{ animation: 'koban-ember-rise 2.4s ease-out infinite' }} />
          <span className="absolute bottom-8 right-16 w-3 h-3 rounded-full bg-[#F97316] shadow-[0_0_8px_#F97316]" style={{ animation: 'koban-ember-rise 2.8s ease-out infinite 0.7s' }} />
          <span className="absolute bottom-12 left-1/2 w-2 h-2 rounded-full bg-[#FDE047] shadow-[0_0_6px_#FDE047]" style={{ animation: 'koban-ember-rise 2.1s ease-out infinite 1.4s' }} />
        </div>
      )}

      {itemId === 'effect-electric-aura' && (
        <div
          className="absolute inset-0 border-2 border-[#00F0FF]/60 shadow-[inset_0_0_20px_rgba(0,240,255,0.3)] rounded-2xl"
          style={{ animation: 'koban-lightning-flicker 2s steps(2, start) infinite' }}
        />
      )}

      {itemId === 'effect-cherry-storm' && (
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute top-4 left-16 w-5 h-5" viewBox="0 0 24 24" fill="none" style={{ animation: 'koban-petal-fall 3.2s ease-in-out infinite' }}>
            <path d="M12 2C8 6 4 10 7 16C10 22 17 20 18 14C19 8 16 4 12 2Z" fill="#F472B6" />
            <path d="M12 6C10 9 8 11 9 14" stroke="#BE185D" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <svg className="absolute top-12 right-20 w-4 h-4" viewBox="0 0 24 24" fill="none" style={{ animation: 'koban-petal-fall 4s ease-in-out infinite 1s' }}>
            <path d="M12 2C8 6 4 10 7 16C10 22 17 20 18 14C19 8 16 4 12 2Z" fill="#FB7185" />
          </svg>
          <svg className="absolute top-8 left-1/2 w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" style={{ animation: 'koban-petal-fall 3.6s ease-in-out infinite 1.8s' }}>
            <path d="M12 2C8 6 4 10 7 16C10 22 17 20 18 14C19 8 16 4 12 2Z" fill="#FDA4AF" />
          </svg>
        </div>
      )}

      {itemId === 'effect-shadow-haze' && (
        <div
          className="absolute inset-0 bg-radial from-transparent to-[#3B0764]/70 blur-xs"
          style={{ animation: 'koban-pulse-glow 3s ease-in-out infinite' }}
        />
      )}

      {itemId === 'effect-divine-radiance' && (
        <div
          className="absolute inset-0 border-2 border-[#FBBF24]/70 shadow-[0_0_24px_rgba(251,191,36,0.35)] rounded-2xl"
          style={{ animation: 'koban-pulse-glow 2.8s ease-in-out infinite' }}
        />
      )}

      {itemId === 'effect-thunder-storm' && (
        <div
          className="absolute inset-0 border-2 border-[#FDE047] shadow-[0_0_16px_#FDE047] rounded-2xl"
          style={{ animation: 'koban-lightning-flicker 1.6s steps(2, start) infinite' }}
        />
      )}

      {itemId === 'effect-celestial-star-drift' && (
        <div className="absolute inset-0">
          <span className="absolute top-8 left-12 text-[#FEF08A] text-lg" style={{ animation: 'koban-star-twinkle 2.4s ease-in-out infinite' }}>★</span>
          <span className="absolute bottom-10 right-16 text-[#C7D2FE] text-base" style={{ animation: 'koban-star-twinkle 3s ease-in-out infinite 1s' }}>★</span>
          <span className="absolute top-1/2 right-10 text-[#FEF08A] text-sm" style={{ animation: 'koban-star-twinkle 2s ease-in-out infinite 0.5s' }}>✦</span>
        </div>
      )}

      {itemId === 'effect-spirit-wisps' && (
        <div className="absolute inset-0">
          <span className="absolute bottom-6 left-12 w-5 h-5 rounded-full bg-[#38BDF8]/70 blur-xs" style={{ animation: 'koban-pulse-glow 2.6s ease-in-out infinite' }} />
          <span className="absolute bottom-14 right-14 w-4 h-4 rounded-full bg-[#818CF8]/70 blur-xs" style={{ animation: 'koban-pulse-glow 3.2s ease-in-out infinite 1s' }} />
        </div>
      )}

      {itemId === 'effect-neon-rain' && (
        <div
          className="absolute inset-0 bg-[linear-gradient(135deg,transparent_90%,rgba(0,240,255,0.45)_90%)] [background-size:20px_20px]"
          style={{ animation: 'koban-grid-scroll 3s linear infinite' }}
        />
      )}

      {itemId === 'effect-blazing-inferno' && (
        <div
          className="absolute inset-0 border-2 border-[#EF4444] shadow-[0_0_24px_rgba(239,68,68,0.6)] rounded-2xl"
          style={{ animation: 'koban-flame-flicker 2s ease-in-out infinite' }}
        />
      )}

      {itemId === 'effect-abyssal-ripples' && (
        <div
          className="absolute inset-0 border-2 border-[#00F0FF]/70 shadow-[inset_0_0_24px_rgba(0,240,255,0.35)] rounded-2xl"
          style={{ animation: 'koban-water-ripple 3s ease-in-out infinite' }}
        />
      )}

      {/* ─── 5 NEW PREMIUM FULL-CARD EFFECTS ──────────────────────────────── */}
      {itemId === 'effect-dragon-fire-aura' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="dfa_fire" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.65" />
              <stop offset="55%" stopColor="#F59E0B" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FEF08A" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            d="M0 200 C50 145 110 175 165 125 C220 75 265 110 300 50 L300 200 Z"
            fill="url(#dfa_fire)"
            style={{ animation: 'koban-flame-flicker 2.2s ease-in-out infinite' }}
          />
          <path
            d="M15 165 C85 110 155 140 245 65"
            stroke="#FEF08A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="8 6"
            opacity="0.8"
          />
          <circle cx="52" cy="138" r="4" fill="#FEF08A" style={{ animation: 'koban-ember-rise 2.2s ease-out infinite' }} />
          <circle cx="148" cy="108" r="3.5" fill="#F97316" style={{ animation: 'koban-ember-rise 2.6s ease-out infinite 0.5s' }} />
          <circle cx="235" cy="78" r="4.5" fill="#EF4444" style={{ animation: 'koban-ember-rise 2s ease-out infinite 1s' }} />
        </svg>
      )}

      {itemId === 'effect-thunder-kami-storm' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="none" fill="none">
          <g style={{ animation: 'koban-lightning-flicker 1.6s steps(2, start) infinite' }}>
            <polyline points="45,0 32,48 56,54 28,118" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="248,0 226,56 252,64 214,138" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="155,15 142,60 164,66 146,110" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <circle cx="245" cy="42" r="22" stroke="#F59E0B" strokeWidth="1.8" strokeDasharray="5 4" opacity="0.65" />
        </svg>
      )}

      {itemId === 'effect-spirit-fox-fire' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <g style={{ animation: 'koban-pulse-glow 2.5s ease-in-out infinite' }}>
            <circle cx="48" cy="145" r="12" fill="#38BDF8" opacity="0.35" />
            <circle cx="48" cy="145" r="5.5" fill="#E0F2FE" />
            <path d="M48 139 C44 125 52 115 48 104" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />

            <circle cx="152" cy="52" r="13" fill="#A855F7" opacity="0.35" />
            <circle cx="152" cy="52" r="6" fill="#F3E8FF" />
            <path d="M152 46 C148 32 156 22 152 12" stroke="#C084FC" strokeWidth="2.5" strokeLinecap="round" />

            <circle cx="248" cy="128" r="12" fill="#38BDF8" opacity="0.35" />
            <circle cx="248" cy="128" r="5.5" fill="#E0F2FE" />
            <path d="M248 122 C244 108 252 98 248 86" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </svg>
      )}

      {itemId === 'effect-cherry-blossom-gale' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <path d="M-10 155 C75 105 165 135 310 55" stroke="#F472B6" strokeWidth="2" strokeDasharray="10 6" opacity="0.55" />
          <path d="M-10 95 C90 55 185 85 310 25" stroke="#FBCFE8" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.45" />
          <g style={{ animation: 'koban-petal-fall 3.2s ease-in-out infinite' }}>
            <ellipse cx="55" cy="65" rx="7" ry="3.5" transform="rotate(-25 55 65)" fill="#F472B6" />
            <ellipse cx="125" cy="95" rx="6" ry="3" transform="rotate(15 125 95)" fill="#FBCFE8" />
            <ellipse cx="195" cy="52" rx="7.5" ry="3.5" transform="rotate(-30 195 52)" fill="#FB7185" />
            <ellipse cx="245" cy="118" rx="6.5" ry="3.2" transform="rotate(20 245 118)" fill="#F472B6" />
          </g>
        </svg>
      )}

      {itemId === 'effect-falling-stars' && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
          <g style={{ animation: 'koban-pulse-glow 2.2s ease-in-out infinite' }}>
            <line x1="255" y1="18" x2="175" y2="82" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="175" cy="82" r="4" fill="#FEF08A" />
            <line x1="145" y1="28" x2="72" y2="86" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
            <circle cx="72" cy="86" r="3.5" fill="#E0F2FE" />
            <line x1="275" y1="88" x2="198" y2="148" stroke="#C084FC" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="198" cy="148" r="3.5" fill="#FEF08A" />
          </g>
        </svg>
      )}
    </div>
   );
};

/**
 * Dedicated Card Preview Renderer for Store and Gallery
 * Displays a realistic sample mini profile card (avatar, name line, effect particles)
 * strictly clipped inside the tile with overflow: hidden; contain: paint.
 * No overlapping "PROFILE EFFECT" label inside the mock card, and no gray bars sticking out.
 */
export const ProfileEffectCardPreview: React.FC<{
  itemId: string;
  className?: string;
  compact?: boolean;
  userName?: string;
}> = ({ itemId, className = '', userName = 'Boardly Scholar' }) => {
  return (
    <div
      className={`relative w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-[#141418] via-[#0E0E12] to-[#08080B] border border-white/10 p-3 flex flex-col justify-center items-center shadow-inner select-none ${className}`}
      style={{ overflow: 'hidden', contain: 'paint' }}
    >
      {/* Subtle Top Banner Strip Inside Mini Profile Card */}
      <div className="absolute inset-x-0 top-0 h-9 bg-gradient-to-r from-[#2A080C] via-[#1E1B4B] to-[#0F172A] opacity-80 pointer-events-none" />

      {/* Centered Mini Profile Avatar + Name Line */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 text-center max-w-full px-1">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#DC2626] to-[#F59E0B] p-0.5 shrink-0 shadow-md">
          <div className="w-full h-full rounded-full bg-[#121216] flex items-center justify-center p-2 text-[#F59E0B]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z" />
            </svg>
          </div>
        </div>
        <span className="text-[11px] font-heading font-semibold text-white/90 leading-tight line-clamp-1 max-w-full px-2 py-0.5 rounded-md bg-black/45 border border-white/10">
          {userName}
        </span>
      </div>

      {/* Looping Full-Card Effect Clipped Inside */}
      <ProfileCardEffect itemId={itemId} previewMode={true} />
    </div>
  );
};
