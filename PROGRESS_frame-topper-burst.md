# Progress Log: `frame-topper-burst` ("Topper Star Ring")

## 1. Tools & Prechecks
- **Blender**: `Blender 4.2.3 LTS` (`~/blender/blender`) — PASS
- **FFmpeg**: `ffmpeg version 4.4.2` — PASS
- **WebP Tools**: `img2webp`, `cwebp`, `dwebp`, `webpmux 1.2.4` — PASS
- **Tracked Files Check**: `699` tracked project files (`< 800` limit) — PASS
- **Catalog Pre-check**: Created single row `id: 'frame-topper-burst'` in `src/data/cosmeticsCatalog.ts` (`priceKobans: 600`, `rarity: 'rare'`, `isNew: true`, `featuredOrder: -10`), initially hidden (`isActive: false`) until all checks passed, then published (`isActive: true`) — PASS

## 2. Procedural 3D Scene & Geometry Contract (`480x480`, `83.333%` Inner Hole)
- **Scene (`/.render-cache/render_frame_topper_burst.py`)**:
  - 100% procedural Blender 4.2 LTS (`BLENDER_EEVEE_NEXT`) orthographic render (`480x480` RGBA, `film_transparent = True`, `dither_intensity = 0.0`).
  - Thin glossy gold `#FFC93C` base ring (~10 px wide, `r in [201.4, 211.0] px`) hugging the `400 px` diameter (`r < 200.0 px`) transparent hole.
  - Ring of 20 small glossy 5-point stars (~26 px wide, `r = 219.5 px`) colored in a repeating 5-color Topper Burst cycle (`#FFC93C` gold-yellow, `#FF6B6B` coral, `#00C2A8` teal, `#4D96FF` blue, `#B983FF` violet), each with a thin soft dark edge (`#1B1B3A` at 40% alpha = `102`) for crisp readability on both light (`#F8FAFC`) and dark (`#0E0E14`) themes and at `40x40 px` avatar size (`48x48` frame).
  - 5 tiny 4-point sparkle crosses between the stars (`r = 227.5 px`).
- **Geometry Contract Verification**:
  - Canvas size: `480 x 480` RGBA
  - Center hole (`r < 200.0 px`, diameter `400 px` = `83.333%` of canvas): **`0` non-transparent pixels** (`min_r = 201.01 px`) — PASS
  - Outer boundary (`r > 240.0 px` and 1px canvas border): **`0` non-transparent pixels** (`max_r = 236.49 px`, `border_px = 0`) — PASS

## 3. Seamless Loop Math (`N = 200` frames, `20 fps`, `T = 10.000 s`)
- Phase parameter: `p = f / 200.0` for `f in 0..199` (Frame `200` is NOT rendered; `f = 199` is `p = 199/200`, one step before `p = 0`).
- Each star stays strictly upright in screen space (`rotation_euler = (0, 0, 0)`), gently sways along the ring (`0.008 * sin(2 * pi * p)`), and pulses in scale by `1 + 0.12 * sin(2 * pi * (2 * p) + phase_j)`.
- Bright glint travels around the gold base ring at constant speed, `2` laps per loop (`2 * pi * (2 * p) + pi / 4`).
- 5 sparkle crosses between the stars twinkle with `sin^2(pi * p * k + phase)`, `k in {2, 3}` whole numbers.

## 4. Deliverables & File Size Budgets
- `public/assets/store/frame-topper-burst/frame.webp`:
  - Size: **`826,434 bytes` (`807.06 KB`)** (budget `<= 900 KB`) — PASS
  - Format: Animated WebP, `480x480`, `alpha: yes`, `lossless`
  - Frame count & timing: `200` frames, `50 ms` on every frame (`20 fps`), total duration **`10.000 s`**, `Loop Count: 0` (infinite) — PASS
- `public/assets/store/frame-topper-burst/poster.png`:
  - Size: **`4,808 bytes` (`4.70 KB`)** (budget `<= 60 KB`), `480x480` RGBA with alpha — PASS
- `public/assets/store/frame-topper-burst/CREDITS.md`:
  - Procedural attribution file included (`703 bytes`) — PASS

## 5. Seam Tests & 3x Loop Verification
- **Adjacent vs Seam MAD**:
  - `MAD(frame 0, frame 1)`: `0.1186`
  - `Avg adjacent MAD (0..198)`: `0.105886` (`min = 0.071616`, `max = 0.130791`)
  - `MAD(frame 199, frame 0)`: **`0.122249`**
  - `Ratio MAD(199, 0) / Avg_MAD`: **`1.1545x`** (threshold `<= 1.20x`) — PASS
- **SSIM (`frame 199` vs `frame 0`)**:
  - **`0.997118`** (`R: 0.997506, G: 0.997392, B: 0.995897, A: 0.997678`, threshold `> 0.98`) — PASS
- **3x Loop Seam Motion Window (`600` frames)**:
  - Seam 1 (`frames 194 -> 205`): `[0.1052, 0.1041, 0.1206, 0.1213, 0.1289, 0.1222, 0.1186, 0.1193, 0.1117, 0.1129, 0.1119]` (no dip, no spike at `199 -> 200`) — PASS
  - Seam 2 (`frames 394 -> 405`): `[0.1052, 0.1041, 0.1206, 0.1213, 0.1289, 0.1222, 0.1186, 0.1193, 0.1117, 0.1129, 0.1119]` (no dip, no spike at `399 -> 400`) — PASS
  - Contact sheet saved to `.render-cache/frame_topper_seam_3x_contact_sheet.png` over both `#0E0E14` dark and `#F8FAFC` light themes — PASS

## 6. Store Wiring, Governor, and Purchase Verification
- Wired `frame-topper-burst` in `src/components/koban/artwork/frameArtwork.tsx` (`TopperStarRingFrame`):
  - Uses absolute paths `/assets/store/frame-topper-burst/frame.webp` and `/assets/store/frame-topper-burst/poster.png`.
  - Aligns inner avatar circle to `83.333%` (`400 / 480`) of outer frame diameter (`topperInnerSize = Math.max(16, Math.round((size * 400) / 480))`).
  - Uses static `poster.png` when `size < 56` (dense lists like `40x40` Commons rows and `28x28` navbar pills), when `prefers-reduced-motion: reduce` is active, when offscreen/tab-hidden, or when the shared `storeVideoGovernor` 8-playing cap is reached.
  - Falls back cleanly to `poster.png` on image error (`onError`).
- Non-admin student purchase verified (`1500 -> 900` Kobans, `-600` Kobans deducted, unlocked in `wallet.owned`, equipped in `wallet.equipped.frame`, duplicate purchase blocked) — PASS
