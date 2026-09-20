const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // Find all GAFIAPAY_WEBHOOK_RECEIVED logs since 12:15 UTC today
  const res = await client.query(`
    SELECT id, details, "createdAt"
    FROM audit_log
    WHERE action = 'GAFIAPAY_WEBHOOK_RECEIVED'
      AND "createdAt" >= '2026-09-20T12:15:00Z'
    ORDER BY "createdAt" ASC
  `);

  const txRes = await client.query(`SELECT reference FROM transaction WHERE reference IS NOT NULL`);
  const existingRefs = new Set(txRes.rows.map(r => r.reference));

  const wtRes = await client.query(`SELECT reference FROM wallet_transaction WHERE reference IS NOT NULL`);
  const existingWtRefs = new Set(wtRes.rows.map(r => r.reference));

  const vaRes = await client.query(`SELECT "userId", "accountNumber", "accountName" FROM gafiapay_virtual_accounts`);
  const vaMap = new Map();
  vaRes.rows.forEach(r => vaMap.set(r.accountNumber, r));

  const uncredited = [];

  for (const row of res.rows) {
    const details = row.details;
    if (!details || !details.body) continue;

    const body = details.body;
    const transaction = body.data?.transaction || body.payload?.transaction || body.event?.data?.transaction || body.transaction;
    const data = transaction || body.data || body.payload || body.event?.data || body;

    const accountNumber = data.metadata?.virtualAccountNo || data.metadata?.virtual_account_no || data.metadata?.virtualAccountNumber
      || data.accountNumber || data.account_number || data.virtualAccountNumber
      || data.virtual_account_number || data.destinationAccountNumber || data.destination_account_number;
    const amount = data.amount || data.amountPaid || data.amount_paid || data.settlementAmount
      || data.settlement_amount || data.creditAmount || data.credit_amount;
    const reference = data.id || data.orderNo || data.order_no || data.reference || data.txRef || data.tx_ref 
      || data.paymentReference || data.payment_reference || data.transactionReference || data.transaction_reference
      || data.sessionId || data.session_id || data.bankTransferReference;

    if (!accountNumber || !amount || !reference) continue;

    if (!existingRefs.has(reference) && !existingWtRefs.has(reference)) {
      const va = vaMap.get(accountNumber);
      uncredited.push({
        createdAt: row.createdAt,
        userId: va ? va.userId : null,
        accountName: va ? va.accountName : null,
        accountNumber,
        reference,
        amount: parseFloat(amount),
        customerEmail: data.email || 'N/A',
      });
    }
  }

  console.log(`Found ${uncredited.length} uncredited transactions:`);
  console.table(uncredited);

  await client.end();
}

run().catch(console.error);
