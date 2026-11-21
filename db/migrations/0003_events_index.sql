-- Rate limits count recent rows by name (auth.ts allowCodeRequest, the AI check in actions.ts). Without an index
-- every sign-in code request read the whole log. Old rows are deleted daily (src/app/api/cron/cleanup).
CREATE INDEX IF NOT EXISTS events_name_time_idx ON boundless.events (name, created_at);
-- Per-member hourly caps on comments (actions.ts recentCount); posts already have posts_user_idx.
CREATE INDEX IF NOT EXISTS comments_user_idx ON boundless.comments (user_id, created_at);
