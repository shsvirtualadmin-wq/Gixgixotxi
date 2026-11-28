export const SCENE_VIEWBOX_WIDTH: number;
export const SCENE_VIEWBOX_HEIGHT: number;
export const MAX_ANIMATION_SVG_BYTES: number;

export interface PhysicsGraphPhase {
  fromIndex: number;
  toIndex: number;
  label: string;
}

export interface PhysicsGraphData {
  xLabel: string;
  yLabel: string;
  xMax: number;
  yMax: number;
  points: Array<[number, number]>;
  phases: PhysicsGraphPhase[];
}

export interface PhysicsSceneStep {
  from: number;
  to: number;
  narration: string;
  equation: string;
}

export interface PhysicsScene {
  title: string;
  steps: PhysicsSceneStep[];
  animationSvg: string;
  graph?: PhysicsGraphData;
  graphOnly?: boolean;
  totalDuration: number;
}

export interface StreamingPhysicsScene extends PhysicsScene {
  isComplete: boolean;
}

export function sanitizeAnimationSvg(
  rawSvg: unknown,
  maxBytes?: number
): { ok: true; svg: string } | { ok: false; error: string };
export function normalizeAndValidateGraph(raw: unknown): PhysicsGraphData | null;
export function buildGraphSvg(
  graph: PhysicsGraphData,
  opts?: { totalDuration?: number; activePhase?: number }
): string;
export function normalizePhysicsStep(raw: unknown, prevEnd?: number): PhysicsSceneStep | null;
export function extractJsonObjectText(rawText: string): string;
export function validatePhysicsScene(
  input: unknown,
  maxSteps?: number
): { valid: true; scene: PhysicsScene } | { valid: false; error: string };
export function extractStreamingPhysicsScene(
  partialText: string,
  maxSteps?: number
): StreamingPhysicsScene | null;
export function parseStoredPhysicsScene(text: string): PhysicsScene | null;
export function normalizePhysicsQuestion(question: string): string;
export function hashPhysicsQuestion(question: string, depthId: number): string;
export function isGraphOnlyQuery(rawText: string): boolean;
export function isPhysicsVisualQuery(rawText: string): boolean;
export function buildAishaVisualSchemaInstruction(params: {
  maxSteps: number;
  question: string;
}): string;
