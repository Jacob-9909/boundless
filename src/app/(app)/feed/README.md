# feed

## Overview

`/feed`: the home feed. It has a hero with community stats, board shortcuts, the
three newest posts from the member's country lounge, and the global post list
with sorting and cursor paging. Visitors see sign-in and sample-account calls to action.

## Interface

- `page.tsx`: `Home` (default export), `metadata` (title `Home`).
  - Reads search params `sort` (through `parseSort`) and `before`.
  - Renders `ListControls` and `FeedList` inside `WithRail`; the next-page link is built with `listHref("/feed", ...)`.
  - Links: `/write`, `/write?space=lounge`, `/login`, `/#demo`, `/b/<id>`, `/boards`, `/lounge`, `/posts/<id>`.

## Invariants

- `before` applies only when sort is `new`.
- The lounge preview is loaded only for signed-in users (`space: user.nationality`, `limit: 3`).
- The theme culture is the member's nationality, or `DEFAULT_CULTURE` for visitors.

## Side Effects

- Reads `listPosts` (global list and lounge preview), `communityStats()`, and
  `boardCounts()` (`src/lib/posts.ts`). Read only.

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run e2e` (needs a running server; see the header of `e2e/flow.mjs`)
