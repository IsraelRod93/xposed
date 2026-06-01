import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("DATABASE_URL is missing. Neon features will be unavailable.");
}

export const sql = databaseUrl ? neon(databaseUrl) : null as any;
