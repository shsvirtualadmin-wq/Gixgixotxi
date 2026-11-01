# Pixel Pop Arcade Seamless Loop Fix Progress (`ban_pixel_pop_arcade` & `pfp_pixel_pop_arcade`)

## Step 1: Diagnosis of Current v1 Media & Player Setup (COMPLETED)

### 1.1 `ffprobe` & Frame-Level Seam Metrics on v1 Files
| File | Codec | Duration | Frame Count (`nb_read_frames`) | FPS | Audio Streams | `has_b_frames` | `MAD(last, first)` | `avg_adjacent_MAD` | Ratio (`seam / avg`) | `first_adj_MAD (0->1)` | `last_adj_MAD (N-2->N-1)` | `min_adj_MAD` | `max_adj_MAD` | `SSIM(last, first)` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ban_pixel_pop_arcade/banner.webm` | `vp9` | `5.000000s` | `120` | `24/1` | `0` | `0` | `0.0803` | `1.7433` | `0.046x` (DEAD STOP) | `0.0048` | `0.0160` | `0.0000` | `3.2980` | `0.998408` |
| `ban_pixel_pop_arcade/banner.mp4` | `h264` | `5.000000s` | `120` | `24/1` | `0` | `2` | `1.0956` | `1.6198` | `0.676x` | `0.0348` | `0.0199` | `0.0064` | `2.9479` | `0.977462` (`< 0.98`) |
| `pfp_pixel_pop_arcade/pfp.webm` | `vp9` | `3.000000s` | `72` | `24/1` | `0` | `0` | `0.9915` | `0.9805` | `1.011x` | `0.8896` | `1.0070` | `0.6104` | `1.4453` | `0.978332` (`< 0.98`) |
| `pfp_pixel_pop_arcade/pfp.mp4` | `h264` | `3.000000s` | `72` | `24/1` | `0` | `2` | `1.3960` | `0.9077` | `1.538x` (`> 1.2x` JUMP) | `1.0144` | `1.0063` | `0.6546` | `1.2467` | `0.959113` (`< 0.98`) |

### 1.2 Exact Causes Identified
1. **Banner (`ban_pixel_pop_arcade`) Ease-In/Ease-Out Phase Hold (`u_smooth`)**:
   - In `.render-cache/render_pixel_pop_arcade.py` (lines 550–553), the loop phase was warped through `u_smooth = t_norm - sin(2*pi*t_norm)/(2*pi)`.
   - Because the first derivative `du_smooth / dt_norm = 1 - cos(2*pi*t_norm)` equals **`0.0` at `t_norm = 0` and `t_norm = 1`**, every animated element decelerates to a complete stop (`min_adj_MAD = 0.0000`, `first_adj_MAD = 0.0048` vs `avg = 1.7433`) across the loop seam.
2. **PFP (`pfp_pixel_pop_arcade`) Short 3.0s Loop, Rapid Glint Sweep & Per-Frame Denoiser Jitter**:
   - At only `72` frames (`3.0s`), each frame step is `5°` of phase, causing `SSIM(last, first) = 0.978332` (`< 0.98` threshold) in WebM and `0.959113` (`MAD ratio = 1.538x > 1.2x`) in MP4.
   - Using `OPENIMAGEDENOISE` on Cycles glossy + area light glint sweep introduced slight frame-to-frame denoiser variance across the seam.
3. **Video Encoding B-Frames & GOP Settings**:
   - Both v1 MP4 files were encoded with `has_b_frames = 2` (default `libx264` B-frame reordering without `-bf 0 -g 48 -keyint_min 48 -sc_threshold 0 -avoid_negative_ts make_zero`).
   - Both v1 WebM files lacked `-auto-alt-ref 0 -g 48 -keyint_min 48 -sc_threshold 0`.
4. **HTML `<video>` Player Setup Check**:
   - Both `PixelPopArcadeBanner.tsx` and `PixelPopCubeAvatar` (`CosmeticRenderers.tsx`) use native `<video autoPlay loop muted playsInline preload="auto" poster={posterUrl}>` and do NOT use manual `onEnded` listeners, `currentTime = 0` seeks, or poster swaps. Shared player code (`pfpArtwork.tsx`, `StoreLoopVideo.tsx`) does not need any modifications.

---

## Step 2: Rebuild Both Animations as True 10-Second Loops (`240` Frames @ `24 fps`) (COMPLETED)
- [x] Created `.render-cache/render_pixel_pop_arcade_v2.py` (`1280x720`, `24 fps`, `N = 240` frames `0..239`, `10.000s` loop):
  - Driven strictly by linear phase `p = i / 240.0` (`theta = 2 * pi * p`), zero easing/holds.
  - Constant-speed arcade grid scroll of **2 grid cells per loop** wrapped modulo 1 cell (`((2.0 * p) % 1.0) * cell_size`).
  - Decal cubes (heart/smile) sway (`10°–11.5°` sine/cosine) and bob continuously; plain same-color cubes spin at constant angular speed (`90°` per loop in child local space) while swaying/bobbing.
  - Twinkles driven by `sin^2(pi * p * k + phase)` with integer `k`.
- [x] Created `.render-cache/render_pfp_pixel_pop_arcade_v2.py` (`512x512`, `24 fps`, `N = 240` frames `0..239`, `10.000s` loop):
  - Analytical noise-free shaders (0 temporal denoiser jitter) + linear phase `p = i / 240.0`.
  - Orthogonal elliptical bob/sway (`cos(theta)` on X, `sin(theta)` on Z) and orthogonal 3-axis sway (`10.5°–11.5°`) so 3D velocity never dips to zero at any frame.
  - Constant-speed circular specular glint sweep + `sin^2(pi * p * k + phase)` star twinkles.

---

## Step 3: Render Hero Frame, Seam Pair (`N-1` & `0`), and Full 240-Frame Sequences (IN PROGRESS)
- [x] Rendered and inspected side-by-side seam pairs (`.render-cache/seam_pair_banner_v2.png` and `.render-cache/seam_pair_pfp_v2.png`):
  - `ban_pixel_pop_arcade_v2` seam pair (`239 -> 0`): `MAD(0->1) = 0.6126`, `MAD(239->0) = 0.6581` (`ratio = 1.074x`), `SSIM(239, 0) = 0.980632` (`> 0.98`).
  - `pfp_pixel_pop_arcade_v2` seam pair (`239 -> 0`): `MAD(0->1) = 0.2983`, `MAD(239->0) = 0.3032` (`ratio = 1.017x`), `SSIM(239, 0) = 0.990725` (`> 0.98`).
- [ ] Full 240-frame (`0..239`) batch render running in background (`task-414`).
