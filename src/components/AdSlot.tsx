import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT_ID } from '@/config/ads';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export interface AdSlotProps {
  slotId: string;
  format?: string;
  className?: string;
  label?: string;
}

/**
 * Reusable Google AdSense slot with CLS-safe reserved height, dark/light Boardly styling,
 * single-push mount guard, and dashed placeholder fallback while slotId is empty.
 */
export function AdSlot({
  slotId,
  format = 'auto',
  className = '',
  label = 'Advertisement',
}: AdSlotProps) {
  const hasPushedRef = useRef(false);
  const trimmedSlotId = (slotId || '').trim();

  useEffect(() => {
    if (!trimmedSlotId || hasPushedRef.current) return;
    hasPushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Silently ignore AdSense push errors (e.g. ad blocker or script not yet ready)
    }
  }, [trimmedSlotId]);

  return (
    <aside
      aria-label={label}
      data-ad-slot-container="true"
      className={`w-full min-w-0 flex flex-col gap-1.5 ${className}`}
    >
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] select-none px-1"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </span>

      {trimmedSlotId ? (
        <div
          className="w-full min-h-[90px] md:min-h-[250px] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] transition-colors"
        >
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={ADSENSE_CLIENT_ID}
            data-ad-slot={trimmedSlotId}
            data-ad-format={format}
            data-full-width-responsive="true"
          />
        </div>
      ) : (
        <div
          role="region"
          aria-label="Ad space placeholder"
          className="w-full min-h-[90px] md:min-h-[250px] rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]/60 flex items-center justify-center px-4 py-3 text-center transition-colors"
        >
          <span
            className="text-xs font-medium tracking-wide text-[var(--text-muted)] select-none"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Ad space
          </span>
        </div>
      )}
    </aside>
  );
}

export default AdSlot;
