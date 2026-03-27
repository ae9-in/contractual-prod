const pool = require('../config/db');

async function findByProjectAndRater(projectId, raterId) {
  const [rows] = await pool.execute(
    `SELECT id, project_id AS projectId, rater_id AS raterId, rated_user_id AS ratedUserId,
      rating, review_text AS reviewText, created_at AS createdAt
     FROM project_ratings
     WHERE project_id = ? AND rater_id = ?
     LIMIT 1`,
    [projectId, raterId],
  );
  return rows[0] || null;
}

async function create({ projectId, raterId, ratedUserId, rating, reviewText }) {
  const [result] = await pool.execute(
    `INSERT INTO project_ratings (project_id, rater_id, rated_user_id, rating, review_text)
     VALUES (?, ?, ?, ?, ?)
     RETURNING id`,
    [projectId, raterId, ratedUserId, rating, reviewText || null],
  );
  const [rows] = await pool.execute(
    `SELECT pr.id, pr.project_id AS projectId, pr.rater_id AS raterId, pr.rated_user_id AS ratedUserId,
      pr.rating, pr.review_text AS reviewText, pr.created_at AS createdAt,
      ru.name AS raterName, tu.name AS ratedUserName
     FROM project_ratings pr
     INNER JOIN users ru ON ru.id = pr.rater_id
     INNER JOIN users tu ON tu.id = pr.rated_user_id
     WHERE pr.id = ? LIMIT 1`,
    [result.insertId],
  );
  return rows[0] || null;
}

async function listByProject(projectId) {
  const [rows] = await pool.execute(
    `SELECT pr.id, pr.project_id AS projectId, pr.rater_id AS raterId, pr.rated_user_id AS ratedUserId,
      pr.rating, pr.review_text AS reviewText, pr.created_at AS createdAt,
      ru.name AS raterName, ru.role AS raterRole, tu.name AS ratedUserName
     FROM project_ratings pr
     INNER JOIN users ru ON ru.id = pr.rater_id
     INNER JOIN users tu ON tu.id = pr.rated_user_id
     WHERE pr.project_id = ?
     ORDER BY pr.created_at DESC, pr.id DESC`,
    [projectId],
  );
  return rows;
}

async function getSummaryByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT
      COUNT(*) AS totalRatings,
      ROUND(AVG(rating)::numeric, 2) AS averageRating
     FROM project_ratings
     WHERE rated_user_id = ?`,
    [userId],
  );
  const [distributionRows] = await pool.execute(
    `SELECT rating, COUNT(*) AS count
     FROM project_ratings
     WHERE rated_user_id = ?
     GROUP BY rating
     ORDER BY rating DESC`,
    [userId],
  );

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  distributionRows.forEach((row) => {
    distribution[Number(row.rating)] = Number(row.count);
  });

  return {
    userId,
    totalRatings: Number(rows[0]?.totalRatings || 0),
    averageRating: Number(rows[0]?.averageRating || 0),
    distribution,
  };
}

module.exports = {
  findByProjectAndRater,
  create,
  listByProject,
  getSummaryByUser,
};
