const notificationModel = require('../models/notificationModel');
const ApiError = require('../utils/ApiError');
const { emitToUser } = require('./realtimeService');
const { sameUserId } = require('../utils/sameUserId');

async function emitUnreadCount(userId) {
  const unreadCount = await notificationModel.countUnreadByUser(userId);
  emitToUser(userId, 'notifications:count', { unreadCount });
  return unreadCount;
}

async function createNotification(payload) {
  const notification = await notificationModel.create(payload);
  const unreadCount = await emitUnreadCount(payload.userId);
  emitToUser(payload.userId, 'notifications:new', { notification, unreadCount });
  return notification;
}

async function getMyNotifications(userId, options = {}) {
  const notifications = await notificationModel.listByUser(userId, options);
  const unreadCount = await notificationModel.countUnreadByUser(userId);
  return { notifications, unreadCount };
}

async function getUnreadMessageCountsByProject(userId) {
  const rows = await notificationModel.countUnreadProjectMessagesByUser(userId);
  const map = {};
  rows.forEach((row) => {
    map[row.projectId] = row.unreadCount;
  });
  return { unreadByProject: map };
}

async function markNotificationRead(notificationId, userId) {
  const notification = await notificationModel.findById(notificationId);
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }
  if (!sameUserId(notification.userId, userId)) {
    throw new ApiError(403, 'Forbidden');
  }
  const updated = await notificationModel.markRead(notificationId);
  await emitUnreadCount(userId);
  return updated;
}

async function markAllNotificationsRead(userId) {
  await notificationModel.markAllRead(userId);
  await emitUnreadCount(userId);
}

module.exports = {
  createNotification,
  getMyNotifications,
  getUnreadMessageCountsByProject,
  markNotificationRead,
  markAllNotificationsRead,
};
