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
    const transactions = request.body;
    if (!Array.isArray(transactions)) {
      return response.status(400).json({ error: 'Request body must be an array of transactions' });
    }

    const client = await pool.connect();
    try {
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
      await client.query('ROLLBACK');
      console.error('API Import Error:', error);
      return response.status(500).json({ error: `Transaction failed: ${error.message}` });
    } finally {
      client.release();
    }
  } else {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }
}