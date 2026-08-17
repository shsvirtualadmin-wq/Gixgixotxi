import React, { useId } from 'react';
import { motion } from 'motion/react';

export interface SegmentedOption<T extends string | number = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ElementType;
  badge?: React.ReactNode;
  badgeClassName?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string | number = string> {
  options: (SegmentedOption<T> | T)[];
  value: T;
  onChange: (value: T) => void;
  id?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  theme?: 'dark' | 'light' | 'gold' | 'custom';
  className?: string;
  trackClassName?: string;
  segmentClassName?: string;
  activeFillClassName?: string;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
  layoutIdPrefix?: string;
}

export function SegmentedControl<T extends string | number = string>({
  options,
  value,
  onChange,
  id,
  size = 'md',
  fullWidth = false,
  theme = 'dark',
  className = '',
  trackClassName = '',
  segmentClassName = '',
  activeFillClassName = '',
  activeTextClassName = '',
  inactiveTextClassName = '',
  layoutIdPrefix,
}: SegmentedControlProps<T>) {
  const generatedId = useId();
  const controlId = id || generatedId;
  const layoutId = `${layoutIdPrefix || 'segmented-control'}-${controlId}`;

  // Normalize options
  const normalizedOptions: SegmentedOption<T>[] = options.map(opt => {
    if (typeof opt === 'object' && opt !== null && 'value' in opt) {
      return opt as SegmentedOption<T>;
    }
    return {
      value: opt as T,
      label: String(opt),
    };
  });

  // Size styling maps
  const sizeStyles = {
    sm: {
      track: 'h-9 p-1 text-xs',
      segment: 'py-1 px-2.5 text-xs',
      icon: 'w-3.5 h-3.5',
    },
    md: {
      track: 'h-10 sm:h-11 p-1 text-xs sm:text-sm',
      segment: 'py-1.5 px-3 sm:px-4 text-xs sm:text-sm',
      icon: 'w-4 h-4',
    },
    lg: {
      track: 'h-12 p-1.5 text-sm sm:text-base',
      segment: 'py-2 px-4 sm:px-5 text-sm sm:text-base',
      icon: 'w-4 h-4 sm:w-5 sm:h-5',
    },
  }[size];

  // Theme presets
  const themeStyles = {
    dark: {
      track: 'bg-[#131f42] border border-[#1e3a8a]/60 shadow-inner',
      activeFill: 'bg-[#1a6dff] shadow-md shadow-[#1a6dff]/30',
      activeText: 'text-white font-extrabold',
      inactiveText: 'text-[#94a3b8] hover:text-white font-bold hover:bg-white/5',
      defaultBadgeActive: 'bg-white/20 text-white',
      defaultBadgeInactive: 'bg-[#0d1b3e] text-[#94a3b8] border border-[#1e3a8a]/60',
    },
    light: {
      track: 'bg-slate-200/80 border border-slate-300/60 shadow-inner',
      activeFill: 'bg-[#1E5AFF] shadow-md shadow-blue-500/25',
      activeText: 'text-white font-black',
      inactiveText: 'text-slate-600 hover:text-slate-900 font-bold hover:bg-white/40',
      defaultBadgeActive: 'bg-white/20 text-white',
      defaultBadgeInactive: 'bg-slate-300/80 text-slate-700',
    },
    gold: {
      track: 'bg-[#131f42] border border-[#1e3a8a]/60 shadow-inner',
      activeFill: 'bg-gradient-to-r from-[#D4AF37] via-[#DFB845] to-[#D4AF37] shadow-md shadow-[#D4AF37]/25',
      activeText: 'text-[#081028] font-black',
      inactiveText: 'text-[#94a3b8] hover:text-white font-bold hover:bg-white/5',
      defaultBadgeActive: 'bg-[#081028]/20 text-[#081028]',
      defaultBadgeInactive: 'bg-[#0d1b3e] text-[#94a3b8] border border-[#1e3a8a]/60',
    },
    custom: {
      track: '',
      activeFill: '',
      activeText: '',
      inactiveText: '',
      defaultBadgeActive: '',
      defaultBadgeInactive: '',
    },
  }[theme];

  const effectiveTrackClass = trackClassName || themeStyles.track;
  const effectiveActiveFill = activeFillClassName || themeStyles.activeFill;
  const effectiveActiveText = activeTextClassName || themeStyles.activeText;
  const effectiveInactiveText = inactiveTextClassName || themeStyles.inactiveText;

  return (
    <div
      id={controlId}
      className={`relative inline-flex items-center rounded-2xl sm:rounded-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none ${
        sizeStyles.track
      } ${effectiveTrackClass} ${fullWidth ? 'w-full flex' : 'w-auto'} ${className}`}
    >
      {normalizedOptions.map((option) => {
        const isSelected = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={String(option.value)}
            type="button"
            disabled={option.disabled}
            onClick={() => !option.disabled && onChange(option.value)}
            className={`relative ${
              fullWidth ? 'flex-1' : 'shrink-0'
            } h-full rounded-xl sm:rounded-full flex items-center justify-center gap-1.5 sm:gap-2 transition-colors duration-200 cursor-pointer text-center z-10 whitespace-nowrap min-w-max leading-none ${
              sizeStyles.segment
            } ${segmentClassName} ${
              isSelected ? effectiveActiveText : effectiveInactiveText
            } ${option.disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.98]'}`}
          >
            {isSelected && (
              <motion.div
                layoutId={layoutId}
                className={`absolute inset-0 rounded-xl sm:rounded-full -z-10 ${effectiveActiveFill}`}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}

            {Icon && <Icon className={`${sizeStyles.icon} shrink-0`} />}

            <span className="relative z-10">{option.label}</span>

            {option.badge && (
              <span
                className={`relative z-10 text-[10px] sm:text-[11px] font-extrabold px-1.5 py-0.5 rounded-full transition-colors duration-200 whitespace-nowrap shrink-0 inline-flex items-center justify-center leading-none ${
                  option.badgeClassName ||
                  (isSelected
                    ? themeStyles.defaultBadgeActive
                    : themeStyles.defaultBadgeInactive)
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
