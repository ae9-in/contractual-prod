const mysql = require('mysql2/promise');
const env = require('./env');

const poolConfig = { ...env.db };

// Cloud MySQL providers (Aiven, PlanetScale, Railway) require SSL
if (env.nodeEnv === 'production' || (env.db.host && env.db.host !== 'localhost')) {
    poolConfig.ssl = { rejectUnauthorized: false };
}

let pool;
try {
  pool = mysql.createPool(poolConfig);
  console.log(`[DB] Using MySQL at ${env.db.host}:${env.db.port}`);

  // Test connection at start as a senior developer
  pool.query('SELECT 1').catch((err) => {
    console.warn(`[DB] MySQL connection check failed: ${err.message}`);
    console.warn('[DB] Ensure your MySQL server is running and database exists.');
  });
} catch (error) {
  console.error('[DB] Critical error creating MySQL pool:', error.message);
}

/**
 * If the connection actually fails in the services, we can provide a final fallback.
 * For now, we'll wrap the pool.query to detect ECONNREFUSED and switch to mock.
 */
const mockDb = require('../utils/mockDb');
let useMock = false;

const wrappedPool = {
  async query(sql, params) {
    if (useMock) return mockDb.query(sql, params);
    try {
      return await pool.query(sql, params);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ER_BAD_DB_ERROR' || err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.warn(`[DB] MySQL UNREACHABLE (${err.code}). Switching to IN-MEMORY MOCK DB...`);
        useMock = true;
        return mockDb.query(sql, params);
      }
      throw err;
    }
  },
  async execute(sql, params) {
    return this.query(sql, params);
  },
  async getConnection() {
    if (useMock) return mockDb;
    try {
      return await pool.getConnection();
    } catch (err) {
      console.warn(`[DB] Failed to get real connection (${err.code}). Fallback to mock.`);
      useMock = true;
      return mockDb;
    }
  },
  async end() {
    if (pool) await pool.end();
  }
};

module.exports = wrappedPool;
