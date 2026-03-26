const asyncHandler = require('../utils/asyncHandler');
const messageService = require('../services/messageService');

exports.getProjectMessages = asyncHandler(async (req, res) => {
  const projectId = Number(req.params.projectId);
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const messages = await messageService.listProjectMessages(projectId, req.user.id, { limit });
  res.json({ messages });
});

exports.sendProjectMessage = asyncHandler(async (req, res) => {
  const projectId = Number(req.params.projectId);
  const message = await messageService.sendProjectMessage(projectId, req.user.id, req.body);
  res.status(201).json({ message });
});
