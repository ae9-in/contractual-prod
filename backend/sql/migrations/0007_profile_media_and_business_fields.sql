ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500);
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS organization_name VARCHAR(150);
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS organization_website VARCHAR(255);
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS organization_industry VARCHAR(120);
