# boards

## Overview

`/boards`: the board directory. It lists every global board by group with
today's post counts and links to the member's lounge and to `/guide`.

## Interface

- `page.tsx`: `BoardsPage` (default export), `metadata` (title `Boards`).
  - Links: `/lounge`, `/b/<board id>` for each entry in `BOARDS` (grouped by `GROUPS`), `/guide`.

## Invariants

- None

## Side Effects

- Reads `boardCounts()` (`src/lib/posts.ts`). Read only.

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run i18n`
