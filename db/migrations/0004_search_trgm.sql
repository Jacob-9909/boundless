-- Search (listPosts in src/lib/posts.ts) matches '%term%' in titles, bodies and cached translations. Trigram GIN
-- indexes let Postgres find those rows without reading every post; terms need 3+ characters to use them.
-- Where pg_trgm cannot be installed (PGlite, a role without the privilege) search still works, only slower.
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'pg_trgm unavailable (%): search runs without trigram indexes', SQLERRM;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS posts_title_trgm ON boundless.posts USING gin (title gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS posts_body_trgm ON boundless.posts USING gin (body gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS translations_title_trgm ON boundless.translations USING gin (title gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS translations_body_trgm ON boundless.translations USING gin (body gin_trgm_ops);
  END IF;
END $$;
