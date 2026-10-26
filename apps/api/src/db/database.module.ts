import {
  Global,
  Inject,
  Logger,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import type { Pool } from 'pg';

import { ENV, type Env } from '../config/env';
import { createDatabase, DB } from './index';

const POOL = Symbol('PG_POOL');

@Global()
@Module({
  providers: [
    {
      provide: POOL,
      inject: [ENV],
      useFactory: (env: Env) => createDatabase(env.DATABASE_URL),
    },
    {
      provide: DB,
      inject: [POOL],
      useFactory: (connection: ReturnType<typeof createDatabase>) =>
        connection.db,
    },
  ],
  exports: [DB],
})
export class DatabaseModule implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(
    @Inject(POOL)
    private readonly connection: ReturnType<typeof createDatabase>,
  ) {}

  async onApplicationShutdown() {
    await this.connection.pool.end();
    this.logger.log('Database pool closed');
  }
}
