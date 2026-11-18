import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, MoreHorizontal, Plus } from 'lucide-react';
import { BoardlyAvatar } from '../ui/BoardlyAvatar';

export interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  alignTitle?: 'center' | 'left';
  children: React.ReactNode;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  open,
  onClose,
  title,
  alignTitle = 'left',
  children,
}) => {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  // Lock background scroll, open at scrollTop = 0, trap focus, return focus on close
  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }

    const focusTimer = window.setTimeout(() => {
      const sheetEl = sheetRef.current;
      if (!sheetEl) return;
      const focusable = sheetEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        sheetEl.focus();
      }
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = Array.from(
          sheetRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      setDragOffsetY(0);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    const content = contentRef.current;
    if (content && content.scrollTop > 0) return;
    dragStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartYRef.current === null) return;
    const delta = e.touches[0].clientY - dragStartYRef.current;
    if (delta > 0) {
      setDragOffsetY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffsetY > 80) {
      onClose();
    }
    dragStartYRef.current = null;
    setDragOffsetY(0);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
    >
      {/* Dimmed Scrim */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Panel */}
      <div
        ref={sheetRef}
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative z-10 flex w-full max-w-[640px] flex-col rounded-t-[24px] outline-none transition-transform duration-150"
        style={{
          backgroundColor: 'var(--card)',
          color: 'var(--text)',
          maxHeight: '90dvh',
          borderTop: '1px solid var(--border)',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
        }}
      >
        {/* 36x4px centered drag handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-2">
          <div
            className="h-[4px] w-[36px] rounded-full"
            style={{ backgroundColor: 'var(--border-strong)' }}
            aria-hidden="true"
          />
        </div>

        {title && (
          <div className={`shrink-0 px-5 pt-1 pb-3 ${alignTitle === 'center' ? 'text-center' : 'text-left'}`}>
            <h3
              className="text-[19px] font-semibold leading-snug"
              style={{ color: 'var(--text)' }}
            >
              {title}
            </h3>
          </div>
        )}

        <div
          ref={contentRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5"
          style={{
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  subtitle?: string;
}

export function SettingsChoiceSheet<T extends string>({
  open,
  onClose,
  title,
  value,
  options,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  value: T;
  options: ChoiceOption<T>[];
  onSelect: (val: T) => void;
}) {
  return (
    <SettingsSheet open={open} onClose={onClose} title={title} alignTitle="left">
      <div className="flex flex-col divide-y divide-[var(--border)]">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="menuitemradio"
              aria-checked={selected}
              onClick={() => {
                onSelect(opt.value);
                onClose();
              }}
              className="flex min-h-[56px] w-full items-center justify-between gap-3 py-3 text-left transition-opacity active:opacity-75 cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <div
                  className="text-[16px] font-medium"
                  style={{ color: selected ? 'var(--accent)' : 'var(--text)' }}
                >
                  {opt.label}
                </div>
                {opt.subtitle && (
                  <div className="mt-0.5 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    {opt.subtitle}
                  </div>
                )}
              </div>
              {selected && (
                <Check
                  className="h-5 w-5 shrink-0"
                  style={{ color: 'var(--accent)' }}
                  strokeWidth={2.25}
                />
              )}
            </button>
          );
        })}
      </div>
    </SettingsSheet>
  );
}

export interface SettingsConfirmSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export const SettingsConfirmSheet: React.FC<SettingsConfirmSheetProps> = ({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading = false,
  onConfirm,
}) => {
  return (
    <SettingsSheet open={open} onClose={onClose} title={title} alignTitle="left">
      <p className="mb-5 text-[15px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          disabled={loading}
          onClick={() => void onConfirm()}
          className="flex min-h-[52px] w-full items-center justify-center rounded-full px-5 text-[16px] font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-60 cursor-pointer"
          style={{
            backgroundColor: tone === 'danger' ? 'var(--danger)' : 'var(--accent)',
          }}
        >
          {loading ? 'Please wait…' : confirmLabel}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="flex min-h-[52px] w-full items-center justify-center rounded-full px-5 text-[16px] font-medium transition-opacity active:opacity-75 cursor-pointer"
          style={{
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        >
          {cancelLabel}
        </button>
      </div>
    </SettingsSheet>
  );
};

export const AboutBoardlySheet: React.FC<{
  open: boolean;
  onClose: () => void;
  version: string;
  onOpenHelp: () => void;
  onOpenTerms: () => void;
}> = ({ open, onClose, version, onOpenHelp, onOpenTerms }) => {
  return (
    <SettingsSheet open={open} onClose={onClose} title="About Boardly" alignTitle="left">
      <div className="flex flex-col divide-y divide-[var(--border)]">
        <div className="flex min-h-[52px] items-center justify-between py-3">
          <span className="text-[16px]" style={{ color: 'var(--text)' }}>
            Version
          </span>
          <span className="text-[15px]" style={{ color: 'var(--text-muted)' }}>
            {version}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenHelp();
          }}
          className="flex min-h-[52px] w-full items-center justify-between py-3 text-left text-[16px] cursor-pointer"
          style={{ color: 'var(--text)' }}
        >
          <span>Help center</span>
          <span className="text-[14px]" style={{ color: 'var(--accent)' }}>
            Open
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenTerms();
          }}
          className="flex min-h-[52px] w-full items-center justify-between py-3 text-left text-[16px] cursor-pointer"
          style={{ color: 'var(--text)' }}
        >
          <span>Terms of Service</span>
          <span className="text-[14px]" style={{ color: 'var(--accent)' }}>
            Open
          </span>
        </button>
      </div>
    </SettingsSheet>
  );
};

export const SwitchAccountSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  planLabel: string;
  onAddAccount: () => void;
  onSignOut: () => void;
}> = ({
  open,
  onClose,
  email,
  displayName,
  avatarUrl,
  planLabel,
  onAddAccount,
  onSignOut,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SettingsSheet open={open} onClose={onClose} title="Switch account" alignTitle="left">
      {/* Email header with three-dot menu */}
      <div className="relative mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-[14px]" style={{ color: 'var(--text-muted)' }}>
          {email || 'Guest account'}
        </span>
        <button
          type="button"
          aria-label="Account options"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--settings-row-hover)] cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-10 z-20 min-w-[180px] overflow-hidden rounded-2xl py-1 shadow-lg"
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onClose();
                onSignOut();
              }}
              className="flex min-h-[44px] w-full items-center px-4 text-left text-[15px] hover:bg-[var(--settings-row-hover)] cursor-pointer"
              style={{ color: 'var(--danger)' }}
            >
              Sign out of this account
            </button>
          </div>
        )}
      </div>

      {/* Current account row highlighted with check mark */}
      <div
        className="flex min-h-[68px] items-center gap-3.5 rounded-[24px] px-4 py-3"
        style={{
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--border)',
        }}
      >
        <BoardlyAvatar
          src={avatarUrl || undefined}
          name={displayName}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-semibold" style={{ color: 'var(--text)' }}>
            {displayName}
          </div>
          <div className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {planLabel}
          </div>
        </div>
        <Check
          className="h-5 w-5 shrink-0"
          style={{ color: 'var(--accent)' }}
          strokeWidth={2.25}
        />
      </div>

      {/* Add account row */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onAddAccount();
        }}
        className="mt-3 flex min-h-[56px] w-full items-center gap-3.5 rounded-full px-4 transition-colors hover:bg-[var(--settings-row-hover)] active:bg-[var(--settings-row-active)] cursor-pointer"
        style={{
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
        >
          <Plus className="h-5 w-5" />
        </span>
        <span className="text-[16px] font-medium">Add account</span>
      </button>
    </SettingsSheet>
  );
};
