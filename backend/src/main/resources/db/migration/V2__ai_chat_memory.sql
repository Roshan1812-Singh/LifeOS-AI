-- ============================================================
-- LifeOS AI - V2: AI Assistant (conversations, messages, memory)
-- ============================================================

CREATE TABLE conversations (
    id          BIGSERIAL PRIMARY KEY,
    public_id   UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id     BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL DEFAULT 'New conversation',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX ix_conversations_user_id ON conversations (user_id);
CREATE INDEX ix_conversations_updated_at ON conversations (updated_at DESC);

CREATE TABLE chat_messages (
    id              BIGSERIAL PRIMARY KEY,
    public_id       UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    conversation_id BIGINT      NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    role            VARCHAR(16) NOT NULL,           -- USER | ASSISTANT | SYSTEM
    content         TEXT        NOT NULL,
    token_count     INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_chat_messages_conversation_id ON chat_messages (conversation_id, created_at);

-- Long-term memory: durable user preferences / facts the assistant should know.
CREATE TABLE user_preferences (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    pref_key    VARCHAR(120) NOT NULL,
    pref_value  TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ux_user_pref UNIQUE (user_id, pref_key)
);

CREATE INDEX ix_user_preferences_user_id ON user_preferences (user_id);
