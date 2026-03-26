ALTER TABLE projects
  ADD INDEX idx_projects_status_created (status, created_at);
