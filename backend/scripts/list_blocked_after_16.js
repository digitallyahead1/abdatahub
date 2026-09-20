const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const res = await client.query(`
    SELECT id, details, "createdAt"
    FROM audit_log
    WHERE action = 'GAFIAPAY_WEBHOOK_RECEIVED'
      AND "createdAt" > '2026-09-20T15:56:00Z'
    ORDER BY "createdAt" ASC
  `);

  console.log(`Found ${res.rows.length} Gafiapay webhooks received after 15:56 UTC:`);

  const vaRes = await client.query(`SELECT "userId", "accountNumber", "accountName" FROM gafiapay_virtual_accounts`);
  const vaMap = new Map();
  vaRes.rows.forEach(r => vaMap.set(r.accountNumber, r));

  const list = [];
  for (const row of res.rows) {
    const body = row.details.body;
    const tx = body.data?.transaction;
    const meta = tx?.metadata;
    const va = vaMap.get(meta?.virtualAccountNo);

    list.push({
      webhookTime: row.createdAt,
      amount: tx?.amount,
      orderNo: tx?.orderNo,
      refId: tx?.id,
      virtualAccountNo: meta?.virtualAccountNo,
      accountName: meta?.virtualAccountName,
      payerName: meta?.payerAccountName,
      userId: va?.userId,
    });
  }

  console.table(list);
  await client.end();
}

run().catch(console.error);
