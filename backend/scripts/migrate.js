const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const env = require('../config/env');

const migrationsDir = path.join(__dirname, '..', 'sql', 'migrations');

/**
 * Migrations must use real PostgreSQL only — never the app pool’s mock fallback.
 */
function pgClientConfig() {
  return {
    connectionString: env.databaseUrl,
    ssl: env.dbSsl ? { rejectUnauthorized: false } : undefined,
  };
}

async function run() {
  const client = new Client(pgClientConfig());
  try {
    await client.connect();
  } catch (err) {
    console.error('migration failed: could not connect to PostgreSQL:', err.message);
    console.error('[hint] On Render use the Internal DATABASE_URL for this shell; ensure ssl is allowed (DATABASE_SSL=1 if needed).');
    process.exitCode = 1;
    return;
  }

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id BIGSERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows: appliedRows } = await client.query('SELECT filename FROM schema_migrations');
    const appliedSet = new Set(appliedRows.map((row) => row.filename));

    const files = fs
      .readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (appliedSet.has(file)) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      console.log(`applied: ${file}`);
    }

    await client.query('COMMIT');
    console.log('migration complete');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      /* ignore */
    }
    console.error('migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
