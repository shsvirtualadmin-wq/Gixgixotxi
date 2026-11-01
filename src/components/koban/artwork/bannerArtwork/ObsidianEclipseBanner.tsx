import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { storeVideoGovernor } from '../../fx/StoreLoopVideo';
import { useSmoothMode } from '@/utils/smoothMode';

let nextObsidianInstanceId = 1;

export interface ObsidianEclipseBannerProps {
  canAnimate?: boolean;
  className?: string;
}

function createGoldVeinTextures(): {
  emissiveMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = size;
  emissiveCanvas.height = size;
  const ectx = emissiveCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d')!;

  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  let seed = 918273;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = 0; i < 2400; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1 + rand() * 3.5;
    const v = Math.floor(110 + rand() * 36);
    bctx.fillStyle = `rgb(${v},${v},${v})`;
    bctx.beginPath();
    bctx.arc(x, y, r, 0, Math.PI * 2);
    bctx.fill();
  }

  for (let v = 0; v < 36; v++) {
    let x = rand() * size;
    let y = rand() * size;
    let ang = rand() * Math.PI * 2;
    const steps = 32 + Math.floor(rand() * 36);
    const isCrimsonAccent = v % 5 === 0;

    for (let s = 0; s < steps; s++) {
      const nx = x + Math.cos(ang) * 10;
      const ny = y + Math.sin(ang) * 10;
      ang += (rand() - 0.5) * 0.68;

      const t = 1 - s / steps;
      ectx.strokeStyle = isCrimsonAccent
        ? `rgba(220, 38, 38, ${(0.4 * t).toFixed(3)})`
        : `rgba(245, 158, 11, ${(0.48 * t).toFixed(3)})`;
      ectx.lineWidth = 5.0 * t + 1.2;
      ectx.lineCap = 'round';
      ectx.beginPath();
      ectx.moveTo(x, y);
      ectx.lineTo(nx, ny);
      ectx.stroke();

      ectx.strokeStyle = isCrimsonAccent
        ? `rgba(251, 146, 60, ${(0.9 * t).toFixed(3)})`
        : `rgba(254, 240, 138, ${(0.96 * t).toFixed(3)})`;
      ectx.lineWidth = 1.8 * t + 0.5;
      ectx.beginPath();
      ectx.moveTo(x, y);
      ectx.lineTo(nx, ny);
      ectx.stroke();

      bctx.strokeStyle = 'rgb(28,28,28)';
      bctx.lineWidth = 3.2 * t + 0.8;
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

function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x050208);

  const goldPanelMat = new THREE.MeshBasicMaterial({ color: 0xffd166, side: THREE.DoubleSide });
  const goldPanelGeo = new THREE.PlaneGeometry(12, 4);
  const goldPanel = new THREE.Mesh(goldPanelGeo, goldPanelMat);
  goldPanel.position.set(4, 5, 4);
  goldPanel.lookAt(0, 0, 0);
  envScene.add(goldPanel);

  const crimsonPanelMat = new THREE.MeshBasicMaterial({ color: 0xd71921, side: THREE.DoubleSide });
  const crimsonPanelGeo = new THREE.PlaneGeometry(14, 5);
  const crimsonPanel = new THREE.Mesh(crimsonPanelGeo, crimsonPanelMat);
  crimsonPanel.position.set(-5, -4, 3);
  crimsonPanel.lookAt(0, 0, 0);
  envScene.add(crimsonPanel);

  const rimStripMat = new THREE.MeshBasicMaterial({ color: 0xfff3b0, side: THREE.DoubleSide });
  const rimStripGeo = new THREE.PlaneGeometry(18, 1.5);
  const rimStrip = new THREE.Mesh(rimStripGeo, rimStripMat);
  rimStrip.position.set(2, 6, -4);
  rimStrip.lookAt(0, 0, 0);
  envScene.add(rimStrip);

  const envTex = pmrem.fromScene(envScene, 0.03).texture;
  pmrem.dispose();
  goldPanelGeo.dispose();
  goldPanelMat.dispose();
  crimsonPanelGeo.dispose();
  crimsonPanelMat.dispose();
  rimStripGeo.dispose();
  rimStripMat.dispose();
  return envTex;
}

/**
 * Obsidian Eclipse (id: obsidian-eclipse) — Mythic Animated 3D Banner
 *
 * Dual-Path Architecture:
 * - True Real-Time 3D Three.js/WebGL scene with 3D black eclipse sun, animated gold corona
 *   & diamond-ring flare shader, MeshPhysicalMaterial bevelled obsidian ring with glowing
 *   gold vein texture, 18 orbiting monolith slabs, and 1,200 GPU-instanced/shader embers with DoF.
 * - Pre-rendered 180-frame (6.0s @ 30fps, 1200x675) seamless <video> loop (banner.webm + banner.mp4)
 *   and static hero poster (/assets/store/obsidian-eclipse/poster.webp) for instant first paint,
 *   low-end/reduced-motion fallback, and zero layout shift.
 * - Counts as 1 active playing slot in the global max-8-playing governor on the Browse grid.
 */
export const ObsidianEclipseBanner: React.FC<ObsidianEclipseBannerProps> = ({
  canAnimate = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const instanceIdRef = useRef<string>(`obsidian-eclipse-${nextObsidianInstanceId++}`);

  const [isVisible, setIsVisible] = useState(true);
  const [isGovernorActive, setIsGovernorActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => storeVideoGovernor.isReducedMotion());
  const { smoothMode } = useSmoothMode();

  const posterUrl = '/assets/store/obsidian-eclipse/poster.webp';
  const webmUrl = '/assets/store/obsidian-eclipse/banner.webm';
  const mp4Url = '/assets/store/obsidian-eclipse/banner.mp4';

  const effectiveAnimate = Boolean(canAnimate && !reducedMotion && !smoothMode);

  // 1. Track prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mql.matches);
      const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    } catch {
      return;
    }
  }, []);

  // 2. IntersectionObserver so offscreen banners consume 0 GPU/CPU
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.05, rootMargin: '80px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 3. Register with the global Max-8-Playing Governor (priority 5 for Mythic Featured banner)
  useEffect(() => {
    if (!effectiveAnimate) {
      setIsGovernorActive(false);
      return;
    }
    const id = instanceIdRef.current;
    return storeVideoGovernor.register({
      id,
      videoEl: videoRef.current,
      isVisible,
      canAnimate: effectiveAnimate,
      priority: 5,
      setActiveState: setIsGovernorActive,
    });
  }, [effectiveAnimate, isVisible]);

  useEffect(() => {
    storeVideoGovernor.update(instanceIdRef.current, {
      isVisible,
      canAnimate: effectiveAnimate,
      priority: 5,
    });
  }, [isVisible, effectiveAnimate]);

  // 4. Real-Time 3D Three.js / WebGL Scene (runs only when visible & governor-active)
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || !effectiveAnimate || !isVisible || !isGovernorActive) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) return;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);

      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
      renderer.setPixelRatio(
        isSoftwareGl ? 1 : Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)
      );
    } catch {
      return;
    }

    const canvasEl = renderer.domElement;
    canvasEl.className = 'w-full h-full block pointer-events-none';
    host.innerHTML = '';
    host.appendChild(canvasEl);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030106);
    const envTex = createStudioEnvironment(renderer);
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 100);

    // Backdrop shader (God rays + Nebula + Stars + Dithered Film Grain + Vignette)
    const backdropUniforms = {
      uPhaseCos: { value: 1.0 },
      uPhaseSin: { value: 0.0 },
      uAspect: { value: 16 / 9 },
      uEclipseCenter: { value: new THREE.Vector2(0.635, 0.54) },
    };

    const backdropGeo = new THREE.PlaneGeometry(2, 2);
    const backdropMat = new THREE.ShaderMaterial({
      uniforms: backdropUniforms,
      depthWrite: false,
      depthTest: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.999, 1.0);
        }
      `,
      fragmentShader: `
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

          vec2 loopOffset = vec2(uPhaseCos, uPhaseSin) * 0.65;
          vec3 col = vec3(0.010, 0.004, 0.016);

          float rightMask = smoothstep(0.12, 0.52, uv.x);
          float neb1 = fbm(uv * vec2(3.2, 2.2) + loopOffset * 0.35);
          float neb2 = fbm(uv * vec2(5.5, 4.0) - loopOffset * 0.25 + 4.2);
          vec3 crimsonNebula = vec3(0.48, 0.03, 0.07) * pow(neb1, 2.2) * rightMask * 0.75;
          vec3 goldNebula = vec3(0.75, 0.42, 0.06) * pow(neb2 * neb1, 2.8) * rightMask * 0.55;
          col += crimsonNebula + goldNebula;

          vec2 starGrid1 = floor(uv * vec2(320.0, 180.0));
          vec2 starUv1 = fract(uv * vec2(320.0, 180.0)) - 0.5;
          float sh1 = hash21(starGrid1);
          if (sh1 > 0.991 && dist > 0.19) {
            float twinkle = 0.65 + 0.35 * sin(sh1 * 62.8 + uPhaseSin * 3.14159);
            float dStar = length(starUv1);
            float starBri = smoothstep(0.28, 0.0, dStar) * twinkle * (0.35 + 0.65 * rightMask);
            col += mix(vec3(1.0, 0.88, 0.68), vec3(1.0, 0.55, 0.55), fract(sh1 * 17.3)) * starBri;
          }

          float rayNoise1 = fbm(vec2(cos(angle) * 2.5 + loopOffset.x, sin(angle) * 2.5 + loopOffset.y));
          float rayNoise2 = fbm(vec2(cos(angle * 3.0) * 1.8 - loopOffset.y, sin(angle * 3.0) * 1.8 + loopOffset.x));
          float rays = pow(clamp(rayNoise1 * 0.65 + rayNoise2 * 0.55, 0.0, 1.0), 2.4);

          float radialFalloff = smoothstep(1.05, 0.16, dist) * smoothstep(0.14, 0.22, dist);
          vec3 godRayCrimson = vec3(0.84, 0.09, 0.13) * rays * radialFalloff * 1.15;
          vec3 godRayGold = vec3(1.0, 0.74, 0.22) * pow(rays, 1.8) * smoothstep(0.65, 0.17, dist) * 1.35;
          col += (godRayCrimson + godRayGold) * (0.25 + 0.75 * rightMask);

          float coronaGlow = exp(-max(dist - 0.175, 0.0) * 8.5) * smoothstep(0.14, 0.185, dist);
          float coronaPulse = 0.92 + 0.08 * (uPhaseCos * 0.6 + uPhaseSin * 0.8);
          col += vec3(1.0, 0.68, 0.16) * coronaGlow * 1.25 * coronaPulse;
          col += vec3(0.85, 0.12, 0.16) * exp(-max(dist - 0.18, 0.0) * 4.2) * 0.42;

          float leftCalm = smoothstep(0.0, 0.38, uv.x);
          col *= mix(0.28, 1.0, leftCalm);

          vec2 vPos = uv * (1.0 - uv.yx);
          float vig = pow(clamp(vPos.x * vPos.y * 16.0, 0.0, 1.0), 0.22);
          col *= mix(0.42, 1.0, vig);

          float grain = hash21(uv * vec2(1200.0, 675.0)) - 0.5;
          col += grain * (1.8 / 255.0);

          gl_FragColor = vec4(max(col, 0.0), 1.0);
        }
      `,
    });

    const backdropQuad = new THREE.Mesh(backdropGeo, backdropMat);
    backdropQuad.frustumCulled = false;
    backdropQuad.renderOrder = -10;
    scene.add(backdropQuad);

    const centerpiece = new THREE.Group();
    centerpiece.position.set(1.26, 0.16, 0.0);
    scene.add(centerpiece);

    const eclipseGroup = new THREE.Group();
    eclipseGroup.position.set(0.0, 0.0, -0.55);
    centerpiece.add(eclipseGroup);

    const blackSunGeo = new THREE.SphereGeometry(1.12, 48, 48);
    const blackSunMat = new THREE.ShaderMaterial({
      uniforms: {
        uPhaseCos: { value: 1.0 },
        uPhaseSin: { value: 0.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        uniform float uPhaseCos;
        void main() {
          float ndotv = clamp(dot(vNormal, vViewDir), 0.0, 1.0);
          float rim = pow(1.0 - ndotv, 5.2);
          float pulse = 0.92 + 0.08 * uPhaseCos;
          vec3 core = vec3(0.004, 0.002, 0.008);
          vec3 goldRim = mix(vec3(0.88, 0.16, 0.12), vec3(1.0, 0.86, 0.35), rim) * rim * 2.8 * pulse;
          gl_FragColor = vec4(core + goldRim, 1.0);
        }
      `,
    });
    const blackSunMesh = new THREE.Mesh(blackSunGeo, blackSunMat);
    eclipseGroup.add(blackSunMesh);

    const coronaUniforms = {
      uPhaseCos: { value: 1.0 },
      uPhaseSin: { value: 0.0 },
    };
    const coronaGeo = new THREE.PlaneGeometry(5.8, 5.8);
    const coronaMat = new THREE.ShaderMaterial({
      uniforms: coronaUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv * 2.0 - 1.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uPhaseCos;
        uniform float uPhaseSin;

        void main() {
          float r = length(vUv);
          float ang = atan(vUv.y, vUv.x);

          float ringDist = abs(r - 0.392);
          float coronaRing = exp(-ringDist * 42.0) * smoothstep(0.35, 0.39, r);

          float wave = sin(ang * 9.0 + uPhaseSin * 2.2) * cos(ang * 5.0 - uPhaseCos * 2.2);
          float prominence = exp(-max(r - 0.39, 0.0) * (14.0 - 4.0 * wave)) * smoothstep(0.37, 0.395, r);

          vec2 flarePos = vec2(cos(2.42), sin(2.42)) * 0.392;
          vec2 df = vUv - flarePos;
          float dFlare = length(df);
          float pulse = 0.88 + 0.12 * (uPhaseCos * 0.7 + uPhaseSin * 0.7);

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
      `,
    });
    const coronaPlane = new THREE.Mesh(coronaGeo, coronaMat);
    coronaPlane.position.set(0, 0, 0.08);
    eclipseGroup.add(coronaPlane);

    // Bevelled Obsidian Ring + Gold Veins
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

    const mainTorusGeo = new THREE.TorusGeometry(1.78, 0.21, 8, 96);
    const mainTorus = new THREE.Mesh(mainTorusGeo, obsidianRingMat);
    mainTorus.scale.set(1, 1, 0.68);
    ringGroup.add(mainTorus);

    const innerBevelGeo = new THREE.TorusGeometry(1.53, 0.045, 6, 72);
    ringGroup.add(new THREE.Mesh(innerBevelGeo, obsidianTrimMat));

    const outerBevelGeo = new THREE.TorusGeometry(2.03, 0.05, 6, 72);
    ringGroup.add(new THREE.Mesh(outerBevelGeo, obsidianTrimMat));

    const claspGeo = new THREE.BoxGeometry(0.18, 0.36, 0.32);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const clasp = new THREE.Mesh(claspGeo, obsidianTrimMat);
      clasp.position.set(Math.cos(a) * 1.78, Math.sin(a) * 1.78, 0);
      clasp.rotation.z = a;
      ringGroup.add(clasp);
    }

    // Orbiting Monolith Slabs
    const slabOrbitGroup = new THREE.Group();
    slabOrbitGroup.rotation.set(0.92, -0.34, 0.22);
    centerpiece.add(slabOrbitGroup);

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

    const slabs: Array<{
      mesh: THREE.Mesh;
      baseAngle: number;
      radius: number;
      zOffset: number;
      phaseOffset: number;
    }> = [];
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

    // 1,200 GPU Embers with Depth of Field
    const EMBER_COUNT = 1200;
    const emberGeo = new THREE.BufferGeometry();
    const emberSeeds = new Float32Array(EMBER_COUNT * 4);
    const emberParams = new Float32Array(EMBER_COUNT * 3);
    const dummyPos = new Float32Array(EMBER_COUNT * 3);

    let es = 13579;
    const erand = () => {
      es = (es + 0x6d2b79f5) >>> 0;
      let t = Math.imul(es ^ (es >>> 15), 1 | es);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    for (let i = 0; i < EMBER_COUNT; i++) {
      const inRight = erand() > 0.14;
      emberSeeds[i * 4 + 0] = inRight ? -0.4 + erand() * 4.4 : -3.8 + erand() * 3.2;
      emberSeeds[i * 4 + 1] = -2.4 + erand() * 4.8;
      emberSeeds[i * 4 + 2] = -2.8 + erand() * 4.6;
      emberSeeds[i * 4 + 3] = erand();

      emberParams[i * 3 + 0] = 0.08 + erand() * 0.26;
      emberParams[i * 3 + 1] = 1.0 + Math.floor(erand() * 2.0);
      emberParams[i * 3 + 2] = erand();
    }

    emberGeo.setAttribute('position', new THREE.BufferAttribute(dummyPos, 3));
    emberGeo.setAttribute('aSeed', new THREE.BufferAttribute(emberSeeds, 4));
    emberGeo.setAttribute('aParam', new THREE.BufferAttribute(emberParams, 3));

    const emberUniforms = { uPhase: { value: 0.0 } };
    const emberMat = new THREE.ShaderMaterial({
      uniforms: emberUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: `
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

          float yCycle = (t - 0.5) * 3.6;
          vec3 pos = vec3(
            aSeed.x + cos(ang + aSeed.w * tau) * aParam.x,
            mod(aSeed.y + yCycle + 2.4, 4.8) - 2.4,
            aSeed.z + sin(ang + aSeed.w * tau) * aParam.x * 0.6
          );

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float focalDist = abs(-mvPosition.z - 6.1);
          vDofBlur = clamp(focalDist / 2.2, 0.0, 1.0);
          float baseSize = mix(4.5, 18.0, vDofBlur) * (0.65 + 0.7 * aSeed.w);
          gl_PointSize = baseSize * (6.0 / max(-mvPosition.z, 1.5));

          float edgeFade = sin(t * 3.14159265);
          float leftDim = smoothstep(-3.2, -0.2, pos.x);
          vAlpha = edgeFade * edgeFade * mix(0.85, 0.28, vDofBlur) * (0.2 + 0.8 * leftDim);
          vColorMix = aParam.z;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying float vAlpha;
        varying float vColorMix;
        varying float vDofBlur;

        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float r = length(uv);
          if (r > 1.0) discard;

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
      `,
    });

    const emberPoints = new THREE.Points(emberGeo, emberMat);
    scene.add(emberPoints);

    const syncSize = () => {
      if (!renderer || !host) return;
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width || 600));
      const h = Math.max(1, Math.round(rect.height || 338));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      backdropUniforms.uAspect.value = w / h;
    };

    syncSize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(syncSize);
      ro.observe(host);
    }

    let rafId: number | null = null;
    const startTime = performance.now();
    const LOOP_DURATION_SEC = 6.0;

    const tick = (now: number) => {
      if (!renderer) return;
      const elapsedSec = (now - startTime) / 1000;
      const phase = (elapsedSec % LOOP_DURATION_SEC) / LOOP_DURATION_SEC;
      const theta = phase * Math.PI * 2.0;
      const thetaCyclic = theta - 0.96 * Math.sin(theta);
      const pCos = Math.cos(theta);
      const pSin = Math.sin(theta) * Math.sin(theta * 0.5);

      backdropUniforms.uPhaseCos.value = pCos;
      backdropUniforms.uPhaseSin.value = pSin;
      blackSunMat.uniforms.uPhaseCos.value = pCos;
      blackSunMat.uniforms.uPhaseSin.value = pSin;
      coronaUniforms.uPhaseCos.value = pCos;
      coronaUniforms.uPhaseSin.value = pSin;
      emberUniforms.uPhase.value = thetaCyclic / (Math.PI * 2.0);

      emissiveMap.offset.x = thetaCyclic / (Math.PI * 2.0);
      obsidianRingMat.emissiveIntensity =
        2.15 + 0.55 * (1.0 - pCos) + 0.25 * pSin;
      obsidianTrimMat.emissiveIntensity = 1.15 + 0.35 * (1.0 - pCos);

      ringGroup.rotation.x = 0.92 + 0.065 * pSin;
      ringGroup.rotation.y = -0.34 + 0.055 * (1.0 - pCos) * 0.5;
      ringGroup.rotation.z = 0.22 + thetaCyclic;

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
        s.mesh.rotation.set(thetaCyclic + s.phaseOffset, -thetaCyclic + s.phaseOffset * 0.5, ang);
      }

      const pushFactor = (1.0 - pCos) * 0.5;
      const baseZ = 6.2;
      camera.position.set(
        0.065 * pSin,
        0.038 * (1.0 - pCos) * 0.5,
        baseZ * (1.0 - 0.03 * pushFactor)
      );
      camera.lookAt(0.32, 0.06, 0.0);

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro?.disconnect();
      backdropGeo.dispose();
      backdropMat.dispose();
      blackSunGeo.dispose();
      blackSunMat.dispose();
      coronaGeo.dispose();
      coronaMat.dispose();
      mainTorusGeo.dispose();
      innerBevelGeo.dispose();
      outerBevelGeo.dispose();
      claspGeo.dispose();
      slabGeo.dispose();
      emberGeo.dispose();
      emberMat.dispose();
      obsidianRingMat.dispose();
      obsidianTrimMat.dispose();
      emissiveMap.dispose();
      bumpMap.dispose();
      envTex.dispose();
      renderer?.dispose();
    };
  }, [effectiveAnimate, isVisible, isGovernorActive]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-[#030106] select-none pointer-events-none ${className}`}
      style={{ aspectRatio: '16 / 9', contain: 'paint' }}
      data-banner-id="obsidian-eclipse"
      data-testid="obsidian-eclipse-3d-banner"
    >
      {/* Pre-rendered 1200x675 Hero Poster (always present first & on reduced-motion / low-end) */}
      <img
        src={posterUrl}
        alt="Obsidian Eclipse"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Pre-rendered 180-frame (6.0s @ 30fps) Seamless Video Loop (<video> with WebM then MP4 sources) */}
      {effectiveAnimate && isVisible && (
        <video
          ref={videoRef}
          data-testid="obsidian-eclipse-video"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={posterUrl}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
            isGovernorActive ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={webmUrl} type="video/webm" />
          <source src={mp4Url} type="video/mp4" />
        </video>
      )}

      {/* Live Real-Time 3D Three.js / WebGL Canvas Layer (renders when visible & within max-8 governor cap) */}
      {effectiveAnimate && isVisible && isGovernorActive && (
        <div
          ref={canvasHostRef}
          data-testid="obsidian-eclipse-webgl-canvas"
          className="absolute inset-0 w-full h-full pointer-events-none z-[2]"
        />
      )}
    </div>
  );
};
