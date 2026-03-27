const { mapFileRefs } = require('./publicFileUrl');

function normalizeBudgetValue(project) {
  const candidates = [project?.budget, project?.amount, project?.projectBudget];
  for (const candidate of candidates) {
    if (candidate == null || candidate === '') continue;
    const normalized = typeof candidate === 'string'
      ? candidate.replace(/[^0-9.-]/g, '')
      : candidate;
    const numeric = Number(normalized);
    if (!Number.isNaN(numeric)) return numeric;
  }
  return 0;
}

/**
 * List + public Open project detail: hide PII and submission internals for non-participants.
 */
function sanitizeProjectForClient(project, { isOwner }) {
  if (!project) return null;
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    budget: normalizeBudgetValue(project),
    skillsRequired: project.skillsRequired,
    deadline: project.deadline,
    status: project.status,
    businessId: project.businessId,
    freelancerId: project.freelancerId,
    businessName: project.businessName,
    freelancerName: project.freelancerName,
    referenceLink: project.referenceLink,
    referenceFiles: isOwner ? mapFileRefs(project.referenceFiles) : [],
    submissionText: isOwner ? project.submissionText : null,
    submissionLink: isOwner ? project.submissionLink : null,
    submissionFiles: isOwner ? mapFileRefs(project.submissionFiles) : [],
    createdAt: project.createdAt,
    hasApplied: project.hasApplied,
    applicationStatus: project.applicationStatus,
    freelancerContactEmail: isOwner ? project.freelancerContactEmail : null,
    freelancerContactPhone: isOwner ? project.freelancerContactPhone : null,
  };
}

module.exports = {
  sanitizeProjectForClient,
};
