import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '@/utils/scrollLock';

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  /**
   * 'center': centered dialog on all viewports
   * 'sheet': bottom sheet on mobile (<640px), centered modal on tablet/desktop (>=640px)
   * 'fullscreen': full viewport 100dvh container
   */
  variant?: 'center' | 'sheet' | 'fullscreen';
  maxWidthClass?: string;
  backdropClassName?: string;
  containerClassName?: string;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  zIndex?: number;
}

/**
 * Shared Portal Modal Wrapper
 * - Renders inside `document.body` via React Portal above top header and bottom nav.
 * - Unmounts completely when `isOpen` is false (no invisible backdrop left behind).
 * - Safely locks `document.body` scroll only while open and always cleans up on close/unmount.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  ariaLabel = 'Dialog',
  variant = 'center',
  maxWidthClass = 'max-w-lg',
  backdropClassName = 'overlay-blur bg-black/60 backdrop-blur-md',
  containerClassName = '',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  zIndex = 1200,
}) => {
  useBodyScrollLock(isOpen, 'shared-modal');

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    document.body.setAttribute('data-fullscreen-modal-open', 'true');
    window.dispatchEvent(new Event('boardly:modal-change'));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape' && onClose) {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.removeAttribute('data-fullscreen-modal-open');
      window.dispatchEvent(new Event('boardly:modal-change'));
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen || typeof document === 'undefined' || !document.body) {
    return null;
  }

  if (variant === 'fullscreen') {
    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        data-fullscreen-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100dvh',
          maxHeight: '100dvh',
          zIndex,
        }}
        className={`fixed inset-0 w-screen h-[100dvh] pointer-events-auto ${containerClassName}`}
      >
        {children}
      </div>,
      document.body
    );
  }

  const alignmentClasses =
    variant === 'sheet'
      ? 'items-end sm:items-center justify-center p-0 sm:p-4'
      : 'items-center justify-center p-4';

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      data-fullscreen-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        maxHeight: '100dvh',
        zIndex,
      }}
      className={`fixed inset-0 flex ${alignmentClasses} pointer-events-auto animate-fade-in`}
    >
      {/* Backdrop */}
      <div
        onClick={() => {
          if (closeOnBackdropClick && onClose) {
            onClose();
          }
        }}
        aria-hidden="true"
        className={`fixed inset-0 z-0 cursor-pointer ${backdropClassName}`}
      />

      {/* Dialog Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: variant === 'sheet' ? '92dvh' : 'calc(100dvh - 32px)',
        }}
        className={`relative z-10 w-full ${maxWidthClass} flex flex-col overflow-hidden pointer-events-auto ${containerClassName}`}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default Modal;
