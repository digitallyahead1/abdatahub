const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkRoles() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const res = await client.query(`
    SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolreplication, rolbypassrls
    FROM pg_roles
    WHERE rolname IN ('postgres', 'anon', 'authenticated', 'service_role');
  `);
  console.log('--- ROLES PERMISSIONS ---');
  console.table(res.rows);

  // Check current user of backend connection
  const curRes = await client.query(`SELECT current_user, session_user;`);
  console.log('--- CURRENT USER FOR BACKEND ---');
  console.table(curRes.rows);

  await client.end();
}

checkRoles().catch(err => {
  console.error(err);
  process.exit(1);
});
