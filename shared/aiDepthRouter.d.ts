export const AISHA_MENTOR_ID: number;
export const BASE_AI_SYSTEM_PROMPT: string;

export interface AiDepthExecutionPlan {
  mentorId: number;
  mentorSlug: string;
  mentorName: string;
  mentorRole: string;
  depthId: number;
  depthKey: string;
  depthLabel: string;
  baseCost: number;
  freeAllowed: boolean;
  model: string;
  modelCandidates: string[];
  thinkingLevel: string;
  rawThinkingLevel: string;
  maxOutputTokens: number;
  targetVisibleTokens: number;
  maxHistoryMessages: number;
  firstAttemptTimeoutMs: number;
  maxSteps: number;
  visualMode: boolean;
  responseMimeType: string | null;
  depthInstruction: string;
  systemInstruction: string;
  generationConfig: {
    maxOutputTokens: number;
    responseMimeType?: string;
    thinkingConfig?: {
      thinkingLevel: string;
    };
  };
}

export function parseStrictDepthId(raw: unknown): number;
export function parseStrictMentorId(raw: unknown): number;
export function modelSupportsThinkingConfig(modelName: string): boolean;
export function resolveThinkingLevelForModel(modelName: string, rawLevel: string): string;
export function buildModelGenerationConfig(
  modelName: string,
  depthPlan: { maxOutputTokens?: number; thinkingLevel?: string; responseMimeType?: string | null },
  includeThinkingConfig?: boolean
): AiDepthExecutionPlan['generationConfig'];
export function trimContentsForDepth<T extends { role?: string }>(
  contents: T[],
  maxHistoryMessages?: number
): T[];
export function getDepthBaseCostForMentor(
  mentorId: number | string,
  depthId: number | string,
  options?: { visualMode?: boolean; cacheHit?: boolean }
): number;
export function resolveAiDepthExecution(params?: {
  mentorId?: number | string;
  depthId?: number | string;
  env?: Record<string, string | undefined> | null;
  isModelInCooldown?: ((modelName: string) => boolean) | null;
  visualMode?: boolean;
  questionText?: string;
  avoidPreviousRefusal?: string;
}): AiDepthExecutionPlan;
