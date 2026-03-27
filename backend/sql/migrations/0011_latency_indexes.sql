-- Performance indexes for high-read auth, notifications, and messaging paths.
CREATE INDEX IF NOT EXISTS idx_users_email_normalized
  ON users ((LOWER(TRIM(email))));

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_id
  ON notifications (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread_user_project
  ON notifications (user_id, project_id)
  WHERE is_read = FALSE AND type = 'new_message';

CREATE INDEX IF NOT EXISTS idx_messages_project_created_id
  ON messages (project_id, created_at DESC, id DESC);
