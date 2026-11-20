import * as THREE from 'three';
import type { AiMentorId } from '@/utils/aiMentorsLogic';
import {
  getMentorCharacterProfile,
  textChunkToVisemes,
  type MentorCharacterProfile,
  type MentorPoseState,
  type VisemeFrame,
} from './mentorCharacterConfig';

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uHeadTrack;
  uniform vec2 uShoulderTrack;
  uniform float uBreath;
  uniform float uNod;
  uniform float uThink;
  uniform float uSpeakEnergy;
  uniform vec2 uHeadCenter;
  uniform float uChinV;
  uniform float uShoulderV;

  varying vec2 vUv;
  varying float vHeadWeight;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Region masks: head vs neck/shoulders
    float headMask = smoothstep(uShoulderV - 0.04, uChinV + 0.06, uv.y);
    float shoulderMask = 1.0 - smoothstep(uShoulderV - 0.02, uChinV + 0.04, uv.y);
    vHeadWeight = headMask;

    // Sculpted 2.5D depth relief (face protrudes forward, edges curve back gently)
    vec2 headDelta = (uv - uHeadCenter) / vec2(0.24, 0.28);
    float faceDome = exp(-dot(headDelta, headDelta) * 1.15) * headMask;

    vec2 chestDelta = vec2((uv.x - 0.5) / 0.44, (uv.y - 0.16) / 0.28);
    float chestCurve = exp(-dot(chestDelta, chestDelta) * 0.8) * shoulderMask;

    pos.z += faceDome * 0.20 + chestCurve * 0.10;

    // Breathing motion in torso & shoulders
    float breathLift = uBreath * (0.013 * shoulderMask + 0.004 * headMask);
    pos.y += breathLift;
    pos.x *= 1.0 + uBreath * 0.008 * shoulderMask;

    // Layered tracking: shoulders lag subtly behind head
    pos.x += uShoulderTrack.x * 0.032 * shoulderMask;
    pos.y += uShoulderTrack.y * 0.014 * shoulderMask;

    // Head yaw/pitch/roll around head pivot
    vec2 rel = uv - uHeadCenter;
    float headYaw = uHeadTrack.x * 0.16;
    float headPitch = uHeadTrack.y * 0.11 - uNod * 0.16 + uThink * 0.06;
    float headRoll = -uHeadTrack.x * 0.048 + uThink * 0.078 + sin(uTime * 0.72) * 0.011;

    // Slight energetic cadence while speaking
    headPitch += uSpeakEnergy * sin(uTime * 11.5) * 0.018;

    float cR = cos(headRoll * headMask);
    float sR = sin(headRoll * headMask);
    vec2 rotated = vec2(rel.x * cR - rel.y * sR, rel.x * sR + rel.y * cR);
    pos.x += (rotated.x - rel.x) * 1.45 * headMask;
    pos.y += (rotated.y - rel.y) * 1.95 * headMask;

    // 3D parallax offset for yaw and pitch on the domed face
    pos.x += headYaw * (0.24 + faceDome * 0.26) * headMask;
    pos.y += headPitch * (0.18 + faceDome * 0.22) * headMask;
    pos.z += (-rel.x * headYaw * 0.42 + rel.y * headPitch * 0.36) * headMask;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uTexelSize;
  uniform vec3 uAccentColor;
  uniform vec2 uEyeTrack;
  uniform vec2 uHeadTrack;
  uniform float uBlink;
  uniform float uMouthOpen;
  uniform float uMouthWide;
  uniform float uMouthRound;
  uniform float uSmile;
  uniform float uThink;
  uniform float uTime;

  uniform vec2 uLeftEye;
  uniform vec2 uRightEye;
  uniform vec2 uEyeRadius;
  uniform vec2 uMouthCenter;
  uniform vec2 uMouthRadius;

  varying vec2 vUv;
  varying float vHeadWeight;

  // Apply subtle iris tracking + smooth organic eyelid blink to a single eye
  vec2 deformEye(vec2 uv, vec2 center, vec2 radius, vec2 gaze, float blink, out float lidShade) {
    vec2 d = (uv - center) / radius;
    float r2 = dot(d, d);
    lidShade = 0.0;
    if (r2 >= 1.35) return uv;

    // Iris/pupil parallax inside the eye aperture
    float irisMask = smoothstep(0.88, 0.22, length(d));
    vec2 shifted = uv - gaze * vec2(0.011, 0.007) * irisMask * (1.0 - blink * 0.85);

    // Blink: pull upper eyelid down toward lash line
    if (blink > 0.005) {
      float horiz = smoothstep(1.08, 0.25, abs(d.x));
      float vertBand = smoothstep(1.15, 0.0, abs(d.y));
      float blinkMask = horiz * vertBand;
      // Pull pixels inside the eye downward from the upper lid
      float lidPull = blink * blinkMask * radius.y * 1.48;
      shifted.y += lidPull * smoothstep(-0.75, 0.65, d.y);
      // Soft crease shadow across closed lash line
      float crease = exp(-pow((d.y + 0.18 * blink) / 0.32, 2.0)) * horiz;
      lidShade = blink * crease * 0.22;
    }

    return shifted;
  }

  void main() {
    vec2 uv = vUv;
    float lidShadeL = 0.0;
    float lidShadeR = 0.0;

    // 1) Eye gaze tracking + random blinks
    uv = deformEye(uv, uLeftEye, uEyeRadius, uEyeTrack, uBlink, lidShadeL);
    uv = deformEye(uv, uRightEye, uEyeRadius, uEyeTrack, uBlink, lidShadeR);

    // 2) Smile & Viseme Lip-Sync around calibrated mouth center
    vec2 md = (uv - uMouthCenter) / uMouthRadius;
    float mDist2 = dot(md, md);
    float mouthInnerMask = 0.0;

    if (mDist2 < 2.8) {
      // Subtle warm smile corner lift (idle / greeting / gentle emphasis)
      float cornerMask = smoothstep(0.25, 0.95, abs(md.x)) * exp(-pow(md.y, 2.0) * 1.5) * smoothstep(1.45, 0.6, abs(md.x));
      uv.y -= uSmile * cornerMask * uMouthRadius.y * 0.22;

      // Active viseme shaping (aa, ih, ou, ee, oh)
      if (uMouthOpen > 0.01 || abs(uMouthWide) > 0.01) {
        float lipEnvelope = exp(-mDist2 * 0.85);

        // Horizontal width modulation (wider for ee/ih, narrower/pursed for ou/oh)
        uv.x -= md.x * uMouthWide * 0.014 * lipEnvelope;

        // Vertical opening: lower lip & chin drop slightly, upper lip lifts subtly
        float openAmt = uMouthOpen * (0.78 + 0.22 * uMouthRound);
        float lowerMask = smoothstep(0.25, -0.85, md.y) * smoothstep(1.45, 0.15, abs(md.x));
        float upperMask = smoothstep(-0.15, 0.85, md.y) * smoothstep(1.35, 0.15, abs(md.x));

        uv.y += lowerMask * openAmt * uMouthRadius.y * 0.72;
        uv.y -= upperMask * openAmt * uMouthRadius.y * 0.22;

        // Inner mouth aperture shading (creates convincing dark oral cavity when open)
        float apertureX = md.x / mix(0.76, 0.50, uMouthRound);
        float apertureY = (md.y + 0.08 * openAmt) / max(0.08, openAmt * 0.56);
        float aperture = 1.0 - smoothstep(0.52, 1.0, length(vec2(apertureX, apertureY)));
        mouthInnerMask = aperture * smoothstep(0.14, 0.42, uMouthOpen);
      }
    }

    vec4 tex = texture2D(uMap, uv);
    if (tex.a < 0.015) discard;

    vec3 color = tex.rgb;

    // Eyelid blink crease shading
    float lidShade = max(lidShadeL, lidShadeR);
    color *= (1.0 - lidShade);

    // Inner mouth cavity depth + tiny hint of upper teeth highlight
    if (mouthInnerMask > 0.005) {
      vec3 cavity = vec3(0.11, 0.045, 0.055);
      float teethHint = smoothstep(0.08, 0.34, md.y) * smoothstep(0.65, 0.0, abs(md.x)) * mouthInnerMask * 0.35;
      vec3 mouthFill = mix(cavity, vec3(0.86, 0.83, 0.80), teethHint);
      color = mix(color, mouthFill, mouthInnerMask * 0.84);
    }

    // Soft studio key + dynamic accent rim light driven by silhouette alpha gradient
    float aL = texture2D(uMap, vUv + vec2(-uTexelSize.x * 5.0, 0.0)).a;
    float aR = texture2D(uMap, vUv + vec2(uTexelSize.x * 5.0, 0.0)).a;
    float aU = texture2D(uMap, vUv + vec2(0.0, uTexelSize.y * 5.0)).a;
    float aD = texture2D(uMap, vUv + vec2(0.0, -uTexelSize.y * 5.0)).a;

    float edge = clamp((1.0 - min(min(aL, aR), min(aU, aD))) * tex.a, 0.0, 1.0);
    // Keep rim subtle on bottom fade
    float topFade = smoothstep(0.05, 0.28, vUv.y);
    float rimPulse = 1.0 + uThink * (0.35 + 0.25 * sin(uTime * 4.2));
    float sideBias = smoothstep(0.15, 0.88, abs(vUv.x - 0.5) * 2.0 + (vUv.y - 0.35) * 0.45);
    float rimStrength = edge * topFade * (0.32 + 0.34 * sideBias) * rimPulse;

    color += uAccentColor * rimStrength * 0.58;

    // Subtle directional studio sheen responding to head angle
    float studioKey = clamp(0.97 + (vUv.x - 0.5) * (-uHeadTrack.x * 0.14) + (vUv.y - 0.45) * 0.05, 0.90, 1.07);
    color *= studioKey;

    gl_FragColor = vec4(color, tex.a);
  }
`;

/**
 * Single shared WebGL context manager for all 5 AI Mentor characters.
 * Ensures strictly ONE WebGLRenderer across the app, lazy texture loading,
 * automatic tab-visibility pausing, software-WebGL pacing, and clean disposal.
 */
class SharedMentorWebGLEngine {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null;
  private loader = new THREE.TextureLoader();
  private textureCache = new Map<string, THREE.Texture>();
  private loadingPromises = new Map<string, Promise<THREE.Texture>>();

  private hostEl: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private rafId: number | null = null;
  private running = false;
  private tabHidden = typeof document !== 'undefined' ? document.visibilityState === 'hidden' : false;
  private isSoftwareGl = false;
  private webglFailed = false;

  private activeProfile: MentorCharacterProfile = getMentorCharacterProfile(0);
  private pose: MentorPoseState = 'idle';

  // Pointer target in normalized [-1, 1] space
  private pointerTargetX = 0;
  private pointerTargetY = 0;
  private hasPointer = false;

  // Smoothed 3-tier tracking state (eyes -> head -> shoulders)
  private eyeX = 0;
  private eyeY = 0;
  private headX = 0;
  private headY = 0;
  private shoulderX = 0;
  private shoulderY = 0;

  // Animation clocks & impulses
  private lastFrameMs = 0;
  private elapsedSec = 0;
  private nodImpulse = 0;
  private thinkBlend = 0;
  private accentCurrent = new THREE.Color('#dc2626');
  private accentTarget = new THREE.Color('#dc2626');

  // Blink state
  private nextBlinkSec = 2.4;
  private blinkProgress = -1; // -1 = not blinking, 0..1 = active blink
  private doubleBlinkPending = false;

  // Lip-sync viseme queue
  private visemeQueue: VisemeFrame[] = [];
  private activeViseme: VisemeFrame | null = null;
  private activeVisemeRemainingMs = 0;
  private mouthOpen = 0;
  private mouthWide = 0;
  private mouthRound = 0;
  private speakEnergy = 0;

  private pointerBound = false;
  private visibilityBound = false;

  private handlePointerMove = (e: PointerEvent) => {
    if (typeof window === 'undefined') return;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    let nx = (e.clientX / w) * 2 - 1;
    let ny = -((e.clientY / h) * 2 - 1);

    // If mounted, bias tracking gently relative to the character's screen center
    if (this.hostEl) {
      const rect = this.hostEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const cx = rect.left + rect.width * 0.5;
        const cy = rect.top + rect.height * 0.42;
        nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (Math.max(w * 0.36, 220))));
        ny = Math.max(-1, Math.min(1, -(e.clientY - cy) / (Math.max(h * 0.36, 220))));
      }
    }

    this.pointerTargetX = Math.max(-1, Math.min(1, nx));
    this.pointerTargetY = Math.max(-1, Math.min(1, ny));
    this.hasPointer = true;
  };

  private handlePointerLeave = () => {
    this.hasPointer = false;
  };

  private handleVisibilityChange = () => {
    this.tabHidden = document.visibilityState === 'hidden';
    if (this.tabHidden) {
      this.stopLoop();
    } else if (this.hostEl) {
      this.startLoop();
    }
  };

  private ensureInitialized(): boolean {
    if (this.webglFailed) return false;
    if (this.renderer && this.scene && this.camera && this.mesh) return true;
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;

    try {
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'default',
        premultipliedAlpha: true,
      });

      const gl = renderer.getContext();
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const gpuStr = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
      this.isSoftwareGl = /SwiftShader|llvmpipe|Software Rasterizer|Basic Render/i.test(gpuStr);

      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.02;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.isSoftwareGl ? 1 : 2));

      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.pointerEvents = 'none';

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(28, 3 / 4, 0.1, 20);
      camera.position.set(0, 0, 4.15);

      // Subdivided 3:4 portrait relief mesh (matches 512x682 bust aspect)
      const geometry = new THREE.PlaneGeometry(1.5, 2.0, 28, 36);
      const lm = this.activeProfile.landmarks;
      const [ar, ag, ab] = this.activeProfile.accentRgb;
      this.accentCurrent.setRGB(ar, ag, ab);
      this.accentTarget.setRGB(ar, ag, ab);

      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uMap: { value: null },
          uTexelSize: { value: new THREE.Vector2(1 / 512, 1 / 682) },
          uTime: { value: 0 },
          uAccentColor: { value: new THREE.Vector3(ar, ag, ab) },
          uEyeTrack: { value: new THREE.Vector2(0, 0) },
          uHeadTrack: { value: new THREE.Vector2(0, 0) },
          uShoulderTrack: { value: new THREE.Vector2(0, 0) },
          uBreath: { value: 0 },
          uBlink: { value: 0 },
          uNod: { value: 0 },
          uThink: { value: 0 },
          uSmile: { value: 0.12 },
          uMouthOpen: { value: 0 },
          uMouthWide: { value: 0 },
          uMouthRound: { value: 0 },
          uSpeakEnergy: { value: 0 },
          uLeftEye: { value: new THREE.Vector2(lm.leftEye[0], lm.leftEye[1]) },
          uRightEye: { value: new THREE.Vector2(lm.rightEye[0], lm.rightEye[1]) },
          uEyeRadius: { value: new THREE.Vector2(lm.eyeRadius[0], lm.eyeRadius[1]) },
          uMouthCenter: { value: new THREE.Vector2(lm.mouth[0], lm.mouth[1]) },
          uMouthRadius: { value: new THREE.Vector2(lm.mouthRadius[0], lm.mouthRadius[1]) },
          uHeadCenter: { value: new THREE.Vector2(lm.headCenter[0], lm.headCenter[1]) },
          uChinV: { value: lm.chinV },
          uShoulderV: { value: lm.shoulderV },
        },
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false; // Show once texture loads
      scene.add(mesh);

      this.renderer = renderer;
      this.scene = scene;
      this.camera = camera;
      this.mesh = mesh;

      return true;
    } catch {
      this.webglFailed = true;
      return false;
    }
  }

  private bindGlobalListeners() {
    if (!this.pointerBound && typeof window !== 'undefined') {
      window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
      window.addEventListener('pointerleave', this.handlePointerLeave, { passive: true });
      this.pointerBound = true;
    }
    if (!this.visibilityBound && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      this.visibilityBound = true;
    }
  }

  private unbindGlobalListeners() {
    if (this.pointerBound && typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.handlePointerMove);
      window.removeEventListener('pointerleave', this.handlePointerLeave);
      this.pointerBound = false;
    }
    if (this.visibilityBound && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      this.visibilityBound = false;
    }
  }

  private loadTextureForProfile(profile: MentorCharacterProfile): Promise<THREE.Texture> {
    const cached = this.textureCache.get(profile.slug);
    if (cached) return Promise.resolve(cached);

    const inflight = this.loadingPromises.get(profile.slug);
    if (inflight) return inflight;

    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      const configure = (tex: THREE.Texture) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.needsUpdate = true;
        this.textureCache.set(profile.slug, tex);
        this.loadingPromises.delete(profile.slug);
        resolve(tex);
      };

      this.loader.load(
        profile.bustWebp,
        configure,
        undefined,
        () => {
          // Fallback to PNG if WebP fails
          this.loader.load(
            profile.bustPng,
            configure,
            undefined,
            (err) => {
              this.loadingPromises.delete(profile.slug);
              reject(err);
            }
          );
        }
      );
    });

    this.loadingPromises.set(profile.slug, promise);
    return promise;
  }

  private syncSize() {
    if (!this.renderer || !this.camera || !this.hostEl) return;
    const width = Math.max(1, Math.floor(this.hostEl.clientWidth));
    const height = Math.max(1, Math.floor(this.hostEl.clientHeight));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  mount(hostEl: HTMLElement, mentorId: AiMentorId, onReady?: () => void, onError?: () => void): boolean {
    if (!this.ensureInitialized() || !this.renderer) {
      onError?.();
      return false;
    }

    this.hostEl = hostEl;
    if (this.renderer.domElement.parentElement !== hostEl) {
      hostEl.innerHTML = '';
      hostEl.appendChild(this.renderer.domElement);
    }

    this.syncSize();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.syncSize());
      this.resizeObserver.observe(hostEl);
    }

    this.bindGlobalListeners();
    this.setMentor(mentorId, onReady, onError);

    if (!this.tabHidden) {
      this.startLoop();
    }
    return true;
  }

  unmount(hostEl: HTMLElement) {
    if (this.hostEl !== hostEl) return;
    this.stopLoop();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.renderer && this.renderer.domElement.parentElement === hostEl) {
      hostEl.removeChild(this.renderer.domElement);
    }
    this.hostEl = null;
    this.unbindGlobalListeners();
  }

  setMentor(mentorId: AiMentorId, onReady?: () => void, onError?: () => void) {
    const profile = getMentorCharacterProfile(mentorId);
    this.activeProfile = profile;
    const [ar, ag, ab] = profile.accentRgb;
    this.accentTarget.setRGB(ar, ag, ab);

    if (this.mesh) {
      const u = this.mesh.material.uniforms;
      const lm = profile.landmarks;
      u.uLeftEye.value.set(lm.leftEye[0], lm.leftEye[1]);
      u.uRightEye.value.set(lm.rightEye[0], lm.rightEye[1]);
      u.uEyeRadius.value.set(lm.eyeRadius[0], lm.eyeRadius[1]);
      u.uMouthCenter.value.set(lm.mouth[0], lm.mouth[1]);
      u.uMouthRadius.value.set(lm.mouthRadius[0], lm.mouthRadius[1]);
      u.uHeadCenter.value.set(lm.headCenter[0], lm.headCenter[1]);
      u.uChinV.value = lm.chinV;
      u.uShoulderV.value = lm.shoulderV;
    }

    const expectedSlug = profile.slug;
    void this.loadTextureForProfile(profile)
      .then((tex) => {
        if (this.activeProfile.slug !== expectedSlug || !this.mesh) return;
        this.mesh.material.uniforms.uMap.value = tex;
        const img = tex.image as { width?: number; height?: number } | undefined;
        if (img?.width && img?.height) {
          this.mesh.material.uniforms.uTexelSize.value.set(1 / img.width, 1 / img.height);
        }
        this.mesh.visible = true;
        onReady?.();
      })
      .catch(() => {
        onError?.();
      });
  }

  setPose(nextPose: MentorPoseState) {
    if (nextPose === 'nod' && this.pose !== 'nod') {
      this.nodImpulse = 1.0;
    }
    if (nextPose !== 'speaking') {
      this.visemeQueue.length = 0;
      this.activeViseme = null;
      this.activeVisemeRemainingMs = 0;
    }
    this.pose = nextPose;
  }

  triggerNod() {
    this.nodImpulse = 1.0;
  }

  pushSpeechText(chunk: string) {
    if (!chunk) return;
    const frames = textChunkToVisemes(chunk);
    if (frames.length === 0) return;
    // Keep queue responsive to incoming stream (cap backlog to ~0.7s)
    if (this.visemeQueue.length > 14) {
      this.visemeQueue.splice(0, this.visemeQueue.length - 8);
    }
    this.visemeQueue.push(...frames);
  }

  private startLoop() {
    if (this.running) return;
    this.running = true;
    this.lastFrameMs = performance.now();
    this.scheduleNextFrame();
  }

  private stopLoop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private scheduleNextFrame() {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.tick);
  }

  private tick = (nowMs: number) => {
    if (!this.running || this.tabHidden || !this.renderer || !this.scene || !this.camera || !this.mesh) {
      return;
    }

    const dtSec = Math.min(0.05, Math.max(0.001, (nowMs - this.lastFrameMs) / 1000));
    const dtMs = dtSec * 1000;
    this.lastFrameMs = nowMs;
    this.elapsedSec += dtSec;

    const u = this.mesh.material.uniforms;

    // Smooth accent color transition on mentor switch
    this.accentCurrent.lerp(this.accentTarget, Math.min(1, dtSec * 7.5));
    u.uAccentColor.value.set(this.accentCurrent.r, this.accentCurrent.g, this.accentCurrent.b);

    // Target gaze: mouse/finger anywhere on screen, or gentle idle/thinking focus
    let targetX = this.hasPointer ? this.pointerTargetX : Math.sin(this.elapsedSec * 0.45) * 0.14;
    let targetY = this.hasPointer ? this.pointerTargetY : Math.cos(this.elapsedSec * 0.35) * 0.08;

    if (this.pose === 'thinking') {
      // Thoughtful upward-right glance blended with user pointer
      targetX = targetX * 0.35 + 0.42;
      targetY = targetY * 0.35 + 0.38;
    }

    // 3-tier eased & clamped tracking: eyes (fast) -> head (medium) -> shoulders (lagged subtle)
    const eyeLerp = 1 - Math.exp(-dtSec * 13.0);
    const headLerp = 1 - Math.exp(-dtSec * 5.2);
    const shoulderLerp = 1 - Math.exp(-dtSec * 2.4);

    this.eyeX += (targetX - this.eyeX) * eyeLerp;
    this.eyeY += (targetY - this.eyeY) * eyeLerp;

    const idleSwayX = Math.sin(this.elapsedSec * 0.85) * 0.06;
    const idleSwayY = Math.cos(this.elapsedSec * 0.62) * 0.04;

    this.headX += (targetX * 0.85 + idleSwayX - this.headX) * headLerp;
    this.headY += (targetY * 0.78 + idleSwayY - this.headY) * headLerp;

    this.shoulderX += (this.headX * 0.55 - this.shoulderX) * shoulderLerp;
    this.shoulderY += (this.headY * 0.35 - this.shoulderY) * shoulderLerp;

    // Breathing (~3.7s cycle)
    const breath = Math.sin(this.elapsedSec * 1.7) * 0.5 + 0.5;

    // Nod impulse spring decay (~420ms)
    if (this.nodImpulse > 0.001) {
      this.nodImpulse = Math.max(0, this.nodImpulse - dtSec * 2.8);
    }
    const nodWave = Math.sin(this.nodImpulse * Math.PI);

    // Thinking pose blend
    const thinkTarget = this.pose === 'thinking' ? 1.0 : 0.0;
    this.thinkBlend += (thinkTarget - this.thinkBlend) * (1 - Math.exp(-dtSec * 6.5));

    // Organic random blinks (every 2.6 - 5.4s, with occasional double blink)
    if (this.blinkProgress < 0 && this.elapsedSec >= this.nextBlinkSec) {
      this.blinkProgress = 0;
    }
    let blinkVal = 0;
    if (this.blinkProgress >= 0) {
      this.blinkProgress += dtSec / 0.16; // 160ms crisp blink
      if (this.blinkProgress >= 1) {
        this.blinkProgress = -1;
        if (this.doubleBlinkPending) {
          this.doubleBlinkPending = false;
          this.nextBlinkSec = this.elapsedSec + 0.14;
        } else {
          this.doubleBlinkPending = Math.random() < 0.18;
          this.nextBlinkSec = this.elapsedSec + 2.6 + Math.random() * 2.8;
        }
      } else {
        blinkVal = Math.sin(this.blinkProgress * Math.PI);
      }
    }

    // Real-time text-driven viseme lip-sync
    if (this.pose === 'speaking') {
      if (!this.activeViseme || this.activeVisemeRemainingMs <= 0) {
        if (this.visemeQueue.length > 0) {
          this.activeViseme = this.visemeQueue.shift() || null;
          this.activeVisemeRemainingMs = this.activeViseme ? this.activeViseme.durationMs : 0;
        } else {
          // Gentle cadence while waiting for next streamed token chunk
          const pulse = Math.max(0, Math.sin(this.elapsedSec * 13.0));
          this.activeViseme = {
            viseme: 'ih',
            open: 0.16 + pulse * 0.24,
            wide: 0.12,
            round: 0.1,
            durationMs: 60,
          };
          this.activeVisemeRemainingMs = 60;
        }
      } else {
        this.activeVisemeRemainingMs -= dtMs;
      }
    } else {
      this.activeViseme = null;
    }

    const targetOpen = this.activeViseme ? this.activeViseme.open : 0;
    const targetWide = this.activeViseme ? this.activeViseme.wide : 0;
    const targetRound = this.activeViseme ? this.activeViseme.round : 0;
    const mouthLerp = 1 - Math.exp(-dtSec * 22.0);

    this.mouthOpen += (targetOpen - this.mouthOpen) * mouthLerp;
    this.mouthWide += (targetWide - this.mouthWide) * mouthLerp;
    this.mouthRound += (targetRound - this.mouthRound) * mouthLerp;

    const targetSpeakEnergy = this.pose === 'speaking' ? 0.5 + this.mouthOpen * 0.5 : 0;
    this.speakEnergy += (targetSpeakEnergy - this.speakEnergy) * (1 - Math.exp(-dtSec * 10.0));

    // Update shader uniforms
    u.uTime.value = this.elapsedSec;
    u.uEyeTrack.value.set(this.eyeX, this.eyeY);
    u.uHeadTrack.value.set(this.headX, this.headY);
    u.uShoulderTrack.value.set(this.shoulderX, this.shoulderY);
    u.uBreath.value = breath;
    u.uBlink.value = blinkVal;
    u.uNod.value = nodWave;
    u.uThink.value = this.thinkBlend;
    u.uSmile.value = this.pose === 'thinking' ? 0.04 : this.pose === 'speaking' ? 0.2 : 0.14;
    u.uMouthOpen.value = this.mouthOpen;
    u.uMouthWide.value = this.mouthWide;
    u.uMouthRound.value = this.mouthRound;
    u.uSpeakEnergy.value = this.speakEnergy;

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      // Pace gently on software WebGL to keep main thread responsive
      window.setTimeout(() => this.scheduleNextFrame(), 24);
    } else {
      this.scheduleNextFrame();
    }
  };
}

let sharedEngineSingleton: SharedMentorWebGLEngine | null = null;

export function getSharedMentorWebGLEngine(): SharedMentorWebGLEngine {
  if (!sharedEngineSingleton) {
    sharedEngineSingleton = new SharedMentorWebGLEngine();
  }
  return sharedEngineSingleton;
}
