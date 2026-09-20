const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Client } = require('pg');

const TARGET_REF_IDS = [
  '6ab01474ba402240cb4f36dd', // ₦2,800 to Usman Mustapha
  '6ab01c04ba402240cb4f3d81', // ₦500 to Alhassan Alhassan
  '6ab028ddba402240cb4f49ba', // ₦450 to Sada Halilu
  '6ab02dc3ba402240cb4f4e2d', // ₦220 to Sada Halilu
  '6ab02f80ba402240cb4f4fd0', // ₦1,300 to Abdulraman Auwal
];

async function run() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log('=== STARTING CONTROLLED CREDIT FOR 5 BLOCKED TRANSACTIONS ===\n');

  for (const refId of TARGET_REF_IDS) {
    // 1. Fetch the exact webhook audit log
    const logRes = await client.query(`
      SELECT details, "createdAt"
      FROM audit_log
      WHERE action = 'GAFIAPAY_WEBHOOK_RECEIVED'
        AND details->'body'->'data'->'transaction'->>'id' = $1
    `, [refId]);

    if (logRes.rows.length === 0) {
      console.error(`Audit log not found for ref ${refId}`);
      continue;
    }

    const row = logRes.rows[0];
    const tx = row.details.body.data.transaction;
    const meta = tx.metadata;
    const amount = parseFloat(tx.amount);
    const virtualAccountNo = meta.virtualAccountNo;
    const reference = tx.id;
    const createdAt = row.createdAt;

    // 2. Find user from virtual account
    const vaRes = await client.query(`
      SELECT "userId", "accountNumber", "accountName"
      FROM gafiapay_virtual_accounts
      WHERE "accountNumber" = $1
    `, [virtualAccountNo]);

    if (vaRes.rows.length === 0) {
      console.error(`Virtual account ${virtualAccountNo} not found for ref ${refId}`);
      continue;
    }

    const userId = vaRes.rows[0].userId;
    const accountName = vaRes.rows[0].accountName;

    // Check if reference already exists in transaction
    const existing = await client.query(`SELECT id FROM transaction WHERE reference = $1`, [reference]);
    if (existing.rows.length > 0) {
      console.log(`[ALREADY EXISTS] Ref ${reference} is already in transaction table.`);
      continue;
    }

    // Execute atomic credit in DB transaction
    await client.query('BEGIN');
    try {
      const wRes = await client.query(`
        SELECT id, balance, "ledgerBalance"
        FROM wallet
        WHERE "userId" = $1
        FOR UPDATE
      `, [userId]);

      if (wRes.rows.length === 0) {
        throw new Error(`Wallet not found for user ${userId}`);
      }

      const wallet = wRes.rows[0];
      const previousBalance = parseFloat(wallet.balance);
      const newBalance = previousBalance + amount;

      // Update wallet balance
      await client.query(`
        UPDATE wallet
        SET balance = balance + $1, "ledgerBalance" = "ledgerBalance" + $1, "updatedAt" = NOW()
        WHERE id = $2
      `, [amount, wallet.id]);

      // Insert wallet_transaction
      await client.query(`
        INSERT INTO wallet_transaction (id, "walletId", type, amount, description, reference, "previousBalance", "newBalance", "createdAt")
        VALUES (gen_random_uuid(), $1, 'credit', $2, 'Funded wallet via Gafiapay Bank Transfer', $3, $4, $5, $6)
      `, [wallet.id, amount, reference, previousBalance, newBalance, createdAt]);

      // Insert transaction
      await client.query(`
        INSERT INTO transaction (id, "userId", type, service, amount, status, reference, metadata, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, 'credit', 'deposit', $2, 'success', $3, $4, $5, NOW())
      `, [userId, amount, reference, JSON.stringify({ paymentMethod: 'Gafiapay Bank Transfer', orderNo: tx.orderNo, payerAccountName: meta.payerAccountName }), createdAt]);

      await client.query('COMMIT');
      console.log(`[SUCCESS CREDITED] ₦${amount} to User ${userId} (${accountName}) | Prev: ₦${previousBalance} -> New: ₦${newBalance} | Ref: ${reference}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[FAILED] Ref ${reference}:`, err.message);
    }
  }

  await client.end();
  console.log('\n=== COMPLETED CREDITING MISSING DEPOSITS ===');
}

run().catch(console.error);
