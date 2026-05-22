-- Looma schema. Idempotent: safe to run repeatedly.

CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  subtitle    TEXT NOT NULL DEFAULT '',
  note        TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'ready'
              CHECK (status IN ('generating', 'ready', 'archived')),
  looks       JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'ai')),
  text        TEXT NOT NULL DEFAULT '',
  proposals   JSONB,
  batch_id    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project
  ON chat_messages (project_id, created_at);

CREATE TABLE IF NOT EXISTS generation_batches (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prompt      TEXT NOT NULL,
  count       INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'queued'
              CHECK (status IN ('queued', 'generating', 'succeeded', 'failed')),
  workflow_id TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_generation_batches_project
  ON generation_batches (project_id, created_at);

CREATE TABLE IF NOT EXISTS shots (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  batch_id    TEXT NOT NULL REFERENCES generation_batches(id) ON DELETE CASCADE,
  look        TEXT NOT NULL,
  pose        TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'queued'
              CHECK (status IN ('queued', 'generating', 'succeeded', 'failed')),
  x           DOUBLE PRECISION NOT NULL DEFAULT 0,
  y           DOUBLE PRECISION NOT NULL DEFAULT 0,
  width       DOUBLE PRECISION NOT NULL DEFAULT 240,
  image_url   TEXT,
  seed        INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shots_batch ON shots (batch_id);
CREATE INDEX IF NOT EXISTS idx_shots_project ON shots (project_id);

-- 小红书 generated posts (生文 module).
CREATE TABLE IF NOT EXISTS xhs_posts (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  brief       TEXT NOT NULL,
  vertical    TEXT NOT NULL DEFAULT 'ecommerce'
              CHECK (vertical IN ('ecommerce', 'ai_tech')),
  angle       TEXT
              CHECK (angle IN ('tutorial', 'review', 'news', 'opinion')),
  tone        TEXT NOT NULL DEFAULT 'literary'
              CHECK (tone IN ('literary', 'lively', 'professional')),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  tags        JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_tip   TEXT NOT NULL DEFAULT '',
  validation  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xhs_posts_project
  ON xhs_posts (project_id, created_at);

-- Marketing automation: recurring triggers + pipeline runs.
CREATE TABLE IF NOT EXISTS campaign_schedules (
  id               TEXT PRIMARY KEY,
  brief            TEXT NOT NULL,
  interval_minutes INTEGER NOT NULL,
  mode             TEXT NOT NULL DEFAULT 'in-process'
                   CHECK (mode IN ('temporal', 'in-process')),
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id           TEXT PRIMARY KEY,
  brief        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'queued'
               CHECK (status IN ('queued', 'planning', 'rendering', 'succeeded', 'failed')),
  schedule_id  TEXT REFERENCES campaign_schedules(id) ON DELETE SET NULL,
  workflow_id  TEXT,
  plan         JSONB,
  image_urls   JSONB NOT NULL DEFAULT '[]'::jsonb,
  video        JSONB,
  article      JSONB,
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_campaigns_created
  ON campaigns (created_at DESC);
