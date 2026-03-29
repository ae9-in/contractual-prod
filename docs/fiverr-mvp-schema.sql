-- Contractual Marketplace MVP
-- PostgreSQL 14+ compatible schema
-- Stack target: Node.js + Express + pg

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- =========================
-- Timestamp trigger utility
-- =========================
CREATE OR REPLACE FUNCTION contractual_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- Core identity and profiles
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email CITEXT NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(16) NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  email_verified_at TIMESTAMPTZ NULL,
  failed_login_attempts INT NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
  locked_until TIMESTAMPTZ NULL,
  last_login_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(120) NOT NULL,
  headline VARCHAR(180) NULL,
  bio TEXT NULL,
  country_code CHAR(2) NULL,
  timezone VARCHAR(64) NULL,
  avatar_url TEXT NULL,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seller_profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  level VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (level IN ('new', 'level_1', 'level_2', 'top_rated')),
  experience_years INT NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  portfolio_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  intro_video_url TEXT NULL,
  response_time_hours INT NOT NULL DEFAULT 24 CHECK (response_time_hours > 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  completed_orders_count INT NOT NULL DEFAULT 0 CHECK (completed_orders_count >= 0),
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  rating_count INT NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  user_agent TEXT NULL,
  ip_address INET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_refresh_tokens_hash ON auth_refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_user_expires ON auth_refresh_tokens(user_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  attempts INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_active ON password_reset_tokens(user_id, expires_at DESC) WHERE used_at IS NULL;

-- =========================
-- Taxonomy and gig catalog
-- =========================
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_parent_sort ON categories(parent_id, sort_order);

CREATE TABLE IF NOT EXISTS gigs (
  id BIGSERIAL PRIMARY KEY,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title VARCHAR(120) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  search_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  rating_count INT NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  completed_orders_count INT NOT NULL DEFAULT 0 CHECK (completed_orders_count >= 0),
  min_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (min_price >= 0),
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gigs_seller_status ON gigs(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_gigs_category_status_created ON gigs(category_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gigs_status_featured ON gigs(status, is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gigs_search_tsv ON gigs USING GIN(search_tsv);
CREATE INDEX IF NOT EXISTS idx_gigs_min_price ON gigs(min_price);

CREATE TABLE IF NOT EXISTS gig_packages (
  id BIGSERIAL PRIMARY KEY,
  gig_id BIGINT NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  tier VARCHAR(16) NOT NULL CHECK (tier IN ('basic', 'standard', 'premium')),
  name VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price > 0),
  delivery_days INT NOT NULL CHECK (delivery_days > 0),
  revisions_included INT NOT NULL DEFAULT 0 CHECK (revisions_included >= 0),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gig_id, tier)
);
CREATE INDEX IF NOT EXISTS idx_gig_packages_gig_active ON gig_packages(gig_id, is_active);

CREATE TABLE IF NOT EXISTS gig_media (
  id BIGSERIAL PRIMARY KEY,
  gig_id BIGINT NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  media_type VARCHAR(16) NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gig_media_gig_sort ON gig_media(gig_id, sort_order, id);

CREATE TABLE IF NOT EXISTS gig_faqs (
  id BIGSERIAL PRIMARY KEY,
  gig_id BIGINT NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  question VARCHAR(240) NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gig_faqs_gig_sort ON gig_faqs(gig_id, sort_order, id);

CREATE TABLE IF NOT EXISTS gig_requirements (
  id BIGSERIAL PRIMARY KEY,
  gig_id BIGINT NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  requirement_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (requirement_type IN ('text', 'file', 'choice')),
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gig_requirements_gig_sort ON gig_requirements(gig_id, sort_order, id);

-- =========================
-- Orders, revisions, delivery
-- =========================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(32) NOT NULL UNIQUE,
  gig_id BIGINT NOT NULL REFERENCES gigs(id) ON DELETE RESTRICT,
  package_id BIGINT NOT NULL REFERENCES gig_packages(id) ON DELETE RESTRICT,
  buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  subtotal_amount NUMERIC(12,2) NOT NULL CHECK (subtotal_amount >= 0),
  platform_fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (platform_fee_amount >= 0),
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(24) NOT NULL CHECK (status IN (
    'pending_payment',
    'in_progress',
    'delivered',
    'revision_requested',
    'completed',
    'cancelled',
    'disputed'
  )),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'authorized', 'captured', 'refunded', 'failed')),
  requirements_submitted_at TIMESTAMPTZ NULL,
  started_at TIMESTAMPTZ NULL,
  delivered_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  cancelled_at TIMESTAMPTZ NULL,
  disputed_at TIMESTAMPTZ NULL,
  cancellation_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (buyer_id <> seller_id),
  CHECK (total_amount = subtotal_amount + platform_fee_amount + tax_amount)
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_created ON orders(buyer_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller_created ON orders(seller_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status, created_at DESC);

CREATE TABLE IF NOT EXISTS order_requirements (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  requirement_id BIGINT NULL REFERENCES gig_requirements(id) ON DELETE SET NULL,
  response_text TEXT NULL,
  response_file_url TEXT NULL,
  created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (response_text IS NOT NULL OR response_file_url IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_order_requirements_order ON order_requirements(order_id, id);

CREATE TABLE IF NOT EXISTS order_deliveries (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  delivery_number INT NOT NULL CHECK (delivery_number > 0),
  message TEXT NOT NULL,
  delivery_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  delivered_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, delivery_number)
);
CREATE INDEX IF NOT EXISTS idx_order_deliveries_order_delivered ON order_deliveries(order_id, delivered_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS order_revisions (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  delivery_id BIGINT NULL REFERENCES order_deliveries(id) ON DELETE SET NULL,
  requested_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'addressed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_revisions_order_status ON order_revisions(order_id, status, created_at DESC);

-- =========================
-- Messaging and notifications
-- =========================
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  last_message_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (buyer_id <> seller_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_last ON conversations(buyer_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_last ON conversations(seller_id, last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON messages(sender_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL,
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- =========================
-- Reviews and reputation
-- =========================
CREATE TABLE IF NOT EXISTS reviews (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  gig_id BIGINT NOT NULL REFERENCES gigs(id) ON DELETE RESTRICT,
  buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (buyer_id <> seller_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_seller_created ON reviews(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_gig_created ON reviews(gig_id, created_at DESC);

CREATE TABLE IF NOT EXISTS review_replies (
  id BIGSERIAL PRIMARY KEY,
  review_id BIGINT NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Payments, ledger, and payouts
-- =========================
CREATE TABLE IF NOT EXISTS payment_intents (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('stripe', 'razorpay', 'manual')),
  provider_intent_id VARCHAR(128) NOT NULL UNIQUE,
  status VARCHAR(24) NOT NULL CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'cancelled', 'refunded')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('stripe', 'razorpay', 'manual')),
  provider_event_id VARCHAR(128) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_event_id)
);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_status_created ON payment_webhook_events(status, created_at DESC);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id BIGINT NULL REFERENCES orders(id) ON DELETE SET NULL,
  entry_type VARCHAR(30) NOT NULL CHECK (entry_type IN (
    'order_credit',
    'platform_fee_debit',
    'withdrawal_debit',
    'refund_debit',
    'adjustment_credit',
    'adjustment_debit'
  )),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  direction VARCHAR(8) NOT NULL CHECK (direction IN ('credit', 'debit')),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  description TEXT NULL,
  reference VARCHAR(64) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_created ON wallet_ledger(user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_order ON wallet_ledger(order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS withdrawals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'paid', 'rejected')),
  destination_masked VARCHAR(120) NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ NULL,
  rejection_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON withdrawals(user_id, status, requested_at DESC);

CREATE TABLE IF NOT EXISTS platform_fees (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  fee_percent NUMERIC(5,2) NOT NULL CHECK (fee_percent >= 0 AND fee_percent <= 100),
  fee_amount NUMERIC(12,2) NOT NULL CHECK (fee_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Disputes and administration
-- =========================
CREATE TABLE IF NOT EXISTS disputes (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  opened_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason VARCHAR(120) NOT NULL,
  details TEXT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution_type VARCHAR(30) NULL CHECK (resolution_type IN ('refund_full', 'refund_partial', 'release_payment', 'order_continue')),
  resolution_amount NUMERIC(12,2) NULL CHECK (resolution_amount IS NULL OR resolution_amount >= 0),
  resolved_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_disputes_status_created ON disputes(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_opened_by ON disputes(opened_by, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_actions (
  id BIGSERIAL PRIMARY KEY,
  admin_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id BIGINT NOT NULL,
  reason TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_created ON admin_actions(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  actor_role VARCHAR(20) NULL,
  event_type VARCHAR(80) NOT NULL,
  resource_type VARCHAR(60) NOT NULL,
  resource_id BIGINT NULL,
  ip_address INET NULL,
  user_agent TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_created ON audit_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id, created_at DESC);

-- =========================
-- Updated_at triggers
-- =========================
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_seller_profiles_updated_at BEFORE UPDATE ON seller_profiles
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_gigs_updated_at BEFORE UPDATE ON gigs
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_gig_packages_updated_at BEFORE UPDATE ON gig_packages
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_gig_faqs_updated_at BEFORE UPDATE ON gig_faqs
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_gig_requirements_updated_at BEFORE UPDATE ON gig_requirements
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_order_revisions_updated_at BEFORE UPDATE ON order_revisions
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_review_replies_updated_at BEFORE UPDATE ON review_replies
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_payment_intents_updated_at BEFORE UPDATE ON payment_intents
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_withdrawals_updated_at BEFORE UPDATE ON withdrawals
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();
CREATE TRIGGER trg_disputes_updated_at BEFORE UPDATE ON disputes
FOR EACH ROW EXECUTE PROCEDURE contractual_set_updated_at();

COMMIT;

-- =========================
-- Migration ordering notes
-- =========================
-- Suggested migration files:
-- 0001_extensions_and_utils.sql
-- 0002_identity_profiles.sql
-- 0003_categories_gigs.sql
-- 0004_orders_and_messaging.sql
-- 0005_reviews_payments_wallet.sql
-- 0006_disputes_admin_audit.sql
-- 0007_indexes_and_performance.sql

-- =========================
-- Seed strategy notes
-- =========================
-- 1) Seed categories and subcategories.
-- 2) Seed admin user account.
-- 3) Seed sample seller+buyer accounts for staging.
-- 4) Seed a sample published gig per top category.

