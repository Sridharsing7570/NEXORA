import 'dotenv/config';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { ENV, type Env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  // Close the database pool cleanly on SIGTERM/SIGINT.
  app.enableShutdownHooks();
  await app.listen(app.get<Env>(ENV).PORT);
}

void bootstrap();
