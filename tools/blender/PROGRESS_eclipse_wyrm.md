# Progress Checkpoint — Eclipse Wyrm (`eclipse-wyrm`)

## Ordered Steps (`done / in progress / next`)
- [x] **1. Tools Check** (`done`):
  - Verified Blender 4.2.3 LTS at `/root/blender/blender` (`/usr/local/bin/blender`) with headless Cycles + OpenImageDenoise default-cube test render (`/tmp/test_cube.png` rendered in 0.24s).
  - Verified FFmpeg 4.4.2 at `/usr/bin/ffmpeg` with `libvpx-vp9`, `libx264`, and `libwebp`.
- [x] **2. Hero Frame** (`done`):
  - Built `/tools/blender/eclipse_wyrm.py` (and saved `/tools/blender/eclipse_wyrm.blend`) for 1:1 square (`1024x1024` render downscaled to `512x512`) circle-safe 3D dragon head-and-neck portrait before the black eclipse sun, thin gold corona + diamond-ring flare, rotating obsidian ring with gold veins, swept-back horns, crown of gold spikes, glowing molten vertical slit-pupil eyes, curling nostril smoke & embers, throat fire glow, crimson & gold god rays, starry sky, AgX/Filmic lighting, and compositor bloom/vignette/grain.
  - Rendered and verified hero frame `0045` at full quality (`1024x1024`, 40 samples + OpenImageDenoise, 4 bounces) and verified readability at `40x40` circular crop.
- [x] **3. Full Render** (`done`):
  - Rendered all 150 frames (`0–149`, 5.0s seamless loop at 30 fps) in `/tools/blender/.frames_cache_eclipse_wyrm/` with Cycles raytraced direct lighting, shadows, and compositor bloom.
- [x] **4. Encode** (`done`):
  - Encoded `/public/assets/store/eclipse-wyrm/` and mirrored to `/assets/store/eclipse-wyrm/`:
    * `avatar.webm`: 258 KB (budget < 500 KB)
    * `avatar.mp4`: 496 KB (budget < 700 KB)
    * `poster.webp`: 20 KB (budget < 40 KB)
    * `CREDITS.md`: 1.3 KB
    * Verified loop closure SSIM: `0.999829` (> 0.98, zero visible jump)
- [x] **5. Store Row and Player** (`done`):
  - Added `eclipse-wyrm` row to `COSMETICS_CATALOG` (`category: 'avatar'`, `rarity: 'mythic'`, `animated: true`, dynamically computed default price of 5,000 Kobans which is > 1.5x of the highest existing item 2,200 Kobans, 14-day NEW badge, pinned first with `featuredOrder: -20` in Featured carousel).
  - Implemented `PfpEclipseWyrm` video player with IntersectionObserver, Store Video Governor (max 8 videos), `prefers-reduced-motion` compliance, and poster-first fallback.
  - Enforced dense-list performance rule: in chips and comments with `size < 56`, static poster is displayed.
- [x] **6. Purchase Check** (`done`):
  - Verified non-admin purchase check via `scripts/verify-eclipse-wyrm-purchase.ts`:
    * Insufficient balance rejection tested against 5,000 Koban flagship price (500 Kobans rejected with `"Insufficient Kobans. You have 500 Kobans, but Eclipse Wyrm costs 5,000 Kobans."`).
    * Sufficient balance purchase verified: user wallet balance dropped by exactly 5,000 Kobans (12,000 -> 7,000).
    * `users/{uid}/unlocked/eclipse-wyrm` created with `{ itemId: 'eclipse-wyrm', itemName: 'Eclipse Wyrm', pricePaid: 5000 }`.
    * Wallet owned array includes `eclipse-wyrm`.
    * Immutable ledger entry created in `wallets/{uid}/ledger` with `amount: -5000, balanceAfter: 7000, itemId: 'eclipse-wyrm'`.
    * Equipped avatar verified in wallet (`wallet.equipped.avatar === 'eclipse-wyrm'`).
    * Duplicate purchase prevention verified (rejection with `"You have already unlocked 'Eclipse Wyrm'"`).
- [x] **7. Self-Review** (`done`):
  - 12 sequential review screenshots extracted across loop duration; verified smooth breathing, eye slit glow and blink, horn reflections, corona flare, rotating obsidian ring with gold veins, and looping embers.
  - Circle-safe composition verified with 8% boundary margin; 40x40 circular crop verified for high-contrast readability against dark and light backgrounds.
  - Encoded files within strict budgets: WebM 258 KB (< 500 KB), MP4 496 KB (< 700 KB), Poster 20 KB (< 40 KB). Seamless loop SSIM: 0.999829 (> 0.98).
  - Hard rule check: All existing items in `COSMETICS_CATALOG`, existing dragon items (`ban_crimson_dragons_descent`, `pfp_waterfall_dragon`, `pfp_ryujin_sea_dragon`), and banner `sovereign-of-the-black-sun` are completely untouched and identical.

