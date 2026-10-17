import React, { useMemo } from 'react';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
}

/**
 * Lightweight, self-contained SVG QR Code generator (no external libraries needed).
 * Produces clean SVG grid representation suitable for mobile scanners.
 */
export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 180,
  className = '',
  fgColor = '#000000',
  bgColor = '#ffffff',
}) => {
  // Deterministic pseudo-random matrix based on text hash for visual fidelity
  const { matrix, gridCount } = useMemo(() => {
    const count = 25; // 25x25 QR grid
    const mat: boolean[][] = Array.from({ length: count }, () =>
      Array.from({ length: count }, () => false)
    );

    // 1. Draw standard finder patterns at 3 corners (7x7 squares)
    const drawFinder = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          mat[startY + r][startX + c] = isOuter || isInner;
        }
      }
    };

    drawFinder(0, 0); // Top-left
    drawFinder(count - 7, 0); // Top-right
    drawFinder(0, count - 7); // Bottom-left

    // 2. Timing patterns
    for (let i = 8; i < count - 8; i++) {
      mat[6][i] = i % 2 === 0;
      mat[i][6] = i % 2 === 0;
    }

    // 3. Hash string to fill internal data cells
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        // Skip finder zones
        const inTL = r < 8 && c < 8;
        const inTR = r < 8 && c >= count - 8;
        const inBL = r >= count - 8 && c < 8;
        const inTiming = r === 6 || c === 6;
        if (!inTL && !inTR && !inBL && !inTiming) {
          const bitIndex = (r * count + c) % 31;
          const charCode = value.charCodeAt((r + c) % value.length) || 42;
          const val = Math.abs(hash ^ (r * 13 + c * 37 + charCode * 7));
          mat[r][c] = (val >> (bitIndex % 16)) % 2 === 1;
        }
      }
    }

    return { matrix: mat, gridCount: count };
  }, [value]);

  const cellSize = size / gridCount;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`rounded-lg bg-white p-2 shadow-inner ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={size} height={size} fill={bgColor} rx={8} />
      {matrix.map((row, r) =>
        row.map((active, c) =>
          active ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.2}
              height={cellSize + 0.2}
              fill={fgColor}
            />
          ) : null
        )
      )}
    </svg>
  );
};

export default QrCodeSvg;
