import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';

// Initialize PostgreSQL Pool with SSL configuration for Supabase pooler
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function testDbConnection(): Promise<boolean> {
  try {
    if (!env.DATABASE_URL) return false;
    const res = await pool.query('SELECT 1 as connected');
    return res.rows[0]?.connected === 1;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}
