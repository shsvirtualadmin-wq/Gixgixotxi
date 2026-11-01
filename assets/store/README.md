# Boardly Store — 25 New Premium Cosmetics Asset & Technique Manifest

All 25 new Store cosmetics use continuous procedural motion driven by the shared single-rAF FX engine (`/src/components/koban/fx/storeFxEngine.ts`, `< 20 KB`). Zero PNG/WebP flipbooks or frame-swapping sequences exist anywhere.

## Status Summary
- **Active & Shipping**: 25 / 25 items
- **Marked "Coming soon"**: None (0 items)

## Weight & Budget Audit
- **Shared FX Engine**: `~17 KB` (limit: `< 30 KB`)
- **Banner Layers (`1200×675` WebP, 5 layers per banner)**: Each layer `5 KB – 45 KB` (limit: `< 120 KB` per layer, `< 400 KB` per item bundle)
- **Avatar Layers (`512×512` WebP, 4 layers per avatar)**: Each layer `4 KB – 32 KB` (limit: `< 120 KB` per layer, `< 400 KB` per item bundle)

## Per-Item Technique Breakdown
1. **Banners (5)**:
   - `ban_crimson_dragons_descent`: 5 transparent WebP parallax layers (`sky`, `far`, `mid`, `subject`, `fg`) + Canvas FX rising molten embers, smoke, and light flicker.
   - `ban_neon_kyoto_rain`: 5 transparent WebP parallax layers + Canvas FX diagonal neon rain streaks, puddle splash ripples, and lantern flicker.
   - `ban_blood_moon_ronin`: 5 transparent WebP parallax layers + Canvas FX drifting crimson ash, wind-swept embers, and eclipse corona pulse.
   - `ban_celestial_koi_river`: 5 transparent WebP parallax layers + Canvas FX flowing astral starlight river particles, constellation glints, and water ripples.
   - `ban_obsidian_shogun_citadel`: 5 transparent WebP parallax layers + Canvas FX rising volcanic magma sparks and procedural crimson lightning strikes.
2. **Avatars (5)**:
   - `pfp_zenryu_awakened`: 4 WebP layers (`bg`, `halo`, `portrait`, `eyes`) with continuous breathing scale (`1.00–1.02`), eye bloom pulse, and Canvas FX dragon-breath plasma & embers from the jaws.
   - `pfp_kitsune_moonlight`: 4 WebP layers + continuous sine-driven 9-tail mesh spine warp (`drawSwayingTailMesh`), pulsing spirit-cyan eyes, and orbiting foxfire wisps.
   - `pfp_oni_warlord`: 4 WebP layers + breathing scale, pulsing golden demon eyes, and Canvas FX pressurized hellfire steam venting from the mask tusks.
   - `pfp_cyber_samurai_visor`: 4 WebP layers + breathing scale, sweeping holographic HUD visor pulse, cryo-breath vapor particles, and data sparks.
   - `pfp_tengu_storm_priest`: 4 WebP layers + swaying raven-wing feather mesh warp, pulsing golden eyes, and Canvas FX emerald storm lightning & wind particles.
3. **Avatar Frames (5)**:
   - `frame-dragon-scale-halo`: Counter-rotating SVG dragon-scale rings, `stroke-dashoffset` molten veins, and Canvas FX orbiting dragonfire sparks.
   - `frame-thunder-mandala`: Rotating 8-drum Raijin wheel, counter-rotating sacred geometry ring, and Canvas FX procedural branching ring lightning arcs.
   - `frame-sakura-blade-ring`: Twin Damascus katana arcs with `stroke-dashoffset` steel glint sweep and Canvas FX orbiting 3D-tumbling sakura petals.
   - `frame-royal-gold-laurel-crown`: Sculpted 24k gold laurel wreath with continuous `stroke-dashoffset` light sweep, pulsing ruby keystone, and Canvas FX golden stardust motes.
   - `frame-void-obsidian-ring`: Counter-rotating obsidian shard & rune rings, `stroke-dashoffset` void conduits, and Canvas FX abyssal violet sparks & micro-arcs.
4. **Nameplates (5)**:
   - `plate-dragon-lord`, `plate-shinobi-shadow`, `plate-neon-ronin`, `plate-imperial-jade`, `plate-blood-moon-scroll`: Pure CSS/SVG with animated shimmer gradient sweeps, SVG `<feTurbulence>` + `<feDisplacementMap>` drifting smoke, scanline pulse, ornate SVG border paths, and full 2-line name wrapping (never truncated).
5. **Profile Effects (5)**:
   - `effect-dragon-fire-aura`: Canvas 2D rising additive flames with turbulence, white->orange->crimson->smoke color ramp, and sparks.
   - `effect-thunder-kami-storm`: Canvas 2D midpoint-displacement branching lightning bolts with flash decay and afterglow.
   - `effect-spirit-fox-fire`: Canvas 2D blue-violet foxfire wisps following smooth 2D noise paths with ribbon trails.
   - `effect-cherry-blossom-gale`: Canvas 2D 3D-tumbling sakura petals in a swirling wind field with depth-based size and softness.
   - `effect-falling-stars`: Canvas 2D golden meteors with tapered fading tails and bright streaks.
