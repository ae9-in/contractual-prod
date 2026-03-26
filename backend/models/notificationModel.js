const pool = require('../config/db');

async function create({ userId, projectId = null, type, title, messageText }) {
  const [result] = await pool.execute(
    'INSERT INTO notifications (user_id, project_id, type, title, message_text) VALUES (?, ?, ?, ?, ?)',
    [userId, projectId, type, title, messageText],
  );
  const [rows] = await pool.execute(
    `SELECT id, user_id AS userId, project_id AS projectId, type, title,
      message_text AS messageText, is_read AS isRead, created_at AS createdAt
     FROM notifications
     WHERE id = ? LIMIT 1`,
    [result.insertId],
  );
  return rows[0] || null;
}

async function listByUser(userId, { limit = 100, offset = 0 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 200));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const [rows] = await pool.execute(
    `SELECT id, user_id AS userId, project_id AS projectId, type, title,
      message_text AS messageText, is_read AS isRead, created_at AS createdAt
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [userId, safeLimit, safeOffset],
  );
  return rows;
}

async function countUnreadByUser(userId) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId],
  );
  return Number(rows[0]?.unreadCount || 0);
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id, user_id AS userId, project_id AS projectId, type, title,
      message_text AS messageText, is_read AS isRead, created_at AS createdAt
     FROM notifications
     WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function markRead(id) {
  await pool.execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  return findById(id);
}

async function markAllRead(userId) {
  await pool.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
}

async function countUnreadProjectMessagesByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT project_id AS projectId, COUNT(*) AS unreadCount
     FROM notifications
     WHERE user_id = ? AND is_read = 0 AND type = 'new_message' AND project_id IS NOT NULL
     GROUP BY project_id`,
    [userId],
  );
  return rows.map((row) => ({
    projectId: Number(row.projectId),
    unreadCount: Number(row.unreadCount),
  }));
}

module.exports = {
  create,
  listByUser,
  countUnreadByUser,
  findById,
  markRead,
  markAllRead,
  countUnreadProjectMessagesByUser,
};
