import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export * as schema from './schema';

export type Database = NodePgDatabase;
/** The transaction handle passed to `db.transaction(async (tx) => …)`. */
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
/** Code that works both inside and outside a transaction. */
export type DbExecutor = Database | Transaction;

export function createDatabase(connectionString: string) {
  const pool = new Pool({ connectionString, max: 10 });
  const db: Database = drizzle({ client: pool });
  return { db, pool };
}

/** Injection token for the Drizzle database. */
export const DB = Symbol('DB');
