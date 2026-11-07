#!/usr/bin/env bash
# Runs on the app server (any Linux VM with Node 24, see docs/DEPLOY.md). Builds origin/main,
# swaps ~/boundless/app, and rolls back to the previous build if /api/health fails.
# GitHub Actions calls it over SSH (authorized_keys command= limits that key to this script).
#
# Server layout:
#   ~/boundless/src   git clone of this repo
#   ~/boundless/app   running standalone build (systemd boundless.service)
#   ~/boundless/.env  secrets (not in the repo)
set -euo pipefail

ROOT="${BOUNDLESS_ROOT:-$HOME/boundless}"
PORT="${PORT:-8040}"
cd "$ROOT/src"

git fetch --quiet origin main
git reset --hard --quiet origin/main
echo "building $(git rev-parse --short HEAD)"

npm ci --no-audit --no-fund
set -a; . "$ROOT/.env"; set +a
node scripts/db.mjs db/schema.sql
npm run build

rm -rf "$ROOT/app.new"
cp -r .next/standalone "$ROOT/app.new"
cp -r public "$ROOT/app.new/"
cp -r .next/static "$ROOT/app.new/.next/"

rm -rf "$ROOT/app.prev"
[ -d "$ROOT/app" ] && mv "$ROOT/app" "$ROOT/app.prev"
mv "$ROOT/app.new" "$ROOT/app"
sudo systemctl restart boundless

for _ in $(seq 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/api/health"; then
    echo "deployed $(git rev-parse --short HEAD)"
    exit 0
  fi
  sleep 1
done

echo "health check failed, rolling back" >&2
if [ -d "$ROOT/app.prev" ]; then
  rm -rf "$ROOT/app.failed"
  mv "$ROOT/app" "$ROOT/app.failed"
  mv "$ROOT/app.prev" "$ROOT/app"
  sudo systemctl restart boundless
fi
exit 1
