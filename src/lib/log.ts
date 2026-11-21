// Server errors as one JSON line each, for the platform log (Vercel runtime logs, journalctl on a VM).
// With ALERT_WEBHOOK_URL (a Slack or Discord incoming webhook) the same error is also posted there, at most once
// per 10 minutes per kind and server instance, so a broken page cannot flood the channel.
// ponytail: a webhook, not an error-tracking SDK; src/instrumentation.ts is the one place to plug Sentry in later.

const lastAlert = new Map<string, number>();
const ALERT_EVERY_MS = 10 * 60_000;

/** Stable kind of error: where, which route, and the SQLSTATE or error class. Messages can carry input values. */
function alertKey(where: string, err: unknown, route: unknown) {
  const code = typeof err === "object" && err !== null && "code" in err ? String(err.code) : err instanceof Error ? err.name : typeof err;
  return `${where}:${route ?? ""}:${code}`;
}

export async function reportError(where: string, err: unknown, extra: Record<string, unknown> = {}) {
  const e = err instanceof Error ? err : new Error(String(err));
  // React replaces Server Component errors with a digest; the same digest is in the browser's error screen.
  const digest = typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;
  console.error(
    JSON.stringify({
      level: "error",
      where,
      message: e.message,
      digest,
      stack: e.stack?.split("\n").slice(1, 6).map((l) => l.trim()),
      build: process.env.APP_BUILD,
      ...extra,
    })
  );
  const hook = process.env.ALERT_WEBHOOK_URL;
  const key = alertKey(where, err, extra.route);
  const now = Date.now();
  if (!hook || now - (lastAlert.get(key) ?? 0) < ALERT_EVERY_MS) return;
  // Forget expired entries so a long-running server does not keep every kind it ever saw.
  for (const [k, at] of lastAlert) if (now - at >= ALERT_EVERY_MS) lastAlert.delete(k);
  lastAlert.set(key, now);
  const text = `[Boundless] ${where}${extra.path ? ` ${extra.path}` : ""}: ${e.message}${digest ? ` (digest ${digest})` : ""}`.slice(0, 900);
  // Slack reads `text`, Discord reads `content`.
  await fetch(hook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, content: text }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}
