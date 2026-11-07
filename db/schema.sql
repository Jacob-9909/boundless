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

-- Boards, country lounges, marketplace/event fields, translations, member points. Idempotent.
ALTER TABLE boundless.posts DROP CONSTRAINT IF EXISTS posts_kind_check; -- kind is now the board's 말머리 (tag)
ALTER TABLE boundless.posts
  ADD COLUMN IF NOT EXISTS space text NOT NULL DEFAULT 'global', -- 'global', or a country code: that nationality only
  ADD COLUMN IF NOT EXISTS price int CHECK (price IS NULL OR price >= 0), -- marketplace, KRW
  ADD COLUMN IF NOT EXISTS deal text, -- marketplace: open | reserved | done
  ADD COLUMN IF NOT EXISTS place text CHECK (place IS NULL OR char_length(place) <= 80),
  ADD COLUMN IF NOT EXISTS starts_on date, -- pop-ups and events
  ADD COLUMN IF NOT EXISTS ends_on date;
CREATE INDEX IF NOT EXISTS posts_space_topic_idx ON boundless.posts (space, topic, created_at DESC);
UPDATE boundless.posts SET topic = 'visa' WHERE topic = 'procedures';
UPDATE boundless.posts SET topic = 'chat' WHERE topic = 'daily';
UPDATE boundless.posts SET kind = 'review' WHERE kind = 'experience';

ALTER TABLE boundless.users ADD COLUMN IF NOT EXISTS read_lang text; -- translation target; NULL = from nationality

-- Cache keyed by 'p:<post id>' / 'c:<comment id>'. Deleting a post, comment or account removes its rows (actions.ts).
CREATE TABLE IF NOT EXISTS boundless.translations (
  item text NOT NULL,
  lang text NOT NULL,
  title text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item, lang)
);

-- Points = posts + 2 x answers on others' posts + 3 x helpful votes received.
CREATE OR REPLACE VIEW boundless.member_points AS
SELECT u.id AS user_id, u.nationality,
  (SELECT count(*)::int FROM boundless.posts p WHERE p.user_id = u.id AND NOT p.hidden) AS posts,
  (SELECT count(*)::int FROM boundless.comments c JOIN boundless.posts p ON p.id = c.post_id
     WHERE c.user_id = u.id AND p.user_id <> u.id AND NOT c.hidden) AS answers,
  ((SELECT count(*)::int FROM boundless.post_likes l JOIN boundless.posts p ON p.id = l.post_id WHERE p.user_id = u.id)
   + (SELECT count(*)::int FROM boundless.comment_likes l JOIN boundless.comments c ON c.id = l.comment_id WHERE c.user_id = u.id)) AS helped
FROM boundless.users u;

-- Appeals: the author of a hidden post or comment can ask once for a second look.
CREATE TABLE IF NOT EXISTS boundless.appeals (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES boundless.users ON DELETE CASCADE,
  post_id bigint REFERENCES boundless.posts ON DELETE CASCADE,
  comment_id bigint REFERENCES boundless.comments ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 1000),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'restored', 'upheld')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CHECK ((post_id IS NULL) <> (comment_id IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS appeals_post_once ON boundless.appeals (post_id) WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS appeals_comment_once ON boundless.appeals (comment_id) WHERE comment_id IS NOT NULL;
