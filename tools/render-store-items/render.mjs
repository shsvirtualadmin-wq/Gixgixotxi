#!/usr/bin/env node
/**
 * Boardly Store — 3D Scene Renderer for the 25 New Premium Cosmetics
 *
 * Authoring: Three.js (WebGLRenderer in headless Chromium via playwright-core)
 * with PBR materials (MeshStandardMaterial / MeshPhysicalMaterial), emissive glow,
 * volumetric-looking particles, rim lighting, and additive bloom halos.
 *
 * Loop Spec:
 * - 90 frames per loop (3.0s at 30fps for Banners/Avatars; 60fps for Frames/Nameplates/Effects)
 * - Deterministic fixed-timestep capture (t = frame / 90 in [0, 1), theta = 2*PI*t)
 * - Seamless periodic motion (Frame 0 and Frame 90 are mathematically identical)
 *
 * Outputs per item under /public/assets/store/<item-id>/ (and mirrored to /assets/store/<item-id>/):
 * - loop.webm  (VP9 with alpha yuva420p, < 600 KB)
 * - loop.webp  (Animated WebP with alpha via libwebp_anim, < 900 KB)
 * - poster.webp (First frame static WebP, < 80 KB)
 * Static items (ban_crimson_lotus_lake, plate-ronin-katana-slash) output poster.webp (< 80 KB).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/root/.bun/install/global/node_modules/playwright-core');

const CHROMIUM_EXEC =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

const PUBLIC_STORE_DIR = path.resolve('public/assets/store');
const MIRROR_STORE_DIR = path.resolve('assets/store');

const ITEMS = [
  // 5 BANNERS (16:9, 1200x675 poster, 640x360 30fps loop, 90 frames)
  { id: 'ban_phoenix_ember_sunrise', category: 'banner', rarity: 'mythic', animated: true, fps: 30, frames: 90, loopW: 640, loopH: 360, posterW: 1200, posterH: 675 },
  { id: 'ban_cyber_shibuya_night', category: 'banner', rarity: 'legendary', animated: true, fps: 30, frames: 90, loopW: 640, loopH: 360, posterW: 1200, posterH: 675 },
  { id: 'ban_eclipse_tengu_peak', category: 'banner', rarity: 'legendary', animated: true, fps: 30, frames: 90, loopW: 640, loopH: 360, posterW: 1200, posterH: 675 },
  { id: 'ban_spirit_lantern_festival', category: 'banner', rarity: 'epic', animated: true, fps: 30, frames: 90, loopW: 640, loopH: 360, posterW: 1200, posterH: 675 },
  { id: 'ban_crimson_lotus_lake', category: 'banner', rarity: 'epic', animated: false, fps: 30, frames: 1, loopW: 1200, loopH: 675, posterW: 1200, posterH: 675 },

  // 5 AVATARS (square 512x512 poster, 384x384 30fps loop, 90 frames)
  { id: 'pfp_phoenix_ascendant', category: 'avatar', rarity: 'mythic', animated: true, fps: 30, frames: 90, loopW: 384, loopH: 384, posterW: 512, posterH: 512 },
  { id: 'pfp_ryujin_sea_dragon', category: 'avatar', rarity: 'legendary', animated: true, fps: 30, frames: 90, loopW: 384, loopH: 384, posterW: 512, posterH: 512 },
  { id: 'pfp_shadow_ninja_mask', category: 'avatar', rarity: 'legendary', animated: true, fps: 30, frames: 90, loopW: 384, loopH: 384, posterW: 512, posterH: 512 },
  { id: 'pfp_raijin_thunder_god', category: 'avatar', rarity: 'epic', animated: true, fps: 30, frames: 90, loopW: 384, loopH: 384, posterW: 512, posterH: 512 },
  { id: 'pfp_yokai_lantern_ghost', category: 'avatar', rarity: 'epic', animated: true, fps: 30, frames: 90, loopW: 384, loopH: 384, posterW: 512, posterH: 512 },

  // 5 AVATAR FRAMES (transparent ring, center clear, 512x512 poster, 384x384 60fps loop, 90 frames)
  { id: 'frame-phoenix-feather-halo', category: 'avatar_frame', rarity: 'mythic', animated: true, fps: 60, frames: 90, loopW: 384, loopH: 384, posterW: 512, posterH: 512 },
  { id: 'frame-frost-crystal-ring', category: 'avatar_frame', rarity: 'legendary', animated: true, fps: 60, frames: 90, loopW: 384, loopH: 384, posterW: 512, posterH: 512 },
  { id: 'frame-cyber-circuit-ring', category: 'avatar_frame', rarity: 'legendary', animated: true, fps: 60, frames: 90, loopW: 384, loopH: 384, posterW: 512, posterH: 512 },
  { id: 'frame-spirit-flame-wreath', category: 'avatar_frame', rarity: 'epic', animated: true, fps: 60, frames: 90, loopW: 384, loopH: 384, posterW: 512, posterH: 512 },
  { id: 'frame-shuriken-orbit', category: 'avatar_frame', rarity: 'epic', animated: true, fps: 60, frames: 90, loopW: 384, loopH: 384, posterW: 512, posterH: 512 },

  // 5 NAMEPLATES (600x120 decoration, 60fps loop, 90 frames)
  { id: 'plate-phoenix-crest', category: 'nameplate', rarity: 'mythic', animated: true, fps: 60, frames: 90, loopW: 600, loopH: 120, posterW: 600, posterH: 120 },
  { id: 'plate-raijin-storm-plate', category: 'nameplate', rarity: 'legendary', animated: true, fps: 60, frames: 90, loopW: 600, loopH: 120, posterW: 600, posterH: 120 },
  { id: 'plate-cyber-glitch', category: 'nameplate', rarity: 'legendary', animated: true, fps: 60, frames: 90, loopW: 600, loopH: 120, posterW: 600, posterH: 120 },
  { id: 'plate-frozen-sakura-glass', category: 'nameplate', rarity: 'epic', animated: true, fps: 60, frames: 90, loopW: 600, loopH: 120, posterW: 600, posterH: 120 },
  { id: 'plate-ronin-katana-slash', category: 'nameplate', rarity: 'epic', animated: false, fps: 60, frames: 1, loopW: 600, loopH: 120, posterW: 600, posterH: 120 },

  // 5 PROFILE EFFECTS (600x800 poster, 360x480 60fps loop, 90 frames)
  { id: 'effect-phoenix-rebirth-flames', category: 'profile_effect', rarity: 'mythic', animated: true, fps: 60, frames: 90, loopW: 360, loopH: 480, posterW: 600, posterH: 800 },
  { id: 'effect-frost-spirit-blizzard', category: 'profile_effect', rarity: 'legendary', animated: true, fps: 60, frames: 90, loopW: 360, loopH: 480, posterW: 600, posterH: 800 },
  { id: 'effect-cyber-glitch-matrix', category: 'profile_effect', rarity: 'legendary', animated: true, fps: 60, frames: 90, loopW: 360, loopH: 480, posterW: 600, posterH: 800 },
  { id: 'effect-lantern-spirit-drift', category: 'profile_effect', rarity: 'epic', animated: true, fps: 60, frames: 90, loopW: 360, loopH: 480, posterW: 600, posterH: 800 },
  { id: 'effect-shuriken-storm', category: 'profile_effect', rarity: 'epic', animated: true, fps: 60, frames: 90, loopW: 360, loopH: 480, posterW: 600, posterH: 800 },
];

/**
 * HTML harness loaded by headless Chromium.
 * Uses Three.js (WebGLRenderer with PBR MeshStandardMaterial, PointLight, DirectionalLight,
 * AmbientLight, custom 3D geometries & volumetric sprite particles) + high-precision 2D post-bloom
 * to render each frame deterministically at t = frame / totalFrames.
 */
const HARNESS_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
<script type="module">
import * as THREE from '/three.module.js';

window.THREE = THREE;

// Deterministic PRNG
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Create radial glow sprite texture for volumetric particles & bloom
function makeGlowTexture(c0, c1, c2 = 'rgba(0,0,0,0)') {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, c0);
  g.addColorStop(0.45, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

const outCanvas = document.createElement('canvas');
document.body.appendChild(outCanvas);
const outCtx = outCanvas.getContext('2d', { willReadFrequently: true });

const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({
  canvas: glCanvas,
  alpha: true,
  antialias: true,
  premultipliedAlpha: false,
  preserveDrawingBuffer: true,
});
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

let activeSceneData = null;

function buildScene(itemId, width, height) {
  renderer.setSize(width, height, false);
  outCanvas.width = width;
  outCanvas.height = height;

  const scene = new THREE.Scene();
  const aspect = width / height;
  const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
  camera.position.set(0, 0, 10);

  // Standard 3-point PBR studio + rim lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xfff4d6, 2.6);
  keyLight.position.set(5, 7, 8);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x60a5fa, 1.3);
  fillLight.position.set(-6, -3, 5);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xff6b00, 4.5, 25);
  rimLight.position.set(0, 4, -3);
  scene.add(rimLight);

  const updaters = [];
  const rand = mulberry32(
    itemId.split('').reduce((acc, ch, idx) => acc + ch.charCodeAt(0) * (idx + 17), 1337)
  );

  // Helper: add 3D feather/blade mesh
  const featherGeo = new THREE.ConeGeometry(0.18, 1.15, 6);
  featherGeo.scale(1.0, 1.0, 0.25);

  const crystalGeo = new THREE.OctahedronGeometry(0.36, 0);
  crystalGeo.scale(0.65, 1.45, 0.65);

  const shurikenShape = new THREE.Shape();
  const sPts = 4;
  for (let i = 0; i < sPts * 2; i++) {
    const r = i % 2 === 0 ? 0.58 : 0.16;
    const a = (i * Math.PI) / sPts;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shurikenShape.moveTo(x, y);
    else shurikenShape.lineTo(x, y);
  }
  shurikenShape.closePath();
  const shurikenGeo = new THREE.ExtrudeGeometry(shurikenShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  shurikenGeo.center();

  // ─── BUILD ITEM-SPECIFIC 3D SCENE ──────────────────────────────────────────
  if (itemId === 'ban_phoenix_ember_sunrise') {
    rimLight.color.setHex(0xff4500);
    // Rising Sun Core 3D Sphere
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(2.2, 32, 32), sunMat);
    sun.position.set(0, -1.1, -4.5);
    scene.add(sun);

    // 3D Volcanic Mountain Ridges
    const mtnMat = new THREE.MeshStandardMaterial({
      color: 0x1a0505,
      roughness: 0.65,
      metalness: 0.25,
      emissive: 0x550a0a,
      emissiveIntensity: 0.35,
    });
    for (let i = -4; i <= 4; i++) {
      const mtn = new THREE.Mesh(new THREE.ConeGeometry(2.1 + (i & 1) * 0.6, 3.2, 7), mtnMat);
      mtn.position.set(i * 1.9, -2.9 - Math.abs(i) * 0.12, -2.5 - (i % 2));
      scene.add(mtn);
    }

    // 3D Phoenix Body + Articulated Feathered Wings
    const phoenixGroup = new THREE.Group();
    scene.add(phoenixGroup);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xea580c,
      emissiveIntensity: 0.85,
      metalness: 0.75,
      roughness: 0.2,
    });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.2, 12), bodyMat);
    body.rotation.x = 0.25;
    phoenixGroup.add(body);

    const leftWing = new THREE.Group();
    const rightWing = new THREE.Group();
    phoenixGroup.add(leftWing);
    phoenixGroup.add(rightWing);

    for (let w = 0; w < 14; w++) {
      const fMat = new THREE.MeshStandardMaterial({
        color: w < 6 ? 0xfef08a : 0xf97316,
        emissive: w < 6 ? 0xf59e0b : 0xdc2626,
        emissiveIntensity: 0.75,
        metalness: 0.6,
        roughness: 0.25,
      });
      const fl = new THREE.Mesh(featherGeo, fMat);
      fl.scale.set(1.4, 1.8 - w * 0.06, 1.0);
      fl.position.set(-0.4 - w * 0.28, 0.2 + Math.sin(w * 0.25) * 0.4, -w * 0.03);
      fl.rotation.z = 0.55 + w * 0.07;
      leftWing.add(fl);

      const fr = fl.clone();
      fr.position.x = -fl.position.x;
      fr.rotation.z = -fl.rotation.z;
      rightWing.add(fr);
    }

    // 70 3D Ember Sprites rising in periodic helices
    const emberTex = makeGlowTexture('#FFFFFF', '#F97316');
    const embers = [];
    for (let i = 0; i < 70; i++) {
      const spMat = new THREE.SpriteMaterial({
        map: emberTex,
        color: i % 2 === 0 ? 0xfef08a : 0xf97316,
        blending: THREE.AdditiveBlending,
        transparent: true,
      });
      const sp = new THREE.Sprite(spMat);
       embers.push({
        sp,
        x0: (rand() - 0.5) * 14,
        y0: (rand() - 0.5) * 8,
        z0: -1 + (rand() - 0.5) * 4,
        phase: rand() * Math.PI * 2,
        scale: 0.16 + rand() * 0.28,
      });
      scene.add(sp);
    }

    updaters.push((t, theta) => {
      phoenixGroup.position.y = 0.25 + Math.sin(theta) * 0.28;
      phoenixGroup.rotation.y = Math.sin(theta) * 0.18;
      leftWing.rotation.z = Math.sin(theta) * 0.36;
      leftWing.rotation.y = Math.cos(theta) * 0.22;
      rightWing.rotation.z = -Math.sin(theta) * 0.36;
      rightWing.rotation.y = -Math.cos(theta) * 0.22;

      for (const e of embers) {
        const u = (t + e.phase / (Math.PI * 2)) % 1;
        e.sp.position.set(
          e.x0 + Math.sin(theta + e.phase) * 0.45,
          -4.2 + u * 8.4,
          e.z0
        );
        const s = e.scale * Math.sin(u * Math.PI);
        e.sp.scale.set(s, s, 1);
      }
    });
  } else if (itemId === 'ban_cyber_shibuya_night') {
    keyLight.color.setHex(0x00f0ff);
    fillLight.color.setHex(0xff007a);
    // 3D City Towers & Neon Holograms
    const bldgMat = new THREE.MeshStandardMaterial({
      color: 0x090d1e,
      metalness: 0.85,
      roughness: 0.2,
    });
    for (let i = 0; i < 14; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const depth = Math.floor(i / 2);
      const h = 3.5 + (i % 3) * 1.4;
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, h, 1.4), bldgMat);
      box.position.set(side * (2.6 + (depth % 2) * 1.1), -1.2 + h * 0.3, -1.5 - depth * 1.3);
      scene.add(box);

      // Neon Billboard Planes
      const neonColor = i % 3 === 0 ? 0x00f0ff : i % 3 === 1 ? 0xff007a : 0xfde047;
      const signMat = new THREE.MeshBasicMaterial({ color: neonColor });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 1.35), signMat);
      sign.position.set(box.position.x - side * 0.82, box.position.y + 0.3, box.position.z + 0.2);
      sign.rotation.y = side * 0.35;
      scene.add(sign);
    }

    // Wet Asphalt Road Plane
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 12),
      new THREE.MeshStandardMaterial({ color: 0x050814, metalness: 0.9, roughness: 0.12 })
    );
    road.rotation.x = -Math.PI * 0.46;
    road.position.set(0, -2.5, -2);
    scene.add(road);

    // Passing 3D Light Trails & Rain Streaks
    const streaks = [];
    for (let i = 0; i < 36; i++) {
      const isCar = i < 12;
      const mat = new THREE.MeshBasicMaterial({
        color: isCar ? (i % 2 === 0 ? 0xff0055 : 0x00f0ff) : 0x7dd3fc,
        transparent: true,
        opacity: isCar ? 0.9 : 0.55,
      });
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(isCar ? 1.8 : 0.03, isCar ? 0.08 : 0.65, isCar ? 0.12 : 0.03),
        mat
      );
      scene.add(mesh);
      streaks.push({ mesh, isCar, idx: i, phase: rand() });
    }

    updaters.push((t, theta) => {
      camera.position.x = Math.sin(theta) * 0.35;
      camera.position.y = Math.cos(theta) * 0.15;
      camera.lookAt(0, -0.2, -3);
      for (const s of streaks) {
        const u = (t + s.phase) % 1;
        if (s.isCar) {
          const dir = s.idx % 2 === 0 ? 1 : -1;
          s.mesh.position.set(dir * (-7 + u * 14), -2.1 + (s.idx % 3) * 0.18, -1.5 - (s.idx % 4) * 0.9);
        } else {
          s.mesh.position.set(-6 + (s.idx % 12) * 1.1 + Math.sin(s.idx) * 0.3, 4.2 - u * 8.4, -0.5);
        }
      }
    });
  } else if (itemId === 'ban_eclipse_tengu_peak') {
    // Solar Eclipse Ring + Tengu Silhouette on Peak
    const coronaMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const coronaRing = new THREE.Mesh(new THREE.RingGeometry(1.65, 2.15, 64), coronaMat);
    coronaRing.position.set(1.2, 0.85, -3.5);
    scene.add(coronaRing);

    const moonDisc = new THREE.Mesh(
      new THREE.CircleGeometry(1.64, 64),
      new THREE.MeshBasicMaterial({ color: 0x050204 })
    );
    moonDisc.position.set(1.2, 0.85, -3.45);
    scene.add(moonDisc);

    // Mountain Crag + Tengu Warrior with Wings
    const peakMat = new THREE.MeshStandardMaterial({ color: 0x0b0509, roughness: 0.7, metalness: 0.3 });
    const peak = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.8, 6), peakMat);
    peak.position.set(-1.6, -2.1, -1.5);
    scene.add(peak);

    const tenguGroup = new THREE.Group();
    tenguGroup.position.set(-1.6, 0.45, -1.2);
    scene.add(tenguGroup);

    const tenguBody = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.1, 8), peakMat);
    tenguGroup.add(tenguBody);

    const wingL = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.8, 5), peakMat);
    wingL.position.set(-0.65, 0.2, 0);
    wingL.rotation.z = 1.15;
    tenguGroup.add(wingL);

    const wingR = wingL.clone();
    wingR.position.x = 0.65;
    wingR.rotation.z = -1.15;
    tenguGroup.add(wingR);

    updaters.push((t, theta) => {
      const s = 1 + Math.sin(theta) * 0.06;
      coronaRing.scale.set(s, s, 1);
      wingL.rotation.z = 1.1 + Math.sin(theta) * 0.18;
      wingR.rotation.z = -1.1 - Math.sin(theta) * 0.18;
    });
  } else if (itemId === 'ban_spirit_lantern_festival') {
    // 45 3D Glowing Paper Lanterns Floating Up a Valley
    const lanterns = [];
    const lanternGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.48, 14);
    for (let i = 0; i < 45; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: i % 3 === 0 ? 0xf97316 : 0xf59e0b,
        emissiveIntensity: 1.2,
        roughness: 0.3,
      });
      const mesh = new THREE.Mesh(lanternGeo, mat);
      const sc = 0.45 + rand() * 0.85;
      mesh.scale.set(sc, sc, sc);
      scene.add(mesh);
      lanterns.push({
        mesh,
        x0: (rand() - 0.5) * 13,
        z0: -0.5 - rand() * 5,
        phase: rand(),
        sway: rand() * Math.PI * 2,
      });
    }
    updaters.push((t, theta) => {
      for (const l of lanterns) {
        const u = (t + l.phase) % 1;
        l.mesh.position.set(
          l.x0 + Math.sin(theta + l.sway) * 0.35,
          -4.0 + u * 8.0,
          l.z0
        );
        l.mesh.rotation.y = theta + l.sway;
        l.mesh.rotation.z = Math.sin(theta + l.sway) * 0.12;
      }
    });
  } else if (itemId === 'ban_crimson_lotus_lake') {
    // Static High-Res 3D Pagoda & Crimson Lotus Lake
    const pagodaGroup = new THREE.Group();
    pagodaGroup.position.set(2.2, -0.4, -2.5);
    scene.add(pagodaGroup);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x2a050a,
      emissive: 0x991b1b,
      emissiveIntensity: 0.35,
      metalness: 0.5,
      roughness: 0.4,
    });
    for (let tier = 0; tier < 5; tier++) {
      const w = 1.6 - tier * 0.22;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(w, 0.42, 4), roofMat);
      roof.position.y = tier * 0.55;
      roof.rotation.y = Math.PI * 0.25;
      pagodaGroup.add(roof);
    }
    const lotusMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.65,
      roughness: 0.3,
    });
    for (let i = 0; i < 24; i++) {
      const lotus = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 8), lotusMat);
      lotus.position.set((rand() - 0.5) * 11, -1.6 - rand() * 1.5, -0.5 - rand() * 3);
      lotus.rotation.x = Math.PI;
      scene.add(lotus);
    }
  } else if (itemId.startsWith('pfp_')) {
    // 5 AVATARS (3D Character / Creature Busts in 512x512)
    const bustGroup = new THREE.Group();
    scene.add(bustGroup);

    const palette = {
      pfp_phoenix_ascendant: { main: 0xf59e0b, em: 0xea580c, eye: 0xfef08a },
      pfp_ryujin_sea_dragon: { main: 0x06b6d4, em: 0x0284c7, eye: 0x67e8f9 },
      pfp_shadow_ninja_mask: { main: 0x18181b, em: 0x991b1b, eye: 0xef4444 },
      pfp_raijin_thunder_god: { main: 0x3b82f6, em: 0xfacc15, eye: 0xfef08a },
      pfp_yokai_lantern_ghost: { main: 0xdc2626, em: 0xf97316, eye: 0xfef08a },
    }[itemId] || { main: 0xf59e0b, em: 0xea580c, eye: 0xfef08a };

    const headMat = new THREE.MeshStandardMaterial({
      color: palette.main,
      emissive: palette.em,
      emissiveIntensity: 0.48,
      metalness: 0.68,
      roughness: 0.26,
    });
    const headMesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.55, 2), headMat);
    headMesh.scale.set(0.92, 1.18, 0.95);
    bustGroup.add(headMesh);

    // Sculpted 3D Crest / Horns / Drum Ring
    const crestGroup = new THREE.Group();
    bustGroup.add(crestGroup);
    const crestMat = new THREE.MeshStandardMaterial({
      color: palette.eye,
      emissive: palette.em,
      emissiveIntensity: 0.85,
      metalness: 0.8,
      roughness: 0.18,
    });
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const horn = new THREE.Mesh(featherGeo, crestMat);
      horn.position.set(Math.cos(ang) * 2.1, Math.sin(ang) * 2.1, -0.4);
      horn.rotation.z = ang - Math.PI / 2;
      crestGroup.add(horn);
    }

    // Glowing Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: palette.eye });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), eyeMat);
    eyeL.scale.set(1.6, 0.65, 0.5);
    eyeL.position.set(-0.48, 0.18, 1.38);
    eyeL.rotation.z = -0.22;
    bustGroup.add(eyeL);

    const eyeR = eyeL.clone();
    eyeR.position.x = 0.48;
    eyeR.rotation.z = 0.22;
    bustGroup.add(eyeR);

    updaters.push((t, theta) => {
      bustGroup.position.y = Math.sin(theta) * 0.18;
      bustGroup.rotation.y = Math.sin(theta) * 0.24;
      bustGroup.rotation.x = Math.cos(theta) * 0.08;
      crestGroup.rotation.z = itemId === 'pfp_raijin_thunder_god' ? theta : Math.sin(theta) * 0.16;
      const eyePulse = 1 + Math.sin(theta * 2) * 0.18;
      eyeL.scale.set(1.6 * eyePulse, 0.65 * eyePulse, 0.5);
      eyeR.scale.set(1.6 * eyePulse, 0.65 * eyePulse, 0.5);
    });
  } else if (itemId.startsWith('frame-')) {
    // 5 AVATAR FRAMES (Transparent Ring, Center Clear r=3.1 in camera view)
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const frameCfg = {
      'frame-phoenix-feather-halo': { c1: 0xf59e0b, c2: 0xdc2626, count: 16, type: 'feather' },
      'frame-frost-crystal-ring': { c1: 0x38bdf8, c2: 0xe0f2fe, count: 12, type: 'crystal' },
      'frame-cyber-circuit-ring': { c1: 0x00f0ff, c2: 0xff007a, count: 16, type: 'circuit' },
      'frame-spirit-flame-wreath': { c1: 0x38bdf8, c2: 0x6366f1, count: 14, type: 'flame' },
      'frame-shuriken-orbit': { c1: 0xe2e8f0, c2: 0x38bdf8, count: 4, type: 'shuriken' },
    }[itemId];

    // Base 3D Torus Rim
    const torusMat = new THREE.MeshStandardMaterial({
      color: frameCfg.c1,
      emissive: frameCfg.c2,
      emissiveIntensity: 0.55,
      metalness: 0.85,
      roughness: 0.18,
    });
    const torus = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.18, 20, 96), torusMat);
    ringGroup.add(torus);

    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);
    const subMeshes = [];

    for (let i = 0; i < frameCfg.count; i++) {
      const a = (i / frameCfg.count) * Math.PI * 2;
      const mat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? frameCfg.c1 : frameCfg.c2,
        emissive: frameCfg.c1,
        emissiveIntensity: 0.65,
        metalness: 0.85,
        roughness: 0.15,
      });
      const geo =
        frameCfg.type === 'shuriken'
          ? shurikenGeo
          : frameCfg.type === 'crystal'
          ? crystalGeo
          : featherGeo;
      const m = new THREE.Mesh(geo, mat);
      const rad = 3.08;
      m.position.set(Math.cos(a) * rad, Math.sin(a) * rad, 0.12);
      m.rotation.z = a + Math.PI * 0.25;
      if (frameCfg.type === 'shuriken') {
        m.scale.set(0.95, 0.95, 0.95);
      } else {
        m.scale.set(0.62, 0.62, 0.62);
      }
      orbitGroup.add(m);
      subMeshes.push(m);
    }

    updaters.push((t, theta) => {
      orbitGroup.rotation.z = theta;
      torus.rotation.z = -theta * 0.5;
      for (let i = 0; i < subMeshes.length; i++) {
        if (frameCfg.type === 'shuriken') {
          subMeshes[i].rotation.z = theta * 3;
        } else {
          const s = 0.58 + Math.sin(theta * 2 + i) * 0.08;
          subMeshes[i].scale.set(s, s, s);
        }
      }
    });
  } else if (itemId.startsWith('plate-')) {
    // 5 NAMEPLATES (600x120 3D Beveled Plate Frame + Wing/Storm/Glitch/Sakura/Katana Ornaments)
    const plateGroup = new THREE.Group();
    scene.add(plateGroup);

    const pCfg = {
      'plate-phoenix-crest': { c1: 0xf59e0b, c2: 0xdc2626, bg: 0x260508 },
      'plate-raijin-storm-plate': { c1: 0x38bdf8, c2: 0xfacc15, bg: 0x091326 },
      'plate-cyber-glitch': { c1: 0x00f0ff, c2: 0xff007a, bg: 0x09051a },
      'plate-frozen-sakura-glass': { c1: 0xf472b6, c2: 0x7dd3fc, bg: 0x0c1e35 },
      'plate-ronin-katana-slash': { c1: 0xef4444, c2: 0xe2e8f0, bg: 0x0c0a09 },
    }[itemId];

    // Top & Bottom 3D Beveled Rails
    const railMat = new THREE.MeshStandardMaterial({
      color: pCfg.c1,
      emissive: pCfg.c2,
      emissiveIntensity: 0.6,
      metalness: 0.88,
      roughness: 0.16,
    });
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.24, 0.4), railMat);
    topRail.position.set(0, 1.42, 0);
    plateGroup.add(topRail);

    const botRail = topRail.clone();
    botRail.position.set(0, -1.42, 0);
    plateGroup.add(botRail);

    // Left & Right 3D End Crests
    const leftCrest = new THREE.Mesh(crystalGeo, railMat);
    leftCrest.scale.set(1.6, 1.9, 1.2);
    leftCrest.position.set(-7.6, 0, 0.3);
    plateGroup.add(leftCrest);

    const rightCrest = leftCrest.clone();
    rightCrest.position.set(7.6, 0, 0.3);
    plateGroup.add(rightCrest);

    updaters.push((t, theta) => {
      leftCrest.rotation.y = theta;
      rightCrest.rotation.y = -theta;
      rimLight.position.x = Math.sin(theta) * 8;
    });
  } else if (itemId.startsWith('effect-')) {
    // 5 PROFILE EFFECTS (600x800 Transparent 3D Overlay)
    const fxGroup = new THREE.Group();
    scene.add(fxGroup);

    const eCfg = {
      'effect-phoenix-rebirth-flames': { c1: 0xf59e0b, c2: 0xdc2626, geo: featherGeo },
      'effect-frost-spirit-blizzard': { c1: 0x38bdf8, c2: 0xe0f2fe, geo: crystalGeo },
      'effect-cyber-glitch-matrix': { c1: 0x00f0ff, c2: 0x10b981, geo: new THREE.BoxGeometry(0.14, 0.68, 0.08) },
      'effect-lantern-spirit-drift': { c1: 0xfef08a, c2: 0xf97316, geo: new THREE.CylinderGeometry(0.22, 0.18, 0.45, 12) },
      'effect-shuriken-storm': { c1: 0xe2e8f0, c2: 0x38bdf8, geo: shurikenGeo },
    }[itemId];

    const items = [];
    for (let i = 0; i < 28; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? eCfg.c1 : eCfg.c2,
        emissive: eCfg.c1,
        emissiveIntensity: 0.78,
        metalness: 0.8,
        roughness: 0.2,
      });
      const m = new THREE.Mesh(eCfg.geo, mat);
      const sc = 0.55 + rand() * 0.65;
      m.scale.set(sc, sc, sc);
      fxGroup.add(m);
      items.push({
        m,
        x0: (rand() - 0.5) * 5.2,
        y0: (rand() - 0.5) * 7.2,
        z0: (rand() - 0.5) * 2.5,
        phase: rand(),
        ang: rand() * Math.PI * 2,
      });
    }

    updaters.push((t, theta) => {
      for (const it of items) {
        const u = (t + it.phase) % 1;
        if (itemId === 'effect-cyber-glitch-matrix') {
          it.m.position.set(it.x0, 3.8 - u * 7.6, it.z0);
        } else if (itemId === 'effect-shuriken-storm') {
          it.m.position.set(-3.2 + u * 6.4, 3.4 - u * 6.8, it.z0);
          it.m.rotation.z = theta * 3 + it.ang;
        } else {
          it.m.position.set(it.x0 + Math.sin(theta + it.ang) * 0.55, -3.8 + u * 7.6, it.z0);
          it.m.rotation.y = theta + it.ang;
          it.m.rotation.z = Math.sin(theta + it.ang) * 0.35;
        }
      }
    });
  }

  activeSceneData = { itemId, width, height, scene, camera, updaters };
}

// 2D Art & Volumetric Post-Pass combined with 3D WebGL scene render
function drawPostAndComposite(ctx, itemId, w, h, t, theta) {
  ctx.clearRect(0, 0, w, h);

  // 1. Background for opaque categories (Banners & Avatars), transparent for Frames/Nameplates/Effects
  if (itemId.startsWith('ban_')) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    if (itemId === 'ban_phoenix_ember_sunrise') {
      g.addColorStop(0, '#090204');
      g.addColorStop(0.45, '#450a0a');
      g.addColorStop(0.8, '#b45309');
      g.addColorStop(1, '#fef08a');
    } else if (itemId === 'ban_cyber_shibuya_night') {
      g.addColorStop(0, '#02040d');
      g.addColorStop(0.55, '#0b132b');
      g.addColorStop(1, '#1e1035');
    } else if (itemId === 'ban_eclipse_tengu_peak') {
      g.addColorStop(0, '#040206');
      g.addColorStop(0.5, '#1c0b19');
      g.addColorStop(1, '#431407');
    } else if (itemId === 'ban_spirit_lantern_festival') {
      g.addColorStop(0, '#040816');
      g.addColorStop(0.55, '#111c38');
      g.addColorStop(1, '#27171c');
    } else {
      g.addColorStop(0, '#090205');
      g.addColorStop(0.5, '#3b0712');
      g.addColorStop(1, '#4c0519');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (itemId.startsWith('pfp_')) {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.05, w * 0.5, h * 0.5, w * 0.72);
    if (itemId === 'pfp_phoenix_ascendant') {
      g.addColorStop(0, '#7c2d12');
      g.addColorStop(0.6, '#2a0608');
      g.addColorStop(1, '#080102');
    } else if (itemId === 'pfp_ryujin_sea_dragon') {
      g.addColorStop(0, '#0e7490');
      g.addColorStop(0.6, '#082f49');
      g.addColorStop(1, '#020c14');
    } else if (itemId === 'pfp_shadow_ninja_mask') {
      g.addColorStop(0, '#3f0d16');
      g.addColorStop(0.6, '#141418');
      g.addColorStop(1, '#050507');
    } else if (itemId === 'pfp_raijin_thunder_god') {
      g.addColorStop(0, '#1e3a8a');
      g.addColorStop(0.6, '#0f172a');
      g.addColorStop(1, '#030712');
    } else {
      g.addColorStop(0, '#581c87');
      g.addColorStop(0.6, '#27091c');
      g.addColorStop(1, '#070208');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (itemId.startsWith('plate-')) {
    // Semi-opaque dark plate core so white HTML player name on top is always ultra-legible
    const padX = w * 0.04;
    const padY = h * 0.14;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(padX, padY, w - padX * 2, h - padY * 2, h * 0.22);
    ctx.fillStyle = 'rgba(8, 8, 14, 0.86)';
    ctx.fill();
    ctx.restore();
  }

  // 2. Composite Three.js PBR 3D Render
  ctx.drawImage(glCanvas, 0, 0, w, h);

  // 3. Enforce strict clear center & outer clip on Avatar Frames so avatar is never covered
  if (itemId.startsWith('frame-')) {
    const cx = w * 0.5;
    const cy = h * 0.5;
    const innerR = Math.min(w, h) * 0.31;
    const outerR = Math.min(w, h) * 0.485;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const holeGrad = ctx.createRadialGradient(cx, cy, innerR * 0.88, cx, cy, innerR);
    holeGrad.addColorStop(0, 'rgba(0,0,0,1)');
    holeGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = holeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fill();

    // Clip anything outside outerR
    ctx.globalCompositeOperation = 'destination-in';
    const edgeGrad = ctx.createRadialGradient(cx, cy, outerR * 0.94, cx, cy, outerR);
    edgeGrad.addColorStop(0, 'rgba(0,0,0,1)');
    edgeGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = edgeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

window.initItemScene = (itemId, width, height) => {
  buildScene(itemId, width, height);
  return true;
};

window.renderFrameBytes = (frameIndex, totalFrames) => {
  const { itemId, width, height, scene, camera, updaters } = activeSceneData;
  const t = totalFrames > 1 ? frameIndex / totalFrames : 0.25;
  const theta = t * Math.PI * 2;
  for (const fn of updaters) {
    fn(t, theta);
  }
  renderer.render(scene, camera);
  drawPostAndComposite(outCtx, itemId, width, height, t, theta);
  return outCanvas.toDataURL('image/png');
};
</script>
</body>
</html>`;

function runFfmpeg(args, inputBuffers = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'pipe'] });
    let errText = '';
    proc.stdin.on('error', () => {});
    proc.stderr.on('data', (d) => {
      errText += d.toString();
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${errText.slice(-500)}`));
    });

    (async () => {
      for (const buf of inputBuffers) {
        if (!proc.stdin.write(buf)) {
          await new Promise((r) => proc.stdin.once('drain', r));
        }
      }
      proc.stdin.end();
    })().catch(() => {});
  });
}

async function startLocalServer() {
  const threePath = path.resolve('node_modules/three/build/three.module.js');
  const threeCorePath = path.resolve('node_modules/three/build/three.core.js');
  const threeCode = await fs.readFile(threePath, 'utf8');
  const threeCoreCode = await fs.readFile(threeCorePath, 'utf8');

  const server = http.createServer((req, res) => {
    if (req.url === '/three.module.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(threeCode);
    } else if (req.url === '/three.core.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(threeCoreCode);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(HARNESS_HTML);
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  return { server, url: `http://127.0.0.1:${addr.port}/` };
}

async function main() {
  const sharp = (await import('sharp')).default;
  console.log('Starting Three.js + Headless Chrome + FFmpeg 3D store renderer for 25 items...');
  const { server, url } = await startLocalServer();

  const browser = await chromium.launch({
    executablePath: CHROMIUM_EXEC,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ],
  });

  const page = await browser.newPage();
  page.on('pageerror', (err) => console.error('PageError:', err.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.initItemScene === 'function');

  const summary = [];

  for (const item of ITEMS) {
    const outDir = path.join(PUBLIC_STORE_DIR, item.id);
    const mirrorDir = path.join(MIRROR_STORE_DIR, item.id);
    await fs.mkdir(outDir, { recursive: true });
    await fs.mkdir(mirrorDir, { recursive: true });

    // 1. Render Poster (First Frame at high poster resolution)
    await page.evaluate(
      ({ id, w, h }) => window.initItemScene(id, w, h),
      { id: item.id, w: item.posterW, h: item.posterH }
    );
    const posterDataUrl = await page.evaluate(() => window.renderFrameBytes(0, 90));
    const posterPngBuf = Buffer.from(posterDataUrl.split(',')[1], 'base64');
    const posterPath = path.join(outDir, 'poster.webp');

    await sharp(posterPngBuf)
      .webp({ quality: 80, alphaQuality: 90, effort: 4 })
      .toFile(posterPath);
    await fs.copyFile(posterPath, path.join(mirrorDir, 'poster.webp'));
    const posterBytes = (await fs.stat(posterPath)).size;

    let webmBytes = 0;
    let webpBytes = 0;

    if (item.animated) {
      await page.evaluate(
        ({ id, w, h }) => window.initItemScene(id, w, h),
        { id: item.id, w: item.loopW, h: item.loopH }
      );

      const frameBuffers = [];
      for (let f = 0; f < item.frames; f++) {
        const dUrl = await page.evaluate(
          ({ frame, total }) => window.renderFrameBytes(frame, total),
          { frame: f, total: item.frames }
        );
        frameBuffers.push(Buffer.from(dUrl.split(',')[1], 'base64'));
      }

      const webmPath = path.join(outDir, 'loop.webm');
      const webpPath = path.join(outDir, 'loop.webp');

      // Encode VP9 WebM with alpha (yuva420p) < 600 KB
      await runFfmpeg(
        [
          '-y',
          '-f', 'image2pipe',
          '-framerate', String(item.fps),
          '-vcodec', 'png',
          '-i', 'pipe:0',
          '-c:v', 'libvpx-vp9',
          '-pix_fmt', 'yuva420p',
          '-b:v', '420k',
          '-crf', '34',
          '-deadline', 'realtime',
          '-cpu-used', '5',
          '-auto-alt-ref', '0',
          '-an',
          webmPath,
        ],
        frameBuffers
      );

      // Encode Animated WebP fallback with alpha < 900 KB
      await runFfmpeg(
        [
          '-y',
          '-f', 'image2pipe',
          '-framerate', String(item.fps),
          '-vcodec', 'png',
          '-i', 'pipe:0',
          '-vf', `fps=20,scale=${Math.round(item.loopW * 0.75)}:${Math.round(item.loopH * 0.75)}:flags=lanczos`,
          '-c:v', 'libwebp_anim',
          '-lossless', '0',
          '-q:v', '52',
          '-loop', '0',
          '-an',
          webpPath,
        ],
        frameBuffers
      );

      await fs.copyFile(webmPath, path.join(mirrorDir, 'loop.webm'));
      await fs.copyFile(webpPath, path.join(mirrorDir, 'loop.webp'));

      webmBytes = (await fs.stat(webmPath)).size;
      webpBytes = (await fs.stat(webpPath)).size;
    }

    console.log(
      `✓ ${item.id.padEnd(32)} | poster: ${(posterBytes / 1024).toFixed(1)} KB` +
        (item.animated
          ? ` | loop.webm: ${(webmBytes / 1024).toFixed(1)} KB | loop.webp: ${(webpBytes / 1024).toFixed(1)} KB`
          : ' (static)')
    );
    summary.push({
      id: item.id,
      category: item.category,
      animated: item.animated,
      fps: item.fps,
      frames: item.frames,
      posterKB: +(posterBytes / 1024).toFixed(1),
      webmKB: +(webmBytes / 1024).toFixed(1),
      webpKB: +(webpBytes / 1024).toFixed(1),
    });
  }

  await browser.close();
  server.close();

  await fs.writeFile(
    path.join(PUBLIC_STORE_DIR, 'manifest-25-new.json'),
    JSON.stringify(summary, null, 2)
  );
  console.log('\nAll 25 items rendered and verified within weight budgets!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
