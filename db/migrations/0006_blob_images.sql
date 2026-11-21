-- Photos go to private Vercel Blob storage when the deployment has a store (src/lib/images.ts): `blob` is the
-- pathname there and `data` stays NULL. Older rows keep their bytes until scripts/images-to-blob.mjs moves them.
ALTER TABLE boundless.post_images ALTER COLUMN data DROP NOT NULL, ADD COLUMN IF NOT EXISTS blob text;
DO $$ BEGIN
  ALTER TABLE boundless.post_images ADD CONSTRAINT post_images_stored CHECK (data IS NOT NULL OR blob IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Every way a photo row disappears (edit, post delete, account delete: cascades included) queues its file here.
-- The row is gone at once, so /api/img already answers 404; the delete actions and the daily cleanup then remove
-- the file itself (purgeBlobs in src/lib/images.ts).
CREATE TABLE IF NOT EXISTS boundless.blob_trash (
  pathname text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION boundless.queue_blob_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.blob IS NOT NULL THEN
    INSERT INTO boundless.blob_trash (pathname) VALUES (OLD.blob) ON CONFLICT DO NOTHING;
  END IF;
  RETURN OLD;
END $$;
DROP TRIGGER IF EXISTS post_images_blob_trash ON boundless.post_images;
CREATE TRIGGER post_images_blob_trash AFTER DELETE ON boundless.post_images
  FOR EACH ROW EXECUTE FUNCTION boundless.queue_blob_delete();
