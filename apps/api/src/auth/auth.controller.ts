import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleSignInSchema,
  loginSchema,
  phoneRequestCodeSchema,
  phoneVerifySchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type AuthResponse,
  type AuthTokens,
  type ChangePasswordRequest,
  type ForgotPasswordRequest,
  type GoogleSignInRequest,
  type LoginRequest,
  type PhoneRequestCodeRequest,
  type PhoneVerifyRequest,
  type RefreshRequest,
  type RegisterRequest,
  type ResetPasswordRequest,
  type VerifyEmailRequest,
} from '@repo/api';

import {
  Client,
  CurrentUser,
  Public,
  type AuthenticatedUser,
  type RequestClient,
} from '../common/auth.decorators';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';

/** Stricter limit for endpoints that check secrets (passwords, codes): 10 per minute per IP. */
const SENSITIVE = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle(SENSITIVE)
  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterRequest,
    @Client() client: RequestClient,
  ): Promise<AuthResponse> {
    return this.auth.register(body, client);
  }

  @Public()
  @Throttle(SENSITIVE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginRequest,
    @Client() client: RequestClient,
  ): Promise<AuthResponse> {
    return this.auth.login(body, client);
  }

  @Public()
  @Throttle(SENSITIVE)
  @Post('google')
  @HttpCode(HttpStatus.OK)
  google(
    @Body(new ZodValidationPipe(googleSignInSchema)) body: GoogleSignInRequest,
    @Client() client: RequestClient,
  ): Promise<AuthResponse> {
    return this.auth.signInWithGoogle(body.idToken, client);
  }

  @Public()
  @Throttle(SENSITIVE)
  @Post('phone/request-code')
  @HttpCode(HttpStatus.ACCEPTED)
  async requestPhoneCode(
    @Body(new ZodValidationPipe(phoneRequestCodeSchema))
    body: PhoneRequestCodeRequest,
  ): Promise<void> {
    await this.auth.requestPhoneCode(body.phone);
  }

  @Public()
  @Throttle(SENSITIVE)
  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  verifyPhone(
    @Body(new ZodValidationPipe(phoneVerifySchema)) body: PhoneVerifyRequest,
    @Client() client: RequestClient,
  ): Promise<AuthResponse> {
    return this.auth.verifyPhoneCode(body, client);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body(new ZodValidationPipe(refreshSchema)) body: RefreshRequest,
    @Client() client: RequestClient,
  ): Promise<{ tokens: AuthTokens }> {
    return { tokens: await this.auth.refresh(body.refreshToken, client) };
  }

  /** Signs out the session that owns the refresh token. Public, so an expired access token is no obstacle. */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body(new ZodValidationPipe(refreshSchema)) body: RefreshRequest,
  ): Promise<void> {
    await this.auth.logout(body.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.auth.logoutEverywhere(user.id);
  }

  @Throttle(SENSITIVE)
  @Post('email/request-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  async requestEmailVerification(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.auth.requestEmailVerification(user.id);
  }

  @Throttle(SENSITIVE)
  @Post('email/verify')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(verifyEmailSchema)) body: VerifyEmailRequest,
  ): Promise<void> {
    await this.auth.verifyEmail(user.id, body.code);
  }

  @Public()
  @Throttle(SENSITIVE)
  @Post('password/forgot')
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema))
    body: ForgotPasswordRequest,
  ): Promise<void> {
    await this.auth.forgotPassword(body.email);
  }

  @Public()
  @Throttle(SENSITIVE)
  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema))
    body: ResetPasswordRequest,
  ): Promise<void> {
    await this.auth.resetPassword(body);
  }

  @Throttle(SENSITIVE)
  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(changePasswordSchema))
    body: ChangePasswordRequest,
    @Client() client: RequestClient,
  ): Promise<{ tokens: AuthTokens }> {
    return { tokens: await this.auth.changePassword(user.id, body, client) };
  }
}
