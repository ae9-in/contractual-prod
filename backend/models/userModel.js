const pool = require('../config/db');

async function findByEmail(email) {
  const rows = await findByEmailCandidates(email);
  return rows[0] || null;
}

async function findByEmailCandidates(email) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      name,
      email,
      phone AS "contactPhone",
      password_hash AS "passwordHash",
      role,
      created_at AS "createdAt"
     FROM users
     WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
     ORDER BY id DESC
     LIMIT 10`,
    [email],
  );
  return rows;
}

async function findByPhone(phone) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      name,
      email,
      phone AS "contactPhone",
      role,
      created_at AS "createdAt"
     FROM users
     WHERE TRIM(COALESCE(phone, '')) = TRIM(COALESCE(?, ''))
     ORDER BY id DESC
     LIMIT 1`,
    [phone],
  );
  return rows[0] || null;
}

async function findResetCandidatesByEmailAndPhone(email, phone) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      name,
      email,
      phone AS "contactPhone",
      password_hash AS "passwordHash",
      role,
      created_at AS "createdAt"
     FROM users
     WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
       AND TRIM(COALESCE(phone, '')) = TRIM(COALESCE(?, ''))
     ORDER BY id DESC
     LIMIT 20`,
    [email, phone],
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
      id,
      name,
      email,
      phone AS "contactPhone",
      role,
      created_at AS "createdAt"
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function create({ name, email, contactPhone, passwordHash, role }) {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?) RETURNING id',
    [name, email, contactPhone, passwordHash, role],
  );
  return findById(result.insertId);
}

async function updatePasswordByEmailAndPhone(email, phone, passwordHash) {
  const candidates = await findResetCandidatesByEmailAndPhone(email, phone);
  if (!candidates.length) {
    return { ok: false, affectedRows: 0, userIds: [] };
  }

  let affectedRows = 0;
  const userIds = [];
  // Update all matching migrated duplicates so login always sees updated hash.
  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const [result] = await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, candidate.id],
    );
    const affected = Number(result.affectedRows || 0);
    affectedRows += affected;
    if (affected > 0) userIds.push(candidate.id);
  }
  return { ok: affectedRows > 0, affectedRows, userIds };
}

async function updatePasswordByUserId(userId, passwordHash) {
  const [result] = await pool.execute(
    'UPDATE users SET password_hash = ? WHERE id = ?',
    [passwordHash, userId],
  );
  return Number(result.affectedRows || 0) > 0;
}

module.exports = {
  findByEmail,
  findByEmailCandidates,
  findByPhone,
  findResetCandidatesByEmailAndPhone,
  findById,
  create,
  updatePasswordByEmailAndPhone,
  updatePasswordByUserId,
};
