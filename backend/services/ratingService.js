const { z } = require('zod');
const ratingModel = require('../models/ratingModel');
const projectModel = require('../models/projectModel');
const ApiError = require('../utils/ApiError');
const { stripStoredHtml } = require('../utils/sanitizeText');
const { sameUserId } = require('../utils/sameUserId');

const ratingSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  reviewText: z.string().trim().max(2000).optional().default(''),
});

function assertParticipant(project, userId) {
  const isBusiness = sameUserId(project.businessId, userId);
  const isFreelancer = sameUserId(project.freelancerId, userId);
  if (!isBusiness && !isFreelancer) {
    throw new ApiError(403, 'Only project participants can access ratings');
  }
}

async function listProjectRatings(projectId, userId, options = {}) {
  const project = await projectModel.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  assertParticipant(project, userId);
  return ratingModel.listByProject(projectId, options);
}

async function submitProjectRating(projectId, userId, data) {
  const project = await projectModel.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  assertParticipant(project, userId);
  if (!sameUserId(project.businessId, userId)) {
    throw new ApiError(403, 'Only the project business can submit a rating');
  }

  if (project.status !== 'Completed') {
    throw new ApiError(400, 'Rating is allowed only after project completion');
  }

  const payload = ratingSchema.parse(data);
  const reviewText = stripStoredHtml(payload.reviewText);

  const existing = await ratingModel.findByProjectAndRater(projectId, userId);
  if (existing) {
    throw new ApiError(409, 'You have already submitted a rating for this project');
  }

  const ratedUserId = project.freelancerId;

  if (!ratedUserId) {
    throw new ApiError(400, 'Unable to determine rating target');
  }

  return ratingModel.create({
    projectId,
    raterId: userId,
    ratedUserId,
    rating: payload.rating,
    reviewText,
  });
}

async function getUserRatingSummary(requesterId, targetUserId) {
  if (!requesterId) {
    throw new ApiError(401, 'Unauthorized');
  }
  return ratingModel.getSummaryByUser(targetUserId);
}

module.exports = {
  listProjectRatings,
  submitProjectRating,
  getUserRatingSummary,
};
