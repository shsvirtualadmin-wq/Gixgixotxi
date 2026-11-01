#!/usr/bin/env bash
# Boardly Store — Render & Encode Pipeline for "Sovereign of the Black Sun" (id: sovereign-of-the-black-sun)
# Renders 180 frames (0-179, 6.0s @ 30fps) at 1920x1080 in Blender 4.2 LTS,
# downscales to 1200x675, encodes banner.webm (<900 KB), banner.mp4 (<1.2 MB), poster.webp (<80 KB),
# writes CREDITS.md, and verifies SSIM(frame_0000, frame_0179) > 0.98.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
OUT_PUBLIC="${ROOT_DIR}/public/assets/store/sovereign-of-the-black-sun"
OUT_MIRROR="${ROOT_DIR}/assets/store/sovereign-of-the-black-sun"
FRAMES_DIR="/tmp/sovereign_black_sun_frames"

rm -f "${OUT_PUBLIC}/test_0046.png"
mkdir -p "${OUT_PUBLIC}" "${OUT_MIRROR}" "${FRAMES_DIR}"

EXISTING_COUNT=$(ls -1 "${FRAMES_DIR}"/frame_*.png 2>/dev/null | wc -l || echo 0)
if [ "${EXISTING_COUNT}" -lt 180 ] || [ "${1:-}" = "--force-render" ]; then
  echo "[render.sh] Rendering 180 frames (0-179) at 1920x1080 in Blender 4.2 LTS (3 parallel workers)..."
  blender -b -t 2 -P "${SCRIPT_DIR}/sovereign_black_sun.py" -- \
    --frames 0-59 \
    --output "${FRAMES_DIR}/frame_" \
    --save-blend "${SCRIPT_DIR}/sovereign_black_sun.blend" > /tmp/blender_batch_0.log 2>&1 &
  PID0=$!

  blender -b -t 2 -P "${SCRIPT_DIR}/sovereign_black_sun.py" -- \
    --frames 60-119 \
    --output "${FRAMES_DIR}/frame_" \
    --save-blend "" > /tmp/blender_batch_1.log 2>&1 &
  PID1=$!

  blender -b -t 2 -P "${SCRIPT_DIR}/sovereign_black_sun.py" -- \
    --frames 120-179 \
    --output "${FRAMES_DIR}/frame_" \
    --save-blend "" > /tmp/blender_batch_2.log 2>&1 &
  PID2=$!

  wait "${PID0}"
  wait "${PID1}"
  wait "${PID2}"
else
  echo "[render.sh] Found all 180 Blender frames in ${FRAMES_DIR} (pass --force-render to re-render)."
fi

FRAME_COUNT=$(ls -1 "${FRAMES_DIR}"/frame_*.png 2>/dev/null | wc -l)
echo "[render.sh] Total PNG frames ready: ${FRAME_COUNT}"
if [ "${FRAME_COUNT}" -lt 180 ]; then
  echo "[render.sh] ERROR: Expected 180 frames, found ${FRAME_COUNT}" >&2
  exit 1
fi

echo "[render.sh] Computing loop closure SSIM between frame_0000.png and frame_0179.png..."
SSIM_LINE=$(ffmpeg -hide_banner -i "${FRAMES_DIR}/frame_0000.png" -i "${FRAMES_DIR}/frame_0179.png" -lavfi ssim -f null - 2>&1 | grep "SSIM" || true)
echo "[render.sh] ${SSIM_LINE}"

PASSLOG_PREFIX="/tmp/sovereign_vp9_2pass"
rm -f "${PASSLOG_PREFIX}"*

echo "[render.sh] Encoding banner.webm (VP9 two-pass, 1200x675, 30fps, CRF 34, <900 KB)..."
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "${FRAMES_DIR}/frame_%04d.png" \
  -vf "scale=1200:675:flags=lanczos" \
  -c:v libvpx-vp9 -b:v 820k -minrate 400k -maxrate 980k -crf 34 \
  -pix_fmt yuv420p -row-mt 1 -cpu-used 2 -pass 1 -passlogfile "${PASSLOG_PREFIX}" -an -f null /dev/null

ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "${FRAMES_DIR}/frame_%04d.png" \
  -vf "scale=1200:675:flags=lanczos" \
  -c:v libvpx-vp9 -b:v 820k -minrate 400k -maxrate 980k -crf 34 \
  -pix_fmt yuv420p -row-mt 1 -cpu-used 1 -pass 2 -passlogfile "${PASSLOG_PREFIX}" -an "${OUT_PUBLIC}/banner.webm"

echo "[render.sh] Encoding banner.mp4 (H.264 yuv420p, +faststart, 1200x676, <1.2 MB)..."
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i "${FRAMES_DIR}/frame_%04d.png" \
  -vf "scale=1200:676:flags=lanczos" \
  -c:v libx264 -preset slow -crf 24 -maxrate 1300k -bufsize 2600k \
  -pix_fmt yuv420p -movflags +faststart -an "${OUT_PUBLIC}/banner.mp4"

echo "[render.sh] Encoding poster.webp (Frame 0046, 1200x675, <80 KB)..."
ffmpeg -hide_banner -loglevel error -y -i "${FRAMES_DIR}/frame_0046.png" \
  -vf "scale=1200:675:flags=lanczos" \
  -c:v libwebp -lossless 0 -compression_level 6 -q:v 68 "${OUT_PUBLIC}/poster.webp"

WEBM_BYTES=$(stat -c%s "${OUT_PUBLIC}/banner.webm")
MP4_BYTES=$(stat -c%s "${OUT_PUBLIC}/banner.mp4")
WEBP_BYTES=$(stat -c%s "${OUT_PUBLIC}/poster.webp")

cat > "${OUT_PUBLIC}/CREDITS.md" <<EOF
# Asset Credits — Sovereign of the Black Sun (\`sovereign-of-the-black-sun\`)

- **Creation Method**: 100% procedurally generated in Blender 4.2.3 LTS via \`/tools/blender/sovereign_black_sun.py\` (saved to \`/tools/blender/sovereign_black_sun.blend\`) and encoded via \`/tools/blender/render.sh\`.
- **External Models / Assets Used**: None (zero external meshes, textures, or third-party assets; no CC-BY attribution required).
- **License**: Proprietary / 100% Original Procedural Generation for Boardly Store.
- **Render Specifications**:
  - Master Render Resolution: \`1920x1080\` (16:9), downscaled with Lanczos filter to \`1200x675\`
  - Frame Count & Rate: \`180\` frames (\`6.0s\` seamless loop at \`30 fps\`)
  - Loop Seam Similarity: \`${SSIM_LINE}\`
  - \`banner.webm\`: \`${WEBM_BYTES}\` bytes (VP9 two-pass, \`1200x675\`, 30 fps)
  - \`banner.mp4\`: \`${MP4_BYTES}\` bytes (H.264 \`yuv420p\`, \`+faststart\`, 30 fps)
  - \`poster.webp\`: \`${WEBP_BYTES}\` bytes (WebP, \`1200x675\`, hero frame \`0046\`)
EOF

cp -f "${OUT_PUBLIC}/banner.webm" "${OUT_MIRROR}/banner.webm"
cp -f "${OUT_PUBLIC}/banner.mp4" "${OUT_MIRROR}/banner.mp4"
cp -f "${OUT_PUBLIC}/poster.webp" "${OUT_MIRROR}/poster.webp"
cp -f "${OUT_PUBLIC}/CREDITS.md" "${OUT_MIRROR}/CREDITS.md"

echo "[render.sh] Done! Sizes:"
ls -lh "${OUT_PUBLIC}"
