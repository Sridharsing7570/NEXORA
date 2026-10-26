import {
  createParamDecorator,
  SetMetadata,
  type ExecutionContext,
} from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/** Skips the global access-token guard for a route or controller. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

export type AuthenticatedUser = { id: string };

/** The user resolved from the access token by `AccessTokenGuard`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new Error('CurrentUser used on a route without AccessTokenGuard');
    }
    return request.user;
  },
);

export type RequestClient = {
  userAgent: string | null;
  ipAddress: string | null;
};

/** User agent and IP of the caller, recorded on refresh tokens so users can review their sessions. */
export const Client = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestClient => {
    const request = context
      .switchToHttp()
      .getRequest<{
        ip?: string;
        headers: Record<string, string | undefined>;
      }>();
    return {
      userAgent: request.headers['user-agent'] ?? null,
      ipAddress: request.ip ?? null,
    };
  },
);
