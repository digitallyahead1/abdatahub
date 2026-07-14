// Load environment variables from .env file
require('dotenv').config();

const { DataSource } = require('typeorm');
const { DatabaseConfig } = require('../dist/config/database.config');

async function sync() {
  console.log('=== Production Database Schema Sync ===');
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
  console.log('DIRECT_URL set:', !!process.env.DIRECT_URL);
  
  // Use DIRECT_URL for schema sync (session-mode, supports DDL)
  // Fall back to DATABASE_URL if DIRECT_URL is not set
  const syncUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  let connectionOptions = { ...DatabaseConfig };
  
  if (syncUrl) {
    try {
      const url = new URL(syncUrl);
      console.log('Connecting to:', url.hostname + ':' + url.port + url.pathname);
      connectionOptions = {
        ...connectionOptions,
        host: url.hostname,
        port: parseInt(url.port || '5432', 10),
        username: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace('/', ''),
        ssl: { rejectUnauthorized: false },
      };
    } catch (e) {
      console.warn('Failed to parse URL, using DatabaseConfig defaults:', e.message);
    }
  } else {
    console.log('No DATABASE_URL or DIRECT_URL found, using config defaults');
    console.log('Connecting to:', connectionOptions.host + ':' + connectionOptions.port + '/' + connectionOptions.database);
  }

  // Force synchronize to create all tables
  connectionOptions.synchronize = true;
  // Enable logging to see what SQL is executed
  connectionOptions.logging = true;

  const dataSource = new DataSource(connectionOptions);
  
  try {
    await dataSource.initialize();
    console.log('Database connection established.');
    
    // Explicitly synchronize
    await dataSource.synchronize();
    console.log('Schema synchronization complete.');
    
    // Verify tables were created
    const tables = await dataSource.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    console.log('Tables in database:', tables.map(t => t.tablename));
    
    if (tables.length === 0) {
      console.error('FATAL: No tables were created! Schema sync may have failed silently.');
      process.exit(1);
    }
    
    console.log(`SUCCESS: ${tables.length} tables created/verified.`);
  } catch (error) {
    console.error('FATAL: Database schema synchronization failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

sync();
