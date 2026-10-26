import { UnauthorizedException, type HttpException } from '@nestjs/common';
import type { AuthTokens } from '@repo/api';

import type { Database } from '../db';
import type { NotificationsService } from '../notifications/notifications.service';
import type { UserRow, UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import type { GoogleIdTokenVerifier } from './google-id-token.verifier';
import { hashPassword } from './passwords';
import type { TokensService } from './tokens.service';
import type { VerificationCodesService } from './verification-codes.service';

const client = { userAgent: 'jest', ipAddress: '127.0.0.1' };

const tokens: AuthTokens = {
  accessToken: 'access',
  accessTokenExpiresIn: 900,
  refreshToken: 'refresh',
  refreshTokenExpiresAt: new Date(0).toISOString(),
};

function userRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 'user-1',
    email: 'reader@example.com',
    emailVerifiedAt: null,
    phone: null,
    phoneVerifiedAt: null,
    passwordHash: null,
    name: 'Reader',
    avatarUrl: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

describe('AuthService.login', () => {
  const findByEmail = jest.fn<Promise<UserRow | undefined>, [string]>();
  const issue = jest.fn<Promise<AuthTokens>, unknown[]>();

  const service = new AuthService(
    {} as Database,
    { findByEmail } as unknown as UsersService,
    { issue } as unknown as TokensService,
    {} as VerificationCodesService,
    {} as NotificationsService,
    {} as GoogleIdTokenVerifier,
  );

  let correctHash: string;

  beforeAll(async () => {
    correctHash = await hashPassword('right-password');
  });

  beforeEach(() => {
    findByEmail.mockReset();
    issue.mockReset().mockResolvedValue(tokens);
  });

  /** The status and body a client sees for a failed login. */
  async function failedLogin(password: string) {
    const error = (await service
      .login({ email: 'reader@example.com', password }, client)
      .catch((caught: unknown) => caught)) as HttpException;
    expect(error).toBeInstanceOf(UnauthorizedException);
    expect(issue).not.toHaveBeenCalled();
    return { status: error.getStatus(), body: error.getResponse() };
  }

  // Login must not reveal which emails are registered: all failures look exactly alike.
  it('gives the same response for an unknown email, a passwordless account and a wrong password', async () => {
    findByEmail.mockResolvedValue(undefined);
    const unknownEmail = await failedLogin('whatever-password');

    findByEmail.mockResolvedValue(userRow({ passwordHash: null }));
    const noPassword = await failedLogin('whatever-password');

    findByEmail.mockResolvedValue(userRow({ passwordHash: correctHash }));
    const wrongPassword = await failedLogin('wrong-password');

    expect(unknownEmail).toEqual(wrongPassword);
    expect(noPassword).toEqual(wrongPassword);
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body).toMatchObject({
      message: 'Incorrect email or password.',
    });
    expect(wrongPassword.body).not.toHaveProperty('code');
  });

  it('issues a session for the right password', async () => {
    findByEmail.mockResolvedValue(userRow({ passwordHash: correctHash }));

    const result = await service.login(
      { email: 'reader@example.com', password: 'right-password' },
      client,
    );

    expect(result).toMatchObject({
      isNewUser: false,
      tokens,
      user: { id: 'user-1', email: 'reader@example.com' },
    });
    expect(issue).toHaveBeenCalledWith('user-1', client);
  });
});
