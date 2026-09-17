const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres.myisfwzxbktxblixnpan:Seeman%401999__@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'
  });
  await client.connect();
  const r = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  console.log('Tables in DB:');
  r.rows.forEach(x => console.log(' -', x.tablename));
  await client.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
