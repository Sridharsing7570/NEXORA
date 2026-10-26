import { Logger } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export * as schema from './schema';

export type Database = NodePgDatabase;
/** The transaction handle passed to `db.transaction(async (tx) => …)`. */
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
/** Code that works both inside and outside a transaction. */
export type DbExecutor = Database | Transaction;

const logger = new Logger('Database');

export function createDatabase(connectionString: string) {
  const pool = new Pool({
    connectionString,
    max: 10,
    // Close idle connections before the server or a proxy (Neon's pooler) drops them.
    idleTimeoutMillis: 30_000,
    keepAlive: true,
  });

  // An idle connection can be reset by the server (e.g. ECONNRESET from Neon). pg reports this as
  // an 'error' event on the pool; without a listener Node treats it as unhandled and kills the
  // process. The pool discards the broken connection and opens a new one on demand.
  pool.on('error', (error) => {
    logger.warn(`Idle database connection closed: ${error.message}`);
  });

  const db: Database = drizzle({ client: pool });
  return { db, pool };
}

/** Injection token for the Drizzle database. */
export const DB = Symbol('DB');
