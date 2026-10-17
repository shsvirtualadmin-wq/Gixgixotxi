import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

export interface PillNavItem {
  id?: string | number;
  label: string;
  icon?: React.ReactNode;
  to?: string;
  end?: boolean;
  onClick?: () => void;
  badge?: string | number;
}

interface PillNavProps {
  items: PillNavItem[];
  activeId?: string | number;
  onChange?: (id: string | number) => void;
  className?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  inactiveItemClassName?: string;
  layout?: 'row' | 'stacked-mobile';
  compactActiveLabelOnly?: boolean;
}

export function PillNav({
  items,
  activeId,
  onChange,
  className = '',
  itemClassName = '',
  activeItemClassName = '',
  inactiveItemClassName = '',
  layout = 'row',
  compactActiveLabelOnly = false,
}: PillNavProps) {
  return (
    <div
      role="tablist"
      style={{
        backgroundColor: 'var(--nav-bg)',
        borderColor: 'var(--border)',
      }}
      className={`rounded-full backdrop-blur-md border p-1.5 flex items-center justify-around sm:justify-center gap-1 sm:gap-1.5 shadow-lg select-none relative ${className}`}
    >
      {items.map((item, index) => {
        const id = item.id ?? item.to ?? index;

        // Routing link mode
        if (item.to) {
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => {
                const baseClasses =
                  'relative rounded-full cursor-pointer text-xs sm:text-sm md:text-base font-medium flex items-center justify-center text-center outline-none select-none transition-colors duration-200';
                const layoutClasses =
                  layout === 'stacked-mobile'
                    ? 'flex-col sm:flex-row px-2 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 gap-0.5 sm:gap-2 flex-1 sm:flex-initial'
                    : 'flex-row px-3 sm:px-5 py-1.5 sm:py-2.5 gap-2 flex-1 sm:flex-initial';

                const stateClasses = isActive
                  ? `font-semibold ${activeItemClassName}`
                  : `hover:text-[var(--text)] ${inactiveItemClassName}`;

                return `${baseClasses} ${layoutClasses} ${stateClasses} ${itemClassName}`;
              }}
              style={({ isActive }) => ({
                color: isActive ? 'var(--nav-active-text)' : 'var(--text-muted)',
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="pillNavActiveIndicator"
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: 'var(--nav-active-bg)' }}
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 38,
                        mass: 0.8,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                    {item.icon && (
                      <span
                        className="shrink-0 transition-colors"
                        style={{ color: isActive ? 'var(--nav-active-text)' : 'inherit' }}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span
                      className={`leading-tight truncate ${
                        compactActiveLabelOnly && !isActive ? 'hidden sm:inline' : 'inline'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge !== undefined && (
                      <span
                        className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: isActive ? 'var(--nav-bg)' : 'var(--surface-2)',
                          color: isActive ? 'var(--text)' : 'var(--text-muted)',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </span>
                </>
              )}
            </NavLink>
          );
        }

        // Interactive button / tab mode
        const isSelected = activeId !== undefined ? activeId === id : false;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => {
              if (item.onClick) item.onClick();
              if (onChange) onChange(id);
            }}
            className={`relative rounded-full cursor-pointer text-xs sm:text-sm md:text-base font-medium flex items-center justify-center text-center outline-none select-none transition-colors duration-200 ${
              layout === 'stacked-mobile'
                ? 'flex-col sm:flex-row px-2 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 gap-0.5 sm:gap-2 flex-1 sm:flex-initial'
                : 'flex-row px-3 sm:px-5 py-1.5 sm:py-2.5 gap-2 flex-1 sm:flex-initial'
            } ${
              isSelected
                ? `font-semibold ${activeItemClassName}`
                : `hover:text-[var(--text)] ${inactiveItemClassName}`
            } ${itemClassName}`}
            style={{
              color: isSelected ? 'var(--nav-active-text)' : 'var(--text-muted)',
            }}
          >
            {isSelected && (
              <motion.div
                layoutId="pillNavActiveIndicator"
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: 'var(--nav-active-bg)' }}
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 38,
                  mass: 0.8,
                }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
              {item.icon && (
                <span
                  className="shrink-0 transition-colors"
                  style={{ color: isSelected ? 'var(--nav-active-text)' : 'inherit' }}
                >
                  {item.icon}
                </span>
              )}
              <span
                className={`leading-tight truncate ${
                  compactActiveLabelOnly && !isSelected ? 'hidden sm:inline' : 'inline'
                }`}
              >
                {item.label}
              </span>
              {item.badge !== undefined && (
                <span
                  className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isSelected ? 'var(--nav-bg)' : 'var(--surface-2)',
                    color: isSelected ? 'var(--text)' : 'var(--text-muted)',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default PillNav;
