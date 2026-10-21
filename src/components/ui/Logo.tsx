import React from 'react';

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  /**
   * Numeric height in pixels (e.g. 30 or 32), or string ('32px'),
   * or preset name ('navbar' | 'footer' | 'sidebar' | 'admin' | 'onboarding')
   */
  size?: number | string | 'navbar' | 'footer' | 'sidebar' | 'admin' | 'onboarding';
  height?: number | string;
  className?: string;
  alt?: string;
}

// Exactly 116 circular dots on the grid reproducing the original boxed 'B' and 'oardly' wordmark
const LOGO_DOTS: [number, number][] = [
  // B - Stem columns and bowls
  [315, 361], [315, 389], [315, 417], [315, 445], [315, 472], [315, 500], [315, 527], [315, 555],
  [344, 361], [344, 389], [344, 417], [344, 445], [344, 472], [344, 500], [344, 527], [344, 555],
  [372, 361], [372, 389], [372, 445], [372, 555],
  [400, 361], [400, 389], [400, 445], [400, 472], [400, 555],
  [428, 361], [428, 389], [428, 445], [428, 472], [428, 555],
  [455, 418], [455, 473], [456, 389], [456, 500], [456, 528],
  // o
  [596, 507], [597, 448], [597, 478],
  [621, 418], [621, 536],
  [649, 418], [649, 536],
  [677, 418], [677, 536],
  [705, 418], [705, 536],
  [732, 449], [732, 478], [732, 507],
  // a
  [785, 507],
  [813, 476], [813, 536], [814, 417],
  [841, 476], [841, 536], [843, 417],
  [869, 476], [869, 535], [872, 417],
  [898, 476], [898, 535], [900, 417],
  [926, 446], [926, 476], [926, 506], [926, 535],
  // r
  [996, 418], [996, 449], [996, 480], [996, 510], [996, 538],
  [1026, 417],
  [1056, 417],
  [1086, 417],
  [1110, 444],
  // d
  [1155, 507], [1156, 446], [1156, 477],
  [1189, 536], [1190, 418],
  [1217, 536], [1218, 418],
  [1244, 418], [1244, 536],
  [1271, 536],
  [1298, 348], [1298, 380], [1298, 413], [1298, 445], [1298, 478], [1298, 509], [1298, 536],
  // l
  [1361, 348], [1361, 380], [1361, 412], [1361, 443], [1361, 474], [1361, 505], [1361, 535],
  [1392, 535],
  // y
  [1432, 419], [1432, 448], [1432, 477], [1432, 506],
  [1454, 538], [1463, 606],
  [1485, 538], [1493, 605],
  [1515, 538], [1523, 605],
  [1559, 419], [1559, 448], [1559, 477], [1559, 507], [1559, 538], [1559, 569],
];

/**
 * Reusable Boardly Brand Logo component.
 * Renders as high-precision inline SVG consisting of the boxed 'B' and dot-matrix 'oardly'.
 * Uses currentColor with theme token inheritance so it adapts instantly between
 * Light (black), Dark (white), and custom surfaces with zero flash.
 */
export const Logo = React.memo(function Logo({
  size = 'navbar',
  height,
  className = '',
  style,
  ...rest
}: LogoProps) {
  let resolvedClass = className;
  let inlineHeight: string | undefined = undefined;

  if (height !== undefined) {
    inlineHeight = typeof height === 'number' ? `${height}px` : height;
  } else if (typeof size === 'number') {
    inlineHeight = `${size}px`;
  } else if (size === 'navbar') {
    resolvedClass = `h-[40px] sm:h-[46px] md:h-[48px] ${className}`.trim();
  } else if (size === 'footer') {
    resolvedClass = `h-[44px] sm:h-[52px] ${className}`.trim();
  } else if (size === 'sidebar') {
    resolvedClass = `h-[32px] ${className}`.trim();
  } else if (size === 'admin') {
    resolvedClass = `h-[32px] ${className}`.trim();
  } else if (size === 'onboarding') {
    resolvedClass = `h-[36px] sm:h-[40px] ${className}`.trim();
  } else if (typeof size === 'string') {
    inlineHeight = isNaN(Number(size)) ? size : `${size}px`;
  }

  return (
    <svg
      role="img"
      aria-label="Boardly"
      viewBox="0 0 1768 824"
      fill="currentColor"
      className={`boardly-brand-logo select-none shrink-0 transition-colors ${resolvedClass}`}
      style={{
        height: inlineHeight,
        width: 'auto',
        maxWidth: '100%',
        aspectRatio: '1768 / 824',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
      {...rest}
    >
      {/* Box outline around B */}
      <rect
        x={228}
        y={286}
        width={319}
        height={322}
        rx={76}
        ry={76}
        fill="none"
        stroke="currentColor"
        strokeWidth={9.5}
      />
      {/* 116 dots */}
      {LOGO_DOTS.map(([cx, cy], idx) => (
        <circle key={idx} cx={cx} cy={cy} r={13} fill="currentColor" />
      ))}
    </svg>
  );
});

export default Logo;
