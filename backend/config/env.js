const dotenv = require('dotenv');

dotenv.config();

function readEnv(key, fallback = '') {
  const raw = process.env[key];
  if (raw == null) return fallback;
  return String(raw).trim();
}

const env = {
  port: Number(readEnv('PORT', '5000') || 5000),
  nodeEnv: readEnv('NODE_ENV', 'development'),
  corsOrigins: readEnv('CORS_ORIGIN', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  db: {
    host: readEnv('DB_HOST'),
    port: Number(readEnv('DB_PORT', '3306') || 3306),
    user: readEnv('DB_USER'),
    password: readEnv('DB_PASSWORD'),
    database: readEnv('DB_NAME'),
    waitForConnections: true,
    connectionLimit: 10,
  },
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
};

const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
for (const key of required) {
  if (!readEnv(key)) {
    throw new Error(`Missing env variable: ${key}`);
  }
}

module.exports = env;
