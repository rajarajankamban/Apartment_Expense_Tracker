import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Cache the pool connection between function invocations.
let pool: Pool;

function getDbPool(): Pool {
  if (!pool) {
    // This check provides a clear error message if the database connection string is missing.
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
    const dbPool = getDbPool();

    if (request.method === 'GET') {
      const { rows } = await dbPool.query('SELECT * FROM transactions ORDER BY date DESC, id DESC;');
      return response.status(200).json(rows);

    } else if (request.method === 'POST') {
      const { date, description, amount, type } = request.body;
      
      if (!date || !description || amount === undefined || !type) {
        return response.status(400).json({ error: 'Missing required fields' });
      }
      
      const result = await dbPool.query(
        'INSERT INTO transactions (date, description, amount, type) VALUES ($1, $2, $3, $4) RETURNING *;',
        [date, description, amount, type]
      );
      return response.status(201).json(result.rows[0]);

    } else {
      response.setHeader('Allow', ['GET', 'POST']);
      return response.status(405).end(`Method ${request.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // Send a more informative error response
    return response.status(500).json({ 
      error: 'Internal Server Error', 
      details: errorMessage 
    });
  }
}