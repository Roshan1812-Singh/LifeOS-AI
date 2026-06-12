-- ============================================================
-- LifeOS AI - V5: Expense Tracker (income & expenses)
-- ============================================================

CREATE TABLE transactions (
    id          BIGSERIAL PRIMARY KEY,
    public_id   UUID          NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id     BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type        VARCHAR(16)   NOT NULL,                 -- INCOME | EXPENSE
    amount      NUMERIC(15, 2) NOT NULL,
    currency    VARCHAR(8)    NOT NULL DEFAULT 'USD',
    category    VARCHAR(32)   NOT NULL DEFAULT 'OTHER',
    note        VARCHAR(500),
    occurred_on DATE          NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

CREATE INDEX ix_transactions_user_id ON transactions (user_id);
CREATE INDEX ix_transactions_user_date ON transactions (user_id, occurred_on);
CREATE INDEX ix_transactions_user_category ON transactions (user_id, category);
