const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Client } = require('pg');
const DB_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function check() {
  if (!DB_URL) {
    throw new Error('DIRECT_URL or DATABASE_URL must be defined in environment.');
  }
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const res = await client.query('SELECT id, title, "successCount", "failureCount", "sentBy", "createdAt" FROM push_notification_log ORDER BY "createdAt" DESC LIMIT 10');
  console.log(res.rows);
  await client.end();
}

check().catch(console.error);
