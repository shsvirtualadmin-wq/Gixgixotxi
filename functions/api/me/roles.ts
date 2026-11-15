import {
  handleMeRolesRequest,
  type TokenVerifierFn,
} from '../../_utils/adminRoleGate';
import { getSharedLocalD1Database, type RewardsEnv } from '../../_utils/firestoreRestAdmin';

export interface MeRolesPagesContext {
  request: Request;
  env: RewardsEnv & Record<string, any>;
  waitUntil?: (promise: Promise<any>) => void;
  tokenVerifierOverride?: TokenVerifierFn;
  adminSdkOverride?: {
    setCustomUserClaims: (uid: string, claims: Record<string, boolean>) => Promise<void>;
    revokeRefreshTokens?: (uid: string) => Promise<void>;
  };
}

export async function onRequest(context: MeRolesPagesContext): Promise<Response> {
  const env = context.env || ({} as RewardsEnv & Record<string, any>);
  if (!env.DB) {
    env.DB = getSharedLocalD1Database() as any;
  }
  return handleMeRolesRequest({
    request: context.request,
    env,
    tokenVerifierOverride: context.tokenVerifierOverride,
    adminSdkOverride: context.adminSdkOverride,
  });
}

export async function onRequestPost(context: MeRolesPagesContext): Promise<Response> {
  return onRequest(context);
}

export async function onRequestOptions(context: MeRolesPagesContext): Promise<Response> {
  return onRequest(context);
}
