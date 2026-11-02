# Progress Log: `frame-pixel-pop-arcade` ("Pixel Pop Ring")

## 1. Tools & Prechecks
- **Blender**: `Blender 4.2.3 LTS` (`~/blender/blender`) — PASS
- **FFmpeg**: `ffmpeg version 4.4.2` — PASS
- **WebP Tools**: `img2webp`, `cwebp`, `dwebp`, `webpmux 1.2.4` — PASS
- **Tracked Files Check**: `< 800` tracked files (663 tracked files) — PASS
- **Catalog Pre-check**: Created single row `id: 'frame-pixel-pop-arcade'` in `src/data/cosmeticsCatalog.ts` (`priceKobans: 600`, `rarity: 'rare'`, `isNew: true`, `featuredOrder: -6`), initially hidden (`isActive: false`) until all checks passed, then published (`isActive: true`) — PASS

## 2. Procedural 3D Scene & Geometry Contract (`480x480`, `83.333%` Inner Hole)
- **Scene (`/.render-cache/render_frame_pixel_pop_arcade.py`)**:
  - 100% procedural Blender 4.2 EEVEE orthographic render (`480x480` RGBA, `film_transparent = True`, `dither_intensity = 0.0`).
  - 16 glossy rounded arcade cubes (`BevelModifier` width `0.032`, 3 segments) arranged around `R_BAND_MID = 2.20` (`220 px` radius) in the Pixel Pop Arcade candy palette (`#FF3B8B` magenta, `#2EE6FF` cyan, `#FFE145` lemon, `#5EFF9E` mint, `#8A40FF` lavender), alternating with 8 faceted pixel-gem sparkles and a continuous pastel gold inner collar (`#FFF3B0`) + outer `#1B1B3A` (`40%` alpha) outline shell for readability on both light (`#F8FAFC`) and dark (`#0B0D17`) backgrounds.
- **Geometry Contract Verification**:
  - Canvas size: `480 x 480` RGBA
  - Center hole (`r < 200.0 px`, diameter `400 px` = `83.333%` of canvas): **`0` non-transparent pixels** (`min_r = 202.35 px`) — PASS
  - Outer boundary (`r > 240.0 px` and 1px canvas border): **`0` non-transparent pixels** (`max_r = 237.42 px`, `border_px = 0`) — PASS

## 3. Seamless Loop Math (`N = 200` frames, `20 fps`, `T = 10.000 s`)
- Phase parameter: `p = f / 200.0` for `f in 0..199` (Frame `200` is NOT rendered; `f = 199` is `p = 199/200`, one step before `p = 0`).
- Ring rotation: `2 * pi * p / 4` (`90°` per loop = 4-slot color period symmetry).
- Local cube spin: `(pi / 2) * p` (`90°` around local Y axis per loop = 4-fold cube face symmetry).
- Traveling chase light: `2 * pi * p` (`1` full revolution per loop).
- Sparkle bob & pulse: `sin(2 * pi * 2 * p + phase_offset)` (`2` full cycles per loop).

## 4. Deliverables & File Size Budgets
- `public/assets/store/frame-pixel-pop-arcade/frame.webp`:
  - Size: **`884,586 bytes` (`863.85 KB`)** (budget `<= 900 KB`) — PASS
  - Format: Animated WebP, `480x480`, `alpha: yes`, `lossless` 16-color RGBA arcade palette
  - Frame count & timing: `200` frames, `50 ms` on every frame (`20 fps`), total duration **`10.000 s`**, `Loop Count: 0` (infinite) — PASS
- `public/assets/store/frame-pixel-pop-arcade/poster.png`:
  - Size: **`7,855 bytes` (`7.67 KB`)** (budget `<= 60 KB`), `480x480` RGBA with alpha — PASS
- `public/assets/store/frame-pixel-pop-arcade/CREDITS.md`:
  - Procedural attribution file included — PASS

## 5. Seam Tests & 3x Loop Verification
- **Decoded Frame Equivalence**: `max pixel diff = 0` between `frame.webp` mux frames and source PNG frames.
- **Adjacent vs Seam MAD**:
  - `MAD(frame 0, frame 1)`: `0.1262`
  - `Avg adjacent MAD (0..198)`: `0.1356` (`min = 0.1151`, `max = 0.1758`)
  - `MAD(frame 199, frame 0)`: **`0.1241`**
  - `Ratio MAD(199, 0) / Avg_MAD`: **`0.9147x`** (threshold `<= 1.20x`) — PASS
- **SSIM (`frame 199` vs `frame 0`)**:
  - **`0.997382`** (`R: 0.997197, G: 0.995493, B: 0.998043, A: 0.998793`, threshold `> 0.98`) — PASS
- **3x Loop Seam Motion Window (`600` frames)**:
  - Seam 1 (`frames 194 -> 205`): `[0.1183, 0.1264, 0.1242, 0.1285, 0.1276, 0.1241, 0.1262, 0.1366, 0.1361, 0.1389, 0.1301]` (no dip, no spike at `199 -> 200`) — PASS
  - Seam 2 (`frames 394 -> 405`): `[0.1183, 0.1264, 0.1242, 0.1285, 0.1276, 0.1241, 0.1262, 0.1366, 0.1361, 0.1389, 0.1301]` (no dip, no spike at `399 -> 400`) — PASS
  - Contact sheet saved to `.render-cache/frame_seam_contact_sheet.png` over both `#F8FAFC` light and `#0B0D17` dark backgrounds — PASS

## 6. Store Wiring, Governor, and Purchase Verification
- Wired `frame-pixel-pop-arcade` in `src/components/koban/artwork/frameArtwork.tsx` (`PixelPopRingFrame`):
  - Uses absolute paths `/assets/store/frame-pixel-pop-arcade/frame.webp` and `/assets/store/frame-pixel-pop-arcade/poster.png`.
  - Aligns inner avatar circle to `83.333%` (`400 / 480`) of outer frame diameter (`pixelPopInnerSize = Math.max(16, Math.round((size * 400) / 480))`).
  - Uses static `poster.png` when `size < 56` (dense lists like `40x40` Commons rows and `28x28` navbar pills), when `prefers-reduced-motion: reduce` is active, when offscreen/tab-hidden, or when the shared `storeVideoGovernor` 8-playing cap is reached.
  - Falls back cleanly to `poster.png` on image error (`onError`).
