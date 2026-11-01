# Progress Checkpoint — Eclipse Wyrm (`eclipse-wyrm`)

## Ordered Steps (`done / in progress / next`)
- [x] **1. Tools Check** (`done`):
  - Verified Blender 4.2.3 LTS at `/root/blender/blender` (`/usr/local/bin/blender`) with headless Cycles + OpenImageDenoise default-cube test render (`/tmp/test_cube.png` rendered in 0.24s).
  - Verified FFmpeg 4.4.2 at `/usr/bin/ffmpeg` with `libvpx-vp9`, `libx264`, and `libwebp`.
- [x] **2. Hero Frame** (`done`):
  - Built `/tools/blender/eclipse_wyrm.py` (and saved `/tools/blender/eclipse_wyrm.blend`) for 1:1 square (`1024x1024` render downscaled to `512x512`) circle-safe 3D dragon head-and-neck portrait before the black eclipse sun, thin gold corona + diamond-ring flare, rotating obsidian ring with gold veins, swept-back horns, crown of gold spikes, glowing molten vertical slit-pupil eyes, curling nostril smoke & embers, throat fire glow, crimson & gold god rays, starry sky, AgX/Filmic lighting, and compositor bloom/vignette/grain.
  - Rendered and verified hero frame `0045` at full quality (`1024x1024`, 40 samples + OpenImageDenoise, 4 bounces) and verified readability at `40x40` circular crop.
- [ ] **3. Full Render** (`in progress`):
  - Rendering all 150 frames (`0–149`, 5.0s seamless loop at 30 fps) in resumable batches via `/tools/blender/render_eclipse_wyrm.sh`.
- [ ] **4. Encode** (`next`):
  - Encode `/public/assets/store/eclipse-wyrm/` (and mirror `/assets/store/eclipse-wyrm/`): `avatar.webm` (`< 500 KB`), `avatar.mp4` (`< 700 KB`), `poster.webp` (`< 40 KB`), `CREDITS.md`, and verify loop closure `SSIM > 0.98`.
- [ ] **5. Store Row and Player** (`next`):
  - Add `eclipse-wyrm` (`category: 'avatar'`, `rarity: 'Mythic'`, `animated: true`, dynamically computed price `>= 1.5x` max existing item price and `>= 5000` Kobans, 14-day "NEW" badge, pinned first in Featured carousel) and wire the avatar video player.
- [ ] **6. Purchase Check** (`next`):
  - Verify purchase with a sufficient-balance non-admin test account and rejection with an insufficient-balance test account.
- [ ] **7. Self-Review** (`next`):
  - Extract 12 screenshots 100 ms apart, verify 40x40 circular crop readability, check file sizes, test dark/light themes and laptop/phone layouts on Commons and dashboard profile, and confirm existing items, Dragon, and `sovereign-of-the-black-sun` banner are untouched.
