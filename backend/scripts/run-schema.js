/**
 * Apply PostgreSQL migrations (same as npm run migrate), then list public tables.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/run-schema.js
 *   or set DB_HOST, DB_USER, DB_NAME (optional DB_PASSWORD, DB_PORT=5432)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { execSync } = require('child_process');
const path = require('path');
const { Pool } = require('pg');

function buildUrl() {
  const direct = String(process.env.DATABASE_URL || '').trim();
  if (direct) return direct;
  const host = String(process.env.DB_HOST || '').trim();
  const port = String(process.env.DB_PORT || '5432').trim();
  const user = String(process.env.DB_USER || '').trim();
  const password = String(process.env.DB_PASSWORD || '');
  const database = String(process.env.DB_NAME || '').trim();
  if (!host || !user || !database) {
    throw new Error('Set DATABASE_URL or DB_HOST, DB_USER, DB_NAME');
  }
  const passPart = password === '' ? '' : `:${encodeURIComponent(password)}`;
  return `postgresql://${encodeURIComponent(user)}${passPart}@${host}:${port}/${encodeURIComponent(database)}`;
}

async function main() {
  const connectionString = buildUrl();
  console.log('Applying migrations...');
  execSync(`node "${path.join(__dirname, 'migrate.js')}"`, {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: connectionString },
  });

  const useSsl = !connectionString.toLowerCase().includes('localhost');
  const pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
  const { rows } = await pool.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
  );
  console.log('\nTables in database:');
  rows.forEach((row, i) => {
    console.log(`  ${i + 1}. ${row.tablename}`);
  });
  await pool.end();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
