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
     ON DUPLICATE KEY UPDATE
     skills = VALUES(skills),
     bio = VALUES(bio),
     portfolio_link = VALUES(portfolio_link),
     experience_years = VALUES(experience_years),
     profile_photo_url = VALUES(profile_photo_url),
     organization_name = VALUES(organization_name),
     organization_website = VALUES(organization_website),
     organization_industry = VALUES(organization_industry),
     contact_email = VALUES(contact_email),
     contact_phone = VALUES(contact_phone)`,
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
    ON DUPLICATE KEY UPDATE profile_photo_url = VALUES(profile_photo_url)`,
    [userId, profilePhotoUrl],
  );
  return getByUserId(userId);
}

module.exports = {
  getByUserId,
  upsertByUserId,
  updatePhotoByUserId,
};
