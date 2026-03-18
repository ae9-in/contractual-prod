const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const migrationsDir = path.join(__dirname, '..', 'sql', 'migrations');

function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      current += char;
      if (char === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === '*' && next === '/') {
        current += next;
        i += 1;
        inBlockComment = false;
      }
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick) {
      if (char === '-' && next === '-') {
        inLineComment = true;
        current += char;
        continue;
      }
      if (char === '#') {
        inLineComment = true;
        current += char;
        continue;
      }
      if (char === '/' && next === '*') {
        inBlockComment = true;
        current += char;
        continue;
      }
    }

    if (char === '\'' && !inDouble && !inBacktick) {
      const escaped = sql[i - 1] === '\\';
      if (!escaped) inSingle = !inSingle;
      current += char;
      continue;
    }

    if (char === '"' && !inSingle && !inBacktick) {
      const escaped = sql[i - 1] === '\\';
      if (!escaped) inDouble = !inDouble;
      current += char;
      continue;
    }

    if (char === '`' && !inSingle && !inDouble) {
      inBacktick = !inBacktick;
      current += char;
      continue;
    }

    if (char === ';' && !inSingle && !inDouble && !inBacktick) {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = '';
      continue;
    }

    current += char;
  }

  const trailing = current.trim();
  if (trailing) statements.push(trailing);
  return statements;
}

async function run() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB`,
    );

    const [appliedRows] = await connection.query('SELECT filename FROM schema_migrations');
    const appliedSet = new Set(appliedRows.map((row) => row.filename));

    const files = fs
      .readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (appliedSet.has(file)) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const statements = splitStatements(sql);
      for (const statement of statements) {
        await connection.query(statement);
      }

      await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
      console.log(`applied: ${file}`);
    }

    await connection.commit();
    console.log('migration complete');
  } catch (error) {
    await connection.rollback();
    console.error('migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

run();
