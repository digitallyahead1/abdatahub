const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
console.log('Connecting to database...');

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log('\n--- Active Gafiapay Virtual Accounts ---');
    const accountsRes = await client.query('SELECT * FROM gafiapay_virtual_accounts ORDER BY "createdAt" DESC LIMIT 10;');
    console.table(accountsRes.rows);

    console.log('\n--- Recent Deposit Transactions ---');
    const txRes = await client.query('SELECT * FROM "transaction" ORDER BY "createdAt" DESC LIMIT 10;');
    console.table(txRes.rows);

    console.log('\n--- Recent Wallet Transactions ---');
    const walletTxRes = await client.query('SELECT * FROM wallet_transaction ORDER BY "createdAt" DESC LIMIT 10;');
    console.table(walletTxRes.rows);

    console.log('\n--- Wallet Balances ---');
    const walletRes = await client.query('SELECT * FROM wallet LIMIT 10;');
    console.table(walletRes.rows);
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await client.end();
  }
}

run();
