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
  onRoarComplete?: () => void;
}

// ── Software WebGL Detection (Per Three.js Skill Guidelines) ────────────────
export function detectSoftwareWebGL(): { supported: boolean; isSoftwareGl: boolean } {
  if (typeof document === 'undefined') {
    return { supported: false, isSoftwareGl: true };
  }
  try {
    const probeCanvas = document.createElement('canvas');
    const gl =
      probeCanvas.getContext('webgl2') ||
      probeCanvas.getContext('webgl') ||
      probeCanvas.getContext('experimental-webgl');
    if (!gl) {
      return { supported: false, isSoftwareGl: true };
    }
    const glCtx = gl as WebGLRenderingContext;
    const ext = glCtx.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : glCtx.RENDERER;
    const gpu = String(glCtx.getParameter(param) || '');
    glCtx.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return { supported: true, isSoftwareGl };
  } catch {
    return { supported: false, isSoftwareGl: true };
  }
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
    freq *= 2.12;
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

  const COLS = 30; // Circumferential scale columns
  const ROWS = 56; // Longitudinal scale rows along spine

  for (let y = 0; y < SIZE; y++) {
    const v = y / SIZE; // 0..1 around circumference
    // Ventral belly band sits around v in [0.38, 0.62]
    const bellyDist = Math.abs(v - 0.5) / 0.13;
    const isBelly = bellyDist < 1.0;
    const bellyBlend = smoothstep(1.0, 0.72, bellyDist);

    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE; // 0..1 along spine length
      const idx = y * SIZE + x;
      const pIdx = idx * 4;

      // 1. Overlapping Rounded-Diamond / Crescent Dragon Scale Pattern
      const su = u * ROWS;
      const row = Math.floor(su);
      const sv = v * COLS + (row & 1 ? 0.5 : 0.0);
      const col = Math.floor(sv);

      const fu = su - row; // 0..1 from scale base to tip
      const fv = (sv - col - 0.5) * 2.0; // -1..1 across scale width

      // Crescent / rounded-diamond shield contour
      const tipCurve = 1.0 - 0.42 * fv * fv;
      const dTip = (tipCurve - fu) * 1.25;
      const inScale = clamp(dTip * 2.4, 0, 1);

      // Raised overlapping scale lip & recessed root shadow
      const lipRim = smoothstep(0.02, 0.24, dTip) * smoothstep(0.55, 0.18, dTip);
      const rootShadow = smoothstep(0.0, 0.32, fu);
      const centerRidge = Math.exp(-fv * fv * 6.5) * smoothstep(0.1, 0.85, fu) * 0.28;
      const microStriation =
        0.5 + 0.5 * Math.sin(fv * 28 + noise2(u * 40, v * 40) * 1.5);

      const scaleH =
        inScale * (0.25 + 0.55 * fu + lipRim * 0.38 + centerRidge + microStriation * 0.06);

      // Per-scale deterministic color variation (deep blood crimson to obsidian-black)
      const cellHash = hash2(row * 1.7 + 3, (col % COLS) * 2.3 + 7);
      const isCrimsonScale = cellHash > 0.38;
      const crimsonTone = 0.45 + 0.55 * hash2(row + 19, col + 41);

      let scR = isCrimsonScale ? mix(92, 184, crimsonTone) : mix(14, 30, crimsonTone);
      let scG = isCrimsonScale ? mix(8, 19, crimsonTone) : mix(6, 12, crimsonTone);
      let scB = isCrimsonScale ? mix(12, 24, crimsonTone) : mix(9, 16, crimsonTone);

      // Darken scale root crevice, brighten overlapping crescent tip highlight
      const shade = (0.34 + 0.66 * rootShadow) * (0.68 + 0.32 * inScale);
      scR = scR * shade + lipRim * (isCrimsonScale ? 74 : 42) + centerRidge * 38;
      scG = scG * shade + lipRim * 12 + centerRidge * 6;
      scB = scB * shade + lipRim * 14 + centerRidge * 8;

      // 2. Lighter Ridged Transverse Belly Scutes (Armored Bronze-Crimson Ventral Plates)
      const platePhase = u * 48;
      const plateFrac = platePhase - Math.floor(platePhase);
      const plateArch = Math.sin(clamp(plateFrac, 0, 1) * Math.PI);
      const plateGroove = smoothstep(0.0, 0.18, plateFrac) * smoothstep(1.0, 0.82, plateFrac);
      const bellyLateralRib = 1.0 - 0.25 * bellyDist * bellyDist;
      const bellyH = plateGroove * (0.55 + 0.35 * plateArch) * bellyLateralRib;

      const belR = (88 + plateArch * 46) * plateGroove + 18 * (1 - plateGroove);
      const belG = (22 + plateArch * 16) * plateGroove + 6 * (1 - plateGroove);
      const belB = (20 + plateArch * 12) * plateGroove + 8 * (1 - plateGroove);

      // Blend Dorsal/Flank Scales with Ventral Belly Plates
      const finalH = mix(scaleH, bellyH, bellyBlend);
      heightField[idx] = finalH;

      let outR = mix(scR, belR, bellyBlend);
      let outG = mix(scG, belG, bellyBlend);
      let outB = mix(scB, belB, bellyBlend);

      // 3. Branching Voronoi / Fault-Line Ember Cracks in Emissive Map
      // Strongest across chest, neck & flanks (u in 0.10..0.58)
      const chestFactor = smoothstep(0.04, 0.22, u) * smoothstep(0.82, 0.32, u);
      const rNoise = ridgeNoise(u * 14.5 + 1.3, v * 9.5 + 2.7, 3);
      const crackMask =
        smoothstep(0.76, 0.93, rNoise) *
        (1.0 - inScale * 0.55) *
        (0.35 + 0.65 * chestFactor);

      // Belly plate magma seams
      const bellySeam =
        isBelly && plateFrac < 0.11
          ? smoothstep(0.11, 0.0, plateFrac) * (1 - bellyDist * 0.8) * chestFactor * 0.85
          : 0;

      const ember = clamp(crackMask * 1.35 + bellySeam, 0, 1);

      if (ember > 0.02) {
        outR = mix(outR, 255, ember * 0.75);
        outG = mix(outG, 110, ember * 0.65);
        outB = mix(outB, 24, ember * 0.5);
      }

      albedoData[pIdx] = Math.round(clamp(outR, 0, 255));
      albedoData[pIdx + 1] = Math.round(clamp(outG, 0, 255));
      albedoData[pIdx + 2] = Math.round(clamp(outB, 0, 255));
      albedoData[pIdx + 3] = 255;

      // Emissive map (orange-red molten cracks + subtle scale-edge ember rim)
      const emR = ember * 255 + lipRim * chestFactor * 28;
      const emG = ember * ember * 145 + ember * 35;
      const emB = ember * 18;
      emissiveData[pIdx] = Math.round(clamp(emR, 0, 255));
      emissiveData[pIdx + 1] = Math.round(clamp(emG, 0, 255));
      emissiveData[pIdx + 2] = Math.round(clamp(emB, 0, 255));
      emissiveData[pIdx + 3] = 255;

      // Roughness map (glossy scale crowns ~0.34, matte crevices ~0.78)
      const rough = mix(0.78, 0.34, clamp(finalH, 0, 1));
      const rByte = Math.round(clamp(rough * 255, 0, 255));
      roughData[pIdx] = rByte;
      roughData[pIdx + 1] = rByte;
      roughData[pIdx + 2] = rByte;
      roughData[pIdx + 3] = 255;
    }
  }

  // Compute Tangent-Space Normal Map from Scale Heightfield
  const strength = 5.2;
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
    const v = y / WSIZE; // 0 at leading bone, 1 at scalloped trailing edge
    for (let x = 0; x < WSIZE; x++) {
      const u = x / WSIZE; // 0..1 across panel width
      const idx = y * WSIZE + x;
      const pIdx = idx * 4;

      // Branching arterial veins + leathery pleats
      const vMain = ridgeNoise(u * 9.5, v * 7.5, 4);
      const vFine = ridgeNoise(u * 22.0 + 4.1, v * 18.0 + 1.7, 3);
      const vein = smoothstep(0.68, 0.94, vMain) + smoothstep(0.75, 0.95, vFine) * 0.45;
      const pleat = 0.5 + 0.5 * Math.sin(u * Math.PI * 10 + v * 2.5);
      const edgeGlow = smoothstep(0.72, 0.99, v) + smoothstep(0.18, 0.0, Math.abs(u - 0.5) * 2 - 0.78) * 0.35;

      wHeight[idx] = pleat * 0.35 + vein * 0.65;

      const baseR = mix(58, 152, 1 - v * 0.45) + vein * 95 + pleat * 18;
      const baseG = mix(8, 22, 1 - v * 0.45) + vein * 26;
      const baseB = mix(12, 28, 1 - v * 0.45) + vein * 18;

      wAlbImg.data[pIdx] = Math.round(clamp(baseR, 0, 255));
      wAlbImg.data[pIdx + 1] = Math.round(clamp(baseG, 0, 255));
      wAlbImg.data[pIdx + 2] = Math.round(clamp(baseB, 0, 255));
      wAlbImg.data[pIdx + 3] = 255;

      const emIntensity = clamp(vein * 0.85 + edgeGlow * 0.65, 0, 1);
      wEmImg.data[pIdx] = Math.round(clamp(emIntensity * 235, 0, 255));
      wEmImg.data[pIdx + 1] = Math.round(clamp(emIntensity * emIntensity * 68, 0, 255));
      wEmImg.data[pIdx + 2] = Math.round(clamp(emIntensity * 24, 0, 255));
      wEmImg.data[pIdx + 3] = 255;
    }
  }

  for (let y = 0; y < WSIZE; y++) {
    const ym = Math.max(0, y - 1);
    const yp = Math.min(WSIZE - 1, y + 1);
    for (let x = 0; x < WSIZE; x++) {
      const xm = Math.max(0, x - 1);
      const xp = Math.min(WSIZE - 1, x + 1);
      const dx = (wHeight[y * WSIZE + xp] - wHeight[y * WSIZE + xm]) * 3.8;
      const dy = (wHeight[yp * WSIZE + x] - wHeight[ym * WSIZE + x]) * 3.8;
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

  // Slit vertical dragon pupil
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

// ── Custom Tapered Curved Tube Builder (For Horns, Wing Fingers, Limbs, Fangs) ──
function createTaperedCurveGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  tubularSegments: number,
  radialSegments: number,
  radiusFn: (u: number, theta: number) => number
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

      uvs[idx * 2] = u * 2.0;
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

  // Weld radial seam normals so silhouettes are 100% smooth with zero crease
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
const _invRootMat = new THREE.Matrix4();

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
    onRoarComplete,
  } = options;

  const { isSoftwareGl } = detectSoftwareWebGL();
  const disposables: Array<{ dispose: () => void }> = [];

  const width = Math.max(280, container.clientWidth || 390);
  const height = Math.max(180, container.clientHeight || 256);

  const renderer = new THREE.WebGLRenderer({
    alpha: !opaqueStageBackground,
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (opaqueStageBackground) {
    scene.background = new THREE.Color(0x0b0608);
    scene.fog = new THREE.FogExp2(0x0b0608, 0.045);
  }

  // Studio Environment Map (PMREMGenerator + RoomEnvironment)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  pmremGenerator.dispose();
  disposables.push(envTarget);

  // Camera & Optional OrbitControls Ref
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 60);
  let orbitControls: {
    target: THREE.Vector3;
    update: () => void;
    dispose: () => void;
  } | null = null;
  let currentCameraPreset: ZenryuCameraPreset = initialCamera;

  const applyCameraPreset = (preset: ZenryuCameraPreset) => {
    currentCameraPreset = preset;
    const aspect = (container.clientWidth || width) / (container.clientHeight || height);
    // Responsive distance so Zenryu fills ~85% of the stage width on 320px-768px+ screens
    const responsivePullback = aspect < 1.55 ? (1.55 - aspect) * 2.15 : 0;
    let lookX = 0.08;
    let lookY = 0.16;
    let lookZ = 0;

    if (preset === 'front') {
      camera.position.set(5.45, 0.52, 1.45 + responsivePullback * 0.5);
      lookX = 0.65;
      lookY = 0.28;
      lookZ = 0;
    } else if (preset === 'side') {
      camera.position.set(-0.08, 0.26, 6.75 + responsivePullback);
      lookX = -0.05;
      lookY = 0.22;
      lookZ = 0;
    } else if (preset === 'three-quarter') {
      camera.position.set(3.25, 0.72, 5.45 + responsivePullback);
      lookX = 0.04;
      lookY = 0.22;
      lookZ = 0;
    } else {
      // 'stage' — hero framing filling ~85% of the stage width, horizontally centered
      camera.position.set(2.35, 0.54, 5.15 + responsivePullback);
      lookX = 0.04;
      lookY = 0.20;
      lookZ = 0;
    }

    camera.lookAt(lookX, lookY, lookZ);
    camera.updateProjectionMatrix();
    if (orbitControls) {
      orbitControls.target.set(lookX, lookY, lookZ);
      orbitControls.update();
    }
  };
  applyCameraPreset(initialCamera);

  // ── Studio & Twin Crimson Rim Lighting Rig ─────────────────────────────────
  const hemiLight = new THREE.HemisphereLight(0x8899bb, 0x2a080d, 1.15);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff1e0, 2.85);
  keyLight.position.set(4.5, 5.5, 5.0);
  scene.add(keyLight);

  const coolFill = new THREE.DirectionalLight(0x6e85b7, 1.1);
  coolFill.position.set(-5.0, 1.5, 3.5);
  scene.add(coolFill);

  // Rim Light 1: Intense Crimson Back-Top Rim Light
  const crimsonRimTop = new THREE.DirectionalLight(0xff1a2b, 5.8);
  crimsonRimTop.position.set(-2.5, 4.2, -5.5);
  scene.add(crimsonRimTop);

  // Rim Light 2: Molten Ember Back-Right Rim Light
  const crimsonRimSide = new THREE.DirectionalLight(0xff4d1a, 4.8);
  crimsonRimSide.position.set(4.2, -2.2, -4.8);
  scene.add(crimsonRimSide);

  // Dynamic Chest/Jaws Ember Light (Pulses during Roar)
  const emberPointLight = new THREE.PointLight(0xff3b14, 2.4, 7.5, 1.6);
  emberPointLight.position.set(1.4, 0.4, 0.8);
  scene.add(emberPointLight);

  // ── Generate 1024px Procedural Textures & PBR Materials ────────────────────
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 4);
  const tex = getOrCreateZenryuTextures(maxAniso);

  const scaleMat = new THREE.MeshPhysicalMaterial({
    map: tex.scaleAlbedo,
    normalMap: tex.scaleNormal,
    normalScale: new THREE.Vector2(1.45, 1.45),
    roughnessMap: tex.scaleRoughness,
    roughness: 0.44,
    metalness: 0.22,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: tex.scaleEmissive,
    emissiveIntensity: 1.35,
    clearcoat: 0.32,
    clearcoatRoughness: 0.28,
  });
  disposables.push(scaleMat);

  const hornMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x230d12),
    roughness: 0.28,
    metalness: 0.35,
    clearcoat: 0.78,
    clearcoatRoughness: 0.16,
    emissive: new THREE.Color(0x99111b),
    emissiveIntensity: 0.42,
  });
  disposables.push(hornMat);

  const fangMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xf6e3d5),
    roughness: 0.22,
    metalness: 0.1,
    clearcoat: 0.65,
  });
  disposables.push(fangMat);

  const wingMembraneMat = new THREE.MeshPhysicalMaterial({
    map: tex.wingAlbedo,
    normalMap: tex.wingNormal,
    normalScale: new THREE.Vector2(1.1, 1.1),
    emissive: new THREE.Color(0xffffff),
    emissiveMap: tex.wingEmissive,
    emissiveIntensity: 1.45,
    roughness: 0.48,
    metalness: 0.12,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  disposables.push(wingMembraneMat);

  const eyeMat = new THREE.MeshStandardMaterial({
    map: tex.eyeAlbedo,
    emissiveMap: tex.eyeAlbedo,
    emissive: new THREE.Color(0xffaa22),
    emissiveIntensity: 2.6,
    roughness: 0.1,
  });
  disposables.push(eyeMat);

  const oralFireMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xff6618),
  });
  disposables.push(oralFireMat);

  // Root Pivot Group for Whole Dragon
  const dragonRoot = new THREE.Group();
  scene.add(dragonRoot);

  // ============================================================================
  // 1. SPINE CATMULLROMCURVE3 (24 Control Points) & SKINNED MESH BODY (20 Bones)
  // ============================================================================
  const spineControlPoints: THREE.Vector3[] = [
    // Head & Snout (0..2)
    new THREE.Vector3(2.26, 0.72, 0.0),
    new THREE.Vector3(2.02, 0.78, 0.0),
    new THREE.Vector3(1.74, 0.82, 0.0),
    // Muscular S-Curve Neck (3..6)
    new THREE.Vector3(1.48, 0.74, 0.03),
    new THREE.Vector3(1.26, 0.52, 0.06),
    new THREE.Vector3(1.06, 0.26, 0.04),
    new THREE.Vector3(0.84, 0.08, 0.0),
    // Deep Chest & Thorax (7..10)
    new THREE.Vector3(0.56, -0.02, -0.02),
    new THREE.Vector3(0.24, -0.05, -0.04),
    new THREE.Vector3(-0.08, -0.02, -0.02),
    new THREE.Vector3(-0.38, 0.04, 0.02),
    // Hips / Pelvis (11..13)
    new THREE.Vector3(-0.68, 0.08, 0.08),
    new THREE.Vector3(-0.98, 0.05, 0.16),
    new THREE.Vector3(-1.26, -0.04, 0.24),
    // Long Sinuous Sweeping Whip Tail (14..23)
    new THREE.Vector3(-1.54, -0.18, 0.28),
    new THREE.Vector3(-1.80, -0.34, 0.22),
    new THREE.Vector3(-2.04, -0.46, 0.08),
    new THREE.Vector3(-2.22, -0.50, -0.12),
    new THREE.Vector3(-2.32, -0.42, -0.32),
    new THREE.Vector3(-2.30, -0.22, -0.48),
    new THREE.Vector3(-2.16, 0.04, -0.56),
    new THREE.Vector3(-1.94, 0.30, -0.54),
    new THREE.Vector3(-1.68, 0.54, -0.46),
    new THREE.Vector3(-1.42, 0.72, -0.36),
  ];

  const spineCurve = new THREE.CatmullRomCurve3(
    spineControlPoints,
    false,
    'centripetal',
    0.5
  );

  // Hand-tuned anatomical radius profile along spine u in [0, 1]
  const getSpineRadii = (u: number): { rx: number; ry: number; bellyDrop: number } => {
    if (u < 0.085) {
      // Wedge-shaped snout widening to brow/temples
      const t = u / 0.085;
      const r = mix(0.085, 0.24, Math.pow(t, 0.75));
      return { rx: r * 1.08, ry: r * 0.86, bellyDrop: 0 };
    }
    if (u < 0.25) {
      // Muscular arched neck (taller than wide)
      const t = (u - 0.085) / (0.25 - 0.085);
      const r = mix(0.21, 0.31, smoothstep(0, 1, t));
      return { rx: r * 0.92, ry: r * 1.16, bellyDrop: 0.02 };
    }
    if (u < 0.45) {
      // Deep muscular chest & shoulders
      const t = (u - 0.25) / (0.45 - 0.25);
      const chestBell = Math.sin(t * Math.PI);
      const r = 0.31 + chestBell * 0.13;
      return { rx: r * 1.18, ry: r * 1.08, bellyDrop: chestBell * 0.09 };
    }
    if (u < 0.60) {
      // Tapered athletic waist & hips
      const t = (u - 0.45) / (0.60 - 0.45);
      const r = mix(0.31, 0.21, t);
      return { rx: r * 1.04, ry: r * 1.02, bellyDrop: 0.02 };
    }
    // Long whip tail tapering smoothly to tip
    const t = (u - 0.60) / 0.40;
    const r = mix(0.21, 0.032, Math.pow(t, 0.85));
    return { rx: r, ry: r * 1.05, bellyDrop: 0 };
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
    bone.name = ` ZenryuSpine_${b}`;
    spineBones.push(bone);
  }

  // Root at chest bone 6:
  // Forward chain: 6 -> 5 -> 4 -> 3 -> 2 -> 1 -> 0 (Head)
  // Backward chain: 6 -> 7 -> 8 -> ... -> 19 (Tail tip)
  const CHEST_BONE_IDX = 6;
  spineBones[CHEST_BONE_IDX].position.copy(spineBoneRestWorldPos[CHEST_BONE_IDX]);
  dragonRoot.add(spineBones[CHEST_BONE_IDX]);

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

  // Store rest local rotations
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

  // Parallel-transport frames along spineCurve so cross-sections never twist
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
    const N = spineNormals[i]; // Dorsal (+Y-ish)
    const B = spineBinormals[i]; // Lateral (+Z-ish)
    const { rx, ry, bellyDrop } = getSpineRadii(u);

    // Compute 4 smooth skinning weights for longitudinal parameter u
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
    // Deduplicate indices if clamped at ends
    const uniqMap = new Map<number, number>();
    for (let k = 0; k < 4; k++) {
      uniqMap.set(candIndices[k], (uniqMap.get(candIndices[k]) || 0) + rawWeights[k]);
    }
    const entries = Array.from(uniqMap.entries());
    while (entries.length < 4) entries.push([0, 0]);
    const wSum = entries.reduce((acc, e) => acc + e[1], 0) || 1;

    for (let j = 0; j <= BODY_RAD_SEGS; j++) {
      const v = j / BODY_RAD_SEGS;
      const theta = v * Math.PI * 2; // 0 = top dorsal (+N), PI = ventral belly (-N)
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      // Anatomical cross-section sculpting
      let radN = ry * cos;
      let radB = rx * sin;

      // Defined dorsal ridge crest along neck/back
      if (cos > 0.65 && u > 0.06 && u < 0.88) {
        radN += Math.pow((cos - 0.65) / 0.35, 2) * ry * 0.22;
      }
      // Defined brow ridges & flat nasal bridge on head (u < 0.085)
      if (u < 0.085) {
        const browFactor = Math.exp(-Math.pow(Math.abs(theta - 0.72), 2) * 8) +
          Math.exp(-Math.pow(Math.abs(theta - (Math.PI * 2 - 0.72)), 2) * 8);
        radN += browFactor * 0.045;
        radB *= 1.0 + browFactor * 0.18;
      }
      // Muscular pectoral keel drop on chest
      if (cos < -0.3) {
        radN -= bellyDrop * Math.pow((-cos - 0.3) / 0.7, 1.4);
      }

      const vIdx = i * (BODY_RAD_SEGS + 1) + j;
      bodyPositions[vIdx * 3] = ringCenter.x + radN * N.x + radB * B.x;
      bodyPositions[vIdx * 3 + 1] = ringCenter.y + radN * N.y + radB * B.y;
      bodyPositions[vIdx * 3 + 2] = ringCenter.z + radN * N.z + radB * B.z;

      bodyUvs[vIdx * 2] = u * 3.8;
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

  // Weld radial seam normals so there is never a seam line along the dorsal ridge
  const bodyNorm = bodyGeo.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i <= BODY_LEN_SEGS; i++) {
    const i0 = i * (BODY_RAD_SEGS + 1);
    const i1 = i0 + BODY_RAD_SEGS;
    const nx = (bodyNorm.getX(i0) + bodyNorm.getX(i1)) * 0.5;
    const ny = (bodyNorm.getY(i0) + bodyNorm.getY(i1)) * 0.5;
    const nz = (bodyNorm.getZ(i0) + bodyNorm.getZ(i1)) * 0.5;
    const len = Math.hypot(nx, ny, nz) || 1;
    bodyNorm.setXYZ(i0, nx / len, ny / len, nz / len);
    bodyNorm.setXYZ(i1, nx / len, ny / len, nz / len);
  }
  bodyNorm.needsUpdate = true;
  bodyGeo.computeTangents();
  disposables.push(bodyGeo);

  // CRITICAL: Update world matrices of all spine bones BEFORE binding Skeleton so boneInverses match rest pose!
  dragonRoot.updateMatrixWorld(true);

  const bodyMesh = new THREE.SkinnedMesh(bodyGeo, scaleMat);
  const bodySkeleton = new THREE.Skeleton(spineBones);
  bodyMesh.bind(bodySkeleton);
  bodyMesh.frustumCulled = false;
  dragonRoot.add(bodyMesh);

  // ============================================================================
  // 2. HEAD DETAILS: HINGED JAW, FANGS, 4 HORNS, CHEEK SPIKES, EYES & EYELIDS
  // ============================================================================
  const headBone = spineBones[0]; // Positioned at (2.26, 0.72, 0.0) in rest pose
  const headGroup = new THREE.Group();
  // Local coordinates relative to spineBones[0] (2.26, 0.72, 0.0)
  headBone.add(headGroup);

  // Sculpted Upper Skull & Snout Bridge so Head Reads as a Fierce Wedge Skull
  const skullCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.38, 0.04, 0),
    new THREE.Vector3(-0.16, 0.05, 0),
    new THREE.Vector3(0.06, 0.02, 0),
  ]);
  const skullGeo = createTaperedCurveGeometry(skullCurve, 18, 16, (u, theta) => {
    const w = mix(0.21, 0.095, u);
    const h = mix(0.14, 0.068, u);
    return Math.hypot(h * Math.cos(theta), w * Math.sin(theta));
  });
  disposables.push(skullGeo);
  headGroup.add(new THREE.Mesh(skullGeo, scaleMat));

  // Sculpted Armored Brow Ridges Overhanging Eyes in a Fierce Scowl
  for (const side of [-1, 1] as const) {
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.32, 0.11, side * 0.155),
      new THREE.Vector3(-0.16, 0.14, side * 0.165),
      new THREE.Vector3(-0.02, 0.08, side * 0.12),
    ]);
    const browGeo = createTaperedCurveGeometry(browCurve, 16, 10, (u) =>
      0.046 * Math.sin(clamp(u, 0.05, 0.95) * Math.PI)
    );
    disposables.push(browGeo);
    const browMesh = new THREE.Mesh(browGeo, hornMat);
    headGroup.add(browMesh);
  }

  // Nasal Horn Crest at Snout Tip
  const nasalCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.02, 0.05, 0),
    new THREE.Vector3(0.07, 0.16, 0),
    new THREE.Vector3(0.02, 0.25, 0),
  ]);
  const nasalGeo = createTaperedCurveGeometry(
    nasalCurve,
    14,
    10,
    (u) => 0.038 * (1 - Math.pow(u, 0.85))
  );
  disposables.push(nasalGeo);
  headGroup.add(new THREE.Mesh(nasalGeo, hornMat));

  // Four Swept-Back Elder Horns + Cheek Spikes
  for (const side of [-1, 1] as const) {
    // Primary Crown Horn (Long, S-curved, striated)
    const primaryHornCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.32, 0.14, side * 0.13),
      new THREE.Vector3(-0.62, 0.34, side * 0.25),
      new THREE.Vector3(-0.98, 0.48, side * 0.33),
      new THREE.Vector3(-1.32, 0.65, side * 0.29),
    ]);
    const primaryHornGeo = createTaperedCurveGeometry(
      primaryHornCurve,
      32,
      14,
      (u) => (0.092 * (1 - Math.pow(u, 0.82)) + 0.004) * (1 + 0.06 * Math.sin(u * 55))
    );
    disposables.push(primaryHornGeo);
    headGroup.add(new THREE.Mesh(primaryHornGeo, hornMat));

    // Secondary Lower Temporal Horn
    const secHornCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.36, 0.05, side * 0.17),
      new THREE.Vector3(-0.64, 0.14, side * 0.29),
      new THREE.Vector3(-0.92, 0.24, side * 0.34),
    ]);
    const secHornGeo = createTaperedCurveGeometry(
      secHornCurve,
      24,
      12,
      (u) => 0.062 * (1 - Math.pow(u, 0.85)) + 0.003
    );
    disposables.push(secHornGeo);
    headGroup.add(new THREE.Mesh(secHornGeo, hornMat));

    // Cheek Spike
    const cheekCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.30, -0.03, side * 0.17),
      new THREE.Vector3(-0.52, -0.07, side * 0.27),
    ]);
    const cheekGeo = createTaperedCurveGeometry(
      cheekCurve,
      10,
      8,
      (u) => 0.042 * (1 - u)
    );
    disposables.push(cheekGeo);
    headGroup.add(new THREE.Mesh(cheekGeo, hornMat));
  }

  // Upper Jaw Fangs
  const fangConeGeo = new THREE.ConeGeometry(0.017, 0.072, 10);
  disposables.push(fangConeGeo);
  for (const side of [-1, 1] as const) {
    for (let f = 0; f < 5; f++) {
      const fx = -0.22 + f * 0.052;
      const fz = side * mix(0.125, 0.072, f / 4);
      const isCanine = f === 3;
      const fang = new THREE.Mesh(fangConeGeo, fangMat);
      fang.position.set(fx, -0.048, fz);
      fang.rotation.z = Math.PI + 0.12;
      fang.scale.setScalar(isCanine ? 1.32 : 0.82);
      headGroup.add(fang);
    }
  }

  // Separate Hinged Lower Jaw Bone & Mesh (Rotates Open for Roar)
  const jawBone = new THREE.Bone();
  jawBone.position.set(-0.34, -0.045, 0);
  headGroup.add(jawBone);

  const jawCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 0.0, 0),
    new THREE.Vector3(0.16, -0.03, 0),
    new THREE.Vector3(0.34, -0.01, 0),
  ]);
  const jawGeo = createTaperedCurveGeometry(jawCurve, 18, 16, (u, theta) => {
    const w = mix(0.16, 0.075, u);
    const h = mix(0.082, 0.044, u);
    return Math.hypot(h * Math.cos(theta), w * Math.sin(theta));
  });
  disposables.push(jawGeo);
  const jawMesh = new THREE.Mesh(jawGeo, scaleMat);
  jawBone.add(jawMesh);

  // Inner Fiery Oral Cavity Glow (Visible when Jaw Opens)
  const oralGlowGeo = new THREE.SphereGeometry(0.075, 12, 10);
  disposables.push(oralGlowGeo);
  const oralGlowMesh = new THREE.Mesh(oralGlowGeo, oralFireMat);
  oralGlowMesh.scale.set(1.8, 0.55, 1.1);
  oralGlowMesh.position.set(0.14, 0.025, 0);
  jawBone.add(oralGlowMesh);

  // Lower Jaw Fangs
  for (const side of [-1, 1] as const) {
    for (let f = 0; f < 4; f++) {
      const fx = 0.08 + f * 0.055;
      const fz = side * mix(0.11, 0.062, f / 3);
      const fang = new THREE.Mesh(fangConeGeo, fangMat);
      fang.position.set(fx, 0.03, fz);
      fang.rotation.z = -0.15;
      fang.scale.setScalar(f === 3 ? 1.18 : 0.76);
      jawBone.add(fang);
    }
  }

  // Deep-Set Glowing Molten Eyes + Animatable Eyelids Tucked Under Armored Brow
  const eyeGeo = new THREE.SphereGeometry(0.038, 18, 16);
  const eyelidGeo = new THREE.SphereGeometry(
    0.042,
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
    eyeSocket.position.set(-0.17, 0.068, side * 0.132);
    headGroup.add(eyeSocket);

    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.scale.set(1.25, 0.85, 0.95);
    eyeMesh.rotation.y = side > 0 ? 0.18 : Math.PI - 0.18;
    eyeSocket.add(eyeMesh);

    const lidTop = new THREE.Mesh(eyelidGeo, scaleMat);
    lidTop.scale.set(1.26, 0.9, 0.98);
    lidTop.rotation.z = -0.55; // Open in fly/roar; rotates to 0.15 when sleeping
    eyeSocket.add(lidTop);
    upperEyelids.push(lidTop);
  }

  // ============================================================================
  // 3. DORSAL SPINES (InstancedMesh Along Spine) & TAIL HALBERD BLADE TIP
  // ============================================================================
  const NUM_DORSAL_SPIKES = 34;
  const spikeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.06, 0.14, 0),
    new THREE.Vector3(-0.16, 0.28, 0),
  ]);
  const spikeGeo = createTaperedCurveGeometry(spikeCurve, 12, 8, (u, theta) => {
    const r = 0.048 * (1 - Math.pow(u, 0.85));
    // Compress laterally into a sharp dorsal fin/blade
    return r * (0.38 + 0.62 * Math.abs(Math.cos(theta)));
  });
  disposables.push(spikeGeo);

  const dorsalInstanced = new THREE.InstancedMesh(
    spikeGeo,
    hornMat,
    NUM_DORSAL_SPIKES
  );
  dorsalInstanced.frustumCulled = false;
  dragonRoot.add(dorsalInstanced);

  // Tail Halberd Blade Tip on Final Tail Bone
  const tailTipBone = spineBones[NUM_SPINE_BONES - 1];
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0.05, 0);
  bladeShape.quadraticCurveTo(-0.12, 0.18, -0.38, 0.08);
  bladeShape.quadraticCurveTo(-0.24, 0.02, -0.46, 0.0);
  bladeShape.quadraticCurveTo(-0.24, -0.02, -0.38, -0.08);
  bladeShape.quadraticCurveTo(-0.12, -0.18, 0.05, 0);

  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
    steps: 1,
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.015,
    bevelSegments: 3,
  });
  bladeGeo.center();
  disposables.push(bladeGeo);
  const tailBladeMesh = new THREE.Mesh(bladeGeo, hornMat);
  tailBladeMesh.position.set(-0.14, 0.08, 0);
  tailBladeMesh.rotation.z = -0.65;
  tailTipBone.add(tailBladeMesh);

  // ============================================================================
  // 4. FOUR ARTICULATED LEGS WITH TALONS (2 Forelegs, 2 Hind Legs)
  // ============================================================================
  const legUpperGeo = createTaperedCurveGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.08, -0.26, 0.04),
      new THREE.Vector3(-0.16, -0.48, 0.06),
    ]),
    14,
    12,
    (u) => mix(0.13, 0.075, u)
  );
  const legLowerGeo = createTaperedCurveGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.10, -0.22, 0.02),
      new THREE.Vector3(0.18, -0.42, 0.0),
    ]),
    14,
    12,
    (u) => mix(0.075, 0.044, u)
  );
  const talonGeo = createTaperedCurveGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.09, -0.02, 0),
      new THREE.Vector3(0.16, -0.09, 0),
    ]),
    10,
    8,
    (u) => 0.026 * (1 - Math.pow(u, 0.85))
  );
  const kneeCapGeo = new THREE.SphereGeometry(0.082, 12, 10);
  disposables.push(legUpperGeo, legLowerGeo, talonGeo, kneeCapGeo);

  const legJoints: Array<{ hip: THREE.Group; knee: THREE.Group; isFore: boolean; side: number }> = [];

  const createLegRig = (parentBone: THREE.Bone, offset: THREE.Vector3, isFore: boolean, side: number) => {
    const sc = isFore ? 0.88 : 1.08;
    const hip = new THREE.Group();
    hip.position.copy(offset);
    parentBone.add(hip);

    const upperMesh = new THREE.Mesh(legUpperGeo, scaleMat);
    upperMesh.scale.setScalar(sc);
    hip.add(upperMesh);

    const knee = new THREE.Group();
    knee.position.set(-0.16 * sc, -0.47 * sc, 0.055 * sc);
    hip.add(knee);

    const kneeCap = new THREE.Mesh(kneeCapGeo, scaleMat);
    kneeCap.scale.setScalar(sc);
    knee.add(kneeCap);

    const lowerMesh = new THREE.Mesh(legLowerGeo, scaleMat);
    lowerMesh.scale.setScalar(isFore ? 0.88 : 1.05);
    knee.add(lowerMesh);

    const foot = new THREE.Group();
    foot.position.set(0.16, -0.38 * (isFore ? 0.88 : 1.05), 0);
    knee.add(foot);

    for (let t = -1; t <= 1; t++) {
      const talon = new THREE.Mesh(talonGeo, hornMat);
      talon.position.set(0, 0, t * 0.038);
      talon.rotation.y = -t * 0.24;
      foot.add(talon);
    }

    legJoints.push({ hip, knee, isFore, side });
  };

  // Forelegs on Spine Bone 7 (Thorax)
  createLegRig(spineBones[7], new THREE.Vector3(0.06, -0.18, 0.24), true, 1);
  createLegRig(spineBones[7], new THREE.Vector3(0.06, -0.18, -0.24), true, -1);
  // Hind legs on Spine Bone 11 (Pelvis)
  createLegRig(spineBones[11], new THREE.Vector3(0.0, -0.14, 0.20), false, 1);
  createLegRig(spineBones[11], new THREE.Vector3(0.0, -0.14, -0.20), false, -1);

  // ============================================================================
  // 5. ARTICULATED BAT-STYLE WINGS (Bone Chain + 4 Finger Tubes + Dynamic Membrane)
  // ============================================================================
  const WING_PANELS = 4;
  const PANEL_V_STEPS = 8; // 4 panels x 8 = 32 spanwise segments across wing
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
    shoulder.position.set(0.08, 0.22, side * 0.24);
    spineBones[CHEST_BONE_IDX].add(shoulder);

    // Leading Upper Wing Arm (Humerus)
    const humerusEnd = new THREE.Vector3(-0.18, 0.42, side * 0.72);
    const humerusGeo = createTaperedCurveGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        humerusEnd.clone().multiplyScalar(0.5),
        humerusEnd,
      ]),
      14,
      12,
      (u) => mix(0.11, 0.082, u)
    );
    disposables.push(humerusGeo);
    shoulder.add(new THREE.Mesh(humerusGeo, scaleMat));

    const elbow = new THREE.Bone();
    elbow.position.copy(humerusEnd);
    shoulder.add(elbow);

    // Forearm Leading Spar (Radius/Ulna)
    const forearmEnd = new THREE.Vector3(0.26, 0.48, side * 0.92);
    const forearmGeo = createTaperedCurveGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        forearmEnd.clone().multiplyScalar(0.5),
        forearmEnd,
      ]),
      16,
      12,
      (u) => mix(0.082, 0.062, u)
    );
    disposables.push(forearmGeo);
    elbow.add(new THREE.Mesh(forearmGeo, scaleMat));

    const wrist = new THREE.Bone();
    wrist.position.copy(forearmEnd);
    elbow.add(wrist);

    // Apex Thumb Claw at Wing Wrist
    const thumbGeo = createTaperedCurveGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.18, 0.14, side * 0.06),
        new THREE.Vector3(0.28, 0.22, side * 0.02),
      ]),
      10,
      8,
      (u) => 0.036 * (1 - Math.pow(u, 0.85))
    );
    disposables.push(thumbGeo);
    wrist.add(new THREE.Mesh(thumbGeo, hornMat));

    // 4 Sweeping Wing Finger Bones + 5th Inner Flank Anchor
    const fingerSpecs = [
      // Finger 0: Outer Leading Wingtip Spar
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.18, 0.24, side * 0.88),
        new THREE.Vector3(-0.62, 0.34, side * 1.72),
      ],
      // Finger 1: Upper-Mid Spar
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.42, 0.02, side * 0.78),
        new THREE.Vector3(-1.02, -0.08, side * 1.48),
      ],
      // Finger 2: Lower-Mid Spar
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.56, -0.24, side * 0.56),
        new THREE.Vector3(-1.18, -0.52, side * 1.02),
      ],
      // Finger 3: Inner Trailing Spar
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-0.58, -0.44, side * 0.22),
        new THREE.Vector3(-1.12, -0.82, side * 0.42),
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
        (u) => mix(f === 0 ? 0.052 : 0.038, 0.007, Math.pow(u, 0.82))
      );
      disposables.push(fGeo);
      fBone.add(new THREE.Mesh(fGeo, f === 0 ? scaleMat : hornMat));
    }

    // Build Subdivided Dynamic Wing Membrane Mesh ((WING_ROWS + 1) x (WING_COLS + 1))
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
    dragonRoot.add(membraneMesh);

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

  // Pre-allocated spar sample arrays for dynamic membrane evaluation (Zero GC)
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
    size: 0.48,
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
  dragonRoot.add(firePoints);

  // ============================================================================
  // 7. ANIMATION STATE MACHINE (FLY, ROAR, SLEEP + 300ms Crossfade + Pointer/Drag)
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

  // Optional OrbitControls for /dev/zenryu inspector
  if (enableOrbitControls) {
    void import('three/addons/controls/OrbitControls.js').then(({ OrbitControls }) => {
      const ctrl = new OrbitControls(camera, renderer.domElement);
      ctrl.enableDamping = !isSoftwareGl;
      ctrl.dampingFactor = 0.08;
      orbitControls = ctrl;
      applyCameraPreset(currentCameraPreset);
      disposables.push(ctrl);
    });
  }

  // Update Dynamic Wing Membranes & Dorsal Spines each frame
  const updateDynamicWingMembranes = (elapsed: number, flapVelocity: number) => {
    dragonRoot.updateMatrixWorld(true);
    _invRootMat.copy(dragonRoot.matrixWorld).invert();

    for (const w of wingRigs) {
      // Sample 3D points in dragonRoot space along all 4 fingers
      for (let f = 0; f < 4; f++) {
        const fBone = w.fingers[f];
        const curvePts = w.fingerCurves[f];
        for (let r = 0; r <= WING_ROWS; r++) {
          sparSamples[f][r]
            .copy(curvePts[r])
            .applyMatrix4(fBone.matrixWorld)
            .applyMatrix4(_invRootMat);
        }
      }

      // 5th Spar: Inner wing membrane anchor along shoulder -> flank -> hip
      const shoulderPos = _tmpVecA
        .set(0, 0, 0)
        .applyMatrix4(w.shoulder.matrixWorld)
        .applyMatrix4(_invRootMat);
      const elbowPos = _tmpVecB
        .set(0, 0, 0)
        .applyMatrix4(w.elbow.matrixWorld)
        .applyMatrix4(_invRootMat);
      const hipPos = _tmpVecC
        .set(0, -0.06, w.side * 0.18)
        .applyMatrix4(spineBones[11].matrixWorld)
        .applyMatrix4(_invRootMat);

      for (let r = 0; r <= WING_ROWS; r++) {
        const u = r / WING_ROWS;
        if (u < 0.35) {
          sparSamples[4][r].lerpVectors(elbowPos, shoulderPos, u / 0.35);
        } else {
          sparSamples[4][r].lerpVectors(shoulderPos, hipPos, (u - 0.35) / 0.65);
        }
      }

      // Interpolate subdivided membrane vertices with scalloped trailing edge & aerodynamic billow
      const posArr = w.membranePositions;
      for (let p = 0; p < WING_PANELS; p++) {
        const sparA = sparSamples[p];
        const sparB = sparSamples[p + 1];

        for (let s = 0; s <= PANEL_V_STEPS; s++) {
          if (p > 0 && s === 0) continue; // Shared seam column
          const c = p * PANEL_V_STEPS + s;
          const t = s / PANEL_V_STEPS;
          const arch = 4 * t * (1 - t); // Parabolic arch across panel

          for (let r = 0; r <= WING_ROWS; r++) {
            const u = r / WING_ROWS;
            // Scalloped trailing edge pulls inward toward wrist at panel midpoint
            const scallopPull = arch * Math.pow(u, 1.65) * 0.22;
            const effU = clamp(u * (1 - scallopPull), 0, 1) * WING_ROWS;
            const r0 = Math.floor(effU);
            const r1 = Math.min(WING_ROWS, r0 + 1);
            const rf = effU - r0;

            _tmpVecA.lerpVectors(sparA[r0], sparA[r1], rf);
            _tmpVecB.lerpVectors(sparB[r0], sparB[r1], rf);
            _tmpVecC.lerpVectors(_tmpVecA, _tmpVecB, t);

            // Aerodynamic billow during wing flap
            const billow =
              arch *
              Math.sin(u * Math.PI) *
              (0.085 * flapVelocity + 0.025 * Math.sin(elapsed * 6 - u * 3));
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

    // Update Instanced Dorsal Spines along Spine Bones (Perpendicular to Spine Tangent)
    for (let s = 0; s < NUM_DORSAL_SPIKES; s++) {
      const u = 0.09 + (s / (NUM_DORSAL_SPIKES - 1)) * 0.83;
      const bFloat = u * (NUM_SPINE_BONES - 1);
      const b0 = Math.floor(bFloat);
      const b1 = Math.min(NUM_SPINE_BONES - 1, b0 + 1);
      const bf = bFloat - b0;

      _tmpVecA
        .set(0, 0, 0)
        .applyMatrix4(spineBones[b0].matrixWorld)
        .applyMatrix4(_invRootMat);
      _tmpVecB
        .set(0, 0, 0)
        .applyMatrix4(spineBones[b1].matrixWorld)
        .applyMatrix4(_invRootMat);
      _tmpVecC.lerpVectors(_tmpVecA, _tmpVecB, bf);

      // Forward tangent (from tail toward head: b0 - b1)
      _tmpVecD.subVectors(_tmpVecA, _tmpVecB).normalize();
      const pitchAngle = Math.atan2(_tmpVecD.y, _tmpVecD.x);

      // True dorsal normal in XY plane perpendicular to spine tangent
      const normX = -_tmpVecD.y;
      const normY = _tmpVecD.x;
      const { ry } = getSpineRadii(u);
      _tmpVecC.x += normX * (ry * 0.84);
      _tmpVecC.y += normY * (ry * 0.84);

      // Size profile: largest over shoulders/chest, smaller toward tail
      const scaleProfile =
        Math.sin(clamp((u - 0.06) / 0.88, 0, 1) * Math.PI) * 1.15 + 0.28;

      _tmpMat4.makeRotationZ(pitchAngle - 0.22);
      _tmpMat4.scale(_tmpVecA.set(scaleProfile, scaleProfile, scaleProfile));
      _tmpMat4.setPosition(_tmpVecC);
      dorsalInstanced.setMatrixAt(s, _tmpMat4);
    }
    dorsalInstanced.instanceMatrix.needsUpdate = true;
  };

  // Update Scene Simulation by Elapsed & Delta Time
  let elapsed = 0;

  const stepSimulation = (dt: number) => {
    elapsed += dt;

    // Crossfade pose weights over ~300ms (rate = 1 / 0.30 = 3.33/s)
    if (currentPose === 'roar') {
      roarTimer += dt;
      if (roarTimer >= 1.25) {
        currentPose = 'fly';
        roarTimer = 0;
        onRoarComplete?.();
      }
    }

    const fadeSpeed = dt * 4.2;
    wFly = mix(wFly, currentPose === 'fly' ? 1 : 0, Math.min(1, fadeSpeed));
    wRoar = mix(wRoar, currentPose === 'roar' ? 1 : 0, Math.min(1, fadeSpeed));
    wSleep = mix(wSleep, currentPose === 'sleep' ? 1 : 0, Math.min(1, fadeSpeed));

    // Smooth pointer-follow (clamped to +-25 deg = +-0.436 rad)
    const targetPX = pointerNX !== null ? clamp(pointerNX, -1, 1) * 0.436 : 0;
    const targetPY = pointerNY !== null ? clamp(pointerNY, -1, 1) * 0.35 : 0;
    smoothPointerX = THREE.MathUtils.damp(smoothPointerX, targetPX, 6, dt);
    smoothPointerY = THREE.MathUtils.damp(smoothPointerY, targetPY, 6, dt);

    // Smooth drag yaw (eases back to 0 when released)
    if (!isUserDragging) {
      targetDragYaw = THREE.MathUtils.damp(targetDragYaw, 0, 5, dt);
    }
    smoothDragYaw = THREE.MathUtils.damp(smoothDragYaw, targetDragYaw, 8, dt);

    // Flap cycle: period = 1.2s -> omega = 2 * PI / 1.2 = 5.236 rad/s
    const flapOmega = (Math.PI * 2) / 1.2;
    const flapPhase = elapsed * flapOmega;
    const sinFlap = Math.sin(flapPhase);
    const cosFlap = Math.cos(flapPhase);

    // Roar envelope (swells quickly, holds, eases out)
    const roarEnv =
      wRoar * Math.sin(clamp(roarTimer / 1.25, 0, 1) * Math.PI);

    // 1. Root Hover Bob, Pitch & Yaw
    const hoverBob = wFly * Math.sin(flapPhase - 0.6) * 0.14 - wSleep * 0.24;
    const bodyPitch =
      wFly * cosFlap * 0.055 + wRoar * 0.16 - wSleep * 0.08;
    dragonRoot.position.y = hoverBob;
    dragonRoot.rotation.z = bodyPitch;
    // Slight 3/4 heroic presentation angle + user drag yaw
    dragonRoot.rotation.y = -0.18 + smoothDragYaw + wSleep * 0.22;

    // Breathing chest scale
    const breathScale =
      1 +
      wFly * Math.sin(elapsed * 3.2) * 0.02 +
      wRoar * 0.085 +
      wSleep * Math.sin(elapsed * 1.4) * 0.032;
    spineBones[CHEST_BONE_IDX].scale.set(1, breathScale, breathScale);

    // 2. Spine, Neck & Tail Serpentine Bone Rotations
    for (let b = 0; b < NUM_SPINE_BONES; b++) {
      if (b === CHEST_BONE_IDX) continue;
      const bone = spineBones[b];
      const rest = spineRestRotations[b];

      if (b < CHEST_BONE_IDX) {
        // Neck & Head chain (5 -> 0)
        const neckFrac = (CHEST_BONE_IDX - b) / CHEST_BONE_IDX;
        const flyNeckPitch = Math.sin(flapPhase - neckFrac * 0.9) * 0.045;
        const flyNeckYaw = Math.sin(elapsed * 1.8 - neckFrac * 1.2) * 0.035;

        const roarNeckPitch =
          (b <= 2 ? -0.12 : 0.14) * (1 + 0.3 * Math.sin(elapsed * 18));
        const sleepNeckPitch = -0.16;
        const sleepNeckYaw = 0.22;

        // Pointer follow distributed across neck & head
        const ptrWeight = (1 - wSleep) * (b === 0 ? 0.45 : 0.14);

        bone.rotation.z =
          rest.z +
          wFly * flyNeckPitch +
          wRoar * roarNeckPitch +
          wSleep * sleepNeckPitch -
          smoothPointerY * ptrWeight;
        bone.rotation.y =
          rest.y +
          wFly * flyNeckYaw +
          wSleep * sleepNeckYaw +
          smoothPointerX * ptrWeight;
      } else {
        // Torso, Pelvis & Whip Tail chain (7 -> 19)
        const tailIdx = b - CHEST_BONE_IDX;
        const tailFrac = tailIdx / (NUM_SPINE_BONES - 1 - CHEST_BONE_IDX);

        // Traveling sine wave down the spine & tail
        const wavePitch =
          Math.sin(flapPhase - tailIdx * 0.48) * (0.03 + tailFrac * 0.09);
        const waveYaw =
          Math.cos(flapPhase * 0.5 - tailIdx * 0.52) * (0.025 + tailFrac * 0.11);

        // Curled sleeping tail around the body
        const sleepTailYaw = 0.14 + tailFrac * 0.16;
        const sleepTailPitch = -0.04 * (1 - tailFrac);

        bone.rotation.z =
          rest.z +
          (wFly + wRoar * 0.6) * wavePitch +
          wSleep * sleepTailPitch;
        bone.rotation.y =
          rest.y +
          (wFly + wRoar * 0.6) * waveYaw +
          wSleep * sleepTailYaw;
      }
    }

    // 3. Jaw, Eyelids & Emissive Pulse
    jawBone.rotation.z =
      -wFly * (0.05 + 0.03 * Math.sin(elapsed * 2.5)) -
      wRoar * (0.58 + 0.08 * Math.sin(elapsed * 24)) -
      wSleep * 0.01;
    oralGlowMesh.visible = wRoar > 0.12;

    for (const lid of upperEyelids) {
      lid.rotation.z = mix(-0.58, 0.16, wSleep);
    }

    scaleMat.emissiveIntensity =
      1.35 * wFly + (2.65 + roarEnv * 1.1) * wRoar + 0.42 * wSleep;
    wingMembraneMat.emissiveIntensity =
      1.45 * wFly + 2.4 * wRoar + 0.45 * wSleep;
    eyeMat.emissiveIntensity = 2.6 * wFly + 4.2 * wRoar + 0.15 * wSleep;
    emberPointLight.intensity = 2.4 * wFly + 5.5 * wRoar + 0.6 * wSleep;

    // 4. Wing Bone Chain Rotations (Right-hand rule around +X: -s lifts wing UP, +s folds wing DOWN)
    for (const w of wingRigs) {
      const s = w.side;
      // Fly phase offsets
      const shFlap = Math.sin(flapPhase) * 0.52 + 0.18;
      const elFlap = Math.sin(flapPhase - 0.55) * 0.38 - 0.10;
      const wrFlap = Math.sin(flapPhase - 1.05) * 0.34;

      // Roar: Wings spread high and wide in intimidation display (upward = +shRoar)
      const shRoar = 0.56 + 0.06 * Math.sin(elapsed * 14);
      const elRoar = 0.22;
      const wrRoar = 0.16;

      // Sleep: Wings folded neatly down and back against the flanks (downward = -shSleep)
      const shSleep = -0.58;
      const elSleep = -0.64;
      const wrSleep = -0.35;

      w.shoulder.rotation.x =
        -s * (wFly * shFlap + wRoar * shRoar + wSleep * shSleep);
      w.shoulder.rotation.y =
        -s * (wFly * cosFlap * 0.12 + wRoar * 0.18 - wSleep * 0.42);

      w.elbow.rotation.x =
        -s * (wFly * elFlap + wRoar * elRoar + wSleep * elSleep);
      w.wrist.rotation.x =
        -s * (wFly * wrFlap + wRoar * wrRoar + wSleep * wrSleep);

      for (let f = 0; f < 4; f++) {
        const fingerLag = Math.sin(flapPhase - 1.35 - f * 0.22) * (0.20 + f * 0.05);
        const fingerRoar = 0.12 - f * 0.04;
        const fingerSleep = -0.28 - f * 0.10;
        w.fingers[f].rotation.x =
          -s * (wFly * fingerLag + wRoar * fingerRoar + wSleep * fingerSleep);
        w.fingers[f].rotation.y =
          -s * (wRoar * (0.14 - f * 0.05) - wSleep * 0.22);
      }
    }

    // 5. Legs (Tucked in Flight, Braced in Roar, Folded/Perched in Sleep)
    for (const leg of legJoints) {
      if (leg.isFore) {
        leg.hip.rotation.z =
          wFly * -0.58 + wRoar * 0.15 + wSleep * 0.35;
        leg.knee.rotation.z =
          wFly * 0.85 + wRoar * -0.35 + wSleep * -0.68;
      } else {
        leg.hip.rotation.z =
          wFly * -0.65 + wRoar * -0.12 + wSleep * 0.28;
        leg.knee.rotation.z =
          wFly * 0.92 + wRoar * 0.35 + wSleep * -0.55;
      }
    }

    // 6. Recompute Dynamic Wing Membranes & Dorsal Spines
    updateDynamicWingMembranes(elapsed, wFly * cosFlap + wRoar * 0.65);

    // 7. Roar Fire Breath Particles
    const mouthOrigin = _tmpVecA
      .set(0.24, 0.02, 0)
      .applyMatrix4(jawBone.matrixWorld)
      .applyMatrix4(_invRootMat);
    const mouthForward = _tmpVecB
      .set(1.0, -0.08, 0)
      .transformDirection(headBone.matrixWorld)
      .normalize();

    for (let i = 0; i < FIRE_COUNT; i++) {
      fireLife[i] += dt;
      if (fireLife[i] >= fireMaxLife[i]) {
        // Respawn particle if roaring (or occasional ember spark when flying)
        const shouldSpawn =
          wRoar > 0.25 || (wFly > 0.5 && i < 14 && Math.random() < 0.18);
        if (shouldSpawn) {
          fireLife[i] = 0;
          fireMaxLife[i] = 0.32 + Math.random() * 0.38;
          firePositions[i * 3] = mouthOrigin.x + (Math.random() - 0.5) * 0.06;
          firePositions[i * 3 + 1] = mouthOrigin.y + (Math.random() - 0.5) * 0.06;
          firePositions[i * 3 + 2] = mouthOrigin.z + (Math.random() - 0.5) * 0.06;

          const speed = (wRoar > 0.25 ? 3.2 : 1.1) + Math.random() * 1.8;
          fireVelocities[i].set(
            mouthForward.x * speed + (Math.random() - 0.5) * 0.85,
            mouthForward.y * speed + (Math.random() - 0.35) * 0.85,
            mouthForward.z * speed + (Math.random() - 0.5) * 0.85
          );
        } else {
          firePositions[i * 3 + 1] = -999;
          continue;
        }
      }

      const lifeRatio = clamp(fireLife[i] / fireMaxLife[i], 0, 1);
      firePositions[i * 3] += fireVelocities[i].x * dt;
      firePositions[i * 3 + 1] += (fireVelocities[i].y + 0.45 * lifeRatio) * dt;
      firePositions[i * 3 + 2] += fireVelocities[i].z * dt;

      // Color gradient: white-hot yellow -> molten orange -> crimson -> fade
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
    },
    getPose() {
      return currentPose;
    },
    triggerRoar() {
      currentPose = 'roar';
      roarTimer = 0;
    },
    setPointerNorm(nx: number | null, ny: number | null) {
      pointerNX = nx;
      pointerNY = ny;
    },
    setDragYaw(yawRad: number, isDragging: boolean) {
      isUserDragging = isDragging;
      targetDragYaw = clamp(yawRad, -Math.PI / 3, Math.PI / 3); // +-60 deg
    },
    setCameraPreset(preset: ZenryuCameraPreset) {
      applyCameraPreset(preset);
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
      const w = Math.max(260, container.clientWidth || 390);
      const h = Math.max(180, container.clientHeight || 256);
      camera.aspect = w / h;
      applyCameraPreset(initialCamera);
      renderer.setSize(w, h, false);
      renderer.render(scene, camera);
    },
    renderNow() {
      if (isDisposed) return;
      stepSimulation(0.016);
      orbitControls?.update();
      renderer.render(scene, camera);
    },
    dispose() {
      if (isDisposed) return;
      isDisposed = true;
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
