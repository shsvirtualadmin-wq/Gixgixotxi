import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  layoutId?: string;
  activeLabelOnly?: boolean;
}

export function PillNav({
  items,
  activeId,
  onChange,
  className = '',
  layoutId = 'pillNavActiveIndicator',
  activeLabelOnly = true,
}: PillNavProps) {
  const location = useLocation();

  return (
    <nav
      role="tablist"
      style={{
        backgroundColor: 'var(--nav-bg)',
        borderColor: 'var(--border)',
      }}
      className={`rounded-full backdrop-blur-md border p-1 flex items-center justify-between w-full shadow-2xl select-none relative overflow-hidden h-[54px] ${className}`}
    >
      {items.map((item, index) => {
        const id = item.id ?? item.to ?? index;

        // Routing Link item
        if (item.to) {
          const isRouteActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              aria-label={item.label}
              className="relative rounded-full cursor-pointer h-full flex items-center justify-center text-center outline-none select-none transition-colors duration-150 flex-1 min-w-0 px-1"
            >
              {({ isActive }) => {
                const active = isActive || isRouteActive;
                return (
                  <>
                    {active && (
                      <motion.div
                        layoutId={layoutId}
                        className="absolute inset-0 rounded-full z-0"
                        style={{ backgroundColor: '#D71921' }}
                        transition={{
                          type: 'spring',
                          stiffness: 450,
                          damping: 35,
                          mass: 0.6,
                        }}
                      />
                    )}
                    <span
                      className={`relative z-10 flex items-center justify-center gap-1.5 transition-colors max-w-full ${
                        active
                          ? 'text-white font-semibold text-xs px-2'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {item.icon && (
                        <span className={`shrink-0 flex items-center justify-center ${active ? 'text-white' : ''}`}>
                          {item.icon}
                        </span>
                      )}
                      {(!activeLabelOnly || active) && (
                        <span className="truncate whitespace-nowrap leading-none text-[11px] sm:text-xs">
                          {item.label}
                        </span>
                      )}
                      {activeLabelOnly && !active && (
                        <span className="sr-only">{item.label}</span>
                      )}
                    </span>
                  </>
                );
              }}
            </NavLink>
          );
        }

        // Action Button item (e.g. Menu)
        const isSelected = activeId !== undefined ? activeId === id : false;
        return (
          <button
            key={String(id)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            title={item.label}
            aria-label={item.label}
            onClick={() => {
              if (item.onClick) item.onClick();
              if (onChange) onChange(id);
            }}
            className="relative rounded-full cursor-pointer h-full flex items-center justify-center text-center outline-none select-none transition-colors duration-150 flex-1 min-w-0 px-1"
          >
            {isSelected && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-full z-0"
                style={{ backgroundColor: '#D71921' }}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 35,
                  mass: 0.6,
                }}
              />
            )}
            <span
              className={`relative z-10 flex items-center justify-center gap-1.5 transition-colors max-w-full ${
                isSelected
                  ? 'text-white font-semibold text-xs px-2'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {item.icon && (
                <span className={`shrink-0 flex items-center justify-center ${isSelected ? 'text-white' : ''}`}>
                  {item.icon}
                </span>
              )}
              {(!activeLabelOnly || isSelected) && (
                <span className="truncate whitespace-nowrap leading-none text-[11px] sm:text-xs">
                  {item.label}
                </span>
              )}
              {activeLabelOnly && !isSelected && (
                <span className="sr-only">{item.label}</span>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default PillNav;
