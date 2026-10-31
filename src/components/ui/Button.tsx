import React, { useState, useEffect, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { BubbleLoader } from './BubbleLoader';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  loading?: boolean;
  progress?: number;
  loadingMessages?: string[];
  successText?: string;
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  progress,
  loadingMessages,
  successText = 'Done!',
  error,
  onRetry,
  onCancel,
  fullWidth = false,
  className = '',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const [bubbling, setBubbling] = useState(false);
  const [showLoader, setShowLoader] = useState(loading);

  useEffect(() => {
    if (loading) {
      setBubbling(true);
      const t = setTimeout(() => {
        setBubbling(false);
        setShowLoader(true);
      }, 280);
      return () => clearTimeout(t);
    } else if (showLoader || bubbling) {
      setBubbling(false);
      const t = setTimeout(() => {
        setShowLoader(false);
      }, 420);
      return () => clearTimeout(t);
    }
  }, [loading, showLoader, bubbling]);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  let bg = 'transparent';
  let color = 'var(--text)';
  let border = '1px solid var(--glass-border)';
  let boxShadow = 'none';

  if (variant === 'primary' || variant === 'danger') {
    bg = 'var(--red)';
    color = '#FFFFFF';
    border = '1px solid rgba(255, 255, 255, 0.22)';
    boxShadow =
      '0 10px 24px -6px rgba(215, 25, 33, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.28)';
  } else if (variant === 'secondary' || variant === 'outline') {
    bg = 'var(--glass-pill-bg)';
    color = 'var(--text)';
    border = '1px solid var(--glass-border)';
    boxShadow = 'inset 0 1px 1px var(--glass-highlight)';
  } else if (variant === 'ghost') {
    bg = 'transparent';
    color = 'var(--muted)';
    border = '1px solid transparent';
  }

  const height = size === 'sm' ? '36px' : '46px';
  const paddingInline = size === 'sm' ? '14px' : size === 'lg' ? '24px' : '20px';
  const fontSize = size === 'sm' ? '13px' : '14px';

  // Morph into the red progress line while loading or showing completion checkmark
  if ((showLoader && !bubbling) || error) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-2xl px-3.5 py-2 border border-[var(--border)] bg-[var(--surface)] ${
          fullWidth ? 'w-full' : 'min-w-[190px]'
        } ${className}`}
        style={{ willChange: 'transform, opacity' }}
      >
        <BubbleLoader
          variant="inline"
          loading={loading}
          progress={progress}
          messages={loadingMessages}
          successText={successText}
          error={error}
          onRetry={onRetry}
          onCancel={onCancel}
        />
      </div>
    );
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-full font-semibold
        transition-transform duration-150 cursor-pointer active:scale-[0.98]
        disabled:opacity-60 disabled:cursor-not-allowed
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{
        fontFamily: 'var(--font-heading)',
        letterSpacing: '-0.02em',
        lineHeight: '1.1',
        height,
        paddingInline,
        backgroundColor: bg,
        color,
        border,
        fontSize,
        boxShadow,
        transformOrigin: 'center center',
        willChange: 'transform, opacity',
        animation:
          bubbling && !prefersReducedMotion
            ? 'boardlyDropletBubble 280ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            : 'none',
        ...style,
      }}
    >
      {children}
      <style>{`
        @keyframes boardlyDropletBubble {
          0% {
            transform: scale(1, 1);
            opacity: 1;
          }
          40% {
            transform: scale(1.14, 0.88);
            opacity: 1;
          }
          75% {
            transform: scale(0.94, 1.12);
            opacity: 0.95;
          }
          100% {
            transform: scale(1.22, 0.18);
            opacity: 0.35;
          }
        }
      `}</style>
    </button>
  );
}
