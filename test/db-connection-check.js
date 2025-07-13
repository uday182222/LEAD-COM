import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST || undefined,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
  database: process.env.DB_NAME || undefined,
  user: process.env.DB_USER || undefined,
  password: process.env.DB_PASSWORD || undefined,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});

async function checkEmailTemplatesSchema() {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'email_templates' ORDER BY ordinal_position`);
    console.log('Columns in email_templates:');
    res.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
  } catch (err) {
    console.error('Error querying email_templates schema:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

checkEmailTemplatesSchema(); 