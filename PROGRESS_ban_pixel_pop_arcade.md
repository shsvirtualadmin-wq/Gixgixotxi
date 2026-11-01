# Progress Log: Pixel Pop Arcade (`ban_pixel_pop_arcade`)

## Hard Rules & Guardrails
- [x] Addition-only: no changes to purchase/equip logic, Kobans ledger, balances, admin price tools, auth, Super Admin powers, `firestore.rules`, or the existing Dragon companion.
- [x] Protected items untouched: `sovereign-of-the-black-sun`, `obsidian-eclipse`, `eclipse-wyrm`, `black-sun-ember-storm`.
- [x] Single catalog row in `src/data/cosmeticsCatalog.ts` (`id: 'ban_pixel_pop_arcade'`, Epic, 850 Kobans, 14-day NEW badge via `createdAt`, Featured carousel via `featuredOrder: -8`, initially `isActive: false` until all checks passed, now `isActive: true`).
- [x] `.render-cache/` added to `.gitignore` to keep tracked files well under 800 (`649` tracked files total).

## Checkpoints
- [x] **Step 1 — Check Tools**:
  - `ffmpeg` verified: `ffmpeg version 4.4.2-0ubuntu0.22.04.1+esm17`.
  - `blender` 4.2.3 LTS installed to `~/blender` (`/root/blender/blender --version` -> `Blender 4.2.3 LTS`).
- [x] **Step 2 — Procedural 3D Scene (Blender 4.2.3 LTS)**:
  - Script created at `.render-cache/render_pixel_pop_arcade.py`.
  - 16:9 (`1280x720`), playful candy-bright gamer theme.
  - Palette: `#FF5FA2` (pink), `#7C4DFF` (violet), `#00E0C6` (mint), `#FFE45E` (yellow), `#4CC9F0` (sky).
  - Mid-tone gradient backdrop (`#663EE6` / `#7C4DFF` to `#FF5FA2`) with synth-pop perspective arcade grid.
  - Left third kept calm (soft violet gradient + 2 distant low-contrast cubes) for profile name overlay readability.
  - Floating glossy rounded cubes (with 3D pixel-heart and pixel-smile faces) + twinkling emissive pixel stars and pixel hearts.
  - `public/assets/store/ban_pixel_pop_arcade/CREDITS.md` created (100% procedural, no external assets).
- [x] **Step 3 — Seamless Loop**:
  - 5.0 seconds at 24 fps (`120` frames).
  - Motion driven by 4D circular noise `(cos(theta), sin(theta))`, whole-period sine bobbing, whole-turn rotations (multiples of 90 degrees), 1-cell-per-loop grid scroll, and `sin(2*pi*t/T + phase)` twinkles.
- [x] **Step 4 — Render Quality & Resumable Batches**:
  - Hero frame `frame_0001.png` rendered and visually inspected.
  - Resumable batches (`1..1`, `2..40`, `41..80`, `81..120`) rendered to `.render-cache/ban_pixel_pop_arcade/frame_0001.png` .. `frame_0120.png`.
- [x] **Step 5 — Encode & SSIM Check**:
  - `public/assets/store/ban_pixel_pop_arcade/banner.webm`: **513.3 KB** (`525,589` bytes, limit <= 900 KB) — **PASS**
  - `public/assets/store/ban_pixel_pop_arcade/banner.mp4`: **882.7 KB** (`903,891` bytes, limit <= 1.2 MB) — **PASS**
  - `public/assets/store/ban_pixel_pop_arcade/poster.webp`: **44.9 KB** (`45,974` bytes, limit <= 80 KB) — **PASS**
  - SSIM (`frame_0120.png` vs `frame_0001.png`): **0.999988** (`R:0.999994 G:0.999983 B:0.999986 All:0.999988`, limit > 0.98) — **PASS**
- [x] **Step 6 — Store & Profile Delivery**:
  - `PixelPopArcadeBanner` component created (`src/components/koban/artwork/bannerArtwork/PixelPopArcadeBanner.tsx`) and registered in `src/components/koban/artwork/bannerArtwork/index.tsx`.
  - Uses absolute paths (`/assets/store/ban_pixel_pop_arcade/...`), poster fallback, poster-only in dense lists (`canAnimate={false}`), `prefers-reduced-motion: reduce`, and `storeVideoGovernor` max-8-playing cap.
  - Verified display and matching `h-28 sm:h-36` + `showReadabilityOverlay={true}` banner crop across Store header (`StorePage.tsx`), Dashboard profile (`ProfileView.tsx`), and Commons profile (`PublicUserProfilePage.tsx`).
- [x] **Step 7 — Non-Admin Purchase Check**:
  - Verified buying `ban_pixel_pop_arcade` with a non-admin account (`isSuperAdmin = false`): Kobans balance drops by 850 (`2000 -> 1150`), item unlocks in `owned[]` and equips to `equipped.banner`, and a second purchase attempt is blocked.
- [x] **Step 8 — Final Activation**:
  - Flipped `isActive: true` on `ban_pixel_pop_arcade` in `src/data/cosmeticsCatalog.ts`.
