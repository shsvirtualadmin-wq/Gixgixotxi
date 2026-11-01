# Progress Checkpoint — Eclipse Wyrm (`eclipse-wyrm`)

## Ordered Steps (`done / in progress / next`)

- [x] **STEP 1: DIAGNOSE** (`done`):
  - **Catalog Row (`src/data/cosmeticsCatalog.ts`)**:
    * `id`: `'eclipse-wyrm'`, `name`: `'Eclipse Wyrm'`, `type`: `'avatar'`, `rarity`: `'mythic'`, `priceKobans`: `5000`, `animated`: `true`, `isAnimated`: `true`, `isNew`: `true`, `featuredOrder`: `-20`, `createdAt`: `'2026-11-01T00:00:00.000Z'`.
    * Previously, the row object itself did not have `posterUrl`, `webmUrl`, or `mp4Url` fields populated on the item schema (they were only inside `PfpEclipseWyrm`).
  - **File Inventory**:
    * `/public/assets/store/eclipse-wyrm/` & `/assets/store/eclipse-wyrm/`:
      - `avatar.webm`: `263,369` bytes (258 KB, VP9, 512x512, 30 fps, 5.0s)
      - `avatar.mp4`: `507,847` bytes (496 KB, H.264 `yuv420p`, `+faststart`, 512x512, 30 fps, 150 frames)
      - `poster.webp`: `19,640` bytes (20 KB, WebP, 512x512)
      - `CREDITS.md`: `1,235` bytes (1.3 KB)
    * `/tools/blender/`:
      - `eclipse_wyrm.py`, `eclipse_wyrm.blend`, `render_eclipse_wyrm.sh`, `PROGRESS_eclipse_wyrm.md`, `.frames_cache_eclipse_wyrm/` (150 rendered frames `frame_0000.png`–`frame_0149.png`).
  - **HTTP Status & Content-Type Check**:
    * Local / Dev Server (`http://localhost:3000/assets/store/eclipse-wyrm/...`):
      - `poster.webp`: `200 OK`, `Content-Type: image/webp`, `Content-Length: 19640`
      - `avatar.webm`: `200 OK`, `Content-Type: video/webm`, `Content-Length: 263369`
      - `avatar.mp4`: `200 OK`, `Content-Type: video/mp4`, `Content-Length: 507847`
    * External Production Domain (`https://boardly.cfd/assets/store/eclipse-wyrm/poster.webp`) before static sync / during mid-render cache:
      - Returned `HTTP/2 200` with `content-type: text/html; charset=utf-8` (SPA fallback to `index.html` with `Cache-Control: public, max-age=31536000, immutable`).
  - **Root Causes of the Dark Circle + `"Eclipse Wyrm Avatar"` Broken-Image Text**:
    1. `PfpEclipseWyrm` in `src/components/koban/artwork/pfpArtwork.tsx` rendered `<img src="/assets/store/eclipse-wyrm/poster.webp" alt="Eclipse Wyrm Avatar" />` over a dark gradient circle (`radial-gradient(circle, #2A080C 0%, #030104 100%)`) with no `onError` handler. When a browser requested `/assets/store/eclipse-wyrm/poster.webp` before the render completed (or received a cached `200 text/html` fallback), the `<img>` failed to decode and rendered the browser's broken-image icon plus the literal alt text `"Eclipse Wyrm Avatar"`.
    2. `PfpEclipseWyrm` hid the poster `<img>` (`opacity-0`) as soon as `effectiveAnimate && isGovernorActive` became `true`, before the `<video>` fired `onLoadedData` / `onCanPlay`.
    3. `PfpEclipseWyrm` attached `onError` to `<video>` instead of the `<source>` element (`<source src={mp4Url} type="video/mp4" onError={...} />`). In HTML5 `<video>`, source load failures fire `error` on `<source>`, not `<video>`, so `videoFailed` never flipped to `true`.
    4. `CommonsPostCard.tsx`, `CommonsCommentsDrawer.tsx`, and `ProfileView.tsx` checked `authorAvatar?.startsWith('pfp_')` to distinguish cosmetic avatar IDs from image URLs, which would misclassify `'eclipse-wyrm'` as an `avatarUrl` if passed via `authorAvatar`.

- [x] **STEP 2: TOOLS** (`done`):
  - Verified `blender --version`: `Blender 4.2.3 LTS (build hash: 0e22e4fcea03)`
  - Verified `ffmpeg -version`: `ffmpeg version 4.4.2-0ubuntu0.22.04.1+esm17` with `libvpx-vp9`, `libx264`, and `libwebp`.
  - Verified headless Cycles CPU default-cube test render (`/tmp/default_cube_verify.png`, 14 KB, rendered in 0.52s).

- [x] **STEP 3: BUILD THE ARTWORK** (`done`):
  - Verified all 150 rendered frames (`0–149`, 5.0s @ 30 fps) in `/tools/blender/.frames_cache_eclipse_wyrm/` and encoded production files in `/public/assets/store/eclipse-wyrm/` & `/assets/store/eclipse-wyrm/`:
    * `avatar.webm`: 258 KB (< 500 KB budget)
    * `avatar.mp4`: 496 KB (< 700 KB budget, `yuv420p`, `+faststart`)
    * `poster.webp`: 20 KB (< 40 KB budget, 512x512)
    * `CREDITS.md`: 1.3 KB
    * Loop closure SSIM: `All: 0.999829` (> 0.98 threshold)
  - Generated `/src/components/koban/artwork/eclipseWyrmPosterFallback.ts` (`ECLIPSE_WYRM_POSTER_DATA_URI` compiled directly from the 512x512 Blender-rendered `poster.webp`) so that even if a browser or CDN has a poisoned cache for `/assets/store/eclipse-wyrm/poster.webp`, the real 3D Eclipse Wyrm poster is guaranteed to render with zero possibility of a dark placeholder circle.

- [x] **STEP 4: WIRE IT UP** (`done`):
  - Updated existing `eclipse-wyrm` row in `/src/data/cosmeticsCatalog.ts` (keeping `id: 'eclipse-wyrm'`, `priceKobans: 5000`, `rarity: 'mythic'`) with explicit absolute paths:
    * `posterUrl: '/assets/store/eclipse-wyrm/poster.webp'`
    * `webmUrl: '/assets/store/eclipse-wyrm/avatar.webm'`
    * `mp4Url: '/assets/store/eclipse-wyrm/avatar.mp4'`
  - Updated `PfpEclipseWyrm` in `/src/components/koban/artwork/pfpArtwork.tsx`:
    * Uses `<video autoPlay loop muted playsInline preload="metadata" poster={posterUrl}>` with WebM then MP4 `<source>` tags.
    * Uses `alt=""` and `aria-hidden="true"` on the poster `<img>` so broken-image text `"Eclipse Wyrm Avatar"` can never appear.
    * Keeps the poster `<img>` at `opacity-100` underneath the `<video>` and only fades `<video>` to `opacity-100` once `videoReady` (`onLoadedData` / `onCanPlay`) and `isGovernorActive` are true.
    * Attaches `onError={handleVideoError}` to the final `<source>` tag as well as `<video>`, with `?v=2` retry and fallback to the static poster.
    * Retries poster with `?v=2` on error and falls back to `ECLIPSE_WYRM_POSTER_DATA_URI` (also set as CSS `backgroundImage` on the container).
  - Updated `BoardlyAvatar.tsx`, `CommonsPostCard.tsx`, `CommonsCommentsDrawer.tsx`, and `ProfileView.tsx` so `'eclipse-wyrm'` is recognized everywhere as an equipped cosmetic avatar alongside `pfp_*` IDs.
  - Bumped Service Worker cache name in `/public/sw.js` to `'shs-boardly-mcq-v7'` to purge any stale cached asset responses.

- [x] **STEP 5: HONESTY RULE** (`done`):
  - All real 3D rendered files (`avatar.webm`, `avatar.mp4`, `poster.webp`, `CREDITS.md`) exist, pass `ffprobe` and HTTP 200 MIME checks, and have an embedded `poster.webp` fallback so the item is never shown as a dark placeholder circle.

- [x] **STEP 6: VERIFY** (`done`):
  - Verified Store catalog row, HTTP `200` + `Content-Type` headers, SSR/DOM markup for Store grid card (`104px`), detail sheet (`148px`), dense list (`40px`, poster-only), and equipped `BoardlyAvatar` (`120px`).
  - Confirmed all existing items, the existing Dragon (`ban_crimson_dragons_descent`, `pfp_waterfall_dragon`, `pfp_ryujin_sea_dragon`), and `sovereign-of-the-black-sun` banner are untouched, and total catalog count increased by 1 only (153 total).
  - Verified non-admin purchase, -5,000 Koban balance drop, `users/{uid}/unlocked/eclipse-wyrm` creation, `wallets/{uid}/ledger` entry, equipping, duplicate purchase rejection, and insufficient balance rejection via `scripts/verify-eclipse-wyrm-purchase.ts`.
  - Verified `compile_applet` (`vite build`) and `lint_applet` (`eslint src --max-warnings 0`) pass with 0 errors and 0 warnings.
