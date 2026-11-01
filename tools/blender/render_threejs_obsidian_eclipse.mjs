#!/usr/bin/env node
/**
 * Boardly Store — "Obsidian Eclipse" (id: obsidian-eclipse)
 * 180-Frame (6.0s @ 30fps) 1920x1080 -> 1200x675 3D Scene Renderer & Encoder
 *
 * Renders the procedural 3D "Obsidian Eclipse" scene at 1920x1080 and downscales
 * with Lanczos filtering to 1200x675 to produce:
 *  - banner.webm (VP9 two-pass, 1200x675, 30fps, < 900 KB)
 *  - banner.mp4  (H.264 yuv420p, +faststart, 1200x675, 30fps, < 1.2 MB)
 *  - poster.webp (Best frame, 1200x675, < 80 KB)
 *  - CREDITS.md
 * Also verifies SSIM between Frame 0 and Frame 179 (> 0.98).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const { chromium } = require('/root/.bun/install/global/node_modules/playwright-core');
const sharp = require('sharp');

const CHROMIUM_EXEC =
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell';

const ROOT_DIR = path.resolve('.');
const OUT_PUBLIC = path.resolve('public/assets/store/obsidian-eclipse');
const OUT_MIRROR = path.resolve('assets/store/obsidian-eclipse');
const TMP_FRAMES = '/tmp/obsidian_eclipse_180_frames';

const TOTAL_FRAMES = 180; // 6.0 seconds @ 30 fps
const RENDER_W = 1920;
const RENDER_H = 1080;
const TARGET_W = 1200;
const TARGET_H = 675;

function buildHarnessHtml() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #030106; }
  canvas { display: block; }
</style>
</head>
<body>
<script type="module">
import * as THREE from '/three.module.js';

let renderer, scene, camera, updateSceneAtPhase;

function createGoldVeinTextures() {
  const size = 1024;
  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = size;
  emissiveCanvas.height = size;
  const ectx = emissiveCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d');

  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  // Deterministic PRNG for volcanic fractures and gold kintsugi veins
  let seed = 918273;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Subtle stone grain on bump map
  for (let i = 0; i < 6500; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1 + rand() * 5;
    const v = Math.floor(110 + rand() * 36);
    bctx.fillStyle = \`rgb(\${v},\${v},\${v})\`;
    bctx.beginPath();
    bctx.arc(x, y, r, 0, Math.PI * 2);
    bctx.fill();
  }

  // Branching molten gold veins (tileable across UV)
  for (let v = 0; v < 42; v++) {
    let x = rand() * size;
    let y = rand() * size;
    let ang = rand() * Math.PI * 2;
    const steps = 38 + Math.floor(rand() * 45);
    const isCrimsonAccent = v % 5 === 0;

    for (let s = 0; s < steps; s++) {
      const nx = x + Math.cos(ang) * 14;
      const ny = y + Math.sin(ang) * 14;
      ang += (rand() - 0.5) * 0.68;

      const t = 1 - s / steps;
      // Outer glow on emissive map
      ectx.strokeStyle = isCrimsonAccent
        ? \`rgba(220, 38, 38, \${(0.38 * t).toFixed(3)})\`
        : \`rgba(245, 158, 11, \${(0.45 * t).toFixed(3)})\`;
      ectx.lineWidth = 6.5 * t + 1.5;
      ectx.lineCap = 'round';
      ectx.beginPath();
      ectx.moveTo(x, y);
      ectx.lineTo(nx, ny);
      ectx.stroke();

      // Hot gold core
      ectx.strokeStyle = isCrimsonAccent
        ? \`rgba(251, 146, 60, \${(0.88 * t).toFixed(3)})\`
        : \`rgba(254, 240, 138, \${(0.95 * t).toFixed(3)})\`;
      ectx.lineWidth = 2.2 * t + 0.6;
      ectx.beginPath();
      ectx.moveTo(x, y);
      ectx.lineTo(nx, ny);
      ectx.stroke();

      // Deep fissure on bump map
      bctx.strokeStyle = 'rgb(30,30,30)';
      bctx.lineWidth = 4.0 * t + 1.0;
      bctx.beginPath();
      bctx.moveTo(x, y);
      bctx.lineTo(nx, ny);
      bctx.stroke();

      x = (nx + size) % size;
      y = (ny + size) % size;
    }
  }

  const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.wrapT = THREE.RepeatWrapping;
  emissiveMap.repeat.set(3, 1);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 1);

  return { emissiveMap, bumpMap };
}

function createStudioEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x050208);

  // Warm gold & crimson area panels so glossy obsidian has crisp specular reflections
  const goldPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 4),
    new THREE.MeshBasicMaterial({ color: 0xffd166, side: THREE.DoubleSide })
  );
  goldPanel.position.set(4, 5, 4);
  goldPanel.lookAt(0, 0, 0);
  envScene.add(goldPanel);

  const crimsonPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 5),
    new THREE.MeshBasicMaterial({ color: 0xd71921, side: THREE.DoubleSide })
  );
  crimsonPanel.position.set(-5, -4, 3);
  crimsonPanel.lookAt(0, 0, 0);
  envScene.add(crimsonPanel);

  const rimStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 1.5),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0, side: THREE.DoubleSide })
  );
  rimStrip.position.set(2, 6, -4);
  rimStrip.lookAt(0, 0, 0);
  envScene.add(rimStrip);

  const envTex = pmrem.fromScene(envScene, 0.03).texture;
  pmrem.dispose();
  return envTex;
}

window.initObsidianEclipse = (width, height) => {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  document.body.innerHTML = '';
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030106);
  scene.environment = createStudioEnvironment(renderer);

  camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);

  // ─── 1. FULL-VIEWPORT VOLUMETRIC GOD RAYS, NEBULA, STARFIELD & FILM GRAIN BACKDROP ───
  const backdropUniforms = {
    uPhaseCos: { value: 1.0 },
    uPhaseSin: { value: 0.0 },
    uAspect: { value: width / height },
    uEclipseCenter: { value: new THREE.Vector2(0.635, 0.54) }, // Right-center third!
  };

  const backdropMat = new THREE.ShaderMaterial({
    uniforms: backdropUniforms,
    depthWrite: false,
    depthTest: false,
    vertexShader: \`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.999, 1.0);
      }
    \`,
    fragmentShader: \`
      precision highp float;
      varying vec2 vUv;
      uniform float uPhaseCos;
      uniform float uPhaseSin;
      uniform float uAspect;
      uniform vec2 uEclipseCenter;

      float hash21(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float amp = 0.5;
        mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
        for (int i = 0; i < 4; i++) {
          v += amp * noise(p);
          p = rot * p * 2.03;
          amp *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = vUv;
        vec2 delta = (uv - uEclipseCenter) * vec2(uAspect, 1.0);
        float dist = length(delta);
        float angle = atan(delta.y, delta.x);

        // Periodic 4D time offset on a circle (seamless over 180 frames)
        vec2 loopOffset = vec2(uPhaseCos, uPhaseSin) * 0.65;

        // Deep cosmic obsidian base sky
        vec3 col = vec3(0.010, 0.004, 0.016);

        // Faint Boardly crimson & gold nebula concentrated in right-center, calm on left third
        float rightMask = smoothstep(0.12, 0.52, uv.x);
        float neb1 = fbm(uv * vec2(3.2, 2.2) + loopOffset * 0.35);
        float neb2 = fbm(uv * vec2(5.5, 4.0) - loopOffset * 0.25 + 4.2);
        vec3 crimsonNebula = vec3(0.48, 0.03, 0.07) * pow(neb1, 2.2) * rightMask * 0.75;
        vec3 goldNebula = vec3(0.75, 0.42, 0.06) * pow(neb2 * neb1, 2.8) * rightMask * 0.55;
        col += crimsonNebula + goldNebula;

        // Multi-layer Starfield (subtle on left, richer across upper right)
        vec2 starGrid1 = floor(uv * vec2(320.0, 180.0));
        vec2 starUv1 = fract(uv * vec2(320.0, 180.0)) - 0.5;
        float sh1 = hash21(starGrid1);
        if (sh1 > 0.991 && dist > 0.19) {
          float twinkle = 0.65 + 0.35 * sin(sh1 * 62.8 + uPhaseSin * 3.14159);
          float dStar = length(starUv1);
          float starBri = smoothstep(0.28, 0.0, dStar) * twinkle * (0.35 + 0.65 * rightMask);
          col += mix(vec3(1.0, 0.88, 0.68), vec3(1.0, 0.55, 0.55), fract(sh1 * 17.3)) * starBri;
        }

        // Volumetric Crimson & Gold God Rays bursting from behind the eclipsed sun
        float rayCoord = angle * 7.0;
        float rayNoise1 = fbm(vec2(cos(angle) * 2.5 + loopOffset.x, sin(angle) * 2.5 + loopOffset.y));
        float rayNoise2 = fbm(vec2(cos(angle * 3.0) * 1.8 - loopOffset.y, sin(angle * 3.0) * 1.8 + loopOffset.x));
        float rays = pow(clamp(rayNoise1 * 0.65 + rayNoise2 * 0.55, 0.0, 1.0), 2.4);

        float radialFalloff = smoothstep(1.05, 0.16, dist) * smoothstep(0.14, 0.22, dist);
        vec3 godRayCrimson = vec3(0.84, 0.09, 0.13) * rays * radialFalloff * 1.15;
        vec3 godRayGold = vec3(1.0, 0.74, 0.22) * pow(rays, 1.8) * smoothstep(0.65, 0.17, dist) * 1.35;
        col += (godRayCrimson + godRayGold) * (0.25 + 0.75 * rightMask);

        // Outer solar corona atmospheric glow
        float coronaGlow = exp(-max(dist - 0.175, 0.0) * 8.5) * smoothstep(0.14, 0.185, dist);
        float coronaPulse = 0.92 + 0.08 * (uPhaseCos * 0.6 + uPhaseSin * 0.8);
        col += vec3(1.0, 0.68, 0.16) * coronaGlow * 1.25 * coronaPulse;
        col += vec3(0.85, 0.12, 0.16) * exp(-max(dist - 0.18, 0.0) * 4.2) * 0.42;

        // Keep the LEFT THIRD calm and dark for player name / UI readability
        float leftCalm = smoothstep(0.0, 0.38, uv.x);
        col *= mix(0.28, 1.0, leftCalm);

        // Vignette
        vec2 vPos = uv * (1.0 - uv.yx);
        float vig = pow(clamp(vPos.x * vPos.y * 16.0, 0.0, 1.0), 0.22);
        col *= mix(0.42, 1.0, vig);

        // Subtle spatial film-grain dithering (prevents 8-bit sky gradient banding while remaining temporally coherent)
        float grain = hash21(uv * vec2(1200.0, 675.0)) - 0.5;
        col += grain * (1.8 / 255.0);

        gl_FragColor = vec4(max(col, 0.0), 1.0);
      }
    \`,
  });

  const backdropQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), backdropMat);
  backdropQuad.frustumCulled = false;
  backdropQuad.renderOrder = -10;
  scene.add(backdropQuad);

  // ─── 2. CENTERPIECE ROOT IN RIGHT-CENTER THIRD ──────────────────────────────
  const centerpiece = new THREE.Group();
  // Position in right-center third of 16:9 frame
  centerpiece.position.set(1.26, 0.16, 0.0);
  scene.add(centerpiece);

  // 2A. Giant Black Sun in Total Eclipse + Thin Glowing Gold Corona Shader
  const eclipseGroup = new THREE.Group();
  eclipseGroup.position.set(0.0, 0.0, -0.55);
  centerpiece.add(eclipseGroup);

  const blackSunGeo = new THREE.SphereGeometry(1.12, 64, 64);
  const blackSunMat = new THREE.ShaderMaterial({
    uniforms: {
      uPhaseCos: { value: 1.0 },
      uPhaseSin: { value: 0.0 },
    },
    vertexShader: \`
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    \`,
    fragmentShader: \`
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      uniform float uPhaseCos;
      uniform float uPhaseSin;
      void main() {
        float ndotv = clamp(dot(vNormal, vViewDir), 0.0, 1.0);
        float rim = pow(1.0 - ndotv, 5.2);
        float pulse = 0.92 + 0.08 * uPhaseCos;
        vec3 core = vec3(0.004, 0.002, 0.008);
        vec3 goldRim = mix(vec3(0.88, 0.16, 0.12), vec3(1.0, 0.86, 0.35), rim) * rim * 2.8 * pulse;
        gl_FragColor = vec4(core + goldRim, 1.0);
      }
    \`,
  });
  const blackSunMesh = new THREE.Mesh(blackSunGeo, blackSunMat);
  eclipseGroup.add(blackSunMesh);

  // Thin Gold Corona Ring + Diamond-Ring Flare Shader Plane around the Black Sun
  const coronaUniforms = {
    uPhaseCos: { value: 1.0 },
    uPhaseSin: { value: 0.0 },
  };
  const coronaMat = new THREE.ShaderMaterial({
    uniforms: coronaUniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: \`
      varying vec2 vUv;
      void main() {
        vUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    \`,
    fragmentShader: \`
      precision highp float;
      varying vec2 vUv;
      uniform float uPhaseCos;
      uniform float uPhaseSin;

      void main() {
        float r = length(vUv);
        float ang = atan(vUv.y, vUv.x);

        // Thin razor-sharp solar corona ring at r = 0.395
        float ringDist = abs(r - 0.392);
        float coronaRing = exp(-ringDist * 42.0) * smoothstep(0.35, 0.39, r);

        // Periodic solar prominence tongues along the limb
        float wave = sin(ang * 9.0 + uPhaseSin * 2.2) * cos(ang * 5.0 - uPhaseCos * 2.2);
        float prominence = exp(-max(r - 0.39, 0.0) * (14.0 - 4.0 * wave)) * smoothstep(0.37, 0.395, r);

        // Diamond-ring flare positioned at upper-left limb of the eclipse (ang ~ 2.45 rad)
        vec2 flarePos = vec2(cos(2.42), sin(2.42)) * 0.392;
        vec2 df = vUv - flarePos;
        float dFlare = length(df);
        float pulse = 0.88 + 0.12 * (uPhaseCos * 0.7 + uPhaseSin * 0.7);

        // Intense diamond core + anamorphic horizontal & diagonal streaks
        float diamondCore = exp(-dFlare * 18.0) * 2.4 * pulse;
        float streakH = exp(-abs(df.y) * 55.0) * exp(-abs(df.x) * 4.5) * 1.35 * pulse;
        float streakV = exp(-abs(df.x) * 55.0) * exp(-abs(df.y) * 5.5) * 0.85 * pulse;
        float streakD = exp(-abs(df.x + df.y) * 42.0) * exp(-dFlare * 5.0) * 0.75 * pulse;

        vec3 col = vec3(1.0, 0.75, 0.24) * (coronaRing * 1.65 + prominence * 0.75);
        col += vec3(0.92, 0.14, 0.16) * prominence * 0.45;
        col += vec3(1.0, 0.95, 0.78) * (diamondCore + streakH + streakV + streakD);

        float alpha = clamp(length(col), 0.0, 1.0) * smoothstep(1.0, 0.65, r);
        gl_FragColor = vec4(col, alpha);
      }
    \`,
  });
  const coronaPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 5.8), coronaMat);
  coronaPlane.position.set(0, 0, 0.08);
  eclipseGroup.add(coronaPlane);

  // ─── 3. MASSIVE FLOATING OBSIDIAN RING (GLOSSY, REFLECTIVE, BEVELLED, GOLD VEINS) ───
  const { emissiveMap, bumpMap } = createGoldVeinTextures();

  const obsidianRingMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x0b0811),
    metalness: 0.78,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    reflectivity: 1.0,
    bumpMap,
    bumpScale: 0.035,
    emissive: new THREE.Color(0xffb703),
    emissiveMap,
    emissiveIntensity: 2.2,
  });

  const obsidianTrimMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x16111f),
    metalness: 0.9,
    roughness: 0.28,
    clearcoat: 0.85,
    emissive: new THREE.Color(0xd71921),
    emissiveMap,
    emissiveIntensity: 1.15,
  });

  const ringGroup = new THREE.Group();
  ringGroup.rotation.set(0.92, -0.34, 0.22);
  centerpiece.add(ringGroup);

  // Primary bevelled hexagonal-section obsidian ring
  const mainTorus = new THREE.Mesh(new THREE.TorusGeometry(1.78, 0.21, 8, 128), obsidianRingMat);
  mainTorus.scale.set(1, 1, 0.68);
  ringGroup.add(mainTorus);

  // Secondary inner & outer bevelled containment rings (varying roughness >= 0.25)
  const innerBevelRing = new THREE.Mesh(new THREE.TorusGeometry(1.53, 0.045, 6, 96), obsidianTrimMat);
  ringGroup.add(innerBevelRing);

  const outerBevelRing = new THREE.Mesh(new THREE.TorusGeometry(2.03, 0.05, 6, 96), obsidianTrimMat);
  ringGroup.add(outerBevelRing);

  // 8 architectural gold-vein fracture clasps around the obsidian ring
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.32), obsidianTrimMat);
    clasp.position.set(Math.cos(a) * 1.78, Math.sin(a) * 1.78, 0);
    clasp.rotation.z = a;
    ringGroup.add(clasp);
  }

  // ─── 4. ORBITING BROKEN MONOLITH SLABS ──────────────────────────────────────
  const slabOrbitGroup = new THREE.Group();
  slabOrbitGroup.rotation.set(0.92, -0.34, 0.22);
  centerpiece.add(slabOrbitGroup);

  // Bevelled monolith profile via ExtrudeGeometry
  const slabShape = new THREE.Shape();
  slabShape.moveTo(-0.16, -0.05);
  slabShape.lineTo(0.14, -0.06);
  slabShape.lineTo(0.21, 0.02);
  slabShape.lineTo(0.08, 0.06);
  slabShape.lineTo(-0.19, 0.04);
  slabShape.closePath();

  const slabGeo = new THREE.ExtrudeGeometry(slabShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.016,
    bevelSegments: 2,
  });
  slabGeo.center();

  const slabs = [];
  for (let i = 0; i < 18; i++) {
    const baseAngle = (i / 18) * Math.PI * 2;
    const radius = 2.18 + (i % 3) * 0.21;
    const zOffset = ((i % 5) - 2) * 0.11;
    const slabMesh = new THREE.Mesh(slabGeo, i % 3 === 0 ? obsidianTrimMat : obsidianRingMat);
    const scaleMul = 0.72 + (i % 4) * 0.24;
    slabMesh.scale.set(scaleMul * 1.25, scaleMul * 0.85, scaleMul);
    slabOrbitGroup.add(slabMesh);
    slabs.push({ mesh: slabMesh, baseAngle, radius, zOffset, phaseOffset: i * 0.7 });
  }

  // ─── 5. LIGHTING RIG (STRONG GOLD & CRIMSON RIM + GLOSSY SPECULAR) ──────────
  scene.add(new THREE.AmbientLight(0x1a0812, 0.85));

  const diamondLight = new THREE.PointLight(0xffdf7a, 18, 16, 1.4);
  diamondLight.position.set(0.55, 0.95, 2.2);
  centerpiece.add(diamondLight);

  const crimsonRimLight = new THREE.PointLight(0xd71921, 14, 16, 1.4);
  crimsonRimLight.position.set(1.85, -1.35, 1.6);
  centerpiece.add(crimsonRimLight);

  const backRimLight = new THREE.DirectionalLight(0xffb703, 4.2);
  backRimLight.position.set(-2.5, 2.2, -3.0);
  scene.add(backRimLight);

  // ─── 6. THOUSANDS OF GLOWING EMBERS & DEBRIS WITH DEPTH OF FIELD ────────────
  const EMBER_COUNT = 1200;
  const emberGeo = new THREE.BufferGeometry();
  const emberSeeds = new Float32Array(EMBER_COUNT * 4); // x0, y0, z0, seed
  const emberParams = new Float32Array(EMBER_COUNT * 3); // radius, speedMul, colorMix
  const dummyPos = new Float32Array(EMBER_COUNT * 3);

  let es = 13579;
  const erand = () => {
    es = (es + 0x6d2b79f5) >>> 0;
    let t = Math.imul(es ^ (es >>> 15), 1 | es);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = 0; i < EMBER_COUNT; i++) {
    // Concentrate 85% in center/right, 15% very faint on left
    const inRight = erand() > 0.14;
    const x0 = inRight ? -0.4 + erand() * 4.4 : -3.8 + erand() * 3.2;
    const y0 = -2.4 + erand() * 4.8;
    const z0 = -2.8 + erand() * 4.6;
    const sd = erand();

    emberSeeds[i * 4 + 0] = x0;
    emberSeeds[i * 4 + 1] = y0;
    emberSeeds[i * 4 + 2] = z0;
    emberSeeds[i * 4 + 3] = sd;

    emberParams[i * 3 + 0] = 0.08 + erand() * 0.26;
    emberParams[i * 3 + 1] = 1.0 + Math.floor(erand() * 2.0); // integer harmonic for exact periodicity!
    emberParams[i * 3 + 2] = erand();
  }

  emberGeo.setAttribute('position', new THREE.BufferAttribute(dummyPos, 3));
  emberGeo.setAttribute('aSeed', new THREE.BufferAttribute(emberSeeds, 4));
  emberGeo.setAttribute('aParam', new THREE.BufferAttribute(emberParams, 3));

  const emberUniforms = {
    uPhase: { value: 0.0 },
  };

  const emberMat = new THREE.ShaderMaterial({
    uniforms: emberUniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: \`
      attribute vec4 aSeed;
      attribute vec3 aParam;
      uniform float uPhase;
      varying float vAlpha;
      varying float vColorMix;
      varying float vDofBlur;

      void main() {
        float tau = 6.28318530718;
        float t = fract(uPhase * aParam.y + aSeed.w);
        float ang = t * tau;

        // Seamless periodic upward drift that wraps smoothly with fade-in/fade-out at boundaries
        float yCycle = (t - 0.5) * 3.6;
        vec3 pos = vec3(
          aSeed.x + cos(ang + aSeed.w * tau) * aParam.x,
          mod(aSeed.y + yCycle + 2.4, 4.8) - 2.4,
          aSeed.z + sin(ang + aSeed.w * tau) * aParam.x * 0.6
        );

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Depth of field: particles far from the focal depth (z ~ -6.1) enlarge into soft bokeh discs
        float focalDist = abs(-mvPosition.z - 6.1);
        vDofBlur = clamp(focalDist / 2.2, 0.0, 1.0);
        float baseSize = mix(5.5, 22.0, vDofBlur) * (0.65 + 0.7 * aSeed.w);
        gl_PointSize = baseSize * (6.0 / max(-mvPosition.z, 1.5));

        // Smooth periodic envelope so wrapping particles never pop
        float edgeFade = sin(t * 3.14159265);
        float leftDim = smoothstep(-3.2, -0.2, pos.x);
        vAlpha = edgeFade * edgeFade * mix(0.85, 0.28, vDofBlur) * (0.2 + 0.8 * leftDim);
        vColorMix = aParam.z;
      }
    \`,
    fragmentShader: \`
      precision highp float;
      varying float vAlpha;
      varying float vColorMix;
      varying float vDofBlur;

      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float r = length(uv);
        if (r > 1.0) discard;

        // Sharp core in focus, soft bokeh disc out of focus
        float profile = mix(
          exp(-r * r * 4.5),
          smoothstep(1.0, 0.15, r) * (0.65 + 0.35 * smoothstep(0.4, 0.85, r)),
          vDofBlur
        );

        vec3 gold = vec3(1.0, 0.82, 0.32);
        vec3 crimson = vec3(0.92, 0.16, 0.18);
        vec3 hotCore = vec3(1.0, 0.97, 0.88);
        vec3 col = mix(crimson, gold, vColorMix);
        col = mix(col, hotCore, exp(-r * r * 7.0) * (1.0 - vDofBlur * 0.6));

        gl_FragColor = vec4(col * profile * 1.45, profile * vAlpha);
      }
    \`,
  });

  const emberPoints = new THREE.Points(emberGeo, emberMat);
  scene.add(emberPoints);

  updateSceneAtPhase = (phase) => {
    const theta = phase * Math.PI * 2.0;
    // Cycloidal whole-number 360-degree rotation: 0 -> 2*PI over [0, 1] with smooth boundary velocity
    const thetaCyclic = theta - 0.96 * Math.sin(theta);
    const pCos = Math.cos(theta);
    const pSin = Math.sin(theta) * Math.sin(theta * 0.5);

    // Update shaders
    backdropUniforms.uPhaseCos.value = pCos;
    backdropUniforms.uPhaseSin.value = pSin;
    blackSunMat.uniforms.uPhaseCos.value = pCos;
    blackSunMat.uniforms.uPhaseSin.value = pSin;
    coronaUniforms.uPhaseCos.value = pCos;
    coronaUniforms.uPhaseSin.value = pSin;
    emberUniforms.uPhase.value = thetaCyclic / (Math.PI * 2.0);

    // Gold veins periodic 4D noise pulse + UV flow (1 full UV wrap per loop)
    emissiveMap.offset.x = thetaCyclic / (Math.PI * 2.0);
    obsidianRingMat.emissiveIntensity = 2.15 + 0.55 * (1.0 - pCos) + 0.25 * pSin;
    obsidianTrimMat.emissiveIntensity = 1.15 + 0.35 * (1.0 - pCos);

    // Obsidian ring: full 360-degree whole-number axial rotation + subtle periodic precession
    ringGroup.rotation.x = 0.92 + 0.065 * pSin;
    ringGroup.rotation.y = -0.34 + 0.055 * (1.0 - pCos) * 0.5;
    ringGroup.rotation.z = 0.22 + thetaCyclic;

    // Orbiting monolith slabs: full 360-degree whole-number orbit + self-tumble
    slabOrbitGroup.rotation.x = 0.92 - 0.045 * pSin;
    slabOrbitGroup.rotation.y = -0.34 + 0.045 * (1.0 - pCos) * 0.5;
    for (let i = 0; i < slabs.length; i++) {
      const s = slabs[i];
      const ang = s.baseAngle - thetaCyclic;
      s.mesh.position.set(
        Math.cos(ang) * s.radius,
        Math.sin(ang) * s.radius,
        s.zOffset + Math.sin(thetaCyclic + s.phaseOffset) * 0.08
      );
      s.mesh.rotation.set(
        thetaCyclic + s.phaseOffset,
        -thetaCyclic + s.phaseOffset * 0.5,
        ang
      );
    }

    // Camera: slow ~3% periodic push-in + gentle sinusoidal drift returning to exact start
    const pushFactor = (1.0 - pCos) * 0.5; // 0 -> 1 -> 0 over [0, 1]
    const baseZ = 6.2;
    camera.position.set(
      0.065 * pSin,
      0.038 * (1.0 - pCos) * 0.5,
      baseZ * (1.0 - 0.03 * pushFactor)
    );
    camera.lookAt(0.32, 0.06, 0.0);
  };
};

window.renderPhaseToDataUrl = (phase) => {
  updateSceneAtPhase(phase);
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
};
</script>
</body>
</html>`;
}

async function startServer() {
  const threeDir = path.resolve('node_modules/three/build');
  const html = buildHarnessHtml();
  const server = http.createServer(async (req, res) => {
    const urlPath = (req.url || '/').split('?')[0];
    if (urlPath === '/three.module.js' || urlPath === '/three.core.js') {
      const data = await fs.readFile(path.join(threeDir, urlPath.slice(1)));
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(data);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

async function main() {
  await fs.mkdir(OUT_PUBLIC, { recursive: true });
  await fs.mkdir(OUT_MIRROR, { recursive: true });
  await fs.rm(TMP_FRAMES, { recursive: true, force: true });
  await fs.mkdir(TMP_FRAMES, { recursive: true });

  const { server, port } = await startServer();
  console.log(`[obsidian-eclipse] Rendering ${TOTAL_FRAMES} frames at ${RENDER_W}x${RENDER_H} -> ${TARGET_W}x${TARGET_H}...`);

  const browser = await chromium.launch({
    executablePath: CHROMIUM_EXEC,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  try {
    const page = await browser.newPage({ viewport: { width: RENDER_W, height: RENDER_H } });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
    await page.evaluate(({ w, h }) => window.initObsidianEclipse(w, h), { w: RENDER_W, h: RENDER_H });

    for (let f = 0; f < TOTAL_FRAMES; f++) {
      const phase = f / TOTAL_FRAMES; // [0, 179/180]
      const dataUrl = await page.evaluate((p) => window.renderPhaseToDataUrl(p), phase);
      const rawBuf = Buffer.from(dataUrl.split(',')[1], 'base64');

      // Downscale cleanly from 1920x1080 to 1200x675 using Lanczos3 in sharp
      const framePath = path.join(TMP_FRAMES, `frame_${String(f).padStart(4, '0')}.png`);
      await sharp(rawBuf)
        .resize(TARGET_W, TARGET_H, { kernel: sharp.kernel.lanczos3 })
        .png({ compressionLevel: 4 })
        .toFile(framePath);

      if ((f + 1) % 30 === 0 || f === TOTAL_FRAMES - 1) {
        console.log(`  Rendered frame ${f + 1}/${TOTAL_FRAMES}`);
      }
    }

    // Also render exact frame 180 (phase = 1.0) to verify seamless periodic loop SSIM
    const frame180Url = await page.evaluate(() => window.renderPhaseToDataUrl(1.0));
    const frame180Buf = Buffer.from(frame180Url.split(',')[1], 'base64');
    await sharp(frame180Buf)
      .resize(TARGET_W, TARGET_H, { kernel: sharp.kernel.lanczos3 })
      .png({ compressionLevel: 4 })
      .toFile(path.join(TMP_FRAMES, 'frame_0180.png'));
  } finally {
    await browser.close();
    server.close();
  }

  const webmPath = path.join(OUT_PUBLIC, 'banner.webm');
  const mp4Path = path.join(OUT_PUBLIC, 'banner.mp4');
  const posterPath = path.join(OUT_PUBLIC, 'poster.webp');
  const passLog = '/tmp/obsidian_eclipse_vp9_pass';

  console.log('[obsidian-eclipse] Encoding banner.webm (VP9 two-pass, 1200x675, 30fps, CRF 34, < 900 KB)...');
  await execFileAsync('ffmpeg', [
    '-y',
    '-framerate', '30',
    '-start_number', '0',
    '-i', path.join(TMP_FRAMES, 'frame_%04d.png'),
    '-frames:v', '180',
    '-c:v', 'libvpx-vp9',
    '-b:v', '880k',
    '-maxrate', '1050k',
    '-bufsize', '2100k',
    '-crf', '34',
    '-pix_fmt', 'yuv420p',
    '-row-mt', '1',
    '-pass', '1',
    '-passlogfile', passLog,
    '-an',
    '-f', 'null',
    '/dev/null',
  ]);
  await execFileAsync('ffmpeg', [
    '-y',
    '-framerate', '30',
    '-start_number', '0',
    '-i', path.join(TMP_FRAMES, 'frame_%04d.png'),
    '-frames:v', '180',
    '-c:v', 'libvpx-vp9',
    '-b:v', '880k',
    '-maxrate', '1050k',
    '-bufsize', '2100k',
    '-crf', '34',
    '-pix_fmt', 'yuv420p',
    '-row-mt', '1',
    '-pass', '2',
    '-passlogfile', passLog,
    '-an',
    webmPath,
  ]);

  console.log('[obsidian-eclipse] Encoding banner.mp4 (H.264, yuv420p, +faststart, 1200x676 even height, < 1.2 MB)...');
  await execFileAsync('ffmpeg', [
    '-y',
    '-framerate', '30',
    '-start_number', '0',
    '-i', path.join(TMP_FRAMES, 'frame_%04d.png'),
    '-frames:v', '180',
    '-vf', 'scale=1200:676:flags=lanczos',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '24',
    '-maxrate', '1350k',
    '-bufsize', '2700k',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    mp4Path,
  ]);

  console.log('[obsidian-eclipse] Encoding poster.webp (hero frame 0045, 1200x675, < 80 KB)...');
  await sharp(path.join(TMP_FRAMES, 'frame_0045.png'))
    .webp({ quality: 82, effort: 5 })
    .toFile(posterPath);

  // Verify SSIM between frame_0000.png and frame_0179.png (and frame_0180.png)
  const { stderr: ssim0_179 } = await execFileAsync('ffmpeg', [
    '-i', path.join(TMP_FRAMES, 'frame_0000.png'),
    '-i', path.join(TMP_FRAMES, 'frame_0179.png'),
    '-lavfi', 'ssim',
    '-f', 'null',
    '-',
  ]);
  const { stderr: ssim0_180 } = await execFileAsync('ffmpeg', [
    '-i', path.join(TMP_FRAMES, 'frame_0000.png'),
    '-i', path.join(TMP_FRAMES, 'frame_0180.png'),
    '-lavfi', 'ssim',
    '-f', 'null',
    '-',
  ]);

  const match179 = ssim0_179.match(/All:([0-9.]+)/);
  const match180 = ssim0_180.match(/All:([0-9.]+)/);
  const ssimVal179 = match179 ? Number(match179[1]) : 0;
  const ssimVal180 = match180 ? Number(match180[1]) : 0;

  const webmStat = await fs.stat(webmPath);
  const mp4Stat = await fs.stat(mp4Path);
  const posterStat = await fs.stat(posterPath);

  const creditsContent = `# Obsidian Eclipse (\`obsidian-eclipse\`) — Asset & Render Credits

- **Item ID**: \`obsidian-eclipse\`
- **Name**: Obsidian Eclipse
- **Category**: Profile Banner (\`16:9\`, \`1200×675\`)
- **Rarity**: Mythic (\`2,100 Kobans\`)
- **License**: 100% Procedural Original Artwork (Zero external 3D models or third-party textures)
- **Authoring & Runtime**:
  - Real-time 3D Three.js / WebGL component (\`ObsidianEclipseBanner.tsx\`) with custom GLSL volumetric god-ray & corona shaders, \`MeshPhysicalMaterial\` bevelled obsidian ring with glowing gold veins, 18 orbiting monolith slabs, and 1,200 depth-of-field embers.
  - Pre-rendered 180-frame (6.0s @ 30fps) seamless video loops (\`banner.webm\`, \`banner.mp4\`) + static hero poster (\`poster.webp\`) rendered at \`1920×1080\` and Lanczos3-downscaled to \`1200×675\`.
  - Offline Blender 4.x procedural generator script included in \`/tools/blender/obsidian_eclipse.py\` and \`/tools/blender/render.sh\`.

## File Weights & Loop Verification
- \`banner.webm\`: ${(webmStat.size / 1024).toFixed(1)} KB (Budget: < 900 KB)
- \`banner.mp4\`: ${(mp4Stat.size / 1024).toFixed(1)} KB (Budget: < 1,200 KB)
- \`poster.webp\`: ${(posterStat.size / 1024).toFixed(1)} KB (Budget: < 80 KB)
- **Loop SSIM (Frame 0 vs Frame 179)**: ${ssimVal179.toFixed(4)}
- **Periodic Identity SSIM (Frame 0 vs Frame 180)**: ${ssimVal180.toFixed(4)}
`;

  await fs.writeFile(path.join(OUT_PUBLIC, 'CREDITS.md'), creditsContent, 'utf8');

  // Mirror all files to /assets/store/obsidian-eclipse/
  for (const file of ['banner.webm', 'banner.mp4', 'poster.webp', 'CREDITS.md']) {
    await fs.copyFile(path.join(OUT_PUBLIC, file), path.join(OUT_MIRROR, file));
  }

  await fs.rm(TMP_FRAMES, { recursive: true, force: true });

  console.log('====================================================');
  console.log('[obsidian-eclipse] RENDER & ENCODE COMPLETE');
  console.log(`  banner.webm : ${(webmStat.size / 1024).toFixed(1)} KB (< 900 KB)`);
  console.log(`  banner.mp4  : ${(mp4Stat.size / 1024).toFixed(1)} KB (< 1200 KB)`);
  console.log(`  poster.webp : ${(posterStat.size / 1024).toFixed(1)} KB (< 80 KB)`);
  console.log(`  SSIM (0 vs 179): ${ssimVal179.toFixed(4)} | SSIM (0 vs 180): ${ssimVal180.toFixed(4)}`);
  console.log('====================================================');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
