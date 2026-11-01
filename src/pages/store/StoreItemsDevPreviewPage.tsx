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

  // 5 Profile Effects (Wave 1)
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 25 NEW 3D-RENDERED LOOP STORE ITEMS + OBSIDIAN ECLIPSE (Items 126–151)
  // ═══════════════════════════════════════════════════════════════════════════

  'obsidian-eclipse': {
    layersOrMode: 'Real-Time 3D Three.js/WebGL + 180f Video Loop (banner.webm/mp4)',
    motionSummary: '3D black eclipse sun + gold corona & diamond-ring flare + bevelled obsidian ring with gold veins + 18 orbiting slabs + 1,200 DoF embers',
  },

  // 5 Banners (Wave 2)
  ban_phoenix_ember_sunrise: {
    layersOrMode: 'Three.js 3D Loop (loop.webm/webp 30fps, 90f) + Canvas FX',
    motionSummary: '3D articulated golden phoenix flapping over a burning volcanic horizon + helical rising embers',
  },
  ban_cyber_shibuya_night: {
    layersOrMode: 'Three.js 3D Loop (loop.webm/webp 30fps, 90f) + Canvas FX',
    motionSummary: '3D Shibuya crossing towers with holographic kanji billboards, wet road reflections, rain & light trails',
  },
  ban_eclipse_tengu_peak: {
    layersOrMode: 'Three.js 3D Loop (loop.webm/webp 30fps, 90f) + Canvas FX',
    motionSummary: '3D winged tengu silhouette atop a mountain peak under a pulsing solar eclipse ring & wind-blown clouds',
  },
  ban_spirit_lantern_festival: {
    layersOrMode: 'Three.js 3D Loop (loop.webm/webp 30fps, 90f) + Canvas FX',
    motionSummary: '45+ 3D glowing paper lanterns floating & swaying upward through a twilight river valley',
  },
  ban_crimson_lotus_lake: {
    layersOrMode: 'Three.js 3D Painted Static Poster (1200×675 poster.webp)',
    motionSummary: 'Static high-res 3D blood-red lotus lake at dusk with sculpted crimson lotuses and a 5-tier pagoda',
  },

  // 5 Avatars (Wave 2)
  pfp_phoenix_ascendant: {
    layersOrMode: 'Three.js 3D Loop (loop.webm/webp 30fps, 90f) + Canvas FX',
    motionSummary: '3D flame phoenix bust with undulating burning feather crest, pulsing solar eyes & rising sparks',
  },
  pfp_ryujin_sea_dragon: {
    layersOrMode: 'Three.js 3D Loop (loop.webm/webp 30fps, 90f) + Canvas FX',
    motionSummary: '3D teal sea dragon with iridescent PBR scales, swaying whiskers, cyan eyes & water ripples',
  },
  pfp_shadow_ninja_mask: {
    layersOrMode: 'Three.js 3D Loop (loop.webm/webp 30fps, 90f) + Canvas FX',
    motionSummary: '3D faceted obsidian shinobi mask with glowing crimson eyes and drifting shadow smoke',
  },
  pfp_raijin_thunder_god: {
    layersOrMode: 'Three.js 3D Loop (loop.webm/webp 30fps, 90f) + Lightning FX',
    motionSummary: '3D thunder god bust surrounded by a rotating 8-drum taiko ring and branching lightning arcs',
  },
  pfp_yokai_lantern_ghost: {
    layersOrMode: 'Three.js 3D Loop (loop.webm/webp 30fps, 90f) + Canvas FX',
    motionSummary: '3D paper-lantern yokai bobbing in 3D space with a flickering inner soul flame & spirit wisps',
  },

  // 5 Avatar Frames (Wave 2)
  'frame-phoenix-feather-halo': {
    layersOrMode: 'Three.js 3D Alpha Loop (loop.webm/webp 60fps, 90f) + SVG/FX',
    motionSummary: '3D ring of 16 burning phoenix feathers orbiting clear center + counter-rotating runes & sparks',
  },
  'frame-frost-crystal-ring': {
    layersOrMode: 'Three.js 3D Alpha Loop (loop.webm/webp 60fps, 90f) + SVG/FX',
    motionSummary: '3D ring of 12 rotating faceted ice crystals with cold specular light sweep & frost motes',
  },
  'frame-cyber-circuit-ring': {
    layersOrMode: 'Three.js 3D Alpha Loop (loop.webm/webp 60fps, 90f) + SVG/FX',
    motionSummary: '3D neon PCB circuit-board torus with high-speed cyan/magenta data pulses racing around the ring',
  },
  'frame-spirit-flame-wreath': {
    layersOrMode: 'Three.js 3D Alpha Loop (loop.webm/webp 60fps, 90f) + SVG/FX',
    motionSummary: '3D circular wreath of 14 blue spirit flames orbiting smoothly around the clear avatar center',
  },
  'frame-shuriken-orbit': {
    layersOrMode: 'Three.js 3D Alpha Loop (loop.webm/webp 60fps, 90f) + SVG/FX',
    motionSummary: 'Four 3D brushed-steel shuriken spinning on their axes while orbiting with cyan motion trails',
  },

  // 5 Nameplates (Wave 2)
  'plate-phoenix-crest': {
    layersOrMode: 'Three.js 3D Loop (600×120 60fps) + SVG Smoke & Shimmer',
    motionSummary: '3D gold-and-flame beveled plate with flaring wing crests, ember shimmer & 2-line live HTML text',
  },
  'plate-raijin-storm-plate': {
    layersOrMode: 'Three.js 3D Loop (600×120 60fps) + SVG Lightning Border',
    motionSummary: '3D dark storm-iron plate with Raijin crests, high-voltage border lightning & 2-line live HTML text',
  },
  'plate-cyber-glitch': {
    layersOrMode: 'Three.js 3D Loop (600×120 60fps) + RGB Glitch Shimmer',
    motionSummary: '3D holographic plate with RGB-split chromatic pulses, scanline sweep & 2-line live HTML text',
  },
  'plate-frozen-sakura-glass': {
    layersOrMode: 'Three.js 3D Loop (600×120 60fps) + Frosted Petal Sweep',
    motionSummary: '3D frosted ice-glass plate with suspended sakura petals, cold light sweep & 2-line live HTML text',
  },
  'plate-ronin-katana-slash': {
    layersOrMode: 'Three.js 3D Static Poster (600×120 poster.webp) + SVG',
    motionSummary: 'Static matte-black armor plate bisected by a diagonal katana slash & crimson edge + 2-line HTML text',
  },

  // 5 Profile Effects (Wave 2)
  'effect-phoenix-rebirth-flames': {
    layersOrMode: 'Three.js 3D Alpha Loop (600×800 60fps) + Canvas FX',
    motionSummary: '3D flame phoenix silhouette rising with swirling ribbons of fire & burning feathers clipped to card',
  },
  'effect-frost-spirit-blizzard': {
    layersOrMode: 'Three.js 3D Alpha Loop (600×800 60fps) + Canvas FX',
    motionSummary: '3D blizzard vortex of swirling snow and rotating faceted ice shards with cold cyan glow',
  },
  'effect-cyber-glitch-matrix': {
    layersOrMode: 'Three.js 3D Alpha Loop (600×800 60fps) + Canvas FX',
    motionSummary: '3D falling neon code columns in perspective depth with periodic horizontal holographic glitch bars',
  },
  'effect-lantern-spirit-drift': {
    layersOrMode: 'Three.js 3D Alpha Loop (600×800 60fps) + Canvas FX',
    motionSummary: '3D glowing paper lanterns floating & swaying upward through the profile card with warm halos',
  },
  'effect-shuriken-storm': {
    layersOrMode: 'Three.js 3D Alpha Loop (600×800 60fps) + Canvas FX',
    motionSummary: '3D spinning steel shuriken streaking diagonally across the card with luminous slash trails',
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
  const [showAllWaves, setShowAllWaves] = useState<boolean>(false);
  const [bannerUiTheme, setBannerUiTheme] = useState<'none' | 'dark' | 'light'>('none');

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

  const newItems = COSMETICS_CATALOG.filter((item) =>
    showAllWaves
      ? item.isNew
      : item.createdAt === '2026-10-31T20:00:00.000Z' || item.id === 'obsidian-eclipse'
  );
  const banners = newItems
    .filter((i) => i.type === 'banner')
    .sort((a, b) => (a.id === 'obsidian-eclipse' ? -1 : b.id === 'obsidian-eclipse' ? 1 : 0));
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
    ? 'Sir Reginald Von Ravenscroft the Third'
    : 'Zenryu Captain';

  const renderSpecFooter = (item: CosmeticItem) => {
    const spec = NEW_25_ITEM_SPECS[item.id];
    const priceVal = item.priceKobans ?? 0;
    return (
      <div className="p-3.5 border-t border-white/10 bg-[#0C0C12] flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-heading font-bold text-sm text-white">{item.name}</span>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {item.rarity} · {priceVal.toLocaleString()} K
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
                <span>
                  25 New 3D Store Items — Live FX & Loop Self-Review (/dev/store-items) · Catalog Total:{' '}
                  {COSMETICS_CATALOG.length}
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Three.js 3D WebM/WebP Loops (90–180 frames, periodic) + Canvas FX · Max 8 concurrent videos · Zero flipbooks
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
              data-testid="toggle-banner-ui-theme"
              onClick={() =>
                setBannerUiTheme((prev) => (prev === 'none' ? 'dark' : prev === 'dark' ? 'light' : 'none'))
              }
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-200 transition-colors"
            >
              Banner UI Overlay: {bannerUiTheme.toUpperCase()}
            </button>

            <button
              type="button"
              onClick={() => setShowAllWaves((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                showAllWaves
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                  : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {showAllWaves ? 'Showing All 50 New Items' : 'Showing Latest 25 Items'}
            </button>

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
        {/* 1. BANNERS */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
            <h2 className="text-lg font-heading font-bold text-amber-300">
              1. Banners ({banners.length} Items — 16:9 · Three.js 3D Loop + Canvas FX)
            </h2>
            <span className="text-xs font-mono text-zinc-400">1200×675 · overflow: hidden; contain: paint</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((item) => (
              <div
                key={item.id}
                data-dev-item-card={item.id}
                className="rounded-xl border border-white/15 bg-[#101018] overflow-hidden shadow-lg flex flex-col"
              >
                <div
                  className="relative w-full aspect-[16/9] overflow-hidden"
                  style={{ overflow: 'hidden', contain: 'paint' }}
                >
                  <BannerRenderer
                    bannerId={item.id}
                    animated={!pauseAnimations && item.animated !== false}
                    forceStatic={pauseAnimations || item.animated === false}
                    showReadabilityOverlay={bannerUiTheme !== 'none'}
                  />
                  {bannerUiTheme !== 'none' && (
                    <div
                      className={`absolute inset-y-0 left-0 w-[44%] flex flex-col justify-end p-5 pointer-events-none z-20 ${
                        bannerUiTheme === 'light'
                          ? 'bg-gradient-to-r from-white/85 via-white/55 to-transparent text-zinc-950'
                          : 'bg-gradient-to-r from-black/75 via-black/40 to-transparent text-white'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-mono uppercase tracking-widest mb-1 ${
                          bannerUiTheme === 'light' ? 'text-red-700 font-semibold' : 'text-amber-300'
                        }`}
                      >
                        MYTHIC GRAND LINE CAPTAIN
                      </span>
                      <div className="text-lg font-heading font-bold leading-tight drop-shadow-sm">
                        {samplePlayerName}
                      </div>
                      <div
                        className={`text-xs mt-0.5 ${
                          bannerUiTheme === 'light' ? 'text-zinc-700 font-medium' : 'text-zinc-300'
                        }`}
                      >
                        Obsidian Eclipse · 2,100 Kobans
                      </div>
                    </div>
                  )}
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
              2. Avatars ({avatars.length} Items — 512×512 · Three.js 3D Loop + Canvas FX)
            </h2>
            <span className="text-xs font-mono text-zinc-400">3D PBR Bust · Pulsing Eyes · Periodic Loop</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {avatars.map((item) => (
              <div
                key={item.id}
                data-dev-item-card={item.id}
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
                      className="rounded-2xl"
                      forceStatic={pauseAnimations}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <AvatarPicture
                      avatarId={item.id}
                      size={56}
                      className="rounded-full"
                      forceStatic={pauseAnimations}
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
              3. Avatar Frames ({frames.length} Items — Three.js 3D Alpha Loop + Counter-Rotating SVG Rings)
            </h2>
            <span className="text-xs font-mono text-zinc-400">Avatar visible through center · Clipped to tile</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {frames.map((item, idx) => {
              const pairedAvatar = avatars[idx % avatars.length]?.id || 'pfp_phoenix_ascendant';
              return (
                <div
                  key={item.id}
                  data-dev-item-card={item.id}
                  className="rounded-xl border border-white/15 bg-[#101018] overflow-hidden shadow-lg flex flex-col justify-between"
                >
                  <div
                    className="p-6 flex items-center justify-center bg-gradient-to-b from-[#161622] to-[#0B0B12] overflow-hidden"
                    style={{ overflow: 'hidden', contain: 'paint' }}
                  >
                    <AvatarFrame itemId={item.id} size={116} forceStatic={pauseAnimations}>
                      <AvatarPicture
                        avatarId={pairedAvatar}
                        size={84}
                        className="rounded-full"
                        forceStatic={pauseAnimations}
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
              4. Nameplates ({nameplates.length} Items — 600×120 Three.js 3D Loop + SVG Shimmer)
            </h2>
            <span className="text-xs font-mono text-zinc-400">Full player name wraps up to 2 lines · Never truncated</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {nameplates.map((item) => (
              <div
                key={item.id}
                data-dev-item-card={item.id}
                className="rounded-xl border border-white/15 bg-[#101018] overflow-hidden shadow-lg flex flex-col justify-between"
              >
                <div
                  className="p-6 min-h-[120px] flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#161622] to-[#0B0B12]"
                  style={{ overflow: 'hidden', contain: 'paint' }}
                >
                  <Nameplate
                    itemId={item.id}
                    name={samplePlayerName}
                    shortId="9042"
                    roleBadge="CAPTAIN"
                    allowWrap="two-lines"
                    forceStatic={pauseAnimations || item.animated === false}
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
              5. Profile Effects ({effects.length} Items — 600×800 Three.js 3D Alpha Loop + Canvas FX Clipped to Card)
            </h2>
            <span className="text-xs font-mono text-zinc-400">Max 120 particles/card · Typed Arrays · Additive Glow</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {effects.map((item) => (
              <div
                key={item.id}
                data-dev-item-card={item.id}
                className="rounded-xl border border-white/15 bg-[#101018] overflow-hidden shadow-lg flex flex-col justify-between"
              >
                <div className="p-3 bg-[#0B0B12]">
                  <div className="h-48 w-full">
                    <ProfileEffectCardPreview
                      itemId={item.id}
                      userName={samplePlayerName}
                      forceStatic={pauseAnimations}
                    />
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
