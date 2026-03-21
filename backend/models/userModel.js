const pool = require('../config/db');

async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone AS contactPhone, password_hash AS passwordHash, role, created_at AS createdAt FROM users WHERE email = ? LIMIT 1',
    [email],
  );
  return rows[0] || null;
}

async function findByPhone(phone) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone AS contactPhone, role, created_at AS createdAt FROM users WHERE phone = ? LIMIT 1',
    [phone],
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone AS contactPhone, role, created_at AS createdAt FROM users WHERE id = ? LIMIT 1',
    [id],
  );
  return rows[0] || null;
}

async function create({ name, email, contactPhone, passwordHash, role }) {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, contactPhone, passwordHash, role],
  );
  return findById(result.insertId);
}

async function updatePasswordByEmailAndPhone(email, phone, passwordHash) {
  const [result] = await pool.execute(
    'UPDATE users SET password_hash = ? WHERE email = ? AND phone = ?',
    [passwordHash, email, phone],
  );
  return Number(result.affectedRows || 0) > 0;
}

module.exports = {
  findByEmail,
  findByPhone,
  findById,
  create,
  updatePasswordByEmailAndPhone,
};
