const pool = require('../config/db');

async function clearActiveByUserId(userId) {
  await pool.execute(
    `DELETE FROM password_reset_tokens
     WHERE user_id = ? AND used_at IS NULL`,
    [userId],
  );
}

async function create({ userId, tokenPrefix, tokenHash, otpHash, expiresAt }) {
  const [result] = await pool.execute(
    `INSERT INTO password_reset_tokens
      (user_id, token_prefix, token_hash, otp_hash, expires_at, attempts)
     VALUES (?, ?, ?, ?, ?, 0)
     RETURNING id`,
    [userId, tokenPrefix, tokenHash, otpHash, expiresAt],
  );
  return Number(result.insertId);
}

async function listActiveByTokenPrefix(tokenPrefix, limit = 25) {
  const [rows] = await pool.execute(
    `SELECT id, user_id AS "userId", token_prefix AS "tokenPrefix", token_hash AS "tokenHash",
      otp_hash AS "otpHash", expires_at AS "expiresAt", used_at AS "usedAt", attempts, created_at AS "createdAt"
     FROM password_reset_tokens
     WHERE token_prefix = ?
       AND used_at IS NULL
       AND expires_at > NOW()
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    [tokenPrefix, Math.max(1, Math.min(Number(limit) || 25, 50))],
  );
  return rows;
}

async function incrementAttempts(id) {
  await pool.execute(
    'UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE id = ?',
    [id],
  );
}

async function markUsed(id) {
  await pool.execute(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?',
    [id],
  );
}

module.exports = {
  clearActiveByUserId,
  create,
  listActiveByTokenPrefix,
  incrementAttempts,
  markUsed,
};
