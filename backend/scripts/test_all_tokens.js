/**
 * Gets the actual full FCM tokens from DB and tests them all via FCM
 * Run: node scripts/test_all_tokens.js
 */

const admin = require('firebase-admin');
const path = require('path');
const { Client } = require('pg');

const serviceAccountPath = path.resolve(__dirname, '../src/config/firebase-service-account.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const DB_URL = 'postgresql://postgres.myisfwzxbktxblixnpan:Seeman%401999__@aws-0-eu-west-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  const rows = await client.query(
    'SELECT id, "userId", token, platform, "lastSeenAt" FROM device_token WHERE "isActive" = true ORDER BY "lastSeenAt" DESC LIMIT 20'
  );
  await client.end();

  console.log(`Testing ${rows.rows.length} tokens...\n`);

  let ok = 0, stale = 0, other = 0;
  const staleIds = [];

  for (const row of rows.rows) {
    try {
      const result = await admin.messaging().send({
        token: row.token,
        notification: { title: 'AB Data Hub Test', body: 'Push notification test - please ignore' },
        android: { priority: 'high', notification: { sound: 'default', channelId: 'ab_data_hub_alerts' } },
        data: { title: 'Test', body: 'Test', click_action: 'FLUTTER_NOTIFICATION_CLICK' },
      });
      console.log(`✅ OK   userId=${row.userId} platform=${row.platform} msgId=${result}`);
      ok++;
    } catch (err) {
      const code = err.errorInfo?.code || err.message;
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
        console.log(`❌ STALE userId=${row.userId} platform=${row.platform} token[0:40]=${row.token.substring(0, 40)}`);
        staleIds.push(row.id);
        stale++;
      } else {
        console.log(`⚠️  ERR  userId=${row.userId} code=${code}`);
        other++;
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`✅ Valid/Delivered: ${ok}`);
  console.log(`❌ Stale/Invalid:  ${stale}`);
  console.log(`⚠️  Other errors:   ${other}`);
  
  if (staleIds.length > 0) {
    console.log(`\nStale token IDs to deactivate: ${staleIds.join(', ')}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
