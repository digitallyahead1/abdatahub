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

  // Check device_token table schema
  const schema = await client.query(
    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'device_token' ORDER BY ordinal_position"
  );
  console.log('device_token columns:');
  schema.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`));

  // Count tokens
  const count = await client.query('SELECT count(*) total, count(*) filter (where "isActive" = true) active FROM device_token');
  console.log('\nToken counts:', count.rows[0]);

  // Sample tokens
  const tokens = await client.query(
    'SELECT id, "userId", platform, "isActive", "lastSeenAt", left(token, 40) as token_prefix FROM device_token ORDER BY "lastSeenAt" DESC LIMIT 10'
  );
  console.log('\nLatest tokens:');
  tokens.rows.forEach(r => console.log(JSON.stringify(r)));

  // Push logs
  const logs = await client.query(
    'SELECT id, title, body, "targetType", "successCount", "failureCount", "sentBy", "createdAt" FROM push_notification_log ORDER BY "createdAt" DESC LIMIT 5'
  );
  console.log('\nPush notification logs:');
  logs.rows.forEach(r => console.log(JSON.stringify(r)));

  await client.end();
}
main().catch(e => { console.error('Error:', e.message); process.exit(1); });
