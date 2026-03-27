const pool = require('../config/db');

async function getByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT
      user_id AS userId,
      skills,
      bio,
      portfolio_link AS portfolioLink,
      experience_years AS experienceYears,
      profile_photo_url AS profilePhotoUrl,
      organization_name AS organizationName,
      organization_website AS organizationWebsite,
      organization_industry AS organizationIndustry,
      contact_email AS contactEmail,
      contact_phone AS contactPhone
    FROM freelancer_profiles
    WHERE user_id = ? LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

async function upsertByUserId(userId, profile) {
  await pool.execute(
    `INSERT INTO freelancer_profiles (
      user_id,
      skills,
      bio,
      portfolio_link,
      experience_years,
      profile_photo_url,
      organization_name,
      organization_website,
      organization_industry,
      contact_email,
      contact_phone
    )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET
     skills = EXCLUDED.skills,
     bio = EXCLUDED.bio,
     portfolio_link = EXCLUDED.portfolio_link,
     experience_years = EXCLUDED.experience_years,
     profile_photo_url = EXCLUDED.profile_photo_url,
     organization_name = EXCLUDED.organization_name,
     organization_website = EXCLUDED.organization_website,
     organization_industry = EXCLUDED.organization_industry,
     contact_email = EXCLUDED.contact_email,
     contact_phone = EXCLUDED.contact_phone`,
    [
      userId,
      profile.skills,
      profile.bio,
      profile.portfolioLink,
      profile.experienceYears,
      profile.profilePhotoUrl,
      profile.organizationName,
      profile.organizationWebsite,
      profile.organizationIndustry,
      profile.contactEmail,
      profile.contactPhone,
    ],
  );
  return getByUserId(userId);
}

async function updatePhotoByUserId(userId, profilePhotoUrl) {
  await pool.execute(
    `INSERT INTO freelancer_profiles (
      user_id,
      skills,
      bio,
      portfolio_link,
      experience_years,
      profile_photo_url,
      organization_name,
      organization_website,
      organization_industry,
      contact_email,
      contact_phone
    )
    VALUES (?, '', '', '', 0, ?, '', '', '', '', '')
    ON CONFLICT (user_id) DO UPDATE SET profile_photo_url = EXCLUDED.profile_photo_url`,
    [userId, profilePhotoUrl],
  );
  return getByUserId(userId);
}

module.exports = {
  getByUserId,
  upsertByUserId,
  updatePhotoByUserId,
};
