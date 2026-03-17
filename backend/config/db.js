const mysql = require('mysql2/promise');
const env = require('./env');

const poolConfig = { ...env.db };

// Cloud MySQL providers (Aiven, PlanetScale, Railway) require SSL
if (env.nodeEnv === 'production' || (env.db.host && env.db.host !== 'localhost')) {
    poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool;

