import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Cache the pool connection between function invocations.
let pool: Pool;

function getDbPool(): Pool {
  if (!pool) {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set. Please add it to your Vercel project settings and redeploy.');
    }
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}
 
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    if (request.method === 'POST') {
      const dbPool = getDbPool();
      await dbPool.query('TRUNCATE TABLE transactions RESTART IDENTITY;');
      return response.status(204).end(); // 204 No Content for success
    } else {
      response.setHeader('Allow', ['POST']);
      return response.status(405).end(`Method ${request.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return response.status(500).json({ error: 'Internal Server Error', details: errorMessage });
  }
}