CREATE DATABASE IF NOT EXISTS freelancer_platform;
USE freelancer_platform;

DROP TABLE IF EXISTS bids;
DROP TABLE IF EXISTS project_payment_transactions;
DROP TABLE IF EXISTS project_payments;
DROP TABLE IF EXISTS project_payment_orders;
DROP TABLE IF EXISTS project_ratings;
DROP TABLE IF EXISTS project_applications;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS freelancer_profiles;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NULL,
  phone VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('business', 'freelancer') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_phone UNIQUE (phone),
  INDEX idx_users_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS projects (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_id BIGINT UNSIGNED NOT NULL,
  freelancer_id BIGINT UNSIGNED NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(12,2) NOT NULL,
  skills_required TEXT NOT NULL,
  deadline DATE NOT NULL,
  reference_link VARCHAR(500) NULL,
  reference_files JSON NULL,
  submission_text TEXT NULL,
  submission_link VARCHAR(500) NULL,
  submission_files JSON NULL,
  status ENUM('Open', 'Assigned', 'Submitted', 'Completed') NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_business FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_projects_freelancer FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_projects_business (business_id),
  INDEX idx_projects_freelancer (freelancer_id),
  INDEX idx_projects_status (status),
  INDEX idx_projects_deadline (deadline),
  INDEX idx_projects_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS freelancer_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  skills TEXT NOT NULL,
  bio TEXT NULL,
  portfolio_link VARCHAR(255) NULL,
  experience_years INT UNSIGNED NOT NULL DEFAULT 0,
  profile_photo_url VARCHAR(500) NULL,
  organization_name VARCHAR(150) NULL,
  organization_website VARCHAR(255) NULL,
  organization_industry VARCHAR(120) NULL,
  contact_email VARCHAR(190) NULL,
  contact_phone VARCHAR(30) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_profiles_updated (updated_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_messages_project_created (project_id, created_at),
  INDEX idx_messages_sender (sender_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(140) NOT NULL,
  message_text TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  INDEX idx_notifications_user_read_created (user_id, is_read, created_at),
  INDEX idx_notifications_project (project_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_ratings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  rater_id BIGINT UNSIGNED NOT NULL,
  rated_user_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  review_text TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ratings_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_ratings_rater FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ratings_rated_user FOREIGN KEY (rated_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_project_rater UNIQUE (project_id, rater_id),
  CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5),
  INDEX idx_ratings_project (project_id),
  INDEX idx_ratings_rated_user (rated_user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_applications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  freelancer_id BIGINT UNSIGNED NOT NULL,
  cover_letter TEXT NULL,
  status ENUM('Pending', 'Accepted', 'Rejected') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_project_applications_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_project_applications_freelancer FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_project_freelancer UNIQUE (project_id, freelancer_id),
  INDEX idx_applications_project_status (project_id, status),
  INDEX idx_applications_freelancer (freelancer_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  tip_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status ENUM('Unfunded', 'Funded', 'Released') NOT NULL DEFAULT 'Unfunded',
  funded_at TIMESTAMP NULL,
  released_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_project_payments_project UNIQUE (project_id),
  CONSTRAINT fk_project_payments_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_payments_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_payment_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  type ENUM('Funded', 'Released', 'Tip') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_tx_payment FOREIGN KEY (payment_id) REFERENCES project_payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_tx_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_tx_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_payment_tx_project_created (project_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_payment_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  payment_id BIGINT UNSIGNED NOT NULL,
  business_id BIGINT UNSIGNED NOT NULL,
  purpose ENUM('Escrow', 'Tip') NOT NULL,
  amount_paise BIGINT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  provider VARCHAR(30) NOT NULL DEFAULT 'razorpay',
  provider_order_id VARCHAR(120) NOT NULL,
  provider_payment_id VARCHAR(120) NULL,
  provider_signature VARCHAR(255) NULL,
  note VARCHAR(255) NULL,
  status ENUM('Created', 'Paid', 'Failed') NOT NULL DEFAULT 'Created',
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_payment_orders_provider_order UNIQUE (provider_order_id),
  CONSTRAINT fk_payment_orders_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_orders_payment FOREIGN KEY (payment_id) REFERENCES project_payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_orders_business FOREIGN KEY (business_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_payment_orders_project_status (project_id, status),
  INDEX idx_payment_orders_business_created (business_id, created_at)
) ENGINE=InnoDB;
