import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// Migrations should use a direct (non-pooled) connection; fall back to the app URL.
const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error('Set DATABASE_URL (or DATABASE_URL_DIRECT) in apps/api/.env');
}

export default defineConfig({
  out: './drizzle',
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  dbCredentials: { url },
  breakpoints: true,
  verbose: true,
  strict: true,
});
