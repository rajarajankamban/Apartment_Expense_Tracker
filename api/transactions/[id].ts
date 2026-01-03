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
    const { id } = request.query;

    if (!id || Array.isArray(id)) {
        return response.status(400).json({ error: 'A single transaction ID must be provided.' });
    }

    if (request.method === 'DELETE') {
      const dbPool = getDbPool();
      const result = await dbPool.query('DELETE FROM transactions WHERE id = $1;', [id]);
      if (result.rowCount === 0) {
        return response.status(404).json({ error: 'Transaction not found' });
      }
      return response.status(204).end();
    } else {
      response.setHeader('Allow', ['DELETE']);
      return response.status(405).end(`Method ${request.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return response.status(500).json({ error: 'Internal Server Error', details: errorMessage });
  }
}