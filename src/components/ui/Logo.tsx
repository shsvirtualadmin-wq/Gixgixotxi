import React from 'react';

export interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Size presets and custom options:
   * - 'navbar': 46px on mobile, 58px on desktop (44-52px mobile, 56-64px desktop)
   * - 'footer': 60-66px (56-72px)
   * - 'sidebar': 46px
   * - 'admin': 42-46px
   * - 'onboarding': 50-56px
   * - or numeric height in pixels (e.g. 58)
   * - or custom CSS string (e.g. '60px')
   */
  size?: 'navbar' | 'footer' | 'sidebar' | 'admin' | 'onboarding' | number | string;
  height?: number | string;
  className?: string;
}

/**
 * Shared Boardly Brand Logo component.
 * Displays the single unified logo image (which contains the B mark and 'Boardly' wordmark).
 * Never display separate 'Boardly' text beside this logo.
 * Automatically adapts for dark and light themes via CSS filter in index.css.
 */
export function Logo({
  size = 'navbar',
  height,
  className = '',
  alt = 'Boardly',
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
    // 44-52px on mobile (48px), 56-64px on desktop (60px) per specification
    resolvedClass = `h-[48px] sm:h-[60px] ${className}`.trim();
  } else if (size === 'footer') {
    // 72px on mobile, 88px on desktop per specification
    resolvedClass = `h-[72px] sm:h-[88px] ${className}`.trim();
  } else if (size === 'sidebar') {
    resolvedClass = `h-[48px] ${className}`.trim();
  } else if (size === 'admin') {
    resolvedClass = `h-[44px] sm:h-[48px] ${className}`.trim();
  } else if (size === 'onboarding') {
    resolvedClass = `h-[54px] sm:h-[60px] ${className}`.trim();
  } else if (typeof size === 'string') {
    inlineHeight = size;
  }

  return (
    <img
      src="/logo.png"
      alt={alt}
      className={`boardly-brand-logo object-contain select-none ${resolvedClass}`}
      style={{
        height: inlineHeight,
        width: 'auto',
        maxWidth: '100%',
        aspectRatio: '1768 / 824',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
      loading="eager"
      decoding="async"
      {...rest}
    />
  );
}

export default Logo;
