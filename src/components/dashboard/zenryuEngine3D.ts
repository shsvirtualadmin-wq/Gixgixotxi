import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type ZenryuPose = 'fly' | 'roar' | 'sleep';

export type ZenryuCameraPreset = 'stage' | 'front' | 'side' | 'three-quarter';

export interface ZenryuEngineController {
  setPose: (pose: ZenryuPose) => void;
  getPose: () => ZenryuPose;
  triggerRoar: () => void;
  setPointerNorm: (nx: number | null, ny: number | null) => void;
  setDragYaw: (yawRad: number, isDragging: boolean) => void;
  setCameraPreset: (preset: ZenryuCameraPreset) => void;
  setPaused: (paused: boolean) => void;
  resize: () => void;
  renderNow: () => void;
  dispose: () => void;
}

export interface ZenryuEngineOptions {
  container: HTMLElement;
  initialPose?: ZenryuPose;
  initialCamera?: ZenryuCameraPreset;
  enableOrbitControls?: boolean;
  opaqueStageBackground?: boolean;
  reserveBottomPx?: number;
  onPoseChange?: (pose: ZenryuPose) => void;
  onRoarComplete?: () => void;
}

// ── Software WebGL Detection & Fallback Chain Probe ─────────────────────────
export function detectSoftwareWebGL(): { supported: boolean; isSoftwareGl: boolean } {
  if (typeof document === 'undefined') {
    return { supported: false, isSoftwareGl: true };
  }
  try {
    const probeCanvas = document.createElement('canvas');
    const contextAttributes: WebGLContextAttributes[] = [
      { powerPreference: 'high-performance' },
      { powerPreference: 'default' },
      {},
    ];
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    for (const attrs of contextAttributes) {
      gl =
        (probeCanvas.getContext('webgl2', attrs) as WebGL2RenderingContext | null) ||
        (probeCanvas.getContext('webgl', attrs) as WebGLRenderingContext | null) ||
        (probeCanvas.getContext('experimental-webgl', attrs) as WebGLRenderingContext | null);
      if (gl) break;
    }
    if (!gl) {
      return { supported: false, isSoftwareGl: true };
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return { supported: true, isSoftwareGl };
  } catch {
    return { supported: false, isSoftwareGl: true };
  }
}

function createWebGLRendererWithFallback(
  opaqueStageBackground: boolean,
  isSoftwareGl: boolean
): THREE.WebGLRenderer {
  const attempts: THREE.WebGLRendererParameters[] = [
    {
      alpha: !opaqueStageBackground,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    },
    {
      alpha: !opaqueStageBackground,
      antialias: false,
      powerPreference: 'default',
    },
    {
      alpha: !opaqueStageBackground,
      antialias: false,
    },
  ];
  let lastErr: unknown = null;
  for (const params of attempts) {
    try {
      return new THREE.WebGLRenderer(params);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('WebGL context creation failed');
}

// ── Math & Procedural Noise Helpers ─────────────────────────────────────────
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

function hash2(x: number, y: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return h - Math.floor(h);
}

function noise2(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return mix(mix(a, b, ux), mix(c, d, ux), uy);
}

function ridgeNoise(x: number, y: number, octaves = 3): number {
  let sum = 0;
  let amp = 0.55;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    const n = noise2(x * freq, y * freq);
    const r = 1 - Math.abs(n * 2 - 1);
    sum += amp * (r * r);
    freq *= 2.08;
    amp *= 0.5;
  }
  return sum;
}

// ── 1024px Procedural Texture Suite Cache (Built Once Per Session) ──────────
interface ZenryuTextureSuite {
  scaleAlbedo: THREE.CanvasTexture;
  scaleNormal: THREE.DataTexture;
  scaleRoughness: THREE.DataTexture;
  scaleEmissive: THREE.CanvasTexture;
  wingAlbedo: THREE.CanvasTexture;
  wingEmissive: THREE.CanvasTexture;
  wingNormal: THREE.DataTexture;
  eyeAlbedo: THREE.CanvasTexture;
  fireSprite: THREE.CanvasTexture;
}

let cachedTextures: ZenryuTextureSuite | null = null;

function getOrCreateZenryuTextures(maxAnisotropy: number): ZenryuTextureSuite {
  if (cachedTextures) return cachedTextures;

  const SIZE = 1024;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = SIZE;
  albedoCanvas.height = SIZE;
  const albedoCtx = albedoCanvas.getContext('2d')!;

  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = SIZE;
  emissiveCanvas.height = SIZE;
  const emissiveCtx = emissiveCanvas.getContext('2d')!;

  const albedoImg = albedoCtx.createImageData(SIZE, SIZE);
  const emissiveImg = emissiveCtx.createImageData(SIZE, SIZE);
  const albedoData = albedoImg.data;
  const emissiveData = emissiveImg.data;

  const heightField = new Float32Array(SIZE * SIZE);
  const roughData = new Uint8Array(SIZE * SIZE * 4);
  const normalData = new Uint8Array(SIZE * SIZE * 4);

  // Larger, clearly overlapping rounded dragon scales (~4x bigger than before, zero dot grid)
  const COLS = 9; // Circumferential scale columns around body
  const ROWS = 18; // Longitudinal scale rows per UV tile

  for (let y = 0; y < SIZE; y++) {
    const v = y / SIZE; // 0..1 around circumference (0.5 = ventral belly)
    const bellyDist = Math.abs(v - 0.5) / 0.16;
    const isBelly = bellyDist < 1.0;
    const bellyBlend = smoothstep(1.0, 0.68, bellyDist);

    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE; // 0..1 along spine length
      const idx = y * SIZE + x;
      const pIdx = idx * 4;

      // 1. Large Overlapping Rounded-Arch Dragon Scales
      const su = u * ROWS;
      const row = Math.floor(su);
      const sv = v * COLS + (row & 1 ? 0.5 : 0.0);
      const col = Math.floor(sv);

      const fu = su - row; // 0 (scale root) .. 1 (overlapping tip)
      const fv = (sv - col - 0.5) * 2.0; // -1..1 across scale width

      // Rounded overlapping shield contour: arch curves back at sides
      const archCurve = 0.94 - 0.44 * fv * fv;
      const edgeDist = archCurve - fu; // >0 inside scale, <0 in overlap crevice

      // Crisp dark edge line where scales overlap
      const insideMask = smoothstep(-0.04, 0.08, edgeDist);
      const darkEdgeLine = 1.0 - smoothstep(0.0, 0.17, Math.abs(edgeDist));
      // Lighter top highlight along the overlapping upper rim & central keel
      const topHighlight =
        smoothstep(0.03, 0.18, edgeDist) *
        smoothstep(0.45, 0.15, edgeDist) *
        (1.0 - 0.32 * fv * fv);
      const rootPocketShadow = smoothstep(0.0, 0.30, fu);
      const centralKeel = Math.exp(-fv * fv * 4.5) * smoothstep(0.12, 0.78, fu) * 0.36;

      // Scale heightfield for normal map (smooth dome + raised lip + central keel)
      const scaleH =
        insideMask *
        (0.22 + 0.52 * fu + topHighlight * 0.44 + centralKeel) *
        (1.0 - darkEdgeLine * 0.72);

      // Deep crimson & obsidian-black scale coloration (never pale pink)
      const cellHash = hash2(row * 1.9 + 5, ((col % COLS) + COLS) % COLS * 2.7 + 11);
      const isCrimsonScale = cellHash > 0.34;
      const toneVar = 0.5 + 0.5 * hash2(row + 23, col + 37);

      let scR = isCrimsonScale ? mix(88, 162, toneVar) : mix(10, 22, toneVar);
      let scG = isCrimsonScale ? mix(4, 11, toneVar) : mix(4, 8, toneVar);
      let scB = isCrimsonScale ? mix(7, 15, toneVar) : mix(6, 11, toneVar);

      // Apply root shadow, dark overlapping edge line, and lighter crimson top highlight
      const bodyShade = (0.28 + 0.72 * rootPocketShadow) * (1.0 - darkEdgeLine * 0.88);
      scR = scR * bodyShade + topHighlight * (isCrimsonScale ? 104 : 54) + centralKeel * 42;
      scG = scG * bodyShade + topHighlight * (isCrimsonScale ? 12 : 7) + centralKeel * 4;
      scB = scB * bodyShade + topHighlight * (isCrimsonScale ? 16 : 9) + centralKeel * 6;

      // 2. Clearly Ridged Transverse Belly Scutes (Dark Crimson-Bronze Ventral Armor Plates)
      const platePhase = u * 20;
      const plateFrac = platePhase - Math.floor(platePhase);
      const plateArch = Math.sin(clamp(plateFrac, 0, 1) * Math.PI);
      const plateCrevice = smoothstep(0.0, 0.16, plateFrac) * smoothstep(1.0, 0.84, plateFrac);
      const plateTopRim =
        smoothstep(0.56, 0.78, plateFrac) * smoothstep(0.92, 0.72, plateFrac);
      const lateralRib = 1.0 - 0.22 * bellyDist * bellyDist;
      const bellyH = plateCrevice * (0.48 + 0.42 * plateArch + plateTopRim * 0.25) * lateralRib;

      // Rich crimson-bronze ridged belly plates with deep obsidian inter-plate grooves (never salmon/pink)
      const belR = (68 + plateArch * 44 + plateTopRim * 36) * plateCrevice + 10 * (1 - plateCrevice);
      const belG = (10 + plateArch * 8 + plateTopRim * 7) * plateCrevice + 3 * (1 - plateCrevice);
      const belB = (12 + plateArch * 8 + plateTopRim * 6) * plateCrevice + 5 * (1 - plateCrevice);

      const finalH = mix(scaleH, bellyH, bellyBlend);
      heightField[idx] = finalH;

      let outR = mix(scR, belR, bellyBlend);
      let outG = mix(scG, belG, bellyBlend);
      let outB = mix(scB, belB, bellyBlend);

      // 3. Molten Magma Cracks Between Scales (Emissive strong ONLY in cracks)
      const chestFactor = smoothstep(0.05, 0.22, u) * smoothstep(0.84, 0.34, u);
      const rNoise = ridgeNoise(u * 10.5 + 1.3, v * 7.5 + 2.7, 3);
      const crackMask =
        smoothstep(0.80, 0.95, rNoise) *
        (0.45 + 0.55 * darkEdgeLine) *
        (0.35 + 0.65 * chestFactor);

      const bellySeam =
        isBelly && plateFrac < 0.12
          ? smoothstep(0.12, 0.0, plateFrac) * (1 - bellyDist * 0.75) * chestFactor * 0.9
          : 0;

      const ember = clamp(crackMask * 1.45 + bellySeam, 0, 1);

      if (ember > 0.04) {
        outR = mix(outR, 255, ember * 0.82);
        outG = mix(outG, 96, ember * 0.68);
        outB = mix(outB, 18, ember * 0.5);
      }

      albedoData[pIdx] = Math.round(clamp(outR, 0, 255));
      albedoData[pIdx + 1] = Math.round(clamp(outG, 0, 255));
      albedoData[pIdx + 2] = Math.round(clamp(outB, 0, 255));
      albedoData[pIdx + 3] = 255;

      // Emissive map: zero on scale faces so body stays deep crimson/black, bright ONLY in cracks
      const emR = ember * 255;
      const emG = ember * ember * 135;
      const emB = ember * 16;
      emissiveData[pIdx] = Math.round(clamp(emR, 0, 255));
      emissiveData[pIdx + 1] = Math.round(clamp(emG, 0, 255));
      emissiveData[pIdx + 2] = Math.round(clamp(emB, 0, 255));
      emissiveData[pIdx + 3] = 255;

      // Roughness map: glossy scale crowns (~0.32), matte crevices (~0.82)
      const rough = mix(0.82, 0.32, clamp(finalH, 0, 1));
      const rByte = Math.round(clamp(rough * 255, 0, 255));
      roughData[pIdx] = rByte;
      roughData[pIdx + 1] = rByte;
      roughData[pIdx + 2] = rByte;
      roughData[pIdx + 3] = 255;
    }
  }

  // Compute Tangent-Space Normal Map from Scale Heightfield
  const strength = 6.8;
  for (let y = 0; y < SIZE; y++) {
    const ym = (y - 1 + SIZE) % SIZE;
    const yp = (y + 1) % SIZE;
    for (let x = 0; x < SIZE; x++) {
      const xm = (x - 1 + SIZE) % SIZE;
      const xp = (x + 1) % SIZE;
      const dx = (heightField[y * SIZE + xp] - heightField[y * SIZE + xm]) * strength;
      const dy = (heightField[yp * SIZE + x] - heightField[ym * SIZE + x]) * strength;
      const invLen = 1.0 / Math.hypot(dx, dy, 1.0);
      const nx = -dx * invLen;
      const ny = -dy * invLen;
      const nz = invLen;
      const pIdx = (y * SIZE + x) * 4;
      normalData[pIdx] = Math.round((nx * 0.5 + 0.5) * 255);
      normalData[pIdx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalData[pIdx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normalData[pIdx + 3] = 255;
    }
  }

  albedoCtx.putImageData(albedoImg, 0, 0);
  emissiveCtx.putImageData(emissiveImg, 0, 0);

  const scaleAlbedo = new THREE.CanvasTexture(albedoCanvas);
  scaleAlbedo.colorSpace = THREE.SRGBColorSpace;
  scaleAlbedo.wrapS = THREE.RepeatWrapping;
  scaleAlbedo.wrapT = THREE.RepeatWrapping;
  scaleAlbedo.anisotropy = maxAnisotropy;
  scaleAlbedo.needsUpdate = true;

  const scaleEmissive = new THREE.CanvasTexture(emissiveCanvas);
  scaleEmissive.colorSpace = THREE.SRGBColorSpace;
  scaleEmissive.wrapS = THREE.RepeatWrapping;
  scaleEmissive.wrapT = THREE.RepeatWrapping;
  scaleEmissive.anisotropy = maxAnisotropy;
  scaleEmissive.needsUpdate = true;

  const scaleNormal = new THREE.DataTexture(normalData, SIZE, SIZE, THREE.RGBAFormat);
  scaleNormal.wrapS = THREE.RepeatWrapping;
  scaleNormal.wrapT = THREE.RepeatWrapping;
  scaleNormal.generateMipmaps = true;
  scaleNormal.minFilter = THREE.LinearMipmapLinearFilter;
  scaleNormal.magFilter = THREE.LinearFilter;
  scaleNormal.anisotropy = maxAnisotropy;
  scaleNormal.needsUpdate = true;

  const scaleRoughness = new THREE.DataTexture(roughData, SIZE, SIZE, THREE.RGBAFormat);
  scaleRoughness.wrapS = THREE.RepeatWrapping;
  scaleRoughness.wrapT = THREE.RepeatWrapping;
  scaleRoughness.generateMipmaps = true;
  scaleRoughness.minFilter = THREE.LinearMipmapLinearFilter;
  scaleRoughness.magFilter = THREE.LinearFilter;
  scaleRoughness.anisotropy = maxAnisotropy;
  scaleRoughness.needsUpdate = true;

  // ── 4. Wing Membrane Vein Texture (512x512) ─────────────────────────────────
  // Dark leathery crimson membrane with high-contrast branching arterial veins & glowing trailing rim
  const WSIZE = 512;
  const wingAlbCanvas = document.createElement('canvas');
  wingAlbCanvas.width = WSIZE;
  wingAlbCanvas.height = WSIZE;
  const wingAlbCtx = wingAlbCanvas.getContext('2d')!;

  const wingEmCanvas = document.createElement('canvas');
  wingEmCanvas.width = WSIZE;
  wingEmCanvas.height = WSIZE;
  const wingEmCtx = wingEmCanvas.getContext('2d')!;

  const wAlbImg = wingAlbCtx.createImageData(WSIZE, WSIZE);
  const wEmImg = wingEmCtx.createImageData(WSIZE, WSIZE);
  const wHeight = new Float32Array(WSIZE * WSIZE);
  const wNormData = new Uint8Array(WSIZE * WSIZE * 4);

  for (let y = 0; y < WSIZE; y++) {
    const v = y / WSIZE; // 0 at wrist/finger root, 1 at scalloped trailing edge
    for (let x = 0; x < WSIZE; x++) {
      const u = x / WSIZE; // 0..1 across the 4 wing panels
      const idx = y * WSIZE + x;
      const pIdx = idx * 4;

      // Panel local coordinate (4 panels across u in 0..1)
      const panelCoord = (u * 4) % 1;
      const distFromFinger = Math.min(panelCoord, 1 - panelCoord) * 2; // 0 at finger bone, 1 at panel center

      // Branching primary & secondary veins radiating from finger bones toward panel center
      const branchWave = Math.sin(v * 26 - distFromFinger * 14 + noise2(u * 16, v * 16) * 3.2);
      const primaryVein = Math.pow(clamp(1.0 - Math.abs(branchWave), 0, 1), 7.5) * (1.0 - v * 0.25);

      const vMain = ridgeNoise(u * 12.0 + 0.7, v * 9.0 + 1.3, 4);
      const vCapillary = ridgeNoise(u * 26.0 + 4.1, v * 22.0 + 2.1, 3);
      const netVein =
        smoothstep(0.72, 0.94, vMain) * 0.85 +
        smoothstep(0.76, 0.95, vCapillary) * 0.45 +
        primaryVein * 0.75;
      const veinMask = clamp(netVein, 0, 1);

      // Leathery radial pleats between fingers
      const pleat = 0.5 + 0.5 * Math.sin(panelCoord * Math.PI * 6 + v * 3.0);
      // Glowing crimson trailing edge & finger seam aura
      const trailingEdgeRim = smoothstep(0.78, 0.99, v);
      const fingerSeamRim = smoothstep(0.16, 0.0, distFromFinger) * 0.55;

      wHeight[idx] = pleat * 0.25 + veinMask * 0.75;

      // Dark umbral-crimson membrane base so bright red veins and dark finger bones pop clearly
      const baseR = mix(34, 68, 1 - v * 0.35) + veinMask * 155 + trailingEdgeRim * 110 + pleat * 10;
      const baseG = mix(5, 11, 1 - v * 0.35) + veinMask * 24 + trailingEdgeRim * 16;
      const baseB = mix(8, 15, 1 - v * 0.35) + veinMask * 20 + trailingEdgeRim * 18;

      wAlbImg.data[pIdx] = Math.round(clamp(baseR, 0, 255));
      wAlbImg.data[pIdx + 1] = Math.round(clamp(baseG, 0, 255));
      wAlbImg.data[pIdx + 2] = Math.round(clamp(baseB, 0, 255));
      wAlbImg.data[pIdx + 3] = 255;

      const emIntensity = clamp(veinMask * 0.92 + trailingEdgeRim * 0.85 + fingerSeamRim * 0.35, 0, 1);
      wEmImg.data[pIdx] = Math.round(clamp(emIntensity * 245, 0, 255));
      wEmImg.data[pIdx + 1] = Math.round(clamp(emIntensity * emIntensity * 54, 0, 255));
      wEmImg.data[pIdx + 2] = Math.round(clamp(emIntensity * 22, 0, 255));
      wEmImg.data[pIdx + 3] = 255;
    }
  }

  for (let y = 0; y < WSIZE; y++) {
    const ym = Math.max(0, y - 1);
    const yp = Math.min(WSIZE - 1, y + 1);
    for (let x = 0; x < WSIZE; x++) {
      const xm = Math.max(0, x - 1);
      const xp = Math.min(WSIZE - 1, x + 1);
      const dx = (wHeight[y * WSIZE + xp] - wHeight[y * WSIZE + xm]) * 4.5;
      const dy = (wHeight[yp * WSIZE + x] - wHeight[ym * WSIZE + x]) * 4.5;
      const inv = 1 / Math.hypot(dx, dy, 1);
      const pIdx = (y * WSIZE + x) * 4;
      wNormData[pIdx] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
      wNormData[pIdx + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255);
      wNormData[pIdx + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      wNormData[pIdx + 3] = 255;
    }
  }

  wingAlbCtx.putImageData(wAlbImg, 0, 0);
  wingEmCtx.putImageData(wEmImg, 0, 0);

  const wingAlbedo = new THREE.CanvasTexture(wingAlbCanvas);
  wingAlbedo.colorSpace = THREE.SRGBColorSpace;
  wingAlbedo.anisotropy = maxAnisotropy;
  wingAlbedo.needsUpdate = true;

  const wingEmissive = new THREE.CanvasTexture(wingEmCanvas);
  wingEmissive.colorSpace = THREE.SRGBColorSpace;
  wingEmissive.anisotropy = maxAnisotropy;
  wingEmissive.needsUpdate = true;

  const wingNormal = new THREE.DataTexture(wNormData, WSIZE, WSIZE, THREE.RGBAFormat);
  wingNormal.generateMipmaps = true;
  wingNormal.minFilter = THREE.LinearMipmapLinearFilter;
  wingNormal.needsUpdate = true;

  // ── 5. Molten Slit-Pupil Eye Texture (256x256) ──────────────────────────────
  const ESIZE = 256;
  const eyeCanvas = document.createElement('canvas');
  eyeCanvas.width = ESIZE;
  eyeCanvas.height = ESIZE;
  const eyeCtx = eyeCanvas.getContext('2d')!;
  const eyeGrad = eyeCtx.createRadialGradient(
    ESIZE * 0.5,
    ESIZE * 0.5,
    6,
    ESIZE * 0.5,
    ESIZE * 0.5,
    ESIZE * 0.48
  );
  eyeGrad.addColorStop(0, '#fff7a8');
  eyeGrad.addColorStop(0.38, '#ff7714');
  eyeGrad.addColorStop(0.78, '#d91422');
  eyeGrad.addColorStop(1, '#2b0408');
  eyeCtx.fillStyle = eyeGrad;
  eyeCtx.fillRect(0, 0, ESIZE, ESIZE);

  eyeCtx.fillStyle = '#090204';
  eyeCtx.beginPath();
  eyeCtx.ellipse(ESIZE * 0.5, ESIZE * 0.5, ESIZE * 0.055, ESIZE * 0.36, 0, 0, Math.PI * 2);
  eyeCtx.fill();

  const eyeAlbedo = new THREE.CanvasTexture(eyeCanvas);
  eyeAlbedo.colorSpace = THREE.SRGBColorSpace;
  eyeAlbedo.needsUpdate = true;

  // ── 6. Soft Additive Fire Breath Sprite Texture (128x128) ───────────────────
  const FSIZE = 128;
  const fireCanvas = document.createElement('canvas');
  fireCanvas.width = FSIZE;
  fireCanvas.height = FSIZE;
  const fireCtx = fireCanvas.getContext('2d')!;
  const fGrad = fireCtx.createRadialGradient(
    FSIZE * 0.5,
    FSIZE * 0.5,
    2,
    FSIZE * 0.5,
    FSIZE * 0.5,
    FSIZE * 0.48
  );
  fGrad.addColorStop(0, 'rgba(255, 250, 210, 1)');
  fGrad.addColorStop(0.3, 'rgba(255, 130, 30, 0.85)');
  fGrad.addColorStop(0.65, 'rgba(225, 29, 42, 0.42)');
  fGrad.addColorStop(1, 'rgba(120, 10, 18, 0)');
  fireCtx.fillStyle = fGrad;
  fireCtx.fillRect(0, 0, FSIZE, FSIZE);

  const fireSprite = new THREE.CanvasTexture(fireCanvas);
  fireSprite.colorSpace = THREE.SRGBColorSpace;
  fireSprite.needsUpdate = true;

  cachedTextures = {
    scaleAlbedo,
    scaleNormal,
    scaleRoughness,
    scaleEmissive,
    wingAlbedo,
    wingEmissive,
    wingNormal,
    eyeAlbedo,
    fireSprite,
  };

  return cachedTextures;
}

// ── Custom Tapered Curved Tube Builder (For Horns, Wing Fingers, Limbs, Skull) ──
function createTaperedCurveGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  tubularSegments: number,
  radialSegments: number,
  radiusFn: (u: number, theta: number) => number,
  uvRepeatU = 0.85
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const vCount = (tubularSegments + 1) * (radialSegments + 1);
  const positions = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const indices: number[] = [];

  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    curve.getPointAt(u, P);
    N.copy(frames.normals[i]);
    B.copy(frames.binormals[i]);

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const theta = v * Math.PI * 2;
      const r = radiusFn(u, theta);
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      const idx = i * (radialSegments + 1) + j;
      positions[idx * 3] = P.x + r * (cos * N.x + sin * B.x);
      positions[idx * 3 + 1] = P.y + r * (cos * N.y + sin * B.y);
      positions[idx * 3 + 2] = P.z + r * (cos * N.z + sin * B.z);

      uvs[idx * 2] = u * uvRepeatU;
      uvs[idx * 2 + 1] = v;
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const normAttr = geo.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i <= tubularSegments; i++) {
    const i0 = i * (radialSegments + 1);
    const i1 = i0 + radialSegments;
    const nx = (normAttr.getX(i0) + normAttr.getX(i1)) * 0.5;
    const ny = (normAttr.getY(i0) + normAttr.getY(i1)) * 0.5;
    const nz = (normAttr.getZ(i0) + normAttr.getZ(i1)) * 0.5;
    const len = Math.hypot(nx, ny, nz) || 1;
    normAttr.setXYZ(i0, nx / len, ny / len, nz / len);
    normAttr.setXYZ(i1, nx / len, ny / len, nz / len);
  }
  normAttr.needsUpdate = true;
  return geo;
}

// ── Reusable Pre-Allocated Temp Objects (Zero GC in Render Loop) ────────────
const _tmpVecA = new THREE.Vector3();
const _tmpVecB = new THREE.Vector3();
const _tmpVecC = new THREE.Vector3();
const _tmpVecD = new THREE.Vector3();
const _tmpMat4 = new THREE.Matrix4();
const _invModelMat = new THREE.Matrix4();
const _camRight = new THREE.Vector3();
const _camUp = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _worldUp = new THREE.Vector3(0, 1, 0);

// ── Main 3D Zenryu Scene & Procedural Rig Builder ───────────────────────────
export function createZenryu3DEngine(
  options: ZenryuEngineOptions
): ZenryuEngineController {
  const {
    container,
    initialPose = 'fly',
    initialCamera = 'stage',
    enableOrbitControls = false,
    opaqueStageBackground = false,
    reserveBottomPx = 44,
    onPoseChange,
    onRoarComplete,
  } = options;

  const { isSoftwareGl } = detectSoftwareWebGL();
  const disposables: Array<{ dispose: () => void }> = [];

  const getStageDimensions = () => {
    const rect = container.getBoundingClientRect();
    const w = Math.max(240, Math.round(rect.width || container.clientWidth || 390));
    const h = Math.max(180, Math.round(rect.height || container.clientHeight || 264));
    return { w, h };
  };

  const initDims = getStageDimensions();
  const getCappedPixelRatio = () =>
    Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

  const renderer = createWebGLRendererWithFallback(opaqueStageBackground, isSoftwareGl);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Fixed exposure 1.0 + ACESFilmic in BOTH themes so Zenryu never washes out to pink
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setPixelRatio(getCappedPixelRatio());
  renderer.setSize(initDims.w, initDims.h, false);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (opaqueStageBackground) {
    scene.background = new THREE.Color(0x090407);
    scene.fog = new THREE.FogExp2(0x090407, 0.032);
  }

  // Studio Environment Map (PMREMGenerator + RoomEnvironment)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  pmremGenerator.dispose();
  disposables.push(envTarget);

  // Camera & Optional OrbitControls
  const camera = new THREE.PerspectiveCamera(32, initDims.w / initDims.h, 0.1, 80);
  let orbitControls: {
    target: THREE.Vector3;
    update: () => void;
    dispose: () => void;
  } | null = null;
  let currentCameraPreset: ZenryuCameraPreset = initialCamera;

  // ── Fixed Dark-Scene Lighting Rig (Identical in Dark & Light Theme) ─────────
  const hemiLight = new THREE.HemisphereLight(0x556b8f, 0x1a0407, 0.45);
  scene.add(hemiLight);

  // Warm Directional Key Light (Controlled so dark crimson/obsidian scales stay rich)
  const keyLight = new THREE.DirectionalLight(0xffdfd0, 1.38);
  keyLight.position.set(3.8, 5.2, 4.4);
  scene.add(keyLight);

  // Subtle Cool Fill Light from Front-Left for Scale Contrast & Relief
  const coolFill = new THREE.DirectionalLight(0x6488c4, 0.88);
  coolFill.position.set(-5.2, 1.8, 3.8);
  scene.add(coolFill);

  // Strong Crimson Rim Light 1 (Back-Top)
  const crimsonRimTop = new THREE.DirectionalLight(0xff1426, 4.8);
  crimsonRimTop.position.set(-2.6, 4.6, -5.4);
  scene.add(crimsonRimTop);

  // Strong Molten Crimson Rim Light 2 (Back-Side)
  const crimsonRimSide = new THREE.DirectionalLight(0xe11d2a, 4.0);
  crimsonRimSide.position.set(4.0, -2.0, -4.6);
  scene.add(crimsonRimSide);

  // Dynamic Chest/Jaws Ember Light
  const emberPointLight = new THREE.PointLight(0xff3314, 1.8, 7.0, 1.6);
  emberPointLight.position.set(1.3, 0.35, 0.7);
  scene.add(emberPointLight);

  // ── Generate 1024px Procedural Textures & PBR Materials ────────────────────
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 4);
  const tex = getOrCreateZenryuTextures(maxAniso);

  // Body Scale Material: Deep crimson & near-black with emissiveIntensity ~0.25 (strong only in cracks)
  const scaleMat = new THREE.MeshPhysicalMaterial({
    map: tex.scaleAlbedo,
    normalMap: tex.scaleNormal,
    normalScale: new THREE.Vector2(1.55, 1.55),
    roughnessMap: tex.scaleRoughness,
    roughness: 0.46,
    metalness: 0.18,
    envMapIntensity: 0.28,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: tex.scaleEmissive,
    emissiveIntensity: 0.25,
    clearcoat: 0.26,
    clearcoatRoughness: 0.32,
  });
  disposables.push(scaleMat);

  // Dark Obsidian-Crimson Material for Leading Wing Arm & 4 Finger Bones
  const wingBoneMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x160508),
    normalMap: tex.scaleNormal,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughness: 0.34,
    metalness: 0.28,
    envMapIntensity: 0.32,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
    emissive: new THREE.Color(0x550810),
    emissiveIntensity: 0.22,
  });
  disposables.push(wingBoneMat);

  const hornMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x1b070b),
    roughness: 0.28,
    metalness: 0.32,
    envMapIntensity: 0.35,
    clearcoat: 0.72,
    clearcoatRoughness: 0.18,
    emissive: new THREE.Color(0x7a0c14),
    emissiveIntensity: 0.28,
  });
  disposables.push(hornMat);

  const fangMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xf4e0d2),
    roughness: 0.22,
    metalness: 0.08,
    envMapIntensity: 0.3,
    clearcoat: 0.6,
  });
  disposables.push(fangMat);

  // Wing Membrane Material: Translucent (0.88), Double-Sided, Red Emissive Veins & Edges
  const wingMembraneMat = new THREE.MeshPhysicalMaterial({
    map: tex.wingAlbedo,
    normalMap: tex.wingNormal,
    normalScale: new THREE.Vector2(1.25, 1.25),
    emissive: new THREE.Color(0xffffff),
    emissiveMap: tex.wingEmissive,
    emissiveIntensity: 0.92,
    roughness: 0.48,
    metalness: 0.1,
    envMapIntensity: 0.22,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  disposables.push(wingMembraneMat);

  const eyeMat = new THREE.MeshStandardMaterial({
    map: tex.eyeAlbedo,
    emissiveMap: tex.eyeAlbedo,
    emissive: new THREE.Color(0xffaa22),
    emissiveIntensity: 2.8,
    roughness: 0.1,
  });
  disposables.push(eyeMat);

  const oralFireMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xff5e14),
  });
  disposables.push(oralFireMat);

  // Root Pivot Group (rotates around normalized bounding-box center) & Inner Model Group
  const dragonRoot = new THREE.Group();
  scene.add(dragonRoot);

  const dragonModel = new THREE.Group();
  dragonRoot.add(dragonModel);

  // ============================================================================
  // 1. SPINE CATMULLROMCURVE3 (Angled ~10 deg upward, S-Curve Neck, Sweeping Tail)
  // ============================================================================
  const spineControlPoints: THREE.Vector3[] = [
    // Skull Base & Upper Neck (0..2) — Head attaches forward at point 0 in 3/4 turn
    new THREE.Vector3(1.52, 0.68, -0.14),
    new THREE.Vector3(1.34, 0.64, -0.09),
    new THREE.Vector3(1.16, 0.52, -0.04),
    // Graceful S-Curve Neck (3..6)
    new THREE.Vector3(0.96, 0.34, 0.0),
    new THREE.Vector3(0.76, 0.16, 0.02),
    new THREE.Vector3(0.54, 0.06, 0.01),
    new THREE.Vector3(0.30, 0.02, 0.0),
    // Muscular Chest & Thorax Angled ~10 Degrees Upward (7..10)
    new THREE.Vector3(0.04, -0.03, 0.0),
    new THREE.Vector3(-0.22, -0.08, 0.02),
    new THREE.Vector3(-0.48, -0.13, 0.06),
    new THREE.Vector3(-0.74, -0.17, 0.12),
    // Pelvis / Hips (11..13)
    new THREE.Vector3(-0.98, -0.21, 0.20),
    new THREE.Vector3(-1.20, -0.25, 0.30),
    new THREE.Vector3(-1.40, -0.28, 0.42),
    // Sinuous Sweeping Whip Tail Curving into Clear 3/4 Silhouette (14..23)
    new THREE.Vector3(-1.58, -0.30, 0.56),
    new THREE.Vector3(-1.74, -0.28, 0.72),
    new THREE.Vector3(-1.86, -0.22, 0.88),
    new THREE.Vector3(-1.94, -0.12, 1.02),
    new THREE.Vector3(-1.96, 0.02, 1.14),
    new THREE.Vector3(-1.92, 0.18, 1.22),
    new THREE.Vector3(-1.84, 0.32, 1.26),
    new THREE.Vector3(-1.72, 0.44, 1.26),
    new THREE.Vector3(-1.58, 0.54, 1.22),
    new THREE.Vector3(-1.44, 0.62, 1.16),
  ];

  const spineCurve = new THREE.CatmullRomCurve3(
    spineControlPoints,
    false,
    'centripetal',
    0.5
  );

  // Anatomical radius profile along spine u in [0, 1]
  const getSpineRadii = (u: number): { rx: number; ry: number; bellyDrop: number } => {
    if (u < 0.08) {
      // Transition from skull base to upper neck
      const t = u / 0.08;
      const r = mix(0.19, 0.21, t);
      return { rx: r * 1.02, ry: r * 0.96, bellyDrop: 0.01 };
    }
    if (u < 0.26) {
      // Muscular S-curve neck
      const t = (u - 0.08) / (0.26 - 0.08);
      const r = mix(0.21, 0.30, smoothstep(0, 1, t));
      return { rx: r * 0.92, ry: r * 1.12, bellyDrop: 0.02 };
    }
    if (u < 0.46) {
      // Deep muscular chest & shoulders
      const t = (u - 0.26) / (0.46 - 0.26);
      const chestBell = Math.sin(t * Math.PI);
      const r = 0.30 + chestBell * 0.12;
      return { rx: r * 1.14, ry: r * 1.08, bellyDrop: chestBell * 0.08 };
    }
    if (u < 0.60) {
      // Athletic waist & hips
      const t = (u - 0.46) / (0.60 - 0.46);
      const r = mix(0.30, 0.20, t);
      return { rx: r * 1.02, ry: r * 1.0, bellyDrop: 0.02 };
    }
    // Long whip tail tapering smoothly to tip
    const t = (u - 0.60) / 0.40;
    const r = mix(0.20, 0.032, Math.pow(t, 0.85));
    return { rx: r, ry: r * 1.04, bellyDrop: 0 };
  };

  // Create 20 Spine Bones rooted at Chest Bone (index 6)
  const NUM_SPINE_BONES = 20;
  const spineBones: THREE.Bone[] = [];
  const spineBoneRestWorldPos: THREE.Vector3[] = [];

  for (let b = 0; b < NUM_SPINE_BONES; b++) {
    const u = b / (NUM_SPINE_BONES - 1);
    const pt = spineCurve.getPointAt(u);
    spineBoneRestWorldPos.push(pt.clone());
    const bone = new THREE.Bone();
    bone.name = `ZenryuSpine_${b}`;
    spineBones.push(bone);
  }

  const CHEST_BONE_IDX = 6;
  spineBones[CHEST_BONE_IDX].position.copy(spineBoneRestWorldPos[CHEST_BONE_IDX]);
  dragonModel.add(spineBones[CHEST_BONE_IDX]);

  for (let b = CHEST_BONE_IDX - 1; b >= 0; b--) {
    const parentIdx = b + 1;
    spineBones[b].position
      .copy(spineBoneRestWorldPos[b])
      .sub(spineBoneRestWorldPos[parentIdx]);
    spineBones[parentIdx].add(spineBones[b]);
  }

  for (let b = CHEST_BONE_IDX + 1; b < NUM_SPINE_BONES; b++) {
    const parentIdx = b - 1;
    spineBones[b].position
      .copy(spineBoneRestWorldPos[b])
      .sub(spineBoneRestWorldPos[parentIdx]);
    spineBones[parentIdx].add(spineBones[b]);
  }

  const spineRestRotations = spineBones.map((b) => b.rotation.clone());

  // Build Lofted Body Mesh (104 lengthwise segments x 28 radial segments)
  const BODY_LEN_SEGS = 104;
  const BODY_RAD_SEGS = 28;
  const bodyVertCount = (BODY_LEN_SEGS + 1) * (BODY_RAD_SEGS + 1);

  const bodyPositions = new Float32Array(bodyVertCount * 3);
  const bodyUvs = new Float32Array(bodyVertCount * 2);
  const skinIndices = new Uint16Array(bodyVertCount * 4);
  const skinWeights = new Float32Array(bodyVertCount * 4);
  const bodyIndices: number[] = [];

  const spineTangents: THREE.Vector3[] = [];
  const spineNormals: THREE.Vector3[] = [];
  const spineBinormals: THREE.Vector3[] = [];

  const upRef = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= BODY_LEN_SEGS; i++) {
    const u = i / BODY_LEN_SEGS;
    const T = spineCurve.getTangentAt(u).normalize();
    spineTangents.push(T);

    if (i === 0) {
      const B = new THREE.Vector3().crossVectors(T, upRef).normalize();
      const N = new THREE.Vector3().crossVectors(B, T).normalize();
      spineNormals.push(N);
      spineBinormals.push(B);
    } else {
      const prevN = spineNormals[i - 1];
      const N = prevN
        .clone()
        .sub(T.clone().multiplyScalar(prevN.dot(T)))
        .normalize();
      const B = new THREE.Vector3().crossVectors(T, N).normalize();
      spineNormals.push(N);
      spineBinormals.push(B);
    }
  }

  const ringCenter = new THREE.Vector3();
  for (let i = 0; i <= BODY_LEN_SEGS; i++) {
    const u = i / BODY_LEN_SEGS;
    spineCurve.getPointAt(u, ringCenter);
    const N = spineNormals[i];
    const B = spineBinormals[i];
    const { rx, ry, bellyDrop } = getSpineRadii(u);

    const bFloat = u * (NUM_SPINE_BONES - 1);
    const bCenter = Math.round(bFloat);
    const candIndices = [
      clamp(bCenter - 1, 0, NUM_SPINE_BONES - 1),
      clamp(bCenter, 0, NUM_SPINE_BONES - 1),
      clamp(bCenter + 1, 0, NUM_SPINE_BONES - 1),
      clamp(bCenter + 2, 0, NUM_SPINE_BONES - 1),
    ];
    const rawWeights = candIndices.map((bi) => {
      const dist = Math.abs(bFloat - bi);
      return Math.max(0, 1.0 - dist * 0.62);
    });
    const uniqMap = new Map<number, number>();
    for (let k = 0; k < 4; k++) {
      uniqMap.set(candIndices[k], (uniqMap.get(candIndices[k]) || 0) + rawWeights[k]);
    }
    const entries = Array.from(uniqMap.entries());
    while (entries.length < 4) entries.push([0, 0]);
    const wSum = entries.reduce((acc, e) => acc + e[1], 0) || 1;

    for (let j = 0; j <= BODY_RAD_SEGS; j++) {
      const v = j / BODY_RAD_SEGS;
      const theta = v * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      let radN = ry * cos;
      let radB = rx * sin;

      if (cos > 0.65 && u > 0.04 && u < 0.88) {
        radN += Math.pow((cos - 0.65) / 0.35, 2) * ry * 0.20;
      }
      if (cos < -0.3) {
        radN -= bellyDrop * Math.pow((-cos - 0.3) / 0.7, 1.4);
      }

      const vIdx = i * (BODY_RAD_SEGS + 1) + j;
      bodyPositions[vIdx * 3] = ringCenter.x + radN * N.x + radB * B.x;
      bodyPositions[vIdx * 3 + 1] = ringCenter.y + radN * N.y + radB * B.y;
      bodyPositions[vIdx * 3 + 2] = ringCenter.z + radN * N.z + radB * B.z;

      // Larger overlapping scales (~4x larger per scale)
      bodyUvs[vIdx * 2] = u * 1.25;
      bodyUvs[vIdx * 2 + 1] = v;

      for (let k = 0; k < 4; k++) {
        skinIndices[vIdx * 4 + k] = entries[k][0];
        skinWeights[vIdx * 4 + k] = entries[k][1] / wSum;
      }
    }
  }

  for (let i = 0; i < BODY_LEN_SEGS; i++) {
    for (let j = 0; j < BODY_RAD_SEGS; j++) {
      const a = i * (BODY_RAD_SEGS + 1) + j;
      const b = (i + 1) * (BODY_RAD_SEGS + 1) + j;
      const c = (i + 1) * (BODY_RAD_SEGS + 1) + (j + 1);
      const d = i * (BODY_RAD_SEGS + 1) + (j + 1);
      bodyIndices.push(a, b, d, b, c, d);
    }
  }

  const bodyGeo = new THREE.BufferGeometry();
  bodyGeo.setAttribute('position', new THREE.BufferAttribute(bodyPositions, 3));
  bodyGeo.setAttribute('uv', new THREE.BufferAttribute(bodyUvs, 2));
  bodyGeo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  bodyGeo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  bodyGeo.setIndex(bodyIndices);
  bodyGeo.computeVertexNormals();

  const bodyNorm = bodyGeo.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i <= BODY_LEN_SEGS; i++) {
    const i0 = i * (BODY_RAD_SEGS + 1);
    const i1 = i0 + BODY_RAD_SEGS;
    const nx = (bodyNorm.getX(i0) + bodyNorm.getX(i1)) * 0.5;
    const ny = (bodyNorm.getY(i0) + bodyNorm.getY(i1)) * 0.5;
    const nz = (bodyNorm.getZ(i0) + bodyNorm.getZ(i1)) * 0.5;
    const len = Math.hypot(nx, ny, nz) || 1;
    bodyNorm.setXYZ(i0, nx / len, ny / len, nz / len);
    normAttrSetSafe(bodyNorm, i1, nx / len, ny / len, nz / len);
  }
  bodyNorm.needsUpdate = true;
  bodyGeo.computeTangents();
  disposables.push(bodyGeo);

  dragonModel.updateMatrixWorld(true);

  const bodyMesh = new THREE.SkinnedMesh(bodyGeo, scaleMat);
  const bodySkeleton = new THREE.Skeleton(spineBones);
  bodyMesh.bind(bodySkeleton);
  bodyMesh.frustumCulled = false;
  dragonModel.add(bodyMesh);

  // ============================================================================
  // 2. SCULPTED DRAGON HEAD: SNOUT, SCOWLING BROW, 4 HORNS, HINGED JAW & EYES
  // ============================================================================
  // Attached at spineBones[0] (1.62, 0.72, 0.0) and extending forward (+X)
  const headBone = spineBones[0];
  const headGroup = new THREE.Group();
  headBone.add(headGroup);

  // Sculpted Wedge Cranium & Snout Bridge Extending Forward from Neck Tip
  const skullCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, 0.01, 0),
    new THREE.Vector3(0.18, 0.03, 0),
    new THREE.Vector3(0.46, -0.01, 0),
    new THREE.Vector3(0.62, -0.04, 0),
  ]);
  const skullGeo = createTaperedCurveGeometry(
    skullCurve,
    20,
    16,
    (u, theta) => {
      const w = mix(0.21, 0.082, Math.pow(u, 0.85));
      const h = mix(0.17, 0.068, Math.pow(u, 0.85));
      return Math.hypot(h * Math.cos(theta), w * Math.sin(theta));
    },
    0.45
  );
  disposables.push(skullGeo);
  headGroup.add(new THREE.Mesh(skullGeo, scaleMat));

  // Armored Brow Ridges Overhanging Eyes in a Fierce Dragon Scowl
  for (const side of [-1, 1] as const) {
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, 0.12, side * 0.16),
      new THREE.Vector3(0.18, 0.15, side * 0.15),
      new THREE.Vector3(0.36, 0.08, side * 0.11),
    ]);
    const browGeo = createTaperedCurveGeometry(browCurve, 14, 10, (u) =>
      0.046 * Math.sin(clamp(u, 0.05, 0.95) * Math.PI)
    );
    disposables.push(browGeo);
    headGroup.add(new THREE.Mesh(browGeo, hornMat));
  }

  // Nasal Horn Crest at Snout Tip
  const nasalCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.48, 0.01, 0),
    new THREE.Vector3(0.57, 0.12, 0),
    new THREE.Vector3(0.52, 0.21, 0),
  ]);
  const nasalGeo = createTaperedCurveGeometry(
    nasalCurve,
    12,
    10,
    (u) => 0.035 * (1 - Math.pow(u, 0.85))
  );
  disposables.push(nasalGeo);
  headGroup.add(new THREE.Mesh(nasalGeo, hornMat));

  // Four Swept-Back Elder Horns + Cheek Spikes
  for (const side of [-1, 1] as const) {
    const primaryHornCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.04, 0.14, side * 0.13),
      new THREE.Vector3(-0.26, 0.34, side * 0.24),
      new THREE.Vector3(-0.62, 0.50, side * 0.30),
      new THREE.Vector3(-0.94, 0.66, side * 0.26),
    ]);
    const primaryHornGeo = createTaperedCurveGeometry(
      primaryHornCurve,
      28,
      12,
      (u) => (0.086 * (1 - Math.pow(u, 0.82)) + 0.004) * (1 + 0.05 * Math.sin(u * 48))
    );
    disposables.push(primaryHornGeo);
    headGroup.add(new THREE.Mesh(primaryHornGeo, hornMat));

    const secHornCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.05, side * 0.17),
      new THREE.Vector3(-0.28, 0.14, side * 0.28),
      new THREE.Vector3(-0.56, 0.24, side * 0.32),
    ]);
    const secHornGeo = createTaperedCurveGeometry(
      secHornCurve,
      20,
      10,
      (u) => 0.058 * (1 - Math.pow(u, 0.85)) + 0.003
    );
    disposables.push(secHornGeo);
    headGroup.add(new THREE.Mesh(secHornGeo, hornMat));

    const cheekCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, -0.03, side * 0.17),
      new THREE.Vector3(-0.18, -0.07, side * 0.26),
    ]);
    const cheekGeo = createTaperedCurveGeometry(
      cheekCurve,
      10,
      8,
      (u) => 0.040 * (1 - u)
    );
    disposables.push(cheekGeo);
    headGroup.add(new THREE.Mesh(cheekGeo, hornMat));
  }

  // Upper Jaw Fangs
  const fangConeGeo = new THREE.ConeGeometry(0.015, 0.065, 10);
  disposables.push(fangConeGeo);
  for (const side of [-1, 1] as const) {
    for (let f = 0; f < 5; f++) {
      const fx = 0.18 + f * 0.078;
      const fz = side * mix(0.125, 0.068, f / 4);
      const isCanine = f === 3;
      const fang = new THREE.Mesh(fangConeGeo, fangMat);
      fang.position.set(fx, -0.055, fz);
      fang.rotation.z = Math.PI + 0.12;
      fang.scale.setScalar(isCanine ? 1.25 : 0.78);
      headGroup.add(fang);
    }
  }

  // Hinged Lower Jaw Bone & Mesh
  const jawBone = new THREE.Bone();
  jawBone.position.set(0.04, -0.05, 0);
  headGroup.add(jawBone);

  const jawCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 0.0, 0),
    new THREE.Vector3(0.24, -0.03, 0),
    new THREE.Vector3(0.50, -0.01, 0),
  ]);
  const jawGeo = createTaperedCurveGeometry(
    jawCurve,
    16,
    14,
    (u, theta) => {
      const w = mix(0.155, 0.068, u);
      const h = mix(0.078, 0.040, u);
      return Math.hypot(h * Math.cos(theta), w * Math.sin(theta));
    },
    0.4
  );
  disposables.push(jawGeo);
  const jawMesh = new THREE.Mesh(jawGeo, scaleMat);
  jawBone.add(jawMesh);

  // Inner Fiery Oral Cavity Glow (Visible when Jaw Opens)
  const oralGlowGeo = new THREE.SphereGeometry(0.068, 12, 10);
  disposables.push(oralGlowGeo);
  const oralGlowMesh = new THREE.Mesh(oralGlowGeo, oralFireMat);
  oralGlowMesh.scale.set(2.0, 0.55, 1.05);
  oralGlowMesh.position.set(0.22, 0.025, 0);
  jawBone.add(oralGlowMesh);

  // Lower Jaw Fangs
  for (const side of [-1, 1] as const) {
    for (let f = 0; f < 4; f++) {
      const fx = 0.14 + f * 0.082;
      const fz = side * mix(0.105, 0.058, f / 3);
      const fang = new THREE.Mesh(fangConeGeo, fangMat);
      fang.position.set(fx, 0.028, fz);
      fang.rotation.z = -0.15;
      fang.scale.setScalar(f === 3 ? 1.12 : 0.72);
      jawBone.add(fang);
    }
  }

  // Deep-Set Glowing Molten Eyes + Animatable Eyelids Under Armored Brow
  const eyeGeo = new THREE.SphereGeometry(0.036, 18, 16);
  const eyelidGeo = new THREE.SphereGeometry(
    0.040,
    16,
    12,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.54
  );
  disposables.push(eyeGeo, eyelidGeo);

  const upperEyelids: THREE.Mesh[] = [];
  for (const side of [-1, 1] as const) {
    const eyeSocket = new THREE.Group();
    eyeSocket.position.set(0.19, 0.065, side * 0.135);
    headGroup.add(eyeSocket);

    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.scale.set(1.25, 0.85, 0.95);
    eyeMesh.rotation.y = side > 0 ? 0.22 : Math.PI - 0.22;
    eyeSocket.add(eyeMesh);

    const lidTop = new THREE.Mesh(eyelidGeo, hornMat);
    lidTop.scale.set(1.28, 0.92, 1.0);
    lidTop.rotation.z = -0.55;
    eyeSocket.add(lidTop);
    upperEyelids.push(lidTop);
  }

  // ============================================================================
  // 3. DORSAL SPINES (Anchored Directly to Spine Bones — Zero Floating) & TAIL BLADE
  // ============================================================================
  const NUM_DORSAL_SPIKES = 32;
  const spikeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.04, 0),
    new THREE.Vector3(-0.06, 0.11, 0),
    new THREE.Vector3(-0.15, 0.25, 0),
  ]);
  const spikeGeo = createTaperedCurveGeometry(spikeCurve, 10, 8, (u, theta) => {
    const r = 0.046 * (1 - Math.pow(u, 0.85));
    return r * (0.36 + 0.64 * Math.abs(Math.cos(theta)));
  });
  disposables.push(spikeGeo);

  const dorsalInstanced = new THREE.InstancedMesh(
    spikeGeo,
    hornMat,
    NUM_DORSAL_SPIKES
  );
  dorsalInstanced.frustumCulled = false;
  dragonModel.add(dorsalInstanced);

  // Tail Halberd Blade Tip on Final Tail Bone
  const tailTipBone = spineBones[NUM_SPINE_BONES - 1];
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0.05, 0);
  bladeShape.quadraticCurveTo(-0.12, 0.17, -0.36, 0.08);
  bladeShape.quadraticCurveTo(-0.22, 0.02, -0.44, 0.0);
  bladeShape.quadraticCurveTo(-0.22, -0.02, -0.36, -0.08);
  bladeShape.quadraticCurveTo(-0.12, -0.17, 0.05, 0);

  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
    steps: 1,
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.014,
    bevelSegments: 3,
  });
  bladeGeo.center();
  disposables.push(bladeGeo);
  const tailBladeMesh = new THREE.Mesh(bladeGeo, hornMat);
  tailBladeMesh.position.set(-0.14, 0.06, 0);
  tailBladeMesh.rotation.z = -0.58;
  tailTipBone.add(tailBladeMesh);

  // ============================================================================
  // 4. FOUR ARTICULATED LEGS WITH TALONS (Tucked Up Against Belly in Flight)
  // ============================================================================
  const legUpperGeo = createTaperedCurveGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.08, -0.22, 0.03),
      new THREE.Vector3(-0.15, -0.42, 0.05),
    ]),
    14,
    12,
    (u) => mix(0.125, 0.072, u),
    0.45
  );
  const legLowerGeo = createTaperedCurveGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.09, -0.19, 0.01),
      new THREE.Vector3(0.16, -0.36, 0.0),
    ]),
    14,
    12,
    (u) => mix(0.072, 0.042, u),
    0.45
  );
  const talonGeo = createTaperedCurveGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.08, -0.02, 0),
      new THREE.Vector3(0.14, -0.08, 0),
    ]),
    10,
    8,
    (u) => 0.024 * (1 - Math.pow(u, 0.85))
  );
  const kneeCapGeo = new THREE.SphereGeometry(0.076, 12, 10);
  disposables.push(legUpperGeo, legLowerGeo, talonGeo, kneeCapGeo);

  const legJoints: Array<{
    hip: THREE.Group;
    knee: THREE.Group;
    foot: THREE.Group;
    isFore: boolean;
    side: number;
  }> = [];

  const createLegRig = (
    parentBone: THREE.Bone,
    offset: THREE.Vector3,
    isFore: boolean,
    side: number
  ) => {
    const sc = isFore ? 0.86 : 1.04;
    const hip = new THREE.Group();
    hip.position.copy(offset);
    parentBone.add(hip);

    const upperMesh = new THREE.Mesh(legUpperGeo, scaleMat);
    upperMesh.scale.setScalar(sc);
    hip.add(upperMesh);

    const knee = new THREE.Group();
    knee.position.set(-0.15 * sc, -0.41 * sc, 0.048 * sc);
    hip.add(knee);

    const kneeCap = new THREE.Mesh(kneeCapGeo, scaleMat);
    kneeCap.scale.setScalar(sc);
    knee.add(kneeCap);

    const lowerMesh = new THREE.Mesh(legLowerGeo, scaleMat);
    lowerMesh.scale.setScalar(sc);
    knee.add(lowerMesh);

    const foot = new THREE.Group();
    foot.position.set(0.15 * sc, -0.34 * sc, 0);
    knee.add(foot);

    for (let t = -1; t <= 1; t++) {
      const talon = new THREE.Mesh(talonGeo, hornMat);
      talon.position.set(0, 0, t * 0.034);
      talon.rotation.y = -t * 0.22;
      foot.add(talon);
    }

    legJoints.push({ hip, knee, foot, isFore, side });
  };

  // Forelegs on Spine Bone 7 (Thorax)
  createLegRig(spineBones[7], new THREE.Vector3(0.04, -0.16, 0.22), true, 1);
  createLegRig(spineBones[7], new THREE.Vector3(0.04, -0.16, -0.22), true, -1);
  // Hind legs on Spine Bone 11 (Pelvis)
  createLegRig(spineBones[11], new THREE.Vector3(0.0, -0.12, 0.18), false, 1);
  createLegRig(spineBones[11], new THREE.Vector3(0.0, -0.12, -0.18), false, -1);

  // ============================================================================
  // 5. BONE-DRIVEN WINGS (Shoulder, Elbow, Wrist + 4 Finger Bones + 14x10/Panel Membrane)
  // ============================================================================
  const WING_PANELS = 4;
  const PANEL_V_STEPS = 10; // 10 spanwise columns per panel (14x10 per panel > 12x8 requirement)
  const WING_COLS = WING_PANELS * PANEL_V_STEPS;
  const WING_ROWS = 14; // 14 radial segments from wrist to scalloped trailing edge

  interface WingRig {
    side: 1 | -1;
    shoulder: THREE.Bone;
    elbow: THREE.Bone;
    wrist: THREE.Bone;
    fingers: THREE.Bone[];
    fingerCurves: THREE.Vector3[][];
    membraneGeo: THREE.BufferGeometry;
    membranePositions: Float32Array;
  }

  const wingRigs: WingRig[] = [];

  for (const side of [-1, 1] as const) {
    const shoulder = new THREE.Bone();
    shoulder.position.set(0.08, 0.16, side * 0.20);
    spineBones[CHEST_BONE_IDX].add(shoulder);

    // Orient both wings so in the 34-deg 3/4 view BOTH spread wide across the stage
    // showing their thick dark leading arm, 4 tapering finger bones, scalloped membrane & red veins
    const humX = side === 1 ? -0.26 : 0.10;
    const humZ = side === 1 ? 0.48 : -0.52;
    const humerusEnd = new THREE.Vector3(humX, 0.30, humZ);
    const humerusGeo = createTaperedCurveGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(humX * 0.5, 0.16, humZ * 0.5),
        humerusEnd,
      ]),
      14,
      12,
      (u) => mix(0.112, 0.088, u),
      0.5
    );
    disposables.push(humerusGeo);
    const humerusMesh = new THREE.Mesh(humerusGeo, wingBoneMat);
    humerusMesh.renderOrder = 3;
    shoulder.add(humerusMesh);

    const elbow = new THREE.Bone();
    elbow.position.copy(humerusEnd);
    shoulder.add(elbow);

    // Dark Thick Leading Forearm Spar: Radius/Ulna (Elbow -> Wrist)
    const foreX = side === 1 ? -0.10 : 0.30;
    const foreZ = side === 1 ? 0.62 : -0.62;
    const forearmEnd = new THREE.Vector3(foreX, 0.38, foreZ);
    const forearmGeo = createTaperedCurveGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(foreX * 0.5, 0.20, foreZ * 0.5),
        forearmEnd,
      ]),
      16,
      12,
      (u) => mix(0.088, 0.068, u),
      0.5
    );
    disposables.push(forearmGeo);
    const forearmMesh = new THREE.Mesh(forearmGeo, wingBoneMat);
    forearmMesh.renderOrder = 3;
    elbow.add(forearmMesh);

    const wrist = new THREE.Bone();
    wrist.position.copy(forearmEnd);
    elbow.add(wrist);

    // Wrist Knuckle Joint & Apex Thumb Claw
    const wristJointGeo = new THREE.SphereGeometry(0.072, 12, 10);
    disposables.push(wristJointGeo);
    wrist.add(new THREE.Mesh(wristJointGeo, wingBoneMat));

    const thumbGeo = createTaperedCurveGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.14, 0.14, side * 0.05),
        new THREE.Vector3(0.24, 0.22, side * 0.02),
      ]),
      10,
      8,
      (u) => 0.038 * (1 - Math.pow(u, 0.85))
    );
    disposables.push(thumbGeo);
    wrist.add(new THREE.Mesh(thumbGeo, hornMat));

    // 4 Tapering Finger Bones Fanning Out Wide Across Each Wing
    const backX = side === 1 ? -0.52 : -0.20;
    const fingerSpecs = [
      // Finger 0: Outer Leading Wingtip Spar
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(backX * 0.22, 0.18, side * 0.52),
        new THREE.Vector3(backX * 0.48, 0.28, side * 1.04),
      ],
      // Finger 1: Upper-Mid Spar
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(backX * 0.52, -0.04, side * 0.44),
        new THREE.Vector3(backX * 1.05, -0.10, side * 0.88),
      ],
      // Finger 2: Lower-Mid Spar
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(backX * 0.68, -0.26, side * 0.31),
        new THREE.Vector3(backX * 1.32, -0.52, side * 0.58),
      ],
      // Finger 3: Inner Trailing Spar
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(backX * 0.72, -0.42, side * 0.14),
        new THREE.Vector3(backX * 1.26, -0.78, side * 0.24),
      ],
    ];

    const fingers: THREE.Bone[] = [];
    const fingerCurves: THREE.Vector3[][] = [];

    for (let f = 0; f < 4; f++) {
      const fBone = new THREE.Bone();
      wrist.add(fBone);
      fingers.push(fBone);

      const pts = fingerSpecs[f];
      const curve = new THREE.CatmullRomCurve3(pts);
      const sampled: THREE.Vector3[] = [];
      for (let r = 0; r <= WING_ROWS; r++) {
        sampled.push(curve.getPointAt(r / WING_ROWS));
      }
      fingerCurves.push(sampled);

      const fGeo = createTaperedCurveGeometry(
        curve,
        20,
        10,
        (u) => mix(f === 0 ? 0.056 : 0.044, 0.011, Math.pow(u, 0.80)),
        0.5
      );
      disposables.push(fGeo);
      const fMesh = new THREE.Mesh(fGeo, wingBoneMat);
      fMesh.renderOrder = 3;
      fBone.add(fMesh);
    }

    // Subdivided Dynamic Wing Membrane Mesh ((WING_ROWS + 1) x (WING_COLS + 1))
    const memVCount = (WING_ROWS + 1) * (WING_COLS + 1);
    const memPositions = new Float32Array(memVCount * 3);
    const memUvs = new Float32Array(memVCount * 2);
    const memIndices: number[] = [];

    for (let r = 0; r <= WING_ROWS; r++) {
      const u = r / WING_ROWS;
      for (let c = 0; c <= WING_COLS; c++) {
        const v = c / WING_COLS;
        const idx = r * (WING_COLS + 1) + c;
        memUvs[idx * 2] = v;
        memUvs[idx * 2 + 1] = u;
      }
    }

    for (let r = 0; r < WING_ROWS; r++) {
      for (let c = 0; c < WING_COLS; c++) {
        const a = r * (WING_COLS + 1) + c;
        const b = (r + 1) * (WING_COLS + 1) + c;
        const d = r * (WING_COLS + 1) + (c + 1);
        const e = (r + 1) * (WING_COLS + 1) + (c + 1);
        memIndices.push(a, b, d, b, e, d);
      }
    }

    const membraneGeo = new THREE.BufferGeometry();
    membraneGeo.setAttribute('position', new THREE.BufferAttribute(memPositions, 3));
    membraneGeo.setAttribute('uv', new THREE.BufferAttribute(memUvs, 2));
    membraneGeo.setIndex(memIndices);
    disposables.push(membraneGeo);

    const membraneMesh = new THREE.Mesh(membraneGeo, wingMembraneMat);
    membraneMesh.frustumCulled = false;
    membraneMesh.renderOrder = 2;
    dragonModel.add(membraneMesh);

    wingRigs.push({
      side,
      shoulder,
      elbow,
      wrist,
      fingers,
      fingerCurves,
      membraneGeo,
      membranePositions: memPositions,
    });
  }

  const sparSamples: THREE.Vector3[][] = Array.from({ length: 5 }, () =>
    Array.from({ length: WING_ROWS + 1 }, () => new THREE.Vector3())
  );

  // ============================================================================
  // 6. ROAR FIRE BREATH PARTICLE SYSTEM (160 Additive Sprites)
  // ============================================================================
  const FIRE_COUNT = 160;
  const firePositions = new Float32Array(FIRE_COUNT * 3);
  const fireColors = new Float32Array(FIRE_COUNT * 3);
  const fireVelocities = Array.from({ length: FIRE_COUNT }, () => new THREE.Vector3());
  const fireLife = new Float32Array(FIRE_COUNT);
  const fireMaxLife = new Float32Array(FIRE_COUNT);

  for (let i = 0; i < FIRE_COUNT; i++) {
    firePositions[i * 3 + 1] = -999;
    fireLife[i] = 0;
    fireMaxLife[i] = 0.45 + Math.random() * 0.45;
  }

  const fireGeo = new THREE.BufferGeometry();
  fireGeo.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));
  fireGeo.setAttribute('color', new THREE.BufferAttribute(fireColors, 3));
  disposables.push(fireGeo);

  const fireMat = new THREE.PointsMaterial({
    size: 0.44,
    map: tex.fireSprite,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });
  disposables.push(fireMat);

  const firePoints = new THREE.Points(fireGeo, fireMat);
  firePoints.frustumCulled = false;
  firePoints.renderOrder = 5;
  dragonModel.add(firePoints);

  // ============================================================================
  // 7. POSE SIMULATION, BOUNDING BOX NORMALIZATION & CAMERA AUTO-FIT
  // ============================================================================
  let currentPose: ZenryuPose = initialPose;
  let roarTimer = 0;
  let wFly = initialPose === 'fly' ? 1 : 0;
  let wRoar = initialPose === 'roar' ? 1 : 0;
  let wSleep = initialPose === 'sleep' ? 1 : 0;

  let pointerNX: number | null = null;
  let pointerNY: number | null = null;
  let smoothPointerX = 0;
  let smoothPointerY = 0;

  let targetDragYaw = 0;
  let smoothDragYaw = 0;
  let isUserDragging = false;
  let isPaused = false;
  let elapsed = 0;

  // Update Dynamic Wing Membranes & Dorsal Spines in dragonModel space
  const updateDynamicWingMembranes = (simTime: number, flapVelocity: number) => {
    dragonRoot.updateMatrixWorld(true);
    _invModelMat.copy(dragonModel.matrixWorld).invert();

    for (const w of wingRigs) {
      for (let f = 0; f < 4; f++) {
        const fBone = w.fingers[f];
        const curvePts = w.fingerCurves[f];
        for (let r = 0; r <= WING_ROWS; r++) {
          sparSamples[f][r]
            .copy(curvePts[r])
            .applyMatrix4(fBone.matrixWorld)
            .applyMatrix4(_invModelMat);
        }
      }

      const shoulderPos = _tmpVecA
        .set(0, 0, 0)
        .applyMatrix4(w.shoulder.matrixWorld)
        .applyMatrix4(_invModelMat);
      const elbowPos = _tmpVecB
        .set(0, 0, 0)
        .applyMatrix4(w.elbow.matrixWorld)
        .applyMatrix4(_invModelMat);
      const hipPos = _tmpVecC
        .set(0, -0.04, w.side * 0.16)
        .applyMatrix4(spineBones[11].matrixWorld)
        .applyMatrix4(_invModelMat);

      for (let r = 0; r <= WING_ROWS; r++) {
        const u = r / WING_ROWS;
        if (u < 0.35) {
          sparSamples[4][r].lerpVectors(elbowPos, shoulderPos, u / 0.35);
        } else {
          sparSamples[4][r].lerpVectors(shoulderPos, hipPos, (u - 0.35) / 0.65);
        }
      }

      const posArr = w.membranePositions;
      for (let p = 0; p < WING_PANELS; p++) {
        const sparA = sparSamples[p];
        const sparB = sparSamples[p + 1];

        for (let s = 0; s <= PANEL_V_STEPS; s++) {
          if (p > 0 && s === 0) continue;
          const c = p * PANEL_V_STEPS + s;
          const t = s / PANEL_V_STEPS;
          const arch = 4 * t * (1 - t);

          for (let r = 0; r <= WING_ROWS; r++) {
            const u = r / WING_ROWS;
            // Deep scalloped trailing edge between fingers
            const scallopPull = arch * Math.pow(u, 1.48) * 0.26;
            const effU = clamp(u * (1 - scallopPull), 0, 1) * WING_ROWS;
            const r0 = Math.floor(effU);
            const r1 = Math.min(WING_ROWS, r0 + 1);
            const rf = effU - r0;

            _tmpVecA.lerpVectors(sparA[r0], sparA[r1], rf);
            _tmpVecB.lerpVectors(sparB[r0], sparB[r1], rf);
            _tmpVecC.lerpVectors(_tmpVecA, _tmpVecB, t);

            // Flex & aerodynamic billow during wing flap
            const billow =
              arch *
              Math.sin(u * Math.PI) *
              (0.075 * flapVelocity + 0.022 * Math.sin(simTime * 6 - u * 3));
            _tmpVecC.y += billow;

            const idx = (r * (WING_COLS + 1) + c) * 3;
            posArr[idx] = _tmpVecC.x;
            posArr[idx + 1] = _tmpVecC.y;
            posArr[idx + 2] = _tmpVecC.z;
          }
        }
      }

      w.membraneGeo.attributes.position.needsUpdate = true;
      w.membraneGeo.computeVertexNormals();
    }

    // Update Instanced Dorsal Spines Embedded Cleanly Along Spine Bones
    for (let s = 0; s < NUM_DORSAL_SPIKES; s++) {
      const u = 0.04 + (s / (NUM_DORSAL_SPIKES - 1)) * 0.88;
      const bFloat = u * (NUM_SPINE_BONES - 1);
      const b0 = Math.floor(bFloat);
      const b1 = Math.min(NUM_SPINE_BONES - 1, b0 + 1);
      const bf = bFloat - b0;

      _tmpVecA
        .set(0, 0, 0)
        .applyMatrix4(spineBones[b0].matrixWorld)
        .applyMatrix4(_invModelMat);
      _tmpVecB
        .set(0, 0, 0)
        .applyMatrix4(spineBones[b1].matrixWorld)
        .applyMatrix4(_invModelMat);
      _tmpVecC.lerpVectors(_tmpVecA, _tmpVecB, bf);

      _tmpVecD.subVectors(_tmpVecA, _tmpVecB).normalize();
      const pitchAngle = Math.atan2(_tmpVecD.y, _tmpVecD.x);

      const normX = -_tmpVecD.y;
      const normY = _tmpVecD.x;
      const { ry } = getSpineRadii(u);
      // Embed spike base at 0.72 * ry so it never floats above the neck/back
      _tmpVecC.x += normX * (ry * 0.72);
      _tmpVecC.y += normY * (ry * 0.72);

      const scaleProfile =
        Math.sin(clamp((u - 0.02) / 0.92, 0, 1) * Math.PI) * 1.05 + 0.26;

      _tmpMat4.makeRotationZ(pitchAngle - 0.20);
      _tmpMat4.scale(_tmpVecA.set(scaleProfile, scaleProfile, scaleProfile));
      _tmpMat4.setPosition(_tmpVecC);
      dorsalInstanced.setMatrixAt(s, _tmpMat4);
    }
    dorsalInstanced.instanceMatrix.needsUpdate = true;
  };

  // Apply Bone Poses for a Given Flap Phase & Pose Weights
  const applyKinematicsAt = (
    simTime: number,
    flapPhase: number,
    flyW: number,
    roarW: number,
    sleepW: number,
    roarEnv: number,
    ptrX: number,
    ptrY: number,
    dragYaw: number,
    hoverBobScale = 1
  ) => {
    const cosFlap = Math.cos(flapPhase);

    // 1. Root Hover Bob, Pitch (follows downstroke) & Drag Yaw
    const hoverBob =
      (flyW * Math.sin(flapPhase - 0.6) * 0.045 - sleepW * 0.08) * hoverBobScale;
    const bodyPitch = flyW * cosFlap * 0.035 + roarW * 0.10 - sleepW * 0.06;
    dragonRoot.position.y = hoverBob;
    dragonRoot.rotation.z = bodyPitch;
    dragonRoot.rotation.y = dragYaw + sleepW * 0.14;

    // Breathing chest scale
    const breathScale =
      1 +
      flyW * Math.sin(simTime * 3.2) * 0.018 +
      roarW * 0.075 +
      sleepW * Math.sin(simTime * 1.4) * 0.028;
    spineBones[CHEST_BONE_IDX].scale.set(1, breathScale, breathScale);

    // 2. Spine, S-Curve Neck (Head Leads Motion) & Traveling Wave Down Tail
    for (let b = 0; b < NUM_SPINE_BONES; b++) {
      if (b === CHEST_BONE_IDX) continue;
      const bone = spineBones[b];
      const rest = spineRestRotations[b];

      if (b < CHEST_BONE_IDX) {
        // Neck & Head chain (5 -> 0): head leads the motion with phase lead and 3/4 hero turn
        const neckFrac = (CHEST_BONE_IDX - b) / CHEST_BONE_IDX;
        const flyNeckPitch = Math.sin(flapPhase + 0.35 - neckFrac * 0.65) * 0.032;
        const flyNeckYaw =
          (b === 0 ? -0.18 : -0.04) + Math.sin(simTime * 1.8 - neckFrac * 0.9) * 0.022;

        const roarNeckPitch =
          (b <= 2 ? -0.08 : 0.10) * (1 + 0.22 * Math.sin(simTime * 18));
        const roarNeckYaw = b === 0 ? -0.14 : -0.03;
        const sleepNeckPitch = -0.12;
        const sleepNeckYaw = 0.16;

        const ptrWeight = (1 - sleepW) * (b === 0 ? 0.45 : 0.14);

        bone.rotation.z =
          rest.z +
          flyW * flyNeckPitch +
          roarW * roarNeckPitch +
          sleepW * sleepNeckPitch -
          ptrY * ptrWeight;
        bone.rotation.y =
          rest.y +
          flyW * flyNeckYaw +
          roarW * roarNeckYaw +
          sleepW * sleepNeckYaw +
          ptrX * ptrWeight;
      } else {
        // Torso, Pelvis & Whip Tail chain (7 -> 19): traveling wave down spine & tail
        const tailIdx = b - CHEST_BONE_IDX;
        const tailFrac = tailIdx / (NUM_SPINE_BONES - 1 - CHEST_BONE_IDX);

        const wavePitch =
          Math.sin(flapPhase - tailIdx * 0.46) * (0.016 + tailFrac * 0.048);
        const waveYaw =
          Math.cos(flapPhase * 0.5 - tailIdx * 0.50) * (0.015 + tailFrac * 0.055);

        const sleepTailYaw = 0.10 + tailFrac * 0.12;
        const sleepTailPitch = -0.025 * (1 - tailFrac);

        bone.rotation.z =
          rest.z +
          (flyW + roarW * 0.5) * wavePitch +
          sleepW * sleepTailPitch;
        bone.rotation.y =
          rest.y +
          (flyW + roarW * 0.5) * waveYaw +
          sleepW * sleepTailYaw;
      }
    }

    // 3. Jaw, Eyelids & Controlled Emissive Pulse (~0.25 in fly, brighter in roar)
    jawBone.rotation.z =
      -flyW * (0.04 + 0.025 * Math.sin(simTime * 2.5)) -
      roarW * (0.56 + 0.07 * Math.sin(simTime * 24)) -
      sleepW * 0.01;
    oralGlowMesh.visible = roarW > 0.12;

    for (const lid of upperEyelids) {
      lid.rotation.z = mix(-0.55, 0.16, sleepW);
    }

    scaleMat.emissiveIntensity =
      0.25 * flyW + (0.85 + roarEnv * 0.45) * roarW + 0.12 * sleepW;
    wingMembraneMat.emissiveIntensity =
      0.95 * flyW + 1.65 * roarW + 0.35 * sleepW;
    eyeMat.emissiveIntensity = 2.8 * flyW + 4.4 * roarW + 0.15 * sleepW;
    emberPointLight.intensity = 1.6 * flyW + 4.2 * roarW + 0.45 * sleepW;

    // 4. Wing Bone Chain Rotations (Shoulder leads, elbow/wrist/fingers lag with phase offsets)
    for (const w of wingRigs) {
      const s = w.side;
      // Note: around +X (forward), negative rotation.x*s lifts the wing UP (+Y), positive lowers it (-Y)
      const shFlap = Math.sin(flapPhase) * 0.13 - 0.10;
      const elFlap = Math.sin(flapPhase - 0.55) * 0.09 - 0.04;
      const wrFlap = Math.sin(flapPhase - 1.05) * 0.07 - 0.03;

      // Roar: Wings spread wide & high in intimidation display
      const shRoar = -0.22 - 0.03 * Math.sin(simTime * 14);
      const elRoar = -0.12;
      const wrRoar = -0.08;

      // Sleep: Wings folded neatly down and back along the flanks
      const shSleep = 0.28;
      const elSleep = 0.32;
      const wrSleep = 0.18;

      w.shoulder.rotation.x =
        s * (flyW * shFlap + roarW * shRoar + sleepW * shSleep);
      w.shoulder.rotation.y =
        -s * (flyW * cosFlap * 0.05 + roarW * 0.14 - sleepW * 0.28);
      w.shoulder.rotation.z =
        flyW * -0.06 + roarW * -0.14 + sleepW * -0.18;

      w.elbow.rotation.x =
        s * (flyW * elFlap + roarW * elRoar + sleepW * elSleep);
      w.wrist.rotation.x =
        s * (flyW * wrFlap + roarW * wrRoar + sleepW * wrSleep);

      for (let f = 0; f < 4; f++) {
        const fingerLag =
          Math.sin(flapPhase - 1.35 - f * 0.22) * (0.06 + f * 0.015);
        const fingerRoar = -0.06 + f * 0.02;
        const fingerSleep = 0.14 + f * 0.05;
        w.fingers[f].rotation.x =
          s * (flyW * fingerLag + roarW * fingerRoar + sleepW * fingerSleep);
        w.fingers[f].rotation.y =
          -s * (roarW * (0.12 - f * 0.03) - sleepW * 0.16);
      }
    }

    // 5. Legs: Tucked Tightly Up Against the Belly in Flight (Zero Dangling!)
    for (const leg of legJoints) {
      if (leg.isFore) {
        leg.hip.rotation.z =
          flyW * -1.04 + roarW * -0.36 + sleepW * -0.76;
        leg.knee.rotation.z =
          flyW * -1.08 + roarW * -0.56 + sleepW * -0.88;
        leg.foot.rotation.z =
          flyW * -0.40 + roarW * 0.22 + sleepW * -0.28;
      } else {
        leg.hip.rotation.z =
          flyW * -1.06 + roarW * -0.46 + sleepW * -0.78;
        leg.knee.rotation.z =
          flyW * -1.10 + roarW * -0.52 + sleepW * -0.90;
        leg.foot.rotation.z =
          flyW * -0.42 + roarW * 0.16 + sleepW * -0.30;
      }
    }

    updateDynamicWingMembranes(simTime, flyW * cosFlap + roarW * 0.55);
  };

  // Compute Pose Extremum Bounding Box (Box3) and Exact Surface Points from Actual Geometry
  interface PoseBoundData {
    box: THREE.Box3;
    center: THREE.Vector3;
    size: THREE.Vector3;
    hullPoints: THREE.Vector3[];
  }

  const sampleCurrentDragonSurface = (
    targetBox: THREE.Box3,
    outPoints: THREE.Vector3[]
  ) => {
    dragonRoot.updateMatrixWorld(true);
    const pushPt = (v: THREE.Vector3) => {
      targetBox.expandByPoint(v);
      outPoints.push(v.clone());
    };

    // Sample spine bones with exact anatomical radii + dorsal spike height
    for (let b = 0; b < spineBones.length; b++) {
      const u = b / (spineBones.length - 1);
      const { rx, ry } = getSpineRadii(u);
      const spikeH = u < 0.92 ? 0.18 * Math.sin(clamp(u / 0.92, 0, 1) * Math.PI) : 0.04;
      _tmpVecA.setFromMatrixPosition(spineBones[b].matrixWorld);
      pushPt(_tmpVecB.set(_tmpVecA.x, _tmpVecA.y + ry + spikeH, _tmpVecA.z));
      pushPt(_tmpVecB.set(_tmpVecA.x, _tmpVecA.y - ry, _tmpVecA.z));
      pushPt(_tmpVecB.set(_tmpVecA.x, _tmpVecA.y, _tmpVecA.z + rx));
      pushPt(_tmpVecB.set(_tmpVecA.x, _tmpVecA.y, _tmpVecA.z - rx));
    }

    // Sample head, horns, snout, and jaw
    headGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i += 6) {
          _tmpVecA.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
          pushPt(_tmpVecA);
        }
      }
    });

    // Sample tail halberd blade tip
    tailTipBone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i += 4) {
          _tmpVecA.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
          pushPt(_tmpVecA);
        }
      }
    });

    // Sample tucked legs
    for (const leg of legJoints) {
      leg.hip.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < pos.count; i += 8) {
            _tmpVecA.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
            pushPt(_tmpVecA);
          }
        }
      });
    }

    // Sample wing membrane perimeter & interior points
    for (const w of wingRigs) {
      const posArr = w.membranePositions;
      for (let r = 0; r <= WING_ROWS; r += 2) {
        for (let c = 0; c <= WING_COLS; c += 2) {
          const idx = (r * (WING_COLS + 1) + c) * 3;
          _tmpVecA
            .set(posArr[idx], posArr[idx + 1], posArr[idx + 2])
            .applyMatrix4(dragonModel.matrixWorld);
          pushPt(_tmpVecA);
        }
      }
    }
  };

  // 1. Normalize Model Origin to the Flight Pose Bounding-Box Center
  dragonModel.position.set(0, 0, 0);
  dragonRoot.position.set(0, 0, 0);
  dragonRoot.rotation.set(0, 0, 0);

  const initialFlyBox = new THREE.Box3();
  const initialPts: THREE.Vector3[] = [];
  for (const phase of [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5]) {
    applyKinematicsAt(0, phase, 1, 0, 0, 0, 0, 0, 0, 1);
    sampleCurrentDragonSurface(initialFlyBox, initialPts);
  }
  const modelCenterOffset = new THREE.Vector3();
  initialFlyBox.getCenter(modelCenterOffset);
  // Shift dragonModel so its bounding-box center sits at (0, 0, 0) of dragonRoot
  dragonModel.position.sub(modelCenterOffset);
  dragonRoot.updateMatrixWorld(true);

  // 2. Precompute Exact Extreme Bounding Boxes & Surface Hull Points for Fly, Roar, and Sleep Poses
  const buildPoseBounds = (pose: ZenryuPose): PoseBoundData => {
    const box = new THREE.Box3();
    const hullPoints: THREE.Vector3[] = [];

    if (pose === 'fly') {
      for (const phase of [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5]) {
        applyKinematicsAt(0, phase, 1, 0, 0, 0, 0, 0, 0, 1);
        sampleCurrentDragonSurface(box, hullPoints);
      }
    } else if (pose === 'roar') {
      for (const phase of [0, Math.PI * 0.5]) {
        applyKinematicsAt(0.6, phase, 0, 1, 0, 1, 0, 0, 0, 1);
        sampleCurrentDragonSurface(box, hullPoints);
      }
      // Include roar fire breath cone reach in front of snout
      const fireTip = new THREE.Vector3(2.25, 0.82, 0.18).sub(modelCenterOffset);
      box.expandByPoint(fireTip);
      hullPoints.push(fireTip);
    } else {
      applyKinematicsAt(0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
      sampleCurrentDragonSurface(box, hullPoints);
    }

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    return { box, center, size, hullPoints };
  };

  const poseBounds: Record<ZenryuPose, PoseBoundData> = {
    fly: buildPoseBounds('fly'),
    roar: buildPoseBounds('roar'),
    sleep: buildPoseBounds('sleep'),
  };

  // Camera Target & Position State (Smoothly eased over ~300ms when pose changes)
  const targetCameraPos = new THREE.Vector3();
  const currentCameraPos = new THREE.Vector3();
  const targetCameraLookAt = new THREE.Vector3();
  const currentCameraLookAt = new THREE.Vector3();

  // Compute Camera Direction Unit Vector for Preset
  // Default ('stage' & 'three-quarter'): 3/4 view rotated ~34 degrees to the side and slightly above
  const getCameraDirectionForPreset = (preset: ZenryuCameraPreset, outDir: THREE.Vector3) => {
    if (preset === 'front') {
      const az = THREE.MathUtils.degToRad(14);
      const el = THREE.MathUtils.degToRad(12);
      outDir.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    } else if (preset === 'side') {
      const az = THREE.MathUtils.degToRad(84);
      const el = THREE.MathUtils.degToRad(10);
      outDir.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    } else {
      // 'stage' and 'three-quarter': True 3/4 Hero Angle (~34 deg to the side and +18 deg above)
      const az = THREE.MathUtils.degToRad(34);
      const el = THREE.MathUtils.degToRad(18);
      outDir.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    }
    return outDir.normalize();
  };

  // Fit Camera to Current Pose Bounding Box & Stage Size (With 7% Margin & Bottom 44px Safe Strip)
  const computeCameraFit = (
    pose: ZenryuPose,
    preset: ZenryuCameraPreset,
    immediate: boolean
  ) => {
    const { w, h } = getStageDimensions();
    const aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    const bounds = poseBounds[pose] || poseBounds.fly;
    getCameraDirectionForPreset(preset, _camDir);

    // Camera orthonormal basis (_camRight, _camUp, _camDir pointing from target toward camera)
    _camRight.crossVectors(_worldUp, _camDir).normalize();
    _camUp.crossVectors(_camDir, _camRight).normalize();

    // First find the exact 2D center of the projected hull in camera plane so the dragon sits dead-center
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const pt of bounds.hullPoints) {
      const px = pt.dot(_camRight);
      const py = pt.dot(_camUp);
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }

    const midX = 0.5 * (minX + maxX);
    const midY = 0.5 * (minY + maxY);
    const midZ = bounds.center.dot(_camDir);

    const viewCenter = new THREE.Vector3()
      .addScaledVector(_camRight, midX)
      .addScaledVector(_camUp, midY)
      .addScaledVector(_camDir, midZ);

    const fovYRad = THREE.MathUtils.degToRad(camera.fov);
    const tanHalfFovY = Math.tan(fovYRad * 0.5);
    const tanHalfFovX = tanHalfFovY * aspect;

    // 7% margin on left, right, top, and above the reserved bottom 44px strip
    const marginX = 0.07;
    const marginTop = 0.07;
    const marginBottom = 0.065;
    const bottomReservedFrac =
      reserveBottomPx > 0 ? Math.min(0.24, reserveBottomPx / Math.max(180, h)) : 0;

    const ndcXHalfSpan = Math.max(0.5, 1.0 - 2.0 * marginX);
    const ndcYTop = 1.0 - 2.0 * marginTop;
    const ndcYBottom = -1.0 + 2.0 * (bottomReservedFrac + marginBottom);
    const ndcYMid = 0.5 * (ndcYTop + ndcYBottom);
    const ndcYHalfSpan = Math.max(0.4, 0.5 * (ndcYTop - ndcYBottom));

    let requiredDist = 2.2;

    for (const pt of bounds.hullPoints) {
      _tmpVecA.subVectors(pt, viewCenter);
      const xCam = Math.abs(_tmpVecA.dot(_camRight));
      const yCam = Math.abs(_tmpVecA.dot(_camUp));
      const zTowardCam = _tmpVecA.dot(_camDir);

      const dX = zTowardCam + xCam / (ndcXHalfSpan * tanHalfFovX);
      const dY = zTowardCam + yCam / (ndcYHalfSpan * tanHalfFovY);
      if (dX > requiredDist) requiredDist = dX;
      if (dY > requiredDist) requiredDist = dY;
    }

    // Offset lookAt along _camUp so viewCenter projects to ndcYMid (above the 44px label strip)
    const verticalWorldShift = -ndcYMid * requiredDist * tanHalfFovY;
    targetCameraLookAt
      .copy(viewCenter)
      .addScaledVector(_camUp, verticalWorldShift);
    targetCameraPos
      .copy(targetCameraLookAt)
      .addScaledVector(_camDir, requiredDist);

    if (immediate) {
      currentCameraLookAt.copy(targetCameraLookAt);
      currentCameraPos.copy(targetCameraPos);
      camera.position.copy(currentCameraPos);
      camera.lookAt(currentCameraLookAt);
      camera.updateProjectionMatrix();
      if (orbitControls) {
        orbitControls.target.copy(currentCameraLookAt);
        orbitControls.update();
      }
    }
  };

  computeCameraFit(initialPose, initialCamera, true);

  // Optional OrbitControls for /dev/zenryu inspector
  if (enableOrbitControls) {
    void import('three/addons/controls/OrbitControls.js').then(({ OrbitControls }) => {
      const ctrl = new OrbitControls(camera, renderer.domElement);
      ctrl.enableDamping = !isSoftwareGl;
      ctrl.dampingFactor = 0.08;
      orbitControls = ctrl;
      computeCameraFit(currentPose, currentCameraPreset, true);
      disposables.push(ctrl);
    });
  }

  // ResizeObserver on the Stage Container itself (Not just window)
  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (isDisposed) return;
      const { w, h } = getStageDimensions();
      renderer.setPixelRatio(getCappedPixelRatio());
      renderer.setSize(w, h, false);
      computeCameraFit(currentPose, currentCameraPreset, true);
      renderer.render(scene, camera);
    });
    resizeObserver.observe(container);
  }

  // Step Simulation by Delta Time
  const stepSimulation = (dt: number) => {
    elapsed += dt;

    if (currentPose === 'roar') {
      roarTimer += dt;
      if (roarTimer >= 1.25) {
        currentPose = 'fly';
        roarTimer = 0;
        computeCameraFit('fly', currentCameraPreset, false);
        onPoseChange?.('fly');
        onRoarComplete?.();
      }
    }

    const fadeSpeed = dt * 4.2;
    wFly = mix(wFly, currentPose === 'fly' ? 1 : 0, Math.min(1, fadeSpeed));
    wRoar = mix(wRoar, currentPose === 'roar' ? 1 : 0, Math.min(1, fadeSpeed));
    wSleep = mix(wSleep, currentPose === 'sleep' ? 1 : 0, Math.min(1, fadeSpeed));

    // Smooth camera ease (~300ms transition between pose fits)
    if (!orbitControls) {
      const camLambda = 10.5;
      currentCameraPos.x = THREE.MathUtils.damp(currentCameraPos.x, targetCameraPos.x, camLambda, dt);
      currentCameraPos.y = THREE.MathUtils.damp(currentCameraPos.y, targetCameraPos.y, camLambda, dt);
      currentCameraPos.z = THREE.MathUtils.damp(currentCameraPos.z, targetCameraPos.z, camLambda, dt);

      currentCameraLookAt.x = THREE.MathUtils.damp(currentCameraLookAt.x, targetCameraLookAt.x, camLambda, dt);
      currentCameraLookAt.y = THREE.MathUtils.damp(currentCameraLookAt.y, targetCameraLookAt.y, camLambda, dt);
      currentCameraLookAt.z = THREE.MathUtils.damp(currentCameraLookAt.z, targetCameraLookAt.z, camLambda, dt);

      camera.position.copy(currentCameraPos);
      camera.lookAt(currentCameraLookAt);
    }

    // Smooth pointer-follow (clamped to +-25 deg = +-0.436 rad)
    const targetPX = pointerNX !== null ? clamp(pointerNX, -1, 1) * 0.436 : 0;
    const targetPY = pointerNY !== null ? clamp(pointerNY, -1, 1) * 0.35 : 0;
    smoothPointerX = THREE.MathUtils.damp(smoothPointerX, targetPX, 6, dt);
    smoothPointerY = THREE.MathUtils.damp(smoothPointerY, targetPY, 6, dt);

    // Smooth drag yaw (clamped to +-60 deg, eases back to 0 when released)
    if (!isUserDragging) {
      targetDragYaw = THREE.MathUtils.damp(targetDragYaw, 0, 5, dt);
    }
    smoothDragYaw = THREE.MathUtils.damp(smoothDragYaw, targetDragYaw, 8, dt);

    // Flap cycle: period = 1.2s
    const flapOmega = (Math.PI * 2) / 1.2;
    const flapPhase = elapsed * flapOmega;
    const roarEnv = wRoar * Math.sin(clamp(roarTimer / 1.25, 0, 1) * Math.PI);

    applyKinematicsAt(
      elapsed,
      flapPhase,
      wFly,
      wRoar,
      wSleep,
      roarEnv,
      smoothPointerX,
      smoothPointerY,
      smoothDragYaw,
      1
    );

    // Roar Fire Breath Particles
    const mouthOrigin = _tmpVecA
      .set(0.38, 0.02, 0)
      .applyMatrix4(jawBone.matrixWorld)
      .applyMatrix4(_invModelMat);
    const mouthForward = _tmpVecB
      .set(1.0, -0.06, 0)
      .transformDirection(headBone.matrixWorld)
      .normalize();

    for (let i = 0; i < FIRE_COUNT; i++) {
      fireLife[i] += dt;
      if (fireLife[i] >= fireMaxLife[i]) {
        const shouldSpawn =
          wRoar > 0.25 || (wFly > 0.5 && i < 12 && Math.random() < 0.16);
        if (shouldSpawn) {
          fireLife[i] = 0;
          fireMaxLife[i] = 0.30 + Math.random() * 0.34;
          firePositions[i * 3] = mouthOrigin.x + (Math.random() - 0.5) * 0.05;
          firePositions[i * 3 + 1] = mouthOrigin.y + (Math.random() - 0.5) * 0.05;
          firePositions[i * 3 + 2] = mouthOrigin.z + (Math.random() - 0.5) * 0.05;

          const speed = (wRoar > 0.25 ? 2.6 : 0.95) + Math.random() * 1.4;
          fireVelocities[i].set(
            mouthForward.x * speed + (Math.random() - 0.5) * 0.72,
            mouthForward.y * speed + (Math.random() - 0.35) * 0.72,
            mouthForward.z * speed + (Math.random() - 0.5) * 0.72
          );
        } else {
          firePositions[i * 3 + 1] = -999;
          continue;
        }
      }

      const lifeRatio = clamp(fireLife[i] / fireMaxLife[i], 0, 1);
      firePositions[i * 3] += fireVelocities[i].x * dt;
      firePositions[i * 3 + 1] += (fireVelocities[i].y + 0.42 * lifeRatio) * dt;
      firePositions[i * 3 + 2] += fireVelocities[i].z * dt;

      const fade = 1 - lifeRatio;
      fireColors[i * 3] = fade;
      fireColors[i * 3 + 1] = Math.pow(fade, 2.1) * 0.82;
      fireColors[i * 3 + 2] = Math.pow(fade, 3.8) * 0.45;
    }

    fireGeo.attributes.position.needsUpdate = true;
    fireGeo.attributes.color.needsUpdate = true;
  };

  // Pre-warm shaders & run initial frame so first render is immediate
  stepSimulation(0.016);
  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }
  renderer.render(scene, camera);

  // ── Render Loop with Software WebGL Fence Pacing ──────────────────────────
  let frameId = 0;
  let isDisposed = false;
  let lastFrameTime = performance.now();

  const afterDraw = (cb: () => void) => {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    } else {
      frameId = window.setTimeout(cb, 80);
    }
  };

  const tick = () => {
    if (isDisposed || isPaused) return;
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.008, (now - lastFrameTime) / 1000));
    lastFrameTime = now;

    stepSimulation(dt);
    orbitControls?.update();
    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = window.requestAnimationFrame(tick);
    }
  };

  const startLoop = () => {
    if (isDisposed || isPaused) return;
    lastFrameTime = performance.now();
    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = window.requestAnimationFrame(tick);
    }
  };

  startLoop();

  return {
    setPose(pose: ZenryuPose) {
      const changed = currentPose !== pose;
      currentPose = pose;
      if (pose === 'roar') {
        roarTimer = 0;
      } else if (pose === 'sleep') {
        roarTimer = 0;
        wRoar = 0;
        for (let i = 0; i < FIRE_COUNT; i++) {
          firePositions[i * 3 + 1] = -999;
          fireLife[i] = fireMaxLife[i];
        }
        fireGeo.attributes.position.needsUpdate = true;
      }
      computeCameraFit(pose, currentCameraPreset, false);
      if (changed) {
        onPoseChange?.(pose);
      }
    },
    getPose() {
      return currentPose;
    },
    triggerRoar() {
      const changed = currentPose !== 'roar';
      currentPose = 'roar';
      roarTimer = 0;
      computeCameraFit('roar', currentCameraPreset, false);
      if (changed) {
        onPoseChange?.('roar');
      }
    },
    setPointerNorm(nx: number | null, ny: number | null) {
      pointerNX = nx;
      pointerNY = ny;
    },
    setDragYaw(yawRad: number, isDragging: boolean) {
      isUserDragging = isDragging;
      targetDragYaw = clamp(yawRad, -Math.PI / 3, Math.PI / 3);
    },
    setCameraPreset(preset: ZenryuCameraPreset) {
      currentCameraPreset = preset;
      computeCameraFit(currentPose, preset, true);
      renderer.render(scene, camera);
    },
    setPaused(paused: boolean) {
      if (isPaused === paused) return;
      isPaused = paused;
      if (paused) {
        window.cancelAnimationFrame(frameId);
        window.clearTimeout(frameId);
      } else {
        startLoop();
      }
    },
    resize() {
      if (isDisposed) return;
      const { w, h } = getStageDimensions();
      renderer.setPixelRatio(getCappedPixelRatio());
      renderer.setSize(w, h, false);
      computeCameraFit(currentPose, currentCameraPreset, true);
      renderer.render(scene, camera);
    },
    renderNow() {
      if (isDisposed) return;
      wFly = currentPose === 'fly' ? 1 : 0;
      wRoar = currentPose === 'roar' ? 1 : 0;
      wSleep = currentPose === 'sleep' ? 1 : 0;
      if (currentPose === 'roar' && roarTimer < 0.35) {
        roarTimer = 0.45;
      }
      if (!orbitControls) {
        currentCameraLookAt.copy(targetCameraLookAt);
        currentCameraPos.copy(targetCameraPos);
        camera.position.copy(currentCameraPos);
        camera.lookAt(currentCameraLookAt);
      }
      // Step simulation at representative mid-upstroke phase so wings show full spread
      elapsed = 0.16;
      stepSimulation(0.016);
      if (currentPose === 'roar') {
        for (let s = 0; s < 8; s++) stepSimulation(0.03);
      }
      orbitControls?.update();
      renderer.render(scene, camera);
    },
    dispose() {
      if (isDisposed) return;
      isDisposed = true;
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      for (const item of disposables) {
        try {
          item.dispose();
        } catch {
          // Ignore disposal errors
        }
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}

function normAttrSetSafe(
  attr: THREE.BufferAttribute,
  idx: number,
  x: number,
  y: number,
  z: number
) {
  attr.setXYZ(idx, x, y, z);
}
