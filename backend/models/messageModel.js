const pool = require('../config/db');

async function listByProject(projectId, { limit = 100 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 200));
  const [rows] = await pool.execute(
    `SELECT m.id, m.project_id AS projectId, m.sender_id AS senderId, m.message_text AS messageText,
      m.created_at AS createdAt, u.name AS senderName, u.role AS senderRole
     FROM messages m
     INNER JOIN users u ON u.id = m.sender_id
     WHERE m.project_id = ?
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT ?`,
    [projectId, safeLimit],
  );
  return rows.reverse();
}

async function create({ projectId, senderId, messageText }) {
  const [result] = await pool.execute(
    'INSERT INTO messages (project_id, sender_id, message_text) VALUES (?, ?, ?) RETURNING id',
    [projectId, senderId, messageText],
  );
  const [rows] = await pool.execute(
    `SELECT m.id, m.project_id AS projectId, m.sender_id AS senderId, m.message_text AS messageText,
      m.created_at AS createdAt, u.name AS senderName, u.role AS senderRole
     FROM messages m
     INNER JOIN users u ON u.id = m.sender_id
     WHERE m.id = ? LIMIT 1`,
    [result.insertId],
  );
  return rows[0] || null;
}

module.exports = {
  listByProject,
  create,
};
