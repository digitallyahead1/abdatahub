const { Client } = require('pg');
const DB_URL = 'postgresql://postgres.myisfwzxbktxblixnpan:Seeman%401999__@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

async function check() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const res = await client.query('SELECT id, title, "successCount", "failureCount", "sentBy", "createdAt" FROM push_notification_log ORDER BY "createdAt" DESC LIMIT 10');
  console.log(res.rows);
  await client.end();
}

check().catch(console.error);
