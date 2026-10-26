import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  AuthResponse,
  AuthTokens,
  ChangePasswordRequest,
  LoginRequest,
  PhoneVerifyRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '@repo/api';
import { and, eq } from 'drizzle-orm';

import { DB, type Database } from '../db';
import { authIdentities, users } from '../db/schema';
import { NotificationsService } from '../notifications/notifications.service';
import { toProfile, UsersService, type UserRow } from '../users/users.service';
import { GoogleIdTokenVerifier } from './google-id-token.verifier';
import {
  getDummyPasswordHash,
  hashPassword,
  verifyPassword,
} from './passwords';
import { TokensService, type ClientInfo } from './tokens.service';
import { VerificationCodesService } from './verification-codes.service';

const INVALID_CREDENTIALS = 'Incorrect email or password.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly users: UsersService,
    private readonly tokens: TokensService,
    private readonly codes: VerificationCodesService,
    private readonly notifications: NotificationsService,
    private readonly google: GoogleIdTokenVerifier,
  ) {}

  // -------------------------------------------------------------------------
  // Email + password
  // -------------------------------------------------------------------------

  async register(
    request: RegisterRequest,
    client: ClientInfo,
  ): Promise<AuthResponse> {
    if (await this.users.findByEmail(request.email)) {
      throw new ConflictException('An account with this email already exists.');
    }
    const passwordHash = await hashPassword(request.password);

    const { user, tokens } = await this.db.transaction(async (tx) => {
      const created = await this.users.createWithPersonalWorkspace(tx, {
        email: request.email,
        passwordHash,
        name: request.name ?? null,
      });
      return {
        user: created,
        tokens: await this.tokens.issue(created.id, client, tx),
      };
    });

    // Sign-up succeeds even if the email cannot be sent; the user can request another code.
    await this.sendEmailVerification(user).catch((error: unknown) =>
      this.logger.warn(
        `Could not send verification email to user ${user.id}: ${String(error)}`,
      ),
    );

    return { user: toProfile(user), tokens, isNewUser: true };
  }

  async login(
    request: LoginRequest,
    client: ClientInfo,
  ): Promise<AuthResponse> {
    const user = await this.users.findByEmail(request.email);
    if (!user?.passwordHash) {
      // Same work as a real check, so timing does not reveal whether the account exists.
      await verifyPassword(request.password, await getDummyPasswordHash());
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (!(await verifyPassword(request.password, user.passwordHash))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    return {
      user: toProfile(user),
      tokens: await this.tokens.issue(user.id, client),
      isNewUser: false,
    };
  }

  // -------------------------------------------------------------------------
  // Google
  // -------------------------------------------------------------------------

  /**
   * Signs in with a Google ID token. Matches by Google account id first; otherwise links to an
   * existing account with the same email only when Google has verified that email; otherwise
   * creates a new account.
   */
  async signInWithGoogle(
    idToken: string,
    client: ClientInfo,
  ): Promise<AuthResponse> {
    const profile = await this.google.verify(idToken);

    const result = await this.db.transaction(async (tx) => {
      const [identity] = await tx
        .select({ userId: authIdentities.userId })
        .from(authIdentities)
        .where(
          and(
            eq(authIdentities.provider, 'google'),
            eq(authIdentities.providerUserId, profile.subject),
          ),
        )
        .limit(1);

      let user: UserRow | undefined;
      let isNewUser = false;

      if (identity) {
        user = await this.users.findById(identity.userId, tx);
      } else {
        if (!profile.email) {
          throw new BadRequestException(
            'Your Google account did not share an email address.',
          );
        }
        const existing = await this.users.findByEmail(profile.email, tx);
        if (existing) {
          if (!profile.emailVerified) {
            throw new ConflictException(
              'An account with this email already exists. Sign in with your password, then link Google.',
            );
          }
          user = existing;
          if (!existing.emailVerifiedAt) {
            [user] = await tx
              .update(users)
              .set({ emailVerifiedAt: new Date() })
              .where(eq(users.id, existing.id))
              .returning();
          }
        } else {
          user = await this.users.createWithPersonalWorkspace(tx, {
            email: profile.email,
            emailVerified: profile.emailVerified,
            name: profile.name,
            avatarUrl: profile.picture,
          });
          isNewUser = true;
        }
        await tx.insert(authIdentities).values({
          userId: user!.id,
          provider: 'google',
          providerUserId: profile.subject,
          email: profile.email,
        });
      }

      if (!user) {
        throw new UnauthorizedException('This account no longer exists.');
      }
      return {
        user,
        isNewUser,
        tokens: await this.tokens.issue(user.id, client, tx),
      };
    });

    return {
      user: toProfile(result.user),
      tokens: result.tokens,
      isNewUser: result.isNewUser,
    };
  }

  // -------------------------------------------------------------------------
  // Phone number + SMS code (sign in or sign up)
  // -------------------------------------------------------------------------

  async requestPhoneCode(phone: string): Promise<void> {
    const code = await this.codes.issue({
      channel: 'sms',
      target: phone,
      purpose: 'login_otp',
    });
    await this.notifications.sendSmsCode(phone, 'login_otp', code);
  }

  async verifyPhoneCode(
    request: PhoneVerifyRequest,
    client: ClientInfo,
  ): Promise<AuthResponse> {
    // Consume outside the transaction: a wrong guess must persist its attempt count even though we throw.
    await this.codes.consume(request.phone, 'login_otp', request.code);

    const result = await this.db.transaction(async (tx) => {
      let user = await this.users.findByPhone(request.phone, tx);
      let isNewUser = false;
      if (!user) {
        user = await this.users.createWithPersonalWorkspace(tx, {
          phone: request.phone,
          phoneVerified: true,
        });
        isNewUser = true;
      } else if (!user.phoneVerifiedAt) {
        [user] = await tx
          .update(users)
          .set({ phoneVerifiedAt: new Date() })
          .where(eq(users.id, user.id))
          .returning();
      }
      return {
        user: user!,
        isNewUser,
        tokens: await this.tokens.issue(user!.id, client, tx),
      };
    });
    return {
      user: toProfile(result.user),
      tokens: result.tokens,
      isNewUser: result.isNewUser,
    };
  }

  // -------------------------------------------------------------------------
  // Sessions
  // -------------------------------------------------------------------------

  async refresh(refreshToken: string, client: ClientInfo): Promise<AuthTokens> {
    const { tokens } = await this.tokens.rotate(refreshToken, client);
    return tokens;
  }

  logout(refreshToken: string): Promise<void> {
    return this.tokens.revokeSession(refreshToken);
  }

  logoutEverywhere(userId: string): Promise<void> {
    return this.tokens.revokeAllForUser(userId);
  }

  // -------------------------------------------------------------------------
  // Email verification
  // -------------------------------------------------------------------------

  async requestEmailVerification(userId: string): Promise<void> {
    const user = await this.requireUser(userId);
    if (!user.email) {
      throw new BadRequestException(
        'Add an email address to your account first.',
      );
    }
    if (user.emailVerifiedAt) {
      return;
    }
    await this.sendEmailVerification(user);
  }

  async verifyEmail(userId: string, code: string): Promise<void> {
    const user = await this.requireUser(userId);
    if (!user.email) {
      throw new BadRequestException(
        'Add an email address to your account first.',
      );
    }
    if (user.emailVerifiedAt) {
      return;
    }
    await this.codes.consume(user.email, 'verify_email', code);
    await this.db
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  // -------------------------------------------------------------------------
  // Passwords
  // -------------------------------------------------------------------------

  /** Always succeeds from the caller's point of view, so it cannot be used to discover accounts. */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user?.email) {
      return;
    }
    try {
      const code = await this.codes.issue({
        channel: 'email',
        target: user.email,
        purpose: 'reset_password',
        userId: user.id,
      });
      await this.notifications.sendEmailCode(
        user.email,
        'reset_password',
        code,
      );
    } catch (error) {
      // Rate limits are swallowed too: a 429 only for real accounts would reveal them.
      if (!(error instanceof HttpException)) {
        throw error;
      }
    }
  }

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    const user = await this.users.findByEmail(request.email);
    if (!user?.email) {
      throw new BadRequestException('The code is invalid or has expired.');
    }
    await this.codes.consume(user.email, 'reset_password', request.code);
    const passwordHash = await hashPassword(request.newPassword);
    await this.db.transaction(async (tx) => {
      // Receiving the code proves control of the inbox, so the email counts as verified.
      await tx
        .update(users)
        .set({
          passwordHash,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        })
        .where(eq(users.id, user.id));
      await this.tokens.revokeAllForUser(user.id, tx);
    });
  }

  /** Sets or changes the password, signs out all other sessions and returns a fresh session. */
  async changePassword(
    userId: string,
    request: ChangePasswordRequest,
    client: ClientInfo,
  ): Promise<AuthTokens> {
    const user = await this.requireUser(userId);
    if (user.passwordHash) {
      if (
        !request.currentPassword ||
        !(await verifyPassword(request.currentPassword, user.passwordHash))
      ) {
        throw new UnauthorizedException('Your current password is incorrect.');
      }
    }
    const passwordHash = await hashPassword(request.newPassword);
    return this.db.transaction(async (tx) => {
      await tx.update(users).set({ passwordHash }).where(eq(users.id, user.id));
      await this.tokens.revokeAllForUser(user.id, tx);
      return this.tokens.issue(user.id, client, tx);
    });
  }

  // -------------------------------------------------------------------------

  private async requireUser(userId: string): Promise<UserRow> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('This account no longer exists.');
    }
    return user;
  }

  private async sendEmailVerification(user: UserRow): Promise<void> {
    if (!user.email) {
      return;
    }
    const code = await this.codes.issue({
      channel: 'email',
      target: user.email,
      purpose: 'verify_email',
      userId: user.id,
    });
    await this.notifications.sendEmailCode(user.email, 'verify_email', code);
  }
}
