const { z } = require('zod');
const projectModel = require('../models/projectModel');
const projectApplicationModel = require('../models/projectApplicationModel');
const paymentModel = require('../models/paymentModel');
const notificationService = require('./notificationService');
const ApiError = require('../utils/ApiError');
const { persistUploadedFiles } = require('./fileStorageService');
const { stripStoredHtml } = require('../utils/sanitizeText');
const { sameUserId } = require('../utils/sameUserId');

const optionalUrlSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.string().url().or(z.literal('')).optional(),
);

const createProjectSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().min(5),
  budget: z.preprocess((value) => {
    if (typeof value === 'string') return value.replace(/[^0-9.-]/g, '');
    return value;
  }, z.coerce.number().positive()),
  skillsRequired: z.string().trim().min(1),
  deadline: z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date'),
  referenceLink: optionalUrlSchema.default(''),
});

const submitSchema = z.object({
  submissionText: z.string().trim().min(3),
  submissionLink: optionalUrlSchema.default(''),
});
const applySchema = z.object({
  coverLetter: z.string().trim().max(2000).optional().default(''),
});

async function createProject(data, businessId) {
  const payload = createProjectSchema.parse(data);
  payload.title = stripStoredHtml(payload.title);
  payload.description = stripStoredHtml(payload.description);
  payload.skillsRequired = stripStoredHtml(payload.skillsRequired);
  const projectReferenceFiles = await persistUploadedFiles(data.projectReferenceFiles || [], {
    folder: 'project-references',
    localRoutePrefix: '/uploads/project-references',
  });

  return projectModel.create({
    ...payload,
    businessId,
    referenceFiles: projectReferenceFiles,
  });
}

async function listProjects(filters) {
  return projectModel.list(filters);
}

async function getProjectById(projectId, viewer = {}) {
  const project = await projectModel.findById(projectId, viewer);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
}

async function listBusinessProjects(businessId, options = {}) {
  return projectModel.listByBusiness(businessId, options);
}

async function applyForProject(projectId, freelancerId, data) {
  const project = await projectModel.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  if (project.status !== 'Open') {
    throw new ApiError(400, 'Only Open projects can be applied');
  }
  if (sameUserId(project.businessId, freelancerId)) {
    throw new ApiError(400, 'Project owner cannot apply');
  }

  const existing = await projectApplicationModel.findByProjectAndFreelancer(projectId, freelancerId);
  if (existing) {
    throw new ApiError(409, 'You already applied to this project');
  }

  const payload = applySchema.parse(data || {});
  payload.coverLetter = stripStoredHtml(payload.coverLetter);
  let application;
  try {
    application = await projectApplicationModel.create({
      projectId,
      freelancerId,
      coverLetter: payload.coverLetter,
    });
  } catch (error) {
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      throw new ApiError(409, 'You already applied to this project');
    }
    throw error;
  }

  await notificationService.createNotification({
    userId: project.businessId,
    projectId: project.id,
    type: 'project_application',
    title: 'New Application',
    messageText: `A freelancer applied for "${project.title}".`,
  });

  return application;
}

async function listProjectApplications(projectId, businessId, options = {}) {
  const project = await projectModel.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  if (!sameUserId(project.businessId, businessId)) {
    throw new ApiError(403, 'Only project owner can view applications');
  }

  return projectApplicationModel.listByProjectWithFreelancerProfile(projectId, options);
}

async function acceptProjectApplication(projectId, applicationId, businessId) {
  const project = await projectModel.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  try {
    const result = await projectApplicationModel.acceptApplicationTx(projectId, applicationId, businessId);
    const updated = await projectModel.findById(projectId);

    await notificationService.createNotification({
      userId: result.acceptedFreelancerId,
      projectId: updated.id,
      type: 'application_accepted',
      title: 'Application Accepted',
      messageText: `Your application for "${updated.title}" was accepted.`,
    });

    for (const rejectedFreelancerId of result.rejectedFreelancerIds) {
      await notificationService.createNotification({
        userId: rejectedFreelancerId,
        projectId: updated.id,
        type: 'application_rejected',
        title: 'Application Update',
        messageText: `Your application for "${updated.title}" was not selected.`,
      });
    }

    return updated;
  } catch (error) {
    if (error.message === 'FORBIDDEN') throw new ApiError(403, 'Only project owner can accept an application');
    if (error.message === 'PROJECT_NOT_OPEN') throw new ApiError(400, 'Only Open projects can accept applications');
    if (error.message === 'APPLICATION_NOT_FOUND') throw new ApiError(404, 'Application not found');
    if (error.message === 'APPLICATION_NOT_PENDING') throw new ApiError(400, 'Application is not pending');
    throw error;
  }
}

async function submitProject(projectId, freelancerId, data) {
  const parsed = submitSchema.parse(data);
  const submissionText = stripStoredHtml(parsed.submissionText);
  const submissionLink = parsed.submissionLink;
  const project = await projectModel.findById(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  if (project.status !== 'Assigned') {
    throw new ApiError(400, 'Only Assigned projects can be submitted');
  }
  if (!sameUserId(project.freelancerId, freelancerId)) {
    throw new ApiError(403, 'Only assigned freelancer can submit work');
  }

  const submissionFiles = await persistUploadedFiles(data.submissionFiles || [], {
    folder: 'submissions',
    localRoutePrefix: '/uploads/submissions',
  });

  const updated = await projectModel.submitProject(projectId, submissionText, submissionLink, submissionFiles);

  await notificationService.createNotification({
    userId: updated.businessId,
    projectId: updated.id,
    type: 'work_submitted',
    title: 'Work Submitted',
    messageText: `${updated.freelancerName || 'Freelancer'} submitted work for "${updated.title}".`,
  });

  return updated;
}

async function completeProject(projectId, businessId) {
  const project = await projectModel.findById(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  if (!sameUserId(project.businessId, businessId)) {
    throw new ApiError(403, 'Only project owner can complete project');
  }
  if (project.status !== 'Submitted') {
    throw new ApiError(400, 'Only Submitted projects can be completed');
  }
  const payment = await paymentModel.getByProjectId(projectId);
  if (!payment || payment.status !== 'Released') {
    throw new ApiError(400, 'Release payment before marking project completed');
  }

  const updated = await projectModel.completeProject(projectId);

  if (updated.freelancerId) {
    await notificationService.createNotification({
      userId: updated.freelancerId,
      projectId: updated.id,
      type: 'project_completed',
      title: 'Project Completed',
      messageText: `Business marked "${updated.title}" as completed.`,
    });
  }

  return updated;
}

module.exports = {
  createProject,
  listProjects,
  getProjectById,
  listBusinessProjects,
  applyForProject,
  listProjectApplications,
  acceptProjectApplication,
  submitProject,
  completeProject,
};
