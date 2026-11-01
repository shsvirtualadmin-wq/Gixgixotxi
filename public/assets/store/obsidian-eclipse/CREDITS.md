# Obsidian Eclipse (`obsidian-eclipse`) — Asset & Render Credits

- **Item ID**: `obsidian-eclipse`
- **Name**: Obsidian Eclipse
- **Category**: Profile Banner (`16:9`, `1200×675`)
- **Rarity**: Mythic (`2,100 Kobans`)
- **License**: 100% Procedural Original Artwork (Zero external 3D models or third-party textures)
- **Authoring & Runtime**:
  - Real-time 3D Three.js / WebGL component (`ObsidianEclipseBanner.tsx`) with custom GLSL volumetric god-ray & corona shaders, `MeshPhysicalMaterial` bevelled obsidian ring with glowing gold veins, 18 orbiting monolith slabs, and 1,200 depth-of-field embers.
  - Pre-rendered 180-frame (6.0s @ 30fps) seamless video loops (`banner.webm`, `banner.mp4`) + static hero poster (`poster.webp`) rendered at `1920×1080` and Lanczos3-downscaled to `1200×675`.
  - Offline Blender 4.x procedural generator script included in `/tools/blender/obsidian_eclipse.py` and `/tools/blender/render.sh`.

## File Weights & Loop Verification
- `banner.webm`: 637.5 KB (Budget: < 900 KB)
- `banner.mp4`: 1077.5 KB (Budget: < 1,200 KB)
- `poster.webp`: 67.1 KB (Budget: < 80 KB)
- **Loop SSIM (Frame 0 vs Frame 179)**: 0.9940
- **Periodic Identity SSIM (Frame 0 vs Frame 180)**: 1.0000
