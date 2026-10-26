import { loadEnv } from './env';

const valid = {
  DATABASE_URL: 'postgres://localhost/nexora',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
  CODE_HASH_SECRET: 'y'.repeat(32),
};

describe('loadEnv', () => {
  it('applies defaults and parses the Google client id list', () => {
    const env = loadEnv({ ...valid, GOOGLE_CLIENT_IDS: ' ios-id , web-id ,' });

    expect(env.PORT).toBe(3000);
    expect(env.ACCESS_TOKEN_TTL_SECONDS).toBe(900);
    expect(env.GOOGLE_CLIENT_IDS).toEqual(['ios-id', 'web-id']);
  });

  it('lists every missing or weak setting', () => {
    expect(() => loadEnv({ JWT_ACCESS_SECRET: 'short' })).toThrow(
      /DATABASE_URL[\s\S]*JWT_ACCESS_SECRET[\s\S]*CODE_HASH_SECRET/,
    );
  });

  it('refuses to log codes in production', () => {
    expect(() => loadEnv({ ...valid, NODE_ENV: 'production' })).toThrow(
      /leak sign-in codes/,
    );
  });
});
