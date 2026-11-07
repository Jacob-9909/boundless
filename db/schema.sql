-- Boundless schema. Idempotent: safe to re-run.
-- Apply: psql "$DATABASE_URL" -f db/schema.sql
-- On shared servers an admin creates the schema for the app role; CREATE SCHEMA IF NOT EXISTS would
-- still demand CREATE on the database, so only create it when missing (local, CI).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'boundless') THEN CREATE SCHEMA boundless; END IF;
END $$;

CREATE TABLE IF NOT EXISTS boundless.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  -- Self-declared ISO 3166-1 alpha-2 code. Public. Email is never shown.
  nationality char(2) NOT NULL,
  nationality_changed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS boundless.login_codes (
  email text PRIMARY KEY,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
-- Daily cap on issued codes (see issueCode).
ALTER TABLE boundless.login_codes
  ADD COLUMN IF NOT EXISTS issued int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS window_start timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS boundless.posts (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES boundless.users ON DELETE CASCADE,
  topic text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('question', 'experience')),
  lang text NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  body text NOT NULL CHECK (char_length(body) BETWEEN 2 AND 5000),
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posts_created_idx ON boundless.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_user_idx ON boundless.posts (user_id);

CREATE TABLE IF NOT EXISTS boundless.comments (
  id bigserial PRIMARY KEY,
  post_id bigint NOT NULL REFERENCES boundless.posts ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES boundless.users ON DELETE CASCADE,
  -- Per-post anonymous handle: 0 = post author, 1..n = neighbors in order of first comment.
  anon_no int NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_post_idx ON boundless.comments (post_id, created_at);

CREATE TABLE IF NOT EXISTS boundless.reports (
  id bigserial PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES boundless.users ON DELETE CASCADE,
  post_id bigint REFERENCES boundless.posts ON DELETE CASCADE,
  comment_id bigint REFERENCES boundless.comments ON DELETE CASCADE,
  reason text NOT NULL,
  details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 1000),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'actioned', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS boundless.blocks (
  user_id uuid NOT NULL REFERENCES boundless.users ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES boundless.users ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, blocked_id)
);

-- Minimal usage measurement (search, post, comment, signup, report).
CREATE TABLE IF NOT EXISTS boundless.events (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  user_id uuid REFERENCES boundless.users ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Community features (likes, saves, nested replies, regions, solved, reply alerts). Idempotent.
ALTER TABLE boundless.users
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS seen_at timestamptz NOT NULL DEFAULT now(); -- last time "My posts" was opened
ALTER TABLE boundless.posts
  ADD COLUMN IF NOT EXISTS region text, -- province id, NULL = anywhere in Korea
  ADD COLUMN IF NOT EXISTS solved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE boundless.comments
  ADD COLUMN IF NOT EXISTS parent_id bigint REFERENCES boundless.comments ON DELETE CASCADE; -- one level of replies

CREATE TABLE IF NOT EXISTS boundless.post_likes (
  user_id uuid NOT NULL REFERENCES boundless.users ON DELETE CASCADE,
  post_id bigint NOT NULL REFERENCES boundless.posts ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
CREATE TABLE IF NOT EXISTS boundless.comment_likes (
  user_id uuid NOT NULL REFERENCES boundless.users ON DELETE CASCADE,
  comment_id bigint NOT NULL REFERENCES boundless.comments ON DELETE CASCADE,
  PRIMARY KEY (comment_id, user_id)
);
CREATE TABLE IF NOT EXISTS boundless.saves (
  user_id uuid NOT NULL REFERENCES boundless.users ON DELETE CASCADE,
  post_id bigint NOT NULL REFERENCES boundless.posts ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
