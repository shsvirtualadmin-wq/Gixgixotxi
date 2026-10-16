import type { ReactNode, CSSProperties, HTMLAttributes } from 'react';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  id?: string;
  className?: string;
  style?: CSSProperties;
  containerClassName?: string;
}

/**
 * Shared Section component for Nothing OS style:
 * - Padding-block 64px on mobile, 96px on desktop
 * - Scroll-margin-top nav height + 24px (88px)
 * - Centered boardly-container (width 100%, max-w 1200px, padding-inline 20px / 24px / 32px)
 */
export function Section({
  children,
  id,
  className = '',
  style,
  containerClassName = '',
  ...props
}: SectionProps) {
  return (
    <section
      id={id}
      className={`landing-section relative ${className}`}
      style={style}
      {...props}
    >
      <div className={`boardly-container ${containerClassName}`}>
        {children}
      </div>
    </section>
  );
}
