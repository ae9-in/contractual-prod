const asyncHandler = require('../utils/asyncHandler');
const projectService = require('../services/projectService');
const { sanitizeProjectForClient } = require('../utils/projectResponse');
const { sameUserId } = require('../utils/sameUserId');
const { cacheGet, cacheSet, clearByPrefix } = require('../utils/responseCache');
const { validateId } = require('../utils/validators');

function toProjectResponse(project, { isOwner }) {
  return sanitizeProjectForClient(project, { isOwner });
}

function parseOptionalNumber(value) {
  if (value == null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

exports.createProject = asyncHandler(async (req, res) => {
  const payload = { ...req.body, projectReferenceFiles: req.files || [] };
  const project = await projectService.createProject(payload, req.user.id);
  clearByPrefix('projects:list:');
  res.status(201).json({ project: toProjectResponse(project, { isOwner: true }) });
});

exports.getProjects = asyncHandler(async (req, res) => {
  const cached = cacheGet(req, 'projects:list');
  if (cached) {
    res.set('Cache-Control', 'private, max-age=5');
    return res.json(cached);
  }

  const filters = {
    status: req.query.status,
    minBudget: parseOptionalNumber(req.query.minBudget),
    maxBudget: parseOptionalNumber(req.query.maxBudget),
    skill: req.query.skill,
    freelancerId: req.query.assignedToMe === 'true' ? req.user.id : undefined,
    viewerId: req.user.id,
    viewerRole: req.user.role,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  };

  const projects = await projectService.listProjects(filters);
  const sanitizedProjects = projects.map((project) => {
    const isOwner =
      sameUserId(project.freelancerId, req.user.id) ||
      sameUserId(project.businessId, req.user.id);
    return sanitizeProjectForClient(project, { isOwner });
  });
  const response = { projects: sanitizedProjects };
  cacheSet(req, response, 5000, 'projects:list');
  res.set('Cache-Control', 'private, max-age=5');
  res.json(response);
});

exports.getProjectById = asyncHandler(async (req, res) => {
  const cached = cacheGet(req, 'projects:detail');
  if (cached) {
    res.set('Cache-Control', 'private, max-age=5');
    return res.json(cached);
  }

  const projectId = validateId(req.params.id);
  const project = await projectService.getProjectById(projectId, {
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
    res.set('Cache-Control', 'private, max-age=5');
    const response = {
      project: sanitizeProjectForClient(project, { isOwner: false }),
    };
    cacheSet(req, response, 5000, 'projects:detail');
    return res.json(response);
  }

  const response = {
    project: toProjectResponse(project, { isOwner: true }),
  };
  cacheSet(req, response, 5000, 'projects:detail');
  return res.json(response);
});

exports.getMyProjects = asyncHandler(async (req, res) => {
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 50));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const projects = await projectService.listBusinessProjects(req.user.id, { limit, offset });
  const sanitizedProjects = projects.map((p) => sanitizeProjectForClient(p, { isOwner: true }));
  res.json({ projects: sanitizedProjects });
});

exports.applyForProject = asyncHandler(async (req, res) => {
  const projectId = validateId(req.params.id);
  const application = await projectService.applyForProject(projectId, req.user.id, req.body);
  res.status(201).json({ application });
});

exports.getProjectApplications = asyncHandler(async (req, res) => {
  const projectId = validateId(req.params.id);
  const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 50));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const applications = await projectService.listProjectApplications(projectId, req.user.id, { limit, offset });
  res.json({ applications });
});

exports.acceptProjectApplication = asyncHandler(async (req, res) => {
  const projectId = validateId(req.params.id);
  const applicationId = validateId(req.params.applicationId);
  const project = await projectService.acceptProjectApplication(
    projectId,
    applicationId,
    req.user.id,
  );
  clearByPrefix('projects:list:');
  clearByPrefix('projects:detail:');
  res.json({ project: toProjectResponse(project, { isOwner: true }) });
});

exports.submitProject = asyncHandler(async (req, res) => {
  const payload = { ...req.body, submissionFiles: req.files || [] };
  const projectId = validateId(req.params.id);
  const project = await projectService.submitProject(projectId, req.user.id, payload);
  clearByPrefix('projects:list:');
  clearByPrefix('projects:detail:');
  res.json({ project: toProjectResponse(project, { isOwner: true }) });
});

exports.completeProject = asyncHandler(async (req, res) => {
  const projectId = validateId(req.params.id);
  const project = await projectService.completeProject(projectId, req.user.id);
  clearByPrefix('projects:list:');
  clearByPrefix('projects:detail:');
  res.json({ project: toProjectResponse(project, { isOwner: true }) });
});
