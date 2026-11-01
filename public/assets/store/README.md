# Boardly Store — Premium Cosmetics Asset & Technique Manifest (150 Total Store Items)

## Wave 2: 25 New 3D-Rendered Premium Cosmetics (Items 126–150)

Built with `/tools/render-store-items/render.mjs` using **Three.js** (`WebGLRenderer` in headless Chromium via `playwright-core`) with PBR materials (`MeshStandardMaterial`), emissive glow, volumetric sprite particles, 3-point studio + rim lighting, and `ffmpeg` deterministic fixed-timestep capture (`90` frames per loop, periodic $t \in [0, 1)$, seamless loop).

### Status Summary (Wave 2)
- **Active & Shipping**: 25 / 25 items (`PASS`)
- **Marked "Coming soon"**: None (`0` items)
- **Store Total**: `150` items (`30` Banners, `30` Avatars, `30` Avatar Frames, `30` Nameplates, `30` Profile Effects)

### Weight & Budget Audit (Wave 2 — `/assets/store/<item-id>/`)
All 25 items are strictly within budget (`loop.webm` < 600 KB, `loop.webp` < 900 KB, `poster.webp` < 80 KB):

| Item ID | Category | Rarity | Price (K) | FPS / Frames | `poster.webp` | `loop.webm` (VP9 α) | `loop.webp` | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `ban_phoenix_ember_sunrise` | Banner | Mythic | 1,900 | 30 fps / 90f | 26.3 KB | 156.2 KB | 306.0 KB | PASS |
| `ban_cyber_shibuya_night` | Banner | Legendary | 980 | 30 fps / 90f | 6.0 KB | 85.2 KB | 131.4 KB | PASS |
| `ban_eclipse_tengu_peak` | Banner | Legendary | 910 | 30 fps / 90f | 8.9 KB | 52.0 KB | 92.2 KB | PASS |
| `pfp_phoenix_ascendant` | Avatar | Mythic | 1,750 | 30 fps / 90f | 7.0 KB | 84.4 KB | 140.4 KB | PASS |
| `pfp_ryujin_sea_dragon` | Avatar | Legendary | 940 | 30 fps / 90f | 6.3 KB | 71.2 KB | 117.4 KB | PASS |
| `pfp_shadow_ninja_mask` | Avatar | Legendary | 860 | 30 fps / 90f | 5.2 KB | 53.8 KB | 102.1 KB | PASS |
| `pfp_raijin_thunder_god` | Avatar | Epic | 520 | 30 fps / 90f | 7.0 KB | 121.7 KB | 145.0 KB | PASS |
| `pfp_yokai_lantern_ghost` | Avatar | Epic | 450 | 30 fps / 90f | 7.3 KB | 88.4 KB | 153.8 KB | PASS |
| `plate-raijin-storm-plate` | Nameplate | Legendary | 840 | 60 fps / 90f | 1.4 KB | 26.9 KB | 17.0 KB | PASS |
| `plate-cyber-glitch` | Nameplate | Legendary | 780 | 60 fps / 90f | 1.3 KB | 25.6 KB | 16.6 KB | PASS |
| `plate-frozen-sakura-glass` | Nameplate | Epic | 460 | 60 fps / 90f | 1.3 KB | 25.9 KB | 16.3 KB | PASS |
| `plate-ronin-katana-slash` | Nameplate | Epic | 390 | Static (600×120) | 1.2 KB | — | — | PASS |

---

## Wave 1: Previous Premium Cosmetics
Active Wave 1 items (`ban_crimson_dragons_descent`, `ban_neon_kyoto_rain`, `ban_blood_moon_ronin`, `ban_celestial_koi_river`, `ban_obsidian_shogun_citadel`, `pfp_zenryu_awakened`, `pfp_oni_warlord`, `pfp_kitsune_moonlight`, `pfp_cyber_samurai_visor`, `pfp_tengu_storm_priest`, `frame-dragon-scale-halo`, `frame-thunder-mandala`, `frame-sakura-blade-ring`, `frame-void-obsidian-ring`, `frame-royal-gold-laurel-crown`, `plate-dragon-lord`, `plate-shinobi-shadow`, `plate-neon-ronin`, `plate-imperial-jade`, `plate-blood-moon-scroll`).

