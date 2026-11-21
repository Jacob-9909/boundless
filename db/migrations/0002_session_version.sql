-- Server-side sign-out (src/lib/auth.ts): a session cookie carries the version it was issued with, and
-- "sign out on every device" bumps it, so every older cookie stops working at once.
ALTER TABLE boundless.users ADD COLUMN IF NOT EXISTS session_version int NOT NULL DEFAULT 0;
