import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  side?: 'bottom' | 'right' | 'left';
  showCloseButton?: boolean;
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  side = 'bottom',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionClasses = {
    bottom:
      'fixed inset-x-0 bottom-0 max-h-[90vh] rounded-t-[28px] border-t border-x border-white/12 animate-in slide-in-from-bottom duration-300',
    right:
      'fixed inset-y-0 right-0 w-full sm:max-w-md rounded-l-[28px] border-l border-y border-white/12 animate-in slide-in-from-right duration-300',
    left:
      'fixed inset-y-0 left-0 w-full sm:max-w-md rounded-r-[28px] border-r border-y border-white/12 animate-in slide-in-from-left duration-300',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content */}
      <div
        className={`z-50 bg-[#0E1626]/95 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.1)] p-6 sm:p-8 overflow-y-auto flex flex-col ${positionClasses[side]}`}
      >
        {/* Handle for bottom sheet */}
        {side === 'bottom' && (
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4 shrink-0" />
        )}

        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            {title && (
              <h3 className="text-xl font-bold text-[#EAF0FF] font-['Oblata_Display',sans-serif]">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[#A3B0CC] mt-1">{description}</p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/6 hover:bg-white/12 border border-white/10 flex items-center justify-center text-[#A3B0CC] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto text-left">{children}</div>
      </div>
    </div>
  );
};
