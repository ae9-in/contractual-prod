const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');

exports.getMyNotifications = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  const result = await notificationService.getMyNotifications(req.user.id, { limit, offset });
  res.json(result);
});

exports.getUnreadByProject = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadMessageCountsByProject(req.user.id);
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
