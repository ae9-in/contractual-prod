const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const migrationsDir = path.join(__dirname, '..', 'sql', 'migrations');

async function run() {
  const client = await pool.connect();
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
      await client.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
      console.log(`applied: ${file}`);
    }

    await client.query('COMMIT');
    console.log('migration complete');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
