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
      className={`rounded-full bg-neutral-900/90 backdrop-blur-md border border-white/10 p-1.5 flex items-center justify-around sm:justify-center gap-1 sm:gap-1.5 shadow-2xl shadow-black/50 select-none ${className}`}
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
                  'rounded-full transition-all duration-200 cursor-pointer text-xs sm:text-sm md:text-base font-medium flex items-center justify-center text-center outline-none select-none';
                const layoutClasses =
                  layout === 'stacked-mobile'
                    ? 'flex-col sm:flex-row px-2 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 gap-0.5 sm:gap-2 flex-1 sm:flex-initial'
                    : 'flex-row px-3 sm:px-5 py-1.5 sm:py-2.5 gap-2 flex-1 sm:flex-initial';

                const stateClasses = isActive
                  ? `bg-white text-black font-semibold shadow-sm ${activeItemClassName}`
                  : `text-neutral-400 hover:text-white bg-transparent ${inactiveItemClassName}`;

                return `${baseClasses} ${layoutClasses} ${stateClasses} ${itemClassName}`;
              }}
            >
              {({ isActive }) => (
                <>
                  {item.icon && (
                    <span
                      className={`shrink-0 transition-colors ${
                        isActive ? 'text-black' : 'text-neutral-400 group-hover:text-white'
                      }`}
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
                      className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-black text-white' : 'bg-white/10 text-neutral-300'
                      }`}
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
            className={`rounded-full transition-all duration-200 cursor-pointer text-xs sm:text-sm md:text-base font-medium flex items-center justify-center text-center outline-none select-none ${
              layout === 'stacked-mobile'
                ? 'flex-col sm:flex-row px-2 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 gap-0.5 sm:gap-2 flex-1 sm:flex-initial'
                : 'flex-row px-3 sm:px-5 py-1.5 sm:py-2.5 gap-2 flex-1 sm:flex-initial'
            } ${
              isSelected
                ? `bg-white text-black font-semibold shadow-sm ${activeItemClassName}`
                : `text-neutral-400 hover:text-white bg-transparent ${inactiveItemClassName}`
            } ${itemClassName}`}
          >
            {item.icon && (
              <span
                className={`shrink-0 transition-colors ${
                  isSelected ? 'text-black' : 'text-neutral-400 hover:text-white'
                }`}
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
                className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-black text-white' : 'bg-white/10 text-neutral-300'
                }`}
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
