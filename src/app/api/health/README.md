# api/health

## Overview

`GET /api/health`: a liveness check that also proves the database connection works.

## Interface

- `route.ts`: `GET()` runs `SELECT 1` through `q` and returns JSON `{ "ok": true }`.

## Invariants

- The response is `{ ok: true }` only after the query succeeds; a database error
  makes the handler throw, so Next.js answers with an error status instead.

## Side Effects

- One `SELECT 1` on the shared `pg` pool (`src/lib/db.ts`).

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `curl -s http://localhost:3000/api/health` (expects `{"ok":true}` with `npm run dev` running)
