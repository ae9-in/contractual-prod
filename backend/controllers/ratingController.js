const asyncHandler = require('../utils/asyncHandler');
const ratingService = require('../services/ratingService');
const { validateId } = require('../utils/validators');

exports.getProjectRatings = asyncHandler(async (req, res) => {
  const projectId = validateId(req.params.projectId);
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 50));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const ratings = await ratingService.listProjectRatings(projectId, req.user.id, { limit, offset });
  res.json({ ratings });
});

exports.submitProjectRating = asyncHandler(async (req, res) => {
  const projectId = validateId(req.params.projectId);
  const rating = await ratingService.submitProjectRating(projectId, req.user.id, req.body);
  res.status(201).json({ rating });
});

exports.getUserRatingSummary = asyncHandler(async (req, res) => {
  const userId = validateId(req.params.userId);
  const summary = await ratingService.getUserRatingSummary(req.user.id, userId);
  res.json({ summary });
});
