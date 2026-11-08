// ─── RFC 6238 TOTP, WebCrypto AES-GCM Secret Encryption, Backup Codes & Trusted Devices ───

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BACKUP_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const TRUSTED_DEVICE_COOKIE_NAME = 'boardly_trusted_device';
export const TRUSTED_DEVICE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const TRUSTED_DEVICE_TTL_MS = TRUSTED_DEVICE_MAX_AGE_SECONDS * 1000;
export const PENDING_2FA_CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const RECOVERY_COOLING_OFF_MS = 24 * 60 * 60 * 1000; // 24 hours

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().replace(/[^0-9a-fA-F]/g, '');
  if (clean.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Constant-time string comparison to prevent timing side-channel attacks.
 */
export function constantTimeEqualStr(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

/**
 * Computes HMAC-SHA256 hex digest using WebCrypto.
 */
export async function computeHmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return bytesToHex(new Uint8Array(sig));
}

/**
 * RFC 4648 Base32 encode (without padding '=' for otpauth compatibility).
 */
export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * RFC 4648 Base32 decode.
 */
export function base32Decode(input: string): Uint8Array {
  const cleaned = input
    .toUpperCase()
    .replace(/=+$/, '')
    .replace(/[\s-]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) {
      throw new Error('Invalid Base32 character in TOTP secret');
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(out);
}

/**
 * Generates a cryptographically random 20-byte (160-bit) TOTP secret encoded as Base32 (32 chars).
 */
export function generateTotpSecretBase32(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/**
 * Builds standard RFC 6238 otpauth:// URI for Google Authenticator, Microsoft Authenticator, Authy, etc.
 */
export function buildOtpAuthUri(accountLabel: string, base32Secret: string, issuer = 'Boardly'): string {
  const cleanAccount = accountLabel.trim() || 'user';
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(cleanAccount);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${encodeURIComponent(
    base32Secret
  )}&issuer=${encodedIssuer}&digits=6&period=30&algorithm=SHA1`;
}

/**
 * Generates a 6-digit RFC 6238 TOTP code (HMAC-SHA1, 30-second step) for the given integer time step.
 */
export async function generateTotpCodeForStep(
  base32Secret: string,
  timeStep: number
): Promise<string> {
  const keyBytes = base32Decode(base32Secret);
  const counterBytes = new Uint8Array(8);
  let temp = Math.floor(timeStep);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const hmacBuf = await crypto.subtle.sign('HMAC', cryptoKey, counterBytes);
  const hmac = new Uint8Array(hmacBuf);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1_000_000;
  return String(otp).padStart(6, '0');
}

/**
 * Computes current 30-second RFC 6238 time step from epoch milliseconds.
 */
export function getTotpTimeStep(nowMs: number = Date.now(), periodSeconds = 30): number {
  return Math.floor(nowMs / 1000 / periodSeconds);
}

/**
 * Verifies a 6-digit TOTP code against [-1, 0, +1] 30-second windows and enforces replay protection
 * against `lastUsedStep`.
 */
export async function verifyTotpCode(params: {
  base32Secret: string;
  code: string;
  nowMs?: number;
  lastUsedStep?: number;
}): Promise<{
  valid: boolean;
  matchedStep: number | null;
  replayed: boolean;
}> {
  const { base32Secret, code, nowMs = Date.now(), lastUsedStep = 0 } = params;
  const normalizedCode = String(code || '').trim();
  if (!/^\d{6}$/.test(normalizedCode)) {
    return { valid: false, matchedStep: null, replayed: false };
  }

  const currentStep = getTotpTimeStep(nowMs);
  const candidateSteps = [currentStep - 1, currentStep, currentStep + 1];

  let matchedStep: number | null = null;
  for (const step of candidateSteps) {
    if (step < 0) continue;
    const expected = await generateTotpCodeForStep(base32Secret, step);
    if (constantTimeEqualStr(expected, normalizedCode)) {
      matchedStep = step;
    }
  }

  if (matchedStep === null) {
    return { valid: false, matchedStep: null, replayed: false };
  }

  if (lastUsedStep > 0 && matchedStep <= lastUsedStep) {
    return { valid: false, matchedStep, replayed: true };
  }

  return { valid: true, matchedStep, replayed: false };
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from an arbitrary secret string using SHA-256.
 */
async function importAesGcmKey(secretKeyMaterial: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyHash = await crypto.subtle.digest('SHA-256', enc.encode(secretKeyMaterial));
  return crypto.subtle.importKey('raw', keyHash, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * Encrypts a TOTP Base32 secret with AES-GCM (256-bit key, random 12-byte IV).
 * Format: `v1:<ivHex>:<ciphertextHex>`
 */
export async function encryptTotpSecret(
  plaintextSecret: string,
  encryptionKeyMaterial: string
): Promise<string> {
  const key = await importAesGcmKey(encryptionKeyMaterial);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintextSecret)
  );
  return `v1:${bytesToHex(iv)}:${bytesToHex(new Uint8Array(cipherBuf))}`;
}

/**
 * Decrypts an AES-GCM encrypted TOTP secret (`v1:<ivHex>:<ciphertextHex>`).
 */
export async function decryptTotpSecret(
  encryptedPayload: string,
  encryptionKeyMaterial: string
): Promise<string> {
  const parts = String(encryptedPayload || '').split(':');
  if (parts.length !== 3 || parts[0] !== 'v1') {
    throw new Error('Malformed encrypted TOTP secret payload');
  }
  const iv = hexToBytes(parts[1]);
  const cipherBytes = hexToBytes(parts[2]);
  const key = await importAesGcmKey(encryptionKeyMaterial);
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer },
    key,
    cipherBytes.buffer.slice(cipherBytes.byteOffset, cipherBytes.byteOffset + cipherBytes.byteLength) as ArrayBuffer
  );
  return new TextDecoder().decode(plainBuf);
}

/**
 * Generates `count` (default 10) one-time backup codes formatted `XXXX-XXXX` using CSPRNG.
 */
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  const alphabetLen = BACKUP_CODE_ALPHABET.length; // 32 (power of 2, zero modulo bias!)
  for (let c = 0; c < count; c++) {
    const rand = new Uint8Array(8);
    crypto.getRandomValues(rand);
    let raw = '';
    for (let i = 0; i < 8; i++) {
      raw += BACKUP_CODE_ALPHABET[rand[i] & (alphabetLen - 1)];
    }
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }
  return codes;
}

export function normalizeBackupCode(rawCode: string): string {
  return String(rawCode || '')
    .toUpperCase()
    .replace(/[\s-]/g, '');
}

export async function hashBackupCode(
  userId: string,
  rawCode: string,
  hmacSecret: string
): Promise<string> {
  const normalized = normalizeBackupCode(rawCode);
  return computeHmacSha256(hmacSecret, `backup_code:${userId}:${normalized}`);
}

export function generateTrustedDeviceToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function hashTrustedDeviceToken(
  rawToken: string,
  hmacSecret: string
): Promise<string> {
  return computeHmacSha256(hmacSecret, `trusted_device:${rawToken.trim()}`);
}

export function extractTrustedDeviceTokenFromRequest(request?: Request | null): string | null {
  if (!request) return null;
  const headerToken = request.headers.get('X-Trusted-Device')?.trim();
  if (headerToken && headerToken.length >= 32) {
    return headerToken;
  }
  const cookieHeader = request.headers.get('Cookie') || '';
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const name = pair.slice(0, eqIdx).trim();
    const val = pair.slice(eqIdx + 1).trim();
    if (name === TRUSTED_DEVICE_COOKIE_NAME && val.length >= 32) {
      return decodeURIComponent(val);
    }
  }
  return null;
}

export function buildTrustedDeviceCookieHeader(
  token: string,
  maxAgeSeconds: number = TRUSTED_DEVICE_MAX_AGE_SECONDS
): string {
  if (!token || maxAgeSeconds <= 0) {
    return `${TRUSTED_DEVICE_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
  }
  return `${TRUSTED_DEVICE_COOKIE_NAME}=${encodeURIComponent(
    token
  )}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.floor(maxAgeSeconds)}`;
}
