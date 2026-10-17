import React from 'react';
import { NavLink } from 'react-router-dom';

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
  layout?: 'row' | 'stacked-mobile'; // stacked-mobile shows icon above label on small screens
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
      className={`rounded-full backdrop-blur-md border p-1.5 flex items-center justify-around sm:justify-center gap-1 sm:gap-1.5 shadow-lg select-none ${className}`}
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
              style={({ isActive }) =>
                isActive
                  ? {
                      backgroundColor: 'var(--nav-active-bg)',
                      color: 'var(--nav-active-text)',
                    }
                  : {
                      color: 'var(--text-muted)',
                      backgroundColor: 'transparent',
                    }
              }
              className={({ isActive }) => {
                const baseClasses =
                  'rounded-full transition-all duration-200 cursor-pointer text-xs sm:text-sm md:text-base font-medium flex items-center justify-center text-center outline-none select-none hover:text-[var(--text)]';
                const layoutClasses =
                  layout === 'stacked-mobile'
                    ? 'flex-col sm:flex-row px-2 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 gap-0.5 sm:gap-2 flex-1 sm:flex-initial'
                    : 'flex-row px-3 sm:px-5 py-1.5 sm:py-2.5 gap-2 flex-1 sm:flex-initial';

                const stateClasses = isActive
                  ? `font-semibold shadow-sm ${activeItemClassName}`
                  : `${inactiveItemClassName}`;

                return `${baseClasses} ${layoutClasses} ${stateClasses} ${itemClassName}`;
              }}
            >
              {({ isActive }) => (
                <>
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
            style={
              isSelected
                ? {
                    backgroundColor: 'var(--nav-active-bg)',
                    color: 'var(--nav-active-text)',
                  }
                : {
                    color: 'var(--text-muted)',
                    backgroundColor: 'transparent',
                  }
            }
            className={`rounded-full transition-all duration-200 cursor-pointer text-xs sm:text-sm md:text-base font-medium flex items-center justify-center text-center outline-none select-none hover:text-[var(--text)] ${
              layout === 'stacked-mobile'
                ? 'flex-col sm:flex-row px-2 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 gap-0.5 sm:gap-2 flex-1 sm:flex-initial'
                : 'flex-row px-3 sm:px-5 py-1.5 sm:py-2.5 gap-2 flex-1 sm:flex-initial'
            } ${
              isSelected
                ? `font-semibold shadow-sm ${activeItemClassName}`
                : `${inactiveItemClassName}`
            } ${itemClassName}`}
          >
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
          </button>
        );
      })}
    </div>
  );
}

export default PillNav;
