import { useEffect, useRef, useState } from 'react';
import { ADSENSE_CLIENT_ID } from '@/config/ads';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePlan } from '@/hooks/useEffectivePlan';

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

const ADSENSE_SCRIPT_ID = 'boardly-adsense-script';

function ensureAdSenseScriptLoaded() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(ADSENSE_SCRIPT_ID)) return;
  const existing = document.querySelector(
    'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
  );
  if (existing) return;

  const script = document.createElement('script');
  script.id = ADSENSE_SCRIPT_ID;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
  document.head.appendChild(script);
}

/**
 * Reusable Google AdSense slot with CLS-safe reserved height, dark/light Boardly styling,
 * single-push mount guard, and dashed placeholder fallback while slotId is empty.
 * Renders null (no space reserved) and does not load the ad script when the user has an
 * active Pro or Plus plan and the Ad-free experience toggle is ON.
 */
export function AdSlot({
  slotId,
  format = 'auto',
  className = '',
  label = 'Advertisement',
}: AdSlotProps) {
  const { user, profile } = useAuth();
  const { isPaid } = useEffectivePlan();
  const hasPushedRef = useRef(false);
  const trimmedSlotId = (slotId || '').trim();

  // Read cached or profile-synced adFreeEnabled preference (defaults to true for active Pro/Plus)
  const [localAdFreeOverride, setLocalAdFreeOverride] = useState<boolean | null>(() => {
    try {
      if (user?.uid) {
        const cached = localStorage.getItem(`boardly_ad_free_${user.uid}`);
        if (cached === '1') return true;
        if (cached === '0') return false;
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  });

  useEffect(() => {
    if (typeof profile?.adFreeEnabled === 'boolean') {
      setLocalAdFreeOverride(profile.adFreeEnabled);
    }
  }, [profile?.adFreeEnabled]);

  useEffect(() => {
    const onAdFreeChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ adFreeEnabled?: boolean }>).detail;
      if (typeof detail?.adFreeEnabled === 'boolean') {
        setLocalAdFreeOverride(detail.adFreeEnabled);
      }
    };
    window.addEventListener('boardly:ad-free-changed', onAdFreeChanged);
    return () => window.removeEventListener('boardly:ad-free-changed', onAdFreeChanged);
  }, []);

  const adFreeToggleOn =
    typeof profile?.adFreeEnabled === 'boolean'
      ? profile.adFreeEnabled
      : localAdFreeOverride !== null
      ? localAdFreeOverride
      : true;

  // Hide ads when the user has an active Pro or Plus plan and the toggle is ON.
  // If the plan expires (isPaid becomes false), ads automatically come back.
  const shouldHideAds = Boolean(isPaid && adFreeToggleOn);

  useEffect(() => {
    if (shouldHideAds) {
      hasPushedRef.current = false;
      return;
    }
    ensureAdSenseScriptLoaded();
    if (!trimmedSlotId || hasPushedRef.current) return;
    hasPushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Silently ignore AdSense push errors (e.g. ad blocker or script not yet ready)
    }
  }, [trimmedSlotId, shouldHideAds]);

  if (shouldHideAds) {
    return null;
  }

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
