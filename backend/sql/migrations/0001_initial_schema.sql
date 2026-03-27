-- PostgreSQL baseline (was MySQL 0001)

CREATE OR REPLACE FUNCTION contractual_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('business', 'freelancer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TRIGGER tr_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE contractual_touch_updated_at();

CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  business_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  freelancer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(12,2) NOT NULL,
  skills_required TEXT NOT NULL,
  deadline DATE NOT NULL,
  submission_text TEXT,
  submission_link VARCHAR(500),
  submission_files JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Assigned', 'Submitted', 'Completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_business ON projects(business_id);
CREATE INDEX IF NOT EXISTS idx_projects_freelancer ON projects(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline);

CREATE TRIGGER tr_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE PROCEDURE contractual_touch_updated_at();

CREATE TABLE IF NOT EXISTS freelancer_profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  skills TEXT NOT NULL,
  bio TEXT,
  portfolio_link VARCHAR(255),
  experience_years INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_freelancer_profiles_updated_at
BEFORE UPDATE ON freelancer_profiles
FOR EACH ROW EXECUTE PROCEDURE contractual_touch_updated_at();

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_project_created ON messages(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(140) NOT NULL,
  message_text TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_project ON notifications(project_id);

CREATE TABLE IF NOT EXISTS project_ratings (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rater_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_project_rater UNIQUE (project_id, rater_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_project ON project_ratings(project_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON project_ratings(rated_user_id);
