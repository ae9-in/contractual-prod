const { Pool } = require('pg');
const env = require('./env');
const { mysqlPlaceholdersToPg, shapeMysqlStyleResult } = require('../utils/pgQuery');

const poolConfig = {
  connectionString: env.databaseUrl,
  max: env.dbPoolSize,
};

if (env.dbSsl) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

let pool;
try {
  pool = new Pool(poolConfig);
  const redacted = env.databaseUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`[DB] Using PostgreSQL (${redacted})`);

  pool.query('SELECT 1').catch((err) => {
    console.warn(`[DB] PostgreSQL connection check failed: ${err.message}`);
    console.warn('[DB] Ensure the server is running, DATABASE_URL is correct, and migrations are applied.');
  });
} catch (error) {
  console.error('[DB] Critical error creating PostgreSQL pool:', error.message);
}

const mockDb = require('../utils/mockDb');
let useMock = false;

function isUnreachableError(err) {
  const code = err && err.code;
  return (
    code === 'ECONNREFUSED'
    || code === 'ENOTFOUND'
    || code === '28P01'
    || code === '3D000'
    || code === 'ETIMEDOUT'
  );
}

async function runQuery(client, sql, params) {
  const { text, values } = mysqlPlaceholdersToPg(sql, params);
  const result = await client.query(text, values);
  return shapeMysqlStyleResult(result);
}

const wrappedPool = {
  async query(sql, params = []) {
    if (useMock) return mockDb.query(sql, params);
    try {
      return await runQuery(pool, sql, params);
    } catch (err) {
      if (isUnreachableError(err)) {
        console.warn(`[DB] PostgreSQL UNREACHABLE (${err.code}). Switching to IN-MEMORY MOCK DB...`);
        useMock = true;
        return mockDb.query(sql, params);
      }
      throw err;
    }
  },
  async execute(sql, params) {
    return this.query(sql, params);
  },
  async connect() {
    if (useMock) return mockDb;
    try {
      const client = await pool.connect();
      return {
        async query(sql, params = []) {
          return runQuery(client, sql, params);
        },
        async execute(sql, params) {
          return runQuery(client, sql, params);
        },
        async beginTransaction() {
          await client.query('BEGIN');
        },
        async commit() {
          await client.query('COMMIT');
        },
        async rollback() {
          await client.query('ROLLBACK');
        },
        release: () => client.release(),
      };
    } catch (err) {
      if (isUnreachableError(err)) {
        console.warn(`[DB] Failed to connect (${err.code}). Fallback to mock.`);
        useMock = true;
        return mockDb;
      }
      throw err;
    }
  },
  async getConnection() {
    return this.connect();
  },
  async end() {
    if (pool) await pool.end();
  },
};

module.exports = wrappedPool;
