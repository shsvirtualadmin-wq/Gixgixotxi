export const BASE_AI_SYSTEM_PROMPT: string;

export interface AiDepthExecutionPlan {
  mentorId: 0 | 1 | 2 | 3 | 4 | 5;
  mentorSlug: string;
  mentorName: string;
  mentorRole: string;
  depthId: 0 | 1 | 2 | 3;
  depthKey: 'quick' | 'balanced' | 'deep' | 'max';
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
  depthInstruction: string;
  systemInstruction: string;
  generationConfig: {
    maxOutputTokens: number;
    thinkingConfig?: {
      thinkingLevel: string;
    };
  };
}

export function parseStrictDepthId(raw: unknown): number;
export function parseStrictMentorId(raw: unknown): number;
export function modelSupportsThinkingConfig(modelName: string): boolean;
export function resolveThinkingLevelForModel(modelName: string, rawLevel?: string): string;
export function buildModelGenerationConfig(
  modelName: string,
  depthPlan: { maxOutputTokens: number; thinkingLevel?: string },
  includeThinkingConfig?: boolean
): {
  maxOutputTokens: number;
  thinkingConfig?: {
    thinkingLevel: string;
  };
};
export function trimContentsForDepth<T extends { role?: string }>(
  contents: T[],
  maxHistoryMessages: number
): T[];
export function resolveAiDepthExecution(params?: {
  mentorId?: unknown;
  depthId?: unknown;
  env?: Record<string, string | undefined> | null;
  isModelInCooldown?: ((modelName: string) => boolean) | null;
}): AiDepthExecutionPlan;
