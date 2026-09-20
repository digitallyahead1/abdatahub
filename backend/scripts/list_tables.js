const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DIRECT_URL or DATABASE_URL must be defined in environment.');
  }
  const client = new Client({ connectionString });
  await client.connect();
  const r = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  console.log('Tables in DB:');
  r.rows.forEach(x => console.log(' -', x.tablename));
  await client.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
