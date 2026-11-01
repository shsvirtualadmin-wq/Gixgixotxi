#!/usr/bin/env bash
# Boardly Store — Render & Encode Pipeline for "Obsidian Eclipse" (id: obsidian-eclipse)
# Uses Blender 4.x if available on the host, or falls back to the headless Three.js 1920x1080 -> 1200x675 renderer.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
OUT_PUBLIC="${ROOT_DIR}/public/assets/store/obsidian-eclipse"
OUT_MIRROR="${ROOT_DIR}/assets/store/obsidian-eclipse"
FRAMES_DIR="/tmp/obsidian_eclipse_frames"

mkdir -p "${OUT_PUBLIC}" "${OUT_MIRROR}" "${FRAMES_DIR}"

if command -v blender >/dev/null 2>&1; then
  echo "[render.sh] Blender found. Rendering 180 frames (0-179) at 1920x1080..."
  blender -b -P "${SCRIPT_DIR}/obsidian_eclipse.py" -- --frames 0-179 --out "${FRAMES_DIR}"

  echo "[render.sh] Encoding banner.webm (VP9, 1200x675, 30fps, two-pass, CRF 34)..."
  ffmpeg -y -framerate 30 -i "${FRAMES_DIR}/frame_%04d.png" \
    -vf "scale=1200:675:flags=lanczos" \
    -c:v libvpx-vp9 -b:v 0 -crf 34 -pix_fmt yuv420p -pass 1 -an -f null /dev/null
  ffmpeg -y -framerate 30 -i "${FRAMES_DIR}/frame_%04d.png" \
    -vf "scale=1200:675:flags=lanczos" \
    -c:v libvpx-vp9 -b:v 0 -crf 34 -pix_fmt yuv420p -pass 2 -an "${OUT_PUBLIC}/banner.webm"

  echo "[render.sh] Encoding banner.mp4 (H.264, yuv420p, +faststart, 1200x676)..."
  ffmpeg -y -framerate 30 -i "${FRAMES_DIR}/frame_%04d.png" \
    -vf "scale=1200:676:flags=lanczos" \
    -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart -an "${OUT_PUBLIC}/banner.mp4"

  echo "[render.sh] Encoding poster.webp..."
  ffmpeg -y -i "${FRAMES_DIR}/frame_0045.png" \
    -vf "scale=1200:675:flags=lanczos" \
    -c:v libwebp -quality 82 "${OUT_PUBLIC}/poster.webp"

  cp -f "${OUT_PUBLIC}/banner.webm" "${OUT_MIRROR}/banner.webm"
  cp -f "${OUT_PUBLIC}/banner.mp4" "${OUT_MIRROR}/banner.mp4"
  cp -f "${OUT_PUBLIC}/poster.webp" "${OUT_MIRROR}/poster.webp"
else
  echo "[render.sh] Blender CLI not installed on this container; running Three.js 1920x1080 -> 1200x675 render script..."
  node "${SCRIPT_DIR}/render_threejs_obsidian_eclipse.mjs"
fi
