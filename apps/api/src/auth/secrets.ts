import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';

/** 256-bit opaque token for refresh tokens. */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

/** SHA-256 for high-entropy secrets (refresh tokens). Only the hash is stored. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

/** Six-digit numeric code, uniformly random. */
export function generateNumericCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/**
 * Keyed hash for low-entropy one-time codes: a plain hash of a 6-digit code can be reversed by
 * trying all million values, an HMAC cannot without the server key.
 */
export function hmac(key: string, value: string): string {
  return createHmac('sha256', key).update(value).digest('base64url');
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
