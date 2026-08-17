import React, { useState } from 'react';

export interface UserAvatarProps {
  user?: { user_metadata?: Record<string, any>; email?: string | null } | null;
  profile?: { avatar_url?: string; name?: string; email?: string } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackName?: string;
  shape?: 'circle' | 'square';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  profile,
  size = 'md',
  className = '',
  fallbackName,
  shape = 'circle',
}) => {
  const [imageError, setImageError] = useState(false);

  const rawAvatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.picture_url;

  const displayName =
    fallbackName ||
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    profile?.email ||
    'Student';

  const initialLetter = (displayName || 'S').trim().charAt(0).toUpperCase() || 'S';

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-3xl',
  }[size];

  const roundedClass = shape === 'square' ? 'rounded-2xl' : 'rounded-full';

  if (rawAvatarUrl && !imageError) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden ${roundedClass} border border-slate-200  bg-slate-100  ${sizeClasses} ${className}`}
      >
        <img
          src={rawAvatarUrl}
          alt={displayName}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover ${roundedClass}`}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center font-extrabold ${roundedClass} bg-gradient-to-br from-[#1E5AFF] to-[#0A1330] text-white shadow-xs border border-white/20 ${sizeClasses} ${className}`}
    >
      <span>{initialLetter}</span>
    </div>
  );
};
