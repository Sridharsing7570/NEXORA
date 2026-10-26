import {
  getDummyPasswordHash,
  hashPassword,
  verifyPassword,
} from './passwords';

describe('passwords', () => {
  it('verifies the original password and rejects others', async () => {
    const hash = await hashPassword('correct horse battery staple');

    await expect(
      verifyPassword('correct horse battery staple', hash),
    ).resolves.toBe(true);
    await expect(
      verifyPassword('Correct horse battery staple', hash),
    ).resolves.toBe(false);
  });

  it('salts every hash', async () => {
    const [a, b] = await Promise.all([
      hashPassword('same'),
      hashPassword('same'),
    ]);

    expect(a).not.toBe(b);
    expect(a.startsWith('scrypt$32768$8$1$')).toBe(true);
  });

  it('treats unicode-equivalent passwords as equal (NFKC)', async () => {
    const hash = await hashPassword('café');

    await expect(verifyPassword('café', hash)).resolves.toBe(true);
  });

  it('rejects malformed stored hashes instead of throwing', async () => {
    await expect(verifyPassword('x', 'not-a-hash')).resolves.toBe(false);
    await expect(verifyPassword('x', 'bcrypt$1$2$3$a$b')).resolves.toBe(false);
  });

  it('provides a stable dummy hash that never matches', async () => {
    const dummy = await getDummyPasswordHash();

    expect(await getDummyPasswordHash()).toBe(dummy);
    await expect(verifyPassword('anything', dummy)).resolves.toBe(false);
  });
});
