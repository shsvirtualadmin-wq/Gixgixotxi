import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Users, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { MatrixAvatar } from '@/lib/matrixAvatars';
import {
  MATRIX_AVATARS,
  MATRIX_VARIANTS,
  type MatrixAvatarVariant,
} from '@/lib/matrixAvatarsData';
import type { CrewTier, CrewJoinMode } from '@/types/crew';
import { createNewCrew } from '@/services/crewService';
import { useBodyScrollLock } from '@/utils/scrollLock';

interface CreateCrewModalProps {
  onClose: () => void;
  onSuccess: (crewId: string) => void;
  creator: {
    uid: string;
    email: string;
    displayName: string;
    streak?: number;
  };
}

const LOGO_THEMES = [
  'all',
  'skull',
  'robot',
  'animal',
  'flame',
  'bolt',
  'star',
  'shield',
  'crown',
  'planet',
  'science',
  'glyph',
] as const;

export const CreateCrewModal: React.FC<CreateCrewModalProps> = ({
  onClose,
  onSuccess,
  creator,
}) => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarKey, setAvatarKey] = useState('skull-01');
  const [avatarVariant, setAvatarVariant] = useState<MatrixAvatarVariant>('red-on-black');
  const [joinMode, setJoinMode] = useState<CrewJoinMode>('direct');
  const [minStreak, setMinStreak] = useState<number>(0);
  const [tier, setTier] = useState<CrewTier>('free');

  const [logoSheetOpen, setLogoSheetOpen] = useState(false);
  const [logoFilterTheme, setLogoFilterTheme] = useState<string>('all');
  const sheetTouchStartYRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBodyScrollLock(true, 'create-crew-modal');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (logoSheetOpen) {
          e.stopPropagation();
          setLogoSheetOpen(false);
        } else if (!loading) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, logoSheetOpen, onClose]);

  const selectedAvatarDef = useMemo(
    () => MATRIX_AVATARS.find((a) => a.key === avatarKey) || MATRIX_AVATARS[0],
    [avatarKey]
  );

  const selectedVariantDef = useMemo(
    () => MATRIX_VARIANTS[avatarVariant] || MATRIX_VARIANTS['red-on-black'],
    [avatarVariant]
  );

  const filteredLogos = useMemo(
    () =>
      MATRIX_AVATARS.filter((a) =>
        logoFilterTheme === 'all' ? true : a.theme === logoFilterTheme
      ),
    [logoFilterTheme]
  );

  const activeCategoryLabel = useMemo(() => {
    if (logoFilterTheme === 'all') {
      const theme = selectedAvatarDef?.theme || 'skull';
      return theme.charAt(0).toUpperCase() + theme.slice(1);
    }
    return logoFilterTheme.charAt(0).toUpperCase() + logoFilterTheme.slice(1);
  }, [logoFilterTheme, selectedAvatarDef]);

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    sheetTouchStartYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleSheetTouchEnd = (e: React.TouchEvent) => {
    if (sheetTouchStartYRef.current === null) return;
    const endY = e.changedTouches[0]?.clientY ?? sheetTouchStartYRef.current;
    if (endY - sheetTouchStartYRef.current > 75) {
      setLogoSheetOpen(false);
    }
    sheetTouchStartYRef.current = null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a squad name.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await createNewCrew({
        name: name.trim(),
        bio: bio.trim(),
        avatarKey,
        avatarVariant,
        joinMode,
        minStreak: Number(minStreak) || 0,
        tier,
        creator,
      });
      onSuccess(created.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create crew.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create Study Squad"
      className="fixed inset-0 bg-[var(--bg)] text-[var(--text)] flex flex-col overflow-hidden"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 1200,
      }}
    >
      {/* Question Bank Ambient Blobs */}
      <div className="aqb-ambient-blobs" aria-hidden="true">
        <div className="aqb-blob aqb-blob--top" />
        <div className="aqb-blob aqb-blob--bottom" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex flex-col flex-1 min-h-0 w-full overflow-hidden"
      >
        {/* Single Unified Scrollable Page Area */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 pb-8"
          style={{
            paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
          }}
        >
          <div className="aqb-container !max-w-2xl !gap-4 sm:!gap-[18px]">
            {/* 1. Header Card */}
            <header className="aqb-glass-card !rounded-[28px] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between sm:justify-start gap-2.5 flex-wrap min-w-0">
                    <h2 className="aqb-page-title">Create Study Squad</h2>
                    <span className="aqb-admin-chip">NEW SQUAD</span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] text-[var(--text-secondary)] leading-snug">
                    Assemble your team, track collective streaks, and compete on the Pakistan leaderboard.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  aria-label="Close"
                  className="aqb-icon-btn !w-11 !h-11 !min-w-[44px] !min-h-[44px]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {error && (
              <div
                role="alert"
                className="aqb-glass-card p-3.5 flex items-center gap-2.5 border border-[var(--accent)] text-[var(--accent)] text-xs font-semibold"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* 2. Details Card (Crew Name & Bio) */}
            <section className="aqb-glass-card p-4 sm:p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Crew Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  placeholder="e.g. FAST Titans, NET Vanguard, GIKI Orbit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="aqb-input"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Bio (Max 160 characters)
                  </label>
                  <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] tabular-nums">
                    {bio.length}/160
                  </span>
                </div>
                <textarea
                  maxLength={160}
                  rows={2}
                  placeholder="Brief squad description, universities, or study motto..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="aqb-input resize-none min-h-[76px]"
                />
              </div>
            </section>

            {/* 3. Squad Logo Card ("Working in" Pattern) */}
            <section className="aqb-glass-card aqb-glass-card--selected p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  SQUAD LOGO
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="aqb-pill aqb-pill--tag font-bold">
                    {selectedVariantDef.label}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLogoSheetOpen(true)}
                className="w-full text-left flex items-center justify-between gap-3 py-1.5 rounded-2xl transition active:scale-[0.99] min-w-0 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MatrixAvatar
                    avatarKey={avatarKey}
                    variant={avatarVariant}
                    size={46}
                    className="rounded-2xl shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-base font-extrabold text-[var(--text)] truncate">
                      {selectedAvatarDef.label}
                    </div>
                    <div className="text-xs font-mono text-[var(--text-muted)] truncate">
                      {selectedVariantDef.label}
                    </div>
                  </div>
                </div>

                <span className="aqb-btn aqb-btn--glass !min-h-[40px] !px-3 !py-1.5 text-xs shrink-0">
                  Change
                  <ChevronDown className="w-3.5 h-3.5" />
                </span>
              </button>
            </section>

            {/* 5. Rules Card (Join Mode & Minimum Streak Required) */}
            <section className="aqb-glass-card p-4 sm:p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Join Mode
                </label>
                <select
                  value={joinMode}
                  onChange={(e) => setJoinMode(e.target.value as CrewJoinMode)}
                  className="aqb-input"
                >
                  <option value="direct">Direct Join (Instant entry)</option>
                  <option value="request">Request Approval (Admin review)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Minimum Streak Required
                </label>
                <select
                  value={minStreak}
                  onChange={(e) => setMinStreak(Number(e.target.value))}
                  className="aqb-input"
                >
                  <option value={0}>0 days (Anyone can join)</option>
                  <option value={3}>3-day study streak</option>
                  <option value={7}>7-day study streak</option>
                  <option value={14}>14-day study streak</option>
                  <option value={30}>30-day master streak</option>
                </select>
              </div>
            </section>

            {/* 6. Squad Size & Billing Tier */}
            <section className="flex flex-col gap-2.5">
              <div className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Squad Size &amp; Billing Tier
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Free Crew Card */}
                <button
                  type="button"
                  onClick={() => setTier('free')}
                  className={`aqb-glass-card p-4 text-left flex flex-col justify-between gap-3 cursor-pointer ${
                    tier === 'free' ? 'aqb-glass-card--selected' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-extrabold text-[var(--text)]">
                        Free Crew
                      </span>
                      <span className="aqb-pill aqb-pill--coming-soon tabular-nums font-mono font-bold">
                        PKR 0
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1.5">
                      Up to 5 squad members (including leader). Ideal for close study partners.
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-[var(--border)] text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Free forever, no card required</span>
                  </div>
                </button>

                {/* Large Crew Card */}
                <button
                  type="button"
                  onClick={() => setTier('paid')}
                  className={`aqb-glass-card p-4 text-left flex flex-col justify-between gap-3 cursor-pointer ${
                    tier === 'paid' ? 'aqb-glass-card--selected' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-extrabold text-[var(--text)] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
                        <span>Large Crew</span>
                      </span>
                      <span className="aqb-admin-chip tabular-nums font-mono">
                        PKR 499 / MO
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-1.5">
                      More than 5 members (up to 30) +{' '}
                      <strong className="text-[var(--text)]">Pro sharing</strong> for all squad members!
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-[var(--border)] text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                    <span>Includes shared Pro for all members</span>
                  </div>
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* 7. Pinned Safe-Area Footer */}
        <div
          className="shrink-0 border-t border-[var(--border)] bg-[var(--glass-surface-strong)] backdrop-blur-xl px-4 sm:px-6 pt-3"
          style={{
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="max-w-2xl mx-auto w-full flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="aqb-btn aqb-btn--glass shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="aqb-btn aqb-btn--primary flex-1"
            >
              {loading ? (
                'Creating Crew...'
              ) : (
                <>
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Create Squad</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* 4. Logo Picker Sheet ("Select University" Pattern) */}
      {logoSheetOpen && (
        <div
          className="aqb-sheet-backdrop"
          style={{ zIndex: 1250 }}
          onClick={() => setLogoSheetOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Select Logo"
        >
          <div
            className="aqb-sheet"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleSheetTouchStart}
            onTouchEnd={handleSheetTouchEnd}
          >
            <div className="aqb-sheet-handle-bar">
              <div className="aqb-sheet-handle-pill" />
            </div>

            <div className="aqb-sheet-header">
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-[var(--text)] truncate">
                  Select Logo
                </h2>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {MATRIX_AVATARS.length} logos · {activeCategoryLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLogoSheetOpen(false)}
                aria-label="Close logo picker"
                className="aqb-icon-btn !w-10 !h-10 !min-w-[40px] !min-h-[40px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aqb-sheet-body flex flex-col gap-4">
              {/* Color Variants Row at Top of Sheet */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Color Variant
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(MATRIX_VARIANTS) as MatrixAvatarVariant[]).map((variantKey) => {
                    const pal = MATRIX_VARIANTS[variantKey];
                    const isSelectedVariant = avatarVariant === variantKey;
                    return (
                      <button
                        key={variantKey}
                        type="button"
                        onClick={() => setAvatarVariant(variantKey)}
                        className={`aqb-btn !min-h-[42px] !px-3 text-xs justify-start ${
                          isSelectedVariant ? 'aqb-btn--primary' : 'aqb-btn--glass'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: pal.bg,
                            border: `1px solid ${pal.border}`,
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: pal.activeDot }}
                          />
                        </span>
                        <span className="truncate">{pal.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horizontally Scrollable Category Chips Row */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Category
                </div>
                <div className="aqb-hscroll-fade">
                  {LOGO_THEMES.map((th) => (
                    <button
                      key={th}
                      type="button"
                      onClick={() => setLogoFilterTheme(th)}
                      className={`aqb-btn !min-h-[40px] !px-3.5 text-xs capitalize shrink-0 ${
                        logoFilterTheme === th ? 'aqb-btn--primary' : 'aqb-btn--glass'
                      }`}
                    >
                      {th}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredLogos.map((av) => {
                  const isSelected = avatarKey === av.key;
                  return (
                    <button
                      key={av.key}
                      type="button"
                      onClick={() => {
                        setAvatarKey(av.key);
                        setLogoSheetOpen(false);
                      }}
                      className={`aqb-glass-card p-3 text-left flex items-center gap-3 cursor-pointer ${
                        isSelected ? 'aqb-glass-card--selected' : ''
                      }`}
                    >
                      <MatrixAvatar
                        avatarKey={av.key}
                        variant={avatarVariant}
                        size={44}
                        className="rounded-2xl shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-extrabold text-[var(--text)] truncate">
                          {av.label}
                        </div>
                        <div className="text-[11px] font-mono uppercase text-[var(--text-muted)] truncate">
                          {av.theme}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
