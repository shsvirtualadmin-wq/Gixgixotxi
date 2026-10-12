import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MAIN_NAV_ITEMS, NavItemConfig } from '../../config/navigation';

export interface SharedBubbleMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateHome?: () => void;
  onGetStarted?: () => void;
}

export const SharedBubbleMenu: React.FC<SharedBubbleMenuProps> = ({
  isOpen,
  onClose,
  onGetStarted,
}) => {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const cardMenuRef = useRef<HTMLDivElement | null>(null);

  // Group MAIN_NAV_ITEMS by section
  const sections: Array<{ name: string; items: NavItemConfig[] }> = [
    {
      name: 'Main',
      items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Main'),
    },
    {
      name: 'Prep',
      items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Prep'),
    },
    {
      name: 'Events',
      items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Events'),
    },
    {
      name: 'Programs',
      items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Programs'),
    },
    {
      name: 'Company',
      items: MAIN_NAV_ITEMS.filter((i) => i.section === 'Company'),
    },
  ];

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        cardMenuRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Esc key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isCurrentActive = (href: string) => {
    if (typeof window === 'undefined') return false;
    const current = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
    const target = href.toLowerCase().replace(/\/$/, '') || '/';
    return current === target;
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    onClose();

    setTimeout(() => {
      if (href === '/' && user) {
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', '/app');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        return;
      }

      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', href);
        window.dispatchEvent(new PopStateEvent('popstate'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 350);
  };

  const handleDashboardClick = () => {
    onClose();
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', user ? '/app' : '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }, 350);
  };

  const handleActionClick = (action?: () => void) => {
    onClose();
    setTimeout(() => {
      if (action) {
        action();
      } else if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/signup');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }, 350);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="shared-nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0.05 : 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[6px] cursor-pointer"
            aria-hidden="true"
          />

          {/* Floating Bubble Panel */}
          <motion.div
            key="shared-nav-panel"
            id="boardly-shared-bubble-card"
            ref={cardMenuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site Navigation"
            tabIndex={-1}
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : -16 }}
            transition={{
              duration: shouldReduceMotion ? 0.05 : 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="fixed top-16 right-3 left-3 sm:left-auto sm:right-6 sm:w-[380px] z-50 rounded-[28px] bg-white/95 backdrop-blur-[24px] shadow-2xl border border-white/80 p-5 max-h-[calc(100dvh-5rem)] overflow-y-auto focus:outline-none"
          >
            <motion.div
              className="space-y-4"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    delayChildren: shouldReduceMotion ? 0 : 0.25,
                    staggerChildren: shouldReduceMotion ? 0 : 0.045,
                  },
                },
                exit: {
                  transition: {
                    staggerChildren: 0.02,
                    staggerDirection: -1,
                  },
                },
              }}
            >
              {sections.map((section) => (
                <div key={section.name} className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                    {section.name}
                  </span>

                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = isCurrentActive(item.href);

                      return (
                        <motion.div
                          key={item.href}
                          variants={{
                            hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: {
                                duration: shouldReduceMotion ? 0.05 : 0.3,
                                ease: [0.22, 1, 0.36, 1],
                              },
                            },
                            exit: {
                              opacity: 0,
                              transition: { duration: shouldReduceMotion ? 0.05 : 0.15 },
                            },
                          }}
                        >
                          <a
                            href={item.href}
                            onClick={(e) => handleLinkClick(e, item.href)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                              active
                                ? 'text-indigo-600 bg-indigo-50/80 font-extrabold'
                                : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {active && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                              )}
                              <span>{item.label}</span>
                              {item.isAi && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                            </div>
                          </a>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Bottom Panel Actions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: 0.3, duration: 0.3, ease: [0.22, 1, 0.36, 1] },
              }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="mt-5 pt-4 border-t border-slate-200/80 space-y-2"
            >
              {user ? (
                <button
                  type="button"
                  onClick={handleDashboardClick}
                  className="w-full py-3 rounded-2xl text-center font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md text-sm cursor-pointer transition-all"
                >
                  Open Student Dashboard
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleActionClick(onGetStarted)}
                    className="w-full py-3 rounded-2xl text-center font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md text-sm cursor-pointer transition-all"
                  >
                    Start Free Practice
                  </button>
                  <a
                    href="/login"
                    onClick={(e) => handleLinkClick(e, '/login')}
                    className="w-full py-2.5 rounded-2xl text-center font-bold text-slate-700 bg-transparent border border-slate-300 hover:bg-slate-50 active:scale-95 text-sm block cursor-pointer transition-all"
                  >
                    Sign In
                  </a>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
