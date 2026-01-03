import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

if (!process.env.POSTGRES_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});
 
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { id } = request.query;

  if (!id || Array.isArray(id)) {
      return response.status(400).json({ error: 'A single transaction ID must be provided.' });
  }

  if (request.method === 'DELETE') {
    try {
      const result = await pool.query('DELETE FROM transactions WHERE id = $1;', [id]);
      if (result.rowCount === 0) {
        return response.status(404).json({ error: 'Transaction not found' });
      }
      return response.status(204).end(); // 204 No Content is standard for successful DELETE
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return response.status(500).json({ error: 'Internal Server Error', details: errorMessage });
    }
  } else {
    response.setHeader('Allow', ['DELETE']);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }
}