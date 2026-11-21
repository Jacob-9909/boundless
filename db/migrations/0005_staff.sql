-- Staff roles (src/lib/auth.ts). Moderators act on reports and appeals; admins also grant and remove roles.
-- ADMIN_EMAILS still makes an admin, which is how the first one is set up. Sample accounts never get a role.
ALTER TABLE boundless.users
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin'));

-- Every staff decision: who, what, on which report, appeal or member. actor_email keeps the record readable after
-- the staff account is gone; target ids go NULL when the content is deleted, the line itself stays.
CREATE TABLE IF NOT EXISTS boundless.staff_log (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES boundless.users ON DELETE SET NULL,
  actor_email text NOT NULL,
  action text NOT NULL CHECK (action IN ('hide', 'dismiss', 'restore', 'uphold', 'role')),
  report_id bigint REFERENCES boundless.reports ON DELETE SET NULL,
  appeal_id bigint REFERENCES boundless.appeals ON DELETE SET NULL,
  post_id bigint REFERENCES boundless.posts ON DELETE SET NULL,
  comment_id bigint REFERENCES boundless.comments ON DELETE SET NULL,
  subject_email text, -- role changes: whose role
  detail text,        -- role changes: the new role
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_log_time_idx ON boundless.staff_log (created_at DESC);
