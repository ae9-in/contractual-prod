CREATE TABLE IF NOT EXISTS project_applications (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  freelancer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_project_freelancer UNIQUE (project_id, freelancer_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_project_status ON project_applications(project_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_freelancer ON project_applications(freelancer_id);

CREATE TRIGGER tr_project_applications_updated_at
BEFORE UPDATE ON project_applications
FOR EACH ROW EXECUTE PROCEDURE contractual_touch_updated_at();
