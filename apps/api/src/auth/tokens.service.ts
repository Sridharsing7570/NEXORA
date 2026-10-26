import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthTokens } from '@repo/api';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { jwtVerify, SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';

import { ENV, type Env } from '../config/env';
import { DB, type Database, type DbExecutor } from '../db';
import { refreshTokens } from '../db/schema';
import { generateOpaqueToken, sha256 } from './secrets';

const ISSUER = 'nexora-api';
const AUDIENCE = 'nexora-app';

export type ClientInfo = { userAgent: string | null; ipAddress: string | null };

/**
 * Access tokens are short-lived HS256 JWTs (stateless). Refresh tokens are random, stored only as
 * SHA-256 hashes, and rotate on every use. Tokens from one sign-in share a `family_id`; if a token
 * that was already rotated is presented again, someone else has a copy, so the whole family is revoked.
 */
@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);
  private readonly accessKey: Uint8Array;

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(DB) private readonly db: Database,
  ) {
    this.accessKey = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  }

  /** Starts a new session (token family) for the user. */
  async issue(
    userId: string,
    client: ClientInfo,
    executor: DbExecutor = this.db,
  ): Promise<AuthTokens> {
    const { tokens } = await this.issueInFamily(
      userId,
      randomUUID(),
      client,
      executor,
    );
    return tokens;
  }

  async verifyAccessToken(token: string): Promise<string> {
    try {
      const { payload } = await jwtVerify(token, this.accessKey, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ['HS256'],
      });
      if (typeof payload.sub !== 'string') {
        throw new Error('missing subject');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  /** Exchanges a refresh token for a new pair. Returns the user id with the tokens. */
  async rotate(
    refreshToken: string,
    client: ClientInfo,
  ): Promise<{ userId: string; tokens: AuthTokens }> {
    const tokenHash = sha256(refreshToken);

    const outcome = await this.db.transaction(async (tx) => {
      // Claim the token atomically: only one concurrent request can revoke it.
      const [claimed] = await tx
        .update(refreshTokens)
        .set({ revokedAt: sql`now()` })
        .where(
          and(
            eq(refreshTokens.tokenHash, tokenHash),
            isNull(refreshTokens.revokedAt),
            gt(refreshTokens.expiresAt, sql`now()`),
          ),
        )
        .returning();

      if (!claimed) {
        return { kind: 'rejected' as const };
      }

      const { tokens, refreshTokenId } = await this.issueInFamily(
        claimed.userId,
        claimed.familyId,
        client,
        tx,
      );
      await tx
        .update(refreshTokens)
        .set({ replacedById: refreshTokenId })
        .where(eq(refreshTokens.id, claimed.id));

      return { kind: 'rotated' as const, userId: claimed.userId, tokens };
    });

    if (outcome.kind === 'rotated') {
      return { userId: outcome.userId, tokens: outcome.tokens };
    }

    // Not claimable: unknown, expired, or already used. Reuse means the token leaked.
    const [existing] = await this.db
      .select({
        familyId: refreshTokens.familyId,
        userId: refreshTokens.userId,
        revokedAt: refreshTokens.revokedAt,
      })
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);
    if (existing?.revokedAt) {
      await this.revokeFamily(existing.familyId);
      this.logger.warn(
        `Refresh token reuse detected; revoked session family for user ${existing.userId}`,
      );
    }
    throw new UnauthorizedException('Invalid or expired refresh token.');
  }

  /** Signs out the session the refresh token belongs to. Unknown tokens are ignored. */
  async revokeSession(refreshToken: string): Promise<void> {
    const [existing] = await this.db
      .select({ familyId: refreshTokens.familyId })
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, sha256(refreshToken)))
      .limit(1);
    if (existing) {
      await this.revokeFamily(existing.familyId);
    }
  }

  /** Signs the user out everywhere (password change/reset, "log out all devices"). */
  async revokeAllForUser(
    userId: string,
    executor: DbExecutor = this.db,
  ): Promise<void> {
    await executor
      .update(refreshTokens)
      .set({ revokedAt: sql`now()` })
      .where(
        and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)),
      );
  }

  private async revokeFamily(
    familyId: string,
    executor: DbExecutor = this.db,
  ): Promise<void> {
    await executor
      .update(refreshTokens)
      .set({ revokedAt: sql`now()` })
      .where(
        and(
          eq(refreshTokens.familyId, familyId),
          isNull(refreshTokens.revokedAt),
        ),
      );
  }

  private async issueInFamily(
    userId: string,
    familyId: string,
    client: ClientInfo,
    executor: DbExecutor,
  ): Promise<{ tokens: AuthTokens; refreshTokenId: string }> {
    const refreshToken = generateOpaqueToken();
    const refreshTokenExpiresAt = new Date(
      Date.now() + this.env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    const [row] = await executor
      .insert(refreshTokens)
      .values({
        userId,
        familyId,
        tokenHash: sha256(refreshToken),
        expiresAt: refreshTokenExpiresAt,
        userAgent: client.userAgent?.slice(0, 512) ?? null,
        ipAddress: client.ipAddress,
      })
      .returning({ id: refreshTokens.id });
    if (!row) {
      throw new Error('Refresh token insert returned no row');
    }

    const accessToken = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(userId)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${this.env.ACCESS_TOKEN_TTL_SECONDS}s`)
      .sign(this.accessKey);

    return {
      refreshTokenId: row.id,
      tokens: {
        accessToken,
        accessTokenExpiresIn: this.env.ACCESS_TOKEN_TTL_SECONDS,
        refreshToken,
        refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
      },
    };
  }
}
