process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_NAME = process.env.DB_NAME || 'contractual_test';
if (process.env.DB_PASSWORD === undefined) process.env.DB_PASSWORD = '';

const existingUrl = String(process.env.DATABASE_URL || '');
if (!existingUrl || existingUrl.toLowerCase().startsWith('mysql')) {
  const u = encodeURIComponent(process.env.DB_USER);
  const d = encodeURIComponent(process.env.DB_NAME);
  const pw = process.env.DB_PASSWORD;
  const auth = pw !== '' && pw != null ? `${u}:${encodeURIComponent(pw)}` : u;
  process.env.DATABASE_URL = `postgresql://${auth}@${process.env.DB_HOST}:${process.env.DB_PORT}/${d}`;
}
