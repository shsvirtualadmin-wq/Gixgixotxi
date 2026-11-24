import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface BoardlySelectOption {
  value: string;
  label: string;
  dotColorClass?: string;
}

export interface BoardlySelectGroup {
  id: string;
  label?: string;
  subtitle?: string;
  options: BoardlySelectOption[];
}

export interface BoardlySelectProps {
  id?: string;
  label?: string;
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  groups: BoardlySelectGroup[];
  placeholder?: string;
  disabled?: boolean;
  /** Optional override when the user's current value is not in selectable options */
  fallbackDisplayLabel?: string;
  className?: string;
}

const MENU_MAX_HEIGHT = 272;
const VIEWPORT_MARGIN = 12;

export const BoardlySelect: React.FC<BoardlySelectProps> = ({
  id,
  ariaLabel,
  value,
  onChange,
  groups,
  placeholder = 'Select...',
  disabled = false,
  fallbackDisplayLabel,
  className = '',
}) => {
  const autoId = useId();
  const triggerId = id || `boardly-select-${autoId}`;
  const listboxId = `${triggerId}-listbox`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [flippedUp, setFlippedUp] = useState(false);

  const flatOptions = useMemo(
    () => groups.flatMap((g) => g.options),
    [groups]
  );

  const selectedOption = useMemo(
    () => flatOptions.find((opt) => opt.value === value) || null,
    [flatOptions, value]
  );

  const updateMenuPosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;

    const spaceBelow = viewportH - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const estimatedMenuHeight = Math.min(MENU_MAX_HEIGHT, Math.max(120, flatOptions.length * 42 + groups.length * 28));

    const shouldFlipUp = spaceBelow < Math.min(220, estimatedMenuHeight) && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      140,
      Math.min(MENU_MAX_HEIGHT, shouldFlipUp ? spaceAbove - 6 : spaceBelow - 6)
    );

    const width = Math.min(rect.width, viewportW - VIEWPORT_MARGIN * 2);
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.left, viewportW - width - VIEWPORT_MARGIN)
    );

    setFlippedUp(shouldFlipUp);
    setMenuStyle(
      shouldFlipUp
        ? {
            position: 'fixed',
            left,
            bottom: viewportH - rect.top + 6,
            width,
            maxHeight: availableHeight,
            zIndex: 10060,
          }
        : {
            position: 'fixed',
            left,
            top: rect.bottom + 6,
            width,
            maxHeight: availableHeight,
            zIndex: 10060,
          }
    );
  }, [flatOptions.length, groups.length]);

  const openMenu = useCallback(() => {
    if (disabled || flatOptions.length === 0) return;
    const currentIdx = flatOptions.findIndex((o) => o.value === value);
    setActiveIndex(currentIdx >= 0 ? currentIdx : 0);
    updateMenuPosition();
    setOpen(true);
  }, [disabled, flatOptions, value, updateMenuPosition]);

  const closeMenu = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }, []);

  const selectOption = useCallback(
    (opt: BoardlySelectOption) => {
      onChange(opt.value);
      closeMenu(true);
    },
    [onChange, closeMenu]
  );

  // Close on outside tap/click, scroll outside menu, or resize
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu(false);
    };

    const handleScroll = (e: Event) => {
      const target = e.target as Node | null;
      if (target && menuRef.current?.contains(target)) {
        // Allow scrolling inside the dropdown itself
        return;
      }
      closeMenu(false);
    };

    const handleResize = () => {
      updateMenuPosition();
    };

    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, true);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, closeMenu, updateMenuPosition]);

  // Scroll highlighted option into view when navigating via keyboard
  useEffect(() => {
    if (!open || !menuRef.current) return;
    const activeEl = menuRef.current.querySelector<HTMLElement>(
      `[data-option-index="${activeIndex}"]`
    );
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % flatOptions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + flatOptions.length) % flatOptions.length);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(flatOptions.length - 1);
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const chosen = flatOptions[activeIndex];
        if (chosen) selectOption(chosen);
        break;
      }
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        closeMenu(true);
        break;
      case 'Tab':
        closeMenu(false);
        break;
      default:
        break;
    }
  };

  let runningIndex = -1;
  const triggerLabel = selectedOption?.label || fallbackDisplayLabel || value || placeholder;

  const menuPortal =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel || 'Options'}
            style={menuStyle}
            onKeyDown={handleKeyDown}
            className={`rounded-[20px] bg-[#16161B] text-[#F5F5F7] border border-white/12 shadow-[0_18px_48px_rgba(0,0,0,0.55)] overflow-y-auto overscroll-contain p-1.5 backdrop-blur-xl ${
              flippedUp ? 'origin-bottom' : 'origin-top'
            }`}
          >
            {groups.map((group, gIdx) => (
              <div key={group.id} className={gIdx > 0 ? 'mt-1.5 pt-1.5 border-t border-white/8' : ''}>
                {group.label && (
                  <div className="px-2.5 pt-1 pb-1.5 flex items-center justify-between gap-2 select-none">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-zinc-400">
                      {group.label}
                    </span>
                    {group.subtitle && (
                      <span className="text-[10px] font-medium text-zinc-500">
                        {group.subtitle}
                      </span>
                    )}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.options.map((opt) => {
                    runningIndex += 1;
                    const optIdx = runningIndex;
                    const isSelected = opt.value === value;
                    const isHighlighted = optIdx === activeIndex;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        data-option-index={optIdx}
                        onMouseEnter={() => setActiveIndex(optIdx)}
                        onClick={() => selectOption(opt)}
                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-[13px] text-[14px] font-medium text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#D71921] text-white font-semibold'
                            : isHighlighted
                            ? 'bg-white/10 text-white'
                            : 'text-zinc-200 hover:bg-white/8'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          {opt.dotColorClass && (
                            <span
                              aria-hidden="true"
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                isSelected ? 'ring-2 ring-white/60 ' : ''
                              }${opt.dotColorClass}`}
                            />
                          )}
                          <span className="truncate">{opt.label}</span>
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 shrink-0 text-white" strokeWidth={2.5} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={handleKeyDown}
        className={`w-full min-h-[46px] px-4 rounded-full bg-[var(--bg)] border text-[15px] text-[var(--text)] flex items-center justify-between gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ${
          open
            ? 'border-[#D71921] ring-2 ring-[#D71921]/20'
            : 'border-[var(--border)] hover:border-[var(--text-muted)]/50 focus:border-[var(--accent)]'
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {selectedOption?.dotColorClass && (
            <span
              aria-hidden="true"
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedOption.dotColorClass}`}
            />
          )}
          <span className="truncate">{triggerLabel}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-[var(--text-muted)] transition-transform duration-150 ${
            open ? 'rotate-180 text-[#D71921]' : ''
          }`}
        />
      </button>
      {menuPortal}
    </div>
  );
};
