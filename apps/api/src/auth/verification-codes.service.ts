import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { and, count, desc, eq, gt, isNull, sql } from 'drizzle-orm';

import { ENV, type Env } from '../config/env';
import { DB, type Database, type DbExecutor } from '../db';
import { verificationCodes } from '../db/schema';
import type { CodePurpose } from '../notifications/notifications.service';
import { generateNumericCode, hmac, safeEqual } from './secrets';

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_INTERVAL_MS = 60 * 1000;
const MAX_CODES_PER_HOUR = 5;

type CodeRequest = {
  channel: 'email' | 'sms';
  /** Normalized email or E.164 phone. */
  target: string;
  purpose: CodePurpose;
  userId?: string | null;
};

const INVALID_CODE = 'The code is invalid or has expired.';

/**
 * Issues and checks 6-digit one-time codes. Codes are stored as HMACs, expire after 10 minutes,
 * allow 5 wrong guesses, and each target can request at most one per minute and 5 per hour.
 * Only the most recent code for a target and purpose is valid.
 */
@Injectable()
export class VerificationCodesService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(DB) private readonly db: Database,
  ) {}

  /** Creates a code and returns it in plain text for delivery. Throws 429 when rate-limited. */
  async issue(
    request: CodeRequest,
    executor: DbExecutor = this.db,
  ): Promise<string> {
    const recent = await executor
      .select({
        total: count(),
        latest: sql<Date | null>`max(${verificationCodes.createdAt})`.mapWith(
          (value) => (value ? new Date(value) : null),
        ),
      })
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.target, request.target),
          eq(verificationCodes.purpose, request.purpose),
          gt(verificationCodes.createdAt, sql`now() - interval '1 hour'`),
        ),
      );
    const stats = recent[0];
    if (stats && stats.total >= MAX_CODES_PER_HOUR) {
      throw new HttpException(
        'Too many codes requested. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (
      stats?.latest &&
      Date.now() - stats.latest.getTime() < RESEND_INTERVAL_MS
    ) {
      throw new HttpException(
        'Please wait a minute before requesting another code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = generateNumericCode();
    await executor.insert(verificationCodes).values({
      userId: request.userId ?? null,
      channel: request.channel,
      target: request.target,
      purpose: request.purpose,
      codeHash: this.hashCode(request.purpose, request.target, code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });
    return code;
  }

  /** Consumes the latest code for the target. Throws 400 with a generic message on any failure. */
  async consume(
    target: string,
    purpose: CodePurpose,
    code: string,
    executor: DbExecutor = this.db,
  ): Promise<void> {
    const [latest] = await executor
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.target, target),
          eq(verificationCodes.purpose, purpose),
        ),
      )
      .orderBy(desc(verificationCodes.createdAt))
      .limit(1);

    if (
      !latest ||
      latest.consumedAt ||
      latest.expiresAt.getTime() <= Date.now() ||
      latest.attempts >= MAX_ATTEMPTS
    ) {
      throw new BadRequestException(INVALID_CODE);
    }

    if (!safeEqual(latest.codeHash, this.hashCode(purpose, target, code))) {
      await executor
        .update(verificationCodes)
        .set({ attempts: sql`${verificationCodes.attempts} + 1` })
        .where(eq(verificationCodes.id, latest.id));
      throw new BadRequestException(INVALID_CODE);
    }

    // Atomic consume, so a code cannot be used twice by concurrent requests.
    const [consumed] = await executor
      .update(verificationCodes)
      .set({ consumedAt: sql`now()` })
      .where(
        and(
          eq(verificationCodes.id, latest.id),
          isNull(verificationCodes.consumedAt),
        ),
      )
      .returning({ id: verificationCodes.id });
    if (!consumed) {
      throw new BadRequestException(INVALID_CODE);
    }
  }

  private hashCode(purpose: CodePurpose, target: string, code: string): string {
    return hmac(this.env.CODE_HASH_SECRET, `${purpose}:${target}:${code}`);
  }
}
