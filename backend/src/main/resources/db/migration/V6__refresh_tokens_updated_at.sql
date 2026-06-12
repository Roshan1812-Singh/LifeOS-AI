-- ============================================================
-- LifeOS AI - V6: add the auditing column missing from V1.
--
-- RefreshToken extends BaseEntity, which maps a NOT NULL `updated_at`
-- column. V1 created `refresh_tokens` without it, so Hibernate's
-- schema validation (ddl-auto: validate) fails on startup in prod.
-- Backfill it for existing rows, then keep it non-null.
-- ============================================================
ALTER TABLE refresh_tokens
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
