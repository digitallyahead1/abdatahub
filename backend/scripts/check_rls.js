const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkRLS() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const res = await client.query(`
    SELECT 
      tablename, 
      rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);
  console.log('--- ALL TABLES IN PUBLIC SCHEMA AND RLS STATUS ---');
  console.table(res.rows);

  await client.end();
}

checkRLS().catch(err => {
  console.error(err);
  process.exit(1);
});
