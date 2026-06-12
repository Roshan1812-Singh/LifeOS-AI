-- ============================================================
-- LifeOS AI - V1: Authentication & User schema
-- ============================================================

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name            VARCHAR(120) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(32),
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(32)  NOT NULL DEFAULT 'USER',
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    email_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
    auth_provider   VARCHAR(32)  NOT NULL DEFAULT 'LOCAL',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness on email
CREATE UNIQUE INDEX ux_users_email ON users (LOWER(email));
CREATE INDEX ix_users_role ON users (role);

CREATE TABLE refresh_tokens (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash   VARCHAR(255) NOT NULL UNIQUE,
    expires_at   TIMESTAMPTZ  NOT NULL,
    revoked      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX ix_refresh_tokens_expires_at ON refresh_tokens (expires_at);
