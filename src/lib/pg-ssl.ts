// TLS for every Postgres connection: the app (db.ts) and the scripts (db.mjs, images-to-blob.mjs) import this.
// No imports, so Node runs it directly from the .mjs scripts.

/**
 * The pg `ssl` option for a connection string. Local dev DBs (docker, PGlite) run without TLS; anything else
 * must present a certificate that verifies. pg lets the URL override this option, so a URL that turns the
 * check off (sslmode=disable or no-verify, ssl=0/false) is refused instead of silently trusted.
 */
export function sslFor(url: string) {
  if (/@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url)) return false;
  if (/[?&](sslmode=(disable|no-verify)|ssl=(0|false))(&|$)/i.test(url)) {
    throw new Error("DATABASE_URL turns off TLS certificate checks (sslmode=disable/no-verify or ssl=false); remove that parameter");
  }
  return true;
}
