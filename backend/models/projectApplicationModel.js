const pool = require('../config/db');
const { sameUserId } = require('../utils/sameUserId');

async function findByProjectAndFreelancer(projectId, freelancerId) {
  const [rows] = await pool.execute(
    `SELECT id, project_id AS projectId, freelancer_id AS freelancerId,
      cover_letter AS coverLetter, status, created_at AS createdAt, updated_at AS updatedAt
     FROM project_applications
     WHERE project_id = ? AND freelancer_id = ?
     LIMIT 1`,
    [projectId, freelancerId],
  );
  return rows[0] || null;
}

async function create({ projectId, freelancerId, coverLetter }) {
  const [result] = await pool.execute(
    `INSERT INTO project_applications (project_id, freelancer_id, cover_letter)
     VALUES (?, ?, ?)`,
    [projectId, freelancerId, coverLetter || null],
  );

  const [rows] = await pool.execute(
    `SELECT id, project_id AS projectId, freelancer_id AS freelancerId,
      cover_letter AS coverLetter, status, created_at AS createdAt, updated_at AS updatedAt
     FROM project_applications
     WHERE id = ? LIMIT 1`,
    [result.insertId],
  );

  return rows[0] || null;
}

async function listByProjectWithFreelancerProfile(projectId) {
  const [rows] = await pool.execute(
    `SELECT pa.id, pa.project_id AS projectId, pa.freelancer_id AS freelancerId,
      pa.cover_letter AS coverLetter, pa.status, pa.created_at AS createdAt,
      u.name AS freelancerName, u.email AS freelancerEmail,
      fp.skills, fp.bio, fp.portfolio_link AS portfolioLink, fp.experience_years AS experienceYears,
      COALESCE(NULLIF(TRIM(fp.contact_email), ''), u.email) AS contactEmail,
      COALESCE(NULLIF(TRIM(fp.contact_phone), ''), u.phone) AS contactPhone,
      COALESCE(rs.averageRating, 0) AS averageRating,
      COALESCE(rs.totalRatings, 0) AS totalRatings,
      COALESCE(rs.rating5Count, 0) AS rating5Count,
      COALESCE(rs.rating4Count, 0) AS rating4Count,
      COALESCE(rs.rating3Count, 0) AS rating3Count,
      COALESCE(rs.rating2Count, 0) AS rating2Count,
      COALESCE(rs.rating1Count, 0) AS rating1Count
     FROM project_applications pa
     INNER JOIN users u ON u.id = pa.freelancer_id
     LEFT JOIN freelancer_profiles fp ON fp.user_id = pa.freelancer_id
     LEFT JOIN (
       SELECT rated_user_id,
         ROUND(AVG(rating), 2) AS averageRating,
         COUNT(*) AS totalRatings,
         SUM(rating = 5) AS rating5Count,
         SUM(rating = 4) AS rating4Count,
         SUM(rating = 3) AS rating3Count,
         SUM(rating = 2) AS rating2Count,
         SUM(rating = 1) AS rating1Count
       FROM project_ratings
       GROUP BY rated_user_id
     ) rs ON rs.rated_user_id = pa.freelancer_id
     WHERE pa.project_id = ?
     ORDER BY pa.created_at DESC, pa.id DESC`,
    [projectId],
  );
  return rows;
}

async function acceptApplicationTx(projectId, applicationId, businessId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [projectRows] = await connection.execute(
      `SELECT id, business_id AS businessId, status, freelancer_id AS freelancerId
       FROM projects
       WHERE id = ?
       FOR UPDATE`,
      [projectId],
    );
    const project = projectRows[0];
    if (!project) throw new Error('PROJECT_NOT_FOUND');
    if (!sameUserId(project.businessId, businessId)) throw new Error('FORBIDDEN');
    if (project.status !== 'Open' || project.freelancerId) throw new Error('PROJECT_NOT_OPEN');

    const [appRows] = await connection.execute(
      `SELECT id, freelancer_id AS freelancerId, status
       FROM project_applications
       WHERE id = ? AND project_id = ?
       FOR UPDATE`,
      [applicationId, projectId],
    );
    const application = appRows[0];
    if (!application) throw new Error('APPLICATION_NOT_FOUND');
    if (application.status !== 'Pending') throw new Error('APPLICATION_NOT_PENDING');

    const [pendingRows] = await connection.execute(
      `SELECT freelancer_id AS freelancerId
       FROM project_applications
       WHERE project_id = ? AND status = 'Pending'`,
      [projectId],
    );

    await connection.execute(
      `UPDATE project_applications
       SET status = 'Rejected'
       WHERE project_id = ? AND status = 'Pending' AND id <> ?`,
      [projectId, applicationId],
    );

    await connection.execute(
      `UPDATE project_applications
       SET status = 'Accepted'
       WHERE id = ?`,
      [applicationId],
    );

    await connection.execute(
      `UPDATE projects
       SET freelancer_id = ?, status = 'Assigned'
       WHERE id = ?`,
      [application.freelancerId, projectId],
    );

    await connection.commit();

    const rejectedFreelancerIds = pendingRows
      .map((row) => Number(row.freelancerId))
      .filter((id) => id !== Number(application.freelancerId));

    return {
      acceptedFreelancerId: Number(application.freelancerId),
      rejectedFreelancerIds,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findByProjectAndFreelancer,
  create,
  listByProjectWithFreelancerProfile,
  acceptApplicationTx,
};
