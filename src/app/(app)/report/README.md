# report

## Overview

`/report`: report a post or a comment, with an option to block its author.

## Interface

- `page.tsx`: `ReportPage` (default export), `metadata` (title `Report`).
  - Reads search params `post` and `comment`.
  - `ReportForm` (`src/components/forms.tsx`) submits to `reportContent`.
  - A second form posts hidden `post` and/or `comment` fields to `blockAuthor`.

## Invariants

- Signed-out visitors get `SignInRequired`, with `next` set to `/report` plus the original query (`page.tsx:ReportPage`).
- When both `comment` and `post` are sent, the actions target the comment (`../../actions.ts:targetOwner`).
- `reportContent` requires a reason in `REPORT_REASONS` and trims `details` to 1000 characters.
- `blockAuthor` never blocks the viewer themselves; it always redirects to `/feed`.

## Side Effects

- None on render.
- `reportContent` inserts into `boundless.reports` and records a `report` event.
- `blockAuthor` inserts into `boundless.blocks` (`ON CONFLICT DO NOTHING`).

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run e2e` (needs a running server; see the header of `e2e/flow.mjs`)
