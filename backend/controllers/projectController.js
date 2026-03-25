const asyncHandler = require('../utils/asyncHandler');
const projectService = require('../services/projectService');
const { sanitizeProjectForClient } = require('../utils/projectResponse');
const { sameUserId } = require('../utils/sameUserId');

function toProjectResponse(project, { isOwner }) {
  return sanitizeProjectForClient(project, { isOwner });
}

exports.createProject = asyncHandler(async (req, res) => {
  const payload = { ...req.body, projectReferenceFiles: req.files || [] };
  const project = await projectService.createProject(payload, req.user.id);
  res.status(201).json({ project: toProjectResponse(project, { isOwner: true }) });
});

exports.getProjects = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    minBudget: req.query.minBudget ? Number(req.query.minBudget) : undefined,
    maxBudget: req.query.maxBudget ? Number(req.query.maxBudget) : undefined,
    skill: req.query.skill,
    freelancerId: req.query.assignedToMe === 'true' ? req.user.id : undefined,
    viewerId: req.user.id,
    viewerRole: req.user.role,
  };

  const projects = await projectService.listProjects(filters);
  const sanitizedProjects = projects.map((project) => {
    const isOwner =
      sameUserId(project.freelancerId, req.user.id) ||
      sameUserId(project.businessId, req.user.id);
    return sanitizeProjectForClient(project, { isOwner });
  });
  res.json({ projects: sanitizedProjects });
});

exports.getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(Number(req.params.id), {
    viewerId: req.user.id,
    viewerRole: req.user.role,
  });

  if (
    !sameUserId(project.freelancerId, req.user.id) &&
    !sameUserId(project.businessId, req.user.id)
  ) {
    if (project.status !== 'Open') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.json({
      project: sanitizeProjectForClient(project, { isOwner: false }),
    });
  }

  return res.json({
    project: toProjectResponse(project, { isOwner: true }),
  });
});

exports.getMyProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.listBusinessProjects(req.user.id);
  const sanitizedProjects = projects.map((p) => sanitizeProjectForClient(p, { isOwner: true }));
  res.json({ projects: sanitizedProjects });
});

exports.applyForProject = asyncHandler(async (req, res) => {
  const application = await projectService.applyForProject(Number(req.params.id), req.user.id, req.body);
  res.status(201).json({ application });
});

exports.getProjectApplications = asyncHandler(async (req, res) => {
  const applications = await projectService.listProjectApplications(Number(req.params.id), req.user.id);
  res.json({ applications });
});

exports.acceptProjectApplication = asyncHandler(async (req, res) => {
  const project = await projectService.acceptProjectApplication(
    Number(req.params.id),
    Number(req.params.applicationId),
    req.user.id,
  );
  res.json({ project: toProjectResponse(project, { isOwner: true }) });
});

exports.submitProject = asyncHandler(async (req, res) => {
  const payload = { ...req.body, submissionFiles: req.files || [] };
  const project = await projectService.submitProject(Number(req.params.id), req.user.id, payload);
  res.json({ project: toProjectResponse(project, { isOwner: true }) });
});

exports.completeProject = asyncHandler(async (req, res) => {
  const project = await projectService.completeProject(Number(req.params.id), req.user.id);
  res.json({ project: toProjectResponse(project, { isOwner: true }) });
});
