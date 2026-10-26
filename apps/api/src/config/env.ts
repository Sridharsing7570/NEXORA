import { z } from 'zod';
import 'dotenv/config';

const csv = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),

  /** HMAC key for access tokens. Generate with: node -e "console.log(crypto.randomBytes(48).toString('base64url'))" */
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  /** HMAC key for one-time codes, so a database leak does not reveal live codes. */
  CODE_HASH_SECRET: z
    .string()
    .min(32, 'CODE_HASH_SECRET must be at least 32 characters'),

  /** OAuth client IDs whose Google ID tokens are accepted (iOS, Android, web). */
  GOOGLE_CLIENT_IDS: csv,

  /**
   * How email/SMS codes are delivered. `log` writes them to the server log and is only
   * allowed outside production; real providers are added when they are chosen.
   */
  MAIL_TRANSPORT: z.enum(['log']).default('log'),
  SMS_TRANSPORT: z.enum(['log']).default('log'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(
      `Invalid environment configuration:\n${problems.join('\n')}`,
    );
  }

  const env = result.data;
  if (
    env.NODE_ENV === 'production' &&
    (env.MAIL_TRANSPORT === 'log' || env.SMS_TRANSPORT === 'log')
  ) {
    throw new Error(
      'MAIL_TRANSPORT/SMS_TRANSPORT "log" would leak sign-in codes into logs in production.',
    );
  }
  return env;
}

/** Injection token for the validated environment. */
export const ENV = Symbol('ENV');
