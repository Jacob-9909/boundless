# api

## Overview

URL segment `/api` for Next.js route handlers. It holds only the health check;
user actions go through server actions in `../actions.ts`, not API routes.

## Subdirectories & Boundaries

- `health`: [README](./health/README.md) - `GET /api/health`, runs `SELECT 1` and returns `{ ok: true }`.
