/**
 * Diagnose: Why Gafiapay webhooks are not crediting wallets
 * Run: node scripts/diagnose_gafia_webhooks.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('Connected to database.\n');

  // 1. Last 20 Gafiapay audit log entries
  console.log('=== 1. RECENT GAFIAPAY WEBHOOK AUDIT LOGS (last 50 entries) ===');
  const logs = await client.query(`
    SELECT *
    FROM audit_log
    WHERE action ILIKE '%WEBHOOK%' OR action ILIKE '%GAFIA%' OR action ILIKE '%DEPOSIT%'
    ORDER BY "createdAt" DESC
    LIMIT 50
  `);
  if (logs.rows.length === 0) {
    console.log('  No webhook audit logs found.');
  }
  logs.rows.forEach(r => {
    console.log(`\n  [${r.createdAt}] ACTION: ${r.action} USER: ${r.userId}`);
    console.log(`  DETAILS: ${JSON.stringify(r.details || r.meta || r.metadata || r)}`);
  });

  // 2. Last deposits in transaction table
  console.log('\n=== 2. LAST 10 WALLET DEPOSITS IN transaction TABLE ===');
  const txs = await client.query(`
    SELECT id, "userId", type, service, amount, status, reference, metadata, "createdAt"
    FROM transaction
    WHERE service = 'deposit'
    ORDER BY "createdAt" DESC
    LIMIT 10
  `);
  if (txs.rows.length === 0) {
    console.log('  No deposit transactions found.');
  }
  console.table(txs.rows);

  // 3. All tables in database
  console.log('\n=== 3. TABLES IN DATABASE ===');
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log(tables.rows.map(t => t.table_name).join(', '));

  // 4. Last wallet_transaction credits
  console.log('\n=== 4. LAST 10 WALLET CREDIT TRANSACTIONS ===');
  const walletTxs = await client.query(`
    SELECT wt.id, wt."walletId", wt.type, wt.amount, wt.description, wt.reference, wt."previousBalance", wt."newBalance", wt."createdAt"
    FROM wallet_transaction wt
    WHERE wt.type = 'credit'
    ORDER BY wt."createdAt" DESC
    LIMIT 10
  `);
  if (walletTxs.rows.length === 0) {
    console.log('  No credit wallet transactions found.');
  }
  console.table(walletTxs.rows);

  // 5. Unprocessed or failed webhook logs
  console.log('\n=== 5. BLOCKED OR FAILED WEBHOOK AUDIT LOGS ===');
  const failedLogs = await client.query(`
    SELECT *
    FROM audit_log
    WHERE action ILIKE '%BLOCKED%' OR action ILIKE '%FAIL%' OR action ILIKE '%ERROR%' OR action ILIKE '%REJECT%'
    ORDER BY "createdAt" DESC
    LIMIT 20
  `);
  if (failedLogs.rows.length === 0) {
    console.log('  No failed/blocked audit logs found.');
  }
  failedLogs.rows.forEach(r => {
    console.log(`\n  [${r.createdAt}] ACTION: ${r.action}`);
    console.log(`  DETAILS: ${JSON.stringify(r.details || r.meta || r.metadata || r)}`);
  });

  await client.end();
  console.log('\n=== DIAGNOSTIC COMPLETE ===');
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
