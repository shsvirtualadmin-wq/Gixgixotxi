import React from 'react';
import { User } from '../lib/supabase';
import { useSiteSettings } from '../context/SiteSettingsContext';

interface SecurityWatermarkProps {
  currentUser?: User | null;
  customText?: string;
}

export const SecurityWatermark: React.FC<SecurityWatermarkProps> = ({ currentUser, customText }) => {
  const { logoUrl } = useSiteSettings();
  const studentName =
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.name ||
    currentUser?.email?.split('@')[0] ||
    'Boardly Student';

  const studentEmail = currentUser?.email || 'Protected Material';
  const displayLabel = customText || `${studentName} • ${studentEmail} • Boardly Virtual Academy`;

  // Create an array of rows and columns to cover the screen
  const rows = Array.from({ length: 8 });
  const cols = Array.from({ length: 5 });

  const watermarkImageUrl = 'https://i.ibb.co/ymPFp2Wb/Chat-Box-1256234838.jpg';

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 rounded-[28px] opacity-100"
    >
      {/* Layer 1: Boardly Logo Pattern (Opacity ~3-5%) */}
      <div
        className="absolute inset-0 opacity-[0.03]  bg-repeat bg-[length:140px_140px] bg-transparent"
        style={{
          backgroundImage: `url('${watermarkImageUrl}')`,
          backgroundPosition: 'center',
        }}
      />

      {/* Layer 2: Large Subtle Central Emblem Watermark (~4-6% opacity) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 opacity-[0.04]  flex items-center justify-center pointer-events-none bg-transparent">
        <img
          src={watermarkImageUrl}
          alt=""
          className="w-full h-full object-contain select-none bg-transparent border-0 shadow-none outline-none rounded-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = logoUrl || '/watermark-logo.png';
          }}
        />
      </div>

      {/* Layer 2: Student Identity Text Diagonal Stamp (~-28deg rotation, opacity ~7%) */}
      <div className="absolute -inset-20 flex flex-col justify-around rotate-[-28deg] scale-110 opacity-[0.07] ">
        {rows.map((_, rIdx) => (
          <div
            key={rIdx}
            className="flex justify-around items-center whitespace-nowrap text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-900 "
            style={{
              marginLeft: rIdx % 2 === 0 ? '0px' : '80px',
            }}
          >
            {cols.map((_, cIdx) => (
              <div key={cIdx} className="px-6 flex items-center gap-2">
                <span>{displayLabel}</span>
                <span className="text-[#007AFF] font-bold">•</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
