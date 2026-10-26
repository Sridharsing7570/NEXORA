import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC, type AuthenticatedUser } from '../common/auth.decorators';
import { TokensService } from './tokens.service';

type AuthRequest = {
  headers: Record<string, string | undefined>;
  user?: AuthenticatedUser;
};

/**
 * Global guard: every route requires `Authorization: Bearer <access token>` unless marked `@Public()`.
 * Secure by default, so a new endpoint cannot be left open by forgetting a decorator.
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokensService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Missing access token.');
    }

    request.user = { id: await this.tokens.verifyAccessToken(token) };
    return true;
  }
}
