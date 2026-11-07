import React from 'react';
import {
  CERTIFICATE_THEMES,
  CERTIFICATE_THEME_LIST,
  resolveCertificateTheme,
  type CertificateTheme,
} from '@/config/certificateThemes';
import { Sparkles, Check } from 'lucide-react';

export interface ThemePickerProps {
  selectedThemeId: string; // 'auto' or theme id
  mockId: string;
  mockName: string; // Exact mock name
  onChange: (themeId: string) => void;
  className?: string;
}

export const ThemePicker: React.FC<ThemePickerProps> = ({
  selectedThemeId,
  mockId,
  mockName,
  onChange,
  className = '',
}) => {
  const currentSelection = (selectedThemeId || 'auto').toLowerCase();
  const autoResolvedTheme = resolveCertificateTheme('auto', mockId || 'preview-mock');

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono tracking-wider uppercase font-semibold text-zinc-300 flex items-center gap-1.5">
          <span>Certificate Design</span>
          <span className="text-[10px] text-zinc-500 font-normal">
            (Unique theme for this Grand Line mock)
          </span>
        </label>
        <span className="text-[11px] font-mono text-[#ef4444]">
          {currentSelection === 'auto'
            ? `Auto: ${autoResolvedTheme.label}`
            : CERTIFICATE_THEMES[currentSelection]?.label || 'Custom'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* AUTO OPTION */}
        <button
          type="button"
          onClick={() => onChange('auto')}
          className={`relative p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
            currentSelection === 'auto'
              ? 'border-[#ef4444] bg-[#ef4444]/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-100">
              <Sparkles className="w-3.5 h-3.5 text-[#ef4444]" />
              <span>Auto (Unique)</span>
            </div>
            {currentSelection === 'auto' && (
              <span className="w-4 h-4 rounded-full bg-[#ef4444] flex items-center justify-center text-white text-[10px]">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
          </div>

          {/* Mini Palette preview */}
          <div className="flex items-center gap-1.5 mb-2">
            <span
              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: autoResolvedTheme.backgroundColor }}
            />
            <span
              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: autoResolvedTheme.accentColor }}
            />
            <span
              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: autoResolvedTheme.dotColor }}
            />
          </div>

          <p className="text-[10px] text-zinc-400 font-mono leading-tight">
            Generated from mock ID. Never changes.
          </p>
        </button>

        {/* 6 PRESET THEMES */}
        {CERTIFICATE_THEME_LIST.map((th) => {
          const isSelected = currentSelection === th.id;
          return (
            <button
              key={th.id}
              type="button"
              onClick={() => onChange(th.id)}
              className={`relative p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
                isSelected
                  ? 'border-[#ef4444] bg-[#ef4444]/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-100 truncate pr-1">
                  {th.label}
                </span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-[#ef4444] flex items-center justify-center text-white text-[10px] shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* Swatches */}
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: th.backgroundColor }}
                />
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: th.accentColor }}
                />
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: th.dotColor }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span className="capitalize">{th.mode}</span>
                <span>{th.motifType}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
