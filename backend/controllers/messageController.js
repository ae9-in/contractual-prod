const asyncHandler = require('../utils/asyncHandler');
const messageService = require('../services/messageService');
const { validateId } = require('../utils/validators');

exports.getProjectMessages = asyncHandler(async (req, res) => {
  const projectId = validateId(req.params.projectId);
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 100, 200));
  const beforeCreatedAt = String(req.query.beforeCreatedAt || '').trim();
  const beforeId = Number(req.query.beforeId);
  const before = beforeCreatedAt && Number.isFinite(beforeId)
    ? { createdAtIso: beforeCreatedAt, id: beforeId }
    : null;
  const messages = await messageService.listProjectMessages(projectId, req.user.id, { limit, before });
  const first = messages[0] || null;
  res.set('Cache-Control', 'private, max-age=3');
  res.json({
    messages,
    nextCursor: first ? { beforeCreatedAt: first.createdAt, beforeId: first.id } : null,
  });
});

exports.sendProjectMessage = asyncHandler(async (req, res) => {
  const projectId = validateId(req.params.projectId);
  const message = await messageService.sendProjectMessage(projectId, req.user.id, req.body);
  res.status(201).json({ message });
});
