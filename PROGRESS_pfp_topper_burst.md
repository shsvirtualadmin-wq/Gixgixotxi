# Progress Log: `pfp_topper_burst` ("Topper Star Medal")

## Checkpoints
- [x] **Step 1 — Check Tools**: Verified `Blender 4.2.3 LTS` (`~/blender/blender`), `ffmpeg version 4.4.2`, and `ffprobe version 4.4.2` — **PASS**
- [x] **Step 2 — Stage Hidden Catalog Row & Component Wiring**: Added single row `id: 'pfp_topper_burst'` (`name: 'Topper Star Medal'`, `type: 'avatar'`, `priceKobans: 350`, `rarity: 'common'`, `isNew: true`, `featuredOrder: -9`, initially `isActive: false`, now `isActive: true`) to `src/data/cosmeticsCatalog.ts` and wired `TopperStarMedalAvatar` in `src/components/koban/CosmeticRenderers.tsx` without touching `pfpArtwork.tsx` or `StoreLoopVideo.tsx` — **PASS**
- [x] **Step 3 — Procedural Blender Scene & Hero/Seam Previews**:
  - Created `.render-cache/render_pfp_topper_burst.py` (`512x512`, `24 fps`, `240` frames `0..239`, `10.000s` loop).
  - Subject: ONE big glossy rounded 5-point star medal in `#FFC93C` with an unbroken thin coral `#FF6B6B` inner ring, centered over a flat circular celebration disc with a smooth `#00C2A8` (bottom) to `#4D96FF` (top) vertical gradient and 4D circular-time drift, surrounded by 6 small confetti dots and tiny stars in `#FF6B6B`, `#B983FF`, and `#FFFFFF` inside the central 80% safe circle (`r <= 204.8 px`).
  - Rendered and verified hero preview at `512x512` and `40x40` on dark and light themes (`.render-cache/pfp_topper_burst/hero_512_and_40x40_preview.png`) and seam pair `frame_0239.png` vs `frame_0000.png` (`.render-cache/pfp_topper_burst/seam_pair_239_vs_000.png`) — **PASS**
- [x] **Step 4 — Batch Render All 240 Frames**: Rendered all 240 frames (`frame_0000.png`..`frame_0239.png`; frame `240` omitted) into git-ignored `.render-cache/pfp_topper_burst/frames/` — **PASS**
- [x] **Step 5 — Encode & FFprobe Verification**:
  - `public/assets/store/pfp_topper_burst/pfp.webm`: **`177,451 bytes` (`173.29 KB` <= `600 KB`)**, VP9, `240` frames, `duration = 10.000000 s`, `start_time = 0.000000`, no audio stream, `-auto-alt-ref 0`, closed GOP, keyint `48` — **PASS**
  - `public/assets/store/pfp_topper_burst/pfp.mp4`: **`270,213 bytes` (`263.88 KB` <= `800 KB`)**, H.264 (`-bf 0`), `240` frames, `duration = 10.000000 s`, `start_time = 0.000000`, no audio stream, closed GOP, keyint `48`, `+faststart`, `make_zero` — **PASS**
  - `public/assets/store/pfp_topper_burst/poster.webp`: **`12,442 bytes` (`12.15 KB` <= `40 KB`)**, `512x512` frame 0 — **PASS**
  - `public/assets/store/pfp_topper_burst/CREDITS.md`: Procedural attribution file included — **PASS**
- [x] **Step 6 — Seam Tests & 3x Loop Contact Sheet / Motion Plot**:
  - `avg_adjacent_MAD (0..238)`: **`0.414436`** (`min = 0.330902`, `max = 0.496065`)
  - `seam_MAD (frame 239 -> frame 0)`: **`0.459969`** -> **Ratio = `1.1099x`** (threshold `<= 1.20x`) — **PASS**
  - `SSIM(frame 239, frame 0)`: **`0.991821`** (windowed RGB) / **`0.991628`** (`ffmpeg -lavfi ssim`: `R:0.991614 G:0.991617 B:0.991654 All:0.991628`, threshold `> 0.98`) — **PASS**
  - 3x concatenated sequence (`720` frames) seam windows (`234..245` and `474..485`): `[0.4680, 0.4593, 0.4635, 0.4656, 0.4633, 0.4600, 0.4598, 0.4621, 0.4552, 0.4490, 0.4519]` (no dip, no jump at `239 -> 240` or `479 -> 480`; contact sheet at `.render-cache/pfp_topper_burst/pfp_seam_3x_contact_sheet.png`, motion plot at `.render-cache/pfp_topper_burst/pfp_motion_3x_plot.png`) — **PASS**
- [x] **Step 7 & 8 — Profile Delivery & Non-Admin Purchase Check**:
  - Verified display on Store, Commons profile, and Dashboard profile (`size >= 56` plays animated video loop with circle crop and `storeVideoGovernor` 8-playing cap; `size < 56` dense lists render `poster.webp` only).
  - Verified purchasing `pfp_topper_burst` with a non-admin student account (`isSuperAdmin = false`): balance drops by 350 Kobans (`1000 -> 650`), item unlocks in `wallet.owned` and equips to `wallet.equipped.avatar`, and a second purchase attempt is blocked — **PASS**
- [x] **Step 9 — Publish**: Flipped `isActive: true` in `src/data/cosmeticsCatalog.ts` — **PASS**
