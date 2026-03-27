const dotenv = require('dotenv');

dotenv.config();

function readEnv(key, fallback = '') {
  const raw = process.env[key];
  if (raw == null) return fallback;
  return String(raw).trim();
}

function buildDatabaseUrl() {
  const direct = readEnv('DATABASE_URL');
  if (direct) return direct;
  const host = readEnv('DB_HOST');
  const port = readEnv('DB_PORT', '5432');
  const user = readEnv('DB_USER');
  const password = readEnv('DB_PASSWORD');
  const database = readEnv('DB_NAME');
  if (!host || !user || !database) return '';
  const passPart = password === '' ? '' : `:${encodeURIComponent(password)}`;
  return `postgresql://${encodeURIComponent(user)}${passPart}@${host}:${port}/${encodeURIComponent(database)}`;
}

function inferSsl(connectionString) {
  if (readEnv('DATABASE_SSL', '') === '0') return false;
  if (readEnv('DATABASE_SSL', '') === '1') return true;
  const s = connectionString.toLowerCase();
  if (s.includes('sslmode=require') || s.includes('sslmode=no-verify')) return true;
  if (readEnv('NODE_ENV', '') === 'production') return true;
  return false;
}

const databaseUrl = buildDatabaseUrl();

const env = {
  port: Number(readEnv('PORT', '5000') || 5000),
  nodeEnv: readEnv('NODE_ENV', 'development'),
  corsOrigins: readEnv('ALLOWED_ORIGINS', readEnv('CORS_ORIGIN', ''))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  databaseUrl,
  dbSsl: inferSsl(databaseUrl || 'postgresql://localhost:5432/postgres'),
  dbPoolSize: Number(readEnv('DB_POOL_SIZE', '20') || 20),
  dbPoolMin: Number(readEnv('DB_POOL_MIN', '2') || 2),
  dbIdleTimeoutMs: Number(readEnv('DB_IDLE_TIMEOUT_MS', '30000') || 30000),
  dbConnectionTimeoutMs: Number(readEnv('DB_CONNECTION_TIMEOUT_MS', '10000') || 10000),
  dbQueryTimeoutMs: Number(readEnv('DB_QUERY_TIMEOUT_MS', '6000') || 6000),
  allowDbMockFallback: readEnv('ALLOW_DB_MOCK_FALLBACK', '').toLowerCase() === 'true',
  jwtSecret: readEnv('JWT_SECRET'),
  jwtExpiresIn: readEnv('JWT_EXPIRES_IN', '7d'),
  paymentProvider: readEnv('PAYMENT_PROVIDER', 'razorpay').toLowerCase(),
  razorpay: {
    keyId: readEnv('RAZORPAY_KEY_ID'),
    keySecret: readEnv('RAZORPAY_KEY_SECRET'),
    webhookSecret: readEnv('RAZORPAY_WEBHOOK_SECRET'),
  },
  cloudinary: {
    cloudName: readEnv('CLOUDINARY_CLOUD_NAME'),
    apiKey: readEnv('CLOUDINARY_API_KEY'),
    apiSecret: readEnv('CLOUDINARY_API_SECRET'),
    folder: readEnv('CLOUDINARY_FOLDER', 'contractual'),
  },
  mail: {
    host: readEnv('SMTP_HOST'),
    port: Number(readEnv('SMTP_PORT', '587') || 587),
    user: readEnv('SMTP_USER'),
    pass: readEnv('SMTP_PASS'),
    from: readEnv('SMTP_FROM'),
  },
};

const required = ['JWT_SECRET'];
for (const key of required) {
  if (!readEnv(key)) {
    throw new Error(`Missing env variable: ${key}`);
  }
}

if (!env.databaseUrl) {
  throw new Error(
    'Missing database URL: set DATABASE_URL (Render/Vercel) or DB_HOST, DB_USER, DB_NAME (optional DB_PASSWORD, DB_PORT defaults to 5432)',
  );
}

const weakSecrets = new Set(['secret', 'jwt_secret', 'changeme', 'password', 'default']);
if (env.nodeEnv !== 'test' && (env.jwtSecret.length < 32 || weakSecrets.has(env.jwtSecret.toLowerCase()))) {
  throw new Error('JWT_SECRET is too weak. Use at least 32 chars and avoid common defaults.');
}

const dbUrlLower = env.databaseUrl.toLowerCase();
if (dbUrlLower.startsWith('mysql:') || dbUrlLower.startsWith('mysql2:')) {
  throw new Error(
    'DATABASE_URL must be PostgreSQL (postgresql://...). This backend no longer uses MySQL; update your .env / Render env.',
  );
}

module.exports = env;
