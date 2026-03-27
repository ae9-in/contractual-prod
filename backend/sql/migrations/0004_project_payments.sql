CREATE TABLE IF NOT EXISTS project_payments (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Unfunded' CHECK (status IN ('Unfunded', 'Funded', 'Released')),
  funded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_project_payments_project UNIQUE (project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_payments_status ON project_payments(status);

CREATE TRIGGER tr_project_payments_updated_at
BEFORE UPDATE ON project_payments
FOR EACH ROW EXECUTE PROCEDURE contractual_touch_updated_at();

CREATE TABLE IF NOT EXISTS project_payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  payment_id BIGINT NOT NULL REFERENCES project_payments(id) ON DELETE CASCADE,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  note VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_project_created ON project_payment_transactions(project_id, created_at);

INSERT INTO project_payments (project_id, amount, status)
SELECT p.id, p.budget, 'Unfunded'
FROM projects p
LEFT JOIN project_payments pp ON pp.project_id = p.id
WHERE pp.project_id IS NULL;
