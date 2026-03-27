const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');

exports.getMyNotifications = asyncHandler(async (req, res) => {
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 100, 200));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const beforeCreatedAt = String(req.query.beforeCreatedAt || '').trim();
  const beforeId = Number(req.query.beforeId);
  const before = beforeCreatedAt && Number.isFinite(beforeId)
    ? { createdAtIso: beforeCreatedAt, id: beforeId }
    : null;
  const result = await notificationService.getMyNotifications(req.user.id, { limit, offset, before });
  const notifications = Array.isArray(result.notifications) ? result.notifications : [];
  const last = notifications[notifications.length - 1] || null;
  res.set('Cache-Control', 'private, max-age=5');
  res.json({
    ...result,
    nextCursor: last
      ? { beforeCreatedAt: last.createdAt, beforeId: last.id }
      : null,
  });
});

exports.getUnreadByProject = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadMessageCountsByProject(req.user.id);
  res.set('Cache-Control', 'private, max-age=5');
  res.json(result);
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationRead(Number(req.params.id), req.user.id);
  res.json({ notification });
});

exports.markAllNotificationsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllNotificationsRead(req.user.id);
  res.json({ success: true });
});
