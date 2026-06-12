-- ============================================================
-- LifeOS AI - V4: Document AI Vault
-- ============================================================

CREATE TABLE documents (
    id             BIGSERIAL PRIMARY KEY,
    public_id      UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id        BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title          VARCHAR(255) NOT NULL,
    original_name  VARCHAR(255) NOT NULL,
    storage_key    VARCHAR(512) NOT NULL,
    content_type   VARCHAR(150),
    size_bytes     BIGINT       NOT NULL DEFAULT 0,
    category       VARCHAR(32)  NOT NULL DEFAULT 'OTHER',
    status         VARCHAR(16)  NOT NULL DEFAULT 'PROCESSING', -- PROCESSING | READY | FAILED
    extracted_text TEXT,
    text_chars     INTEGER      NOT NULL DEFAULT 0,
    error_message  VARCHAR(500),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX ix_documents_user_id ON documents (user_id);
CREATE INDEX ix_documents_category ON documents (user_id, category);
CREATE INDEX ix_documents_status ON documents (user_id, status);
