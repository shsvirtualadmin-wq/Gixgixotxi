# Progress Log — Black Sun Ember Storm (`black-sun-ember-storm`)

## Status Summary
- **(1) Tools Check**: `done`
  - `Blender 4.2.3 LTS` (`/root/blender/blender`, commit `0e22e4fcea03`) verified with headless Cycles CPU default-cube render (`/tmp/default_cube_bses.png`).
  - `ffmpeg 4.4.2` verified with `libvpx-vp9`, `libwebp`, and `libx264`.
- **(2) Hero Frame**: `done`
  - Built `/tools/blender/black_sun_ember_storm.py` and `/tools/blender/black_sun_ember_storm.blend` (3:4 aspect ratio, `Film > Transparent`, RGBA PNG, `Standard` view transform).
  - Rendered hero frame `0026` (`/tools/blender/hero_bses_0026.png`) and verified composite over both dark (`#0E0E12`, `/tools/blender/hero_bses_on_dark.png`) and light (`#F8FAFC`, `/tools/blender/hero_bses_on_light.png`) profile backgrounds: zero dark halos around glow edges, center 60% clear for readability, rising Black Sun eclipse arc + kintsugi ring at top edge, crimson-gold forked lightning along side edges, curling 4D-noise smoke at bottom corners, and 3 depth layers of DoF embers.
- **(3) Full Render (120 frames, 30 fps)**: `done`
  - Rendered all 120 RGBA frames (`frame_0000.png`–`frame_0119.png`) into `/tools/blender/.frames_cache_black_sun_ember_storm/`.
  - Verified seamless loop closure (`SSIM All: 1.000000` > `0.98`).
- **(4) Encode (`effect.webp`, `effect.webm`, `poster.png`, `CREDITS.md`)**: `done`
  - Encoded to `/public/assets/store/black-sun-ember-storm/` and mirrored to `/assets/store/black-sun-ember-storm/`:
    - `effect.webp`: `574,904` bytes (`561.4 KB` < 700 KB, 600×800, 30 fps, Animated WebP with alpha)
    - `effect.webm`: `435,920` bytes (`425.7 KB` < 700 KB, 600×800, 30 fps, VP9 `yuva420p` with alpha)
    - `poster.png`: `72,636` bytes (`70.9 KB` < 120 KB, 600×800, RGBA PNG with alpha, frame `0026`)
    - `CREDITS.md`: `1,267` bytes (100% original procedural generation in Blender 4.2.3 LTS)
- **(5) Store Row & Component**: `done`
  - Added `black-sun-ember-storm` (`type: 'effect'`, `rarity: 'mythic'`, `priceKobans: 2400`, `featuredOrder: -15`, `isNew: true`) in `/src/data/cosmeticsCatalog.ts`.
  - Added `BlackSunEmberStormOverlay` in `/src/components/koban/artwork/effectArtwork.tsx` with `pointer-events: none`, `IntersectionObserver` off-screen pause, `document.visibilityState` tab pause, `prefers-reduced-motion: reduce` static poster mode, and dense-list (`< 56px`) suppression.
- **(6) Purchase Check**: `done`
- **(7) Self-Review**: `done`
  - Inspected 5-frame review grid (`/tools/blender/review_frames/black_sun_ember_storm_review_grid.png`) across frames `0000`, `0026`, `0060`, `0090`, and `0119` over both dark and light profile cards.
- **(8) Make Visible**: `done`
  - Switched `isActive: true` on `black-sun-ember-storm` in `/src/data/cosmeticsCatalog.ts`.
