-- ============================================================
-- LifeOS AI - V3: Tasks, Reminders, Calendar
-- ============================================================

CREATE TABLE projects (
    id          BIGSERIAL PRIMARY KEY,
    public_id   UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id     BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name        VARCHAR(150) NOT NULL,
    color       VARCHAR(16),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX ix_projects_user_id ON projects (user_id);

CREATE TABLE tasks (
    id           BIGSERIAL PRIMARY KEY,
    public_id    UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id      BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    project_id   BIGINT       REFERENCES projects (id) ON DELETE SET NULL,
    parent_id    BIGINT       REFERENCES tasks (id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    priority     VARCHAR(16)  NOT NULL DEFAULT 'MEDIUM',  -- LOW | MEDIUM | HIGH | URGENT
    status       VARCHAR(16)  NOT NULL DEFAULT 'PENDING', -- PENDING | IN_PROGRESS | COMPLETED | CANCELLED
    category     VARCHAR(80),
    due_date     TIMESTAMPTZ,
    position     INTEGER      NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX ix_tasks_user_id ON tasks (user_id);
CREATE INDEX ix_tasks_status ON tasks (user_id, status);
CREATE INDEX ix_tasks_due_date ON tasks (user_id, due_date);
CREATE INDEX ix_tasks_parent_id ON tasks (parent_id);
CREATE INDEX ix_tasks_project_id ON tasks (project_id);

CREATE TABLE reminders (
    id             BIGSERIAL PRIMARY KEY,
    public_id      UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id        BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title          VARCHAR(255) NOT NULL,
    notes          TEXT,
    remind_at      TIMESTAMPTZ  NOT NULL,
    recurrence     VARCHAR(16)  NOT NULL DEFAULT 'NONE',   -- NONE | DAILY | WEEKLY | MONTHLY | YEARLY
    channel        VARCHAR(16)  NOT NULL DEFAULT 'PUSH',   -- PUSH | EMAIL | BOTH
    status         VARCHAR(16)  NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | COMPLETED | CANCELLED
    location_label VARCHAR(255),
    location_lat   DOUBLE PRECISION,
    location_lng   DOUBLE PRECISION,
    last_fired_at  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX ix_reminders_user_id ON reminders (user_id);
CREATE INDEX ix_reminders_remind_at ON reminders (remind_at);
CREATE INDEX ix_reminders_status ON reminders (user_id, status);

CREATE TABLE calendar_events (
    id          BIGSERIAL PRIMARY KEY,
    public_id   UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id     BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    location    VARCHAR(255),
    start_time  TIMESTAMPTZ  NOT NULL,
    end_time    TIMESTAMPTZ  NOT NULL,
    all_day     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX ix_calendar_events_user_id ON calendar_events (user_id);
CREATE INDEX ix_calendar_events_start_time ON calendar_events (user_id, start_time);
