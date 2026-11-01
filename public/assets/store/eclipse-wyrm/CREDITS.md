# Asset Credits — Eclipse Wyrm (`eclipse-wyrm`)

- **Creation Method**: 100% procedurally generated in Blender 4.2.3 LTS via `/tools/blender/eclipse_wyrm.py` (saved to `/tools/blender/eclipse_wyrm.blend`) and encoded via `/tools/blender/render_eclipse_wyrm.sh`.
- **External Models / Assets Used**: None (zero external meshes, textures, or third-party assets; no CC-BY attribution required).
- **License**: Proprietary / 100% Original Procedural Generation for Boardly Store.
- **Render Specifications**:
  - Render Engine: Blender 4.2.3 LTS Cycles (40 samples + Adaptive Sampling + OpenImageDenoise, 4 max bounces, raytraced shadows, optical DoF `f/2.4`, AgX/Filmic color management)
  - Render Resolution: `1024x1024` (1:1 square, downscaled to `512x512` via Lanczos)
  - Frame Count & Rate: `150` frames (`0-149`, `5.0s` seamless loop at `30 fps`)
  - Loop Seam Similarity: `All: 0.999829`
  - `avatar.webm`: `214336` bytes (VP9 two-pass, `512x512`, 30 fps)
  - `avatar.mp4`: `320350` bytes (H.264 `yuv420p`, `+faststart`, `512x512`, 30 fps)
  - `poster.webp`: `19640` bytes (WebP, `512x512`, hero frame `0045`)
