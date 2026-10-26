import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { AccessTokenGuard } from './access-token.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleIdTokenVerifier } from './google-id-token.verifier';
import { TokensService } from './tokens.service';
import { VerificationCodesService } from './verification-codes.service';

@Module({
  imports: [UsersModule, NotificationsModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokensService,
    VerificationCodesService,
    GoogleIdTokenVerifier,
    AccessTokenGuard,
  ],
  exports: [AccessTokenGuard],
})
export class AuthModule {}
