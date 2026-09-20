/**
 * Systematic Reversal Script for False Duplicate Credits
 * Incident: 2026-09-20 18:19 - 18:36 UTC (747 duplicate transactions, ₦1,415,944 across 48 users)
 * 
 * Usage:
 *   node scripts/execute_wallet_reversal.js --dry-run
 *   node scripts/execute_wallet_reversal.js --execute
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const IS_EXECUTE = process.argv.includes('--execute');

async function run() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log('===============================================================');
  console.log(`WALLET DUPLICATE CREDIT REVERSAL TOOL`);
  console.log(`MODE: ${IS_EXECUTE ? '*** LIVE EXECUTION ***' : '--- DRY RUN (SIMULATION ONLY) ---'}`);
  console.log('===============================================================\n');

  // 1. Identify the exact 747 bogus transactions inserted by credit_uncredited_gafia_webhooks.js
  const bogusTxsRes = await client.query(`
    SELECT 
      t.id as tx_id,
      t."userId",
      u.email,
      u."fullName",
      u."phoneNumber",
      t.amount,
      t.reference,
      t."createdAt",
      t."updatedAt",
      w.id as wallet_id,
      w.balance as current_balance,
      w."ledgerBalance" as current_ledger_balance
    FROM transaction t
    JOIN "user" u ON t."userId" = u.id
    JOIN wallet w ON t."userId" = w."userId"
    WHERE t.service = 'deposit'
      AND t.status = 'success'
      AND t.reference ~ '^[0-9a-f]{24}$'
      AND t."updatedAt"::text >= '2026-09-20 19:15:00'
      AND t."updatedAt"::text <= '2026-09-20 19:40:00'
    ORDER BY t."updatedAt" ASC;
  `);

  console.log(`Found ${bogusTxsRes.rows.length} bogus duplicate deposit transactions.`);

  if (bogusTxsRes.rows.length === 0) {
    console.log('No unreversed bogus transactions found. Exiting.');
    await client.end();
    return;
  }

  // 2. Aggregate per user
  const userMap = new Map();
  for (const row of bogusTxsRes.rows) {
    const uid = row.userId;
    if (!userMap.has(uid)) {
      userMap.set(uid, {
        userId: uid,
        email: row.email,
        fullName: row.fullName,
        phone: row.phoneNumber,
        walletId: row.wallet_id,
        currentBalance: parseFloat(row.current_balance),
        currentLedgerBalance: parseFloat(row.current_ledger_balance),
        totalBogusCredit: 0,
        txIds: [],
        references: [],
      });
    }
    const u = userMap.get(uid);
    u.totalBogusCredit += parseFloat(row.amount);
    u.txIds.push(row.tx_id);
    u.references.push(row.reference);
  }

  console.log(`Total affected users: ${userMap.size}`);

  let totalReversed = 0;
  let totalDeficit = 0;
  const users = Array.from(userMap.values()).sort((a, b) => b.totalBogusCredit - a.totalBogusCredit);

  for (const u of users) {
    const prevBal = u.currentBalance;
    const newBal = prevBal - u.totalBogusCredit;
    totalReversed += u.totalBogusCredit;
    if (newBal < 0) {
      totalDeficit += Math.abs(newBal);
    }

    console.log(`\nUser: ${u.email} (${u.fullName}, Phone: ${u.phone})`);
    console.log(`  Duplicate Amount to Deduct: ₦${u.totalBogusCredit.toLocaleString()}`);
    console.log(`  Current Balance: ₦${prevBal.toLocaleString()} -> New Balance: ₦${newBal.toLocaleString()} (Diff: ₦${newBal < 0 ? 'OVERSPENT by ' + Math.abs(newBal) : 'Clean'})`);
    console.log(`  Bogus Transactions to Cancel: ${u.txIds.length}`);

    if (IS_EXECUTE) {
      await client.query('BEGIN');
      try {
        // 1. Lock wallet row
        const lockRes = await client.query(`SELECT id, balance, "ledgerBalance" FROM wallet WHERE id = $1 FOR UPDATE`, [u.walletId]);
        const currentWallet = lockRes.rows[0];
        const lockedPrevBal = parseFloat(currentWallet.balance);
        const lockedNewBal = lockedPrevBal - u.totalBogusCredit;
        const lockedPrevLedger = parseFloat(currentWallet.ledgerBalance);
        const lockedNewLedger = lockedPrevLedger - u.totalBogusCredit;

        // 2. Update wallet balance
        await client.query(`
          UPDATE wallet
          SET balance = $1, "ledgerBalance" = $2, "updatedAt" = NOW()
          WHERE id = $3
        `, [lockedNewBal, lockedNewLedger, u.walletId]);

        // 3. Mark the bogus deposit transactions as 'cancelled'
        await client.query(`
          UPDATE transaction
          SET status = 'cancelled', 
              metadata = jsonb_set(COALESCE(metadata::jsonb, '{}'::jsonb), '{reversalReason}', '"duplicate_script_credit_reversed"')
          WHERE id = ANY($1::uuid[])
        `, [u.txIds]);

        // 4. Insert formal reversal ledger entry in wallet_transaction
        const revRef = 'REV' + Math.random().toString(36).substring(2, 12).toUpperCase();
        await client.query(`
          INSERT INTO wallet_transaction (id, "walletId", type, amount, description, reference, "previousBalance", "newBalance", "createdAt")
          VALUES (gen_random_uuid(), $1, 'debit', $2, 'System correction: Reversal of duplicate deposit credit', $3, $4, $5, NOW())
        `, [u.walletId, u.totalBogusCredit, revRef, lockedPrevBal, lockedNewBal]);

        // 5. Insert corresponding reversal transaction record
        await client.query(`
          INSERT INTO transaction (id, "userId", type, service, amount, status, reference, metadata, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, 'debit', 'reversal', $2, 'success', $3, $4, NOW(), NOW())
        `, [u.userId, u.totalBogusCredit, revRef, JSON.stringify({ reason: 'Duplicate credit correction', reversedTxsCount: u.txIds.length })]);

        // 6. Audit log entry
        await client.query(`
          INSERT INTO audit_log (id, "userId", "userEmail", action, details, "ipAddress", "createdAt")
          VALUES (gen_random_uuid(), $1, 'system@security', 'WALLET_DUPLICATE_CREDIT_REVERSED', $2, 'system', NOW())
        `, [u.userId, JSON.stringify({
          reversedAmount: u.totalBogusCredit,
          previousBalance: lockedPrevBal,
          newBalance: lockedNewBal,
          reversedTxCount: u.txIds.length
        })]);

        await client.query('COMMIT');
        console.log(`  [REVERSED] Successfully deducted ₦${u.totalBogusCredit} from ${u.email}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  [ERROR] Failed to reverse for ${u.email}:`, err.message);
      }
    }
  }

  console.log('\n===============================================================');
  console.log(`REVERSAL SUMMARY:`);
  console.log(`Total Users Processed: ${users.length}`);
  console.log(`Total Money Deducted/Reversed: ₦${totalReversed.toLocaleString()}`);
  console.log(`Total Overspent Shortfall by 6 Users: ₦${totalDeficit.toLocaleString()}`);
  console.log(`MODE: ${IS_EXECUTE ? 'EXECUTED SUCCESSFULLY' : 'DRY RUN ONLY - NO CHANGES MADE'}`);
  console.log('===============================================================\n');

  await client.end();
}

run().catch(console.error);
