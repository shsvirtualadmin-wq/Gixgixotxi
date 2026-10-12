import React, { useState } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  accent?: 'default' | 'captain' | 'crew';
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  accent = 'default',
  children,
  icon,
  iconPosition = 'right',
  fullWidth = false,
  className = '',
  onClick,
  ...props
}) => {
  const [bubbles, setBubbles] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newBubble = { x, y, id: Date.now() };

    setBubbles((prev) => [...prev.slice(-3), newBubble]);
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
    }, 600);
  };

  const sizeClasses = {
    sm: 'min-h-[44px] px-4 py-2 text-xs font-bold rounded-full',
    md: 'min-h-[46px] px-6 py-2.5 text-sm font-bold rounded-full',
    lg: 'min-h-[50px] px-8 py-3.5 text-base font-extrabold rounded-full',
  }[size];

  const variantStyles = {
    primary: {
      default:
        'bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 border border-indigo-400/30',
      captain:
        'bg-gradient-to-r from-amber-500 via-amber-600 to-teal-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 border border-amber-300/30',
      crew:
        'bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-600 text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 border border-violet-400/30',
    }[accent],
    secondary:
      'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 shadow-md shadow-slate-900/5 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300',
    ghost:
      'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 border border-transparent',
  }[variant];

  return (
    <button
      onPointerDown={handlePointerDown}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center gap-2 cursor-pointer transition-transform duration-150 active:scale-[0.97] overflow-hidden select-none touch-manipulation font-sans ${sizeClasses} ${variantStyles} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {/* Touch Bubble / Ripple layer */}
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="absolute rounded-full bg-white/30 pointer-events-none animate-[ping_0.5s_cubic-bezier(0,0,0.2,1)_forwards]"
          style={{
            left: b.x - 20,
            top: b.y - 20,
            width: 40,
            height: 40,
          }}
        />
      ))}

      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span className="relative z-10">{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
