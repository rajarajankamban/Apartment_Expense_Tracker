import { Pool, PoolClient } from 'pg';
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
  let client: PoolClient | undefined;

  try {
    if (request.method !== 'POST') {
      response.setHeader('Allow', ['POST']);
      return response.status(405).end(`Method ${request.method} Not Allowed`);
    }
    
    const transactions = request.body;
    if (!Array.isArray(transactions)) {
      return response.status(400).json({ error: 'Request body must be an array of transactions' });
    }

    const dbPool = getDbPool();
    client = await dbPool.connect();
    
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE transactions RESTART IDENTITY;');
    
    for (const tx of transactions) {
      const { date, description, amount, type } = tx;
      if (!date || !description || amount === undefined || !type) {
         throw new Error(`Invalid transaction object in array: ${JSON.stringify(tx)}`);
      }
      await client.query(
        'INSERT INTO transactions (date, description, amount, type) VALUES ($1, $2, $3, $4);',
        [date, description, amount, type]
      );
    }

    await client.query('COMMIT');

    const { rows } = await client.query('SELECT * FROM transactions ORDER BY date DESC, id DESC;');
    return response.status(200).json(rows);

  } catch (error: any) {
    if (client) {
      // Safely attempt to rollback
      await client.query('ROLLBACK').catch(rollbackErr => console.error('Rollback failed:', rollbackErr));
    }
    console.error('API Import Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return response.status(500).json({ error: 'Internal Server Error', details: errorMessage });
  } finally {
    if (client) {
      client.release();
    }
  }
}