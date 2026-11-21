-- Search (listPosts in src/lib/posts.ts) matches '%term%' in titles, bodies and cached translations. Trigram GIN
-- indexes let Postgres find those rows without reading every post; terms need 3+ characters to use them.
-- Where pg_trgm cannot be installed (PGlite, a role without the privilege) search still works, only slower.
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'pg_trgm unavailable (%): search runs without trigram indexes', SQLERRM;
END $$;
-- The operator class is named with the extension's own schema: it may already be installed somewhere
-- (e.g. an "extensions" schema) that is not on the search_path.
DO $$ DECLARE ext text;
BEGIN
  SELECT n.nspname INTO ext FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'pg_trgm';
  IF ext IS NOT NULL THEN
    EXECUTE format('CREATE INDEX IF NOT EXISTS posts_title_trgm ON boundless.posts USING gin (title %I.gin_trgm_ops)', ext);
    EXECUTE format('CREATE INDEX IF NOT EXISTS posts_body_trgm ON boundless.posts USING gin (body %I.gin_trgm_ops)', ext);
    EXECUTE format('CREATE INDEX IF NOT EXISTS translations_title_trgm ON boundless.translations USING gin (title %I.gin_trgm_ops)', ext);
    EXECUTE format('CREATE INDEX IF NOT EXISTS translations_body_trgm ON boundless.translations USING gin (body %I.gin_trgm_ops)', ext);
  END IF;
END $$;
