/**
 * Run schema.sql against a target MySQL database.
 *
 * Usage:
 *   DB_HOST=... DB_PORT=... DB_USER=... DB_PASSWORD=... DB_NAME=... node scripts/run-schema.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function requireEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const config = {
    host: requireEnv('DB_HOST'),
    port: Number(process.env.DB_PORT || 3306),
    user: requireEnv('DB_USER'),
    password: requireEnv('DB_PASSWORD'),
    database: requireEnv('DB_NAME'),
    ssl: { rejectUnauthorized: false },
    multipleStatements: true,
  };

  console.log(`Connecting to ${config.host}:${config.port} as ${config.user}...`);

  const connection = await mysql.createConnection(config);
  console.log('Connected.');

  const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  const rawSQL = fs.readFileSync(schemaPath, 'utf8');

  // Remove CREATE DATABASE/USE to avoid switching away from configured DB_NAME.
  const lines = rawSQL.split('\n');
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim().toUpperCase();
    if (trimmed.startsWith('CREATE DATABASE')) return false;
    if (trimmed.startsWith('USE ')) return false;
    return true;
  });
  const sql = filteredLines.join('\n');

  console.log('Running schema.sql...');
  await connection.query(sql);
  console.log('All tables created successfully.');

  const [tables] = await connection.query('SHOW TABLES');
  console.log('\nTables in database:');
  tables.forEach((row, i) => {
    const tableName = Object.values(row)[0];
    console.log(`  ${i + 1}. ${tableName}`);
  });

  await connection.end();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
