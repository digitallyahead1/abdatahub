const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
console.log('Connecting to database...');

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('Connected to database. Executing migrations...');

    // 1. Add columns to 'user'
    await client.query(`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS "agentStatus" VARCHAR DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS "agentAppliedAt" TIMESTAMP;
    `);
    console.log('Added agentStatus and agentAppliedAt to user table.');

    // 2. Add columns to 'data_plan'
    await client.query(`
      ALTER TABLE "data_plan" 
      ADD COLUMN IF NOT EXISTS "agentPrice" DECIMAL(20, 2) DEFAULT 0.00;
    `);
    console.log('Added agentPrice to data_plan table.');

    // 3. Add columns to 'airtime_pricing'
    await client.query(`
      ALTER TABLE "airtime_pricing" 
      ADD COLUMN IF NOT EXISTS "agentRate" DECIMAL(5, 4) DEFAULT 1.0000;
    `);
    console.log('Added agentRate to airtime_pricing table.');

    // 4. Add columns to 'exam_category'
    await client.query(`
      ALTER TABLE "exam_category" 
      ADD COLUMN IF NOT EXISTS "agentPrice" DECIMAL(20, 2) DEFAULT 0.00;
    `);
    console.log('Added agentPrice to exam_category table.');

    console.log('All migrations executed successfully!');
  } catch (err) {
    console.error('Error executing migrations:', err);
  } finally {
    await client.end();
  }
}

run();
