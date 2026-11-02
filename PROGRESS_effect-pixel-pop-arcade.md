# Progress Log: `effect-pixel-pop-arcade` ("Pixel Pop Sparkle Shower")

## Checkpoints
- [x] **Pre-check & Catalog Row**: Added single row `id: 'effect-pixel-pop-arcade'` in `src/data/cosmeticsCatalog.ts` (`priceKobans: 700`, `rarity: 'rare'`, `isNew: true`, `featuredOrder: -4`, initially `isActive: false` until all checks passed, now `isActive: true`).
- [x] **Step 1 — Check Tools**: Verified `Blender 4.2.3 LTS` (`~/blender/blender`), `ffmpeg version 4.4.2`, and WebP tools (`img2webp`, `webpmux 1.2.4`, `cwebp`, `dwebp`).
- [x] **Step 2 & 3 — Scene & Seamless Loop**:
  - Procedural Blender 4.2 LTS EEVEE orthographic render (`800x450` 16:9 RGBA, straight alpha, `film_transparent = True`, `dither_intensity = 0.0`).
  - 44 particles/sparkles total (`26` rising 3D pixel hearts, pixel stars, and tiny glossy cubes in `#FF5FA2`, `#7C4DFF`, `#00E0C6`, `#FFE45E`, `#4CC9F0` with `#1B1B3A` soft dark outline at 40% alpha + `18` twinkling 4-point star sparkles).
  - Exact 10.000 s loop at 15 fps = 150 frames (`0..149`, frame 150 omitted). Every animated value driven by `p = frame / 150.0` with whole-number vertical speeds (`k = 1, 2`), whole-number horizontal sway (`m = 1, 2`), `sin^2(pi * y)` vertical wrap window, and `sin^2(pi * p * k + phase)` sparkle twinkles.
- [x] **Step 4 — Hero Frame, Seam Pair & Batch Render**:
  - Rendered hero frame composited over dark and light profile cards (`.render-cache/hero_dark_and_light_profile_preview.png`).
  - Rendered seam pair frames `149` and `0` side by side (`.render-cache/seam_pair_149_vs_000.png`).
  - Rendered all 150 frames (`frame_0000.png`..`frame_0149.png`) into git-ignored `.render-cache/effect-pixel-pop-arcade/frames/`.
- [x] **Step 5 — Encode**:
  - `public/assets/store/effect-pixel-pop-arcade/effect.webp`: **`354,446 bytes` (`346.14 KB` <= `900 KB`)**, `800x450` animated WebP with alpha, `150` frames, uniform `67 ms` per frame (`15 fps`, `10.000 s`), loop count `0` (infinite) — **PASS**
  - `public/assets/store/effect-pixel-pop-arcade/poster.png`: **`3,652 bytes` (`3.57 KB` <= `60 KB`)**, `800x450` RGBA frame 0 with alpha — **PASS**
  - `public/assets/store/effect-pixel-pop-arcade/CREDITS.md`: Procedural attribution included — **PASS**
- [x] **Step 6 — Seam & Center Tests**:
  - `avg_adjacent_MAD`: `0.578957` (`min = 0.506626`, `max = 0.673987`)
  - `MAD(frame 149, frame 0)`: `0.597823` -> **Ratio = `1.0326x`** (threshold `<= 1.20x`) — **PASS**
  - `SSIM(frame 149, frame 0)`: **`0.985882`** (`R: 0.986129, G: 0.986092, B: 0.985296, A: 0.986012`, threshold `> 0.98`) — **PASS**
  - 3x sequence (`450` frames) seam windows (`144..155` and `294..305`): `[0.6033, 0.6226, 0.6055, 0.5949, 0.5967, 0.5978, 0.5787, 0.5809, 0.5869, 0.5933, 0.5750]` (no dip, no jump, contact sheet saved at `.render-cache/effect_seam_3x_contact_sheet.png`, motion plot at `.render-cache/effect_motion_3x_plot.png`) — **PASS**
  - Center 60% box (`x in [160, 640), y in [90, 360)`) across all 150 frames: **`maxAlpha = 0.0000` (`<= 0.05`), `avgAlpha = 0.0000` (`<= 0.01`)** — **PASS**
- [x] **Step 7 — Store & Profile Delivery**:
  - Wired `PixelPopSparkleShowerOverlay` in `src/components/koban/artwork/effectArtwork.tsx` and Commons profile in `src/pages/profile/PublicUserProfilePage.tsx`.
  - Uses absolute paths (`/assets/store/effect-pixel-pop-arcade/effect.webp` and `/assets/store/effect-pixel-pop-arcade/poster.png`), falls back to `poster.png` on error, uses `poster.png` only in dense lists (`size < 56`) and when `prefers-reduced-motion: reduce` is set, respects `storeVideoGovernor` 8-playing cap, and sets `pointer-events: none`.
- [x] **Step 8 — Non-Admin Purchase Check**:
  - Verified purchasing `effect-pixel-pop-arcade` with a non-admin student account (`isSuperAdmin = false`): balance drops by 700 Kobans (`2000 -> 1300`), item unlocks in `owned[]` and equips to `equipped.effect`, and a second purchase attempt is blocked — **PASS**
- [x] **Step 9 — Publish**:
  - Flipped `isActive: true` in `src/data/cosmeticsCatalog.ts` — **PASS**
