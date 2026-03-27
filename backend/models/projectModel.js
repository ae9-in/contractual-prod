const pool = require('../config/db');

function parseFilesJson(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeProjectRow(row) {
  if (!row) return null;
  return {
    ...row,
    hasApplied: Boolean(row.hasApplied),
    referenceFiles: parseFilesJson(row.referenceFiles),
    submissionFiles: parseSubmissionFiles(row.submissionFiles),
  };
}

function parseSubmissionFiles(value) {
  return parseFilesJson(value);
}

async function create({
  businessId,
  title,
  description,
  budget,
  skillsRequired,
  deadline,
  referenceLink,
  referenceFiles = [],
}) {
  const [result] = await pool.execute(
    `INSERT INTO projects
      (business_id, title, description, budget, skills_required, deadline, reference_link, reference_files)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?::jsonb)
     RETURNING id`,
    [
      businessId,
      title,
      description,
      budget,
      skillsRequired,
      deadline,
      referenceLink || null,
      JSON.stringify(referenceFiles),
    ],
  );
  await pool.execute(
    `INSERT INTO project_payments (project_id, amount, status)
     VALUES (?, ?, 'Unfunded')
     ON CONFLICT (project_id) DO UPDATE SET amount = EXCLUDED.amount`,
    [result.insertId, budget],
  );
  return findById(result.insertId);
}

async function findById(id, options = {}) {
  const { viewerId = null, viewerRole = null } = options;
  const includeApplicantFields = viewerRole === 'freelancer' && viewerId != null;
  const applicantSelect = includeApplicantFields
    ? `,
      CASE WHEN vpa.id IS NULL THEN 0 ELSE 1 END AS hasApplied,
      vpa.status AS applicationStatus`
    : ', 0 AS hasApplied, NULL AS applicationStatus';
  const [rows] = await pool.execute(
    `SELECT p.id, p.business_id AS "businessId", p.title, p.description,
      COALESCE(p.budget, pp.amount, 0) AS budget,
      p.skills_required AS "skillsRequired", p.deadline, p.status, p.freelancer_id AS "freelancerId",
      p.reference_link AS "referenceLink", p.reference_files AS "referenceFiles",
      p.submission_text AS "submissionText", p.submission_link AS "submissionLink",
      p.submission_files AS "submissionFiles", p.created_at AS "createdAt", u.name AS "businessName",
      fu.name AS "freelancerName",
      COALESCE(NULLIF(TRIM(fp.contact_email), ''), fu.email) AS "freelancerContactEmail",
      COALESCE(NULLIF(TRIM(fp.contact_phone), ''), fu.phone) AS "freelancerContactPhone"
      ${applicantSelect}
     FROM projects p
     LEFT JOIN project_payments pp ON pp.project_id = p.id
     INNER JOIN users u ON u.id = p.business_id
     LEFT JOIN users fu ON fu.id = p.freelancer_id
     LEFT JOIN freelancer_profiles fp ON fp.user_id = p.freelancer_id
     ${includeApplicantFields ? 'LEFT JOIN project_applications vpa ON vpa.project_id = p.id AND vpa.freelancer_id = ?' : ''}
     WHERE p.id = ? LIMIT 1`,
    includeApplicantFields ? [viewerId, id] : [id],
  );
  return normalizeProjectRow(rows[0] || null);
}

async function list({
  status, minBudget, maxBudget, skill, freelancerId, viewerId, viewerRole, page = 1, limit = 20,
}) {
  const clauses = [];
  const params = [];
  const includeApplicantFields = viewerRole === 'freelancer' && viewerId != null;

  if (status) {
    clauses.push('p.status = ?');
    params.push(status);
  }
  if (minBudget != null) {
    clauses.push('p.budget >= ?');
    params.push(minBudget);
  }
  if (maxBudget != null) {
    clauses.push('p.budget <= ?');
    params.push(maxBudget);
  }
  if (skill) {
    clauses.push('p.skills_required LIKE ?');
    params.push(`%${skill}%`);
  }
  if (freelancerId != null) {
    clauses.push('p.freelancer_id = ?');
    params.push(freelancerId);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const applicantSelect = includeApplicantFields
    ? `,
      CASE WHEN vpa.id IS NULL THEN 0 ELSE 1 END AS "hasApplied",
      vpa.status AS "applicationStatus"`
    : ', 0 AS "hasApplied", NULL AS "applicationStatus"';

  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;
  const queryParams = includeApplicantFields
    ? [viewerId, ...params, safeLimit, offset]
    : [...params, safeLimit, offset];
  const [rows] = await pool.execute(
    `SELECT p.id, p.business_id AS "businessId", p.title, p.description,
      COALESCE(p.budget, pp.amount, 0) AS budget,
      p.skills_required AS "skillsRequired", p.deadline, p.status, p.freelancer_id AS "freelancerId",
      p.reference_link AS "referenceLink", p.reference_files AS "referenceFiles",
      p.submission_text AS "submissionText", p.submission_link AS "submissionLink",
      p.submission_files AS "submissionFiles", p.created_at AS "createdAt", u.name AS "businessName",
      fu.name AS "freelancerName",
      COALESCE(NULLIF(TRIM(fp.contact_email), ''), fu.email) AS "freelancerContactEmail",
      COALESCE(NULLIF(TRIM(fp.contact_phone), ''), fu.phone) AS "freelancerContactPhone"
      ${applicantSelect}
     FROM projects p
     LEFT JOIN project_payments pp ON pp.project_id = p.id
     INNER JOIN users u ON u.id = p.business_id
     LEFT JOIN users fu ON fu.id = p.freelancer_id
     LEFT JOIN freelancer_profiles fp ON fp.user_id = p.freelancer_id
     ${includeApplicantFields ? 'LEFT JOIN project_applications vpa ON vpa.project_id = p.id AND vpa.freelancer_id = ?' : ''}
     ${where}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    queryParams,
  );
  return rows.map(normalizeProjectRow);
}

async function listByBusiness(businessId, { limit = 20, offset = 0 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const [rows] = await pool.execute(
    `SELECT p.id, p.business_id AS "businessId", p.title, p.description,
      COALESCE(p.budget, pp.amount, 0) AS budget,
      p.skills_required AS "skillsRequired", p.deadline, p.status, p.freelancer_id AS "freelancerId",
      p.reference_link AS "referenceLink", p.reference_files AS "referenceFiles",
      p.submission_text AS "submissionText", p.submission_link AS "submissionLink",
      p.submission_files AS "submissionFiles", p.created_at AS "createdAt",
      NULL AS "freelancerContactEmail", NULL AS "freelancerContactPhone"
     FROM projects p
     LEFT JOIN project_payments pp ON pp.project_id = p.id
     WHERE p.business_id = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [businessId, safeLimit, safeOffset],
  );
  return rows.map(normalizeProjectRow);
}

async function acceptProjectTx(projectId, freelancerId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      'SELECT id, status, freelancer_id AS "freelancerId" FROM projects WHERE id = ? FOR UPDATE',
      [projectId],
    );
    const project = rows[0];
    if (!project) {
      throw new Error('PROJECT_NOT_FOUND');
    }
    if (project.status !== 'Open') {
      throw new Error('PROJECT_NOT_OPEN');
    }
    if (project.freelancerId) {
      throw new Error('PROJECT_ALREADY_ASSIGNED');
    }

    await connection.execute(
      'UPDATE projects SET freelancer_id = ?, status = ? WHERE id = ?',
      [freelancerId, 'Assigned', projectId],
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function submitProject(projectId, submissionText, submissionLink, submissionFiles) {
  await pool.execute(
    'UPDATE projects SET status = ?, submission_text = ?, submission_link = ?, submission_files = ?::jsonb WHERE id = ?',
    [
      'Submitted',
      submissionText,
      submissionLink || null,
      JSON.stringify(submissionFiles || []),
      projectId,
    ],
  );
  return findById(projectId);
}

async function completeProject(projectId) {
  await pool.execute('UPDATE projects SET status = ? WHERE id = ?', ['Completed', projectId]);
  return findById(projectId);
}

/**
 * Returns true if this user may download a file stored under uploads (project submission/reference or own profile photo).
 */
async function userMayAccessUploadedFile(filename, userId) {
  const like = `%${String(filename)}%`;
  const [projectRows] = await pool.execute(
    `SELECT id FROM projects
     WHERE (business_id = ? OR freelancer_id = ?)
     AND (submission_files::text LIKE ? OR reference_files::text LIKE ?)
     LIMIT 1`,
    [userId, userId, like, like],
  );
  if (projectRows[0]) return true;

  const [ownProfile] = await pool.execute(
    `SELECT user_id AS "userId" FROM freelancer_profiles
     WHERE user_id = ? AND profile_photo_url LIKE ?
     LIMIT 1`,
    [userId, like],
  );
  if (ownProfile[0]) return true;

  const [businessViewApplicantPhoto] = await pool.execute(
    `SELECT 1 AS ok
     FROM freelancer_profiles fp
     WHERE fp.profile_photo_url LIKE ?
       AND EXISTS (
         SELECT 1 FROM projects p
         WHERE p.business_id = ?
           AND (
             p.freelancer_id = fp.user_id
             OR EXISTS (
               SELECT 1 FROM project_applications pa
               WHERE pa.project_id = p.id AND pa.freelancer_id = fp.user_id
             )
           )
       )
     LIMIT 1`,
    [like, userId],
  );
  return Boolean(businessViewApplicantPhoto[0]);
}

module.exports = {
  create,
  findById,
  list,
  listByBusiness,
  acceptProjectTx,
  submitProject,
  completeProject,
  userMayAccessUploadedFile,
};
