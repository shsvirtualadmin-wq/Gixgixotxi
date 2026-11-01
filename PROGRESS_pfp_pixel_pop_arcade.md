# PROGRESS: pfp_pixel_pop_arcade ("Pixel Pop Cube")

## Checkpoints
- [x] **1. Check Tools**: Verified `~/blender/blender --version` (`Blender 4.2.3 LTS`) and `ffmpeg -version` (`4.4.2`).
- [x] **2. Stage Hidden Catalog Row & Component Wiring**: Added `pfp_pixel_pop_arcade` (`priceKobans: 350`, `rarity: 'common'`, `isNew: true`, `featuredOrder: -7`) to `src/data/cosmeticsCatalog.ts` and wired `PixelPopCubeAvatar` in `src/components/koban/CosmeticRenderers.tsx` without modifying `src/components/koban/artwork/pfpArtwork.tsx` or `src/components/koban/fx/StoreLoopVideo.tsx`.
- [x] **3. Procedural Blender Scene & Hero Frame Preview**: Created `.render-cache/render_pfp_pixel_pop_arcade.py` (`512x512`, `24 fps`, `72` frames, `3.0s` loop). Rendered `frame_0001.png` (`512x512`) and `frame_0001_40x40.png` (`40x40`), verifying readability at `40x40` and central 80% safe circle crop.
- [x] **4. Render Full 72-Frame Loop (3.0s @ 24 fps)**: Rendered all 72 frames (`frame_0001.png`..`frame_0072.png`) into `.render-cache/pfp_pixel_pop_arcade/`.
- [x] **5. Encode Assets & SSIM Seam Verification**:
  - `public/assets/store/pfp_pixel_pop_arcade/pfp.webm`: `137,043 bytes` (`133.8 KB` <= `400 KB`)
  - `public/assets/store/pfp_pixel_pop_arcade/pfp.mp4`: `119,929 bytes` (`117.1 KB` <= `600 KB`)
  - `public/assets/store/pfp_pixel_pop_arcade/poster.webp`: `7,700 bytes` (`7.5 KB` <= `40 KB`)
  - `public/assets/store/pfp_pixel_pop_arcade/CREDITS.md`: `627 bytes`
  - FFmpeg `ssim` (`frame_0072.png` vs `frame_0001.png`): `SSIM R:0.981672 G:0.983496 B:0.984086 All:0.983085 (17.717160)` (`> 0.98` PASS)
- [x] **6. Verify Profile Display, Non-Admin Purchase & Activate**:
  - Commons profile (`src/pages/profile/PublicUserProfilePage.tsx`) and Dashboard profile (`src/components/profile/ProfileView.tsx`) both render `BoardlyAvatar` (`size >= 56`, circle-cropped, `priority = 10`, animated video loop enabled).
  - Dense lists (`size < 56`) automatically use `poster.webp` only (`VIDEO_LOOP_AVATAR_IDS` check in `CosmeticRenderers.tsx`).
  - Non-admin purchase check (`isSuperAdmin = false`): `1000` Kobans -> `650` Kobans (`-350` Kobans), `pfp_pixel_pop_arcade` unlocked and equipped in `avatar` slot, second purchase blocked (`PASS`).
  - Flipped `isActive: true` in `src/data/cosmeticsCatalog.ts`.
