import React, { useEffect, useState } from 'react';
import { KobanIcon } from './KobanIcon';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  rotation: number;
  opacity: number;
}

interface CoinBurstEffectProps {
  active?: boolean;
  onComplete?: () => void;
  count?: number;
}

/**
 * High-performance coin burst animation that flies coins upward toward the balance chip.
 * Automatically cleans up after 1.2s.
 */
export const CoinBurstEffect: React.FC<CoinBurstEffectProps> = ({
  active = true,
  onComplete,
  count = 12,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    // Initialize particles originating from center/lower screen
    const initialParticles: Particle[] = Array.from({ length: count }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 6 + Math.random() * 8;
      return {
        id: i,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 8, // upward bias
        scale: 0.7 + Math.random() * 0.5,
        rotation: Math.random() * 360,
        opacity: 1,
      };
    });

    setParticles(initialParticles);

    const startTime = performance.now();
    const duration = 1200; // ms
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress >= 1) {
        setParticles([]);
        if (onComplete) onComplete();
        return;
      }

      setParticles((prev) =>
        prev.map((p) => {
          // Physics: gravity + air resistance
          const newVx = p.vx * 0.94;
          const newVy = p.vy * 0.94 + 0.45; // gravity
          return {
            ...p,
            x: p.x + newVx * 2.5,
            y: p.y + newVy * 2.5,
            rotation: p.rotation + p.vx * 4,
            opacity: Math.max(0, 1 - Math.pow(progress, 1.8)),
          };
        })
      );

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [active, count, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <div className="relative w-0 h-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute transition-transform will-change-transform"
            style={{
              transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg) scale(${p.scale})`,
              opacity: p.opacity,
            }}
          >
            <KobanIcon size={22} tilt={false} />
          </div>
        ))}
      </div>
    </div>
  );
};
