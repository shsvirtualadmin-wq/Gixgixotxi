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
    sm: 'min-h-[48px] px-4 py-2.5 text-xs font-bold rounded-[14px]',
    md: 'min-h-[48px] px-6 py-3 text-sm font-bold rounded-[14px]',
    lg: 'min-h-[48px] sm:min-h-[52px] px-8 py-3.5 text-base font-bold rounded-[14px]',
  }[size];

  const variantStyles = {
    primary: {
      default:
        'bg-gradient-to-r from-[#1a6dff] via-[#2563eb] to-[#0d9488] hover:from-[#2563eb] hover:to-[#0f766e] text-white shadow-lg shadow-[#1a6dff]/30 hover:shadow-[#1a6dff]/45 border border-white/20',
      captain:
        'bg-gradient-to-r from-[#1a6dff] via-[#2563eb] to-[#0d9488] hover:from-[#2563eb] hover:to-[#0f766e] text-white shadow-lg shadow-[#1a6dff]/30 hover:shadow-[#1a6dff]/45 border border-white/20',
      crew:
        'bg-gradient-to-r from-[#1a6dff] via-[#2563eb] to-[#0d9488] hover:from-[#2563eb] hover:to-[#0f766e] text-white shadow-lg shadow-[#1a6dff]/30 hover:shadow-[#1a6dff]/45 border border-white/20',
    }[accent],
    secondary:
      'bg-white/85 dark:bg-slate-900/85 backdrop-blur-md text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 shadow-md shadow-slate-900/5 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300 rounded-[14px]',
    ghost:
      'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 border border-transparent rounded-[14px]',
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
