import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Create a singleton database connection
let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL || '');
    db = drizzle(sql, { schema });
  }
  return db;
}

export { schema };
