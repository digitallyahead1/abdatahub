const { Client } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sql = fs.readFileSync(path.join(__dirname, 'fix_rls.sql'), 'utf8');

async function applyRLS() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log('Applying RLS and revoking anon/authenticated grants on all 21 tables...');
    await client.query(sql);
    console.log('SUCCESS: RLS applied and grants revoked!');

    // Verify
    const res = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    console.log('\n--- VERIFICATION: RLS STATUS AFTER FIX ---');
    console.table(res.rows);

    const privRes = await client.query(`
      SELECT grantee, table_name, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
      ORDER BY table_name, grantee;
    `);
    if (privRes.rows.length === 0) {
      console.log('\nSUCCESS: No anon/authenticated grants remain on any table.');
    } else {
      console.log('\nWARNING: Some grants still remain:');
      console.table(privRes.rows);
    }

    const policyRes = await client.query(`
      SELECT tablename, policyname, roles, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    console.log('\n--- RLS POLICIES CREATED ---');
    console.table(policyRes.rows);

  } catch (err) {
    console.error('ERROR applying RLS:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyRLS();
