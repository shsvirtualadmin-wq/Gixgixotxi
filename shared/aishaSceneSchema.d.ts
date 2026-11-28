export const SCENE_VIEWBOX_WIDTH: number;
export const SCENE_VIEWBOX_HEIGHT: number;

export interface PhysicsLineShape {
  type: 'line' | 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  dashed: boolean;
  label?: string;
}

export interface PhysicsRectShape {
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  stroke: string;
  fill: string;
  strokeWidth: number;
  dashed: boolean;
  label?: string;
}

export interface PhysicsCircleShape {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
  stroke: string;
  fill: string;
  strokeWidth: number;
  dashed: boolean;
  label?: string;
}

export interface PhysicsLabelShape {
  type: 'label';
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
}

export interface PhysicsCurveShape {
  type: 'curve';
  points: Array<[number, number]>;
  stroke: string;
  strokeWidth: number;
  dashed: boolean;
  label?: string;
}

export type PhysicsShape =
  | PhysicsLineShape
  | PhysicsRectShape
  | PhysicsCircleShape
  | PhysicsLabelShape
  | PhysicsCurveShape;

export interface PhysicsSceneStep {
  narration: string;
  equation: string;
  shapes: PhysicsShape[];
}

export interface PhysicsScene {
  title: string;
  steps: PhysicsSceneStep[];
}

export interface StreamingPhysicsScene extends PhysicsScene {
  isComplete: boolean;
}

export function normalizePhysicsShape(raw: unknown): PhysicsShape | null;
export function normalizePhysicsStep(raw: unknown): PhysicsSceneStep | null;
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
export function isPhysicsVisualQuery(rawText: string): boolean;
export function detectPhysicsTemplate(rawText: string): { key: string; hint: string };
export function buildAishaVisualSchemaInstruction(params: {
  maxSteps: number;
  question: string;
}): string;
