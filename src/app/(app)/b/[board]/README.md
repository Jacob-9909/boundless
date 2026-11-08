# b/[board]

## Overview

`/b/[board]`: the post list for one global board, with tag filters, sorting, and
"load more" paging, plus a write button that opens `/write` for this board.

## Interface

- `page.tsx`: `BoardPage` (default export). There is no `metadata` export.
  - Reads route param `board` and search params `tag`, `sort`, `before`.
  - Renders `ListControls` and `FeedList` inside `WithRail`; the next-page link
    is built with `listHref`.

## Invariants

- `notFound()` when `isBoard(board)` is false (`page.tsx:BoardPage`).
- `tag` is kept only if it is one of the board's `tags`; otherwise it becomes empty.
- `sort` goes through `parseSort`; `before` (cursor paging) applies only when sort is `new`.
- `sort=waiting` lists posts with `waiting: true`; `likes` sorts by likes; anything else sorts by newest.

## Side Effects

- Reads `listPosts(viewerId, { board, tag, before, sort, waiting })` (`src/lib/posts.ts`).
- Read only; no writes.

## Verification

- Run: `npm run lint`
- Run: `npx tsc --noEmit`
- Run: `npm run e2e` (needs a running server; see the header of `e2e/flow.mjs`)
