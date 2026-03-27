CREATE TABLE IF NOT EXISTS project_payment_orders (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  payment_id BIGINT NOT NULL REFERENCES project_payments(id) ON DELETE CASCADE,
  business_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('Escrow', 'Tip')),
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  provider VARCHAR(30) NOT NULL DEFAULT 'razorpay',
  provider_order_id VARCHAR(120) NOT NULL,
  provider_payment_id VARCHAR(120),
  provider_signature VARCHAR(255),
  note VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'Created' CHECK (status IN ('Created', 'Paid', 'Failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_payment_orders_provider_order UNIQUE (provider_order_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_project_status ON project_payment_orders(project_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_business_created ON project_payment_orders(business_id, created_at);

CREATE TRIGGER tr_project_payment_orders_updated_at
BEFORE UPDATE ON project_payment_orders
FOR EACH ROW EXECUTE PROCEDURE contractual_touch_updated_at();
