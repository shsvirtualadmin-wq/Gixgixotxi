import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { verifyStoreAdminRoleServerSide } from '@/services/storePricingService';
import { COSMETICS_CATALOG, type CosmeticItem } from '@/data/cosmeticsCatalog';
import { BannerRenderer } from '@/components/koban/artwork/bannerArtwork';
import { AvatarPicture, AvatarFrame, Nameplate, ProfileEffectCardPreview } from '@/components/koban/CosmeticRenderers';
import { storeFxScheduler } from '@/components/koban/fx/storeFxEngine';
import { ArrowLeft, Sparkles, Shield, Layers, Activity, Eye } from 'lucide-react';

const NEW_25_ITEM_SPECS: Record<
  string,
  {
    layersOrMode: string;
    motionSummary: string;
  }
> = {
  // 5 Banners
  ban_crimson_dragons_descent: {
    layersOrMode: '5 WebP Layers (1200×675) + Canvas 2D FX',
    motionSummary: 'Sinusoidal 5-layer parallax + rising additive embers + volcanic ash + storm lightning flashes',
  },
  ban_neon_kyoto_rain: {
    layersOrMode: '5 WebP Layers (1200×675) + Canvas 2D FX',
    motionSummary: 'Sinusoidal 5-layer parallax + diagonal neon rain streaks + cyan/magenta mist + sign flicker',
  },
  ban_blood_moon_ronin: {
    layersOrMode: '5 WebP Layers (1200×675) + Canvas 2D FX',
    motionSummary: 'Sinusoidal 5-layer parallax + 3D-tumbling crimson petals + drifting crimson mist + moon pulse',
  },
  ban_celestial_koi_river: {
    layersOrMode: '5 WebP Layers (1200×675) + Canvas 2D FX',
    motionSummary: 'Sinusoidal 5-layer parallax + golden astral river wisps + twinkling stardust + diagonal meteors',
  },
  ban_obsidian_shogun_citadel: {
    layersOrMode: '5 WebP Layers (1200×675) + Canvas 2D FX',
    motionSummary: 'Sinusoidal 5-layer parallax + rising forge sparks + volcanic ash smoke + citadel torch flicker',
  },

  // 5 Avatars
  pfp_zenryu_awakened: {
    layersOrMode: '4 WebP Layers (512×512) + Spine Mesh + Canvas FX',
    motionSummary: 'Breathing scale (1.00–1.02) + pulsing gold eyes + dragon whisker/mane sway + mouth fire breath',
  },
  pfp_oni_warlord: {
    layersOrMode: '4 WebP Layers (512×512) + Spine Mesh + Canvas FX',
    motionSummary: 'Breathing scale (1.00–1.02) + blazing demon eyes + war-mane tassel sway + tusk smoke & embers',
  },
  pfp_kitsune_moonlight: {
    layersOrMode: '4 WebP Layers (512×512) + 9-Tail Mesh Warp + Canvas FX',
    motionSummary: 'Breathing scale (1.00–1.02) + cyan fox eyes + 5 harmonic sine-warped swaying tails + spirit wisps',
  },
  pfp_cyber_samurai_visor: {
    layersOrMode: '4 WebP Layers (512×512) + Cable Mesh + Canvas FX',
    motionSummary: 'Breathing scale (1.00–1.02) + holographic visor pulse + swaying neural cables + ventilator steam',
  },
  pfp_tengu_storm_priest: {
    layersOrMode: '4 WebP Layers (512×512) + Feather Mesh + Canvas FX',
    motionSummary: 'Breathing scale (1.00–1.02) + storm-gold eyes + 4 swaying crow-wing plumes + branching lightning',
  },

  // 5 Frames
  'frame-dragon-scale-halo': {
    layersOrMode: 'Resolution-Independent SVG Ring + Canvas 2D FX',
    motionSummary: 'CW outer dragon-scale ring + CCW inner rune ring + stroke-dashoffset flow + orbiting embers',
  },
  'frame-thunder-mandala': {
    layersOrMode: 'Resolution-Independent SVG Ring + Canvas 2D FX',
    motionSummary: 'CW outer Raijin drum ring + CCW inner bolt ring + regenerating midpoint-displacement ring arcs',
  },
  'frame-sakura-blade-ring': {
    layersOrMode: 'Resolution-Independent SVG Ring + Canvas 2D FX',
    motionSummary: 'CW outer katana crescent ring + CCW inner petal ring + 3D-tumbling sakura petals & steel sparks',
  },
  'frame-void-obsidian-ring': {
    layersOrMode: 'Resolution-Independent SVG Ring + Canvas 2D FX',
    motionSummary: 'CW outer obsidian shard ring + CCW inner dimensional rune ring + orbiting void wisps & rift arcs',
  },
  'frame-royal-gold-laurel-crown': {
    layersOrMode: 'Resolution-Independent SVG Ring + Canvas 2D FX',
    motionSummary: 'CW outer golden sunburst ring + CCW inner filigree ring + stroke-dashoffset + golden stardust',
  },

  // 5 Nameplates
  'plate-dragon-lord': {
    layersOrMode: 'Pure CSS + SVG (feTurbulence + feDisplacementMap)',
    motionSummary: 'Continuous shimmer sweep + drifting displaced ember smoke + ornate SVG path flow + 2-line wrap',
  },
  'plate-shinobi-shadow': {
    layersOrMode: 'Pure CSS + SVG (feTurbulence + feDisplacementMap)',
    motionSummary: 'Continuous shimmer sweep + drifting displaced shadow mist + shuriken SVG path flow + 2-line wrap',
  },
  'plate-neon-ronin': {
    layersOrMode: 'Pure CSS + SVG (feTurbulence + feDisplacementMap)',
    motionSummary: 'Continuous cyber shimmer + drifting displaced plasma haze + scanline pulse + 2-line wrap',
  },
  'plate-imperial-jade': {
    layersOrMode: 'Pure CSS + SVG (feTurbulence + feDisplacementMap)',
    motionSummary: 'Continuous gold-jade shimmer + drifting displaced nephrite mist + ornate seal border + 2-line wrap',
  },
  'plate-blood-moon-scroll': {
    layersOrMode: 'Pure CSS + SVG (feTurbulence + feDisplacementMap)',
    motionSummary: 'Continuous crimson shimmer + drifting displaced blood-moon mist + scroll border flow + 2-line wrap',
  },

  // 5 Profile Effects
  'effect-dragon-fire-aura': {
    layersOrMode: 'Canvas 2D Only (StoreFxCanvas Typed-Array Pool)',
    motionSummary: 'Rising turbulent additive flames (white -> orange -> crimson -> smoke) + fast rising sparks',
  },
  'effect-thunder-kami-storm': {
    layersOrMode: 'Canvas 2D Only (StoreFxCanvas + LightningPool2D)',
    motionSummary: 'Recursive midpoint-displacement branching lightning bolts + radial flash decay + ionized sparks',
  },
  'effect-spirit-fox-fire': {
    layersOrMode: 'Canvas 2D Only (StoreFxCanvas + 2D Noise Orbs)',
    motionSummary: 'Blue-violet kitsune orbs following smooth 2D gradient noise paths with 9-step soft ribbon trails',
  },
  'effect-cherry-blossom-gale': {
    layersOrMode: 'Canvas 2D Only (StoreFxCanvas 3D Petal Pool)',
    motionSummary: '3D-tumbling sakura petals in a swirling sinusoidal wind field with depth-sorted size & softness',
  },
  'effect-falling-stars': {
    layersOrMode: 'Canvas 2D Only (StoreFxCanvas Streak Pool)',
    motionSummary: 'Golden diagonal meteors with tapered fading tails, rare bright streaks & twinkling stardust wake',
  },
};

export const StoreItemsDevPreviewPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(Boolean(import.meta.env.DEV));
  const [checkingRole, setCheckingRole] = useState<boolean>(!import.meta.env.DEV);
  const [fps, setFps] = useState<number>(60);
  const [activeTasks, setActiveTasks] = useState<number>(0);
  const [visibleTasks, setVisibleTasks] = useState<number>(0);
  const [simulateLongName, setSimulateLongName] = useState<boolean>(false);
  const [pauseAnimations, setPauseAnimations] = useState<boolean>(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      setIsAuthorized(true);
      setCheckingRole(false);
      return;
    }
    if (authLoading) return;
    if (!user) {
      setIsAuthorized(false);
      setCheckingRole(false);
      return;
    }
    let cancelled = false;
    verifyStoreAdminRoleServerSide(user.uid)
      .then((role) => {
        if (!cancelled) {
          setIsAuthorized(role === 'admin' || role === 'superadmin');
          setCheckingRole(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsAuthorized(false);
          setCheckingRole(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Live FPS + scheduler task telemetry
  useEffect(() => {
    let frames = 0;
    let lastMeasure = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      frames++;
      if (now - lastMeasure >= 500) {
        setFps(Math.min(60, Math.round((frames * 1000) / (now - lastMeasure))));
        setActiveTasks(storeFxScheduler.getActiveTaskCount());
        setVisibleTasks(storeFxScheduler.getVisibleTaskCount());
        frames = 0;
        lastMeasure = now;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const newItems = COSMETICS_CATALOG.filter((item) => item.isNew);
  const banners = newItems.filter((i) => i.type === 'banner');
  const avatars = newItems.filter((i) => i.type === 'avatar');
  const frames = newItems.filter((i) => i.type === 'frame');
  const nameplates = newItems.filter((i) => i.type === 'nameplate');
  const effects = newItems.filter((i) => i.type === 'effect');

  if (checkingRole) {
    return (
      <div className="min-h-screen bg-[#09090D] text-white flex items-center justify-center p-6">
        <div className="text-sm text-zinc-400 font-mono">Verifying admin access for /dev/store-items...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#09090D] text-white flex flex-col items-center justify-center p-6 gap-4">
        <Shield className="w-10 h-10 text-red-500" />
        <h1 className="text-xl font-heading font-bold">Admin Access Required</h1>
        <p className="text-sm text-zinc-400 max-w-md text-center">
          This Store FX diagnostic preview page (/dev/store-items) is restricted to administrators.
        </p>
        <Link
          to="/store"
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
        >
          Return to Boardly Store
        </Link>
      </div>
    );
  }

  const samplePlayerName = simulateLongName
    ? 'Grandmaster Commander Miyamoto Musashi of Kyoto'
    : 'Zenryu Captain';

  const renderSpecFooter = (item: CosmeticItem) => {
    const spec = NEW_25_ITEM_SPECS[item.id];
    return (
      <div className="p-3.5 border-t border-white/10 bg-[#0C0C12] flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading font-bold text-sm text-white">{item.name}</span>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {item.rarity} · {item.price.toLocaleString()} K
          </span>
        </div>
        <div className="text-[11px] font-mono text-cyan-300/90 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span>{spec?.layersOrMode}</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">{spec?.motionSummary}</p>
        <div className="text-[10px] font-mono text-zinc-500 pt-0.5">id: {item.id}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-white pb-20">
      {/* Sticky Diagnostic Header */}
      <header className="sticky top-0 z-40 bg-[#0B0B12]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/store"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Store
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-heading font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>25 New Store Items — Live FX Engine Self-Review (/dev/store-items)</span>
              </h1>
              <p className="text-xs text-zinc-400">
                Single page-wide rAF loop · IntersectionObserver auto-pause · Typed-array particles · Zero flipbooks
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              <Activity className="w-3.5 h-3.5" />
              <span>{fps} FPS</span>
              <span className="text-zinc-500">|</span>
              <span>
                {visibleTasks}/{activeTasks} visible tasks
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSimulateLongName((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                simulateLongName
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                  : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {simulateLongName ? '2-Line Long Name: ON' : 'Test 2-Line Name Wrap'}
            </button>

            <button
              type="button"
              onClick={() => setPauseAnimations((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                pauseAnimations
                  ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                  : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {pauseAnimations ? 'Static Frame (Reduced Motion)' : 'Live Motion Active'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-12">
        {/* 1. BANNERS (5 Items) */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
            <h2 className="text-lg font-heading font-bold text-amber-300">
              1. Banners (5 Items — 16:9 · 5 Transparent WebP Layers + Parallax + Canvas FX)
            </h2>
            <span className="text-xs font-mono text-zinc-400">1200×675 · overflow: hidden; contain: paint</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/15 bg-[#101018] overflow-hidden shadow-lg flex flex-col"
              >
                <div
                  className="relative w-full aspect-[16/9] overflow-hidden"
                  style={{ overflow: 'hidden', contain: 'paint' }}
                >
                  <BannerRenderer itemId={item.id} canAnimate={!pauseAnimations} />
                </div>
                {renderSpecFooter(item)}
              </div>
            ))}
          </div>
        </section>

        {/* 2. AVATARS (5 Items) */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
            <h2 className="text-lg font-heading font-bold text-amber-300">
              2. Avatars (5 Items — 512×512 · 4 Transparent WebP Layers + Mesh Sway + Breath FX)
            </h2>
            <span className="text-xs font-mono text-zinc-400">Breathing 1.00–1.02 · Pulsing Eyes · Sine Spine Warp</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {avatars.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/15 bg-[#101018] overflow-hidden shadow-lg flex flex-col justify-between"
              >
                <div className="p-5 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#161622] to-[#0B0B12]">
                  {/* Square 160x160 & Circular 88x88 Previews */}
                  <div
                    className="w-36 h-36 rounded-2xl overflow-hidden border border-white/15 shadow-md"
                    style={{ overflow: 'hidden', contain: 'paint' }}
                  >
                    <AvatarPicture
                      avatarId={item.id}
                      size={144}
                      rounded="rounded-2xl"
                      canAnimate={!pauseAnimations}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <AvatarPicture
                      avatarId={item.id}
                      size={56}
                      rounded="rounded-full"
                      canAnimate={!pauseAnimations}
                    />
                    <span className="text-[11px] font-mono text-zinc-400">Circle Crop</span>
                  </div>
                </div>
                {renderSpecFooter(item)}
              </div>
            ))}
          </div>
        </section>

        {/* 3. FRAMES (5 Items) */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
            <h2 className="text-lg font-heading font-bold text-amber-300">
              3. Avatar Frames (5 Items — Counter-Rotating SVG Rings + Canvas Sparks & Arcs)
            </h2>
            <span className="text-xs font-mono text-zinc-400">Avatar visible through center · Clipped to tile</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {frames.map((item, idx) => {
              const pairedAvatar = avatars[idx % avatars.length]?.id || 'pfp_zenryu_awakened';
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/15 bg-[#101018] overflow-hidden shadow-lg flex flex-col justify-between"
                >
                  <div
                    className="p-6 flex items-center justify-center bg-gradient-to-b from-[#161622] to-[#0B0B12] overflow-hidden"
                    style={{ overflow: 'hidden', contain: 'paint' }}
                  >
                    <AvatarFrame frameId={item.id} size={116} canAnimate={!pauseAnimations}>
                      <AvatarPicture
                        avatarId={pairedAvatar}
                        size={116}
                        rounded="rounded-full"
                        canAnimate={!pauseAnimations}
                      />
                    </AvatarFrame>
                  </div>
                  {renderSpecFooter(item)}
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. NAMEPLATES (5 Items) */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
            <h2 className="text-lg font-heading font-bold text-amber-300">
              4. Nameplates (5 Items — CSS/SVG Shimmer + feTurbulence Smoke + Ornate SVG Paths)
            </h2>
            <span className="text-xs font-mono text-zinc-400">Full player name wraps up to 2 lines · Never truncated</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {nameplates.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/15 bg-[#101018] overflow-hidden shadow-lg flex flex-col justify-between"
              >
                <div
                  className="p-6 min-h-[120px] flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#161622] to-[#0B0B12]"
                  style={{ overflow: 'hidden', contain: 'paint' }}
                >
                  <Nameplate
                    nameplateId={item.id}
                    name={samplePlayerName}
                    shortId="9042"
                    roleBadge="CAPTAIN"
                    allowWrap="two-lines"
                    canAnimate={!pauseAnimations}
                  />
                </div>
                {renderSpecFooter(item)}
              </div>
            ))}
          </div>
        </section>

        {/* 5. PROFILE EFFECTS (5 Items) */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
            <h2 className="text-lg font-heading font-bold text-amber-300">
              5. Profile Effects (5 Items — Pure Canvas 2D FX Engine Clipped to Profile Card)
            </h2>
            <span className="text-xs font-mono text-zinc-400">Max 150 particles/card · Typed Arrays · Additive Glow</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {effects.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/15 bg-[#101018] overflow-hidden shadow-lg flex flex-col justify-between"
              >
                <div className="p-3 bg-[#0B0B12]">
                  <div className="h-48 w-full">
                    <ProfileEffectCardPreview itemId={item.id} userName={samplePlayerName} />
                  </div>
                </div>
                {renderSpecFooter(item)}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default StoreItemsDevPreviewPage;
