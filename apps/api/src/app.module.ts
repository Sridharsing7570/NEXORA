import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { LinksModule } from './links/links.module';
import { AuthModule } from './auth/auth.module';
import { AccessTokenGuard } from './auth/access-token.guard';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './db/database.module';
import { UsersModule } from './users/users.module';

import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    // In-memory counters work for a single instance; switch to Redis storage before scaling out.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    AuthModule,
    UsersModule,
    LinksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards run in registration order: rate limit first, then authentication.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useExisting: AccessTokenGuard },
  ],
})
export class AppModule {}
