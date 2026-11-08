# admin

## Overview

`/admin`: the moderation queue. It shows open reports, open appeals, and a 7-day
count of usage events. Real admins act on items; the demo moderator sees the same
queue with its buttons disabled.

## Interface

- `page.tsx`: `AdminPage` (default export), `metadata` (title `Moderation`), local type `Open`.
  - Report rows post to `moderate` with hidden fields `report` and `action` (`hide` or `dismiss`).
  - Appeal rows post to `resolveAppeal` with hidden fields `appeal` and `action` (`restore` or `uphold`).
  - Each row links to `/posts/<post_id>`.

## Invariants

- Redirects to `/feed` unless `canViewQueue(user)` (`page.tsx:AdminPage`).
- `readOnly = !isAdmin(user)` disables every action button and shows a read-only notice.
- The actions check `isAdmin` again on the server, so a read-only viewer cannot act
  by posting the form directly (`../../actions.ts:moderate`, `../../actions.ts:resolveAppeal`).
- Each list returns at most 50 rows with `status = 'received'`, oldest first.

## Side Effects

- Reads `boundless.reports`, `comments`, `posts`, and `users` (the open reports
  with an excerpt, the author's nationality, and `same`, the count of open reports
  on that target), `boundless.appeals` (open appeals), and `boundless.events`
  (counts per `name` over the last 7 days).
- Reads a 7-day solve rate from `boundless.posts`: questions (`kind = ANY(ASKING_TAGS)`,
  not hidden) asked, solved, and with an accepted answer (`data-solve-rate`).
- Writes happen only through `moderate` (hides the target and resolves every open
  report on it) and `resolveAppeal` (sets the appeal status and un-hides on `restore`).

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run e2e` (needs a running server with `admin@example.com` in `ADMIN_EMAILS`; see `e2e/flow.mjs`)
