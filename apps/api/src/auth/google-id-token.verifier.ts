import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { ENV, type Env } from '../config/env';

export type GoogleProfile = {
  /** Stable Google account id. */
  subject: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
};

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

/**
 * Verifies ID tokens from Google Sign-In: signature against Google's published keys (cached and
 * refreshed by `jose`), issuer, expiry, and that the audience is one of our OAuth client IDs.
 */
@Injectable()
export class GoogleIdTokenVerifier {
  private readonly keys = createRemoteJWKSet(
    new URL('https://www.googleapis.com/oauth2/v3/certs'),
  );

  constructor(@Inject(ENV) private readonly env: Env) {}

  async verify(idToken: string): Promise<GoogleProfile> {
    if (this.env.GOOGLE_CLIENT_IDS.length === 0) {
      throw new ServiceUnavailableException(
        'Google sign-in is not configured.',
      );
    }

    let payload;
    try {
      ({ payload } = await jwtVerify(idToken, this.keys, {
        issuer: GOOGLE_ISSUERS,
        audience: this.env.GOOGLE_CLIENT_IDS,
      }));
    } catch {
      throw new UnauthorizedException('Invalid Google sign-in token.');
    }

    if (typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Invalid Google sign-in token.');
    }
    return {
      subject: payload.sub,
      email:
        typeof payload.email === 'string'
          ? payload.email.trim().toLowerCase()
          : null,
      emailVerified: payload.email_verified === true,
      name: typeof payload.name === 'string' ? payload.name : null,
      picture: typeof payload.picture === 'string' ? payload.picture : null,
    };
  }
}
