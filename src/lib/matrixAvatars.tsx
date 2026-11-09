import React from 'react';
import {
  type MatrixAvatarVariant,
  type MatrixAvatarDef,
  MATRIX_AVATARS,
  MATRIX_VARIANTS,
  getDefaultAvatar,
} from './matrixAvatarsData';

export type { MatrixAvatarVariant, MatrixAvatarDef };

export interface MatrixAvatarProps {
  uid?: string | null;
  avatarKey?: string | null;
  variant?: MatrixAvatarVariant | string | null;
  size?: number | string;
  className?: string;
  seed?: string | null; // user uid seed
}

/**
 * Reusable Dot-Matrix Avatar Component
 * Renders an authentic 12x12 dot matrix using pure SVG circles.
 * When `uid` or `seed` is provided (user avatar), the matrix pattern and color variant
 * are deterministically computed from that stable id ONLY so the same user looks identical everywhere.
 */
export const MatrixAvatar: React.FC<MatrixAvatarProps> = ({
  uid,
  avatarKey,
  variant,
  size = 40,
  className = '',
  seed,
}) => {
  const userSeed = (typeof uid === 'string' && uid.trim()) || (typeof seed === 'string' && seed.trim()) || '';
  const hasUserSeed = Boolean(userSeed);
  const deterministic = getDefaultAvatar(hasUserSeed ? userSeed : avatarKey);

  const resolvedKey = hasUserSeed
    ? deterministic.key
    : avatarKey && MATRIX_AVATARS.some((a) => a.key === avatarKey)
      ? avatarKey
      : deterministic.key;

  const resolvedVariant: MatrixAvatarVariant = hasUserSeed
    ? deterministic.variant
    : variant && MATRIX_VARIANTS[variant as MatrixAvatarVariant]
      ? (variant as MatrixAvatarVariant)
      : deterministic.variant;

  const avatarDef = MATRIX_AVATARS.find((a) => a.key === resolvedKey) || MATRIX_AVATARS[0];
  const palette = MATRIX_VARIANTS[resolvedVariant] || MATRIX_VARIANTS['red-on-black'];

  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 40;
  const shapeClass = className.includes('rounded-') ? '' : hasUserSeed ? 'rounded-full' : 'rounded-xl';

  return (
    <div
      className={`inline-flex items-center justify-center ${shapeClass} overflow-hidden shrink-0 select-none shadow-sm ${className}`}
      style={{
        width: numericSize,
        height: numericSize,
        backgroundColor: palette.bg,
        border: `1.5px solid ${palette.border}`,
      }}
      title={`${avatarDef.label} (${palette.label})`}
      aria-label={`${avatarDef.label} avatar`}
    >
      <svg
        viewBox="0 0 120 120"
        width="82%"
        height="82%"
        className="block"
        xmlns="http://www.w3.org/2000/svg"
      >
        {avatarDef.grid.map((rowStr, y) => {
          return rowStr.split('').map((char, x) => {
            const isActive = char === '#' || char === '1';
            const cx = x * 10 + 5;
            const cy = y * 10 + 5;
            const r = isActive ? 3.8 : 1.2;
            const fill = isActive ? palette.activeDot : palette.inactiveDot;
            return <circle key={`${x}-${y}`} cx={cx} cy={cy} r={r} fill={fill} />;
          });
        })}
      </svg>
    </div>
  );
};

export interface AvatarPickerProps {
  selectedKey: string;
  selectedVariant: MatrixAvatarVariant;
  onSelect: (key: string, variant: MatrixAvatarVariant) => void;
  title?: string;
}

/**
 * Avatar Selector Modal / Palette used in Profile and Create Crew
 */
export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  selectedKey,
  selectedVariant,
  onSelect,
  title = 'Pick Matrix Avatar',
}) => {
  const [filterTheme, setFilterTheme] = React.useState<string>('all');

  const themes = ['all', 'skull', 'robot', 'animal', 'flame', 'bolt', 'star', 'shield', 'crown', 'planet', 'glyph'];

  const filtered = MATRIX_AVATARS.filter((a) => (filterTheme === 'all' ? true : a.theme === filterTheme));

  return (
    <div className="space-y-4">
      {/* Title */}
      {title && (
        <div className="text-xs font-semibold text-[rgba(255,255,255,0.7)] uppercase tracking-wider">
          {title}
        </div>
      )}

      {/* Header and Live Preview */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0A] border border-[rgba(255,255,255,0.12)]">
        <div className="flex items-center gap-3">
          <MatrixAvatar avatarKey={selectedKey} variant={selectedVariant} size={54} />
          <div>
            <div className="text-xs font-semibold text-white">
              {MATRIX_AVATARS.find((a) => a.key === selectedKey)?.label || 'Matrix Avatar'}
            </div>
            <div className="text-[11px] text-[rgba(255,255,255,0.6)]">
              {MATRIX_VARIANTS[selectedVariant]?.label || selectedVariant}
            </div>
          </div>
        </div>

        {/* Color Variant Selector */}
        <div className="flex items-center gap-1.5 bg-[#141414] p-1.5 rounded-lg border border-[rgba(255,255,255,0.1)]">
          {(Object.keys(MATRIX_VARIANTS) as MatrixAvatarVariant[]).map((v) => {
            const pal = MATRIX_VARIANTS[v];
            const isSel = selectedVariant === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => onSelect(selectedKey, v)}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                  isSel ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: pal.bg, border: `1px solid ${pal.border}` }}
                title={pal.label}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.activeDot }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {themes.map((th) => (
          <button
            key={th}
            type="button"
            onClick={() => setFilterTheme(th)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize shrink-0 transition-colors ${
              filterTheme === th
                ? 'bg-white text-black font-semibold'
                : 'bg-[#141414] text-[rgba(255,255,255,0.65)] hover:text-white border border-[rgba(255,255,255,0.1)]'
            }`}
          >
            {th}
          </button>
        ))}
      </div>

      {/* Avatars Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 max-h-56 overflow-y-auto p-1 scrollbar-none">
        {filtered.map((av) => {
          const isSelected = selectedKey === av.key;
          return (
            <button
              key={av.key}
              type="button"
              onClick={() => onSelect(av.key, selectedVariant)}
              className={`p-1.5 rounded-xl flex flex-col items-center gap-1 transition-all ${
                isSelected
                  ? 'bg-[#1F1F1F] ring-2 ring-[#D71921] scale-105'
                  : 'bg-[#0F0F0F] hover:bg-[#191919] border border-[rgba(255,255,255,0.08)]'
              }`}
            >
              <MatrixAvatar avatarKey={av.key} variant={selectedVariant} size={42} />
              <span className="text-[9px] text-[rgba(255,255,255,0.7)] truncate max-w-[48px] text-center">
                {av.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
