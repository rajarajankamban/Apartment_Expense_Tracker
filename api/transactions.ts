import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This check provides a clear error message if the database connection string is missing.
if (!process.env.POSTGRES_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// Initialize a connection pool.
// The 'pg' library automatically reads connection details
// from environment variables like POSTGRES_URL.
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    // NOTE: The 'CREATE TABLE' query has been removed.
    // It is now assumed the table exists in your database (e.g., Supabase).
    // You are in control of your database schema.

    if (request.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM transactions ORDER BY date DESC, id DESC;');
      return response.status(200).json(rows);

    } else if (request.method === 'POST') {
      const { date, description, amount, type } = request.body;
      
      if (!date || !description || amount === undefined || !type) {
        return response.status(400).json({ error: 'Missing required fields' });
      }
      
      const result = await pool.query(
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
    return response.status(500).json({ error: 'Internal Server Error', details: errorMessage });
  }
}