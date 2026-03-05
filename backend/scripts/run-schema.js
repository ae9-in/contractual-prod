/**
 * Run schema.sql against a remote MySQL database (Aiven).
 * 
 * Usage:
 *   node run-schema.js
 * 
 * It reads the Aiven credentials from env vars or uses hardcoded values below.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
    const config = {
        host: process.env.DB_HOST || 'mysql-14b60c23-theonewho-1cee.a.aivencloud.com',
        port: Number(process.env.DB_PORT || 20350),
        user: process.env.DB_USER || 'avnadmin',
        password: process.env.DB_PASSWORD || '',   // <-- YOU MUST SET THIS
        database: process.env.DB_NAME || 'defaultdb',
        ssl: { rejectUnauthorized: false },
        multipleStatements: true,
    };

    if (!config.password) {
        console.error('ERROR: Set your Aiven password!');
        console.error('Run like this:');
        console.error('  $env:DB_PASSWORD="YOUR_AIVEN_PASSWORD"; node scripts/run-schema.js');
        process.exit(1);
    }

    console.log(`Connecting to ${config.host}:${config.port} as ${config.user}...`);

    const connection = await mysql.createConnection(config);
    console.log('Connected! ✅');

    // Read schema.sql, but SKIP the first two lines (CREATE DATABASE / USE)
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const rawSQL = fs.readFileSync(schemaPath, 'utf8');

    // Remove "CREATE DATABASE..." and "USE ..." since Aiven uses 'defaultdb'
    const lines = rawSQL.split('\n');
    const filteredLines = lines.filter(line => {
        const trimmed = line.trim().toUpperCase();
        if (trimmed.startsWith('CREATE DATABASE')) return false;
        if (trimmed.startsWith('USE ')) return false;
        return true;
    });
    const sql = filteredLines.join('\n');

    console.log('Running schema.sql...');
    await connection.query(sql);
    console.log('All tables created successfully! ✅');

    // Verify tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\nTables in database:');
    tables.forEach((row, i) => {
        const tableName = Object.values(row)[0];
        console.log(`  ${i + 1}. ${tableName}`);
    });

    await connection.end();
    console.log('\nDone! Database is ready for deployment. 🚀');
}

main().catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
});
