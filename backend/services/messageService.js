const { z } = require('zod');
const messageModel = require('../models/messageModel');
const projectModel = require('../models/projectModel');
const notificationService = require('./notificationService');
const { emitToProject, emitToUser } = require('./realtimeService');
const ApiError = require('../utils/ApiError');
const { stripStoredHtml } = require('../utils/sanitizeText');
const { sameUserId } = require('../utils/sameUserId');

const messageSchema = z.object({
  messageText: z.string().trim().min(1).max(2000),
});

function assertMessagingAccess(project, userId) {
  const isBusiness = sameUserId(project.businessId, userId);
  const isAssignedFreelancer = sameUserId(project.freelancerId, userId);

  if (!project.freelancerId) {
    throw new ApiError(400, 'Messaging is available only after project assignment');
  }
  if (!isBusiness && !isAssignedFreelancer) {
    throw new ApiError(403, 'Only project participants can access messages');
  }
}

async function listProjectMessages(projectId, userId, options = {}) {
  const project = await projectModel.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  assertMessagingAccess(project, userId);
  return messageModel.listByProject(projectId, options);
}

async function sendProjectMessage(projectId, userId, data) {
  const project = await projectModel.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  assertMessagingAccess(project, userId);
  const payload = messageSchema.parse(data);
  const messageText = stripStoredHtml(payload.messageText);
  const message = await messageModel.create({ projectId, senderId: userId, messageText });

  emitToProject(projectId, 'messages:new', { projectId, message });

  const recipientUserId = sameUserId(project.businessId, userId) ? project.freelancerId : project.businessId;
  if (recipientUserId) {
    const notification = await notificationService.createNotification({
      userId: recipientUserId,
      projectId: project.id,
      type: 'new_message',
      title: 'New Message',
      messageText: `${message.senderName} sent a message on "${project.title}".`,
    });

    emitToUser(recipientUserId, 'messages:inbox', {
      projectId: project.id,
      notification,
      message,
    });
  }

  return message;
}

module.exports = {
  listProjectMessages,
  sendProjectMessage,
};
