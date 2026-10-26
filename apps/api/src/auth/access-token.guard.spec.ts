import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AccessTokenGuard } from './access-token.guard';
import type { TokensService } from './tokens.service';

function contextWith(
  headers: Record<string, string>,
  request: Record<string, unknown> = {},
): ExecutionContext {
  Object.assign(request, { headers });
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('AccessTokenGuard', () => {
  const verifyAccessToken = jest.fn();
  const tokens = { verifyAccessToken } as unknown as TokensService;
  const reflector = new Reflector();

  beforeEach(() => verifyAccessToken.mockReset());

  it('allows routes marked @Public() without a token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true);
    const guard = new AccessTokenGuard(reflector, tokens);

    await expect(guard.canActivate(contextWith({}))).resolves.toBe(true);
    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it('rejects requests without a bearer token', async () => {
    const guard = new AccessTokenGuard(reflector, tokens);

    await expect(guard.canActivate(contextWith({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      guard.canActivate(contextWith({ authorization: 'Basic abc' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the user id from a valid token', async () => {
    verifyAccessToken.mockResolvedValueOnce('user-1');
    const guard = new AccessTokenGuard(reflector, tokens);
    const request: Record<string, unknown> = {};

    await expect(
      guard.canActivate(
        contextWith({ authorization: 'Bearer token' }, request),
      ),
    ).resolves.toBe(true);
    expect(verifyAccessToken).toHaveBeenCalledWith('token');
    expect(request.user).toEqual({ id: 'user-1' });
  });

  it('propagates rejection of an invalid token', async () => {
    verifyAccessToken.mockRejectedValueOnce(new UnauthorizedException());
    const guard = new AccessTokenGuard(reflector, tokens);

    await expect(
      guard.canActivate(contextWith({ authorization: 'Bearer bad' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
