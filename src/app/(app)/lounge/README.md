# lounge

## Overview

`/lounge`: the signed-in member's country lounge, where only members of the same
nationality read and write. It shows the lounge post count, member count, a write
button, and the lounge post list with tag filters, sorting, and cursor paging.

## Interface

- `page.tsx`: `LoungePage` (default export), `metadata` (title `Lounge`).
  - Reads search params `tag`, `sort`, `before`.
  - Renders `ListControls` (tags from `LOUNGE.tags`) and `FeedList` inside `WithRail`.
  - Links to `/write?space=lounge`.

## Invariants

- Signed-out visitors get `SignInRequired` with `next=/lounge`; nothing else loads (`page.tsx:LoungePage`).
- The lounge shown is always `user.nationality`; no parameter selects another country.
- `tag` is kept only if it is in `LOUNGE.tags`; `before` applies only when sort is `new`.

## Side Effects

- Reads `listPosts(user.id, { space: user.nationality, ... })`, `loungeCount(nationality)`,
  and `memberCount(nationality)` (`src/lib/posts.ts`). Read only.

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run e2e` (needs a running server; see the header of `e2e/flow.mjs`)
