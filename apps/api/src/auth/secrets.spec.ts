import {
  generateNumericCode,
  generateOpaqueToken,
  hmac,
  safeEqual,
  sha256,
} from './secrets';

describe('secrets', () => {
  it('generates six-digit codes, including leading zeros', () => {
    const codes = Array.from({ length: 2000 }, generateNumericCode);

    expect(codes.every((code) => /^\d{6}$/.test(code))).toBe(true);
    expect(new Set(codes).size).toBeGreaterThan(1900);
  });

  it('generates unique 256-bit opaque tokens', () => {
    const token = generateOpaqueToken();

    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    expect(generateOpaqueToken()).not.toBe(token);
  });

  it('keys code hashes so the same code hashes differently per secret', () => {
    expect(hmac('key-a', 'login_otp:+911234567890:123456')).not.toBe(
      hmac('key-b', 'login_otp:+911234567890:123456'),
    );
    expect(sha256('a')).toBe(sha256('a'));
  });

  it('compares in constant time and handles different lengths', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
