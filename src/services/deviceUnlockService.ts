import { logClientSecurityEvent } from './securityCenterService';

const DEVICE_UNLOCK_PREFIX = 'boardly_device_unlock_v1_';

export interface DeviceUnlockConfig {
  enabled: boolean;
  credentialId: string;
  enabledAt: number;
}

function getStorageKey(uid: string): string {
  return `${DEVICE_UNLOCK_PREFIX}${uid}`;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(input: string): Uint8Array {
  const norm = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = norm.length % 4 === 0 ? '' : '='.repeat(4 - (norm.length % 4));
  const binary = atob(norm + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export async function checkDeviceUnlockSupport(): Promise<{
  supported: boolean;
  reason: string;
}> {
  if (typeof window === 'undefined' || !window.isSecureContext) {
    return {
      supported: false,
      reason: 'Requires a secure HTTPS connection with device biometrics or screen lock.',
    };
  }
  if (
    typeof window.PublicKeyCredential === 'undefined' ||
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function'
  ) {
    return {
      supported: false,
      reason: 'This browser does not support built-in biometric or PIN device unlock.',
    };
  }
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) {
      return {
        supported: false,
        reason: 'No biometric sensor or device PIN authenticator was detected on this device.',
      };
    }
    return { supported: true, reason: '' };
  } catch {
    return {
      supported: false,
      reason: 'Unable to check device unlock hardware on this browser.',
    };
  }
}

export function getDeviceUnlockConfig(uid: string | null | undefined): DeviceUnlockConfig | null {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeviceUnlockConfig;
    if (parsed && parsed.enabled && parsed.credentialId) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function enableDeviceUnlock(uid: string, label: string): Promise<DeviceUnlockConfig> {
  const support = await checkDeviceUnlockSupport();
  if (!support.supported) {
    throw new Error(support.reason || 'Device unlock is not available on this device.');
  }

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  const userIdBytes = new TextEncoder().encode(`unlock:${uid}`);

  let cred: Credential | null = null;
  try {
    cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Boardly Device Unlock',
          id: window.location.hostname,
        },
        user: {
          id: userIdBytes,
          name: label || uid,
          displayName: label || 'Boardly Student',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
      },
    });
  } catch (err: any) {
    if (err?.name === 'NotAllowedError') {
      throw new Error('Device verification was cancelled.');
    }
    throw new Error(err?.message || 'Could not enable device unlock.');
  }

  if (!cred || cred.type !== 'public-key') {
    throw new Error('Could not verify this device.');
  }

  const pubCred = cred as PublicKeyCredential;
  const config: DeviceUnlockConfig = {
    enabled: true,
    credentialId: bytesToBase64Url(new Uint8Array(pubCred.rawId)),
    enabledAt: Date.now(),
  };

  localStorage.setItem(getStorageKey(uid), JSON.stringify(config));
  void logClientSecurityEvent('device_unlock_enabled', 'Device unlock enabled on this device');
  return config;
}

export async function disableDeviceUnlock(uid: string): Promise<void> {
  try {
    localStorage.removeItem(getStorageKey(uid));
  } catch {
    // Ignore
  }
  void logClientSecurityEvent('device_unlock_disabled', 'Device unlock turned off on this device');
}

export async function verifyDeviceUnlock(uid: string): Promise<boolean> {
  const config = getDeviceUnlockConfig(uid);
  if (!config) return true;

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: window.location.hostname,
      timeout: 60000,
      userVerification: 'required',
      allowCredentials: [
        {
          id: base64UrlToBytes(config.credentialId) as BufferSource,
          type: 'public-key',
          transports: ['internal'],
        },
      ],
    },
  });

  return Boolean(assertion && assertion.type === 'public-key');
}
