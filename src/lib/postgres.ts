import { sql } from '@vercel/postgres';

let pool: typeof sql | null = null;

export async function connectToDatabase() {
  if (!pool) {
    pool = sql;
  }
  return pool;
}

export { sql };
