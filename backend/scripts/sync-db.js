const { DataSource } = require('typeorm');
const { DatabaseConfig } = require('../dist/config/database.config');

async function sync() {
  console.log('Starting production database schema sync...');
  
  // Use DIRECT_URL for schema sync if available to bypass PgBouncer pooler limits
  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  let connectionOptions = { ...DatabaseConfig };
  
  if (directUrl) {
    console.log('Using connection URL for schema synchronization...');
    try {
      const url = new URL(directUrl);
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
      console.warn('Failed to parse direct/database URL, falling back to database config:', e.message);
    }
  }

  // Force synchronize to true for schema generation
  connectionOptions.synchronize = true;

  const dataSource = new DataSource(connectionOptions);
  
  try {
    await dataSource.initialize();
    console.log('Database connection established successfully.');
    console.log('Synchronizing schema...');
    await dataSource.synchronize();
    console.log('Database schema synchronized successfully!');
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
