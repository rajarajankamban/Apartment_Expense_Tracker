import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});
 
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === 'POST') {
    try {
      await pool.query('TRUNCATE TABLE transactions RESTART IDENTITY;');
      return response.status(204).end(); // 204 No Content for success
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return response.status(500).json({ error: 'Internal Server Error', details: errorMessage });
    }
  } else {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }
}